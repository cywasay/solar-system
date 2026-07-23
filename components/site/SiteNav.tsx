'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { planets } from '@/data/planets';

/** The house ease — same curve as every CTA sweep on the landing page. */
const EASE = 'ease-[cubic-bezier(0.83,0,0.17,1)]';

const primaryLinks = [
  { href: '/', label: 'Home', index: '01' },
  { href: '/explore', label: 'Explore', index: '02' },
  { href: '/contact', label: 'Contact', index: '03' },
];

/**
 * Site-wide navigation: a fixed [ Menu ] trigger (bottom-right, the one corner no page
 * uses) opening a right-hand drawer. All motion is transform/opacity only. The panel
 * slide and the item reveals are choreographed separately: items rise and fade in a
 * 40ms stagger *after* the panel commits, and collapse instantly with it on close —
 * staggering a close just makes the UI feel slow to obey.
 */
export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Every link inside the drawer closes it on click (see `close` below) — more direct
  // than watching pathname, and safe even for same-route clicks that don't navigate.
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
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

  /** Staggered rise-and-fade for drawer content; `index` positions it in the sequence. */
  const reveal = (index: number) => ({
    className: `transition-[opacity,transform] duration-500 ${EASE} motion-reduce:transition-none ${
      open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
    }`,
    style: { transitionDelay: open ? `${120 + index * 40}ms` : '0ms' },
  });

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <>
      {/* Trigger — fades out under the backdrop when open; the panel's own [ Close ]
          takes over as the single visible control. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="site-nav-panel"
        aria-label="Open navigation"
        className={`group fixed bottom-6 right-6 z-[90] overflow-hidden border border-[#27272A]/70 bg-[#09090B]/80 backdrop-blur-sm px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#A1A1AA] transition-[color,opacity] duration-300 hover:text-[#09090B] ${
          open ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <span
          className={`absolute inset-0 bg-[#FF4500] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ${EASE}`}
        />
        <span className="relative">[ Menu ]</span>
      </button>

      {/* Backdrop */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[95] bg-[#09090B]/70 backdrop-blur-sm transition-opacity duration-500 motion-reduce:transition-none ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panel */}
      <aside
        id="site-nav-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        inert={!open}
        className={`fixed inset-y-0 right-0 z-[100] w-full sm:w-[26rem] bg-[#09090B] border-l border-[#27272A] flex flex-col overflow-y-auto transition-transform duration-500 ${EASE} motion-reduce:transition-none ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-8 pt-7 pb-6 border-b border-[#27272A]/70">
          <span
            {...reveal(0)}
            // Nested span so the reveal transform doesn't fight the flex layout.
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#71717A]">
              Index
            </span>
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A1A1AA] hover:text-[#FF4500] transition-colors duration-200"
          >
            [ Close ]
          </button>
        </div>

        {/* Primary destinations */}
        <nav className="px-8 pt-10 pb-8" aria-label="Primary">
          <ul className="space-y-5">
            {primaryLinks.map((link, i) => (
              <li key={link.href} {...reveal(1 + i)}>
                <Link
                  href={link.href}
                  onClick={close}
                  className="group flex items-baseline gap-4"
                  aria-current={isActive(link.href) ? 'page' : undefined}
                >
                  <span
                    className={`font-mono text-[10px] transition-colors duration-200 ${
                      isActive(link.href)
                        ? 'text-[#FF4500]'
                        : 'text-[#71717A] group-hover:text-[#FF4500]'
                    }`}
                  >
                    {link.index}
                  </span>
                  <span
                    className={`font-serif text-5xl leading-none tracking-tight transition-transform duration-300 ${EASE} group-hover:translate-x-2 ${
                      isActive(link.href) ? 'text-[#FAFAFA] italic' : 'text-[#A1A1AA] group-hover:text-[#FAFAFA]'
                    }`}
                  >
                    {link.label}
                  </span>
                  <span
                    aria-hidden
                    className={`font-mono text-lg text-[#FF4500] opacity-0 -translate-x-2 transition-[opacity,transform] duration-300 ${EASE} group-hover:opacity-100 group-hover:translate-x-0`}
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Planetary index */}
        <nav className="px-8 pt-6 pb-10 border-t border-[#27272A]/70 flex-1" aria-label="Planets">
          <h2 {...reveal(4)}>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#71717A]">
              Planetary Index
            </span>
          </h2>
          <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3">
            {planets.map((planet, i) => {
              const href = `/planets/${planet.name.toLowerCase()}`;
              const active = pathname === href;
              return (
                <li key={planet.name} {...reveal(5 + i)}>
                  <Link
                    href={href}
                    onClick={close}
                    aria-current={active ? 'page' : undefined}
                    className="group flex items-baseline gap-2.5"
                  >
                    <span
                      className={`font-mono text-[10px] transition-colors duration-200 ${
                        active ? 'text-[#FF4500]' : 'text-[#71717A] group-hover:text-[#FF4500]'
                      }`}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={`font-serif text-xl leading-tight transition-colors duration-200 ${
                        active ? 'text-[#FAFAFA] italic' : 'text-[#A1A1AA] group-hover:text-[#FAFAFA]'
                      }`}
                    >
                      {planet.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-8 py-6 border-t border-[#27272A]/70">
          <div
            {...reveal(13)}
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#71717A] flex justify-between">
              <span>Simulation.01</span>
              <span>Orbital Mechanics</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
