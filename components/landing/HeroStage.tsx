'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Deterministic star field. Positions come from a fixed-seed PRNG evaluated at module
 * scope, so server and client render byte-identical markup (a Math.random() field would
 * hydrate-mismatch on every load).
 */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Three depth bands. Counts are deliberately modest: the parallax transform is applied to
 * the BAND, not to each star, so a star costs only its own paint — but every extra
 * element still costs style and paint work each frame the band moves. ~50 reads as a
 * field; 150 read the same and cost three times as much.
 *
 * Only the nearest band twinkles. 150 concurrent opacity animations was a measurable
 * cost for an effect nobody can consciously track.
 */
const STAR_BANDS = [
  { count: 26, size: [1, 1.6] as const, opacity: [0.18, 0.42] as const, shift: 4, lift: 10, twinkle: false },
  { count: 16, size: [1.4, 2.2] as const, opacity: [0.3, 0.6] as const, shift: 9, lift: 24, twinkle: false },
  { count: 8, size: [2, 3] as const, opacity: [0.5, 0.85] as const, shift: 16, lift: 42, twinkle: true },
];

const bands = (() => {
  const random = mulberry32(20260725);
  return STAR_BANDS.map((band, bandIndex) => ({
    ...band,
    key: `band-${bandIndex}`,
    stars: Array.from({ length: band.count }, (_, i) => ({
      key: `${bandIndex}-${i}`,
      left: random() * 100,
      top: random() * 100,
      size: band.size[0] + random() * (band.size[1] - band.size[0]),
      opacity: band.opacity[0] + random() * (band.opacity[1] - band.opacity[0]),
      duration: 4 + random() * 6,
      delay: random() * -9,
    })),
  }));
})();

/**
 * The hero's depth engine.
 *
 * Publishes three CSS custom properties — `--mx` / `--my` (pointer, -1..1) and `--sp`
 * (scroll progress, 0..1) — consumed by a handful of layers at differing multipliers.
 * Layers moving at different rates is what reads as depth.
 *
 * PERFORMANCE: a custom-property write invalidates style on every descendant that
 * *references* it, so the number of consumers is the thing that matters — not the number
 * of elements. The parallax transform therefore lives on three band wrappers rather than
 * on each of the ~50 stars, keeping consumers in the single digits. The loop also:
 *   - stops entirely once the hero scrolls out of view (IntersectionObserver),
 *   - skips writes when nothing moved beyond a dead zone, so an idle page costs nothing,
 *   - never starts on coarse-pointer devices, where there is no pointer to track.
 */
export default function HeroStage({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const finePointer = window.matchMedia('(pointer: fine)').matches;

    let frame = 0;
    let visible = true;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let scrollProgress = 0;
    let lastX = -999;
    let lastY = -999;
    let lastProgress = -1;
    let rootHeight = root.offsetHeight || 1;
    let winWidth = window.innerWidth || 1;
    let winHeight = window.innerHeight || 1;

    const measure = () => {
      rootHeight = root.offsetHeight || 1;
      winWidth = window.innerWidth || 1;
      winHeight = window.innerHeight || 1;
    };

    const onPointerMove = (event: PointerEvent) => {
      targetX = (event.clientX / winWidth) * 2 - 1;
      targetY = (event.clientY / winHeight) * 2 - 1;
      if (visible && !frame) frame = requestAnimationFrame(tick);
    };

    // Leaving the window releases the parallax back to centre rather than freezing it.
    const onPointerLeave = () => {
      targetX = 0;
      targetY = 0;
      if (visible && !frame) frame = requestAnimationFrame(tick);
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;

      const next = Math.min(1, Math.max(0, window.scrollY / rootHeight));
      scrollProgress += (next - scrollProgress) * 0.12;

      let changed = false;
      if (Math.abs(currentX - lastX) > 5e-4) {
        root.style.setProperty('--mx', currentX.toFixed(3));
        lastX = currentX;
        changed = true;
      }
      if (Math.abs(currentY - lastY) > 5e-4) {
        root.style.setProperty('--my', currentY.toFixed(3));
        lastY = currentY;
        changed = true;
      }
      if (Math.abs(scrollProgress - lastProgress) > 5e-4) {
        root.style.setProperty('--sp', scrollProgress.toFixed(3));
        lastProgress = scrollProgress;
        changed = true;
      }

      const isMoving =
        Math.abs(targetX - currentX) > 1e-4 ||
        Math.abs(targetY - currentY) > 1e-4 ||
        Math.abs(next - scrollProgress) > 1e-4;

      frame = visible && (isMoving || changed) ? requestAnimationFrame(tick) : 0;
    };

    const onScroll = () => {
      if (visible && !frame) frame = requestAnimationFrame(tick);
    };

    const onResize = () => {
      measure();
      if (visible && !frame) frame = requestAnimationFrame(tick);
    };

    measure();

    // Once the hero is off-screen, stop BOTH the parallax loop and every infinite CSS
    // animation inside it (8 orbit arms, the star twinkle, the glow, the sun pulse, the
    // scroll cue) — all of which otherwise keep the compositor busy forever.
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        root.classList.toggle('motion-idle', !visible);
        if (visible && !frame) frame = requestAnimationFrame(tick);
      },
      { threshold: 0 }
    );
    observer.observe(root);

    frame = requestAnimationFrame(tick);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    if (finePointer) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      document.addEventListener('pointerleave', onPointerLeave);
    }

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return (
    // Renders the <header> itself rather than wrapping one in `display: contents` —
    // that would strip the banner landmark's semantics in some browsers.
    <header
      ref={rootRef}
      // Height budget: one viewport MINUS the masthead above it, so nav + hero together
      // occupy exactly one screen and the scroll cue never falls below the fold. `svh`
      // (small viewport height) is measured with mobile browser chrome expanded, so the
      // layout doesn't jump when the URL bar hides.
      className="relative min-h-[calc(100svh-5rem)] flex flex-col justify-between overflow-hidden border-b border-[#1E293B] px-6 md:px-12 lg:px-24 pt-10 md:pt-14 pb-8"
      style={{ ['--mx' as string]: 0, ['--my' as string]: 0, ['--sp' as string]: 0 }}
    >
      {/* Layer 1 — starfield. One transform per depth band, NOT per star: the band is
          the parallax unit, so ~50 stars cost 3 animated elements. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        // layout+paint only — `strict` would add size containment, and this element
        // takes its dimensions from inset-0 rather than from its contents.
        style={{ contain: 'layout paint' }}
      >
        {bands.map((band) => (
          <div
            key={band.key}
            className="absolute inset-0 will-change-transform"
            style={{
              transform: `translate3d(calc(var(--mx) * ${-band.shift}px), calc(var(--my) * ${-band.shift}px + var(--sp) * ${band.lift}px), 0)`,
              opacity: 'calc(1 - var(--sp) * 1.1)',
            }}
          >
            {band.stars.map((star) => (
              <span
                key={star.key}
                className={`absolute rounded-full bg-white ${band.twinkle ? 'star-twinkle' : ''}`}
                style={{
                  left: `${star.left.toFixed(2)}%`,
                  top: `${star.top.toFixed(2)}%`,
                  width: `${star.size.toFixed(1)}px`,
                  height: `${star.size.toFixed(1)}px`,
                  opacity: star.opacity.toFixed(2),
                  ...(band.twinkle
                    ? {
                        ['--star-min' as string]: (star.opacity * 0.45).toFixed(2),
                        ['--star-max' as string]: star.opacity.toFixed(2),
                        ['--star-dur' as string]: `${star.duration.toFixed(1)}s`,
                        ['--star-delay' as string]: `${star.delay.toFixed(1)}s`,
                      }
                    : {}),
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Layer 2 — nebula wash, giving the black some atmosphere to sit in. No blur
          filter: a filtered element this large is one of the most expensive things a
          compositor can be asked to do, and the gradient is already soft. */}
      <div
        aria-hidden
        className="glow-breathe absolute left-[68%] top-[46%] w-[85vmin] h-[85vmin] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(234,88,12,0.16), rgba(234,88,12,0.05) 42%, transparent 68%)',
        }}
      />
      <div
        aria-hidden
        className="absolute left-[8%] top-[70%] w-[60vmin] h-[60vmin] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(56,89,248,0.10), transparent 65%)',
          transform:
            'translate3d(calc(var(--mx) * -18px), calc(var(--my) * -18px + var(--sp) * 70px), 0)',
        }}
      />

      {children}

      {/* Layer 4 — a vignette that seats the whole composition. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 60% 45%, transparent 35%, rgba(2,6,23,0.55) 100%)',
        }}
      />
    </header>
  );
}
