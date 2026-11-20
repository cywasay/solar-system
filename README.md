# 3D Solar System Simulation

An interactive 3D solar system simulation built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Three.js**, **React Three Fiber (R3F)**, **Drei**, and **Zustand** for state management.

## Current status: animated scene

All eight planets revolve around the Sun and spin on their own tilted axes, with working
camera controls (drag to rotate, scroll to zoom, right-drag to pan) and pause / speed
controls. Around the simulation sits a landing page, per-planet pages, a contact form, and
an admin console (see [Backend & admin](#backend--admin) below).

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
- Pause/play and a 0.1x–5x time-speed multiplier (`TimeControls`), read by every planet
  and moon's `useFrame`. The per-frame wall-clock delta is clamped *before* the speed is
  applied, so the slider stays linear even at low frame rates

Not yet implemented:

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
│   ├── contact/page.tsx   # Contact page (ContactForm → /api/contact)
│   ├── admin/             # Admin console: dashboard, messages inbox, settings
│   ├── api/
│   │   ├── contact/route.ts         # Public: validate, throttle, save, notify owner
│   │   └── admin/
│   │       ├── session/route.ts     # POST password → session cookie; DELETE signs out
│   │       ├── messages/route.ts    # GET inbox, PATCH status (session required)
│   │       └── reply/route.ts       # POST reply email + record it (session required)
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
│   ├── admin/             # AdminProvider (session + inbox cache), ProtectedShell (lock screen), UI kit
│   ├── contact/ContactForm.tsx # Contact form, with a hidden honeypot field for bots
│   └── ui/
│       ├── PlanetMenu.tsx    # 2D overlay list; selecting a planet drives the camera focus
│       ├── InfoPanel.tsx     # 2D glassmorphic overlay displaying selected planet metadata
│       └── TimeControls.tsx  # 2D overlay controls to adjust simulation speed or pause time
├── data/
│   ├── planets.ts         # Single source of truth: planet/moon config + real display facts
│   └── planetEditorial.ts # Longform prose and display-only stats for the planet pages
├── store/
│   └── useSimulationStore.ts # Zustand global state for camera target, selected planet, time scale, and pause/play
├── lib/
│   ├── db.ts              # Lazily constructed Prisma client (Neon adapter), so builds need no DATABASE_URL
│   ├── adminAuth.ts       # Password check + signed session cookies
│   ├── rateLimit.ts       # In-memory per-IP throttle used by login and the contact form
│   ├── contactLimits.ts   # Field length limits shared by the form and the API
│   └── resend.ts          # Opt-in email (owner notifications, admin replies), HTML-escaped
├── prisma/schema.prisma   # ContactMessage model
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

## Backend & admin

Contact submissions are stored in Neon Postgres via Prisma and, optionally, emailed to the
site owner through Resend. `/admin` is a single-user console for reading and replying to them.

### Environment variables

Put these in `.env.local` for development and in the Vercel project settings for production.
[`.env.example`](.env.example) lists every variable with generation commands.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon Postgres connection string |
| `ADMIN_PASSWORD` | for `/admin` | At least 12 characters. There is **no default**: without it (or with the old published `admin123secret`) admin sign-in is refused |
| `ADMIN_SESSION_SECRET` | recommended | Long random string mixed into session signing, so a stolen cookie can't be used to brute-force the password offline |
| `RESEND_API_KEY` | no | Turns email on. Without it no email is sent (see "Replying" below) |
| `CONTACT_NOTIFY_EMAIL` | no | Where new-message notifications go |
| `RESEND_FROM_EMAIL` | for replies | Sender address on a domain you've verified in Resend. The default `onboarding@resend.dev` is Resend's test sender and can only email the account owner, so **customer replies are rejected** until this is set |
| `TRUST_PROXY` | no | Set to `1` only behind your own reverse proxy that overwrites `x-forwarded-for` (Vercel is trusted automatically). See "Contact form protections" |

### Replying to messages

A message is marked **Replied** only when the email was actually sent. If it can't be (email
not configured, or Resend rejects it), nothing is recorded and the admin console shows the
real reason. It then offers **Mark replied without emailing** for the case where you answer
by another channel — an explicit choice, never a silent default. Reply drafts are kept per
message, so text typed for one person can't be sent to another.

### Security headers

`next.config.ts` sends a CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy` and COOP on every response, `no-store` on
`/api/admin/*`, and `noindex` on `/admin`. The framework header is removed. The CSP allows
inline scripts and styles because a nonce-based policy would force every page to render
dynamically and drop the statically generated planet pages; it still blocks third-party
scripts, framing, `<base>` hijacking and cross-origin form posts. If you add a third-party
script, image or API host, add it to the policy there or it will be blocked.

### How admin auth works

- The lock screen posts the password once to `POST /api/admin/session`. The comparison is
  constant-time, and an IP gets 5 failed attempts per 15 minutes.
- On success the server sets `thessaris_admin_session`: a signed, `httpOnly`,
  `SameSite=Strict` cookie, scoped to `/api/admin`, that expires after 12 hours. The
  password is never stored in the browser, and page scripts can't read the cookie.
- The signing key is derived from `ADMIN_PASSWORD`, so **changing the password signs every
  session out**. Sessions are stateless, so that is also the only way to revoke one early.
- To change the password, update the variable and redeploy. There is no in-app password
  change, because the password lives in the server environment.

### Contact form protections

`/api/contact` type-checks and length-limits every field (`lib/contactLimits.ts`, shared
with the form's `maxLength`), validates the email shape, silently drops submissions that
fill the hidden honeypot field, and allows 5 requests per IP per 10 minutes. Errors returned
to the browser are generic, and full detail is only written to the server log. Every value
is HTML-escaped before it is inserted into an email.

**Caveats:**

- Both throttles live in server memory. On serverless hosting they reset on cold starts and
  aren't shared between instances, so the real ceiling is the limit times the number of warm
  instances. They stop one client hammering the site, not a distributed attack. A shared
  store such as Upstash Redis is the upgrade path; until then the 12+ character admin
  password is what actually protects login.
- Limits key on the client IP, but `x-forwarded-for` is only believed on Vercel (or with
  `TRUST_PROXY=1`), because any client can send that header. Anywhere else all visitors
  share **one** bucket: spoofed headers can't dodge the limit, but anyone who fails five
  logins also locks the real admin out for 15 minutes, and the contact form allows five
  submissions per 10 minutes in total.

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
