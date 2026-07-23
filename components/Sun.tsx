'use client';

import React from 'react';
import * as THREE from 'three';
import { sun } from '@/data/planets';
import useOptionalTexture from './useOptionalTexture';

/**
 * Overbright tint: three multiplies map * color, and THREE.Color accepts >1 components.
 * With toneMapped=false the material writes these raw HDR values into the composer's
 * buffer, pushing the Sun's bright texels to ~1.6 — past Bloom's 1.0 threshold, so the
 * Sun is the only thing in the scene that blooms. Warm bias (more R than B) so the halo
 * reads solar rather than clinical white.
 */
const SUN_HDR_TINT = new THREE.Color(1.7, 1.45, 1.1);
const SUN_HDR_FALLBACK = new THREE.Color('#fdb813').multiplyScalar(1.7);

export default function Sun() {
  const map = useOptionalTexture(sun.textureFile);

  // MeshBasicMaterial is unlit, so the Sun ignores scene lighting and reads as
  // self-luminous rather than being shaded by the point light sitting inside it.
  return (
    <mesh name={sun.name}>
      <sphereGeometry args={[sun.radius, 64, 32]} />
      {/* Keyed for the same reason as Planet — R3F never sets needsUpdate, so a
          texture arriving after compile needs a fresh material. toneMapped=false
          exempts the Sun from the material-level tonemap, keeping its HDR values
          intact for the bloom pass. */}
      <meshBasicMaterial
        key={map ? 'textured' : 'flat'}
        map={map}
        color={map ? SUN_HDR_TINT : SUN_HDR_FALLBACK}
        toneMapped={false}
      />
    </mesh>
  );
}
