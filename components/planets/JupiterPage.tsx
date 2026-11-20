import Image from 'next/image';
import Link from 'next/link';
import JupiterBands from './JupiterBands';
import JupiterStorm from './JupiterStorm';
import JupiterRhythm from './JupiterRhythm';
import JupiterFlow from './JupiterFlow';
import JupiterChoreography from './JupiterChoreography';
import { jupiterDisplay } from './jupiterFont';
import s from './JupiterPage.module.css';

function Source({href, children}: {href: string; children: React.ReactNode}) {
  return <a className={s.source} href={href} target="_blank" rel="noreferrer">{children} ↗</a>;
}

function CurrentBridge({ direction }: { direction: 'inward' | 'outward' }) {
  return <div className={s.currentBridge} data-direction={direction} data-ju-cue="bridge" aria-hidden="true">
    <svg viewBox="0 0 1000 120" preserveAspectRatio="none">
      <path pathLength="1" d="M0 30C292 30 340 30 460 54S660 92 1000 92"/>
      <path pathLength="1" d="M0 46C315 46 352 40 480 68S690 101 1000 101"/>
      <path pathLength="1" d="M0 63C330 63 368 55 502 82S714 111 1000 111"/>
    </svg>
  </div>;
}

const moons = [
  {name:'Io', line:'Heat from an orbit', text:'Io’s orbit is kept slightly eccentric by its resonance with Europa and Ganymede. As Io moves closer to and farther from Jupiter, the changing tide flexes it and dissipates energy inside. Volcanism is a visible consequence of an exchange between orbital motion and internal heat. The distribution of that heat remains an active research question.', source:'https://science.nasa.gov/jupiter/jupiter-moons/io/'},
  {name:'Europa', line:'A signal through ice', text:'Galileo measured a magnetic response consistent with a conducting layer beneath Europa’s ice. Salty liquid water is a strong explanation for that signal. The ocean’s existence and its potential to support life are separate questions: how the ice, water, and rocky interior exchange material matters to the latter.', source:'https://science.nasa.gov/jupiter/jupiter-moons/europa/europa-facts/'},
  {name:'Ganymede', line:'A field inside a field', text:'Ganymede generates its own magnetic field inside Jupiter’s much larger magnetosphere. That creates a local magnetic environment within the giant planet’s. Its surface also records different histories: heavily cratered dark regions sit beside brighter, grooved terrain. Interior and surface evidence have to be read together.', source:'https://science.nasa.gov/jupiter/jupiter-moons/ganymede/'},
  {name:'Callisto', line:'An old surface, an open interior', text:'Callisto preserves an extensive impact record. Yet Galileo’s measurements are compatible with a conducting layer, possibly a salty ocean. Its cratered face says something about how little the surface has been renewed; it cannot settle what lies underneath. Callisto is outside the inner three moons’ present resonance.', source:'https://science.nasa.gov/jupiter/jupiter-moons/callisto/facts/'},
];

export default function JupiterPage() {
  return <JupiterChoreography className={`${s.page} ${jupiterDisplay.variable}`}>
    <header className={s.hero}>
      <div className={s.heroLine}><span>The giant in motion</span><a href="#jupiter-system">Four worlds in its wake ↘</a></div>
      <div className={s.titleStage} data-ju-cue="title"><h1>Jupiter</h1><div aria-hidden="true" className={s.titleLayers}>{[0,1,2].map(i=><span key={i} style={{'--title-band':i} as React.CSSProperties}>Jupiter</span>)}</div></div>
      <JupiterBands />
    </header>
    <nav className={s.chapters} data-ju-nav aria-label="Jupiter chapters"><a href="#jupiter-flow">The currents</a><a href="#jupiter-storm">The storm</a><a href="#jupiter-interior">The interior</a><a href="#jupiter-field">The field</a><a href="#jupiter-system">The moons</a></nav>
    <section id="jupiter-flow" className={s.flow}>
      <div><p className={s.kicker}>Belts & zones</p><h2 className={s.flowHeading} data-ju-cue="flow-heading"><span>A pattern made</span><span>by <em>opposition.</em></span></h2></div>
      <div className={s.prose}><p className={s.lead}>Jupiter’s stripes are weather. They look permanent from a distance because the flow keeps making them.</p><p>Bright zones and darker belts trace differences in cloud and haze. Tracking small features over time reveals a related pattern: narrow jets moving east and west around the planet. Where neighboring streams travel at different speeds, the difference stretches clouds and helps shape waves and eddies.</p><p>Fast rotation organizes much of this motion into flows around lines of latitude. The stripes are not fixed borders, and color alone does not tell us a wind’s direction or the altitude of a cloud. The distinction is why time sequences and measurements at different wavelengths are more revealing than any single portrait.</p><Source href="https://www.missionjuno.swri.edu/jupiter/atmosphere">Jupiter’s atmosphere · Mission Juno</Source></div>
    </section>
    <section id="jupiter-flow-study" className={s.labSection} aria-label="Jupiter flow study"><JupiterFlow /></section>
    <CurrentBridge direction="inward" />
    <section id="jupiter-storm" className={s.storm}>
      <div className={s.stormHeading}><div><p className={s.kicker}>The Great Red Spot</p><h2>What lies under<br /><em>the visible storm?</em></h2></div><p>The vortex has a shape we can photograph. Scroll past the cloud tops to see how its depth is measured.</p></div>
      <JupiterStorm />
      <div className={s.stormFoot}><Source href="https://science.nasa.gov/photojournal/the-great-red-spot/">JunoCam source image</Source><Source href="https://www.weizmann.ac.il/EPS/kaspi/sites/EPS.kaspi/files/publications/Parisi-etal-2021_0.pdf">Storm gravity study · Parisi et al., 2021</Source><Source href="https://doi.org/10.1038/nature25793">Jet-depth constraints · Kaspi et al., 2018</Source></div>
      <div className={s.instrumentNotes}><h3>Two instruments,<br />two kinds of evidence.</h3><div><p>Juno’s microwave radiometer senses radiation that escapes from different levels of the atmosphere. Its signal depends on temperature and composition, so a feature in a microwave map is not a direct picture of a wind at a fixed depth.</p><p>Gravity adds an independent test. A storm can redistribute mass and change the pull on a passing spacecraft. Scientists compare that tiny signal with different models of the vortex to see which depths are consistent with the measurement. Combining the two approaches gives a more useful constraint than extending the visible shape downward.</p><Source href="https://science.nasa.gov/missions/juno/nasas-juno-probes-the-depths-of-jupiters-great-red-spot/">Microwave observations of the Great Red Spot · NASA</Source></div></div>
    </section>
    <section id="jupiter-interior" className={s.interior}>
      <div className={s.interiorHeader}><p className={s.kicker}>Pressure changes the material</p><h2>No ground.<br /><em>A changing fluid.</em></h2></div>
      <figure className={s.pressure} data-ju-cue="pressure"><svg viewBox="0 0 1000 165" preserveAspectRatio="none" aria-hidden="true">{Array.from({length:9},(_,i)=><path key={i} pathLength="1" d={`M0 ${14+i*16} C420 ${14+i*16} 606 ${60+i*5.5} 1000 ${60+i*5.5}`} style={{'--layer':i} as React.CSSProperties}/>)}</svg><figcaption><span>Upper atmosphere</span><span>Increasing pressure →</span></figcaption></figure>
      <div className={s.interiorBands}><article><h3>Hydrogen under pressure</h3><div><p>Descending from the clouds means entering increasingly dense hydrogen and helium. There is no rocky surface at a particular cloud boundary. At sufficiently high pressure, hydrogen becomes electrically conducting. “Metallic” describes this behavior; it does not mean a layer of solid metal.</p><p>Convection in conducting fluid, shaped by rotation, can maintain a magnetic field. The field extends far outside the visible planet, into a region filled with charged particles. Jupiter’s atmosphere is one part of a system that includes the solar wind and material supplied by its moons.</p><Source href="https://science.nasa.gov/jupiter/jupiter-facts/">Interior and magnetosphere · NASA</Source></div></article><article><h3>A core without a neat edge</h3><div><p>Juno’s radio tracking records small accelerations as the spacecraft passes over regions where Jupiter’s mass is distributed differently. Removing the effects of the spacecraft’s trajectory and accounting for atmospheric winds lets researchers test interior models.</p><p>Some models fit the measurements with heavy elements mixed through a broad central region. The term “dilute core” describes that gradual distribution. Its exact extent and composition depend on how the models describe hydrogen and helium at pressures that are difficult to reproduce in a lab. A gravity measurement constrains a model; it is not a picture of the core.</p><Source href="https://arxiv.org/abs/1707.01997">Juno gravity and interior models · Wahl et al.</Source></div></article></div>
    </section>
    <section id="jupiter-field" className={s.magnet}>
      <div><p className={s.kicker}>Beyond the cloud tops</p><h2>The moons leave<br /><em>marks in the sky.</em></h2><svg className={s.aurora} data-ju-cue="aurora" viewBox="0 0 550 175" aria-hidden="true"><g>{[0,1,2,3].map(i=><path key={i} pathLength="1" d={`M${22+i*15} ${138+i*9} C${85+i*20} ${35+i*10} ${215+i*30} ${8+i*18} ${350+i*25} ${95+i*12}`} style={{'--trace':i} as React.CSSProperties}/>)}</g><circle cx="350" cy="95" r="5"/><circle cx="350" cy="95" r="11" className={s.auroraPulse}/></svg></div>
      <div className={s.prose}><p>Io’s volcanoes supply material that becomes ionized and trapped by Jupiter’s magnetic field. The planet’s rotation and the motion of the moons through that plasma create electrical interactions. Charged particles traveling along the field can produce bright auroral features near Jupiter’s poles.</p><p>These features can map connections between a moon and the planet’s upper atmosphere. They are evidence that a moon can influence the environment of a giant planet across a distance far larger than the moon itself.</p><Source href="https://solarsystem.nasa.gov/moons/jupiter-moons/io/in-depth.amp">Io’s magnetic connection · NASA</Source></div>
    </section>
    <CurrentBridge direction="outward" />
    <section id="jupiter-system" className={s.system}>
      <div className={s.systemHeader}><p className={s.kicker}>The Galilean moons</p><h2>One planet.<br /><em>Four outcomes.</em></h2><p>For every Ganymede orbit, Europa makes two and Io makes four. The repeating pulls help keep their orbits slightly eccentric, making tides an internal source of heat. Callisto sits outside this pattern.</p></div>
      <div className={s.moonJourney} data-ju-cue="moon-pan">
        <figure className={s.moonFigure}>
          <div className={s.moonWindow}><Image src="/images/jupiter/galilean.jpg" width={1400} height={475} sizes="(max-width:900px) 100vw, 1050px" alt="Galileo spacecraft montage of Io, Europa, Ganymede, and Callisto from left to right"/></div>
          <div className={s.moonGuide} aria-hidden="true"><span>Across the Galilean system</span><strong>Io to<br />Callisto.</strong><i/><span>Follow the moons sideways ↓</span></div>
          <figcaption>Galileo imaging · NASA / JPL / DLR. Sizes shown at a common scale. Spacing is illustrative.</figcaption>
        </figure>
      </div>
      <JupiterRhythm />
      <div className={s.moonList}>{moons.map((moon, i) => <article key={moon.name}><span className={s.ordinal}>0{i+1}</span><div><h3>{moon.name}</h3><p className={s.moonLine}>{moon.line}</p></div><div><p>{moon.text}</p><Source href={moon.source}>{moon.name} observations · NASA</Source></div></article>)}</div>
    </section>
    <section className={s.closing} data-ju-cue="closing"><p>Follow the weather into the larger system.</p><Link href="/explore?focus=Jupiter">Meet Jupiter <span aria-hidden="true">↗</span></Link></section>
    <footer className={s.footer}><Link href="/planets/mars">← Mars</Link><Link href="/">Thessaris</Link><Link href="/planets/saturn">Saturn →</Link><p>Cassini mosaic: NASA / JPL / Space Science Institute, PIA07782. JunoCam: PIA23606. Galileo montage: PIA01299. References appear alongside the observations.</p></footer>
  </JupiterChoreography>;
}
