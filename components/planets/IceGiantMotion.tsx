'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** Shared visibility/input plumbing; the two pages author their own choreography. */
export default function IceGiantMotion({
  children,
  className,
  planet,
}: {
  children: ReactNode;
  className: string;
  planet: 'uranus' | 'neptune';
}) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pending = new Set(element.querySelectorAll<HTMLElement>('[data-arrival]'));
    const hero = element.querySelector<HTMLElement>('[data-ice-hero]');
    const passages = element.querySelectorAll<HTMLElement>('[data-passage]');
    let frame = 0;
    const update = () => {
      frame = 0;
      if (document.hidden) return;
      const height = window.innerHeight;
      if (hero) {
        const bounds = hero.getBoundingClientRect();
        const distance = planet === 'uranus' ? element.offsetTop - bounds.top : -bounds.top;
        const duration = bounds.height * (planet === 'uranus' ? 0.32 : 0.7);
        const progress = Math.max(0, Math.min(1, distance / Math.max(1, duration)));
        element.style.setProperty('--hero-travel', reduced.matches ? '0' : progress.toFixed(4));
      }
      passages.forEach((item) => {
        const bounds = item.getBoundingClientRect();
        if (bounds.bottom < 0 || bounds.top > height) return;
        const progress = Math.max(0, Math.min(1, (height - bounds.top) / (height + bounds.height)));
        item.style.setProperty('--passage', reduced.matches ? '.5' : progress.toFixed(4));
      });
      pending.forEach((item) => {
        const bounds = item.getBoundingClientRect();
        const visible = Math.max(0, Math.min(bounds.bottom, height) - Math.max(bounds.top, 105));
        if (reduced.matches || visible >= Math.min(bounds.height, height - 105) * 0.68) {
          item.dataset.arrived = 'true';
          pending.delete(item);
        }
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    element.dataset.motion = 'ready';
    update();
    const resize = new ResizeObserver(schedule);
    resize.observe(element);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    document.addEventListener('visibilitychange', schedule);
    reduced.addEventListener('change', schedule);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', schedule);
      reduced.removeEventListener('change', schedule);
    };
  }, [planet]);
  return (
    <main ref={root} className={className} data-ice-planet={planet}>
      {children}
    </main>
  );
}
