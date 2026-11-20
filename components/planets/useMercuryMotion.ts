'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';

const motionQuery = '(prefers-reduced-motion: reduce)';
const subscribeMotion = (callback: () => void) => {
  const query = window.matchMedia(motionQuery);
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
};

export function useMercuryCue<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  const [arrived, setArrived] = useState(false);
  const reduced = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(motionQuery).matches,
    () => true
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        const available = Math.min(entry.boundingClientRect.height, window.innerHeight - 110);
        if (entry.intersectionRect.height >= available * 0.7) setArrived(true);
      },
      { rootMargin: '-110px 0px 0px', threshold: Array.from({ length: 21 }, (_, i) => i / 20) }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, visible, arrived, reduced };
}

/** Weighted input that sleeps when settled, offscreen, or in a hidden tab. */
export function useMercuryPointer(
  ref: RefObject<HTMLElement | null>,
  homeX = 0.82,
  homeY = 0.5,
  padding = 65
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const fine = window.matchMedia('(pointer: fine)');
    const reduced = window.matchMedia(motionQuery);
    let detach: (() => void) | undefined;
    const attach = () => {
      let rect = element.getBoundingClientRect();
      let dirty = false;
      let frame = 0;
      let last = 0;
      let active = false;
      let visible = true;
      let clientX = 0,
        clientY = 0;
      let radius = Math.min(padding, rect.height * 0.4, rect.width * 0.35);
      let x = Math.max(radius, Math.min(rect.width - radius, rect.width * homeX)),
        y = Math.max(radius, Math.min(rect.height - radius, rect.height * homeY));
      const paint = () => {
        element.style.setProperty('--pointer-x', `${x.toFixed(2)}px`);
        element.style.setProperty('--pointer-y', `${y.toFixed(2)}px`);
        element.style.setProperty('--pointer-nx', (x / Math.max(1, rect.width) - 0.5).toFixed(4));
        element.style.setProperty('--pointer-ny', (y / Math.max(1, rect.height) - 0.5).toFixed(4));
        element.style.setProperty('--pointer-radius', `${radius.toFixed(2)}px`);
      };
      const reset = () => {
        cancelAnimationFrame(frame);
        frame = 0;
        last = 0;
        active = false;
        rect = element.getBoundingClientRect();
        radius = Math.min(padding, rect.height * 0.4, rect.width * 0.35);
        x = Math.max(radius, Math.min(rect.width - radius, rect.width * homeX));
        y = Math.max(radius, Math.min(rect.height - radius, rect.height * homeY));
        element.dataset.pointer = 'rest';
        paint();
      };
      const tick = (now: number) => {
        frame = 0;
        if (!visible || document.hidden) {
          reset();
          return;
        }
        if (dirty) {
          rect = element.getBoundingClientRect();
          dirty = false;
        }
        const dt = Math.min(2.5, last ? (now - last) / 16.667 : 1);
        last = now;
        const targetRadius = Math.min(active ? 150 : padding, rect.height * 0.4, rect.width * 0.35);
        const targetX = Math.max(
          targetRadius,
          Math.min(rect.width - targetRadius, active ? clientX - rect.left : rect.width * homeX)
        );
        const targetY = Math.max(
          targetRadius,
          Math.min(rect.height - targetRadius, active ? clientY - rect.top : rect.height * homeY)
        );
        const ease = 1 - Math.pow(1 - (active ? 0.105 : 0.17), dt);
        x += (targetX - x) * ease;
        y += (targetY - y) * ease;
        radius += (targetRadius - radius) * ease;
        paint();
        if (
          Math.abs(targetX - x) + Math.abs(targetY - y) + Math.abs(targetRadius - radius) <
          0.12
        ) {
          last = 0;
          if (!active) element.dataset.pointer = 'rest';
          return;
        }
        frame = requestAnimationFrame(tick);
      };
      const start = () => {
        if (!frame) frame = requestAnimationFrame(tick);
      };
      const enter = (event: PointerEvent) => {
        if (event.pointerType === 'touch') return;
        active = true;
        dirty = true;
        clientX = event.clientX;
        clientY = event.clientY;
        element.dataset.pointer = 'active';
        element.dataset.pointerUsed = 'true';
        start();
      };
      const move = (event: PointerEvent) => {
        if (event.pointerType === 'touch') return;
        if (!active) {
          enter(event);
          return;
        }
        clientX = event.clientX;
        clientY = event.clientY;
        start();
      };
      const leave = () => {
        active = false;
        element.dataset.pointer = 'returning';
        start();
      };
      const scroll = () => {
        dirty = true;
        if (active) start();
      };
      const resize = () => {
        dirty = true;
        start();
      };
      const visibility = () => {
        if (document.hidden) reset();
      };
      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (!visible) reset();
      });
      observer.observe(element);
      element.dataset.pointer = 'rest';
      element.addEventListener('pointerenter', enter);
      element.addEventListener('pointermove', move, { passive: true });
      element.addEventListener('pointerleave', leave);
      element.addEventListener('pointercancel', leave);
      window.addEventListener('scroll', scroll, { passive: true });
      window.addEventListener('resize', resize);
      window.addEventListener('blur', leave);
      document.addEventListener('visibilitychange', visibility);
      paint();
      return () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        element.removeEventListener('pointerenter', enter);
        element.removeEventListener('pointermove', move);
        element.removeEventListener('pointerleave', leave);
        element.removeEventListener('pointercancel', leave);
        window.removeEventListener('scroll', scroll);
        window.removeEventListener('resize', resize);
        window.removeEventListener('blur', leave);
        document.removeEventListener('visibilitychange', visibility);
        delete element.dataset.pointer;
        delete element.dataset.pointerUsed;
        ['x', 'y', 'nx', 'ny', 'radius'].forEach((key) =>
          element.style.removeProperty(`--pointer-${key}`)
        );
      };
    };
    const sync = () => {
      if (fine.matches && !reduced.matches && !detach) detach = attach();
      else if ((!fine.matches || reduced.matches) && detach) {
        detach();
        detach = undefined;
      }
    };
    sync();
    fine.addEventListener('change', sync);
    reduced.addEventListener('change', sync);
    return () => {
      detach?.();
      fine.removeEventListener('change', sync);
      reduced.removeEventListener('change', sync);
    };
  }, [ref, homeX, homeY, padding]);
}
