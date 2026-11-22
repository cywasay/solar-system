/**
 * The geometry of Voyager 2's pass, simplified. Units: Neptune's radius (24,764 km) = 1, time in
 * hours from closest approach. Neptune sits at the origin with its spin axis along +z.
 *
 * Voyager follows a hyperbola around Neptune that skims about 4,950 km above the cloud tops over
 * the north polar region, then bends south toward Triton, which it passes about 40,000 km away a
 * little over five hours later. The arrival speed is chosen so that timing works out; the plane
 * of the path and the Sun's direction are illustrative.
 */

export type V3 = [number, number, number];
export const R_KM = 24764;
const GM = 6.8365e6; // km^3 s^-2
const DEG = Math.PI / 180;
export const T_START = -9;
export const T_END = 7.6;
export const T_TRITON = 5.233; // 09:10 UTC, 5 h 14 min after closest approach to Neptune
export const ROTATION_H = 16.11;
export const TRITON_R = 1353 / R_KM;
export const TRITON_ORBIT = 354760 / R_KM;
export const ADAMS = 62933 / R_KM;

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a: V3): V3 => scale(a, 1 / (len(a) || 1));
const rotate = (v: V3, axis: V3, ang: number): V3 => {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return add(add(scale(v, c), scale(cross(axis, v), s)), scale(axis, dot(axis, v) * (1 - c)));
};

/** Zonal wind (m/s) relative to the interior's rotation; a smooth fit to Voyager cloud tracking. */
export const windMs = (latDeg: number) => -398 + 0.188 * latDeg * latDeg - 1.2e-5 * latDeg ** 4;
/** The same wind as a drift in longitude, degrees per hour. */
export const windDegPerHour = (latDeg: number) =>
  ((windMs(latDeg) * 3.6) / (2 * Math.PI * R_KM * Math.max(0.05, Math.cos(latDeg * DEG)))) * 360;

// The path ---------------------------------------------------------------------------------
const RP_KM = R_KM + 4950;
const P_HAT: V3 = norm([Math.sin(18 * DEG), 0, Math.cos(18 * DEG)]); // periapsis, near the north pole
const W0: V3 = norm([0.3, -1, 0.05]);
const W: V3 = norm(sub(W0, scale(P_HAT, dot(W0, P_HAT)))); // normal of the path's plane
const Q_HAT: V3 = norm(cross(W, P_HAT));

function makePath(vinf: number) {
  const e = 1 + (RP_KM * vinf * vinf) / GM;
  const a = GM / (vinf * vinf);
  const n = Math.sqrt(GM / a ** 3);
  const b = Math.sqrt(e * e - 1);
  const at = (tHours: number) => {
    const M = n * tHours * 3600;
    let H = Math.asinh(M / e);
    for (let i = 0; i < 30; i++) H -= (e * Math.sinh(H) - H - M) / (e * Math.cosh(H) - 1);
    const pos = add(scale(P_HAT, a * (e - Math.cosh(H))), scale(Q_HAT, a * b * Math.sinh(H)));
    const dH = n / (e * Math.cosh(H) - 1);
    const vel = add(scale(P_HAT, -a * Math.sinh(H) * dH), scale(Q_HAT, a * b * Math.cosh(H) * dH));
    return { pos: scale(pos, 1 / R_KM), vel }; // position in Neptune radii, velocity in km/s
  };
  return at;
}

// Pick the arrival speed so that Voyager is at Triton's distance from Neptune at the right time.
let lo = 10;
let hi = 26;
for (let i = 0; i < 40; i++) {
  const mid = (lo + hi) / 2;
  if (len(makePath(mid)(T_TRITON).pos) < TRITON_ORBIT) lo = mid; else hi = mid;
}
export const VINF = (lo + hi) / 2;
export const spacecraft = makePath(VINF);

/** Direction to the Sun: behind Voyager on approach (a nearly full disc), so it looks back at crescents. */
const D_IN = norm(spacecraft(-60).pos);
export const SUN: V3 = norm(add(D_IN, scale(W, 0.38)));

export const spin = (t: number) => ((2 * Math.PI * t) / ROTATION_H) + 1.3;

/** World direction of a body-fixed point (latitude, longitude in degrees) at time t. */
export function surface(latDeg: number, lonDeg: number, t: number): V3 {
  const s = spin(t);
  const la = latDeg * DEG;
  const lb = lonDeg * DEG + s;
  return [Math.cos(la) * Math.cos(lb), Math.cos(la) * Math.sin(lb), Math.sin(la)];
}
/** Body longitude (degrees) of the point under a world direction at time t. */
function bodyLon(dir: V3, t: number) {
  return (Math.atan2(dir[1], dir[0]) - spin(t)) / DEG;
}

// Cloud features: they drift with the wind at their latitude. Each is placed so that it faces
// Voyager at a chosen moment of the approach.
export type Feature = { id: string; lat: number; lon0: number; semiLon: number; semiLat: number };
const facing = (lat: number, tFace: number) => bodyLon(norm(spacecraft(tFace).pos), tFace) - windDegPerHour(lat) * tFace + 8;
export const FEATURES: Feature[] = [
  { id: 'dark-spot', lat: -22, lon0: facing(-22, -5.6), semiLon: 0.27, semiLat: 0.13 },
  { id: 'scooter', lat: -42, lon0: facing(-42, -3.9), semiLon: 0.07, semiLat: 0.04 },
  { id: 'small-spot', lat: -55, lon0: facing(-55, -3.2), semiLon: 0.1, semiLat: 0.06 },
  { id: 'clouds', lat: 27, lon0: facing(27, -1.6), semiLon: 0.22, semiLat: 0.05 },
];
export const featureLon = (f: Feature, t: number) => f.lon0 + windDegPerHour(f.lat) * t;

// Triton: on a retrograde circular orbit, placed to pass about 40,000 km from Voyager at T_TRITON.
const scT = spacecraft(T_TRITON);
const side = norm(cross(scT.vel, [0, 0, 1]));
const P_T: V3 = scale(norm(add(scT.pos, scale(side, 1.62))), TRITON_ORBIT);
const NT0: V3 = scale([0, 0, 1], -1);
const PT_HAT = norm(P_T);
export const TRITON_NORMAL: V3 = norm(sub(NT0, scale(PT_HAT, dot(NT0, PT_HAT)))); // as close to retrograde as the placement allows
const TRITON_RATE = (2 * Math.PI) / (5.877 * 24); // rad per hour
export const triton = (t: number): V3 => rotate(P_T, TRITON_NORMAL, TRITON_RATE * (t - T_TRITON));
/** The pole of Triton that faces the Sun (its south pole was in summer in 1989). */
export const TRITON_CAP: V3 = dot(TRITON_NORMAL, SUN) > 0 ? TRITON_NORMAL : scale(TRITON_NORMAL, -1);

// Ring arcs in the Adams ring, orbiting every ~10.5 hours; placed beside the limb as seen looking back.
const ADAMS_RATE = (2 * Math.PI) / (2 * Math.PI * Math.sqrt((ADAMS * R_KM) ** 3 / GM) / 3600); // rad per hour
const lookBack = norm(spacecraft(2.2).pos);
const ARC0 = Math.atan2(cross([0, 0, 1], lookBack)[1], cross([0, 0, 1], lookBack)[0]) - ADAMS_RATE * 2.2;
export const arcPhase = (t: number) => ARC0 + ADAMS_RATE * t;

// Targets ------------------------------------------------------------------------------------
export type TargetId = 'dark-spot' | 'scooter' | 'clouds' | 'rings' | 'triton' | 'farewell';
export type Target = { id: TargetId; label: string; pos: V3; radius: number; valid: boolean; minAngle: number; window: [number, number] };

export const SHOT_LIST: { id: TargetId; label: string; window: [number, number]; hint: string }[] = [
  { id: 'dark-spot', label: 'Great Dark Spot', window: [-8.2, -3.2], hint: 'The dark oval in the south. It comes round as Neptune turns.' },
  { id: 'scooter', label: 'Scooter', window: [-6, -2.2], hint: 'A small bright cloud further south, moving faster than the spot.' },
  { id: 'clouds', label: 'High clouds', window: [-2.6, -0.4], hint: 'Bright streaks in the north, just before closest approach.' },
  { id: 'rings', label: 'Ring arcs', window: [0.6, 4.2], hint: 'Look back past the limb: the rings only shine backlit.' },
  { id: 'triton', label: 'Triton', window: [4.2, 6.6], hint: 'Five hours after Neptune. Wait until it is a disc, not a dot.' },
  { id: 'farewell', label: 'Farewell crescent', window: [5.8, 7.6], hint: 'Turn back for Neptune as a thin crescent.' },
];

export function targets(t: number, cam: V3): Target[] {
  const out: Target[] = [];
  const seen = (p: V3, n: V3) => dot(n, norm(sub(cam, p))) > 0.25 && dot(n, SUN) > -0.05;
  for (const f of FEATURES) {
    if (f.id === 'small-spot') continue;
    const n = surface(f.lat, featureLon(f, t), t);
    const def = SHOT_LIST.find((s) => s.id === f.id)!;
    out.push({ id: f.id as TargetId, label: def.label, pos: n, radius: f.semiLon * 1.1, valid: t >= def.window[0] && t <= def.window[1] && seen(n, n), minAngle: 0.25, window: def.window });
  }
  const arcDir = arcPhase(t) - 0.2;
  const arc: V3 = [ADAMS * Math.cos(arcDir), ADAMS * Math.sin(arcDir), 0];
  const rDef = SHOT_LIST.find((s) => s.id === 'rings')!;
  out.push({ id: 'rings', label: rDef.label, pos: arc, radius: 0.5, valid: t >= rDef.window[0] && t <= rDef.window[1], minAngle: 0.5, window: rDef.window });
  const tDef = SHOT_LIST.find((s) => s.id === 'triton')!;
  out.push({ id: 'triton', label: tDef.label, pos: triton(t), radius: TRITON_R, valid: t >= tDef.window[0] && t <= tDef.window[1], minAngle: 0.45, window: tDef.window });
  const fDef = SHOT_LIST.find((s) => s.id === 'farewell')!;
  out.push({ id: 'farewell', label: fDef.label, pos: [0, 0, 0], radius: 1, valid: t >= fDef.window[0], minAngle: 0.3, window: fDef.window });
  return out;
}

/** Light travel time from Neptune to Earth in August 1989 (about 4.4 billion km). */
export const LIGHT_DELAY = '4 h 06 min';
