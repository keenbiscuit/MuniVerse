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
  const releaseApproachRef = useRef(null);
  const previousViewLevelRef = useRef(null);

  const { camera } = useThree();

  const scratch = useMemo(
    () => ({
      worldPosition: new Vector3(),
      worldScale: new Vector3(),
      destination: new Vector3(),
      movement: new Vector3(),
    }),
    [],
  );

  // Frame content immediately, or approach it using the planet-style easing.
  const frameContent = useCallback(
    (animate = false) => {
      const controls = controlsRef.current;
      const content = contentRef.current;

      if (!controls || !content) return;

      releaseApproachRef.current = null;

      controls.enabled = true;
      controls.enablePan = true;
      controls.minDistance = 0.1;
      controls.maxDistance = Infinity;

      content.updateWorldMatrix(true, true);

      const bounds = new Box3().setFromObject(content);

      if (bounds.isEmpty()) {
        controls.target.set(0, 0, 0);

        camera.position.set(0, 0, 40);
        camera.near = 0.1;
        camera.far = 2000;
        camera.updateProjectionMatrix();

        controls.update();
        return;
      }

      const sphere = bounds.getBoundingSphere(new Sphere());

      const verticalHalfFov = MathUtils.degToRad(camera.fov / 2);

      const horizontalHalfFov = Math.atan(
        Math.tan(verticalHalfFov) * camera.aspect,
      );

      const limitingHalfFov = Math.min(verticalHalfFov, horizontalHalfFov);

      const radius = Math.max(sphere.radius, 1);
      const distance = (radius / Math.sin(limitingHalfFov)) * 1.2;

      camera.near = 0.1;
      camera.far = Math.max(2000, distance + radius * 10);
      camera.updateProjectionMatrix();

      if (animate) {
        // Preserve the current viewing direction, as planet approach does.
        const offset = camera.position.clone().sub(controls.target);

        if (offset.lengthSq() < 0.0001) {
          offset.set(0, 0, 1);
        }

        offset.normalize().multiplyScalar(distance);

        releaseApproachRef.current = {
          elapsed: 0,
          duration: 1.25,
          startPosition: camera.position.clone(),
          startTarget: controls.target.clone(),
          endPosition: sphere.center.clone().add(offset),
          endTarget: sphere.center.clone(),
        };

        controls.enabled = false;
        return;
      }

      controls.target.copy(sphere.center);

      camera.position.set(
        sphere.center.x,
        sphere.center.y,
        sphere.center.z + distance,
      );

      controls.update();
    },
    [camera, contentRef],
  );

  // Only release entry gets the new approach.
  // Artist entry retains the original framing behavior.
  useEffect(() => {
    const previousViewLevel = previousViewLevelRef.current;

    followRef.current = null;

    const shouldAnimate =
      viewLevel === "release" ||
      (viewLevel === "artist" && previousViewLevel === "release");

    frameContent(shouldAnimate);

    previousViewLevelRef.current = viewLevel;
  }, [frameContent, viewLevel, viewKey, viewData]);

  useFrame((state, delta) => {
    const controls = controlsRef.current;
    const content = contentRef.current;

    if (!controls || !content) return;

    const shouldFollow = viewLevel === "release" && selectedTrackId != null;

    if (!shouldFollow) {
      // Preserve the original behavior when leaving planet inspection.
      if (followRef.current) {
        followRef.current = null;
        frameContent(true);
      }

      const approach = releaseApproachRef.current;

      if (!approach) return;

      approach.elapsed += Math.min(delta, 0.05);

      const progress = Math.min(approach.elapsed / approach.duration, 1);

      const eased = progress * progress * (3 - 2 * progress);

      camera.position.lerpVectors(
        approach.startPosition,
        approach.endPosition,
        eased,
      );

      controls.target.lerpVectors(
        approach.startTarget,
        approach.endTarget,
        eased,
      );

      controls.update();

      if (progress === 1) {
        releaseApproachRef.current = null;
        controls.enabled = true;
      }

      return;
    }

    // A planet click takes priority over release framing.
    releaseApproachRef.current = null;

    let follow = followRef.current;

    // A different selected track starts a fresh approach.
    if (!follow || follow.trackId !== selectedTrackId) {
      const mesh = content.getObjectByName(`song-planet-${selectedTrackId}`);

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

      // Preserve the current viewing direction during the approach.
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

      // The destination follows the planet during the approach.
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

    // Preserve the user's orbit angle and zoom while following.
    scratch.movement.copy(scratch.worldPosition).sub(follow.previousPosition);

    camera.position.add(scratch.movement);
    controls.target.copy(scratch.worldPosition);

    follow.previousPosition.copy(scratch.worldPosition);

    controls.update();
  });

  return <OrbitControls ref={controlsRef} makeDefault enableDamping={false} />;
}
