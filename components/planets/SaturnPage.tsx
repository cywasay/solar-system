import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import SaturnAtlas from './SaturnAtlas';
import { saturnDisplay } from './saturnFont';
import styles from './SaturnPage.module.css';

function Source({ href, children }: { href: string; children: ReactNode }) {
  return <a className={styles.source} href={href} target="_blank" rel="noreferrer">{children} ↗</a>;
}

function Chapter({ id, step, label, title, children }: { id: string; step: string; label: string; title: ReactNode; children: ReactNode }) {
  return (
    <section id={id} data-step={step} className={styles.chapter}>
      <p className={styles.eyebrow}>{label}</p>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Still({ image, alt, width, height, caption }: { image: string; alt: string; width: number; height: number; caption: string }) {
  return (
    <figure className={styles.still}>
      <Image src={`/images/saturn/${image}.jpg`} alt={alt} width={width} height={height} sizes="(max-width: 900px) 92vw, 46vw" />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

/**
 * Saturn as an atlas plate: a live particle model of the rings (components/planets/saturn) stays
 * in view while the chapters scroll past it, and each chapter turns the plate to its subject.
 */
export default function SaturnPage() {
  return (
    <main className={`${styles.page} ${saturnDisplay.variable}`}>
      <SaturnAtlas>
        <header id="saturn-approach" data-step="hero" className={`${styles.chapter} ${styles.cover}`}>
          <p className={styles.eyebrow}>A passage through the ring plane</p>
          <h1>Saturn</h1>
          <p className={styles.lead}>A world that changes<br />with your point of view.</p>
          <p className={styles.coverNote}>The rings on the plate are a live model: half a million particles, each on its own orbit. Scroll, and the plate turns to meet each chapter.</p>
          <a href="#saturn-edge" className={styles.begin}>Begin the passage <span aria-hidden="true">↓</span></a>
        </header>

        <Chapter id="saturn-edge" step="edge" label="The ring plane" title={<>A vast disk.<br /><em>A narrow edge.</em></>}>
          <p className={styles.lead}>The rings nearly disappear when you look along their plane.</p>
          <p>From above, the bright main rings stretch over tens of thousands of kilometers. In much of that disk, the particles occupy a layer only tens of meters thick. The same structure can dominate a portrait of Saturn or appear as a line, depending on the observer’s angle.</p>
          <p>During Saturn’s equinox, sunlight also reaches the disk at a grazing angle. Cassini could pick out structures rising above it because they threw long shadows across the rings. What looked smooth in ordinary illumination revealed ridges, clumps, and disturbances.</p>
          <p className={styles.small}>The model draws the plane several hundred kilometers thick, far thicker than the real rings, so that a thin sliver stays visible when it is edge-on.</p>
          <Source href="https://science.nasa.gov/mission/cassini/science/rings/">Cassini ring observations</Source>
        </Chapter>

        <Chapter id="saturn-rings" step="rings" label="Across the disk" title={<>The gaps have<br /><em>a history.</em></>}>
          <p className={styles.lead}>Seen sideways, the rings read as bands of different density.</p>
          <p>Each ring contains particles on their own orbits. Closer material travels around Saturn faster. Collisions redistribute motion, and repeated tugs from moons organize some edges and waves. The Cassini Division separates the bright A and B rings and contains faint material of its own.</p>
          <p>Smaller moons can leave more local signatures. Pan orbits inside the Encke Gap and helps maintain it. The narrow lanes and wider divisions let scientists infer how orbiting material responds to gravity over time.</p>
          <p className={styles.small}>Try it on the plate: drop a moon on the rings and watch how the particles answer. The ring radii are the real ones; the sandbox moons are not.</p>
          <Source href="https://nssdc.gsfc.nasa.gov/planetary/factsheet/satringfact.html">Ring divisions and radii · NASA</Source>
        </Chapter>

        <Chapter id="saturn-pole" step="pole" label="Above the north pole" title={<>Weather with<br /><em>six sides.</em></>}>
          <p>Pull away from the equator and the familiar bands give way to a six-sided jet around the north pole. Clouds travel with the flow while the broad shape persists. At its center is a separate polar vortex.</p>
          <p>Cassini watched the region change color as northern spring moved toward summer. Its images record changes in the appearance of clouds and haze, while the geometry of the jet provides a different clue about the circulation.</p>
          <p>Below the clouds, pressure turns hydrogen into a dense fluid. Saturn’s mean density reflects its large hydrogen and helium envelope. Its rapid rotation also makes the planet noticeably wider at the equator than from pole to pole.</p>
          <Still image="pole" alt="Cassini's view of Saturn's north pole and six-sided jet stream" width={1000} height={1000} caption="Spring at the North Pole · Cassini, PIA14945" />
          <Source href="https://science.nasa.gov/mission/cassini/science/saturn/hexagon-in-motion/">Cassini’s views of the polar hexagon</Source>
        </Chapter>

        <Chapter id="saturn-titan" step="titan" label="Titan" title={<>Weather under<br /><em>an amber sky.</em></>}>
          <p>Titan’s haze forms as sunlight drives reactions involving nitrogen and methane. Visible images reveal layers of haze at the moon’s edge, while radar and infrared observations offer different ways to examine the surface beneath.</p>
          <p>That surface hosts a cycle of liquid hydrocarbons. Methane can evaporate, form clouds, and fall as rain. Lakes and seas collect methane and ethane, particularly in the north. At these temperatures, water ice can act as the solid ground beneath the flowing liquid.</p>
          <p>In 2005, Huygens descended through the atmosphere and reached the surface. Its local measurements complement the wider maps from Cassini. The two perspectives help distinguish the global cycle from the conditions at one place on one day.</p>
          <Still image="titan" alt="Colorized Cassini ultraviolet view of Titan’s bright limb and detached haze" width={1000} height={1125} caption="Purple Haze · Cassini, PIA06090 · colorized ultraviolet" />
          <Source href="https://science.nasa.gov/saturn/moons/titan/facts/">Titan’s atmosphere and surface · NASA</Source>
        </Chapter>

        <Chapter id="saturn-enceladus" step="enceladus" label="Enceladus" title={<>An ocean writes<br /><em>into a ring.</em></>}>
          <p>At Enceladus, water vapor and ice escape through fractures near the south pole. Some of the grains fall back. Others spread along the moon’s orbit and supply the diffuse E ring, far outside the bright bands we crossed earlier.</p>
          <p>Cassini flew through the plume. Measuring its gas and grains gave researchers an indirect sample of material from beneath the ice. Salt in grains and other chemical evidence helped build the case for liquid water inside the moon.</p>
          <p>The plume links a buried ocean to the wider Saturn system. It also creates a way to investigate the ocean’s chemistry from space. Understanding the connection from water to fracture to plume is part of interpreting what the spacecraft collected.</p>
          <p className={styles.small}>On the plate, grains leave Enceladus at random and are then left to orbit. Their speeds and lifetimes are illustrative.</p>
          <Still image="enceladus" alt="Backlit Enceladus and its south polar jets above Saturn’s rings" width={1000} height={586} caption="A Song of Ice and Light · Cassini, PIA17144" />
          <Source href="https://science.nasa.gov/missions/cassini/the-moon-with-the-plume/">Plume and ring chemistry · NASA</Source>
        </Chapter>

        <Chapter id="saturn-finale" step="finale" label="The last pass" title={<>Between a planet<br /><em>and its rings.</em></>}>
          <p>Cassini’s final orbits passed between Saturn and its innermost ring. From that unusual vantage point, radio tracking helped separate the gravitational pull of the planet from the pull of the rings. This improved estimates of how much material the rings contain.</p>
          <p>Ring mass and the rate at which dust accumulates help constrain their history. Estimating an age also requires assumptions about how much incoming material sticks. Models in which impacts leave less contamination allow bright rings to persist longer.</p>
          <p>Cassini took its last full portrait of the system two days before its final plunge in September 2017. The rings are visible again, this time from a viewpoint the mission made possible.</p>
          <Still image="farewell" alt="Cassini’s final full mosaic of Saturn, with a sunlit crescent above the rings" width={1920} height={800} caption="A Farewell to Saturn · Cassini, PIA17218" />
          <Source href="https://science.nasa.gov/mission/cassini/grand-finale/overview/">The Grand Finale · NASA</Source>
          <Source href="https://www.nature.com/articles/s41561-024-01598-9">Ring pollution models · Hyodo and Genda</Source>
        </Chapter>
      </SaturnAtlas>

      <section className={styles.closing}>
        <p className={styles.eyebrow}>Back to the whole system</p>
        <Link href="/explore?focus=Saturn">Return to Saturn <span aria-hidden="true">↗</span></Link>
      </section>
      <footer className={styles.footer}>
        <Link href="/planets/jupiter">← Jupiter</Link><Link href="/">Thessaris</Link><Link href="/planets/uranus">Uranus →</Link>
        <p>Cassini imagery · NASA / JPL-Caltech / Space Science Institute. The plate is a simplified model: ring and moon orbit radii follow NASA’s <a href="https://nssdc.gsfc.nasa.gov/planetary/factsheet/satringfact.html" target="_blank" rel="noreferrer">ring</a> and <a href="https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturniansatfact.html" target="_blank" rel="noreferrer">satellite</a> fact sheets, particle densities are schematic, the polar hexagon and Cassini’s path are illustrations, and sandbox moons are far heavier than real ones.</p>
      </footer>
    </main>
  );
}
