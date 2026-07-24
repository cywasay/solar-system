'use client';

import React, { useEffect, useRef } from 'react';

interface RevealProps {
  children: React.ReactNode;
  /** Stagger, in ms, applied once the element scrolls into view. */
  delay?: number;
  className?: string;
}

/**
 * Wraps content so it rises and fades in the first time it enters the viewport. Uses a
 * one-shot IntersectionObserver (unobserves after firing) and toggles a CSS class — no
 * per-frame work, no layout-triggering properties. If IntersectionObserver is missing
 * (or the effect never runs), the content is revealed immediately so nothing can get
 * stranded hidden.
 */
export default function Reveal({ children, delay = 0, className = '' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === 'undefined') {
      element.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            element.classList.add('is-visible');
            observer.unobserve(element);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
