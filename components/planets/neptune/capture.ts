/**
 * Binary-exchange capture, the leading idea for how Neptune got Triton. A pair of icy bodies
 * orbiting each other passes close to Neptune; tides pull the pair apart, one partner leaves
 * faster than it came and the other is left behind on a bound orbit.
 *
 * Units: Neptune's radius = 1 and G·M(Neptune) = 1 (one time unit is about 17 minutes).
 * Neptune is held fixed. The pair is far heavier relative to Neptune than Triton really is, so
 * the effect shows at the scale of the screen.
 */

export const M_A = 0.004; // the body that may become "Triton"
export const M_B = 0.004; // its partner
export const SEPARATION = 0.55;
export const START = { x: -30, y: 20 };
export const TRITON_ORBIT = 14.4; // Triton's real orbital radius, in Neptune radii

export type Body = { x: number; y: number; vx: number; vy: number; m: number };
export type Outcome =
  | { kind: 'running' }
  | { kind: 'hit' }
  | { kind: 'merged' }
  | { kind: 'flyby' }
  | { kind: 'split' }
  | { kind: 'captured'; which: 0 | 1; retrograde: boolean }
  | { kind: 'both' }
  | { kind: 'pair-captured' };

export type Run = { bodies: [Body, Body]; t: number; closest: number; outcome: Outcome; trails: [number[], number[]] };

/** Start a pair at START moving with (vx, vy); `phase` and `spin` set its internal orbit. */
export function launch(vx: number, vy: number, phase: number, spin: 1 | -1): Run {
  const M = M_A + M_B;
  const v = Math.sqrt(M / SEPARATION);
  const cx = Math.cos(phase);
  const cy = Math.sin(phase);
  const ra = M_B / M;
  const rb = M_A / M;
  const a: Body = { x: START.x + cx * SEPARATION * ra, y: START.y + cy * SEPARATION * ra, vx: vx - spin * cy * v * ra, vy: vy + spin * cx * v * ra, m: M_A };
  const b: Body = { x: START.x - cx * SEPARATION * rb, y: START.y - cy * SEPARATION * rb, vx: vx + spin * cy * v * rb, vy: vy - spin * cx * v * rb, m: M_B };
  return { bodies: [a, b], t: 0, closest: Infinity, outcome: { kind: 'running' }, trails: [[], []] };
}

function accel(bs: [Body, Body]) {
  const out: [number, number][] = [];
  for (let i = 0; i < 2; i++) {
    const p = bs[i];
    const q = bs[1 - i];
    const r2 = p.x * p.x + p.y * p.y;
    const r3 = r2 * Math.sqrt(r2);
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const d2 = dx * dx + dy * dy + 1e-4;
    const d3 = d2 * Math.sqrt(d2);
    out.push([-p.x / r3 + (q.m * dx) / d3, -p.y / r3 + (q.m * dy) / d3]);
  }
  return out;
}

/** One RK4 step of size h. */
function rk4(bs: [Body, Body], h: number): [Body, Body] {
  const state = (b: [Body, Body]) => b.flatMap((x) => [x.x, x.y, x.vx, x.vy]);
  const fromState = (s: number[]): [Body, Body] => [
    { x: s[0], y: s[1], vx: s[2], vy: s[3], m: bs[0].m },
    { x: s[4], y: s[5], vx: s[6], vy: s[7], m: bs[1].m },
  ];
  const deriv = (s: number[]) => {
    const a = accel(fromState(s));
    return [s[2], s[3], a[0][0], a[0][1], s[6], s[7], a[1][0], a[1][1]];
  };
  const s0 = state(bs);
  const k1 = deriv(s0);
  const k2 = deriv(s0.map((v, i) => v + 0.5 * h * k1[i]));
  const k3 = deriv(s0.map((v, i) => v + 0.5 * h * k2[i]));
  const k4 = deriv(s0.map((v, i) => v + h * k3[i]));
  return fromState(s0.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])));
}

const energy = (b: Body) => 0.5 * (b.vx * b.vx + b.vy * b.vy) - 1 / Math.hypot(b.x, b.y);
const pairBound = (a: Body, b: Body) => {
  const dvx = a.vx - b.vx;
  const dvy = a.vy - b.vy;
  return 0.5 * (dvx * dvx + dvy * dvy) - (a.m + b.m) / Math.hypot(a.x - b.x, a.y - b.y) < 0;
};

/** Advance a run by `span` time units with adaptive steps; classifies the outcome as it goes. */
export function advance(run: Run, span: number, trailEvery = 0.6) {
  let left = span;
  let sinceTrail = 0;
  while (left > 0) {
    const [a, b] = run.bodies;
    const ra = Math.hypot(a.x, a.y);
    const rb = Math.hypot(b.x, b.y);
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    run.closest = Math.min(run.closest, ra, rb);
    if (run.outcome.kind === 'running') {
      if (ra < 1 || rb < 1) { run.outcome = { kind: 'hit' }; return run; }
      if (d < 0.03) { run.outcome = { kind: 'merged' }; return run; }
    }
    const h = Math.min(left, Math.max(2e-4, 0.025 * Math.min(ra ** 1.5, rb ** 1.5, d ** 1.5 / Math.sqrt(a.m + b.m))), 0.6);
    run.bodies = rk4(run.bodies, h);
    run.t += h;
    left -= h;
    sinceTrail += h;
    if (sinceTrail >= trailEvery) {
      sinceTrail = 0;
      for (let i = 0; i < 2; i++) {
        const tr = run.trails[i];
        tr.push(run.bodies[i].x, run.bodies[i].y);
        if (tr.length > 1600) tr.splice(0, tr.length - 1600);
      }
    }
  }
  if (run.outcome.kind === 'running') run.outcome = classify(run);
  return run;
}

/** Decide what happened once the encounter is over (or report that it is still going). */
function classify(run: Run): Outcome {
  const [a, b] = run.bodies;
  const ra = Math.hypot(a.x, a.y);
  const rb = Math.hypot(b.x, b.y);
  const together = pairBound(a, b);
  const passed = run.closest < 25 && (a.x * a.vx + a.y * a.vy > 0 || b.x * b.vx + b.y * b.vy > 0);
  if (!passed && run.t < 900) return { kind: 'running' };
  if (together) {
    const cm: Body = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, vx: (a.vx + b.vx) / 2, vy: (a.vy + b.vy) / 2, m: a.m + b.m };
    if (energy(cm) < 0 && run.t > 400) return { kind: 'pair-captured' };
    if (energy(cm) > 0 && Math.hypot(cm.x, cm.y) > 34) return { kind: 'flyby' };
    return run.t > 1600 ? { kind: 'flyby' } : { kind: 'running' };
  }
  const ea = energy(a);
  const eb = energy(b);
  const far = (r: number, e: number) => e > 0 && r > 34;
  if (ea < 0 && eb < 0) return run.t > 700 ? { kind: 'both' } : { kind: 'running' };
  if (ea < 0 && far(rb, eb)) return { kind: 'captured', which: 0, retrograde: a.x * a.vy - a.y * a.vx < 0 };
  if (eb < 0 && far(ra, ea)) return { kind: 'captured', which: 1, retrograde: b.x * b.vy - b.y * b.vx < 0 };
  if (far(ra, ea) && far(rb, eb)) return { kind: 'split' };
  return run.t > 2400 ? { kind: 'split' } : { kind: 'running' };
}

/** The path the pair's centre would take with no break-up: a preview for aiming. */
export function previewPath(vx: number, vy: number, span = 520): number[] {
  let x = START.x, y = START.y, ux = vx, uy = vy;
  const pts = [x, y];
  let t = 0;
  while (t < span) {
    const r = Math.hypot(x, y);
    if (r < 1 || r > 60) break;
    const h = Math.min(1, 0.02 * r ** 1.5);
    const r3 = r ** 3;
    ux += (-x / r3) * h;
    uy += (-y / r3) * h;
    x += ux * h;
    y += uy * h;
    t += h;
    pts.push(x, y);
  }
  return pts;
}
