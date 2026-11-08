'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import styles from './PortfolioWork.module.css';

let workRevealed = false;

export default function WorkReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = ref.current;
    if (!section || workRevealed) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches || new URLSearchParams(location.search).has('lite')) return;
    section.dataset.reveal = 'waiting';
    let timer: ReturnType<typeof setTimeout>;
    const finish = () => { section.dataset.reveal = 'complete'; };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      workRevealed = true;
      section.dataset.reveal = 'playing';
      timer = setTimeout(finish, 3200);
    }, { rootMargin: '0px 0px -15% 0px' });
    observer.observe(section);
    preference.addEventListener('change', finish);
    // Keyboard users never have to wait for a visual reveal to access a link.
    section.addEventListener('focusin', finish);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
      preference.removeEventListener('change', finish);
      section.removeEventListener('focusin', finish);
      delete section.dataset.reveal;
    };
  }, []);

  return <section ref={ref} id="work" className={styles.work} aria-labelledby="work-title">{children}</section>;
}
