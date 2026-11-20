'use client';

import { useEffect } from 'react';
import type Lenis from 'lenis';

const scrollKeys = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

/** Ease the real document scroll so the landing pages can read window.scrollY. */
export default function SmoothScroll() {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('lite')) {
      const root = document.documentElement;
      root.classList.add('motion-idle');
      return () => root.classList.remove('motion-idle');
    }

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let lenis: Lenis | undefined;
    let cancelled = false;

    const cancelGlide = () => {
      if (lenis?.isScrolling !== 'smooth') return;
      lenis.stop();
      lenis.start();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (scrollKeys.has(event.key)) cancelGlide();
    };

    const followChapterLink = (event: MouseEvent) => {
      if (!lenis || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
      if (!link?.hash || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
      const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (!target) return;

      // Handle the fragment once, so the browser's immediate jump cannot compete with the glide.
      event.preventDefault();
      if (window.location.hash !== link.hash) window.history.pushState(null, '', link.hash);
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
        target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
      }
      target.focus({ preventScroll: true });
      lenis.scrollTo(target, { duration: 0.85 });
    };

    const syncMotion = async () => {
      if (motion.matches) {
        lenis?.destroy();
        lenis = undefined;
        return;
      }
      const { default: ScrollEngine } = await import('lenis');
      if (cancelled || motion.matches || lenis) return;
      lenis = new ScrollEngine({
        lerp: 0.09,
        smoothWheel: true,
        syncTouch: false,
        stopInertiaOnNavigate: true,
        autoRaf: true,
      });
    };

    void syncMotion();
    motion.addEventListener('change', syncMotion);
    window.addEventListener('click', followChapterLink);
    window.addEventListener('popstate', cancelGlide);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelled = true;
      motion.removeEventListener('change', syncMotion);
      window.removeEventListener('click', followChapterLink);
      window.removeEventListener('popstate', cancelGlide);
      window.removeEventListener('keydown', onKeyDown);
      lenis?.destroy();
    };
  }, []);

  return null;
}
