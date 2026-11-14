import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Box3, MathUtils, Sphere, Vector3 } from "three";

export default function SelectionCameraControls({
  viewLevel,
  viewKey,
  viewData,
  contentRef,
  selectedTrackId,
}) {
  const controlsRef = useRef(null);
  const followRef = useRef(null);
  const framingRef = useRef(null);
  const hasFramedRef = useRef(false);

  const { camera } = useThree();

  // Preserve the incoming viewing direction when OrbitControls first mounts.
  const initialTarget = useMemo(() => {
    const direction = camera.getWorldDirection(new Vector3());

    return camera.position.clone().add(direction).toArray();
  }, [camera]);

  const scratch = useMemo(
    () => ({
      worldPosition: new Vector3(),
      worldScale: new Vector3(),
      destination: new Vector3(),
      movement: new Vector3(),
      direction: new Vector3(),
    }),
    [],
  );

  // Calculate the framing destination and begin a smooth transition.
  const frameContent = useCallback(() => {
    const controls = controlsRef.current;
    const content = contentRef.current;

    if (!controls || !content) return;

    content.updateWorldMatrix(true, true);

    const bounds = new Box3().setFromObject(content);

    let endTarget;
    let endPosition;
    let far = 2000;

    if (bounds.isEmpty()) {
      endTarget = new Vector3(0, 0, 0);
      endPosition = new Vector3(0, 0, 40);
    } else {
      const sphere = bounds.getBoundingSphere(new Sphere());

      const verticalHalfFov = MathUtils.degToRad(camera.fov / 2);

      const horizontalHalfFov = Math.atan(
        Math.tan(verticalHalfFov) * camera.aspect,
      );

      const limitingHalfFov = Math.min(verticalHalfFov, horizontalHalfFov);

      const radius = Math.max(sphere.radius, 1);
      const distance = (radius / Math.sin(limitingHalfFov)) * 1.2;

      endTarget = sphere.center.clone();

      endPosition = sphere.center.clone().add(new Vector3(0, 0, distance));

      far = Math.max(2000, distance + radius * 10);
    }

    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();

    // On entry, retain the incoming camera direction while giving the
    // temporary target a useful distance for interpolation.
    if (!hasFramedRef.current) {
      camera.getWorldDirection(scratch.direction);

      const targetDistance = Math.max(camera.position.distanceTo(endTarget), 1);

      startTarget
        .copy(camera.position)
        .addScaledVector(scratch.direction, targetDistance);

      controls.target.copy(startTarget);
      hasFramedRef.current = true;
    }

    framingRef.current = {
      elapsed: 0,
      duration: 1.25,
      startPosition,
      startTarget,
      endPosition,
      endTarget,
    };

    controls.enabled = false;
    controls.enablePan = true;
    controls.minDistance = 0.1;
    controls.maxDistance = Infinity;

    camera.near = 0.1;
    camera.far = far;
    camera.updateProjectionMatrix();
  }, [camera, contentRef, scratch]);

  // Navigation starts a framing transition, not an immediate reposition.
  useEffect(() => {
    followRef.current = null;
    frameContent();
  }, [frameContent, viewKey, viewData]);

  useFrame((state, delta) => {
    const controls = controlsRef.current;
    const content = contentRef.current;

    if (!controls || !content) return;

    const shouldFollow = viewLevel === "release" && selectedTrackId != null;

    if (!shouldFollow) {
      // Leaving planet inspection smoothly reframes the release.
      if (followRef.current) {
        followRef.current = null;
        frameContent();
      }

      const framing = framingRef.current;

      if (!framing) return;

      framing.elapsed += Math.min(delta, 0.05);

      const progress = Math.min(framing.elapsed / framing.duration, 1);

      const eased = progress * progress * (3 - 2 * progress);

      camera.position.lerpVectors(
        framing.startPosition,
        framing.endPosition,
        eased,
      );

      controls.target.lerpVectors(
        framing.startTarget,
        framing.endTarget,
        eased,
      );

      controls.update();

      if (progress === 1) {
        framingRef.current = null;
        controls.enabled = true;
      }

      return;
    }

    // Planet selection takes priority over a framing transition.
    framingRef.current = null;

    let follow = followRef.current;

    if (!follow || follow.trackId !== selectedTrackId) {
      const mesh = content.getObjectByName(`song-planet-${selectedTrackId}`);

      // Wait until the selected planet exists in the scene.
      if (!mesh) return;

      mesh.getWorldPosition(scratch.worldPosition);
      mesh.getWorldScale(scratch.worldScale);

      const localRadius = mesh.userData.planetRadius ?? 1;

      const worldRadius =
        localRadius *
        Math.max(
          Math.abs(scratch.worldScale.x),
          Math.abs(scratch.worldScale.y),
          Math.abs(scratch.worldScale.z),
        );

      const verticalHalfFov = MathUtils.degToRad(camera.fov / 2);

      const horizontalHalfFov = Math.atan(
        Math.tan(verticalHalfFov) * camera.aspect,
      );

      const limitingHalfFov = Math.min(verticalHalfFov, horizontalHalfFov);

      const approachDistance = (worldRadius / Math.sin(limitingHalfFov)) * 1.4;

      // Preserve the current viewing direction during planet approach.
      const offset = camera.position.clone().sub(controls.target);

      if (offset.lengthSq() < 0.0001) {
        offset.set(0, 0, 1);
      }

      offset.normalize().multiplyScalar(approachDistance);

      follow = {
        trackId: selectedTrackId,
        mesh,
        worldRadius,
        elapsed: 0,
        duration: 1.25,
        approaching: true,
        startPosition: camera.position.clone(),
        startTarget: controls.target.clone(),
        offset,
        previousPosition: scratch.worldPosition.clone(),
      };

      followRef.current = follow;

      controls.enabled = false;
      controls.enablePan = false;
      controls.minDistance = 0.1;
      controls.maxDistance = Infinity;
    }

    follow.mesh.getWorldPosition(scratch.worldPosition);

    if (follow.approaching) {
      follow.elapsed += Math.min(delta, 0.05);

      const progress = Math.min(follow.elapsed / follow.duration, 1);

      const eased = progress * progress * (3 - 2 * progress);

      // Continue approaching the planet as it moves along its orbit.
      scratch.destination.copy(scratch.worldPosition).add(follow.offset);

      camera.position.lerpVectors(
        follow.startPosition,
        scratch.destination,
        eased,
      );

      controls.target.lerpVectors(
        follow.startTarget,
        scratch.worldPosition,
        eased,
      );

      follow.previousPosition.copy(scratch.worldPosition);

      controls.update();

      if (progress === 1) {
        follow.approaching = false;
        controls.minDistance = follow.worldRadius * 1.4;
        controls.enabled = true;
      }

      return;
    }

    // Preserve the user's orbit angle and zoom while following the planet.
    scratch.movement.copy(scratch.worldPosition).sub(follow.previousPosition);

    camera.position.add(scratch.movement);
    controls.target.copy(scratch.worldPosition);

    follow.previousPosition.copy(scratch.worldPosition);

    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      target={initialTarget}
      makeDefault
      enableDamping={false}
    />
  );
}
