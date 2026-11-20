'use client';

import React from 'react';
import { bodiesByName, planets } from '@/data/planets';
import { useSimulationStore } from '@/store/useSimulationStore';

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-4 py-2.5 border-b border-line/60 last:border-0">
      <dt className="font-sans text-[11px] uppercase tracking-[0.15em] text-quiet shrink-0">
        {label}
      </dt>
      <dd className="font-mono text-xs text-fg text-right">{value}</dd>
    </div>
  );
}

const moonCount = planets.reduce((n, p) => n + (p.moons?.length ?? 0), 0);

export default function InfoPanel() {
  const selectedPlanet = useSimulationStore((state) => state.selectedPlanet);
  const body = selectedPlanet ? bodiesByName.get(selectedPlanet) : undefined;

  return (
    <aside className="absolute top-4 right-4 md:right-6 z-10 w-80 bg-ink/80 backdrop-blur-sm border border-line/70 select-none">
      {/* Chrome strip: panel role on the left, live tracking state on the right. */}
      <div className="px-5 pt-3.5 pb-2.5 border-b border-line/70 flex justify-between items-baseline">
        <h2 className="font-sans text-[11px] uppercase tracking-[0.2em] text-quiet">
          Telemetry
        </h2>
        <span
          className={`font-sans text-[11px] uppercase tracking-[0.2em] ${
            body ? 'text-accent' : 'text-quiet'
          }`}
        >
          {body ? 'Tracking' : 'Idle'}
        </span>
      </div>

      {body ? (
        <div className="px-5 py-5">
          <h3 className="font-serif text-3xl leading-none text-fg">{body.name}</h3>
          {body.parentName && (
            <p className="mt-1.5 font-sans text-[11px] uppercase tracking-[0.2em] text-quiet">
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
          <p className="mt-5 font-serif text-[15px] leading-relaxed text-muted">
            {body.facts.description}
          </p>
        </div>
      ) : (
        <div className="px-5 py-5">
          <h3 className="font-serif text-3xl leading-none text-fg">Overview</h3>
          <p className="mt-4 font-serif text-[15px] leading-relaxed text-muted">
            Eight planets and {moonCount} moons orbiting an ordinary G-type star, with
            distances and speeds compressed so the whole system stays watchable.
          </p>
          {/* Spec chips, borrowed directly from the landing feature blocks. */}
          <div className="mt-5 flex flex-wrap gap-2 font-sans text-[11px] uppercase tracking-wider text-quiet">
            <span className="border border-line px-2.5 py-1">8 Planets</span>
            <span className="border border-line px-2.5 py-1">{moonCount} Moons</span>
            <span className="border border-line px-2.5 py-1">1 Star</span>
          </div>
          <p className="mt-4 font-sans text-[11px] uppercase tracking-[0.15em] leading-relaxed text-quiet">
            Select a body to acquire tracking
          </p>
        </div>
      )}
    </aside>
  );
}
