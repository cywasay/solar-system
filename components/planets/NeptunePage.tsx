import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import NeptuneCapture from './NeptuneCapture';
import NeptuneChapter, { AlbumControls } from './NeptuneChapter';
import NeptuneFlyby from './NeptuneFlyby';
import NeptuneHunt from './NeptuneHunt';
import { neptuneDisplay } from './neptuneFont';
import s from './NeptunePage.module.css';

const HISTORY = 'https://www.nasa.gov/history/175-years-ago-astronomers-discover-neptune-the-eighth-planet/';
const FACT_SHEET = 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/neptunefact.html';
const FACTS = 'https://science.nasa.gov/neptune/neptune-facts/';
const PHOTOJOURNAL = 'https://photojournal.jpl.nasa.gov/target/neptune';

function Source({ href, children }: { href: string; children: ReactNode }) {
  return <a className={s.source} href={href} target="_blank" rel="noreferrer">{children} ↗</a>;
}

/**
 * Neptune: one pass. Voyager 2 is the only spacecraft to have visited, and you fly its 1989
 * encounter as the photographer. The frames you take unlock the album that makes up the rest of
 * the page; the discovery that told Voyager where to go closes it.
 */
export default function NeptunePage() {
  return (
    <main className={`${s.page} ${neptuneDisplay.variable}`}>
      <header className={s.hero}>
        <div className={s.heroCopy}>
          <p className={s.eyebrow}>The eighth planet · visited once</p>
          <h1 className={s.title}>Neptune</h1>
          <p className={s.lead}>One pass.</p>
          <p>Only one spacecraft has ever been to Neptune. On 25 August 1989 Voyager 2 swept over its north pole and on to its moon Triton, with no way to go back for a second look. Fly that pass yourself: everything below is made of the pictures you take.</p>
          <a className={s.begin} href="#neptune-encounter">Fly the encounter <span aria-hidden="true">↓</span></a>
        </div>
        <figure className={s.heroFrame}>
          <Image src="/images/neptune/voyager.jpg" alt="Voyager 2’s enhanced-colour view of Neptune with the Great Dark Spot and bright clouds" width={1000} height={1000} sizes="(max-width: 860px) 80vw, 40vw" priority />
          <span className={s.reseau} aria-hidden="true" />
          <figcaption>Voyager 2 · August 1989 · PIA00046 · enhanced colour, not natural colour · NASA / JPL</figcaption>
        </figure>
      </header>

      <section id="neptune-encounter" className={s.encounter} aria-labelledby="neptune-encounter-title">
        <header className={s.sectionHead}>
          <p className={s.eyebrow}>The encounter · 24–25 August 1989</p>
          <h2 id="neptune-encounter-title">Shoot the flyby</h2>
          <p>Light at Neptune is about 1/900 as bright as at Earth, so every exposure is long. Keep the target steady while the shutter is open or it smears. Colour takes three exposures through orange, green and violet filters; if the clouds move between them, the colours fringe, just as they did on Voyager’s real pictures.</p>
        </header>
        <NeptuneFlyby />
      </section>

      <section className={s.album} aria-labelledby="neptune-album-title">
        <header className={s.sectionHead}>
          <p className={s.eyebrow}>Downlink</p>
          <h2 id="neptune-album-title">The album</h2>
          <p>Each subject you photograph opens its chapter, with your frame beside Voyager’s.</p>
          <AlbumControls />
        </header>

        <NeptuneChapter target="dark-spot" index="01" label="Great Dark Spot" title={<>A storm the size of Earth, <em>gone within five years</em></>}
          real={{ src: '/images/neptune/voyager.jpg', alt: 'Voyager 2 view of Neptune showing the Great Dark Spot', width: 1000, height: 1000, position: '35% 55%', caption: 'PIA00046 · enhanced colour', href: PHOTOJOURNAL }}>
          <p>Voyager 2 found a dark oval about the size of Earth in the southern hemisphere, with bright clouds riding along its edge. When the Hubble Space Telescope looked a few years later, it was gone.</p>
          <p>Dark spots on Neptune come and go. Hubble followed a northern vortex found in 2018; dark storms were expected to drift toward the equator and fade, but by August 2020 this one had turned back north. A smaller dark spot appeared nearby around the same time, possibly a fragment, though that was not established.</p>
          <Source href={FACTS}>NASA · Neptune’s storms</Source>
          <Source href="https://science.nasa.gov/missions/hubble/dark-storm-on-neptune-reverses-direction-possibly-shedding-a-fragment/">Hubble · a vortex changes course</Source>
        </NeptuneChapter>

        <NeptuneChapter target="scooter" index="02" label="Scooter" title={<>The fastest winds <em>in the Solar System</em></>}
          real={{ src: '/images/neptune/voyager.jpg', alt: 'Detail of the same Voyager frame, with the small bright cloud called Scooter', width: 1000, height: 1000, position: '45% 78%', caption: 'detail of PIA00046', href: PHOTOJOURNAL }}>
          <p>The small bright cloud was nicknamed Scooter because it went round the planet faster than the Great Dark Spot. Tracking clouds like it showed winds above 2,000 km/h, the fastest measured anywhere in the Solar System.</p>
          <p>Near the equator the winds blow westward, against the planet’s spin; at high latitudes they blow eastward. Clouds are tracers of that motion, not the whole atmosphere: bright methane-ice clouds can form above deeper storms. In the encounter above, every cloud band drifts at the speed this profile gives its latitude.</p>
          <Source href={FACTS}>NASA · atmosphere and winds</Source>
        </NeptuneChapter>

        <NeptuneChapter target="clouds" index="03" label="High clouds" title={<>Warmer than <em>sunlight allows</em></>}
          real={{ caption: 'high clouds and their shadows, near closest approach', href: PHOTOJOURNAL }}>
          <p>Close in, Voyager saw streaks of bright cloud high above the blue haze, some casting shadows on the deck below. Something has to keep stirring an atmosphere that gets so little sunlight.</p>
          <p>Neptune gives off more than twice the energy it receives from the Sun; the rest comes from inside. Uranus, its near twin, releases far less. Interior models that fit the same measurements allow both water-rich and rock-rich compositions, so a neat three-layer cutaway looks more certain than the evidence permits.</p>
          <Source href="https://www.britannica.com/place/Neptune-planet/Basic-astronomical-data">Britannica · energy balance</Source>
          <Source href="https://doi.org/10.1051/0004-6361/202556911">Morf &amp; Helled · interior models</Source>
          <Source href="https://science.nasa.gov/science-research/planetary-science/nasa-oxford-discover-warmer-uranus-than-once-thought/">NASA · the ice giants’ heat compared</Source>
        </NeptuneChapter>

        <NeptuneChapter target="rings" index="04" label="Ring arcs" title={<>Rings that <em>should not clump</em></>}
          real={{ caption: 'the ring arcs, PIA02200', href: 'https://www.jpl.nasa.gov/images/pia02200-neptune-partial-rings/' }}>
          <p>Neptune’s rings are dark and dusty, so they show best looking back toward the Sun, the way you had to shoot them. Ring particles closer in orbit faster than those farther out, so any clump should smear out around its ring within a few years.</p>
          <p>Yet the outermost ring holds bright arcs, named Liberté, Égalité, Fraternité and Courage. The small moon Galatea probably helps hold them together; exactly how they stay stable is still debated. Webb’s near-infrared images in 2022 gave the clearest view of the rings since Voyager.</p>
          <Source href="https://nssdc.gsfc.nasa.gov/planetary/factsheet/nepringfact.html">NASA · ring fact sheet</Source>
          <Source href="https://www.jpl.nasa.gov/news/neptunes-ring-arcs-found/">JPL · ring arcs found</Source>
          <Source href="https://science.nasa.gov/missions/webb/new-webb-image-captures-clearest-view-of-neptunes-rings-in-decades/">Webb · the rings in 2022</Source>
        </NeptuneChapter>

        <NeptuneChapter target="triton" index="05" label="Triton" title={<>The moon that <em>goes backwards</em></>}
          real={{ src: '/images/neptune/triton.jpg', alt: 'Voyager’s synthesized-colour mosaic of Triton with a pink southern polar cap and textured terrain', width: 1400, height: 1088, caption: 'PIA00317 · synthesized colour · NASA / JPL / USGS', href: 'https://science.nasa.gov/photojournal/global-color-mosaic-of-triton/' }}>
          <p>Triton, Neptune’s largest moon by far, orbits backwards: it is the only large moon in the Solar System that circles opposite to its planet’s spin. Moons that form alongside a planet go the way it turns, so Triton was very likely captured. Voyager found a thin nitrogen atmosphere, a pink southern cap streaked by active plumes, and pitted “cantaloupe” terrain whose origin is still uncertain.</p>
          <p>The leading idea for the capture is an exchange: Triton arrived as half of a pair of icy bodies, and a close pass pulled the pair apart, keeping one and flinging the other away. Try it below. Because Triton orbits against Neptune’s spin, the tides it raises slowly drain its orbit; one estimate brings it to the Roche limit, where it would be pulled apart, in roughly 3.6 billion years.</p>
          <Source href="https://science.nasa.gov/neptune/moons/triton/">NASA · Triton</Source>
          <Source href="https://doi.org/10.1038/nature04792">Agnor &amp; Hamilton · capture by exchange</Source>
          <Source href="https://ntrs.nasa.gov/citations/19890064536">NASA NTRS · Triton’s tidal future</Source>
          <div className={s.inset}>
            <p className={s.eyebrow}>Capture a Triton</p>
            <NeptuneCapture />
          </div>
        </NeptuneChapter>

        <NeptuneChapter target="farewell" index="06" label="Farewell crescent" title={<>One visit, <em>then telescopes</em></>}
          real={{ caption: 'Neptune and Triton as crescents, departing', href: PHOTOJOURNAL }}>
          <p>Voyager 2 left Neptune heading out of the Solar System, and it is still travelling. No spacecraft has been back; everything since has come from telescopes, over a much longer stretch of time than a flyby can see.</p>
          <p>Cloud cover turned out to rise and fall with the Sun’s 11-year activity cycle and almost vanished in 2019. Infrared images from 2003–2020 showed most of the stratosphere cooling, then the south pole warming quickly. Webb’s 2022 images, where methane makes the disc dark and the rings stand out, are a new measurement rather than a new paint job. And a 2024 reanalysis found Neptune’s true colour much paler than Voyager’s processed blue, close to Uranus.</p>
          <Source href="https://science.nasa.gov/missions/hubble/neptunes-disappearing-clouds-linked-to-the-solar-cycle/">Hubble / Keck · clouds and the solar cycle</Source>
          <Source href="https://www.eso.org/public/news/eso2206/">ESO · unexpected temperature changes</Source>
          <Source href="https://science.nasa.gov/missions/webb/new-webb-image-captures-clearest-view-of-neptunes-rings-in-decades/">Webb · Neptune in near-infrared</Source>
          <Source href="https://www.ox.ac.uk/news/2024-01-05-new-images-reveal-what-neptune-and-uranus-really-look-0">Oxford · the colours reconsidered</Source>
        </NeptuneChapter>
      </section>

      <section id="neptune-discovery" className={s.discovery} aria-labelledby="neptune-discovery-title">
        <header className={s.sectionHead}>
          <p className={s.eyebrow}>Before anyone could visit</p>
          <h2 id="neptune-discovery-title">How we knew where to look</h2>
        </header>
        <div className={s.discoveryText}>
          <p>Voyager could be sent to Neptune because, 143 years earlier, someone had worked out where it was without seeing it. Uranus kept drifting from its predicted path; by the 1840s it was out of place by roughly two arcminutes. Urbain Le Verrier calculated where an unseen planet would have to be to pull it off course, and on 23 September 1846 Johann Galle and Heinrich d’Arrest found Neptune in Berlin, within about 1° of his prediction, on the first night of searching.</p>
          <p>Le Verrier assumed a distance of about 36 AU, following the spacing pattern known as Bode’s law; Neptune orbits at 30. The drift fixes where the pull comes from far better than how far away its source is, so a wrong distance still pointed at the right patch of sky. John Couch Adams independently calculated a position too, but his work did not lead directly to the find. Galileo had recorded Neptune in 1612 and 1613 without recognising it as a planet, and one Neptune year after Galle, in 2011, it came back to where he first saw it.</p>
          <Source href={HISTORY}>NASA history · the discovery of Neptune</Source>
          <Source href={FACT_SHEET}>NASA · Neptune fact sheet</Source>
        </div>
        <div className={s.bench}>
          <p className={s.eyebrow}>Find Neptune yourself</p>
          <p className={s.benchIntro}>Drag a planet of your own around the outer Solar System. With every move the page re-runs 65 years of orbits and draws the drift your planet would give Uranus. Make the gold line follow the dots, then point the telescope.</p>
          <NeptuneHunt />
        </div>
      </section>

      <section className={s.closing}>
        <p className={s.eyebrow}>The last planet</p>
        <Link className={s.begin} href="/explore?focus=Neptune">See Neptune in the simulation <span aria-hidden="true">↗</span></Link>
      </section>
      <footer className={s.footer}>
        <Link href="/planets/uranus">← Uranus</Link><Link href="/">Thessaris</Link><Link href="/planets/mercury">Back to Mercury →</Link>
        <p>Images: Voyager 2, NASA / JPL and NASA / JPL / USGS. The encounter is a simplified model: one hyperbolic path timed to the real closest approaches, illustrative Sun direction and cloud placement, clouds drifting on Voyager’s measured wind profile, and plumes drawn far larger than real. The discovery bench re-integrates Uranus in one plane, with “observations” from the same model using the real Neptune. The capture uses a pair far heavier and closer than a real one.</p>
      </footer>
    </main>
  );
}
