'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import s from './VenusPage.module.css';

const LIFE = 127;
const DESIGN = 32;
const PLAY_MS = 4200;

/** Deterministic telemetry trace (module scope, so server and client agree). */
const TRACE = (() => {
  let seed = 19820301;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const points: string[] = [];
  for (let minute = 0; minute <= LIFE; minute += 0.5) {
    const strain = minute / LIFE;
    const noise = (random() - 0.5) * (6 + strain * 30);
    const carrier = Math.sin(minute * 1.7) * (10 - strain * 4);
    const y = 40 + carrier + noise;
    points.push(`${((minute / LIFE) * 1000).toFixed(1)},${Math.max(4, Math.min(76, y)).toFixed(1)}`);
  }
  return `M${points.join('L')}`;
})();

/** Counts the transmission up once, the first time it is seen. */
export default function VenusVenera() {
  const root = useRef<HTMLDivElement>(null);
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let frame = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      if (reduced) {
        setMinutes(LIFE);
        return;
      }
      const start = performance.now();
      const tick = (now: number) => {
        const k = Math.min(1, (now - start) / PLAY_MS);
        // Fast through the planned life, then a long, slowing tail: borrowed time.
        setMinutes(LIFE * (1 - Math.pow(1 - k, 2.2)));
        if (k < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.2 });
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  const shown = Math.round(minutes);
  const beyond = minutes > DESIGN;

  return (
    <div ref={root} className={s.venera} data-beyond={beyond} data-done={shown >= LIFE}
      style={{ '--sent': (minutes / LIFE).toFixed(4), '--design': DESIGN / LIFE } as CSSProperties}>
      <p className={s.veneraCount}>
        <span className="sr-only">{LIFE} minutes transmitted from the surface</span>
        <span aria-hidden="true" className={s.veneraNumber}>{shown}</span>
        <span aria-hidden="true" className={s.veneraUnit}>minutes<br />on the surface</span>
      </p>
      <div className={s.tape} aria-hidden="true">
        <svg viewBox="0 0 1000 80" preserveAspectRatio="none"><path d={TRACE} /></svg>
        <span className={s.tapeDesign}><b>32 min</b>planned design life</span>
        <span className={s.tapeBeyond}>Borrowed time</span>
        <span className={s.tapeEnd}>Signal lost · 127 min</span>
      </div>
    </div>
  );
}
