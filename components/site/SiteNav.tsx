'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { planets } from '@/data/planets';

/** The house ease — the same curve as every CTA sweep. */
const EASE = 'ease-[cubic-bezier(0.83,0,0.17,1)]';

const primaryLinks = [
  { href: '/', label: 'Home', index: '01' },
  { href: '/explore', label: 'Explore', index: '02' },
  { href: '/contact', label: 'Contact', index: '03' },
  { href: '/admin', label: 'Admin', index: '04' },
];

/* ─── Starfield Canvas ─── */
function Starfield({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);

    const COUNT = 220;
    const stars = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    const handleResize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    let t = 0;
    const draw = () => {
      t++;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = w;
        if (s.x > w) s.x = 0;
        if (s.y < 0) s.y = h;
        if (s.y > h) s.y = 0;

        const alpha = 0.35 + 0.65 * ((Math.sin(t * s.twinkleSpeed + s.twinkleOffset) + 1) / 2);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(248, 250, 252, ${alpha})`;
        ctx.fill();
      }
      animRef.current = requestAnimationFrame(draw);
    };

    if (active) draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: active ? 1 : 0, transition: 'opacity 0.8s' }}
    />
  );
}

/* ─── Cursor Glow ─── */
function CursorGlow({ active }: { active: boolean }) {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const el = glowRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      el.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [active]);

  if (!active) return null;
  return (
    <div
      ref={glowRef}
      aria-hidden
      className="fixed top-0 left-0 z-[101] pointer-events-none"
      style={{
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(234,88,12,0.06) 0%, rgba(234,88,12,0.02) 35%, transparent 70%)',
        willChange: 'transform',
      }}
    />
  );
}

/**
 * Site-wide navigation. The trigger sits bottom-right — the one corner no page uses —
 * and opens a full-screen curtain that rises from the trigger's edge. Motion is
 * transform/opacity only. Content reveals are choreographed: primary destinations rise
 * first, the planetary index follows in a tighter ripple, and everything collapses
 * instantly with the curtain on close (a staggered close reads as disobedience).
 */
export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const close = () => setOpen(false);

  // Listen for external open triggers (e.g. from navbar menu button)
  useEffect(() => {
    const handleExternalOpen = () => setOpen(true);
    window.addEventListener('open-site-nav', handleExternalOpen);
    return () => window.removeEventListener('open-site-nav', handleExternalOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [open]);

  /** Staggered rise for curtain content; `step` positions it in the sequence. */
  const reveal = useCallback((step: number) => ({
    className: `transition-[opacity,transform] duration-500 ${EASE} motion-reduce:transition-none ${
      open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
    }`,
    style: { transitionDelay: open ? `${140 + step * 45}ms` : '0ms' },
  }), [open]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  // Hide the global site navigation entirely when inside the admin portal.
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <CursorGlow active={open} />

      {/* Curtain */}
      <div
        id="site-nav-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        inert={!open}
        className={`fixed inset-0 z-[100] bg-[#020617] text-[#F8FAFC] flex flex-col overflow-y-auto scrollbar-none transition-transform duration-[600ms] ${EASE} motion-reduce:transition-none ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Animated starfield canvas */}
        <Starfield active={open} />

        {/* Slowly rotating orrery rings */}
        <div
          aria-hidden
          className="absolute -top-[24vmin] -right-[24vmin] w-[70vmin] aspect-square pointer-events-none select-none"
        >
          {[
            { size: 100, dur: '90s' },
            { size: 68, dur: '60s' },
            { size: 38, dur: '35s' },
          ].map(({ size, dur }) => (
            <div
              key={size}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#1E293B]/70"
              style={{
                width: `${size}%`,
                height: `${size}%`,
                animation: `spin ${dur} linear infinite`,
              }}
            />
          ))}
          {/* Pulsing sun dot */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#EA580C]"
            style={{
              boxShadow: '0 0 12px 4px rgba(234,88,12,0.5), 0 0 30px 8px rgba(234,88,12,0.2)',
              animation: 'pulse-glow 2s ease-in-out infinite',
            }}
          />
          {/* Tiny orbiting planet on the middle ring */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: '68%',
              height: '68%',
              animation: 'spin 60s linear infinite reverse',
            }}
          >
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-300"
              style={{ boxShadow: '0 0 6px 2px rgba(248,250,252,0.3)' }}
            />
          </div>
        </div>

        <div className="relative flex items-center justify-between px-6 md:px-12 lg:px-24 pt-7 pb-6 border-b border-[#1E293B]">
          <span {...reveal(0)}>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
              Index
            </span>
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-400 hover:text-[#EA580C] transition-colors duration-200 cursor-pointer group"
          >
            <span className="group-hover:tracking-[0.35em] transition-all duration-300">[ Close ]</span>
          </button>
        </div>

        <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 px-6 md:px-12 lg:px-24 py-4 lg:py-6 overflow-y-auto">
          {/* Primary destinations */}
          <nav className="lg:col-span-7 flex flex-col justify-center" aria-label="Primary">
            <ul className="space-y-2.5 lg:space-y-4">
              {primaryLinks.map((link, i) => (
                <li key={link.href} {...reveal(1 + i)}>
                  <Link
                    href={link.href}
                    onClick={close}
                    aria-current={isActive(link.href) ? 'page' : undefined}
                    className="group flex items-baseline gap-4 relative"
                    onMouseEnter={() => setHoveredLink(link.href)}
                    onMouseLeave={() => setHoveredLink(null)}
                  >
                    {/* Ambient glow behind hovered text */}
                    <span
                      aria-hidden
                      className="absolute -left-4 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full pointer-events-none transition-opacity duration-500"
                      style={{
                        background: 'radial-gradient(circle, rgba(234,88,12,0.15) 0%, transparent 70%)',
                        opacity: hoveredLink === link.href ? 1 : 0,
                      }}
                    />
                    <span
                      className={`font-mono text-[11px] transition-all duration-300 ${
                        isActive(link.href)
                          ? 'text-[#EA580C]'
                          : 'text-slate-500 group-hover:text-[#EA580C]'
                      } ${hoveredLink === link.href ? 'translate-x-1' : ''}`}
                    >
                      {link.index}
                    </span>
                    <span
                      className={`font-serif uppercase text-[clamp(2.2rem,5vw,4.5rem)] leading-[0.95] tracking-tight transition-all duration-300 ${EASE} group-hover:translate-x-3 ${
                        isActive(link.href)
                          ? 'italic text-[#F8FAFC]'
                          : 'text-slate-400 group-hover:text-[#F8FAFC]'
                      }`}
                      style={{
                        textShadow: hoveredLink === link.href
                          ? '0 0 30px rgba(234,88,12,0.25), 0 0 60px rgba(234,88,12,0.1)'
                          : 'none',
                        transition: 'text-shadow 0.4s, color 0.3s, transform 0.3s',
                      }}
                    >
                      {link.label}
                    </span>
                    <span
                      aria-hidden
                      className={`font-mono text-xl text-[#EA580C] opacity-0 -translate-x-3 transition-[opacity,transform] duration-300 ${EASE} group-hover:opacity-100 group-hover:translate-x-0`}
                    >
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Planetary index with dotted leaders — print-catalogue register. */}
          <nav
            className="lg:col-span-5 lg:border-l lg:border-[#1E293B] lg:pl-10 flex flex-col justify-center"
            aria-label="Planets"
          >
            <h2 {...reveal(4)}>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
                Planetary index
              </span>
            </h2>
            <ul className="mt-3 lg:mt-5 space-y-1.5 lg:space-y-2.5">
              {planets.map((planet, i) => {
                const href = `/planets/${planet.name.toLowerCase()}`;
                const active = pathname === href;
                return (
                  <li key={planet.name} {...reveal(5 + i * 0.6)}>
                    <Link
                      href={href}
                      onClick={close}
                      aria-current={active ? 'page' : undefined}
                      className="group flex items-baseline relative overflow-hidden py-0.5 rounded"
                    >
                      {/* Scanning highlight bar on hover */}
                      <span
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-[#EA580C]/[0.06] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"
                      />
                      <span
                        className={`font-mono text-[10px] w-6 transition-all duration-200 ${
                          active ? 'text-[#EA580C]' : 'text-slate-500 group-hover:text-[#EA580C]'
                        }`}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={`font-serif text-xl tracking-tight transition-all duration-200 group-hover:translate-x-1 ${
                          active ? 'italic text-[#F8FAFC]' : 'text-slate-400 group-hover:text-[#F8FAFC]'
                        }`}
                      >
                        {planet.name}
                      </span>
                      <span
                        aria-hidden
                        className="flex-1 border-b border-dotted border-[#1E293B] mx-3 -translate-y-1 group-hover:border-[#334155] transition-colors duration-300"
                      />
                      <span className="font-mono text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors duration-200">
                        {parseFloat(planet.facts.distance).toFixed(2)} AU
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Enter the Simulation CTA */}
        <div className="relative px-6 md:px-12 lg:px-24 py-3 lg:py-4 border-t border-[#1E293B] shrink-0">
          <div {...reveal(9)}>
            <Link
              href="/explore"
              onClick={close}
              className={`group relative flex items-center justify-center gap-4 w-full py-3.5 border border-[#EA580C] hover:bg-[#EA580C] text-[#EA580C] hover:text-[#020617] font-mono text-xs sm:text-sm uppercase tracking-[0.2em] transition-all duration-300 ${EASE} overflow-hidden`}
              style={{
                boxShadow: '0 0 20px rgba(234,88,12,0.1), inset 0 0 20px rgba(234,88,12,0.03)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px rgba(234,88,12,0.3), inset 0 0 30px rgba(234,88,12,0.05)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(234,88,12,0.1), inset 0 0 20px rgba(234,88,12,0.03)';
              }}
            >
              {/* Sweeping shimmer on hover */}
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none"
              />
              <span className="font-semibold relative z-10">Enter the Simulation</span>
              <span
                aria-hidden
                className={`text-lg relative z-10 transition-transform duration-300 ${EASE} group-hover:translate-x-2`}
              >
                →
              </span>
            </Link>
          </div>
        </div>

        <div className="relative px-6 md:px-12 lg:px-24 py-4 border-t border-[#1E293B] shrink-0">
          <div {...reveal(10)}>
            <div className="flex flex-wrap justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-600">
              <span>Simulation.01 — Thessaris</span>
              <span>09 bodies · 03 satellites · No analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Keyframes injected once */}
      <style jsx global>{`
        @keyframes spin {
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 12px 4px rgba(234,88,12,0.5), 0 0 30px 8px rgba(234,88,12,0.2); }
          50% { box-shadow: 0 0 20px 8px rgba(234,88,12,0.7), 0 0 50px 16px rgba(234,88,12,0.3); }
        }
      `}</style>
    </>
  );
}
