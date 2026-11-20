'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import s from './VenusPage.module.css';

/**
 * Altitude (km), temperature (°C), pressure (bar). Intermediate levels are rounded values
 * from the Venus International Reference Atmosphere; the surface uses NASA's fact-sheet
 * average (737 K, 92 bar). Pressure is interpolated logarithmically, as it falls off
 * roughly exponentially with height.
 */
const PROFILE: [number, number, number][] = [
  [70, -43, 0.037], [60, -10, 0.236], [55, 29, 0.531], [50, 77, 1.07],
  [40, 144, 3.5], [30, 224, 9.85], [20, 294, 22.5], [10, 385, 47.4], [0, 464, 92],
];
const TOP = 70;

/** Backdrop colour stops by depth (0 = cloud tops, 1 = surface). */
const STOPS: [number, [number, number, number]][] = [
  [0, [240, 222, 176]], [0.3, [217, 168, 90]], [0.55, [156, 84, 36]], [0.8, [74, 29, 13]], [1, [28, 11, 6]],
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function conditions(altitude: number) {
  for (let i = 0; i < PROFILE.length - 1; i++) {
    const [a0, t0, p0] = PROFILE[i];
    const [a1, t1, p1] = PROFILE[i + 1];
    if (altitude <= a0 && altitude >= a1) {
      const k = (a0 - altitude) / (a0 - a1);
      return { temperature: lerp(t0, t1, k), pressure: Math.exp(lerp(Math.log(p0), Math.log(p1), k)) };
    }
  }
  const [, t, p] = altitude > TOP ? PROFILE[0] : PROFILE[PROFILE.length - 1];
  return { temperature: t, pressure: p };
}

function backdrop(depth: number) {
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [d0, c0] = STOPS[i];
    const [d1, c1] = STOPS[i + 1];
    if (depth <= d1) {
      const k = (depth - d0) / (d1 - d0);
      return `rgb(${c0.map((c, j) => Math.round(lerp(c, c1[j], k))).join(',')})`;
    }
  }
  return `rgb(${STOPS[STOPS.length - 1][1].join(',')})`;
}

const TICKS = Array.from({ length: 15 }, (_, i) => 70 - i * 5);

/**
 * Scroll is altitude. Each chapter declares its altitude (data-alt); the altitude at the
 * viewport's centre line is interpolated between the chapters on either side, so the gauge
 * always agrees with the chapter being read. One rAF per scroll frame, writes only
 * changed values, sleeps when the section is off-screen.
 */
export default function VenusDescent({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const alt = useRef<HTMLSpanElement>(null);
  const temp = useRef<HTMLSpanElement>(null);
  const press = useRef<HTMLSpanElement>(null);
  const earth = useRef<HTMLSpanElement>(null);
  const backdropEl = useRef<HTMLDivElement>(null);
  const gaugeEl = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = root.current;
    if (!section) return;
    const chapters = Array.from(section.querySelectorAll<HTMLElement>('[data-alt]'));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let visible = false;
    let lastAltitude = -1;
    let lastPress = '';
    let lastColour = '';
    const phone = window.matchMedia('(max-width: 760px)');

    // The ground's heat shimmer is an animated SVG turbulence filter: CPU work every frame.
    // Run it only while the heat reading is on screen.
    const heat = section.querySelector<HTMLElement>('[data-heat]');
    const heatSvg = document.getElementById('venus-heat')?.closest('svg') ?? null;
    heatSvg?.pauseAnimations();
    const heatObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !reduced.matches) heatSvg?.unpauseAnimations();
      else heatSvg?.pauseAnimations();
    });
    if (heat) heatObserver.observe(heat);

    // The sticky gauge sits under the site nav, whose height differs by breakpoint.
    const page = section.closest('main');
    const measureNav = () => {
      const nav = document.querySelector<HTMLElement>('header[data-theme]');
      if (nav && page) page.style.setProperty('--nav-h', `${nav.offsetHeight}px`);
    };
    measureNav();

    const update = () => {
      frame = 0;
      const centre = window.innerHeight / 2;
      const points = chapters.map((chapter) => {
        const box = chapter.getBoundingClientRect();
        return { y: box.top + box.height / 2, altitude: Number(chapter.dataset.alt) };
      });
      let altitude = points[0].altitude;
      if (centre >= points[points.length - 1].y) altitude = points[points.length - 1].altitude;
      else {
        for (let i = 0; i < points.length - 1; i++) {
          if (centre >= points[i].y && centre <= points[i + 1].y) {
            altitude = lerp(points[i].altitude, points[i + 1].altitude, (centre - points[i].y) / (points[i + 1].y - points[i].y));
            break;
          }
        }
      }
      if (Math.abs(altitude - lastAltitude) < 0.02) return;
      lastAltitude = altitude;

      const depth = 1 - altitude / TOP;
      const { temperature, pressure } = conditions(altitude);
      section.style.setProperty('--depth', depth.toFixed(4));
      // Typography under pressure: softer and lighter in the clouds, harder and heavier below.
      // Stepped in 50 increments (about 8 weight units each, imperceptible) so heading text
      // re-lays out only when a step is crossed, not on every scroll frame.
      const pressStep = reduced.matches ? '0.5' : (Math.round(depth * 50) / 50).toFixed(2);
      if (pressStep !== lastPress) {
        section.style.setProperty('--press', pressStep);
        lastPress = pressStep;
      }
      // The colour lives on a sticky backdrop with its own layer: a flat fill repaints, the
      // text above it does not.
      const colour = backdrop(depth);
      if (colour !== lastColour) {
        if (backdropEl.current) backdropEl.current.style.backgroundColor = colour;
        if (gaugeEl.current) gaugeEl.current.style.backgroundColor = phone.matches ? colour : '';
        lastColour = colour;
      }
      const deep = String(depth > 0.5);
      if (section.dataset.deep !== deep) section.dataset.deep = deep;
      if (alt.current) alt.current.textContent = altitude.toFixed(1);
      if (temp.current) temp.current.textContent = `${temperature >= 0 ? '' : '−'}${Math.abs(Math.round(temperature))}`;
      if (press.current) press.current.textContent = pressure < 1 ? pressure.toFixed(2) : pressure < 30 ? pressure.toFixed(1) : Math.round(pressure).toString();
      if (earth.current) earth.current.textContent = (pressure / 1.013).toFixed(pressure < 1 ? 2 : pressure < 10 ? 1 : 0);
    };
    const schedule = () => {
      if (visible && !frame) frame = requestAnimationFrame(update);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      schedule();
    });
    observer.observe(section);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('resize', measureNav);
    visible = true;
    update();
    return () => {
      observer.disconnect();
      heatObserver.disconnect();
      heatSvg?.unpauseAnimations();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('resize', measureNav);
    };
  }, []);

  return (
    <section ref={root} id="descent" className={s.descent} aria-label="Descent through the atmosphere">
      <div className={s.backdropTrack} aria-hidden="true"><div ref={backdropEl} className={s.backdrop} /></div>
      <div className={s.wisps} aria-hidden="true" data-ambient><i /><i /><i /><i /></div>
      <aside ref={gaugeEl} className={s.gauge} aria-hidden="true">
        <div className={s.gaugeScale}>
          <span className={s.cloudBand48} />
          {TICKS.map((tick) => (
            <span key={tick} className={s.tick} data-major={tick % 10 === 0} style={{ top: `${((TOP - tick) / TOP) * 100}%` }}>
              {tick % 10 === 0 ? tick : ''}
            </span>
          ))}
          <span className={s.probe}><i /></span>
        </div>
        <div className={s.readouts}>
          <p><small>Altitude</small><span ref={alt}>70.0</span><b>km</b></p>
          <p><small>Temperature</small><span ref={temp}>−43</span><b>°C</b></p>
          <p><small>Pressure</small><span ref={press}>0.04</span><b>bar</b></p>
          <p><small>Earth sea level</small><span ref={earth}>0.04</span><b>×</b></p>
        </div>
        <p className={s.gaugeNote}>Reference-atmosphere values, rounded</p>
      </aside>
      <div className={s.chapters}>{children}</div>
    </section>
  );
}
