'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import SolarSystem from './SolarSystem';
import CameraController from './CameraController';

export default function Scene() {
  return (
    <div className="w-full h-full bg-slate-950">
      <Canvas
        // Framed so Neptune (~136 units out) clears the horizontal FOV on a
        // landscape viewport; far plane clears the starfield at 400.
        camera={{ position: [0, 80, 210], fov: 50, near: 0.1, far: 2000 }}
        // Cap the pixel ratio: a 3x-DPI display would otherwise render ~9x the
        // pixels for no visible gain.
        dpr={[1, 2]}
      >
        {/* Outside Suspense so camera controls stay live while textures load. */}
        <CameraController />

        {/* radius must exceed the outermost orbit, or stars render inside the system.
            speed={0} keeps the field static for now. */}
        <Stars radius={400} depth={80} count={8000} factor={5} saturation={0} fade speed={0} />

        <Suspense fallback={null}>
          <SolarSystem />
        </Suspense>
      </Canvas>
    </div>
  );
}
