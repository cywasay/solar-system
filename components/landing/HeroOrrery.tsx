'use client';

import { useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { planets } from '@/data/planets';
import styles from './Hero.module.css';

const MIN_AU = parseFloat(planets[0].facts.distance);
const MAX_AU = parseFloat(planets[planets.length - 1].facts.distance);

// Logarithmic spacing makes the inner worlds legible. Angular rates use the
// simulation's compressed periods; this is a schematic, not an ephemeris.
const orbits = planets.map((planet, index) => ({
  ...planet,
  diameter: 24 + 69 * Math.log(parseFloat(planet.facts.distance) / MIN_AU) / Math.log(MAX_AU / MIN_AU),
  period: 2 * Math.PI / planet.orbitSpeed,
  phase: [0.12, 0.66, 0.36, 0.85, 0.1, 0.6, 0.34, 0.77][index],
}));

export default function HeroOrrery() {
  const [selected, setSelected] = useState(2);
  const [paused, setPaused] = useState(false);
  const planet = planets[selected];

  return (
    <>
      <figure className={styles.instrument} aria-label="Animated schematic of the eight planetary orbits">
        <div className={styles.instrumentMeta}>
          <span><i aria-hidden="true" /> The solar neighbourhood</span>
          <span>Heliocentric / 01</span>
        </div>
        <div className={styles.orrery} data-paused={paused} aria-hidden="true">
          <div className={styles.graduations} />
          <div className={styles.axisHorizontal} />
          <div className={styles.axisVertical} />
          <span className={`${styles.compass} ${styles.compassTop}`}>000°</span>
          <span className={`${styles.compass} ${styles.compassBottom}`}>180°</span>
          <div className={styles.solarHalo} />
          <div className={styles.sun} />
          <span className={styles.sunLabel}>Sol</span>

          {orbits.map((body, index) => (
            <div
              key={body.name}
              className={styles.orbit}
              data-selected={selected === index}
              style={{
                width: `${body.diameter}%`,
                height: `${body.diameter}%`,
                '--body-color': body.fallbackColor,
                '--orbit-period': `${body.period.toFixed(3)}s`,
                '--orbit-phase': `${(-body.phase * body.period).toFixed(3)}s`,
                '--static-angle': `${body.phase * 360}deg`,
              } as CSSProperties}
            >
              <div className={`${styles.arm} orbit-arm`}>
                <span className={styles.trail} />
                <span className={styles.bodyAnchor}>
                  <span className={styles.planetBody} style={{ backgroundImage: `url(${body.textureFile})` }} />
                  <span className={styles.bodyLabel}>{body.name}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
        <figcaption className={styles.diagramCaption}>
          <span>Distance & time, reimagined to explore.</span>
          <button type="button" onClick={() => setPaused(!paused)} aria-label={paused ? 'Resume orbital motion' : 'Pause orbital motion'} aria-pressed={paused} className={styles.motionButton}>
            <span aria-hidden="true">{paused ? '▶' : 'Ⅱ'}</span>
            {paused ? 'Resume' : 'Pause'}
          </button>
        </figcaption>
      </figure>

      <div className={styles.readout}>
        <div className={styles.readoutCopy} aria-live="polite" aria-atomic="true">
          <span className={styles.readoutLabel}>In focus <span>/ {String(selected + 1).padStart(2, '0')}</span></span>
          <span className={styles.readoutName}>{planet.name}</span>
          <span className={styles.readoutFact}>{planet.facts.orbitalPeriod}<span> around the Sun</span></span>
        </div>
        <Link href={`/explore?focus=${encodeURIComponent(planet.name)}`} className={styles.visitLink} aria-label={`Explore ${planet.name}`}>
          <span aria-hidden="true">↗</span>
        </Link>
      </div>

      <div className={styles.atlas}>
        <div className={styles.atlasHeading}>
          <span>Choose your world</span>
          <span className={styles.atlasHint}>Our place in the cosmos <span aria-hidden="true">↓</span></span>
        </div>
        <div className={styles.planetIndex} role="group" aria-label="Choose a planet to preview">
          {planets.map((body, index) => (
            <button
              type="button"
              key={body.name}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
              className={styles.planetChoice}
              style={{ '--body-color': body.fallbackColor } as CSSProperties}
            >
              <span className={styles.planetNumber}>{String(index + 1).padStart(2, '0')}</span>
              <span className={styles.planetSwatch} aria-hidden="true" />
              <span>{body.name}</span>
              <span className={styles.choiceMarker} aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
