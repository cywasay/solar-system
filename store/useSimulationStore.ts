import { create } from 'zustand';
import type { Object3D } from 'three';

export interface SimulationState {
  /** Name of the focused planet, or null for the overview shot. */
  selectedPlanet: string | null;
  /**
   * Bumped on every focus request, even one re-selecting the current body. Lets the
   * camera re-fly to a planet (or re-home to Overview) when the user clicks an entry
   * that is already selected — a plain string compare would see no change.
   */
  focusNonce: number;
  isPaused: boolean;
  timeSpeed: number;
  showOrbitPaths: boolean;

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
  setShowOrbitPaths: (showOrbitPaths: boolean) => void;
  registerPlanetRef: (name: string, object: Object3D) => void;
  unregisterPlanetRef: (name: string) => void;
  resetSimulation: () => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  selectedPlanet: null,
  focusNonce: 0,
  isPaused: false,
  timeSpeed: 1.0,
  showOrbitPaths: true,
  planetRefs: new Map(),

  setSelectedPlanet: (planetName) =>
    set((state) => ({ selectedPlanet: planetName, focusNonce: state.focusNonce + 1 })),
  setIsPaused: (isPaused) => set({ isPaused }),
  setTimeSpeed: (speed) => set({ timeSpeed: speed }),
  setShowOrbitPaths: (showOrbitPaths) => set({ showOrbitPaths }),

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
      showOrbitPaths: true,
    }),
}));
