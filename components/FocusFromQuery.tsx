'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { bodiesByName } from '@/data/planets';
import { useSimulationStore } from '@/store/useSimulationStore';

/**
 * Case-insensitive lookup of a ?focus= value against the known bodies (planets AND
 * moons — /explore?focus=luna works). Returns the canonical name, or null for junk.
 * Exported separately so it can be unit-tested without a React tree.
 */
export function resolveFocusName(param: string | null): string | null {
  if (!param) return null;
  const wanted = param.trim().toLowerCase();
  for (const name of bodiesByName.keys()) {
    if (name.toLowerCase() === wanted) return name;
  }
  return null;
}

/**
 * Deep-link bridge: /explore?focus=Mars pre-selects Mars on mount.
 *
 * Deliberately the thinnest possible touch on the simulation: it calls the store's
 * existing public `setSelectedPlanet` action — the same one PlanetMenu fires on click —
 * exactly once. No store fields added, no camera/selection logic modified; from the
 * simulation's perspective, a user clicked the menu on the first frame.
 *
 * Renders nothing. Must be mounted inside <Suspense> (useSearchParams requirement for
 * statically prerendered routes).
 */
export default function FocusFromQuery() {
  const searchParams = useSearchParams();
  const focus = resolveFocusName(searchParams.get('focus'));

  useEffect(() => {
    if (focus) useSimulationStore.getState().setSelectedPlanet(focus);
  }, [focus]);

  return null;
}
