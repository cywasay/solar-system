import {
  FEATURES, SHOT_LIST, SUN, T_END, T_START, T_TRITON, TRITON_CAP, arcPhase, add, cross, dot, featureLon, len, norm, scale, spacecraft, spin, sub,
  surface, targets, triton, type TargetId, type V3, R_KM,
} from './encounter';
import { SCENE, VERTEX } from './flybyShaders';

/**
 * The encounter as a game. Time runs along Voyager's fixed path; you aim the camera and take
 * pictures. While the shutter is open the camera adds up a fresh render every frame, so if the
 * target moves in the frame the picture smears, exactly as it would. A colour picture is three
 * exposures through orange, green and violet filters, taken one after another.
 */

export type Mode = 'bw' | 'colour';
export type Phase = 'briefing' | 'running' | 'paused' | 'ended';
export type Photo = { id: number; target: TargetId | null; label: string; colour: boolean; sharpness: number; url: string; t: number; note: string };
export type Snapshot = {
  t: number; phase: Phase; fast: boolean; rangeKm: number; speed: number; frames: number; mode: Mode; track: boolean;
  exposing: null | { filter: string; progress: number }; inFrame: string | null;
};
export type Flyby = {
  start: () => void;
  setPaused: (paused: boolean) => void;
  setFast: (fast: boolean) => void;
  setMode: (mode: Mode) => void;
  setTrack: (on: boolean) => void;
  seek: (t: number) => void;
  skipToNext: () => void;
  pointAt: (id: TargetId) => void;
  shutter: () => void;
  slew: (dx: number, dy: number) => void;
  snapshot: () => Snapshot;
  onChange: (cb: (s: Snapshot) => void) => void;
  onPhoto: (cb: (p: Photo) => void) => void;
  setActive: (on: boolean) => void;
  resize: () => void;
  dispose: () => void;
};

export const FRAMES = 20;
const FINDER_FOV = 32 * (Math.PI / 180);
const CAMERA_FOV = 4 * (Math.PI / 180);
const PHOTO = 320;
const FILTERS = {
  clear: { w: [0.3, 0.5, 0.2] as V3, name: 'Clear' },
  orange: { w: [0.87, 0.13, 0] as V3, name: 'Orange' },
  green: { w: [0.08, 0.84, 0.08] as V3, name: 'Green' },
  violet: { w: [0.04, 0.13, 0.83] as V3, name: 'Violet' },
};
type FilterKey = keyof typeof FILTERS;
const DEG = 180 / Math.PI;

/** Mission seconds per real second: slower around the two close passes. */
function rate(t: number) {
  if (Math.abs(t) < 0.55) return 55;
  if (Math.abs(t - T_TRITON) < 0.5) return 70;
  return 300;
}

export async function createFlyby(canvas: HTMLCanvasElement, overlay: HTMLCanvasElement, options: { lite: boolean; reduced: boolean }): Promise<Flyby> {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
  if (!gl) throw new Error('webgl2 unavailable');
  const octx = overlay.getContext('2d');

  const compile = (type: number, code: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, code);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader error');
    return sh;
  };
  const prog = gl.createProgram()!;
  const vs = compile(gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl.FRAGMENT_SHADER, SCENE);
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link error');
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  const u = (name: string) => gl.getUniformLocation(prog, name);
  const U = {
    cam: u('uCam'), fwd: u('uFwd'), right: u('uRight'), up: u('uUp'), tanHalf: u('uTanHalf'), aspect: u('uAspect'), sun: u('uSun'), spin: u('uSpin'),
    hours: u('uHours'), feat: u('uFeat'), triton: u('uTriton'), cap: u('uTritonCap'), plume: u('uPlume'), plumeWind: u('uPlumeWind'), arc: u('uArc'),
    filter: u('uFilter'), finder: u('uFinder'), seed: u('uSeed'), gain: u('uGain'),
  };
  const vao = gl.createVertexArray()!;

  // The camera renders into its own small framebuffer, read back after every sub-frame.
  const camTex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, camTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, PHOTO, PHOTO, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  const camFbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, camFbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, camTex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  const readBuf = new Uint8Array(PHOTO * PHOTO * 4);

  // Plume sites near the middle of Triton's sunlit cap.
  const capPerp = norm(cross(TRITON_CAP, [1, 0, 0]));
  const capPerp2 = cross(TRITON_CAP, capPerp);
  const plumeDirs: V3[] = [[0.55, 0.3], [0.42, -0.5], [0.7, 0.05]].map(([a, b]) => norm(add(add(scale(TRITON_CAP, 0.75), scale(capPerp, a)), scale(capPerp2, b))));
  const plumeWind = norm(capPerp2);

  // State ---------------------------------------------------------------------------------
  let t = T_START;
  let phase: Phase = 'briefing';
  let fast = false;
  let mode: Mode = 'colour';
  let track = false;
  let frames = FRAMES;
  let aim: V3 = norm(scale(spacecraft(T_START).pos, -1));
  let active = false;
  let raf = 0;
  let last = 0;
  let width = 1;
  let height = 1;
  let cssW = 1;
  let cssH = 1;
  let photoId = 0;
  let slewTo: { dir: V3; left: number } | null = null;
  type Exposure = { filters: FilterKey[]; index: number; started: number; duration: number; target: TargetId | null; sums: Float32Array[]; counts: number[]; offsets: [number, number][]; startT: number };
  let exposure: Exposure | null = null;
  const changeCbs: ((s: Snapshot) => void)[] = [];
  const photoCbs: ((p: Photo) => void)[] = [];
  let lastNotify = 0;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(1, rect.width);
    cssH = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, options.lite ? 1 : 1.25);
    width = Math.round(cssW * dpr);
    height = Math.round(cssH * dpr);
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    const odpr = Math.min(window.devicePixelRatio || 1, 2);
    overlay.width = Math.round(cssW * odpr);
    overlay.height = Math.round(cssH * odpr);
  };
  resize();

  const basis = (dir: V3) => {
    let right = cross(dir, [0, 0, 1]);
    if (len(right) < 1e-4) right = [1, 0, 0];
    right = norm(right);
    const up = cross(right, dir);
    return { right, up };
  };

  const setScene = (cam: V3, fwd: V3, fov: number, aspect: number, filter: V3, finder: boolean, gain: number) => {
    const { right, up } = basis(fwd);
    gl.useProgram(prog);
    gl.uniform3fv(U.cam, cam);
    gl.uniform3fv(U.fwd, fwd);
    gl.uniform3fv(U.right, right);
    gl.uniform3fv(U.up, up);
    gl.uniform1f(U.tanHalf, Math.tan(fov / 2));
    gl.uniform1f(U.aspect, aspect);
    gl.uniform3fv(U.sun, SUN);
    gl.uniform1f(U.spin, spin(t));
    gl.uniform1f(U.hours, t);
    const feat = new Float32Array(16);
    FEATURES.forEach((f, i) => feat.set([(f.lat * Math.PI) / 180, (featureLon(f, t) * Math.PI) / 180, f.semiLon, f.semiLat], i * 4));
    gl.uniform4fv(U.feat, feat);
    const tri = triton(t);
    gl.uniform3fv(U.triton, tri);
    gl.uniform3fv(U.cap, TRITON_CAP);
    gl.uniform3fv(U.plume, new Float32Array(plumeDirs.flatMap((d) => add(tri, scale(d, 1353 / R_KM)))));
    gl.uniform3fv(U.plumeWind, plumeWind);
    gl.uniform1f(U.arc, arcPhase(t));
    gl.uniform3fv(U.filter, filter);
    gl.uniform1f(U.finder, finder ? 1 : 0);
    gl.uniform1f(U.seed, (performance.now() % 1000) / 10);
    gl.uniform1f(U.gain, gain);
    gl.bindVertexArray(vao);
  };

  const project = (cam: V3, fwd: V3, dir: V3) => {
    const { right, up } = basis(fwd);
    const z = dot(dir, fwd);
    if (z <= 0.01) return null;
    const th = Math.tan(FINDER_FOV / 2);
    const x = dot(dir, right) / z / (th * (cssW / cssH));
    const y = dot(dir, up) / z / th;
    return { x: (x * 0.5 + 0.5) * cssW, y: (0.5 - y * 0.5) * cssH, inside: Math.abs(x) <= 1 && Math.abs(y) <= 1, nx: x, ny: y };
  };

  const inFrameTarget = (cam: V3) => {
    let best: { id: TargetId; ang: number; size: number; label: string } | null = null;
    for (const tg of targets(t, cam)) {
      if (!tg.valid) continue;
      const v = sub(tg.pos, cam);
      const dist = len(v);
      const ang = Math.acos(Math.min(1, dot(norm(v), aim))) * DEG;
      const size = Math.atan(tg.radius / dist) * DEG;
      if (ang < 2 + size * 0.5 && (!best || ang < best.ang)) best = { id: tg.id, ang, size, label: tg.label };
    }
    return best;
  };

  const snapshot = (): Snapshot => {
    const sc = spacecraft(t);
    const f = inFrameTarget(sc.pos);
    return {
      t, phase, fast, rangeKm: (len(sc.pos) - 1) * R_KM, speed: len(sc.vel), frames, mode, track,
      exposing: exposure ? { filter: FILTERS[exposure.filters[exposure.index]].name, progress: (exposure.index + Math.min(1, (performance.now() - exposure.started) / exposure.duration)) / exposure.filters.length } : null,
      inFrame: f?.label ?? null,
    };
  };
  const notify = (force = false) => {
    const now = performance.now();
    if (!force && now - lastNotify < 90) return;
    lastNotify = now;
    const s = snapshot();
    for (const cb of changeCbs) cb(s);
  };

  // Rendering ----------------------------------------------------------------------------
  const drawFinder = () => {
    const cam = spacecraft(t).pos;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    setScene(cam, aim, FINDER_FOV, cssW / cssH, [0.3, 0.5, 0.2], true, 1.15);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    drawOverlay(cam);
  };

  const exposeSubframe = () => {
    if (!exposure) return;
    const cam = spacecraft(t).pos;
    const key = exposure.filters[exposure.index];
    gl.bindFramebuffer(gl.FRAMEBUFFER, camFbo);
    gl.viewport(0, 0, PHOTO, PHOTO);
    const w = FILTERS[key].w;
    setScene(cam, aim, CAMERA_FOV, 1, w, false, 1.15 / (w[0] + w[1] + w[2]));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.readPixels(0, 0, PHOTO, PHOTO, gl.RGBA, gl.UNSIGNED_BYTE, readBuf);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const sum = exposure.sums[exposure.index];
    for (let i = 0, p = 0; i < sum.length; i++, p += 4) sum[i] += readBuf[p];
    exposure.counts[exposure.index]++;
    // How far the target has moved in the frame since the shutter opened.
    if (exposure.target) {
      const tg = targets(t, cam).find((x) => x.id === exposure!.target)!;
      const d = norm(sub(tg.pos, cam));
      const { right, up } = basis(aim);
      exposure.offsets.push([Math.atan2(dot(d, right), dot(d, aim)) * DEG, Math.atan2(dot(d, up), dot(d, aim)) * DEG]);
    }
  };

  const finishPhoto = () => {
    if (!exposure) return;
    const e = exposure;
    exposure = null;
    const channels = e.sums.map((sum, i) => {
      const out = new Float32Array(sum.length);
      const n = Math.max(1, e.counts[i]);
      for (let k = 0; k < sum.length; k++) out[k] = sum[k] / n / 255;
      return out;
    });
    const canvas2 = document.createElement('canvas');
    canvas2.width = PHOTO;
    canvas2.height = PHOTO;
    const c2 = canvas2.getContext('2d')!;
    const img = c2.createImageData(PHOTO, PHOTO);
    const colour = channels.length === 3;
    let seed = 1 + e.startT * 1000;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let y = 0; y < PHOTO; y++) {
      for (let x = 0; x < PHOTO; x++) {
        const src = (PHOTO - 1 - y) * PHOTO + x; // GL rows start at the bottom
        const dst = (y * PHOTO + x) * 4;
        const vx = x / PHOTO - 0.5;
        const vy = y / PHOTO - 0.5;
        const vig = 1 - 0.5 * (vx * vx + vy * vy);
        const grain = (rnd() - 0.5) * 0.05;
        const tone = (v: number) => Math.max(0, Math.min(255, (Math.pow(Math.max(0, v), 0.82) * vig + grain) * 255));
        if (colour) {
          img.data[dst] = tone(channels[0][src]);
          img.data[dst + 1] = tone(channels[1][src]);
          img.data[dst + 2] = tone(channels[2][src]);
        } else {
          const g = tone(channels[0][src]);
          img.data[dst] = g;
          img.data[dst + 1] = g;
          img.data[dst + 2] = g;
        }
        img.data[dst + 3] = 255;
      }
    }
    c2.putImageData(img, 0, 0);
    // Reseau marks: the grid of reference dots etched on Voyager's camera tubes.
    c2.fillStyle = 'rgba(0, 0, 0, 0.85)';
    for (let i = 1; i < 8; i++) for (let j = 1; j < 8; j++) {
      const x = (i / 8) * PHOTO + (j % 2 ? 4 : 0);
      const y = (j / 8) * PHOTO;
      c2.fillRect(x - 2, y - 0.5, 4, 1);
      c2.fillRect(x - 0.5, y - 2, 1, 4);
    }
    let drift = 0;
    if (e.offsets.length > 1) {
      const xs = e.offsets.map((o) => o[0]);
      const ys = e.offsets.map((o) => o[1]);
      drift = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    }
    const sharpness = e.target ? Math.max(0, Math.min(1, 1 - drift / 0.6)) : 0;
    const def = e.target ? SHOT_LIST.find((s) => s.id === e.target)! : null;
    const note = !e.target
      ? 'Nothing on the shot list in the frame.'
      : sharpness > 0.8 ? 'Sharp.'
        : sharpness > 0.45 ? (colour ? 'Slight colour fringes: the target moved between filters.' : 'Slightly smeared.')
          : colour ? 'Smeared, with colour fringes. Keep the target on the cross while the shutter is open.' : 'Smeared. Keep the target on the cross while the shutter is open.';
    const photo: Photo = { id: ++photoId, target: e.target, label: def?.label ?? 'Stars and dark sky', colour, sharpness, url: canvas2.toDataURL('image/jpeg', 0.88), t: e.startT, note };
    for (const cb of photoCbs) cb(photo);
    notify(true);
  };

  const drawOverlay = (cam: V3) => {
    if (!octx) return;
    const odpr = overlay.width / cssW;
    octx.setTransform(odpr, 0, 0, odpr, 0, 0);
    octx.clearRect(0, 0, cssW, cssH);
    octx.lineWidth = 1;
    // Reseau grid across the finder.
    octx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    const step = Math.max(60, cssH / 7);
    octx.beginPath();
    for (let x = step / 2; x < cssW; x += step) for (let y = step / 2; y < cssH; y += step) {
      octx.moveTo(x - 3, y); octx.lineTo(x + 3, y); octx.moveTo(x, y - 3); octx.lineTo(x, y + 3);
    }
    octx.stroke();
    // The camera's frame.
    const box = (CAMERA_FOV / FINDER_FOV) * cssH;
    const cx = cssW / 2;
    const cy = cssH / 2;
    const rec = !!exposure;
    octx.strokeStyle = rec ? '#ff5a4a' : 'rgba(234, 240, 255, 0.85)';
    octx.lineWidth = 1.5;
    const k = box / 2;
    const c = 10;
    octx.beginPath();
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      octx.moveTo(cx + sx * k, cy + sy * (k - c)); octx.lineTo(cx + sx * k, cy + sy * k); octx.lineTo(cx + sx * (k - c), cy + sy * k);
    }
    octx.moveTo(cx - 6, cy); octx.lineTo(cx + 6, cy); octx.moveTo(cx, cy - 6); octx.lineTo(cx, cy + 6);
    octx.stroke();
    octx.font = '11px ui-monospace, monospace';
    if (rec && exposure) {
      const p = (exposure.index + Math.min(1, (performance.now() - exposure.started) / exposure.duration)) / exposure.filters.length;
      octx.fillStyle = '#ff5a4a';
      octx.beginPath();
      octx.arc(cx - k + 6, cy - k - 12, 4, 0, Math.PI * 2);
      octx.fill();
      octx.fillText(`${FILTERS[exposure.filters[exposure.index]].name.toUpperCase()} · exposing`, cx - k + 16, cy - k - 8);
      octx.fillRect(cx - k, cy + k + 6, box * p, 2);
    }
    // Targets: brackets when in view, arrows at the edge when not.
    for (const tg of targets(t, cam)) {
      if (!tg.valid) continue;
      const v = sub(tg.pos, cam);
      const dir = norm(v);
      const pr = project(cam, aim, dir);
      const size = Math.max(9, (Math.atan(tg.radius / len(v)) / FINDER_FOV) * cssH);
      octx.strokeStyle = 'rgba(143, 180, 255, 0.9)';
      octx.fillStyle = 'rgba(143, 180, 255, 0.95)';
      if (pr && pr.inside) {
        const s = Math.min(size, cssH * 0.4);
        octx.beginPath();
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          octx.moveTo(pr.x + sx * s, pr.y + sy * (s - 5)); octx.lineTo(pr.x + sx * s, pr.y + sy * s); octx.lineTo(pr.x + sx * (s - 5), pr.y + sy * s);
        }
        octx.stroke();
        octx.textAlign = 'left';
        octx.fillText(tg.label, pr.x + s + 6, pr.y - s + 10);
      } else {
        // Edge arrow toward the target.
        const { right, up } = basis(aim);
        const ax = dot(dir, right);
        const ay = dot(dir, up);
        const ang = Math.atan2(-ay, ax);
        const ex = cx + Math.cos(ang) * (cssW / 2 - 26);
        const ey = cy + Math.sin(ang) * (cssH / 2 - 22);
        const px = Math.max(20, Math.min(cssW - 20, ex));
        const py = Math.max(20, Math.min(cssH - 20, ey));
        octx.beginPath();
        octx.moveTo(px + Math.cos(ang) * 9, py + Math.sin(ang) * 9);
        octx.lineTo(px + Math.cos(ang + 2.5) * 7, py + Math.sin(ang + 2.5) * 7);
        octx.lineTo(px + Math.cos(ang - 2.5) * 7, py + Math.sin(ang - 2.5) * 7);
        octx.fill();
        octx.textAlign = px > cssW / 2 ? 'right' : 'left';
        octx.fillText(tg.label, px + (px > cssW / 2 ? -14 : 14), py + 4);
      }
    }
  };

  // Loop ---------------------------------------------------------------------------------
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (phase === 'running') {
      const r = rate(t) * (fast && !exposure ? 5 : 1);
      t = Math.min(T_END, t + (dt * r) / 3600);
      if (t >= T_END && !exposure) { phase = 'ended'; notify(true); }
    }
    const cam = spacecraft(t).pos;
    if (slewTo) {
      const k = Math.min(1, dt * 6);
      aim = norm(add(scale(aim, 1 - k), scale(slewTo.dir, k)));
      slewTo.left -= dt;
      if (slewTo.left <= 0) slewTo = null;
    }
    if (exposure) {
      if (track && exposure.target) {
        const tg = targets(t, cam).find((x) => x.id === exposure!.target);
        if (tg) aim = norm(sub(tg.pos, cam));
      }
      exposeSubframe();
      if (now - exposure.started >= exposure.duration) {
        exposure.index++;
        exposure.started = now;
        if (exposure.index >= exposure.filters.length) finishPhoto();
      }
    }
    drawFinder();
    notify();
  };

  const startExposure = () => {
    if (exposure || phase === 'ended' || phase === 'briefing') return;
    const cost = mode === 'colour' ? 3 : 1;
    if (frames < cost) return;
    frames -= cost;
    const cam = spacecraft(t).pos;
    const f = inFrameTarget(cam);
    const target = f && f.size >= (targets(t, cam).find((x) => x.id === f.id)?.minAngle ?? 0) ? f.id : null;
    const filters: FilterKey[] = mode === 'colour' ? ['orange', 'green', 'violet'] : ['clear'];
    const duration = mode === 'colour' ? 750 : 1100;
    exposure = {
      filters, index: 0, started: performance.now(), duration, target, startT: t,
      sums: filters.map(() => new Float32Array(PHOTO * PHOTO)), counts: filters.map(() => 0), offsets: [],
    };
    if (phase === 'paused') phase = 'running';
    notify(true);
  };

  const flyby: Flyby = {
    start: () => { if (phase === 'briefing' || phase === 'ended') { if (phase === 'ended') { t = T_START; frames = FRAMES; } phase = options.reduced ? 'paused' : 'running'; aim = norm(scale(spacecraft(t).pos, -1)); notify(true); } },
    setPaused: (p) => { if (phase === 'running' || phase === 'paused') { phase = p ? 'paused' : 'running'; notify(true); } },
    setFast: (f) => { fast = f; notify(true); },
    setMode: (m) => { mode = m; notify(true); },
    setTrack: (on) => { track = on; notify(true); },
    seek: (value) => { if (exposure) return; t = Math.max(T_START, Math.min(T_END, value)); if (phase === 'ended' && t < T_END) phase = 'paused'; notify(true); },
    skipToNext: () => {
      if (exposure) return;
      const next = SHOT_LIST.find((s) => s.window[0] > t + 0.05);
      if (!next) return;
      t = next.window[0] + 0.15;
      flyby.pointAt(next.id);
      notify(true);
    },
    pointAt: (id) => {
      const cam = spacecraft(t).pos;
      const tg = targets(t, cam).find((x) => x.id === id);
      if (!tg) return;
      const dir = norm(sub(tg.pos, cam));
      // Long turns jump straight there (blending nearly opposite directions would crawl).
      if (dot(dir, aim) < 0.75) { aim = dir; slewTo = null; } else slewTo = { dir, left: 0.9 };
    },
    shutter: startExposure,
    slew: (dx, dy) => {
      if (track && exposure) return;
      const { right, up } = basis(aim);
      aim = norm(add(aim, add(scale(right, dx), scale(up, dy))));
      slewTo = null;
    },
    snapshot,
    onChange: (cb) => { changeCbs.push(cb); },
    onPhoto: (cb) => { photoCbs.push(cb); },
    setActive: (on) => {
      if (on === active) return;
      active = on;
      if (on) { last = 0; raf = requestAnimationFrame(tick); } else cancelAnimationFrame(raf);
    },
    resize: () => { resize(); },
    dispose: () => {
      cancelAnimationFrame(raf);
      gl.deleteProgram(prog);
      gl.deleteTexture(camTex);
      gl.deleteFramebuffer(camFbo);
      gl.deleteVertexArray(vao);
    },
  };
  // A first frame before the encounter starts.
  drawFinder();
  return flyby;
}

export { FINDER_FOV, surface };
