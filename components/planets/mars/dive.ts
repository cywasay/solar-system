import * as THREE from 'three';
import { SCARP, SITES, WORLD, heightAt } from './terrain';
import { SKY_FRAGMENT, SKY_VERTEX, TERRAIN_FRAGMENT, TERRAIN_VERTEX } from './shaders';
import {
  GLOBE_FRAGMENT, GLOBE_VERTEX, HALO_FRAGMENT, MACRO_FRAGMENT, MACRO_VERTEX, PATCH_FRAGMENT, STAR_FRAGMENT, STAR_VERTEX,
} from './diveShaders';
import { STAGES, widthMeters } from './diveScale';

/**
 * "From orbit to grain": one scroll value drives a single unbroken dive.
 *   space pass  : the planet, then a Viking mosaic laid on it, descending to the canyon
 *   ground pass : the generated landscape from above, a flight to the outcrop, then a fullscreen
 *                 shader that builds the rock live from layers down to sand and hematite spheres
 * The two passes sit on two canvases and crossfade in CSS (opacity only). Nothing is drawn when
 * the page is off screen or nothing has moved.
 */

export type MarsDive = {
  setProgress: (p: number) => void;
  setActive: (on: boolean) => void;
  resize: () => void;
  dispose: () => void;
};

export type DiveEvents = {
  /** The progress actually shown (smoothed, or snapped when motion is reduced). */
  onFrame: (p: number) => void;
};

// A valid (empty) shadow texture, so the terrain shader's shadow sampler is never unbound.
const emptyShadow = new THREE.DepthTexture(1, 1);
emptyShadow.compareFunction = THREE.LessEqualCompare;
emptyShadow.needsUpdate = true;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// Where the dive lands: Valles Marineris, as the field journal places it.
const TARGET_LAT = -13.9;
const TARGET_LON = -59.2;
// The Viking mosaic's extent (PIA00422): 0° to 20° S, 102.5° W to 45° W, Mercator.
const MOSAIC = { lat0: 0, lat1: -20, lon0: -102.5, lon1: -45 };

const rad = THREE.MathUtils.degToRad;
const direction = (lat: number, lon: number, r = 1) =>
  new THREE.Vector3(r * Math.cos(rad(lat)) * Math.cos(rad(lon)), r * Math.sin(rad(lat)), -r * Math.cos(rad(lat)) * Math.sin(rad(lon)));
const mercator = (deg: number) => Math.log(Math.tan(Math.PI / 4 + rad(deg) / 2));

// Ground flight, in the landscape's own units (1 unit = 1 m). North is -z.
type Key = { pos: [number, number, number]; target: [number, number, number] };
const FLIGHT: Key[] = [
  { pos: [0, 330, 40], target: [0, 0, -20] }, // straight down on the whole landscape
  { pos: [-30, 150, 215], target: [-30, 5, 125] }, // tipping forward over the canyon
  { pos: [-150, 30, 165], target: [-40, 4, 128] }, // skimming along its rim
  { pos: [-20, 22, 62], target: [60, 6, -40] }, // across the plain
  { pos: [58, 5.2, -41], target: [58, 6, -52] }, // arriving at the layered face
];
const GROUND_FROM = 0.3;
const GROUND_TO = 0.7;
const MACRO_FROM = 0.665;
const MACRO_FULL = 0.745;

export async function createMarsDive(
  canvases: { space: HTMLCanvasElement; ground: HTMLCanvasElement },
  events: DiveEvents,
  options: { lite: boolean; reduced: boolean; cancelled: () => boolean },
): Promise<MarsDive> {
  const dpr = Math.min(window.devicePixelRatio || 1, options.lite ? 1 : 1.5);

  // Textures first: if the page already unmounted (React Strict Mode mounts twice in dev), stop
  // before touching the canvases, which the second mount is about to use.
  const loader = new THREE.TextureLoader();
  const [globeMap, mosaicMap] = await Promise.all([
    loader.loadAsync('/textures/2k_mars.jpg'),
    loader.loadAsync('/images/mars/valles-marineris.jpg'),
  ]);
  if (options.cancelled()) {
    globeMap.dispose();
    mosaicMap.dispose();
    throw new Error('cancelled');
  }

  // Space pass ----------------------------------------------------------------
  const space = new THREE.WebGLRenderer({ canvas: canvases.space, antialias: !options.lite, powerPreference: 'high-performance' });
  space.setPixelRatio(dpr);
  space.setClearColor(0x000000, 1);
  const spaceScene = new THREE.Scene();
  const spaceCam = new THREE.PerspectiveCamera(40, 1, 0.01, 300);

  const anisotropy = Math.min(8, space.capabilities.getMaxAnisotropy());
  for (const map of [globeMap, mosaicMap]) {
    map.anisotropy = anisotropy;
    map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
  }
  globeMap.wrapS = THREE.RepeatWrapping;

  const surface = direction(TARGET_LAT, TARGET_LON);
  const north = new THREE.Vector3(0, 1, 0).addScaledVector(surface, -surface.y).normalize();
  const east = new THREE.Vector3().crossVectors(north, surface).normalize();
  const sun = surface.clone().addScaledVector(east, 0.55).addScaledVector(north, 0.22).normalize();

  const planet = new THREE.Group();
  const globeSegments = options.lite ? [64, 32] : [128, 64];
  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(1, globeSegments[0], globeSegments[1]),
    new THREE.ShaderMaterial({ uniforms: { uMap: { value: globeMap }, uSun: { value: sun } }, vertexShader: GLOBE_VERTEX, fragmentShader: GLOBE_FRAGMENT }),
  );
  planet.add(globe);

  // The mosaic, draped on the sphere at its true latitude and longitude.
  const GX = options.lite ? 48 : 80;
  const GY = options.lite ? 18 : 30;
  const patchPositions: number[] = [];
  const patchUv: number[] = [];
  const patchIndex: number[] = [];
  const mercEnd = mercator(MOSAIC.lat1);
  for (let j = 0; j <= GY; j++) {
    const t = j / GY;
    // Even steps in the mosaic's own (Mercator) rows.
    const lat = (Math.atan(Math.sinh(mercEnd * t)) * 180) / Math.PI;
    for (let i = 0; i <= GX; i++) {
      const u = i / GX;
      const lon = MOSAIC.lon0 + (MOSAIC.lon1 - MOSAIC.lon0) * u;
      const point = direction(lat, lon, 1.0007);
      patchPositions.push(point.x, point.y, point.z);
      patchUv.push(u, 1 - t);
    }
  }
  for (let j = 0; j < GY; j++) {
    for (let i = 0; i < GX; i++) {
      const a = j * (GX + 1) + i;
      const b = a + 1;
      const c = a + GX + 1;
      const d = c + 1;
      patchIndex.push(a, c, b, b, c, d);
    }
  }
  const patchGeometry = new THREE.BufferGeometry();
  patchGeometry.setAttribute('position', new THREE.Float32BufferAttribute(patchPositions, 3));
  patchGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(patchUv, 2));
  patchGeometry.setIndex(patchIndex);
  // Sphere normals are the positions themselves.
  patchGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(patchPositions.map((v) => v / 1.0007), 3));
  const patchUniforms = { uMap: { value: mosaicMap }, uSun: { value: sun }, uAlpha: { value: 0 }, uDetail: { value: 0 } };
  const patch = new THREE.Mesh(
    patchGeometry,
    new THREE.ShaderMaterial({ uniforms: patchUniforms, vertexShader: GLOBE_VERTEX, fragmentShader: PATCH_FRAGMENT, transparent: true, depthWrite: false }),
  );
  planet.add(patch);
  spaceScene.add(planet);

  const haloUniforms = { uSun: { value: sun }, uAlpha: { value: 1 } };
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(1.07, 64, 32),
    new THREE.ShaderMaterial({ uniforms: haloUniforms, vertexShader: GLOBE_VERTEX, fragmentShader: HALO_FRAGMENT, side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  spaceScene.add(halo);

  const STARS = options.lite ? 700 : 1500;
  const starPositions = new Float32Array(STARS * 3);
  const starSizes = new Float32Array(STARS);
  for (let i = 0; i < STARS; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(120);
    starPositions.set([v.x, v.y, v.z], i * 3);
    starSizes[i] = 1.2 + Math.random() * 2.2;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeometry.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1));
  const starUniforms = { uAlpha: { value: 1 } };
  const stars = new THREE.Points(
    starGeometry,
    new THREE.ShaderMaterial({ uniforms: starUniforms, vertexShader: STAR_VERTEX, fragmentShader: STAR_FRAGMENT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  spaceScene.add(stars);

  // Ground pass: built when first needed ---------------------------------------
  type Ground = {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    terrain: THREE.Mesh;
    sky: THREE.Mesh;
    terrainUniforms: Record<string, THREE.IUniform>;
    skyUniforms: Record<string, THREE.IUniform>;
    macroScene: THREE.Scene;
    macroCamera: THREE.OrthographicCamera;
    macroUniforms: Record<string, THREE.IUniform>;
    positionCurve: THREE.CatmullRomCurve3;
    targetCurve: THREE.CatmullRomCurve3;
    disposables: { dispose: () => void }[];
  };
  let ground: Ground | null = null;

  const buildGround = (): Ground => {
    const renderer = new THREE.WebGLRenderer({ canvas: canvases.ground, antialias: !options.lite, powerPreference: 'high-performance' });
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x1b120e, 1);
    renderer.autoClear = false;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 2400);

    const segments = options.lite ? 120 : 200;
    const geometry = new THREE.PlaneGeometry(WORLD, WORLD, segments, segments);
    geometry.rotateX(-Math.PI / 2);
    const positions = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < positions.count; i++) positions.setY(i, heightAt(positions.getX(i), positions.getZ(i)));
    geometry.computeVertexNormals();

    // The same terrain shader the drivable world uses, with the driving-only parts parked.
    const blackTrack = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
    blackTrack.needsUpdate = true;
    const sunDir = new THREE.Vector3(0.35, 0.6, 0.7).normalize();
    const terrainUniforms: Record<string, THREE.IUniform> = {
      uSun: { value: sunDir },
      uSunColor: { value: new THREE.Color(1.05, 0.9, 0.74) },
      uAmbient: { value: new THREE.Color(0.4, 0.3, 0.24) },
      uFog: { value: new THREE.Color(0.86, 0.66, 0.46) },
      uFogNear: { value: 2000 },
      uFogFar: { value: 4000 },
      uTracks: { value: blackTrack },
      uScarpTop: { value: heightAt(SCARP.x, SCARP.z - 10) - 1.6 },
      uFan: { value: 1 },
      uRover: { value: new THREE.Vector3(1e5, 0, 1e5) },
      uRoverDir: { value: new THREE.Vector3(0, 0, 1) },
      uNight: { value: 0 },
      uSites: { value: SITES.map((site) => new THREE.Vector4(site.x, site.z, site.radius, 2)) },
      uTime: { value: 0 },
      uShadowMap: { value: emptyShadow },
      uShadowMatrix: { value: new THREE.Matrix4() },
      uShadowTexel: { value: 0.001 },
      uShadowOn: { value: 0 },
    };
    const terrainMaterial = new THREE.ShaderMaterial({ uniforms: terrainUniforms, vertexShader: TERRAIN_VERTEX, fragmentShader: TERRAIN_FRAGMENT });
    const terrain = new THREE.Mesh(geometry, terrainMaterial);
    scene.add(terrain);

    const skyUniforms: Record<string, THREE.IUniform> = { uSun: { value: sunDir }, uDay: { value: 1 } };
    const skyGeometry = new THREE.SphereGeometry(1100, 32, 16);
    const skyMaterial = new THREE.ShaderMaterial({ uniforms: skyUniforms, vertexShader: SKY_VERTEX, fragmentShader: SKY_FRAGMENT, side: THREE.BackSide, depthWrite: false, fog: false });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);

    const macroUniforms: Record<string, THREE.IUniform> = {
      uW: { value: 10 },
      uRes: { value: new THREE.Vector2(1280, 720) },
      uAlpha: { value: 0 },
      uBerry: { value: 0 },
      uSand: { value: 0 },
    };
    const macroGeometry = new THREE.PlaneGeometry(2, 2);
    const macroMaterial = new THREE.ShaderMaterial({ uniforms: macroUniforms, vertexShader: MACRO_VERTEX, fragmentShader: MACRO_FRAGMENT, transparent: true, depthTest: false, depthWrite: false });
    const macroScene = new THREE.Scene();
    macroScene.add(new THREE.Mesh(macroGeometry, macroMaterial));

    return {
      renderer, scene, camera, terrain, sky, terrainUniforms, skyUniforms, macroScene,
      macroCamera: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), macroUniforms,
      positionCurve: new THREE.CatmullRomCurve3(FLIGHT.map((key) => new THREE.Vector3(...key.pos)), false, 'centripetal'),
      targetCurve: new THREE.CatmullRomCurve3(FLIGHT.map((key) => new THREE.Vector3(...key.target)), false, 'centripetal'),
      disposables: [geometry, terrainMaterial, blackTrack, skyGeometry, skyMaterial, macroGeometry, macroMaterial],
    };
  };

  // Sizing -----------------------------------------------------------------------
  let width = 1;
  let height = 1;
  const resize = () => {
    const rect = canvases.space.parentElement?.getBoundingClientRect();
    width = Math.max(1, Math.round(rect?.width ?? canvases.space.clientWidth));
    height = Math.max(1, Math.round(rect?.height ?? canvases.space.clientHeight));
    space.setSize(width, height, false);
    spaceCam.aspect = width / height;
    spaceCam.updateProjectionMatrix();
    if (ground) {
      ground.renderer.setSize(width, height, false);
      ground.camera.aspect = width / height;
      ground.camera.updateProjectionMatrix();
      ground.macroUniforms.uRes.value.set(width * dpr, height * dpr);
    }
    dirty = true;
    kick();
  };

  // Per-frame ------------------------------------------------------------------------
  let target = 0;
  let shown = 0;
  let active = false;
  let dirty = true;
  let raf = 0;
  let last = 0;
  let elapsed = 0;
  let disposed = false;
  const lookTarget = new THREE.Vector3();
  const point = new THREE.Vector3();

  const renderSpace = (p: number) => {
    const e = easeInOutCubic(clamp01((p - 0.06) / 0.26));
    const dist = Math.exp(THREE.MathUtils.lerp(Math.log(3.3), Math.log(1.1), e));
    spaceCam.position.copy(surface).multiplyScalar(dist);
    spaceCam.up.copy(north);
    spaceCam.lookAt(0, 0, 0);

    const settle = 1 - smooth(0.02, 0.24, p);
    planet.rotation.y = (2.6 + elapsed * 0.05) * settle;
    patchUniforms.uAlpha.value = smooth(2.4, 1.5, dist);
    patchUniforms.uDetail.value = smooth(1.7, 1.1, dist) * 0.55;
    haloUniforms.uAlpha.value = smooth(1.3, 2.2, dist);
    starUniforms.uAlpha.value = smooth(1.5, 2.6, dist);
    space.render(spaceScene, spaceCam);
  };

  const renderGround = (p: number) => {
    const g = ground!;
    const flight = clamp01((p - GROUND_FROM) / (GROUND_TO - GROUND_FROM));
    g.positionCurve.getPoint(flight, point);
    g.targetCurve.getPoint(flight, lookTarget);
    point.y = Math.max(point.y, heightAt(point.x, point.z) + 1.3);
    g.camera.position.copy(point);
    // Straight down at the start (north up), levelling to a normal horizon as it tips forward.
    const level = smooth(0.0, 0.3, flight);
    g.camera.up.set(0, level, -(1 - level)).normalize();
    g.camera.lookAt(lookTarget);

    const high = smooth(80, 300, point.y);
    g.terrainUniforms.uFogNear.value = THREE.MathUtils.lerp(140, 2000, high);
    g.terrainUniforms.uFogFar.value = THREE.MathUtils.lerp(520, 4000, high);
    g.sky.position.copy(point);

    const macro = smooth(MACRO_FROM, MACRO_FULL, p);
    g.macroUniforms.uAlpha.value = macro;
    g.macroUniforms.uW.value = widthMeters(p);
    g.macroUniforms.uBerry.value = smooth(0.86, 0.91, p);
    g.macroUniforms.uSand.value = smooth(0.84, 0.93, p);

    g.renderer.clear();
    const showTerrain = macro < 0.999;
    g.terrain.visible = showTerrain;
    g.sky.visible = showTerrain;
    if (showTerrain) g.renderer.render(g.scene, g.camera);
    if (macro > 0.001) {
      g.renderer.clearDepth();
      g.renderer.render(g.macroScene, g.macroCamera);
    }
  };

  const render = (p: number) => {
    const groundOpacity = smooth(GROUND_FROM, 0.37, p);
    const spaceVisible = p < 0.385;
    if (groundOpacity > 0.001 && !ground) {
      ground = buildGround();
      ground.renderer.setSize(width, height, false);
      ground.camera.aspect = width / height;
      ground.camera.updateProjectionMatrix();
      ground.macroUniforms.uRes.value.set(width * dpr, height * dpr);
    }
    canvases.ground.style.opacity = String(groundOpacity);
    canvases.space.style.opacity = spaceVisible ? '1' : '0';
    if (spaceVisible) renderSpace(p);
    if (ground && groundOpacity > 0.001) renderGround(p);
  };

  const snap = (p: number) => {
    if (!options.reduced) return p;
    let best = STAGES[0].still;
    for (const stage of STAGES) if (Math.abs(stage.still - p) < Math.abs(best - p)) best = stage.still;
    return best;
  };

  const tick = (now: number) => {
    raf = 0;
    if (disposed || !active || document.hidden) return;
    const dt = Math.min(0.1, (now - (last || now)) / 1000);
    last = now;
    elapsed += dt;
    const goal = snap(target);
    shown = options.reduced ? goal : shown + (goal - shown) * (1 - Math.exp(-dt * 9));
    if (Math.abs(goal - shown) < 1e-4) shown = goal;
    const moving = shown !== lastShown;
    const idleSpin = !options.reduced && shown < 0.24;
    if (moving || idleSpin || dirty) {
      lastShown = shown;
      dirty = false;
      render(shown);
      events.onFrame(shown);
    }
    // Keep the loop alive while moving or spinning; otherwise sleep until the next scroll.
    if (moving || idleSpin || Math.abs(goal - shown) > 1e-4) raf = requestAnimationFrame(tick);
    else last = 0;
  };
  let lastShown = -1;

  function kick() {
    if (!raf && active && !disposed) raf = requestAnimationFrame(tick);
  }

  const onVisibility = () => { if (!document.hidden) { last = 0; kick(); } };
  document.addEventListener('visibilitychange', onVisibility);

  const api: MarsDive = {
    setProgress(p) {
      target = clamp01(p);
      kick();
    },
    setActive(on) {
      active = on;
      if (on) { last = 0; dirty = true; kick(); }
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    },
    resize,
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      for (const mesh of [globe, patch, halo, stars]) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
      globeMap.dispose();
      mosaicMap.dispose();
      space.dispose();
      if (ground) {
        ground.disposables.forEach((item) => item.dispose());
        ground.renderer.dispose();
      }
    },
  };

  if (process.env.NODE_ENV === 'development') {
    // Dev-only probe for checking frames.
    (window as unknown as Record<string, unknown>).__dive = {
      draw: (p: number) => { render(p); events.onFrame(p); },
      pixel: (x: number, y: number, which: 'space' | 'ground') => {
        const gl = (which === 'space' ? space : ground?.renderer)?.getContext();
        if (!gl) return null;
        const out = new Uint8Array(4);
        gl.readPixels(Math.round(x), Math.round(y), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, out);
        return Array.from(out);
      },
      info: () => ({ width, height, dpr }),
    };
  }

  resize();
  return api;
}
