'use client';

import { Suspense, useLayoutEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import FocusFromQuery from '@/components/FocusFromQuery';
import InfoPanel from '@/components/ui/InfoPanel';
import PlanetMenu from '@/components/ui/PlanetMenu';
import TimeControls from '@/components/ui/TimeControls';
import { useExploreTransition } from './ExploreTransition';
import MobileSimulationControls from './MobileSimulationControls';
import styles from './MobileSimulationControls.module.css';

const Scene = dynamic(() => import('@/components/Scene'), { ssr: false });

/**
 * The canvas warms behind the loader. It is revealed only after the minimum display
 * time and the renderer's own warm-up signal have both completed.
 */
export default function ExploreExperience() {
  const { phase, prepareScene, markSceneReady } = useExploreTransition();
  useLayoutEffect(() => prepareScene(), [prepareScene]);
  const showLoader = phase !== 'idle';

  return (
    <main className="fixed inset-0 overflow-hidden bg-ink" data-explore-surface aria-busy={showLoader}>
      <div className="h-full w-full">
        <Scene onReady={markSceneReady} />
      </div>

      <div className={`absolute left-4 top-4 z-50 md:left-6 ${styles.exit}`}>
        <Link
          href="/"
          className="btn-neo btn-neo-sm group relative inline-block overflow-hidden px-4 py-2 font-sans text-[11px] uppercase tracking-[0.2em] text-muted transition-colors duration-300 hover:text-ink"
        >
          <span className="absolute inset-0 translate-y-full bg-accent transition-transform duration-300 ease-[cubic-bezier(0.83,0,0.17,1)] group-hover:translate-y-0" />
          <span className="relative">[ Exit ]</span>
        </Link>
      </div>

      <Suspense fallback={null}>
        <FocusFromQuery />
      </Suspense>
      <div className={styles.desktop}>
        <PlanetMenu />
        <InfoPanel />
        <TimeControls />
      </div>
      <MobileSimulationControls />

    </main>
  );
}
