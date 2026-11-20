/**
 * GLSL for the scroll dive: the lit globe, the Viking mosaic laid on it, a thin atmosphere,
 * stars, and the "macro" rock that is generated live from layers down to single grains.
 */

const NOISE = /* glsl */ `
  float h21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  vec2 h22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      sum += amp * vnoise(p);
      p = p * 2.03 + 17.1;
      amp *= 0.5;
    }
    return sum;
  }
`;

// The planet ---------------------------------------------------------------
export const GLOBE_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vW;
  void main() {
    vUv = uv;
    vN = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vW = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const GLOBE_FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uSun;
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vW;
  void main() {
    vec3 n = normalize(vN);
    float d = dot(n, uSun);
    float lit = smoothstep(-0.05, 0.9, d);
    vec3 col = texture2D(uMap, vUv).rgb * (0.06 + 1.05 * lit);
    // A thin haze at the limb: Mars's air is under one percent of Earth's.
    float rim = pow(1.0 - max(dot(n, normalize(cameraPosition - vW)), 0.0), 3.2);
    col += vec3(0.9, 0.58, 0.4) * rim * 0.32 * smoothstep(-0.3, 0.5, d);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export const PATCH_FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uSun;
  uniform float uAlpha;
  uniform float uDetail;
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vW;
  ${NOISE}
  void main() {
    vec3 tex = texture2D(uMap, vUv).rgb;
    float d = dot(normalize(vN), uSun);
    float lit = smoothstep(-0.05, 0.9, d);
    // As the camera closes in, the mosaic is sharpened with fine generated relief.
    float detail = fbm(vUv * vec2(1500.0, 530.0)) + 0.5 * vnoise(vUv * vec2(5200.0, 1850.0));
    tex *= 1.0 + (detail - 0.75) * uDetail;
    float edge = smoothstep(0.0, 0.05, min(vUv.x, 1.0 - vUv.x)) * smoothstep(0.0, 0.1, min(vUv.y, 1.0 - vUv.y));
    gl_FragColor = vec4(tex * (0.06 + 1.05 * lit), uAlpha * edge);
  }
`;

export const HALO_FRAGMENT = /* glsl */ `
  uniform vec3 uSun;
  uniform float uAlpha;
  varying vec3 vN;
  varying vec3 vW;
  void main() {
    vec3 n = normalize(vN);
    float facing = -dot(n, normalize(cameraPosition - vW));
    float glow = pow(smoothstep(0.0, 0.36, facing), 1.6);
    float lit = smoothstep(-0.4, 0.6, dot(n, uSun));
    gl_FragColor = vec4(vec3(0.95, 0.6, 0.4) * glow * lit * 0.5 * uAlpha, 1.0);
  }
`;

export const STAR_VERTEX = /* glsl */ `
  attribute float aSize;
  varying float vSize;
  void main() {
    vSize = aSize;
    gl_PointSize = aSize;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const STAR_FRAGMENT = /* glsl */ `
  uniform float uAlpha;
  varying float vSize;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = (1.0 - smoothstep(0.2, 1.0, d)) * uAlpha * (0.35 + 0.18 * vSize);
    gl_FragColor = vec4(vec3(1.0, 0.93, 0.85) * a, a);
  }
`;

// The macro rock ---------------------------------------------------------------
export const MACRO_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/**
 * A rock face generated from layers, shown at the width uW (metres across the frame):
 * bands a few metres thick, laminae a couple of centimetres apart, pebbles, sand grains about
 * a millimetre across, and hematite spherules a few millimetres across. Every feature has a
 * fixed real size, and fades once it is too small to resolve, so zooming is continuous.
 */
export const MACRO_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform float uW;
  uniform vec2 uRes;
  uniform float uAlpha;
  uniform float uBerry;
  uniform float uSand;
  varying vec2 vUv;
  ${NOISE}

  float gPx;
  // 0 when a feature of size s (metres) is under 1.5 pixels, 1 when it is over 7.
  float seen(float s) { return smoothstep(1.5, 7.0, s / gPx); }

  void main() {
    gPx = uW / uRes.x;
    vec2 m = (vUv - 0.5) * vec2(uW, uW * uRes.y / uRes.x);
    vec3 L3 = normalize(vec3(-0.5, 0.7, 0.55));
    vec2 L2 = vec2(-0.55, 0.83);

    // Bands: the same palette as the layered outcrop in the landscape.
    float wy = m.y + 6.0;
    float warp = 0.35 * sin(m.x * 0.6 + wy * 0.2) + 0.5 * (vnoise(m * 0.7) - 0.5);
    float band = sin(wy * 1.9 + warp) * 0.5 + 0.5;
    vec3 rock = mix(vec3(0.30, 0.15, 0.09), vec3(0.64, 0.38, 0.23), smoothstep(0.3, 0.7, band));
    rock = mix(rock, mix(rock, vec3(0.66, 0.5, 0.38), 0.65), uSand);
    rock *= 0.85 + 0.3 * vnoise(m * 3.1 + wy);
    rock *= 0.88 + 0.24 * fbm(m * 11.0 + 3.0) * seen(0.08);
    rock *= 0.94 + 0.12 * fbm(m * 38.0) * seen(0.03);

    // Laminae: thin beds about two centimetres apart.
    float lam = sin(wy * 314.0 + 4.0 * vnoise(vec2(m.x * 9.0, wy * 41.0)));
    rock *= 1.0 + 0.15 * lam * seen(0.02);

    // Sand grains about 1.3 mm across: domed cells with dark cement between them.
    float grainSeen = seen(0.0013);
    if (grainSeen > 0.01) {
      vec2 g = m / 0.0013;
      vec2 gi = floor(g);
      vec2 gf = fract(g);
      float best = 9.0;
      vec2 toCentre = vec2(0.0);
      float id = 0.0;
      for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
          vec2 o = vec2(float(i), float(j));
          vec2 r = o + h22(gi + o) * 0.85 + 0.075 - gf;
          float d = dot(r, r);
          if (d < best) { best = d; toCentre = r; id = h21(gi + o + 31.7); }
        }
      }
      float dist = sqrt(best) + 0.14 * (vnoise(g * 2.3) - 0.5);
      vec3 gc = rock * (0.62 + 0.75 * id);
      gc = mix(gc, vec3(0.78, 0.7, 0.6), step(0.93, id) * 0.8);
      gc = mix(gc, vec3(0.12, 0.09, 0.08), step(id, 0.07) * 0.85);
      float dome = 0.8 + 0.6 * clamp(dot(-toCentre, L2) * 1.6, -0.45, 0.45);
      gc *= dome * (1.0 - 0.7 * smoothstep(0.2, 0.46, dist));
      rock = mix(rock, gc, grainSeen);
    }

    // Pebbles about three centimetres across, rounded by water. They keep clear of the sand
    // patch at the centre, which is where the dive ends.
    float pebS = 0.045;
    float pebSeen = seen(pebS * 0.45) * smoothstep(0.014, 0.05, length(m));
    float pebbleCover = 0.0;
    if (pebSeen > 0.01) {
      vec2 pg = m / pebS;
      vec2 pi = floor(pg);
      vec2 pf = fract(pg);
      float topH = 0.0;
      vec3 pc = vec3(0.0);
      float cover = 0.0;
      float nearest = 9.0;
      for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
          vec2 o = vec2(float(i), float(j));
          vec2 cid = pi + o;
          if (h21(cid + 5.3) < 0.42) continue;
          vec2 cen = o + 0.25 + 0.5 * h22(cid + 9.1);
          float rad = 0.27 + 0.2 * h21(cid + 2.2);
          vec2 q = (pf - cen) / vec2(rad * (0.85 + 0.3 * h21(cid + 7.7)), rad);
          float rr = length(q);
          nearest = min(nearest, rr);
          float h = sqrt(max(1.0 - rr * rr, 0.0));
          float aa = gPx / (pebS * rad);
          float c = 1.0 - smoothstep(1.0 - 2.0 * aa, 1.0, rr);
          if (c > 0.0 && h >= topH * 0.98) {
            topH = max(topH, h);
            float k = h21(cid + 13.1);
            vec3 base = k < 0.3 ? vec3(0.45, 0.30, 0.20) : k < 0.55 ? vec3(0.30, 0.25, 0.22) : k < 0.8 ? vec3(0.55, 0.42, 0.30) : vec3(0.20, 0.17, 0.16);
            vec3 n = normalize(vec3(q * 0.95, h * 1.1 + 0.05));
            float diff = clamp(dot(n, L3), 0.0, 1.0);
            pc = base * (0.3 + 0.95 * diff) * (0.88 + 0.24 * vnoise(m * 220.0));
            cover = c;
          }
        }
      }
      rock *= 1.0 - 0.5 * (1.0 - smoothstep(1.0, 1.5, nearest)) * pebSeen;
      rock = mix(rock, pc, cover * pebSeen);
      pebbleCover = cover * pebSeen;
    }

    // Hematite spherules, about four millimetres across, in the sandstone.
    float bs = 0.008;
    float berrySeen = uBerry * seen(0.003) * (1.0 - pebbleCover);
    if (berrySeen > 0.01) {
      vec2 bg = m / bs + 0.5;
      vec2 bi = floor(bg);
      vec2 bf = fract(bg);
      float topZ = -1.0;
      vec3 bc = vec3(0.0);
      float cover = 0.0;
      float socket = 9.0;
      for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
          vec2 o = vec2(float(i), float(j));
          vec2 cid = bi + o;
          bool centre = all(equal(cid, vec2(0.0)));
          if (!centre && h21(cid + 3.7) < 0.55) continue;
          vec2 cen = centre ? vec2(0.5) + o : o + 0.2 + 0.6 * h22(cid + 1.3);
          float rad = centre ? 0.3 : 0.17 + 0.13 * h21(cid + 8.8);
          vec2 q = (bf - cen) / rad;
          float rr = length(q);
          socket = min(socket, rr);
          float aa = gPx / (bs * rad);
          float c = 1.0 - smoothstep(1.0 - 2.0 * aa, 1.0, rr);
          float z = sqrt(max(1.0 - rr * rr, 0.0));
          if (c > 0.0 && z >= topZ * 0.98) {
            topZ = max(topZ, z);
            vec3 n = normalize(vec3(q, z + 0.001));
            float diff = max(dot(n, L3), 0.0);
            float spec = pow(max(dot(reflect(-L3, n), vec3(0.0, 0.0, 1.0)), 0.0), 40.0);
            float fres = pow(1.0 - n.z, 3.0);
            vec3 base = mix(vec3(0.27, 0.29, 0.34), vec3(0.4, 0.42, 0.47), h21(cid + 4.1));
            vec3 env = mix(vec3(0.42, 0.3, 0.22), vec3(0.62, 0.66, 0.74), n.y * 0.5 + 0.5);
            bc = base * (0.22 + 0.95 * diff) + env * fres * 0.5 + vec3(1.0, 0.95, 0.9) * spec * 0.8;
            cover = c;
          }
        }
      }
      rock *= 1.0 - 0.55 * (1.0 - smoothstep(1.0, 1.7, socket)) * berrySeen;
      rock = mix(rock, bc, cover * berrySeen);
    }

    vec3 col = rock * 1.08;
    float vignette = smoothstep(1.3, 0.35, length((vUv - 0.5) * vec2(1.25, 1.0)));
    col *= mix(0.74, 1.0, vignette);
    gl_FragColor = vec4(col, uAlpha);
  }
`;
