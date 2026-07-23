# Planet Textures

Filenames follow **Solar System Scope's** own naming (`2k_*`), so files can be dropped in
straight from their download without renaming. `data/planets.ts` is the source of truth —
if you change a filename, change it there.

**The app runs without any of these.** Each body falls back to a solid, roughly accurate
colour when its texture is missing, and logs a `[solar-system]` warning to the browser
console naming the file it looked for.

## Base colour maps

| File | Body | Status | Fallback colour |
| --- | --- | --- | --- |
| `2k_sun.jpg` | Sun | **missing** | `#fdb813` amber |
| `2k_mercury.jpg` | Mercury | present | `#8c8a85` grey |
| `2k_venus_surface.jpg` | Venus | present | `#e6cc9e` pale cream |
| `2k_earth_daymap.jpg` | Earth | present | `#4f7fbf` blue |
| `2k_mars.jpg` | Mars | present | `#c1440e` rust |
| `2k_jupiter.jpg` | Jupiter | **missing** | `#d8ca9d` banded tan |
| `2k_saturn.jpg` | Saturn | present | `#ead6b8` pale gold |
| `2k_uranus.jpg` | Uranus | present | `#9ee3e8` pale cyan |
| `2k_neptune.jpg` | Neptune | present | `#3f54ba` deep blue |

## Normal maps (wired up, files not yet present)

The material pipeline supports an optional tangent-space normal map per planet. These two
paths are referenced from `data/planets.ts` and resolve automatically once the files
appear — until then the planets simply render without surface relief:

| File | Body | Status |
| --- | --- | --- |
| `2k_earth_normal_map.jpg` | Earth | **missing** |
| `2k_mars_normal_map.jpg` | Mars | **missing** |

Two format warnings:

- **Solar System Scope ships its normal maps as `.tif`, which browsers cannot decode.**
  Convert to JPG or PNG before dropping them in, or source JPG versions elsewhere.
- Normal maps are **data textures, not colour**: they are loaded linear and never tagged
  sRGB. Export them raw — do not run them through colour-managed export presets.

## Present but deliberately not wired up

These files are staged here and referenced by nothing. Each needs geometry that does not
exist yet, so adding them to a `map` prop would be wrong:

- `2k_venus_atmosphere.jpg` — Venus's opaque cloud deck. Needs its own slightly larger
  translucent sphere; it is not a surface albedo map.
- `2k_saturn_ring_alpha.png` — ring strip, 2048x125 with alpha. Needs ring geometry
  (a flat annulus with radial UVs), not a sphere.

## Not yet supported

Nothing reads these, so adding them has no effect: specular or roughness maps,
night-lights maps, cloud maps for Earth, moon textures, and skybox images. The starfield
is generated procedurally by Drei's `<Stars />`, so no space texture is used.

## Format notes

- Equirectangular projection, 2:1 aspect (2048x1024 for the 2K set) — what a UV sphere
  expects. Ring strips are the exception and are not equirectangular.
- `.jpg` for opaque surfaces, `.png` only where transparency matters.
- Colour maps are tagged `SRGBColorSpace` on load. Export as standard sRGB, not linear.
- No UV or rotation correction is needed. `SphereGeometry` maps equirectangular textures
  with north at `uv.y = 1` and east increasing with `uv.x`, which is the correct,
  non-mirrored orientation. The prime meridian faces +X at zero rotation.

## Sourcing

- [Solar System Scope](https://www.solarsystemscope.com/textures/) — CC BY 4.0, the set
  this naming convention follows
- [NASA 3D Resources](https://nasa3d.arc.nasa.gov/images) — public domain
- [USGS Astrogeology](https://astrogeology.usgs.gov/search) — public domain
