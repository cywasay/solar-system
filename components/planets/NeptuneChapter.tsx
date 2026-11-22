'use client';

import Image from 'next/image';
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { album, bestFor } from './neptune/album';
import type { TargetId } from './neptune/encounter';
import s from './NeptunePage.module.css';

type Real = { src?: string; alt?: string; width?: number; height?: number; position?: string; caption: string; href: string };

/** Draws a received frame row by row, the way Voyager's pictures arrived, the first time it appears. */
function Downlink({ url, label }: { url: string; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const img = new window.Image();
    let raf = 0;
    img.onload = () => {
      const size = 320;
      canvas.width = size;
      canvas.height = size;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const start = performance.now();
      const step = (now: number) => {
        const p = reduced ? 1 : Math.min(1, (now - start) / 2600);
        const rows = Math.floor(p * size);
        ctx.fillStyle = '#05070d';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, rows, 0, 0, size, rows);
        if (rows < size) {
          // Rows not yet received: static.
          const noise = ctx.createImageData(size, Math.min(6, size - rows));
          for (let i = 0; i < noise.data.length; i += 4) { const v = Math.random() * 90; noise.data[i] = v; noise.data[i + 1] = v; noise.data[i + 2] = v; noise.data[i + 3] = 255; }
          ctx.putImageData(noise, 0, rows);
          raf = requestAnimationFrame(step);
        }
      };
      raf = requestAnimationFrame(step);
    };
    img.src = url;
    return () => cancelAnimationFrame(raf);
  }, [url]);
  return <canvas ref={ref} className={s.frameCanvas} role="img" aria-label={`Your frame of ${label}`} />;
}

/**
 * A chapter of the album. It stays closed until you photograph its subject in the encounter
 * (or choose to read it anyway), then shows your frame beside Voyager's.
 */
export default function NeptuneChapter({ target, index, label, title, real, children }: {
  target: TargetId; index: string; label: string; title: ReactNode; real: Real; children: ReactNode;
}) {
  const state = useSyncExternalStore(album.subscribe, album.get, album.server);
  const photo = bestFor(state, target);
  const open = state.revealAll || !!photo || state.revealed.includes(target);
  return (
    <article id={`neptune-${target}`} className={s.chapter} data-open={open ? '' : undefined} aria-labelledby={`neptune-${target}-title`}>
      <header className={s.chapterHead}>
        <p className={s.eyebrow}>Frame {index} · {label}</p>
        <h2 id={`neptune-${target}-title`}>{title}</h2>
      </header>
      <div className={s.frames}>
        <figure className={s.frame}>
          {photo ? <Downlink url={photo.url} label={label} /> : <div className={s.noSignal} aria-hidden="true"><span>No signal</span></div>}
          <figcaption>{photo ? <><b>Your frame</b> · {photo.colour ? 'colour' : 'black and white'} · {photo.note}</> : <><b>Your frame</b> · not taken yet</>}</figcaption>
        </figure>
        <figure className={s.frame}>
          {real.src ? (
            <div className={s.realFrame}>
              <Image src={real.src} alt={real.alt ?? ''} width={real.width} height={real.height} sizes="(max-width: 860px) 46vw, 300px" style={{ objectPosition: real.position ?? 'center' }} />
            </div>
          ) : (
            <a className={s.realLink} href={real.href} target="_blank" rel="noreferrer"><span>Voyager’s frame</span> ↗</a>
          )}
          <figcaption><b>Voyager 2</b> · {real.caption}</figcaption>
        </figure>
      </div>
      {open ? (
        <div className={s.chapterBody}>{children}</div>
      ) : (
        <div className={s.locked}>
          <p>Photograph the {label.toLowerCase()} during the encounter to receive this chapter.</p>
          <button type="button" onClick={() => album.reveal(target)}>Read it now</button>
        </div>
      )}
    </article>
  );
}

/** "Show all" for readers who would rather not fly. */
export function AlbumControls() {
  const state = useSyncExternalStore(album.subscribe, album.get, album.server);
  const got = new Set(state.photos.map((p) => p.target).filter(Boolean)).size;
  return (
    <div className={s.albumControls}>
      <p>{state.revealAll ? 'All chapters are open.' : `${got} of 6 subjects photographed.`}</p>
      {!state.revealAll && <button type="button" onClick={() => album.showAll()}>Show all chapters</button>}
    </div>
  );
}
