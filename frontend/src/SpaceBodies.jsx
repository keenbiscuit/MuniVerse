import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  SphereGeometry,
} from "three";

// Includes rings and the outer selection shell.
export const PLANET_VISUAL_EXTENT = 1.32;

function hashId(id) {
  const text = String(id ?? "space-object");
  let hash = 2166136261;

  for (let index = 0; index < text.length; index++) {
    hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  }

  return hash >>> 0;
}

function createRandom(seed) {
  let value = seed >>> 0;

  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function mix(a, b, amount) {
  return a + (b - a) * amount;
}

function smooth(a, b, value) {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));

  return t * t * (3 - 2 * t);
}

function lattice(x, y, z, seed) {
  const value =
    Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 13.5) * 43758.5453;

  return value - Math.floor(value);
}

function noise3(x, y, z, seed) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);

  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;

  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const w = fz * fz * (3 - 2 * fz);

  function sample(dx, dy, dz) {
    return lattice(ix + dx, iy + dy, iz + dz, seed);
  }

  const lower = mix(
    mix(sample(0, 0, 0), sample(1, 0, 0), u),
    mix(sample(0, 1, 0), sample(1, 1, 0), u),
    v,
  );

  const upper = mix(
    mix(sample(0, 0, 1), sample(1, 0, 1), u),
    mix(sample(0, 1, 1), sample(1, 1, 1), u),
    v,
  );

  return mix(lower, upper, w);
}

function fbm(x, y, z, seed) {
  let result = 0;
  let amplitude = 0.55;
  let frequency = 1;

  for (let octave = 0; octave < 4; octave++) {
    result +=
      noise3(x * frequency, y * frequency, z * frequency, seed + octave * 7) *
      amplitude;

    amplitude *= 0.5;
    frequency *= 2;
  }

  return result / 1.03125;
}

const PLANET_PALETTES = {
  rocky: [
    ["#322e2b", "#99765d", "#ccb394"],
    ["#3b2824", "#a45235", "#c59367"],
    ["#242a30", "#66727b", "#a1abb0"],
  ],
  ocean: [
    ["#071c38", "#12627c", "#57865d"],
    ["#111c36", "#294e7a", "#929a62"],
  ],
  gas: [
    ["#795343", "#d4b48a", "#f0dfbd"],
    ["#3d536f", "#8bafc5", "#d8e8e7"],
    ["#675276", "#b8a0be", "#e0ccd0"],
  ],
  icy: [
    ["#587689", "#a9cedb", "#edf5f4"],
    ["#707787", "#c1cadc", "#f1eff5"],
  ],
};

function getPlanetStyle(id) {
  const random = createRandom(hashId(id));

  const families = ["rocky", "ocean", "gas", "icy"];
  const family = families[Math.floor(random() * families.length)];

  const choices = PLANET_PALETTES[family];
  const palette = choices[Math.floor(random() * choices.length)];

  return {
    family,
    palette,
    seed: random() * 1000,
    hasRings: (family === "gas" || family === "icy") && random() < 0.4,
    hasAtmosphere: family === "ocean" || (family === "gas" && random() < 0.5),
    tilt: (random() - 0.5) * 0.7,
    spin: (random() < 0.5 ? -1 : 1) * (0.025 + random() * 0.035),
  };
}

function buildPlanetGeometry(style) {
  const geometry = new SphereGeometry(1, 64, 40);
  const positions = geometry.attributes.position;

  const colors = new Float32Array(positions.count * 3);

  const dark = new Color(style.palette[0]);
  const middle = new Color(style.palette[1]);
  const light = new Color(style.palette[2]);
  const cloud = new Color("#e8eef0");
  const color = new Color();

  for (let index = 0; index < positions.count; index++) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);

    const broad = fbm(x * 2.8, y * 2.8, z * 2.8, style.seed);

    const detail = fbm(x * 11, y * 11, z * 11, style.seed + 50);

    if (style.family === "rocky") {
      color.copy(dark).lerp(middle, smooth(0.25, 0.65, broad));

      color.lerp(light, smooth(0.55, 0.8, detail) * 0.6);
    } else if (style.family === "ocean") {
      const land = smooth(0.49, 0.55, broad);

      color.copy(dark).lerp(middle, detail * 0.6);
      color.lerp(light, land);

      const clouds = fbm(x * 5 + 14, y * 5 - 6, z * 5, style.seed + 100);

      color.lerp(cloud, smooth(0.65, 0.78, clouds) * 0.8);

      // Pale polar regions.
      color.lerp(cloud, smooth(0.87, 0.98, Math.abs(y)) * 0.7);
    } else if (style.family === "gas") {
      const bands =
        0.5 +
        0.5 * Math.sin(y * 35 + broad * 7 + Math.sin(x * 5 + z * 4) * 0.7);

      color.copy(dark).lerp(middle, bands);
      color.lerp(light, smooth(0.6, 0.9, bands) * 0.65);

      // A soft, localized storm-like patch.
      const stormDistance =
        ((x - 0.7) / 0.23) ** 2 +
        ((y + 0.2) / 0.12) ** 2 +
        ((z - 0.65) / 0.3) ** 2;

      color.lerp(dark, Math.exp(-stormDistance * 2) * 0.6);
    } else {
      const marble = Math.abs(Math.sin(x * 13 + y * 8 + z * 10 + broad * 14));

      color.copy(middle).lerp(light, detail);

      color.lerp(dark, (1 - smooth(0.03, 0.16, marble)) * 0.6);
    }

    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }

  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));

  return geometry;
}

const rimVertex = `
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);

    vNormal = normalize(normalMatrix * normal);
    vViewDirection = normalize(-viewPosition.xyz);

    gl_Position = projectionMatrix * viewPosition;
  }
`;

const rimFragment = `
  uniform vec3 uColor;
  uniform float uOpacity;

  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    float facing = abs(
      dot(normalize(vNormal), normalize(vViewDirection))
    );

    float rim = pow(1.0 - facing, 3.0);

    gl_FragColor = vec4(uColor, rim * uOpacity);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function RimShell({ scale, color, opacity }) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color(color) },
      uOpacity: { value: opacity },
    }),
    [color, opacity],
  );

  return (
    <mesh scale={scale} raycast={() => null}>
      <sphereGeometry args={[1, 40, 28]} />

      <shaderMaterial
        vertexShader={rimVertex}
        fragmentShader={rimFragment}
        uniforms={uniforms}
        side={BackSide}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
}

export function PlanetBody({ trackId, radius, isSelected }) {
  const surfaceRef = useRef(null);

  const style = useMemo(() => getPlanetStyle(trackId), [trackId]);

  const geometry = useMemo(() => buildPlanetGeometry(style), [style]);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  useFrame((state, delta) => {
    if (!surfaceRef.current) return;

    surfaceRef.current.rotation.y += style.spin * Math.min(delta, 0.05);
  });

  return (
    <group scale={radius}>
      <group rotation={[style.tilt, 0, 0]}>
        <mesh ref={surfaceRef} geometry={geometry}>
          <meshStandardMaterial
            vertexColors
            roughness={style.family === "ocean" ? 0.55 : 0.9}
            metalness={0}
          />
        </mesh>

        {style.hasRings && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.12, 1.28, 80]} />

            <meshStandardMaterial
              color={style.palette[1]}
              side={DoubleSide}
              transparent
              opacity={0.55}
              roughness={1}
              metalness={0}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>

      {style.hasAtmosphere && (
        <RimShell
          scale={1.07}
          color={style.family === "ocean" ? "#75baff" : "#bcb4ec"}
          opacity={0.35}
        />
      )}

      {isSelected && <RimShell scale={1.32} color="#c8b6ff" opacity={0.75} />}
    </group>
  );
}

export function getSunStyle(releaseId, baseRadius = 2) {
  const random = createRandom(hashId(releaseId));

  const radius = baseRadius * (0.9 + random() * 0.2);
  const choice = random();

  const color =
    choice < 0.1
      ? "#c1ddff"
      : choice < 0.4
        ? "#fff0d2"
        : choice < 0.75
          ? "#ffd17f"
          : "#ffa45b";

  return {
    radius,
    color,
    seed: random() * 100,
  };
}

function createGlowTexture() {
  const canvas = document.createElement("canvas");

  canvas.width = 128;
  canvas.height = 128;

  const context = canvas.getContext("2d");

  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);

  gradient.addColorStop(0, "rgba(255,255,255,0.7)");
  gradient.addColorStop(0.3, "rgba(255,255,255,0.3)");
  gradient.addColorStop(0.65, "rgba(255,255,255,0.06)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);

  return new CanvasTexture(canvas);
}

const sunVertex = `
  varying vec3 vPosition;

  void main() {
    vPosition = position;

    gl_Position =
      projectionMatrix *
      modelViewMatrix *
      vec4(position, 1.0);
  }
`;

const sunFragment = `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uSeed;

  varying vec3 vPosition;

  float pattern(vec3 p) {
    return
      sin(p.x * 17.0 + sin(p.y * 11.0) + uTime * 0.16) *
      sin(p.y * 19.0 + sin(p.z * 13.0) - uTime * 0.12) *
      sin(p.z * 16.0 + sin(p.x * 9.0));
  }

  void main() {
    vec3 p = normalize(vPosition);

    float broad = pattern(p + uSeed);
    float fine = pattern(p * 2.7 + uSeed);

    float brightness =
      0.78 + broad * 0.13 + fine * 0.09;

    vec3 color = uColor * brightness;

    color = mix(
      color,
      vec3(1.0),
      smoothstep(0.35, 0.9, broad) * 0.25
    );

    gl_FragColor = vec4(color, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function ReleaseSun({ releaseId, baseRadius = 2, illuminate = false }) {
  const style = useMemo(
    () => getSunStyle(releaseId, baseRadius),
    [releaseId, baseRadius],
  );

  const glowTexture = useMemo(createGlowTexture, []);

  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color(style.color) },
      uTime: { value: 0 },
      uSeed: { value: style.seed },
    }),
    [style],
  );

  useEffect(() => {
    return () => glowTexture.dispose();
  }, [glowTexture]);

  useFrame((state, delta) => {
    uniforms.uTime.value += Math.min(delta, 0.05);
  });

  return (
    <group>
      <mesh scale={style.radius}>
        <sphereGeometry args={[1, 48, 32]} />

        <shaderMaterial
          vertexShader={sunVertex}
          fragmentShader={sunFragment}
          uniforms={uniforms}
        />
      </mesh>

      <sprite
        scale={[style.radius * 4.5, style.radius * 4.5, 1]}
        raycast={() => null}
      >
        <spriteMaterial
          map={glowTexture}
          color={style.color}
          transparent
          opacity={0.55}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </sprite>

      {illuminate && (
        <pointLight color={style.color} intensity={70} distance={0} decay={2} />
      )}
    </group>
  );
}
