'use client';

import { useEffect, useRef } from 'react';

export default function StarDrift() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;

    const setCanvasSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      initStars();
    };

    const handleResize = () => {
      setCanvasSize();
    };

    window.addEventListener('resize', handleResize);

    const stars: { x: number; y: number; size: number; speed: number; opacity: number }[] = [];

    const initStars = () => {
      stars.length = 0;
      // Sparse count (~50-80 stars max on typical screens)
      const count = Math.min(Math.floor((width * height) / 12000), 80);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.2 + 0.4,
          speed: Math.random() * 0.08 + 0.02, // Slow, ambient movement
          opacity: Math.random() * 0.35 + 0.08, // Very dim, restrained opacity
        });
      }
    };

    setCanvasSize();

    const render = () => {
      // Clear canvas with deep space navy background
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Faint ambient background depth wash
      const grad = ctx.createRadialGradient(width * 0.8, height * 0.2, 0, width * 0.8, height * 0.2, width * 0.7);
      grad.addColorStop(0, 'rgba(30, 58, 138, 0.08)');
      grad.addColorStop(1, 'rgba(2, 6, 23, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Render drifting stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.y -= star.speed;
        star.x -= star.speed * 0.15;
        
        if (star.y < 0) star.y = height;
        if (star.x < 0) star.x = width;

        ctx.fillStyle = `rgba(248, 250, 252, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[-1]"
    />
  );
}
