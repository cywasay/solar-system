'use client';

import React from 'react';
import { sun } from '@/data/planets';
import useOptionalTexture from './useOptionalTexture';

export default function Sun() {
  const map = useOptionalTexture(sun.textureFile);

  return (
    // MeshBasicMaterial is unlit, so the Sun ignores scene lighting and reads as
    // self-luminous rather than being shaded by the point light sitting inside it.
    <mesh name={sun.name}>
      <sphereGeometry args={[sun.radius, 64, 32]} />
      {/* Keyed for the same reason as Planet — see the note there. */}
      <meshBasicMaterial
        key={map ? 'textured' : 'flat'}
        map={map}
        color={map ? '#ffffff' : sun.fallbackColor}
      />
    </mesh>
  );
}
