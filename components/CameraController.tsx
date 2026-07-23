'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { bodiesByName } from '@/data/planets';
import { useSimulationStore } from '@/store/useSimulationStore';
import { createFocusState, interruptFocus, resetFocusState, stepFocus } from './cameraFocus';

/** Structural type — all we need off OrbitControls is its pivot. */
type ControlsWithTarget = { target: THREE.Vector3 };

/**
 * Zoom limits are CONSTANT, never derived from the selection. A per-selection
 * minDistance (12 in overview, radius-scaled focused) clamps inside controls.update()
 * the frame the selection changes — measured as a 10-unit one-frame camera snap when
 * deselecting while zoomed close. The cost of a constant: the user *can* deliberately
 * push the camera inside the Sun or a gas giant; that's their choice, and it never
 * fights an animation. maxDistance must stay inside the starfield shell (radius 500
 * in Scene.tsx) or the camera can exit the universe and see a black void behind it.
 */
const MIN_DISTANCE = 2;
const MAX_DISTANCE = 350;

export default function CameraController() {
  const selectedPlanet = useSimulationStore((state) => state.selectedPlanet);
  const focusNonce = useSimulationStore((state) => state.focusNonce);
  // Stable Map identity, so this subscription never causes a re-render.
  const planetRefs = useSimulationStore((state) => state.planetRefs);
  const controls = useThree((state) => state.controls) as ControlsWithTarget | null;

  const focus = useRef(createFocusState());
  const worldPosition = useRef(new THREE.Vector3());

  // Restart the approach on every focus request — focusNonce makes re-clicking the
  // already-selected body (or Overview) re-fly, which a name compare alone would miss.
  useEffect(() => {
    resetFocusState(focus.current);
  }, [selectedPlanet, focusNonce]);

  // OrbitControls 'start' fires on any user grab (drag, wheel, touch). The user takes
  // over instantly: an in-flight approach stops easing rather than eroding their input.
  const handleStart = useCallback(() => {
    interruptFocus(focus.current);
  }, []);

  // bodiesByName covers moons too, so focusing Luna or Phobos needs no special case.
  const focusedRadius = selectedPlanet ? (bodiesByName.get(selectedPlanet)?.radius ?? 1) : 1;

  useFrame(({ camera }) => {
    if (!controls) return;

    const object = selectedPlanet ? planetRefs.get(selectedPlanet) : undefined;

    stepFocus({
      state: focus.current,
      // Read fresh from the scene graph every frame — never a value captured at
      // selection time, which is what would drift as the planet orbits away.
      planetPosition: object ? object.getWorldPosition(worldPosition.current) : null,
      planetRadius: focusedRadius,
      cameraPosition: camera.position,
      controlsTarget: controls.target,
    });
    // Priority -2 so this lands before drei's controls.update() at -1: that call reads
    // our target, re-derives the spherical offset, and does the lookAt in the same frame.
  }, -2);

  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.05}
      onStart={handleStart}
      // Panning moves the pivot, but while a body is focused the tracking re-pins the
      // pivot to the body every frame — the two would fight as a jittery rubber-band.
      // Rotate and zoom compose fine with tracking, so only pan is gated.
      enablePan={selectedPlanet === null}
      minDistance={MIN_DISTANCE}
      maxDistance={MAX_DISTANCE}
      zoomSpeed={0.8}
      rotateSpeed={0.5}
    />
  );
}
