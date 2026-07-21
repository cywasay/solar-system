'use client';

import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import useOptionalTexture from './useOptionalTexture';

export interface PlanetRingProps {
  textureFile: string;
  /** Scene units, measured from the planet's centre. */
  innerRadius: number;
  outerRadius: number;
}

export default function PlanetRing({ textureFile, innerRadius, outerRadius }: PlanetRingProps) {
  const map = useOptionalTexture(textureFile);

  const geometry = useMemo(() => {
    const geo = new THREE.RingGeometry(innerRadius, outerRadius, 192, 1);

    // three's RingGeometry UVs are a planar projection of the bounding square, so u is
    // NOT a function of radius — two vertices at the same radius get different u. A ring
    // strip sampled with those smears around the annulus instead of banding outward from
    // the planet. Rewrite u to normalised radius; the strip is rotationally symmetric,
    // so v is irrelevant and pinned mid-texture.
    const position = geo.attributes.position;
    const uv = geo.attributes.uv;
    const vertex = new THREE.Vector3();
    const span = outerRadius - innerRadius;

    for (let i = 0; i < position.count; i++) {
      vertex.fromBufferAttribute(position, i);
      const t = (vertex.length() - innerRadius) / span;
      uv.setXY(i, THREE.MathUtils.clamp(t, 0, 1), 0.5);
    }
    uv.needsUpdate = true;

    return geo;
  }, [innerRadius, outerRadius]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  // No fallback colour: a solid disc would read far worse than no rings at all.
  if (!map) return null;

  return (
    // RingGeometry lies in XY with a +Z normal; -90 deg about X lays it into the XZ
    // plane. Mounted inside the planet's tilt group, that is the equatorial plane.
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial
        map={map}
        side={THREE.DoubleSide}
        transparent
        depthWrite={false}
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}
