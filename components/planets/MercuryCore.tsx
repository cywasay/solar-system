'use client';

import { useId, useState, type CSSProperties } from 'react';
import { useMercuryCue, useMercuryPointer } from './useMercuryMotion';
import styles from './MercuryPage.module.css';

export default function MercuryCore() {
  const { ref, arrived } = useMercuryCue<HTMLDivElement>();
  const [cut, setCut] = useState(55);
  const [touched, setTouched] = useState(false);
  const id = useId().replace(/:/g, '');
  useMercuryPointer(ref, 0.6, 0.4, 30);
  return (
    <figure
      className={styles.coreFigure}
      data-arrived={arrived || undefined}
      data-touched={touched || undefined}
      style={{ '--core-cut': `${cut}%` } as CSSProperties}
    >
      <div ref={ref} className={styles.coreStage}>
        <div
          className={styles.coreBody}
          role="img"
          aria-label={`Illustrative Mercury cutaway with the rocky exterior ${cut} percent of the way across the viewing window.`}
        >
          <div className={styles.coreMetal} />
          <div className={styles.coreSheen} />
          <div className={styles.coreSurface} />
          <span className={styles.coreBlade} />
        </div>
        <span className={styles.coreLabel}>
          Metallic core <i />
        </span>
        <span className={styles.shellLabel}>
          <i />
          Rocky exterior
        </span>
      </div>
      <div className={styles.coreControl}>
        <label htmlFor={`${id}-cut`}>
          Expose the interior <output>{cut}%</output>
        </label>
        <input
          id={`${id}-cut`}
          type="range"
          min="0"
          max="100"
          value={cut}
          onFocus={() => setTouched(true)}
          onChange={(event) => {
            setTouched(true);
            setCut(Number(event.target.value));
          }}
        />
      </div>
      <figcaption>
        Illustrative cutaway; proportions are schematic. The control reveals structure, not a
        measured depth.
      </figcaption>
    </figure>
  );
}
