import styles from './ExploreLoader.module.css';

interface ExploreLoaderProps {
  exiting?: boolean;
  className?: string;
}

/** The entrance's accretion ring continues here without changing visual identity.
 * Its absolute centre is independent of text wrapping, so the transition can
 * match position and scale without a layout jump. */
export default function ExploreLoader({ exiting = false, className = '' }: ExploreLoaderProps) {
  return (
    <div role="status" aria-live="polite" aria-busy={!exiting}
      data-explore-loader data-exiting={exiting}
      className={`explore-loader ${styles.loader} ${className}`}>
      <div className={styles.atmosphere} data-loader-chrome aria-hidden="true" />
      <div className={styles.edition} data-loader-chrome aria-hidden="true">
        <span>Thessaris.</span><span>An independent observatory</span>
      </div>
      <div className={styles.core} data-loader-core aria-hidden="true">
        <span className={styles.halo} />
        <span className={styles.outerOrbit} />
        <span className={styles.innerOrbit} />
        <span className={styles.ring} />
        <span className={styles.well} />
        <span className={styles.edge} />
      </div>
      <div className={styles.copy} data-loader-chrome>
        <p className={styles.eyebrow}>Crossing the event horizon</p>
        <h1 className={styles.title}>Preparing the observatory.</h1>
        <div className={styles.progress} aria-hidden="true"><span /></div>
      </div>
      <p className={styles.note} data-loader-chrome>A little perspective is on its way.</p>
    </div>
  );
}
