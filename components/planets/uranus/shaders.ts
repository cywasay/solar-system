/**
 * GLSL (WebGL2) for the Uranus scene. World space is the orbit frame: x and y lie in Uranus's
 * orbital plane, z is the orbit normal, the planet sits at the origin and its radius is 1.
 * uXp, uYp, uZp are the planet's own axes (uZp is the spin axis, tipped 97.77 degrees).
 *
 * The planet is ray-traced in a fullscreen pass that writes real depth, so the rings, the
 * field-line ribbons and the moons, drawn as geometry afterwards, pass behind it correctly.
 */

export const N_CLOSED = 24; // 8 magnetic longitudes x 3 shells
export const N_OPEN = 28; // 14 per tail lobe
export const SEG_CLOSED = 72;
export const SEG_OPEN = 150;
export const SEG_RING = 256;
export const N_RINGS = 17; // 10 narrow rings, 2 dusty outer rings, 5 moon orbits

const PRE = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
`;

export const FULL_VS = /* glsl */ `#version 300 es
out vec2 vNdc;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vNdc = p * 2.0 - 1.0;
  gl_Position = vec4(vNdc, 0.0, 1.0);
}
`;

const NOISE = /* glsl */ `
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
`;

/** The planet, its haze halo, and the star field behind it. */
export const PLANET_FS = PRE + NOISE + /* glsl */ `
  uniform mat4 uInvViewProj;
  uniform mat4 uViewProj;
  uniform vec3 uCam;
  uniform vec3 uSun;
  uniform vec3 uXp;
  uniform vec3 uYp;
  uniform vec3 uZp;
  uniform float uSpin;
  uniform float uSubsolar;   // sine of the sub-solar latitude
  uniform sampler2D uMap;
  in vec2 vNdc;
  out vec4 outColor;

  vec3 starLayer(vec3 d, float scale, float seed, float gain) {
    vec3 q = d * scale;
    vec3 c = floor(q);
    float h = h31(c + seed);
    if (h < 0.982) return vec3(0.0);
    vec3 o = vec3(h31(c + seed + 1.7), h31(c + seed + 3.1), h31(c + seed + 5.3)) - 0.5;
    float r = length(fract(q) - 0.5 - o * 0.5);
    float b = (h - 0.982) / 0.018;
    vec3 tint = mix(vec3(0.7, 0.82, 1.0), vec3(1.0, 0.9, 0.8), h31(c + seed + 9.1));
    return tint * b * b * smoothstep(0.16, 0.0, r) * gain;
  }

  // Bright convective spots, fixed in the rotating atmosphere (illustrative).
  const vec3 STORMS[5] = vec3[5](
    vec3(0.6, 0.52, 520.0), vec3(2.4, 0.66, 760.0), vec3(4.1, -0.5, 600.0), vec3(5.3, 0.3, 900.0), vec3(1.5, -0.7, 700.0));

  void main() {
    vec4 farP = uInvViewProj * vec4(vNdc, 1.0, 1.0);
    farP /= farP.w;
    vec3 ro = uCam;
    vec3 rd = normalize(farP.xyz - ro);
    float b = dot(ro, rd);
    float c = dot(ro, ro) - 1.0;
    float disc = b * b - c;

    if (disc < 0.0) {
      vec3 pc = ro - rd * b;
      float rmin = length(pc);
      vec3 col = starLayer(rd, 150.0, 0.0, 0.9) + starLayer(rd, 330.0, 17.0, 0.5);
      // Haze above the limb, brightest on the sunlit side.
      float lit = clamp(dot(pc / rmin, uSun) * 0.7 + 0.4, 0.0, 1.0);
      col += vec3(0.45, 0.8, 0.86) * exp(-(rmin - 1.0) * 34.0) * lit * 0.5;
      outColor = vec4(col, 1.0);
      gl_FragDepth = 1.0;
      return;
    }

    float t = -b - sqrt(disc);
    vec3 n = ro + rd * t;
    vec4 clip = uViewProj * vec4(n, 1.0);
    gl_FragDepth = clamp((clip.z / clip.w) * 0.5 + 0.5, 0.0, 1.0);

    // Planet frame, then the rotating body frame.
    vec3 np = vec3(dot(n, uXp), dot(n, uYp), dot(n, uZp));
    float cs = cos(uSpin);
    float sn = sin(uSpin);
    vec3 nb = vec3(np.x * cs + np.y * sn, -np.x * sn + np.y * cs, np.z);
    float lat = asin(clamp(nb.z, -1.0, 1.0));
    float lon = atan(nb.y, nb.x);

    vec3 base = texture(uMap, vec2(fract(lon / 6.2831853 + 0.5), 0.5 - lat / 3.14159265)).rgb;
    base = mix(base, vec3(0.62, 0.86, 0.88), 0.35);
    float zonal = noise(vec3(nb.xy * 2.4, nb.z * 24.0)) * 0.6 + noise(vec3(nb.xy * 6.0, nb.z * 64.0)) * 0.4;
    base *= 0.93 + 0.13 * zonal;
    // The summer pole wears a bright haze hood (seen by Voyager in the south and Webb in the north).
    float summer = sign(uSubsolar);
    float hood = smoothstep(0.9, 1.25, lat * summer) * clamp(abs(uSubsolar) * 1.2, 0.2, 1.0);
    float collar = smoothstep(0.08, 0.0, abs(lat * summer - 0.95)) * 0.5 * clamp(abs(uSubsolar) * 1.2, 0.2, 1.0);
    base = mix(base, vec3(0.88, 0.98, 0.97), hood * 0.55 + collar * 0.25);
    for (int i = 0; i < 5; i++) {
      vec3 s = STORMS[i];
      vec3 cdir = vec3(cos(s.y) * cos(s.x), cos(s.y) * sin(s.x), sin(s.y));
      float d = 1.0 - dot(nb, cdir);
      base = mix(base, vec3(0.95, 1.0, 1.0), exp(-d * s.z) * 0.6);
    }

    float mu = dot(n, uSun);
    float mu0 = max(dot(n, -rd), 0.001);
    float day = smoothstep(-0.1, 0.35, mu);
    float minnaert = pow(max(mu, 0.0), 0.82) * pow(mu0, -0.18);
    vec3 col = base * (0.035 + 1.08 * mix(day * 0.55, clamp(minnaert, 0.0, 1.3), 0.7));
    float rim = pow(1.0 - mu0, 2.6);
    col += vec3(0.32, 0.7, 0.8) * rim * smoothstep(-0.25, 0.45, mu) * 0.4;
    col += vec3(0.08, 0.24, 0.3) * smoothstep(0.22, 0.0, abs(mu)) * 0.3;
    outColor = vec4(col, 1.0);
  }
`;

/** Turns a polyline sample into one edge of a screen-space ribbon of constant pixel width. */
const RIBBON = /* glsl */ `
  uniform mat4 uViewProj;
  uniform vec2 uRes;
  vec4 ribbon(vec3 p0, vec3 p1, float side, float widthPx) {
    vec4 c0 = uViewProj * vec4(p0, 1.0);
    vec4 c1 = uViewProj * vec4(p1, 1.0);
    vec2 s0 = c0.xy / c0.w * uRes;
    vec2 s1 = c1.xy / c1.w * uRes;
    vec2 dir = s1 - s0;
    float len = length(dir);
    dir = len > 1e-5 ? dir / len : vec2(1.0, 0.0);
    vec2 nrm = vec2(-dir.y, dir.x);
    c0.xy += nrm * side * widthPx / uRes * c0.w;
    return c0;
  }
`;

/** Rings and moon orbits: circles in the equatorial plane. uRing = radius, width px, gain, style. */
export const RING_VS = PRE + RIBBON + /* glsl */ `
  in vec3 aV;            // ring index, position around (0..1), side (-1 or 1)
  uniform vec4 uRing[${N_RINGS}];
  uniform vec3 uXp;
  uniform vec3 uYp;
  out float vSide;
  out float vU;
  out vec3 vWorld;
  flat out int vId;
  void main() {
    int id = int(aV.x + 0.5);
    float a = aV.y * 6.2831853;
    float r = uRing[id].x;
    vec3 p0 = r * (cos(a) * uXp + sin(a) * uYp);
    vec3 p1 = r * (cos(a + 0.01) * uXp + sin(a + 0.01) * uYp);
    gl_Position = ribbon(p0, p1, aV.z, uRing[id].y);
    vSide = aV.z;
    vU = aV.y;
    vWorld = p0;
    vId = id;
  }
`;

export const RING_FS = PRE + /* glsl */ `
  uniform vec4 uRing[${N_RINGS}];
  uniform vec3 uSun;
  uniform float uRings;
  uniform float uMoons;
  in float vSide;
  in float vU;
  in vec3 vWorld;
  flat in int vId;
  out vec4 outColor;
  void main() {
    vec4 R = uRing[vId];
    float a = smoothstep(0.0, 0.7, 1.0 - abs(vSide));
    vec3 col;
    float weight;
    if (R.w < 1.5) {
      // In Uranus's shadow? (the ray toward the Sun meets the sphere)
      float bb = dot(vWorld, uSun);
      float cc = dot(vWorld, vWorld) - 1.0;
      float shade = (bb < 0.0 && bb * bb > cc) ? 0.12 : 1.0;
      col = R.w < 0.5 ? vec3(0.72, 0.8, 0.84) : vec3(0.42, 0.58, 0.74);
      a *= shade;
      weight = uRings;
    } else {
      col = vec3(0.56, 0.86, 0.9);
      a *= 0.45 + 0.55 * step(0.45, fract(vU * 160.0));
      weight = uMoons;
    }
    float alpha = a * R.z * weight;
    outColor = vec4(col * alpha, alpha);
  }
`;

/**
 * Magnetic field lines, generated entirely in the vertex shader.
 * Closed lines: a dipole tilted 59 degrees from the spin axis and offset from the centre, turning
 * with the planet, squeezed on the day side and stretched on the night side.
 * Open lines: leave each polar cap and are carried down-wind. A point d radii down the tail left
 * the planet a while ago, when the dipole pointed somewhere else; that delay is what twists the
 * tail into a corkscrew when the spin axis points along the wind. A kinematic illustration, not MHD.
 */
export const FIELD_VS = PRE + RIBBON + /* glsl */ `
  in vec3 aV;            // line index, position along (0..1), side
  uniform vec3 uSun;
  uniform vec3 uXp;
  uniform vec3 uYp;
  uniform vec3 uZp;
  uniform float uSpin;
  uniform float uComp;   // 0 typical solar wind, 1 the compressed state Voyager met
  out float vU;
  out float vKind;
  out float vSide;
  const float TILT = 1.0297;   // 59 degrees

  vec3 moment(float psi) { return cos(TILT) * uZp + sin(TILT) * (cos(psi) * uXp + sin(psi) * uYp); }
  vec3 offsetAt(float psi) { return 0.1 * (cos(psi + 1.2) * uXp + sin(psi + 1.2) * uYp) - 0.28 * uZp; }

  vec3 wind(vec3 P) {
    float rm = mix(8.5, 5.0, uComp);
    float d = dot(P, uSun);
    vec3 perp = P - d * uSun;
    if (d > 0.0) {
      d = rm * tanh(d / rm);
      perp *= mix(1.0, 0.84, smoothstep(0.0, rm, d));
    } else {
      d *= 1.0 + 0.5 * smoothstep(0.0, 8.0, -d);
    }
    return perp + d * uSun;
  }

  vec3 closedLine(int k, float u) {
    float phi = 6.2831853 * (float(k % 8) + 0.5) / 8.0;
    int shell = k / 8;
    float L = shell == 0 ? 2.0 : (shell == 1 ? 3.3 : 5.2);
    vec3 m = moment(uSpin);
    vec3 e1 = normalize(cross(uZp, m));
    vec3 e2 = cross(m, e1);
    float l0 = acos(sqrt(1.0 / L));
    float lam = mix(-l0, l0, u);
    float cl = cos(lam);
    float r = L * cl * cl;
    vec3 P = r * (cl * cos(phi) * e1 + cl * sin(phi) * e2 + sin(lam) * m) + offsetAt(uSpin);
    return wind(P);
  }

  vec3 openLine(int j, float u) {
    int nh = ${N_OPEN / 2};
    float h = j < nh ? 1.0 : -1.0;
    float psiK = 6.2831853 * float(j % nh) / float(nh);
    float d = u * 46.0;
    float twist = 6.2831853 / mix(15.0, 11.0, uComp);
    vec3 M = h * moment(uSpin - twist * d);
    vec3 e1 = normalize(cross(uZp, M));
    vec3 e2 = cross(M, e1);
    vec3 q = normalize(M + 0.38 * (cos(psiK) * e1 + sin(psiK) * e2));
    vec3 w = -uSun;
    vec3 qt = q - dot(q, w) * w;
    float lobe = mix(1.0, 0.72, uComp) * (1.6 + 5.4 * (1.0 - exp(-d / 9.0)));
    vec3 far = qt * lobe + w * (d * 0.92);
    vec3 near = offsetAt(uSpin) + q * (1.0 + d * 0.9);
    return mix(near, far, smoothstep(0.0, 8.0, d));
  }

  void main() {
    int id = int(aV.x + 0.5);
    float u = aV.y;
    float du = 0.004;
    vec3 p0;
    vec3 p1;
    if (id < ${N_CLOSED}) {
      p0 = closedLine(id, u);
      p1 = closedLine(id, u + du);
      vKind = 0.0;
    } else {
      int j = id - ${N_CLOSED};
      p0 = openLine(j, u);
      p1 = openLine(j, u + du);
      vKind = j < ${N_OPEN / 2} ? 1.0 : 2.0;
    }
    gl_Position = ribbon(p0, p1, aV.z, vKind < 0.5 ? 1.7 : 2.0);
    vU = u;
    vSide = aV.z;
  }
`;

export const FIELD_FS = PRE + /* glsl */ `
  uniform float uField;
  uniform float uTime;
  in float vU;
  in float vKind;
  in float vSide;
  out vec4 outColor;
  void main() {
    float edge = smoothstep(0.0, 0.75, 1.0 - abs(vSide));
    vec3 col = vKind < 0.5 ? vec3(0.55, 0.95, 0.9) : (vKind < 1.5 ? vec3(0.42, 0.74, 1.0) : vec3(0.88, 0.58, 1.0));
    float count = vKind < 0.5 ? 5.0 : 16.0;
    float ph = fract(vU * count - uTime * 0.32);
    float pulse = smoothstep(0.0, 0.06, ph) * smoothstep(0.32, 0.06, ph);
    float fade = vKind < 0.5 ? 1.0 : (1.0 - vU * 0.85);
    float a = edge * uField * fade * ((vKind < 0.5 ? 0.24 : 0.2) + 0.7 * pulse);
    outColor = vec4(col * a, a);
  }
`;

/** The five large moons as small glowing discs. */
export const MOON_VS = PRE + /* glsl */ `
  uniform mat4 uViewProj;
  uniform vec3 uMoon[5];
  uniform float uPx;
  void main() {
    gl_Position = uViewProj * vec4(uMoon[gl_VertexID], 1.0);
    gl_PointSize = uPx;
  }
`;

export const MOON_FS = PRE + /* glsl */ `
  uniform float uMoons;
  out vec4 outColor;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = (smoothstep(0.5, 0.25, d) + 0.35 * smoothstep(1.0, 0.3, d)) * uMoons;
    outColor = vec4(vec3(0.92, 0.97, 1.0) * a, a);
  }
`;
