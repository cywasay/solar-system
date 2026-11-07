import Link from 'next/link';
import HeroOrrery from '@/components/landing/HeroOrrery';
import HeroStage from '@/components/landing/HeroStage';
import SplitHeadline from '@/components/landing/SplitHeadline';
import SmoothScroll from '@/components/landing/SmoothScroll';
import BeginCta from '@/components/landing/BeginCta';
import FooterFluidText from '@/components/landing/FooterFluidText';
import styles from '@/components/landing/Hero.module.css';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-ink text-fg overflow-x-hidden selection:bg-accent selection:text-ink">
      <SmoothScroll />

      <HeroStage className={styles.stage}>
        <div className={`${styles.eyebrow} rise-in`}>
          <span className={styles.eyebrowMark} aria-hidden="true">✳</span>
          <span>A little perspective. A whole solar system.</span>
        </div>
        <div className={styles.editorial}>
          <h1 className={styles.headline}>
            <SplitHeadline text="Orbital" delay={160} stagger={32} className={styles.firstLine} />
            <span className={styles.secondLine}>
              <SplitHeadline text="Mechanics" delay={340} stagger={28} />
              <span className={styles.period}>.</span>
            </span>
          </h1>
          <div className={`${styles.intro} rise-in`} style={{ animationDelay: '650ms' }}>
            <p>Eight worlds.<br />One extraordinary neighbourhood.</p>
            <p className={styles.description}>
              A solar system you can wander. Follow a planet, find a moon,
              or let the universe put things in perspective.
            </p>
            <Link href="/explore" className={styles.enterLink}>
              <span>Enter the simulation</span>
              <span className={styles.enterArrow} aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <HeroOrrery />
      </HeroStage>

      <BeginCta />
      <footer className="border-t border-line relative w-full h-[24vw] min-h-[120px] overflow-hidden">
        <span className="sr-only">Thessaris</span>
        <FooterFluidText />
      </footer>
    </main>
  );
}
