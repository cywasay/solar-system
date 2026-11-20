'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useMercuryPointer } from './useMercuryMotion';

export function MercuryHero({ children, className }: { children: ReactNode; className: string }) {
  const ref = useRef<HTMLElement>(null);
  useMercuryPointer(ref, 0.72, 0.45, 65);
  return (
    <header ref={ref} className={className} data-mc-hero>
      {children}
    </header>
  );
}

export default function MercuryMotion({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const pending = new Set(element.querySelectorAll<HTMLElement>('[data-mc-cue]'));
    const hero = element.querySelector<HTMLElement>('[data-mc-hero]');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const update = () => {
      frame = 0;
      if (document.hidden) return;
      if (hero) {
        const bounds = hero.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, (element.offsetTop - bounds.top) / bounds.height));
        element.style.setProperty('--mercury-travel', reduced.matches ? '0' : progress.toFixed(4));
      }
      pending.forEach((item) => {
        const bounds = item.getBoundingClientRect();
        const seen = Math.max(0, Math.min(bounds.bottom, innerHeight) - Math.max(bounds.top, 110));
        if (reduced.matches || seen >= Math.min(bounds.height, innerHeight - 110) * 0.7) {
          item.dataset.mcArrived = 'true';
          pending.delete(item);
        }
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    element.dataset.mcMotion = 'ready';
    update();
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    document.addEventListener('visibilitychange', schedule);
    reduced.addEventListener('change', schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', schedule);
      reduced.removeEventListener('change', schedule);
    };
  }, []);
  return (
    <main ref={ref} className={className}>
      {children}
    </main>
  );
}
