'use client';

import React, { useEffect, useRef, useState } from 'react';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: 'up' | 'none';
}

export default function FadeIn({ children, delay = 0, className = '', direction = 'up' }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const baseClasses = "transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[opacity,transform]";
  const directionClasses = direction === 'up' ? "translate-y-6" : "";
  const hiddenClasses = `opacity-0 ${directionClasses}`;
  const visibleClasses = "opacity-100 translate-y-0";

  return (
    <div
      ref={ref}
      className={`${baseClasses} ${isVisible ? visibleClasses : hiddenClasses} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
