'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Barlow_Condensed } from 'next/font/google';
import styles from './MercuryPage.module.css';

const display = Barlow_Condensed({ weight: ['500', '600'], subsets: ['latin'], display: 'swap' });
const craters = Array.from({ length: 38 }, (_, i) => ({ x: 18 + ((i * 137.7) % 760), y: 16 + ((i * 89.3) % 330), r: 8 + ((i * 17) % 39) }));

export default function MercuryPage() {
  const root = useRef<HTMLElement>(null);
  const [light, setLight] = useState(25);
  useEffect(() => {
    const elements = root.current?.querySelectorAll<HTMLElement>('[data-reveal]');
    if (!elements || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { (entry.target as HTMLElement).dataset.reveal = 'shown'; observer.unobserve(entry.target); }
    }), { threshold: 0.08 });
    // Observe the visible layout box. Clipping the observed element to zero
    // also clips its intersection area, preventing the reveal from firing.
    elements.forEach(element => observer.observe(element));
    return () => {
      observer.disconnect();
      elements.forEach(element => { element.dataset.reveal = ''; });
    };
  }, []);

  return <main ref={root} className={`${styles.page} ${display.className}`}>
    <header className={styles.hero}>
      <div className={styles.heroTop}><span>Nearest to the Sun.</span><Link href="#light">Read the surface ↓</Link></div>
      <div className={styles.world} aria-hidden="true" />
      <h1>MERCURY</h1>
      <div className={styles.heroBottom}><h2>A world<br />cut by light.</h2><div><p>Rock. Iron. A thin exosphere.<br />An exposed record of the early solar system.</p><Link href="/explore?focus=Mercury">Explore Mercury <span>↗</span></Link></div></div>
      <p className={styles.caption}>Illustrative globe using the simulation’s surface texture.</p>
    </header>

    <div className={styles.measures} aria-label="Mercury at a glance">
      <div><strong>4,879<span> km</span></strong><p>Mean diameter</p></div><div><strong>88<span> days</span></strong><p>One orbit · approximately</p></div><div><strong>176<span> days</span></strong><p>One solar day · approximately</p></div><div><strong>3.7<span> m/s²</span></strong><p>Surface gravity</p></div>
    </div>

    <section id="light" className={styles.study}>
      <div className={styles.split} data-reveal><h2>THE SURFACE<br /><em>changes with the light.</em></h2><p>Low-angle light makes relief easier to read. Move the light across this constructed crater field and watch the rims emerge.<br /><small>Procedural relief study. Not measured Mercury terrain; illumination is illustrative.</small></p></div>
      <div className={styles.terrain}>
        <svg viewBox="0 0 800 360" role="img" aria-label={`Illustrative crater relief illuminated from ${light} degrees`}>
          <defs><filter id="mercury-relief" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .333 .333 .333 0 0" /><feGaussianBlur stdDeviation="2" /><feDiffuseLighting surfaceScale="7" diffuseConstant="1.1" lightingColor="#DED9CF"><feDistantLight azimuth={light} elevation="22" /></feDiffuseLighting></filter><radialGradient id="mercury-crater"><stop offset="0" stopColor="#202020"/><stop offset=".62" stopColor="#404040"/><stop offset=".83" stopColor="#c0c0c0"/><stop offset="1" stopColor="#808080"/></radialGradient></defs>
          <g filter="url(#mercury-relief)"><path fill="#808080" d="M-80 -40H880V400H-80z"/>{craters.map((c,i)=><circle key={i} cx={c.x} cy={c.y} r={c.r} fill="url(#mercury-crater)"/>)}</g>
        </svg>
        <div className={styles.lightControl}><label htmlFor="mercury-light">Move the light</label><input id="mercury-light" type="range" min="0" max="180" value={light} onChange={event=>setLight(Number(event.target.value))}/><output htmlFor="mercury-light">{light}°</output></div>
      </div>
    </section>

    <section className={styles.record}>
      <div data-reveal><p className={styles.kicker}>An ancient surface</p><h2>IMPACTS LEAVE<br />THEIR SIGNATURE.</h2></div>
      <div className={styles.recordText} data-reveal><article><h3>Caloris basin</h3><p>An enormous impact left a basin roughly 1,550 kilometres across. Later volcanic activity helped reshape Mercury’s surface.</p></article><article><h3>A planet that contracted</h3><p>Long cliffs record the crust responding as Mercury’s interior cooled and the planet shrank.</p></article><article><h3>Ice in permanent shadow</h3><p>Near the poles, some crater floors never receive direct sunlight. These cold traps can preserve water ice.</p></article></div>
    </section>

    <section className={styles.interior}>
      <div className={styles.coreDrawing} aria-label="Schematic showing a large core beneath a thin outer rocky shell" role="img"><div/><span>Core</span><small>Schematic · not to scale</small></div>
      <div data-reveal><p className={styles.kicker}>Beneath the crust</p><h2>MOSTLY<br /><em>metal.</em></h2><p>A large metallic core dominates the interior. Why Mercury retained so much metal relative to rock remains a question about its formation.</p><p className={styles.quiet}>A collision is one proposed explanation, not an established history.</p></div>
    </section>

    <section className={styles.time} data-reveal><h2>THREE TURNS.<br /><em>Two journeys around the Sun.</em></h2><div className={styles.ratio}><span>3</span><i>:</i><span>2</span></div><p>Mercury rotates three times for every two orbits. A solar day—the interval between successive noons—lasts about two Mercury years.</p></section>

    <section className={styles.evidence}><h2>HOW WE KNOW.</h2><div><article><h3>Mariner 10 <span>1974–1975</span></h3><p>Three flybys provided the first close views.</p></article><article><h3>MESSENGER <span>2011–2015 in orbit</span></h3><p>Orbital observations mapped the planet and investigated its chemistry, magnetic field, and polar deposits.</p></article><a href="https://science.nasa.gov/mercury/facts/" target="_blank" rel="noreferrer">Read the scientific reference · NASA ↗</a><p className={styles.quiet}>Reference values are rounded. Surface texture reused from Thessaris; the lighting study is an artistic reconstruction.</p></div></section>
    <footer className={styles.footer}><Link href="/">← Back to Thessaris</Link><Link href="/planets/venus">Next world <strong>VENUS ↗</strong></Link></footer>
  </main>;
}


