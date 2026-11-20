import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { loadPerseverance } from './rover';
import { SKY_FRAGMENT, SKY_VERTEX, TERRAIN_FRAGMENT, TERRAIN_VERTEX } from './shaders';
import {
  CRATER, HALF, OUTCROP, SCARP, SITES, START, WORLD,
  canyonZ, classifyHit, heightAt, normalAt,
  type LaserTarget, type SiteId,
} from './terrain';

export type LakePhase = 'dry' | 'filling' | 'draining' | 'evidence';

export type MarsEvents = {
  onProgress: (share: number) => void;
  onReady: () => void;
  onSite: (id: SiteId | null) => void;
  onFound: (id: SiteId) => void;
  onLaser: (target: LaserTarget) => void;
  onLake: (level: number, phase: LakePhase) => void;
  onClock: (lmst: string, daylight: boolean) => void;
};

export type MarsDom = {
  labels: Partial<Record<SiteId, HTMLElement | null>>;
  mapDot: HTMLElement | null;
  /** Speedometer readout and needle, written directly each frame (no React per frame). */
  speedValue?: HTMLElement | null;
  speedNeedle?: HTMLElement | null;
};

export type MarsWorld = {
  engage: () => void;
  /** Leave play: back to the circling preview, all input released. */
  disengage: () => void;
  setStick: (x: number, y: number) => void;
  dismissSite: () => void;
  goTo: (id: SiteId) => void;
  setLakeHold: (on: boolean) => void;
  skipToSunset: () => void;
  dispose: () => void;
};

// A valid (empty) shadow texture for the frames before the first shadow pass has made the real one.
const emptyShadow = new THREE.DepthTexture(1, 1);
emptyShadow.compareFunction = THREE.LessEqualCompare;
emptyShadow.needsUpdate = true;

const SOL_SECONDS = 300; // one simulated sol, in real seconds

function buildRover() {
  const rover = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: '#dcd6cb', roughness: 0.55, metalness: 0.25 });
  const dark = new THREE.MeshStandardMaterial({ color: '#2f2b28', roughness: 0.8 });
  const metal = new THREE.MeshStandardMaterial({ color: '#8a8580', roughness: 0.4, metalness: 0.6 });
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    rover.add(mesh);
    return mesh;
  };
  add(new THREE.BoxGeometry(2.2, 0.55, 3), white, 0, 1.2, 0);
  add(new THREE.BoxGeometry(1.9, 0.12, 2.6), metal, 0, 1.53, 0);
  const rtg = add(new THREE.CylinderGeometry(0.34, 0.34, 1.1, 12), dark, 0, 1.55, -1.6);
  rtg.rotation.x = Math.PI / 2.6;
  add(new THREE.CylinderGeometry(0.07, 0.07, 1.9), metal, 0.7, 2.45, 1.05);
  const head = add(new THREE.BoxGeometry(0.56, 0.34, 0.34), white, 0.7, 3.4, 1.1);
  add(new THREE.BoxGeometry(0.14, 0.1, 0.05), dark, 0.57, 3.42, 1.29);
  add(new THREE.BoxGeometry(0.14, 0.1, 0.05), dark, 0.83, 3.42, 1.29);
  add(new THREE.BoxGeometry(0.08, 0.08, 1.5), metal, -0.7, 1.9, 1.3).rotation.x = -0.5;
  for (const side of [-1, 1]) add(new THREE.BoxGeometry(0.12, 0.14, 2.9), metal, side * 1.32, 0.98, 0);
  const wheels: THREE.Object3D[] = [];
  const tyre = new THREE.CylinderGeometry(0.44, 0.44, 0.36, 18);
  tyre.rotateZ(Math.PI / 2);
  for (const side of [-1, 1]) {
    for (const z of [1.3, 0, -1.3]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * 1.36, 0.44, z);
      const spin = new THREE.Mesh(tyre, dark);
      pivot.add(spin);
      pivot.userData.spin = spin;
      rover.add(pivot);
      wheels.push(pivot);
    }
  }
  return { rover, wheels, head };
}

/**
 * Builds the world into `canvas`. Everything per-frame lives here; React only receives
 * low-rate events (site reached, readings, the clock). The loop runs only while the canvas
 * is on screen and the tab is visible.
 */
export function createMarsWorld(canvas: HTMLCanvasElement, dom: MarsDom, events: MarsEvents, options: { lite: boolean; reduced: boolean }): MarsWorld {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !options.lite, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, options.lite ? 1 : 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, 0.5, 2400);
  scene.fog = new THREE.Fog('#d6a474', 140, 520);
  events.onProgress(0.45);

  // Terrain ----------------------------------------------------------------
  const segments = options.lite ? 150 : 256;
  const terrainGeometry = new THREE.PlaneGeometry(WORLD, WORLD, segments, segments);
  terrainGeometry.rotateX(-Math.PI / 2);
  const positions = terrainGeometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < positions.count; i++) positions.setY(i, heightAt(positions.getX(i), positions.getZ(i)));
  terrainGeometry.computeVertexNormals();

  // The rover rides the drawn mesh, not the smooth function behind it: between vertices the
  // triangles sit slightly above or below heightAt, which is what made wheels sink or float.
  // This reproduces PlaneGeometry's triangulation exactly (each cell split along b-d).
  const grid = segments + 1;
  const cell = WORLD / segments;
  const meshHeights = new Float32Array(positions.count);
  for (let i = 0; i < positions.count; i++) meshHeights[i] = positions.getY(i);
  const surfaceAt = (x: number, z: number) => {
    const fx = Math.min(segments - 1e-4, Math.max(0, (x + HALF) / cell));
    const fz = Math.min(segments - 1e-4, Math.max(0, (z + HALF) / cell));
    const ix = Math.floor(fx);
    const iz = Math.floor(fz);
    const u = fx - ix;
    const v = fz - iz;
    const a = meshHeights[iz * grid + ix];
    const d = meshHeights[iz * grid + ix + 1];
    const b = meshHeights[(iz + 1) * grid + ix];
    const c = meshHeights[(iz + 1) * grid + ix + 1];
    return u + v <= 1 ? a + (d - a) * u + (b - a) * v : c + (b - c) * (1 - u) + (d - c) * (1 - v);
  };
  events.onProgress(0.75);

  const trackCanvas = document.createElement('canvas');
  trackCanvas.width = 1024;
  trackCanvas.height = 1024;
  const trackCtx = trackCanvas.getContext('2d')!;
  trackCtx.fillStyle = '#000';
  trackCtx.fillRect(0, 0, 1024, 1024);
  const tracks = new THREE.CanvasTexture(trackCanvas);

  const scarpTop = heightAt(SCARP.x, SCARP.z - 10) - 1.6;

  // The sun casts one tight shadow map that only the rover renders into, following the rover.
  const SHADOW_SIZE = options.lite ? 512 : 1024;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const sunLight = new THREE.DirectionalLight('#ffe6c8', 2.4);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(SHADOW_SIZE, SHADOW_SIZE);
  Object.assign(sunLight.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 90 });
  sunLight.shadow.camera.updateProjectionMatrix();
  sunLight.shadow.bias = -0.0004;
  sunLight.shadow.normalBias = 0.03;
  sunLight.shadow.intensity = 0.65;

  const terrainUniforms = {
    uSun: { value: new THREE.Vector3(0, 1, 0) },
    uSunColor: { value: new THREE.Color() },
    uAmbient: { value: new THREE.Color() },
    uFog: { value: new THREE.Color() },
    uFogNear: { value: 140 },
    uFogFar: { value: 520 },
    uTracks: { value: tracks },
    uScarpTop: { value: scarpTop },
    uFan: { value: 0 },
    uRover: { value: new THREE.Vector3() },
    uRoverDir: { value: new THREE.Vector3(0, 0, 1) },
    uNight: { value: 0 },
    uSites: { value: SITES.map((site) => new THREE.Vector4(site.x, site.z, site.radius, 0)) },
    uTime: { value: 0 },
    uShadowMap: { value: emptyShadow as THREE.Texture },
    uShadowMatrix: { value: sunLight.shadow.matrix },
    uShadowTexel: { value: 1 / SHADOW_SIZE },
    uShadowOn: { value: 0 },
  };
  const terrain = new THREE.Mesh(terrainGeometry, new THREE.ShaderMaterial({ uniforms: terrainUniforms, vertexShader: TERRAIN_VERTEX, fragmentShader: TERRAIN_FRAGMENT }));
  scene.add(terrain);

  // Sky, Sun, moons ---------------------------------------------------------
  const skyUniforms = { uSun: { value: new THREE.Vector3(0, 1, 0) }, uDay: { value: 1 } };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1100, 32, 16),
    new THREE.ShaderMaterial({ uniforms: skyUniforms, vertexShader: SKY_VERTEX, fragmentShader: SKY_FRAGMENT, side: THREE.BackSide, depthWrite: false, fog: false }),
  );
  scene.add(sky);
  const moonMaterial = new THREE.MeshBasicMaterial({ color: '#8f8378', fog: false });
  const phobos = new THREE.Mesh(new THREE.SphereGeometry(10, 16, 12), moonMaterial);
  const deimos = new THREE.Mesh(new THREE.SphereGeometry(3.6, 12, 8), moonMaterial);
  phobos.scale.set(1.25, 1, 0.9);
  scene.add(phobos, deimos);

  const hemi = new THREE.HemisphereLight('#e8c9a4', '#6b3a24', 0.9);
  scene.add(sunLight, sunLight.target, hemi);

  // Lake --------------------------------------------------------------------
  const floor = heightAt(CRATER.x, CRATER.z);
  const rim = heightAt(CRATER.x, CRATER.z - CRATER.r);
  const lake = new THREE.Mesh(new THREE.CircleGeometry(CRATER.r * 1.02, 72), new THREE.MeshBasicMaterial({ color: '#5d86a8', transparent: true, opacity: 0.84 }));
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(CRATER.x, floor, CRATER.z);
  lake.visible = false;
  scene.add(lake);

  // Rover, dust -------------------------------------------------------------
  // The box rover is a stand-in until the Perseverance model has loaded.
  const standIn = buildRover();
  const rover = standIn.rover;
  let wheels: THREE.Object3D[] = standIn.wheels;
  let head: THREE.Object3D = standIn.head;
  const castShadows = (root: THREE.Object3D) =>
    root.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  castShadows(rover);
  scene.add(rover);

  // Wheel rig for the suspension: rest hub position, side, and slot (0 front, 1 middle, 2 rear).
  type Wheel = { obj: THREE.Object3D; spin: THREE.Object3D; rest: THREE.Vector3; offset: number; side: number; slot: number };
  let rig: Wheel[] = [];
  let wheelRadius = 0.44;
  let restHubY = 0.44;
  let track = 2.7;
  let belly = 0.9;
  const buildRig = (list: THREE.Object3D[], radius: number) => {
    wheelRadius = radius;
    rig = list.map((obj) => ({ obj, spin: (obj.userData.spin as THREE.Object3D | undefined) ?? obj, rest: obj.position.clone(), offset: 0, side: obj.position.x >= 0 ? 1 : -1, slot: 0 }));
    for (const side of [-1, 1]) {
      rig.filter((wheel) => wheel.side === side)
        .sort((a, b) => b.rest.z - a.rest.z)
        .forEach((wheel, index) => { wheel.slot = Math.min(2, index); });
    }
    restHubY = rig.reduce((sum, wheel) => sum + wheel.rest.y, 0) / Math.max(1, rig.length);
    const xs = rig.map((wheel) => wheel.rest.x);
    track = Math.max(...xs) - Math.min(...xs) || 2.7;
    belly = restHubY * 2.1;
  };
  buildRig(wheels, 0.44);
  let disposed = false;
  let modelRequested = false;
  const loadModel = () => {
    if (modelRequested) return;
    modelRequested = true;
    loadPerseverance('/models/perseverance/scene.gltf')
      .then((loaded) => {
        if (disposed) return;
        for (const child of [...rover.children]) {
          rover.remove(child);
          child.traverse((object) => (object as THREE.Mesh).geometry?.dispose());
        }
        castShadows(loaded.group);
        rover.add(loaded.group);
        wheels = loaded.wheels;
        head = loaded.head;
        buildRig(wheels, loaded.wheelRadius);
      })
      .catch(() => { /* keep the stand-in */ });
  };
  // Soft reflections for the rover's metal; the terrain and sky are custom shaders and ignore it.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environment = environment;
  scene.environmentIntensity = 0.55;
  const DUST = options.lite ? 110 : 240;
  const dustPositions = new Float32Array(DUST * 3).fill(-999);
  const dustVelocity = new Float32Array(DUST * 3);
  const dustLife = new Float32Array(DUST);
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  // Soft round puff instead of the default square point.
  const puffCanvas = document.createElement('canvas');
  puffCanvas.width = 64;
  puffCanvas.height = 64;
  const puffCtx = puffCanvas.getContext('2d')!;
  const puffGradient = puffCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
  puffGradient.addColorStop(0, 'rgba(255,255,255,0.9)');
  puffGradient.addColorStop(0.45, 'rgba(255,255,255,0.35)');
  puffGradient.addColorStop(1, 'rgba(255,255,255,0)');
  puffCtx.fillStyle = puffGradient;
  puffCtx.fillRect(0, 0, 64, 64);
  const puff = new THREE.CanvasTexture(puffCanvas);
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: '#d39062', size: 0.95, map: puff, transparent: true, opacity: 0.55, depthWrite: false }));
  dust.frustumCulled = false;
  scene.add(dust);
  let dustCursor = 0;

  // Beacons, laser, target ring -------------------------------------------
  const beacons = SITES.map((site) => {
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 46, 8, 1, true),
      new THREE.MeshBasicMaterial({ color: '#ffb36b', transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
    );
    beam.position.set(site.x, heightAt(site.x, site.z) + 23, site.z);
    scene.add(beam);
    return beam;
  });
  // GTA-style corona: an open cylinder of light at each site's trigger radius, fading upward.
  const coronaMaterial = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color('#ffb860') }, uTime: { value: 0 } },
    vertexShader: `varying float vH; void main() { vH = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 uColor; uniform float uTime; varying float vH;
      void main() { float a = (1.0 - vH) * (1.0 - vH) * (0.42 + 0.12 * sin(uTime * 3.0)); gl_FragColor = vec4(uColor * a, a); }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  });
  const coronas = SITES.map((site) => {
    const material = coronaMaterial.clone();
    const corona = new THREE.Mesh(new THREE.CylinderGeometry(site.radius, site.radius, 3.2, 48, 1, true), material);
    corona.position.set(site.x, heightAt(site.x, site.z) + 1.0, site.z);
    scene.add(corona);
    return corona;
  });
  const laserGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const laser = new THREE.Line(laserGeometry, new THREE.LineBasicMaterial({ color: '#ff4b2b', transparent: true, opacity: 0, fog: false }));
  laser.frustumCulled = false;
  scene.add(laser);
  const sparkGeometry = new THREE.BufferGeometry();
  sparkGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));
  const spark = new THREE.Points(sparkGeometry, new THREE.PointsMaterial({ color: '#ffe6a8', size: 2.4, map: puff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  spark.frustumCulled = false;
  scene.add(spark);
  const pitMaterial = new THREE.MeshBasicMaterial({ color: '#1d0f08', transparent: true, opacity: 0.8, depthWrite: false });
  const pits: THREE.Mesh[] = [];
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.5, 32), new THREE.MeshBasicMaterial({ color: '#ffd09a', transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  scene.add(ring);
  events.onProgress(0.95);

  // State -------------------------------------------------------------------
  const state = {
    x: START.x, z: START.z, yaw: START.yaw, speed: 0, pitch: 0, roll: 0, wheelTurn: 0,
    engaged: false, mode: 'attract' as 'attract' | 'chase' | 'site',
    active: null as SiteId | null, inside: new Set<SiteId>(),
    keys: { up: false, down: false, left: false, right: false },
    stick: { x: 0, y: 0 },
    target: null as { x: number; z: number } | null,
    time: 0.1, timeTarget: null as number | null,
    phobos: 0.6, deimos: 0.35,
    lake: 0, lakeHold: false, lakeFilled: false, fan: 0, lakePhase: 'dry' as LakePhase,
    steer: 0,
    trackStep: 0, tracksDirty: false,
    laserFade: 0,
    openedAt: 0,
    stickArmed: true,
  };
  // GTA-style orbit camera: yaw around the rover, elevation, distance. Mouse or finger drags it,
  // the wheel zooms, and it eases back behind the rover after a moment of driving untouched.
  const cam = { yaw: START.yaw, pitch: 0.38, dist: 13, targetDist: 13, dragging: false, lastLook: -1e9 };
  const camPos = new THREE.Vector3(140, 90, 140);
  const camLook = new THREE.Vector3();
  const desiredPos = new THREE.Vector3();
  const desiredLook = new THREE.Vector3();
  const sunDir = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const fogColour = new THREE.Color();
  let width = 1;
  let height = 1;

  const sitePose = (id: SiteId) => {
    const at = (x: number, z: number, lift: number) => new THREE.Vector3(x, heightAt(x, z) + lift, z);
    switch (id) {
      case 'outcrop': return { pos: at(60, -21, 6), look: new THREE.Vector3(60, heightAt(60, -60) - 5, -50) };
      case 'jezero': return { pos: at(-160, -44, 14), look: new THREE.Vector3(-192, floor + 2, -112) };
      case 'canyon': return { pos: at(10, 66, 10), look: new THREE.Vector3(10, heightAt(10, canyonZ(10)) + 2, canyonZ(10) + 34) };
      case 'ice': return { pos: at(178, -116, 6), look: new THREE.Vector3(178, scarpTop - 3, -151) };
      // Facing the sunset azimuth (the Sun sets to the west, a little north of the ridge).
      default: return { pos: at(225, 64, 4), look: new THREE.Vector3(125, heightAt(225, 60) + 24, 95) };
    }
  };

  // Day, night, moons ---------------------------------------------------------
  const lerp3 = (a: number[], b: number[], k: number) => a.map((v, i) => v + (b[i] - v) * k) as [number, number, number];
  const updateSky = (dt: number) => {
    if (!options.reduced) {
      if (state.timeTarget !== null) {
        const remaining = (state.timeTarget - state.time + 1) % 1;
        const step = Math.min(remaining, dt * 0.12);
        state.time = (state.time + step) % 1;
        if (remaining < 0.002) state.timeTarget = null;
      } else {
        state.time = (state.time + dt / SOL_SECONDS) % 1;
      }
      state.phobos = (state.phobos + dt / (SOL_SECONDS * 0.45)) % 1;
      state.deimos = (state.deimos + dt / (SOL_SECONDS * 5.3)) % 1;
    }
    const angle = state.time * Math.PI * 2;
    sunDir.set(Math.cos(angle), Math.sin(angle), 0.3).normalize();
    const day = THREE.MathUtils.smoothstep(sunDir.y, -0.12, 0.18);
    skyUniforms.uSun.value.copy(sunDir);
    skyUniforms.uDay.value = day;
    terrainUniforms.uSun.value.copy(sunDir);
    terrainUniforms.uSunColor.value.setRGB(...lerp3([0, 0, 0], [1.05, 0.9, 0.74], day));
    terrainUniforms.uAmbient.value.setRGB(...lerp3([0.05, 0.045, 0.065], [0.4, 0.3, 0.24], day));
    fogColour.setRGB(...lerp3([0.06, 0.04, 0.05], [0.86, 0.66, 0.46], day));
    terrainUniforms.uFog.value.copy(fogColour);
    (scene.fog as THREE.Fog).color.copy(fogColour);
    terrainUniforms.uNight.value = 1 - day;
    sunLight.intensity = 2.4 * day;
    // No shadow pass at night; fade the terrain's shadow with the daylight.
    sunLight.shadow.autoUpdate = sunDir.y > -0.04;
    const shadowTexture = sunLight.shadow.map?.depthTexture ?? null;
    terrainUniforms.uShadowMap.value = shadowTexture ?? emptyShadow;
    terrainUniforms.uShadowOn.value = shadowTexture ? THREE.MathUtils.smoothstep(sunDir.y, -0.02, 0.12) : 0;
    hemi.intensity = 0.25 + 0.65 * day;
    // Phobos rises in the west and crosses the sky in hours; Deimos drifts slowly east to west.
    const p = state.phobos * Math.PI * 2;
    phobos.position.set(-Math.cos(p), Math.sin(p) * 0.9, -0.25).normalize().multiplyScalar(720).add(camera.position);
    phobos.visible = Math.sin(p) > -0.05;
    const q = state.deimos * Math.PI * 2;
    deimos.position.set(Math.cos(q), Math.sin(q) * 0.85, 0.32).normalize().multiplyScalar(760).add(camera.position);
    deimos.visible = Math.sin(q) > -0.05;
    sky.position.copy(camera.position);
  };

  // Rover -----------------------------------------------------------------------
  const forward = () => tmp.set(Math.sin(state.yaw), 0, Math.cos(state.yaw));
  const stampTrack = (x: number, z: number) => {
    trackCtx.fillStyle = 'rgba(255,255,255,0.22)';
    const px = (x / WORLD + 0.5) * 1024;
    const pz = (z / WORLD + 0.5) * 1024;
    trackCtx.beginPath();
    trackCtx.arc(px, pz, 0.9, 0, Math.PI * 2);
    trackCtx.fill();
    state.tracksDirty = true;
  };
  const emitDust = (x: number, y: number, z: number, strength: number) => {
    const i = dustCursor;
    dustCursor = (dustCursor + 1) % DUST;
    dustPositions[i * 3] = x + (Math.random() - 0.5) * 0.6;
    dustPositions[i * 3 + 1] = y + 0.2;
    dustPositions[i * 3 + 2] = z + (Math.random() - 0.5) * 0.6;
    dustVelocity[i * 3] = (Math.random() - 0.5) * 1.6;
    dustVelocity[i * 3 + 1] = 0.6 + Math.random() * 1.4 * strength;
    dustVelocity[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
    dustLife[i] = 1.4 + Math.random();
  };

  /**
   * Rocker-bogie suspension. Per side, the middle and rear wheels share a bogie; the bogie and
   * the front wheel share a rocker; a differential bar averages the two rockers into the body's
   * pitch. Body height, pitch, and roll chase that target on damped springs, so the rover sways
   * and settles. Each wheel then finds its own contact within its travel; if the ground asks for
   * more travel than a wheel has, or rises into the belly, the body is lifted, so nothing passes
   * through the terrain.
   */
  const TRAVEL = 0.45;
  const suspension = { y: 0, vy: 0, pitch: 0, vp: 0, roll: 0, vr: 0, lastX: NaN, lastZ: NaN };
  const hubWorld = new THREE.Vector3();
  const settleSuspension = (dt: number) => {
    const cos = Math.cos(state.yaw);
    const sin = Math.sin(state.yaw);
    const contact = (lx: number, lz: number) => surfaceAt(state.x + lx * cos + lz * sin, state.z - lx * sin + lz * cos);
    const sides: { side: number; pivot: number; angle: number }[] = [];
    for (const side of [-1, 1]) {
      const onSide = rig.filter((wheel) => wheel.side === side);
      if (!onSide.length) continue;
      const hubs = onSide.map((wheel) => ({ z: wheel.rest.z, y: contact(wheel.rest.x, wheel.rest.z) + wheelRadius, slot: wheel.slot }));
      const front = hubs.find((h) => h.slot === 0) ?? hubs[0];
      const others = hubs.filter((h) => h !== front);
      const bogieY = others.length ? others.reduce((sum, h) => sum + h.y, 0) / others.length : front.y;
      const bogieZ = others.length ? others.reduce((sum, h) => sum + h.z, 0) / others.length : front.z - 1;
      sides.push({ side, pivot: (front.y + bogieY) / 2, angle: Math.atan2(front.y - bogieY, Math.max(0.5, front.z - bogieZ)) });
    }
    const pivotY = sides.reduce((sum, s) => sum + s.pivot, 0) / Math.max(1, sides.length);
    const plus = sides.find((s) => s.side === 1)?.pivot ?? pivotY;
    const minus = sides.find((s) => s.side === -1)?.pivot ?? pivotY;
    const targetY = pivotY - restHubY;
    const targetPitch = -sides.reduce((sum, s) => sum + s.angle, 0) / Math.max(1, sides.length);
    const targetRoll = Math.atan2(plus - minus, track);

    // Snap on the first frame or after a jump (teleport); otherwise spring towards the target.
    const jumped = !(Math.hypot(state.x - suspension.lastX, state.z - suspension.lastZ) < 5);
    suspension.lastX = state.x;
    suspension.lastZ = state.z;
    if (jumped) {
      Object.assign(suspension, { y: targetY, vy: 0, pitch: targetPitch, vp: 0, roll: targetRoll, vr: 0 });
    } else {
      suspension.vy += ((targetY - suspension.y) * 55 - suspension.vy * 13) * dt;
      suspension.y += suspension.vy * dt;
      suspension.vp += ((targetPitch - suspension.pitch) * 45 - suspension.vp * 12) * dt;
      suspension.pitch += suspension.vp * dt;
      suspension.vr += ((targetRoll - suspension.roll) * 45 - suspension.vr * 12) * dt;
      suspension.roll += suspension.vr * dt;
    }

    const place = () => {
      rover.position.set(state.x, suspension.y, state.z);
      rover.rotation.set(suspension.pitch, state.yaw, suspension.roll, 'YXZ');
      rover.updateMatrixWorld(true);
    };
    place();

    // Wheels slide along the body's own up axis. On a tilted body a world-height gap of h needs
    // h / up.y of travel along that axis, so convert before clamping to the travel limit.
    // Extending a wheel on a tilted body also moves it sideways onto different ground, so the
    // contact offset is refined twice along the real travel direction.
    const m = rover.matrixWorld.elements;
    const ux = m[4];
    const uy = Math.max(0.35, m[5]);
    const uz = m[6];
    let lift = 0;
    const follow = Math.min(1, dt * 30);
    for (const wheel of rig) {
      hubWorld.copy(wheel.rest).applyMatrix4(rover.matrixWorld);
      let need = 0;
      for (let pass = 0; pass < 3; pass++) {
        const hx = hubWorld.x + ux * need;
        const hy = hubWorld.y + uy * need;
        const hz = hubWorld.z + uz * need;
        need += Math.max(-0.6, Math.min(0.6, (surfaceAt(hx, hz) + wheelRadius - hy) / uy));
      }
      const target = Math.max(-TRAVEL, Math.min(TRAVEL, need));
      wheel.offset += (target - wheel.offset) * follow;
      wheel.obj.position.y = wheel.rest.y + wheel.offset;
      // Measure where the tyre really ended up; any real penetration lifts the body.
      hubWorld.set(wheel.rest.x, wheel.rest.y + wheel.offset, wheel.rest.z).applyMatrix4(rover.matrixWorld);
      lift = Math.max(lift, surfaceAt(hubWorld.x, hubWorld.z) + wheelRadius - hubWorld.y);
    }
    // Keep the belly off ridges: test points on the underside where they really are.
    for (const lz of [-1.1, 0, 1.1]) {
      hubWorld.set(0, belly, lz).applyMatrix4(rover.matrixWorld);
      lift = Math.max(lift, surfaceAt(hubWorld.x, hubWorld.z) + 0.05 - hubWorld.y);
    }
    if (lift > 0) {
      suspension.y += lift;
      if (suspension.vy < 0) suspension.vy = 0;
      place();
    }
    state.pitch = suspension.pitch;
    state.roll = suspension.roll;
  };

  // Game speed, not the real rover's: Perseverance tops out near 0.15 km/h.
  const MAX_SPEED = 16;
  const KMH = 0.81 * 3.6; // world units are about 0.81 m (the rover model is ~3 m long)
  let shownSpeed = -1;
  const updateSpeedometer = () => {
    const kmh = Math.abs(state.speed) * KMH;
    const rounded = Math.round(kmh);
    if (dom.speedValue && rounded !== shownSpeed) {
      dom.speedValue.textContent = String(rounded);
      shownSpeed = rounded;
    }
    if (dom.speedNeedle) dom.speedNeedle.style.transform = `rotate(${(-120 + Math.min(1, kmh / 50) * 240).toFixed(1)}deg)`;
  };

  const updateRover = (dt: number) => {
    const driving = state.mode === 'chase';
    let throttle = 0;
    let steer = 0;
    if (driving) {
      throttle = (state.keys.up ? 1 : 0) - (state.keys.down ? 1 : 0) - state.stick.y;
      steer = (state.keys.left ? 1 : 0) - (state.keys.right ? 1 : 0) - state.stick.x;
      if (throttle !== 0 || steer !== 0) {
        state.target = null;
        ring.visible = false;
      } else if (state.target) {
        const dx = state.target.x - state.x;
        const dz = state.target.z - state.z;
        const distance = Math.hypot(dx, dz);
        if (distance < 2.5) {
          state.target = null;
          ring.visible = false;
        } else {
          const wanted = Math.atan2(dx, dz);
          const diff = Math.atan2(Math.sin(wanted - state.yaw), Math.cos(wanted - state.yaw));
          steer = Math.max(-1, Math.min(1, diff * 2.2));
          throttle = Math.abs(diff) > 1.2 ? 0.25 : Math.min(1, distance / 8);
        }
      }
    }
    throttle = Math.max(-1, Math.min(1, throttle));
    steer = Math.max(-1, Math.min(1, steer));

    // Driving on slopes: climbing costs speed, gravity pulls along the grade, brakes hold the
    // rover on gentle slopes when idle, and walls or drops that are too steep stop it gently.
    const dir = forward();
    const ahead = surfaceAt(state.x + dir.x * 1.8, state.z + dir.z * 1.8);
    const behind = surfaceAt(state.x - dir.x * 1.8, state.z - dir.z * 1.8);
    const grade = (ahead - behind) / 3.6;
    const heading = Math.sign(throttle || state.speed);
    const climb = Math.max(0, grade * heading);
    const maxSpeed = MAX_SPEED * (1 - Math.min(0.8, climb * 1.15));
    state.speed += (throttle * maxSpeed - state.speed) * Math.min(1, dt * (throttle ? 1.25 : 1.8));
    state.speed -= grade * 3.4 * dt;
    if (!throttle && Math.abs(state.speed) < 1.4 && Math.abs(grade) < 0.55) state.speed *= Math.max(0, 1 - dt * 6);
    // Steering eases in and out rather than snapping; turn rate tightens a little at speed.
    state.steer += (steer - state.steer) * Math.min(1, dt * 7);
    const turnRate = 1.45 * Math.min(1, 0.3 + Math.abs(state.speed) / 5) / (1 + Math.abs(state.speed) / 30);
    state.yaw += state.steer * dt * turnRate * (state.speed < -0.2 ? -1 : 1);

    const nx = state.x + dir.x * state.speed * dt;
    const nz = state.z + dir.z * state.speed * dt;
    const travel = Math.abs(state.speed * dt);
    const stepGrade = travel > 1e-4 ? (surfaceAt(nx, nz) - surfaceAt(state.x, state.z)) / travel : 0;
    const blocked = stepGrade > 0.9 || stepGrade < -1.3 || Math.max(Math.abs(nx), Math.abs(nz)) > HALF - 40;
    if (blocked) {
      // Too steep: ease to a stop and creep back a little instead of bouncing.
      state.speed = -Math.sign(state.speed) * Math.min(0.8, Math.abs(state.speed) * 0.3);
    } else {
      state.x = nx;
      state.z = nz;
    }

    settleSuspension(dt);
    const y = suspension.y;

    // Every wheel rolls by the distance travelled; the corner wheels steer like Perseverance's
    // (front and rear in opposite directions, middle fixed).
    state.wheelTurn += (state.speed * dt) / wheelRadius;
    const lock = state.steer * 0.45;
    for (const wheel of rig) {
      wheel.spin.rotation.x = state.wheelTurn;
      wheel.obj.rotation.y = wheel.slot === 0 ? lock : wheel.slot === 2 ? -lock : 0;
    }
    updateSpeedometer();

    if (Math.abs(state.speed) > 0.6) {
      const rear = rig.filter((wheel) => wheel.slot === 2).map((wheel) => wheel.rest.clone().applyMatrix4(rover.matrixWorld));
      state.trackStep += travel;
      if (state.trackStep > 0.35) {
        state.trackStep = 0;
        for (const hub of rear) stampTrack(hub.x, hub.z);
      }
      const emits = Math.min(3, Math.abs(state.speed) * dt * 14);
      for (let i = 0; i < emits && rear.length; i++) {
        const hub = rear[Math.floor(Math.random() * rear.length)];
        emitDust(hub.x - dir.x * 0.4, surfaceAt(hub.x, hub.z), hub.z - dir.z * 0.4, Math.abs(state.speed) / 10);
      }
    }
    for (let i = 0; i < DUST; i++) {
      if (dustLife[i] <= 0) continue;
      dustLife[i] -= dt;
      dustVelocity[i * 3 + 1] -= dt * 0.25;
      dustPositions[i * 3] += dustVelocity[i * 3] * dt;
      dustPositions[i * 3 + 1] += dustVelocity[i * 3 + 1] * dt;
      dustPositions[i * 3 + 2] += dustVelocity[i * 3 + 2] * dt;
      if (dustLife[i] <= 0) dustPositions[i * 3 + 1] = -999;
    }
    dustGeometry.attributes.position.needsUpdate = true;

    terrainUniforms.uRover.value.set(state.x, y + 2.2, state.z);
    sunLight.target.position.set(state.x, y, state.z);
    sunLight.position.copy(sunDir).multiplyScalar(45).add(sunLight.target.position);
    terrainUniforms.uRoverDir.value.set(dir.x, -0.18, dir.z).normalize();
    return y;
  };

  // Sites -------------------------------------------------------------------------
  const checkSites = () => {
    if (state.mode === 'attract') return;
    for (const site of SITES) {
      const distance = Math.hypot(state.x - site.x, state.z - site.z);
      // Enter the circle: the popup opens (every time, as in GTA). Leave it to re-arm.
      if (distance < site.radius && !state.inside.has(site.id)) {
        state.inside.add(site.id);
        events.onFound(site.id);
        found.add(site.id);
        if (state.mode === 'chase') openSite(site.id);
      } else if (distance > site.radius + 2.5) {
        state.inside.delete(site.id);
      }
    }
  };
  const found = new Set<SiteId>();
  const openSite = (id: SiteId) => {
    state.mode = 'site';
    state.active = id;
    state.target = null;
    ring.visible = false;
    state.speed = 0;
    state.steer = 0;
    // A held drive key or joystick must not close the popup the instant it opens: auto-repeat
    // and continuous stick events would. Require a fresh press after a short grace period.
    state.openedAt = performance.now();
    state.stickArmed = !(state.stick.x || state.stick.y);
    events.onSite(id);
  };
  const closeSite = () => {
    if (state.mode !== 'site') return;
    state.mode = 'chase';
    state.active = null;
    state.lakeHold = false;
    events.onSite(null);
  };

  // Lake ------------------------------------------------------------------------
  let lakeReported = -1;
  const updateLake = (dt: number) => {
    if (state.lakeHold) {
      state.lake = Math.min(1, state.lake + dt * 0.3);
      state.lakeFilled = true;
      if (state.lake > 0.55) state.fan = Math.min(1, state.fan + dt * 0.22);
    } else {
      state.lake = Math.max(0, state.lake - dt * 0.07);
    }
    lake.visible = state.lake > 0.005;
    lake.position.y = floor + 0.4 + state.lake * (rim - floor) * 0.78;
    terrainUniforms.uFan.value = state.fan;
    const phase: LakePhase = state.lakeHold ? 'filling' : state.lake > 0.005 ? 'draining' : state.lakeFilled && state.fan > 0.05 ? 'evidence' : 'dry';
    const report = Math.round(state.lake * 100);
    if (report !== lakeReported || phase !== state.lakePhase) {
      lakeReported = report;
      state.lakePhase = phase;
      events.onLake(state.lake, phase);
    }
  };

  // Ray against the height field ----------------------------------------------------
  const pointer = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const groundAt = (clientX: number, clientY: number) => {
    const box = canvas.getBoundingClientRect();
    pointer.set(((clientX - box.left) / box.width) * 2 - 1, -((clientY - box.top) / box.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const { origin, direction } = raycaster.ray;
    let t = 1;
    let prev = 0;
    const at = (s: number) => origin.clone().addScaledVector(direction, s);
    for (; t < 420; t += 0.6) {
      const p = at(t);
      if (p.y < heightAt(p.x, p.z)) break;
      prev = t;
    }
    if (t >= 420) return null;
    let lo = prev;
    let hi = t;
    for (let i = 0; i < 8; i++) {
      const mid = (lo + hi) / 2;
      const p = at(mid);
      if (p.y < heightAt(p.x, p.z)) hi = mid;
      else lo = mid;
    }
    return at(hi);
  };

  const fireLaser = (hit: THREE.Vector3) => {
    if (Math.hypot(hit.x - OUTCROP.x, hit.z - OUTCROP.z) > 36) return;
    const origin = head.getWorldPosition(new THREE.Vector3());
    const positionsAttr = laserGeometry.attributes.position as THREE.BufferAttribute;
    positionsAttr.setXYZ(0, origin.x, origin.y, origin.z);
    positionsAttr.setXYZ(1, hit.x, hit.y, hit.z);
    positionsAttr.needsUpdate = true;
    (sparkGeometry.attributes.position as THREE.BufferAttribute).setXYZ(0, hit.x, hit.y, hit.z);
    sparkGeometry.attributes.position.needsUpdate = true;
    state.laserFade = 1;
    const n = normalAt(hit.x, hit.z);
    const pit = new THREE.Mesh(new THREE.CircleGeometry(0.22, 12), pitMaterial);
    pit.position.set(hit.x + n.x * 0.05, hit.y + n.y * 0.05, hit.z + n.z * 0.05);
    pit.lookAt(pit.position.x + n.x, pit.position.y + n.y, pit.position.z + n.z);
    scene.add(pit);
    pits.push(pit);
    if (pits.length > 12) {
      const old = pits.shift()!;
      scene.remove(old);
      old.geometry.dispose();
    }
    events.onLaser(classifyHit(hit.x, hit.y, hit.z));
  };

  // Input -------------------------------------------------------------------------
  const keyMap: Record<string, keyof typeof state.keys> = {
    KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  };
  const typing = () => {
    const el = document.activeElement;
    return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el instanceof HTMLElement && el.isContentEditable);
  };
  let visible = true;
  const onKey = (down: boolean) => (event: KeyboardEvent) => {
    if (!state.engaged || !visible || typing()) return;
    const key = keyMap[event.code];
    if (key) {
      event.preventDefault();
      state.keys[key] = down;
      const fresh = down && !event.repeat && performance.now() - state.openedAt > 450;
      if (fresh && state.mode === 'site' && state.active !== 'jezero') closeSite();
    }
    if (event.code === 'Space' && state.active === 'jezero') {
      event.preventDefault();
      state.lakeHold = down;
    }
    if (down && event.code === 'Escape') closeSite();
  };
  const keyDown = onKey(true);
  const keyUp = onKey(false);

  let press: { x: number; y: number; lastX: number; lastY: number; at: number; moved: number } | null = null;
  const onPointerDown = (event: PointerEvent) => {
    press = { x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, at: performance.now(), moved: 0 };
  };
  const onPointerMove = (event: PointerEvent) => {
    if (!press || state.mode !== 'chase') return;
    const dx = event.clientX - press.lastX;
    const dy = event.clientY - press.lastY;
    press.lastX = event.clientX;
    press.lastY = event.clientY;
    press.moved += Math.abs(dx) + Math.abs(dy);
    if (press.moved < 6) return;
    cam.dragging = true;
    cam.lastLook = performance.now();
    cam.yaw -= dx * 0.0055;
    cam.pitch = Math.max(0.08, Math.min(1.25, cam.pitch + dy * 0.004));
  };
  const onWheel = (event: WheelEvent) => {
    if (!state.engaged || state.mode !== 'chase') return;
    event.preventDefault();
    cam.targetDist = Math.max(6, Math.min(34, cam.targetDist * Math.exp(event.deltaY * 0.0012)));
    cam.lastLook = performance.now();
  };
  const onContextMenu = (event: MouseEvent) => {
    if (state.engaged) event.preventDefault();
  };
  const onPointerUp = (event: PointerEvent) => {
    if (!press) return;
    const moved = Math.hypot(event.clientX - press.x, event.clientY - press.y);
    const quick = performance.now() - press.at < 450;
    press = null;
    cam.dragging = false;
    if (moved < 7 && quick && state.engaged && event.button === 0) {
      const hit = groundAt(event.clientX, event.clientY);
      if (!hit) return;
      if (state.active === 'outcrop') fireLaser(hit);
      else if (state.mode === 'chase') {
        state.target = { x: hit.x, z: hit.z };
        ring.position.set(hit.x, hit.y + 0.15, hit.z);
        ring.visible = true;
      }
    }
  };

  // Loop --------------------------------------------------------------------------
  let frame = 0;
  let last = 0;
  let clockAt = 0;
  let trackAt = 0;
  const projected = new THREE.Vector3();

  const placeLabels = (roverY: number) => {
    SITES.forEach((site, index) => {
      const label = dom.labels[site.id];
      beacons[index].visible = state.active !== site.id;
      beacons[index].material.opacity = 0.22 + Math.sin(last / 500 + index) * 0.08;
      if (!label) return;
      projected.set(site.x, heightAt(site.x, site.z) + 9, site.z).project(camera);
      const hidden = projected.z > 1 || state.mode !== 'chase' || Math.abs(projected.x) > 1.1 || Math.abs(projected.y) > 1.1;
      label.style.opacity = hidden ? '0' : '1';
      if (hidden) return;
      const x = (projected.x * 0.5 + 0.5) * width;
      const y = (-projected.y * 0.5 + 0.5) * height;
      label.style.transform = `translate3d(${x.toFixed(0)}px, ${y.toFixed(0)}px, 0) translate(-50%, -100%)`;
      const distance = Math.round(Math.hypot(state.x - site.x, state.z - site.z));
      const text = `${distance} m`;
      if (label.dataset.distance !== text) label.dataset.distance = text;
    });
    if (dom.mapDot) {
      const size = dom.mapDot.parentElement?.clientWidth ?? 0;
      const mx = (state.x / WORLD + 0.5) * size;
      const my = (state.z / WORLD + 0.5) * size;
      dom.mapDot.style.transform = `translate3d(${mx.toFixed(1)}px, ${my.toFixed(1)}px, 0) rotate(${(-state.yaw * 180) / Math.PI + 180}deg)`;
    }
    void roverY;
  };

  const updateCamera = (dt: number, roverY: number) => {
    if (state.mode === 'attract') {
      const t = options.reduced ? 0.7 : last / 26000;
      desiredPos.set(Math.cos(t) * 170, 96, Math.sin(t) * 170);
      desiredLook.set(0, 0, 0);
    } else if (state.mode === 'site' && state.active) {
      const pose = sitePose(state.active);
      desiredPos.copy(pose.pos);
      desiredLook.copy(pose.look);
      // The panel covers the right of the view on wide screens: aim right so the subject sits left of it.
      if (width > 900) {
        const sideways = tmp.subVectors(pose.look, pose.pos).cross(camera.up).normalize();
        desiredLook.addScaledVector(sideways, pose.pos.distanceTo(pose.look) * 0.32);
      }
      // On tall phone screens the panel docks at the bottom: aim low so the subject sits up top.
      else if (height > width) desiredLook.y -= pose.pos.distanceTo(pose.look) * 0.3;
    } else {
      // GTA-style: free orbit while dragging; after 1.6 s of driving untouched, swing back behind.
      const idle = performance.now() - cam.lastLook > 1600;
      if (!cam.dragging && idle && Math.abs(state.speed) > 0.8) {
        const behind = state.speed < 0 ? state.yaw + Math.PI : state.yaw;
        const diff = Math.atan2(Math.sin(behind - cam.yaw), Math.cos(behind - cam.yaw));
        cam.yaw += diff * Math.min(1, dt * 2.2);
        cam.pitch += (0.38 - cam.pitch) * Math.min(1, dt * 1.2);
      }
      cam.dist += (cam.targetDist - cam.dist) * Math.min(1, dt * 6);
      const horizontal = Math.cos(cam.pitch) * cam.dist;
      desiredPos.set(
        state.x - Math.sin(cam.yaw) * horizontal,
        roverY + 1.8 + Math.sin(cam.pitch) * cam.dist,
        state.z - Math.cos(cam.yaw) * horizontal,
      );
      // Never let the camera dip into the ground between it and the rover.
      for (const k of [1, 0.66, 0.33]) {
        const gx = state.x + (desiredPos.x - state.x) * k;
        const gz = state.z + (desiredPos.z - state.z) * k;
        const floorAt = surfaceAt(gx, gz) + 1.4;
        const along = roverY + (desiredPos.y - roverY) * k;
        if (along < floorAt) desiredPos.y += (floorAt - along) / k;
      }
      const dir = forward();
      const lead = Math.min(3, Math.abs(state.speed) * 0.18) * Math.sign(state.speed || 1);
      desiredLook.set(state.x + dir.x * lead, roverY + 1.8, state.z + dir.z * lead);
    }
    const rate = state.mode === 'attract' ? 1.2 : state.mode === 'site' ? 3.2 : cam.dragging ? 14 : 7;
    const ease = options.reduced ? 1 : 1 - Math.exp(-dt * rate);
    camPos.lerp(desiredPos, ease);
    camLook.lerp(desiredLook, Math.min(1, ease * 1.4));
    camera.position.copy(camPos);
    camera.lookAt(camLook);
  };

  const tick = (now: number) => {
    frame = 0;
    if (!visible || document.hidden) {
      last = 0;
      return;
    }
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    const roverY = updateRover(dt);
    updateCamera(dt, roverY);
    updateSky(dt);
    updateLake(dt);
    checkSites();
    if (state.laserFade > 0) {
      state.laserFade = Math.max(0, state.laserFade - dt * 2.6);
      (laser.material as THREE.LineBasicMaterial).opacity = state.laserFade;
      (spark.material as THREE.PointsMaterial).opacity = state.laserFade;
      (spark.material as THREE.PointsMaterial).size = 2.4 + (1 - state.laserFade) * 3;
    }
    if (ring.visible) ring.rotation.z += dt;
    terrainUniforms.uTime.value = now / 1000;
    SITES.forEach((site, index) => {
      const stateValue = state.active === site.id ? 2 : found.has(site.id) ? 1 : 0;
      terrainUniforms.uSites.value[index].w = stateValue;
      const corona = coronas[index];
      corona.visible = stateValue !== 2;
      const material = corona.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = now / 1000 + index;
      (material.uniforms.uColor.value as THREE.Color).set(stateValue === 1 ? '#8fd4ff' : '#ffb860');
    });
    if (state.tracksDirty && now - trackAt > 120) {
      tracks.needsUpdate = true;
      state.tracksDirty = false;
      trackAt = now;
    }
    placeLabels(roverY);
    renderer.render(scene, camera);
    if (now - clockAt > 500) {
      clockAt = now;
      const hours = (state.time * 24 + 6) % 24;
      const hh = Math.floor(hours);
      const mm = Math.floor((hours - hh) * 60);
      events.onClock(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, sunDir.y > 0);
    }
    frame = requestAnimationFrame(tick);
  };
  const wake = () => {
    if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick);
  };

  const resize = () => {
    width = canvas.clientWidth || 1;
    height = canvas.clientHeight || 1;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const sizer = new ResizeObserver(resize);
  sizer.observe(canvas);
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) {
      state.keys = { up: false, down: false, left: false, right: false };
      state.lakeHold = false;
    }
    wake();
  });
  observer.observe(canvas);
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('contextmenu', onContextMenu);
  document.addEventListener('visibilitychange', wake);
  // Development-only test hook (removed from production builds): jump the rover.
  if (process.env.NODE_ENV === 'development') {
    (window as unknown as { __mars?: unknown }).__mars = {
      teleport: (x: number, z: number, yaw = state.yaw) => { state.x = x; state.z = z; state.yaw = yaw; state.speed = 0; },
      state,
      probe: () => rig.map((wheel) => {
        const at = wheel.rest.clone().setY(wheel.rest.y + wheel.offset).applyMatrix4(rover.matrixWorld);
        return { slot: wheel.slot, side: wheel.side, offset: +wheel.offset.toFixed(3), clearance: +(at.y - wheelRadius - surfaceAt(at.x, at.z)).toFixed(3) };
      }),
      body: () => ({ y: +suspension.y.toFixed(2), pitch: +suspension.pitch.toFixed(3), roll: +suspension.roll.toFixed(3) }),
    };
  }
  resize();
  updateSky(0);
  rover.position.set(state.x, heightAt(state.x, state.z), state.z);
  wake();
  // Phones fetch the 11 MB model only when play starts; desktops load it in the background.
  if (!options.lite) loadModel();
  events.onProgress(1);
  events.onReady();

  return {
    engage: () => {
      loadModel();
      state.engaged = true;
      if (state.mode === 'attract') {
        state.mode = 'chase';
        cam.yaw = state.yaw;
        cam.pitch = 0.38;
        cam.dist = cam.targetDist = 13;
      }
      wake();
    },
    disengage: () => {
      closeSite();
      state.engaged = false;
      state.mode = 'attract';
      state.keys = { up: false, down: false, left: false, right: false };
      state.stick.x = 0;
      state.stick.y = 0;
      state.target = null;
      state.speed = 0;
      state.steer = 0;
      cam.dragging = false;
      ring.visible = false;
      wake();
    },
    setStick: (x, y) => {
      state.stick.x = x;
      state.stick.y = y;
      // A stick still held from before the popup opened must be released before it can close it.
      if (!x && !y) state.stickArmed = true;
      else if (state.stickArmed && state.mode === 'site' && state.active !== 'jezero' && performance.now() - state.openedAt > 450) closeSite();
    },
    dismissSite: closeSite,
    goTo: (id) => {
      const site = SITES.find((item) => item.id === id);
      if (!site) return;
      closeSite();
      state.inside.delete(id);
      state.engaged = true;
      state.mode = 'chase';
      state.target = { x: site.x, z: site.z };
      ring.position.set(site.x, heightAt(site.x, site.z) + 0.15, site.z);
      ring.visible = true;
      wake();
    },
    setLakeHold: (on) => {
      state.lakeHold = on && state.active === 'jezero';
    },
    skipToSunset: () => {
      state.timeTarget = 0.486;
    },
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(frame);
      sizer.disconnect();
      observer.disconnect();
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('visibilitychange', wake);
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material?.dispose();
      });
      tracks.dispose();
      sunLight.shadow.dispose();
      puff.dispose();
      environment.dispose();
      renderer.dispose();
    },
  };
}
