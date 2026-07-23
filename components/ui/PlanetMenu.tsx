'use client';

import React from 'react';
import { planets } from '@/data/planets';
import { useSimulationStore } from '@/store/useSimulationStore';

/**
 * Row treatment shared by every entry: a 2px left rule that is transparent at rest and
 * orange when active — the only colour in the panel, per the landing page's restraint.
 */
function rowClasses(active: boolean) {
  return [
    'w-full text-left flex items-baseline gap-3 px-4 py-1.5 border-l-2 transition-colors duration-150',
    active
      ? 'border-[#FF4500] text-[#FAFAFA]'
      : 'border-transparent text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#FAFAFA]/[0.04]',
  ].join(' ');
}

export default function PlanetMenu() {
  const selectedPlanet = useSimulationStore((state) => state.selectedPlanet);
  const setSelectedPlanet = useSimulationStore((state) => state.setSelectedPlanet);

  return (
    <nav
      aria-label="Camera focus"
      className="absolute top-16 left-4 md:left-6 z-10 w-52 bg-[#09090B]/80 backdrop-blur-sm border border-[#27272A]/70 select-none"
    >
      <div className="px-4 pt-3.5 pb-2.5 border-b border-[#27272A]/70">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#71717A]">
          Bodies
        </h2>
      </div>

      <ul className="py-1.5">
        {/* Overview reads as a system command, not a body — mono where bodies are serif. */}
        <li>
          <button
            type="button"
            onClick={() => setSelectedPlanet(null)}
            aria-pressed={selectedPlanet === null}
            className={rowClasses(selectedPlanet === null)}
          >
            <span
              className={`font-mono text-[10px] ${
                selectedPlanet === null ? 'text-[#FF4500]' : 'text-[#71717A]'
              }`}
            >
              00
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.15em]">Overview</span>
          </button>
        </li>

        {planets.map((planet, index) => {
          const isSelected = selectedPlanet === planet.name;
          return (
            <li key={planet.name}>
              <button
                type="button"
                onClick={() => setSelectedPlanet(planet.name)}
                aria-pressed={isSelected}
                className={rowClasses(isSelected)}
              >
                <span
                  className={`font-mono text-[10px] ${
                    isSelected ? 'text-[#FF4500]' : 'text-[#71717A]'
                  }`}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="font-serif text-[17px] leading-tight">{planet.name}</span>
              </button>

              {/* Moons: indented tree glyph, smaller italic serif — clearly children,
                  same interaction language. */}
              {planet.moons && (
                <ul>
                  {planet.moons.map((moon) => {
                    const moonSelected = selectedPlanet === moon.name;
                    return (
                      <li key={moon.name}>
                        <button
                          type="button"
                          onClick={() => setSelectedPlanet(moon.name)}
                          aria-pressed={moonSelected}
                          className={`${rowClasses(moonSelected)} pl-9 py-1`}
                        >
                          <span
                            className={`font-mono text-[10px] ${
                              moonSelected ? 'text-[#FF4500]' : 'text-[#71717A]'
                            }`}
                          >
                            └
                          </span>
                          <span className="font-serif italic text-[15px] leading-tight">
                            {moon.name}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
