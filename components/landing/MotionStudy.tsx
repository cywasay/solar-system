'use client';

import { useEffect, useRef } from 'react';
import styles from './MotionStudy.module.css';

const paths = [
  'M60 48C160 48 289 10 404 46c97 30 53 126-22 115-57-8-66-62-32-79 35-17 64 10 51 32-8 13-25 11-27-3',
  'M99 109c87 2 158-27 224-53 73-29 144 21 117 75-19 39-75 39-99 8-24-32-4-62 25-63 28 0 41 27 24 39-7 5-15 3-16-4',
  'M155 162c61 0 107 24 174 17 92-9 130-72 89-109-35-32-88-9-92 31-3 31 28 53 57 37 20-11 19-32 4-37-9-3-16 5-13 10',
];
const starts = [[60, 48], [99, 109], [155, 162]];
let motionPlayed = false;

export default function MotionStudy() {
  const ref = useRef<SVGSVGElement>(null);
  const replay = useRef<() => void>(() => {});

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const trails = Array.from(svg.querySelectorAll<SVGPathElement>('[data-trail]'));
    const tips = Array.from(svg.querySelectorAll<SVGCircleElement>('[data-tip]'));
    const echoes = Array.from(svg.querySelectorAll<SVGCircleElement>('[data-echo]'));
    const rings = Array.from(svg.querySelectorAll<SVGCircleElement>('[data-ring]'));
    const core = svg.querySelector<SVGCircleElement>('[data-core]')!;
    const lengths = trails.map(path => path.getTotalLength());
    let frame = 0;
    let time = 0;
    let last = 0;
    let running = false;
    let visible = false;
    const staticMode = () => preference.matches || new URLSearchParams(location.search).has('lite');
    const settle = () => {
      running = false;
      cancelAnimationFrame(frame);
      frame = 0;
      svg.dataset.motion = 'settled';
      trails.forEach(path => { path.style.opacity = '0'; });
      tips.forEach(tip => { tip.style.opacity = '0'; });
      echoes.forEach(echo => { echo.style.opacity = '0'; });
      rings.forEach(ring => { ring.style.strokeDashoffset = '0'; });
      core.setAttribute('r', '14');
    };
    const draw = () => {
      let energy = 0;
      rings.forEach((ring, i) => {
        const p = Math.max(0, Math.min(1, (time - i * 140) / 1000));
        ring.style.strokeDashoffset = String(Math.pow(1 - p, 3));
      });
      trails.forEach((path, i) => {
        const local = time - 250 - i * 340;
        const t = Math.max(0, Math.min(1, local / 3000));
        const progress = t * t * (3 - 2 * t);
        const head = lengths[i] * progress;
        const tail = Math.max(0, head - lengths[i] * .19 * Math.sin(Math.PI * t));
        // Dash the original Bezier path, keeping every curve perfectly smooth.
        path.style.strokeDasharray = `0 ${tail} ${Math.max(0, head - tail)} ${lengths[i]}`;
        path.style.opacity = local >= 0 && t < 1 ? '1' : '0';
        const point = path.getPointAtLength(head);
        tips[i].setAttribute('cx', String(point.x));
        tips[i].setAttribute('cy', String(point.y));
        tips[i].setAttribute('r', String(3.5 * (1 - Math.max(0, (t - .9) / .1))));
        tips[i].style.opacity = t < 1 ? '1' : '0';
        const arrival = (local - 3000) / 800;
        if (arrival >= 0 && arrival <= 1) {
          echoes[i].setAttribute('r', String(22 + arrival * 52));
          echoes[i].style.opacity = String(.6 * Math.pow(1 - arrival, 2));
          energy += Math.sin(arrival * Math.PI) * Math.pow(1 - arrival, 2);
        } else echoes[i].style.opacity = '0';
      });
      core.setAttribute('r', String(14 + energy * 6));
    };
    const tick = (now: number) => {
      frame = 0;
      if (!running || !visible || document.hidden) { last = 0; return; }
      if (last) time += Math.min(now - last, 50);
      last = now;
      draw();
      if (time >= 4800) settle();
      else frame = requestAnimationFrame(tick);
    };
    const resume = () => { if (running && visible && !frame && !document.hidden) { last = 0; frame = requestAnimationFrame(tick); } };
    const play = () => {
      motionPlayed = true;
      if (staticMode()) { settle(); return; }
      cancelAnimationFrame(frame);
      frame = 0;
      time = last = 0;
      running = true;
      svg.dataset.motion = 'playing';
      draw();
      resume();
    };
    replay.current = play;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (entry.intersectionRatio >= .95 && !motionPlayed) play();
      else resume();
    }, { threshold: [0, .95] });
    observer.observe(svg);
    const onPreference = () => { if (staticMode()) settle(); };
    preference.addEventListener('change', onPreference);
    document.addEventListener('visibilitychange', resume);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      preference.removeEventListener('change', onPreference);
      document.removeEventListener('visibilitychange', resume);
      replay.current = () => {};
    };
  }, []);

  return (
    <svg ref={ref} className={styles.diagram} viewBox="0 0 540 210" aria-label="Three signals spiral into an orange core">
      <g aria-hidden="true" fill="none" stroke="currentColor">
        <path d="M24 105H516M378 20V190" strokeDasharray="3 6" opacity=".2" />
        <circle data-ring="" className={styles.guide} pathLength="1" cx="378" cy="105" r="72" />
        <circle data-ring="" className={styles.guide} pathLength="1" cx="378" cy="105" r="43" />
        {paths.map((d, i) => <path key={i} d={d} strokeWidth="1.25" opacity={.7 - i * .18} />)}
      </g>
      <g aria-hidden="true" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round">
        {paths.map((d, i) => <path key={i} data-trail="" className={styles.trail} d={d} />)}
        {paths.map((_, i) => <circle key={i} data-echo="" className={styles.echo} cx="378" cy="105" r="22" strokeWidth="1" />)}
      </g>
      <g aria-hidden="true">
        {starts.map(([cx, cy], i) => <circle key={i} className={styles.source} cx={cx} cy={cy} r="4" fill="currentColor" />)}
        {starts.map(([cx, cy], i) => <circle key={i} data-tip="" className={styles.tip} cx={cx} cy={cy} r="3.5" fill="var(--color-accent)" />)}
      </g>
      <g className={styles.control} role="button" tabIndex={0} aria-label="Replay signal animation"
        onClick={() => replay.current()}
        onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); replay.current(); } }}>
        <circle cx="378" cy="105" r="46" fill="transparent" />
        <circle className={styles.focusRing} cx="378" cy="105" r="24" fill="none" stroke="var(--color-accent)" />
        <circle data-core="" cx="378" cy="105" r="14" fill="var(--color-accent)" />
        <circle cx="378" cy="105" r="22" fill="none" stroke="var(--color-accent)" strokeOpacity=".55" />
      </g>
    </svg>
  );
}
