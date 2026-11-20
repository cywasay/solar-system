'use client';

import Image from 'next/image';
import { useEffect, useRef, type CSSProperties } from 'react';
import s from './MarsPage.module.css';

const SRC = '/images/mars/valles-marineris.jpg';
const ASPECT = 2400 / 851;

/**
 * The canyon as a panorama: drag (or swipe, or use the arrow keys) to travel along the
 * mosaic. Left alone it drifts slowly end to end. Movement is a transform on one layer,
 * with inertia; the minimap window follows by transform too.
 */
export default function MarsCanyon() {
  const band = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const windowEl = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const view = band.current;
    const strip = track.current;
    if (!view || !strip) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let range = 0;
    let x = 0;
    let velocity = 0;
    let dragging = false;
    let lastX = 0;
    let lastInput = -1e9;
    let direction = -1;
    let visible = true;
    let frame = 0;
    let last = 0;

    const measure = () => {
      // Always leave a real stretch of canyon to travel: at least 1.9x the band's width,
      // cropping top and bottom when the band is wide and short.
      const width = Math.max(view.clientHeight * ASPECT, view.clientWidth * 1.9);
      const height = width / ASPECT;
      strip.style.width = `${width}px`;
      strip.style.height = `${height}px`;
      strip.style.top = `${(view.clientHeight - height) / 2}px`;
      range = Math.max(0, width - view.clientWidth);
      x = Math.max(-range, Math.min(0, x));
      if (windowEl.current) windowEl.current.style.width = `${(view.clientWidth / width) * 100}%`;
    };
    const paint = () => {
      strip.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
      if (windowEl.current) {
        const share = range ? -x / range : 0;
        const free = 100 - parseFloat(windowEl.current.style.width || '0');
        windowEl.current.style.transform = `translate3d(${((share * free) / (100 - free || 1)) * 100}%, 0, 0)`;
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
      if (!dragging) {
        if (Math.abs(velocity) > 0.05) {
          x += velocity;
          velocity *= 0.93;
        } else if (!reduced && now - lastInput > 2600) {
          x += direction * 22 * dt;
          if (x <= -range) direction = 1;
          if (x >= 0) direction = -1;
        }
        if (x > 0 || x < -range) velocity = 0;
        x = Math.max(-range, Math.min(0, x));
      }
      paint();
      if (!reduced || dragging || Math.abs(velocity) > 0.05) frame = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const down = (event: PointerEvent) => {
      dragging = true;
      velocity = 0;
      lastX = event.clientX;
      try { view.setPointerCapture(event.pointerId); } catch { /* pointer already gone */ }
      view.dataset.dragging = 'true';
      wake();
    };
    const move = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - lastX;
      lastX = event.clientX;
      x = Math.max(-range, Math.min(0, x + dx));
      velocity = dx;
      lastInput = performance.now();
    };
    const up = (event: PointerEvent) => {
      dragging = false;
      lastInput = performance.now();
      delete view.dataset.dragging;
      if (view.hasPointerCapture(event.pointerId)) view.releasePointerCapture(event.pointerId);
      wake();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      velocity = event.key === 'ArrowLeft' ? 9 : -9;
      lastInput = performance.now();
      wake();
    };
    const jump = (event: MouseEvent) => {
      const map = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const share = Math.min(1, Math.max(0, (event.clientX - map.left) / map.width));
      x = -share * range;
      velocity = 0;
      lastInput = performance.now();
      wake();
    };
    const minimap = view.parentElement?.querySelector<HTMLElement>('[data-minimap]');

    const sizer = new ResizeObserver(() => {
      measure();
      paint();
    });
    sizer.observe(view);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    observer.observe(view);
    view.addEventListener('pointerdown', down);
    view.addEventListener('pointermove', move);
    view.addEventListener('pointerup', up);
    view.addEventListener('pointercancel', up);
    view.addEventListener('keydown', key);
    minimap?.addEventListener('click', jump);
    document.addEventListener('visibilitychange', wake);
    measure();
    x = -range * 0.18;
    paint();
    wake();
    return () => {
      cancelAnimationFrame(frame);
      sizer.disconnect();
      observer.disconnect();
      view.removeEventListener('pointerdown', down);
      view.removeEventListener('pointermove', move);
      view.removeEventListener('pointerup', up);
      view.removeEventListener('pointercancel', up);
      view.removeEventListener('keydown', key);
      minimap?.removeEventListener('click', jump);
      document.removeEventListener('visibilitychange', wake);
    };
  }, []);

  return (
    <div className={s.canyon}>
      <div ref={band} className={s.canyonBand} tabIndex={0} role="group"
        aria-label="Valles Marineris panorama. Drag, swipe, or use the left and right arrow keys to travel along the canyon.">
        <div ref={track} className={s.canyonTrack}>
          <Image src={SRC} alt="Viking mosaic of Valles Marineris: branching troughs and connected chasms cutting across the equatorial terrain of Mars" fill sizes="240vw" preload />
        </div>
        <span className={s.canyonHint} aria-hidden="true">Drag to travel the canyon</span>
      </div>
      <div className={s.canyonMeta}>
        <span className={s.minimap} data-minimap aria-hidden="true" style={{ '--map': `url(${SRC})` } as CSSProperties}>
          <span ref={windowEl} className={s.minimapWindow} />
        </span>
        <span className={s.canyonCaption}>Valles Marineris · Viking Orbiter mosaic, Mercator projection, north up · NASA / JPL / USGS</span>
      </div>
    </div>
  );
}
