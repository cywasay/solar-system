'use client';

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { prewarmExplore } from '@/components/explore/prewarmExplore';
import { useExploreTransition } from '@/components/explore/ExploreTransition';
import { apertureKeyframes, COVER_TIME, ENTRANCE_DURATION, orbitKeyframes, tremorKeyframes, type Body } from './orbitEntrance';
import styles from './OrbitEntrance.module.css';

interface Options {
  rootRef: RefObject<HTMLElement | null>;
  buttonRef: RefObject<HTMLAnchorElement | null>;
  closePanel: () => void;
  onBegin: (href: string) => void;
  onNavigate: (href: string) => void;
  onComplete: () => void;
  onCancel: () => void;
}

export function useOrbitEntrance({ rootRef, buttonRef, closePanel, onBegin, onNavigate, onComplete, onCancel }: Options) {
  const [destination, setDestination] = useState<string | null>(null);
  const [showLoader, setShowLoader] = useState(false);
  const runningRef = useRef(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const { phase, loaderRef, beginEntry, finishEntry, cancelEntry } = useExploreTransition();

  useLayoutEffect(() => {
    // Browser Back may leave the incoming route before the five-second timer.
    // The provider owns route cancellation; clear this choreography with it.
    if (destination && phase === 'idle') {
      setDestination(null);
      setShowLoader(false);
      runningRef.current = false;
      onCancel();
    }
  }, [phase, destination, onCancel]);

  useEffect(() => {
    const activate = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== '/explore') return;
      event.preventDefault();
      event.stopPropagation();
      if (runningRef.current) return;
      runningRef.current = true;
      const href = url.pathname + url.search + url.hash;
      prewarmExplore();
      closePanel();
      beginEntry();
      onBegin(href);
      setDestination(href);
    };
    // One entrance for the masthead, hero CTA, focused planet, and atlas links.
    // Modified clicks retain the browser's normal new-tab behaviour.
    document.addEventListener('click', activate, true);
    return () => document.removeEventListener('click', activate, true);
  }, [closePanel, onBegin, beginEntry]);

  useLayoutEffect(() => {
    if (!destination) return;
    const root = rootRef.current;
    const button = buttonRef.current;
    const backdrop = backdropRef.current;
    const loader = loaderRef.current;
    if (!root || !button || !backdrop || !loader) return;

    let cancelled = false;
    let navigating = false;
    let resizeTimer = 0;
    const animations: Animation[] = [];
    const timers: number[] = [];
    const viewport = { x: document.documentElement.clientWidth, y: window.innerHeight };
    const windowWidth = window.innerWidth;
    const sink = { x: viewport.x * (viewport.x < 700 ? .5 : .56), y: viewport.y * .43 };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduced ? 400 : ENTRANCE_DURATION;
    const coverTime = reduced ? 0 : COVER_TIME;
    const originalCollapse = Number(root.style.getPropertyValue('--collapse') || 0);
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const originalHeaderStyle = root.getAttribute('style');
    const originalRect = root.getBoundingClientRect();
    const bodyFor = (element: Element): Body => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, width: rect.width, height: rect.height };
    };
    const pieces = Array.from(root.querySelectorAll<HTMLElement>('[data-orbit-piece]'));
    const visibleBodies = pieces.map(bodyFor);
    // A placeholder preserves document geometry while the actual masthead becomes
    // fixed. Next's scroll-to-top on navigation cannot shift an in-flight orbit.
    const placeholder = document.createElement('div');
    const computed = getComputedStyle(root);
    placeholder.style.cssText = `height:${originalRect.height}px;flex:none;margin-top:${computed.marginTop};`;
    placeholder.setAttribute('aria-hidden', 'true');
    root.before(placeholder);
    root.dataset.entering = 'true';
    root.dataset.orbitPhase = 'capture';
    root.dataset.entryDuration = String(duration);
    root.style.setProperty('--entry-header-left', `${originalRect.left}px`);
    root.style.setProperty('--entry-header-top', `${originalRect.top}px`);
    root.style.setProperty('--entry-header-width', `${originalRect.width}px`);
    root.style.position = 'fixed';
    root.style.left = '0';
    root.style.top = '0';
    root.style.width = '100%';
    root.style.height = '100%';
    root.style.overflow = 'clip';
    root.style.margin = '0';
    button.focus({ preventScroll: true });
    const main = document.querySelector('body > main');
    const wasInert = main?.hasAttribute('inert') ?? false;
    main?.setAttribute('inert', '');
    const origin = bodyFor(button);
    // One shared clock makes six independent trajectories finish as one sequence.
    const startTime = document.timeline.currentTime;
    const animate = (element: Element, frames: Keyframe[], options: KeyframeAnimationOptions = {}) => {
      const animation = element.animate(frames, { duration, fill: 'both', easing: 'linear', ...options });
      if (startTime !== null) animation.startTime = startTime;
      animations.push(animation);
      return animation;
    };
    const schedule = (callback: () => void, time: number) => timers.push(window.setTimeout(callback, time));

    if (reduced) {
      animate(backdrop, [{ opacity: 0 }, { opacity: 1 }]);
      animate(loader, [{ opacity: 0 }, { opacity: 1 }]);
    } else {
      pieces.forEach((piece, index) => {
        const body = bodyFor(piece);
        const visible = visibleBodies[index];
        // A previously collapsed masthead unfurls from the disc into its orbit.
        // Expanded pieces always begin at their exact original layout positions.
        const start = { ...body, x: visible.x, y: visible.y };
        const scale = originalCollapse > .98 ? { x: 0, y: 0 } : {
          x: Math.min(1, visible.width / Math.max(1, body.width)),
          y: Math.min(1, visible.height / Math.max(1, body.height)),
        };
        const frames = orbitKeyframes(start, sink, viewport, index, scale);
        for (const frame of frames) frame.transform = `translate(${start.x - body.x}px, ${start.y - body.y}px) ${frame.transform}`;
        animate(piece, frames);
      });
      animate(button, apertureKeyframes(origin, sink, viewport));
      animate(button, tremorKeyframes());
      for (const child of button.children) {
        animate(child, [
          { offset: 0, transform: 'scale(1)' },
          { offset: .10, transform: 'scale(1)' },
          { offset: .20, transform: 'scale(0)' },
          { offset: 1, transform: 'scale(0)' },
        ]);
      }
      animate(backdrop, [{ opacity: 0 }, { opacity: 1, offset: .24 }, { opacity: 1 }]);
      // A matching dark aperture fills the screen, while the SAME loader well
      // resolves at its centre. No iris wipe to an unrelated, remounted spinner.
      animate(loader, [
        { opacity: 0, offset: 0 },
        { opacity: 0, offset: .84, easing: 'cubic-bezier(.22,.61,.36,1)' },
        { opacity: 1, offset: .97 },
        { opacity: 1, offset: 1 },
      ]);
      const core = loader.querySelector('[data-loader-core]');
      if (core) {
        const drift = `translate3d(${sink.x - viewport.x * .5}px, 0, 0)`;
        animate(core, [
          { transform: `${drift} scale(.55)`, offset: 0 },
          { transform: `${drift} scale(.55)`, offset: .82, easing: 'cubic-bezier(.22,.61,.36,1)' },
          { transform: 'translate3d(0,0,0) scale(1)', offset: 1 },
        ]);
      }
      for (const chrome of loader.querySelectorAll('[data-loader-chrome]')) {
        animate(chrome, [
          { opacity: 0, transform: 'translateY(8px)', offset: 0 },
          { opacity: 0, transform: 'translateY(8px)', offset: .88, easing: 'ease-out' },
          { opacity: 1, transform: 'translateY(0)', offset: 1 },
        ]);
      }
      schedule(() => { root.dataset.orbitPhase = 'orbit'; }, 1_050);
      schedule(() => { root.dataset.orbitPhase = 'expansion'; }, 4_050);
    }

    schedule(() => {
      if (cancelled) return;
      navigating = true;
      root.dataset.orbitPhase = 'handoff';
      setShowLoader(true);
      onNavigate(destination);
    }, coverTime);
    schedule(() => {
      if (!cancelled) { finishEntry(); onComplete(); }
    }, duration);

    const stopScroll = (event: Event) => event.preventDefault();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !navigating) {
        event.preventDefault();
        cancelled = true;
        setDestination(null);
        setShowLoader(false);
        runningRef.current = false;
        cancelEntry();
        onCancel();
      } else if (['Tab', ' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', 'Enter'].includes(event.key)) {
        event.preventDefault();
      }
    };
    const freezeScroll = () => {
      if (!navigating && (window.scrollY !== scrollY || window.scrollX !== scrollX)) window.scrollTo(scrollX, scrollY);
    };
    const finishResize = () => {
      // Responsive layout has moved the original bodies. Cover immediately rather
      // than replaying stale geometry or exposing an uncovered viewport corner.
      if (cancelled || (window.innerWidth === windowWidth && window.innerHeight === viewport.y)) return;
      timers.forEach(window.clearTimeout);
      animations.forEach(animation => animation.cancel());
      setShowLoader(true);
      finishEntry();
      root.dataset.orbitPhase = 'handoff';
      if (!navigating) {
        navigating = true;
        onNavigate(destination);
      }
      onComplete();
    };
    const onResize = () => {
      // Ignore transient resize notifications and scrollbar-only changes. A real
      // orientation change settles before we hand off to the responsive loader.
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(finishResize, 160);
    };
    window.addEventListener('wheel', stopScroll, { passive: false, capture: true });
    window.addEventListener('touchmove', stopScroll, { passive: false, capture: true });
    window.addEventListener('scroll', freezeScroll, { passive: true });
    window.addEventListener('resize', onResize);
    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
      window.clearTimeout(resizeTimer);
      animations.forEach(animation => animation.cancel());
      window.removeEventListener('wheel', stopScroll, true);
      window.removeEventListener('touchmove', stopScroll, true);
      window.removeEventListener('scroll', freezeScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('keydown', onKeyDown, true);
      placeholder.remove();
      if (originalHeaderStyle === null) root.removeAttribute('style');
      else root.setAttribute('style', originalHeaderStyle);
      delete root.dataset.entering;
      delete root.dataset.orbitPhase;
      delete root.dataset.entryDuration;
      if (main && !wasInert) main.removeAttribute('inert');
      if (!navigating) button.focus({ preventScroll: true });
      if (!navigating) cancelEntry();
    };
  }, [destination, rootRef, buttonRef, loaderRef, finishEntry, cancelEntry, onNavigate, onComplete, onCancel]);

  return {
    entering: destination !== null,
    overlay: destination ? createPortal(<>
      <div ref={backdropRef} className={styles.backdrop} aria-hidden="true" data-lenis-prevent />
      {!showLoader && <span className={styles.announcement} role="status">Entering the observatory.</span>}
    </>, document.body) : null,
  };
}
