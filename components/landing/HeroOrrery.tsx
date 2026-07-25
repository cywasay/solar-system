import React from 'react';
import { planets } from '@/data/planets';

const MAX_DISTANCE = planets[planets.length - 1].distanceFromSun;

/**
 * Entrance choreography, in ms. The star ignites, then each orbit expands outward in
 * turn — Mercury first, Neptune last — so the system reads as assembling from its centre.
 * Timed to interleave with the headline's character reveal rather than compete with it.
 */
const SUN_DELAY = 260;
const RING_STAGGER = 105;
const RING_BASE = SUN_DELAY + 220;
/** The body lands after its own orbit has settled. */
const BODY_OFFSET = 620;

/**
 * The landing page's signature: a live orrery drawn from the simulation's own data file.
 * Ring diameters are proportional to each planet's compressed orbital distance, and every
 * arm's rotation period is 2π/orbitSpeed — the exact rate the 3D scene uses. Mercury
 * visibly laps the field while Neptune barely creeps, so the page demonstrates the dataset
 * before the visitor reaches the simulation.
 *
 * Each body carries a comet trail: a ring drawn with only `border-top-color`, rotated
 * -45° so the visible arc sweeps *behind* the dot. It rides the same rotating arm, which
 * costs one extra element per planet and no extra animation.
 *
 * Pure CSS motion (one transform animation per arm), so this stays a server component.
 * Phase offsets are deterministic (golden-ratio spacing), so hydration never mismatches.
 */
export default function HeroOrrery({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      // aspect-square means width also sets height, so the vh term is what keeps the
      // dial from towering past a short viewport.
      //
      // MOBILE: previously `hidden md:block`, which cost phones the page's signature
      // element entirely. It now renders below md at a wider bleed and a lower opacity
      // (--orrery-fade) so it reads as atmosphere behind the type rather than competing
      // with it. Every `md:` value restores the desktop rendering exactly.
      className={`absolute top-1/2 right-0 -translate-y-1/2 translate-x-[26%] md:translate-x-[36%] w-[150vw] md:w-[min(96vw,118vh,1080px)] aspect-square pointer-events-none select-none block [--orrery-fade:0.45] md:[--orrery-fade:1] ${className}`}
      style={{
        // Drifts against the pointer and lifts on scroll — slower than the type in front
        // of it, which is what sells the depth.
        //
        // NOTE: static placement stays in the Tailwind translate utilities above, which
        // Tailwind v4 compiles to the standalone `translate:` property. That composes
        // with `transform:` rather than replacing it, so this must carry ONLY the
        // dynamic offset — repeating the 38%/-50% here would double it off-screen.
        transform:
          'translate3d(calc(var(--mx) * -26px), calc(var(--my) * -26px + var(--sp) * -90px), 0) scale(calc(1 + var(--sp) * 0.08))',
        // --orrery-fade is 1 at md+ (so this is identical to before on desktop) and
        // 0.45 on phones, where the type sits directly on top of the dial.
        opacity: 'calc((1 - var(--sp) * 0.85) * var(--orrery-fade, 1))',
      }}
    >
      {/* Solar glow stack: broad halo, pulsing corona, hard core. Wrapped so the whole
          star can ignite as one before the orbits arrive — the wrapper carries the
          entrance transform, leaving the corona's own pulse animation untouched. */}
      <div className="sun-in absolute inset-0" style={{ animationDelay: `${SUN_DELAY}ms` }}>
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[34%] h-[34%] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(234,88,12,0.30), rgba(234,88,12,0.08) 38%, transparent 68%)',
          }}
        />
        <div
          className="sun-pulse absolute left-1/2 top-1/2 w-10 h-10 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,148,64,0.95), transparent 68%)' }}
        />
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#FFB070]"
          style={{ boxShadow: '0 0 18px 5px rgba(234,88,12,0.85), 0 0 44px 14px rgba(234,88,12,0.35)' }}
        />
      </div>

      {planets.map((planet, index) => {
        const diameter = (planet.distanceFromSun / MAX_DISTANCE) * 100;
        const period = (2 * Math.PI) / planet.orbitSpeed;
        // Golden-ratio fractions scatter the dots around the dial without randomness.
        const phase = ((index * 0.382) % 1) * period;
        const isEarth = planet.name === 'Earth';
        // Inner worlds sit on tighter rings; scale the body so they stay readable
        // without the giants' dots swallowing their own orbits.
        const dotSize = isEarth ? 11 : 6 + (index / planets.length) * 5;

        // Inner worlds sweep further, echoing how much faster they actually travel.
        const sweep = -(150 - index * 11);
        const ringDelay = RING_BASE + index * RING_STAGGER;

        return (
          <div
            key={planet.name}
            className="ring-in absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: `${diameter}%`,
              height: `${diameter}%`,
              // Brighter than the old hairline, and brighter for the inner rings so the
              // crowded centre reads as dense rather than muddy.
              border: `1px solid rgba(148,163,184,${(0.26 - index * 0.018).toFixed(3)})`,
              animationDelay: `${ringDelay}ms`,
              ['--ring-sweep' as string]: `${sweep}deg`,
            }}
          >
            <div
              className="orbit-arm absolute inset-0"
              style={{
                animation: `orbit-spin ${period.toFixed(1)}s linear infinite`,
                animationDelay: `-${phase.toFixed(1)}s`,
              }}
            >
              {/* Comet trail: only the top border is coloured, and the ring is rotated
                  back 45° so the arc trails the body rather than leading it. */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  borderTop: `1px solid ${planet.fallbackColor}`,
                  borderLeft: '1px solid transparent',
                  borderRight: '1px solid transparent',
                  borderBottom: '1px solid transparent',
                  transform: 'rotate(-46deg)',
                  opacity: 0.55,
                }}
              />
              <span
                className="body-in absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: `${dotSize.toFixed(1)}px`,
                  height: `${dotSize.toFixed(1)}px`,
                  backgroundColor: planet.fallbackColor,
                  boxShadow: isEarth
                    ? `0 0 0 3px rgba(234,88,12,0.55), 0 0 16px 3px ${planet.fallbackColor}`
                    : `0 0 12px 2px ${planet.fallbackColor}80`,
                  animationDelay: `${ringDelay + BODY_OFFSET}ms`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
