import { R_KM, type Sky, type V3 } from './system';

/**
 * The 1977 discovery, re-run: a star passes behind Uranus and a photometer records its light.
 * For every point along the star's path we follow the line of sight from Earth, find where it
 * crosses the ring plane, and dim the star by each ring it passes through (more when the line
 * crosses the plane at a slant). The planet's limb fades the star gradually, as its atmosphere
 * does. Ring radii are the real ones; widths and optical depths are simplified, and widths are
 * drawn about ten times wider so that a narrow ring still shows as a dip.
 */

export const RINGS = [
  { name: '6', km: 41837, width: 1.5, tau: 0.3 },
  { name: '5', km: 42234, width: 2.5, tau: 0.5 },
  { name: '4', km: 42571, width: 2.5, tau: 0.3 },
  { name: 'α', km: 44718, width: 7, tau: 0.4 },
  { name: 'β', km: 45661, width: 8, tau: 0.3 },
  { name: 'η', km: 47176, width: 1.6, tau: 0.3 },
  { name: 'γ', km: 47627, width: 3, tau: 1.5 },
  { name: 'δ', km: 48300, width: 6, tau: 0.5 },
  { name: 'λ', km: 50023, width: 2, tau: 0.12 },
  { name: 'ε', km: 51149, width: 58, tau: 1.2 },
];

export const CHORD_X = 2.6; // the star's path runs from -CHORD_X to +CHORD_X in sky radii
export const CHORD_Y = 0.38; // how far the path passes from the planet's centre
const SAMPLES = 7000;

export type Run = { name: string; from: number; to: number };
export type Trace = { flux: Float32Array; clean: Float32Array; runs: Run[]; samples: number; skyPoint: (x: number) => V3 };

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export function buildTrace(sky: Sky): Trace {
  const { forward, right, up, axis } = sky;
  const skyPoint = (x: number): V3 => add(scale(right, x), scale(up, CHORD_Y));
  const mu = dot(forward, axis);
  const slant = 1 / Math.max(0.08, Math.abs(mu));
  const half = RINGS.map((r) => Math.max(r.width * 10, 130) / 2);
  const flux = new Float32Array(SAMPLES);
  const clean = new Float32Array(SAMPLES);
  const inRing = new Int8Array(SAMPLES).fill(-1);
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < SAMPLES; i++) {
    const x = -CHORD_X + (2 * CHORD_X * i) / (SAMPLES - 1);
    const q = skyPoint(x);
    const rho = Math.hypot(x, CHORD_Y);
    let t = smooth(0.985, 1.035, rho);
    if (rho < 1) inRing[i] = 99;
    const lambda = -dot(q, axis) / mu;
    const p = add(q, scale(forward, lambda));
    const rKm = Math.hypot(p[0], p[1], p[2]) * R_KM;
    if (rho >= 1) for (let k = 0; k < RINGS.length; k++) {
      if (Math.abs(rKm - RINGS[k].km) < half[k]) { t *= Math.exp(-RINGS[k].tau * slant); inRing[i] = k; }
    }
    clean[i] = t;
    // Photon noise, deterministic so the record looks the same each run.
    const n = (rand() + rand() + rand() - 1.5) * 0.028;
    flux[i] = t + n;
  }
  const runs: Run[] = [];
  for (let i = 0; i < SAMPLES; ) {
    const k = inRing[i];
    if (k < 0) { i++; continue; }
    let j = i;
    while (j + 1 < SAMPLES && inRing[j + 1] === k) j++;
    runs.push({ name: k === 99 ? 'Uranus' : RINGS[k].name, from: i, to: j });
    i = j + 1;
  }
  return { flux, clean, runs, samples: SAMPLES, skyPoint };
}

export const indexOf = (x: number) => Math.round(((x + CHORD_X) / (2 * CHORD_X)) * (SAMPLES - 1));

function smooth(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
