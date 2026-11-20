import type { ReactNode } from 'react';

// Deterministic pseudo-random so the mock-ups render identically every time.
const rnd = (n: number) => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

const STARS = Array.from({ length: 80 }, (_, i) => ({
  x: rnd(i * 2 + 1) * 800,
  y: rnd(i * 2 + 2) * 500,
  r: 0.4 + rnd(i * 3 + 7) * 0.9,
  o: 0.25 + rnd(i * 5 + 3) * 0.55,
}));

const SUN = { x: -120, y: 250 };
const ORBITS = [170, 290, 590, 720, 860];

type Props = {
  id: string;
  orbitColor: string;
  orbitDash?: string;
  children?: ReactNode;
};

// A flat stand-in for the Explore canvas: sun off the left edge, orbit arcs, Earth + Moon at (470, 250).
// Overlays passed as children share the 800x500 viewBox, so they stay glued to the planet at any width.
export default function Backdrop({ id, orbitColor, orbitDash, children }: Props) {
  return (
    <svg
      viewBox="0 0 800 500"
      role="img"
      aria-label="Stand-in for the 3D scene: the Sun, orbit arcs, Earth and its Moon"
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      <defs>
        <radialGradient id={`${id}-sun`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FF6A3D" stopOpacity="0.95" />
          <stop offset="0.35" stopColor="#FF6A3D" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FF6A3D" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-earth`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#FF6A3D" />
          <stop offset="0.5" stopColor="#FF6A3D" />
          <stop offset="1" stopColor="#101012" />
        </radialGradient>
      </defs>

      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#8A9098" opacity={s.o} />
      ))}

      <circle cx={SUN.x} cy={SUN.y} r="190" fill={`url(#${id}-sun)`} />

      {ORBITS.map((r) => (
        <circle
          key={r}
          cx={SUN.x}
          cy={SUN.y}
          r={r}
          fill="none"
          stroke={orbitColor}
          strokeWidth="1"
          strokeDasharray={orbitDash}
        />
      ))}

      <circle cx="19" cy="152" r="4" fill="#8A9098" />
      <circle cx="131" cy="395" r="6" fill="#FF6A3D" />
      <circle cx="584" cy="100" r="5" fill="#FF6A3D" />

      <circle cx="470" cy="250" r="40" fill="none" stroke={orbitColor} strokeWidth="1" strokeDasharray="1 4" />
      <circle cx="496" cy="219" r="5" fill="#8A9098" />
      <circle cx="470" cy="250" r="24" fill="none" stroke="#FF6A3D" strokeOpacity="0.35" strokeWidth="3" />
      <circle cx="470" cy="250" r="22" fill={`url(#${id}-earth)`} />

      {children}
    </svg>
  );
}
