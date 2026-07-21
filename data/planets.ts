/**
 * Solar system body definitions.
 *
 * SPATIAL SCALING
 * ---------------
 * Real values are unusable literally: Neptune sits ~4.5 billion km out while the
 * Sun's radius is ~700,000 km. At true scale every planet is sub-pixel, or Neptune
 * falls outside the far clipping plane. So radius and distance are scaled with
 * *separate*, independently compressed factors:
 *
 *   radius   = sqrt(realRadius / earthRadius) * 0.9
 *   distance = 11 + (semiMajorAxisAU ^ 0.6) * 16
 *
 * TEMPORAL SCALING
 * ----------------
 * Same problem in the time domain. Neptune's year is 684x Mercury's, and Earth's year
 * is 365x its day — play those literally and either the inner planets strobe or the
 * outer ones look frozen. Both families are sqrt-compressed (preserving ordering) and
 * then scaled by their own rate constant, so a "day" stays fast while a "year" stays
 * slow. Tune the two constants below to taste; everything else derives from real periods.
 */

/** Radians/sec for a body whose orbital rate matches Earth's. Earth year ~63s. */
const ORBIT_RATE = 0.1;

/** Radians/sec for a body whose spin rate matches Earth's. Earth day ~5.2s. */
const SPIN_RATE = 1.2;

/** Earth's sidereal day, in days — the reference for all spin rates. */
const EARTH_SIDEREAL_DAY = 0.99727;

/**
 * Square-root compression, sign-preserving. Halves the dynamic range in log terms so
 * the slowest bodies still visibly move, without reordering anything.
 * Math.sqrt of a negative is NaN, hence the explicit sign handling.
 */
const compress = (rate: number) => Math.sign(rate) * Math.sqrt(Math.abs(rate));

/** @param periodYears sidereal orbital period. */
const orbitRadPerSec = (periodYears: number) => ORBIT_RATE * compress(1 / periodYears);

/** @param periodDays sidereal rotation period; negative means retrograde. */
const spinRadPerSec = (periodDays: number) =>
  SPIN_RATE * compress(EARTH_SIDEREAL_DAY / periodDays);

export interface Planet {
  name: string;
  radius: number; // scene units — see scaling note above
  distanceFromSun: number; // scene units from origin
  textureFile: string; // path under /public
  rotationSpeed: number; // radians/sec of axial spin; negative = retrograde
  orbitSpeed: number; // radians/sec of revolution about the Sun
  axialTilt: number; // degrees of obliquity, measured from the orbital plane normal
  fallbackColor: string; // used when textureFile is missing or fails to load
  ring?: PlanetRingConfig; // optional ring system, drawn in the equatorial plane
  moons?: string[]; // optional list of moon names
}

export interface PlanetRingConfig {
  textureFile: string; // radial strip with alpha; u maps to radius, not angle
  innerRadius: number; // multiples of the planet's own radius
  outerRadius: number;
}

/** The Sun. Rendered unlit (MeshBasicMaterial), so it ignores scene lighting. */
export const sun = {
  name: 'Sun',
  // True radius is ~109x Earth; at that scale it would engulf Mercury's orbit.
  // Held at ~2x Jupiter so it reads as dominant while leaving the inner orbits clear.
  radius: 6,
  // NOT PRESENT — no 2k_sun.jpg in public/textures/ yet, so the Sun renders its
  // fallback colour. Path follows the Solar System Scope convention so it will
  // resolve as soon as the file is dropped in.
  textureFile: '/textures/2k_sun.jpg',
  fallbackColor: '#fdb813',
} as const;

/**
 * A NOTE ON RETROGRADE TILTS
 *
 * NASA's fact sheets list Venus at 177.36 deg obliquity AND -243 day rotation, and
 * Uranus at 97.77 deg AND -17.24 hr. That double-encodes retrograde motion: an obliquity
 * past 90 deg already flips the apparent spin direction, so applying the published tilt
 * *and* a negative rate cancels out and yields a prograde-looking planet.
 *
 * This file picks one convention and sticks to it — obliquity measured against the
 * ORBITAL north pole, with direction carried by the sign of the rotation period. Venus
 * and Uranus therefore carry the complement of the published figure (180 - x). The axis
 * orientation and visible spin direction both end up correct.
 */
export const planets: Planet[] = [
  {
    // 2,440 km radius | 0.387 AU | 0.2408 yr orbit | 58.646 day rotation | 0.034 deg tilt
    name: 'Mercury',
    radius: 0.56,
    distanceFromSun: 20.1,
    textureFile: '/textures/2k_mercury.jpg',
    rotationSpeed: spinRadPerSec(58.646),
    orbitSpeed: orbitRadPerSec(0.2408),
    axialTilt: 0.034,
    fallbackColor: '#8c8a85',
  },
  {
    // 6,052 km radius | 0.723 AU | 0.6152 yr orbit | 243.025 day retrograde rotation
    // Tilt 2.64 = 180 - 177.36 published; see the convention note above.
    name: 'Venus',
    radius: 0.88,
    distanceFromSun: 24.2,
    // Surface map only. 2k_venus_atmosphere.jpg is a separate translucent cloud layer
    // and is deliberately not wired up — it needs its own mesh, in a later step.
    textureFile: '/textures/2k_venus_surface.jpg',
    rotationSpeed: spinRadPerSec(-243.025),
    orbitSpeed: orbitRadPerSec(0.6152),
    axialTilt: 2.64,
    fallbackColor: '#e6cc9e',
  },
  {
    // 6,371 km radius | 1.000 AU | 1.0 yr orbit | 0.99727 day rotation | 23.44 deg tilt
    name: 'Earth',
    radius: 0.9,
    distanceFromSun: 27.0,
    // Solar System Scope 2K daymap; keeps their filename rather than renaming on import.
    textureFile: '/textures/2k_earth_daymap.jpg',
    rotationSpeed: spinRadPerSec(0.99727),
    orbitSpeed: orbitRadPerSec(1.0),
    axialTilt: 23.44,
    fallbackColor: '#4f7fbf',
    moons: ['Moon'],
  },
  {
    // 3,390 km radius | 1.524 AU | 1.8808 yr orbit | 1.02596 day rotation | 25.19 deg tilt
    name: 'Mars',
    radius: 0.66,
    distanceFromSun: 31.6,
    textureFile: '/textures/2k_mars.jpg',
    rotationSpeed: spinRadPerSec(1.02596),
    orbitSpeed: orbitRadPerSec(1.8808),
    axialTilt: 25.19,
    fallbackColor: '#c1440e',
    moons: ['Phobos', 'Deimos'],
  },
  {
    // 69,911 km radius | 5.203 AU | 11.862 yr orbit | 0.41354 day rotation | 3.13 deg tilt
    name: 'Jupiter',
    radius: 2.98,
    distanceFromSun: 54.0,
    // NOT PRESENT — no 2k_jupiter.jpg was included, so Jupiter still renders its
    // fallback colour. Path follows the convention and will resolve once added.
    textureFile: '/textures/2k_jupiter.jpg',
    rotationSpeed: spinRadPerSec(0.41354),
    orbitSpeed: orbitRadPerSec(11.862),
    axialTilt: 3.13,
    fallbackColor: '#d8ca9d',
    moons: ['Io', 'Europa', 'Ganymede', 'Callisto'],
  },
  {
    // 58,232 km radius | 9.537 AU | 29.457 yr orbit | 0.44401 day rotation | 26.73 deg tilt
    name: 'Saturn',
    radius: 2.72,
    distanceFromSun: 72.9,
    textureFile: '/textures/2k_saturn.jpg',
    rotationSpeed: spinRadPerSec(0.44401),
    orbitSpeed: orbitRadPerSec(29.457),
    axialTilt: 26.73,
    fallbackColor: '#ead6b8',
    // Main ring system spans roughly 1.11 (D ring inner) to 2.27 (A ring outer)
    // Saturn radii; rounded slightly inward/outward for a cleaner read at this scale.
    ring: {
      textureFile: '/textures/2k_saturn_ring_alpha.png',
      innerRadius: 1.2,
      outerRadius: 2.3,
    },
    moons: ['Titan', 'Rhea', 'Enceladus'],
  },
  {
    // 25,362 km radius | 19.19 AU | 84.011 yr orbit | 0.71833 day retrograde rotation
    // Tilt 82.23 = 180 - 97.77 published; see the convention note above.
    name: 'Uranus',
    radius: 1.8,
    distanceFromSun: 105.2,
    textureFile: '/textures/2k_uranus.jpg',
    rotationSpeed: spinRadPerSec(-0.71833),
    orbitSpeed: orbitRadPerSec(84.011),
    axialTilt: 82.23,
    fallbackColor: '#9ee3e8',
    moons: ['Titania', 'Oberon', 'Miranda'],
  },
  {
    // 24,622 km radius | 30.07 AU | 164.79 yr orbit | 0.67125 day rotation | 28.32 deg tilt
    name: 'Neptune',
    radius: 1.77,
    distanceFromSun: 134.3,
    textureFile: '/textures/2k_neptune.jpg',
    rotationSpeed: spinRadPerSec(0.67125),
    orbitSpeed: orbitRadPerSec(164.79),
    axialTilt: 28.32,
    fallbackColor: '#3f54ba',
    moons: ['Triton'],
  },
];

/** Outermost extent of the system, in scene units. Useful for framing the camera. */
export const systemRadius =
  planets[planets.length - 1].distanceFromSun + planets[planets.length - 1].radius;
