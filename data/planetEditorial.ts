import { planets } from './planets';

/**
 * Editorial content for the /planets/[slug] pages — the longform layer on top of the
 * simulation data. Numeric facts shared with the simulation (diameter, distance,
 * periods) live in `planets.ts` and are imported by the pages directly; this file holds
 * only what exists nowhere else: prose, classification, and display-only physical
 * stats (gravity, temperature, orbital velocity, known-moon counts — NASA fact sheets).
 *
 * `heroStat` is each planet's single most arresting number, given the biggest
 * typographic treatment on its page. One number, chosen editorially, per planet.
 */
export interface PlanetEditorial {
  /** Mono eyebrow, e.g. "Terrestrial · Iron core". */
  classification: string;
  heroStat: { value: string; unit: string; label: string };
  /** Display-only physical data, complementing the simulation facts. */
  stats: { label: string; value: string }[];
  /** Two longform paragraphs of real, checkable material. */
  paragraphs: [string, string];
}

export const planetEditorial: Record<string, PlanetEditorial> = {
  Mercury: {
    classification: 'Terrestrial · Iron core',
    heroStat: { value: '610', unit: '°C', label: 'between its hottest day and coldest night' },
    stats: [
      { label: 'Surface gravity', value: '3.7 m/s²' },
      { label: 'Mean temperature', value: '167 °C' },
      { label: 'Orbital velocity', value: '47.4 km/s' },
      { label: 'Known moons', value: '0' },
    ],
    paragraphs: [
      'Mercury is mostly core. An iron heart takes up roughly eighty-five percent of the planet’s radius — the likely remnant of a larger world stripped of its outer layers by an ancient collision. What is left is a cratered, airless surface that keeps almost nothing: with no atmosphere worth the name, heat arrives and leaves without negotiation.',
      'The planet is locked to the Sun in a 3:2 resonance, turning three times on its axis for every two trips around — a day-night cycle that lasts 176 Earth days. Stand in the wrong place and the Sun rises, stops, reverses briefly, then continues, an effect of an orbit eccentric enough to outrun the planet’s own spin.',
    ],
  },
  Venus: {
    classification: 'Terrestrial · Runaway greenhouse',
    heroStat: { value: '92', unit: 'bar', label: 'of surface pressure — a kilometre under the sea' },
    stats: [
      { label: 'Surface gravity', value: '8.9 m/s²' },
      { label: 'Mean temperature', value: '464 °C' },
      { label: 'Orbital velocity', value: '35.0 km/s' },
      { label: 'Known moons', value: '0' },
    ],
    paragraphs: [
      'Venus is what a greenhouse effect looks like when it never stops. A carbon-dioxide atmosphere almost a hundred times the mass of Earth’s traps enough heat to hold the surface near 464 °C — hotter than Mercury at twice the distance from the Sun — beneath an unbroken deck of sulphuric-acid cloud.',
      'It also turns the wrong way, and almost not at all: one backwards rotation every 243 Earth days, longer than its own year. The Soviet Venera landers that reached the surface in the 1970s and 80s survived the crush and the heat for minutes, not hours — still the only photographs ever taken from the ground.',
    ],
  },
  Earth: {
    classification: 'Terrestrial · Habitable',
    heroStat: { value: '71', unit: '%', label: 'of the surface is ocean' },
    stats: [
      { label: 'Surface gravity', value: '9.8 m/s²' },
      { label: 'Mean temperature', value: '15 °C' },
      { label: 'Orbital velocity', value: '29.8 km/s' },
      { label: 'Known moons', value: '1' },
    ],
    paragraphs: [
      'Earth is the control case — the one world where every variable landed inside the survivable band. Liquid water on the surface, a magnetic field that holds the solar wind at arm’s length, plate tectonics recycling the crust, and an atmosphere kept permanently out of chemical equilibrium by the only biosphere known to exist.',
      'Its outsized moon does quiet, structural work: raised by a Mars-scale impact four and a half billion years ago, it steadies the planet’s 23.4-degree tilt against chaotic wobble. The seasons owe their regularity to that stability — a coincidence of early violence that became a precondition for climate you can build a civilisation on.',
    ],
  },
  Mars: {
    classification: 'Terrestrial · Cold desert',
    heroStat: { value: '21.9', unit: 'km', label: 'height of Olympus Mons — 2.5 Everests' },
    stats: [
      { label: 'Surface gravity', value: '3.7 m/s²' },
      { label: 'Mean temperature', value: '-65 °C' },
      { label: 'Orbital velocity', value: '24.1 km/s' },
      { label: 'Known moons', value: '2' },
    ],
    paragraphs: [
      'Mars is a planet that used to be somewhere else. Dry river deltas, lakebed sediments and minerals that only form in water record a warmer, wetter first billion years — before the planet’s magnetic field failed and the solar wind stripped the atmosphere down to a hundredth of Earth’s pressure.',
      'What remains is built at a scale the Earth cannot match: Olympus Mons rises 21.9 kilometres, and Valles Marineris cuts a canyon system four thousand kilometres long — the length of the continental United States. Its two small moons, Phobos and Deimos, are likely captured asteroids; the inner one is spiralling slowly in toward eventual destruction.',
    ],
  },
  Jupiter: {
    classification: 'Gas giant · System anchor',
    heroStat: { value: '317', unit: 'M⊕', label: 'Earth masses — more than everything else combined' },
    stats: [
      { label: 'Surface gravity', value: '24.8 m/s²' },
      { label: 'Mean temperature', value: '-110 °C' },
      { label: 'Orbital velocity', value: '13.1 km/s' },
      { label: 'Known moons', value: '95' },
    ],
    paragraphs: [
      'Jupiter is the solar system’s other centre of gravity. At 317 Earth masses — more than twice everything else in orbit combined — it has spent four and a half billion years rearranging the neighbourhood: slinging comets outward, herding the asteroid belt, and taking hits (Shoemaker–Levy 9, 1994) that might otherwise have travelled further in.',
      'The Great Red Spot, a storm wider than Earth, has been observed continuously since the 1830s and is slowly shrinking. Around the planet orbit ninety-five known moons, four of them — Io, Europa, Ganymede, Callisto — discovered by Galileo in 1610, the first objects ever seen orbiting something other than the Earth.',
    ],
  },
  Saturn: {
    classification: 'Gas giant · Ringed',
    heroStat: { value: '0.69', unit: 'g/cm³', label: 'mean density — less than water' },
    stats: [
      { label: 'Surface gravity', value: '10.4 m/s²' },
      { label: 'Mean temperature', value: '-140 °C' },
      { label: 'Orbital velocity', value: '9.7 km/s' },
      { label: 'Known moons', value: '146' },
    ],
    paragraphs: [
      'Saturn is the least dense planet — lighter, on average, than water. Its rings span 280,000 kilometres and yet average only around ten metres thick: a sheet of orbiting water ice that, at scale, is proportionally thinner than paper. They may be young, perhaps only a hundred million years — dinosaurs predate them.',
      'At the north pole, clouds flow around a hexagon wider than two Earths, a standing wave that has persisted since at least the Voyager flybys. Among its hundred and forty-six known moons, Titan holds a thicker atmosphere than Earth’s and lakes of liquid methane; Enceladus vents its buried ocean into space through cracks in the ice.',
    ],
  },
  Uranus: {
    classification: 'Ice giant · Sideways',
    heroStat: { value: '97.8', unit: '°', label: 'axial tilt — it orbits lying down' },
    stats: [
      { label: 'Surface gravity', value: '8.9 m/s²' },
      { label: 'Mean temperature', value: '-195 °C' },
      { label: 'Orbital velocity', value: '6.8 km/s' },
      { label: 'Known moons', value: '28' },
    ],
    paragraphs: [
      'Something enormous hit Uranus early, and the planet never stood back up. Tilted 97.8 degrees, it rolls around its orbit on its side, giving each pole a 42-year day followed by a 42-year night. Despite sitting closer to the Sun than Neptune, it radiates almost no internal heat and holds the coldest atmosphere of any planet: minus 224 °C at its coldest.',
      'It was the first planet ever discovered — William Herschel, 1781, from a back garden in Bath — doubling the known radius of the solar system overnight. Its twenty-eight moons take their names not from mythology but from Shakespeare and Pope: Titania, Oberon, Miranda, Ariel.',
    ],
  },
  Neptune: {
    classification: 'Ice giant · Windswept',
    heroStat: { value: '2,100', unit: 'km/h', label: 'peak winds — the fastest in the solar system' },
    stats: [
      { label: 'Surface gravity', value: '11.2 m/s²' },
      { label: 'Mean temperature', value: '-200 °C' },
      { label: 'Orbital velocity', value: '5.4 km/s' },
      { label: 'Known moons', value: '16' },
    ],
    paragraphs: [
      'Neptune was found with arithmetic before it was found with glass. Its position was computed from unexplained wobbles in the orbit of Uranus, and in 1846 the planet appeared within a degree of where Le Verrier’s mathematics said to look — the first world discovered by prediction rather than search.',
      'For the furthest planet from the Sun’s energy, it is inexplicably violent: supersonic winds reach 2,100 kilometres per hour, faster than any other planetary atmosphere. Its great moon Triton orbits backwards — a captured Kuiper Belt object — and is slowly spiralling inward toward a future breakup.',
    ],
  },
};

// Every planet must have an editorial entry; fail the build loudly if one is missing.
for (const planet of planets) {
  if (!planetEditorial[planet.name]) {
    throw new Error(`planetEditorial is missing an entry for ${planet.name}`);
  }
}
