'use client';

import { preload } from 'react-dom';
import { planets, sun } from '@/data/planets';
import { MOBILE_SIMULATION_QUERY } from './useMobileSimulation';

let sceneRequested = false;

const textureUrls = new Set([
  sun.textureFile,
  '/textures/8k_stars_milky_way.jpg',
  ...planets.flatMap((planet) => [
    planet.textureFile,
    planet.normalMapFile,
    planet.ring?.textureFile,
    ...(planet.moons?.map((moon) => moon.textureFile) ?? []),
  ]),
]);

/** Start the simulation's downloads on intent, without mounting a second renderer. */
export function prewarmExplore(): void {
  if (typeof window === 'undefined') return;

  // This is the same module imported by ExploreExperience's next/dynamic boundary.
  // The browser/module cache reuses it on navigation; a failed warm-up may retry.
  if (!sceneRequested) {
    sceneRequested = true;
    void import('@/components/Scene').catch(() => {
      sceneRequested = false;
    });
  }

  for (const url of textureUrls) {
    if (!url) continue;
    if (url === '/textures/8k_stars_milky_way.jpg' && window.matchMedia(MOBILE_SIMULATION_QUERY).matches) continue;
    // Match THREE.TextureLoader's image request mode so its later request consumes
    // this preload. React deduplicates hints; optional/missing maps retain the
    // existing useOptionalTexture fallback when the scene mounts.
    preload(url, { as: 'image', crossOrigin: 'anonymous' });
  }
}
