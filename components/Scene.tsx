'use client';

import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import SolarSystem from './SolarSystem';
import CameraController from './CameraController';
import Skybox from './Skybox';
import { OVERVIEW_POSITION } from './cameraFocus';

/**
 * Kill switch for the post-processing chain. Bloom is the priciest thing in the scene
 * on low-end GPUs — flip this off to A/B the frame cost without touching anything else.
 */
const POST_PROCESSING = true;

const WARMUP_FRAMES = 12;

function SceneWarmup({ onReady }: { onReady?: () => void }) {
  const renderedFrames = useRef(0);
  const reported = useRef(false);

  useFrame(() => {
    if (reported.current || !onReady) return;
    renderedFrames.current += 1;
    if (renderedFrames.current >= WARMUP_FRAMES) {
      reported.current = true;
      onReady();
    }
  });

  return null;
}

export default function Scene({ onReady }: { onReady?: () => void }) {
  return (
    <div className="w-full h-full bg-black">
      <Canvas
        // Initial shot comes from cameraFocus so the overview-return animation and the
        // first render agree on where "home" is. Far plane clears the star shell at 500.
        camera={{
          position: OVERVIEW_POSITION.toArray(),
          fov: 50,
          near: 0.1,
          far: 2000,
        }}
        // Cap the pixel ratio: a 3x-DPI display would otherwise render ~9x the
        // pixels for no visible gain — and post-processing multiplies that cost.
        dpr={[1, 2]}
      >
        {/* Outside Suspense so camera controls stay live while textures load. */}
        <CameraController />
        <SceneWarmup onReady={onReady} />

        {/* Milky Way backdrop at radius 1000; procedural stars twinkle in front of it. */}
        <Skybox textureFile="/textures/8k_stars_milky_way.jpg" />

        {/* Star shell OUTSIDE maxDistance (350, CameraController) so the camera can
            never exit the universe. depth spreads shells over 500..650 for parallax;
            factor 7 gives strong per-star size variation — uniform dots are the main
            "procedural placeholder" tell. saturation 0 keeps starlight white. */}
        <Stars radius={500} depth={150} count={12000} factor={7} saturation={0} fade speed={0} />

        <Suspense fallback={null}>
          <SolarSystem />
        </Suspense>

        {POST_PROCESSING && (
          <EffectComposer multisampling={4}>
            {/* Threshold 1.0 in the pre-tonemap HDR buffer: only genuinely overbright
                pixels bloom. The Sun renders at ~1.6 (toneMapped=false + tint), so it
                glows; lit planet surfaces stay below 1.0 and stay crisp. */}
            <Bloom mipmapBlur intensity={0.85} luminanceThreshold={1.0} radius={0.72} />
            {/* Subtle edge darkening — draws the eye to the lit centre of the frame. */}
            <Vignette offset={0.28} darkness={0.42} />
            {/* Explicit final tonemap: the composer renders into an HDR buffer, so the
                renderer's own ACES pass no longer applies — without this the output
                would clip harshly instead of rolling off. */}
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
