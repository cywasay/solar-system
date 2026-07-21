'use client';

import React from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';

export default function TimeControls() {
  const { isPaused, timeSpeed, setIsPaused, setTimeSpeed } = useSimulationStore();

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-slate-900/80 backdrop-blur-md text-white px-6 py-3 rounded-full border border-slate-800 shadow-2xl flex items-center gap-6 select-none">
      <button
        onClick={() => setIsPaused(!isPaused)}
        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors duration-200"
      >
        {isPaused ? 'Play' : 'Pause'}
      </button>
      
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400">Simulation Speed:</span>
        <input
          type="range"
          min="0.1"
          max="5.0"
          step="0.1"
          value={timeSpeed}
          onChange={(e) => setTimeSpeed(parseFloat(e.target.value))}
          className="w-24 accent-indigo-500 cursor-pointer"
        />
        <span className="text-xs font-mono text-slate-300 w-8">{timeSpeed.toFixed(1)}x</span>
      </div>
    </div>
  );
}
