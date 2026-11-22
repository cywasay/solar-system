import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import UranusSideways from './UranusSideways';
import { uranusDisplay } from './uranusFont';
import s from './UranusPage.module.css';

const FACTS = 'https://science.nasa.gov/uranus/facts/';
const FACT_SHEET = 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/uranusfact.html';

function Source({ href, children }: { href: string; children: ReactNode }) {
  return <a className={s.source} href={href} target="_blank" rel="noreferrer">{children} ↗</a>;
}

/** One chapter on the sideways strip: a title set on its side, the copy, and its date on the rail. */
function Panel({ id, chapter, width, date, title, wide, children }: {
  id: string; chapter: string; width: string; date: string; title: ReactNode; wide?: boolean; children: ReactNode;
}) {
  return (
    <section id={id} data-chapter={chapter} className={s.panel} style={{ '--w': width } as CSSProperties} aria-labelledby={`${id}-title`}>
      <div className={s.panelBody} data-wide={wide ? '' : undefined}>
        <h2 id={`${id}-title`} className={s.vtitle}>{title}</h2>
        <div className={s.copy}>{children}</div>
      </div>
      <p className={s.date} aria-hidden="true">{date}</p>
    </section>
  );
}

/**
 * Uranus, on its side. The page travels sideways as you scroll, and so does the planet along its
 * 84-year orbit: a live scene (components/planets/uranus) behind the chapters holds Uranus at its
 * real tilt and lights it from wherever the Sun is in that year.
 */
export default function UranusPage() {
  return (
    <main className={`${s.page} ${uranusDisplay.variable}`}>
      <UranusSideways>
        <section id="uranus-top" data-chapter="hero" className={`${s.panel} ${s.hero}`} style={{ '--w': '100vw' } as CSSProperties} aria-labelledby="uranus-title">
          <div className={s.panelBody}>
            <h1 id="uranus-title" className={`${s.vtitle} ${s.giant}`}>Uranus</h1>
            <div className={s.copy}>
              <p className={s.eyebrow}>The seventh planet · found 13 March 1781</p>
              <p className={s.lead}>A planet that rolls around the Sun on its side.</p>
              <p>Uranus spins about an axis tipped 97.77° from its orbit. William Herschel found it with a telescope in 1781, the first planet discovered that way.</p>
              <p className={s.small}>The planet beside you is live: drawn by a shader at its real tilt and lit from wherever the Sun is on its orbit. Scroll and the page travels sideways, and Uranus travels with it.</p>
              <div data-slot="spin" className={s.slot} />
              <a href="#uranus-seasons" data-goto="seasons" className={s.begin}>Start the orbit <span aria-hidden="true">→</span></a>
              <Source href={FACTS}>NASA · Uranus facts</Source>
            </div>
          </div>
          <p className={s.date} aria-hidden="true">1781</p>
        </section>

        <Panel id="uranus-seasons" chapter="seasons" width="130vw" date="1781 → 1977" title="84 years">
          <p className={s.lead}>One year here takes 84 of ours.</p>
          <p>As you scroll, the years run forward. Uranus’s axis keeps pointing the same way in space, so the Sun climbs toward one pole, crosses the equator and moves on to the other. Watch a pole turn toward you, then the equator, then the opposite pole.</p>
          <p>Each pole gets roughly 42 years of sunlight and then 42 years of darkness. Near a solstice the Sun stands within about 8° of a pole. The readout in the corner follows the latitude where the Sun is overhead.</p>
          <p className={s.small}>Seasons here are computed from a circular orbit, so dates can be off by a year or two.</p>
          <Source href={FACTS}>NASA · orbit and rotation</Source>
          <Source href={FACT_SHEET}>NASA · Uranus fact sheet</Source>
        </Panel>

        <Panel id="uranus-rings" chapter="rings" width="110vw" date="10 March 1977" title="The blink">
          <p className={s.lead}>A star blinked before it vanished.</p>
          <div data-slot="rings" className={s.slot} />
          <p>On 10 March 1977, astronomers on NASA’s Kuiper Airborne Observatory watched the star SAO 158687 pass behind Uranus, hoping to probe its atmosphere. Before the planet reached the star, the star dimmed several times. After the planet passed, it dimmed again in the same pattern, mirrored.</p>
          <p>Dips at matching distances on both sides meant narrow rings, not small moons. Voyager 2 photographed them in 1986, and Hubble later found two faint outer rings, for 13 in all.</p>
          <p className={s.small}>Run the pass and the photometer records what they saw.</p>
          <Source href="https://www.nature.com/articles/267328a0">Elliot, Dunham &amp; Mink · Nature, 1977</Source>
          <Source href="https://nssdc.gsfc.nasa.gov/planetary/factsheet/uranringfact.html">NASA · ring fact sheet</Source>
        </Panel>

        <Panel id="uranus-field" chapter="field" width="110vw" date="24 January 1986" title="Corkscrew">
          <p className={s.lead}>A magnetic field that twists as it trails away.</p>
          <div data-slot="field" className={s.slot} />
          <p>Voyager 2 found Uranus’s magnetic field tilted about 59° from the spin axis, and centred about a third of a radius away from the planet’s middle. As Uranus turns, once every 17 hours 14 minutes, the field wobbles with it.</p>
          <p>The solar wind drags the field into a long tail. In 1986 the spin axis pointed almost at the Sun, so the wobble wound the tail into a corkscrew. Here, lines from the two magnetic poles wind around each other down the tail.</p>
          <p>A 2024 reanalysis found that Voyager arrived just after a burst of solar wind had squeezed the magnetosphere, a state it is in only a small fraction of the time.</p>
          <Source href={FACTS}>NASA · the corkscrew tail</Source>
          <Source href={FACT_SHEET}>NASA · dipole tilt and offset</Source>
          <Source href="https://www.nasa.gov/missions/voyager-program/voyager-2/mining-old-data-from-nasas-voyager-2-solves-several-uranus-mysteries/">NASA / JPL · revisiting the encounter</Source>
        </Panel>

        <Panel id="uranus-equinox" chapter="equinox" width="95vw" date="7 December 2007" title="Equinox">
          <p className={s.lead}>The light reaches the middle.</p>
          <p>In December 2007 the Sun crossed Uranus’s equator. Around then, almost every latitude had a day and a night in each 17-hour turn, after decades in which one pole stayed in unbroken light.</p>
          <p>The weather follows the light, slowly. As the north turned toward the Sun after equinox, a bright haze grew over the north pole. It is the cap in Webb’s 2023 view.</p>
          <Source href="https://science.nasa.gov/missions/webb/nasas-webb-rings-in-holidays-with-ringed-planet-uranus/">Webb · the north polar cap</Source>
        </Panel>

        <Panel id="uranus-webb" chapter="webb" width="120vw" date="4 September 2023" title="Infrared" wide>
          <div className={s.twoCol}>
            <div>
              <p className={s.lead}>Quiet, until you change the wavelength.</p>
              <p>In visible light Uranus is a pale disc seen through haze. Methane absorbs red light, and the scattered blue and green give the planet its cyan tint.</p>
              <p>In the near infrared, cloud structure and the bright north polar cap stand out, and Webb resolves faint rings, including the diffuse inner Zeta ring. The colours are assigned so we can see light our eyes cannot.</p>
              <p className={s.small}>A 2024 recalibration found Uranus and Neptune much closer in true colour than their familiar portraits suggest.</p>
              <Source href="https://science.nasa.gov/missions/webb/nasas-webb-rings-in-holidays-with-ringed-planet-uranus/">Webb · the 2023 observation</Source>
              <Source href="https://www.ox.ac.uk/news/2024-01-05-new-images-reveal-what-neptune-and-uranus-really-look-0">Oxford · recalibrating the ice giants</Source>
            </div>
            <figure className={s.still}>
              <Image src="/images/uranus/webb.png" width={1600} height={1156} alt="Webb’s infrared Uranus, with a bright polar cap and nested, nearly vertical rings" sizes="(max-width: 860px) 90vw, 30vw" />
              <figcaption>Webb / NIRCam · infrared composite, assigned colours · NASA, ESA, CSA, STScI</figcaption>
            </figure>
          </div>
        </Panel>

        <Panel id="uranus-heat" chapter="heat" width="95vw" date="2025" title="Heat">
          <p className={s.lead}>Cold outside. A small surplus within.</p>
          <p>“Ice giant” describes what Uranus is made of, not a frozen surface. Models put hydrogen and helium above a dense, hot interior rich in heavier materials.</p>
          <p>For decades the Voyager-era energy budget suggested Uranus gave off almost no heat of its own. A 2025 reanalysis across several seasons put its output about 15% above the sunlight it absorbs: a modest surplus, not zero.</p>
          <p>The answer hinges on how much sunlight the planet reflects in every direction. Why Uranus releases so much less heat than Neptune is still open.</p>
          <Source href="https://science.nasa.gov/science-research/planetary-science/nasa-oxford-discover-warmer-uranus-than-once-thought/">NASA / Oxford · the 2025 heat reassessment</Source>
        </Panel>

        <Panel id="uranus-moons" chapter="moons" width="125vw" date="Today" title="Moons" wide>
          <div className={s.twoCol}>
            <div>
              <p className={s.lead}>A bullseye of moons.</p>
              <p>The large moons orbit over Uranus’s equator, so they share its tilt. When a pole faces the Sun, their orbits ring the planet like a target. Here the five largest move at their real distances and relative speeds.</p>
              <p>Miranda, the smallest of them, sets cratered ground beside broad bands of ridges and faults. A 2023 study found that Ariel, Umbriel, Titania and Oberon could keep ocean layers beneath their ice. Those are model results, not detections.</p>
              <p className={s.small}>Uranus’s moons are named for characters from Shakespeare and Alexander Pope.</p>
              <Source href="https://science.nasa.gov/photojournal/miranda-highest-resolution-color-picture/">Voyager · Miranda’s terrain</Source>
              <Source href="https://www.nasa.gov/centers-and-facilities/jpl/new-study-of-uranus-large-moons-shows-4-may-hold-water/">JPL · ocean models of four moons</Source>
              <Source href="https://nssdc.gsfc.nasa.gov/planetary/factsheet/uraniansatfact.html">NASA · moon fact sheet</Source>
            </div>
            <figure className={`${s.still} ${s.stillTall}`}>
              <Image src="/images/uranus/miranda.jpg" width={459} height={600} alt="Voyager’s Miranda composite showing cratered terrain beside large bands of ridges and valleys" sizes="(max-width: 860px) 70vw, 18vw" />
              <figcaption>Miranda · Voyager 2 · 24 January 1986 · NASA / JPL</figcaption>
            </figure>
          </div>
        </Panel>

        <Panel id="uranus-pass" chapter="pass" width="100vw" date="2070" title="One visit">
          <p className={s.lead}>1986. One passing view.</p>
          <p>Voyager 2 is still our only visit. A flyby gives extraordinary detail but samples a changing system over a narrow window of an 84-year orbit, and that applies to the magnetic field as much as the clouds.</p>
          <p>The geometry Voyager saw returns around 2070, one Uranian year later. Repeated passes would separate the seasons from short-lived storms and see the moons in other light.</p>
          <div className={s.endLinks}>
            <Link className={s.begin} href="/explore?focus=Uranus">See Uranus in the simulation <span aria-hidden="true">↗</span></Link>
            <nav className={s.pager} aria-label="Planets">
              <Link href="/planets/saturn">← Saturn</Link>
              <Link href="/planets/neptune">Neptune →</Link>
            </nav>
          </div>
        </Panel>
      </UranusSideways>

      <footer className={s.footer}>
        <Link href="/planets/saturn">← Saturn</Link><Link href="/">Thessaris</Link><Link href="/planets/neptune">Neptune →</Link>
        <p>Images: Webb, NASA / ESA / CSA / STScI; Voyager 2, NASA / JPL. The live scene is a model: tilt, ring and moon radii and moon periods follow NASA’s fact sheets; seasons use a circular orbit; clouds, storms and the polar hood are illustrative; the magnetic field is a kinematic sketch with distances squeezed; and in the occultation the ring widths are exaggerated and depths simplified.</p>
      </footer>
    </main>
  );
}
