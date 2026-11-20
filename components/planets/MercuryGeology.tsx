'use client';

import { useId, useState } from 'react';
import { useMercuryCue } from './useMercuryMotion';
import styles from './MercuryPage.module.css';

const features = [
  {
    title: 'Caloris basin',
    text: 'An enormous impact left a basin roughly 1,550 kilometres across. Later volcanic activity helped reshape Mercury’s surface.',
    label: 'Impact, then resurfacing',
  },
  {
    title: 'A planet that contracted',
    text: 'Long cliffs record the crust responding as Mercury’s interior cooled and the planet shrank.',
    label: 'A shortened crust',
  },
  {
    title: 'Ice in permanent shadow',
    text: 'Near the poles, some crater floors never receive direct sunlight. These cold traps can preserve water ice.',
    label: 'A rim that excludes the Sun',
  },
];

export default function MercuryGeology() {
  const [selected, setSelected] = useState(0);
  const { ref, arrived } = useMercuryCue<HTMLDivElement>();
  const id = useId().replace(/:/g, '');
  return (
    <section className={styles.record}>
      <div className={styles.recordHeading}>
        <p className={styles.kicker}>An ancient surface</p>
        <h2>
          IMPACTS LEAVE
          <br />
          <em>their signature.</em>
        </h2>
        <p>Select a trace. Read the process behind it.</p>
      </div>
      <div className={styles.geologyLayout}>
        <figure
          className={styles.geologyFigure}
          data-mode={selected}
          data-arrived={arrived || undefined}
        >
          <div ref={ref} className={styles.geologyStage}>
            <svg
              viewBox="0 0 800 350"
              role="img"
              aria-label={`${features[selected].label}. Illustrative geological cross-section, not a measured profile.`}
            >
              <defs>
                <clipPath id={`${id}-sky`}>
                  <path d="M0 0H800V139H620Q590 140 555 210L520 250H350L300 190Q270 145 235 139H0Z" />
                </clipPath>
              </defs>
              <path
                d="M25 300H775"
                stroke="currentColor"
                strokeOpacity=".25"
                strokeDasharray="2 8"
              />
              <g className={styles.geologyMode} data-active={selected === 0}>
                <path
                  className={styles.geoFill}
                  d="M20 170H150Q220 160 275 210Q400 290 525 210Q580 160 650 170H780V285H20Z"
                />
                <path
                  className={styles.geoTrace}
                  d="M20 170H150Q220 160 275 210Q400 290 525 210Q580 160 650 170H780"
                />
                <path
                  className={styles.geoTraceFine}
                  d="M20 200H150Q220 190 275 235Q400 307 525 235Q580 190 650 200H780M20 230H150Q210 225 255 250M545 250Q590 225 650 230H780"
                />
                <path className={styles.impactRay} d="M400 20V153m-10-12 10 12 10-12" />
                <path className={styles.basinFill} d="M285 218Q400 282 515 218" />
                <text x="412" y="43">
                  Impact
                </text>
                <text x="300" y="331">
                  A basin, later modified
                </text>
              </g>
              <g className={styles.geologyMode} data-active={selected === 1}>
                <g className={styles.scarpLeft}>
                  <path className={styles.geoFill} d="M20 175H383L490 285H20Z" />
                  <path className={styles.geoTrace} d="M20 175H383" />
                  <path className={styles.geoTraceFine} d="M20 208H410M20 240H445" />
                </g>
                <g className={styles.scarpRight}>
                  <path className={styles.geoFill} d="M380 149H780V285H490Z" />
                  <path className={styles.geoTrace} d="M380 149H780" />
                  <path className={styles.geoTraceFine} d="M410 181H780M445 215H780" />
                </g>
                <path className={styles.geoTrace} d="M380 149 490 285" strokeDasharray="5 5" />
                <path
                  className={styles.compression}
                  d="M175 82H320m-13-9 13 9-13 9M620 82H475m13-9-13 9 13 9"
                />
                <text x="280" y="42">
                  Compression
                </text>
                <text x="503" y="274">
                  Fault
                </text>
                <text x="265" y="331">
                  Shortening leaves an escarpment
                </text>
              </g>
              <g className={styles.geologyMode} data-active={selected === 2}>
                <path
                  className={styles.geoFill}
                  d="M20 139H235Q270 145 300 190L350 250H520L555 210Q590 140 620 139H780V285H20Z"
                />
                <path
                  className={styles.geoTrace}
                  d="M20 139H235Q270 145 300 190L350 250H520L555 210Q590 140 620 139H780"
                />
                <g className={styles.polarRays} clipPath={`url(#${id}-sky)`}>
                  <path d="M820 20 100 190M820 55 100 225M820 90 100 260M820 125 100 295" />
                </g>
                <path className={styles.icePatch} d="M367 245H503" />
                <text x="390" y="218">
                  Shadow
                </text>
                <text x="600" y="48">
                  Low sunlight
                </text>
                <text x="250" y="331">
                  An isolated cold trap
                </text>
              </g>
            </svg>
          </div>
          <figcaption>
            Illustrative sections. Geometry and vertical relief are exaggerated; these are not
            terrain measurements.
          </figcaption>
        </figure>
        <div className={styles.featureControls}>
        <div className={styles.featureSelectors} aria-label="Surface processes">
          {features.map((feature, i) => (
            <button
              type="button"
              key={feature.title}
              aria-pressed={selected === i}
              aria-label={feature.title}
              aria-describedby={`${id}-detail-${i}`}
              onClick={() => setSelected(i)}
            >
              <span className={styles.featureMark} aria-hidden="true">
                {i === 0 ? '◡' : i === 1 ? '⌁' : '◒'}
              </span>
              <span>
                <strong><span className={styles.featureFullName}>{feature.title}</span><span className={styles.featureShortName}>{['Caloris', 'Scarps', 'Polar ice'][i]}</span></strong>
                <span id={`${id}-detail-${i}`} className={styles.featureDetail}>{feature.text}</span>
              </span>
              <i aria-hidden="true">↗</i>
            </button>
          ))}
        </div>
        <div className={styles.featureReadout} aria-live="polite" aria-atomic="true">
          {features.map((feature,i) => <article key={feature.title} aria-hidden={selected !== i} style={{gridArea:'1 / 1',visibility:selected === i ? 'visible' : 'hidden'}}><h3>{feature.title}</h3><p>{feature.text}</p></article>)}
        </div>
        </div>
      </div>
    </section>
  );
}
