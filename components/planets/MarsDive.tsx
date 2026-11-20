'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { STAGES, cardVisibility, formatWidth, logWidth, widthMeters } from './mars/diveScale';
import type { MarsDive as DiveEngine } from './mars/dive';
import s from './MarsPage.module.css';
import d from './MarsDive.module.css';

const SOURCES = {
  facts: 'https://science.nasa.gov/mars/facts/',
  canyon: 'https://science.nasa.gov/photojournal/valles-marineris/',
  jezero: 'https://doi.org/10.1126/sciadv.abo4856',
  streambed: 'https://www.nasa.gov/mission_pages/msl/news/msl20130530f.html',
  opportunity: 'https://science.nasa.gov/missions/mer/six-things-to-know-about-nasas-opportunity-rover/',
};

function Source({ href, children }: { href: string; children: ReactNode }) {
  return <a className={s.source} href={href} target="_blank" rel="noreferrer">{children} ↗</a>;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * From orbit to grain: a single scroll-driven dive through nearly nine orders of magnitude.
 * The page's own title is the first frame. The 3D engine (components/planets/mars/dive.ts) is
 * loaded on arrival and sleeps whenever the section is off screen or nothing is moving.
 */
export default function MarsDive() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const spaceRef = useRef<HTMLCanvasElement>(null);
  const groundRef = useRef<HTMLCanvasElement>(null);
  const valueRef = useRef<HTMLElement>(null);
  const unitRef = useRef<HTMLElement>(null);
  const powerRef = useRef<HTMLElement>(null);
  const cueRef = useRef<HTMLParagraphElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'fallback'>('loading');

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const space = spaceRef.current;
    const ground = groundRef.current;
    if (!section || !stage || !space || !ground) return;
    const lite = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches || new URLSearchParams(window.location.search).has('lite');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const cards = Array.from(stage.querySelectorAll<HTMLElement>('[data-card]'));
    let engine: DiveEngine | null = null;
    let disposed = false;
    let onScreen = false;
    let lastText = '';

    const progress = () => {
      const navHeight = parseFloat(getComputedStyle(section).getPropertyValue('--nav-h')) || 94;
      const total = section.offsetHeight - stage.offsetHeight;
      return total > 0 ? clamp01((navHeight - section.getBoundingClientRect().top) / total) : 0;
    };

    // Written directly each frame: opacity and transform only, no React renders.
    const paint = (p: number) => {
      STAGES.forEach((stageInfo, index) => {
        const card = cards[index];
        if (!card) return;
        const visible = cardVisibility(stageInfo, p);
        card.style.opacity = String(visible);
        card.style.visibility = visible < 0.01 ? 'hidden' : 'visible';
        card.style.transform = reduced ? 'none' : `translate3d(0, ${((1 - visible) * 26).toFixed(1)}px, 0)`;
      });
      const width = formatWidth(widthMeters(p));
      const text = `${width.value} ${width.unit}`;
      if (text !== lastText) {
        lastText = text;
        if (valueRef.current) valueRef.current.textContent = width.value;
        if (unitRef.current) unitRef.current.textContent = width.unit;
        if (powerRef.current) powerRef.current.textContent = `10^${logWidth(p).toFixed(1)} m`;
      }
      if (cueRef.current) cueRef.current.style.opacity = p < 0.015 ? '1' : '0';
    };

    const onScroll = () => engine?.setProgress(progress());
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      engine?.setActive(onScreen);
      if (onScreen) onScroll();
    }, { rootMargin: '25% 0px 25% 0px' });
    observer.observe(section);
    const resizeObserver = new ResizeObserver(() => engine?.resize());
    resizeObserver.observe(stage);
    window.addEventListener('scroll', onScroll, { passive: true });

    (async () => {
      try {
        const { createMarsDive } = await import('./mars/dive');
        const created = await createMarsDive({ space, ground }, { onFrame: paint }, { lite, reduced, cancelled: () => disposed });
        if (disposed) { created.dispose(); return; }
        engine = created;
        setState('ready');
        engine.setProgress(progress());
        engine.setActive(onScreen);
      } catch {
        if (!disposed) setState('fallback');
      }
    })();

    return () => {
      disposed = true;
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('scroll', onScroll);
      engine?.dispose();
      engine = null;
    };
  }, []);

  return (
    <section ref={sectionRef} id="dive" className={d.dive} data-state={state} aria-label="From orbit to grain: a dive from the whole planet to a single grain of sand">
      <div ref={stageRef} className={d.stage}>
        <canvas ref={spaceRef} className={d.space} aria-hidden="true" />
        <canvas ref={groundRef} className={d.ground} aria-hidden="true" />
        <div className={d.scrim} aria-hidden="true" />
        <p className={d.loading} aria-hidden="true">Entering orbit…</p>

        <div className={d.readout} aria-hidden="true">
          <span className={d.readoutLabel}>Across the frame</span>
          <b className={d.readoutNumber}><span ref={valueRef}>7,900</span><small ref={unitRef}>km</small></b>
          <span ref={powerRef} className={d.readoutPower}>10^6.9 m</span>
        </div>
        <p ref={cueRef} className={d.cue} aria-hidden="true">Scroll to dive <span>↓</span></p>

        <article className={`${d.card} ${d.cardTitle}`} data-card="planet">
          <p className={s.startTop}>Plate I · The fourth planet from the Sun</p>
          <h1 className={s.title} aria-label="Mars">{[...'MARS'].map((letter, index) => <span key={letter} aria-hidden="true" style={{ '--i': index } as CSSProperties}>{letter}</span>)}</h1>
          <p className={s.startLine}>A world written in rock.</p>
          <p className={d.lede}>Mars keeps its history out in the open. Scroll, and fall from orbit to a single grain of sand: nearly nine orders of magnitude in one unbroken shot. Mars is about half the width of Earth, and a sol, one Martian day, lasts 24 hours 39 minutes 35 seconds.</p>
          <div className={d.links}>
            <a href="#drive">Skip to the mini game ↓</a>
            <a href="#journal">Read the field journal ↓</a>
            <Source href={SOURCES.facts}>Mars facts · NASA</Source>
          </div>
        </article>

        <article className={d.card} data-card="region">
          <p className={s.kicker}>02 / 06 · The region</p>
          <h2 className={d.heading}>A surface<br /><em>pulled apart.</em></h2>
          <p>Fall toward the equator and the globe sharpens into a Viking Orbiter mosaic of Valles Marineris. Its connected troughs cut thousands of kilometres across Mars. No single river made them: faulting, collapse, erosion, and material sliding down steep slopes all did.</p>
          <div className={d.links}>
            <Source href={SOURCES.canyon}>Viking mosaic · NASA / JPL / USGS</Source>
          </div>
        </article>

        <article className={d.card} data-card="landscape">
          <p className={s.kicker}>03 / 06 · The landscape</p>
          <h2 className={d.heading}>Evidence<br /><em>at every height.</em></h2>
          <p>From orbit, valleys and deposits suggest processes. Jezero crater was chosen because orbital images showed a former lake and a fan where a river entered. Down here the ground is generated in code from features Mars really has: a crater with an inlet and delta, a canyon, layered rock, buried ice.</p>
          <div className={d.links}>
            <Source href={SOURCES.jezero}>Jezero · Bell et al., 2022</Source>
          </div>
        </article>

        <article className={d.card} data-card="outcrop">
          <p className={s.kicker}>04 / 06 · The outcrop</p>
          <h2 className={d.heading}>Every band<br /><em>is an event.</em></h2>
          <p>Fine-grained beds settle where water is still; coarser ones need stronger currents, or wind. Dust on top describes recent wind. The layers beneath describe what came before it.</p>
          <div className={d.links}>
            <Source href={SOURCES.facts}>The Martian surface · NASA</Source>
          </div>
        </article>

        <article className={d.card} data-card="lens">
          <p className={s.kicker}>05 / 06 · The hand lens</p>
          <h2 className={d.heading}>Rounded<br /><em>means water.</em></h2>
          <p>Close enough to count pebbles. At Gale crater, Curiosity found rock made of rounded pebbles cemented together: the first streambed gravels found on Mars. Rounding takes sustained abrasion in flowing water.</p>
          <div className={d.links}>
            <Source href={SOURCES.streambed}>Pebbly rocks, old streambed · NASA</Source>
          </div>
        </article>

        <article className={d.card} data-card="grain">
          <p className={s.kicker}>06 / 06 · The grain</p>
          <h2 className={d.heading}>The smallest<br /><em>layer of evidence.</em></h2>
          <p>A few millimetres across and nothing like fruit: the “blueberries” are hematite spherules Opportunity found in the rock at Meridiani Planum. They formed late, from rising, acidic groundwater.</p>
          <div className={d.links}>
            <Source href={SOURCES.opportunity}>Opportunity’s discoveries · NASA</Source>
          </div>
          <div className={d.cta}>
            <a href="#drive" className={d.ctaMain}>Now go and read it yourself <span aria-hidden="true">↓</span></a>
            <a href="#journal" className={d.ctaSub}>Field journal ↓</a>
          </div>
        </article>
      </div>
    </section>
  );
}
