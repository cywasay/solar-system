'use client';

import React, { useEffect, useRef } from 'react';
import { planets } from '@/data/planets';

/** Neptune's real semi-major axis; scroll 0..1 maps to the journey Sun..Neptune. */
const MAX_AU = 30.07;

/** Real AU per planet, parsed from the shared facts strings — the single source of truth. */
const stops = planets.map((planet) => ({
  name: planet.name,
  au: parseFloat(planet.facts.distance),
}));

/**
 * The scroll-progress indicator, as a journey rather than a readout: you depart the Sun
 * at the top and travel outward past each named world, the passed planets lighting in
 * turn. The stops sit at their true proportional distances, so the terrestrial worlds
 * light almost at once and the giants sprawl — space is mostly empty.
 *
 * The label is set VERTICALLY along the rail. Horizontally it would run ~110px into the
 * page's left column (which starts at 96px on lg) and collide with the headline; vertical
 * type keeps the whole instrument inside a ~20px gutter, and reads as a deliberate
 * editorial device rather than a HUD.
 *
 * PERFORMANCE: rAF-throttled, and every DOM write is guarded by a change check — the
 * eight stop swatches were previously reassigned their colour on every single frame.
 * An idle page now does no work at all.
 */
export default function JourneyRail() {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const stopRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let frame = 0;
    let lastLabel = '';
    let lastProgress = NaN;
    let lastReachedIndex = -2;
    let lastFaded = '';

    const update = () => {
      frame = 0;
      const track = trackRef.current;
      const fill = fillRef.current;
      const marker = markerRef.current;
      const label = labelRef.current;
      if (!track || !fill || !marker || !label) return;

      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;

      // Sub-pixel changes are invisible; skip the write and its style invalidation.
      if (Math.abs(progress - lastProgress) > 2e-4) {
        fill.style.transform = `scaleY(${progress.toFixed(4)})`;
        marker.style.transform = `translateY(${(progress * track.clientHeight).toFixed(1)}px)`;
        lastProgress = progress;
      }

      // Which stops have been passed changes rarely — recolour only on the transition.
      const depthAu = progress * MAX_AU;
      let reachedIndex = -1;
      for (let i = 0; i < stops.length; i++) {
        if (stops[i].au <= depthAu) reachedIndex = i;
      }
      if (reachedIndex !== lastReachedIndex) {
        stopRefs.current.forEach((el, i) => {
          if (el) el.style.backgroundColor = i <= reachedIndex ? '#EA580C' : '#020617';
        });
        lastReachedIndex = reachedIndex;
      }

      const reached = reachedIndex >= 0 ? stops[reachedIndex].name : 'The Sun';
      if (reached !== lastLabel) {
        label.textContent = reached;
        lastLabel = reached;
      }

      // Yield before the closing CTA fills the frame, so it never crowds the footer.
      const faded = progress > 0.9 ? String(Math.max(0, 1 - (progress - 0.9) / 0.1)) : '1';
      if (faded !== lastFaded) {
        root.style.opacity = faded;
        lastFaded = faded;
      }
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
      ref={rootRef}
      aria-hidden
      className="fixed left-5 xl:left-8 inset-y-0 z-30 hidden lg:flex flex-col justify-center pointer-events-none select-none transition-opacity duration-300"
    >
      <div ref={trackRef} className="relative h-[56vh] w-px bg-[#1E293B]">
        {/* Orange trail already travelled. */}
        <div
          ref={fillRef}
          className="absolute top-0 left-0 w-px h-full bg-[#EA580C]/60 origin-top will-change-transform"
          style={{ transform: 'scaleY(0)' }}
        />

        {/* The Sun: fixed at the point of departure. */}
        <span
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#EA580C]"
          style={{ boxShadow: '0 0 8px 1px rgba(234,88,12,0.7)' }}
        />

        {/* Planet stops at their true proportional distances. */}
        {stops.map((stop, i) => (
          <span
            key={stop.name}
            ref={(el) => {
              stopRefs.current[i] = el;
            }}
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border border-[#334155]"
            style={{ top: `${(stop.au / MAX_AU) * 100}%`, backgroundColor: '#020617' }}
          />
        ))}

        {/* Traveller: a glowing marker, with the world just reached named vertically
            beside it so the label stays clear of the page's left column. */}
        <div
          ref={markerRef}
          className="absolute top-0 left-0 w-full will-change-transform"
          style={{ transform: 'translateY(0px)' }}
        >
          {/* Halo (animated: transform+opacity only) behind a static solid core. */}
          <span className="journey-marker-halo absolute left-1/2 top-0 w-2.5 h-2.5 rounded-full bg-[#EA580C]" />
          <span
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#EA580C]"
            style={{ boxShadow: '0 0 10px 2px rgba(234,88,12,0.55)' }}
          />
          <span
            ref={labelRef}
            className="absolute left-3.5 -translate-y-1/2 whitespace-nowrap font-serif italic text-sm tracking-wide text-slate-400"
            style={{ writingMode: 'vertical-rl' }}
          >
            The Sun
          </span>
        </div>
      </div>
    </div>
  );
}
