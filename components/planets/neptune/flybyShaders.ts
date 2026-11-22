/**
 * One fullscreen ray-traced pass draws everything Voyager could see: Neptune with cloud bands
 * sheared by the real wind profile, its dark spots and bright clouds, the faint rings and the
 * arcs in the Adams ring (bright only when backlit), Triton with its cap and plumes, and stars.
 * Units: Neptune radius = 1. The output is a single brightness through the chosen filter, as a
 * vidicon camera would record it.
 */

export const VERTEX = /* glsl */ `#version 300 es
out vec2 vNdc;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vNdc = p * 2.0 - 1.0;
  gl_Position = vec4(vNdc, 0.0, 1.0);
}
`;

export const SCENE = /* glsl */ `#version 300 es
precision highp float;
in vec2 vNdc;
out vec4 outColor;

uniform vec3 uCam;
uniform vec3 uFwd;
uniform vec3 uRight;
uniform vec3 uUp;
uniform float uTanHalf;
uniform float uAspect;
uniform vec3 uSun;
uniform float uSpin;
uniform float uHours;
uniform vec4 uFeat[4];      // latitude, body longitude, half-width (lon), half-height (lat); radians
uniform vec3 uTriton;
uniform vec3 uTritonCap;
uniform vec3 uPlume[3];
uniform vec3 uPlumeWind;
uniform float uArc;
uniform vec3 uFilter;
uniform float uFinder;      // 1: the live finder (grain, vignette); 0: a camera frame
uniform float uSeed;
uniform float uGain;

const float RT = ${(1353 / 24764).toFixed(5)};

float h31(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(h31(i), h31(i + vec3(1, 0, 0)), f.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), f.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}
float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return v;
}

float windDeg(float latD) {
  float u = -398.0 + 0.188 * latD * latD - 1.2e-5 * latD * latD * latD * latD;
  return (u * 3.6) / (6.2831853 * 24764.0 * max(0.05, cos(radians(latD)))) * 360.0;
}

float sphere(vec3 ro, vec3 rd, vec3 c, float r) {
  vec3 oc = ro - c;
  float b = dot(oc, rd);
  float h = b * b - (dot(oc, oc) - r * r);
  if (h < 0.0) return -1.0;
  float t = -b - sqrt(h);
  return t > 0.0 ? t : -1.0;
}

float ellipse(float lat, float lon, vec4 f) {
  float dl = atan(sin(lon - f.y), cos(lon - f.y)) * cos(lat);
  return length(vec2(dl / f.z, (lat - f.x) / f.w));
}

vec3 neptune(vec3 n, vec3 rd) {
  float c = cos(uSpin);
  float s = sin(uSpin);
  vec3 nb = vec3(n.x * c + n.y * s, -n.x * s + n.y * c, n.z);
  float lat = asin(clamp(nb.z, -1.0, 1.0));
  float lon = atan(nb.y, nb.x);
  float latD = degrees(lat);
  // Bands, then cloud streaks carried by the wind: each latitude slides at its own speed.
  vec3 deep = vec3(0.17, 0.29, 0.66);
  vec3 pale = vec3(0.46, 0.62, 0.9);
  vec3 col = mix(deep, pale, 0.32 + 0.22 * sin(lat * 7.0 + 0.4) + 0.1 * sin(lat * 19.0));
  float L = lon - radians(windDeg(latD) * uHours);
  vec3 q = vec3(cos(L) * 3.2, sin(L) * 3.2, lat * 30.0);
  col *= 0.9 + 0.16 * fbm(q * vec3(1.0, 1.0, 1.0) + 2.0);
  float belts = exp(-pow((latD - 27.0) / 5.0, 2.0)) + 0.7 * exp(-pow((latD + 27.0) / 4.0, 2.0))
    + 0.9 * exp(-pow((latD + 69.0) / 4.0, 2.0)) + 0.35 * exp(-pow((latD - 46.0) / 4.0, 2.0));
  float streak = smoothstep(0.56, 0.78, fbm(q * vec3(1.6, 1.6, 2.2) + 7.0));
  col = mix(col, vec3(0.96), streak * belts * 0.85);
  // Features.
  float gds = ellipse(lat, lon, uFeat[0]);
  col = mix(col, vec3(0.05, 0.1, 0.33), smoothstep(1.0, 0.55, gds) * 0.88);
  vec4 comp = vec4(uFeat[0].x - 1.25 * uFeat[0].w, uFeat[0].y + 0.05, uFeat[0].z * 0.6, uFeat[0].w * 0.32);
  col = mix(col, vec3(0.97), smoothstep(1.0, 0.25, ellipse(lat, lon, comp)) * 0.9);
  float sc = ellipse(lat, lon, uFeat[1]);
  col = mix(col, vec3(0.98), smoothstep(1.0, 0.2, sc + 0.25 * noise(n * 60.0)) * 0.95);
  float d2 = ellipse(lat, lon, uFeat[2]);
  col = mix(col, vec3(0.06, 0.12, 0.34), smoothstep(1.0, 0.5, d2) * 0.8);
  col = mix(col, vec3(0.95), smoothstep(0.45, 0.0, d2) * 0.8);
  float hc = ellipse(lat, lon, uFeat[3]);
  col = mix(col, vec3(0.98), smoothstep(1.0, 0.1, hc) * smoothstep(0.45, 0.7, fbm(q * vec3(2.5, 2.5, 6.0))) );
  // Light: soft terminator, darker limb, blue haze at the edge.
  float mu = dot(n, uSun);
  float mu0 = max(dot(n, -rd), 0.001);
  float lit = smoothstep(-0.06, 0.5, mu) * pow(max(mu, 0.0) + 0.02, 0.75) * pow(mu0, 0.12);
  col *= 0.015 + 1.15 * lit;
  col += vec3(0.25, 0.45, 1.0) * pow(1.0 - mu0, 3.0) * smoothstep(-0.25, 0.35, mu) * 0.35;
  return col;
}

vec3 tritonColour(vec3 p, vec3 rd) {
  vec3 n = normalize(p - uTriton);
  float cap = dot(n, uTritonCap);
  float rough = fbm(n * 9.0);
  vec3 base = vec3(0.66, 0.66, 0.6) * (0.75 + 0.35 * fbm(n * 22.0));
  // "Cantaloupe" terrain away from the cap: dimpled cells.
  float cells = abs(noise(n * 26.0) - 0.5) * 2.0;
  base = mix(base, base * (0.7 + 0.4 * cells), smoothstep(0.1, -0.3, cap));
  vec3 pink = vec3(0.9, 0.76, 0.72) * (0.9 + 0.2 * rough);
  vec3 col = mix(base, pink, smoothstep(-0.05, 0.25, cap));
  // Dark streaks laid down by plumes, on the cap.
  float streaks = smoothstep(0.7, 0.85, fbm(vec3(n.x * 40.0, n.y * 12.0, n.z * 40.0)));
  col *= 1.0 - 0.55 * streaks * smoothstep(0.1, 0.4, cap);
  float mu = dot(n, uSun);
  col *= 0.01 + smoothstep(-0.03, 0.4, mu) * max(mu, 0.0) * 1.2;
  return col;
}

float ringDensity(float r, float phi) {
  float d = 0.3 * exp(-pow((r - 1.692) / 0.04, 2.0));
  d += 0.9 * exp(-pow((r - 2.148) / 0.006, 2.0));
  d += 0.18 * smoothstep(2.16, 2.2, r) * smoothstep(2.33, 2.27, r);
  d += 0.25 * exp(-pow((r - 2.31) / 0.006, 2.0));
  float adams = exp(-pow((r - 2.541) / 0.007, 2.0));
  float rel = atan(sin(phi - uArc), cos(phi - uArc));
  float arcs = 7.0 * exp(-pow(rel / 0.09, 2.0)) + 5.0 * exp(-pow((rel + 0.22) / 0.05, 2.0))
    + 4.0 * exp(-pow((rel + 0.3) / 0.04, 2.0)) + 3.5 * exp(-pow((rel + 0.4) / 0.035, 2.0)) + 3.0 * exp(-pow((rel + 0.52) / 0.02, 2.0));
  d += adams * (1.0 + arcs);
  return d;
}

float segDist(vec3 ro, vec3 rd, vec3 a, vec3 b) {
  vec3 ba = b - a;
  vec3 oa = ro - a;
  float baba = dot(ba, ba);
  float bard = dot(ba, rd);
  float baoa = dot(ba, oa);
  float rdoa = dot(rd, oa);
  float den = baba - bard * bard;
  float h = den > 1e-9 ? clamp((baoa - bard * rdoa) / den, 0.0, 1.0) : 0.0;
  float t = max(dot(a + ba * h - ro, rd), 0.0);
  return length(ro + rd * t - (a + ba * h));
}

void main() {
  vec3 rd = normalize(uFwd + vNdc.x * uTanHalf * uAspect * uRight + vNdc.y * uTanHalf * uUp);
  vec3 ro = uCam;

  // Stars.
  vec3 col = vec3(0.0);
  for (int l = 0; l < 2; l++) {
    float sc = l == 0 ? 160.0 : 380.0;
    vec3 cell = floor(rd * sc);
    float h = h31(cell + float(l) * 17.0);
    if (h > 0.985) {
      vec3 o = vec3(h31(cell + 1.7), h31(cell + 3.1), h31(cell + 5.3)) - 0.5;
      float r = length(fract(rd * sc) - 0.5 - o * 0.5);
      col += vec3(0.75) * pow((h - 0.985) / 0.015, 2.0) * smoothstep(0.17, 0.0, r) * (l == 0 ? 1.0 : 0.6);
    }
  }
  // The Sun: tiny and bright at 30 AU.
  float sd = dot(rd, uSun);
  col += vec3(1.0) * smoothstep(0.99999, 0.999998, sd) * 30.0 + vec3(1.0) * pow(max(sd, 0.0), 4000.0) * 2.0;

  float tN = sphere(ro, rd, vec3(0.0), 1.0);
  float tT = sphere(ro, rd, uTriton, RT);
  float tOpaque = 1e9;
  if (tN > 0.0) { col = neptune(normalize(ro + rd * tN), rd); tOpaque = tN; }
  if (tT > 0.0 && tT < tOpaque) { col = tritonColour(ro + rd * tT, rd); tOpaque = tT; }
  // Haze glow just outside Neptune's limb.
  if (tN < 0.0) {
    float b = -dot(ro, rd);
    vec3 pc = ro + rd * max(b, 0.0);
    float rmin = length(pc);
    if (b > 0.0) col += vec3(0.3, 0.5, 1.0) * exp(-(rmin - 1.0) * 40.0) * clamp(dot(pc / rmin, uSun) + 0.6, 0.0, 1.0) * 0.4;
  }
  // Rings: dusty and dark, but bright when you look toward the Sun through them.
  if (abs(rd.z) > 1e-5) {
    float tR = -ro.z / rd.z;
    if (tR > 0.0 && tR < tOpaque) {
      vec3 p = ro + rd * tR;
      float r = length(p.xy);
      if (r > 1.5 && r < 2.7) {
        float dens = ringDensity(r, atan(p.y, p.x));
        float bb = dot(p, uSun);
        float shadow = (bb < 0.0 && dot(p, p) - bb * bb < 1.0) ? 0.0 : 1.0;
        float g = max(dot(rd, uSun), 0.0);
        col = col * (1.0 - 0.12 * min(dens, 1.0)) + vec3(0.85, 0.82, 0.78) * dens * (0.035 + 3.0 * pow(g, 6.0)) * shadow;
      }
    }
  }
  // Plumes on Triton: thin columns that bend over into trails (drawn far larger than real).
  float tTri = dot(uTriton - ro, rd);
  if (tTri > 0.0 && tTri < tOpaque + RT * 2.0) {
    for (int i = 0; i < 3; i++) {
      vec3 base = uPlume[i];
      vec3 up = normalize(base - uTriton);
      vec3 top = base + up * RT * 0.07;
      vec3 end = top + uPlumeWind * RT * 0.28;
      float lit = clamp(dot(up, uSun) * 2.0, 0.0, 1.0);
      float column = exp(-pow(segDist(ro, rd, base, top) / (RT * 0.005), 2.0));
      float trail = exp(-pow(segDist(ro, rd, top, end) / (RT * 0.009), 2.0));
      col += vec3(0.85) * (column * 0.24 + trail * 0.06) * lit;
    }
  }

  float v = dot(col, uFilter) * uGain;
  if (uFinder > 0.5) {
    // The live finder: vidicon grain, a little vignetting and a scanline shimmer.
    vec2 px = gl_FragCoord.xy;
    float grain = h31(vec3(px, uSeed)) - 0.5;
    float vig = 1.0 - 0.35 * dot(vNdc * 0.75, vNdc * 0.75);
    float scan = 0.96 + 0.04 * sin(px.y * 1.7 + uSeed * 9.0);
    v = pow(max(v, 0.0), 0.85) * vig * scan + grain * 0.045;
  }
  outColor = vec4(v, v, v, 1.0);
}
`;
