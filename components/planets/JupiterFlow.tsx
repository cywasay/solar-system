'use client';

import { useEffect, useRef, useState } from 'react';
import s from './JupiterPage.module.css';

const duration = 7200;
const colors = ['#f7d8ab', '#cf7d60', '#a9c6cf', '#ecaa80'];
const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const ease = (v: number) => { const t = clamp(v); return t * t * (3 - 2 * t); };

// A stylized velocity field in height-normalized coordinates. The evolving
// oval changes the direction of the tracers; no observed wind data is implied.
function velocity(x: number, y: number, ratio: number, strength: number, roll: number) {
  const dx = (x - ratio * .57) / 1.52;
  const dy = y - .51;
  const r2 = dx * dx + dy * dy;
  const swirl = roll * strength * 2.7 * Math.exp(-r2 * 8.5);
  const jet = .31 * Math.sin((.50 - y) * 10.5) * strength;
  return [jet * (1 - Math.min(.83, swirl * .26)) - dy * swirl * 1.52, dx * swirl] as const;
}

export default function JupiterFlow() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const frameBox = useRef<HTMLDivElement>(null);
  const replay = useRef<() => void>(() => {});
  const adjust = useRef<() => void>(() => {});
  const strengthValue = useRef(1);
  const [strength, setStrength] = useState(100);

  useEffect(() => {
    const canvasElement = canvas.current;
    const frameElement = frameBox.current;
    const context = canvasElement?.getContext('2d');
    if (!canvasElement || !frameElement || !context) return;
    const surface = canvasElement;
    const frame = frameElement;
    const ctx = context;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = matchMedia('(max-width:760px)');
    let width = 1;
    let height = 1;
    let ratio = 1;
    let scrollProgress = 0;
    let displayProgress = 0;
    let frameId = 0;
    let elapsed = 0;
    let lastFrame = 0;
    let playing = false;
    let visible = false;
    let seed = 12;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const particles = Array.from({ length: 300 }, (_, i) => ({
      x: random(), y: random(), drift: .65 + random() * .75, color: colors[i % colors.length],
    }));

    function paint(progress: number) {
      displayProgress = progress;
      const strength = strengthValue.current;
      const roll = ease((progress - .12) / .54);
      const count = mobile.matches ? 132 : particles.length;
      const integrations = mobile.matches ? 10 : 16;
      const tailSteps = mobile.matches ? 6 : 9;
      const driftTime = progress * 4 / integrations;
      const rolls = Array.from({ length: integrations }, (_, step) => ease(((step + 1) * progress / integrations - .12) / .54));
      ctx.clearRect(0, 0, width, height);

      // Positions come from fixed seeds and scroll time, so reverse scrolling
      // retraces the same current without playing an animation backwards.
      for (let i = 0; i < count; i++) {
        const particle = particles[i];
        let x = particle.x * ratio;
        let y = particle.y;
        for (const strengthOfVortex of rolls) {
          const [u, v] = velocity(x, y, ratio, strength, strengthOfVortex);
          x += u * driftTime * particle.drift;
          y += v * driftTime * particle.drift;
          if (x < 0) x += ratio;
          if (x > ratio) x -= ratio;
          y = clamp(y);
        }

        const startX = x * height;
        const startY = y * height;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (let step = 0; step < tailSteps; step++) {
          const [u, v] = velocity(x, y, ratio, strength, roll);
          x -= u * .028 * particle.drift;
          y -= v * .028 * particle.drift;
          ctx.lineTo(x * height, y * height);
        }
        const tail = ctx.createLinearGradient(startX, startY, x * height + .001, y * height + .001);
        tail.addColorStop(0, particle.color);
        tail.addColorStop(1, `${particle.color}00`);
        ctx.strokeStyle = tail;
        ctx.globalAlpha = .27 + particle.drift * .32;
        ctx.lineWidth = i % 6 === 0 ? 1.45 : .75;
        ctx.stroke();
        if (i % 5 === 0) {
          ctx.beginPath();
          ctx.arc(startX, startY, i % 10 === 0 ? 1.6 : .85, 0, Math.PI * 2);
          ctx.fillStyle = particle.color;
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      frame.style.setProperty('--ju-vortex', String(roll));
      const phase = progress < .24 ? 'jets' : progress < .59 ? 'shear' : 'vortex';
      if (frame.dataset.phase !== phase) frame.dataset.phase = phase;
    }

    function resize() {
      width = Math.max(frame.clientWidth, 1);
      height = Math.max(frame.clientHeight, 1);
      ratio = width / height;
      const dpr = Math.min(devicePixelRatio || 1, mobile.matches ? 1 : 1.5);
      surface.width = Math.round(width * dpr);
      surface.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(motion.matches ? 1 : displayProgress);
    }

    function pause() {
      cancelAnimationFrame(frameId);
      frameId = 0;
      lastFrame = 0;
    }

    function tick(now: number) {
      frameId = 0;
      if (!playing || !visible || document.hidden || motion.matches) return;
      if (!lastFrame) lastFrame = now;
      const interval = mobile.matches ? 30 : 15;
      if (now - lastFrame >= interval) {
        elapsed += Math.min(now - lastFrame, 55);
        lastFrame = now;
        const progress = clamp(elapsed / duration);
        paint(progress);
        playing = progress < 1;
      }
      resume();
    }

    function resume() {
      if (playing && visible && !frameId && !document.hidden && !motion.matches) {
        frameId = requestAnimationFrame(tick);
      }
    }

    const onProgress = (event: Event) => {
      scrollProgress = (event as CustomEvent<number>).detail;
      playing = false;
      pause();
      if (visible) paint(scrollProgress);
    };
    replay.current = () => {
      if (motion.matches) return;
      pause();
      elapsed = 0;
      playing = true;
      if (visible) paint(0);
      resume();
    };
    adjust.current = () => { if (visible) paint(displayProgress); };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) { pause(); return; }
      if (playing) resume();
      else paint(motion.matches ? 1 : scrollProgress);
    });
    const resizeObserver = new ResizeObserver(resize);
    observer.observe(frame);
    resizeObserver.observe(frame);
    const onVisibility = () => { if (document.hidden) pause(); else resume(); };
    const onPreference = () => {
      playing = false;
      pause();
      paint(motion.matches ? 1 : scrollProgress);
    };
    frame.addEventListener('jupiter:progress', onProgress);
    document.addEventListener('visibilitychange', onVisibility);
    motion.addEventListener('change', onPreference);
    resize();

    return () => {
      pause();
      observer.disconnect();
      resizeObserver.disconnect();
      frame.removeEventListener('jupiter:progress', onProgress);
      document.removeEventListener('visibilitychange', onVisibility);
      motion.removeEventListener('change', onPreference);
      replay.current = () => {};
      adjust.current = () => {};
    };
  }, []);

  return <figure className={s.flowLab}>
    <div ref={frameBox} className={s.flowField} data-ju-cue="flow" data-phase="rest" role="img" aria-label="Illustration of neighboring streams moving in opposite directions and bending around an oval vortex. Tracer paths are illustrative.">
      <svg className={s.flowLines} viewBox="0 0 1000 380" preserveAspectRatio="none" aria-hidden="true">
        <defs><radialGradient id="ju-flow-eye"><stop stopColor="#713e32" stopOpacity=".8"/><stop offset="1" stopColor="#713e32" stopOpacity="0"/></radialGradient></defs>
        <ellipse className={s.flowEye} cx="570" cy="193" rx="260" ry="185" fill="url(#ju-flow-eye)"/>
        <g fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M0 75 C300 66 346 122 440 99 S727 57 1000 92 M0 105 C270 95 344 149 465 117 S732 88 1000 126 M0 138 C305 115 364 183 453 146 S743 122 1000 155 M0 242 C231 228 366 279 470 254 S674 213 1000 241 M0 274 C229 249 372 305 484 280 S704 253 1000 274 M0 309 C276 280 345 330 524 308 S811 281 1000 309"/>
          <g className={s.flowEye}><ellipse cx="570" cy="193" rx="142" ry="63"/><ellipse cx="570" cy="193" rx="108" ry="43"/><ellipse cx="570" cy="193" rx="74" ry="25"/></g>
        </g>
      </svg>
      <canvas ref={canvas} aria-hidden="true"/>
      <div className={s.flowTags} aria-hidden="true"><span>Eastward jet <b>→</b></span><span><b>←</b> Westward jet</span></div>
      <div className={s.flowPhase} aria-hidden="true"><span>Opposing jets</span><span>Shear at the boundary</span><span>Flow around a vortex</span></div>
    </div>
    <figcaption className={s.flowControls}>
      <div><h3>Where the currents meet.</h3><p>Scroll to carry the streams into an oval vortex. The trails illustrate how the currents bend.</p></div>
      <div className={s.flowInput}><label htmlFor="jupiter-shear">Flow strength <output htmlFor="jupiter-shear">{strength}%</output></label><input id="jupiter-shear" type="range" min="40" max="160" step="5" value={strength} onChange={event => { const next = Number(event.target.value); setStrength(next); strengthValue.current = next / 100; adjust.current(); }}/><button type="button" onClick={() => replay.current()}>Replay the flow <span aria-hidden="true">↻</span></button></div>
    </figcaption>
  </figure>;
}
