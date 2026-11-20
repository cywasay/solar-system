'use client';

import { useSyncExternalStore } from 'react';

export const MOBILE_SIMULATION_QUERY = '(max-width: 767px), (max-width: 1024px) and (pointer: coarse)';
function subscribe(callback: () => void) {
  const query = window.matchMedia(MOBILE_SIMULATION_QUERY);
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}

// Null during hydration prevents allocating the desktop renderer on a phone first.
export function useMobileSimulation() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(MOBILE_SIMULATION_QUERY).matches, () => null);
}
