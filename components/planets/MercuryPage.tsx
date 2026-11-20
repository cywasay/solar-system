import Link from 'next/link';
import { Barlow_Condensed } from 'next/font/google';
import type { CSSProperties } from 'react';
import MercuryMotion, { MercuryHero } from './MercuryMotion';
import MercuryLightStudy from './MercuryLightStudy';
import MercuryGeology from './MercuryGeology';
import MercuryCore from './MercuryCore';
import MercuryResonance from './MercuryResonance';
import MercuryCta from './MercuryCta';
import styles from './MercuryPage.module.css';

const display = Barlow_Condensed({
  weight: ['500', '600'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mercury',
});

export default function MercuryPage() {
  return (
    <MercuryMotion className={`${styles.page} ${display.className} ${display.variable}`}>
      <MercuryHero className={styles.hero}>
        <div className={styles.heroTop}>
          <span>Nearest to the Sun.</span>
          <a href="#light">
            Read the surface <span aria-hidden="true">↘</span>
          </a>
        </div>
        <div className={styles.world} aria-hidden="true">
          <i />
        </div>
        <div className={styles.heroTerminator} aria-hidden="true" />
        <h1>
          <span className="sr-only">Mercury</span>
          {'MERCURY'.split('').map((letter, i) => (
            <span key={i} aria-hidden="true" style={{ '--letter': i } as CSSProperties}>
              <i>{letter}</i>
            </span>
          ))}
        </h1>
        <div className={styles.heroBottom}>
          <h2>
            A world
            <br />
            <em>cut by light.</em>
          </h2>
          <div>
            <p>
              Rock. Iron. A thin exosphere.
              <br />
              An exposed record of the early solar system.
            </p>
            <a href="#light" className={styles.heroRead}>
              Find the relief <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        <p className={styles.caption}>Illustrative globe using the simulation’s surface texture.</p>
      </MercuryHero>

      <div className={styles.measures} data-mc-cue aria-label="Mercury at a glance">
        <div>
          <strong>
            4,879<span> km</span>
          </strong>
          <p>Mean diameter</p>
        </div>
        <div>
          <strong>
            88<span> days</span>
          </strong>
          <p>One orbit · approximately</p>
        </div>
        <div>
          <strong>
            176<span> days</span>
          </strong>
          <p>One solar day · approximately</p>
        </div>
        <div>
          <strong>
            3.7<span> m/s²</span>
          </strong>
          <p>Surface gravity</p>
        </div>
      </div>

      <section id="light" className={styles.study}>
        <div className={styles.split} data-mc-cue>
          <h2>
            THE SURFACE
            <br />
            <em>changes with the light.</em>
          </h2>
          <p>
            Low-angle light makes relief easier to read. Move the light across this constructed
            crater field and watch the rims emerge.
          </p>
        </div>
        <MercuryLightStudy />
      </section>

      <MercuryGeology />

      <section className={styles.interior}>
        <MercuryCore />
        <div className={styles.interiorCopy}>
          <p className={styles.kicker}>Beneath the crust</p>
          <h2>
            MOSTLY
            <br />
            <em>metal.</em>
          </h2>
          <p>
            A large metallic core dominates the interior. Why Mercury retained so much metal
            relative to rock remains a question about its formation.
          </p>
          <p className={styles.quiet}>
            A collision is one proposed explanation, not an established history.
          </p>
          <a
            className={styles.scienceLink}
            href="https://www.nasa.gov/solar-system/messenger-provides-new-look-at-mercurys-surprising-core-and-landscape-curiosities/"
          >
            MESSENGER · evidence for the interior ↗
          </a>
        </div>
      </section>

      <MercuryResonance />

      <section className={styles.evidence}>
        <div>
          <p className={styles.kicker}>Observation makes the difference</p>
          <h2>
            HOW
            <br />
            <em>we know.</em>
          </h2>
        </div>
        <div className={styles.evidenceRecord} data-mc-cue>
          <div className={styles.missionLine} aria-hidden="true">
            <i />
            <i />
          </div>
          <article>
            <h3>
              Mariner 10 <span>1974–1975</span>
            </h3>
            <p>Three flybys provided the first close views.</p>
            <div className={styles.flybyTraces} aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
          </article>
          <article>
            <h3>
              MESSENGER <span>2011–2015 in orbit</span>
            </h3>
            <p>
              Orbital observations mapped the planet and investigated its chemistry, magnetic field,
              and polar deposits.
            </p>
            <div className={styles.mappingTraces} aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => (
                <i key={i} style={{ '--pass': i } as CSSProperties} />
              ))}
            </div>
          </article>
          <a
            className={styles.scienceLink}
            href="https://science.nasa.gov/mercury/facts/"
            target="_blank"
            rel="noreferrer"
          >
            Read the scientific reference · NASA ↗
          </a>
          <p className={styles.quiet}>
            Reference values are rounded. Surface texture reused from Thessaris; all explanatory
            geometry is illustrative.
          </p>
        </div>
      </section>
      <MercuryCta />
      <footer className={styles.footer}>
        <Link href="/">← Back to Thessaris</Link>
        <Link href="/planets/venus">
          Next world <strong>VENUS ↗</strong>
        </Link>
      </footer>
    </MercuryMotion>
  );
}
