'use client';

import { createContext, useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './PortfolioWork.module.css';

let workRevealed = false;
export const WorkRevealContext = createContext(false);

export default function WorkReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (workRevealed || preference.matches || new URLSearchParams(location.search).has('lite')) {
      setReady(true);
      return;
    }
    section.dataset.reveal = 'waiting';
    let timer: ReturnType<typeof setTimeout>;
    let frame = 0;
    let started = false;
    const stopWatching = () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      sizeObserver.disconnect();
      cancelAnimationFrame(frame);
    };
    const finish = () => {
      started = true;
      workRevealed = true;
      stopWatching();
      section.dataset.reveal = 'complete';
      setReady(true);
    };
    const checkVisibility = () => {
      frame = 0;
      if (started) return;
      const bounds = section.getBoundingClientRect();
      const viewportHeight = document.documentElement.clientHeight;
      // A tall section cannot fit in the viewport. Start when its top reaches
      // the screen edge; otherwise require the whole section to be visible.
      const visible = bounds.height > viewportHeight
        ? bounds.top <= 2 && bounds.bottom >= viewportHeight - 2
        : bounds.top >= -2 && bounds.bottom <= viewportHeight + 2;
      if (!visible) return;
      started = true;
      stopWatching();
      workRevealed = true;
      section.dataset.reveal = 'playing';
      setReady(true);
      timer = setTimeout(finish, 3200);
    };
    function schedule() {
      if (!frame && !started) frame = requestAnimationFrame(checkVisibility);
    }
    const sizeObserver = new ResizeObserver(schedule);
    sizeObserver.observe(section);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
    preference.addEventListener('change', finish);
    // Keyboard users never have to wait for a visual reveal to access a link.
    section.addEventListener('focusin', finish);
    return () => {
      stopWatching();
      clearTimeout(timer);
      preference.removeEventListener('change', finish);
      section.removeEventListener('focusin', finish);
      delete section.dataset.reveal;
    };
  }, []);

  return <WorkRevealContext.Provider value={ready}><section ref={ref} id="work" className={styles.work} aria-labelledby="work-title">{children}</section></WorkRevealContext.Provider>;
}
