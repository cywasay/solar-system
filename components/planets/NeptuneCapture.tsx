'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { START, TRITON_ORBIT, advance, launch, previewPath, type Outcome, type Run } from './neptune/capture';
import s from './NeptunePage.module.css';

const VIEW = 34; // world units from the centre to the nearest edge
const R0 = Math.hypot(START.x, START.y);
const toNeptune = { x: -START.x / R0, y: -START.y / R0 };

type Tally = { tries: number; backwards: number; forwards: number };
/** The first aim swings round anticlockwise, so a first capture usually goes forwards: the wrong way for Triton. */
const DEFAULT_AIM = { angle: -14, speed: 0.32 };

/** Velocity from an aim angle (degrees off the line to Neptune; positive swings round it clockwise) and speed. */
const velocity = (angle: number, speed: number) => {
  const a = (angle * Math.PI) / 180;
  const px = -toNeptune.y; // the line to Neptune turned 90° anticlockwise: the pair then circles clockwise
  const py = toNeptune.x;
  return { vx: speed * (Math.cos(a) * toNeptune.x + Math.sin(a) * px), vy: speed * (Math.cos(a) * toNeptune.y + Math.sin(a) * py) };
};

const describe = (o: Outcome): string => {
  switch (o.kind) {
    case 'running': return 'In flight…';
    case 'hit': return 'Straight into Neptune. Aim wider.';
    case 'merged': return 'The two partners collided with each other.';
    case 'flyby': return 'The pair swung past together and left. Try a closer pass.';
    case 'split': return 'Neptune pulled them apart, but both escaped. Try arriving a little slower.';
    case 'both': return 'Both were captured on separate orbits.';
    case 'pair-captured': return 'The pair was captured together, still orbiting each other.';
    case 'captured': return o.retrograde
      ? 'Captured, orbiting backwards against Neptune’s spin, like Triton. Its partner was flung away.'
      : 'Captured, orbiting forwards. Triton goes the other way: try passing Neptune on the other side.';
  }
};

export default function NeptuneCapture() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef<Run | null>(null);
  const aimRef = useRef(DEFAULT_AIM);
  const visibleRef = useRef(false);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const [aim, setAim] = useState(DEFAULT_AIM);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [tally, setTally] = useState<Tally>({ tries: 0, backwards: 0, forwards: 0 });
  const countedRef = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const k = Math.min(w, h) / 2 / VIEW;
    const X = (x: number) => w / 2 + x * k;
    const Y = (y: number) => h / 2 - y * k;
    ctx.font = '10.5px ui-monospace, monospace';

    // Triton's real orbit (backwards), for comparison.
    ctx.strokeStyle = 'rgba(159, 183, 230, 0.28)';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(X(0), Y(0), TRITON_ORBIT * k, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    const ang = 0.9;
    const ax = X(Math.cos(ang) * TRITON_ORBIT);
    const ay = Y(Math.sin(ang) * TRITON_ORBIT);
    ctx.fillStyle = 'rgba(159, 183, 230, 0.6)';
    ctx.beginPath(); // arrowhead pointing clockwise
    ctx.moveTo(ax + 6 * Math.sin(ang), ay + 6 * Math.cos(ang));
    ctx.lineTo(ax - 4 * Math.cos(ang), ay + 4 * Math.sin(ang));
    ctx.lineTo(ax + 4 * Math.cos(ang), ay - 4 * Math.sin(ang));
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.fillText('Triton today · backwards', ax + 10, ay - 4);

    // Neptune and the way it spins.
    const g = ctx.createRadialGradient(X(-0.3), Y(0.3), 0, X(0), Y(0), k * 1.1);
    g.addColorStop(0, '#7fa6ff');
    g.addColorStop(1, '#1d3c8f');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(X(0), Y(0), Math.max(5, k), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(214, 236, 255, 0.55)';
    ctx.beginPath();
    ctx.arc(X(0), Y(0), Math.max(5, k) + 9, -0.4, 1.6);
    ctx.stroke();
    const ex = X(0) + (Math.max(5, k) + 9) * Math.cos(1.6);
    const ey = Y(0) + (Math.max(5, k) + 9) * Math.sin(1.6);
    ctx.fillStyle = 'rgba(214, 236, 255, 0.7)';
    ctx.beginPath();
    ctx.moveTo(ex - 5, ey - 1);
    ctx.lineTo(ex + 3, ey - 4);
    ctx.lineTo(ex + 1, ey + 4);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillText('Neptune spins this way', X(0), Y(0) + Math.max(5, k) + 26);

    const run = runRef.current;
    if (!run) {
      // Aiming: the pair waiting at the start and the path its centre would follow.
      const { vx, vy } = velocity(aimRef.current.angle, aimRef.current.speed);
      const path = previewPath(vx, vy);
      ctx.strokeStyle = 'rgba(243, 199, 107, 0.6)';
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      for (let i = 0; i < path.length; i += 2) { if (i === 0) ctx.moveTo(X(path[i]), Y(path[i + 1])); else ctx.lineTo(X(path[i]), Y(path[i + 1])); }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#f3c76b';
      for (const off of [-0.5, 0.5]) {
        ctx.beginPath();
        ctx.arc(X(START.x + off), Y(START.y), 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.textAlign = 'left';
      ctx.fillText('a pair of icy bodies', X(START.x) + 10, Y(START.y) - 10);
      // Slingshot band while dragging.
      const d = dragRef.current;
      if (d) {
        ctx.strokeStyle = 'rgba(243, 199, 107, 0.8)';
        ctx.beginPath();
        ctx.moveTo(X(START.x), Y(START.y));
        ctx.lineTo(d.x, d.y);
        ctx.stroke();
      }
      return;
    }

    // In flight: fading trails, then the two bodies.
    const colours = ['243, 199, 107', '214, 236, 255'];
    for (let i = 0; i < 2; i++) {
      const tr = run.trails[i];
      const n = tr.length / 2;
      for (let j = 1; j < n; j++) {
        const a = 0.08 + 0.7 * (j / n);
        ctx.strokeStyle = `rgba(${colours[i]}, ${a})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(X(tr[(j - 1) * 2]), Y(tr[(j - 1) * 2 + 1]));
        ctx.lineTo(X(tr[j * 2]), Y(tr[j * 2 + 1]));
        ctx.stroke();
      }
      const b = run.bodies[i];
      ctx.fillStyle = `rgb(${colours[i]})`;
      ctx.beginPath();
      ctx.arc(X(b.x), Y(b.y), 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  // Animation: advances the simulation while a run is in progress and the bench is on screen.
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const run = runRef.current;
      if (!run || !visibleRef.current) return;
      const done = run.outcome.kind === 'hit' || run.outcome.kind === 'merged';
      const gone = run.bodies.every((b) => Math.hypot(b.x, b.y) > VIEW * 1.6);
      if (done || gone) return;
      const before = run.outcome.kind;
      advance(run, 1.8);
      if (run.outcome.kind !== before) {
        setOutcome(run.outcome);
        if (!countedRef.current && run.outcome.kind !== 'running') {
          countedRef.current = true;
          const o = run.outcome;
          setTally((t) => ({
            tries: t.tries + 1,
            backwards: t.backwards + (o.kind === 'captured' && o.retrograde ? 1 : 0),
            forwards: t.forwards + (o.kind === 'captured' && !o.retrograde ? 1 : 0),
          }));
        }
      }
      draw();
    };
    raf = requestAnimationFrame(loop);
    const io = new IntersectionObserver(([entry]) => { visibleRef.current = entry.isIntersecting; });
    if (canvasRef.current) io.observe(canvasRef.current);
    const ro = new ResizeObserver(() => draw());
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); };
  }, [draw]);

  const setAimBoth = (next: { angle: number; speed: number }) => {
    aimRef.current = next;
    setAim(next);
    runRef.current = null;
    setOutcome(null);
    draw();
  };

  const go = () => {
    const { vx, vy } = velocity(aimRef.current.angle, aimRef.current.speed);
    // Each launch meets the pair at a different point in its own orbit.
    runRef.current = launch(vx, vy, Math.random() * Math.PI * 2, Math.random() < 0.5 ? 1 : -1);
    countedRef.current = false;
    setOutcome({ kind: 'running' });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let guard = 0;
      while (runRef.current.outcome.kind === 'running' && guard++ < 600) advance(runRef.current, 10, 2);
      const o = runRef.current.outcome;
      setOutcome(o);
      countedRef.current = true;
      setTally((t) => ({ tries: t.tries + 1, backwards: t.backwards + (o.kind === 'captured' && o.retrograde ? 1 : 0), forwards: t.forwards + (o.kind === 'captured' && !o.retrograde ? 1 : 0) }));
    }
    draw();
  };

  // Slingshot: drag back from anywhere; the pair leaves in the opposite direction.
  const onDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    originRef.current = { ...dragRef.current };
    runRef.current = null;
    setOutcome(null);
    draw();
  };
  const onMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const origin = originRef.current;
    if (!dragRef.current || !origin) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const k = Math.min(rect.width, rect.height) / 2 / VIEW;
    dragRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const dx = (origin.x - dragRef.current.x) / k;
    const dy = -(origin.y - dragRef.current.y) / k;
    if (Math.hypot(dx, dy) < 1) return;
    const speed = Math.max(0.24, Math.min(0.6, 0.24 + Math.hypot(dx, dy) * 0.012));
    const dirAng = Math.atan2(dy, dx);
    const baseAng = Math.atan2(toNeptune.y, toNeptune.x);
    let angle = ((dirAng - baseAng) * 180) / Math.PI;
    angle = ((angle + 540) % 360) - 180;
    setAimBoth({ angle: Math.max(-35, Math.min(35, angle)), speed });
  };
  const onUp = () => {
    const was = dragRef.current;
    dragRef.current = null;
    originRef.current = null;
    if (was) go();
  };

  const hint = outcome ? describe(outcome) : 'Drag back like a slingshot and let go, or set the aim below and launch.';

  return (
    <div className={s.capture}>
      <figure className={s.captureBox}>
        <canvas ref={canvasRef} className={s.captureCanvas} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} role="img" aria-label="A pair of icy bodies approaching Neptune; one may be captured." />
        <figcaption aria-live="polite">{hint}</figcaption>
      </figure>
      <div className={s.captureSide}>
        <div className={s.controls}>
          <label><span>Aim <b>{aim.angle > 0.4 ? `${aim.angle.toFixed(0)}°, swing clockwise` : aim.angle < -0.4 ? `${(-aim.angle).toFixed(0)}°, swing anticlockwise` : 'straight at it'}</b></span>
            <input type="range" min={-35} max={35} step={0.5} value={aim.angle} onChange={(e) => setAimBoth({ ...aim, angle: Number(e.target.value) })} /></label>
          <label><span>Speed <b>{(aim.speed * 16.6).toFixed(1)} km/s</b></span>
            <input type="range" min={0.24} max={0.6} step={0.01} value={aim.speed} onChange={(e) => setAimBoth({ ...aim, speed: Number(e.target.value) })} /></label>
        </div>
        <div className={s.buttons}>
          <button type="button" className={s.primary} onClick={go}>Launch</button>
        </div>
        <dl className={s.tallyGrid}>
          <div><dt>Launches</dt><dd>{tally.tries}</dd></div>
          <div><dt>Captured backwards</dt><dd>{tally.backwards}</dd></div>
          <div><dt>Captured forwards</dt><dd>{tally.forwards}</dd></div>
        </dl>
        <p className={s.benchNote}>Neptune is held still; the two partners pull on each other and are pulled by Neptune. To make the effect visible at this scale they are far heavier, relative to Neptune, than Triton is, and closer together than a real pair would be. Outcomes depend on where each partner is in its own orbit when the pair arrives, so the same aim can end differently.</p>
      </div>
    </div>
  );
}
