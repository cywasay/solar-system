import React from 'react';
import Link from 'next/link';
import { planets } from '@/data/planets';
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
import PlanetLedger from '@/components/landing/PlanetLedger';
import ManifestScale from '@/components/landing/ManifestScale';
import CapabilitiesInstrument from '@/components/landing/CapabilitiesInstrument';

/* ---------------------------------------------------------------------------
 * The landing page as an editorial front page. Every figure is pulled from the
 * same data files that drive the simulation — the orrery spins at real compressed
 * periods, the ledger lists the actual eight worlds. Two voices only: Newsreader
 * for display and prose, Geist (sans) for quiet labels. No monospace chrome.
 * ------------------------------------------------------------------------- */

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
        <Link href="/" className="inline-block">
          <img src="/logos/logo.png" alt="Thessaris" className="h-6 md:h-7 w-auto object-contain" />
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
      <section id="worlds" className="px-4 sm:px-6 md:px-12 lg:px-24 py-12 sm:py-20 md:py-24">
        <Reveal>
          <Eyebrow index="I">The eight worlds</Eyebrow>
        </Reveal>

        <IdleOffscreen>
          <PlanetLedger />
        </IdleOffscreen>
      </section>

      {/* Manifest with margin notes */}
      <section id="manifest" className="px-4 sm:px-6 md:px-12 lg:px-24 py-12 sm:py-20 md:py-24 border-t border-[#1E293B]">
        <Reveal>
          <Eyebrow index="II">Manifest</Eyebrow>
        </Reveal>

        <ManifestScale />
      </section>

      {/* Capabilities */}
      <section id="instrument" className="px-4 sm:px-6 md:px-12 lg:px-24 py-12 sm:py-20 md:py-24 border-t border-[#1E293B]">
        <Reveal>
          <Eyebrow index="III">What&rsquo;s inside</Eyebrow>
        </Reveal>

        <CapabilitiesInstrument />
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
