'use client';

import React, { useEffect, useState } from 'react';

interface HeroParallaxProps {
  children: React.ReactNode;
  speed?: number; // Speed ratio, e.g., 0.15 for subtle parallax
}

export default function HeroParallax({ children, speed = 0.15 }: HeroParallaxProps) {
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      const currentScroll = window.scrollY;
      // Limit parallax calculation to first 1000px of scroll for optimal performance
      if (currentScroll < 1200) {
        animationFrameId = requestAnimationFrame(() => {
          setOffsetY(currentScroll * speed);
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [speed]);

  return (
    <div
      style={{
        transform: `translate3d(0, ${offsetY}px, 0)`,
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
}
