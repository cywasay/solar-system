import { Suspense } from 'react';
import Scene from '@/components/Scene';
import FocusFromQuery from '@/components/FocusFromQuery';
import InfoPanel from '@/components/ui/InfoPanel';
import PlanetMenu from '@/components/ui/PlanetMenu';
import TimeControls from '@/components/ui/TimeControls';
import Link from 'next/link';

export default function ExplorePage() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#09090B]">
      {/* Exit back to the landing page — same bracket/monospace treatment as [ Init ]. */}
      <div className="absolute top-4 left-4 md:left-6 z-50">
        <Link
          href="/"
          className="group relative inline-block overflow-hidden bg-[#09090B]/80 backdrop-blur-sm border border-[#27272A]/70 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#A1A1AA] transition-colors duration-300 hover:text-[#09090B]"
        >
          <span className="absolute inset-0 bg-[#FF4500] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.83,0,0.17,1)]" />
          <span className="relative">[ Exit ]</span>
        </Link>
      </div>

      {/* 3D Scene Container */}
      <div className="w-full h-full">
        <Scene />
      </div>

      {/* Deep-link: /explore?focus=Mars pre-selects a body via the store's existing
          public action. Suspense wrap is Next's requirement for useSearchParams. */}
      <Suspense fallback={null}>
        <FocusFromQuery />
      </Suspense>

      {/* 2D HUD Overlays */}
      <PlanetMenu />
      <InfoPanel />
      <TimeControls />
    </main>
  );
}
