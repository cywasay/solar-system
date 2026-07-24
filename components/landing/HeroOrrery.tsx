import React from 'react';
import { planets } from '@/data/planets';

const MAX_DISTANCE = planets[planets.length - 1].distanceFromSun;

/**
 * The landing page's signature: a live orrery drawn from the simulation's own data
 * file. Ring diameters are proportional to each planet's compressed orbital distance,
 * and every arm's rotation period is 2π/orbitSpeed — the exact rate the 3D scene uses.
 * Mercury visibly laps the field while Neptune barely creeps: the page demonstrates
 * the dataset before the visitor ever reaches the simulation.
 *
 * Pure CSS motion (one transform animation per arm), so this stays a server component.
 * Phase offsets are deterministic (golden-ratio spacing) — identical on server and
 * client, so hydration never mismatches.
 */
export default function HeroOrrery() {
  return (
    <div
      aria-hidden
      className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-[44%] w-[min(94vw,1060px)] aspect-square pointer-events-none select-none hidden md:block"
    >
      {/* Faint solar glow, a pulsing corona, then the Sun itself. */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(234,88,12,0.22), transparent 65%)' }}
      />
      <div
        className="sun-pulse absolute left-1/2 top-1/2 w-6 h-6 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(234,88,12,0.9), transparent 70%)' }}
      />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#EA580C]" />

      {planets.map((planet, index) => {
        const diameter = (planet.distanceFromSun / MAX_DISTANCE) * 100;
        const period = (2 * Math.PI) / planet.orbitSpeed;
        // Golden-ratio fractions scatter the dots around the dial without randomness.
        const phase = ((index * 0.382) % 1) * period;
        const isEarth = planet.name === 'Earth';
        return (
          <div
            key={planet.name}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#1E293B]"
            style={{ width: `${diameter}%`, height: `${diameter}%` }}
          >
            <div
              className="orbit-arm absolute inset-0"
              style={{
                animation: `orbit-spin ${period.toFixed(1)}s linear infinite`,
                animationDelay: `-${phase.toFixed(1)}s`,
              }}
            >
              <span
                className={`absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                  isEarth
                    ? 'w-[7px] h-[7px] bg-[#F8FAFC] ring-2 ring-[#EA580C]/70'
                    : 'w-[5px] h-[5px] bg-[#F8FAFC]/80'
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
