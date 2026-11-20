'use client';

import { useState } from 'react';
import styles from './NeptunePage.module.css';

const stages = [
  {
    title: 'A discrepancy',
    text: 'Uranus was not following its calculated orbit exactly. The residual was evidence of a problem: the model of its motion was missing something, or its assumptions were incomplete.',
  },
  {
    title: 'A prediction',
    text: 'Le Verrier calculated where an unseen planet could be pulling on Uranus. Adams independently pursued the same gravitational explanation. A calculated position gave observers somewhere to look.',
  },
  {
    title: 'An observation',
    text: 'On September 23, 1846, Galle and d’Arrest compared the Berlin sky with a star chart. An uncharted object appeared close to Le Verrier’s predicted position. Its disk and subsequent motion established the planet.',
  },
];

export default function NeptunePrediction() {
  const [step, setStep] = useState(0);
  return (
    <div className={styles.prediction} data-arrival data-step={step}>
      <div className={styles.plate}>
        <svg
          viewBox="0 0 760 390"
          role="img"
          aria-label={
            step === 0
              ? 'Schematic divergence between expected and observed motion'
              : step === 1
                ? 'Schematic search region around a predicted position'
                : 'Schematic identification of a planet among the mapped stars'
          }
        >
          <defs>
            <pattern id="neptune-plate-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M50 0H0V50" fill="none" stroke="currentColor" strokeOpacity=".1" />
            </pattern>
          </defs>
          <rect width="760" height="390" fill="url(#neptune-plate-grid)" />
          <g className={styles.stars} fill="currentColor">
            {[
              [46, 78],
              [124, 286],
              [205, 56],
              [292, 169],
              [356, 321],
              [421, 69],
              [459, 267],
              [560, 324],
              [648, 72],
              [709, 249],
              [574, 118],
              [76, 191],
              [330, 85],
              [678, 340],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.5 : 1.2} />
            ))}
          </g>
          <g className={styles.residual} fill="none" stroke="currentColor">
            <path d="M40 307C215 310 340 153 670 154" strokeDasharray="3 6" opacity=".45" />
            <path
              className={styles.measuredPath}
              d="M40 307C215 310 340 153 670 93"
              strokeWidth="2"
            />
            <path d="M665 100v47m-6-47h12m-12 47h12" />
            <text x="475" y="199">
              Expected motion
            </text>
            <text x="440" y="90">
              Observed motion
            </text>
            <circle cx="670" cy="93" r="5" fill="currentColor" />
          </g>
          <g className={styles.search} fill="none" stroke="currentColor">
            <rect x="475" y="70" width="190" height="190" strokeDasharray="8 6" />
            <path d="M570 35v90m0 80v90M440 165h85m90 0h85" />
            <circle cx="570" cy="165" r="40" />
            <text x="451" y="330">
              A position becomes a search region
            </text>
          </g>
          <g className={styles.found}>
            <circle cx="581" cy="156" r="10" fill="#193a40" />
            <circle
              className={styles.lock}
              cx="581"
              cy="156"
              r="28"
              fill="none"
              stroke="currentColor"
            />
            <path d="M581 115v-20m0 122v-20m-61-41h20m82 0h20" fill="none" stroke="currentColor" />
            <text x="538" y="247">
              Neptune
            </text>
            <text x="513" y="270">
              Berlin · 1846
            </text>
          </g>
          <text x="22" y="374" className={styles.plateLabel}>
            Conceptual sky plate · not historical astrometry
          </text>
        </svg>
        <div className={styles.plateCorners} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
      <div className={styles.predictionControls}>
        <div className={styles.steps} aria-label="Discovery sequence">
          {stages.map((stage, i) => (
            <button
              type="button"
              key={stage.title}
              aria-pressed={step === i}
              onClick={() => setStep(i)}
            >
              <span aria-hidden="true">{i + 1}</span>
              {stage.title}
            </button>
          ))}
        </div>
        <div className={styles.stageReadouts} aria-live="polite" aria-atomic="true">
          {stages.map((stage, i) => (
            <p
              key={stage.title}
              aria-hidden={step !== i}
              style={{ visibility: step === i ? 'visible' : 'hidden' }}
            >
              {stage.text}
            </p>
          ))}
        </div>
        <p className={styles.note}>
          The paths and offset illustrate the reasoning. They do not reproduce an 1846 star chart or
          a measured positional error.
        </p>
      </div>
    </div>
  );
}
