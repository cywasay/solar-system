'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { planets } from '@/data/planets';
import { useSimulationStore } from '@/store/useSimulationStore';
import { createFocusState, resetFocusState, stepFocus } from './cameraFocus';

/** Structural type — all we need off OrbitControls is its pivot. */
type ControlsWithTarget = { target: THREE.Vector3 };

const radiusByName = new Map(planets.map((planet) => [planet.name, planet.radius]));

export default function CameraController() {
  const selectedPlanet = useSimulationStore((state) => state.selectedPlanet);
  // Stable Map identity, so this subscription never causes a re-render.
  const planetRefs = useSimulationStore((state) => state.planetRefs);
  const controls = useThree((state) => state.controls) as ControlsWithTarget | null;

  const focus = useRef(createFocusState());
  const worldPosition = useRef(new THREE.Vector3());

  // Restart the approach whenever the selection changes.
  useEffect(() => {
    resetFocusState(focus.current);
  }, [selectedPlanet]);

  const focusedRadius = selectedPlanet ? (radiusByName.get(selectedPlanet) ?? 1) : 1;

  // Overview needs to stay outside the Sun (r = 6); a focused planet needs to allow
  // getting much closer, or OrbitControls would clamp the camera back out mid-approach.
  const minDistance = useMemo(
    () => (selectedPlanet ? Math.max(focusedRadius * 1.6, 1) : 12),
    [selectedPlanet, focusedRadius]
  );

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
      minDistance={minDistance}
      maxDistance={600}
      zoomSpeed={0.8}
      rotateSpeed={0.5}
    />
  );
}
