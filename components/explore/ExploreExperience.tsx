'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import FocusFromQuery from '@/components/FocusFromQuery';
import InfoPanel from '@/components/ui/InfoPanel';
import PlanetMenu from '@/components/ui/PlanetMenu';
import TimeControls from '@/components/ui/TimeControls';
import ExploreLoader from './ExploreLoader';

const Scene = dynamic(() => import('@/components/Scene'), { ssr: false });

const MINIMUM_LOADER_DURATION = 2_000;
const LOADER_EXIT_DURATION = 500;

/**
 * The canvas warms behind the loader. It is revealed only after the minimum display
 * time and the renderer's own warm-up signal have both completed.
 */
export default function ExploreExperience() {
  const [minimumDurationElapsed, setMinimumDurationElapsed] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const loaderReadyToExit = minimumDurationElapsed && sceneReady;

  useEffect(() => {
    const timer = window.setTimeout(() => setMinimumDurationElapsed(true), MINIMUM_LOADER_DURATION);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loaderReadyToExit) return;
    const timer = window.setTimeout(() => setShowLoader(false), LOADER_EXIT_DURATION);
    return () => window.clearTimeout(timer);
  }, [loaderReadyToExit]);

  const handleSceneReady = useCallback(() => setSceneReady(true), []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#09090B]" aria-busy={showLoader}>
      <div className="h-full w-full">
        <Scene onReady={handleSceneReady} />
      </div>

      <div className="absolute left-4 top-4 z-50 md:left-6">
        <Link
          href="/"
          className="group relative inline-block overflow-hidden border border-[#27272A]/70 bg-[#09090B]/80 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#A1A1AA] backdrop-blur-sm transition-colors duration-300 hover:text-[#09090B]"
        >
          <span className="absolute inset-0 translate-y-full bg-[#FF4500] transition-transform duration-300 ease-[cubic-bezier(0.83,0,0.17,1)] group-hover:translate-y-0" />
          <span className="relative">[ Exit ]</span>
        </Link>
      </div>

      <Suspense fallback={null}>
        <FocusFromQuery />
      </Suspense>
      <PlanetMenu />
      <InfoPanel />
      <TimeControls />

      {showLoader && <ExploreLoader exiting={loaderReadyToExit} />}
    </main>
  );
}
