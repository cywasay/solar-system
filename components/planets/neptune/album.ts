import type { Photo } from './flyby';
import type { TargetId } from './encounter';

/**
 * The album: every frame you take is "downlinked" here, and the best frame of each target
 * unlocks its chapter. A small external store so the game and the chapters can share it.
 */

export type AlbumState = { photos: Photo[]; revealAll: boolean; revealed: TargetId[] };

let state: AlbumState = { photos: [], revealAll: false, revealed: [] };
/** Before the page is interactive (and without scripts) every chapter is simply shown. */
const SERVER: AlbumState = { photos: [], revealAll: true, revealed: [] };
const listeners = new Set<() => void>();
const emit = () => { for (const l of listeners) l(); };

export const album = {
  subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
  get: () => state,
  server: () => SERVER,
  add: (p: Photo) => { state = { ...state, photos: [...state.photos, p] }; emit(); },
  showAll: () => { state = { ...state, revealAll: true }; emit(); },
  reveal: (id: TargetId) => { if (!state.revealed.includes(id)) { state = { ...state, revealed: [...state.revealed, id] }; emit(); } },
};

/** Best frame of a target: sharpest first, colour breaking ties. */
export function bestFor(s: AlbumState, id: TargetId): Photo | null {
  let best: Photo | null = null;
  for (const p of s.photos) {
    if (p.target !== id) continue;
    const score = p.sharpness + (p.colour ? 0.15 : 0);
    const bestScore = best ? best.sharpness + (best.colour ? 0.15 : 0) : -1;
    if (score > bestScore) best = p;
  }
  return best;
}
