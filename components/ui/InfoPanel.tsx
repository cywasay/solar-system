'use client';

import React from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';

export default function InfoPanel() {
  const selectedPlanet = useSimulationStore((state) => state.selectedPlanet);

  return (
    <div className="absolute top-4 right-4 z-10 w-80 bg-slate-900/80 backdrop-blur-md text-white p-6 rounded-xl border border-slate-800 shadow-2xl select-none">
      <h2 className="text-xl font-semibold mb-2 tracking-wide text-indigo-200">Planet Info</h2>
      {selectedPlanet ? (
        <div>
          <p className="text-slate-300">
            Selected: <span className="text-indigo-400 font-medium">{selectedPlanet}</span>
          </p>
          <div className="mt-4 text-xs text-slate-400 space-y-1">
            <p>Radius: Placeholder</p>
            <p>Distance: Placeholder</p>
            <p>Orbit Speed: Placeholder</p>
            <p>Rotation Speed: Placeholder</p>
          </div>
        </div>
      ) : (
        <p className="text-slate-400 text-sm italic">Click on a planet to inspect its details.</p>
      )}
    </div>
  );
}
