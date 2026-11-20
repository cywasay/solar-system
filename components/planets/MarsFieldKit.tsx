'use client';

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import s from './MarsPage.module.css';

/* Logical drawing space; the canvases render at 1.5x for sharpness and scale with CSS. */
const W = 960;
const H = 600;
const RES = 1.5;
const DIP = Math.tan((-6 * Math.PI) / 180); // beds rise gently to the east
const GRID_X = 48;
const GRID_Y = 30;

type Kind = 'mudstone' | 'sandstone' | 'cross';
type Target = 'dust' | 'mudstone' | 'sandstone' | 'vein';
type Tool = 'brush' | 'laser' | 'protractor';

const BANDS: { h: number; kind: Kind; colour: string }[] = [
  { h: 74, kind: 'sandstone', colour: '#b8875d' },
  { h: 40, kind: 'mudstone', colour: '#8a5a3e' },
  { h: 28, kind: 'mudstone', colour: '#9c6a4a' },
  { h: 128, kind: 'cross', colour: '#c39363' },
  { h: 38, kind: 'mudstone', colour: '#7d4f37' },
  { h: 62, kind: 'sandstone', colour: '#b07a52' },
  { h: 34, kind: 'mudstone', colour: '#8e5f42' },
  { h: 96, kind: 'sandstone', colour: '#c48f63' },
  { h: 56, kind: 'mudstone', colour: '#7a4a33' },
  { h: 120, kind: 'sandstone', colour: '#b5845a' },
];
const BAND_START = -60;
const VEIN = [[642, -10], [606, 92], [624, 168], [566, 262], [584, 338], [520, 446], [538, 520], [492, 612]];

const TARGETS: Record<Target, { name: string; elements: [string, number][]; text: string }> = {
  dust: {
    name: 'Wind-blown dust',
    elements: [['Fe', 3], ['S', 2], ['Cl', 2], ['Mg', 1]],
    text: 'The surface is the latest edit. Fine dust settles everywhere and carries iron oxide, sulfur, and chlorine. It describes recent wind, not the rock underneath. Brush it away first.',
  },
  mudstone: {
    name: 'Fine-grained bed',
    elements: [['Si', 3], ['Al', 2], ['Fe', 2], ['Mg', 1], ['K', 1]],
    text: 'Fine grains settle where water is still. Rocks like this can hold clay minerals formed in long contact with water, but grain size and the neighbouring layers have to agree before it reads as a lake.',
  },
  sandstone: {
    name: 'Coarser bed',
    elements: [['Si', 3], ['Fe', 2], ['Ca', 1], ['Na', 1]],
    text: 'Coarser grains need more energy to move: a stronger current, or wind. A sandy layer on its own does not say which.',
  },
  vein: {
    name: 'Pale vein',
    elements: [['Ca', 3], ['S', 3], ['H', 2]],
    text: 'Calcium sulfate filled a fracture after the rock had formed, and the hydrogen is water bound inside it. Water moved through this rock later. A rock can record more than its own formation.',
  },
};

function random(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Which band a point is in, measured along the dip. */
function bandAt(x: number, y: number) {
  const along = y - DIP * x;
  let top = BAND_START;
  for (const band of BANDS) {
    if (along < top + band.h) return band;
    top += band.h;
  }
  return BANDS[BANDS.length - 1];
}

function nearVein(x: number, y: number) {
  for (let i = 0; i < VEIN.length - 1; i++) {
    const [x1, y1] = VEIN[i];
    const [x2, y2] = VEIN[i + 1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
    if (Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy)) < 13) return true;
  }
  return false;
}

function drawRock(ctx: CanvasRenderingContext2D) {
  const rand = random(2012);
  let top = BAND_START;
  for (const band of BANDS) {
    const bottom = top + band.h;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, top);
    ctx.lineTo(W, top + DIP * W);
    ctx.lineTo(W, bottom + DIP * W);
    ctx.lineTo(0, bottom);
    ctx.closePath();
    ctx.fillStyle = band.colour;
    ctx.fill();
    ctx.clip();
    // Laminae: parallel to bedding in fine beds, inclined sets in the cross-bedded unit.
    ctx.lineWidth = band.kind === 'mudstone' ? 0.8 : 1.1;
    if (band.kind === 'cross') {
      for (let set = 0; set < 3; set++) {
        const x0 = set * 340 - 40;
        for (let k = 0; k < 18; k++) {
          ctx.strokeStyle = `rgba(60, 32, 18, ${0.12 + rand() * 0.14})`;
          ctx.beginPath();
          const sx = x0 + k * 18;
          ctx.moveTo(sx, top + DIP * sx);
          ctx.quadraticCurveTo(sx + 60, top + DIP * sx + band.h * 0.55, sx + 150, bottom + DIP * (sx + 150));
          ctx.stroke();
        }
      }
    } else {
      const lines = band.kind === 'mudstone' ? Math.round(band.h / 5) : Math.round(band.h / 12);
      for (let k = 1; k < lines; k++) {
        const y = top + (band.h * k) / lines + (rand() - 0.5) * 2;
        ctx.strokeStyle = `rgba(50, 26, 14, ${0.08 + rand() * 0.12})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y + DIP * W);
        ctx.stroke();
      }
    }
    // Grains.
    const grains = band.kind === 'mudstone' ? 260 : 700;
    for (let g = 0; g < grains; g++) {
      const gx = rand() * W;
      const gy = top + DIP * gx + rand() * band.h;
      const light = rand() > 0.5;
      ctx.fillStyle = light ? `rgba(255, 228, 196, ${0.08 + rand() * 0.2})` : `rgba(40, 18, 8, ${0.08 + rand() * 0.18})`;
      const size = band.kind === 'mudstone' ? 0.8 + rand() : 1 + rand() * 2.2;
      ctx.fillRect(gx, gy, size, size);
    }
    ctx.restore();
    // Bed boundary.
    ctx.strokeStyle = 'rgba(45, 22, 12, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, bottom);
    ctx.lineTo(W, bottom + DIP * W);
    ctx.stroke();
    top = bottom;
  }
  // The vein, cutting across the beds.
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(70, 40, 20, 0.35)';
  ctx.lineWidth = 15;
  ctx.beginPath();
  VEIN.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.strokeStyle = '#efe6d8';
  ctx.lineWidth = 9;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 3;
  ctx.stroke();
  // Light from the upper left.
  const shade = ctx.createLinearGradient(0, 0, W, H);
  shade.addColorStop(0, 'rgba(255, 220, 180, 0.12)');
  shade.addColorStop(1, 'rgba(30, 10, 4, 0.32)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);
}

function drawDust(ctx: CanvasRenderingContext2D) {
  const rand = random(1976);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#c98a5a';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const r = 30 + rand() * 90;
    const patch = ctx.createRadialGradient(x, y, 0, x, y, r);
    patch.addColorStop(0, rand() > 0.5 ? 'rgba(222, 164, 112, 0.35)' : 'rgba(150, 90, 52, 0.28)');
    patch.addColorStop(1, 'rgba(201, 138, 90, 0)');
    ctx.fillStyle = patch;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = rand() > 0.5 ? `rgba(255, 220, 180, ${rand() * 0.25})` : `rgba(90, 44, 20, ${rand() * 0.2})`;
    ctx.fillRect(rand() * W, rand() * H, 1.4, 1.4);
  }
}

type Shot = { id: number; x: number; y: number; target: Target; cross: boolean };
type Line = { x1: number; y1: number; x2: number; y2: number };

export default function MarsFieldKit() {
  const rock = useRef<HTMLCanvasElement>(null);
  const dust = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const cleared = useRef<Uint8Array>(new Uint8Array(GRID_X * GRID_Y));
  const [tool, setTool] = useState<Tool>('brush');
  const [exposed, setExposed] = useState(0);
  const [shots, setShots] = useState<Shot[]>([]);
  const [line, setLine] = useState<Line | null>(null);
  const [touched, setTouched] = useState(false);
  const toolRef = useRef<Tool>(tool);

  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  useEffect(() => {
    const rockCtx = rock.current?.getContext('2d');
    const dustCtx = dust.current?.getContext('2d');
    if (!rockCtx || !dustCtx || !rock.current || !dust.current) return;
    for (const canvas of [rock.current, dust.current]) {
      canvas.width = W * RES;
      canvas.height = H * RES;
    }
    rockCtx.setTransform(RES, 0, 0, RES, 0, 0);
    dustCtx.setTransform(RES, 0, 0, RES, 0, 0);
    drawRock(rockCtx);
    drawDust(dustCtx);
  }, []);

  const toLogical = (event: { clientX: number; clientY: number }) => {
    const box = stage.current!.getBoundingClientRect();
    return { x: ((event.clientX - box.left) / box.width) * W, y: ((event.clientY - box.top) / box.height) * H };
  };

  const isDusty = (x: number, y: number) => {
    const gx = Math.min(GRID_X - 1, Math.max(0, Math.floor((x / W) * GRID_X)));
    const gy = Math.min(GRID_Y - 1, Math.max(0, Math.floor((y / H) * GRID_Y)));
    return !cleared.current[gy * GRID_X + gx];
  };

  const brushAt = (x: number, y: number) => {
    const ctx = dust.current?.getContext('2d');
    if (!ctx) return;
    const radius = 38;
    ctx.globalCompositeOperation = 'destination-out';
    const soft = ctx.createRadialGradient(x, y, 0, x, y, radius);
    soft.addColorStop(0, 'rgba(0,0,0,0.9)');
    soft.addColorStop(0.6, 'rgba(0,0,0,0.55)');
    soft.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = soft;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.globalCompositeOperation = 'source-over';
    const cell = W / GRID_X;
    for (let gy = Math.floor((y - radius * 0.6) / cell); gy <= Math.floor((y + radius * 0.6) / cell); gy++) {
      for (let gx = Math.floor((x - radius * 0.6) / cell); gx <= Math.floor((x + radius * 0.6) / cell); gx++) {
        if (gx >= 0 && gy >= 0 && gx < GRID_X && gy < GRID_Y) cleared.current[gy * GRID_X + gx] = 1;
      }
    }
  };

  const updateExposure = () => {
    let count = 0;
    for (const value of cleared.current) count += value;
    setExposed(Math.round((count / cleared.current.length) * 100));
  };

  const clearAll = () => {
    const ctx = dust.current?.getContext('2d');
    if (!ctx) return;
    dust.current!.dataset.fading = 'true';
    window.setTimeout(() => {
      ctx.clearRect(0, 0, W, H);
      cleared.current.fill(1);
      if (dust.current) delete dust.current.dataset.fading;
      setExposed(100);
    }, 650);
    setTouched(true);
  };

  // Pointer handling for all three tools.
  const drag = useRef<{ active: boolean; last: { x: number; y: number } | null; start: { x: number; y: number } | null; moved: number }>({ active: false, last: null, start: null, moved: 0 });

  const onDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const point = toLogical(event);
    drag.current = { active: true, last: point, start: point, moved: 0 };
    setTouched(true);
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer already gone */ }
    if (toolRef.current === 'brush') brushAt(point.x, point.y);
    if (toolRef.current === 'protractor') setLine({ x1: point.x, y1: point.y, x2: point.x, y2: point.y });
  };
  const onMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state.active || !state.last) return;
    const point = toLogical(event);
    state.moved += Math.hypot(point.x - state.last.x, point.y - state.last.y);
    if (toolRef.current === 'brush') {
      const steps = Math.max(1, Math.ceil(Math.hypot(point.x - state.last.x, point.y - state.last.y) / 10));
      for (let i = 1; i <= steps; i++) brushAt(state.last.x + ((point.x - state.last.x) * i) / steps, state.last.y + ((point.y - state.last.y) * i) / steps);
    }
    if (toolRef.current === 'protractor' && state.start) setLine({ x1: state.start.x, y1: state.start.y, x2: point.x, y2: point.y });
    state.last = point;
  };
  const onUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state.active) return;
    state.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (toolRef.current === 'brush') updateExposure();
    if (toolRef.current === 'laser' && state.moved < 8 && state.start) fire(state.start.x, state.start.y);
  };

  const fire = (x: number, y: number) => {
    const target: Target = isDusty(x, y) ? 'dust' : nearVein(x, y) ? 'vein' : bandAt(x, y).kind === 'mudstone' ? 'mudstone' : 'sandstone';
    const cross = target === 'sandstone' && bandAt(x, y).kind === 'cross';
    setShots((list) => [...list.slice(-9), { id: Date.now(), x, y, target, cross }]);
  };

  const shot = shots[shots.length - 1];
  const reading = shot ? TARGETS[shot.target] : null;
  const angle = line ? Math.abs((Math.atan2(-(line.y2 - line.y1), line.x2 - line.x1) * 180) / Math.PI) : 0;
  const dip = line ? Math.round(angle > 90 ? 180 - angle : angle) : 0;
  const lineLength = line ? Math.hypot(line.x2 - line.x1, line.y2 - line.y1) : 0;
  const midBand = line ? bandAt((line.x1 + line.x2) / 2, (line.y1 + line.y2) / 2) : null;
  const protractorNote = !line || lineLength < 30
    ? 'Drag along a layer to measure how steeply it is tilted.'
    : midBand?.kind === 'cross' && dip >= 14 && dip <= 55
      ? `An inclined set at about ${dip}°. Layers like this build on the front of a delta, and also on the face of a dune. Grain size and the neighbouring beds decide which.`
      : dip <= 12
        ? `About ${dip}°: close to the gentle tilt of the main bedding, which formed nearly flat.`
        : `About ${dip}°: steeper than the bedding. Check the line follows a layer, not the vein.`;

  return (
    <div className={s.kit}>
      <div className={s.kitTools} role="group" aria-label="Field tools">
        {([
          ['brush', 'Brush', 'Sweep away the dust'],
          ['laser', 'Laser', 'Read what a spot is made of'],
          ['protractor', 'Protractor', 'Measure a layer’s tilt'],
        ] as [Tool, string, string][]).map(([key, label, hint]) => (
          <button key={key} type="button" aria-pressed={tool === key} onClick={() => setTool(key)}>
            <b>{label}</b><small>{hint}</small>
          </button>
        ))}
      </div>

      <div ref={stage} className={s.outcrop} data-tool={tool} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        role="img" aria-label={`Illustrated rock outcrop with tilted layers, a cross-bedded unit, and a pale vein. ${exposed}% of the dust brushed away.`}>
        <canvas ref={rock} className={s.rockCanvas} />
        <canvas ref={dust} className={s.dustCanvas} />
        <svg className={s.marks} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          {shots.map((item) => (
            <g key={item.id}>
              <circle cx={item.x} cy={item.y} r="4" fill="#1d0f08" fillOpacity=".75" />
              {item.id === shot?.id && (
                <>
                  <line className={s.beam} x1={W - 10} y1={-10} x2={item.x} y2={item.y} />
                  <circle className={s.spark} cx={item.x} cy={item.y} r="26" style={{ transformOrigin: `${item.x}px ${item.y}px` } as CSSProperties} />
                </>
              )}
            </g>
          ))}
          {tool === 'protractor' && line && lineLength >= 6 && (
            <g className={s.ruler}>
              <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
              <line x1={line.x1} y1={line.y1} x2={line.x1 + Math.sign(line.x2 - line.x1 || 1) * 80} y2={line.y1} strokeDasharray="4 6" />
              <text x={(line.x1 + line.x2) / 2} y={(line.y1 + line.y2) / 2 - 14}>{dip}°</text>
            </g>
          )}
        </svg>
        {!touched && <span className={s.outcropHint} aria-hidden="true">Drag to brush away the dust</span>}
      </div>

      <div className={s.kitRead} aria-live="polite">
        {tool === 'brush' && (
          <>
            <p className={s.kitLabel}>Brush</p>
            <p className={s.kitBig}>{exposed}<small>% exposed</small></p>
            <p>The dust on top describes recent wind, not the rock underneath. Clear it, then read the layers and the vein that cuts across them.</p>
            <button type="button" className={s.kitAction} onClick={clearAll}>Clear the dust</button>
          </>
        )}
        {tool === 'laser' && (
          <>
            <p className={s.kitLabel}>Laser</p>
            {reading ? (
              <>
                <p className={s.kitBig}>{reading.name}</p>
                <ul className={s.elements} aria-label="Elements detected (illustrative)">
                  {reading.elements.map(([element, level]) => (
                    <li key={element}><b>{element}</b><span style={{ '--level': level / 3 } as CSSProperties} /></li>
                  ))}
                </ul>
                <p>{reading.text}{shot?.cross ? ' This one sits in an inclined set: try the protractor.' : ''}</p>
              </>
            ) : (
              <p>Click a spot on the rock. Curiosity’s ChemCam and Perseverance’s SuperCam vaporise a pinpoint with a laser from several metres away and read the light it gives off.</p>
            )}
            <p className={s.note}>Readouts are illustrative: they show the kind of elements reported for each material, not a measurement.</p>
          </>
        )}
        {tool === 'protractor' && (
          <>
            <p className={s.kitLabel}>Protractor</p>
            <p className={s.kitBig}>{line && lineLength >= 30 ? `${dip}°` : '—'}</p>
            <p>{protractorNote}</p>
          </>
        )}
      </div>
    </div>
  );
}
