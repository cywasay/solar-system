'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import s from './VenusPage.module.css';
import { whenImageReady } from './venusImages';

const TEXTURE = '/textures/2k_venus_surface.jpg';
const OFFSETS = [0, 22, -12, 9, -20, 5, 17, -7, 12];

/**
 * The radar swath strips. They scan in only once the section is in view (data-shown, from
 * MotionScope) AND the texture has decoded (data-ready), so the reveal never plays over
 * empty strips; until then a "receiving" line shows the data is on its way.
 */
export default function VenusSwaths() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void whenImageReady(TEXTURE).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={s.swaths} data-cue data-ready={ready ? '' : undefined} aria-hidden="true">
      {OFFSETS.map((offset, index) => (
        <span key={index} style={{ '--i': index, '--x': `${(index * 13 + 7) % 100}%`, '--y': `${offset}px` } as CSSProperties}>
          <b>{String(index + 1).padStart(2, '0')}</b>
        </span>
      ))}
      <p className={s.swathStatus}>Receiving radar swaths</p>
    </div>
  );
}
