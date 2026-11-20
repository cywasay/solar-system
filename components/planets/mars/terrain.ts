/**
 * The Mars world's ground, as a pure function: the mesh, the rover's wheels, the laser,
 * and the minimap all ask `heightAt(x, z)`, so they can never disagree.
 *
 * This is an imagined landscape assembled from real Martian features (a canyon, Jezero's
 * crater, inlet and delta, a layered outcrop crossed by a vein, an ice scarp), not a map.
 */

export const WORLD = 600;
export const HALF = WORLD / 2;

export type SiteId = 'canyon' | 'outcrop' | 'jezero' | 'ice' | 'sky';
export type LaserTarget = 'dust' | 'mudstone' | 'sandstone' | 'vein';

export const CRATER = { x: -160, z: -120, r: 55 };
export const OUTCROP = { x: 60, z: -60, hw: 16, hd: 11, height: 13 };
export const VEIN = { x: 60, z: -60, dx: 0.55, dz: 0.835 };
export const SCARP = { x: 178, z: -150, halfWidth: 55 };
export const RIDGE = { x: 225, z: 60 };
export const START = { x: 0, z: -12, yaw: 2.2 };

export const SITES: { id: SiteId; name: string; x: number; z: number; radius: number }[] = [
  { id: 'outcrop', name: 'Layered outcrop', x: 60, z: -36, radius: 13 },
  { id: 'jezero', name: 'Jezero rim', x: -160, z: -57, radius: 14 },
  { id: 'canyon', name: 'Canyon overlook', x: 10, z: 80, radius: 15 },
  { id: 'ice', name: 'Ice scarp', x: 178, z: -128, radius: 14 },
  { id: 'sky', name: 'Ridge, for the sky', x: 225, z: 60, radius: 14 },
];

function hash(x: number, y: number) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

function valueNoise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x: number, y: number, octaves: number) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x * freq, y * freq) * amp;
    freq *= 2.03;
    amp *= 0.5;
  }
  return sum;
}

export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/** Centre line of the east–west canyon. */
export const canyonZ = (x: number) => 128 + 16 * Math.sin(x / 70) + 7 * Math.sin(x / 23);

export function heightAt(x: number, z: number) {
  // Rolling plains and small relief.
  let h = fbm(x * 0.011 + 17, z * 0.011 - 9, 5) * 11 - 5.5;
  h += fbm(x * 0.06 + 40, z * 0.06, 3) * 1.5;

  // The canyon: a steep-walled trough with a broad floor.
  const width = 30 + 9 * Math.sin(x / 90 + 1);
  const across = Math.abs(z - canyonZ(x));
  h -= (1 - smoothstep(width * 0.42, width, across)) * 30;

  // Jezero: a bowl with a raised rim.
  const r = Math.hypot(x - CRATER.x, z - CRATER.z);
  if (r < CRATER.r * 1.8) {
    const k = r / CRATER.r;
    if (k < 1) h -= (1 - k * k) * 16;
    h += 6 * Math.exp(-(((r - CRATER.r) / 7) ** 2));
  }
  // Its inlet valley, entering from the west, and the delta fan it built on the floor.
  const inletZ = -112 + 5 * Math.sin(x / 14);
  if (x < CRATER.x - CRATER.r + 6) {
    h -= 5 * (1 - smoothstep(3, 8, Math.abs(z - inletZ))) * smoothstep(-300, -275, x);
  }
  const fx = x - (CRATER.x - CRATER.r + 3);
  const fz = z + 112;
  if (fx > 0) {
    const fr = Math.hypot(fx, fz);
    const angle = Math.atan2(fz, fx);
    const lobes = 0.78 + 0.22 * Math.cos(angle * 6);
    h += 7.5 * (1 - smoothstep(12 * lobes, 30 * lobes, fr)) * (1 - smoothstep(0.95, 1.35, Math.abs(angle)));
  }

  // The outcrop: a steep-sided block of layered rock.
  const bx = Math.abs(x - OUTCROP.x) - OUTCROP.hw;
  const bz = Math.abs(z - OUTCROP.z) - OUTCROP.hd;
  const boxDistance = Math.hypot(Math.max(bx, 0), Math.max(bz, 0)) + Math.min(Math.max(bx, bz), 0);
  h += OUTCROP.height * (1 - smoothstep(-1, 3, boxDistance));

  // The ice scarp: a terrace whose north face is a steep cut.
  const along = 1 - smoothstep(SCARP.halfWidth - 12, SCARP.halfWidth + 8, Math.abs(x - SCARP.x));
  h += 11 * smoothstep(SCARP.z + 4, SCARP.z - 2, z) * along;

  // A ridge to watch the sky from.
  h += 16 * Math.exp(-(((x - RIDGE.x) / 30) ** 2 + ((z - RIDGE.z) / 24) ** 2));

  // A raised rim keeps the rover in the world.
  h += smoothstep(HALF - 50, HALF, Math.max(Math.abs(x), Math.abs(z))) * 34;
  return h;
}

export function normalAt(x: number, z: number) {
  const e = 0.6;
  const dx = heightAt(x + e, z) - heightAt(x - e, z);
  const dz = heightAt(x, z + e) - heightAt(x, z - e);
  const nx = -dx;
  const ny = 2 * e;
  const nz = -dz;
  const len = Math.hypot(nx, ny, nz);
  return { x: nx / len, y: ny / len, z: nz / len };
}

/** What the laser hits at a point on the outcrop. */
export function classifyHit(x: number, y: number, z: number): LaserTarget {
  const n = normalAt(x, z);
  if (n.y > 0.8) return 'dust';
  const across = Math.abs((x - VEIN.x) * -VEIN.dz + (z - VEIN.z) * VEIN.dx);
  if (across < 1.1) return 'vein';
  return rockBand(x, y, z) < 0.45 ? 'mudstone' : 'sandstone';
}

/** Rock layering, 0..1. The terrain shader computes exactly the same expression. */
export const rockBand = (x: number, y: number, z: number) =>
  Math.sin(y * 1.9 + 1.5 * Math.sin(x * 0.05) + 1.5 * Math.cos(z * 0.05)) * 0.5 + 0.5;
