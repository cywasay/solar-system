'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  DISCOVERY, EARTH_MASS, LE_VERRIER, PLANETS, START, TABLES, elementState, explained, geocentric, integrateUranus, prepare, residual, trialPosition,
  type Series, type Trial,
} from './neptune/orbits';
import s from './NeptunePage.module.css';

const MAP_R = 48; // AU shown from the Sun to the edge of the map
const DEG = Math.PI / 180;
const INITIAL: Trial = { a: 41, mass: 24 * EARTH_MASS, longitude: 245 };

type Model = { base: Series; observed: Float64Array; years: Float64Array; noisy: Float64Array; peak: number };

const angle = (deg: number) => (deg < 1 ? `${Math.round(deg * 60)}′` : `${deg.toFixed(1)}°`);
const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** The baseline and the "observed" drift (with a little scatter for display), computed once on first use. */
let cached: Model | null = null;
function getModel(): Model {
  if (cached) return cached;
  const m = prepare();
  const noisy = new Float64Array(m.observed.length);
  let peak = 1;
  for (let i = 0; i < noisy.length; i++) {
    const g = (hash(i) + hash(i + 0.5) + hash(i + 0.25) - 1.5) * 2;
    noisy[i] = m.observed[i] + g * 4;
    peak = Math.max(peak, Math.abs(m.observed[i]));
  }
  cached = { ...m, noisy, peak };
  return cached;
}

function setupCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx?.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

/**
 * The 1846 problem as a bench: drag a hypothetical planet around the outer Solar System until its
 * pull explains why Uranus drifted off its tables, then point a telescope where it says to look.
 */
export default function NeptuneHunt() {
  const mapRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const skyRef = useRef<HTMLCanvasElement>(null);
  const fitRef = useRef<Float64Array | null>(null);
  const frame = useRef(0);
  const [trial, setTrial] = useState<Trial>(INITIAL);
  const [year, setYear] = useState(1822);
  const [score, setScore] = useState(0);
  const [pointed, setPointed] = useState(false);
  const dragging = useRef(false);

  const trialRef = useRef(trial);
  const yearRef = useRef(year);
  const pointedRef = useRef(pointed);
  useLayoutEffect(() => {
    trialRef.current = trial;
    yearRef.current = year;
    pointedRef.current = pointed;
  });

  const drawMap = useCallback(() => {
    const canvas = mapRef.current;
    if (!canvas) return;
    const { ctx, w, h } = setupCanvas(canvas);
    if (!ctx) return;
    const t = trialRef.current;
    const y = yearRef.current;
    const cx = w / 2;
    const cy = h / 2;
    const k = (Math.min(w, h) / 2 - 12) / MAP_R;
    const at = (x: number, yy: number): [number, number] => [cx + x * k, cy - yy * k];
    // Distance rings every 10 AU.
    ctx.strokeStyle = 'rgba(159, 183, 230, 0.12)';
    ctx.lineWidth = 1;
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(159, 183, 230, 0.45)';
    for (let r = 10; r <= 40; r += 10) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * k, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillText(`${r} AU`, cx + r * k * 0.71 + 4, cy - r * k * 0.71);
    }
    // Planets that were known: Jupiter, Saturn, and Uranus with its path since 1781.
    const dot = (x: number, yy: number, r: number, color: string) => {
      const [px, py] = at(x, yy);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
      return [px, py] as const;
    };
    ctx.fillStyle = '#ffd38a';
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fill();
    const j = elementState(PLANETS.jupiter, y);
    dot(j.x, j.y, 2, '#d7b48a');
    const sat = elementState(PLANETS.saturn, y);
    dot(sat.x, sat.y, 2, '#e5d3a0');
    ctx.strokeStyle = 'rgba(143, 220, 230, 0.35)';
    ctx.beginPath();
    for (let yy = START; yy <= DISCOVERY; yy += 0.5) {
      const u = elementState(PLANETS.uranus, yy);
      const [px, py] = at(u.x, u.y);
      if (yy === START) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    const u = elementState(PLANETS.uranus, y);
    const g = trialPosition(t, y);
    // The pull between them.
    const [ux, uy] = at(u.x, u.y);
    const [gx, gy] = at(g.x, g.y);
    ctx.strokeStyle = 'rgba(243, 199, 107, 0.35)';
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(ux, uy);
    ctx.lineTo(gx, gy);
    ctx.stroke();
    // The trial planet's orbit and position.
    ctx.strokeStyle = 'rgba(243, 199, 107, 0.4)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(cx, cy, t.a * k, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    dot(u.x, u.y, 4, '#8fdce6');
    ctx.fillStyle = '#8fdce6';
    ctx.fillText('Uranus', ux + 8, uy + 4);
    // The real Neptune, once the telescope has been pointed.
    if (pointedRef.current) {
      const n = elementState(PLANETS.neptune, y);
      ctx.strokeStyle = 'rgba(111, 168, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(cx, cy, 30.07 * k, 0, Math.PI * 2);
      ctx.stroke();
      const [nx, ny] = dot(n.x, n.y, 4.5, '#6fa8ff');
      ctx.fillStyle = '#6fa8ff';
      ctx.fillText('Neptune', nx + 8, ny + 4);
    }
    const r = 7 + Math.sqrt(t.mass / EARTH_MASS) * 0.9;
    const halo = ctx.createRadialGradient(gx, gy, 0, gx, gy, r * 2.4);
    halo.addColorStop(0, 'rgba(243, 199, 107, 0.55)');
    halo.addColorStop(1, 'rgba(243, 199, 107, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(gx, gy, r * 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f3c76b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(gx, gy, r * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f3c76b';
    ctx.fillText('your planet', gx + r + 4, gy - r);
    ctx.fillStyle = 'rgba(159, 183, 230, 0.6)';
    ctx.fillText(String(Math.floor(y)), 10, h - 10);
  }, []);

  const drawChart = useCallback(() => {
    const canvas = chartRef.current;
    if (!canvas) return;
    const m = getModel();
    const { ctx, w, h } = setupCanvas(canvas);
    if (!ctx) return;
    const left = 46;
    const right = 10;
    const top = 14;
    const bottom = h - 26;
    const span = Math.max(60, Math.ceil((m.peak * 1.25) / 30) * 30);
    const X = (yr: number) => left + ((yr - START) / (DISCOVERY - START)) * (w - left - right);
    const Y = (v: number) => (top + bottom) / 2 - (v / span) * ((bottom - top) / 2);
    // The years Bouvard's tables were fitted to.
    ctx.fillStyle = 'rgba(159, 183, 230, 0.06)';
    ctx.fillRect(X(START), top, X(TABLES) - X(START), bottom - top);
    ctx.fillStyle = 'rgba(159, 183, 230, 0.5)';
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('orbit fitted to these years', X(START) + 6, top + 12);
    ctx.strokeStyle = 'rgba(159, 183, 230, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const v of [-span, -span / 2, 0, span / 2, span]) { ctx.moveTo(left, Y(v)); ctx.lineTo(w - right, Y(v)); }
    ctx.stroke();
    ctx.textAlign = 'right';
    for (const v of [-span, 0, span]) ctx.fillText(Math.abs(v) >= 60 ? `${v > 0 ? '+' : v < 0 ? '−' : ''}${(Math.abs(v) / 60).toFixed(1)}′` : '0', left - 6, Y(v) + 3);
    ctx.textAlign = 'center';
    for (const yr of [1790, 1810, 1830, 1846]) ctx.fillText(String(yr), X(yr), h - 8);
    // Year cursor.
    ctx.strokeStyle = 'rgba(243, 199, 107, 0.35)';
    ctx.beginPath();
    ctx.moveTo(X(yearRef.current), top);
    ctx.lineTo(X(yearRef.current), bottom);
    ctx.stroke();
    // Observations (the model with the real Neptune, plus a little scatter).
    ctx.fillStyle = '#e7edf7';
    for (let i = 0; i < m.noisy.length; i += 2) {
      ctx.beginPath();
      ctx.arc(X(m.years[i]), Y(m.noisy[i]), 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    // The drift your planet would cause.
    const fit = fitRef.current;
    if (fit) {
      ctx.strokeStyle = '#f3c76b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < fit.length; i++) {
        const px = X(m.years[i]);
        const py = Y(Math.max(-span * 1.2, Math.min(span * 1.2, fit[i])));
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }, []);

  const drawSky = useCallback(() => {
    const canvas = skyRef.current;
    if (!canvas) return;
    const { ctx, w, h } = setupCanvas(canvas);
    if (!ctx) return;
    const t = trialRef.current;
    const g = trialPosition(t, DISCOVERY);
    const center = geocentric(g.x, g.y, DISCOVERY);
    const n = elementState(PLANETS.neptune, DISCOVERY);
    const nep = geocentric(n.x, n.y, DISCOVERY);
    const lvp = trialPosition(LE_VERRIER, DISCOVERY);
    const lv = geocentric(lvp.x, lvp.y, DISCOVERY);
    const spanDeg = 14;
    const pxPerDeg = w / spanDeg;
    const wrap = (d: number) => ((d + 540) % 360) - 180;
    // Longitude increases to the left on a sky chart (east is left when facing south).
    const X = (lon: number) => w / 2 - wrap(lon - center) * pxPerDeg;
    const mid = h / 2;
    // Background stars, fixed to the sky.
    for (let cell = Math.floor(center - spanDeg); cell <= Math.ceil(center + spanDeg); cell++) {
      const c = ((cell % 360) + 360) % 360;
      for (let i = 0; i < 14; i++) {
        const lon = c + hash(c * 31 + i);
        const lat = (hash(c * 17 + i * 3.1) - 0.5) * (h / pxPerDeg);
        const mag = hash(c * 7 + i * 1.7);
        const x = X(lon);
        if (x < -4 || x > w + 4) continue;
        ctx.fillStyle = `rgba(231, 237, 247, ${0.25 + mag * 0.6})`;
        ctx.beginPath();
        ctx.arc(x, mid - lat * pxPerDeg, 0.6 + mag * mag * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.strokeStyle = 'rgba(159, 183, 230, 0.22)';
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(w, mid);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '10.5px ui-monospace, monospace';
    // Your pointing: a field about one degree across, roughly what Galle swept that night.
    ctx.strokeStyle = '#f3c76b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(w / 2, mid, pxPerDeg * 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f3c76b';
    ctx.textAlign = 'center';
    ctx.fillText('where you pointed', w / 2, mid - pxPerDeg * 0.5 - 8);
    const mark = (lon: number, label: string, color: string, filled: boolean, labelY: number) => {
      let x = X(lon);
      const inside = x > 10 && x < w - 10;
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      if (inside) {
        ctx.beginPath();
        ctx.arc(x, mid, filled ? 4 : 3.5, 0, Math.PI * 2);
        if (filled) ctx.fill(); else ctx.stroke();
        ctx.fillText(label, x, mid + labelY);
      } else {
        const dir = x <= 10 ? -1 : 1;
        x = dir < 0 ? 18 : w - 18;
        ctx.beginPath();
        ctx.moveTo(x + dir * 8, mid);
        ctx.lineTo(x - dir * 2, mid - 6);
        ctx.lineTo(x - dir * 2, mid + 6);
        ctx.fill();
        ctx.textAlign = dir < 0 ? 'left' : 'right';
        ctx.fillText(`${label} ${Math.abs(wrap(lon - center)).toFixed(0)}°`, x - dir * 6, mid + 22);
        ctx.textAlign = 'center';
      }
    };
    mark(lv, 'Le Verrier', 'rgba(231, 237, 247, 0.85)', false, 24);
    mark(nep, 'Neptune', '#6fa8ff', true, -12);
  }, []);

  const drawAll = useCallback(() => { drawMap(); drawChart(); if (pointedRef.current) drawSky(); }, [drawMap, drawChart, drawSky]);

  // Re-run the integration whenever the trial planet changes (at most once a frame).
  useEffect(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const m = getModel();
      const fit = residual(integrateUranus(trial), m.base);
      fitRef.current = fit;
      setScore(explained(m.observed, fit));
      drawAll();
    });
    return () => cancelAnimationFrame(frame.current);
  }, [trial, drawAll]);

  useEffect(() => { drawAll(); }, [year, pointed, drawAll]);
  useEffect(() => {
    const ro = new ResizeObserver(() => drawAll());
    if (mapRef.current) ro.observe(mapRef.current);
    if (chartRef.current) ro.observe(chartRef.current);
    if (skyRef.current) ro.observe(skyRef.current);
    return () => ro.disconnect();
  }, [drawAll, pointed]);

  const fromPointer = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const k = (Math.min(rect.width, rect.height) / 2 - 12) / MAP_R;
    const x = (event.clientX - rect.left - rect.width / 2) / k;
    const y = -(event.clientY - rect.top - rect.height / 2) / k;
    const a = Math.max(21.5, Math.min(MAP_R - 1, Math.hypot(x, y)));
    // The map shows the chosen year; convert the dragged angle back to the 1846 longitude.
    const n = Math.sqrt((0.01720209895 ** 2) * (1 + trialRef.current.mass) / a ** 3) * 365.25;
    const lonNow = Math.atan2(y, x);
    const lon = (((lonNow - n * (yearRef.current - DISCOVERY)) / DEG) % 360 + 360) % 360;
    setTrial((t) => ({ ...t, a, longitude: lon }));
  };

  const nepLon = (() => { const n = elementState(PLANETS.neptune, DISCOVERY); return geocentric(n.x, n.y, DISCOVERY); })();
  const g = trialPosition(trial, DISCOVERY);
  const miss = Math.abs(((geocentric(g.x, g.y, DISCOVERY) - nepLon + 540) % 360) - 180);
  const lvMiss = (() => { const p = trialPosition(LE_VERRIER, DISCOVERY); return Math.abs(((geocentric(p.x, p.y, DISCOVERY) - nepLon + 540) % 360) - 180); })();
  const pct = Math.round(score * 100);
  const earths = Math.round(trial.mass / EARTH_MASS);

  return (
    <div className={s.hunt}>
      <div className={s.huntGrid}>
        <figure className={s.mapBox}>
          <canvas
            ref={mapRef}
            className={s.mapCanvas}
            role="img"
            aria-label={`Map of the outer Solar System in ${Math.floor(year)}: the Sun, Jupiter, Saturn, Uranus, and your trial planet at ${trial.a.toFixed(1)} AU`}
            onPointerDown={(event) => { dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId); fromPointer(event); }}
            onPointerMove={(event) => { if (dragging.current) fromPointer(event); }}
            onPointerUp={() => { dragging.current = false; }}
            onPointerCancel={() => { dragging.current = false; }}
          />
          <figcaption>Drag your planet anywhere on the map. Seen from above, planets move anticlockwise.</figcaption>
        </figure>

        <div className={s.huntSide}>
          <div className={s.scoreRow}>
            <p className={s.score}><b>{pct}%</b> of Uranus’s drift explained</p>
            <div className={s.scoreBar} aria-hidden="true"><i style={{ transform: `scaleX(${score})` }} /></div>
          </div>
          <figure className={s.chartBox}>
            <canvas ref={chartRef} className={s.chartCanvas} role="img" aria-label={`Uranus’s drift from its 1821 tables, 1781 to 1846, against the drift your planet would cause. Your planet explains ${pct} percent.`} />
            <figcaption><i className={s.keyObs} /> Uranus, observed (model) <i className={s.keyFit} /> the drift your planet would cause</figcaption>
          </figure>
          <div className={s.controls}>
            <label><span>Distance <b>{trial.a.toFixed(1)} AU</b></span><input type="range" min={21.5} max={47} step={0.1} value={trial.a} onChange={(e) => setTrial((t) => ({ ...t, a: Number(e.target.value) }))} /></label>
            <label><span>Mass <b>{earths} Earths</b></span><input type="range" min={2} max={90} step={1} value={earths} onChange={(e) => setTrial((t) => ({ ...t, mass: Number(e.target.value) * EARTH_MASS }))} /></label>
            <label><span>Where it is in 1846 <b>{Math.round(trial.longitude)}°</b></span><input type="range" min={0} max={359} step={1} value={Math.round(trial.longitude)} onChange={(e) => setTrial((t) => ({ ...t, longitude: Number(e.target.value) }))} /></label>
            <label><span>Show the year <b>{Math.floor(year)}</b></span><input type="range" min={1781} max={1846} step={1} value={Math.floor(year)} onChange={(e) => setYear(Number(e.target.value))} /></label>
          </div>
          <div className={s.buttons}>
            <button type="button" onClick={() => setTrial({ ...LE_VERRIER })}>Try Le Verrier’s answer</button>
            <button type="button" className={s.primary} onClick={() => setPointed(true)}>Point the telescope · 23 Sep 1846</button>
            <button type="button" onClick={() => { setTrial(INITIAL); setPointed(false); }}>Start over</button>
          </div>
        </div>
      </div>

      {pointed && (
        <figure className={s.skyBox}>
          <canvas ref={skyRef} className={s.skyCanvas} role="img" aria-label={`Sky chart around where you pointed. Neptune is ${miss.toFixed(1)} degrees away.`} />
          <figcaption>
            Your planet would sit <b>{angle(miss)}</b> from Neptune.
            {' '}In this model Le Verrier’s answer lands {angle(lvMiss)} from it; Galle found Neptune within about 1° of his prediction, on the first night of searching.
            {' '}Several distances and masses fit nearly as well; each points somewhere slightly different, but the residual narrows the search to a small part of the sky.
          </figcaption>
        </figure>
      )}
      <p className={s.benchNote}>A simplified model: Uranus is integrated from 1781 under the Sun, Jupiter, Saturn and your planet, all in one plane, and the best Uranus orbit for 1781–1821 is removed, as Bouvard’s tables did. The “observations” are the same model run with the real Neptune, not the historical records. Trial planets move on circles.</p>
    </div>
  );
}
