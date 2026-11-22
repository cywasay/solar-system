import {
  FIELD_FS, FIELD_VS, FULL_VS, MOON_FS, MOON_VS, N_CLOSED, N_OPEN, N_RINGS, PLANET_FS, RING_FS, RING_VS, SEG_CLOSED, SEG_OPEN, SEG_RING,
} from './shaders';

/**
 * The Uranus scene: a ray-traced planet held at its real 97.77 degree tilt, lit by the Sun from
 * wherever the planet is on its 84-year orbit, with its rings, five large moons and an
 * illustrative magnetic field. Units: Uranus's equatorial radius (25,559 km) = 1.
 *
 * The camera rides along with the Sun line at a chosen phase angle, so as the years pass you watch
 * the fixed axis swing from pole-on to edge-on and back, the way telescopes on Earth have seen it.
 */

export type V3 = [number, number, number];
export type Frame = {
  year: number;
  phase: number; // degrees between the Sun line and the camera, measured in the orbit plane
  elev: number; // degrees above the orbit plane
  view: number; // half the frame height, in Uranus radii
  shiftX: number; // where the planet sits on screen, in NDC
  shiftY: number;
  field: number; // 0..1 visibility of each layer
  rings: number;
  moons: number;
  occult: number;
};

export type Sky = { forward: V3; right: V3; up: V3; axis: V3 };

export type Scene = {
  setFrame: (frame: Frame) => void;
  setCompression: (on: boolean) => void;
  spinBy: (radians: number) => void;
  /** CSS pixel position of a world point in the current view. */
  project: (p: V3) => [number, number];
  /** The camera's sky plane for a frame (used to set up the occultation). */
  sky: (frame: Frame) => Sky;
  moonPositions: () => V3[];
  spin: () => number;
  onFrame: (cb: () => void) => void;
  setActive: (on: boolean) => void;
  resize: () => void;
  render: () => void;
  dispose: () => void;
};

export const R_KM = 25559;
export const OBLIQUITY = 97.77;
export const ROTATION_H = 17.24;
const EQUINOX = 2007.93;
const PERIOD = 84.01;
const rad = (d: number) => (d * Math.PI) / 180;

/** The five large moons: orbit radius (km) and period (days), from NASA's satellite fact sheet. */
export const MOONS = [
  { name: 'Miranda', km: 129900, days: 1.413, phase: 0.4 },
  { name: 'Ariel', km: 190900, days: 2.52, phase: 2.1 },
  { name: 'Umbriel', km: 266000, days: 4.144, phase: 4.0 },
  { name: 'Titania', km: 436300, days: 8.706, phase: 5.2 },
  { name: 'Oberon', km: 583500, days: 13.463, phase: 1.1 },
];

/** Rings drawn in the scene (radius km). The narrow ones are also in occult.ts with widths. */
const SCENE_RINGS: { km: number; px: number; gain: number; style: number }[] = [
  { km: 41837, px: 1.3, gain: 0.5, style: 0 }, // 6
  { km: 42234, px: 1.3, gain: 0.55, style: 0 }, // 5
  { km: 42571, px: 1.3, gain: 0.5, style: 0 }, // 4
  { km: 44718, px: 1.5, gain: 0.65, style: 0 }, // alpha
  { km: 45661, px: 1.5, gain: 0.6, style: 0 }, // beta
  { km: 47176, px: 1.3, gain: 0.5, style: 0 }, // eta
  { km: 47627, px: 1.4, gain: 0.7, style: 0 }, // gamma
  { km: 48300, px: 1.5, gain: 0.65, style: 0 }, // delta
  { km: 50023, px: 1.2, gain: 0.35, style: 0 }, // lambda
  { km: 51149, px: 2.6, gain: 1.0, style: 0 }, // epsilon
  { km: 66100, px: 3.0, gain: 0.16, style: 1 }, // nu (dusty)
  { km: 97700, px: 4.0, gain: 0.12, style: 1 }, // mu (dusty)
  ...MOONS.map((m) => ({ km: m.km, px: 1.1, gain: 0.5, style: 2 })),
];

// Small vector and matrix helpers (column-major, like GL) ---------------------------------
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => scale(a, 1 / Math.hypot(a[0], a[1], a[2]));

function multiply(a: Float32Array, b: Float32Array) {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    out[c * 4 + r] = s;
  }
  return out;
}

function invert(m: Float32Array) {
  const inv = new Float32Array(16);
  const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = m;
  const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
  const det = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
  inv[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  inv[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  inv[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  inv[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  inv[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  inv[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  inv[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  inv[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  inv[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  inv[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  inv[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  inv[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  inv[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  inv[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  inv[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  inv[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return inv;
}

/** The planet's axes in the orbit frame. The spin axis stays fixed in space all year. */
const SIN_E = Math.sin(rad(OBLIQUITY));
const COS_E = Math.cos(rad(OBLIQUITY));
export const AXIS: V3 = [0, SIN_E, COS_E];
const XP: V3 = [-1, 0, 0];
const YP: V3 = cross(AXIS, XP);

export function orbitAngle(year: number) { return (2 * Math.PI * (year - EQUINOX)) / PERIOD; }
export function sunDirection(year: number): V3 {
  const L = orbitAngle(year);
  return [Math.cos(L), Math.sin(L), 0];
}
/** Latitude of the point directly under the Sun, degrees (negative = south). */
export function subsolarLatitude(year: number) {
  return (Math.asin(Math.max(-1, Math.min(1, dot(AXIS, sunDirection(year))))) * 180) / Math.PI;
}

function camera(frame: Frame, aspect: number) {
  const L = orbitAngle(frame.year) + rad(frame.phase);
  const e = rad(frame.elev);
  const dir: V3 = norm([Math.cos(L) * Math.cos(e), Math.sin(L) * Math.cos(e), Math.sin(e)]);
  const fov = rad(26);
  // Keep the subject in frame on narrow screens.
  const view = frame.view * Math.max(1, 1.15 / aspect);
  const dist = view / Math.tan(fov / 2);
  const eye = scale(dir, dist);
  const forward = scale(dir, -1);
  let right = cross(forward, [0, 0, 1]);
  if (Math.hypot(...right) < 1e-4) right = [1, 0, 0];
  right = norm(right);
  const up = cross(right, forward);
  const near = Math.max(0.3, dist - 80);
  const far = dist + 140;
  const f = 1 / Math.tan(fov / 2);
  const proj = new Float32Array(16);
  proj[0] = f / aspect;
  proj[5] = f;
  proj[10] = (far + near) / (near - far);
  proj[11] = -1;
  proj[14] = (2 * far * near) / (near - far);
  // Lens shift: places the planet off-centre without turning the camera.
  proj[8] = -frame.shiftX;
  proj[9] = -frame.shiftY;
  const viewM = new Float32Array([
    right[0], up[0], -forward[0], 0,
    right[1], up[1], -forward[1], 0,
    right[2], up[2], -forward[2], 0,
    -dot(right, eye), -dot(up, eye), dot(forward, eye), 1,
  ]);
  const viewProj = multiply(proj, viewM);
  return { eye, forward, right, up, viewProj, inv: invert(viewProj) };
}

export async function createScene(
  canvas: HTMLCanvasElement,
  mapUrl: string,
  options: { lite: boolean; reduced: boolean },
): Promise<Scene> {
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: false, depth: true, powerPreference: 'high-performance' });
  if (!gl) throw new Error('webgl2 unavailable');

  const disposables: (() => void)[] = [];
  const compile = (type: number, code: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, code);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'shader error');
    return shader;
  };
  type Program = { program: WebGLProgram; u: (name: string) => WebGLUniformLocation | null };
  const program = (vs: string, fs: string): Program => {
    const p = gl.createProgram()!;
    const v = compile(gl.VERTEX_SHADER, vs);
    const f = compile(gl.FRAGMENT_SHADER, fs);
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.bindAttribLocation(p, 0, 'aV');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link error');
    gl.deleteShader(v);
    gl.deleteShader(f);
    disposables.push(() => gl.deleteProgram(p));
    const cache = new Map<string, WebGLUniformLocation | null>();
    return { program: p, u: (name) => { if (!cache.has(name)) cache.set(name, gl.getUniformLocation(p, name)); return cache.get(name)!; } };
  };

  const planet = program(FULL_VS, PLANET_FS);
  const ringP = program(RING_VS, RING_FS);
  const fieldP = program(FIELD_VS, FIELD_FS);
  const moonP = program(MOON_VS, MOON_FS);

  /** A batch of ribbons: lines x (segments + 1) samples x 2 sides, drawn as indexed triangles. */
  const ribbons = (lines: { count: number; segments: number }[]) => {
    const verts: number[] = [];
    const index: number[] = [];
    let id = 0;
    for (const group of lines) {
      for (let l = 0; l < group.count; l++, id++) {
        const start = verts.length / 3;
        for (let i = 0; i <= group.segments; i++) {
          const u = i / group.segments;
          verts.push(id, u, -1, id, u, 1);
          if (i < group.segments) {
            const a = start + i * 2;
            index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
          }
        }
      }
    }
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const vb = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    const ib = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(index), gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    disposables.push(() => { gl.deleteBuffer(vb); gl.deleteBuffer(ib); gl.deleteVertexArray(vao); });
    return { vao, count: index.length };
  };
  const ringMesh = ribbons([{ count: N_RINGS, segments: options.lite ? 160 : SEG_RING }]);
  const fieldMesh = ribbons([
    { count: N_CLOSED, segments: SEG_CLOSED },
    { count: N_OPEN, segments: options.lite ? 100 : SEG_OPEN },
  ]);
  const emptyVao = gl.createVertexArray()!;
  disposables.push(() => gl.deleteVertexArray(emptyVao));

  const ringData = new Float32Array(N_RINGS * 4);
  SCENE_RINGS.forEach((r, i) => ringData.set([r.km / R_KM, r.px, r.gain, r.style], i * 4));

  // Planet texture (a mostly featureless map; the shader adds banding, storms and the polar hood).
  const texture = gl.createTexture()!;
  disposables.push(() => gl.deleteTexture(texture));
  await new Promise<void>((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      resolve();
    };
    image.onerror = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([150, 210, 215]));
      resolve();
    };
    image.src = mapUrl;
  });

  // State --------------------------------------------------------------------------------
  let frame: Frame = { year: 1781, phase: 38, elev: 12, view: 3.4, shiftX: 0.3, shiftY: 0, field: 0, rings: 0.6, moons: 0, occult: 0 };
  let spin = 0.8;
  let spinVel = 0;
  let comp = 0;
  let compTarget = 0;
  let time = 0;
  let active = false;
  let raf = 0;
  let last = 0;
  let dirty = true;
  let width = 1;
  let height = 1;
  let cssW = 1;
  let cssH = 1;
  let dprScale = 1;
  let slowFrames = 0;
  let cam = camera(frame, 1);
  const callbacks: (() => void)[] = [];
  const baseSpin = options.reduced ? 0 : (2 * Math.PI) / 26; // one turn every 26 s

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(1, rect.width);
    cssH = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, options.lite ? 1.25 : 1.75) * dprScale;
    width = Math.max(1, Math.round(cssW * dpr));
    height = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    dirty = true;
  };
  resize();

  const moonPositions = (): V3[] => {
    const days = (spin / (2 * Math.PI)) * (ROTATION_H / 24);
    return MOONS.map((m) => {
      const a = (2 * Math.PI * days) / m.days + m.phase;
      const r = m.km / R_KM;
      return add(scale(XP, r * Math.cos(a)), scale(YP, r * Math.sin(a)));
    });
  };

  const draw = () => {
    cam = camera(frame, cssW / cssH);
    const sun = sunDirection(frame.year);
    const sub = dot(AXIS, sun);
    gl.viewport(0, 0, width, height);
    gl.clearColor(0.01, 0.03, 0.04, 1);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 1. Planet, halo and stars, writing depth.
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.ALWAYS);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.useProgram(planet.program);
    gl.uniformMatrix4fv(planet.u('uInvViewProj'), false, cam.inv);
    gl.uniformMatrix4fv(planet.u('uViewProj'), false, cam.viewProj);
    gl.uniform3fv(planet.u('uCam'), cam.eye);
    gl.uniform3fv(planet.u('uSun'), sun);
    gl.uniform3fv(planet.u('uXp'), XP);
    gl.uniform3fv(planet.u('uYp'), YP);
    gl.uniform3fv(planet.u('uZp'), AXIS);
    gl.uniform1f(planet.u('uSpin'), spin);
    gl.uniform1f(planet.u('uSubsolar'), sub);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(planet.u('uMap'), 0);
    gl.bindVertexArray(emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // 2. Rings and moon orbits, depth-tested against the planet.
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const res: [number, number] = [width, height];
    if (frame.rings > 0.01 || frame.moons > 0.01) {
      gl.useProgram(ringP.program);
      gl.uniformMatrix4fv(ringP.u('uViewProj'), false, cam.viewProj);
      gl.uniform2fv(ringP.u('uRes'), res);
      gl.uniform4fv(ringP.u('uRing'), ringData);
      gl.uniform3fv(ringP.u('uXp'), XP);
      gl.uniform3fv(ringP.u('uYp'), YP);
      gl.uniform3fv(ringP.u('uSun'), sun);
      gl.uniform1f(ringP.u('uRings'), frame.rings);
      gl.uniform1f(ringP.u('uMoons'), frame.moons);
      gl.bindVertexArray(ringMesh.vao);
      gl.drawElements(gl.TRIANGLES, ringMesh.count, gl.UNSIGNED_SHORT, 0);
    }

    // 3. Field lines, added light.
    if (frame.field > 0.01) {
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(fieldP.program);
      gl.uniformMatrix4fv(fieldP.u('uViewProj'), false, cam.viewProj);
      gl.uniform2fv(fieldP.u('uRes'), res);
      gl.uniform3fv(fieldP.u('uSun'), sun);
      gl.uniform3fv(fieldP.u('uXp'), XP);
      gl.uniform3fv(fieldP.u('uYp'), YP);
      gl.uniform3fv(fieldP.u('uZp'), AXIS);
      gl.uniform1f(fieldP.u('uSpin'), spin);
      gl.uniform1f(fieldP.u('uComp'), comp);
      gl.uniform1f(fieldP.u('uField'), frame.field);
      gl.uniform1f(fieldP.u('uTime'), time);
      gl.bindVertexArray(fieldMesh.vao);
      gl.drawElements(gl.TRIANGLES, fieldMesh.count, gl.UNSIGNED_SHORT, 0);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }

    // 4. Moons.
    if (frame.moons > 0.01) {
      gl.useProgram(moonP.program);
      gl.uniformMatrix4fv(moonP.u('uViewProj'), false, cam.viewProj);
      gl.uniform3fv(moonP.u('uMoon'), new Float32Array(moonPositions().flat()));
      gl.uniform1f(moonP.u('uPx'), Math.max(5, 7 * (width / cssW)));
      gl.uniform1f(moonP.u('uMoons'), frame.moons);
      gl.bindVertexArray(emptyVao);
      gl.drawArrays(gl.POINTS, 0, 5);
    }
    gl.bindVertexArray(null);
    dirty = false;
    for (const cb of callbacks) cb();
  };

  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    const moving = baseSpin > 0 || Math.abs(spinVel) > 1e-4 || Math.abs(comp - compTarget) > 1e-3;
    if (moving) {
      spin += (baseSpin + spinVel) * dt;
      spinVel *= Math.exp(-dt * 2.5);
      comp += (compTarget - comp) * Math.min(1, dt * 3);
      if (!options.reduced) time += dt;
      dirty = true;
    }
    if (!dirty) return;
    draw();
    // A light governor: render fewer pixels on GPUs that cannot keep up. Long gaps (a throttled
    // or hidden tab) are not counted as slow frames.
    if (dt > 0.028 && dt < 0.1) slowFrames++;
    else slowFrames = Math.max(0, slowFrames - 1);
    if (slowFrames > 90 && dprScale > 0.7) { dprScale -= 0.15; slowFrames = 0; resize(); }
  };

  const toScreen = (p: V3): [number, number] => {
    const m = cam.viewProj;
    const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
    const y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
    const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
    return [((x / w) * 0.5 + 0.5) * cssW, (0.5 - (y / w) * 0.5) * cssH];
  };

  return {
    setFrame: (next) => { frame = next; dirty = true; },
    setCompression: (on) => { compTarget = on ? 1 : 0; if (options.reduced) comp = compTarget; dirty = true; },
    spinBy: (r) => {
      if (options.reduced) { spin += r; dirty = true; return; }
      spinVel = Math.max(-6, Math.min(6, spinVel + r * 8));
    },
    project: toScreen,
    sky: (f) => {
      const c = camera(f, cssW / cssH);
      return { forward: c.forward, right: c.right, up: c.up, axis: AXIS };
    },
    moonPositions,
    spin: () => spin,
    onFrame: (cb) => { callbacks.push(cb); },
    setActive: (on) => {
      if (on === active) return;
      active = on;
      if (on) { last = 0; dirty = true; raf = requestAnimationFrame(tick); } else cancelAnimationFrame(raf);
    },
    resize,
    render: draw,
    dispose: () => {
      cancelAnimationFrame(raf);
      for (const d of disposables) d();
    },
  };
}
