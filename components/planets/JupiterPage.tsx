import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import JupiterSheet, { HoldControl } from './JupiterSheet';
import { jupiterDisplay } from './jupiterFont';
import s from './JupiterPage.module.css';

function Source({ href, children }: { href: string; children: ReactNode }) {
  return <a className={s.source} href={href} target="_blank" rel="noreferrer">{children} ↗</a>;
}

/** A dark band of text: the page is built like the planet, belts of reading and zones of weather. */
function Belt({ id, regime, name, children }: { id: string; regime: string; name: string; children: ReactNode }) {
  return (
    <section id={id} data-belt data-regime={regime} className={s.belt}>
      <div className={s.beltInner}>
        <p className={s.beltName}>{name}</p>
        {children}
      </div>
    </section>
  );
}

/** An open window onto the live sheet. */
function Zone({ regime, label, children }: { regime: string; label?: string; children?: ReactNode }) {
  return (
    <div data-zone data-regime={regime} className={s.zone} role="presentation">
      {label && <p className={s.zoneLabel}>{label}</p>}
      {children}
    </div>
  );
}

const moons = [
  { name: 'Io', line: 'Heat from an orbit', text: 'Io’s orbit is kept slightly eccentric by its resonance with Europa and Ganymede. As Io moves closer to and farther from Jupiter, the changing tide flexes it and dissipates energy inside. Volcanism is a visible consequence of an exchange between orbital motion and internal heat. The distribution of that heat remains an active research question.', source: 'https://science.nasa.gov/jupiter/jupiter-moons/io/' },
  { name: 'Europa', line: 'A signal through ice', text: 'Galileo measured a magnetic response consistent with a conducting layer beneath Europa’s ice. Salty liquid water is a strong explanation for that signal. The ocean’s existence and its potential to support life are separate questions: how the ice, water, and rocky interior exchange material matters to the latter.', source: 'https://science.nasa.gov/jupiter/jupiter-moons/europa/europa-facts/' },
  { name: 'Ganymede', line: 'A field inside a field', text: 'Ganymede generates its own magnetic field inside Jupiter’s much larger magnetosphere. That creates a local magnetic environment within the giant planet’s. Its surface also records different histories: heavily cratered dark regions sit beside brighter, grooved terrain. Interior and surface evidence have to be read together.', source: 'https://science.nasa.gov/jupiter/jupiter-moons/ganymede/' },
  { name: 'Callisto', line: 'An old surface, an open interior', text: 'Callisto preserves an extensive impact record. Yet Galileo’s measurements are compatible with a conducting layer, possibly a salty ocean. Its cratered face says something about how little the surface has been renewed; it cannot settle what lies underneath. Callisto is outside the inner three moons’ present resonance.', source: 'https://science.nasa.gov/jupiter/jupiter-moons/callisto/facts/' },
];

/**
 * Jupiter as weather you can touch. The background is a live fluid simulation of the cloud deck
 * (components/planets/jupiter): schematic east and west jets pull the Cassini photo into stripes,
 * your pointer stirs it, and the page itself alternates dark belts of text with open zones.
 */
export default function JupiterPage() {
  return (
    <JupiterSheet className={`${s.page} ${jupiterDisplay.variable}`}>
      <header className={s.hero} data-zone data-regime="hero">
        <p className={s.heroKicker}>The giant in motion</p>
        <h1 className={s.title}>Jupiter</h1>
        <div className={s.heroFoot}>
          <p className={s.stirHint}><i className={s.hintDot} aria-hidden="true" />Drag across the clouds to stir them. The jets will pull the stripes back.</p>
          <p className={s.heroFact}>One turn in under ten hours, with winds that run east and west in alternating bands. <Source href="https://science.nasa.gov/jupiter/jupiter-facts/">Jupiter facts · NASA</Source></p>
          <nav className={s.heroNav} aria-label="Jupiter chapters">
            <a href="#jupiter-flow">The currents</a>
            <a href="#jupiter-storm">The storm</a>
            <a href="#jupiter-interior">The interior</a>
            <a href="#jupiter-field">The field</a>
            <a href="#jupiter-system">The moons</a>
          </nav>
        </div>
      </header>

      <Belt id="jupiter-flow" regime="stripes" name="Equatorial Zone · Belts & zones">
        <h2 className={s.heading}>A pattern made<br />by <em>opposition.</em></h2>
        <div className={s.columns}>
          <div>
            <p className={s.lead}>Jupiter’s stripes are weather. They look permanent from a distance because the flow keeps making them.</p>
            <p>Bright zones and darker belts trace differences in cloud and haze. Tracking small features over time reveals a related pattern: narrow jets moving east and west around the planet. Where neighboring streams travel at different speeds, the difference stretches clouds and helps shape waves and eddies.</p>
          </div>
          <div>
            <p>Fast rotation organizes much of this motion into flows around lines of latitude. The stripes are not fixed borders, and color alone does not tell us a wind’s direction or the altitude of a cloud. The distinction is why time sequences and measurements at different wavelengths are more revealing than any single portrait.</p>
            <Source href="https://www.missionjuno.swri.edu/jupiter/atmosphere">Jupiter’s atmosphere · Mission Juno</Source>
          </div>
        </div>
      </Belt>

      <Zone regime="stripes">
        <div className={s.zonePanel}>
          <HoldControl />
          <p className={s.modelNote}>The sheet is a simplified flow model: schematic jets, time sped up, the Cassini map carried by the flow. It is not Jupiter’s measured winds.</p>
        </div>
      </Zone>

      <Belt id="jupiter-storm" regime="storm" name="South Tropical Zone · The Great Red Spot">
        <h2 className={s.heading}>What lies under<br /><em>the visible storm?</em></h2>
        <div className={s.columns}>
          <div>
            <p className={s.lead}>The vortex has a shape we can photograph, and a depth we have to infer.</p>
            <figure className={s.figure}>
              <Image src="/images/jupiter/red-spot.jpg" width={1700} height={703} sizes="(max-width: 900px) 92vw, 46vw" alt="JunoCam view of Jupiter’s Great Red Spot, processed in visible light" />
              <figcaption>JunoCam · NASA / JPL-Caltech / SwRI / MSSS, processing by Kevin M. Gill (CC BY), PIA23606.</figcaption>
            </figure>
            <div className={s.sources}>
              <Source href="https://science.nasa.gov/photojournal/the-great-red-spot/">JunoCam source image</Source>
              <Source href="https://www.weizmann.ac.il/EPS/kaspi/sites/EPS.kaspi/files/publications/Parisi-etal-2021_0.pdf">Storm gravity study · Parisi et al., 2021</Source>
              <Source href="https://doi.org/10.1038/nature25793">Jet-depth constraints · Kaspi et al., 2018</Source>
            </div>
          </div>
          <div>
            <h3 className={s.subheading}>Two instruments,<br />two kinds of evidence.</h3>
            <p>Juno’s microwave radiometer senses radiation that escapes from different levels of the atmosphere. Its signal depends on temperature and composition, so a feature in a microwave map is not a direct picture of a wind at a fixed depth.</p>
            <p>Gravity adds an independent test. A storm can redistribute mass and change the pull on a passing spacecraft. Scientists compare that tiny signal with different models of the vortex to see which depths are consistent with the measurement. Combining the two approaches gives a more useful constraint than extending the visible shape downward.</p>
            <Source href="https://science.nasa.gov/missions/juno/nasas-juno-probes-the-depths-of-jupiters-great-red-spot/">Microwave observations of the Great Red Spot · NASA</Source>
          </div>
        </div>
      </Belt>

      <Zone regime="storm" label="Try to tear it apart">
        <div className={s.zonePanel}>
          <p className={s.modelNote}>Drag through the Spot. In this model it is held in place by a relaxation term, so it is pushed and then re-forms. That is a modelling choice, not a claim about the real storm.</p>
        </div>
      </Zone>

      <Belt id="jupiter-interior" regime="interior" name="Beneath the cloud tops">
        <h2 className={s.heading}>No ground.<br /><em>A changing fluid.</em></h2>
        <p className={s.leadWide}>Pressure changes the material.</p>
        <div className={s.columns}>
          <article>
            <h3 className={s.subheading}>Hydrogen under pressure</h3>
            <p>Descending from the clouds means entering increasingly dense hydrogen and helium. There is no rocky surface at a particular cloud boundary. At sufficiently high pressure, hydrogen becomes electrically conducting. “Metallic” describes this behavior; it does not mean a layer of solid metal.</p>
            <p>Convection in conducting fluid, shaped by rotation, can maintain a magnetic field. The field extends far outside the visible planet, into a region filled with charged particles. Jupiter’s atmosphere is one part of a system that includes the solar wind and material supplied by its moons.</p>
            <Source href="https://science.nasa.gov/jupiter/jupiter-facts/">Interior and magnetosphere · NASA</Source>
          </article>
          <article>
            <h3 className={s.subheading}>A core without a neat edge</h3>
            <p>Juno’s radio tracking records small accelerations as the spacecraft passes over regions where Jupiter’s mass is distributed differently. Removing the effects of the spacecraft’s trajectory and accounting for atmospheric winds lets researchers test interior models.</p>
            <p>Some models fit the measurements with heavy elements mixed through a broad central region. The term “dilute core” describes that gradual distribution. Its exact extent and composition depend on how the models describe hydrogen and helium at pressures that are difficult to reproduce in a lab. A gravity measurement constrains a model; it is not a picture of the core.</p>
            <Source href="https://arxiv.org/abs/1707.01997">Juno gravity and interior models · Wahl et al.</Source>
          </article>
        </div>
      </Belt>

      <Zone regime="interior" label="Going down">
        <div className={s.zonePanel}>
          <p className={s.modelNote}>The sheet darkens and heats as you read: a mood, not a measurement. The simulation has no depth.</p>
        </div>
      </Zone>

      <Belt id="jupiter-field" regime="field" name="North Polar Region · Beyond the cloud tops">
        <h2 className={s.heading}>The moons leave<br /><em>marks in the sky.</em></h2>
        <div className={s.columns}>
          <p>Io’s volcanoes supply material that becomes ionized and trapped by Jupiter’s magnetic field. The planet’s rotation and the motion of the moons through that plasma create electrical interactions. Charged particles traveling along the field can produce bright auroral features near Jupiter’s poles.</p>
          <div>
            <p>These features can map connections between a moon and the planet’s upper atmosphere. They are evidence that a moon can influence the environment of a giant planet across a distance far larger than the moon itself.</p>
            <Source href="https://solarsystem.nasa.gov/moons/jupiter-moons/io/in-depth.amp">Io’s magnetic connection · NASA</Source>
          </div>
        </div>
      </Belt>

      <Zone regime="field" label="Illustration">
        <div className={s.zonePanel}>
          <p className={s.modelNote}>The aurora curtains along the top edge are drawn for effect, not from data.</p>
        </div>
      </Zone>

      <Zone regime="moons" label="Four rings, four rhythms">
        <div className={s.zonePanel}>
          <p className={s.modelNote}>Each ring is a moon crossing the sheet and stirring it: Io, Europa, Ganymede, Callisto. Their laps follow the 4 : 2 : 1 rhythm, with Callisto slower and outside it. The spacing is illustrative.</p>
        </div>
      </Zone>

      <Belt id="jupiter-system" regime="moons" name="The Galilean system">
        <h2 className={s.heading}>One planet.<br /><em>Four outcomes.</em></h2>
        <p className={s.leadWide}>For every Ganymede orbit, Europa makes two and Io makes four. The repeating pulls help keep their orbits slightly eccentric, making tides an internal source of heat. Callisto sits outside this pattern.</p>
        <figure className={s.montage}>
          <Image src="/images/jupiter/galilean.jpg" width={1400} height={475} sizes="(max-width: 900px) 92vw, 1100px" alt="Galileo spacecraft montage of Io, Europa, Ganymede, and Callisto from left to right" />
          <figcaption>Galileo imaging · NASA / JPL / DLR, PIA01299. Sizes shown at a common scale. Spacing is illustrative.</figcaption>
        </figure>
        <ol className={s.moonList}>
          {moons.map((moon, index) => (
            <li key={moon.name}>
              <span className={s.ordinal}>0{index + 1}</span>
              <h3 className={s.subheading}>{moon.name}</h3>
              <p className={s.moonLine}>{moon.line}</p>
              <p>{moon.text}</p>
              <Source href={moon.source}>{moon.name} observations · NASA</Source>
            </li>
          ))}
        </ol>
      </Belt>

      <div data-zone data-regime="close" className={`${s.zone} ${s.closing}`} role="presentation">
        <div className={s.zonePanel}>
          <p className={s.closingLine}>Follow the weather into the larger system.</p>
          <Link href="/explore?focus=Jupiter" className={s.meet}>Meet Jupiter <span aria-hidden="true">↗</span></Link>
        </div>
      </div>

      <footer className={s.footer}>
        <nav aria-label="Planets">
          <Link href="/planets/mars">← Mars</Link>
          <Link href="/">Thessaris</Link>
          <Link href="/planets/saturn">Saturn →</Link>
        </nav>
        <p>The moving sheet is a simplified 2D flow model on the Cassini cloud map (NASA / JPL / Space Science Institute, PIA07782), with schematic jets and sped-up time. JunoCam: PIA23606. Galileo montage: PIA01299. References appear alongside the observations.</p>
      </footer>
    </JupiterSheet>
  );
}
