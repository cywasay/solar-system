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
 *
 * Moons are scaled by eye instead: real moon radii and orbital distances are so small
 * relative to their planet that any consistent formula makes them invisible or puts
 * them inside the planet. Values were picked to read clearly; real figures live in
 * the `facts` blocks, which are display-only.
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

/** Real-world display data for the InfoPanel. Never feeds the simulation. */
export interface BodyFacts {
  diameterKm: number; // mean diameter; for irregular bodies, the mean of the three axes
  distance: string; // human-readable real distance, e.g. "1.00 AU from the Sun"
  orbitalPeriod: string;
  dayLength: string; // solar day (NASA "length of day"), not sidereal
  description: string; // 1-2 sentences of real, checkable fact
}

export interface Moon {
  name: string;
  radius: number; // scene units, scaled by eye — see the moons note above
  distanceFromPlanet: number; // scene units from the planet's centre
  orbitSpeed: number; // radians/sec around the planet
  fallbackColor: string; // moons are untextured this pass, so this is their colour
  /** Irregular (non-spherical) bodies render as a stretched low-poly icosahedron. */
  irregular?: boolean;
  facts: BodyFacts;
}

export interface Planet {
  name: string;
  radius: number; // scene units — see scaling note above
  distanceFromSun: number; // scene units from origin
  textureFile: string; // path under /public
  /** Optional tangent-space normal map. Loaded linear, never sRGB-tagged. */
  normalMapFile?: string;
  rotationSpeed: number; // radians/sec of axial spin; negative = retrograde
  orbitSpeed: number; // radians/sec of revolution about the Sun
  axialTilt: number; // degrees of obliquity, measured from the orbital plane normal
  fallbackColor: string; // used when textureFile is missing or fails to load
  ring?: PlanetRingConfig; // optional ring system, drawn in the equatorial plane
  moons?: Moon[]; // orbit the planet, nested inside its orbital pivot
  facts: BodyFacts;
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
    facts: {
      diameterKm: 4879,
      distance: '0.39 AU from the Sun',
      orbitalPeriod: '88 days',
      dayLength: '4,222.6 hours',
      description:
        'The smallest planet, and the closest to the Sun. With almost no atmosphere to trap heat, its surface swings from -180 °C at night to 430 °C by day — the widest temperature range of any planet.',
    },
  },
  {
    // 6,052 km radius | 0.723 AU | 0.6152 yr orbit | 243.025 day retrograde rotation
    // Tilt 2.64 = 180 - 177.36 published; see the convention note above.
    name: 'Venus',
    radius: 0.88,
    distanceFromSun: 24.2,
    textureFile: '/textures/2k_venus_surface.jpg',
    rotationSpeed: spinRadPerSec(-243.025),
    orbitSpeed: orbitRadPerSec(0.6152),
    axialTilt: 2.64,
    fallbackColor: '#e6cc9e',
    facts: {
      diameterKm: 12104,
      distance: '0.72 AU from the Sun',
      orbitalPeriod: '224.7 days',
      dayLength: '2,802 hours',
      description:
        'The hottest planet at ~465 °C, cooked by a runaway greenhouse effect under a crushing carbon-dioxide atmosphere. It spins backwards, so slowly that its day outlasts its year.',
    },
  },
  {
    // 6,371 km radius | 1.000 AU | 1.0 yr orbit | 0.99727 day rotation | 23.44 deg tilt
    name: 'Earth',
    radius: 0.9,
    distanceFromSun: 27.0,
    // Solar System Scope 2K daymap; keeps their filename rather than renaming on import.
    textureFile: '/textures/2k_earth_daymap.jpg',
    // NOT PRESENT YET — resolves automatically once the file is added. Note that Solar
    // System Scope ships this as .tif, which browsers cannot decode; convert to JPG/PNG.
    normalMapFile: '/textures/2k_earth_normal_map.jpg',
    rotationSpeed: spinRadPerSec(0.99727),
    orbitSpeed: orbitRadPerSec(1.0),
    axialTilt: 23.44,
    fallbackColor: '#4f7fbf',
    facts: {
      diameterKm: 12756,
      distance: '1.00 AU from the Sun',
      orbitalPeriod: '365.25 days',
      dayLength: '24.0 hours',
      description:
        'The only world known to harbour life, with liquid water covering 71% of its surface. Its large moon stabilises the axial tilt that gives it regular seasons.',
    },
    moons: [
      {
        // 1,737 km radius | 384,400 km out | 27.32 day sidereal period | tidally locked
        name: 'Luna',
        radius: 0.25,
        distanceFromPlanet: 2.2,
        orbitSpeed: 0.55,
        fallbackColor: '#b8b5ad',
        facts: {
          diameterKm: 3475,
          distance: '384,400 km from Earth',
          orbitalPeriod: '27.3 days',
          dayLength: '708.7 hours',
          description:
            "Earth's only natural satellite, most likely debris from a Mars-sized body striking the young Earth. Tidally locked, so the same face always points home.",
        },
      },
    ],
  },
  {
    // 3,390 km radius | 1.524 AU | 1.8808 yr orbit | 1.02596 day rotation | 25.19 deg tilt
    name: 'Mars',
    radius: 0.66,
    distanceFromSun: 31.6,
    textureFile: '/textures/2k_mars.jpg',
    // NOT PRESENT YET — resolves automatically once the file is added.
    normalMapFile: '/textures/2k_mars_normal_map.jpg',
    rotationSpeed: spinRadPerSec(1.02596),
    orbitSpeed: orbitRadPerSec(1.8808),
    axialTilt: 25.19,
    fallbackColor: '#c1440e',
    facts: {
      diameterKm: 6779,
      distance: '1.52 AU from the Sun',
      orbitalPeriod: '687 days',
      dayLength: '24.7 hours',
      description:
        'A cold desert world rusted red by iron oxide. Home to the tallest volcano in the solar system, Olympus Mons at ~21 km, and the vast Valles Marineris canyon system.',
    },
    moons: [
      {
        // 27x22x18 km, mean ~22.5 | 9,376 km out | 7.66 hr period | tidally locked
        name: 'Phobos',
        radius: 0.11,
        distanceFromPlanet: 1.35,
        orbitSpeed: 1.7,
        fallbackColor: '#8a7a6d',
        irregular: true,
        facts: {
          diameterKm: 22.5,
          distance: '9,376 km from Mars',
          orbitalPeriod: '7.7 hours',
          dayLength: '7.7 hours',
          description:
            'A lumpy, cratered rock that orbits Mars faster than the planet rotates, so it rises in the west and sets in the east. Its orbit is decaying — in ~50 million years it will break up or crash.',
        },
      },
      {
        // 15x12.2x11 km, mean ~12.4 | 23,463 km out | 30.3 hr period | tidally locked
        name: 'Deimos',
        radius: 0.075,
        distanceFromPlanet: 2.0,
        orbitSpeed: 0.85,
        fallbackColor: '#9c8f82',
        irregular: true,
        facts: {
          diameterKm: 12.4,
          distance: '23,463 km from Mars',
          orbitalPeriod: '30.3 hours',
          dayLength: '30.3 hours',
          description:
            'The smaller and outer of Mars’s two moons, so small that its escape velocity is about 20 km/h — a good jump would put you in orbit.',
        },
      },
    ],
  },
  {
    // 69,911 km radius | 5.203 AU | 11.862 yr orbit | 0.41354 day rotation | 3.13 deg tilt
    name: 'Jupiter',
    radius: 2.98,
    distanceFromSun: 54.0,
    textureFile: '/textures/2k_jupiter.jpg',
    rotationSpeed: spinRadPerSec(0.41354),
    orbitSpeed: orbitRadPerSec(11.862),
    axialTilt: 3.13,
    fallbackColor: '#d8ca9d',
    facts: {
      diameterKm: 142984,
      distance: '5.20 AU from the Sun',
      orbitalPeriod: '11.9 years',
      dayLength: '9.9 hours',
      description:
        'More than twice as massive as every other planet combined. The Great Red Spot is a storm wider than Earth that has been raging for at least 190 years.',
    },
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
    facts: {
      diameterKm: 120536,
      distance: '9.54 AU from the Sun',
      orbitalPeriod: '29.5 years',
      dayLength: '10.7 hours',
      description:
        'The least dense planet — it would float in a big enough bathtub. Its rings span 280,000 km yet average only around ten metres thick.',
    },
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
    facts: {
      diameterKm: 51118,
      distance: '19.19 AU from the Sun',
      orbitalPeriod: '84 years',
      dayLength: '17.2 hours',
      description:
        'Rolls around the Sun on its side, probably knocked over by an ancient collision, giving each pole 42 years of daylight followed by 42 of darkness. The coldest planetary atmosphere, at -224 °C.',
    },
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
    facts: {
      diameterKm: 49528,
      distance: '30.07 AU from the Sun',
      orbitalPeriod: '164.8 years',
      dayLength: '16.1 hours',
      description:
        'The windiest world, with supersonic gusts up to 2,100 km/h. Found in 1846 by mathematics — its position was predicted from wobbles in Uranus’s orbit before any telescope saw it.',
    },
  },
];

/** Any selectable body — planet or moon — for camera focus and the info panel. */
export interface CelestialBodyRecord {
  name: string;
  radius: number;
  facts: BodyFacts;
  /** Set for moons: the planet they orbit. */
  parentName?: string;
}

export const bodiesByName: ReadonlyMap<string, CelestialBodyRecord> = new Map([
  ...planets.map(
    (p) => [p.name, { name: p.name, radius: p.radius, facts: p.facts }] as const
  ),
  ...planets.flatMap((p) =>
    (p.moons ?? []).map(
      (m) =>
        [
          m.name,
          { name: m.name, radius: m.radius, facts: m.facts, parentName: p.name },
        ] as const
    )
  ),
]);

/** Outermost extent of the system, in scene units. Useful for framing the camera. */
export const systemRadius =
  planets[planets.length - 1].distanceFromSun + planets[planets.length - 1].radius;
