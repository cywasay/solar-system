'use client';

import { useState } from 'react';

const capabilities = [
  {
    id: '01',
    title: 'System topology',
    line: 'Eight textured worlds, three moons and one star — placed, scaled and lit from a single dataset.',
    mode: 'topology',
    readout: '12 bodies / 1 hierarchy',
  },
  {
    id: '02',
    title: 'Orbital motion',
    line: 'Period ratios from sidereal data; Venus and Uranus genuinely turn backwards, every axis holds its published tilt.',
    mode: 'motion',
    readout: '0.24–164.8 Earth years',
  },
  {
    id: '03',
    title: 'Target tracking',
    line: 'The camera chases live positions, never snapshots — and yields the instant you grab the controls.',
    mode: 'tracking',
    readout: 'Live scene coordinates',
  },
  {
    id: '04',
    title: 'Satellite systems',
    line: 'Luna, Phobos and Deimos ride correctly nested orbits, tidally locked for free by the hierarchy.',
    mode: 'satellites',
    readout: '3 nested satellites',
  },
  {
    id: '05',
    title: 'Render pipeline',
    line: 'A high-dynamic-range sun that actually blooms, linear light falloff, ACES filmic grade.',
    mode: 'render',
    readout: 'HDR / ACES / bloom',
  },
  {
    id: '06',
    title: 'Time control',
    line: 'Pause outright, or run the system anywhere from a tenth of speed to five times over.',
    mode: 'time',
    readout: '0.1×–5.0× simulation',
  },
] as const;

function InstrumentScene({ mode }: { mode: (typeof capabilities)[number]['mode'] }) {
  return (
    <div className={`capability-scene capability-scene--${mode}`} aria-hidden>
      <span className="capability-grid" />
      <span className="capability-axis capability-axis--x" />
      <span className="capability-axis capability-axis--y" />

      {[24, 39, 55, 72].map((size, index) => (
        <span
          key={size}
          className={`capability-orbit capability-orbit--${index + 1}`}
          style={{ width: `${size}%`, height: `${size}%` }}
        >
          <span className="capability-orbit-body" />
        </span>
      ))}

      <span className="capability-sun" />
      <span className="capability-target">
        <span />
      </span>
      <span className="capability-satellite capability-satellite--one" />
      <span className="capability-satellite capability-satellite--two" />
      <span className="capability-satellite capability-satellite--three" />
      <span className="capability-scan" />
      <span className="capability-time-hand" />
    </div>
  );
}

export default function CapabilitiesInstrument() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = capabilities[activeIndex];

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] lg:gap-16">
      <div className="order-2 lg:order-1">
        {capabilities.map((capability, index) => {
          const selected = index === activeIndex;
          return (
            <button
              key={capability.id}
              type="button"
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
              aria-pressed={selected}
              className={`group relative block w-full border-t border-[#1E293B] py-5 text-left transition-colors duration-500 last:border-b focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#EA580C] sm:py-6 ${selected ? 'bg-[#F8FAFC]/[0.025]' : ''}`}
            >
              <span className={`absolute inset-y-0 left-0 w-px origin-center bg-[#EA580C] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${selected ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-50'}`} />
              <span className="flex items-baseline gap-4 px-3 sm:px-5">
                <span className={`font-serif text-lg italic transition-colors duration-300 ${selected ? 'text-[#EA580C]' : 'text-slate-600'}`}>
                  {capability.id}
                </span>
                <span className={`flex-1 font-serif text-xl transition-[color,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:text-2xl ${selected ? 'translate-x-1 text-white' : 'text-slate-300 group-hover:text-white'}`}>
                  {capability.title}
                </span>
                <span className={`text-[#EA580C] transition-[opacity,transform] duration-300 ${selected ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`}>
                  →
                </span>
              </span>
              <span className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${selected ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <span className="overflow-hidden">
                  <span className="block max-w-xl px-3 pb-1 pt-3 text-sm leading-relaxed text-slate-400 sm:px-5">
                    {capability.line}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="order-1 lg:order-2" aria-live="polite">
        <div className="sticky top-[14vh] overflow-hidden border-y border-[#1E293B]">
          <div className="flex items-center justify-between border-b border-[#1E293B] py-4 text-[10px] uppercase tracking-[0.2em] text-slate-500">
            <span>Working instrument</span>
            <span className="text-[#EA580C]">Mode {active.id}</span>
          </div>

          <div className="relative aspect-[4/3] min-h-[330px] overflow-hidden">
            <InstrumentScene key={active.mode} mode={active.mode} />
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-5 sm:bottom-7 sm:left-7 sm:right-7">
              <div>
                <span className="block text-[9px] uppercase tracking-[0.2em] text-slate-600">Active layer</span>
                <span className="mt-1 block font-serif text-2xl text-white sm:text-3xl">{active.title}</span>
              </div>
              <span className="max-w-[46%] break-words text-right text-[9px] uppercase leading-relaxed tracking-[0.1em] text-[#EA580C] sm:text-[10px] sm:tracking-[0.15em]">
                {active.readout}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
