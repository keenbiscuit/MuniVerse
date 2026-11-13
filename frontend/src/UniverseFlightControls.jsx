import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Euler, Matrix4, Quaternion, Vector3 } from "three";

const MOVEMENT_KEYS = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyQ",
  "KeyE",
  "ShiftLeft",
  "ShiftRight",
]);

export default function UniverseFlightControls({
  startPosition,
  startTarget,
  universeKey,
  savedViewRef,
  entryRequest,
  onEntryComplete,
}) {
  const { camera, gl } = useThree();

  const keysRef = useRef(new Set());
  const dragRef = useRef(null);
  const animationRef = useRef(null);
  const entryRequestRef = useRef(entryRequest);

  const direction = useMemo(() => new Vector3(), []);
  const rotation = useMemo(() => new Euler(0, 0, 0, "YXZ"), []);
  const wheelDirection = useMemo(() => new Vector3(), []);

  const [startX, startY, startZ] = startPosition;
  const [targetX, targetY, targetZ] = startTarget;

  // Native input listeners need access to the latest entry request.
  useEffect(() => {
    entryRequestRef.current = entryRequest;

    if (entryRequest) {
      keysRef.current.clear();
      dragRef.current = null;
    }
  }, [entryRequest]);

  // Initialize or restore the universe camera.
  useEffect(() => {
    animationRef.current = null;

    const saved = savedViewRef.current;

    if (saved?.universeKey === universeKey) {
      camera.position.fromArray(saved.position);
      camera.quaternion.fromArray(saved.quaternion);
    } else {
      camera.position.set(startX, startY, startZ);
      camera.lookAt(targetX, targetY, targetZ);
    }

    camera.near = 0.1;
    camera.far = 2000;
    camera.updateProjectionMatrix();

    return () => {
      const animation = animationRef.current;

      // Returning from an artist should restore the view from
      // before the approach, not the camera's final close-up.
      savedViewRef.current = {
        universeKey,
        position: animation?.returnPosition ?? camera.position.toArray(),
        quaternion: animation?.returnQuaternion ?? camera.quaternion.toArray(),
      };
    };
  }, [
    camera,
    savedViewRef,
    universeKey,
    startX,
    startY,
    startZ,
    targetX,
    targetY,
    targetZ,
  ]);

  useEffect(() => {
    const canvas = gl.domElement;

    // Use the wrapper from UniverseScene, not just the inner canvas.
    const surface = canvas.closest(".scene-canvas") ?? canvas;

    let suppressNextClick = false;

    function clearInput() {
      keysRef.current.clear();
      dragRef.current = null;
    }
    function handleWheel(event) {
      // Preserve browser zoom shortcuts and trackpad pinch-to-zoom.
      if (event.ctrlKey || event.metaKey) return;

      event.preventDefault();

      // Do not interfere with the automated galaxy approach.
      if (entryRequestRef.current) return;

      // Wheel deltas may be measured in pixels, lines, or pages.
      const mode = event.deltaMode;

      const unit = mode === 1 ? 16 : mode === 2 ? surface.clientHeight : 1;

      const wheelDelta = event.deltaY * unit;

      // Cap each event to avoid unexpectedly large jumps.
      const distance = Math.max(-2, Math.min(2, wheelDelta * 0.01));

      camera.getWorldDirection(wheelDirection);

      // Negative delta (wheel up) moves forward.
      camera.position.addScaledVector(wheelDirection, -distance);
    }

    function handleKeyDown(event) {
      if (entryRequestRef.current) return;
      if (!MOVEMENT_KEYS.has(event.code)) return;
      if (event.defaultPrevented) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const target = event.target;

      if (
        target instanceof Element &&
        target.closest(
          'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]',
        )
      ) {
        return;
      }

      event.preventDefault();
      keysRef.current.add(event.code);
    }

    function handleKeyUp(event) {
      keysRef.current.delete(event.code);
    }

    function handlePointerDown(event) {
      if (event.button !== 0) return;

      // A normal left-click remains available for galaxy entry.
      suppressNextClick = event.shiftKey;

      if (entryRequestRef.current || !event.shiftKey) return;

      event.preventDefault();

      dragRef.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      };
    }

    function handlePointerMove(event) {
      const drag = dragRef.current;

      if (!drag || drag.pointerId !== event.pointerId) return;
      if (entryRequestRef.current) return;

      // Stop if Shift or the left mouse button is released.
      if (!event.shiftKey || (event.buttons & 1) === 0) {
        dragRef.current = null;
        return;
      }

      const deltaX = event.clientX - drag.x;
      const deltaY = event.clientY - drag.y;

      drag.x = event.clientX;
      drag.y = event.clientY;

      rotation.setFromQuaternion(camera.quaternion, "YXZ");

      rotation.y -= deltaX * 0.003;
      rotation.x -= deltaY * 0.003;

      const limit = Math.PI / 2 - 0.02;

      rotation.x = Math.max(-limit, Math.min(limit, rotation.x));

      rotation.z = 0;

      camera.quaternion.setFromEuler(rotation);
    }

    function handlePointerUp(event) {
      if (dragRef.current?.pointerId === event.pointerId) {
        dragRef.current = null;
      }
    }

    function handleClick(event) {
      if (!suppressNextClick) return;

      suppressNextClick = false;

      event.preventDefault();
      event.stopImmediatePropagation();
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", clearInput);
    window.addEventListener("focusin", clearInput);

    surface.addEventListener("pointerdown", handlePointerDown, true);
    surface.addEventListener("click", handleClick, true);
    surface.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      clearInput();

      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", clearInput);
      window.removeEventListener("focusin", clearInput);

      surface.removeEventListener("pointerdown", handlePointerDown, true);
      surface.removeEventListener("click", handleClick, true);
      surface.removeEventListener("wheel", handleWheel);

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [camera, gl, rotation, wheelDirection]);

  useFrame((state, delta) => {
    if (entryRequest) {
      let animation = animationRef.current;

      if (!animation || animation.request !== entryRequest) {
        const target = new Vector3().fromArray(entryRequest.position);

        const fromPosition = camera.position.clone();
        const offset = fromPosition.clone().sub(target);

        if (offset.lengthSq() < 0.0001) {
          offset.set(0, 0, 1);
        }

        // Approach from the user's current side of the galaxy.
        const endDistance = Math.max(entryRequest.radius * 1.5, 0.8);

        const endPosition = target
          .clone()
          .add(offset.normalize().multiplyScalar(endDistance));

        const lookMatrix = new Matrix4().lookAt(endPosition, target, camera.up);

        animation = {
          request: entryRequest,
          elapsed: 0,
          duration: 1.8,
          completed: false,
          fromPosition,
          endPosition,
          fromQuaternion: camera.quaternion.clone(),
          endQuaternion: new Quaternion().setFromRotationMatrix(lookMatrix),
          returnPosition: camera.position.toArray(),
          returnQuaternion: camera.quaternion.toArray(),
        };

        animationRef.current = animation;
        keysRef.current.clear();
        dragRef.current = null;
      }

      if (animation.completed) return;

      animation.elapsed += Math.min(delta, 0.05);

      const progress = Math.min(animation.elapsed / animation.duration, 1);

      // Smooth acceleration and deceleration.
      const eased = progress * progress * (3 - 2 * progress);

      camera.position.lerpVectors(
        animation.fromPosition,
        animation.endPosition,
        eased,
      );

      camera.quaternion.slerpQuaternions(
        animation.fromQuaternion,
        animation.endQuaternion,
        eased,
      );

      if (progress === 1) {
        animation.completed = true;
        onEntryComplete(entryRequest.artist);
      }

      return;
    }

    const keys = keysRef.current;

    const sideways = Number(keys.has("KeyD")) - Number(keys.has("KeyA"));

    const forward = Number(keys.has("KeyS")) - Number(keys.has("KeyW"));

    const vertical = Number(keys.has("KeyE")) - Number(keys.has("KeyQ"));

    direction.set(sideways, 0, forward).applyQuaternion(camera.quaternion);

    direction.y += vertical;

    if (direction.lengthSq() === 0) return;

    direction.normalize();

    const isFast = keys.has("ShiftLeft") || keys.has("ShiftRight");

    const speed = isFast ? 12 : 4;

    camera.position.addScaledVector(direction, speed * Math.min(delta, 0.05));
  });

  return null;
}
