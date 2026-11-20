'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { attachDepth } from './depth';

type ScopeTag = 'main' | 'div' | 'section' | 'article';

/**
 * The shared motion baseline for a page. Wrap the page (it can stay a server component)
 * and mark elements with attributes:
 *
 *   data-reveal[="stagger"|"mask"|"draw"]  scroll reveal, styled in globals.css
 *   data-cue                               gets data-shown on arrival; page CSS animates it
 *   data-reveal-delay="240"                extra delay in ms
 *   data-depth                             publishes --mx / --my / --sp (see depth.ts)
 *   data-ambient                           infinite animations pause while off-screen
 *
 * Reduced motion and `?lite` skip everything, leaving the content static and visible.
 *
 * `eager`: reveals begin as content approaches the bottom of the viewport, and anything
 * already on screen is released on every scroll frame, so nothing visible can sit blank
 * while the observer catches up. For long pages read at speed.
 */
export default function MotionScope({
  as = 'div',
  className,
  children,
  eager = false,
}: {
  as?: ScopeTag;
  eager?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches || new URLSearchParams(window.location.search).has('lite')) {
      root.classList.add('motion-idle');
      return () => root.classList.remove('motion-idle');
    }

    // Reveals ---------------------------------------------------------------
    // data-cue gets the same timing as data-reveal but no shared styles: the page's own
    // CSS choreographs it from [data-shown].
    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal], [data-cue]'));
    const show = (target: Element) => target.setAttribute('data-shown', '');
    for (const target of targets) {
      const delay = target.dataset.revealDelay;
      if (delay) target.style.setProperty('--reveal-delay', `${delay}ms`);
      if (target.dataset.reveal === 'stagger') {
        Array.from(target.children).forEach((child, index) =>
          (child as HTMLElement).style.setProperty('--i', String(index))
        );
      }
      if (target.dataset.reveal === 'draw') {
        target.querySelectorAll<SVGElement>('[pathLength]').forEach((path, index) =>
          path.style.setProperty('--i', String(index))
        );
      }
      // Anything already on screen at hydration stays put: hiding it now would flash.
      if (target.getBoundingClientRect().top < window.innerHeight * 0.9) show(target);
    }
    root.classList.add('motion-ready');

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Also release anything the visitor has already scrolled past (deep links, reloads).
          if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) {
            show(entry.target);
            revealObserver.unobserve(entry.target);
          }
        }
      },
      eager ? { threshold: 0, rootMargin: '0px 0px 12% 0px' } : { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );
    const pending = new Set(targets.filter((t) => !t.hasAttribute('data-shown')));
    pending.forEach((t) => revealObserver.observe(t));

    // A fast jump (chapter link, End key) can skip clean over a target without it ever
    // intersecting, so the observer never fires. Release anything scrolled past.
    let sweepFrame = 0;
    const sweep = () => {
      sweepFrame = 0;
      for (const target of pending) {
        if (target.hasAttribute('data-shown')) pending.delete(target);
        else if (eager ? target.getBoundingClientRect().top < window.innerHeight : target.getBoundingClientRect().bottom < 0) {
          show(target);
          revealObserver.unobserve(target);
          pending.delete(target);
        }
      }
      if (!pending.size) window.removeEventListener('scroll', onScroll);
    };
    const onScroll = () => {
      if (!sweepFrame) sweepFrame = requestAnimationFrame(sweep);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Ambient loops sleep off-screen ------------------------------------------
    const ambientObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) entry.target.classList.toggle('motion-idle', !entry.isIntersecting);
    });
    root.querySelectorAll('[data-ambient]').forEach((el) => ambientObserver.observe(el));

    // Depth -------------------------------------------------------------------
    const detachDepth = Array.from(root.querySelectorAll<HTMLElement>('[data-depth]')).map(attachDepth);

    const releaseAll = () => {
      if (reduced.matches) targets.forEach(show);
    };
    reduced.addEventListener('change', releaseAll);

    return () => {
      revealObserver.disconnect();
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(sweepFrame);
      ambientObserver.disconnect();
      detachDepth.forEach((detach) => detach());
      reduced.removeEventListener('change', releaseAll);
      root.classList.remove('motion-ready');
    };
  }, [eager]);

  // All scope tags share HTMLElement behaviour; typed as div so one ref fits every tag.
  const Tag = as as 'div';
  return <Tag ref={ref} className={className}>{children}</Tag>;
}
