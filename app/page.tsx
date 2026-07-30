import React from 'react';
import Link from 'next/link';
import { planets } from '@/data/planets';
import { planetEditorial } from '@/data/planetEditorial';
import HeroOrrery from '@/components/landing/HeroOrrery';
import HeroStage from '@/components/landing/HeroStage';
import SplitHeadline from '@/components/landing/SplitHeadline';
import SmoothScroll from '@/components/landing/SmoothScroll';
import Reveal from '@/components/landing/Reveal';
import JourneyRail from '@/components/landing/JourneyRail';
import IdleOffscreen from '@/components/landing/IdleOffscreen';
import BeginCta from '@/components/landing/BeginCta';
import FooterFluidText from '@/components/landing/FooterFluidText';
import MenuTrigger from '@/components/site/MenuTrigger';

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
    <div className="flex items-center gap-3 sm:gap-4 mb-8 sm:mb-16">
      <span className="font-serif italic text-base sm:text-lg text-[#EA580C]">{index}</span>
      <span className="text-[11px] sm:text-xs tracking-[0.18em] uppercase text-slate-400">{children}</span>
      <span aria-hidden className="flex-1 h-px bg-[#1E293B]" />
    </div>
  );
}

/** One run of the running masthead; rendered twice for a seamless -50% loop. */
function MarqueeRun({ hidden }: { hidden?: boolean }) {
  return (
    <span
      aria-hidden={hidden}
      className="flex items-center gap-4 sm:gap-8 pr-4 sm:pr-8 font-serif italic text-lg sm:text-2xl md:text-3xl text-slate-400"
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
      {/* Lerped scrolling — everything scroll-linked below inherits its smoothness. */}
      <SmoothScroll />

      {/* Scroll-as-journey: depart the Sun, travel outward past each named world. */}
      <JourneyRail />

      {/* Masthead */}
      <nav className="relative z-20 flex justify-between items-center px-4 sm:px-6 md:px-12 lg:px-24 py-5 sm:py-7">
        <Link href="/" className="font-serif text-lg md:text-xl tracking-tight text-slate-200">
          Thessaris
        </Link>
        <MenuTrigger />
      </nav>

      {/* Hero. HeroStage owns the depth: it publishes --mx/--my (pointer) and --sp
          (scroll) as CSS variables, and each layer below consumes them at its own rate. */}
      <HeroStage>
        <>
          {/* The composition's one real trick: ORBITAL sits IN FRONT of the orrery and
              MECHANICS sits BEHIND it, so the rings sweep between the two words. Genuine
              occlusion is what separates a layered scene from a flat poster. */}
          <div className="relative">
            {/* Display type is capped on BOTH axes: min(vw, vh). Sizing on vw alone
                ignores viewport height, so wide-but-short laptops overflowed and pushed
                the scroll cue off-screen. The vh term now governs on those screens. */}
            <h1 className="font-serif uppercase leading-[0.92] tracking-[-0.02em]">
              {/* Mobile caps at 13vw, not 15vw: "MECHANICS." measures ~5.94em, which at
                  15vw exceeds the available width on EVERY phone size and was being
                  silently clipped by the page's overflow-x-hidden. md+ is unchanged. */}
              <SplitHeadline
                text="Orbital"
                delay={220}
                stagger={38}
                className="relative z-20 block text-[min(13vw,10.5vh)] md:text-[min(11vw,15vh)]"
              />
              <span className="relative z-0 block text-[min(13vw,10.5vh)] md:text-[min(11vw,15vh)] italic md:ml-[9vw]">
                <SplitHeadline text="Mechanics" delay={430} stagger={34} />
                <span
                  className="rise-in text-[#EA580C] not-italic"
                  style={{ animationDelay: '820ms' }}
                >
                  .
                </span>
              </span>
            </h1>
          </div>

          {/* Orrery between the two words. */}
          <HeroOrrery className="z-10" />

          <div
            className="relative z-20 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 md:gap-10 items-end mt-6 sm:mt-8 md:mt-10"
            style={{
              transform: 'translate3d(0, calc(var(--sp) * 60px), 0)',
              opacity: 'calc(1 - var(--sp) * 1.4)',
            }}
          >
            <div className="rise-in md:col-span-6 lg:col-span-5" style={{ animationDelay: '900ms' }}>
              <p className="font-serif text-base sm:text-lg md:text-2xl leading-snug text-slate-200">
                Eight worlds, three moons and one star, running live at honest ratios — a
                hand-built orrery for the browser.
              </p>
              {/* Secondary detail; the first thing to go on a short viewport. */}
              <p className="mt-4 text-sm leading-relaxed text-slate-500 max-w-md hidden sm:block">
                Size, distance and time, each compressed along its own curve so the whole
                system stays watchable — while the ordering stays true.
              </p>
            </div>

            <div
              className="rise-in md:col-span-4 md:col-start-9 md:text-right"
              style={{ animationDelay: '1000ms' }}
            >
              <p className="font-serif text-sm sm:text-base md:text-lg italic text-slate-400 leading-relaxed">
                Eight planets, turning at their true orbital ratios.
              </p>
              <p className="mt-1.5 text-sm text-slate-500">Earth marked in orange.</p>
            </div>
          </div>

          {/* Live scroll cue */}
          <div
            className="rise-in relative z-20 mt-4 sm:mt-6 md:mt-8 flex items-center gap-3 text-xs sm:text-sm text-slate-500"
            style={{ animationDelay: '1120ms', opacity: 'calc(1 - var(--sp) * 2.2)' }}
          >
            <span className="relative block h-7 w-px bg-[#1E293B] overflow-hidden">
              <span className="cue-fall absolute left-1/2 top-0 -translate-x-1/2 w-1 h-1 rounded-full bg-[#EA580C]" />
            </span>
            <span>Scroll to travel outward</span>
          </div>
        </>
      </HeroStage>

      {/* Running masthead */}
      <IdleOffscreen>
        <div className="marquee overflow-hidden border-b border-[#1E293B] py-4 whitespace-nowrap">
          <div className="marquee-track flex w-max">
            <MarqueeRun />
            <MarqueeRun hidden />
          </div>
        </div>
      </IdleOffscreen>

      {/* The ledger: the system itself as the page's main content */}
      <section className="px-4 sm:px-6 md:px-12 lg:px-24 py-12 sm:py-20 md:py-24">
        <Reveal>
          <Eyebrow index="I">The eight worlds</Eyebrow>
        </Reveal>

        <IdleOffscreen>
        <ul>
          {planets.map((planet, index) => {
            const period = (2 * Math.PI) / planet.orbitSpeed;
            const phase = ((index * 0.382) % 1) * period;
            return (
              <li key={planet.name}>
                <Reveal delay={index * 55}>
                  <Link
                    href={`/planets/${planet.name.toLowerCase()}`}
                    className="group flex items-center gap-3 sm:gap-5 md:gap-8 py-4 sm:py-5 md:py-7 border-b border-[#1E293B] first:border-t transition-colors duration-300 hover:bg-[#F8FAFC]/[0.02]"
                  >
                    {/* Live glyph: this planet's own colour, orbiting at its own rate. */}
                    <span
                      aria-hidden
                      className="relative hidden sm:inline-block w-7 h-7 rounded-full border border-[#1E293B] shrink-0 group-hover:border-[#EA580C]/60 transition-colors duration-300"
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
                      className={`font-serif text-2xl sm:text-3xl md:text-5xl tracking-tight leading-none flex-1 transition-transform duration-300 ${EASE} group-hover:translate-x-3`}
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
        </IdleOffscreen>
      </section>

      {/* Manifest with margin notes */}
      <section className="px-4 sm:px-6 md:px-12 lg:px-24 py-12 sm:py-20 md:py-24 border-t border-[#1E293B]">
        <Reveal>
          <Eyebrow index="II">Manifest</Eyebrow>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12">
          <Reveal className="md:col-span-7">
            <p className="font-serif text-xl sm:text-2xl md:text-[2.1rem] leading-[1.4] tracking-tight text-slate-200">
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
      <section className="px-4 sm:px-6 md:px-12 lg:px-24 py-12 sm:py-20 md:py-24 border-t border-[#1E293B]">
        <Reveal>
          <Eyebrow index="III">What&rsquo;s inside</Eyebrow>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8 sm:gap-y-12">
          {capabilities.map((capability, index) => (
            <Reveal key={capability.id} delay={(index % 2) * 90}>
              <div className="group border-t border-[#1E293B] pt-6">
                <div className="flex items-baseline gap-4">
                  <span className="font-serif italic text-lg text-[#EA580C]">{capability.id}</span>
                  <h3 className="font-serif text-xl sm:text-2xl text-slate-200 group-hover:text-white transition-colors duration-300">
                    {capability.title}
                  </h3>
                </div>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base leading-relaxed text-slate-400">{capability.line}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Closing CTA. Client component: the arrow detaches and becomes the cursor. */}
      <BeginCta />

      <footer className="border-t border-[#1E293B] relative w-full h-[24vw] min-h-[120px] overflow-hidden">
        <span className="sr-only">Thessaris</span>
        <FooterFluidText />
      </footer>
    </div>
  );
}
