import { shaders, VERTEX } from './sheetShaders';

/**
 * The weather sheet: a real-time fluid solver (WebGL2) on an unrolled strip of Jupiter's cloud
 * deck, 55 degrees north to 55 degrees south, periodic in longitude.
 *
 *  - Schematic east and west jets drive the flow. The jet profile is the alternating pattern,
 *    not measured winds, and time is greatly sped up.
 *  - The Cassini photo is carried by the flow (as a displacement field), and gently re-forms.
 *  - The Great Red Spot is held in place by a relaxation term. That is a modelling choice.
 *  - Your pointer, the four moons, and some churn while the jets are held still, push the fluid.
 */

export type Regime = 'hero' | 'stripes' | 'storm' | 'interior' | 'field' | 'moons' | 'close';

type Spec = { v: number; zoom: number; deep: number; aurora: number; moons: number; exposure: number; onGrs: boolean };

const SPECS: Record<Regime, Spec> = {
  hero: { v: 0.5, zoom: 1, deep: 0, aurora: 0, moons: 0, exposure: 1, onGrs: false },
  stripes: { v: 0.55, zoom: 1.25, deep: 0, aurora: 0, moons: 0, exposure: 1, onGrs: false },
  storm: { v: 0.3176, zoom: 2.5, deep: 0, aurora: 0, moons: 0, exposure: 1, onGrs: true },
  interior: { v: 0.5, zoom: 1, deep: 1, aurora: 0, moons: 0, exposure: 0.85, onGrs: false },
  field: { v: 0.72, zoom: 1.8, deep: 0.15, aurora: 1, moons: 0, exposure: 0.8, onGrs: false },
  moons: { v: 0.5, zoom: 1, deep: 0, aurora: 0, moons: 1, exposure: 0.95, onGrs: false },
  close: { v: 0.45, zoom: 1.1, deep: 0, aurora: 0, moons: 0, exposure: 0.9, onGrs: false },
};

/** Where the Great Red Spot sits in the Cassini map (sim uv), and its vortex. */
const GRS = { u: 1025 / 2800, v: 0.3176 };

/** Alternating east/west jets: [latitude, speed in m/s, width in degrees]. Schematic. */
const JETS: [number, number, number][] = [
  [0, 85, 6],
  [8, -18, 2.5], [-8, -15, 2.5],
  [17, -30, 2.4], [-17.5, -26, 2.4],
  [23.5, 140, 2.2], [-24.5, 60, 2.4],
  [28.5, -35, 2.5], [-29, -25, 2.5],
  [34, 50, 2.5], [-33, 45, 2.5],
  [40, -30, 3], [-40, -30, 3],
  [46, 40, 3.5], [-46, 40, 3.5],
  [54, -20, 4], [-54, -20, 4],
];
const JET_SCALE = 0.16; // m/s to sheet texels per second (time-lapse)
const LAT_SPAN = 110; // degrees covered by the sheet

/** The four moons: lane (sim v), laps per second (sim u), in the ratio 4 : 2 : 1 : 0.43. */
const MOONS = [
  { v: 0.2, speed: 0.024, phase: 0.1 }, // Io
  { v: 0.38, speed: 0.012, phase: 0.45 }, // Europa
  { v: 0.62, speed: 0.006, phase: 0.7 }, // Ganymede
  { v: 0.8, speed: 0.0026, phase: 0.25 }, // Callisto
];

export type Sheet = {
  setRegime: (regime: Regime) => void;
  setHold: (on: boolean) => void;
  stir: (clientX: number, clientY: number, dx: number, dy: number) => void;
  setRunning: (on: boolean) => void;
  setActive: (on: boolean) => void;
  resize: () => void;
  dispose: () => void;
};

type Target = { texture: WebGLTexture; fbo: WebGLFramebuffer };
type Pair = { read: Target; write: Target; swap: () => void };
type Program = { program: WebGLProgram; uniform: Record<string, WebGLUniformLocation | null> };

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export async function createSheet(canvas: HTMLCanvasElement, mapUrl: string, options: { lite: boolean; reduced: boolean }): Promise<Sheet> {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) throw new Error('webgl2 unavailable');
  if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('float render targets unavailable');

  const SIM_W = options.lite ? 640 : 1024;
  const SIM_H = Math.round((SIM_W * LAT_SPAN) / 360);
  const PRESSURE_ITERATIONS = options.lite ? 14 : 22;
  const source = shaders(SIM_W, SIM_H);

  // GL plumbing ---------------------------------------------------------------------------
  const disposables: (() => void)[] = [];
  const compile = (type: number, code: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, code);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'shader error');
    return shader;
  };
  const vertex = compile(gl.VERTEX_SHADER, VERTEX);
  const makeProgram = (fragment: string, names: string[]): Program => {
    const program = gl.createProgram()!;
    const frag = compile(gl.FRAGMENT_SHADER, fragment);
    gl.attachShader(program, vertex);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'link error');
    gl.deleteShader(frag);
    disposables.push(() => gl.deleteProgram(program));
    return { program, uniform: Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(program, name)])) };
  };

  const makeTarget = (w: number, h: number, internal: number, format: number, type: number, filter: number): Target => {
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, null);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('framebuffer incomplete');
    disposables.push(() => { gl.deleteTexture(texture); gl.deleteFramebuffer(fbo); });
    return { texture, fbo };
  };
  const makePair = (w: number, h: number, internal: number, format: number, type: number, filter: number): Pair => {
    const pair: Pair = {
      read: makeTarget(w, h, internal, format, type, filter),
      write: makeTarget(w, h, internal, format, type, filter),
      swap() { const t = pair.read; pair.read = pair.write; pair.write = t; },
    };
    return pair;
  };

  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);

  const velocity = makePair(SIM_W, SIM_H, gl.RG16F, gl.RG, gl.HALF_FLOAT, gl.LINEAR);
  const pressure = makePair(SIM_W, SIM_H, gl.R16F, gl.RED, gl.HALF_FLOAT, gl.LINEAR);
  const divergence = makeTarget(SIM_W, SIM_H, gl.R16F, gl.RED, gl.HALF_FLOAT, gl.LINEAR);
  const displacement = makePair(SIM_W, SIM_H, gl.RG32F, gl.RG, gl.FLOAT, gl.NEAREST);
  const rowMean = makeTarget(1, SIM_H, gl.R32F, gl.RED, gl.FLOAT, gl.NEAREST);

  // Jet profile, one value per row, bottom (south) to top (north).
  const jetData = new Float32Array(SIM_H);
  for (let y = 0; y < SIM_H; y++) {
    const lat = -LAT_SPAN / 2 + ((y + 0.5) / SIM_H) * LAT_SPAN;
    let sum = 0;
    for (const [centre, speed, width] of JETS) sum += speed * Math.exp(-(((lat - centre) / width) ** 2));
    jetData[y] = sum * JET_SCALE;
  }
  const jetTexture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, jetTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, 1, SIM_H, 0, gl.RED, gl.FLOAT, jetData);
  disposables.push(() => gl.deleteTexture(jetTexture));

  // The Cassini map.
  // The load event, not decode(): decode() can stall forever in a background tab.
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('map failed to load'));
    image.src = mapUrl;
  });
  const mapTexture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, mapTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
  if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 4);
  disposables.push(() => gl.deleteTexture(mapTexture));

  const P = {
    rowMean: makeProgram(source.rowMean, ['uVel']),
    force: makeProgram(source.force, ['uVel', 'uRow', 'uJet', 'uDt', 'uJets', 'uDrag', 'uGrs', 'uGrsOn']),
    splat: makeProgram(source.splat, ['uVel', 'uS', 'uF', 'uSN']),
    advectVel: makeProgram(source.advectVel, ['uVel', 'uDt', 'uDiss']),
    divergence: makeProgram(source.divergence, ['uVel']),
    pressure: makeProgram(source.pressure, ['uP', 'uDiv']),
    gradient: makeProgram(source.gradient, ['uP', 'uVel']),
    advectD: makeProgram(source.advectD, ['uVel', 'uD', 'uDt', 'uRelax', 'uGrs', 'uGrsOn']),
    display: makeProgram(source.display, ['uMap', 'uD', 'uCenter', 'uExtent', 'uDeep', 'uAurora', 'uMoons', 'uExposure', 'uTime', 'uMoon']),
  };

  const bind = (texture: WebGLTexture, unit: number, location: WebGLUniformLocation | null) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(location, unit);
  };
  const draw = (target: Target | null, width: number, height: number) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
    gl.viewport(0, 0, width, height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  // State ----------------------------------------------------------------------------------
  type Splat = { u: number; v: number; radius: number; fx: number; fy: number };
  const queue: Splat[] = [];
  let regime: Regime = 'hero';
  let holding = false;
  let jets = 1;
  let drag = 0.35;
  let grsOn = 1;
  let relax = 0.05;
  let recover = 0;
  let churnClock = 0;
  let time = 0;
  let running = true;
  let active = false;
  let disposed = false;
  let raf = 0;
  let last = 0;
  let dirty = true;
  const camera = { lon: GRS.u + 0.1, v: 0.5, zoom: 1, deep: 0, aurora: 0, moons: 0, exposure: 1 };
  let canvasW = 1;
  let canvasH = 1;
  const splatPos = new Float32Array(32);
  const splatForce = new Float32Array(16);
  const moonPos = new Float32Array(16);

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, options.lite ? 1 : 1.5);
    canvasW = Math.max(1, Math.round(window.innerWidth * dpr));
    canvasH = Math.max(1, Math.round(window.innerHeight * dpr));
    canvas.width = canvasW;
    canvas.height = canvasH;
    dirty = true;
    kick();
  };

  /** Visible window in sim uv for the current camera. */
  const extent = () => {
    const extentV = 1 / camera.zoom;
    const extentU = extentV * ((canvasW / canvasH) / (SIM_W / SIM_H));
    return { u: extentU, v: extentV };
  };

  const pushSplat = (s: Splat) => { if (queue.length < 24) queue.push(s); };

  const stir = (clientX: number, clientY: number, dx: number, dy: number) => {
    if (!running || options.reduced) return;
    const e = extent();
    const nx = clientX / window.innerWidth;
    const ny = 1 - clientY / window.innerHeight;
    const u = camera.lon + (nx - 0.5) * e.u;
    const v = clamp(camera.v + (ny - 0.5) * e.v, 0, 1);
    // Screen pixels to sheet texels, then to a push.
    const texelsX = (dx / window.innerWidth) * e.u * SIM_W;
    const texelsY = (-dy / window.innerHeight) * e.v * SIM_H;
    const fx = clamp(texelsX * 3.4, -120, 120);
    const fy = clamp(texelsY * 3.4, -120, 120);
    pushSplat({ u: u - Math.floor(u), v, radius: 20, fx, fy });
  };

  const stepSim = (dt: number) => {
    // Eased controls.
    const jetsGoal = holding ? 0 : 1;
    jets += (jetsGoal - jets) * (1 - Math.exp(-dt * 4));
    drag += ((holding ? 0.06 : 0.35) - drag) * (1 - Math.exp(-dt * 3));
    const grsGoal = holding ? 0.25 : 1;
    grsOn += (grsGoal - grsOn) * (1 - Math.exp(-dt * 3));
    recover = holding ? 1 : Math.max(0, recover - dt / 6);
    relax = holding ? 0 : 0.09 + 1.1 * recover;

    // Churn: while the jets are held still, random eddies mix the sheet.
    if (holding) {
      churnClock += dt;
      while (churnClock > 0.16) {
        churnClock -= 0.16;
        const angle = Math.random() * Math.PI * 2;
        const speed = 38 + Math.random() * 30;
        pushSplat({ u: Math.random(), v: 0.12 + Math.random() * 0.76, radius: 16 + Math.random() * 14, fx: Math.cos(angle) * speed, fy: Math.sin(angle) * speed });
      }
    }
    // The moons: each pushes the sheet as it crosses, once per lap.
    if (SPECS[regime].moons > 0.5) {
      for (const moon of MOONS) {
        const u = (moon.phase + time * moon.speed) % 1;
        pushSplat({ u, v: moon.v, radius: 11, fx: 7 + moon.speed * 380, fy: 0 });
      }
    }

    // Row means (the zonal wind).
    gl.useProgram(P.rowMean.program);
    bind(velocity.read.texture, 0, P.rowMean.uniform.uVel);
    draw(rowMean, 1, SIM_H);

    // Drive the jets, hold the Spot.
    gl.useProgram(P.force.program);
    bind(velocity.read.texture, 0, P.force.uniform.uVel);
    bind(rowMean.texture, 1, P.force.uniform.uRow);
    bind(jetTexture, 2, P.force.uniform.uJet);
    gl.uniform1f(P.force.uniform.uDt, dt);
    gl.uniform1f(P.force.uniform.uJets, jets);
    gl.uniform1f(P.force.uniform.uDrag, drag);
    gl.uniform2f(P.force.uniform.uGrs, GRS.u, GRS.v);
    gl.uniform1f(P.force.uniform.uGrsOn, grsOn);
    draw(velocity.write, SIM_W, SIM_H);
    velocity.swap();

    // Pushes from the pointer, the moons and the churn.
    if (queue.length) {
      gl.useProgram(P.splat.program);
      while (queue.length) {
        const count = Math.min(8, queue.length);
        for (let i = 0; i < count; i++) {
          const s = queue.shift()!;
          splatPos.set([s.u, s.v, s.radius, 0], i * 4);
          splatForce.set([s.fx, s.fy], i * 2);
        }
        bind(velocity.read.texture, 0, P.splat.uniform.uVel);
        gl.uniform4fv(P.splat.uniform.uS, splatPos);
        gl.uniform2fv(P.splat.uniform.uF, splatForce);
        gl.uniform1i(P.splat.uniform.uSN, count);
        draw(velocity.write, SIM_W, SIM_H);
        velocity.swap();
      }
    }

    // Move the velocity along itself.
    gl.useProgram(P.advectVel.program);
    bind(velocity.read.texture, 0, P.advectVel.uniform.uVel);
    gl.uniform1f(P.advectVel.uniform.uDt, dt);
    gl.uniform1f(P.advectVel.uniform.uDiss, 1 / (1 + dt * 0.04));
    draw(velocity.write, SIM_W, SIM_H);
    velocity.swap();

    // Make it incompressible.
    gl.useProgram(P.divergence.program);
    bind(velocity.read.texture, 0, P.divergence.uniform.uVel);
    draw(divergence, SIM_W, SIM_H);
    gl.useProgram(P.pressure.program);
    bind(divergence.texture, 1, P.pressure.uniform.uDiv);
    for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
      bind(pressure.read.texture, 0, P.pressure.uniform.uP);
      draw(pressure.write, SIM_W, SIM_H);
      pressure.swap();
    }
    gl.useProgram(P.gradient.program);
    bind(pressure.read.texture, 0, P.gradient.uniform.uP);
    bind(velocity.read.texture, 1, P.gradient.uniform.uVel);
    draw(velocity.write, SIM_W, SIM_H);
    velocity.swap();

    // Carry the cloud deck.
    gl.useProgram(P.advectD.program);
    bind(velocity.read.texture, 0, P.advectD.uniform.uVel);
    bind(displacement.read.texture, 1, P.advectD.uniform.uD);
    gl.uniform1f(P.advectD.uniform.uDt, dt);
    gl.uniform1f(P.advectD.uniform.uRelax, relax);
    gl.uniform2f(P.advectD.uniform.uGrs, GRS.u, GRS.v);
    gl.uniform1f(P.advectD.uniform.uGrsOn, grsOn);
    draw(displacement.write, SIM_W, SIM_H);
    displacement.swap();
    time += dt;
  };

  const render = (dt: number) => {
    const spec = SPECS[regime];
    const ease = 1 - Math.exp(-dt * (options.reduced ? 60 : 2.6));
    // Longitude drifts east like the planet turning, unless the camera is on the Spot.
    if (spec.onGrs) {
      let target = GRS.u;
      target += Math.round(camera.lon - target);
      camera.lon += (target - camera.lon) * ease;
    } else if (!options.reduced) {
      camera.lon += dt * 0.004;
    }
    camera.v += (spec.v - camera.v) * ease;
    camera.zoom += (spec.zoom - camera.zoom) * ease;
    camera.deep += (spec.deep - camera.deep) * ease;
    camera.aurora += (spec.aurora - camera.aurora) * ease;
    camera.moons += (spec.moons - camera.moons) * ease;
    camera.exposure += (spec.exposure - camera.exposure) * ease;
    const e = extent();
    camera.v = clamp(camera.v, e.v / 2, 1 - e.v / 2);

    gl.useProgram(P.display.program);
    bind(mapTexture, 0, P.display.uniform.uMap);
    bind(displacement.read.texture, 1, P.display.uniform.uD);
    gl.uniform2f(P.display.uniform.uCenter, camera.lon, camera.v);
    gl.uniform2f(P.display.uniform.uExtent, e.u, e.v);
    gl.uniform1f(P.display.uniform.uDeep, camera.deep);
    gl.uniform1f(P.display.uniform.uAurora, camera.aurora);
    gl.uniform1f(P.display.uniform.uMoons, camera.moons);
    gl.uniform1f(P.display.uniform.uExposure, camera.exposure);
    gl.uniform1f(P.display.uniform.uTime, time);
    MOONS.forEach((moon, i) => moonPos.set([(moon.phase + time * moon.speed) % 1, moon.v, 0, 0], i * 4));
    gl.uniform4fv(P.display.uniform.uMoon, moonPos);
    draw(null, canvasW, canvasH);
  };

  const settled = () => Math.abs(SPECS[regime].zoom - camera.zoom) < 1e-3 && Math.abs(SPECS[regime].v - camera.v) < 1e-3
    && Math.abs(SPECS[regime].deep - camera.deep) < 1e-3 && Math.abs(SPECS[regime].aurora - camera.aurora) < 1e-3
    && Math.abs(SPECS[regime].moons - camera.moons) < 1e-3;

  // Pre-roll, so the page opens on developed weather rather than a still image.
  const preroll = options.reduced ? 360 : 140;
  for (let i = 0; i < preroll; i++) stepSim(1 / 30);
  for (const t of [displacement.read, displacement.write]) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
  time = 0;

  const tick = (now: number) => {
    raf = 0;
    if (disposed || !active || document.hidden) return;
    const dt = clamp((now - (last || now)) / 1000, 0, 1 / 20);
    last = now;
    if (running && !options.reduced) {
      stepSim(Math.max(dt, 1 / 120));
      render(dt);
    } else if (dirty || !settled()) {
      render(Math.max(dt, 1 / 60));
      dirty = false;
    }
    if ((running && !options.reduced) || !settled()) raf = requestAnimationFrame(tick);
    else last = 0;
  };
  function kick() {
    if (!raf && active && !disposed) raf = requestAnimationFrame(tick);
  }
  const onVisibility = () => { if (!document.hidden) { last = 0; kick(); } };
  document.addEventListener('visibilitychange', onVisibility);

  const api: Sheet = {
    setRegime(next) { regime = next; kick(); },
    setHold(on) { if (!options.reduced) holding = on; },
    stir,
    setRunning(on) { running = on; last = 0; kick(); },
    setActive(on) {
      active = on;
      if (on) { last = 0; dirty = true; kick(); } else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    },
    resize,
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteVertexArray(vao);
      gl.deleteShader(vertex);
      disposables.forEach((fn) => fn());
    },
  };

  if (process.env.NODE_ENV === 'development') {
    (window as unknown as Record<string, unknown>).__jupiter = {
      state: () => ({ regime, holding, jets: +jets.toFixed(2), grsOn: +grsOn.toFixed(2), relax: +relax.toFixed(2), camera: { ...camera }, queue: queue.length, size: [SIM_W, SIM_H] }),
      stir,
      step: (n: number) => { for (let i = 0; i < n; i++) { stepSim(1 / 60); render(1 / 60); } },
    };
  }

  resize();
  return api;
}
