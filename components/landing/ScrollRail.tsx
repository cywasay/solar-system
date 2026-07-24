'use client';

import React, { useEffect, useRef } from 'react';
import { planets } from '@/data/planets';

/** Neptune's real semi-major axis; the rail maps page scroll onto 0..30.07 AU. */
const MAX_AU = 30.07;

/** Real AU per planet, parsed straight from the shared facts strings — no duplication. */
const ticks = planets.map((planet) => ({
  name: planet.name,
  au: parseFloat(planet.facts.distance),
}));

/**
 * A fixed vertical ruler (desktop only): scrolling the page reads as travelling outward
 * from the Sun, with a live AU readout riding the progress cursor. The tick layout
 * itself tells the dataset's best story — the four terrestrial worlds crowd into the
 * top 5% of the track while the giants spread across the rest. Space is mostly empty.
 *
 * All updates are rAF-throttled ref mutations (transform/opacity/textContent); no
 * React state, no layout-triggering properties.
 */
export default function ScrollRail() {
  const railRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const rail = railRef.current;
      const track = trackRef.current;
      const cursor = cursorRef.current;
      const readout = readoutRef.current;
      if (!rail || !track || !cursor || !readout) return;

      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;

      cursor.style.transform = `translateY(${(p * track.clientHeight).toFixed(1)}px)`;
      readout.textContent = `${(p * MAX_AU).toFixed(2)} AU`;
      // The instrument yields as the terminal CTA fills the viewport.
      rail.style.opacity = p > 0.86 ? String(Math.max(0, 1 - (p - 0.86) / 0.14)) : '1';
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={railRef}
      aria-hidden
      className="fixed left-6 inset-y-0 z-30 hidden lg:flex flex-col items-center justify-center gap-4 pointer-events-none select-none font-mono text-[9px] tracking-[0.25em] text-slate-500 uppercase"
    >
      <span style={{ writingMode: 'vertical-rl' }}>System depth</span>
      <span>0</span>

      <div ref={trackRef} className="relative h-[58vh] w-px bg-[#1E293B]">
        {ticks.map((tick) => (
          <span
            key={tick.name}
            className="absolute left-1/2 -translate-x-1/2 w-[9px] h-px bg-slate-600"
            style={{ top: `${(tick.au / MAX_AU) * 100}%` }}
          />
        ))}
        {/* Progress cursor + live readout */}
        <div ref={cursorRef} className="absolute top-0 left-0 w-full will-change-transform">
          <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-[7px] h-[7px] rounded-full bg-[#EA580C]" />
          <span
            ref={readoutRef}
            className="absolute left-4 -translate-y-1/2 whitespace-nowrap text-[#EA580C]"
          >
            0.00 AU
          </span>
        </div>
      </div>

      <span>30.07</span>
    </div>
  );
}
