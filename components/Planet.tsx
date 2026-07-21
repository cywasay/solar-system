'use client';

import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Planet as PlanetData } from '@/data/planets';
import { useSimulationStore } from '@/store/useSimulationStore';
import useOptionalTexture from './useOptionalTexture';
import PlanetRing from './PlanetRing';

/** Props mirror the `Planet` data shape exactly, so entries can be spread directly. */
export type PlanetProps = PlanetData;

/**
 * Clamp per-frame integration. R3F's delta comes straight from THREE.Clock, which
 * reports the full wall-clock gap after the tab is backgrounded — without this the
 * system lurches forward on refocus.
 */
const MAX_DELTA = 0.1;

export default function Planet({
  name,
  radius,
  distanceFromSun,
  textureFile,
  rotationSpeed,
  orbitSpeed,
  axialTilt,
  fallbackColor,
  ring,
}: PlanetProps) {
  const pivotRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const map = useOptionalTexture(textureFile);

  const registerPlanetRef = useSimulationStore((state) => state.registerPlanetRef);
  const unregisterPlanetRef = useSimulationStore((state) => state.unregisterPlanetRef);

  // Publish the live mesh so CameraController can read this planet's world position
  // without the two components referencing each other.
  useEffect(() => {
    const object = meshRef.current;
    if (!object) return;
    registerPlanetRef(name, object);
    return () => unregisterPlanetRef(name);
  }, [name, registerPlanetRef, unregisterPlanetRef]);

  // Mutating refs directly — this runs every frame and must not re-render.
  useFrame((_state, delta) => {
    const step = Math.min(delta, MAX_DELTA);
    if (pivotRef.current) pivotRef.current.rotation.y += orbitSpeed * step;
    if (meshRef.current) meshRef.current.rotation.y += rotationSpeed * step;
  });

  return (
    // Pivot at the origin; rotating its Y sweeps the child around the Sun.
    <group ref={pivotRef} name={`${name}-orbit`}>
      {/* The tilt gets its own group rather than sharing the spinning mesh. three's
          default Euler order 'XYZ' composes as RX·RY·RZ, so setting rotation.y and
          rotation.z on one object applies the spin *outside* the tilt — the planet
          would swing about the parent's vertical axis instead of turning on its own
          pole. Nesting puts the spin inside the tilted frame, where it belongs.
          Orbit lies in the XZ plane, so orbital north is +Y and tilt is about Z. */}
      <group
        position={[distanceFromSun, 0, 0]}
        rotation={[0, 0, THREE.MathUtils.degToRad(axialTilt)]}
      >
        <mesh ref={meshRef} name={name}>
          <sphereGeometry args={[radius, 64, 32]} />
          {/* The key forces a fresh material once the texture arrives. R3F never sets
              needsUpdate on materials, so assigning `map` to an already-compiled material
              is a silent no-op — the shader was built without USE_MAP. Colour must be
              white when textured, since three multiplies map by color. */}
          <meshStandardMaterial
            key={map ? 'textured' : 'flat'}
            map={map}
            color={map ? '#ffffff' : fallbackColor}
            roughness={1}
            metalness={0}
          />
        </mesh>

        {/* Sibling to the mesh, not a child: rings sit in the equatorial plane and
            inherit the tilt, but must not inherit the planet's axial spin. */}
        {ring && (
          <PlanetRing
            textureFile={ring.textureFile}
            innerRadius={radius * ring.innerRadius}
            outerRadius={radius * ring.outerRadius}
          />
        )}
      </group>
    </group>
  );
}
