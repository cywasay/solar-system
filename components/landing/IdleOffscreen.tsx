'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Halts every infinite CSS animation inside it while it is scrolled out of view.
 *
 * Browsers keep running animations on off-screen elements — a 60s marquee and eight
 * orbiting glyphs carry on burning compositor time long after the reader has passed
 * them. This toggles `.motion-idle` (which sets `animation-play-state: paused`) from an
 * IntersectionObserver, so the work stops the moment it stops being visible.
 *
 * Renders a plain wrapper element; pass `className` through for layout.
 */
export default function IdleOffscreen({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => element.classList.toggle('motion-idle', !entry.isIntersecting),
      // Generous margin: resume just before it scrolls into view, so nothing is caught
      // mid-pause at the moment it becomes visible.
      { threshold: 0, rootMargin: '200px 0px' }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
