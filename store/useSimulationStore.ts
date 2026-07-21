import { create } from 'zustand';
import type { Object3D } from 'three';

export interface SimulationState {
  /** Name of the focused planet, or null for the overview shot. */
  selectedPlanet: string | null;
  isPaused: boolean;
  timeSpeed: number;

  /**
   * Live scene-graph handles keyed by planet name, so CameraController can read a
   * planet's real world position without the two components knowing about each other.
   *
   * Mutated in place and never handed to set(), so registering a planet triggers no
   * re-render — these are per-frame render values, not reactive state. The Map identity
   * is stable for the store's lifetime, so subscribing to it is also render-free.
   */
  planetRefs: Map<string, Object3D>;

  setSelectedPlanet: (planetName: string | null) => void;
  setIsPaused: (isPaused: boolean) => void;
  setTimeSpeed: (speed: number) => void;
  registerPlanetRef: (name: string, object: Object3D) => void;
  unregisterPlanetRef: (name: string) => void;
  resetSimulation: () => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  selectedPlanet: null,
  isPaused: false,
  timeSpeed: 1.0,
  planetRefs: new Map(),

  setSelectedPlanet: (planetName) => set({ selectedPlanet: planetName }),
  setIsPaused: (isPaused) => set({ isPaused }),
  setTimeSpeed: (speed) => set({ timeSpeed: speed }),

  registerPlanetRef: (name, object) => {
    get().planetRefs.set(name, object);
  },
  unregisterPlanetRef: (name) => {
    get().planetRefs.delete(name);
  },

  resetSimulation: () =>
    set({
      selectedPlanet: null,
      isPaused: false,
      timeSpeed: 1.0,
    }),
}));
