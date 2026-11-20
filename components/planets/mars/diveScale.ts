/**
 * The dive's timeline: one scroll progress p in 0..1 drives everything (cameras, crossfades,
 * the scale readout and the text cards). Pure data and maths, no three.js, so the page
 * component can use it without pulling the engine into the main bundle.
 */

export type DiveStage = {
  id: 'planet' | 'region' | 'landscape' | 'outcrop' | 'lens' | 'grain';
  /** Progress at which the text card is fully shown, and where it fades in and out. */
  from: number;
  to: number;
  /** Representative progress, used when motion is reduced. */
  still: number;
};

export const STAGES: DiveStage[] = [
  { id: 'planet', from: 0, to: 0.135, still: 0.04 },
  { id: 'region', from: 0.175, to: 0.325, still: 0.25 },
  { id: 'landscape', from: 0.385, to: 0.545, still: 0.47 },
  { id: 'outcrop', from: 0.585, to: 0.685, still: 0.64 },
  { id: 'lens', from: 0.735, to: 0.865, still: 0.8 },
  { id: 'grain', from: 0.9, to: 1.01, still: 0.97 },
];

const FADE = 0.022;

/** Card opacity (0..1) for a stage at progress p. */
export function cardVisibility(stage: DiveStage, p: number) {
  const fadeIn = stage.from <= 0 ? 1 : Math.min(1, Math.max(0, (p - stage.from) / FADE));
  const fadeOut = stage.to > 1 ? 1 : Math.min(1, Math.max(0, (stage.to - p) / FADE));
  return Math.min(fadeIn, fadeOut);
}

/**
 * log10 of the frame's width in metres. Illustrative, not measured: the landscape stage is a
 * generated place, so the jump from orbit to it is a stylised handover. The values after it
 * follow the macro shader, whose features really are the size the readout implies.
 */
const KEYS: [number, number][] = [
  [0, 6.9],
  [0.14, 6.5],
  [0.32, 5.55],
  [0.4, 2.8],
  [0.5, 2.0],
  [0.6, 1.5],
  [0.7, 1.0],
  [0.76, 0.3],
  [0.82, -0.45],
  [0.88, -1.1],
  [0.94, -1.55],
  [1, -1.8],
];

const ease = (t: number) => t * t * (3 - 2 * t);

export function logWidth(p: number) {
  if (p <= KEYS[0][0]) return KEYS[0][1];
  for (let i = 1; i < KEYS.length; i++) {
    if (p <= KEYS[i][0]) {
      const [p0, v0] = KEYS[i - 1];
      const [p1, v1] = KEYS[i];
      return v0 + (v1 - v0) * ease((p - p0) / (p1 - p0));
    }
  }
  return KEYS[KEYS.length - 1][1];
}

export const widthMeters = (p: number) => 10 ** logWidth(p);

/** "7,900 km", "380 m", "6.2 cm" … split into a big number and a small unit. */
export function formatWidth(metres: number): { value: string; unit: string } {
  const round = (n: number) => (n >= 100 ? Math.round(n) : n >= 10 ? Math.round(n * 10) / 10 : Math.round(n * 100) / 100);
  if (metres >= 1000) {
    const km = round(metres / 1000);
    return { value: km >= 100 ? Math.round(km).toLocaleString('en-US') : String(km), unit: 'km' };
  }
  if (metres >= 1) return { value: String(round(metres)), unit: 'm' };
  if (metres >= 0.01) return { value: String(round(metres * 100)), unit: 'cm' };
  return { value: String(round(metres * 1000)), unit: 'mm' };
}

export const stageAt = (p: number) => {
  let index = 0;
  STAGES.forEach((stage, i) => { if (p >= stage.from - 0.02) index = i; });
  return index;
};
