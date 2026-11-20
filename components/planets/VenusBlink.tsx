'use client';

import { useEffect, useRef, useState } from 'react';
import s from './VenusPage.module.css';

/** Shared terrain: identical in both passes, so only the vent appears to jump. */
function Terrain() {
  return (
    <g fill="none" stroke="#f3e2bd" strokeLinecap="round">
      <path d="M-10 70C70 52 130 92 210 74S350 40 420 62" strokeOpacity=".35" strokeWidth="3" />
      <path d="M-10 92C60 80 140 116 230 98S350 70 420 84" strokeOpacity=".18" strokeWidth="2" />
      <path d="M30 250C90 214 120 236 170 206" strokeOpacity=".3" strokeWidth="2.5" />
      <path d="M262 300C300 262 352 270 410 240" strokeOpacity=".28" strokeWidth="2" />
      <path d="M300 120l26 30-12 34 30 26" strokeOpacity=".4" strokeWidth="1.6" />
      <circle cx="86" cy="150" r="21" strokeOpacity=".5" strokeWidth="2.4" />
      <circle cx="86" cy="150" r="13" strokeOpacity=".2" strokeWidth="5" />
      <circle cx="338" cy="248" r="9" strokeOpacity=".45" strokeWidth="1.8" />
      <path d="M120 300C150 270 160 290 196 268" strokeOpacity=".22" strokeWidth="7" />
    </g>
  );
}

const FRAMES = [
  { label: 'Pass A', note: 'Earlier radar pass' },
  { label: 'Pass B', note: 'Eight months later' },
];

export default function VenusBlink() {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    // The first time the screen is seen it starts blinking, unless reduced motion is preferred.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let started = false;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      if (entry.isIntersecting && !started && !reduced) setPlaying(true);
      if (entry.isIntersecting) started = true;
    }, { threshold: 0.3 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !visible) return;
    const timer = window.setInterval(() => setFrame((value) => 1 - value), 820);
    return () => window.clearInterval(timer);
  }, [playing, visible]);

  const choose = (index: number) => {
    setPlaying(false);
    setFrame(index);
  };

  return (
    <div ref={root} className={s.blink}>
      <div className={s.blinkScreen} role="img" aria-label={`Schematic redraw of the Maat Mons vent, ${FRAMES[frame].note.toLowerCase()}. In the later pass the vent is larger and irregular, with new material beside it; surrounding terrain is unchanged.`}>
        {/* Radar grain is a noise filter: expensive to rasterise. It lives in its own static,
            promoted layer so the blink (which repaints the vents) never re-runs it. */}
        <svg className={s.grain} viewBox="0 0 400 320" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <filter id="venus-radar-grain" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="11" />
              <feColorMatrix values="0 0 0 0 .95  0 0 0 0 .78  0 0 0 0 .52  0 0 0 .55 0" />
            </filter>
          </defs>
          <rect width="400" height="320" filter="url(#venus-radar-grain)" opacity=".55" />
        </svg>
        <svg viewBox="0 0 400 320" aria-hidden="true">
          <Terrain />
          <g className={s.vent} data-visible={frame === 0}>
            <path d="M196 152c11-8 27-6 33 6s1 25-12 29-27 1-31-11 1-17 10-24Z" fill="#0f0905" stroke="#ffd59a" strokeWidth="2.2" />
          </g>
          <g className={s.vent} data-visible={frame === 1}>
            <path d="M186 146c14-15 41-14 52 0 9 11 2 21 9 32 6 11-6 26-24 27-17 1-24-6-37-4-15 2-24-11-19-24 4-11 10-20 19-31Z" fill="#0f0905" stroke="#ffd59a" strokeWidth="2.2" />
            <path d="M226 202c12 10 15 26 32 34 13 6 18 18 30 21" fill="none" stroke="#ffb46b" strokeWidth="5" strokeOpacity=".75" strokeLinecap="round" />
            <path d="M206 205c-2 13 6 24 2 38" fill="none" stroke="#ffb46b" strokeWidth="3.4" strokeOpacity=".6" strokeLinecap="round" />
          </g>
          <g fill="none" stroke="#f3e2bd" strokeOpacity=".55">
            <path d="M210 112v-14M210 230v14M150 170h-14M276 170h14" />
          </g>
        </svg>
        <span className={s.blinkStamp}><b>{FRAMES[frame].label}</b>{FRAMES[frame].note}</span>
        <span className={s.blinkScale}>Schematic redraw, not the radar data</span>
      </div>
      <div className={s.blinkControls} role="group" aria-label="Compare the two radar passes">
        <button type="button" aria-pressed={playing} onClick={() => setPlaying(!playing)}>
          <span className={s.toggleLamp} aria-hidden="true" />{playing ? 'Blinking' : 'Blink'}
        </button>
        {FRAMES.map((item, index) => (
          <button key={item.label} type="button" aria-pressed={!playing && frame === index} onClick={() => choose(index)}>
            {item.note}
          </button>
        ))}
      </div>
    </div>
  );
}
