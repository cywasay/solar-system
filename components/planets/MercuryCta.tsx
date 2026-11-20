'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useMercuryPointer, useMercuryCue } from './useMercuryMotion';
import styles from './MercuryPage.module.css';

export default function MercuryCta() {
  const ref = useRef<HTMLAnchorElement>(null);
  const { ref: cue, arrived } = useMercuryCue<HTMLDivElement>();
  useMercuryPointer(ref, 0.84, 0.52, 64);
  return (
    <div ref={cue} data-arrived={arrived || undefined} className={styles.ctaSection}>
      <Link
        ref={ref}
        draggable={false}
        href="/explore?focus=Mercury"
        className={styles.cta}
        aria-label="Get closer. Explore Mercury in the simulation."
      >
        <div className={styles.ctaContent}>
          <p>Change the angle. Keep looking.</p>
          <h2>
            GET
            <br />
            CLOSER.
          </h2>
          <span className={styles.ctaNote}>Open Mercury in the observatory</span>
        </div>
        <div className={styles.ctaIlluminated} aria-hidden="true">
          <div className={styles.ctaContent}>
            <p>Change the angle. Keep looking.</p>
            <span className={styles.ctaHeading}>
              GET
              <br />
              CLOSER.
            </span>
            <span className={styles.ctaNote}>Open Mercury in the observatory</span>
          </div>
        </div>
        <span className={styles.ctaLight} aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.1">
            <path d="M8 24h31m-12-12 12 12-12 12" />
          </svg>
        </span>
        <span className={styles.ctaRail} aria-hidden="true" />
      </Link>
    </div>
  );
}
