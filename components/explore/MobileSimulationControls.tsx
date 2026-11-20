'use client';

import { useState } from 'react';
import { bodiesByName, planets } from '@/data/planets';
import { useSimulationStore } from '@/store/useSimulationStore';
import styles from './MobileSimulationControls.module.css';

export default function MobileSimulationControls() {
  const selected = useSimulationStore(s => s.selectedPlanet);
  const select = useSimulationStore(s => s.setSelectedPlanet);
  const paused = useSimulationStore(s => s.isPaused);
  const pause = useSimulationStore(s => s.setIsPaused);
  const speed = useSimulationStore(s => s.timeSpeed);
  const setSpeed = useSimulationStore(s => s.setTimeSpeed);
  const guides = useSimulationStore(s => s.showOrbitPaths);
  const setGuides = useSimulationStore(s => s.setShowOrbitPaths);
  const [details, setDetails] = useState(false);
  const body = selected ? bodiesByName.get(selected) : undefined;

  return <div className={styles.mobile}>
    <div className={styles.picker}>
      <label htmlFor="mobile-body">Explore</label>
      <select id="mobile-body" value={selected ?? ''} onChange={e => { select(e.target.value || null); setDetails(false); }}>
        <option value="">Solar system</option>
        {planets.map(planet => <optgroup key={planet.name} label={planet.name}>
          <option value={planet.name}>{planet.name}</option>
          {planet.moons?.map(moon => <option key={moon.name} value={moon.name}>{moon.name} · moon</option>)}
        </optgroup>)}
      </select>
    </div>
    <section className={styles.dock} aria-label="Simulation controls">
      {details && <section id="mobile-body-details" className={styles.details} aria-label={`${body?.name ?? 'Solar system'} details`}>
        <div className={styles.detailHeading}><h2>{body?.name ?? 'Solar system'}</h2><button onClick={() => setDetails(false)} aria-label="Close details">×</button></div>
        {body ? <>
          {body.parentName && <p className={styles.caption}>Moon of {body.parentName}</p>}
          <dl>{[
            ['Diameter', `${body.facts.diameterKm.toLocaleString('en-US')} km`],
            ['Distance', body.facts.distance],
            ['Orbital period', body.facts.orbitalPeriod],
            ['Day length', body.facts.dayLength],
          ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          <p>{body.facts.description}</p>
        </> : <p>Choose a planet or moon above. Drag to orbit your view and pinch to zoom.</p>}
      </section>}
      <div className={styles.actions}>
        <button onClick={() => pause(!paused)} aria-label={paused ? 'Resume simulation' : 'Pause simulation'}>{paused ? '▶ Resume' : 'Ⅱ Pause'}</button>
        <button onClick={() => setGuides(!guides)} aria-pressed={guides}>Orbits {guides ? 'on' : 'off'}</button>
        <button aria-expanded={details} aria-controls={details ? 'mobile-body-details' : undefined} onClick={() => setDetails(!details)}>Details {details ? '−' : '+'}</button>
      </div>
      <div className={styles.rate}>
        <label htmlFor="mobile-time-speed">Speed</label>
        <input id="mobile-time-speed" type="range" min="0.1" max="5" step="0.1" value={speed} onChange={e => setSpeed(Number(e.target.value))} />
        <output htmlFor="mobile-time-speed">{speed.toFixed(1)}×</output>
      </div>
    </section>
  </div>;
}
