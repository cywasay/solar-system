'use client';

import React from 'react';
import * as THREE from 'three';
import useOptionalTexture from './useOptionalTexture';

/**
 * Equirectangular Milky Way backdrop: a large inverted sphere painted on the inside.
 *
 * Radius 1000 sits well inside the camera's far plane (2000) and outside both its
 * maxDistance (350) and the procedural star shell (~650), so it always surrounds the
 * camera and the near stars twinkle in front of it. MeshBasicMaterial is unlit, so the
 * whole sphere shows evenly regardless of distance from the Sun's point light.
 *
 * The colour map is sRGB-tagged (useOptionalTexture's default). Returns null until the
 * image loads or if it is absent, so the black canvas background is the graceful
 * fallback — same degrade-to-nothing contract as every other texture in the scene.
 */
export default function Skybox({ textureFile }: { textureFile: string }) {
  const map = useOptionalTexture(textureFile);
  if (!map) return null;

  return (
    // The galactic plane is inclined ~60 deg to the ecliptic, so the band crosses the
    // scene at an angle rather than lying flat through the planets' orbits.
    <mesh rotation={[THREE.MathUtils.degToRad(60), 0, THREE.MathUtils.degToRad(20)]}>
      <sphereGeometry args={[1000, 60, 40]} />
      <meshBasicMaterial map={map} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  );
}
