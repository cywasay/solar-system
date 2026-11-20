'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import s from './EarthPage.module.css';

/**
 * Plays `step(0..1)` once over `duration` ms the first time `target` is on screen, unless
 * the visitor has already taken control or prefers reduced motion (then it jumps to the end).
 */
function useFirstView(target: RefObject<HTMLElement | null>, duration: number, step: (k: number) => void, touched: RefObject<boolean>) {
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  });
  useEffect(() => {
    const element = target.current;
    if (!element) return;
    let frame = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      if (touched.current) return;
      if (reduced) {
        stepRef.current(1);
        return;
      }
      const start = performance.now();
      const tick = (now: number) => {
        if (touched.current) return;
        const k = Math.min(1, (now - start) / duration);
        stepRef.current(1 - Math.pow(1 - k, 3));
        if (k < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [target, duration, touched]);
}

/* ---------------------------------------------------------------- Seasons */

const REGIONS = [
  { name: 'Whole Earth', origin: '50% 50%', scale: 1 },
  { name: 'North Atlantic', origin: '29% 2%', scale: 2.1 },
  { name: 'South Asia', origin: '92% 21%', scale: 2.1 },
];

export function EarthSeasons() {
  const [july, setJuly] = useState(50);
  const [region, setRegion] = useState(0);
  const current = REGIONS[region];
  return (
    <div className={s.seasons}>
      <div className={s.seasonView} style={{ '--crop-origin': current.origin, '--crop-scale': current.scale } as CSSProperties}
        role="img" aria-label={`${current.name}: January and July 2004 surface composites, July shown across ${july}% of the view`}>
        <div className={s.seasonLayer}><div className={s.seasonCrop}><Image src="/images/earth/january-2004.jpg" alt="" fill sizes="(max-width: 760px) 100vw, 64vw" /></div></div>
        <div className={s.seasonLayer} style={{ clipPath: `inset(0 ${100 - july}% 0 0)` }}><div className={s.seasonCrop}><Image src="/images/earth/july-2004.jpg" alt="" fill sizes="(max-width: 760px) 100vw, 64vw" /></div></div>
        <span className={s.seasonDivider} style={{ left: `${july}%` }} aria-hidden="true"><i /></span>
        <span className={s.seasonTag} data-side="left" aria-hidden="true">July</span>
        <span className={s.seasonTag} data-side="right" aria-hidden="true">January</span>
        <input className={s.seasonRange} type="range" min="0" max="100" value={july} aria-label="Reveal July across the map"
          aria-valuetext={`July shown across ${july}%`} onChange={(event) => setJuly(Number(event.target.value))} />
      </div>
      <div className={s.chips} role="group" aria-label="View">
        {REGIONS.map((item, index) => (
          <button key={item.name} type="button" aria-pressed={region === index} onClick={() => setRegion(index)}>{item.name}</button>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Energy */

const INCOMING = 340; // W/m², global annual average at the top of the atmosphere

export function EarthEnergy() {
  const [albedo, setAlbedo] = useState(29);
  const reflected = (INCOMING * albedo) / 100;
  const absorbed = INCOMING - reflected;
  return (
    <div className={s.energy}>
      <div className={s.flows} aria-hidden="true">
        <div className={s.flow} data-kind="in" style={{ '--share': 1 } as CSSProperties}><i /></div>
        <div className={s.flow} data-kind="out" style={{ '--share': reflected / INCOMING } as CSSProperties}><i /></div>
        <div className={s.flow} data-kind="heat" style={{ '--share': absorbed / INCOMING } as CSSProperties}><i /></div>
        <span className={s.ground} />
      </div>
      <dl className={s.flowValues}>
        <div><dt>Sunlight arriving</dt><dd>{INCOMING}<small>W/m²</small></dd></div>
        <div><dt>Reflected straight back</dt><dd>{Math.round(reflected)}<small>W/m²</small></dd></div>
        <div><dt>Absorbed, later radiated as heat</dt><dd>{Math.round(absorbed)}<small>W/m²</small></dd></div>
      </dl>
      <label className={s.dial}>
        <span>Reflectivity <b>{albedo}%</b></span>
        <input type="range" min="20" max="40" value={albedo} aria-valuetext={`${albedo} percent of sunlight reflected`}
          onChange={(event) => setAlbedo(Number(event.target.value))} />
      </label>
    </div>
  );
}

/* ----------------------------------------------------------------- Plates */

const MAX_MYR = 2;
const PX_PER_MYR = 118; // drawing scale, each side of the ridge
/** Schematic polarity flips, by formation time in Myr from the start. Real reversals are irregular. */
const FLIPS = [0, 0.17, 0.31, 0.52, 0.76, 0.9, 1.2, 1.41, 1.6, 1.83, 2.01];

export function EarthPlates() {
  const [myr, setMyr] = useState(0.15);
  const root = useRef<HTMLDivElement>(null);
  const touched = useRef(false);
  useFirstView(root, 4200, (k) => setMyr(0.15 + k * 1.65), touched);

  const ridge = 320;
  const spread = myr * PX_PER_MYR;
  const stripes: { from: number; to: number; normal: boolean }[] = [];
  for (let i = 0; i < FLIPS.length - 1 && FLIPS[i] < myr; i++) {
    const formedFrom = FLIPS[i];
    const formedTo = Math.min(FLIPS[i + 1], myr);
    stripes.push({ from: (myr - formedTo) * PX_PER_MYR, to: (myr - formedFrom) * PX_PER_MYR, normal: i % 2 === 0 });
  }
  return (
    <div ref={root} className={s.plates}>
      <svg viewBox="0 0 640 210" role="img" aria-label={`Seafloor spreading after ${myr.toFixed(2)} million years: the ocean has widened by about ${Math.round(myr * 40)} kilometres, with matching magnetic stripes on both sides of the ridge.`}>
        <rect x="0" y="92" width="640" height="70" fill="#0d3a52" />
        {stripes.map((stripe, index) => (
          <g key={index} fill={stripe.normal ? '#e9eef0' : '#244f66'}>
            <rect x={ridge + stripe.from} y="92" width={Math.max(0, stripe.to - stripe.from)} height="70" />
            <rect x={ridge - stripe.to} y="92" width={Math.max(0, stripe.to - stripe.from)} height="70" />
          </g>
        ))}
        <rect x={ridge - spread - 74} y="70" width="74" height="92" rx="4" fill="#4c7a3d" />
        <rect x={ridge + spread} y="70" width="74" height="92" rx="4" fill="#7a6a3d" />
        <path d={`M${ridge} 92v70`} stroke="#f29b4b" strokeWidth="3" />
        <path d={`M${ridge - 16} 186h-60m60 0-8-5m8 5-8 5M${ridge + 16} 186h60m-60 0 8-5m-8 5 8 5`} stroke="currentColor" fill="none" strokeOpacity=".7" />
        <text x={ridge} y="56" textAnchor="middle" fontSize="12" fill="currentColor">Spreading ridge</text>
        <text x={ridge} y="204" textAnchor="middle" fontSize="11" fill="currentColor" fillOpacity=".7">new crust forms here, then moves away</text>
      </svg>
      <div className={s.plateRead}>
        <p><b>{myr.toFixed(2)}</b> million years</p>
        <p><b>≈{Math.round(myr * 40)}</b> km of new ocean floor</p>
      </div>
      <input className={s.plateRange} type="range" min="0" max={MAX_MYR} step="0.01" value={myr}
        aria-label="Time since spreading began" aria-valuetext={`${myr.toFixed(2)} million years`}
        onChange={(event) => { touched.current = true; setMyr(Number(event.target.value)); }} />
    </div>
  );
}

/* ------------------------------------------------------------ Magnetosphere */

const RE_PX = 10;

/** A standard empirical magnetopause shape, r = r0 (2 / (1 + cos θ))^0.5, drawn in Earth radii. */
function magnetopause(r0: number, cx: number, cy: number) {
  const points: string[] = [];
  for (let deg = -140; deg <= 140; deg += 4) {
    const theta = (deg * Math.PI) / 180;
    const r = r0 * Math.pow(2 / (1 + Math.cos(theta)), 0.5) * RE_PX;
    points.push(`${(cx - r * Math.cos(theta)).toFixed(1)},${(cy - r * Math.sin(theta)).toFixed(1)}`);
  }
  return `M${points.join('L')}`;
}

export function EarthField() {
  const [storm, setStorm] = useState(0);
  const r0 = 10 - storm * 4;
  const cx = 250;
  const cy = 130;
  const squeeze = r0 / 10;
  return (
    <div className={s.field}>
      {/* Solar wind: HTML dashes moved by transform (compositor), not animated SVG. */}
      <div className={s.fieldWind} aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((row) => <i key={row} style={{ '--row': row } as CSSProperties} />)}
      </div>
      <svg viewBox="0 0 640 260" role="img" aria-label={`Magnetosphere with the dayside boundary about ${r0.toFixed(1)} Earth radii from Earth.`}>
        <path d={magnetopause(r0, cx, cy)} fill="none" stroke="#9fd2ff" strokeWidth="1.6" />
        <g transform={`translate(${cx} ${cy})`} fill="none" stroke="#9fd2ff" strokeOpacity=".55">
          {[1, 0.68, 0.4].map((k) => (
            <g key={k}>
              <path d={`M0 -12C${-70 * k * squeeze} ${-80 * k} ${-70 * k * squeeze} ${80 * k} 0 12`} />
              <path d={`M0 -12C${120 * k} ${-60 * k} ${300 * k} -14 ${390 * k} -6M0 12C${120 * k} ${60 * k} ${300 * k} 14 ${390 * k} 6`} />
            </g>
          ))}
        </g>
        <circle cx={cx} cy={cy} r={RE_PX} fill="#2f7fb0" stroke="#e8f4ff" />
        <path d={`M${cx - r0 * RE_PX} ${cy - 22}v-16`} stroke="#ffcf7a" />
        <text x={cx - r0 * RE_PX} y={cy - 44} textAnchor="middle" fontSize="11" fill="#ffcf7a">{r0.toFixed(1)} Earth radii</text>
        <text x="16" y="250" fontSize="11" fill="#cfe6ff">Solar wind →</text>
        <text x="520" y="250" fontSize="11" fill="#cfe6ff">Night-side tail</text>
      </svg>
      <label className={s.dial} data-tone="dark">
        <span>Solar wind <b>{storm < 0.2 ? 'typical' : storm < 0.7 ? 'strengthening' : 'strong storm'}</b></span>
        <input type="range" min="0" max="1" step="0.01" value={storm} aria-valuetext={`Dayside boundary at about ${r0.toFixed(1)} Earth radii`}
          onChange={(event) => setStorm(Number(event.target.value))} />
      </label>
    </div>
  );
}

/* ------------------------------------------------------------------ Tides */

export function EarthTides() {
  const [angle, setAngle] = useState(-35);
  const svg = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const aim = (event: ReactPointerEvent<SVGSVGElement>) => {
    const box = svg.current?.getBoundingClientRect();
    if (!box) return;
    const x = event.clientX - (box.left + box.width / 2);
    const y = event.clientY - (box.top + box.height / 2);
    setAngle((Math.atan2(y, x) * 180) / Math.PI);
  };
  const keys = (event: KeyboardEvent<SVGGElement>) => {
    if (['ArrowRight', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setAngle((a) => a + 10); }
    if (['ArrowLeft', 'ArrowDown'].includes(event.key)) { event.preventDefault(); setAngle((a) => a - 10); }
  };
  const rad = (angle * Math.PI) / 180;
  const mx = 170 + Math.cos(rad) * 136;
  const my = 170 + Math.sin(rad) * 136;

  return (
    <div className={s.tides}>
      <svg ref={svg} viewBox="0 0 340 340" className={s.tideStage}
        onPointerDown={(event) => { dragging.current = true; try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer already gone */ } aim(event); }}
        onPointerMove={(event) => { if (dragging.current) aim(event); }}
        onPointerUp={() => { dragging.current = false; }} onPointerCancel={() => { dragging.current = false; }}>
        <circle cx="170" cy="170" r="136" fill="none" stroke="currentColor" strokeOpacity=".2" strokeDasharray="2 6" />
        <ellipse cx="170" cy="170" rx="76" ry="58" fill="#5fb0d8" fillOpacity=".55" transform={`rotate(${angle} 170 170)`} />
        <circle cx="170" cy="170" r="52" fill="#2f7fb0" />
        <path d="M140 150c12-10 22-4 30-12s20-2 24 8-8 18-18 16-26 4-34-4-6-6-2-8Z" fill="#5d8f4a" />
        <g role="slider" tabIndex={0} aria-label="Moon position" aria-valuemin={-180} aria-valuemax={180}
          aria-valuenow={Math.round(angle)} aria-valuetext={`Moon at ${Math.round(((angle % 360) + 360) % 360)} degrees`}
          onKeyDown={keys} className={s.moon}>
          <circle cx={mx} cy={my} r="22" fill="transparent" />
          <circle cx={mx} cy={my} r="13" fill="#e9e6dc" stroke="#0b2533" strokeOpacity=".3" />
        </g>
        <text x="170" y="330" textAnchor="middle" fontSize="11" fill="currentColor" fillOpacity=".75">Drag the Moon</text>
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------- Sea level */

const FIRST = 1993;
const LAST = 2024;
/** Smoothed path: the yearly rate rises steadily from about 2.0 to about 4.4 mm per year. */
const RISE_START = 2.0;
const RISE_END = 4.4;
const riseMm = (year: number) => {
  const t = year - FIRST;
  return RISE_START * t + ((RISE_END - RISE_START) / (2 * (LAST - FIRST))) * t * t;
};
const SCALE_MM = 120;

export function EarthSeaLevel() {
  const [year, setYear] = useState(FIRST);
  const root = useRef<HTMLDivElement>(null);
  const touched = useRef(false);
  useFirstView(root, 3600, (k) => setYear(FIRST + k * (LAST - FIRST)), touched);
  const mm = riseMm(year);
  return (
    <div ref={root} className={s.sea}>
      <div className={s.staff} aria-hidden="true">
        {Array.from({ length: 13 }, (_, cm) => (
          <span key={cm} style={{ bottom: `${(cm * 10 * 100) / SCALE_MM}%` }} data-major={cm % 2 === 0}>{cm % 2 === 0 ? `${cm}` : ''}</span>
        ))}
        <div className={s.water} style={{ transform: `translateY(${(100 - (mm * 100) / SCALE_MM).toFixed(2)}%)` }}><i /></div>
        <b className={s.staffZero}>1993 level</b>
      </div>
      <div className={s.seaRead}>
        <p className={s.seaYear}>{Math.round(year)}</p>
        <p className={s.seaValue}>+{(mm / 10).toFixed(1)}<small>cm since 1993</small></p>
        <input type="range" min={FIRST} max={LAST} step="0.25" value={year} aria-label="Year"
          aria-valuetext={`${Math.round(year)}: about ${(mm / 10).toFixed(1)} centimetres above 1993`}
          onChange={(event) => { touched.current = true; setYear(Number(event.target.value)); }} />
        <p className={s.note}>Smoothed path built from NASA’s published figures: about 10 cm since 1993, with the yearly rate rising from about 2 mm to more than 4 mm. The measured record varies from year to year.</p>
      </div>
    </div>
  );
}
