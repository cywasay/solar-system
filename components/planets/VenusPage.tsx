'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { venusDisplay } from './planetFonts';
import styles from './VenusPage.module.css';

const facts = 'https://science.nasa.gov/venus/venus-facts/';
const radarSource = 'https://svs.gsfc.nasa.gov/30357';

export default function VenusPage() {
  const root = useRef<HTMLElement>(null);
  const [view, setView] = useState<'cloud' | 'radar'>('cloud');

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const targets = root.current?.querySelectorAll<HTMLElement>('[data-venus-reveal]');
    if (!targets || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).dataset.venusReveal = 'seen';
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    targets.forEach(target => observer.observe(target));
    return () => {
      observer.disconnect();
      targets.forEach(target => { target.dataset.venusReveal = ''; });
    };
  }, []);

  return <main ref={root} className={`${styles.page} ${venusDisplay.variable}`}>
    <header className={styles.hero}>
      <p className={styles.overline}>The second planet. An entirely different world.</p>
      <h1>Venus</h1>
      <div className={styles.heroCopy}><p>Beauty<br /><em>under pressure.</em></p><div><p>A luminous exterior.<br />An atmosphere that changes everything.</p><a href="#beneath">Look beneath the clouds <span aria-hidden="true">↓</span></a></div></div>
      <div className={styles.cloudHorizon} aria-hidden="true"><div className={styles.cloudTexture}/><div className={styles.veilOne}/><div className={styles.veilTwo}/></div>
      <p className={styles.heroNote}>Cloud study · illustrative texture</p>
    </header>

    <dl className={styles.facts}><div><dt>Diameter</dt><dd>12,104 <span>km</span></dd></div><div><dt>Distance from the Sun</dt><dd>0.72 <span>AU</span></dd></div><div><dt>One orbit</dt><dd>224.7 <span>Earth days</span></dd></div></dl>

    <section id="beneath" className={styles.observation} aria-labelledby="venus-observation">
      <div className={styles.observationHead} data-venus-reveal><p className={styles.eyebrow}>Appearance & evidence</p><h2 id="venus-observation">There is more<br />beneath <em>the veil.</em></h2><p>Visible light meets an opaque cloud deck. Radar gives us a different way to read the world below.</p></div>
      <div className={styles.viewer} data-view={view}>
        <div className={styles.viewerArt} role="img" aria-label={view === 'cloud' ? 'Illustrative Venus cloud globe, using an artistic texture' : 'NASA Magellan radar mosaic projected onto a globe, with simulated color'}>
          <div className={styles.radarGlobe}><Image src="/images/venus/magellan-globe.jpg" alt="" fill sizes="(max-width: 760px) 85vw, 48vw" /></div>
          <div className={styles.cloudGlobe} aria-hidden="true"/>
          <span className={styles.viewLine} aria-hidden="true"/>
        </div>
        <div className={styles.viewerInfo}>
          <div className={styles.viewSwitch} role="group" aria-label="Choose an observation layer"><button type="button" aria-pressed={view === 'cloud'} onClick={() => setView('cloud')}>Cloud cover</button><button type="button" aria-pressed={view === 'radar'} onClick={() => setView('radar')}>Radar surface</button></div>
          <div className={styles.viewDescription} aria-live="polite" aria-atomic="true"><span className={styles.smallLabel}>{view === 'cloud' ? 'What conceals' : 'What reveals'}</span><h3>{view === 'cloud' ? 'An atmosphere, not a surface.' : 'A landscape read by radar.'}</h3><p>{view === 'cloud' ? 'Sulfuric-acid clouds hide the ground. The soft colors here are an artistic cloud texture, not a calibrated spacecraft observation.' : 'Magellan radar data is projected onto a simulated globe. Color enhances structure; it is not the color a camera would see from orbit.'}</p><p className={styles.note}>{view === 'cloud' ? 'Switch layers to see the radar reconstruction. These views illustrate different observing methods; they are not a registered before-and-after pair.' : 'NASA/JPL · 180° east-centered view. Gaps use Pioneer Venus data or a constant value. The radar image has been cropped to its globe boundary.'}</p></div>
          <a className={styles.source} href={radarSource} target="_blank" rel="noreferrer">Image & methodology · NASA/JPL ↗</a>
        </div>
      </div>
    </section>

    <section className={styles.pressure} aria-labelledby="venus-pressure" data-venus-reveal>
      <div className={styles.pressureTitle}><p className={styles.eyebrow}>Descending through the atmosphere</p><h2 id="venus-pressure">The weight<br />of <em>the sky.</em></h2><p>Mostly carbon dioxide, the atmosphere retains heat through an extreme greenhouse effect. Surface conditions are radically different from the bright clouds overhead.</p></div>
      <div className={styles.pressureLayers}>
        <div className={styles.layer}><span className={styles.layerRule} aria-hidden="true"/><span>Above the surface</span><h3>Cloud & chemistry</h3><p>Cloud droplets contain sulfuric acid. The atmosphere moves far faster than the solid planet beneath it.</p></div>
        <div className={styles.layer}><span className={styles.layerRule} aria-hidden="true"/><span>At the ground</span><strong>≈93<span>×</span></strong><p>The atmospheric pressure at Earth’s sea level.</p></div>
        <div className={styles.layer}><span className={styles.layerRule} aria-hidden="true"/><span>Surface temperature</span><strong>≈467<span>°C</span></strong><p>Hotter than Mercury, despite being farther from the Sun.</p></div>
        <a className={styles.source} href={facts} target="_blank" rel="noreferrer">Atmosphere & reference values · NASA ↗</a>
      </div>
    </section>

    <section className={styles.landscape} aria-labelledby="venus-landscape">
      <div className={styles.landscapeTitle} data-venus-reveal><p className={styles.eyebrow}>A surface still changing</p><h2 id="venus-landscape">The clouds hide<br /><em>an active world.</em></h2></div>
      <div className={styles.landscapeBody}><article><h3>Mapping without daylight</h3><p>Magellan arrived in 1990. Its synthetic-aperture radar revealed lava channels, volcanic domes, impact craters, and deformed terrain beneath the clouds. A radar image records returned microwave energy; brightness is not simply elevation.</p><a className={styles.source} href="https://science.nasa.gov/mission/magellan/" target="_blank" rel="noreferrer">The Magellan mission ↗</a></article><article><h3>Old observations. New evidence.</h3><p>A study published in 2023 identified a volcanic vent near Maat Mons that changed shape and grew between radar observations eight months apart in 1991. That change is evidence of volcanic activity—not a live view of an eruption.</p><a className={styles.source} href="https://www.nasa.gov/missions/veritas/nasas-magellan-data-reveals-volcanic-activity-on-venus/" target="_blank" rel="noreferrer">Read the evidence · NASA ↗</a></article></div>
    </section>

    <section className={styles.rotation} aria-labelledby="venus-time" data-venus-reveal>
      <div><p className={styles.eyebrow}>Rotation & time</p><h2 id="venus-time">A slower turn.<br /><em>The other way.</em></h2><p>Venus rotates retrograde. Measured against the stars, one turn takes longer than one orbit. A solar day measures something else: the interval between successive solar noons.</p></div>
      <dl className={styles.timeLines}><div><dt>Sidereal rotation <span>retrograde</span></dt><dd>243 <small>Earth days</small></dd></div><div><dt>Orbit around the Sun</dt><dd>224.7 <small>Earth days</small></dd></div><div><dt>Solar day</dt><dd>116.75 <small>Earth days</small></dd></div></dl>
      <p className={styles.note}>Rounded reference periods; lengths represent duration, not orbital paths. <a href="https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html" target="_blank" rel="noreferrer">NASA fact sheet ↗</a></p>
    </section>

    <section className={styles.lander} aria-labelledby="venus-lander"><div className={styles.landerNumber} data-venus-reveal>127<span>minutes on the surface</span></div><div><p className={styles.eyebrow}>Venera 13 · 1982</p><h2 id="venus-lander">A brief visit.<br /><em>A lasting record.</em></h2><p>Venera 13 transmitted from the ground for 127 minutes. Its images and measurements are a local encounter with Venus—not a complete portrait of the planet. Heat, pressure, and reactive chemistry make long-lived surface instruments an engineering challenge.</p><a className={styles.source} href="https://ntrs.nasa.gov/archive/nasa/casi.ntrs.nasa.gov/20190029198.pdf" target="_blank" rel="noreferrer">Surface operations & lander survival · NASA ↗</a></div></section>

    <section className={styles.questions}><p className={styles.eyebrow}>Still unresolved</p><h2>How often does the<br />surface <em>remake itself?</em></h2><p>Evidence of change opens a larger question: how widespread is the activity? Repeated observations, comparable viewing geometry, and better surface measurements are essential to distinguish local events from a planet-wide pattern.</p><a className={styles.source} href="https://ntrs.nasa.gov/citations/20250006679" target="_blank" rel="noreferrer">Evidence, limitations & future observations ↗</a></section>
    <footer className={styles.footer}><div className={styles.footerTop}><Link href="/planets/mercury">← Mercury</Link><Link href="/explore?focus=Venus" className={styles.enter}>Explore Venus <span aria-hidden="true">↗</span></Link><Link href="/planets/earth">Earth →</Link></div><p>Cloud imagery: <a href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noreferrer">Solar System Scope</a>, CC BY 4.0. Radar globe: NASA/JPL. Illustrative cloud projection; simulated radar color. Values are rounded.</p><Link href="/">Back to Thessaris</Link></footer>
  </main>;
}
