/**
 * GLSL (WebGL2) for the weather sheet: a stable-fluids solver on an unrolled strip of Jupiter's
 * cloud deck (periodic in longitude, walled at the top and bottom), plus a display pass.
 *
 * The photo is never advected as colour. The solver advects a displacement field D, "where did
 * the cloud now at this spot come from", so the display can sample the full-resolution Cassini
 * map through it and stay sharp however far the flow carries things.
 */

export const VERTEX = /* glsl */ `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

const head = (w: number, h: number) => /* glsl */ `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
#define SIM_W ${w}
#define SIM_H ${h}
const vec2 SIM = vec2(float(SIM_W), float(SIM_H));
in vec2 vUv;
out vec4 outColor;
// Offset in texels between two points, wrapped around the planet (longitude is periodic).
vec2 wrapD(vec2 d) { d.x -= SIM.x * floor(d.x / SIM.x + 0.5); return d; }
`;

export const shaders = (w: number, h: number) => ({
  /** Mean eastward flow of each row: the zonal wind. One fragment per row. */
  rowMean: head(w, h) + /* glsl */ `
    uniform sampler2D uVel;
    void main() {
      int y = int(gl_FragCoord.y);
      float sum = 0.0;
      for (int i = 0; i < SIM_W; i++) sum += texelFetch(uVel, ivec2(i, y), 0).x;
      outColor = vec4(sum / float(SIM_W), 0.0, 0.0, 1.0);
    }
  `,

  /** Pull each row's mean flow toward the jet profile, and hold the Great Red Spot's vortex. */
  force: head(w, h) + /* glsl */ `
    uniform sampler2D uVel;
    uniform sampler2D uRow;
    uniform sampler2D uJet;
    uniform float uDt;
    uniform float uJets;
    uniform float uDrag;
    uniform vec2 uGrs;
    uniform float uGrsOn;
    void main() {
      vec2 v = texture(uVel, vUv).xy;
      int y = clamp(int(vUv.y * SIM.y), 0, SIM_H - 1);
      float mean = texelFetch(uRow, ivec2(0, y), 0).x;
      float target = texelFetch(uJet, ivec2(0, y), 0).x * uJets;
      // Friction acts on the eddies only; the zonal wind is held by the jets.
      v -= uDt * uDrag * vec2(v.x - mean, v.y);
      v.x += uDt * 1.4 * (target - mean);

      // The Spot: an anticyclone (counter-clockwise in the southern hemisphere), held in place.
      vec2 d = wrapD((vUv - uGrs) * SIM);
      float r = length(d);
      float q = r / 24.0;
      vec2 tangent = vec2(-d.y, d.x) / max(r, 1e-3);
      vec2 vortex = tangent * (18.0 * q * exp(0.5 * (1.0 - q * q)));
      float hold = exp(-(q * q) / 5.76) * uGrsOn;
      v = mix(v, vortex, 1.0 - exp(-uDt * 3.0 * hold));

      v.y *= smoothstep(0.0, 8.0, min(vUv.y, 1.0 - vUv.y) * SIM.y);
      outColor = vec4(v, 0.0, 1.0);
    }
  `,

  /** Gaussian pushes: the pointer, the moons and the churn while the jets are held still. */
  splat: head(w, h) + /* glsl */ `
    uniform sampler2D uVel;
    uniform vec4 uS[8];
    uniform vec2 uF[8];
    uniform int uSN;
    void main() {
      vec2 v = texture(uVel, vUv).xy;
      for (int i = 0; i < 8; i++) {
        if (i >= uSN) break;
        vec2 d = wrapD((vUv - uS[i].xy) * SIM);
        v += uF[i] * exp(-dot(d, d) / (uS[i].z * uS[i].z));
      }
      outColor = vec4(v, 0.0, 1.0);
    }
  `,

  advectVel: head(w, h) + /* glsl */ `
    uniform sampler2D uVel;
    uniform float uDt;
    uniform float uDiss;
    void main() {
      vec2 v = texture(uVel, vUv).xy;
      vec2 back = vUv - uDt * v / SIM;
      outColor = vec4(texture(uVel, back).xy * uDiss, 0.0, 1.0);
    }
  `,

  divergence: head(w, h) + /* glsl */ `
    uniform sampler2D uVel;
    void main() {
      vec2 e = 1.0 / SIM;
      float l = texture(uVel, vUv - vec2(e.x, 0.0)).x;
      float r = texture(uVel, vUv + vec2(e.x, 0.0)).x;
      float b = texture(uVel, vUv - vec2(0.0, e.y)).y;
      float t = texture(uVel, vUv + vec2(0.0, e.y)).y;
      outColor = vec4(0.5 * ((r - l) + (t - b)), 0.0, 0.0, 1.0);
    }
  `,

  pressure: head(w, h) + /* glsl */ `
    uniform sampler2D uP;
    uniform sampler2D uDiv;
    void main() {
      vec2 e = 1.0 / SIM;
      float l = texture(uP, vUv - vec2(e.x, 0.0)).x;
      float r = texture(uP, vUv + vec2(e.x, 0.0)).x;
      float b = texture(uP, vUv - vec2(0.0, e.y)).x;
      float t = texture(uP, vUv + vec2(0.0, e.y)).x;
      outColor = vec4((l + r + b + t - texture(uDiv, vUv).x) * 0.25, 0.0, 0.0, 1.0);
    }
  `,

  gradient: head(w, h) + /* glsl */ `
    uniform sampler2D uP;
    uniform sampler2D uVel;
    void main() {
      vec2 e = 1.0 / SIM;
      float l = texture(uP, vUv - vec2(e.x, 0.0)).x;
      float r = texture(uP, vUv + vec2(e.x, 0.0)).x;
      float b = texture(uP, vUv - vec2(0.0, e.y)).x;
      float t = texture(uP, vUv + vec2(0.0, e.y)).x;
      vec2 v = texture(uVel, vUv).xy - 0.5 * vec2(r - l, t - b);
      v.y *= smoothstep(0.0, 8.0, min(vUv.y, 1.0 - vUv.y) * SIM.y);
      outColor = vec4(v, 0.0, 1.0);
    }
  `,

  /** Carry the displacement field with the flow, and let the cloud deck slowly re-form. */
  advectD: head(w, h) + /* glsl */ `
    uniform sampler2D uVel;
    uniform sampler2D uD;
    uniform float uDt;
    uniform float uRelax;
    uniform vec2 uGrs;
    uniform float uGrsOn;
    vec2 fetchD(ivec2 p) {
      p.x = ((p.x % SIM_W) + SIM_W) % SIM_W;
      p.y = clamp(p.y, 0, SIM_H - 1);
      return texelFetch(uD, p, 0).xy;
    }
    vec2 sampleD(vec2 uv) {
      vec2 f = uv * SIM - 0.5;
      ivec2 i = ivec2(floor(f));
      vec2 t = fract(f);
      return mix(mix(fetchD(i), fetchD(i + ivec2(1, 0)), t.x), mix(fetchD(i + ivec2(0, 1)), fetchD(i + ivec2(1, 1)), t.x), t.y);
    }
    void main() {
      vec2 v = texture(uVel, vUv).xy;
      vec2 move = uDt * v / SIM;
      vec2 D = sampleD(vUv - move) - move;
      vec2 d = wrapD((vUv - uGrs) * SIM);
      float pin = exp(-dot(d, d) / 2304.0) * uGrsOn;
      D *= 1.0 - min(1.0, uDt * (uRelax + 3.0 * pin));
      outColor = vec4(D, 0.0, 1.0);
    }
  `,

  display: head(w, h) + /* glsl */ `
    uniform sampler2D uMap;
    uniform sampler2D uD;
    uniform vec2 uCenter;
    uniform vec2 uExtent;
    uniform float uDeep;
    uniform float uAurora;
    uniform float uMoons;
    uniform float uExposure;
    uniform float uTime;
    uniform vec4 uMoon[4];
    vec2 fetchD(ivec2 p) {
      p.x = ((p.x % SIM_W) + SIM_W) % SIM_W;
      p.y = clamp(p.y, 0, SIM_H - 1);
      return texelFetch(uD, p, 0).xy;
    }
    vec2 sampleD(vec2 uv) {
      vec2 f = uv * SIM - 0.5;
      ivec2 i = ivec2(floor(f));
      vec2 t = fract(f);
      return mix(mix(fetchD(i), fetchD(i + ivec2(1, 0)), t.x), mix(fetchD(i + ivec2(0, 1)), fetchD(i + ivec2(1, 1)), t.x), t.y);
    }
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    void main() {
      vec2 uv = uCenter + (vUv - 0.5) * uExtent;
      vec2 at = vec2(uv.x, clamp(uv.y, 0.0, 1.0));
      vec2 src = at + sampleD(at);
      // The sheet covers 55 degrees north to 55 degrees south of the 1400-row Cassini map.
      float ym = (272.0 + (1.0 - clamp(src.y, 0.0, 1.0)) * 856.0) / 1400.0;
      vec3 c = texture(uMap, vec2(src.x, ym)).rgb;
      float lum = dot(c, vec3(0.299, 0.587, 0.114));
      c = mix(vec3(lum), c, 1.18);
      c = pow(c, vec3(0.96));

      // Beneath the clouds: hotter, darker, heavier with depth.
      vec3 hot = vec3(lum) * vec3(1.25, 0.58, 0.3) + vec3(0.1, 0.02, 0.0);
      c = mix(c, hot, uDeep * 0.8);
      c *= mix(1.0, 0.3 + 0.7 * vUv.y, uDeep);

      // Aurora curtains along the top edge.
      float n = noise(vec2(uv.x * 36.0 + uTime * 0.15, uTime * 0.2));
      float curtain = pow(sin(uv.x * 190.0 + n * 7.0 + uTime * 0.8) * 0.5 + 0.5, 3.0);
      float fall = smoothstep(0.5, 1.0, vUv.y);
      float glow = uAurora * fall * (0.3 + 0.7 * curtain) * (0.55 + 0.45 * n);
      c += mix(vec3(0.3, 0.55, 1.0), vec3(0.78, 0.4, 1.0), n) * glow * 1.5;

      // The moons, as rings that stir the sheet as they cross it.
      for (int i = 0; i < 4; i++) {
        vec2 d = wrapD((uv - uMoon[i].xy) * SIM);
        float r = length(d);
        float ring = smoothstep(2.2, 0.0, abs(r - 15.0)) * 0.6 + exp(-r * r / 10.0);
        c += vec3(1.0, 0.94, 0.82) * ring * uMoons;
      }

      c *= uExposure;
      c *= mix(0.74, 1.0, smoothstep(1.25, 0.3, length((vUv - 0.5) * vec2(1.1, 1.0))));
      outColor = vec4(c, 1.0);
    }
  `,
});
