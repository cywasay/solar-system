'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import s from './VenusPage.module.css';
import { whenImageReady } from './venusImages';

/** What the hero needs before it can play: the planet images (fonts are awaited too). */
const ASSETS = ['/images/venus/magellan-globe.jpg', '/textures/2k_venus_atmosphere.jpg'];
/** Never hold the page longer than this, however slow the network. */
const CAP_MS = 3500;

/**
 * Covers the page until the fonts and hero images have decoded, then fades and lets the
 * hero's entrance play (it waits for data-entered on <main>). Rendered on the server so the
 * half-built hero is never seen; a CSS failsafe hides it after 6 s if scripts fail, and it
 * is not shown at all without scripting.
 */
export default function VenusLoader() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0.08);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const total = ASSETS.length + 1;
    let finished = 0;
    const advance = () => {
      finished += 1;
      if (!cancelled) setProgress(0.08 + (0.92 * finished) / total);
    };
    const decode = (src: string) => whenImageReady(src).then(advance);
    const ready = Promise.all([document.fonts.ready.then(advance), ...ASSETS.map(decode)]);
    const cap = new Promise((resolve) => window.setTimeout(resolve, CAP_MS));
    void Promise.race([ready, cap]).then(() => {
      if (cancelled) return;
      setProgress(1);
      const main = ref.current?.closest('main');
      if (main) main.dataset.entered = '';
      setDone(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div ref={ref} className={s.loader} data-state={done ? 'done' : 'loading'} role="status" aria-live="polite" aria-hidden={done}>
      <span className={s.loaderOrb} aria-hidden="true" />
      <p>{done ? 'Venus is ready' : 'Reading the clouds'}</p>
      <span className={s.loaderBar} aria-hidden="true"><i style={{ '--p': progress } as CSSProperties} /></span>
    </div>
  );
}
