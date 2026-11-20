import Link from 'next/link';
import MotionScope from '@/components/motion/MotionScope';
import { marsDisplay, marsMono } from './marsFont';
import MarsDive from './MarsDive';
import MarsWorld from './MarsWorld';
import MarsJournal from './MarsJournal';
import s from './MarsPage.module.css';

/**
 * Mars as one dive from orbit to a grain of sand, then a place you drive: a real-time
 * landscape assembled from the planet's features with five sites to reach, and a field
 * journal below that holds every fact and source.
 */
export default function MarsPage() {
  return (
    <MotionScope as="main" eager className={`${s.page} ${marsDisplay.variable} ${marsMono.variable}`}>
      <MarsDive />
      <MarsWorld />
      <MarsJournal />
      <section className={s.sunset} aria-labelledby="mars-close">
        <p className={s.sunsetFact}>On Mars, sunsets are blue.</p>
        <h2 id="mars-close">The traverse<br /><em>is never finished.</em></h2>
        <Link href="/explore?focus=Mars" className={s.meet}>Meet Mars in the simulation <span aria-hidden="true">↗</span></Link>
      </section>
      <footer className={s.footer}>
        <nav aria-label="Planets">
          <Link href="/planets/earth">← Earth</Link>
          <Link href="/">Thessaris</Link>
          <Link href="/planets/jupiter">Jupiter →</Link>
        </nav>
        <p>The Valles Marineris view is a Viking Orbiter mosaic (NASA / JPL / USGS, PIA00422) draped on a globe, then sharpened with generated detail. The landscape and everything below it are generated in code from features Mars really has; they are not a map or terrain data, and the scale readout is a guide, not a measurement. Laser readouts are illustrative. Sources accompany each journal entry. Rover model: <a href="https://sketchfab.com/3d-models/perseverance-mars-rover-53034dff0df04f698f2a5d532366adc4" target="_blank" rel="noreferrer">“Perseverance Mars rover”</a> by <a href="https://sketchfab.com/robo-reboot" target="_blank" rel="noreferrer">Cybertron B-127</a>, <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>; textures resized and parts merged for the web.</p>
      </footer>
    </MotionScope>
  );
}
