import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { AdditiveBlending, Color } from "three";

const STAR_COUNT = 4600;

const PALETTES = [
  {
    center: "#fff0c2",
    outer: "#8ba8df",
    accent: "#d58cad",
  },
  {
    center: "#fff4df",
    outer: "#ada0e8",
    accent: "#db92cb",
  },
  {
    center: "#ffe0b0",
    outer: "#d6ad86",
    accent: "#e6c4a2",
  },
  {
    center: "#e7f2ff",
    outer: "#76afcf",
    accent: "#bfa0e5",
  },
];

const vertexShader = `
  attribute vec3 starColor;
  attribute float starSize;

  varying vec3 vColor;

  void main() {
    vColor = starColor;

    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    float worldScale = length(modelMatrix[0].xyz);

    gl_PointSize = clamp(
      starSize * worldScale * (450.0 / max(-viewPosition.z, 0.1)),
      1.0,
      48.0
    );

    gl_Position = projectionMatrix * viewPosition;
  }
`;

const fragmentShader = `
  uniform float uSelected;

  varying vec3 vColor;

  void main() {
    float distanceFromCenter = length(gl_PointCoord - vec2(0.5));

    if (distanceFromCenter > 0.5) discard;

    float core = exp(
      -distanceFromCenter * distanceFromCenter * 90.0
    );

    float halo = exp(
      -distanceFromCenter * distanceFromCenter * 16.0
    );

    float edgeFade =
      1.0 - smoothstep(0.35, 0.5, distanceFromCenter);

    float alpha = (core * 0.75 + halo * 0.2) * edgeFade;

    vec3 color = mix(
      vColor,
      vec3(0.45, 0.85, 1.0),
      uSelected * 0.3
    );

    gl_FragColor = vec4(color, alpha);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function createRandom(seed) {
  let value = seed >>> 0;

  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function getArtistSeed(id) {
  const text = String(id ?? "galaxy");
  let seed = 2166136261;

  for (let index = 0; index < text.length; index++) {
    seed = Math.imul(seed ^ text.charCodeAt(index), 16777619);
  }

  return seed >>> 0;
}

function buildGalaxy(seed) {
  const random = createRandom(seed);

  const families = ["spiral", "barred", "elliptical", "ring"];
  const family = families[Math.floor(random() * families.length)];

  const palette = PALETTES[Math.floor(random() * PALETTES.length)];

  const centerColor = new Color(palette.center);
  const outerColor = new Color(palette.outer);
  const accentColor = new Color(palette.accent);

  const color = new Color();

  const positions = new Float32Array(STAR_COUNT * 3);
  const colors = new Float32Array(STAR_COUNT * 3);
  const sizes = new Float32Array(STAR_COUNT);

  const armCount = family === "barred" ? 2 : 2 + Math.floor(random() * 4);

  const winding = 3.5 + random() * 4;
  const armSpread = 0.12 + random() * 0.25;
  const diskThickness = 0.025 + random() * 0.045;

  const ellipticalHeight = 0.5 + random() * 0.35;
  const ellipticalDepth = 0.3 + random() * 0.3;

  const tilt = [
    0.15 + random() * 1.2,
    (random() - 0.5) * 0.7,
    random() * Math.PI * 2,
  ];

  const initialSpin = random() * Math.PI * 2;
  const spinDirection = random() < 0.5 ? -1 : 1;

  const rotationSpeed =
    family === "elliptical" ? 0 : spinDirection * (0.08 + random() * 0.06);

  // Reusable accent patches along the disk structures.
  const patches = Array.from({ length: 8 }, () => {
    const radius = 0.45 + random() * 0.45;
    const arm = Math.floor(random() * armCount);

    const angle =
      family === "ring"
        ? random() * Math.PI * 2
        : (arm / armCount) * Math.PI * 2 +
          (family === "barred" ? radius - 0.22 : radius) * winding;

    const patchRadius = family === "ring" ? 0.82 + random() * 0.08 : radius;

    return [Math.cos(angle) * patchRadius, Math.sin(angle) * patchRadius];
  });

  for (let index = 0; index < STAR_COUNT; index++) {
    let x = 0;
    let y = 0;
    let z = 0;
    let isAccent = false;

    const population = random();

    if (family === "elliptical") {
      // A centrally concentrated, three-dimensional star cloud.
      const radius = Math.pow(random(), 1.6) * 0.98;
      const angle = random() * Math.PI * 2;
      const vertical = random() * 2 - 1;
      const horizontal = Math.sqrt(1 - vertical * vertical);

      x = Math.cos(angle) * horizontal * radius;
      y = Math.sin(angle) * horizontal * radius * ellipticalHeight;
      z = vertical * radius * ellipticalDepth;
    } else if (population < 0.22) {
      // Shared central cloud, smaller for ring galaxies.
      const coreExtent = family === "ring" ? 0.18 : 0.28;

      const radius = Math.pow(random(), 1.8) * coreExtent;

      const angle = random() * Math.PI * 2;

      x = Math.cos(angle) * radius;
      y = Math.sin(angle) * radius;
      z = (random() - 0.5) * 0.08;
    } else if (population < 0.27) {
      // Diffuse background stars between the main structures.
      const radius = Math.sqrt(random()) * 0.98;
      const angle = random() * Math.PI * 2;

      x = Math.cos(angle) * radius;
      y = Math.sin(angle) * radius;
      z = (random() - 0.5) * diskThickness;
    } else if (population < 0.32) {
      const patch = patches[Math.floor(random() * patches.length)];

      x = patch[0] + (random() - 0.5) * 0.065;
      y = patch[1] + (random() - 0.5) * 0.065;
      z = (random() - 0.5) * diskThickness;

      isAccent = true;
    } else if (family === "ring") {
      // A dense outer ring with a relatively open inner region.
      const radius = 0.84 + (random() + random() - 1) * 0.12;

      const angle = random() * Math.PI * 2;

      x = Math.cos(angle) * radius;
      y = Math.sin(angle) * radius;
      z = (random() - 0.5) * diskThickness;
    } else if (family === "barred" && population < 0.52) {
      // An elongated bright bar across the center.
      x = (random() - 0.5) * 0.7;
      y = (random() - 0.5) * 0.085;
      z = (random() - 0.5) * diskThickness;
    } else {
      const arm = index % armCount;

      const radius =
        family === "barred"
          ? 0.22 + random() * 0.74
          : 0.08 + Math.pow(random(), 0.85) * 0.88;

      const windingRadius = family === "barred" ? radius - 0.22 : radius;

      const angle =
        (arm / armCount) * Math.PI * 2 +
        windingRadius * winding +
        (random() - 0.5) * armSpread;

      const scatter = 0.015 + radius * 0.065;

      x = Math.cos(angle) * radius + (random() - 0.5) * scatter;

      y = Math.sin(angle) * radius + (random() - 0.5) * scatter;

      z = (random() - 0.5) * diskThickness * (1 - radius * 0.5);
    }

    // Keep every family inside approximately the same local radius.
    const extent = Math.sqrt(x * x + y * y + z * z);

    if (extent > 0.98) {
      const correction = 0.98 / extent;

      x *= correction;
      y *= correction;
      z *= correction;
    }

    positions[index * 3] = x;
    positions[index * 3 + 1] = y;
    positions[index * 3 + 2] = z;

    const distance = Math.sqrt(x * x + y * y + z * z);

    if (isAccent) {
      color.copy(accentColor);
    } else {
      const blend = Math.min(1, Math.max(0, (distance - 0.12) / 0.75));

      // Elliptical clouds retain a warmer, more uniform appearance.
      color
        .copy(centerColor)
        .lerp(outerColor, family === "elliptical" ? blend * 0.35 : blend);
    }

    color.multiplyScalar(0.6 + random() * 0.4);

    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;

    sizes[index] = isAccent
      ? 0.035 + random() * 0.045
      : 0.018 + Math.pow(random(), 3) * 0.065;
  }

  return {
    positions,
    colors,
    sizes,
    tilt,
    initialSpin,
    rotationSpeed,
  };
}

export default function ArtistGalaxy({
  artist,
  position,
  radius,
  isSelected,
  onSelect,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const starsRef = useRef(null);

  const galaxy = useMemo(
    () => buildGalaxy(getArtistSeed(artist.id)),
    [artist.id],
  );

  const uniforms = useMemo(
    () => ({
      uSelected: { value: 0 },
    }),
    [],
  );

  useFrame((state, delta) => {
    uniforms.uSelected.value = isSelected ? 1 : 0;

    if (!starsRef.current) return;

    starsRef.current.rotation.z += galaxy.rotationSpeed * Math.min(delta, 0.05);
  });

  return (
    <group position={position} scale={radius}>
      {/* Fixed artist-specific orientation */}

      <group rotation={galaxy.tilt}>
        {/* Only the star geometry spins */}
        <points
          ref={starsRef}
          rotation={[0, 0, galaxy.initialSpin]}
          raycast={() => null}
        >
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[galaxy.positions, 3]}
            />

            <bufferAttribute
              attach="attributes-starColor"
              args={[galaxy.colors, 3]}
            />

            <bufferAttribute
              attach="attributes-starSize"
              args={[galaxy.sizes, 1]}
            />
          </bufferGeometry>

          <shaderMaterial
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={uniforms}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </points>
      </group>

      {/* Show names only when inspecting or approaching a galaxy. */}
      {(isHovered || isSelected) && (
        <Html
          position={[0, 1.3, 0]}
          center
          zIndexRange={[1, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div
            className={
              isSelected
                ? "galaxy-label galaxy-label--selected"
                : "galaxy-label"
            }
          >
            {artist.name}
          </div>
        </Html>
      )}

      {/* Consistent click target for every galaxy shape */}
      <mesh
        onPointerOver={(event) => {
          event.stopPropagation();
          setIsHovered(true);
        }}
        onPointerOut={() => {
          setIsHovered(false);
        }}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(artist);
        }}
      >
        <sphereGeometry args={[1.05, 16, 16]} />

        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
          colorWrite={false}
        />
      </mesh>
    </group>
  );
}
