/**
 * GLSL (WebGL2) for the ring plate. Particles live in two float textures (position and velocity)
 * and are advanced on the GPU with a leapfrog step in units where Saturn's radius is 1 and its
 * GM is 1. Everything else here is projection: an orthographic view of the ring plane, tilted
 * about the x axis, with the planet occluding what is behind it.
 */

const PRE = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
`;

export const FULLSCREEN = /* glsl */ `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

/**
 * One leapfrog step for every particle, writing position and velocity (two outputs).
 *   uPos = (x, y, kind, clock)   kind 0 ring, 1 plume grain waiting, 2 plume grain flying
 *   uVel = (vx, vy, palette, size)
 */
export const UPDATE = PRE + /* glsl */ `
  uniform sampler2D uPos;
  uniform sampler2D uVel;
  uniform float uDt;
  uniform float uTime;
  uniform vec4 uMoon[4];   // x, y, mass, softening
  uniform vec4 uEnc;       // Enceladus x, y, vx, vy (the source of the plume grains)
  layout(location = 0) out vec4 oPos;
  layout(location = 1) out vec4 oVel;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    ivec2 id = ivec2(gl_FragCoord.xy);
    vec4 P = texelFetch(uPos, id, 0);
    vec4 V = texelFetch(uVel, id, 0);
    vec2 x = P.xy;
    vec2 v = V.xy;
    float kind = P.z;
    float clock = P.w;

    if (kind > 0.5) {
      // Plume grains: wait, then leave Enceladus with a small kick, fly for a while, repeat.
      vec2 seed = vec2(float(id.x) * 0.37 + uTime * 0.013, float(id.y) * 0.71);
      if (uTime >= clock) {
        if (kind < 1.5) {
          float a = hash(seed) * 6.2831853;
          float s = 0.02 + 0.075 * hash(seed + 3.1);
          x = uEnc.xy;
          v = uEnc.zw + vec2(cos(a), sin(a)) * s;
          kind = 2.0;
          clock = uTime + 80.0 + 260.0 * hash(seed + 7.7);
        } else {
          kind = 1.0;
          clock = uTime + 2.0 + 30.0 * hash(seed + 1.3);
          x = vec2(0.0, 1000.0);
        }
      }
      if (kind < 1.5) { oPos = vec4(x, kind, clock); oVel = V; return; }
    }

    x += v * uDt;
    float r2 = dot(x, x);
    float ir = inversesqrt(r2);
    vec2 acc = -x * ir * ir * ir;
    for (int i = 0; i < 4; i++) {
      float mu = uMoon[i].z;
      if (mu <= 0.0) continue;
      vec2 m = uMoon[i].xy;
      vec2 d = m - x;
      float d2 = dot(d, d) + uMoon[i].w * uMoon[i].w;
      // Direct pull, minus the pull on Saturn itself (we work in Saturn's frame).
      acc += mu * (d * pow(d2, -1.5) - m * pow(dot(m, m), -1.5));
    }
    v += acc * uDt;
    // Anything that falls into the planet is gone.
    float size = V.w;
    if (r2 < 1.0) size = 0.0;
    oPos = vec4(x, kind, clock);
    oVel = vec4(v, V.z, size);
  }
`;

/** Shared projection: the ring plane (z = 0 at rest) tilted about x, orthographic. */
const PROJECT = /* glsl */ `
  uniform float uTilt;      // radians, 0 = looking straight down on the north pole
  uniform float uViewR;     // half-width of the plate, in Saturn radii
  uniform vec2 uCenter;     // pan, in Saturn radii (view space)
  vec3 toView(vec3 p) {
    float c = cos(uTilt);
    float s = sin(uTilt);
    return vec3(p.x, p.y * c + p.z * s, -p.y * s + p.z * c);
  }
  vec2 toNdc(vec3 v) { return (v.xy - uCenter) / uViewR; }
`;

export const PARTICLE_VERTEX = PRE + PROJECT + /* glsl */ `
  uniform sampler2D uPos;
  uniform sampler2D uVel;
  uniform ivec2 uSize;
  uniform vec3 uSun;
  uniform vec3 uPalette[8];
  uniform float uPx;
  uniform float uBright;
  uniform float uPlume;
  out vec4 vColor;
  float hash(float n) { return fract(sin(n * 12.9898) * 43758.5453); }
  void main() {
    ivec2 id = ivec2(gl_VertexID % uSize.x, gl_VertexID / uSize.x);
    vec4 P = texelFetch(uPos, id, 0);
    vec4 V = texelFetch(uVel, id, 0);
    float kind = P.z;
    float jitter = hash(float(gl_VertexID));
    // A hair of vertical thickness, so edge-on the plane is a line and not nothing.
    float z = (jitter - 0.5) * 0.0036 * (kind > 1.5 ? 12.0 : 1.0);
    vec3 view = toView(vec3(P.xy, z));
    vec2 ndc = toNdc(view);

    bool hidden = V.w <= 0.0 || (kind > 0.5 && kind < 1.5) || (kind > 1.5 && uPlume < 0.5);
    // Behind the planet: the sphere's front surface is at depth sqrt(1 - rho^2).
    vec2 rel = view.xy;
    float rho2 = dot(rel, rel);
    if (rho2 < 1.0 && view.z < sqrt(1.0 - rho2)) hidden = true;

    // In the planet's shadow: the ray toward the Sun passes through the sphere.
    vec3 p = vec3(P.xy, z);
    float along = dot(p, uSun);
    float shadow = (along < 0.0 && dot(p, p) - along * along < 1.0) ? 1.0 : 0.0;

    int pal = int(V.z + 0.5);
    vec3 colour = uPalette[pal];
    float lit = mix(1.0, 0.05, shadow);
    vColor = kind > 1.5 ? vec4(colour * lit * 0.6 * (0.7 + 0.5 * jitter), 1.0) : vec4(colour * lit * uBright * (0.8 + 0.4 * jitter), 1.0);
    gl_PointSize = hidden ? 0.0 : max(1.0, V.w * uPx * (0.85 + 0.3 * jitter));
    gl_Position = hidden ? vec4(2.0, 2.0, 2.0, 1.0) : vec4(ndc, 0.0, 1.0);
  }
`;

export const PARTICLE_FRAGMENT = PRE + /* glsl */ `
  in vec4 vColor;
  out vec4 outColor;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = smoothstep(1.0, 0.2, d);
    outColor = vec4(vColor.rgb * a, a);
  }
`;

/** The planet: a lit sphere with the Saturn texture, a hexagon jet at the pole, and ring shade. */
export const PLANET_FRAGMENT = PRE + PROJECT + /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uSun;
  uniform float uSpin;
  uniform float uHex;
  uniform float uAspect;
  in vec2 vUv;
  out vec4 outColor;
  void main() {
    vec2 ndc = vUv * 2.0 - 1.0;
    vec2 view = ndc * uViewR + uCenter;
    float rho2 = dot(view, view);
    if (rho2 >= 1.0) { outColor = vec4(0.0); return; }
    float zv = sqrt(1.0 - rho2);
    // Back to planet coordinates (inverse of the tilt).
    float c = cos(uTilt);
    float s = sin(uTilt);
    vec3 n = vec3(view.x, view.y * c - zv * s, view.y * s + zv * c);
    float lon = atan(n.y, n.x) + uSpin;
    float lat = asin(clamp(n.z, -1.0, 1.0));
    vec3 col = texture(uMap, vec2(lon / 6.2831853 + 0.5, lat / 3.14159265 + 0.5)).rgb;
    // The north polar hexagon: a jet drawn as a six-sided ring around the pole, and its vortex.
    float colat = acos(clamp(n.z, -1.0, 1.0));
    float theta = atan(n.y, n.x) + uSpin * 0.2;
    float seg = mod(theta + 0.5236, 1.0472) - 0.5236;
    float hex = 0.2 * 0.866025 / cos(seg);
    float jet = smoothstep(0.034, 0.0, abs(colat - hex)) * 0.85;
    float eye = smoothstep(0.05, 0.0, colat) * 0.7;
    col = mix(col, vec3(0.32, 0.26, 0.2), (jet + eye * 0.0) * uHex);
    col = mix(col, col * vec3(0.8, 0.9, 1.15), eye * uHex);
    float diffuse = max(dot(n, uSun), 0.0);
    float limb = pow(zv, 0.35);
    col *= (0.07 + 1.0 * smoothstep(-0.05, 0.9, diffuse)) * mix(0.82, 1.0, limb);
    outColor = vec4(col, 1.0);
  }
`;

/** Small markers: moons and the Cassini craft. Ring outline plus a core. */
export const MARKER_VERTEX = PRE + PROJECT + /* glsl */ `
  in vec3 aPos;
  in vec2 aStyle;   // size in px, kind
  out vec2 vStyle;
  uniform float uPx;
  void main() {
    vec3 view = toView(aPos);
    vec2 ndc = toNdc(view);
    float rho2 = dot(view.xy, view.xy);
    bool hidden = rho2 < 1.0 && view.z < sqrt(1.0 - rho2);
    vStyle = aStyle;
    gl_PointSize = hidden ? 0.0 : aStyle.x * uPx;
    gl_Position = hidden ? vec4(2.0, 2.0, 2.0, 1.0) : vec4(ndc, 0.0, 1.0);
  }
`;

export const MARKER_FRAGMENT = PRE + /* glsl */ `
  in vec2 vStyle;
  out vec4 outColor;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float ring = smoothstep(0.12, 0.0, abs(d - 0.82));
    float core = smoothstep(0.34, 0.0, d);
    float a = vStyle.y > 1.5 ? core : max(ring * 0.9, core);
    vec3 colour = vStyle.y > 1.5 ? vec3(1.0, 0.85, 0.5) : vec3(1.0, 0.96, 0.86);
    outColor = vec4(colour * a, a);
  }
`;

/** Orbit and path lines in the same view. */
export const LINE_VERTEX = PRE + PROJECT + /* glsl */ `
  in vec3 aPos;
  uniform float uScale;
  void main() {
    vec3 view = toView(vec3(aPos.xy * uScale, aPos.z));
    gl_Position = vec4(toNdc(view), 0.0, 1.0);
    // Parts of a line behind the planet are hidden by sending them off screen.
    float rho2 = dot(view.xy, view.xy);
    if (rho2 < 1.0 && view.z < sqrt(1.0 - rho2)) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  }
`;

export const LINE_FRAGMENT = PRE + /* glsl */ `
  uniform vec4 uColor;
  out vec4 outColor;
  void main() { outColor = vec4(uColor.rgb * uColor.a, uColor.a); }
`;
