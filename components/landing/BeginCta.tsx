'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';

const EASE_OUT = 'ease-[cubic-bezier(0.16,1,0.3,1)]';
const STAGGER_MS = 25;

/* --- Magnetic-cursor tuning. Every feel value lives here. ------------------ */

/** Arrow scale once it has become the cursor. */
const CURSOR_SCALE = 0.9;
/** Per-frame easing while tracking. Low = slow and floaty, which is the intent here. */
const FOLLOW_LERP = 0.1;
/** The trip home is brisker than the tracking, so leaving the section feels decisive. */
const RETURN_LERP = 0.17;
/**
 * Ring diameter as a multiple of the arrow box. MUST stay in step with the `w-[145%]`
 * / `h-[145%]` utilities on .cta-ring — it is what the edge clamp measures against.
 */
const RING_RATIO = 1.45;
/** Scale and tilt settle a little slower than position, so the takeover reads as a move. */
const SCALE_LERP = 0.12;
const TILT_LERP = 0.1;
/**
 * Peak angle, degrees. 45 gives exactly the three permitted headings — right at rest,
 * top-right when travelling up, bottom-right when travelling down. Never leftward.
 */
const MAX_TILT = 45;
/** Vertical pointer speed (px/frame) that produces full tilt. */
const TILT_SPEED_REF = 18;
/** Below this, the return home is finished and the loop shuts down. */
const SETTLE_PX = 0.15;

/** Offset of `el` inside `ancestor`, in layout coordinates. Uses offsetLeft/offsetTop
 *  rather than getBoundingClientRect because those are immune to the transform we are
 *  applying to the element itself — reading the rect would feed our own output back in. */
function offsetWithin(el: HTMLElement, ancestor: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== ancestor) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * The closing call to action.
 *
 * The orange sweep and the letter roll are pure CSS and untouched by the script below —
 * only the arrow is driven by JS. On pointer entry the arrow lifts off its post, shrinks,
 * and flies to the pointer, then trails it with a magnetic lag for as long as the pointer
 * stays inside; on exit it glides home, scales back up, and the loop shuts down entirely.
 *
 * The native cursor is hidden through a `data-magnetic` attribute that this component
 * sets at runtime, never through static CSS — so if the script fails to run, or the device
 * is touch-only, or the visitor prefers reduced motion, the ordinary cursor survives.
 */
export default function BeginCta() {
  const sectionRef = useRef<HTMLAnchorElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const pivotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const arrow = arrowRef.current;
    const pivot = pivotRef.current;
    if (!section || !arrow || !pivot) return;

    const finePointer = window.matchMedia('(pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    /*
     * Wiring lives in a function because the conditions above are watched, not merely
     * sampled at mount. Devtools device emulation reports "pointer: coarse", so a page
     * loaded with emulation switched on used to bail here permanently — turning it back
     * off left the cursor effect dead until a full reload. Watching the queries lets it
     * attach and detach itself as the environment flips.
     */
    const attach = () => {
      section.dataset.magnetic = 'on';

      let frame = 0;
      let active = false;
      let rectDirty = true;
      let rect = section.getBoundingClientRect();

      // Pointer, in section-local coordinates.
      let pointerX = 0;
      let pointerY = 0;
      let lastPointerY = 0;

      // Current and target transform, relative to the arrow's own layout position, so
      // "home" is simply (0, 0) and the return trip costs no bookkeeping.
      let x = 0;
      let y = 0;
      let scale = 1;
      let tilt = 0;

      const measure = () => {
        rect = section.getBoundingClientRect();
        rectDirty = false;
      };

      const tick = () => {
        // Lenis scrolls continuously, so the section slides beneath a stationary pointer;
        // the rect has to be refreshed or the arrow drifts away from the cursor.
        if (rectDirty) measure();

        const home = offsetWithin(arrow, section);
        const centreX = home.x + arrow.offsetWidth / 2;
        const centreY = home.y + arrow.offsetHeight / 2;

        /*
         * Confine the whole disc to the section. The section clips its overflow, so an
         * unconstrained follow shears the disc in half at the boundary; clamping the
         * disc's CENTRE by its own radius makes it slide along the edge and stay whole,
         * while the real pointer carries on into the corner. Radius uses the live scale,
         * so the limit grows with the disc as it arrives.
         */
        // Largest scale at which the disc still fits inside the section. Only bites on
        // absurdly short viewports, but without it the clamp below has no valid range and
        // the disc would spill however it was positioned.
        const fitScale = Math.min(rect.width, rect.height) / (arrow.offsetWidth * RING_RATIO);
        const radius = (arrow.offsetWidth * RING_RATIO * scale) / 2;
        const cx = clamp(pointerX, radius, Math.max(radius, rect.width - radius));
        const cy = clamp(pointerY, radius, Math.max(radius, rect.height - radius));

        const targetX = active ? cx - centreX : 0;
        const targetY = active ? cy - centreY : 0;
        const targetScale = active ? Math.min(CURSOR_SCALE, fitScale) : 1;

        /*
         * Heading is driven by VERTICAL travel alone, then clamped to +/-45deg. That is
         * deliberate, not a shortcut: deriving the angle from atan2(vy, vx) and clamping
         * it is unstable, because leftward travel sits at ~180deg — equidistant from both
         * clamp limits — so a hair of vertical jitter flips the arrow between +45 and -45.
         * Ignoring horizontal sign yields exactly the three headings asked for (right,
         * top-right, bottom-right), can never point left, and cannot oscillate.
         */
        const velocityY = active ? pointerY - lastPointerY : 0;
        const targetTilt = active
          ? clamp((velocityY / TILT_SPEED_REF) * MAX_TILT, -MAX_TILT, MAX_TILT)
          : 0;
        lastPointerY = pointerY;

        const follow = active ? FOLLOW_LERP : RETURN_LERP;
        x += (targetX - x) * follow;
        y += (targetY - y) * follow;
        scale += (targetScale - scale) * SCALE_LERP;
        // Also cap the in-flight value: the disc leaves home at scale 1 and would briefly
        // exceed a very short section before the lerp brought it down.
        if (active) scale = Math.min(scale, fitScale);
        tilt += (targetTilt - tilt) * TILT_LERP;

        // Position and size on the wrapper; heading on an inner pivot, so the ring around
        // the arrow stays upright rather than spinning with it.
        arrow.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
        pivot.style.transform = `rotate(${tilt.toFixed(2)}deg)`;

        const settled =
          !active &&
          Math.abs(x) < SETTLE_PX &&
          Math.abs(y) < SETTLE_PX &&
          Math.abs(1 - scale) < 0.002 &&
          Math.abs(tilt) < 0.05;

        if (settled) {
          // Hand the arrow back to CSS entirely; no residual transform, no rAF.
          arrow.style.transform = '';
          pivot.style.transform = '';
          frame = 0;
          return;
        }

        frame = requestAnimationFrame(tick);
      };

      const start = () => {
        if (!frame) frame = requestAnimationFrame(tick);
      };

      const onEnter = (event: PointerEvent) => {
        measure();
        pointerX = event.clientX - rect.left;
        pointerY = event.clientY - rect.top;
        lastPointerY = pointerY;
        active = true;
        start();
      };

      const onMove = (event: PointerEvent) => {
        if (rectDirty) measure();
        pointerX = event.clientX - rect.left;
        pointerY = event.clientY - rect.top;
        if (active) start();
      };

      const onLeave = () => {
        active = false;
        start(); // keep running until it has glided home
      };

      const onScroll = () => {
        rectDirty = true;
        if (active) start();
      };

      const onResize = () => {
        rectDirty = true;
        start();
      };

      section.addEventListener('pointerenter', onEnter);
      section.addEventListener('pointermove', onMove, { passive: true });
      section.addEventListener('pointerleave', onLeave);
      section.addEventListener('pointercancel', onLeave);
      // The pointer can leave without a pointerleave if the window loses focus.
      window.addEventListener('blur', onLeave);
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize);

      return () => {
        section.removeEventListener('pointerenter', onEnter);
        section.removeEventListener('pointermove', onMove);
        section.removeEventListener('pointerleave', onLeave);
        section.removeEventListener('pointercancel', onLeave);
        window.removeEventListener('blur', onLeave);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
        if (frame) cancelAnimationFrame(frame);
        delete section.dataset.magnetic;
        arrow.style.transform = '';
        pivot.style.transform = '';
      };
    };

    let detach: (() => void) | null = null;

    const sync = () => {
      const enabled = finePointer.matches && !reducedMotion.matches;
      if (enabled && !detach) {
        detach = attach();
      } else if (!enabled && detach) {
        detach();
        detach = null;
      }
    };

    sync();
    finePointer.addEventListener('change', sync);
    reducedMotion.addEventListener('change', sync);

    return () => {
      finePointer.removeEventListener('change', sync);
      reducedMotion.removeEventListener('change', sync);
      detach?.();
    };
  }, []);

  return (
    /*
     * Three rules make the letter roll read as fluid rather than jittery:
     *
     * 1. EASE_OUT, not the page's aggressive `EASE`. That curve is an ease-IN-out —
     *    slow, whip, slow — right for a single sweeping mass but wrong for a stagger:
     *    five letters each doing sit/whip/sit at 25ms offsets read as five separate
     *    jerks. An ease-out launches every letter at once and lets them glide, so the
     *    offsets blend into a single wave.
     * 2. The stagger applies on ENTRY ONLY (via --d, read only inside group-hover). A
     *    delay in the base state also delays the exit, stranding letters mid-flight when
     *    the pointer flicks away.
     * 3. Sweep and letters finish together by construction:
     *    640ms + (4 x 25ms) === 740ms.
     */
    <Link
      ref={sectionRef}
      href="/explore"
      className="group relative block w-full border-t border-[#1E293B] overflow-hidden bg-[#020617]"
    >
      <div
        className={`absolute inset-0 bg-[#EA580C] translate-y-full group-hover:translate-y-0 transition-transform duration-[420ms] group-hover:duration-[740ms] ${EASE_OUT}`}
      />
      <div className="relative px-4 sm:px-6 md:px-12 lg:px-24 py-12 sm:py-20 md:py-32 flex items-end justify-between gap-4 sm:gap-8">
        {/* Not `flex`: flex items don't get letter-spacing, which silently dropped
            `tracking-tighter` from the display type. Inline-block letters keep it. */}
        <span className="font-serif uppercase text-[min(16vw,22vh)] sm:text-[min(13vw,22vh)] leading-[0.95] tracking-tighter">
          <span className="sr-only">Begin</span>
          {'Begin'.split('').map((letter, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="relative inline-block overflow-hidden align-bottom"
              style={{ ['--d' as string]: `${i * STAGGER_MS}ms` }}
            >
              {/* Outgoing white letter. */}
              <span
                className={`block text-[#F8FAFC] transition-transform duration-[380ms] [transition-delay:0ms] group-hover:duration-[640ms] group-hover:[transition-delay:var(--d)] group-hover:-translate-y-full ${EASE_OUT}`}
              >
                {letter}
              </span>
              {/* Incoming black letter, stacked exactly one line-box below. Absolute so
                  it cannot contribute to the mask's height. */}
              <span
                className={`absolute left-0 top-0 block text-[#020617] translate-y-full transition-transform duration-[380ms] [transition-delay:0ms] group-hover:duration-[640ms] group-hover:[transition-delay:var(--d)] group-hover:translate-y-0 ${EASE_OUT}`}
              >
                {letter}
              </span>
            </span>
          ))}
        </span>

        <div className="flex flex-col items-end gap-4 mb-[1.5vw] shrink-0">
          {/* Steps aside while the arrow is acting as the cursor — the corner would
              otherwise read as an orphaned label. Fades only when the effect is live. */}
          <span
            className={`cta-ready hidden md:block text-sm text-slate-500 group-hover:text-[#020617]/70 transition-[color,opacity] duration-[420ms] group-hover:duration-[740ms] ${EASE_OUT}`}
          >
            Ready when you are
          </span>

          {/*
           * The transform belongs to the rAF loop alone. Tailwind v4 emits translate /
           * rotate / scale utilities as STANDALONE CSS properties, which compose on top
           * of `transform` rather than replacing it — so the old hover flourish
           * (translate-x-4, rotate-[-45deg], scale-110) had to go, not merely be
           * overridden. Only colour is left to CSS.
           *
           * A span, not the svg: SVGElement has no offsetLeft/offsetTop to measure.
           */}
          <span
            ref={arrowRef}
            aria-hidden="true"
            /*
             * Off-white throughout, no longer switching to near-black on hover: once the
             * disc is filled, the arrow's contrast partner is the plum fill rather than
             * the page behind it, and near-black on plum is unreadable. Off-white gives
             * 9.8:1 on the fill and still reads on navy at rest.
             */
            className="relative block pointer-events-none text-[#F8FAFC]"
          >
            {/*
             * Ring. Absent at rest — it grows in only once the arrow becomes the cursor,
             * so the corner keeps its bare-arrow composition. Sized as a percentage of
             * the arrow so it tracks CURSOR_SCALE automatically.
             *
             * Off-white stroke, deliberately NOT `border-current`: the ring crosses two
             * backgrounds — navy while it flies in, orange once the sweep lands — and
             * off-white is the only palette colour clearing 3:1 against both (19.3:1 on
             * navy, 3.4:1 on orange). Inheriting the arrow's colour would drop it to
             * 1.0:1 — invisible — for the whole entry.
             *
             * Wine-red fill (#9B0F3A, hue 342, 82% saturation). Balances four things at
             * once: 7.95:1 for the off-white arrow on top, 2.34:1 against the orange
             * field, 2.42:1 against navy, and a 39deg hue gap from orange. Anything
             * brighter (raspberry, cerise) drops under 2:1 on the orange; anything
             * violet-leaning reads greyish because it loses separation from the navy.
             */}
            <span className="cta-ring absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[145%] h-[145%] rounded-full border-[3px] border-[#F8FAFC] bg-[#9B0F3A]" />

            {/* Heading pivot. An HTML element rather than the <svg>: CSS rotation on an
                SVG root resolves transform-origin against the viewBox, so it would spin
                about a corner instead of its centre. */}
            <span ref={pivotRef} className="relative block">
              <svg
                className="w-[min(10vw,12vh)] sm:w-[min(7vw,12vh)] h-[min(10vw,12vh)] sm:h-[min(7vw,12vh)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
