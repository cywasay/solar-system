'use client';

import { useEffect, useId, useRef, useState } from 'react';
import styles from './UranusPage.module.css';

const seasons = [
  {
    name: 'Northern solstice',
    short: 'North summer',
    angle: 0,
    text: 'The north pole leans toward the Sun. Around this solstice, sunlight reaches across the pole, while the southern polar region remains in darkness. Rotation cannot bring the winter pole into daylight.',
  },
  {
    name: 'Equinox',
    short: 'Equinox',
    angle: 90,
    text: 'The Sun crosses the equatorial plane. Both hemispheres receive a daily light–dark cycle. The axis has kept its direction in space; the planet has moved a quarter of an orbit around the Sun.',
  },
  {
    name: 'Southern solstice',
    short: 'South summer',
    angle: 180,
    text: 'Half an orbit later, the same fixed axis points the south pole toward the Sun. Northern summer has become northern winter. Voyager 2 encountered Uranus near this seasonal configuration in 1986.',
  },
  {
    name: 'Equinox',
    short: 'Equinox',
    angle: 270,
    text: 'The Sun crosses the equatorial plane again. This completes the second transition between polar extremes. A full circuit takes about 84 Earth years, rather than the few seconds needed to move this control.',
  },
];

export default function UranusSeasons() {
  const [angle, setAngle] = useState(0);
  const currentAngle = useRef(0);
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  const moveTo = (target: number, animate: boolean) => {
    cancelAnimationFrame(frame.current);
    const setPosition = (position: number) => {
      currentAngle.current = position;
      setAngle(position);
    };
    if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPosition(target);
      return;
    }
    const from = currentAngle.current;
    const distance = ((target - from + 540) % 360) - 180;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 900);
      const eased = progress * progress * (3 - 2 * progress);
      setPosition(progress === 1 ? target : (from + distance * eased + 360) % 360);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };
  const id = useId().replace(/:/g, '');
  const radians = (angle * Math.PI) / 180;
  const declination =
    (Math.asin(Math.sin((97.77 * Math.PI) / 180) * Math.cos(radians)) * 180) / Math.PI;
  const season = seasons[Math.floor(((angle + 45) % 360) / 90)];
  const x = 230 - 164 * Math.cos(radians);
  const y = 210 + 130 * Math.sin(radians);
  return (
    <div className={styles.seasonStudy} data-arrival>
      <div className={styles.seasonGraphic}>
        <svg
          viewBox="0 0 460 420"
          role="img"
          aria-label={`Uranus seasonal geometry. Solar declination ${declination.toFixed(1)} degrees; north is towards the right in this orbital view.`}
        >
          <defs>
            <radialGradient id={`${id}-sun`}>
              <stop stopColor="#f3f5da" />
              <stop offset="1" stopColor="#a9cfc0" />
            </radialGradient>
            <radialGradient
              id={`${id}-planet`}
              cx={`${50 + Math.cos(radians) * 35}%`}
              cy={`${50 - Math.sin(radians) * 35}%`}
            >
              <stop stopColor="#d4e8df" />
              <stop offset="1" stopColor="#42696c" />
            </radialGradient>
          </defs>
          <circle
            className={styles.orbitTrack}
            cx="230"
            cy="210"
            r="164"
            transform="translate(0 43.5) scale(1 .793)"
            fill="none"
          />
          <path
            d="M30 210h400M230 36v348"
            stroke="#b6d4cc"
            strokeOpacity=".16"
            strokeDasharray="2 8"
          />
          <circle cx="230" cy="210" r="28" fill={`url(#${id}-sun)`} />
          <text x="230" y="258" textAnchor="middle">
            Sun
          </text>
          {seasons.map((s, i) => {
            const t = (i * Math.PI) / 2;
            const px = 230 - 164 * Math.cos(t),
              py = 210 + 130 * Math.sin(t);
            return (
              <g key={i} opacity=".45">
                <circle cx={px} cy={py} r="14" fill="none" stroke="currentColor" />
                <path d={`M${px - 23} ${py + 3}l46 -6`} stroke="currentColor" />
                <text x={px + 27} y={py - 6} fontSize="10">
                  N
                </text>
              </g>
            );
          })}
          <line
            className={styles.sunRay}
            x1="230"
            y1="210"
            x2={x}
            y2={y}
            stroke="#d2e8df"
            strokeDasharray="4 7"
          />
          <g transform={`translate(${x} ${y})`}>
            <circle r="24" fill={`url(#${id}-planet)`} />
            <path d="M-39 5 39-5" stroke="#e6f6ed" strokeWidth="1.5" />
            <circle cx="39" cy="-5" r="3" fill="#e6f6ed" />
            <text x="44" y="-10">
              N
            </text>
          </g>
          <text x="230" y="407" textAnchor="middle">
            Orbital view · north axes stay parallel
          </text>
        </svg>
      </div>
      <div className={styles.seasonReadout}>
        <p className={styles.kicker}>Move the planet. Keep the axis.</p>
        <h3>{season.name}</h3>
        <div className={styles.declination}>
          <span>
            {declination > 0 ? '+' : ''}
            {declination.toFixed(1)}°
          </span>
          <p>
            Solar declination
            <br />
            latitude of the overhead Sun
          </p>
        </div>
        <div className={styles.seasonExplanation} aria-live="polite" aria-atomic="true">
          {seasons.map((s, i) => (
            <p
              key={i}
              aria-hidden={season !== s}
              style={{
                gridArea: '1 / 1',
                visibility: season === s ? 'visible' : 'hidden',
                margin: 0,
              }}
            >
              {s.text}
            </p>
          ))}
        </div>
        <label className={styles.rangeLabel} htmlFor={`${id}-position`}>
          Position through one orbit <span>{Math.round((angle / 360) * 84)} / 84 years</span>
        </label>
        <input
          id={`${id}-position`}
          type="range"
          min="0"
          max="359"
          value={Math.round(angle)}
          onChange={(event) => moveTo(Number(event.target.value), false)}
          aria-valuetext={`${Math.round(angle)} degrees through the orbit; solar declination ${declination.toFixed(1)} degrees`}
        />
        <div className={styles.presets}>
          {seasons.map((s, i) => (
            <button
              type="button"
              key={i}
              aria-label={
                i === 1 ? 'Southern spring equinox' : i === 3 ? 'Northern spring equinox' : s.short
              }
              aria-pressed={angle === s.angle}
              onClick={() => moveTo(s.angle, true)}
            >
              {s.short}
            </button>
          ))}
        </div>
        <p className={styles.note}>
          Illustrative circular orbit and enlarged bodies; time and distance compressed. Declination
          uses a fixed 97.77° obliquity. This is seasonal geometry, not a weather forecast.
        </p>
      </div>
    </div>
  );
}
