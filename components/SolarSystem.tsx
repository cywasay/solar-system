'use client';

import React from 'react';
import Sun from './Sun';
import Planet from './Planet';
import OrbitPath from './OrbitPath';
import { planets } from '@/data/planets';

export default function SolarSystem() {
  return (
    <group>
      {/* Keeps the unlit side of each planet legible rather than pure black. */}
      <ambientLight intensity={0.15} />

      {/* Sits inside the Sun so planets are lit from the system's centre.
          decay={0} disables inverse-square falloff — physically wrong, but with
          real falloff Neptune (134 units out) would be effectively unlit. */}
      <pointLight position={[0, 0, 0]} intensity={2.2} decay={0} />

      <Sun />

      {planets.map((planet) => (
        <React.Fragment key={planet.name}>
          <OrbitPath radius={planet.distanceFromSun} />
          <Planet {...planet} />
        </React.Fragment>
      ))}
    </group>
  );
}
