'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Frame, Scene, V3 } from './uranus/system';
import type { Trace } from './uranus/occult';
import s from './UranusPage.module.css';

type Id = 'hero' | 'seasons' | 'rings' | 'field' | 'equinox' | 'webb' | 'heat' | 'moons' | 'pass';
type Key = Frame & { hold: number };
type Mode = 'loading' | 'live' | 'static';

/** The page runs sideways when there is room; otherwise it is an ordinary vertical page. */
const SIDEWAYS = '(min-width: 861px) and (min-height: 600px)';
const CHORD_X = 2.6; // keep in step with uranus/occult.ts (not imported, so that module stays lazy)
const OBLIQUITY = 97.77;
const EQUINOX = 2007.93;
const PERIOD = 84.01;

/**
 * What the scene shows while each chapter is in view. `hold` is the share of a chapter's width
 * for which its view stays still before easing toward the next one; 0 means it keeps moving
 * (the seasons chapter runs the years forward the whole way across).
 */
const KEYS: Record<Id, Key> = {
  hero: { year: 1781.2, phase: 38, elev: 10, view: 3.1, shiftX: 0.32, shiftY: 0.02, field: 0, rings: 0.55, moons: 0, occult: 0, hold: 0.5 },
  seasons: { year: 1880, phase: 38, elev: 10, view: 3.3, shiftX: 0.32, shiftY: 0.02, field: 0, rings: 0.6, moons: 0, occult: 0, hold: 0 },
  rings: { year: 1977.19, phase: 0, elev: 0, view: 3.5, shiftX: 0.3, shiftY: 0.26, field: 0, rings: 1, moons: 0, occult: 1, hold: 0.5 },
  field: { year: 1986.07, phase: 78, elev: 16, view: 20, shiftX: 0.18, shiftY: 0.12, field: 1, rings: 0.35, moons: 0, occult: 0, hold: 0.5 },
  equinox: { year: 2007.93, phase: 32, elev: 7, view: 3.0, shiftX: 0.3, shiftY: 0.02, field: 0, rings: 0.9, moons: 0, occult: 0, hold: 0.5 },
  webb: { year: 2023.7, phase: 22, elev: 8, view: 4.2, shiftX: 0.6, shiftY: 0.18, field: 0, rings: 0.8, moons: 0, occult: 0, hold: 0.5 },
  heat: { year: 2025.5, phase: 72, elev: 10, view: 2.3, shiftX: 0.36, shiftY: 0.02, field: 0, rings: 0.35, moons: 0, occult: 0, hold: 0.5 },
  moons: { year: 2026.5, phase: 24, elev: 10, view: 26, shiftX: 0.48, shiftY: 0.04, field: 0, rings: 0.5, moons: 1, occult: 0, hold: 0.5 },
  pass: { year: 2070.07, phase: 78, elev: 16, view: 20, shiftX: 0.22, shiftY: 0.12, field: 0.6, rings: 0.35, moons: 0, occult: 0, hold: 0.5 },
};
const NUMERIC: (keyof Frame)[] = ['year', 'phase', 'elev', 'view', 'shiftX', 'shiftY', 'field', 'rings', 'moons', 'occult'];
const SPIN_CHAPTERS: Id[] = ['hero', 'seasons', 'equinox', 'heat', 'pass'];

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function blend(a: Key, b: Key, t: number, stacked: boolean): Frame {
  const out = {} as Frame;
  for (const k of NUMERIC) out[k] = a[k] + (b[k] - a[k]) * t;
  if (stacked) {
    // On a tall narrow screen the planet rides in the upper part of the screen, above the text.
    out.shiftX = 0;
    out.shiftY = 0.42;
    out.view *= 0.75;
  }
  return out;
}

const sunLatitude = (year: number) => {
  const L = (2 * Math.PI * (year - EQUINOX)) / PERIOD;
  return Math.asin(Math.sin((OBLIQUITY * Math.PI) / 180) * Math.sin(L)) * (180 / Math.PI);
};

export default function UranusSideways({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLCanvasElement>(null);
  const insetRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLCanvasElement>(null);
  const yearRef = useRef<HTMLSpanElement>(null);
  const sunRef = useRef<HTMLSpanElement>(null);
  const dayRef = useRef<HTMLSpanElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const frameRef = useRef<Frame>(blend(KEYS.hero, KEYS.hero, 0, false));
  const chapterRef = useRef<Id>('hero');
  const traceRef = useRef<Trace | null>(null);
  const visitedRef = useRef<Uint8Array | null>(null);
  const starRef = useRef(-CHORD_X);
  const runRef = useRef(0);
  const shownYear = useRef(-1);
  const goRef = useRef<(id: Id, smoothScroll: boolean) => void>(() => {});

  const [mode, setMode] = useState<Mode>('loading');
  const [chapter, setChapter] = useState<Id>('hero');
  const [sideways, setSideways] = useState(true);
  const [compressed, setCompressed] = useState(false);
  const [starX, setStarX] = useState(-CHORD_X);
  const [running, setRunning] = useState(false);
  const [slots, setSlots] = useState<Partial<Record<'spin' | 'rings' | 'field', HTMLElement>>>({});
  const [dock, setDock] = useState<HTMLElement | null>(null);

  // Readouts in the corner: year, the Sun's latitude, the polar day, and a map of the orbit. -----
  const drawReadouts = useCallback((frame: Frame) => {
    const year = frame.year;
    if (Math.abs(year - shownYear.current) < 0.02) return;
    shownYear.current = year;
    const lat = sunLatitude(year);
    const hemi = lat >= 0 ? 'N' : 'S';
    if (yearRef.current) yearRef.current.textContent = String(Math.floor(year));
    if (sunRef.current) sunRef.current.textContent = `Sun overhead at ${Math.abs(lat).toFixed(0)}° ${hemi}`;
    if (dayRef.current) {
      dayRef.current.textContent = Math.abs(lat) < 6
        ? 'Equinox: day and night at every latitude'
        : `Unbroken daylight ${lat >= 0 ? 'north' : 'south'} of ${(90 - Math.abs(lat)).toFixed(0)}° ${hemi}`;
    }
    const inset = insetRef.current;
    const ctx = inset?.getContext('2d');
    if (!inset || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = inset.clientWidth || 112;
    if (inset.width !== Math.round(size * dpr)) { inset.width = Math.round(size * dpr); inset.height = Math.round(size * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const c = size / 2;
    const r = size * 0.36;
    ctx.strokeStyle = 'rgba(191, 243, 239, 0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffd38a';
    ctx.beginPath();
    ctx.arc(c, c, 4, 0, Math.PI * 2);
    ctx.fill();
    // Uranus, seen from above its orbit. The Sun is at the centre; the axis always points up the map.
    const L = (2 * Math.PI * (year - EQUINOX)) / PERIOD;
    const px = c + Math.cos(L) * r;
    const py = c - Math.sin(L) * r;
    const toSun = Math.atan2(c - py, c - px);
    ctx.fillStyle = '#123236';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#bff3ef';
    ctx.beginPath();
    ctx.arc(px, py, 6, toSun - Math.PI / 2, toSun + Math.PI / 2);
    ctx.fill();
    ctx.strokeStyle = '#bff3ef';
    ctx.beginPath();
    ctx.moveTo(px, py + 11);
    ctx.lineTo(px, py - 11);
    ctx.stroke();
    ctx.fillStyle = '#bff3ef';
    ctx.font = '600 9px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N', px, py - 14);
  }, []);

  // The overlay: the spin axis, the occultation star and its path, the moon names. --------------
  const drawHud = useCallback(() => {
    const scene = sceneRef.current;
    const hud = hudRef.current;
    const ctx = hud?.getContext('2d');
    if (!scene || !hud || !ctx) return;
    const frame = frameRef.current;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = hud.clientWidth;
    const h = hud.clientHeight;
    if (hud.width !== Math.round(w * dpr) || hud.height !== Math.round(h * dpr)) { hud.width = Math.round(w * dpr); hud.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.font = '500 11px ui-monospace, SFMono-Regular, monospace';

    // The spin axis, poking out of both poles (hidden where it passes behind the planet).
    const axisAlpha = (1 - frame.occult) * (1 - frame.field * 0.6) * Math.max(0, 1 - (frame.view - 3) / 6);
    if (axisAlpha > 0.02) {
      const sky = scene.sky(frame);
      const axis = sky.axis;
      ctx.strokeStyle = `rgba(191, 243, 239, ${0.55 * axisAlpha})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      for (const sign of [1, -1]) {
        ctx.beginPath();
        let open = false;
        for (let i = 0; i <= 12; i++) {
          const d = 1.02 + (i / 12) * 0.75;
          const p: V3 = [axis[0] * d * sign, axis[1] * d * sign, axis[2] * d * sign];
          const along = p[0] * sky.forward[0] + p[1] * sky.forward[1] + p[2] * sky.forward[2];
          const off = Math.sqrt(Math.max(0, d * d - along * along));
          const hidden = along > 0 && off < 1;
          const [x, y] = scene.project(p);
          if (hidden) { open = false; continue; }
          if (!open) { ctx.moveTo(x, y); open = true; } else ctx.lineTo(x, y);
        }
        ctx.stroke();
        const tip: V3 = [axis[0] * 1.9 * sign, axis[1] * 1.9 * sign, axis[2] * 1.9 * sign];
        const [tx, ty] = scene.project(tip);
        ctx.fillStyle = `rgba(191, 243, 239, ${0.8 * axisAlpha})`;
        ctx.textAlign = 'center';
        ctx.fillText(sign > 0 ? 'N' : 'S', tx, ty + 4);
      }
      ctx.setLineDash([]);
    }

    // The occultation: the star's path and the star itself, dimmed by whatever is in the way.
    const trace = traceRef.current;
    if (frame.occult > 0.02 && trace) {
      const [ax, ay] = scene.project(trace.skyPoint(-CHORD_X));
      const [bx, by] = scene.project(trace.skyPoint(CHORD_X));
      ctx.strokeStyle = `rgba(255, 226, 170, ${0.32 * frame.occult})`;
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.setLineDash([]);
      const x = starRef.current;
      const i = Math.round(((x + CHORD_X) / (2 * CHORD_X)) * (trace.samples - 1));
      const light = trace.clean[Math.max(0, Math.min(trace.samples - 1, i))];
      const [sx, sy] = scene.project(trace.skyPoint(x));
      const a = frame.occult * light;
      if (a > 0.01) {
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 22);
        g.addColorStop(0, `rgba(255, 240, 210, ${a})`);
        g.addColorStop(0.18, `rgba(255, 222, 170, ${0.55 * a})`);
        g.addColorStop(1, 'rgba(255, 222, 170, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(sx, sy, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 250, 240, ${a})`;
        ctx.fillRect(sx - 14 * a, sy - 0.5, 28 * a, 1);
        ctx.fillRect(sx - 0.5, sy - 14 * a, 1, 28 * a);
      }
      ctx.fillStyle = `rgba(255, 226, 170, ${0.85 * frame.occult * (0.35 + 0.65 * light)})`;
      ctx.textAlign = 'left';
      ctx.fillText('SAO 158687', sx + 12, sy - 14);
    }

    // Moon names.
    if (frame.moons > 0.05) {
      const names = ['Miranda', 'Ariel', 'Umbriel', 'Titania', 'Oberon'];
      ctx.fillStyle = `rgba(191, 243, 239, ${0.8 * frame.moons})`;
      ctx.textAlign = 'left';
      scene.moonPositions().forEach((p, k) => {
        const [x, y] = scene.project(p);
        ctx.fillText(names[k], x + 8, y - 8);
      });
    }

    // The planet's clock: how far through its 17 h 14 min day it is.
    if (clockRef.current) {
      const turns = scene.spin() / (2 * Math.PI);
      const hours = ((turns % 1) + 1) % 1 * 17.24;
      const hh = Math.floor(hours);
      const mm = Math.floor((hours - hh) * 60);
      clockRef.current.textContent = `${String(hh).padStart(2, '0')} h ${String(mm).padStart(2, '0')} m`;
    }
  }, []);

  // The photometer record. ---------------------------------------------------------------------
  const drawPhoto = useCallback(() => {
    const canvas = photoRef.current;
    const trace = traceRef.current;
    const visited = visitedRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !trace || !visited) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const top = 22;
    const bottom = h - 8;
    const yOf = (f: number) => bottom - (bottom - top) * Math.max(-0.05, Math.min(1.1, f));
    ctx.strokeStyle = 'rgba(191, 243, 239, 0.16)';
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(0, yOf(1));
    ctx.lineTo(w, yOf(1));
    ctx.moveTo(0, yOf(0));
    ctx.lineTo(w, yOf(0));
    ctx.stroke();
    ctx.setLineDash([]);
    // Each pixel column keeps the deepest sample in it, so a narrow dip never falls between pixels.
    const n = trace.samples;
    ctx.strokeStyle = '#ffe2aa';
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    let open = false;
    for (let x = 0; x < w; x++) {
      const i0 = Math.floor((x / w) * n);
      const i1 = Math.max(i0 + 1, Math.floor(((x + 1) / w) * n));
      let lo = Infinity;
      let seen = false;
      for (let i = i0; i < i1 && i < n; i++) if (visited[i]) { seen = true; lo = Math.min(lo, trace.flux[i]); }
      if (!seen) { open = false; continue; }
      const y = yOf(lo);
      if (!open) { ctx.moveTo(x, y); open = true; } else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // Name each dip once both of its edges are on the record.
    ctx.font = '500 10.5px ui-monospace, monospace';
    ctx.textAlign = 'center';
    // Labels sit on two rows so neighbours in a cluster do not overprint each other.
    // On a narrow chart, labels that would still collide are left off (ε, the widest, always shows).
    const lastX = [-99, -99];
    for (const run of trace.runs) {
      if (!visited[run.from] || !visited[run.to]) continue;
      const x = (((run.from + run.to) / 2) / n) * w;
      if (run.name === 'Uranus') {
        ctx.fillStyle = 'rgba(191, 243, 239, 0.7)';
        ctx.fillText('Uranus', x, yOf(0.45));
        continue;
      }
      let row = x - lastX[0] >= 9 ? 0 : x - lastX[1] >= 9 ? 1 : -1;
      if (row < 0 && run.name !== 'ε') continue;
      if (row < 0) row = 1;
      lastX[row] = x;
      ctx.fillStyle = run.name === 'ε' ? '#ffe2aa' : 'rgba(255, 226, 170, 0.75)';
      ctx.fillText(run.name, x, row ? 21 : 11);
    }
  }, []);

  const moveStar = useCallback((x: number) => {
    const trace = traceRef.current;
    const visited = visitedRef.current;
    const next = Math.max(-CHORD_X, Math.min(CHORD_X, x));
    if (trace && visited) {
      const at = (v: number) => Math.round(((v + CHORD_X) / (2 * CHORD_X)) * (trace.samples - 1));
      const a = at(starRef.current);
      const b = at(next);
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) visited[i] = 1;
    }
    starRef.current = next;
    setStarX(next);
    drawPhoto();
    if (sceneRef.current) sceneRef.current.setFrame(frameRef.current);
  }, [drawPhoto]);

  const runPass = useCallback(() => {
    cancelAnimationFrame(runRef.current);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    starRef.current = -CHORD_X;
    if (reduced) { moveStar(CHORD_X); return; }
    setRunning(true);
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 7000);
      moveStar(-CHORD_X + 2 * CHORD_X * t);
      if (t < 1) runRef.current = requestAnimationFrame(step);
      else setRunning(false);
    };
    runRef.current = requestAnimationFrame(step);
  }, [moveStar]);

  const clearRecord = useCallback(() => {
    cancelAnimationFrame(runRef.current);
    setRunning(false);
    visitedRef.current?.fill(0);
    starRef.current = -CHORD_X;
    setStarX(-CHORD_X);
    drawPhoto();
    sceneRef.current?.setFrame(frameRef.current);
  }, [drawPhoto]);

  // Layout: turn vertical scrolling into sideways travel, and blend the scene between chapters. ---
  useEffect(() => {
    const root = rootRef.current;
    const rail = railRef.current;
    const stage = stageRef.current;
    const strip = stripRef.current;
    if (!root || !rail || !stage || !strip) return;
    const mq = window.matchMedia(SIDEWAYS);
    let side = mq.matches;
    let panels: HTMLElement[] = [];
    let anchors: number[] = [];
    let maxShift = 0;
    let stick = 0;
    let frame = 0;

    const update = () => {
      frame = 0;
      if (!panels.length) return;
      let focus: number;
      if (side) {
        const shift = Math.max(0, Math.min(maxShift, stick - rail.getBoundingClientRect().top));
        strip.style.transform = `translate3d(${-shift}px, 0, 0)`;
        focus = shift + stage.clientWidth * 0.25;
      } else {
        focus = window.scrollY + window.innerHeight * 0.55;
      }
      let i = 0;
      while (i < anchors.length - 1 && focus >= anchors[i + 1]) i++;
      const span = i < anchors.length - 1 ? anchors[i + 1] - anchors[i] : 1;
      const raw = i < anchors.length - 1 ? Math.max(0, (focus - anchors[i]) / span) : 0;
      const a = KEYS[panels[i].dataset.chapter as Id];
      const b = KEYS[(panels[i + 1] ?? panels[i]).dataset.chapter as Id];
      const t = smooth(a.hold, 1, raw);
      const next = blend(a, b, t, !side);
      frameRef.current = next;
      sceneRef.current?.setFrame(next);
      drawReadouts(next);
      const current = (raw < 0.62 ? panels[i] : panels[i + 1] ?? panels[i]).dataset.chapter as Id;
      if (current !== chapterRef.current) { chapterRef.current = current; setChapter(current); }
    };
    const measure = () => {
      side = mq.matches;
      setSideways(side);
      panels = Array.from(strip.querySelectorAll<HTMLElement>('[data-chapter]'));
      if (side) {
        stick = parseFloat(getComputedStyle(stage).top) || 0;
        maxShift = Math.max(0, strip.scrollWidth - stage.clientWidth);
        rail.style.height = `${stage.clientHeight + maxShift}px`;
        anchors = panels.map((p) => p.offsetLeft);
      } else {
        rail.style.height = '';
        strip.style.transform = '';
        anchors = panels.map((p) => p.getBoundingClientRect().top + window.scrollY);
      }
      sceneRef.current?.resize();
      update();
    };
    const go = (id: Id, smoothScroll: boolean) => {
      const panel = panels.find((p) => p.dataset.chapter === id);
      if (!panel) return;
      const behavior: ScrollBehavior = smoothScroll && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto';
      if (side) {
        const railTop = rail.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: railTop - stick + Math.min(maxShift, panel.offsetLeft), behavior });
      } else {
        window.scrollTo({ top: panel.getBoundingClientRect().top + window.scrollY - stick - 8, behavior });
      }
    };
    goRef.current = go;

    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    // Keyboard focus inside an off-screen chapter brings that chapter into view.
    const onFocus = (event: FocusEvent) => {
      if (!side) return;
      const panel = (event.target as HTMLElement).closest<HTMLElement>('[data-chapter]');
      if (!panel) return;
      const shift = Math.max(0, Math.min(maxShift, stick - rail.getBoundingClientRect().top));
      const left = panel.offsetLeft - shift;
      if (left < -4 || left > stage.clientWidth * 0.5) go(panel.dataset.chapter as Id, false);
    };
    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest<HTMLElement>('[data-goto]');
      if (!link) return;
      event.preventDefault();
      go(link.dataset.goto as Id, true);
    };

    measure();
    const inView = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) root.dataset.inview = ''; else delete root.dataset.inview;
    });
    inView.observe(rail);
    const ro = new ResizeObserver(() => measure());
    ro.observe(strip);
    ro.observe(stage);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    mq.addEventListener('change', measure);
    strip.addEventListener('focusin', onFocus);
    root.addEventListener('click', onClick);
    const found: Partial<Record<'spin' | 'rings' | 'field', HTMLElement>> = {};
    root.querySelectorAll<HTMLElement>('[data-slot]').forEach((el) => { found[el.dataset.slot as 'spin'] = el; });
    setSlots(found);
    setDock(root.querySelector<HTMLElement>('[data-dock]'));
    return () => {
      if (frame) cancelAnimationFrame(frame);
      ro.disconnect();
      inView.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      mq.removeEventListener('change', measure);
      strip.removeEventListener('focusin', onFocus);
      root.removeEventListener('click', onClick);
    };
  }, [drawReadouts]);

  // The scene. -------------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    const rail = railRef.current;
    if (!canvas || !rail) return;
    const params = new URLSearchParams(window.location.search);
    const lite = window.matchMedia('(max-width: 860px), (pointer: coarse)').matches || params.has('lite');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let disposed = false;
    let io: IntersectionObserver | null = null;
    let visible = true;
    const onVisibility = () => sceneRef.current?.setActive(visible && !document.hidden);

    (async () => {
      try {
        const [{ createScene }, { buildTrace }] = await Promise.all([import('./uranus/system'), import('./uranus/occult')]);
        if (disposed) return;
        const scene = await createScene(canvas, '/textures/2k_uranus.jpg', { lite, reduced });
        if (disposed) { scene.dispose(); return; }
        sceneRef.current = scene;
        const trace = buildTrace(scene.sky(KEYS.rings));
        traceRef.current = trace;
        visitedRef.current = new Uint8Array(trace.samples);
        scene.onFrame(drawHud);
        scene.setFrame(frameRef.current);
        setMode('live');
        io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; onVisibility(); }, { rootMargin: '80px' });
        io.observe(rail);
        document.addEventListener('visibilitychange', onVisibility);
        scene.setActive(!document.hidden);
        if (process.env.NODE_ENV !== 'production') {
          (window as unknown as { __uranus: unknown }).__uranus = {
            frame: () => frameRef.current,
            chapter: () => chapterRef.current,
            scene,
            trace,
          };
        }
      } catch (error) {
        console.warn('Uranus scene unavailable', error);
        if (!disposed) setMode('static');
      }
    })();

    return () => {
      disposed = true;
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [drawHud]);

  useEffect(() => { sceneRef.current?.setCompression(compressed); }, [compressed, mode]);
  useEffect(() => { drawPhoto(); }, [drawPhoto, chapter, mode, sideways, dock]);
  useEffect(() => () => cancelAnimationFrame(runRef.current), []);

  // Dragging: in the ring chapter it moves the star; elsewhere it turns the planet.
  const drag = useRef<{ x: number; star: boolean } | null>(null);
  const starFromPointer = (clientX: number) => {
    const scene = sceneRef.current;
    const trace = traceRef.current;
    const canvas = canvasRef.current;
    if (!scene || !trace || !canvas) return starRef.current;
    const left = canvas.getBoundingClientRect().left;
    const [ax] = scene.project(trace.skyPoint(-CHORD_X));
    const [bx] = scene.project(trace.skyPoint(CHORD_X));
    return -CHORD_X + (2 * CHORD_X * (clientX - left - ax)) / (bx - ax || 1);
  };
  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (mode !== 'live') return;
    const star = chapterRef.current === 'rings';
    if (!star && !SPIN_CHAPTERS.includes(chapterRef.current) && chapterRef.current !== 'field') return;
    drag.current = { x: event.clientX, star };
    event.currentTarget.setPointerCapture(event.pointerId);
    if (star) { cancelAnimationFrame(runRef.current); setRunning(false); moveStar(starFromPointer(event.clientX)); }
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d) return;
    if (d.star) moveStar(starFromPointer(event.clientX));
    else sceneRef.current?.spinBy((event.clientX - d.x) * 0.006);
    d.x = event.clientX;
  };
  const onPointerUp = () => { drag.current = null; };

  // Instruments go in a dock beside the planet when the page runs sideways, and inside their
  // chapter when it is a vertical page.
  const target = (slot: 'spin' | 'rings' | 'field') => (sideways ? dock : slots[slot]) ?? null;
  const showOnDock = (slot: 'spin' | 'rings' | 'field') => !sideways || (slot === 'spin' ? SPIN_CHAPTERS.includes(chapter) : chapter === slot);

  const spinPanel = (
    <div className={s.instrument} data-kind="spin">
      <p className={s.instrumentLabel}>Rotation <span ref={clockRef} className={s.mono}>00 h 00 m</span> <i>of 17 h 14 m</i></p>
      <p className={s.instrumentNote}>{mode === 'static' ? 'The live planet needs WebGL, which this browser does not offer.' : 'Drag across the planet to turn it. Spots in the clouds are illustrative.'}</p>
    </div>
  );
  const ringPanel = (
    <figure className={s.instrument} data-kind="rings">
      <figcaption className={s.instrumentLabel}>Photometer <i>relative brightness of SAO 158687</i></figcaption>
      {mode === 'static'
        ? <p className={s.instrumentNote}>The re-run needs WebGL, which this browser does not offer. The 1977 record showed five dips on each side of the planet.</p>
        : (
          <>
            <canvas ref={photoRef} className={s.photo} aria-label="Brightness record of the star as it passes behind the rings and the planet" role="img" />
            <label className={s.starSlider}>
              <span className={s.visuallyHidden}>Star position along its path</span>
              <input type="range" min={-CHORD_X} max={CHORD_X} step={0.002} value={starX} onChange={(event) => { cancelAnimationFrame(runRef.current); setRunning(false); moveStar(Number(event.target.value)); }} />
            </label>
            <div className={s.buttons}>
              <button type="button" onClick={runPass} disabled={running}>{running ? 'Recording…' : 'Run the 1977 pass'}</button>
              <button type="button" onClick={clearRecord}>Clear the record</button>
            </div>
            <p className={s.instrumentNote}>Drag the star or the slider. Real ring radii; widths drawn about ten times wider and optical depths simplified.</p>
          </>
        )}
    </figure>
  );
  const fieldPanel = (
    <div className={s.instrument} data-kind="field">
      <p className={s.instrumentLabel}>Solar wind</p>
      <div className={s.buttons} role="group" aria-label="Solar wind conditions">
        <button type="button" aria-pressed={!compressed} onClick={() => setCompressed(false)}>Typical</button>
        <button type="button" aria-pressed={compressed} onClick={() => setCompressed(true)}>As Voyager met it, 1986</button>
      </div>
      <p className={s.instrumentNote}><b className={s.keyClosed}>Teal</b> lines loop back to the planet and turn with it. <b className={s.keyNorth}>Blue</b> and <b className={s.keySouth}>violet</b> lines leave the two magnetic poles and trail down the tail. Distances are squeezed: an illustration, not a plasma model.</p>
    </div>
  );

  return (
    <div ref={rootRef} className={s.sideways} data-mode={mode} data-chapter={chapter} data-layout={sideways ? 'sideways' : 'stacked'}>
      <div ref={railRef} className={s.rail}>
        <div ref={stageRef} className={s.stage}>
          <canvas
            ref={canvasRef}
            className={s.scene}
            aria-hidden="true"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
          <canvas ref={hudRef} className={s.hud} aria-hidden="true" />
          <div className={s.staticPlanet} aria-hidden="true" />
          <aside className={s.readout} aria-label="Where Uranus is on its orbit">
            <canvas ref={insetRef} className={s.inset} aria-hidden="true" />
            <p><span ref={yearRef} className={s.year}>1781</span></p>
            <p><span ref={sunRef}>Sun overhead</span></p>
            <p><span ref={dayRef} className={s.soft}>&nbsp;</span></p>
          </aside>
          <div className={s.dock} data-dock />
          <div ref={stripRef} className={s.strip}>{children}</div>
        </div>
      </div>
      {target('spin') && showOnDock('spin') && createPortal(spinPanel, target('spin')!)}
      {target('rings') && showOnDock('rings') && createPortal(ringPanel, target('rings')!)}
      {target('field') && showOnDock('field') && createPortal(fieldPanel, target('field')!)}
    </div>
  );
}
