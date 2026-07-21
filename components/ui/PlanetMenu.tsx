'use client';

import React from 'react';
import { planets } from '@/data/planets';
import { useSimulationStore } from '@/store/useSimulationStore';

const baseItem =
  'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm text-left transition-colors duration-150';

export default function PlanetMenu() {
  const selectedPlanet = useSimulationStore((state) => state.selectedPlanet);
  const setSelectedPlanet = useSimulationStore((state) => state.setSelectedPlanet);

  return (
    <nav
      aria-label="Camera focus"
      className="absolute top-4 left-4 z-10 w-44 bg-slate-900/80 backdrop-blur-md text-white p-3 rounded-xl border border-slate-800 shadow-2xl select-none"
    >
      <h2 className="px-2.5 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Focus
      </h2>

      <ul className="space-y-0.5">
        <li>
          <button
            type="button"
            onClick={() => setSelectedPlanet(null)}
            aria-pressed={selectedPlanet === null}
            className={`${baseItem} ${
              selectedPlanet === null
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full border border-slate-400 shrink-0" />
            Overview
          </button>
        </li>

        {planets.map((planet) => {
          const isSelected = selectedPlanet === planet.name;
          return (
            <li key={planet.name}>
              <button
                type="button"
                onClick={() => setSelectedPlanet(planet.name)}
                aria-pressed={isSelected}
                className={`${baseItem} ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: planet.fallbackColor }}
                />
                {planet.name}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
