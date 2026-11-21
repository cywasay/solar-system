import {
  FULLSCREEN, LINE_FRAGMENT, LINE_VERTEX, MARKER_FRAGMENT, MARKER_VERTEX, PARTICLE_FRAGMENT, PARTICLE_VERTEX, PLANET_FRAGMENT, UPDATE,
} from './ringShaders';

/**
 * The ring plate: roughly half a million particles on Kepler orbits around Saturn (units: Saturn's
 * radius = 1, GM = 1), advanced on the GPU. Moons are prescribed circular orbits that pull on
 * every particle. Ring radii are the real ones; moon masses in the sandbox are far heavier than
 * real ring moons so the effects show in seconds, and there are no collisions between particles.
 */

export type Preset = 'real' | 'pan' | 'shepherds' | 'free';
export type Labels = 'none' | 'rings';
export type View = { tilt: number; viewR: number; centerX: number; centerY: number; hex: number; labels: Labels; finale: boolean; orbits: boolean };

export type Rings = {
  setView: (view: Partial<View>) => void;
  /** Snap the tilt now (a slider drags it directly). */
  setPreset: (preset: Preset) => void;
  setSpeed: (speed: number) => void;
  dropMoon: (a: number, phase: number) => void;
  clearMoons: () => void;
  pick: (clientX: number, clientY: number) => { a: number; phase: number } | null;
  moonCount: () => number;
  setActive: (on: boolean) => void;
  resize: () => void;
  dispose: () => void;
};

type Moon = { name: string; a: number; mu: number; phase: number; eps: number };
type Target = { fbo: WebGLFramebuffer; pos: WebGLTexture; vel: WebGLTexture };
type Program = { program: WebGLProgram; uniform: Record<string, WebGLUniformLocation | null> };

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const omega = (a: number) => a ** -1.5;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Real ring and moon radii, in Saturn radii (equatorial radius 60,268 km). */
const RING = {
  dInner: 1.11, dOuter: 1.236, cInner: 1.239, cOuter: 1.527, bOuter: 1.951, cassini: 2.027, aOuter: 2.269,
  encke: 2.2166, keeler: 2.265, f: 2.326,
};
const ENCELADUS = 3.949;
const TITAN = 20.275;
const MIMAS = 3.079;

const PALETTE = [
  [0.3, 0.26, 0.21], // D
  [0.46, 0.38, 0.3], // C
  [1.0, 0.9, 0.72], // B
  [0.34, 0.31, 0.27], // Cassini Division
  [0.82, 0.73, 0.57], // A
  [0.95, 0.86, 0.68], // F and narrow rings
  [0.45, 0.58, 0.85], // E ring grains
  [1, 1, 1],
].flat();

/** Relative surface density and palette index of the real rings, by radius. */
function realRing(r: number): { w: number; id: number } {
  if (r < RING.dInner) return { w: 0, id: 0 };
  if (r < RING.dOuter) return { w: 0.025, id: 0 };
  if (r < RING.cInner) return { w: 0, id: 0 };
  if (r < RING.cOuter) return { w: 0.11 + 0.07 * ((r - RING.cInner) / (RING.cOuter - RING.cInner)), id: 1 };
  if (r < RING.bOuter) {
    const t = (r - RING.cOuter) / (RING.bOuter - RING.cOuter);
    return { w: 0.5 + 0.55 * Math.min(1, t * 2.2) - 0.1 * Math.max(0, t - 0.8), id: 2 };
  }
  if (r < RING.cassini) return { w: 0.045 + (r > 2.0 && r < 2.012 ? 0.08 : 0), id: 3 };
  if (r < RING.aOuter) {
    if (Math.abs(r - RING.encke) < 0.0032) return { w: 0, id: 4 };
    if (Math.abs(r - RING.keeler) < 0.0014) return { w: 0, id: 4 };
    return { w: 0.46, id: 4 };
  }
  if (Math.abs(r - RING.f) < 0.0035) return { w: 0.5, id: 5 };
  return { w: 0, id: 4 };
}

type Seed = { pos: Float32Array; vel: Float32Array };

const gauss = () => {
  let u = 0;
  for (let i = 0; i < 4; i++) u += Math.random();
  return (u - 2) * 1.732;
};

export async function createRings(
  canvas: HTMLCanvasElement,
  labelCanvas: HTMLCanvasElement,
  saturnUrl: string,
  options: { lite: boolean; reduced: boolean },
): Promise<Rings> {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
  if (!gl) throw new Error('webgl2 unavailable');
  if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('float render targets unavailable');
  const labelCtx = labelCanvas.getContext('2d');

  const TW = options.lite ? 512 : 1024;
  const TH = options.lite ? 256 : 512;
  const N = TW * TH;
  const PLUME = options.lite ? 8192 : 24576;

  // GL plumbing ------------------------------------------------------------------------
  const disposables: (() => void)[] = [];
  const compile = (type: number, code: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, code);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'shader error');
    return shader;
  };
  const program = (vertex: string, fragment: string, names: string[], attributes: Record<string, number> = {}): Program => {
    const p = gl.createProgram()!;
    const vs = compile(gl.VERTEX_SHADER, vertex);
    const fs = compile(gl.FRAGMENT_SHADER, fragment);
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    for (const [name, location] of Object.entries(attributes)) gl.bindAttribLocation(p, location, name);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link error');
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    disposables.push(() => gl.deleteProgram(p));
    return { program: p, uniform: Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(p, name)])) };
  };

  const floatTexture = (w: number, h: number, data: Float32Array | null) => {
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, data);
    disposables.push(() => gl.deleteTexture(texture));
    return texture;
  };
  const makeTarget = (): Target => {
    const pos = floatTexture(TW, TH, null);
    const vel = floatTexture(TW, TH, null);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pos, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, vel, 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('framebuffer incomplete');
    disposables.push(() => gl.deleteFramebuffer(fbo));
    return { fbo, pos, vel };
  };
  const targets = [makeTarget(), makeTarget()];
  let current = 0;

  const emptyVao = gl.createVertexArray()!;
  gl.bindVertexArray(emptyVao);

  // The planet texture.
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('texture failed to load'));
    image.src = saturnUrl;
  });
  const saturnTexture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, saturnTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  disposables.push(() => gl.deleteTexture(saturnTexture));

  const P = {
    update: program(FULLSCREEN, UPDATE, ['uPos', 'uVel', 'uDt', 'uTime', 'uMoon', 'uEnc']),
    particle: program(PARTICLE_VERTEX, PARTICLE_FRAGMENT, ['uPos', 'uVel', 'uSize', 'uSun', 'uPalette', 'uPx', 'uBright', 'uPlume', 'uTilt', 'uViewR', 'uCenter']),
    planet: program(FULLSCREEN, PLANET_FRAGMENT, ['uMap', 'uSun', 'uSpin', 'uHex', 'uTilt', 'uViewR', 'uCenter']),
    marker: program(MARKER_VERTEX, MARKER_FRAGMENT, ['uPx', 'uTilt', 'uViewR', 'uCenter'], { aPos: 0, aStyle: 1 }),
    line: program(LINE_VERTEX, LINE_FRAGMENT, ['uColor', 'uScale', 'uTilt', 'uViewR', 'uCenter'], { aPos: 0 }),
  };

  // Geometry for markers and lines.
  const markerBuffer = gl.createBuffer()!;
  const markerVao = gl.createVertexArray()!;
  gl.bindVertexArray(markerVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, markerBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, 24 * 5 * 4, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12);

  const CIRCLE = 160;
  const circle = new Float32Array(CIRCLE * 3);
  for (let i = 0; i < CIRCLE; i++) circle.set([Math.cos((i / CIRCLE) * Math.PI * 2), Math.sin((i / CIRCLE) * Math.PI * 2), 0], i * 3);
  const circleBuffer = gl.createBuffer()!;
  const circleVao = gl.createVertexArray()!;
  gl.bindVertexArray(circleVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, circleBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, circle, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);

  // Cassini's last orbits: highly elliptical, steeply inclined, crossing the ring plane between
  // the planet and the innermost ring. An illustration of the geometry, not a trajectory.
  const PATH = 180;
  const path = new Float32Array(PATH * 3);
  {
    const periapsis = 1.05;
    const apoapsis = 20;
    const e = (apoapsis - periapsis) / (apoapsis + periapsis);
    const p = periapsis * (1 + e);
    const inclination = rad(63.4);
    const node = rad(35);
    for (let i = 0; i < PATH; i++) {
      const nu = -2.75 + (5.5 * i) / (PATH - 1);
      const r = p / (1 + e * Math.cos(nu));
      const x = r * Math.cos(nu);
      const y = r * Math.sin(nu) * Math.cos(inclination);
      const z = r * Math.sin(nu) * Math.sin(inclination);
      path.set([x * Math.cos(node) - y * Math.sin(node), x * Math.sin(node) + y * Math.cos(node), z], i * 3);
    }
  }
  const pathBuffer = gl.createBuffer()!;
  const pathVao = gl.createVertexArray()!;
  gl.bindVertexArray(pathVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, pathBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, path, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
  gl.bindVertexArray(emptyVao);

  // Seeding ----------------------------------------------------------------------------
  const writeParticle = (seed: Seed, i: number, r: number, angle: number, id: number, size: number) => {
    const speed = Math.sqrt(1 / r);
    const sx = Math.cos(angle);
    const sy = Math.sin(angle);
    const dispersion = 0.0015;
    seed.pos.set([r * sx, r * sy, 0, 0], i * 4);
    seed.vel.set([-speed * sy + gauss() * dispersion, speed * sx + gauss() * dispersion, id, size], i * 4);
  };
  const seedPlume = (seed: Seed) => {
    const start = N - PLUME;
    for (let i = start; i < N; i++) {
      // Waiting grains, scheduled to leave Enceladus at staggered times.
      seed.pos.set([0, 1000, 1, Math.random() * 260], i * 4);
      seed.vel.set([0, 0, 6, 1.5], i * 4);
    }
  };
  const seedFrom = (density: (r: number) => { w: number; id: number }, r0: number, r1: number): Seed => {
    const seed: Seed = { pos: new Float32Array(N * 4), vel: new Float32Array(N * 4) };
    const BINS = 4000;
    const cdf = new Float64Array(BINS + 1);
    const ids = new Uint8Array(BINS);
    for (let i = 0; i < BINS; i++) {
      const r = r0 + ((i + 0.5) / BINS) * (r1 - r0);
      const d = density(r);
      cdf[i + 1] = cdf[i] + d.w * r;
      ids[i] = d.id;
    }
    const total = cdf[BINS];
    for (let i = 0; i < N - PLUME; i++) {
      const u = Math.random() * total;
      let lo = 0;
      let hi = BINS;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (cdf[mid] <= u) lo = mid; else hi = mid;
      }
      const r = r0 + ((lo + Math.random()) / BINS) * (r1 - r0);
      writeParticle(seed, i, r, Math.random() * Math.PI * 2, ids[lo], 1.3 + Math.random() * 0.5);
    }
    seedPlume(seed);
    return seed;
  };
  const uniformBand = (a: number, b: number, id = 4) => seedFrom((r) => ({ w: r >= a && r <= b ? 1 : 0, id }), a, b);

  const SEEDERS: Record<Preset, () => Seed> = {
    real: () => seedFrom(realRing, 1.1, 2.4),
    pan: () => uniformBand(1.9, 2.5),
    free: () => uniformBand(1.35, 2.7),
    shepherds: () => seedFrom((r) => ({ w: Math.exp(-(((r - 2.2) / 0.022) ** 2)), id: 5 }), 2.0, 2.4),
  };

  const mass = (mu: number) => mu;
  const hillSoftening = (a: number, mu: number) => 0.25 * a * (mu / 3) ** (1 / 3);
  const makeMoon = (name: string, a: number, mu: number, phase: number): Moon => ({ name, a, mu: mass(mu), phase, eps: hillSoftening(a, mu) });
  const PRESET_MOONS: Record<Preset, Moon[]> = {
    real: [],
    pan: [makeMoon('Pan (heavy)', 2.2, 1e-4, 0)],
    free: [],
    shepherds: [makeMoon('Inner shepherd', 2.1, 1e-4, 0), makeMoon('Outer shepherd', 2.3, 1e-4, 2.4)],
  };

  // State ------------------------------------------------------------------------------
  let moons: Moon[] = [];
  let preset: Preset = 'real';
  let time = 0;
  let speed = 1;
  let active = false;
  let disposed = false;
  let raf = 0;
  let last = 0;
  let dirty = true;
  // Frame-time governor: slow GPUs get fewer simulation steps per frame, never a frozen page.
  let maxSteps = 16;
  let frameAverage = 1 / 60;
  let size = 1;
  let dpr = 1;
  const view: View = { tilt: rad(50), viewR: 3, centerX: 0, centerY: 0, hex: 0, labels: 'none', finale: false, orbits: false };
  const goal: View = { ...view };

  const upload = (seed: Seed) => {
    for (const target of targets) {
      gl.bindTexture(gl.TEXTURE_2D, target.pos);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, TW, TH, 0, gl.RGBA, gl.FLOAT, seed.pos);
      gl.bindTexture(gl.TEXTURE_2D, target.vel);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, TW, TH, 0, gl.RGBA, gl.FLOAT, seed.vel);
    }
    current = 0;
  };
  const setPreset = (next: Preset) => {
    preset = next;
    moons = PRESET_MOONS[next].map((m) => ({ ...m }));
    upload(SEEDERS[next]());
    time = 0;
    dirty = true;
    kick();
  };

  const sun = (() => {
    const v = [0.8, -0.35, 0.48];
    const len = Math.hypot(v[0], v[1], v[2]);
    return v.map((c) => c / len);
  })();

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    size = Math.max(1, Math.round(rect.width));
    dpr = Math.min(window.devicePixelRatio || 1, options.lite ? 1 : 1.75);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    labelCanvas.width = canvas.width;
    labelCanvas.height = canvas.height;
    dirty = true;
    kick();
  };

  // One physics step ----------------------------------------------------------------------
  const moonUniform = new Float32Array(16);
  const step = (dt: number) => {
    time += dt;
    moonUniform.fill(0);
    moons.slice(0, 4).forEach((m, i) => {
      const angle = m.phase + omega(m.a) * time;
      moonUniform.set([m.a * Math.cos(angle), m.a * Math.sin(angle), m.mu, m.eps], i * 4);
    });
    const from = targets[current];
    const to = targets[1 - current];
    gl.useProgram(P.update.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, from.pos);
    gl.uniform1i(P.update.uniform.uPos, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, from.vel);
    gl.uniform1i(P.update.uniform.uVel, 1);
    gl.uniform1f(P.update.uniform.uDt, dt);
    gl.uniform1f(P.update.uniform.uTime, time);
    gl.uniform4fv(P.update.uniform.uMoon, moonUniform);
    const wa = omega(ENCELADUS) * time;
    const vo = Math.sqrt(1 / ENCELADUS);
    gl.uniform4f(P.update.uniform.uEnc, ENCELADUS * Math.cos(wa), ENCELADUS * Math.sin(wa), -vo * Math.sin(wa), vo * Math.cos(wa));
    gl.bindFramebuffer(gl.FRAMEBUFFER, to.fbo);
    gl.viewport(0, 0, TW, TH);
    gl.disable(gl.BLEND);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    current = 1 - current;
  };

  // Drawing ----------------------------------------------------------------------------
  const project = (x: number, y: number, z: number): [number, number] => {
    const c = Math.cos(view.tilt);
    const s = Math.sin(view.tilt);
    const vx = x;
    const vy = y * c + z * s;
    return [((vx - view.centerX) / view.viewR * 0.5 + 0.5) * size, (0.5 - (vy - view.centerY) / view.viewR * 0.5) * size];
  };
  const setProjection = (p: Program) => {
    gl.uniform1f(p.uniform.uTilt, view.tilt);
    gl.uniform1f(p.uniform.uViewR, view.viewR);
    gl.uniform2f(p.uniform.uCenter, view.centerX, view.centerY);
  };

  const drawLabels = () => {
    if (!labelCtx) return;
    labelCtx.setTransform(1, 0, 0, 1, 0, 0);
    labelCtx.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
    labelCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const family = getComputedStyle(labelCanvas).fontFamily || 'serif';
    labelCtx.textBaseline = 'middle';
    const note = (text: string, x: number, y: number, align: CanvasTextAlign = 'left') => {
      labelCtx.font = `italic 13px ${family}`;
      labelCtx.textAlign = align;
      labelCtx.lineJoin = 'round';
      labelCtx.lineWidth = 4;
      labelCtx.strokeStyle = '#0a090c';
      labelCtx.strokeText(text, x, y);
      labelCtx.fillStyle = '#f1e4c4';
      labelCtx.fillText(text, x, y);
    };
    if (view.labels === 'rings' && preset === 'real') {
      const regions: [string, number][] = [
        ['D', (RING.dInner + RING.dOuter) / 2], ['C', (RING.cInner + RING.cOuter) / 2], ['B', (RING.cOuter + RING.bOuter) / 2],
        ['Cassini Division', (RING.bOuter + RING.cassini) / 2], ['A', (RING.cassini + RING.aOuter) / 2], ['Encke Gap', RING.encke], ['F', RING.f],
      ];
      regions.forEach(([name, a], i) => {
        const [x, y] = project(a, 0, 0);
        const up = i % 2 === 0 ? -1 : 1;
        const ty = y + up * (26 + Math.floor(i / 2) * 19);
        labelCtx.strokeStyle = '#f1e4c488';
        labelCtx.lineWidth = 1;
        labelCtx.beginPath();
        labelCtx.moveTo(x, y);
        labelCtx.lineTo(x, ty);
        labelCtx.stroke();
        note(name, x + 3, ty, 'right');
      });
    }
    if (view.orbits) {
      const [tx, ty] = project(TITAN * Math.cos(omega(TITAN) * time + 1), TITAN * Math.sin(omega(TITAN) * time + 1), 0);
      note('Titan', tx + 10, ty);
      const [ex, ey] = project(ENCELADUS * Math.cos(omega(ENCELADUS) * time), ENCELADUS * Math.sin(omega(ENCELADUS) * time), 0);
      note('Enceladus', ex + 10, ey);
      const [mx, my] = project(MIMAS * Math.cos(2.1 + omega(MIMAS) * time), MIMAS * Math.sin(2.1 + omega(MIMAS) * time), 0);
      note('Mimas', mx + 10, my);
    }
    moons.forEach((m) => {
      const angle = m.phase + omega(m.a) * time;
      const [x, y] = project(m.a * Math.cos(angle), m.a * Math.sin(angle), 0);
      note(m.name, x + 12, y - 10);
    });
    if (view.finale) {
      const s = ((time * 0.04) % 1);
      const index = Math.min(PATH - 1, Math.floor(s * PATH));
      const [x, y] = project(path[index * 3], path[index * 3 + 1], path[index * 3 + 2]);
      note('Cassini', x + 10, y - 8);
    }
  };

  const render = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // The planet.
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(P.planet.program);
    setProjection(P.planet);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, saturnTexture);
    gl.uniform1i(P.planet.uniform.uMap, 0);
    gl.uniform3f(P.planet.uniform.uSun, sun[0], sun[1], sun[2]);
    gl.uniform1f(P.planet.uniform.uSpin, time * 0.02);
    gl.uniform1f(P.planet.uniform.uHex, view.hex);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Orbits of the large moons, and Cassini's path.
    gl.useProgram(P.line.program);
    setProjection(P.line);
    if (view.orbits) {
      gl.bindVertexArray(circleVao);
      gl.uniform4f(P.line.uniform.uColor, 0.95, 0.88, 0.7, 0.3);
      for (const a of [ENCELADUS, TITAN, MIMAS]) {
        gl.uniform1f(P.line.uniform.uScale, a);
        gl.drawArrays(gl.LINE_LOOP, 0, CIRCLE);
      }
    }
    if (view.finale) {
      gl.bindVertexArray(pathVao);
      gl.uniform1f(P.line.uniform.uScale, 1);
      gl.uniform4f(P.line.uniform.uColor, 1.0, 0.78, 0.4, 0.9);
      gl.drawArrays(gl.LINE_STRIP, 0, PATH);
    }
    gl.bindVertexArray(emptyVao);

    // The ring particles, added together.
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(P.particle.program);
    setProjection(P.particle);
    const from = targets[current];
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, from.pos);
    gl.uniform1i(P.particle.uniform.uPos, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, from.vel);
    gl.uniform1i(P.particle.uniform.uVel, 1);
    gl.uniform2i(P.particle.uniform.uSize, TW, TH);
    gl.uniform3f(P.particle.uniform.uSun, sun[0], sun[1], sun[2]);
    gl.uniform3fv(P.particle.uniform.uPalette, new Float32Array(PALETTE));
    // Bigger dots when the plate is zoomed in, smaller when the whole system is in view.
    gl.uniform1f(P.particle.uniform.uPlume, view.orbits ? 1 : 0);
    gl.uniform1f(P.particle.uniform.uPx, dpr * clamp(2.6 / view.viewR + 0.35, 0.8, 1.8));
    gl.uniform1f(P.particle.uniform.uBright, (options.lite ? 0.2 : 0.085) * (1 - 0.72 * Math.sin(view.tilt) ** 1.5) * clamp(1.6 / (view.viewR * 0.5 + 0.5), 0.5, 1.4));
    gl.drawArrays(gl.POINTS, 0, N);

    // Moons and the craft.
    const markers: number[] = [];
    moons.forEach((m) => {
      const angle = m.phase + omega(m.a) * time;
      markers.push(m.a * Math.cos(angle), m.a * Math.sin(angle), 0, 26, 1);
    });
    if (view.orbits) {
      for (const [a, phase, px] of [[ENCELADUS, 0, 16], [TITAN, 1, 20], [MIMAS, 2.1, 14]] as [number, number, number][]) {
        const angle = phase + omega(a) * time;
        markers.push(a * Math.cos(angle), a * Math.sin(angle), 0, px, 1);
      }
    }
    if (view.finale) {
      const s = (time * 0.04) % 1;
      const index = Math.min(PATH - 1, Math.floor(s * PATH));
      markers.push(path[index * 3], path[index * 3 + 1], path[index * 3 + 2], 12, 2);
    }
    if (markers.length) {
      gl.useProgram(P.marker.program);
      setProjection(P.marker);
      gl.uniform1f(P.marker.uniform.uPx, dpr);
      gl.bindVertexArray(markerVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, markerBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(markers));
      gl.drawArrays(gl.POINTS, 0, markers.length / 5);
      gl.bindVertexArray(emptyVao);
    }
    drawLabels();
  };

  const settled = () => (Object.keys(goal) as (keyof View)[]).every((key) => {
    const a = goal[key];
    const b = view[key];
    return typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) < 1e-3 : true;
  });

  const tick = (now: number) => {
    raf = 0;
    if (disposed || !active || document.hidden) return;
    const dt = clamp((now - (last || now)) / 1000, 0, 1 / 20);
    last = now;
    // Ease the view.
    const ease = 1 - Math.exp(-dt * (options.reduced ? 60 : 3.2));
    for (const key of ['tilt', 'viewR', 'centerX', 'centerY', 'hex'] as const) view[key] += (goal[key] - view[key]) * ease;
    view.labels = goal.labels;
    view.finale = goal.finale;
    view.orbits = goal.orbits;
    if (!options.reduced) {
      frameAverage += (dt - frameAverage) * 0.08;
      if (frameAverage > 0.045) { maxSteps = Math.max(2, maxSteps - 1); frameAverage = 0.03; }
      else if (frameAverage < 0.021 && maxSteps < 16) maxSteps += 0.05;
      const substeps = clamp(Math.round(speed * 2), 1, Math.floor(maxSteps));
      const dtSim = speed > 4 ? 0.026 : 0.02;
      for (let i = 0; i < substeps; i++) step(dtSim);
    }
    render();
    dirty = false;
    if (!options.reduced || !settled() || dirty) raf = requestAnimationFrame(tick);
    else last = 0;
  };
  function kick() {
    if (!raf && active && !disposed) raf = requestAnimationFrame(tick);
  }
  const onVisibility = () => { if (!document.hidden) { last = 0; kick(); } };
  document.addEventListener('visibilitychange', onVisibility);

  const api: Rings = {
    setView(next) { Object.assign(goal, next); dirty = true; kick(); },
    setPreset,
    setSpeed(next) { speed = next; },
    dropMoon(a, phase) {
      if (moons.length >= 4) moons.shift();
      moons.push(makeMoon('Your moon', clamp(a, 1.2, 2.9), 1e-4, phase));
      dirty = true;
    },
    clearMoons() { moons = []; dirty = true; },
    pick(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ny = 1 - ((clientY - rect.top) / rect.height) * 2;
      const c = Math.cos(view.tilt);
      if (c < 0.3) return null;
      const x = nx * view.viewR + view.centerX;
      const y = (ny * view.viewR + view.centerY) / c;
      const a = Math.hypot(x, y);
      return { a, phase: Math.atan2(y, x) - omega(a) * time };
    },
    moonCount: () => moons.length,
    setActive(on) {
      active = on;
      if (on) { last = 0; kick(); } else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    },
    resize,
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteBuffer(markerBuffer);
      gl.deleteBuffer(circleBuffer);
      gl.deleteBuffer(pathBuffer);
      gl.deleteVertexArray(emptyVao);
      gl.deleteVertexArray(markerVao);
      gl.deleteVertexArray(circleVao);
      gl.deleteVertexArray(pathVao);
      disposables.forEach((fn) => fn());
    },
  };

  if (process.env.NODE_ENV === 'development') {
    (window as unknown as Record<string, unknown>).__saturn = {
      state: () => ({ preset, time: +time.toFixed(1), moons: moons.map((m) => ({ ...m })), view: { ...view }, speed, N }),
      step: (n: number, dtSim = 0.02) => { for (let i = 0; i < n; i++) step(dtSim); render(); },
      render,
      setPreset,
    };
  }

  setPreset('real');
  resize();
  return api;
}
