import Image from 'next/image';
import Link from 'next/link';
import styles from './PortfolioWork.module.css';
import WorkSculpture from './WorkSculpture';
import WorkReveal from './WorkReveal';
import MotionStudy from './MotionStudy';

export default function PortfolioWork() {
  return (
    <>
      <WorkReveal>
        <div className={styles.workInner}>
          <div className={styles.workComposition}>
            <h2 id="work-title" className={styles.workTitle}>
              <span>{Array.from('Curiosity,').map((letter, index) => <span className={styles.titleLetter} key={index}><span>{letter}</span></span>)}</span>
              <em>put into motion.</em>
            </h2>
            <WorkSculpture />
          </div>
          <div className={styles.workFoot}>
            <h3>Thessaris<span>A personal experiment.</span></h3>
            <p>I turned an interest in space into a place you can explore. Custom 3D objects, responsive controls, and motion that connects it all.</p>
            <Link href="/explore" className={styles.launch}>Try it yourself <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </WorkReveal>

      <section id="inside-the-build" className={styles.build} aria-labelledby="build-title">
        <div className={`${styles.grid} ${styles.buildHeader}`}>
          <h2 id="build-title">What I can deliver<br /><em>for you.</em></h2>
          <p>A product someone can turn over. A transition that carries a story forward. A detailed experience that still works on a phone. Here’s the thinking and engineering I bring to each.</p>
        </div>

        <ul className={styles.studies} role="list">
          <li className={`${styles.grid} ${styles.study}`}>
            <div className={styles.studyCopy}>
              <h3>Give your ideas dimension.</h3>
              <p>
                I build with Three.js, shaping geometry in code and mapping textures onto it.
                Phobos and Deimos use custom contours and smoothed lighting normals, so their
                detail holds together as the camera moves around them.
              </p>
              <p className={styles.application}>I can turn that into a product viewer, an explorable space, or an interactive object that lets visitors discover the details for themselves.</p>
            </div>
            <div className={styles.moonStudy}>
              <figure>
                <div className={styles.moonImage}>
                  <Image src="/textures/phobos-generated-v1.png" alt="Flat Phobos texture with dusty grooves and impact craters" fill sizes="(max-width: 760px) 43vw, 20vw" />
                </div>
                <figcaption>Surface texture</figcaption>
              </figure>
              <figure>
                <div className={styles.moonImage}>
                  <Image src="/work/phobos.png" alt="Phobos rendered with its irregular textured mesh" fill sizes="(max-width: 760px) 43vw, 20vw" />
                </div>
                <figcaption>Mesh in the simulation</figcaption>
              </figure>
            </div>
          </li>

          <li className={`${styles.grid} ${styles.study} ${styles.studyReverse}`}>
            <div className={styles.studyCopy}>
              <h3>Make the next step feel natural.</h3>
              <p>
                I connect animation to interface state. Here, the actual navigation elements
                spiral into the entrance while the next scene loads. The timing carries the
                visitor from click to loading screen to exploration, with a shorter sequence
                for reduced-motion preferences.
              </p>
              <p className={styles.application}>For your site, I can choreograph a product reveal, guide a visitor through a portfolio, or make a change of view feel continuous.</p>
            </div>
            <figure className={styles.motionStudy}>
              <MotionStudy />
            </figure>
          </li>

          <li className={`${styles.grid} ${styles.study}`}>
            <div className={styles.studyCopy}>
              <h3>Keep the detail. Lose the friction.</h3>
              <p>
                I design for the device, including what it has to render. On phones, this
                simulation caps pixel density, reduces background particles, and moves controls
                into a touch-friendly dock. The planet textures stay; the extra rendering cost goes.
              </p>
              <p className={styles.application}>I can give your interactive page a mobile layout and rendering budget of its own, so the important content gets the space and attention it needs.</p>
            </div>
            <div className={styles.mobileStudy}>
              <Image
                src="/work/earth-mobile.png"
                alt="Earth and its moon with the mobile body picker and playback dock"
                width={390}
                height={789}
                sizes="120px"
              />
            </div>
          </li>
        </ul>
      </section>
    </>
  );
}
