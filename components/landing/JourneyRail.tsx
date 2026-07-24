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
 * The scroll-progress indicator, reimagined for the editorial redesign. Where the old
 * rail was a technical ruler — mono tick marks, an "AU" readout, a "System depth"
 * label — this is a journey: you depart the Sun at the top and travel outward past each
 * named world as you scroll, the passed planets lighting in turn. Same real-data story
 * (the terrestrial worlds crowd the first sliver of the track, the giants sprawl across
 * the rest — space is mostly empty), told in Newsreader instead of monospace.
 *
 * rAF-throttled ref mutations only: transform for the fill and marker, textContent for
 * the label, no React state and no layout-triggering properties.
 */
export default function JourneyRail() {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const stopRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    let frame = 0;
    let lastLabel = '';

    const update = () => {
      frame = 0;
      const root = rootRef.current;
      const track = trackRef.current;
      const fill = fillRef.current;
      const marker = markerRef.current;
      const label = labelRef.current;
      if (!root || !track || !fill || !marker || !label) return;

      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const depthAu = p * MAX_AU;

      fill.style.transform = `scaleY(${p.toFixed(4)})`;
      marker.style.transform = `translateY(${(p * track.clientHeight).toFixed(1)}px)`;

      // Light each stop the marker has reached; name the furthest one reached.
      let reached = 'The Sun';
      stopRefs.current.forEach((el, i) => {
        const passed = stops[i].au <= depthAu;
        if (el) el.style.backgroundColor = passed ? '#EA580C' : '#020617';
        if (passed) reached = stops[i].name;
      });
      if (reached !== lastLabel) {
        label.textContent = reached;
        lastLabel = reached;
      }

      // Yield before the closing CTA fills the frame, so it never crowds the footer.
      root.style.opacity = p > 0.9 ? String(Math.max(0, 1 - (p - 0.9) / 0.1)) : '1';
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
      className="fixed left-6 xl:left-10 inset-y-0 z-30 hidden lg:flex flex-col justify-center pointer-events-none select-none transition-opacity duration-300"
    >
      <div ref={trackRef} className="relative h-[56vh] w-px bg-[#1E293B]">
        {/* Orange trail already travelled. */}
        <div
          ref={fillRef}
          className="absolute top-0 left-0 w-px h-full bg-[#EA580C]/60 origin-top"
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

        {/* Traveller: a glowing marker with the name of the world just reached. */}
        <div
          ref={markerRef}
          className="absolute top-0 left-0 w-full will-change-transform"
          style={{ transform: 'translateY(0px)' }}
        >
          <span className="journey-marker absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#EA580C]" />
          <span
            ref={labelRef}
            className="absolute left-6 -translate-y-1/2 whitespace-nowrap font-serif italic text-lg text-slate-300"
          >
            The Sun
          </span>
        </div>
      </div>
    </div>
  );
}
