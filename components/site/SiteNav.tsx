'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { planets } from '@/data/planets';

/** The house ease — the same curve as every CTA sweep. */
const EASE = 'ease-[cubic-bezier(0.83,0,0.17,1)]';

const primaryLinks = [
  { href: '/', label: 'Home', index: '01' },
  { href: '/explore', label: 'Explore', index: '02' },
  { href: '/contact', label: 'Contact', index: '03' },
];

/**
 * Site-wide navigation. The trigger sits bottom-right — the one corner no page uses —
 * and opens a full-screen curtain that rises from the trigger's edge. Motion is
 * transform/opacity only. Content reveals are choreographed: primary destinations rise
 * first, the planetary index follows in a tighter ripple, and everything collapses
 * instantly with the curtain on close (a staggered close reads as disobedience).
 */
export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const close = () => setOpen(false);

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
  const reveal = (step: number) => ({
    className: `transition-[opacity,transform] duration-500 ${EASE} motion-reduce:transition-none ${
      open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
    }`,
    style: { transitionDelay: open ? `${140 + step * 45}ms` : '0ms' },
  });

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <>
      {/* Trigger — hands over to the curtain's [ Close ] when open. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="site-nav-panel"
        aria-label="Open navigation"
        // NO backdrop-blur here. This element is `fixed`, and a fixed backdrop-filter
        // makes the compositor re-sample and re-blur the page behind it on EVERY scroll
        // frame — a permanent scroll-jank tax, worsened by smooth scrolling because the
        // page is then in continuous motion. Against a near-black page an 80% overlay
        // already reads as opaque, so the blur was buying nothing.
        className={`group fixed bottom-6 right-6 z-[90] overflow-hidden border border-[#1E293B] bg-[#020617] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400 transition-[color,opacity] duration-300 hover:text-[#020617] ${
          open ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <span
          className={`absolute inset-0 bg-[#EA580C] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ${EASE}`}
        />
        <span className="relative">[ Menu ]</span>
      </button>

      {/* Curtain */}
      <div
        id="site-nav-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        inert={!open}
        className={`fixed inset-0 z-[100] bg-[#020617] text-[#F8FAFC] flex flex-col overflow-y-auto transition-transform duration-[600ms] ${EASE} motion-reduce:transition-none ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Static echo of the hero orrery, bleeding off the top-right corner. */}
        <div
          aria-hidden
          className="absolute -top-[24vmin] -right-[24vmin] w-[70vmin] aspect-square pointer-events-none select-none"
        >
          {[100, 68, 38].map((size) => (
            <div
              key={size}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#1E293B]/70"
              style={{ width: `${size}%`, height: `${size}%` }}
            />
          ))}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
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
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-400 hover:text-[#EA580C] transition-colors duration-200"
          >
            [ Close ]
          </button>
        </div>

        <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 px-6 md:px-12 lg:px-24 py-12 lg:py-16">
          {/* Primary destinations */}
          <nav className="lg:col-span-7 flex flex-col justify-center" aria-label="Primary">
            <ul className="space-y-6 md:space-y-8">
              {primaryLinks.map((link, i) => (
                <li key={link.href} {...reveal(1 + i)}>
                  <Link
                    href={link.href}
                    onClick={close}
                    aria-current={isActive(link.href) ? 'page' : undefined}
                    className="group flex items-baseline gap-5"
                  >
                    <span
                      className={`font-mono text-[11px] transition-colors duration-200 ${
                        isActive(link.href)
                          ? 'text-[#EA580C]'
                          : 'text-slate-500 group-hover:text-[#EA580C]'
                      }`}
                    >
                      {link.index}
                    </span>
                    <span
                      className={`font-serif uppercase text-[clamp(3rem,8vw,6.5rem)] leading-[0.9] tracking-tight transition-transform duration-300 ${EASE} group-hover:translate-x-3 ${
                        isActive(link.href)
                          ? 'italic text-[#F8FAFC]'
                          : 'text-slate-400 group-hover:text-[#F8FAFC]'
                      }`}
                    >
                      {link.label}
                    </span>
                    <span
                      aria-hidden
                      className={`font-mono text-2xl text-[#EA580C] opacity-0 -translate-x-3 transition-[opacity,transform] duration-300 ${EASE} group-hover:opacity-100 group-hover:translate-x-0`}
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
            className="lg:col-span-5 lg:border-l lg:border-[#1E293B] lg:pl-12 flex flex-col justify-center"
            aria-label="Planets"
          >
            <h2 {...reveal(4)}>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
                Planetary index
              </span>
            </h2>
            <ul className="mt-8 space-y-3.5">
              {planets.map((planet, i) => {
                const href = `/planets/${planet.name.toLowerCase()}`;
                const active = pathname === href;
                return (
                  <li key={planet.name} {...reveal(5 + i * 0.6)}>
                    <Link
                      href={href}
                      onClick={close}
                      aria-current={active ? 'page' : undefined}
                      className="group flex items-baseline"
                    >
                      <span
                        className={`font-mono text-[10px] w-7 transition-colors duration-200 ${
                          active ? 'text-[#EA580C]' : 'text-slate-500 group-hover:text-[#EA580C]'
                        }`}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={`font-serif text-2xl tracking-tight transition-colors duration-200 ${
                          active ? 'italic text-[#F8FAFC]' : 'text-slate-400 group-hover:text-[#F8FAFC]'
                        }`}
                      >
                        {planet.name}
                      </span>
                      <span
                        aria-hidden
                        className="flex-1 border-b border-dotted border-[#1E293B] mx-4 -translate-y-1"
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

        <div className="relative px-6 md:px-12 lg:px-24 py-6 border-t border-[#1E293B]">
          <div {...reveal(10)}>
            <div className="flex flex-wrap justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-600">
              <span>Simulation.01 — Orbital Mechanics</span>
              <span>09 bodies · 03 satellites · No analytics</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
