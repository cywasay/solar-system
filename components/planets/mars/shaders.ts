import { CRATER, SCARP, SITES, VEIN, WORLD } from './terrain';

/** GLSL shared by the drivable world and the scroll dive: the terrain and the sky. */
const f = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n));

export const TERRAIN_VERTEX = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;
  void main() {
    vPos = position;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const TERRAIN_FRAGMENT = /* glsl */ `
  uniform vec3 uSun;
  uniform vec3 uSunColor;
  uniform vec3 uAmbient;
  uniform vec3 uFog;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform sampler2D uTracks;
  uniform float uScarpTop;
  uniform float uFan;
  uniform vec3 uRover;
  uniform vec3 uRoverDir;
  uniform float uNight;
  uniform vec4 uSites[${SITES.length}];
  uniform float uTime;
  uniform sampler2DShadow uShadowMap;
  uniform mat4 uShadowMatrix;
  uniform float uShadowTexel;
  uniform float uShadowOn;
  varying vec3 vPos;
  varying vec3 vNormal;

  // The rover's shadow from the sun: hardware-compared 3x3 PCF, faded out at the map's edges.
  float sunShadow(vec3 p, vec3 n) {
    if (uShadowOn < 0.01) return 1.0;
    vec4 c = uShadowMatrix * vec4(p + n * 0.05, 1.0);
    vec3 s = c.xyz / c.w;
    if (s.x <= 0.0 || s.x >= 1.0 || s.y <= 0.0 || s.y >= 1.0 || s.z >= 1.0) return 1.0;
    s.z -= 0.0006;
    float sum = 0.0;
    for (int i = -1; i <= 1; i++) {
      for (int j = -1; j <= 1; j++) {
        sum += textureLod(uShadowMap, vec3(s.xy + vec2(float(i), float(j)) * uShadowTexel * 1.4, s.z), 0.0);
      }
    }
    vec2 edge = min(s.xy, 1.0 - s.xy);
    float fade = smoothstep(0.0, 0.1, min(edge.x, edge.y)) * uShadowOn;
    return mix(1.0, sum / 9.0, fade);
  }

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  void main() {
    vec3 n = normalize(vNormal);
    float slope = 1.0 - n.y;
    float grain = noise(vPos.xz * 0.8) * 0.45 + noise(vPos.xz * 3.1) * 0.3 + noise(vPos.xz * 0.09) * 0.6;
    vec3 dust = mix(vec3(0.60, 0.32, 0.17), vec3(0.80, 0.50, 0.30), grain * 0.75);
    // Layering on every steep face: the same expression the laser reads (terrain.ts rockBand).
    float band = sin(vPos.y * 1.9 + 1.5 * sin(vPos.x * 0.05) + 1.5 * cos(vPos.z * 0.05)) * 0.5 + 0.5;
    vec3 rock = mix(vec3(0.30, 0.15, 0.09), vec3(0.64, 0.38, 0.23), smoothstep(0.3, 0.7, band));
    rock *= 0.82 + 0.3 * noise(vPos.xz * 1.7 + vPos.y);
    float rockMix = smoothstep(0.18, 0.42, slope);
    vec3 colour = mix(dust, rock, rockMix);

    // The delta deposit, revealed outward from the inlet as the lake builds it.
    vec2 fanPos = vPos.xz - vec2(${f(CRATER.x - CRATER.r + 3)}, -112.0);
    float fr = length(fanPos);
    float fa = atan(fanPos.y, fanPos.x);
    float lobes = 0.78 + 0.22 * cos(fa * 6.0);
    float fan = step(0.0, fanPos.x) * (1.0 - smoothstep(12.0 * lobes, 30.0 * lobes, fr)) * (1.0 - smoothstep(0.95, 1.35, abs(fa)));
    fan *= 1.0 - smoothstep(uFan * 32.0 * lobes, uFan * 32.0 * lobes + 3.0, fr);
    float channels = smoothstep(0.8, 1.0, sin(fa * 26.0 + fr * 0.18) * 0.5 + 0.5);
    colour = mix(colour, mix(vec3(0.84, 0.64, 0.44), vec3(0.52, 0.34, 0.22), channels * 0.8), fan * 0.88);

    // The pale vein across the outcrop's faces.
    vec2 veinPos = vPos.xz - vec2(${f(VEIN.x)}, ${f(VEIN.z)});
    float across = abs(veinPos.x * ${f(-VEIN.dz)} + veinPos.y * ${f(VEIN.dx)});
    float onBlock = 1.0 - smoothstep(26.0, 32.0, length(veinPos));
    colour = mix(colour, vec3(0.94, 0.91, 0.85), (1.0 - smoothstep(0.6, 1.1, across)) * rockMix * onBlock);

    // Exposed ice in the scarp face, under a thin dusty cover.
    float iceZone = (1.0 - smoothstep(4.0, 7.5, abs(vPos.z - (${f(SCARP.z)})))) * (1.0 - smoothstep(${f(SCARP.halfWidth - 14)}, ${f(SCARP.halfWidth)}, abs(vPos.x - ${f(SCARP.x)})));
    float ice = iceZone * smoothstep(0.22, 0.42, slope) * (1.0 - smoothstep(uScarpTop - 0.4, uScarpTop, vPos.y));
    colour = mix(colour, vec3(0.80, 0.89, 0.95) * (0.86 + 0.14 * band), ice);

    // Wheel tracks.
    vec2 trackUv = vec2(vPos.x / ${f(WORLD)} + 0.5, 1.0 - (vPos.z / ${f(WORLD)} + 0.5));
    colour *= 1.0 - texture2D(uTracks, trackUv).r * 0.4;

    float diffuse = max(dot(n, uSun), 0.0);
    // Kept light: a shadowed patch still gets about a third of the sunlight.
    float shade = mix(1.0, sunShadow(vPos, n), 0.68);
    vec3 lit = colour * (uAmbient + uSunColor * diffuse * shade);

    // Contact shade under the chassis, so the rover sits on the ground at any sun angle.
    vec2 rel = vPos.xz - uRover.xz;
    vec2 fwd = normalize(uRoverDir.xz + vec2(0.0, 1e-5));
    vec2 local = vec2(dot(rel, vec2(fwd.y, -fwd.x)), dot(rel, fwd));
    float under = 1.0 - smoothstep(0.35, 1.0, length(local / vec2(1.85, 2.5)));
    under *= 1.0 - smoothstep(1.2, 2.6, abs(vPos.y - (uRover.y - 2.2)));
    lit *= 1.0 - under * 0.3;

    // Rover headlights after dark.
    vec3 toPoint = vPos - uRover;
    float range = length(toPoint);
    float cone = pow(max(dot(normalize(toPoint), uRoverDir), 0.0), 10.0);
    lit += colour * vec3(1.0, 0.9, 0.75) * cone * uNight * 2.4 / (1.0 + range * range * 0.004);

    // Site circles, painted onto the ground so they follow every bump (GTA-style markers).
    // uSites[i] = (x, z, radius, state): state 0 waiting, 1 logged, 2 hidden while open.
    for (int i = 0; i < ${SITES.length}; i++) {
      vec4 site = uSites[i];
      if (site.w > 1.5) continue;
      float d = length(vPos.xz - site.xy);
      float r = site.z;
      float edge = smoothstep(r - 0.95, r - 0.4, d) * (1.0 - smoothstep(r - 0.4, r + 0.15, d));
      float fill = (1.0 - smoothstep(0.0, r, d)) * 0.12;
      float pulse = smoothstep(0.35, 0.0, abs(d - r * fract(uTime * 0.35))) * (1.0 - smoothstep(r * 0.7, r, d)) * 0.5;
      vec3 tint = site.w > 0.5 ? vec3(0.55, 0.86, 1.0) : vec3(1.0, 0.72, 0.3);
      lit += tint * (edge * 1.15 + fill + pulse);
    }

    float distance = length(vPos - cameraPosition);
    lit = mix(lit, uFog, smoothstep(uFogNear, uFogFar, distance));
    gl_FragColor = vec4(lit, 1.0);
  }
`;

export const SKY_VERTEX = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const SKY_FRAGMENT = /* glsl */ `
  uniform vec3 uSun;
  uniform float uDay;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    float h = max(d.y, 0.0);
    vec3 day = mix(vec3(0.86, 0.66, 0.46), vec3(0.58, 0.41, 0.29), pow(h, 0.6));
    vec3 night = mix(vec3(0.06, 0.04, 0.05), vec3(0.012, 0.01, 0.02), pow(h, 0.5));
    vec3 colour = mix(night, day, uDay);
    float toward = max(dot(d, normalize(uSun)), 0.0);
    // Mars at dusk: fine dust scatters blue light forward, so the glow around the Sun is blue.
    float low = 1.0 - smoothstep(0.0, 0.38, abs(uSun.y));
    colour += vec3(0.42, 0.6, 0.95) * pow(toward, 6.0) * low * 1.25;
    colour += vec3(0.6, 0.78, 1.0) * pow(toward, 90.0) * 0.7;
    colour += vec3(1.0) * smoothstep(0.9992, 0.9996, toward) * step(-0.05, uSun.y);
    float star = step(0.9978, fract(sin(dot(floor(d * 380.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453));
    colour += star * (1.0 - uDay) * smoothstep(0.0, 0.2, h) * 0.85;
    gl_FragColor = vec4(colour, 1.0);
  }
`;
