import * as THREE from 'three';

/**
 * Camera focus maths, kept free of React and R3F so it can be driven frame-by-frame in a
 * headless test. CameraController is a thin wrapper over `stepFocus`.
 */

/** Overview shot — frames the whole system. Matches Scene.tsx's initial camera. */
export const OVERVIEW_POSITION = new THREE.Vector3(0, 80, 210);
export const OVERVIEW_TARGET = new THREE.Vector3(0, 0, 0);

/** Stand-off distance when focused, in planet radii. ~6r puts the planet at a comfortable
 *  angular size against a 50 deg vertical FOV. */
export const FOCUS_DISTANCE_IN_RADII = 6;
/** Floor, so Mercury (r = 0.56) doesn't pull the camera onto the near plane. */
export const MIN_FOCUS_DISTANCE = 3;

export const LERP_FACTOR = 0.05;
/** Below this gap to the ideal position, hand control back to the user. */
export const ARRIVE_EPSILON = 0.25;

export interface FocusState {
  /** True once the approach finished and the camera is rigidly tracking. */
  settled: boolean;
  hasLastPosition: boolean;
  lastPlanetPosition: THREE.Vector3;
  /**
   * Unit offset direction, latched when the approach begins and held fixed in world
   * space. Recomputing it per frame would make the destination orbit along with the
   * planet, leaving the easing permanently chasing it.
   */
  offsetDirection: THREE.Vector3;
  hasOffsetDirection: boolean;
}

export function createFocusState(): FocusState {
  return {
    settled: false,
    hasLastPosition: false,
    lastPlanetPosition: new THREE.Vector3(),
    offsetDirection: new THREE.Vector3(),
    hasOffsetDirection: false,
  };
}

export function resetFocusState(state: FocusState): void {
  state.settled = false;
  state.hasLastPosition = false;
  state.hasOffsetDirection = false;
}

const _toSun = new THREE.Vector3();
const _tangent = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _desired = new THREE.Vector3();
const _delta = new THREE.Vector3();

/**
 * Where the camera wants to sit for a given planet.
 *
 * The offset leans toward the Sun rather than straight out along the orbital radius:
 * the only light source is at the origin, so parking outside the orbit would frame the
 * unlit hemisphere. Mixing in the orbital tangent and some elevation gives a lit,
 * three-quarter view.
 */
export function focusOffsetDirection(
  planetPosition: THREE.Vector3,
  out: THREE.Vector3
): THREE.Vector3 {
  // Degenerate only if a body sits exactly on the Sun; fall back to straight up.
  if (planetPosition.lengthSq() < 1e-6) {
    return out.copy(_up);
  }

  _toSun.copy(planetPosition).negate().normalize();
  _tangent.crossVectors(_up, planetPosition).normalize();

  return out
    .copy(_toSun)
    .multiplyScalar(0.55)
    .addScaledVector(_tangent, 0.7)
    .addScaledVector(_up, 0.45)
    .normalize();
}

export function focusDistance(planetRadius: number): number {
  return Math.max(planetRadius * FOCUS_DISTANCE_IN_RADII, MIN_FOCUS_DISTANCE);
}

export function desiredCameraPosition(
  planetPosition: THREE.Vector3,
  planetRadius: number,
  offsetDirection: THREE.Vector3,
  out: THREE.Vector3
): THREE.Vector3 {
  return out
    .copy(offsetDirection)
    .multiplyScalar(focusDistance(planetRadius))
    .add(planetPosition);
}

export interface StepFocusParams {
  state: FocusState;
  /** The planet's LIVE world position this frame, or null for overview. */
  planetPosition: THREE.Vector3 | null;
  planetRadius: number;
  /** Mutated in place. */
  cameraPosition: THREE.Vector3;
  /** Mutated in place — OrbitControls' pivot. */
  controlsTarget: THREE.Vector3;
  lerpFactor?: number;
}

/**
 * Advance the camera one frame. Two regimes:
 *
 * - Approaching: ease position and pivot toward the planet. The destination is
 *   recomputed from the live position every frame, so a moving target is chased rather
 *   than aimed at a stale point.
 * - Settled: stop easing and translate the camera by exactly the planet's own motion,
 *   pinning the pivot to it. The relative offset is left untouched, so whatever angle
 *   and zoom the user has dragged to survives, and OrbitControls stays usable.
 *
 * The handover is what stops the classic failure of looking right for a second and then
 * drifting: an approach-only implementation converges on where the planet *was*.
 */
export function stepFocus({
  state,
  planetPosition,
  planetRadius,
  cameraPosition,
  controlsTarget,
  lerpFactor = LERP_FACTOR,
}: StepFocusParams): void {
  if (!planetPosition) {
    resetFocusState(state);
    cameraPosition.lerp(OVERVIEW_POSITION, lerpFactor);
    controlsTarget.lerp(OVERVIEW_TARGET, lerpFactor);
    return;
  }

  // Carry the camera along with the planet's own motion FIRST, every frame and in both
  // regimes. During the approach this shifts the easing into the planet's co-moving
  // frame, so it converges to zero error instead of trailing by a fixed lag; after
  // arrival it is the tracking behaviour itself.
  if (state.hasLastPosition) {
    _delta.subVectors(planetPosition, state.lastPlanetPosition);
    cameraPosition.add(_delta);
    controlsTarget.add(_delta);
  }

  if (state.settled) {
    // Pin exactly, so no float error accumulates over a long session.
    controlsTarget.copy(planetPosition);
  } else {
    if (!state.hasOffsetDirection) {
      focusOffsetDirection(planetPosition, state.offsetDirection);
      state.hasOffsetDirection = true;
    }
    desiredCameraPosition(planetPosition, planetRadius, state.offsetDirection, _desired);
    cameraPosition.lerp(_desired, lerpFactor);
    controlsTarget.lerp(planetPosition, lerpFactor);
    if (cameraPosition.distanceTo(_desired) < ARRIVE_EPSILON) {
      state.settled = true;
    }
  }

  state.lastPlanetPosition.copy(planetPosition);
  state.hasLastPosition = true;
}
