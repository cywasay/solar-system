# Planet pages overhaul — art direction and implementation brief

Status: Mercury, Venus, and Earth implemented for review. Pause after Earth; Mars and subsequent planets await the next instruction.
Updated: 8 November 2026

The user authorized implementation on 8 November 2026, starting with Mercury and stopping after each planet for an update. Mercury now has an isolated composition, Barlow Condensed typography, carbon/mineral/bronze colors, directional mask entrances, a keyboard-accessible procedural lighting study, surface/interior/resonance/mission content, and responsive layouts. Other planets remain pending. Existing unrelated landing-page work is preserved.

## 1. Purpose and non-negotiable direction

Thessaris is a personal portfolio expressed through an interest in space. The planet pages should demonstrate the owner's ability to art-direct, design, animate, explain, and engineer sophisticated interactive experiences.

Each of the eight planets must have its own complete visual AND motion identity. A planet-specific color applied to a common template is insufficient. Reusing one entrance, orbit effect, scrolling pattern, hover treatment, or card layout across all eight is also insufficient.

The physical character of each body informs its typography, composition, imagery, surfaces, controls, transitions, pacing, and interaction. For the gas and ice giants, this comes from atmosphere, structure, and dynamics, rather than a fictitious solid surface.

Write substantial, accurate planetary content for an adult audience. Avoid children's-story narration, inflated portfolio claims, filler facts, generic terminal labels, and decorative science jargon. Let the executed experience demonstrate the owner's skills.

## 2. Current implementation and scope

- All eight routes currently use `app/planets/[slug]/page.tsx`.
- Editorial content lives in `data/planetEditorial.ts`.
- Shared simulation facts live in `data/planets.ts`.
- The existing page repeats a title, two paragraphs, a hero statistic, a data grid, simulation links, and adjacent-planet navigation. It contains no planet-image component.
- Existing global fonts include Newsreader, Geist, Geist Mono, and Bebas Neue.
- Scope: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune landing pages.
- Preserve routes, meaningful metadata, simulation deep links, keyboard access, and navigation between planets.
- Preserve the finalized portfolio introduction, Curiosity sculpture, capability sections, and simulation behavior. Scope shared changes carefully so these remain intact.
- Moon landing pages are not included by default. Significant moons can receive substantive sections within their parent planet page.

## 3. What is shared, and what must be individual

Shared foundations: recognizable Thessaris authorship, reliable navigation, readable body copy, accessible control meanings, source attribution, image credits, performance standards, and an understandable route back to the portfolio/simulation.

Individual art direction: page silhouette, hero framing, background treatment, display font and wordmark, spacing rhythm, section arrangements, separators, button appearance, hover/focus expression, image transitions, data presentation, motion timing, and signature interaction.

Shared code may handle observation, reduced-motion preferences, input, loading, or cleanup. That must not dictate an identical visual result. A single route entry can select distinct planet compositions; eight duplicate codebases are unnecessary.

The portfolio's orange is not a mandatory accent on every planet page. Planet palettes govern these experiences. Natural planet textures and scientific imagery retain their intended colors; enhanced-color imagery is labeled.

## 4. Palette and typography proposals

These are art-direction candidates, not measured surface colors or finalized contrast-tested combinations. Accents are not automatically suitable for small text. Test actual foreground/background pairs during implementation.

| Planet | Background | Primary text | Accent | Display-font starting point |
| --- | --- | --- | --- | --- |
| Mercury | Carbon `#111214` | Mineral `#DED9CF` | Pale bronze `#BDA68A` | Barlow Condensed |
| Venus | Burnt umber `#231C12` | Sulfur ivory `#F1E5BE` | Muted gold `#C9B45B` | Fraunces |
| Earth | Chalk `#E9E5DA` | Deep forest `#173C36` | Ocean teal `#326D80` | Newsreader |
| Mars | Basalt `#241815` | Pale sediment `#E7D3B8` | Iron oxide `#BB6247` | Archivo Black |
| Jupiter | Cloud cream `#E8D8BE` | Espresso `#35251F` | Storm brick `#A4523D` | Anybody |
| Saturn | Warm parchment `#EDE4D3` | Brown-black `#27231F` | Antique gold `#A78B5A` | Bodoni Moda |
| Uranus | Frost `#E2EFEB` | Deep teal `#193A40` | Mineral turquoise `#5B9395` | Manrope |
| Neptune | Midnight blue `#101D2C` | Ice blue `#DFECEE` | Atmospheric blue `#6BA7BD` | Syne |

The planet name deserves a custom display treatment. Explore letter width, spacing, weight, selective cuts, occlusion, and composition before accepting the base font unchanged. Keep a semantic, accessible heading. Do not distress body copy or animate paragraphs in ways that impede reading. Confirm font licenses and load only the fonts required by the active experience.

Official specimens: [Barlow Condensed](https://fonts.google.com/specimen/Barlow+Condensed), [Fraunces](https://fonts.google.com/specimen/Fraunces), [Newsreader](https://fonts.google.com/specimen/Newsreader), [Archivo Black](https://fonts.google.com/specimen/Archivo+Black), [Anybody](https://fonts.google.com/specimen/Anybody), [Bodoni Moda](https://fonts.google.com/specimen/Bodoni+Moda), [Manrope](https://fonts.google.com/specimen/Manrope), [Syne](https://fonts.google.com/specimen/Syne).

## 5. Eight complete art and motion directions

### Mercury — cut by light

Character: exposed, mineral, dry, severe, exact.

Composition: closely cropped terrain, deep shadow, sharply lit edges, narrow text measures contrasted with large image fields. Use deliberate divisions and restrained bronze details. The title is compressed and incisive, with occasional purposeful cuts rather than a distressed font.

Motion language: illumination and occlusion. A hard light boundary reveals relief and the title. Content enters through crisp masks with short, decisive easing. Controls respond through an edge lighting up or a precise line extending. No soft drifting haze or springy bounce.

Signature interaction: move a light source across a terrain study to reveal crater relief and long shadows. Identify it as an illustrative lighting study when the geometry is reconstructed.

Content progression: surface and impact record; major basins and scarps; large metallic core and competing formation explanations; rotation/orbit resonance; evidence from spacecraft; unresolved questions.

Reduced/mobile version: discrete accessible illumination steps and static high-quality terrain views. Preserve the contrast and exactness.

### Venus — beauty under pressure

Character: luminous, concealed, dense, oppressive, enveloping.

Composition: an ivory/sulfur cloud opening that deepens toward umber. Layered, soft-edged imagery frames clear reading areas. Fraunces-inspired display lettering should feel full and weighted, with restrained shaping that avoids a playful appearance.

Motion language: concealment, compression, and delayed movement. Atmospheric layers part at different rates. Decorative spacing compresses as the page descends, while text layout remains stable. Controls reveal their state beneath a moving veil rather than bouncing or rotating.

Signature interaction: transition between visible cloud cover and radar-mapped terrain, explaining what each observation reveals. Do not imply radar is an ordinary photograph of the surface.

Content progression: cloud chemistry and atmospheric layers; pressure and greenhouse conditions; radar-observed terrain and volcanism; unusual rotation; lander observations and their limitations; open scientific questions.

Reduced/mobile version: explicit cloud/radar toggles, static layers, and direct section changes. Avoid expensive full-screen blur filters.

### Earth — a living atlas

Character: inhabited, connected, tactile, observable, familiar.

Composition: warm paper, dark green text, ocean accents, generous readable space. Coastlines, horizons, and image boundaries organize the page. Newsreader supports an editorial voice; the planet name has comfortable breathing room.

Motion language: continuity between observations. Registered images dissolve or wipe between aligned views; crops travel across a map without disorienting the reader. Transitions are calm and responsive. Controls behave like choosing a viewing layer, with clear selected states.

Signature interaction: inspect the same region through daylight, cloud, terrain, and nighttime views, using compatible data where available. Explain differences in date, resolution, and processing instead of presenting unrelated imagery as simultaneous observations.

Content progression: interconnected ocean/atmosphere/land systems; geological activity; magnetic environment; the Moon and tides; observation methods; selected changes documented through dated evidence.

Reduced/mobile version: tap-selectable layers with stable registration and concise captions. No mandatory dragging or pointer-only exploration.

### Mars — a landscape that keeps evidence

Character: geological, stratified, dusty, substantial, investigative.

Composition: basalt and sediment alongside restrained rust. Heavy broad display lettering, with selective strata-like interruptions. Terrain panoramas, long elevation sections, and close views of rocks replace a repeated card grid.

Motion language: excavation and displacement. Sections expose underlying strata through deliberate vertical separation. Terrain profiles extend into view, and annotations attach to the landform they describe. Large forms settle firmly, without rubbery overshoot or ambient floating dust everywhere.

Signature interaction: trace a canyon, volcano, or delta to reveal a sourced elevation profile and linked geological evidence. Label exaggerated vertical scales and reconstructed terrain.

Content progression: ancient water evidence; major terrain and elevation; atmosphere and loss processes; polar regions; rover measurements; Phobos and Deimos, distinguishing origin hypotheses from observations.

Reduced/mobile version: selectable profile landmarks and static cross-sections; maintain the feeling of exposing layers.

### Jupiter — organized turbulence

Character: massive, broad, layered, energetic, powerful.

Composition: cloud cream, espresso, and storm brick across broad bands. Expansive, heavy display typography. Let scale and opposing horizontal arrangements carry the identity.

Motion language: counterflow and shear. Adjacent visual bands move at different rates or in opposing directions. A localized vortex introduces the storm study. Headings can arrive in offset bands, then lock into a perfectly readable state. Keep paragraphs stationary.

Signature interaction: move from the visible cloud pattern into a storm cross-section, showing the distinction between observed appearance and inferred depth. The experience should explain the phenomenon, not just animate a swirl.

Content progression: belts and zones; storm structure; interior models; magnetic environment; distinct studies of Io, Europa, Ganymede, and Callisto; spacecraft measurements and remaining uncertainties.

Reduced/mobile version: discrete cross-section states and short, bounded band transitions. Retain high-quality imagery without multiple simultaneous heavy renderers.

### Saturn — precision through proportion

Character: spacious, delicate, balanced, exact, refined.

Composition: warm parchment and dark ink, carefully used gold, one purposeful ring-plane angle. Fine/high-contrast display lettering balanced against generous negative space. Alternate wide panoramas with quiet, narrow passages.

Motion language: changing perspective and controlled alignment. The ring plane approaches edge-on, then opens into its familiar shape. Text is revealed through precise occlusion and clear depth ordering. Controls use fine rules and small positional shifts. Avoid decorative orbit trails inherited from other pages.

Signature interaction: change the ring viewing angle and examine ring divisions. Distinguish illustrative thickness from physically scaled views; explain any necessary exaggeration.

Content progression: ring structure and particles; divisions and interactions; atmosphere and polar hexagon; interior/density; substantial Titan and Enceladus sections; Cassini evidence and open questions, including uncertainty around ring history.

Reduced/mobile version: accessible viewing-angle presets and image sequences. Fine lines remain visible at phone sizes.

### Uranus — a different orientation

Character: pale, spacious, restrained, unfamiliar, quietly off-axis.

Composition: frosted fields, deep teal lettering, selective turquoise, and near-vertical image relationships. Clean open display lettering, explored from Manrope. Large quiet intervals carry the atmosphere without forcing excessive scrolling.

Motion language: axis, balance, and slow orientation change. One major pivot establishes the unusual axial geometry. Subsequent motion travels along that orientation. Paragraphs stay upright; normal scrolling is preserved. Controls change orientation or a small alignment marker, rather than using spinning decoration.

Signature interaction: adjust orbital position to see how axial tilt changes seasonal illumination. State when time or distance is compressed.

Content progression: axial tilt and seasons; atmosphere and color; interior models and thermal questions; faint rings; selected moons; Voyager observations and the limits of existing coverage.

Reduced/mobile version: seasonal position buttons and static illumination states. Avoid rotating the whole viewport or requiring device tilt.

### Neptune — distance with movement beneath it

Character: remote, spacious, tense, atmospheric, intermittently energetic.

Composition: midnight blue space around an intentionally smaller planetary view; ice-colored typography; selective atmospheric blue. Syne provides a starting point for a distinctive, broad name treatment.

Motion language: stillness interrupted by lateral force. A brief, coherent wind-driven displacement introduces a visual, then settles. A signal or observation can propagate across a large composition. Keep this distinct from Jupiter's persistent opposing bands and Venus's layered compression.

Signature interaction: compare atmospheric motion with a measured account of how Neptune was predicted and observed. A mathematical prediction/observation alignment sequence can provide the central narrative, with atmospheric motion as a separate focused study.

Content progression: discovery through prediction; atmosphere and storms; interior and energy questions; Triton and its retrograde orbit; Voyager observations; unresolved questions.

Reduced/mobile version: direct prediction/observation comparisons and short image sequences. Never impose literal multi-hour communication delays on navigation.

Color caveat: distinguish the deep-blue page treatment from natural-color planet imagery. Familiar Voyager portrayals of Neptune were often strongly enhanced. Do not silently recolor natural imagery to match the interface.

## 6. Motion rules across the collection

- Each page gets its own entrance, section-transition logic, microinteraction treatment, pacing, and signature demonstration, derived from the principles above.
- Do not spread every available animation technique across every page. Each effect must belong to that page's physical or editorial idea.
- Meaningful sequences begin when their content is sufficiently visible to watch. Do not consume the animation when only a small edge peeks into view.
- Default: authored entrance sequences play once per document load. Explicit interactive controls may replay or change a state. Re-entering the viewport should not repeatedly restart an entrance.
- Handle sections taller than the viewport without creating an unreachable trigger.
- Preserve scroll control. No forced scrolling, unnecessary long pinning, or a page that rotates under the reader.
- Keep text stable once revealed; no ongoing distortion, scrambling, or pointer-driven paragraph movement.
- Make animation interruptible and input responsive. A click or keyboard action should never wait through a decorative sequence.
- Pause work when offscreen or the tab is hidden. Stop frame loops after finite sequences finish.
- Reduced-motion versions must preserve information and control, with coherent static or discrete alternatives.
- No autoplay audio. Sound is not part of the initial scope.

## 7. Content and scientific integrity

Each page needs a distinctive editorial argument, not the same list of facts with substituted names. Candidate content includes a defining phenomenon, physical structure, particular features, the evidence used to study them, open questions, and a compact reference layer.

Use concise adult prose and explanatory diagrams. Put units, definitions, dates, and attribution beside relevant data. Distinguish solar day from sidereal rotation, radius from diameter, and surface conditions from a stated atmospheric reference level.

Audit existing copy before reusing it. Examples include the distinction between Uranus being discovered with a telescope and being the first planet ever discovered; overly certain origin claims; outdated hard-coded moon counts; and ambiguous claims about a planet's mass relative to “everything else.”

Date quantities that change. Treat proposed formation histories as hypotheses when appropriate. Distinguish measured imagery, enhanced-color imagery, simulations, artistic reconstructions, and illustrative scale. Generated visual assets may support art direction, but must not masquerade as spacecraft evidence.

Primary starting sources:

- [Mercury — NASA](https://science.nasa.gov/mercury/facts/)
- [Venus — NASA](https://science.nasa.gov/venus/venus-facts/)
- [Earth — NASA](https://science.nasa.gov/earth/facts/)
- [Mars — NASA](https://science.nasa.gov/mars/facts/)
- [Jupiter — NASA](https://science.nasa.gov/jupiter/jupiter-facts/)
- [Saturn — NASA](https://science.nasa.gov/saturn/facts/)
- [Uranus — NASA](https://science.nasa.gov/uranus/facts/)
- [Neptune — NASA](https://science.nasa.gov/neptune/neptune-facts/)
- [Uranus/Neptune color research explanation — Oxford](https://www.ox.ac.uk/news/2024-01-05-new-images-reveal-what-neptune-and-uranus-really-look-0)

Verify individual scientific claims against the appropriate sources during content production. This source list is a research starting point, not blanket verification of future copy.

## 8. Performance, accessibility, and implementation boundaries

- Desktop prioritizes visual quality; mobile prioritizes responsiveness while retaining important planetary imagery and textures.
- Use CSS/SVG/image sequences where appropriate. Reserve WebGL for interactions that materially benefit from real 3D.
- Do not allocate a heavy scene for each section or load all eight planets' fonts and media at once.
- Route-specific styles must not leak into the portfolio, simulation, admin, or other planets.
- Controls need keyboard and touch equivalents, meaningful accessible names, visible focus states, and adequate touch targets.
- Keep body copy readable independently of decorative effects. Verify contrast, narrow screens, zoom, layout shifts, and horizontal overflow.
- Preserve meaningful metadata, headings, links, loading fallbacks, and usable content without animation.
- Keep changes reviewable and reversible. Preserve existing work and make checkpoints as implementation proceeds.

## 9. Proposed sequence after authorization

1. Audit content and available imagery for all eight bodies; confirm the architectural separation of their experiences.
2. Develop Mercury, Venus, and Saturn first as three deliberately contrasting visual/motion directions. This is a proposed execution order, not a reduction in scope.
3. Use the results to tune shared navigation, reading comfort, and performance foundations without homogenizing the art direction.
4. Develop Earth, Mars, Jupiter, Uranus, and Neptune around their individual briefs.
5. Verify every route on desktop and mobile, including motion timing, replay, rapid interaction, reduced motion, scientific labels, and simulation links.
6. Present the complete collection and summarize any remaining limitations. Publish/push only within the user's applicable authorization.

## 10. Acceptance criteria

- A cropped view of each page should still reveal a distinct visual identity even without the planet name.
- A short motion recording should reveal a distinct animation identity even without color.
- Each signature interaction teaches something specific about that planet.
- The pages contain substantial sourced material and explicit uncertainty where needed.
- Typography, imagery, motion, layout, and controls feel intentionally designed together.
- The portfolio connection remains clear, while the planet experiences demonstrate genuine design range.
- Existing landing and simulation features continue working.
- Implementation remains on hold until the user explicitly says “go.”


### Mercury header revision
Mercury now opts into a route-specific masthead: an eclipse emblem, condensed wordmark, mineral/bronze controls, compact navigation without numbered labels or Admin, and a matching planet selector. Navigation stays visible during scrolling. Explore keeps the original orbital black-hole choreography and opens the simulation focused on Mercury. Other routes keep their current header until individually redesigned.


### Venus implementation — 8 November 2026

- Separate `VenusPage` composition: pale cloud opening, warm umber atmosphere, Fraunces display type, and sulfur-gold detail.
- Cloud layers part at different speeds during the hero entrance. The observation control lifts a cloud veil to reveal a NASA/JPL radar reconstruction; mobile uses a shorter dissolve. All text remains visible without animation, and reduced-motion disables the effects.
- Content covers atmosphere/pressure, radar mapping and volcanism, sidereal versus solar time, Venera 13, and unanswered questions. Primary references appear in context.
- Uses NASA/JPL's 1024 px Magellan globe with attribution and explicit simulated-color/gap-fill disclosure; cloud texture remains an illustration, not a registered comparison.
- Venus header uses Fraunces, a cloud-band emblem, ivory background, umber controls, matching planet selector, and the preserved Explore black-hole entrance focused on Venus.
- Scroll remains native. No hidden initial content or full-section clipping; mobile observation switching reserves stable copy height.
- TypeScript and targeted lint passed. Desktop section walkthrough and mobile menu/keyboard/observation interaction checked; viewport overflow and scroll-height stability checked.
- Venus checkpoint complete; its page remains unchanged during the Earth implementation below.

### Earth implementation — 8 November 2026

- Separate `EarthPage` composition using warm chalk, forest green, ocean teal, and Newsreader. An editorial atlas rather than another planet-globe hero. Matching Earth masthead and planetary selector preserve the existing black-hole Explore sequence and focus the simulation on Earth.
- Expanded to approximately 1,550 visible words. The central argument is exchange between connected systems. Chapters explain radiative balance, ocean heat storage, plate-motion evidence, fast and slow carbon pathways, magnetic interactions, local tidal response, and satellite sea-level measurement. References are attached to their explanations, with uncertainty and the limits of simplified models made explicit.
- The dated sea-level example covers 1993–2024 and identifies the 2024 annual increase as a specific historical result, not a constant or live value. No fabricated chart or uncited extrapolation.
- Interactive atlas compares geographically aligned January and July 2004 Blue Marble mosaics. A separate 2016 Black Marble layer reveals nighttime light. These are different-date processed observations, never described as simultaneous or live. Dataset credits and original URLs are retained in `public/images/earth/README.md`.
- Motion comes from map observation: a finite hero camera movement, an input-driven seasonal wipe, smoothly reframed regional crops, and a night-light dissolve. No automatic paragraph reveals, scroll hijacking, or perpetual animation. Reduced motion removes movement while retaining controls and imagery.
- Regional presets and the comparison slider support keyboard and touch. Atlas copy reserves space across modes, imagery retains a 2:1 geographic projection on mobile, and scientific diagrams are labeled as schematic.
- Verified desktop and mobile reading layouts, chapter anchors, layer switching, region controls, keyboard slider endpoints, mobile navigation, page-height stability across datasets, and horizontal overflow. TypeScript and targeted lint passed. The preserved black-hole handoff opened the simulation with Earth selected and rendered; the Earth page produced no captured console warnings or errors.
- Mercury and Venus content, design, and interactions were not revised in this step. Stop here for the user's review; Mars is next.
