'use client';

import { useEffect, useRef, useState } from 'react';
import s from './VenusPage.module.css';

const SIDEREAL = 243; // Earth days, retrograde
const ORBIT = 224.7;
const SOLAR = 116.75; // 1 / (1/243 + 1/224.7)
const SPAN = 486; // two sidereal turns
const RATE = 24; // simulated Earth days per second

const CX = 200;
const CY = 200;
const ORBIT_R = 138;
const BODY_R = 26;

/**
 * Orbit (counter-clockwise, seen from above the north pole) and spin (clockwise, retrograde)
 * driven by one clock. The lander marker starts at local noon; it faces the Sun again
 * every 116.75 Earth days, even though one turn against the stars takes 243.
 */
export default function VenusDayClock() {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const touched = useRef(false);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const observer = new IntersectionObserver(([entry]) => {
      if (touched.current || reduced) return;
      setPlaying(entry.isIntersecting);
    }, { threshold: 0.35 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      setT((value) => (value + dt * RATE) % SPAN);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const orbitAngle = (2 * Math.PI * t) / ORBIT;
  const spinAngle = Math.PI - (2 * Math.PI * t) / SIDEREAL;
  const vx = CX + ORBIT_R * Math.cos(orbitAngle);
  const vy = CY - ORBIT_R * Math.sin(orbitAngle);
  const mx = vx + BODY_R * Math.cos(spinAngle);
  const my = vy - BODY_R * Math.sin(spinAngle);
  const solarFraction = ((t / SOLAR) % 1 + 1) % 1;
  const hourAngle = 2 * Math.PI * solarFraction;
  const noon = solarFraction < 0.012 || solarFraction > 0.988;
  const sunUp = Math.cos(hourAngle) > 0;
  // Sky strip, looking south: west on the right. Retrograde spin brings the Sun up in the west.
  const sunX = 200 - Math.sin(hourAngle) * 168;
  const sunY = 78 - Math.cos(hourAngle) * 58;

  const nextNoon = () => {
    touched.current = true;
    setPlaying(false);
    setT((value) => (Math.floor(value / SOLAR + 1e-6) + 1) * SOLAR % SPAN);
  };

  return (
    <div ref={root} className={s.clock}>
      <svg className={s.clockOrbit} viewBox="0 0 400 400" role="img" aria-label={`Venus after ${Math.round(t)} Earth days: ${(t / ORBIT).toFixed(2)} orbits, ${(t / SIDEREAL).toFixed(2)} turns against the stars, ${(t / SOLAR).toFixed(2)} solar days.`}>
        <circle cx={CX} cy={CY} r={ORBIT_R} fill="none" stroke="currentColor" strokeOpacity=".25" strokeDasharray="2 6" />
        <circle cx={CX} cy={CY} r="34" fill="url(#venus-sun)" />
        <defs>
          <radialGradient id="venus-sun"><stop offset="0" stopColor="#fff6dc" /><stop offset=".45" stopColor="#ffd27a" /><stop offset="1" stopColor="#ffb347" stopOpacity="0" /></radialGradient>
        </defs>
        <circle cx={CX} cy={CY} r="13" fill="#fff1c9" />
        <line x1={CX} y1={CY} x2={vx} y2={vy} stroke="#ffd27a" strokeOpacity=".22" />
        <g transform={`translate(${vx} ${vy})`}>
          <circle r={BODY_R} fill="#ead9ad" />
          <path d={`M0 ${-BODY_R}A${BODY_R} ${BODY_R} 0 0 1 0 ${BODY_R}Z`} fill="#2b1c0e" fillOpacity=".78" transform={`rotate(${(-orbitAngle * 180) / Math.PI})`} />
          <circle r={BODY_R} fill="none" stroke="#fff3d2" strokeOpacity=".6" />
        </g>
        <line x1={vx} y1={vy} x2={mx} y2={my} stroke={noon ? '#fff4d4' : '#e2793a'} strokeWidth="2" />
        <circle cx={mx} cy={my} r={noon ? 6 : 4.5} fill={noon ? '#fff4d4' : '#e2793a'} />
        <path d="M368 46a30 30 0 1 0 -18 52" fill="none" stroke="currentColor" strokeOpacity=".45" />
        <path d="m344 92 7 7 3-10" fill="none" stroke="currentColor" strokeOpacity=".45" />
        <text x="320" y="30" fontSize="11" fill="currentColor" fillOpacity=".7">orbit</text>
      </svg>

      <div className={s.clockSide}>
        <svg className={s.skyStrip} viewBox="0 0 400 100" role="img" aria-label={sunUp ? 'The Sun is above the horizon for the lander.' : 'It is night at the lander.'}>
          <rect width="400" height="100" fill={sunUp ? '#f2c77a' : '#20120a'} fillOpacity={sunUp ? 0.25 + Math.cos(hourAngle) * 0.45 : 0.9} />
          {sunUp && <circle cx={sunX} cy={sunY} r="9" fill="#fff1c9" />}
          <line x1="0" y1="80" x2="400" y2="80" stroke="currentColor" strokeOpacity=".5" />
          <text x="10" y="95" fontSize="11" fill="currentColor">E</text>
          <text x="382" y="95" fontSize="11" fill="currentColor">W</text>
          <text x="200" y="95" fontSize="10" fill="currentColor" fillOpacity=".7" textAnchor="middle">the lander&apos;s sky, looking south</text>
        </svg>

        <dl className={s.clockReadouts}>
          <div><dt>Earth days</dt><dd>{Math.round(t)}</dd></div>
          <div><dt>Orbits of the Sun</dt><dd>{(t / ORBIT).toFixed(2)}</dd></div>
          <div><dt>Turns against the stars</dt><dd>{(t / SIDEREAL).toFixed(2)}</dd></div>
          <div data-noon={noon}><dt>Solar days</dt><dd>{(t / SOLAR).toFixed(2)}</dd></div>
        </dl>

        <div className={s.clockControls}>
          <button type="button" aria-pressed={playing} onClick={() => { touched.current = true; setPlaying(!playing); }}>
            <span className={s.toggleLamp} aria-hidden="true" />{playing ? 'Pause' : 'Play'}
          </button>
          <button type="button" onClick={nextNoon}>Next noon</button>
          <label>
            <span>Time</span>
            <input type="range" min="0" max={SPAN} step="0.25" value={t}
              aria-valuetext={`${Math.round(t)} Earth days`}
              onChange={(event) => { touched.current = true; setPlaying(false); setT(Number(event.target.value)); }} />
          </label>
        </div>
      </div>
    </div>
  );
}
