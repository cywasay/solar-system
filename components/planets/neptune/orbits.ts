/**
 * The 1846 problem, recomputed. Uranus is integrated from 1781 to 1846 under the Sun, Jupiter and
 * Saturn (their positions from JPL's approximate Keplerian elements), with or without one extra
 * planet. Everything is flattened into one plane. Units: AU, days, solar masses.
 *
 * The "observed" Uranus is this model with the real Neptune included; it stands in for the
 * historical record. Astronomers of the 1820s fitted the best Uranus orbit they could to the
 * early observations (Bouvard's tables, 1821); what remained afterwards is the residual. We do
 * the same: a four-term orbit correction is fitted to 1781-1821 and removed from every series.
 */

export const K2 = 0.01720209895 ** 2;
const DEG = Math.PI / 180;
const DAYS_PER_YEAR = 365.25;

export const START = 1781.2; // Herschel finds Uranus, March 1781
export const DISCOVERY = 1846.73; // Galle and d'Arrest, 23 September 1846
export const TABLES = 1821.0; // Bouvard's tables were fitted to observations up to here
export const EARTH_MASS = 3.003e-6;

export type Elements = { a: number; e: number; L: number; peri: number; Ldot: number; periDot: number; mass: number };

/** JPL approximate elements (Standish), J2000, degrees and degrees per century. */
export const PLANETS: Record<'earth' | 'jupiter' | 'saturn' | 'uranus' | 'neptune', Elements> = {
  earth: { a: 1.00000261, e: 0.01671123, L: 100.46457166, peri: 102.93768193, Ldot: 35999.37244981, periDot: 0.32327364, mass: 3.003e-6 },
  jupiter: { a: 5.202887, e: 0.04838624, L: 34.39644051, peri: 14.72847983, Ldot: 3034.74612775, periDot: 0.21252668, mass: 9.547919e-4 },
  saturn: { a: 9.53667594, e: 0.05386179, L: 49.95424423, peri: 92.59887831, Ldot: 1222.49362201, periDot: -0.41897216, mass: 2.85886e-4 },
  uranus: { a: 19.18916464, e: 0.04725744, L: 313.23810451, peri: 170.9542763, Ldot: 428.48202785, periDot: 0.40805281, mass: 4.366244e-5 },
  neptune: { a: 30.06992276, e: 0.00859048, L: -55.12002969, peri: 44.96476227, Ldot: 218.45945325, periDot: -0.32241464, mass: 5.151389e-5 },
};

/** A hypothetical planet on a circular orbit, placed by its heliocentric longitude at discovery. */
export type Trial = { a: number; mass: number; longitude: number };

/** Le Verrier's answer: 36.15 AU, 1/9300 of the Sun, 326°32′ for 1 Jan 1847 (equinox of date),
 *  moved to our J2000 frame (+2.14° of precession) and back to September 1846. Circular here. */
export const LE_VERRIER: Trial = { a: 36.154, mass: 1 / 9300, longitude: 328.2 };

function kepler(M: number, e: number) {
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 6; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return E;
}

/** Heliocentric position (and velocity, AU/day) from elements at a decimal year. */
export function elementState(el: Elements, year: number) {
  const T = (year - 2000) / 100;
  const L = (el.L + el.Ldot * T) * DEG;
  const peri = (el.peri + el.periDot * T) * DEG;
  const M = L - peri;
  const E = kepler(M, el.e);
  const b = Math.sqrt(1 - el.e * el.e);
  const xp = el.a * (Math.cos(E) - el.e);
  const yp = el.a * b * Math.sin(E);
  const n = Math.sqrt(K2 * (1 + el.mass) / el.a ** 3);
  const dE = n / (1 - el.e * Math.cos(E));
  const vxp = -el.a * Math.sin(E) * dE;
  const vyp = el.a * b * Math.cos(E) * dE;
  const c = Math.cos(peri);
  const s = Math.sin(peri);
  return { x: xp * c - yp * s, y: xp * s + yp * c, vx: vxp * c - vyp * s, vy: vxp * s + vyp * c };
}

export function trialPosition(t: Trial, year: number) {
  const n = Math.sqrt(K2 * (1 + t.mass) / t.a ** 3) * DAYS_PER_YEAR; // rad per year
  const lon = t.longitude * DEG + n * (year - DISCOVERY);
  return { x: t.a * Math.cos(lon), y: t.a * Math.sin(lon) };
}

export type Series = { years: Float64Array; lon: Float64Array };

const STEP = 8; // days
const SAMPLE_EVERY = 15; // steps (120 days)

/**
 * Integrates Uranus (kick-drift-kick leapfrog) and returns its heliocentric longitude over time.
 * `extra` is the additional planet: the real Neptune, a trial planet, or none.
 */
export function integrateUranus(extra: 'neptune' | Trial | null, end = DISCOVERY): Series {
  const u = elementState(PLANETS.uranus, START);
  let x = u.x, y = u.y, vx = u.vx, vy = u.vy;
  const mu = K2 * (1 + PLANETS.uranus.mass);
  const steps = Math.ceil(((end - START) * DAYS_PER_YEAR) / STEP);
  const count = Math.floor(steps / SAMPLE_EVERY) + 1;
  const years = new Float64Array(count);
  const lon = new Float64Array(count);
  const extraMass = extra === 'neptune' ? PLANETS.neptune.mass : extra ? extra.mass : 0;

  const accel = (px: number, py: number, year: number): [number, number] => {
    const r2 = px * px + py * py;
    const r3 = r2 * Math.sqrt(r2);
    let ax = (-mu * px) / r3;
    let ay = (-mu * py) / r3;
    const pull = (qx: number, qy: number, m: number) => {
      const dx = qx - px;
      const dy = qy - py;
      const d2 = dx * dx + dy * dy;
      const d3 = d2 * Math.sqrt(d2);
      const q2 = qx * qx + qy * qy;
      const q3 = q2 * Math.sqrt(q2);
      // Direct pull on Uranus, minus the pull on the Sun (we work around the Sun).
      ax += K2 * m * (dx / d3 - qx / q3);
      ay += K2 * m * (dy / d3 - qy / q3);
    };
    const j = elementState(PLANETS.jupiter, year);
    pull(j.x, j.y, PLANETS.jupiter.mass);
    const s = elementState(PLANETS.saturn, year);
    pull(s.x, s.y, PLANETS.saturn.mass);
    if (extra === 'neptune') {
      const n = elementState(PLANETS.neptune, year);
      pull(n.x, n.y, extraMass);
    } else if (extra) {
      const p = trialPosition(extra, year);
      pull(p.x, p.y, extraMass);
    }
    return [ax, ay];
  };

  let year = START;
  let [ax, ay] = accel(x, y, year);
  let k = 0;
  let prev = Math.atan2(y, x);
  let unwrapped = prev;
  years[0] = year;
  lon[0] = unwrapped;
  for (let i = 1; i <= steps; i++) {
    vx += 0.5 * STEP * ax;
    vy += 0.5 * STEP * ay;
    x += STEP * vx;
    y += STEP * vy;
    year += STEP / DAYS_PER_YEAR;
    [ax, ay] = accel(x, y, year);
    vx += 0.5 * STEP * ax;
    vy += 0.5 * STEP * ay;
    if (i % SAMPLE_EVERY === 0) {
      const a = Math.atan2(y, x);
      let d = a - prev;
      if (d > Math.PI) d -= 2 * Math.PI;
      if (d < -Math.PI) d += 2 * Math.PI;
      unwrapped += d;
      prev = a;
      k++;
      if (k < count) { years[k] = year; lon[k] = unwrapped; }
    }
  }
  return { years: years.subarray(0, k + 1), lon: lon.subarray(0, k + 1) };
}

const URANUS_N = (2 * Math.PI) / 84.01; // per year

/**
 * Residual in arcseconds: (series - base), with the best four-term Uranus orbit correction
 * (offset, rate, and a once-per-orbit wobble) fitted to the years up to 1821 and removed.
 */
export function residual(series: Series, base: Series): Float64Array {
  const n = Math.min(series.lon.length, base.lon.length);
  const raw = new Float64Array(n);
  for (let i = 0; i < n; i++) raw[i] = ((series.lon[i] - base.lon[i]) / DEG) * 3600;
  // Normal equations for basis [1, t, sin, cos] over the fit window.
  const basis = (t: number) => {
    const tau = t - 1800;
    return [1, tau / 50, Math.sin(URANUS_N * tau), Math.cos(URANUS_N * tau)];
  };
  const A = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
  const b = [0, 0, 0, 0];
  for (let i = 0; i < n; i++) {
    if (series.years[i] > TABLES) break;
    const f = basis(series.years[i]);
    for (let r = 0; r < 4; r++) {
      b[r] += f[r] * raw[i];
      for (let c = 0; c < 4; c++) A[r][c] += f[r] * f[c];
    }
  }
  const coef = solve4(A, b);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const f = basis(series.years[i]);
    out[i] = raw[i] - (coef[0] * f[0] + coef[1] * f[1] + coef[2] * f[2] + coef[3] * f[3]);
  }
  return out;
}

function solve4(A: number[][], b: number[]) {
  const m = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < 4; c++) {
    let p = c;
    for (let r = c + 1; r < 4; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r;
    [m[c], m[p]] = [m[p], m[c]];
    const d = m[c][c] || 1e-12;
    for (let r = 0; r < 4; r++) {
      if (r === c) continue;
      const f = m[r][c] / d;
      for (let k = c; k < 5; k++) m[r][k] -= f * m[c][k];
    }
  }
  return m.map((row, i) => row[4] / (row[i] || 1e-12));
}

/** Share of the observed residual a trial explains: 1 - rms(difference) / rms(observed). */
export function explained(observed: Float64Array, model: Float64Array) {
  let num = 0;
  let den = 0;
  for (let i = 0; i < observed.length; i++) {
    num += (observed[i] - model[i]) ** 2;
    den += observed[i] ** 2;
  }
  return Math.max(0, 1 - Math.sqrt(num / den));
}

/** Geocentric ecliptic longitude (degrees, J2000 frame, flattened) of a heliocentric point. */
export function geocentric(x: number, y: number, year: number) {
  const e = elementState(PLANETS.earth, year);
  return ((Math.atan2(y - e.y, x - e.x) / DEG) % 360 + 360) % 360;
}

/** Everything the bench needs once: the baseline and the "observed" residual. */
export function prepare() {
  const base = integrateUranus(null);
  const withNeptune = integrateUranus('neptune');
  const observed = residual(withNeptune, base);
  return { base, observed, years: base.years };
}
