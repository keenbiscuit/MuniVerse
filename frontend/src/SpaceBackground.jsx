import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";

import { AdditiveBlending, CanvasTexture, Vector3 } from "three";

function createRandom(seed) {
  let value = seed >>> 0;

  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function createNebulaTexture(seed, rgb) {
  const random = createRandom(seed);

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const context = canvas.getContext("2d");

  for (let index = 0; index < 45; index++) {
    const x = 25 + random() * 206;
    const y = 128 + Math.sin(x * 0.025 + seed) * 35 + (random() - 0.5) * 65;

    const radius = 20 + random() * 45;

    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);

    gradient.addColorStop(0, `rgba(${rgb},${0.025 + random() * 0.04})`);

    gradient.addColorStop(0.5, `rgba(${rgb},0.015)`);

    gradient.addColorStop(1, `rgba(${rgb},0)`);

    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
  }

  return new CanvasTexture(canvas);
}

function Nebula({ texture, position, scale, opacity }) {
  return (
    <sprite position={position} scale={scale} raycast={() => null}>
      <spriteMaterial
        map={texture}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </sprite>
  );
}

export default function SpaceBackground() {
  const backgroundRef = useRef(null);
  const streakFrameRef = useRef(null);
  const streakRef = useRef(null);

  const textures = useMemo(
    () => [
      createNebulaTexture(12, "113,65,170"),
      createNebulaTexture(29, "52,82,153"),
      createNebulaTexture(43, "138,52,103"),
    ],
    [],
  );

  const streakPositions = useMemo(() => new Float32Array(6), []);

  const random = useMemo(() => createRandom(9813), []);

  const streakState = useRef({
    wait: 12,
    age: 0,
    active: false,
    start: new Vector3(),
    velocity: new Vector3(),
  });

  useEffect(() => {
    return () => {
      textures.forEach((texture) => texture.dispose());
    };
  }, [textures]);

  useFrame(({ camera }, delta) => {
    const frameDelta = Math.min(delta, 0.05);

    if (backgroundRef.current) {
      backgroundRef.current.position.copy(camera.position);
    }

    // The streak uses a camera-facing coordinate frame.
    if (streakFrameRef.current) {
      streakFrameRef.current.quaternion.copy(camera.quaternion);
    }

    const line = streakRef.current;

    if (!line) return;

    const streak = streakState.current;

    if (!streak.active) {
      line.visible = false;
      streak.wait -= frameDelta;

      if (streak.wait > 0) return;

      streak.active = true;
      streak.age = 0;

      streak.start.set(-40 + random() * 50, 15 + random() * 20, -100);

      streak.velocity.set(55 + random() * 25, -15 - random() * 15, 0);
    }

    streak.age += frameDelta;

    const duration = 0.7;
    const progress = streak.age / duration;

    if (progress >= 1) {
      streak.active = false;
      streak.wait = 14 + random() * 16;
      line.visible = false;
      return;
    }

    const headX = streak.start.x + streak.velocity.x * streak.age;

    const headY = streak.start.y + streak.velocity.y * streak.age;

    const tailTime = Math.max(0, streak.age - 0.11);

    const tailX = streak.start.x + streak.velocity.x * tailTime;

    const tailY = streak.start.y + streak.velocity.y * tailTime;

    const attribute = line.geometry.attributes.position;

    attribute.setXYZ(0, tailX, tailY, -100);
    attribute.setXYZ(1, headX, headY, -100);
    attribute.needsUpdate = true;

    line.material.opacity = Math.sin(progress * Math.PI) * 0.65;

    line.visible = true;
  });

  return (
    <group ref={backgroundRef}>
      <Nebula
        texture={textures[0]}
        position={[-120, 65, -250]}
        scale={[330, 175, 1]}
        opacity={0.38}
      />

      <Nebula
        texture={textures[1]}
        position={[210, -70, -310]}
        scale={[320, 200, 1]}
        opacity={0.3}
      />

      <Nebula
        texture={textures[2]}
        position={[-80, -150, 220]}
        scale={[300, 160, 1]}
        opacity={0.25}
      />

      <Stars
        radius={120}
        depth={120}
        count={3200}
        factor={1.8}
        saturation={0}
        fade
        speed={0.12}
        raycast={() => null}
      />

      <Stars
        radius={140}
        depth={100}
        count={100}
        factor={3}
        saturation={0}
        fade
        speed={0.08}
        raycast={() => null}
      />

      <group ref={streakFrameRef}>
        <line
          ref={streakRef}
          visible={false}
          frustumCulled={false}
          raycast={() => null}
        >
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[streakPositions, 3]}
            />
          </bufferGeometry>

          <lineBasicMaterial
            color="#d3d6ff"
            transparent
            opacity={0}
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </line>
      </group>
    </group>
  );
}
