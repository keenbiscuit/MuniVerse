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

  const families = [
    { name: "spiral", weight: 20 },
    { name: "barred", weight: 18 },
    { name: "elliptical", weight: 12 },
    { name: "ring", weight: 3 },
    { name: "edgeOn", weight: 12 },
    { name: "flocculent", weight: 15 },
    { name: "irregular", weight: 12 },
    { name: "starburst", weight: 8 },
  ];

  const totalWeight = families.reduce(
    (total, family) => total + family.weight,
    0,
  );

  const familyRoll = random() * totalWeight;

  let cumulativeWeight = 0;
  let family = families[families.length - 1].name;

  for (const candidate of families) {
    cumulativeWeight += candidate.weight;

    if (familyRoll < cumulativeWeight) {
      family = candidate.name;
      break;
    }
  }
  const palette = PALETTES[Math.floor(random() * PALETTES.length)];

  // Separate seeded stream for each artist's structural proportions.
  const shapeRandom = createRandom((seed ^ 0x9e3779b9) >>> 0);

  const shape = {
    stretchX: 0.72 + shapeRandom() * 0.28,
    stretchY: 0.5 + shapeRandom() * 0.5,
    stretchZ: 0.65 + shapeRandom() * 0.35,

    coreFraction: 0.1 + shapeRandom() * 0.28,
    coreRadius: 0.12 + shapeRandom() * 0.25,

    ringRadius: 0.65 + shapeRandom() * 0.23,
    ringWidth: 0.025 + shapeRandom() * 0.1,

    barLength: 0.55 + shapeRandom() * 0.55,
    barWidth: 0.035 + shapeRandom() * 0.12,

    clumpCount: 3 + Math.floor(shapeRandom() * 7),

    lopsidedness: shapeRandom() * 0.22,
    asymmetryAngle: shapeRandom() * Math.PI * 2,

    rippleStrength: 0.025 + shapeRandom() * 0.1,
    rippleFrequency: 2 + Math.floor(shapeRandom() * 4),
    ripplePhase: shapeRandom() * Math.PI * 2,

    outerTwist: (shapeRandom() - 0.5) * 1.8,
    warp: (shapeRandom() - 0.5) * 0.22,
  };

  const centerColor = new Color(palette.center);
  const outerColor = new Color(palette.outer);
  const accentColor = new Color(palette.accent);
  const color = new Color();

  const positions = new Float32Array(STAR_COUNT * 3);
  const colors = new Float32Array(STAR_COUNT * 3);
  const sizes = new Float32Array(STAR_COUNT);

  const armCount = family === "barred" ? 2 : 2 + Math.floor(random() * 4);

  const winding = 3 + random() * 6;
  const armSpread = 0.08 + random() * 0.22;
  const diskThickness = 0.025 + random() * 0.04;

  const ellipticalHeight = 0.5 + random() * 0.35;
  const ellipticalDepth = 0.3 + random() * 0.3;

  const diskStretch = 0.72 + random() * 0.28;

  const tilt =
    family === "edgeOn"
      ? [
          Math.PI / 2 + (random() - 0.5) * 0.12,
          (random() - 0.5) * 0.25,
          (random() - 0.5) * 0.65,
        ]
      : [0.15 + random() * 1.2, (random() - 0.5) * 0.7, random() * Math.PI * 2];

  const initialSpin = random() * Math.PI * 2;
  const spinDirection = random() < 0.5 ? -1 : 1;

  const rotationSpeed =
    family === "elliptical" || family === "irregular"
      ? 0
      : spinDirection * (0.04 + random() * 0.06);

  // Reusable star-forming patches follow the disk's arm structure.
  const patches = Array.from({ length: 12 }, () => {
    const radius = 0.35 + random() * 0.55;
    const arm = Math.floor(random() * armCount);

    const angle =
      (arm / armCount) * Math.PI * 2 +
      (family === "barred" ? radius - 0.25 : radius) * winding;

    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  });

  // Separate, uneven concentrations give irregular galaxies a distinct outline.
  const clumps = Array.from({ length: shape.clumpCount }, () => {
    const angle = random() * Math.PI * 2;
    const radius = 0.15 + random() * 0.5;

    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * 0.75,
      z: (random() - 0.5) * 0.2,
      spread: 0.12 + random() * 0.2,
    };
  });

  for (let index = 0; index < STAR_COUNT; index++) {
    let x = 0;
    let y = 0;
    let z = 0;
    let isAccent = false;
    let brightness = 1;

    const population = random();

    if (family === "elliptical") {
      const radius = Math.pow(random(), 1.6) * 0.98;
      const angle = random() * Math.PI * 2;
      const vertical = random() * 2 - 1;
      const horizontal = Math.sqrt(1 - vertical * vertical);

      x = Math.cos(angle) * horizontal * radius;
      y = Math.sin(angle) * horizontal * radius * ellipticalHeight;
      z = vertical * radius * ellipticalDepth;
    } else if (family === "irregular") {
      const clump = clumps[Math.floor(random() * clumps.length)];
      const angle = random() * Math.PI * 2;
      const scatter = Math.sqrt(random()) * clump.spread;

      x = clump.x + Math.cos(angle) * scatter;
      y = clump.y + Math.sin(angle) * scatter;
      z = clump.z + (random() - 0.5) * clump.spread;

      isAccent = population < 0.35;
    } else if (family === "starburst") {
      if (population < 0.65) {
        const radius = Math.pow(random(), 1.7) * 0.35;
        const angle = random() * Math.PI * 2;

        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius * 0.6;
        z = (random() - 0.5) * 0.12;
      } else {
        // Two opposing, widening particle plumes.
        const side = random() < 0.5 ? -1 : 1;
        const height = Math.pow(random(), 0.8) * 0.9;
        const width = 0.035 + height * 0.22;

        x = (random() + random() - 1) * width;
        y = side * height;
        z = (random() - 0.5) * width;

        isAccent = true;
        brightness = 0.65;
      }
    } else if (family === "ring") {
      if (population < 0.2) {
        const radius = Math.pow(random(), 1.8) * 0.16;
        const angle = random() * Math.PI * 2;

        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
        z = (random() - 0.5) * 0.07;
      } else {
        const radius =
          shape.ringRadius + (random() + random() - 1) * shape.ringWidth;
        const angle = random() * Math.PI * 2;

        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
        z = (random() - 0.5) * diskThickness;

        isAccent = population > 0.88;
      }
    } else if (population < shape.coreFraction) {
      const radius = Math.pow(random(), 1.8) * shape.coreRadius;
      const angle = random() * Math.PI * 2;

      x = Math.cos(angle) * radius;
      y = Math.sin(angle) * radius;
      z = (random() - 0.5) * 0.12;
    } else if (family === "edgeOn") {
      const radius = Math.sqrt(random()) * 0.96;
      const angle = random() * Math.PI * 2;

      x = Math.cos(angle) * radius;
      y = Math.sin(angle) * radius;
      z = (random() - 0.5) * 0.035;

      // An artistic dim central lane, not a dust simulation.
      brightness = Math.abs(z) < 0.006 ? 0.2 : 1;
    } else if (family === "flocculent" && population < 0.7) {
      const patch = patches[Math.floor(random() * patches.length)];

      x = patch[0] + (random() + random() - 1) * 0.12;
      y = patch[1] + (random() + random() - 1) * 0.12;
      z = (random() - 0.5) * diskThickness;

      isAccent = population > 0.4;
    } else if (family === "barred" && population < 0.5) {
      x = (random() - 0.5) * shape.barLength;
      y = (random() - 0.5) * shape.barWidth;
      z = (random() - 0.5) * diskThickness;
    } else {
      const arm = index % armCount;

      const radius =
        family === "barred"
          ? 0.3 + random() * 0.62
          : 0.08 + Math.pow(random(), 0.85) * 0.86;

      const windingRadius = family === "barred" ? radius - 0.3 : radius;

      const angle =
        (arm / armCount) * Math.PI * 2 +
        windingRadius * winding +
        (random() - 0.5) * armSpread;

      const scatter = 0.02 + radius * 0.06;

      x = Math.cos(angle) * radius + (random() - 0.5) * scatter;
      y = Math.sin(angle) * radius + (random() - 0.5) * scatter;
      z = (random() - 0.5) * diskThickness;

      isAccent = random() < 0.12;
    }

    if (family === "spiral" || family === "barred" || family === "flocculent") {
      y *= diskStretch;
    }
    // Reshape each family using this artist's seeded proportions.
    const diskRadius = Math.sqrt(x * x + y * y);
    const diskAngle = Math.atan2(y, x);

    const outerInfluence = Math.min(1, diskRadius);

    const ripple =
      1 +
      shape.rippleStrength *
        outerInfluence *
        Math.sin(diskAngle * shape.rippleFrequency + shape.ripplePhase);

    const asymmetry =
      1 +
      shape.lopsidedness *
        outerInfluence *
        Math.cos(diskAngle - shape.asymmetryAngle);

    const reshapedRadius = diskRadius * ripple * asymmetry;

    const reshapedAngle =
      diskAngle + shape.outerTwist * diskRadius * diskRadius;

    x = Math.cos(reshapedAngle) * reshapedRadius * shape.stretchX;
    y = Math.sin(reshapedAngle) * reshapedRadius * shape.stretchY;

    z =
      z * shape.stretchZ +
      shape.warp *
        diskRadius *
        diskRadius *
        Math.sin(diskAngle * 2 + shape.ripplePhase);

    // Preserve the layout's existing local-radius boundary.
    const extent = Math.sqrt(x * x + y * y + z * z);

    if (extent > 0.98) {
      const correction = 0.98 / extent;

      x *= correction;
      y *= correction;
      z *= correction;
    }

    const offset = index * 3;

    positions[offset] = x;
    positions[offset + 1] = y;
    positions[offset + 2] = z;

    const distance = Math.sqrt(x * x + y * y + z * z);
    const blend = Math.min(1, Math.max(0, (distance - 0.12) / 0.75));

    if (isAccent) {
      color.copy(accentColor);
    } else {
      color
        .copy(centerColor)
        .lerp(outerColor, family === "elliptical" ? blend * 0.35 : blend);
    }

    color.multiplyScalar((0.6 + random() * 0.4) * brightness);

    colors[offset] = color.r;
    colors[offset + 1] = color.g;
    colors[offset + 2] = color.b;

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
