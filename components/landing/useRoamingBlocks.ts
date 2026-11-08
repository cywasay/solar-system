'use client';

import { useEffect, useRef, type RefObject } from 'react';

/** Seven lightweight SVG bodies; the red control always stays at home. */
export function useRoamingBlocks(ref: RefObject<HTMLDivElement | null>, released: boolean) {
  const bodies = useRef(Array.from({ length: 7 }, () => ({ x: 0, y: 0, vx: 0, vy: 0 })));

  useEffect(() => {
    const root = ref.current;
    const section = root?.closest('section');
    if (!root || !section) return;
    if (!released && bodies.current.every(p => p.x === 0 && p.y === 0)) return;
    const nodes = Array.from(root.querySelectorAll<SVGGElement>('[data-accent="false"]'));
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let last = 0;
    let visible = true;
    let bounds: { minX: number; maxX: number; minY: number; maxY: number; scale: number; homeX: number; homeY: number; width: number; height: number }[] = [];
    let copy: { left: number; right: number; top: number; bottom: number }[] = [];
    const measure = () => {
      const area = section.getBoundingClientRect();
      bounds = nodes.map(node => {
        const matrix = (node.parentElement as unknown as SVGGElement).getScreenCTM()!;
        const box = node.getBBox();
        const scale = matrix.a;
        const homeX = matrix.e - area.left + box.x * scale;
        const homeY = matrix.f - area.top + box.y * scale;
        const width = box.width * scale;
        const height = box.height * scale;
        return { scale, homeX, homeY, width, height,
          minX: (12 - homeX) / scale, maxX: (area.width - 12 - homeX - width) / scale,
          minY: (12 - homeY) / scale, maxY: (area.height - 12 - homeY - height) / scale };
      });
      copy = [section.querySelector('h2'), section.querySelector('a')?.parentElement].filter(Boolean).map(element => {
        const box = element!.getBoundingClientRect();
        return { left: box.left - area.left, right: box.right - area.left, top: box.top - area.top, bottom: box.bottom - area.top };
      });
    };
    measure();
    if (released) bodies.current.forEach((p, i) => {
      const angle = Math.PI * 2 * i / 7 + .35;
      p.vx = Math.cos(angle) * (150 + Math.random() * 65);
      p.vy = Math.sin(angle) * (100 + Math.random() * 55);
    });

    const paint = (index: number) => {
      const p = bodies.current[index];
      const b = bounds[index];
      nodes[index].style.transform = `translate(${p.x}px, ${p.y}px)`;
      const left = b.homeX + p.x * b.scale;
      const top = b.homeY + p.y * b.scale;
      const overCopy = copy.some(c => left < c.right && left + b.width > c.left && top < c.bottom && top + b.height > c.top);
      // The pieces may travel everywhere, but remain quiet beneath readable copy.
      nodes[index].style.opacity = overCopy ? '.12' : '1';
    };
    const tick = (now: number) => {
      frame = 0;
      if (document.hidden || !visible) { last = 0; return; }
      const dt = last ? Math.min((now - last) / 1000, .033) : 1 / 60;
      last = now;
      let moving = released;
      bodies.current.forEach((p, i) => {
        const b = bounds[i];
        if (preference.matches) {
          p.x = released ? Math.max(b.minX, Math.min(b.maxX, Math.cos(i * 2.4) * 110)) : 0;
          p.y = released ? Math.max(b.minY, Math.min(b.maxY, Math.sin(i * 2.4) * 95)) : 0;
          p.vx = p.vy = 0;
        } else if (released) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.x < b.minX || p.x > b.maxX) { p.x = Math.max(b.minX, Math.min(b.maxX, p.x)); p.vx *= -1; }
          if (p.y < b.minY || p.y > b.maxY) { p.y = Math.max(b.minY, Math.min(b.maxY, p.y)); p.vy *= -1; }
        } else {
          p.vx += (-32 * p.x - 11 * p.vx) * dt;
          p.vy += (-32 * p.y - 11 * p.vy) * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (Math.abs(p.x) + Math.abs(p.y) + Math.abs(p.vx) + Math.abs(p.vy) < .15) {
            p.x = p.y = p.vx = p.vy = 0;
          } else moving = true;
        }
        paint(i);
      });
      if (moving && !preference.matches) frame = requestAnimationFrame(tick);
    };
    const resume = () => { if (!frame) { last = 0; frame = requestAnimationFrame(tick); } };
    const sizeObserver = new ResizeObserver(() => { measure(); resume(); });
    sizeObserver.observe(section);
    const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) resume(); });
    visibilityObserver.observe(section);
    document.addEventListener('visibilitychange', resume);
    preference.addEventListener('change', resume);
    resume();
    return () => {
      cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', resume);
      preference.removeEventListener('change', resume);
    };
  }, [ref, released]);
}
