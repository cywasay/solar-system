'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import s from './MarsPage.module.css';

/* ------------------------------------------------------------------ Jezero */

const CX = 300;
const CY = 214;
const RIM = 166;
const INLET = { x: 140, y: 196 };

/**
 * Hold to fill the crater. The shoreline spreads from the floor; once it reaches the inlet
 * the river drops its sediment and a delta builds. Let go and the lake evaporates, but the
 * delta does not: water leaves, evidence stays. Drawn by attribute and transform writes in
 * one rAF loop that runs only while something is changing.
 */
export function MarsLake() {
  const water = useRef<SVGCircleElement>(null);
  const fanEl = useRef<SVGGElement>(null);
  const lakeRead = useRef<HTMLElement>(null);
  const fanRead = useRef<HTMLElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [holding, setHolding] = useState(false);
  const [phase, setPhase] = useState<'dry' | 'wet' | 'evidence'>('dry');
  const state = useRef({ level: 0, fan: 0, holding: false, frame: 0, last: 0 });

  useEffect(() => {
    const current = state.current;
    return () => cancelAnimationFrame(current.frame);
  }, []);

  const paint = () => {
    const { level, fan } = state.current;
    water.current?.setAttribute('r', (Math.max(0, level) * (RIM - 6)).toFixed(1));
    if (fanEl.current) fanEl.current.style.transform = `scale(${Math.max(0.001, fan).toFixed(3)})`;
    if (lakeRead.current) lakeRead.current.textContent = `${Math.round(level * 100)}%`;
    if (fanRead.current) fanRead.current.textContent = `${Math.round(fan * 100)}%`;
  };

  const loop = (now: number) => {
    const st = state.current;
    st.frame = 0;
    const dt = st.last ? Math.min(0.05, (now - st.last) / 1000) : 0;
    st.last = now;
    if (st.holding) {
      st.level = Math.min(1, st.level + dt * 0.42);
      if (st.level > 0.9) st.fan = Math.min(1, st.fan + dt * 0.22);
    } else {
      st.level = Math.max(0, st.level - dt * 0.14);
    }
    paint();
    setPhase(st.level > 0.02 ? 'wet' : st.fan > 0.05 ? 'evidence' : 'dry');
    if (st.holding || st.level > 0) st.frame = requestAnimationFrame(loop);
    else st.last = 0;
  };

  const hold = (on: boolean) => {
    const st = state.current;
    if (st.holding === on) return;
    st.holding = on;
    setHolding(on);
    root.current?.toggleAttribute('data-flowing', on);
    if (!st.frame) {
      st.last = 0;
      st.frame = requestAnimationFrame(loop);
    }
  };
  const keys = (event: KeyboardEvent<HTMLButtonElement>, on: boolean) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    if (on && event.repeat) return;
    hold(on);
  };
  const reset = () => {
    state.current.fan = 0;
    state.current.level = 0;
    paint();
    setPhase('dry');
  };

  return (
    <div ref={root} className={s.lake}>
      <svg viewBox="0 0 520 420" role="img" aria-label="Schematic of Jezero crater from above: a rim, an inlet valley from the west, and a lake and delta that build while you hold the button.">
        <defs>
          <radialGradient id="mars-crater-floor" cx="0.45" cy="0.42">
            <stop offset="0" stopColor="#b97a4e" />
            <stop offset="1" stopColor="#7d4a2c" />
          </radialGradient>
          <clipPath id="mars-crater-clip"><circle cx={CX} cy={CY} r={RIM - 4} /></clipPath>
        </defs>
        <rect width="520" height="420" fill="#a8693f" />
        <path className={s.inlet} d={`M0 150C40 160 62 132 92 168S120 196 ${INLET.x} ${INLET.y}`} />
        <circle cx={CX} cy={CY} r={RIM + 16} fill="none" stroke="#c98a5a" strokeWidth="26" strokeOpacity=".55" />
        <circle cx={CX} cy={CY} r={RIM} fill="url(#mars-crater-floor)" stroke="#5a301a" strokeWidth="3" />
        <g clipPath="url(#mars-crater-clip)">
          <circle ref={water} cx={CX} cy={CY} r="0" fill="#6d93b3" fillOpacity=".82" />
          <g ref={fanEl} className={s.fan} style={{ transformOrigin: `${INLET.x}px ${INLET.y}px` }}>
            <path d={`M${INLET.x} ${INLET.y}C190 150 236 162 242 196C248 234 206 252 ${INLET.x} ${INLET.y + 8}Z`} fill="#d9a46e" />
            <path d={`M${INLET.x} ${INLET.y}C176 172 206 180 214 198M${INLET.x} ${INLET.y + 4}C180 214 204 222 222 226`} stroke="#8a5530" strokeWidth="2" fill="none" />
          </g>
        </g>
        <text x={CX} y={CY + RIM + 34} textAnchor="middle" fontSize="12" fill="#2a160c">Jezero crater · about 45 km across</text>
        <text x="8" y="136" fontSize="11" fill="#2a160c">inlet valley</text>
      </svg>
      <div className={s.lakeControls}>
        <button type="button" className={s.holdButton} aria-pressed={holding}
          onPointerDown={(event) => { try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer already gone */ } hold(true); }}
          onPointerUp={() => hold(false)} onPointerCancel={() => hold(false)} onLostPointerCapture={() => hold(false)}
          onKeyDown={(event) => keys(event, true)} onKeyUp={(event) => keys(event, false)} onContextMenu={(event) => event.preventDefault()}>
          <span className={s.holdFill} aria-hidden="true" />
          {holding ? 'Filling… keep holding' : 'Hold to fill the lake'}
        </button>
        <dl className={s.lakeRead}>
          <div><dt>Lake</dt><dd ref={lakeRead}>0%</dd></div>
          <div><dt>Delta deposit</dt><dd ref={fanRead}>0%</dd></div>
        </dl>
        <p className={s.lakeVerdict} aria-live="polite">
          {phase === 'evidence' ? 'The water is gone. The delta stays.' : phase === 'wet' ? 'Sediment drops where the river meets still water.' : 'A dry basin. Add water.'}
        </p>
        {phase === 'evidence' && <button type="button" className={s.textButton} onClick={reset}>Reset the basin</button>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Atmosphere */

const EW = 640;
const EH = 340;
const PLANET = { x: EW / 2, y: EH + 520, r: 600 };

/**
 * Atmospheric escape: particles leave the top of the atmosphere; a solar storm drives
 * many more away for a few seconds. A small 2D canvas, drawn only while on screen.
 */
export function MarsEscape() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const storm = useRef(0);
  const [stormy, setStormy] = useState(false);

  useEffect(() => {
    const surface = canvas.current;
    const ctx = surface?.getContext('2d');
    if (!surface || !ctx) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    surface.width = EW * ratio;
    surface.height = EH * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    type P = { a: number; h: number; v: number; drift: number; escaping: boolean };
    const spawn = (p?: P): P => {
      const next = p ?? ({} as P);
      next.a = -Math.PI / 2 + (rand() - 0.5) * 1.1;
      next.h = rand() * 34;
      next.v = 6 + rand() * 10;
      next.drift = (rand() - 0.5) * 0.04;
      next.escaping = rand() < 0.22;
      return next;
    };
    const particles = Array.from({ length: 170 }, () => spawn());
    let frame = 0;
    let last = 0;
    let visible = true;

    const draw = () => {
      ctx.clearRect(0, 0, EW, EH);
      const glow = ctx.createRadialGradient(PLANET.x, PLANET.y, PLANET.r - 4, PLANET.x, PLANET.y, PLANET.r + 70);
      glow.addColorStop(0, 'rgba(233, 170, 120, 0.55)');
      glow.addColorStop(1, 'rgba(233, 170, 120, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, EW, EH);
      ctx.fillStyle = '#9c4a26';
      ctx.beginPath();
      ctx.arc(PLANET.x, PLANET.y, PLANET.r, 0, Math.PI * 2);
      ctx.fill();
      for (const p of particles) {
        const r = PLANET.r + p.h;
        const x = PLANET.x + Math.cos(p.a) * r;
        const y = PLANET.y + Math.sin(p.a) * r;
        const height = Math.min(1, p.h / 220);
        ctx.fillStyle = p.escaping ? `rgba(185, 212, 255, ${1 - height * 0.6})` : `rgba(255, 220, 182, ${0.95 - height})`;
        ctx.fillRect(x - 1.3, y - 1.3, p.escaping ? 3 : 2.6, p.escaping ? 3 : 2.6);
      }
    };
    const tick = (now: number) => {
      frame = 0;
      if (!visible || document.hidden) {
        last = 0;
        return;
      }
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      storm.current = Math.max(0, storm.current - dt / 5);
      const boost = 1 + storm.current * 3.5;
      for (const p of particles) {
        if (p.escaping) {
          p.h += p.v * dt * 3 * boost;
          p.a += p.drift * dt * boost;
        } else {
          p.h += Math.sin(now / 900 + p.a * 40) * dt * 6;
          if (rand() < 0.0025 * boost) p.escaping = true;
        }
        if (p.h > 380 || p.h < 0) spawn(p);
      }
      draw();
      if (!reduced) frame = requestAnimationFrame(tick);
      if (storm.current === 0 && stormyRef.current) {
        stormyRef.current = false;
        setStormy(false);
      }
    };
    const stormyRef = { current: false };
    startStorm.current = () => {
      storm.current = 1;
      stormyRef.current = true;
      setStormy(true);
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) frame = requestAnimationFrame(tick);
    });
    observer.observe(surface);
    draw();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);
  const startStorm = useRef<() => void>(() => {});

  return (
    <div className={s.escape}>
      <canvas ref={canvas} className={s.escapeCanvas} role="img" aria-label="Gas at the top of the Martian atmosphere: most stays bound, some escapes to space, and more escapes during a solar storm." />
      <div className={s.escapeControls}>
        <button type="button" className={s.stormButton} onClick={() => startStorm.current()} disabled={stormy}>
          {stormy ? 'Storm passing…' : 'Send a solar storm'}
        </button>
        <span className={s.escapeKey} aria-hidden="true"><i data-kind="bound" />bound <i data-kind="escaping" />escaping</span>
      </div>
    </div>
  );
}
