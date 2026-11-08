import type { Metadata } from 'next';
import NasaMock from './NasaMock';
import HudMock from './HudMock';
import ButtonLab from './ButtonLab';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Direction mock-ups — Thessaris',
  robots: { index: false, follow: false },
};

export default function StyleLabPage() {
  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <div className={styles.inner}>
          <p className={styles.kicker}>Design lab · temporary · not linked from the site</p>
          <h1 className={styles.title}>
            Two directions, same pieces<span>.</span>
          </h1>
          <p className={styles.lede}>
            Both are built from the site&rsquo;s real tokens and fonts: ink navy, the #FF6A3D accent, Newsreader and
            Geist. Each shows the same four pieces: the Explore telemetry panel and time console over a stand-in for
            the 3D scene, then the controls and a form. Nothing animates. Hover and press states are instant, so only
            the look is being judged.
          </p>
          <nav className={styles.jump} aria-label="Mock-ups">
            <a href="#nasa">A · NASA-punk</a>
            <a href="#hud">B · Sci-fi HUD</a>
            <a href="#buttons">C · Soft buttons</a>
          </nav>
        </div>
      </header>
      <NasaMock />
      <HudMock />
      <ButtonLab />
    </main>
  );
}
