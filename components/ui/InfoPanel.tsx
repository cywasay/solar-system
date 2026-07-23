'use client';

import React from 'react';
import { bodiesByName, planets } from '@/data/planets';
import { useSimulationStore } from '@/store/useSimulationStore';

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-4 py-2.5 border-b border-[#27272A]/60 last:border-0">
      <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#71717A] shrink-0">
        {label}
      </dt>
      <dd className="font-mono text-xs text-[#FAFAFA] text-right">{value}</dd>
    </div>
  );
}

const moonCount = planets.reduce((n, p) => n + (p.moons?.length ?? 0), 0);

export default function InfoPanel() {
  const selectedPlanet = useSimulationStore((state) => state.selectedPlanet);
  const body = selectedPlanet ? bodiesByName.get(selectedPlanet) : undefined;

  return (
    <aside className="absolute top-4 right-4 md:right-6 z-10 w-80 bg-[#09090B]/80 backdrop-blur-sm border border-[#27272A]/70 select-none">
      {/* Chrome strip: panel role on the left, live tracking state on the right. */}
      <div className="px-5 pt-3.5 pb-2.5 border-b border-[#27272A]/70 flex justify-between items-baseline">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#71717A]">
          Telemetry
        </h2>
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.2em] ${
            body ? 'text-[#FF4500]' : 'text-[#71717A]'
          }`}
        >
          {body ? 'Tracking' : 'Idle'}
        </span>
      </div>

      {body ? (
        <div className="px-5 py-5">
          <h3 className="font-serif text-3xl leading-none text-[#FAFAFA]">{body.name}</h3>
          {body.parentName && (
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#71717A]">
              Moon of {body.parentName}
            </p>
          )}

          <dl className="mt-5">
            <FactRow label="Diameter" value={`${body.facts.diameterKm.toLocaleString('en-US')} km`} />
            <FactRow label="Distance" value={body.facts.distance} />
            <FactRow label="Orbital period" value={body.facts.orbitalPeriod} />
            <FactRow label="Day length" value={body.facts.dayLength} />
          </dl>

          {/* Editorial voice: the one place the panel speaks in prose, so it gets serif. */}
          <p className="mt-5 font-serif text-[15px] leading-relaxed text-[#A1A1AA]">
            {body.facts.description}
          </p>
        </div>
      ) : (
        <div className="px-5 py-5">
          <h3 className="font-serif text-3xl leading-none text-[#FAFAFA]">Overview</h3>
          <p className="mt-4 font-serif text-[15px] leading-relaxed text-[#A1A1AA]">
            Eight planets and {moonCount} moons orbiting an ordinary G-type star, with
            distances and speeds compressed so the whole system stays watchable.
          </p>
          {/* Spec chips, borrowed directly from the landing feature blocks. */}
          <div className="mt-5 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-wider text-[#71717A]">
            <span className="border border-[#27272A] px-2.5 py-1">8 Planets</span>
            <span className="border border-[#27272A] px-2.5 py-1">{moonCount} Moons</span>
            <span className="border border-[#27272A] px-2.5 py-1">1 Star</span>
          </div>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.15em] leading-relaxed text-[#71717A]">
            Select a body to acquire tracking
          </p>
        </div>
      )}
    </aside>
  );
}
