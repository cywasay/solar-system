'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { SiteId } from './mars/terrain';
import s from './MarsPage.module.css';

const SOURCES = {
  canyon: 'https://science.nasa.gov/photojournal/valles-marineris/',
  facts: 'https://science.nasa.gov/mars/facts/',
  perseverance: 'https://science.nasa.gov/mission/mars-2020-perseverance/science-highlights/',
  jezero: 'https://doi.org/10.1126/sciadv.abo4856',
  maven: 'https://www.nasa.gov/news-release/nasas-maven-reveals-most-of-mars-atmosphere-was-lost-to-space/',
  ice: 'https://pubs.usgs.gov/publication/70195019',
  moons: 'https://science.nasa.gov/mars/moons/',
};

function Source({ href, children }: { href: string; children: ReactNode }) {
  return <a className={s.source} href={href} target="_blank" rel="noreferrer">{children} ↗</a>;
}

const ENTRIES: { id: SiteId; plate: string; where: string; title: ReactNode; body: ReactNode }[] = [
  {
    id: 'canyon', plate: 'II', where: 'Valles Marineris · 13.9° S, 59.2° W',
    title: <>A surface<br /><em>pulled apart.</em></>,
    body: (
      <>
        <p>The connected troughs of Valles Marineris cut thousands of kilometres across the Martian equator. No single river made them: structural faulting, collapse, erosion, and material sliding down steep slopes all shaped the canyon. Its walls expose rock, and deposits on its floors add later chapters.</p>
        <p>A view from above describes today’s outline, not necessarily the process that began it. Layers on a wall, material covering a floor, and channels that cut across older structures can belong to different episodes.</p>
        <Source href={SOURCES.canyon}>Viking mosaic and context · NASA / JPL / USGS</Source>
      </>
    ),
  },
  {
    id: 'outcrop', plate: 'III', where: 'A layered outcrop',
    title: <>Not an empty world.<br /><em>An exposed one.</em></>,
    body: (
      <>
        <p>The question is not simply whether Mars once had water. It is where the water went, how long it stayed, and what it changed before it left. From orbit, valleys and deposits suggest processes; on the ground, grains, minerals, and the boundaries between rocks test them.</p>
        <p>Dust on top describes recent wind. Fine-grained beds settle where water is still; coarser ones need stronger currents, or wind. Inclined layers alone do not identify a lake, because dunes build them too. A pale vein of calcium sulfate cutting across the beds records water moving through the rock after it formed.</p>
        <p>Curiosity’s ChemCam and Perseverance’s SuperCam read rock chemistry from several metres away by vaporising a pinpoint with a laser and analysing the light. The readouts in the world are illustrative, not measurements.</p>
        <Source href={SOURCES.facts}>The Martian surface · NASA</Source>
      </>
    ),
  },
  {
    id: 'jezero', plate: 'IV', where: 'Jezero crater · 18.4° N, 77.6° E · about 45 km across',
    title: <>Water leaves.<br /><em>Evidence stays.</em></>,
    body: (
      <>
        <p>Jezero was chosen because orbital images showed a former lake and a sedimentary fan where a river entered from the west. On the ground, Perseverance takes the argument down to individual beds: their geometry records how sediment built up, and coarse layers mark stronger flows.</p>
        <p>The crater floor also holds igneous rock. A basin that once held a lake need not be floored only with lake sediment; volcanic rock, later water–rock reactions, and sediments sit side by side.</p>
        <p><strong>Habitability is a question about conditions.</strong> Water, suitable chemistry, and an energy source define a place that could have supported life. Evidence for those conditions is not evidence of life, and minerals and organic compounds can form without it. That is why where a sample came from matters as much as the sample.</p>
        <Source href={SOURCES.jezero}>Jezero imaging and interpretation · Bell et al., 2022</Source>
        <Source href={SOURCES.perseverance}>Perseverance science · NASA</Source>
      </>
    ),
  },
  {
    id: 'ice', plate: 'V', where: 'Mid-latitude scarps · eight sites',
    title: <>The water did not<br /><em>all disappear.</em></>,
    body: (
      <>
        <p>A 2018 study examined eight mid-latitude sites where erosion has opened windows into thick water ice beneath a shallow cover: it begins as little as a metre or two down and runs 100 metres or more deep. Its layers record accumulation and later change, not just where ice is today.</p>
        <p>The authors read the ice as snowfall from periods when Mars’s axis tilted further. As exposed ice turns straight to vapour, the scarps retreat and reveal more of the interior. The deposit is a reservoir and an archive; it does not mean a lake on the surface today.</p>
        <Source href={SOURCES.ice}>Exposed subsurface ice sheets · Dundas et al., 2018 / USGS</Source>
      </>
    ),
  },
  {
    id: 'sky', plate: 'VI', where: 'The sky · atmosphere and moons',
    title: <>A landscape outlasting<br /><em>its atmosphere.</em></>,
    body: (
      <>
        <p>On Mars, sunsets are blue: fine dust scatters blue light toward the setting Sun. The air is thin, under one percent of Earth’s surface pressure.</p>
        <p>MAVEN tied atmospheric escape to sunlight and the solar wind: charged particles can be swept away, and energetic particles can knock atoms loose. Lighter isotopes escape more easily, so the argon left behind records what is gone, and it indicates that most of Mars’s atmosphere has been lost to space. The young Sun was more active, and the loss of a global magnetic field belongs in the story without being a single switch.</p>
        <p>Phobos, about 22 km across, orbits three times a day and is creeping closer by about 1.8 metres a century, towards a collision or a ring in tens of millions of years. Deimos, about 12 km across, takes about 30 hours. Capture and formation from impact debris give different histories, and their appearance alone cannot decide between them.</p>
        <Source href={SOURCES.maven}>Atmospheric loss and isotope evidence · NASA, 2017</Source>
        <Source href={SOURCES.moons}>Phobos, Deimos, and their origins · NASA</Source>
      </>
    ),
  },
];

/** The written record of the traverse: every fact and source, logged as sites are reached. */
export default function MarsJournal() {
  const [logged, setLogged] = useState<SiteId[]>([]);

  useEffect(() => {
    const found = (event: Event) => {
      const id = (event as CustomEvent<SiteId>).detail;
      setLogged((list) => (list.includes(id) ? list : [...list, id]));
    };
    window.addEventListener('mars:found', found);
    return () => window.removeEventListener('mars:found', found);
  }, []);

  return (
    <section id="journal" className={s.journal} aria-labelledby="journal-title">
      <header className={s.journalHead}>
        <p className={s.kicker}>Field journal · {logged.length} of {ENTRIES.length} logged</p>
        <h2 id="journal-title">Read the rock.<br /><em>Question the reconstruction.</em></h2>
        <p>The world above is imagined: a landscape assembled from features Mars really has, at a scale you can drive. These notes hold what is known about each, and where it comes from.</p>
      </header>
      {ENTRIES.map((entry) => {
        const isLogged = logged.includes(entry.id);
        return (
          <article key={entry.id} id={`journal-${entry.id}`} className={s.entry} data-cue data-logged={isLogged}>
            <div className={s.entryHead}>
              <span className={s.stamp}>{isLogged ? 'Logged' : `Plate ${entry.plate}`}</span>
              <span className={s.where}>{entry.where}</span>
              <button type="button" className={s.driveThere} onClick={() => window.dispatchEvent(new CustomEvent('mars:goto', { detail: entry.id }))}>
                {isLogged ? 'Drive back ↑' : 'Drive there ↑'}
              </button>
            </div>
            <h3>{entry.title}</h3>
            <div className={s.entryBody}>{entry.body}</div>
          </article>
        );
      })}
    </section>
  );
}
