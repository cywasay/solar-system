'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './SaturnPage.module.css';

const stations = [
  { id: 'saturn-approach', name: 'Approach', note: 'Projected ring plane' },
  { id: 'saturn-edge', name: 'Edge-on', note: 'The rings viewed along their plane' },
  { id: 'saturn-rings', name: 'Ring divisions', note: 'Radial section of the main rings' },
  { id: 'saturn-pole', name: 'North pole', note: 'Cassini · Spring at the North Pole' },
  { id: 'saturn-titan', name: 'Titan', note: 'Cassini · Purple Haze · false color' },
  { id: 'saturn-enceladus', name: 'Enceladus', note: 'Cassini · A Song of Ice and Light' },
  { id: 'saturn-finale', name: 'The last pass', note: 'Cassini · A Farewell to Saturn' },
];

// Camera poses are keyed to chapters and interpolated against native scroll.
// Ring opening is projected as sin(angle). The visible edge has a small floor.
const poses = [
  { x: 850, y: 340, scale: 1.46, angle: 33, roll: -17, opacity: 1, wash: [37, 34, 26] },
  { x: 846, y: 360, scale: 1.6, angle: .3, roll: 0, opacity: 1, wash: [28, 27, 23] },
  { x: -130, y: 364, scale: 2.7, angle: 4, roll: 0, opacity: 0, wash: [44, 38, 27] },
  { x: -280, y: 570, scale: 3, angle: 28, roll: 12, opacity: 0, wash: [31, 36, 34] },
  { x: 1210, y: 400, scale: 1.4, angle: 25, roll: -9, opacity: 0, wash: [48, 31, 23] },
  { x: -180, y: 140, scale: 1.1, angle: 15, roll: 5, opacity: 0, wash: [26, 32, 38] },
  { x: 860, y: 344, scale: 1.3, angle: 23, roll: -13, opacity: 0, wash: [17, 17, 16] },
];

const photos = [
  { key: 'pole', scene: 3, image: '/images/saturn/pole.jpg', side: 'left', moveX: -28, moveY: 12 },
  { key: 'titan', scene: 4, image: '/images/saturn/titan.jpg', side: 'right', moveX: 33, moveY: 0 },
  { key: 'enceladus', scene: 5, image: '/images/saturn/enceladus.jpg', side: 'left', moveX: -23, moveY: 16 },
  { key: 'farewell', scene: 6, image: '/images/saturn/farewell.jpg', side: 'right', moveX: 15, moveY: -13 },
];

const rings = [
  { r: 133, width: 14, color: '#8a7f69', opacity: .6 },
  { r: 171, width: 50, color: '#c4ab7d', opacity: .95 },
  { r: 212, width: 21, color: '#a19379', opacity: .9 },
  { r: 231, width: 1.2, color: '#cbbd9e', opacity: .64 },
];

function RingBands() {
  return <g fill="none">
    {rings.map(ring => <circle key={ring.r} r={ring.r} stroke={ring.color} strokeWidth={ring.width} opacity={ring.opacity}/>)}
    {Array.from({length:52}, (_, index) => {
      const radius = 125 + index * 1.95;
      if (radius > 196 && radius < 202) return null;
      return <circle key={radius} r={radius} stroke={index % 3 === 0 ? '#332b20' : '#ead8b5'} strokeWidth={index % 5 === 0 ? 1.4 : .6} opacity={.13 + (index % 6) * .065}/>;
    })}
  </g>;
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const mix = (start: number, end: number, amount: number) => start + (end - start) * amount;
const ease = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };

export default function SaturnJourney({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const rig = useRef<SVGGElement>(null);
  const rear = useRef<SVGGElement>(null);
  const front = useRef<SVGGElement>(null);
  const profile = useRef<SVGGElement>(null);
  const descent = useRef<SVGPathElement>(null);
  const craft = useRef<SVGCircleElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const journey = root.current;
    const screen = stage.current;
    if (!journey || !screen) return;
    const chapters = Array.from(journey.querySelectorAll<HTMLElement>('[data-saturn-chapter]'));
    const shots = Array.from(screen.querySelectorAll<HTMLElement>('[data-saturn-shot]'));
    const masthead = document.querySelector<HTMLElement>('header[data-theme="saturn"]');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const narrow = matchMedia('(max-width:760px)');
    let positions: number[] = [];
    let readingInset = 0;
    let frame = 0;
    let current = -1;
    const path = descent.current;
    const pathLength = path?.getTotalLength() ?? 0;

    const render = () => {
      frame = 0;
      if (motion.matches) return;
      const scroll = window.scrollY + readingInset;
      let index = positions.length - 1;
      while (index > 0 && scroll < positions[index] - 2) index--;
      const next = Math.min(index + 1, poses.length - 1);
      const distance = positions[next] - positions[index];
      const local = distance > 0 ? (scroll - positions[index]) / distance : 0;
      const travel = index === 0 ? ease((local - .17) / .79) : ease((local - .38) / .58);
      const coordinate = index + travel * (next - index);
      const from = poses[index];
      const to = poses[next];
      const mobile = narrow.matches;
      const x = mix(from.x, to.x, travel);
      const y = mix(from.y, to.y, travel);
      const scale = mix(from.scale, to.scale, travel);
      const roll = mix(from.roll, to.roll, travel);
      const angle = mix(from.angle, to.angle, travel);
      const opening = Math.max(.011, Math.sin(angle * Math.PI / 180));
      const mobileX = 600 + (x - 850) * .36;
      const mobileY = 350 + (y - 350) * .4;
      rig.current?.setAttribute('transform', `translate(${mobile ? mobileX : x} ${mobile ? mobileY : y}) rotate(${roll}) scale(${scale * (mobile ? 1.38 : 1)})`);
      rig.current?.setAttribute('opacity', String(mix(from.opacity, to.opacity, travel)));
      rear.current?.setAttribute('transform', `scale(1 ${opening})`);
      front.current?.setAttribute('transform', `scale(1 ${opening})`);
      const profileDelta = coordinate - 2;
      profile.current?.setAttribute('opacity', String(ease(1 - Math.abs(profileDelta) / .7)));
      profile.current?.setAttribute('transform', `translate(${(mobile ? 170 : 60) - profileDelta * 375} ${mobile ? 248 : 270}) scale(${mobile ? 1.63 : 1})`);
      screen.style.setProperty('--saturn-wash', `rgb(${from.wash.map((value, channel) => Math.round(mix(value, to.wash[channel], travel))).join(' ')})`);
      journey.style.setProperty('--saturn-progress', String(coordinate / (stations.length - 1)));
      const dive = ease((scroll - positions[positions.length - 1] + 75) / (mobile ? 270 : 365));
      screen.style.setProperty('--saturn-dive', String(dive));
      if (path && dive > 0) {
        const point = path.getPointAtLength(pathLength * dive);
        craft.current?.setAttribute('cx', String(point.x));
        craft.current?.setAttribute('cy', String(point.y));
      }
      shots.forEach((shot, i) => {
        const photo = photos[i];
        const offset = coordinate - photo.scene;
        shot.style.opacity = String(ease(1 - Math.abs(offset) / .76));
        shot.style.setProperty('--photo-x', `${-offset * photo.moveX * (mobile ? .6 : 1)}%`);
        shot.style.setProperty('--photo-y', `${offset * photo.moveY}%`);
        shot.style.setProperty('--photo-scale', String(1 + Math.min(1, Math.abs(offset)) * .14));
      });
      const station = Math.min(stations.length - 1, Math.round(coordinate));
      if (station !== current) { current = station; setActive(station); }
    };
    const schedule = () => { if (!frame && !motion.matches) frame = requestAnimationFrame(render); };
    const measure = () => {
      if (masthead) journey.style.setProperty('--saturn-nav', `${masthead.getBoundingClientRect().height}px`);
      const stageTop = parseFloat(getComputedStyle(screen).top) || 0;
      readingInset = stageTop + (narrow.matches ? screen.offsetHeight : 0);
      positions = chapters.map(chapter => chapter.getBoundingClientRect().top + window.scrollY);
      schedule();
    };
    const resize = new ResizeObserver(measure);
    resize.observe(journey);
    resize.observe(screen);
    if (masthead) resize.observe(masthead);
    const onMotionChange = () => {
      if (motion.matches) {
        journey.removeAttribute('data-running');
        rig.current?.setAttribute('transform', 'translate(600 350) rotate(-17) scale(1.42)');
        rig.current?.setAttribute('opacity', '1');
        rear.current?.setAttribute('transform', 'scale(1 .545)');
        front.current?.setAttribute('transform', 'scale(1 .545)');
        profile.current?.setAttribute('opacity', '0');
        current = -1;
        setActive(0);
      } else journey.dataset.running = 'true';
      measure();
    };
    onMotionChange();
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const chapterLink = chapters.find(chapter => `#${chapter.id}` === location.hash);
    if (navigation?.type === 'navigate') chapterLink?.scrollIntoView({ block: 'start' });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    motion.addEventListener('change', onMotionChange);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
      motion.removeEventListener('change', onMotionChange);
      journey.removeAttribute('data-running');
    };
  }, []);

  return <div ref={root} className={styles.journey}>
    <div ref={stage} className={styles.stage}>
      <div className={styles.stageArt} role="img" aria-label={stations[active].note}>
        <svg viewBox="0 0 1200 700" className={styles.diagram}>
          <defs>
            <clipPath id="saturn-disc"><ellipse rx="100" ry="91"/></clipPath>
            <clipPath id="saturn-rear"><rect x="-235" y="-235" width="470" height="235"/></clipPath>
            <clipPath id="saturn-front"><rect x="-235" y="0" width="470" height="235"/></clipPath>
            <radialGradient id="saturn-shade" cx="33%" cy="31%" r="75%"><stop stopColor="#fff3ce" stopOpacity=".2"/><stop offset=".55" stopColor="#402f20" stopOpacity=".02"/><stop offset="1" stopColor="#171411" stopOpacity=".94"/></radialGradient>
            <linearGradient id="saturn-ring-panel"><stop stopColor="#877558"/><stop offset=".55" stopColor="#d3b787"/><stop offset="1" stopColor="#9c8f74"/></linearGradient>
          </defs>
          <g stroke="#c8b38b" strokeOpacity=".14" fill="none"><path d="M0 350H1200M600 0V700"/><circle cx="600" cy="350" r="294"/><circle cx="600" cy="350" r="221"/></g>
          <g ref={rig} className={styles.rig} transform="translate(850 340) rotate(-17) scale(1.46)">
            <g ref={rear} clipPath="url(#saturn-rear)" transform="scale(1 .545)"><RingBands/></g>
            <ellipse rx="100" ry="91" fill="#d5b88c"/>
            <image href="/textures/2k_saturn.jpg" x="-100" y="-91" width="200" height="182" preserveAspectRatio="none" clipPath="url(#saturn-disc)"/>
            <ellipse rx="100" ry="91" fill="url(#saturn-shade)" stroke="#e4ca9c" strokeOpacity=".38" strokeWidth=".7"/>
            <g ref={front} clipPath="url(#saturn-front)" transform="scale(1 .545)"><RingBands/></g>
          </g>
          <g ref={profile} opacity="0" transform="translate(60 270)" className={styles.profile}>
            <text x="0" y="-30">ACROSS THE MAIN RINGS</text>
            <rect x="0" y="0" width="114" height="120" fill="#8d7b60" opacity=".65"/>
            <rect x="114" y="0" width="212" height="120" fill="url(#saturn-ring-panel)"/>
            <rect x="372" y="0" width="155" height="120" fill="#b2a18a"/>
            {Array.from({length:91}, (_, i) => i * 5.8 > 326 && i * 5.8 < 372 ? null : <path key={i} d={`M${i * 5.8} 0v120`} stroke={i % 4 === 0 ? '#29261f' : '#efe2c8'} strokeWidth={i % 7 === 0 ? 2.3 : .75} opacity={.14 + (i % 5) * .08}/>)}
            <path d="M0 147h527m-5-4 5 4-5 4" stroke="#bfa680" fill="none"/>
            <text x="18" y="177">C ring</text><text x="166" y="177">B ring</text><text x="400" y="177">A ring</text>
            <path d="M349 66v-42l32-25" stroke="#e1c99e" fill="none"/><text x="389" y="-8">Cassini Division</text>
          </g>
        </svg>
        {photos.map(photo => <div key={photo.key} data-saturn-shot={photo.key} className={`${styles.shot} ${photo.side === 'left' ? styles.shotLeft : styles.shotRight}`}>
          <Image src={photo.image} alt="" fill sizes="(max-width:760px) 92vw, 46vw" loading="eager" />
          {photo.key === 'farewell' && <svg className={styles.descent} viewBox="0 0 600 360" aria-hidden="true"><path ref={descent} pathLength="1" d="M535 44 C447 35 400 65 375 112 C350 160 359 207 311 229"/><circle ref={craft} cx="535" cy="44" r="4"/><text x="403" y="32">Illustrated trajectory</text></svg>}
        </div>)}
      </div>
    </div>
    <div className={styles.stageHud}>
      <div className={styles.stageFoot}>
        <div className={styles.stageNote}><span>{String(active + 1).padStart(2, '0')} / 07</span><span>{stations[active].note}</span></div>
        <nav className={styles.stations} aria-label="Saturn journey chapters">{stations.map((station, index) => <a key={station.id} href={`#${station.id}`} aria-label={station.name} aria-current={index === active ? 'location' : undefined} title={station.name}><i/></a>)}</nav>
      </div>
    </div>
    <div className={styles.story}>{children}</div>
  </div>;
}
