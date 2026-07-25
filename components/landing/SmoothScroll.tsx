'use client';

import { useEffect } from 'react';

/**
 * Lerped ("smooth") scrolling — the single biggest contributor to the fluid feel of
 * award-site scrolling. Native wheel scroll jumps in discrete ~100px steps; Lenis
 * intercepts the wheel and eases the scroll position toward the target every frame, so
 * motion is continuous and every scroll-linked animation inherits that smoothness.
 *
 * Lenis drives the real scroll position (not a transformed container), so `window.scrollY`
 * stays truthful and JourneyRail / Reveal keep working untouched.
 *
 * Renders nothing. Mounted on the landing page only — /explore is a fixed full-screen
 * canvas with nothing to scroll, and hijacking its wheel events would be wrong.
 */
export default function SmoothScroll() {
  useEffect(() => {
    // DIAGNOSTIC: `?lite=1` kills every decorative animation on the page (via the
    // .motion-idle rule) and skips smooth scrolling. Load the page with and without it
    // to tell in seconds whether perceived jank comes from this motion layer or from
    // something else entirely — layout, the dev-server build, or the machine.
    const lite = new URLSearchParams(window.location.search).has('lite');
    if (lite) {
      document.documentElement.classList.add('motion-idle');
      return;
    }

    // Honour the OS setting: smoothing a scroll is exactly the kind of motion that
    // triggers vestibular discomfort, so opt out entirely rather than merely shortening.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let lenis: { destroy: () => void } | undefined;
    let cancelled = false;

    // Dynamic import keeps Lenis out of the initial bundle; the page paints first.
    void import('lenis').then(({ default: Lenis }) => {
      if (cancelled) return;
      lenis = new Lenis({
        // ~0.09 gives a long, weighty glide without feeling detached from the input.
        lerp: 0.09,
        wheelMultiplier: 1,
        // Touch devices already have momentum scrolling; a second easing layer fights it.
        smoothWheel: true,
        syncTouch: false,
        // Let Lenis ease in-page anchor jumps too, instead of the removed CSS smooth.
        anchors: true,
        autoRaf: true,
      });
    });

    return () => {
      cancelled = true;
      lenis?.destroy();
    };
  }, []);

  return null;
}
