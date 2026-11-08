import Image from 'next/image';
import Link from 'next/link';
import MarsStudy from './MarsStudy';
import MarsElevation from './MarsElevation';
import { marsDisplay } from './marsFont';
import styles from './MarsPage.module.css';

function Reference({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a className={styles.reference} href={href} target="_blank" rel="noreferrer">
      {children} ↗
    </a>
  );
}

export default function MarsPage() {
  return (
    <main className={`${styles.page} ${marsDisplay.variable}`}>
      {/* Hero section */}
      <header className={styles.hero}>
        <div className={styles.heroHeading}>
          <h1 className={styles.heroTitle}>MARS</h1>
          <p className={styles.heroSubtitle}>
            A landscape that keeps <em>evidence.</em>
          </p>
        </div>

        <div className={styles.heroImageContainer}>
          <Image
            src="/images/mars/valles-marineris.jpg"
            alt="Wide panoramic mosaic of the Valles Marineris canyon system on Mars"
            fill
            sizes="100vw"
            priority
            className={styles.heroImage}
          />
          <div className={styles.heroOverlay}>
            <span>Valles Marineris rift system · USGS / NASA mosaic</span>
            <a href="#mars-topography">Trace the elevation profiles ↓</a>
          </div>
        </div>

        {/* Quick planetary measures */}
        <div className={styles.metricsGrid} aria-label="Mars at a glance">
          <div className={styles.metricItem}>
            <strong>6,779<span> km</span></strong>
            <p>Mean diameter · 0.53 Earth</p>
          </div>
          <div className={styles.metricItem}>
            <strong>24h 39m<span> 35s</span></strong>
            <p>Solar day (Sol)</p>
          </div>
          <div className={styles.metricItem}>
            <strong>3.72<span> m/s²</span></strong>
            <p>Surface gravity · 0.38 g</p>
          </div>
          <div className={styles.metricItem}>
            <strong>~6.1<span> mbar</span></strong>
            <p>Mean atmospheric pressure</p>
          </div>
        </div>
      </header>

      {/* Opening Thesis */}
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionKicker}>Planetary Geomorphology</p>
          <h2>The ground preserves<br />what the air <em>lost.</em></h2>
        </div>
        <p className={styles.sectionLead}>
          Earth recycles its crust through plate subduction, erasing ancient landforms in tens to hundreds of millions of years. Venus cloaks its surface under dense supercritical carbon dioxide and volcanic resurfacing. Mars did neither.
        </p>
        <div className={styles.editorialColumns}>
          <article>
            <h3>A four-billion-year stratigraphic record</h3>
            <p>
              Because Mars is smaller than Earth, its interior cooled more rapidly. Plate tectonics never developed, or ceased in deep antiquity. Major volcanic resurfacing slowed after the first billion years, and with only a tenuous atmosphere to drive rainfall or massive wind abrasion, erosion rates dropped to fractions of a millimetre per million years.
            </p>
            <p>
              The result is a planetary archive unmatched in the inner solar system: river networks, lakebed mudstones, impact craters, and volcanic plains from the solar system’s youth sit directly exposed beneath a thin veneer of basaltic sand and iron oxide dust.
            </p>
            <Reference href="https://science.nasa.gov/mars/facts/">Mars Planetary Profile · NASA Science</Reference>
          </article>
          <article>
            <h3>Reading strata as chronological layers</h3>
            <p>
              Every landform on Mars is a time capsule. Stratigraphy—the study of rock layers—allows planetary geologists to establish relative ages: older units lie beneath younger deposits unless disrupted by faults or catastrophic impacts.
            </p>
            <p>
              By combining high-resolution orbital imaging, laser altimetry, and rover grinding tools, scientists can peel back recent dust accumulation to inspect the physical contact lines between bedrock units, distinguishing ancient river sediments from later volcanic lava sheets.
            </p>
            <Reference href="https://astrogeology.usgs.gov/search/map/Mars/GlobalSurveyor/MOLA/">Mars MOLA Global Topography · USGS</Reference>
          </article>
        </div>
      </section>

      {/* Chapter 1: Strata Excavation Study */}
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionKicker}>Signature Study 01 · Stratigraphic Excavation</p>
          <h2>Separating the <em>layers.</em></h2>
          <p className={styles.sectionLead}>
            A surface inspection only sees the most recent transport. Separate the strata below to examine how depositional geometry reveals past environments.
          </p>
        </div>
        <MarsStudy />
      </section>

      {/* Chapter 2: Topography & Elevation Profiles */}
      <section id="mars-topography" className={styles.section}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionKicker}>Signature Study 02 · Topographic Profiles</p>
          <h2>Colossal relief<br /><em>measured by laser altimetry.</em></h2>
          <p className={styles.sectionLead}>
            Mars exhibits the most extreme topographic contrasts in the solar system. Select a transect to scrub its elevation profile and examine the geological mechanisms behind the relief.
          </p>
        </div>
        <MarsElevation />
      </section>

      {/* Chapter 3: Ancient Water and Mineral Eras */}
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionKicker}>Aqueous History</p>
          <h2>Water altered the minerals,<br />then <em>vanished.</em></h2>
        </div>
        <div className={styles.editorialColumns}>
          <article>
            <h3>Channels, deltas, and paleolakes</h3>
            <p>
              Orbital cameras have mapped thousands of kilometers of branching valley networks across the southern cratered highlands. These networks exhibit dendritic drainage patterns characteristic of prolonged precipitation or extensive groundwater sapping.
            </p>
            <p>
              In enclosed basins like Jezero Crater and Gale Crater, rivers built prominent fan deltas, laying down layered siltstones and fine mudstones in standing bodies of water that persisted for thousands to millions of years before evaporating.
            </p>
            <Reference href="https://science.nasa.gov/mission/mars-2020-perseverance/">Perseverance Rover at Jezero · NASA</Reference>
          </article>
          <article>
            <h3>The shift from clay to salt to rust</h3>
            <p>
              Spectrometers on orbiters and rovers have mapped a profound global mineral transition across Martian history. The chemical state of the surface evolved as water became scarce and the climate turned cold and hyper-arid.
            </p>
            <p>
              Rather than a single uniform condition, the rocks record three distinct planetary eras, transitioning from neutral-pH liquid weathering to acidic evaporation and finally atmospheric oxidation.
            </p>
            <Reference href="https://science.nasa.gov/mission/msl-curiosity/">Curiosity Rover at Gale Crater · NASA</Reference>
          </article>
        </div>

        {/* Three Mineral Eras */}
        <div className={styles.mineralTimeline}>
          <div className={styles.mineralEra}>
            <span className={styles.eraDate}>&gt; 3.7 Billion Years Ago</span>
            <h4>Noachian Era</h4>
            <p>
              A warmer, denser early atmosphere supported rivers, lakes, and extensive chemical weathering. Abundant phyllosilicates (clays) formed in neutral-to-alkaline water.
            </p>
            <span className={styles.mineralTag}>Smectite clays · Carbonates</span>
          </div>
          <div className={styles.mineralEra}>
            <span className={styles.eraDate}>3.7 – 3.0 Billion Years Ago</span>
            <h4>Hesperian Era</h4>
            <p>
              Widespread volcanism released sulfur dioxide into the cooling atmosphere. Ephemeral acidic waters evaporated, leaving extensive sulfate deposits and catastrophic flood channels.
            </p>
            <span className={styles.mineralTag}>Sulfates (Gypsum, Jarosite)</span>
          </div>
          <div className={styles.mineralEra}>
            <span className={styles.eraDate}>3.0 Billion Years Ago – Present</span>
            <h4>Amazonian Era</h4>
            <p>
              Cold, dry, and hyper-arid desert conditions. Atmospheric photochemistry and trace oxidants slowly rusted iron-rich basaltic minerals into fine reddish dust.
            </p>
            <span className={styles.mineralTag}>Ferric oxides (Hematite, Rust)</span>
          </div>
        </div>
      </section>

      {/* Chapter 4: Atmospheric Stripping */}
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionKicker}>Atmospheric Evolution · MAVEN Observations</p>
          <h2>The dynamo failed.<br /><em>The solar wind stripped the rest.</em></h2>
        </div>
        <div className={styles.editorialColumns}>
          <article>
            <h3>Death of the core magnetic field</h3>
            <p>
              Ancient crustal rocks in the southern hemisphere retain strong remanent magnetic fields, proving that young Mars possessed an active core dynamo comparable to Earth’s. About 4 billion years ago, as the small planetary core lost heat, convection ceased and the global dipole magnetic field collapsed.
            </p>
            <p>
              Without a magnetosphere to deflect incoming solar plasma, Mars’s upper atmosphere was directly exposed to the supersonic solar wind and solar ultraviolet radiation.
            </p>
          </article>
          <article>
            <h3>Direct measurement of ion escape</h3>
            <p>
              NASA’s MAVEN (Mars Atmosphere and Volatile EvolutioN) orbiter entered orbit in 2014 to measure escape rates in real time. MAVEN revealed that the solar wind strips ions—especially oxygen and hydrogen dissociated from atmospheric water—at rates that accelerate dramatically during solar storms.
            </p>
            <p>
              Over billions of years, sputtering and photochemical escape bled away the bulk of the planet’s original carbon dioxide and water inventory, reducing surface pressure to an average 6.1 mbar—well below the triple point of water (6.11 mbar), where liquid water cannot stably persist on the surface without boiling or freezing.
            </p>
            <Reference href="https://science.nasa.gov/mission/maven/">MAVEN Mission & Atmospheric Loss · NASA</Reference>
          </article>
        </div>

        {/* Conceptual diagram of atmospheric sputtering */}
        <div className={styles.atmosphereGraphic}>
          <svg viewBox="0 0 900 220" role="img" aria-label="Schematic: Solar wind stripping unmagnetized Martian upper atmosphere">
            <g fill="none" stroke="currentColor">
              {/* Solar wind stream */}
              <path d="M20 50h200m-200 40h170m-170 40h190m-190 40h210" stroke="#BB6247" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6" />
              {/* Mars body */}
              <circle cx="450" cy="110" r="48" fill="#2E201C" stroke="#BB6247" strokeWidth="2" />
              {/* Thin ionosphere boundary */}
              <path d="M410 40C380 70 380 150 410 180" stroke="#E7D3B8" strokeWidth="2" />
              {/* Escaping ion plume */}
              <path d="M460 70C530 40 680 20 860 10M460 150C530 180 680 200 860 210M498 110C600 110 740 110 860 110" stroke="#BB6247" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
            </g>
            <g fill="#E7D3B8" fontSize="11" fontFamily="var(--font-mono)">
              <text x="30" y="38" fill="#BB6247">Solar wind protons & electrons →</text>
              <text x="435" y="114" textAnchor="middle" fill="#E7D3B8" fontSize="13" fontWeight="bold">MARS</text>
              <text x="360" y="30" fill="#E7D3B8">Induced bow shock</text>
              <text x="680" y="95" fill="#BB6247">Escaping ion tail (O⁺, CO₂⁺, H⁺) →</text>
              <text x="680" y="145" fill="#9E8973">Photochemical & sputtering loss</text>
            </g>
          </svg>
        </div>
      </section>

      {/* Chapter 5: Polar Layered Deposits & Obliquity */}
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionKicker}>Cryosphere & Climate Cycles</p>
          <h2>Polar ice layers<br /><em>record orbital swings.</em></h2>
        </div>
        <div className={styles.editorialColumns}>
          <article>
            <h3>Planum Boreum and Planum Australe</h3>
            <p>
              Both poles host thick, permanent caps of water ice layered with atmospheric dust, capped by a seasonal sheet of frozen carbon dioxide (dry ice) that freezes out during winter and sublimates during summer.
            </p>
            <p>
              Shallow Radar (SHARAD) soundings from the Mars Reconnaissance Orbiter have penetrated through the north polar cap, revealing thousands of individual layers that preserve a chronological record of Martian climate over the last several million years.
            </p>
          </article>
          <article>
            <h3>Chaotic axial tilt variations</h3>
            <p>
              Unlike Earth, whose large Moon stabilizes its axial tilt within a narrow 22.1° to 24.5° range, Mars has no large moon. Gravitational perturbations from Jupiter and the other planets cause Mars’s obliquity to swing chaotically between 15° and more than 35° on timescales of hundreds of thousands to millions of years.
            </p>
            <p>
              At high tilt, the poles receive intense summer sunlight, driving water vapor into the atmosphere to precipitate as glaciers and snowbanks in the mid-latitudes. When the tilt decreases, ice retreats back to the polar caps, depositing alternating layers of clean ice and dust.
            </p>
            <Reference href="https://science.nasa.gov/mission/mro/">Mars Reconnaissance Orbiter & SHARAD · NASA</Reference>
          </article>
        </div>
      </section>

      {/* Chapter 6: Phobos & Deimos */}
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionKicker}>Natural Satellites</p>
          <h2>Two irregular attendants:<br /><em>Phobos and Deimos.</em></h2>
          <p className={styles.sectionLead}>
            Mars is accompanied by two tiny, potato-shaped moons whose origins remain one of planetary science’s most actively debated puzzles.
          </p>
        </div>

        <div className={styles.moonsGrid}>
          <div className={styles.moonCard}>
            <h3>Phobos</h3>
            <span className={styles.moonSubtitle}>Mean radius: 11.1 km · Orbit: 7.65 hours</span>
            <p>
              Phobos orbits closer to its parent planet than any other known planetary moon—just 6,000 km above the surface. It completes an orbit in less than 8 hours, traveling faster than Mars’s 24.6-hour rotation.
            </p>
            <p>
              Because it orbits below synchronous orbit altitude (17,000 km), tidal friction from Mars acts as a brake. Phobos spirals inward at roughly 1.8 cm per year. In 30 to 50 million years, it will pass the Roche limit and either break apart into a debris ring or crash into the planet.
            </p>
            <Link href="/explore?focus=Phobos" className={styles.moonLink}>
              Inspect Phobos in 3D ↗
            </Link>
          </div>

          <div className={styles.moonCard}>
            <h3>Deimos</h3>
            <span className={styles.moonSubtitle}>Mean radius: 6.2 km · Orbit: 30.3 hours</span>
            <p>
              Deimos is smaller, smoother, and much farther out (23,460 km). Its heavily cratered surface is mantled by a thick layer of regolith that softens relief and conceals impact rims.
            </p>
            <p>
              Orbiting outside synchronous orbit, Deimos is slowly drifting outward, experiencing negligible tidal deformation compared to its doomed inner sibling.
            </p>
            <Link href="/explore?focus=Deimos" className={styles.moonLink}>
              Inspect Deimos in 3D ↗
            </Link>
          </div>
        </div>

        <div className={styles.editorialColumns} style={{ marginTop: '36px' }}>
          <article>
            <h3>The Capture Hypothesis</h3>
            <p>
              Spectroscopically, both moons resemble carbon-rich D-type or C-type asteroids common in the outer main belt or Jupiter Trojan populations. Their very low densities (~1.87 g/cm³ for Phobos, ~1.47 g/cm³ for Deimos) suggest high porosity and possible internal ice, leading to the long-standing hypothesis that they were gravitationally captured early in solar system history.
            </p>
          </article>
          <article>
            <h3>The Giant Impact Hypothesis</h3>
            <p>
              Dynamically, capturing two independent objects into nearly circular, equatorial orbits aligned with Mars’s equator is statistically improbable. Competing numerical models propose that a large impactor struck young Mars, ejecting a debris disk from which Phobos and Deimos re-accreted, reconciling their orbital alignment with ongoing spectral observations.
            </p>
          </article>
        </div>
      </section>

      {/* Footer Navigation */}
      <footer className={styles.footer}>
        <div className={styles.footerNav}>
          <Link href="/planets/earth" className={styles.footerLink}>
            ← Previous <strong>EARTH</strong>
          </Link>
          <Link href="/" className={styles.footerLink}>
            Thessaris Home
          </Link>
          <Link href="/planets/jupiter" className={styles.footerLink}>
            Next world <strong>JUPITER →</strong>
          </Link>
        </div>
        <p className={styles.footerAttribution}>
          Imagery: NASA/JPL/USGS Astrogeology / ESA Mars Express. Topographic profiles: MOLA / Mars Global Surveyor. Scientific references accompany each chapter. Reconstructed terrain is diagrammatic.
        </p>
      </footer>
    </main>
  );
}

