import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { preload } from 'react-dom';
import MotionScope from '@/components/motion/MotionScope';
import { earthDisplay } from './earthFont';
import EarthGlobe from './EarthGlobe';
import { EarthEnergy, EarthField, EarthPlates, EarthSeaLevel, EarthSeasons, EarthTides } from './EarthTiles';
import s from './EarthPage.module.css';

const SOURCES = {
  system: 'https://science.nasa.gov/earth/explore/',
  marble: 'https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/',
  night: 'https://svs.gsfc.nasa.gov/30876/',
  energy: 'https://science.nasa.gov/earth/earth-observatory/climate-and-earths-energy-budget/',
  ocean: 'https://science.nasa.gov/earth/explore/earth-indicators/ocean-warming/',
  plates: 'https://pubs.usgs.gov/gip/dynamic/understanding.html',
  carbon: 'https://science.nasa.gov/earth/earth-observatory/the-carbon-cycle/',
  field: 'https://www.ncei.noaa.gov/products/geomagnetism-frequently-asked-questions',
  tides: 'https://oceanservice.noaa.gov/facts/moon-tide.html',
  record: 'https://science.nasa.gov/photojournal/satellite-record-of-sea-level-rise-from-1993-to-2024/',
  sea: 'https://science.nasa.gov/earth/explore/earth-indicators/sea-leve/',
};

function Source({ href, children }: { href: string; children: ReactNode }) {
  return <a className={s.source} href={href} target="_blank" rel="noreferrer">{children} ↗</a>;
}

/** One instrument on the board. `span` is its width in the 12-column grid. */
function Tile({ index, kind, span, tone = 'light', title, children, instrument, className = '' }: {
  index: string;
  kind: string;
  span: number;
  tone?: 'light' | 'dark';
  title: ReactNode;
  children: ReactNode;
  instrument: ReactNode;
  className?: string;
}) {
  return (
    <article className={`${s.tile} ${className}`} data-tone={tone} data-cue style={{ '--span': span } as CSSProperties}>
      <header className={s.tileHead}><span>{index}</span><span>{kind}</span></header>
      <div className={s.instrument}>{instrument}</div>
      <div className={s.tileCopy}>
        <h3>{title}</h3>
        {children}
      </div>
    </article>
  );
}

export default function EarthPage() {
  preload('/images/earth/globe-day-jan.jpg', { as: 'image', fetchPriority: 'high' });
  preload('/images/earth/globe-day-jul.jpg', { as: 'image' });
  preload('/images/earth/globe-night.jpg', { as: 'image', fetchPriority: 'high' });

  return (
    <MotionScope as="main" eager className={`${s.page} ${earthDisplay.variable}`}>
      <header className={s.hero}>
        <div className={s.heroCopy}>
          <p className={s.heroIndex}><span>03</span>Third planet from the Sun</p>
          <h1 className={s.title}>Earth</h1>
          <p className={s.tagline}>You are here.<br /><em>Right now.</em></p>
          <p className={s.heroLede}>
            The one planet we watch from the inside: from orbit, from the ground, from the water.
            This is it at this moment, sunlit where the Sun is up and lit by cities where it is not.
          </p>
          <a href="#board" className={s.heroLink}>Open the instrument board <span aria-hidden="true">↓</span></a>
        </div>
        <EarthGlobe />
      </header>

      <section id="board" className={s.board} aria-labelledby="earth-board">
        <div className={s.boardHead} data-reveal>
          <p className={s.eyebrow}>The instruments of home</p>
          <h2 id="earth-board">A planet<br /><em>in exchange.</em></h2>
          <div>
            <p>Earth is usually described by what it has: an ocean, an atmosphere, a magnetic field, life. The more revealing question is what moves between them. Water carries heat. Weathering moves carbon from air into rock. Living things change the chemistry around them.</p>
            <p>Each instrument below follows one exchange, and keeps a measurement separate from a model, and a season separate from a trend.</p>
            <Source href={SOURCES.system}>Earth as a connected system · NASA</Source>
          </div>
        </div>

        <div className={s.grid}>
          <Tile index="01" kind="Seasons" span={8} instrument={<EarthSeasons />}
            title={<>A season is a pattern <em>across a planet.</em></>}>
            <p>Drag across the map to compare January and July. Snow cover and vegetation shift between hemispheres. These NASA Blue Marble mosaics combine many cloud-screened observations into monthly composites: they show seasonality, not the weather on one day.</p>
            <p className={s.note}>NASA Earth Observatory, Blue Marble Next Generation, 2004. Persistent cloud and polar darkness limit some retrievals. <Source href={SOURCES.marble}>Dataset notes</Source></p>
          </Tile>

          <Tile index="02" kind="Night" span={4} tone="dark" className={s.nightTile}
            instrument={<div className={s.nightMap} aria-hidden="true" data-ambient><i /></div>}
            title={<>Human activity leaves <em>an optical signature.</em></>}>
            <p>The VIIRS instrument detects faint light at night. Settled corridors and coastlines stand out, but brightness is not a direct measure of population or wealth, and a dark area is not necessarily empty.</p>
            <p className={s.note}>NASA/GSFC Black Marble 2016. <Source href={SOURCES.night}>Processing notes</Source></p>
          </Tile>

          <Tile index="03" kind="Energy" span={5} instrument={<EarthEnergy />}
            title={<>Sunlight arrives. <em>Heat takes the long way.</em></>}>
            <p>Averaged over the globe, about 340 watts of sunlight reach each square metre at the top of the atmosphere. Clouds, aerosols, and bright surfaces send roughly 29 percent straight back; the rest warms the planet and eventually leaves as infrared heat. Greenhouse gases change how easily that heat escapes.</p>
            <p>Turn the dial: every percentage point of reflectivity moves about 3.4 W/m² of sunlight. This is the arithmetic of the budget, not a forecast of how climate would respond.</p>
            <Source href={SOURCES.energy}>Earth’s energy budget · NASA</Source>
          </Tile>

          <Tile index="04" kind="Ocean" span={7} tone="dark"
            instrument={
              <div className={s.ocean} aria-hidden="true" data-ambient>
                <span className={s.oceanLayer} data-layer="surface">Surface<small>responds in months</small></span>
                <span className={s.oceanLayer} data-layer="mixed">Mixed layer</span>
                <span className={s.oceanLayer} data-layer="deep">Deep ocean<small>adjusts over centuries</small></span>
                <i /><i /><i /><i /><i />
                <b className={s.oceanStat}>≈90%<small>of the excess heat</small></b>
              </div>
            }
            title={<>The ocean gives the system <em>memory.</em></>}>
            <p>NASA estimates the ocean has absorbed about 90 percent of the excess heat from planetary warming over the past century. Storage moderates warming in the air; it does not make the energy disappear. Warmer water expands, and marine heatwaves stress ecosystems.</p>
            <p>Sea-surface temperature and ocean heat content answer different questions: one describes the top, the other the heat held through a volume of water. Satellites and instruments at depth are combined because neither is enough alone.</p>
            <Source href={SOURCES.ocean}>Ocean warming · NASA</Source>
          </Tile>

          <Tile index="05" kind="Plates" span={7} instrument={<EarthPlates />}
            title={<>The ground moves, <em>and records it.</em></>}>
            <p>The lithosphere, the crust and rigid uppermost mantle, is broken into plates. At spreading ridges new ocean floor forms; at convergent boundaries one plate can descend beneath another; at transform boundaries they slide past. Those edges organise most earthquakes and volcanoes.</p>
            <p>As new crust cools it records the direction of Earth’s magnetic field, which flips from time to time. Matching stripes on both sides of a ridge, displaced geology, and satellite geodesy are independent evidence for plate motion. The mantle below is mostly solid rock, not an ocean of magma.</p>
            <p className={s.note}>Illustrative: a spreading rate of 4 cm per year and schematic reversal timing. <Source href={SOURCES.plates}>Plate motions and their evidence · USGS</Source></p>
          </Tile>

          <Tile index="06" kind="Carbon" span={5}
            instrument={
              <div className={s.carbon} aria-hidden="true" data-ambient>
                <span className={s.loop} data-tempo="fast"><i /><i /><i /><i /><i /><i /></span>
                <span className={s.loop} data-tempo="slow"><i /><i /><i /><i /><i /><i /><i /><i /></span>
                <b data-label="fast">Fast loop<small>photosynthesis · respiration · air–sea exchange</small></b>
                <b data-label="slow">Slow loop<small>weathering · rivers · sediments · volcanism</small></b>
              </div>
            }
            title={<>Two tempos of <em>the carbon cycle.</em></>}>
            <p>Plants draw carbon into living tissue and respiration returns it; air and sea trade carbon dioxide. Slower paths run through rock: weathering consumes carbon dioxide, rivers carry it to the sea, sediments bury it, and tectonics and volcanoes return it.</p>
            <p>The difference matters. Fossil carbon released in decades cannot be balanced by geological processes that work over hundreds of thousands of years.</p>
            <Source href={SOURCES.carbon}>The carbon cycle · NASA</Source>
          </Tile>

          <Tile index="07" kind="Magnetosphere" span={8} tone="dark" instrument={<EarthField />}
            title={<>A magnetic boundary, <em>not a sealed shell.</em></>}>
            <p>Motion in Earth’s liquid outer core generates most of its magnetic field. In space it meets the solar wind, which compresses the day side and stretches a long tail on the night side. Push the wind harder and the boundary moves in: it usually sits about ten Earth radii out, closer during strong storms.</p>
            <p>The field redirects many charged particles but is not a universal shield; the atmosphere protects too. Auroras and geomagnetic storms show energy getting in, not the field switching off.</p>
            <p className={s.note}>Boundary drawn with a standard empirical shape; field lines are schematic. <Source href={SOURCES.field}>Geomagnetism FAQ · NOAA</Source></p>
          </Tile>

          <Tile index="08" kind="Tides" span={4} instrument={<EarthTides />}
            title={<>The Moon reaches <em>into the ocean.</em></>}>
            <p>Tides come from differences in gravitational pull across Earth, mainly from the Moon and also from the Sun. The two-bulge picture is a starting model, not a tide table: coastlines, depth, rotation, and resonance make neighbouring shores differ.</p>
            <p><Link href="/explore?focus=Luna">Inspect the Earth–Moon system ↗</Link> <Source href={SOURCES.tides}>Why local tides differ · NOAA</Source></p>
          </Tile>

          <Tile index="09" kind="Sea level · 1993 to 2024" span={12} className={s.seaTile} instrument={<EarthSeaLevel />}
            title={<>Change is measured <em>across observations.</em></>}>
            <p>Satellite altimeters time radar pulses down to the sea surface. Combined with precise orbits, and carefully linked across successive missions, they give more than three decades of global mean sea level, rising at an accelerating rate.</p>
            <p>The rise in 2024 alone was about 5.9 millimetres, with thermal expansion contributing more than in many recent years. That is one dated annual result, not a rate to apply to every year or coastline. Global mean sea level is not the level at your nearest shore: land rises or sinks, and currents reshape the surface.</p>
            <p><Source href={SOURCES.record}>The 1993–2024 satellite record · NASA/JPL</Source> <Source href={SOURCES.sea}>Global and regional sea level · NASA</Source></p>
          </Tile>
        </div>
      </section>

      <section className={s.closing} aria-labelledby="earth-open" data-reveal>
        <h2 id="earth-open">The familiar planet<br /><em>is still an open question.</em></h2>
        <p>Earth offers what no other planet can: distant observations checked against instruments in the water, on the ground, and in the air. That makes the picture richer, not complete. Every dataset is most useful when it tests an explanation, and when we are clear about what it cannot tell us.</p>
        <Link href="/explore?focus=Earth" className={s.explore}>Explore Earth <span aria-hidden="true">↗</span></Link>
      </section>

      <footer className={s.footer}>
        <nav aria-label="Planets">
          <Link href="/planets/venus">← Venus</Link>
          <Link href="/">Back to Thessaris</Link>
          <Link href="/planets/mars">Mars →</Link>
        </nav>
        <p>Maps: NASA Earth Observatory / Blue Marble Next Generation (2004); NASA/GSFC Black Marble (2016). Composites, not live feeds; only the globe’s lighting is computed live. Diagrams are schematic where marked.</p>
      </footer>
    </MotionScope>
  );
}
