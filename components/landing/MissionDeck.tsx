'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { planets } from '@/data/planets';
import styles from './MissionDeck.module.css';

/* ---------------------------------------------------------------------------
 * The flight deck: a NASA-punk console built as soft, physical hardware.
 *
 * The one idea that holds it together is LIGHT. The deck publishes --lx/--ly (where
 * the light comes from, -1..1 around the console's centre) and every raised or
 * recessed surface derives its shadows, bevels and specular highlights from them.
 * On a fine pointer the light follows the cursor, so the neumorphism is no longer a
 * fixed sticker: the hardware re-lights as you move.
 *
 * The scope is wired to the simulation's own numbers: log-spaced real AU for the
 * orbit radii, and each planet's `orbitSpeed` (the same compressed rate the 3D scene
 * uses) for its motion. Blips flare as the sweep passes and decay behind it.
 *
 * PERFORMANCE: one rAF loop, running only while the deck is on screen and the tab is
 * visible. Under reduced motion there is no loop at all: static light, frozen orbits,
 * no sweep.
 * ------------------------------------------------------------------------- */

const WARPS = [1, 4, 16] as const;
const KNOB_ANGLES = [-55, 0, 55];
const DEFAULT_LIGHT = { x: -0.55, y: -0.7 };
const DEFAULT_GLARE = { x: 0.28, y: 0.16 };
const C = 200; // scope centre in the 400x400 viewBox
const R_MIN = 34;
const R_MAX = 172;

const auValues = planets.map((p) => parseFloat(p.facts.distance));
const AU_MIN = Math.min(...auValues);
const AU_MAX = Math.max(...auValues);
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Log-spaced radii keep the terrestrial worlds legible while Neptune still fits the glass. */
const BODIES = planets.map((planet, i) => {
  const r = R_MIN + ((R_MAX - R_MIN) * Math.log(auValues[i] / AU_MIN)) / Math.log(AU_MAX / AU_MIN);
  const angle = (i * 2.39996) % (Math.PI * 2); // golden-angle spread, deterministic for SSR
  return {
    name: planet.name,
    code: planet.name.slice(0, 3).toUpperCase(),
    r,
    size: 1.6 + Math.sqrt(planet.radius) * 2.2,
    color: planet.name === 'Earth' ? '#FF6A3D' : planet.fallbackColor,
    earth: planet.name === 'Earth',
    ringed: Boolean(planet.ring),
    speed: planet.orbitSpeed,
    angle,
    x: round2(C + r * Math.cos(angle)),
    y: round2(C + r * Math.sin(angle)),
  };
});

/** 72 bezel ticks as a single path; every sixth one is long. */
const TICKS = Array.from({ length: 72 }, (_, i) => {
  const a = (i * 5 * Math.PI) / 180;
  const inner = i % 6 === 0 ? 180 : 186;
  const [s, c] = [Math.sin(a), Math.cos(a)];
  return `M${round2(C + inner * s)} ${round2(C - inner * c)}L${round2(C + 193 * s)} ${round2(C - 193 * c)}`;
}).join('');

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const pad = (n: number) => String(n).padStart(2, '0');

function Lever({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className={styles.lever}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={styles.slot} aria-hidden="true" />
      <span className={styles.leverText}>
        <span className={styles.legend}>{label}</span>
        <span className={styles.state} aria-hidden="true">
          {checked ? 'On' : 'Off'}
        </span>
      </span>
    </label>
  );
}

export default function MissionDeck() {
  const rootRef = useRef<HTMLElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const sweepRef = useRef<HTMLDivElement>(null);
  const bearingRef = useRef<HTMLSpanElement>(null);
  const metRef = useRef<HTMLSpanElement>(null);
  const blipRefs = useRef<(SVGGElement | null)[]>([]);
  const haloRefs = useRef<(SVGCircleElement | null)[]>([]);

  const [engaged, setEngaged] = useState(false);
  const [warpIndex, setWarpIndex] = useState(0);
  const [orbitsOn, setOrbitsOn] = useState(true);
  const [sweepOn, setSweepOn] = useState(true);
  const [labelsOn, setLabelsOn] = useState(true);

  // The frame loop reads these, so flipping a control never restarts it.
  const live = useRef({ warp: 1, engaged: false, sweep: true });
  useEffect(() => {
    live.current = { warp: WARPS[warpIndex], engaged, sweep: sweepOn };
  }, [warpIndex, engaged, sweepOn]);

  // Mission elapsed time: written straight to the DOM, no re-render per second.
  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => {
      const s = Math.floor((Date.now() - start) / 1000);
      if (metRef.current) {
        metRef.current.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const deck = deckRef.current;
    if (!root || !deck) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

    const angles = BODIES.map((b) => b.angle);
    const light = { x: DEFAULT_LIGHT.x, y: DEFAULT_LIGHT.y, tx: DEFAULT_LIGHT.x, ty: DEFAULT_LIGHT.y };
    const glare = { x: DEFAULT_GLARE.x, y: DEFAULT_GLARE.y, tx: DEFAULT_GLARE.x, ty: DEFAULT_GLARE.y };
    let sweepDeg = 0;
    let lastBearing = -1;
    let raf = 0;
    let last = 0;
    let onScreen = false;

    const writeLight = () => {
      root.style.setProperty('--lx', light.x.toFixed(3));
      root.style.setProperty('--ly', light.y.toFixed(3));
      // Gradient angle pointing away from the light, so faces shade from lit edge to far edge.
      root.style.setProperty('--la', ((Math.atan2(-light.x, light.y) * 180) / Math.PI).toFixed(1));
      deck.style.setProperty('--gx', `${(glare.x * 100).toFixed(1)}%`);
      deck.style.setProperty('--gy', `${(glare.y * 100).toFixed(1)}%`);
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      const { warp, engaged: isEngaged, sweep } = live.current;

      if (sweep) sweepDeg = (sweepDeg + dt * (isEngaged ? 150 : 72)) % 360;
      if (sweepRef.current) sweepRef.current.style.transform = `rotate(${sweepDeg.toFixed(2)}deg)`;

      for (let i = 0; i < BODIES.length; i++) {
        const body = BODIES[i];
        angles[i] -= body.speed * warp * dt; // counter-clockwise, as seen from above the pole
        const a = angles[i];
        blipRefs.current[i]?.setAttribute(
          'transform',
          `translate(${(C + body.r * Math.cos(a)).toFixed(2)} ${(C + body.r * Math.sin(a)).toFixed(2)})`
        );
        // Phosphor: brightest just after the sweep crosses the blip, decaying behind it.
        const bearing = ((((a * 180) / Math.PI + 90) % 360) + 360) % 360;
        const since = (sweepDeg - bearing + 360) % 360;
        const glow = sweep ? Math.max(0.22, 1 - since / 210) : 0.7;
        haloRefs.current[i]?.style.setProperty('opacity', glow.toFixed(2));
      }

      const brg = Math.floor(sweepDeg);
      if (brg !== lastBearing && bearingRef.current) {
        lastBearing = brg;
        bearingRef.current.textContent = String(brg).padStart(3, '0');
      }

      // Frame-rate independent easing toward the pointer (~0.1 per frame at 60fps).
      const k = 1 - Math.pow(0.0015, dt);
      const moving =
        Math.abs(light.tx - light.x) + Math.abs(light.ty - light.y) + Math.abs(glare.tx - glare.x) + Math.abs(glare.ty - glare.y) >
        0.002;
      if (moving) {
        light.x += (light.tx - light.x) * k;
        light.y += (light.ty - light.y) * k;
        glare.x += (glare.tx - glare.x) * k;
        glare.y += (glare.ty - glare.y) * k;
        writeLight();
      }

      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf || !onScreen || document.hidden || reduce.matches) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const onMove = (e: PointerEvent) => {
      if (!finePointer.matches || reduce.matches) return;
      const r = deck.getBoundingClientRect();
      let lx = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2), -1, 1);
      let ly = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2), -1, 1);
      // Never let the light sit dead-centre: a shadowless panel reads as flat.
      const mag = Math.hypot(lx, ly);
      if (mag < 0.35) {
        lx = mag ? (lx / mag) * 0.35 : -0.25;
        ly = mag ? (ly / mag) * 0.35 : -0.25;
      }
      light.tx = lx;
      light.ty = ly;
      glare.tx = clamp((e.clientX - r.left) / r.width, -0.2, 1.2);
      glare.ty = clamp((e.clientY - r.top) / r.height, -0.2, 1.2);
    };
    const onLeave = () => {
      light.tx = DEFAULT_LIGHT.x;
      light.ty = DEFAULT_LIGHT.y;
      glare.tx = DEFAULT_GLARE.x;
      glare.ty = DEFAULT_GLARE.y;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    const onReduceChange = () => {
      if (reduce.matches) {
        stop();
        Object.assign(light, { x: DEFAULT_LIGHT.x, y: DEFAULT_LIGHT.y, tx: DEFAULT_LIGHT.x, ty: DEFAULT_LIGHT.y });
        Object.assign(glare, { x: DEFAULT_GLARE.x, y: DEFAULT_GLARE.y, tx: DEFAULT_GLARE.x, ty: DEFAULT_GLARE.y });
        writeLight();
      } else {
        start();
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) start();
        else stop();
      },
      { rootMargin: '120px' }
    );
    io.observe(root);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVisibility);
    reduce.addEventListener('change', onReduceChange);

    return () => {
      stop();
      io.disconnect();
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      reduce.removeEventListener('change', onReduceChange);
    };
  }, []);

  const warp = WARPS[warpIndex];
  const lamps = [
    { label: 'Guidance', tone: 'cyan', on: true },
    { label: 'Telemetry', tone: 'cyan', on: true },
    { label: 'Orbit track', tone: 'cyan', on: orbitsOn },
    { label: 'Sweep', tone: 'cyan', on: sweepOn },
    { label: 'Time warp', tone: 'amber', on: warpIndex > 0 },
    { label: 'Drive armed', tone: 'orange', on: engaged },
  ];

  return (
    <section ref={rootRef} className={styles.deck} aria-labelledby="deck-title">
      <div className={styles.stars} aria-hidden="true" />
      <div className={styles.keylight} aria-hidden="true" />
      <div className={styles.horizon} aria-hidden="true" />
      <div className={styles.sunrise} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.copy}>
          <div className={styles.plates}>
            <span className={styles.plate}>Mission 01</span>
            <span className={styles.plateMono}>SIM-01 // Flight deck</span>
          </div>

          <h2 id="deck-title" className={styles.title}>
            Go for
            <br />
            orbit
            <span className={styles.titleLamp} aria-hidden="true" />
          </h2>

          <p className={styles.lede}>
            The same eight worlds, wired into a console that could have been bolted into a 1975 mission room. Every
            blip on the scope runs on the simulation&rsquo;s own orbital rates, and the room light follows your hand.
          </p>

          <dl className={styles.stats}>
            <div className={styles.stat}>
              <dt>Bodies on scope</dt>
              <dd>09</dd>
            </div>
            <div className={styles.stat}>
              <dt>Scope range</dt>
              <dd>
                {AU_MAX.toFixed(2)}
                <small>AU</small>
              </dd>
            </div>
            <div className={styles.stat}>
              <dt>Max time warp</dt>
              <dd>
                {WARPS[WARPS.length - 1]}
                <small>×</small>
              </dd>
            </div>
          </dl>

          <p className={styles.hint}>Move the cursor across the deck: it is lit by it.</p>
        </div>

        <div className={styles.deckWrap}>
          <div
            ref={deckRef}
            className={styles.console}
            data-engaged={engaged}
            data-orbits={orbitsOn}
            data-sweep={sweepOn}
            data-labels={labelsOn}
            role="group"
            aria-label="Flight deck"
          >
            <span className={`${styles.screw} ${styles.screwTL}`} style={{ '--rot': '18deg' } as CSSProperties} />
            <span className={`${styles.screw} ${styles.screwTR}`} style={{ '--rot': '-34deg' } as CSSProperties} />
            <span className={`${styles.screw} ${styles.screwBL}`} style={{ '--rot': '71deg' } as CSSProperties} />
            <span className={`${styles.screw} ${styles.screwBR}`} style={{ '--rot': '-8deg' } as CSSProperties} />

            <div className={styles.groove} aria-hidden="true">
              <span className={styles.tube} />
            </div>
            <div className={styles.spill} aria-hidden="true" />

            <div className={styles.topbar}>
              <div className={styles.panelId}>
                <span className={styles.plate}>Flight deck</span>
                <span className={styles.engraved}>Panel 3-A · GNC</span>
              </div>
              <div className={styles.met} aria-hidden="true">
                <span className={styles.engraved}>Mission elapsed</span>
                <span className={styles.metWell}>
                  <b>T+</b> <span ref={metRef}>00:00:00</span>
                </span>
              </div>
            </div>

            <div className={styles.body}>
              <div className={styles.bezel}>
                <span className={`${styles.bearingMark} ${styles.bmN}`}>000</span>
                <span className={`${styles.bearingMark} ${styles.bmE}`}>090</span>
                <span className={`${styles.bearingMark} ${styles.bmS}`}>180</span>
                <span className={`${styles.bearingMark} ${styles.bmW}`}>270</span>

                <div className={styles.glass}>
                  <svg
                    className={styles.scope}
                    viewBox="0 0 400 400"
                    role="img"
                    aria-label="Radar scope: the Sun at the centre, the eight planets on their orbits"
                  >
                    <defs>
                      <radialGradient id="md-sun">
                        <stop offset="0" stopColor="#8A9098" />
                        <stop offset="0.3" stopColor="#FF6A3D" stopOpacity="0.9" />
                        <stop offset="1" stopColor="#FF6A3D" stopOpacity="0" />
                      </radialGradient>
                      <radialGradient id="md-halo">
                        <stop offset="0" stopColor="#FF6A3D" stopOpacity="0.75" />
                        <stop offset="1" stopColor="#FF6A3D" stopOpacity="0" />
                      </radialGradient>
                      <radialGradient id="md-halo-earth">
                        <stop offset="0" stopColor="#FF6A3D" stopOpacity="0.85" />
                        <stop offset="1" stopColor="#FF6A3D" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    <g className={styles.grid}>
                      <circle cx={C} cy={C} r="60" />
                      <circle cx={C} cy={C} r="120" />
                      <path d="M200 14V386M14 200H386" />
                    </g>
                    <path className={styles.ticks} d={TICKS} />

                    <g className={styles.orbits}>
                      {BODIES.map((b) => (
                        <circle
                          key={b.name}
                          cx={C}
                          cy={C}
                          r={round2(b.r)}
                          className={b.earth ? styles.orbitEarth : undefined}
                        />
                      ))}
                    </g>

                    <circle cx={C} cy={C} r="26" fill="url(#md-sun)" />
                    <circle cx={C} cy={C} r="5.5" fill="#8A9098" />

                    {BODIES.map((b, i) => (
                      <g
                        key={b.name}
                        ref={(el) => {
                          blipRefs.current[i] = el;
                        }}
                        transform={`translate(${b.x} ${b.y})`}
                      >
                        <circle
                          ref={(el) => {
                            haloRefs.current[i] = el;
                          }}
                          r={round2(b.size * 3.2)}
                          fill={b.earth ? 'url(#md-halo-earth)' : 'url(#md-halo)'}
                          opacity="0.7"
                        />
                        {b.ringed && (
                          <ellipse
                            rx={round2(b.size * 2.1)}
                            ry={round2(b.size * 0.7)}
                            transform="rotate(-20)"
                            className={styles.ring}
                          />
                        )}
                        <circle r={round2(b.size)} fill={b.color} />
                        <text x={round2(b.size + 5)} y={round2(-b.size - 3)} className={styles.code}>
                          {b.code}
                        </text>
                      </g>
                    ))}
                  </svg>

                  <div ref={sweepRef} className={styles.sweep} aria-hidden="true" />
                  <div className={styles.glassShine} aria-hidden="true" />

                  <p className={styles.readout} aria-hidden="true">
                    BRG <span ref={bearingRef}>000</span>° · RNG {AU_MAX.toFixed(2)} AU · ×{warp}
                  </p>
                </div>
              </div>

              <div className={styles.side}>
                <div className={styles.annun} aria-hidden="true">
                  {lamps.map((lamp) => (
                    <span key={lamp.label} className={styles.lamp} data-on={lamp.on} data-tone={lamp.tone}>
                      {lamp.label}
                    </span>
                  ))}
                </div>

                <div className={styles.controls}>
                  <div className={styles.control}>
                    <div className={styles.knobScale}>
                      {WARPS.map((w, i) => (
                        <span
                          key={w}
                          className={styles.knobMark}
                          data-active={i === warpIndex}
                          style={{ '--a': `${KNOB_ANGLES[i]}deg` } as CSSProperties}
                        >
                          {w}×
                        </span>
                      ))}
                      <button
                        type="button"
                        className={styles.knob}
                        onClick={() => setWarpIndex((i) => (i + 1) % WARPS.length)}
                        aria-label={`Time warp, ${warp} times. Turn to change.`}
                      >
                        <span
                          className={styles.knobPointer}
                          style={{ '--knob': `${KNOB_ANGLES[warpIndex]}deg` } as CSSProperties}
                        />
                      </button>
                    </div>
                    <span className={styles.legend}>Time warp</span>
                  </div>

                  <div className={styles.control}>
                    <div className={styles.bezelRing}>
                      <button
                        type="button"
                        className={styles.dome}
                        onClick={() => setEngaged((v) => !v)}
                        aria-pressed={engaged}
                        aria-label="Engage drive"
                      />
                    </div>
                    <span className={styles.legend}>Engage</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.bottombar}>
              <div className={styles.levers}>
                <Lever label="Orbits" checked={orbitsOn} onChange={setOrbitsOn} />
                <Lever label="Sweep" checked={sweepOn} onChange={setSweepOn} />
                <Lever label="Labels" checked={labelsOn} onChange={setLabelsOn} />
              </div>
              <div className={styles.dataPlate} aria-hidden="true">
                <span>Thessaris</span>
                <span>SIM-01</span>
                <span>Ser. 0001-ORB</span>
              </div>
            </div>

            <div className={styles.hazard} aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
