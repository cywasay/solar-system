'use client';

import React from 'react';
import Sun from './Sun';
import Planet from './Planet';
import OrbitPath from './OrbitPath';
import { planets } from '@/data/planets';
import { useSimulationStore } from '@/store/useSimulationStore';

export default function SolarSystem() {
  const showOrbitPaths = useSimulationStore((state) => state.showOrbitPaths);

  return (
    <group>
      {/* Near-zero: space has nothing to bounce fill light off. Kept just above zero
          so night sides silhouette against the starfield instead of merging with it. */}
      <ambientLight intensity={0.08} />

      {/* Sits inside the Sun so planets are lit from the system's centre.
          decay={1} (linear falloff) replaces the old decay={0} (none): true
          inverse-square across a 20..134-unit range is a 45x brightness spread that
          no tonemap recovers, while zero falloff lit Neptune like Mercury and read
          flat. Linear is the honest middle: Mercury ~6.7x brighter than Neptune,
          which ACES rolls off gracefully. Intensity rescaled to keep Earth's
          apparent brightness roughly where it was. */}
      <pointLight position={[0, 0, 0]} intensity={90} decay={1} />

      <Sun />

      {planets.map((planet) => (
        <React.Fragment key={planet.name}>
          {showOrbitPaths && <OrbitPath radius={planet.distanceFromSun} />}
          <Planet {...planet} />
        </React.Fragment>
      ))}
    </group>
  );
}
