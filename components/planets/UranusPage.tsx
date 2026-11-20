import Image from 'next/image';
import Link from 'next/link';
import IceGiantMotion from './IceGiantMotion';
import UranusSeasons from './UranusSeasons';
import { uranusDisplay } from './uranusFont';
import styles from './UranusPage.module.css';

const facts = 'https://science.nasa.gov/uranus/facts/';

export default function UranusPage() {
  return (
    <IceGiantMotion planet="uranus" className={`${styles.page} ${uranusDisplay.variable}`}>
      <header className={styles.hero} data-ice-hero>
        <div className={styles.heroTop}>
          <span>A different orientation</span>
          <a href="#uranus-seasons">
            Follow the light <span aria-hidden="true">↘</span>
          </a>
        </div>
        <h1 className={styles.title}>
          Uranus<span aria-hidden="true">↗</span>
        </h1>
        <div className={styles.heroComposition}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>The seventh planet</p>
            <h2>
              Set aside
              <br />
              your sense
              <br />
              of <em>upright.</em>
            </h2>
            <p>
              A world whose seasons begin with a change in perspective. Pale clouds conceal an
              interior we are still learning how to read.
            </p>
          </div>
          <figure className={styles.axisStudy}>
            <div className={styles.datum} aria-hidden="true" />
            <div className={styles.tiltAssembly} aria-hidden="true">
              <div className={styles.sphere} />
              <div className={styles.axis}>
                <span>N</span>
                <i />
                <span>S</span>
              </div>
              <div className={styles.equator} />
            </div>
            <div className={styles.angle}>
              <span>97.77°</span>
              <p>
                Axial tilt from the
                <br />
                orbital normal
              </p>
            </div>
            <figcaption>Textured illustration · scroll to reorient</figcaption>
          </figure>
        </div>
        <div className={styles.heroFoot}>
          <span>Light takes roughly 2 h 40 min to arrive from the Sun.</span>
          <span>19 AU / mean solar distance</span>
        </div>
      </header>

      <section id="uranus-seasons" className={styles.seasons}>
        <div className={styles.sectionHead}>
          <p className={styles.kicker}>The geometry of a year</p>
          <h2>
            The axis stays.
            <br />
            <em>The light changes.</em>
          </h2>
          <p>
            Uranus does not roll its north pole toward the Sun at every point in its orbit. Its spin
            axis keeps approximately the same direction in space. As the planet travels around the
            Sun, that fixed orientation produces radically different illumination.
          </p>
        </div>
        <UranusSeasons />
        <div className={styles.seasonAfter}>
          <p>
            At solstice, a pole lies almost in line with the sunlight. Around equinox, the Sun
            instead illuminates the equatorial region. A season lasts roughly 21 Earth years. These
            are changes in the geometry of sunlight; the atmosphere’s response also depends on how
            it stores and transports heat.
            <a className={styles.source} href="https://science.nasa.gov/helio-and-you-seasons-on-earth-mars-and-beyond/">
              NASA · the geometry of extreme seasons ↗
            </a>
          </p>
          <p>
            A large ancient impact is one proposed explanation for the tilt. The angle itself is
            measured. The event that produced it is a reconstruction of the planet’s history, rather
            than something the Voyager cameras could witness.
            <a className={styles.source} href={facts}>
              NASA · orbit and rotation ↗
            </a>
          </p>
        </div>
      </section>

      <section className={styles.observation} id="uranus-atmosphere">
        <div className={styles.observationCopy}>
          <p className={styles.kicker}>Appearance is a measurement</p>
          <h2>
            Quiet, until
            <br />
            you change
            <br />
            <em>the wavelength.</em>
          </h2>
          <p>
            The pale visible-light disk is a view through haze. It is not an absence of weather.
            Methane absorbs red wavelengths, while scattered blue and green light help produce the
            planet’s cyan appearance.
          </p>
          <p>
            In near-infrared observations, cloud structure and the bright north polar region become
            more conspicuous. Webb’s 2023 view also resolves faint rings, including the diffuse
            inner Zeta ring. The light has been assigned visible colors so we can inspect an
            observation our eyes could not see directly.
          </p>
          <a
            className={styles.source}
            href="https://science.nasa.gov/missions/webb/nasas-webb-rings-in-holidays-with-ringed-planet-uranus/"
          >
            Webb · the September 2023 observation ↗
          </a>
        </div>
        <figure className={styles.webb} data-arrival>
          <div className={styles.aperture}>
            <Image
              src="/images/uranus/webb.png"
              width={1600}
              height={1156}
              alt="Webb’s infrared Uranus, with a bright polar cap and nested, nearly vertical rings"
              sizes="(max-width:760px) 100vw, 58vw"
            />
          </div>
          <figcaption>
            Webb / NIRCam · September 4, 2023
            <br />
            Infrared composite, assigned visible colors. NASA / ESA / CSA / STScI.
          </figcaption>
        </figure>
        <div className={styles.colorNote}>
          <span>Color, with context.</span>
          <p>
            A 2024 spectral reanalysis found Uranus and Neptune much closer in visible color than
            their familiar portraits suggest. Seasonal changes in polar haze and methane help shift
            Uranus’ apparent hue. The frosted interface here is art direction; it is not a
            calibrated sample of the atmosphere.
          </p>
          <a
            className={styles.source}
            href="https://www.ox.ac.uk/news/2024-01-05-new-images-reveal-what-neptune-and-uranus-really-look-0"
          >
            Oxford · recalibrating the ice giants ↗
          </a>
        </div>
      </section>

      <section className={styles.heat} id="uranus-interior">
        <div className={styles.heatHeading}>
          <p className={styles.kicker}>Beneath the appearance</p>
          <h2>
            Cold outside.
            <br />
            An unfinished
            <br />
            <em>energy account.</em>
          </h2>
        </div>
        <div className={styles.heatContent}>
          <figure
            className={styles.heatDiagram}
            data-arrival
            aria-label="Illustrative energy accounting: sunlight enters, some light is reflected, and thermal radiation carries energy away, including internal heat."
          >
            <svg viewBox="0 0 620 250" aria-hidden="true">
              <path className={styles.energyIn} d="M15 86H235" />
              <path
                className={styles.energyOut}
                d="M310 70Q430 4 590 35M350 126H600M310 172Q430 235 590 214"
              />
              <circle cx="290" cy="126" r="62" />
              <circle cx="290" cy="126" r="38" />
              <text x="18" y="62">
                Sunlight
              </text>
              <text x="455" y="20">
                Reflected light
              </text>
              <text x="455" y="115">
                Thermal emission
              </text>
              <text x="455" y="245">
                Internal contribution
              </text>
            </svg>
            <figcaption>
              Energy pathways, schematic. Arrow widths are not measured fluxes.
            </figcaption>
          </figure>
          <p>
            The phrase “ice giant” describes the planet’s composition, not a frozen solid surface.
            Models place hydrogen and helium above a dense, hot interior rich in heavier materials.
            Gravity and magnetic observations constrain that hidden structure without giving us a
            unique cutaway.
          </p>
          <p>
            For decades, the Voyager-era energy balance made Uranus appear to release almost no
            internal heat. A 2025 reanalysis combined atmospheric modeling with observations across
            multiple seasons. NASA reported an estimated energy output about 15% above the absorbed
            solar input: a modest excess, rather than zero.
          </p>
          <p>
            The distinction depends on how much sunlight the planet reflects in all directions.
            Revising that reflection estimate changes the remaining internal contribution. Why
            Uranus releases much less heat than Neptune remains a question about structure,
            transport, and evolution, rather than a settled story of a planet that simply went cold.
          </p>
          <a
            className={styles.source}
            href="https://science.nasa.gov/science-research/planetary-science/nasa-oxford-discover-warmer-uranus-than-once-thought/"
          >
            NASA / Oxford · the 2025 heat reassessment ↗
          </a>
        </div>
      </section>

      <section className={styles.moons} id="uranus-moons">
        <figure className={styles.miranda} data-arrival>
          <div>
            <Image
              src="/images/uranus/miranda.jpg"
              alt="Voyager’s Miranda composite showing cratered terrain beside large bands of ridges and valleys"
              width={459}
              height={600}
              sizes="(max-width:760px) 78vw, 32vw"
            />
          </div>
          <figcaption>
            Miranda · Voyager 2 · January 24, 1986
            <br />
            Green, violet, and ultraviolet filter composite. NASA / JPL.
          </figcaption>
        </figure>
        <div className={styles.moonCopy}>
          <p className={styles.kicker}>A system with a memory</p>
          <h2>
            Small worlds.
            <br />
            <em>Deep histories.</em>
          </h2>
          <p>
            Miranda interrupts any expectation that a small icy moon must be simple. Voyager’s
            southern-hemisphere view sets cratered ground beside broad, sharply bounded provinces of
            bands, faults, and ridges. Different terrains meet across the same small body,
            preserving evidence of a complicated geological sequence.
          </p>
          <a
            className={styles.source}
            href="https://science.nasa.gov/photojournal/miranda-highest-resolution-color-picture/"
          >
            Voyager · reading Miranda’s terrain ↗
          </a>
          <p>
            The larger moons raise another kind of question. A 2023 thermal-evolution study found
            that Ariel, Umbriel, Titania, and Oberon could retain ocean layers beneath their ice.
            Those are model results, informed by Voyager measurements and lessons from other icy
            worlds; they are not detections of four exposed oceans.
          </p>
          <p>
            Rock chemistry, insulating crusts, and dissolved salts affect whether water can remain
            liquid. An ocean’s depth, temperature, and composition would determine which future
            measurements could distinguish it from solid ice. “Potential ocean world” is the
            beginning of an investigation, not its conclusion.
          </p>
          <a
            className={styles.source}
            href="https://www.nasa.gov/centers-and-facilities/jpl/new-study-of-uranus-large-moons-shows-4-may-hold-water/"
          >
            JPL · models of the four larger moons ↗
          </a>
        </div>
      </section>

      <section className={styles.encounter}>
        <div>
          <p className={styles.kicker}>One encounter is not a climate</p>
          <h2>
            1986.
            <br />
            <em>One passing view.</em>
          </h2>
        </div>
        <div>
          <p>
            Voyager 2 remains our only spacecraft encounter with Uranus. A flyby offers
            extraordinary detail, but samples a changing system over a narrow interval. That
            limitation applies to the magnetic environment as much as to the cloud tops.
          </p>
          <p>
            A 2024 reanalysis argued that unusually strong solar-wind pressure had compressed the
            magnetosphere just before Voyager arrived. Conditions once treated as characteristic may
            have been an exceptional state. The finding changes how we interpret the measurements;
            it does not erase them.
          </p>
          <a
            className={styles.source}
            href="https://www.nasa.gov/missions/voyager-program/voyager-2/mining-old-data-from-nasas-voyager-2-solves-several-uranus-mysteries/"
          >
            NASA / JPL · revisiting the encounter ↗
          </a>
          <p>
            Repeated passes would let us separate seasonal behavior from short-lived disturbances,
            measure gravity from different directions, and revisit the moons under different
            illumination. Uranus is a reminder that the shape of our knowledge depends on the path
            we took to obtain it.
          </p>
        </div>
      </section>
      <footer className={styles.footer}>
        <Link href="/planets/saturn">← Saturn</Link>
        <Link className={styles.simulation} href="/explore?focus=Uranus">
          Change your perspective <span>↗</span>
        </Link>
        <Link href="/planets/neptune">Neptune →</Link>
      </footer>
    </IceGiantMotion>
  );
}
