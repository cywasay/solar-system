import Image from 'next/image';
import Link from 'next/link';
import IceGiantMotion from './IceGiantMotion';
import NeptunePrediction from './NeptunePrediction';
import { neptuneDisplay } from './neptuneFont';
import styles from './NeptunePage.module.css';

export default function NeptunePage() {
  return (
    <IceGiantMotion planet="neptune" className={`${styles.page} ${neptuneDisplay.variable}`}>
      <header className={styles.hero} data-ice-hero>
        <div className={styles.heroTop}>
          <span>At the far end of the planetary atlas</span>
          <span>30 AU from the Sun, on average</span>
        </div>
        <h1 className={styles.title}>Neptune</h1>
        <div className={styles.heroField}>
          <svg
            className={styles.heroSignal}
            viewBox="0 0 1200 450"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M-30 340C230 340 350 95 730 170S1020 214 1230 175" />
            <path d="M-30 355C230 355 350 110 730 185S1020 229 1230 190" />
            <path d="M-30 370C230 370 350 125 730 200S1020 244 1230 205" />
          </svg>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>The eighth planet</p>
            <h2>
              Before it
              <br />
              was <em>seen.</em>
            </h2>
            <p>
              A disturbance in another planet’s orbit became a place in the sky. Up close, the
              distant point became a world of restless weather.
            </p>
            <a href="#neptune-discovery">
              Follow the inference <span aria-hidden="true">→</span>
            </a>
          </div>
          <figure className={styles.distantPlanet}>
            <div>
              <Image
                src="/images/neptune/voyager.jpg"
                alt="Voyager 2’s enhanced-color view of Neptune with bright clouds and dark atmospheric features"
                width={1000}
                height={1000}
                sizes="(max-width:760px) 45vw, 25vw"
                priority
              />
            </div>
            <figcaption>
              Voyager 2 / 1989
              <br />
              Enhanced color; not a natural-color reference.
            </figcaption>
            <span className={styles.target} aria-hidden="true" />
          </figure>
        </div>
        <div className={styles.heroFoot}>
          <span>Discovered through a prediction. Still understood through inference.</span>
          <span>Sunlight arrives after roughly four hours.</span>
        </div>
      </header>

      <section className={styles.discovery} id="neptune-discovery">
        <div className={styles.discoveryHeading}>
          <p className={styles.kicker}>An invisible cause</p>
          <h2>
            First, a problem.
            <br />
            Then, <em>a planet.</em>
          </h2>
          <p>
            Neptune’s discovery connected mathematical inference to direct observation. The orbit of
            Uranus supplied the clue; a telescope supplied the test. Explore that chain without
            mistaking the illustration for historical measurement.
          </p>
        </div>
        <NeptunePrediction />
        <div className={styles.discoveryAfter}>
          <p>
            Urbain Le Verrier sent his prediction to Johann Galle in Berlin. Working with Heinrich
            d’Arrest, Galle found the object on the first night of searching, September 23, 1846.
            John Couch Adams had independently calculated a position, but his work did not lead
            directly to that identification.
          </p>
          <p>
            Galileo had recorded Neptune in 1612 and 1613 without recognizing it as a planet. Seeing
            a point and understanding what it is are different achievements. The 1846 discovery
            supplied an explanation that could be checked against an object and its motion.
            <a
              className={styles.source}
              href="https://www.nasa.gov/history/175-years-ago-astronomers-discover-neptune-the-eighth-planet/"
            >
              NASA history · the discovery of Neptune ↗
            </a>
          </p>
        </div>
      </section>

      <section className={styles.weather} id="neptune-weather" data-passage>
        <div className={styles.weatherHeading}>
          <p className={styles.kicker}>Distance does not mean stillness</p>
          <h2>
            A slow year.
            <br />
            <em>A violent sky.</em>
          </h2>
        </div>
        <figure className={styles.wind} data-arrival>
          <svg
            className={styles.windLines}
            viewBox="0 0 1200 320"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <path
                key={i}
                style={{ animationDelay: `${i * 0.07}s` }}
                d={`M-350 ${55 + i * 18}C${220 + i * 14} ${-80 + i * 26},${450 + i * 8} ${410 - i * 20},1550 ${70 + i * 17}`}
              />
            ))}
          </svg>
          <div className={styles.windNumber} aria-hidden="true">
            2,000<span>km/h</span>
          </div>
          <figcaption>
            Cloud-tracked winds can exceed 2,000 km/h.
            <br />
            Paths illustrate lateral force, not a measured wind field.
          </figcaption>
        </figure>
        <div className={styles.weatherCopy}>
          <p>
            Neptune takes about 165 Earth years to complete an orbit, but its cloud tops reveal some
            of the fastest winds in the solar system. A distant, weakly sunlit atmosphere can still
            transport energy vigorously. Cloud tracking measures flow in a deep atmosphere, rather
            than weather over a solid landscape.
          </p>
          <p>
            The visible clouds are tracers of motion, not the whole atmosphere. Bright methane-ice
            clouds can form above deeper weather systems, so a photograph alone cannot tell us a
            storm’s complete vertical structure.
            <a className={styles.source} href="https://science.nasa.gov/neptune/neptune-facts/">
              NASA · atmosphere and structure ↗
            </a>
          </p>
        </div>
      </section>

      <section className={styles.storms}>
        <figure className={styles.stormImage} data-arrival>
          <div>
            <Image
              src="/images/neptune/voyager.jpg"
              alt="Neptune’s 1989 dark atmospheric oval and nearby bright cloud structures, imaged by Voyager 2"
              width={1000}
              height={1000}
              sizes="(max-width:760px) 88vw, 45vw"
            />
          </div>
          <figcaption>
            August 1989 · Voyager 2 · NASA / JPL
            <br />
            PIA00046. Processing enhances features at the expense of color fidelity.
          </figcaption>
        </figure>
        <div className={styles.stormCopy}>
          <p className={styles.kicker}>Weather has a history</p>
          <h2>
            No permanent
            <br />
            <em>dark spot.</em>
          </h2>
          <p>
            The Great Dark Spot seen by Voyager 2 in 1989 was not a permanent landmark. Later
            observations revealed a population of dark vortices that emerge, move, and disappear. A
            single portrait cannot stand in for the planet’s atmospheric history.
          </p>
          <p>
            Hubble followed a different northern vortex after its discovery in 2018. By August 2020
            it had reversed its drift toward the equator. A smaller dark feature appeared around the
            same period, raising the possibility of fragmentation, but the relationship was not
            established conclusively.
          </p>
          <p>
            Tracking these changes tests ideas about vortex stability and circulation. The relevant
            evidence is a sequence of dated images, with uncertainties about features between
            observations—not a fixed storm icon on a globe.
          </p>
          <a
            className={styles.source}
            href="https://science.nasa.gov/missions/hubble/dark-storm-on-neptune-reverses-direction-possibly-shedding-a-fragment/"
          >
            Hubble · a vortex changes course ↗
          </a>
        </div>
      </section>

      <section className={styles.climate}>
        <div className={styles.climateLead}>
          <p className={styles.kicker}>Two clocks, several explanations</p>
          <h2>
            The seasons
            <br />
            are not the
            <br />
            <em>only clock.</em>
          </h2>
          <div className={styles.clock} data-arrival aria-hidden="true">
            <span>165</span>
            <i />
            <span>11</span>
            <p>Orbital years / solar-cycle years</p>
          </div>
        </div>
        <div className={styles.climateCopy}>
          <p>
            A long observing record can reveal connections a flyby cannot. A 2023 study compared
            decades of cloud observations with the Sun’s roughly 11-year activity cycle. Cloud
            abundance showed a relationship with solar activity, despite Neptune receiving very
            little sunlight.
          </p>
          <p>
            The proposed link involves ultraviolet-driven atmospheric chemistry. Cloud changes
            followed the solar cycle with a delay; deep storms complicate the relationship, and
            further observations are needed. Correlation provides a testable route into the
            chemistry, not a complete causal account.
          </p>
          <a
            className={styles.source}
            href="https://science.nasa.gov/missions/hubble/neptunes-disappearing-clouds-linked-to-the-solar-cycle/"
          >
            Hubble / Keck · clouds and the solar cycle ↗
          </a>
          <p>
            Thermal-infrared observations add another complication. A 2022 analysis of images from
            2003–2020 found cooling through much of the stratosphere during the early part of
            southern summer, followed by rapid polar warming. Chemistry, weather, and solar
            variability are candidates; a simple seasonal warming curve does not capture the record.
          </p>
          <p>
            Neptune’s interior supplies energy as well. Explaining how that heat reaches the
            atmosphere requires models of a high-pressure interior that cannot be photographed.
            Comparing thermal emission, cloud tracking, and spectra places different constraints on
            the same evolving system.
          </p>
          <p>
            “Ice giant” is a useful category, not a complete composition measurement. Interior
            models can combine hydrogen, helium, water, and rock in different proportions while
            matching the available global constraints. A 2025 study admitted both water-dominated
            and rock-dominated solutions. How composition changes with depth introduces further
            uncertainty. A sharply labeled three-layer cutaway can look much more definite than
            the observations permit.
          </p>
          <a className={styles.source} href="https://doi.org/10.1051/0004-6361/202556911">
            Morf &amp; Helled · interior models and their ambiguity ↗
          </a>
          <a className={styles.source} href="https://www.eso.org/public/news/eso2206/">
            ESO · unexpected temperature changes ↗
          </a>
          <a
            className={styles.source}
            href="https://science.nasa.gov/science-research/planetary-science/nasa-oxford-discover-warmer-uranus-than-once-thought/"
          >
            NASA · contrasting the ice giants’ energy budgets ↗
          </a>
        </div>
      </section>

      <section className={styles.triton} id="neptune-triton" data-passage>
        <div className={styles.tritonHeading}>
          <p className={styles.kicker}>A history moving against the spin</p>
          <h2>
            Triton.
            <br />
            <em>The other direction.</em>
          </h2>
        </div>
        <figure className={styles.tritonImage} data-arrival>
          <Image
            src="/images/neptune/triton.jpg"
            alt="Voyager’s synthesized-color Triton mosaic with a pink southern polar cap and textured terrain"
            width={1400}
            height={1088}
            sizes="(max-width:760px) 100vw, 55vw"
          />
          <figcaption>
            Voyager 2 / 1989 · NASA / JPL / USGS
            <br />
            PIA00317. Synthesized color from orange, violet, and ultraviolet filters.
          </figcaption>
        </figure>
        <div className={styles.tritonCopy}>
          <p>
            Triton is a large moon in a retrograde orbit: it travels around Neptune opposite to the
            planet’s rotation. That geometry strongly favors capture over formation within the same
            rotating disk as the planet’s regular satellites. The exact capture history remains a
            reconstruction.
          </p>
          <p>
            Voyager found a thin nitrogen atmosphere, a frigid surface, and active plumes. A cold
            surface does not imply an inert world. Volatile frosts can move, sunlight can drive
            local activity, and the interior may preserve a different thermal history from the
            surface.
          </p>
          <a className={styles.source} href="https://science.nasa.gov/neptune/moons/triton/">
            NASA · Triton’s orbit and activity ↗
          </a>
          <p>
            The mosaic combines contrasting terrains: the southern polar cap, dark streaks
            associated with plume deposits, and the pitted region nicknamed “cantaloupe terrain.”
            Their shapes preserve evidence of resurfacing. The origin of the cantaloupe texture
            remains uncertain; its appearance alone does not establish the mechanism that formed it.
          </p>
          <a
            className={styles.source}
            href="https://science.nasa.gov/photojournal/global-color-mosaic-of-triton/"
          >
            Voyager · the global mosaic ↗
          </a>
        </div>
      </section>

      <section className={styles.lastLight}>
        <p className={styles.kicker}>An observation is a translation</p>
        <h2>
          Look again.
          <br />
          <em>In another light.</em>
        </h2>
        <div>
          <p>
            Webb’s 2022 near-infrared images reveal bright high-altitude clouds and the faint ring
            system. Neptune looks different because methane absorbs strongly at those wavelengths:
            the usual visible disk becomes comparatively dark. An infrared composite is a new
            measurement, not a new paint job.
          </p>
          <a
            className={styles.source}
            href="https://science.nasa.gov/missions/webb/new-webb-image-captures-clearest-view-of-neptunes-rings-in-decades/"
          >
            Webb · a different view of Neptune ↗
          </a>
          <p>
            The deep-blue page around you is a design choice. The famous saturated Voyager blue was
            often enhanced to expose atmospheric structure. Spectral reanalysis published in 2024
            reconstructed a much paler blue-green appearance, closer to Uranus. Color belongs to an
            instrument, a processing method, and a viewing context.
          </p>
          <a
            className={styles.source}
            href="https://www.ox.ac.uk/news/2024-01-05-new-images-reveal-what-neptune-and-uranus-really-look-0"
          >
            Oxford · the visible colors reconsidered ↗
          </a>
        </div>
      </section>
      <footer className={styles.footer}>
        <Link href="/planets/uranus">← Uranus</Link>
        <Link className={styles.simulation} href="/explore?focus=Neptune">
          Find it for yourself <span>↗</span>
        </Link>
        <Link href="/">Back to the portfolio →</Link>
      </footer>
    </IceGiantMotion>
  );
}
