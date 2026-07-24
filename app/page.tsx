import React from 'react';
import Link from 'next/link';
import { planets } from '@/data/planets';
import { planetEditorial } from '@/data/planetEditorial';
import HeroOrrery from '@/components/landing/HeroOrrery';
import Reveal from '@/components/landing/Reveal';
import JourneyRail from '@/components/landing/JourneyRail';

/* ---------------------------------------------------------------------------
 * The landing page as an editorial front page. Every figure is pulled from the
 * same data files that drive the simulation — the orrery spins at real compressed
 * periods, the ledger lists the actual eight worlds. Two voices only: Newsreader
 * for display and prose, Geist (sans) for quiet labels. No monospace chrome.
 * ------------------------------------------------------------------------- */

const EASE = 'ease-[cubic-bezier(0.83,0,0.17,1)]';

const auOf = (name: string) =>
  parseFloat(planets.find((p) => p.name === name)!.facts.distance).toFixed(2);

const velocityOf = (name: string) =>
  planetEditorial[name].stats.find((s) => s.label === 'Orbital velocity')?.value ?? '';

const capabilities = [
  {
    id: '01',
    title: 'System topology',
    line: 'Eight textured worlds, three moons and one star — placed, scaled and lit from a single dataset.',
  },
  {
    id: '02',
    title: 'Orbital motion',
    line: 'Period ratios from sidereal data; Venus and Uranus genuinely turn backwards, every axis holds its published tilt.',
  },
  {
    id: '03',
    title: 'Target tracking',
    line: 'The camera chases live positions, never snapshots — and yields the instant you grab the controls.',
  },
  {
    id: '04',
    title: 'Satellite systems',
    line: 'Luna, Phobos and Deimos ride correctly nested orbits, tidally locked for free by the hierarchy.',
  },
  {
    id: '05',
    title: 'Render pipeline',
    line: 'A high-dynamic-range sun that actually blooms, linear light falloff, ACES filmic grade.',
  },
  {
    id: '06',
    title: 'Time control',
    line: 'Pause outright, or run the system anywhere from a tenth of speed to five times over.',
  },
];

/** Quiet editorial eyebrow — small sans caps, a number, a hairline. No mono, no brackets. */
function Eyebrow({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-16">
      <span className="font-serif italic text-lg text-[#EA580C]">{index}</span>
      <span className="text-xs tracking-[0.18em] uppercase text-slate-400">{children}</span>
      <span aria-hidden className="flex-1 h-px bg-[#1E293B]" />
    </div>
  );
}

/** One run of the running masthead; rendered twice for a seamless -50% loop. */
function MarqueeRun({ hidden }: { hidden?: boolean }) {
  return (
    <span
      aria-hidden={hidden}
      className="flex items-center gap-8 pr-8 font-serif italic text-2xl md:text-3xl text-slate-400"
    >
      {planets.map((planet) => (
        <React.Fragment key={planet.name}>
          <span>{planet.name}</span>
          <span className="text-[#EA580C]/70 not-italic text-base">✦</span>
        </React.Fragment>
      ))}
    </span>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-[#F8FAFC] overflow-x-hidden selection:bg-[#EA580C] selection:text-white">
      {/* Scroll-as-journey: depart the Sun, travel outward past each named world. */}
      <JourneyRail />

      {/* Masthead */}
      <nav className="relative z-20 flex justify-between items-center px-6 md:px-12 lg:px-24 py-7">
        <Link href="/" className="font-serif text-lg md:text-xl tracking-tight text-slate-200">
          Orbital Mechanics
        </Link>
        <Link
          href="/explore"
          className="group inline-flex flex-col items-end text-sm text-slate-300 hover:text-white transition-colors duration-300"
        >
          <span>Enter simulation</span>
          <span
            className={`mt-0.5 h-px w-full bg-[#EA580C] origin-right scale-x-0 group-hover:scale-x-100 group-hover:origin-left transition-transform duration-300 ${EASE}`}
          />
        </Link>
      </nav>

      {/* Hero */}
      <header className="relative min-h-[92vh] flex flex-col justify-between overflow-hidden border-b border-[#1E293B] px-6 md:px-12 lg:px-24 pt-16 md:pt-24 pb-10">
        {/* Ambient breathing glow, behind the orrery. */}
        <div
          aria-hidden
          className="glow-breathe absolute left-[70%] top-1/2 w-[70vmin] h-[70vmin] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(234,88,12,0.12), transparent 60%)' }}
        />
        <HeroOrrery />

        <div className="relative z-10">
          <h1 className="font-serif uppercase leading-[0.82] tracking-tight">
            <span className="rise-in block text-[16vw] md:text-[12.5vw]" style={{ animationDelay: '80ms' }}>
              Orbital
            </span>
            <span
              className="rise-in block text-[16vw] md:text-[12.5vw] italic md:ml-[9vw]"
              style={{ animationDelay: '200ms' }}
            >
              Mechanics<span className="text-[#EA580C] not-italic">.</span>
            </span>
          </h1>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-10 items-end mt-16">
          <div
            className="rise-in md:col-span-6 lg:col-span-5"
            style={{ animationDelay: '360ms' }}
          >
            <p className="font-serif text-2xl md:text-3xl leading-snug text-slate-300">
              Eight worlds, three moons and one star, running live at honest ratios — a
              hand-built orrery for the browser.
            </p>
            <p className="mt-6 text-sm leading-relaxed text-slate-500 max-w-md">
              Size, distance and time, each compressed along its own curve so the whole
              system stays watchable — while the ordering stays true.
            </p>
          </div>

          <div
            className="rise-in md:col-span-4 md:col-start-9 md:text-right"
            style={{ animationDelay: '480ms' }}
          >
            <p className="font-serif text-xl italic text-slate-400 leading-relaxed">
              Eight planets, drawn to their true orbital ratios.
            </p>
            <p className="mt-2 text-sm text-slate-500">Earth marked in orange.</p>
          </div>
        </div>

        {/* Live scroll cue */}
        <div
          className="rise-in relative z-10 mt-10 flex items-center gap-3 text-sm text-slate-500"
          style={{ animationDelay: '620ms' }}
        >
          <span className="relative block h-9 w-px bg-[#1E293B] overflow-hidden">
            <span className="cue-fall absolute left-1/2 top-0 -translate-x-1/2 w-1 h-1 rounded-full bg-[#EA580C]" />
          </span>
          <span>Scroll to travel outward</span>
        </div>
      </header>

      {/* Running masthead */}
      <div className="marquee overflow-hidden border-b border-[#1E293B] py-4 whitespace-nowrap">
        <div className="marquee-track flex w-max">
          <MarqueeRun />
          <MarqueeRun hidden />
        </div>
      </div>

      {/* The ledger: the system itself as the page's main content */}
      <section className="px-6 md:px-12 lg:px-24 py-24 md:py-32">
        <Reveal>
          <Eyebrow index="I">The eight worlds</Eyebrow>
        </Reveal>

        <ul>
          {planets.map((planet, index) => {
            const period = (2 * Math.PI) / planet.orbitSpeed;
            const phase = ((index * 0.382) % 1) * period;
            return (
              <li key={planet.name}>
                <Reveal delay={index * 55}>
                  <Link
                    href={`/planets/${planet.name.toLowerCase()}`}
                    className="group flex items-center gap-5 md:gap-8 py-7 md:py-9 border-b border-[#1E293B] first:border-t transition-colors duration-300 hover:bg-[#F8FAFC]/[0.02]"
                  >
                    {/* Live glyph: this planet's own colour, orbiting at its own rate. */}
                    <span
                      aria-hidden
                      className="relative inline-block w-7 h-7 rounded-full border border-[#1E293B] shrink-0 group-hover:border-[#EA580C]/60 transition-colors duration-300"
                    >
                      <span
                        className="orbit-arm absolute inset-0"
                        style={{
                          animation: `orbit-spin ${period.toFixed(1)}s linear infinite`,
                          animationDelay: `-${phase.toFixed(1)}s`,
                        }}
                      >
                        <span
                          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full"
                          style={{ backgroundColor: planet.fallbackColor }}
                        />
                      </span>
                    </span>

                    <span className="text-sm text-slate-500 group-hover:text-[#EA580C] transition-colors duration-300 w-6 tabular-nums">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <span
                      className={`font-serif text-4xl md:text-6xl tracking-tight leading-none flex-1 transition-transform duration-300 ${EASE} group-hover:translate-x-3`}
                    >
                      {planet.name}
                    </span>

                    <span className="hidden sm:block text-sm text-slate-500 w-24 text-right tabular-nums">
                      {auOf(planet.name)} AU
                    </span>
                    <span className="hidden lg:block text-sm text-slate-500 w-28 text-right">
                      {planet.facts.orbitalPeriod}
                    </span>
                    <span className="hidden lg:block text-sm text-slate-500 w-28 text-right tabular-nums">
                      {velocityOf(planet.name)}
                    </span>

                    <span
                      aria-hidden
                      className={`text-lg text-[#EA580C] opacity-0 -translate-x-2 transition-[opacity,transform] duration-300 ${EASE} group-hover:opacity-100 group-hover:translate-x-0`}
                    >
                      →
                    </span>
                  </Link>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Manifest with margin notes */}
      <section className="px-6 md:px-12 lg:px-24 py-24 md:py-32 border-t border-[#1E293B]">
        <Reveal>
          <Eyebrow index="II">Manifest</Eyebrow>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <Reveal className="md:col-span-7">
            <p className="font-serif text-3xl md:text-[2.6rem] leading-[1.35] tracking-tight text-slate-200">
              Played at true scale, the solar system is unwatchable
              <sup className="font-serif not-italic text-base text-[#EA580C] ml-0.5">1</sup> — so
              this one compresses size, distance and time along separate curves, keeping the
              ratios honest<sup className="font-serif not-italic text-base text-[#EA580C] ml-0.5">2</sup>.
              Everything else is real: sidereal spin rates, axial tilts, retrograde worlds, a
              camera that chases live positions
              <sup className="font-serif not-italic text-base text-[#EA580C] ml-0.5">3</sup>. It is
              less a diagram than an <span className="italic">instrument</span>.
            </p>
          </Reveal>

          <Reveal className="md:col-span-4 md:col-start-9" delay={120}>
            <aside className="text-sm leading-relaxed text-slate-500 space-y-5">
              <p>
                <span className="font-serif text-[#EA580C] mr-1.5">1</span>At true scale, every
                planet is smaller than one pixel.
              </p>
              <p>
                <span className="font-serif text-[#EA580C] mr-1.5">2</span>Neptune&rsquo;s year runs
                684&times; longer than Mercury&rsquo;s; ordering is always preserved.
              </p>
              <p>
                <span className="font-serif text-[#EA580C] mr-1.5">3</span>Positions are read from
                the scene graph every frame, never cached.
              </p>
              <p className="pt-4 border-t border-[#1E293B] text-slate-600">
                Data from NASA planetary fact sheets. Textures from Solar System Scope.
              </p>
            </aside>
          </Reveal>
        </div>
      </section>

      {/* Capabilities */}
      <section className="px-6 md:px-12 lg:px-24 py-24 md:py-32 border-t border-[#1E293B]">
        <Reveal>
          <Eyebrow index="III">What&rsquo;s inside</Eyebrow>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
          {capabilities.map((capability, index) => (
            <Reveal key={capability.id} delay={(index % 2) * 90}>
              <div className="group border-t border-[#1E293B] pt-6">
                <div className="flex items-baseline gap-4">
                  <span className="font-serif italic text-lg text-[#EA580C]">{capability.id}</span>
                  <h3 className="font-serif text-2xl text-slate-200 group-hover:text-white transition-colors duration-300">
                    {capability.title}
                  </h3>
                </div>
                <p className="mt-4 text-base leading-relaxed text-slate-400">{capability.line}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Closing call to action */}
      <Link
        href="/explore"
        className="group relative block w-full border-t border-[#1E293B] overflow-hidden bg-[#020617]"
      >
        <div
          className={`absolute inset-0 bg-[#EA580C] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ${EASE}`}
        />
        <div className="relative px-6 md:px-12 lg:px-24 py-28 md:py-44 flex items-end justify-between gap-8">
          <span className="font-serif uppercase text-[14vw] leading-[0.8] tracking-tighter text-[#F8FAFC] group-hover:text-[#020617] transition-colors duration-500 delay-100">
            Begin
          </span>
          <div className="flex flex-col items-end gap-5 mb-[1.5vw] shrink-0">
            <span className="hidden md:block text-sm text-slate-500 group-hover:text-[#020617]/70 transition-colors duration-500 delay-100">
              Ready when you are
            </span>
            <svg
              className="w-[8vw] h-[8vw] text-[#F8FAFC] group-hover:text-[#020617] transition-[color,transform] duration-500 delay-100 group-hover:translate-x-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </Link>

      {/* Footer */}
      <footer className="border-t border-[#1E293B] px-6 md:px-12 lg:px-24 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-4 space-y-1.5">
            <p className="font-serif text-lg text-slate-200">Orbital Mechanics</p>
            <p className="text-sm text-slate-500">An interactive planetary observatory.</p>
            <p className="pt-3 text-sm text-slate-600">© 2026 — Open source</p>
          </div>

          <nav className="md:col-span-3 md:col-start-6" aria-label="Footer">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-600 mb-4">Index</p>
            <ul className="space-y-2.5 text-slate-400">
              {[
                { href: '/explore', label: 'Explore' },
                { href: '/planets/mercury', label: 'The eight worlds' },
                { href: '/contact', label: 'Contact' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-[#EA580C] transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-4 md:col-start-9">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-600 mb-4">Bodies</p>
            <p className="leading-loose text-slate-400">
              {planets.map((planet, i) => (
                <span key={planet.name}>
                  <Link
                    href={`/planets/${planet.name.toLowerCase()}`}
                    className="hover:text-[#EA580C] transition-colors duration-200"
                  >
                    {planet.name}
                  </Link>
                  {i < planets.length - 1 && <span className="text-[#1E293B]"> · </span>}
                </span>
              ))}
            </p>
            <p className="mt-6 text-sm text-slate-600 leading-relaxed">
              Set in Newsreader. Rendered in WebGL. No analytics.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
