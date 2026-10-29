'use client';

import React from 'react';

const EASE = 'ease-[cubic-bezier(0.83,0,0.17,1)]';

export default function MenuTrigger() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent('open-site-nav'))}
      className="group inline-flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-[0.2em] text-muted hover:text-fg transition-colors duration-300 cursor-pointer"
    >
      <span className="relative">
        <span>[ Menu ]</span>
        <span
          className={`absolute bottom-0 left-0 h-px w-full bg-accent origin-right scale-x-0 group-hover:scale-x-100 group-hover:origin-left transition-transform duration-300 ${EASE}`}
        />
      </span>
    </button>
  );
}
