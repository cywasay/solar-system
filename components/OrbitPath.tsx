'use client';

import React from 'react';
import * as THREE from 'three';

export interface OrbitPathProps {
  /** Orbital radius in scene units. */
  radius: number;
  /** Half-thickness of the drawn band. Constant, so distant orbits stay visible. */
  width?: number;
  opacity?: number;
}

export default function OrbitPath({ radius, width = 0.06, opacity = 0.22 }: OrbitPathProps) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      {/* 256 segments so the outer orbits still read as circles rather than polygons. */}
      <ringGeometry args={[radius - width, radius + width, 256]} />
      <meshBasicMaterial
        color="#ffffff"
        opacity={opacity}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
