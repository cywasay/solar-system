'use client';

import Image from 'next/image';
import { useState, type CSSProperties } from 'react';
import s from './JupiterPage.module.css';

export default function JupiterBands() {
  const [pass, setPass] = useState(0);
  return <figure className={s.bands}>
    <div className={s.bandField} data-ju-cue="hero-flow" onPointerMove={event => {
      if (event.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const rect = event.currentTarget.getBoundingClientRect();
      event.currentTarget.style.setProperty('--wind-nudge', `${((event.clientX - rect.left) / rect.width - .5) * 28}px`);
    }} onPointerLeave={event => event.currentTarget.style.removeProperty('--wind-nudge')}>
      <div key={pass} className={s.ribbons} data-replay={pass > 0} aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className={s.ribbon} style={{ '--band': i, '--drift': `${[19, -15, 20, -18, 13][i]}%` } as CSSProperties}>
          <div className={s.ribbonImage}><Image src="/images/jupiter/cloud-map.jpg" alt="" fill sizes="172vw" preload={i === 0} loading={i === 0 ? undefined : 'eager'} /></div>
        </div>)}
        <svg className={s.fronts} viewBox="0 0 1000 400" preserveAspectRatio="none">
          <path pathLength="1" d="M-20 97 C130 112 183 80 307 101 S529 127 659 96 S880 120 1020 87"/>
          <path pathLength="1" d="M1020 206 C857 202 831 237 684 216 S463 174 355 217 S141 208 -20 227"/>
          <path pathLength="1" d="M-20 288 C155 272 210 301 336 281 S540 299 699 277 S878 299 1020 280"/>
        </svg>
      </div>
      <div className={s.bandOverlay}>
        <h2>Order in<br />the <em>storm.</em></h2>
        <a href="#jupiter-storm">Go beneath the clouds <span aria-hidden="true">↘</span></a>
      </div>
    </div>
    <figcaption><span>Cassini cloud mosaic · December 2000<br /><small>Illustrated motion, not a wind measurement.</small></span><button type="button" onClick={() => setPass(pass + 1)}>Replay the currents <span aria-hidden="true">↻</span></button></figcaption>
  </figure>;
}
