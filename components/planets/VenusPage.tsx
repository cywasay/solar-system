import Link from 'next/link';
import { preload } from 'react-dom';
import type { CSSProperties, ReactNode } from 'react';
import MotionScope from '@/components/motion/MotionScope';
import { venusDisplay } from './planetFonts';
import VenusHero from './VenusHero';
import VenusDescent from './VenusDescent';
import VenusBlink from './VenusBlink';
import VenusDayClock from './VenusDayClock';
import VenusVenera from './VenusVenera';
import VenusLoader from './VenusLoader';
import VenusSwaths from './VenusSwaths';
import s from './VenusPage.module.css';

const SOURCES = {
  facts: 'https://science.nasa.gov/venus/venus-facts/',
  sheet: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html',
  globe: 'https://svs.gsfc.nasa.gov/30357',
  magellan: 'https://science.nasa.gov/mission/magellan/',
  vent: 'https://www.nasa.gov/missions/veritas/nasas-magellan-data-reveals-volcanic-activity-on-venus/',
  venera: 'https://ntrs.nasa.gov/archive/nasa/casi.ntrs.nasa.gov/20190029198.pdf',
  future: 'https://ntrs.nasa.gov/citations/20250006679',
  textures: 'https://www.solarsystemscope.com/textures/',
};

function Source({ href, children }: { href: string; children: ReactNode }) {
  return <a className={s.source} href={href} target="_blank" rel="noreferrer">{children} ↗</a>;
}

/** One altitude in the descent. Children haze into focus in order once the chapter arrives. */
function Chapter({ altitude, name, reading, tone, indent, title, children }: {
  altitude: number;
  name: string;
  reading: string;
  tone: 'light' | 'dark';
  indent: number;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className={s.chapter} data-alt={altitude} data-tone={tone} data-cue style={{ '--indent': indent } as CSSProperties}>
      <p className={`${s.altLabel} ${s.haze}`} style={{ '--i': 0 } as CSSProperties}><span>{altitude} km</span>{name}</p>
      <h2 className={s.haze} style={{ '--i': 1 } as CSSProperties}>{title}</h2>
      <div className={`${s.chapterBody} ${s.haze}`} style={{ '--i': 2 } as CSSProperties}>{children}</div>
      <p className={`${s.chapterData} ${s.haze}`} style={{ '--i': 3 } as CSSProperties}>{reading}</p>
    </article>
  );
}

export default function VenusPage() {
  // Start every large image downloading with the HTML rather than when CSS or a script
  // first asks for it, so sections further down are ready by the time they are reached.
  preload('/images/venus/magellan-globe.jpg', { as: 'image', fetchPriority: 'high' });
  preload('/textures/2k_venus_atmosphere.jpg', { as: 'image', fetchPriority: 'high' });
  preload('/textures/2k_venus_surface.jpg', { as: 'image' });

  return (
    <MotionScope as="main" eager className={`${s.page} ${venusDisplay.variable}`}>
      <VenusLoader />
      <svg className={s.defs} aria-hidden="true" focusable="false">
        <filter id="venus-heat" x="-10%" y="-20%" width="120%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.045" numOctaves="2" seed="4">
            <animate attributeName="baseFrequency" dur="7s" values="0.011 0.045;0.015 0.06;0.011 0.045" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="7" />
        </filter>
      </svg>

      <VenusHero />

      <VenusDescent>
        <Chapter altitude={70} name="Cloud tops" tone="light" indent={4} reading="≈ −43 °C · 0.04 bar"
          title={<>Sunlight ends<br /><em>its journey here.</em></>}>
          <p>From Earth, Venus is a bright, featureless disc. What reaches us is sunlight reflected off the top of a global cloud deck that spans roughly 45 to 70 kilometres above the ground. Its droplets are laced with sulfuric acid.</p>
          <p>The air up here is fast. Winds at the cloud tops carry the clouds around the entire planet in about four Earth days, while the solid world beneath takes 243 days to turn once.</p>
          <Source href={SOURCES.facts}>Clouds and winds · NASA</Source>
        </Chapter>

        <Chapter altitude={50} name="The gentle layer" tone="light" indent={14} reading="≈ 77 °C · 1.1 bar"
          title={<>For a moment,<br /><em>almost familiar.</em></>}>
          <p>Around fifty kilometres up, the pressure is close to Earth’s at sea level and the temperature would only scald, not melt. Nowhere else in this atmosphere comes nearer to conditions we know. It is still inside acidic cloud.</p>
        </Chapter>

        <Chapter altitude={40} name="Beneath the deck" tone="light" indent={24} reading="≈ 144 °C · 3.5 bar"
          title={<>The clouds give way.<br /><em>The view does not.</em></>}>
          <p>Below the main deck the droplets thin to haze. Daylight still filters down, dim and yellowed, but in visible light the ground stays hidden from every camera above. Seeing it takes a different kind of light.</p>
        </Chapter>

        <Chapter altitude={20} name="An ocean of air" tone="dark" indent={10} reading="≈ 294 °C · 22.5 bar"
          title={<>Air you could<br /><em>almost swim through.</em></>}>
          <p>The atmosphere is about 96.5 percent carbon dioxide. It is so thick that it traps the heat the surface radiates: sunlight that reaches the ground warms it, and the infrared the ground gives back can barely escape. This is the greenhouse effect, taken to an extreme.</p>
          <p>So much heat is held that day and night make little difference. The night side is about as hot as the day side.</p>
          <Source href={SOURCES.sheet}>Composition & reference values · NASA fact sheet</Source>
        </Chapter>

        <article className={`${s.chapter} ${s.surface}`} data-alt={0} data-tone="dark" data-cue style={{ '--indent': 0 } as CSSProperties}>
          <p className={`${s.altLabel} ${s.haze}`} style={{ '--i': 0 } as CSSProperties}><span>0 km</span>The ground</p>
          <p className={`${s.heat} ${s.haze}`} data-heat style={{ '--i': 1 } as CSSProperties}>
            <span>≈464</span><small>°C average</small>
          </p>
          <h2 className={s.haze} style={{ '--i': 2 } as CSSProperties}>Hotter than Mercury.<br /><em>Nearly twice as far from the Sun.</em></h2>
          <div className={`${s.chapterBody} ${s.surfaceBody} ${s.haze}`} style={{ '--i': 3 } as CSSProperties}>
            <p>The average surface temperature is about 464 °C (737 K), hot enough to melt lead. The pressure is 92 bar, about 90 times Earth’s at sea level, comparable to standing nearly a kilometre deep in the ocean.</p>
            <p>The brightest world in our sky is the hottest planetary surface in the solar system.</p>
            <Source href={SOURCES.sheet}>Surface values · NASA fact sheet</Source>
          </div>
        </article>
      </VenusDescent>

      <section id="radar" className={s.radar} aria-labelledby="venus-radar">
        <div className={s.radarHead} data-reveal>
          <div>
            <p className={s.eyebrow}>Magellan · 1990 to 1994</p>
            <h2 id="venus-radar">Mapping<br /><em>without daylight.</em></h2>
          </div>
          <p>Radar does not need the Sun, and clouds do not stop it. Magellan sent microwave pulses down through the deck and timed their echoes, building its images one long, narrow swath at a time.</p>
        </div>
        <VenusSwaths />
        <div className={s.radarBody} data-reveal="stagger">
          <p>Magellan reached Venus in 1990 and mapped about 98 percent of the surface. The maps revealed lava channels, volcanic domes, impact craters, and deformed terrain that no telescope had ever seen.</p>
          <p>A bright patch in a radar image means a strong echo, usually from rough or steeply tilted ground. Brightness is not simply height.</p>
          <p className={s.note}>Illustrative swath assembly from a Magellan-derived surface texture (Solar System Scope, CC BY 4.0). Not the mission’s actual swath geometry. <Source href={SOURCES.magellan}>The Magellan mission · NASA</Source></p>
        </div>
      </section>

      <section id="change" className={s.change} aria-labelledby="venus-change">
        <div className={s.changeText} data-reveal="stagger">
          <p className={s.eyebrow}>Maat Mons · re-examined in 2023</p>
          <h2 id="venus-change">Eight months.<br /><em>One vent changed.</em></h2>
          <p>In 2023, researchers comparing Magellan radar images taken eight months apart in 1991 found a volcanic vent near Maat Mons that had changed shape and grown. It is evidence of volcanic activity during the mission, not a view of an eruption in progress.</p>
          <p>Astronomers once searched for change by flicking between two images: whatever jumps is new. Pluto was found that way in 1930. The surroundings here stay still. Watch the vent.</p>
          <Source href={SOURCES.vent}>Read the evidence · NASA</Source>
        </div>
        <VenusBlink />
      </section>

      <section id="time" className={s.time} aria-labelledby="venus-time">
        <div className={s.timeHead} data-reveal>
          <p className={s.eyebrow}>Rotation & time</p>
          <h2 id="venus-time">A day longer<br /><em>than its year.</em></h2>
          <div>
            <p>Measured against the stars, Venus turns once every 243 Earth days, backwards compared with most planets. It circles the Sun in 224.7.</p>
            <p>Put the two together and the Sun returns to the same place in the sky every 116.75 Earth days. Because the spin is retrograde, it rises in the west.</p>
          </div>
        </div>
        <div data-reveal data-reveal-delay="150"><VenusDayClock /></div>
        <p className={s.note}>Rounded reference periods. Orbit and planet are not to scale. <Source href={SOURCES.sheet}>NASA fact sheet</Source></p>
      </section>

      <section id="lander" className={s.lander} aria-labelledby="venus-lander">
        <VenusVenera />
        <div className={s.landerText} data-reveal="stagger">
          <div>
            <p className={s.eyebrow}>Venera 13 · 1 March 1982</p>
            <h2 id="venus-lander">Built for 32 minutes.<br /><em>It lasted 127.</em></h2>
          </div>
          <div>
          <p>The Soviet lander Venera 13 transmitted from the surface for 127 minutes, roughly four times its planned life, and returned the first colour pictures of the Venusian ground. Heat, pressure, and corrosive chemistry ended it, as they have ended every surface mission so far.</p>
          <p>Its pictures describe one landing site, not the planet.</p>
          <Source href={SOURCES.venera}>Surface operations & lander survival · NASA</Source>
          </div>
        </div>
      </section>

      <section className={s.unresolved} aria-labelledby="venus-open">
        <div className={s.unresolvedText} data-reveal="stagger">
          <p className={s.eyebrow}>Still unresolved</p>
          <h2 id="venus-open">How often does the surface<br /><em>remake itself?</em></h2>
          <p>One changed vent opens a larger question: how widespread is the activity? Repeated observations, matching viewing geometry, and better surface measurements are needed to tell local events from a planet-wide pattern.</p>
          <Source href={SOURCES.future}>Evidence, limitations & future observations</Source>
        </div>
        <Link href="/explore?focus=Venus" className={s.explore} data-reveal>
          <span className={s.exploreOrb} aria-hidden="true" data-ambient><i /></span>
          <span className={s.exploreLabel}>Explore Venus <span aria-hidden="true">↗</span></span>
        </Link>
      </section>

      <footer className={s.footer}>
        <nav aria-label="Planets">
          <Link href="/planets/mercury">← Mercury</Link>
          <Link href="/">Back to Thessaris</Link>
          <Link href="/planets/earth">Earth →</Link>
        </nav>
        <p>Cloud imagery: <a href={SOURCES.textures} target="_blank" rel="noreferrer">Solar System Scope</a>, CC BY 4.0, illustrative projection. Radar globe: <a href={SOURCES.globe} target="_blank" rel="noreferrer">NASA/JPL</a>, simulated colour. Atmosphere profile: reference-atmosphere values, rounded. The Maat Mons panels are schematic redraws.</p>
      </footer>
    </MotionScope>
  );
}
