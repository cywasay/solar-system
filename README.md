# 3D Solar System Simulation

An interactive 3D solar system simulation built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Three.js**, **React Three Fiber (R3F)**, **Drei**, and **Zustand** for state management.

## Current status: animated scene

All eight planets revolve around the Sun and spin on their own tilted axes, with working
camera controls (drag to rotate, scroll to zoom, right-drag to pan). Motion runs
continuously — there is no pause or speed control yet.

Implemented:

- Real planetary data, scaled for viewing (see [Scaling](#scaling) below)
- Orbital revolution and axial rotation via `useFrame`, driven entirely from the data
- Real axial tilt per planet, including retrograde spin for Venus and Uranus
- Textured spheres with graceful solid-colour fallback for missing texture files
- Saturn's rings, in the equatorial plane with the tilt applied
- Moons: Luna around Earth, Phobos and Deimos around Mars — nested in their planet's
  orbital frame, selectable and camera-focusable like planets. Tidal locking comes free
  from the hierarchy: the mesh rides its rotating pivot, so the same face points inward.
  Phobos and Deimos render as stretched flat-shaded icosahedra, not spheres.
- Camera fly-to-focus from the `PlanetMenu` overlay, tracking each body's live
  orbiting position (see [Camera focus](#camera-focus) below)
- `InfoPanel` with real figures (diameter, AU distance, orbital period, solar-day
  length) and a descriptive fact per body, from typed `facts` blocks in `data/planets.ts`
- Optional per-planet normal maps, loaded linear (never sRGB) — paths are wired for
  Earth and Mars, awaiting the files (see the textures README)
- Space-like lighting: near-zero ambient, linear-falloff sunlight (Mercury visibly
  brighter than Neptune), HDR Sun with bloom, ACES filmic tonemap, subtle vignette
  (post chain via `@react-three/postprocessing`; kill switch `POST_PROCESSING` in
  `Scene.tsx` for low-end GPUs)
- Procedural starfield tuned for size variation and parallax depth, kept outside the
  camera's maxDistance so the view can never exit it

Not yet implemented:

- Pause/play and a time-speed multiplier — `TimeControls` renders but is **not wired to
  the scene**; `isPaused` and `timeSpeed` are written by the UI and read by nothing
- Moons beyond Earth's and Mars's; moon textures; elliptical orbits; Venus's atmosphere
  layer; roughness/specular maps
- Fixed axis orientation in world space. Each planet's tilt group is a child of its orbital
  pivot, so the axis sweeps around with the orbit instead of staying fixed — meaning no
  seasons. Most visible on Uranus. Fixable by counter-rotating the tilt group against the
  pivot each frame.

---

## Scaling

True scale is unusable: Neptune orbits ~4.5 billion km out while the Sun's radius is
~700,000 km, which puts every planet at sub-pixel size. Radius and orbital distance are
therefore compressed with **separate** factors:

```text
radius   = sqrt(realRadius / earthRadius) * 0.9
distance = 11 + (semiMajorAxisAU ^ 0.6) * 16
```

This preserves ordering and relative feel — Jupiter is clearly largest, Mercury smallest,
the inner planets clustered and the outer ones spread — without the gas giants swallowing
the inner system. **Ratios are relative, not literal.** Real reference values are kept in
comments on each entry in `data/planets.ts`, so the scaling can be re-derived if the
constants change.

### Time

The same problem recurs in the time domain: Neptune's year is 684x Mercury's, and Earth's
year is 365x its day. Played literally, either the inner planets strobe or the outer ones
look frozen. Orbit rates and spin rates are each sqrt-compressed and then scaled by their
own constant (`ORBIT_RATE`, `SPIN_RATE` in `data/planets.ts`), giving:

| Relationship | Simulation | Reality |
| --- | --- | --- |
| Mercury orbit : Neptune orbit | 26.2 : 1 | 683.6 : 1 |
| Earth day : Earth year | 12 : 1 | 365.25 : 1 |

Earth's year runs ~63s and its day ~5.2s. Because the two families are compressed
independently, per-planet day/year ratios are not preserved — Mercury's simulated day is
longer than its year, where in reality it is shorter. Retune with the two constants.

Moons are scaled by eye rather than by formula: real moon sizes and orbital distances are
so small relative to their planet that any consistent scheme makes them invisible or puts
them inside the planet. Their real figures live in `facts` blocks, which are display-only.

---

## Camera focus

Selecting a planet in `PlanetMenu` sets `selectedPlanet` in the Zustand store.
`CameraController` reads that planet's **live** world position from the scene graph every
frame — never a value captured at selection time, which would converge on where the
planet used to be.

Two regimes, in `components/cameraFocus.ts`:

1. **Approach** — ease position and pivot toward the planet. The camera is first
   translated by the planet's own per-frame motion, so the easing happens in the planet's
   co-moving frame. Without that, easing at a fixed rate toward a moving destination
   settles at a constant lag behind it (~1.3 units for Mercury) and never arrives.
   The offset direction is latched once at selection so the destination does not orbit
   away as well.
2. **Settled** — stop easing and translate the camera by exactly the planet's motion,
   pinning the pivot to it. The relative offset is untouched, so whatever angle and zoom
   the user has dragged to survives and OrbitControls stays fully usable.

User input always wins: any grab of the controls (drag, wheel, touch — OrbitControls'
`start` event) interrupts an in-flight approach immediately instead of the lerp eroding
the input each frame. The overview state settles too — after arriving (or after a user
grab), free navigation, no rubber-band back to the home shot. Re-clicking the selected
body (or Overview) re-flies to it via a focus nonce in the store. Zoom limits are
constant (2..350) rather than per-selection: a selection-dependent `minDistance` was
measured causing a 10-unit single-frame snap when deselecting zoomed-in, and the
constant can never fight an animation — the tradeoff is that a determined user can push
the camera inside a planet. Panning is disabled while a body is focused (the tracking
re-pins the pivot every frame, so pan would rubber-band); rotate and zoom compose fine.

The offset leans sunward rather than straight out along the orbital radius: the only light
is at the origin, so parking outside the orbit would frame the unlit hemisphere.

`CameraController`'s `useFrame` runs at priority `-2`, ahead of Drei's
`controls.update()` at `-1`, so the pivot is current when OrbitControls re-derives its
spherical offset and does its `lookAt` in the same frame.

### Other deliberate deviations

Two related non-physical choices:

- The Sun is held at ~2x Jupiter's radius (true ratio is ~10x) so it does not engulf
  Mercury's orbit.
- The sunlight uses `decay={1}` (linear falloff) rather than the physical inverse-square:
  across the compressed 20..134-unit range, true inverse-square is a 45x brightness
  spread no tonemap recovers, while zero falloff lit Neptune like Mercury and read flat.
  Linear gives Mercury ~6.7x Neptune, which the ACES tonemap rolls off gracefully.

---

## Folder & File Structure

Here is a guide to the project's layout:

```text
solar-system-3d/
├── app/
│   ├── layout.tsx         # HTML envelope, Newsreader/JetBrains Mono fonts, global SiteNav
│   ├── page.tsx           # Landing: live CSS orrery, AU scroll rail, planetary ledger, manifest
│   ├── explore/page.tsx   # The simulation: full-screen Scene plus HUD overlays
│   ├── planets/[slug]/page.tsx # Per-planet editorial pages, SSG'd from the simulation data
│   ├── contact/page.tsx   # Static contact page
│   └── globals.css        # Tailwind directives, theme variables, route-entry animation
├── components/
│   ├── Scene.tsx          # R3F Canvas, camera framing, starfield, and the Suspense boundary
│   ├── SolarSystem.tsx    # Maps the planet data to meshes; owns scene lighting
│   ├── Sun.tsx            # Central body, unlit MeshBasicMaterial so it reads as self-luminous
│   ├── Planet.tsx         # Textured sphere positioned at its scaled orbital distance
│   ├── OrbitPath.tsx      # Renders one orbital ring, parameterized by radius
│   ├── PlanetRing.tsx     # Saturn-style ring system; rewrites RingGeometry UVs to be radial
│   ├── Moon.tsx           # A moon orbiting inside its planet's system group
│   ├── useOptionalTexture.ts # Loads a texture, resolving to null rather than throwing
│   ├── cameraFocus.ts     # Pure fly-to/tracking maths, free of React so it can be tested headlessly
│   ├── CameraController.tsx # OrbitControls plus live fly-to-focus on the selected planet
│   ├── FocusFromQuery.tsx # Deep-link bridge: /explore?focus=Mars pre-selects via the store's public action
│   ├── site/
│   │   └── SiteNav.tsx    # Site-wide slide-out navigation with staggered reveal
│   └── ui/
│       ├── PlanetMenu.tsx    # 2D overlay list; selecting a planet drives the camera focus
│       ├── InfoPanel.tsx     # 2D glassmorphic overlay displaying selected planet metadata
│       └── TimeControls.tsx  # 2D overlay controls to adjust simulation speed or pause time
├── data/
│   ├── planets.ts         # Single source of truth: planet/moon config + real display facts
│   └── planetEditorial.ts # Longform prose and display-only stats for the planet pages
├── store/
│   └── useSimulationStore.ts # Zustand global state for camera target, selected planet, time scale, and pause/play
├── public/
│   └── textures/          # Assets folder for textures
│       └── README.md      # Documentation explaining what texture assets are expected here
├── tsconfig.json          # TS configuration containing custom path aliases (@/components, @/data, @/store, etc.)
├── eslint.config.mjs      # ESLint configuration customized for Next.js & React Three Fiber (R3F)
└── .prettierrc            # Prettier styling preferences
```

---

## Texture Assets

**No texture files are required to run the project.** Every body falls back to a solid,
roughly accurate colour when its texture is missing, and logs a `[solar-system]` warning
naming the file it looked for. Drop images into `/public/textures/` as you acquire them —
no code changes needed.

Filenames follow [Solar System Scope's](https://www.solarsystemscope.com/textures/) own
`2k_*` naming so files drop in without renaming. The full list, which bodies are currently
textured, and sourcing links are in the [textures README](public/textures/README.md).

---

## Getting Started

Follow these steps to run the simulation locally:

### 1. Install Dependencies
Run the following command in the project directory to install all package dependencies:
```bash
npm install
```

### 2. Run the Development Server
Start the local server by running:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the running application.

### 3. Build for Production
To build the project for production, run:
```bash
npm run build
```
