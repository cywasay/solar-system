'use client';

import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Moon as MoonData } from '@/data/planets';
import { useSimulationStore } from '@/store/useSimulationStore';

/** Mirrors Planet.tsx — clamp wall-clock gaps after the tab is backgrounded. */
const MAX_DELTA = 0.1;

/**
 * Shared unit-sphere scale distortion for irregular moons. A stretched low-poly
 * icosahedron with flat shading reads as an asteroid-like body without a custom model.
 */
const IRREGULAR_SCALE: [number, number, number] = [1.35, 0.88, 1.08];

export type MoonProps = MoonData;

/**
 * A moon. Mounted inside its planet's system group, so this pivot's frame already
 * travels around the Sun with the planet; rotating it sweeps the moon around the
 * planet. Real moons here are all tidally locked, and that comes for free: the mesh
 * is a child of the rotating pivot, so the same face points inward with no extra spin.
 */
export default function Moon({
  name,
  radius,
  distanceFromPlanet,
  orbitSpeed,
  fallbackColor,
  irregular,
}: MoonProps) {
  const pivotRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const registerPlanetRef = useSimulationStore((state) => state.registerPlanetRef);
  const unregisterPlanetRef = useSimulationStore((state) => state.unregisterPlanetRef);

  // Same registry as planets, so camera focus needs no special-casing for moons.
  useEffect(() => {
    const object = meshRef.current;
    if (!object) return;
    registerPlanetRef(name, object);
    return () => unregisterPlanetRef(name);
  }, [name, registerPlanetRef, unregisterPlanetRef]);

  useFrame((_state, delta) => {
    const step = Math.min(delta, MAX_DELTA);
    if (pivotRef.current) pivotRef.current.rotation.y += orbitSpeed * step;
  });

  return (
    <group ref={pivotRef} name={`${name}-orbit`}>
      <mesh
        ref={meshRef}
        name={name}
        position={[distanceFromPlanet, 0, 0]}
        scale={irregular ? IRREGULAR_SCALE : 1}
      >
        {irregular ? (
          // Detail 1 = 80 faces; with flat shading the coarse facets sell the
          // potato shape instead of reading as a badly tessellated sphere.
          <icosahedronGeometry args={[radius, 1]} />
        ) : (
          <sphereGeometry args={[radius, 32, 16]} />
        )}
        <meshStandardMaterial
          color={fallbackColor}
          roughness={1}
          metalness={0}
          flatShading={Boolean(irregular)}
        />
      </mesh>
    </group>
  );
}
