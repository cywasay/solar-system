'use client';

import React from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';

export default function TimeControls() {
  // Per-field selectors: this bar has no reason to re-render on selection changes.
  const isPaused = useSimulationStore((state) => state.isPaused);
  const timeSpeed = useSimulationStore((state) => state.timeSpeed);
  const showOrbitPaths = useSimulationStore((state) => state.showOrbitPaths);
  const setIsPaused = useSimulationStore((state) => state.setIsPaused);
  const setTimeSpeed = useSimulationStore((state) => state.setTimeSpeed);
  const setShowOrbitPaths = useSimulationStore((state) => state.setShowOrbitPaths);

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-stretch bg-ink/80 backdrop-blur-sm border border-line/70 select-none font-sans">
      <button
        type="button"
        onClick={() => setIsPaused(!isPaused)}
        className="group relative overflow-hidden px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-fg border-r border-line/70 transition-colors duration-300 hover:text-ink"
      >
        {/* Same rising-fill hover as the landing CTAs. */}
        <span className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.83,0,0.17,1)]" />
        <span className="relative">{isPaused ? '[ Resume ]' : '[ Pause ]'}</span>
      </button>

      <div className="flex items-center gap-4 px-5">
        <label
          htmlFor="time-speed"
          className="text-[11px] uppercase tracking-[0.2em] text-quiet"
        >
          Rate
        </label>
        <input
          id="time-speed"
          type="range"
          min="0.1"
          max="5.0"
          step="0.1"
          value={timeSpeed}
          onChange={(e) => setTimeSpeed(parseFloat(e.target.value))}
          className="w-28 accent-accent cursor-pointer"
        />
        <span className="font-mono text-[11px] text-fg w-10 text-right tabular-nums">
          {timeSpeed.toFixed(1)}x
        </span>
      </div>

      <button
        type="button"
        onClick={() => setShowOrbitPaths(!showOrbitPaths)}
        aria-pressed={showOrbitPaths}
        className="group relative overflow-hidden px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-fg border-l border-line/70 transition-colors duration-300 hover:text-ink"
      >
        <span className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.83,0,0.17,1)]" />
        <span className="relative">{showOrbitPaths ? '[ Guides On ]' : '[ Guides Off ]'}</span>
      </button>
    </div>
  );
}
