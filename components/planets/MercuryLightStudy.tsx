'use client';

import { useEffect, useId, useRef } from 'react';
import { useMercuryCue } from './useMercuryMotion';
import styles from './MercuryPage.module.css';

const seed = (value: number) => {
  // Integer hashing keeps the server and browser bit-identical. Transcendental
  // functions can differ by a few ulps between Node and the browser engine.
  let result = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  result = Math.imul(result ^ (result >>> 16), 0x45d9f3b);
  return ((result ^ (result >>> 16)) >>> 0) / 4294967296;
};
const craters = Array.from({ length: 52 }, (_, i) => ({
  x: Number((10 + seed(i + 1) * 780).toFixed(3)),
  y: Number((8 + seed(i + 71) * 344).toFixed(3)),
  r: Number((6 + seed(i + 113) ** 2 * 43).toFixed(3)),
}));
type LightController = {
  aim: (azimuth: number, elevation: number, manual?: boolean, immediate?: boolean) => void;
  sweep: () => void;
  leave: () => void;
  visibility: (visible: boolean) => void;
  reduce: (reduced: boolean) => void;
};

export default function MercuryLightStudy() {
  const { ref, visible, arrived, reduced } = useMercuryCue<HTMLDivElement>();
  const id = useId().replace(/:/g, '');
  const light = useRef<SVGFEDistantLightElement>(null);
  const angleInput = useRef<HTMLInputElement>(null);
  const elevationInput = useRef<HTMLInputElement>(null);
  const angleOutput = useRef<HTMLOutputElement>(null);
  const elevationOutput = useRef<HTMLOutputElement>(null);
  const controller = useRef<LightController | null>(null);
  const introduced = useRef(false);
  const interacted = useRef(false);

  useEffect(() => {
    const stage = ref.current;
    if (!stage) return;
    let angle = 25,
      elevation = 22,
      aimAngle = 25,
      aimElevation = 22;
    let homeAngle = 25,
      homeElevation = 22;
    let frame = 0,
      last = 0,
      sweepTime = 0;
    let sweeping = false,
      aiming = false,
      inView = false;
    let reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const paint = () => {
      light.current?.setAttribute('azimuth', angle.toFixed(2));
      light.current?.setAttribute('elevation', elevation.toFixed(2));
      if (angleInput.current) angleInput.current.value = String(Math.round(angle));
      if (elevationInput.current) elevationInput.current.value = String(Math.round(elevation));
      if (angleOutput.current) angleOutput.current.value = `${Math.round(angle)}°`;
      if (elevationOutput.current) elevationOutput.current.value = `${Math.round(elevation)}°`;
      stage.style.setProperty('--lamp-x', `${Math.max(4, Math.min(96, (angle / 180) * 100))}%`);
      stage.style.setProperty(
        '--lamp-y',
        `${Math.max(8, Math.min(92, ((70 - elevation) / 62) * 100))}%`
      );
      stage.dataset.aiming = String(aiming || sweeping);
      stage.setAttribute(
        'aria-label',
        `Illustrative crater relief. Light azimuth ${Math.round(angle)} degrees, elevation ${Math.round(elevation)} degrees.`
      );
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
    };
    const tick = (now: number) => {
      frame = 0;
      if (!inView || document.hidden) {
        last = 0;
        return;
      }
      if (
        last &&
        now - last < 30 &&
        window.matchMedia('(max-width: 760px), (pointer: coarse)').matches
      ) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const dt = last ? Math.min(48, now - last) : 16.667;
      last = now;
      if (sweeping) {
        sweepTime += dt;
        const phase = Math.min(1, sweepTime / 3000);
        aimAngle = homeAngle + (155 - homeAngle) * Math.sin(phase * Math.PI);
        aimElevation = homeElevation + 13 * Math.sin(phase * Math.PI);
        if (phase === 1) sweeping = false;
      }
      const ease = reduce ? 1 : 1 - Math.pow(0.84, dt / 16.667);
      angle += (aimAngle - angle) * ease;
      elevation += (aimElevation - elevation) * ease;
      paint();
      if (sweeping || Math.abs(aimAngle - angle) + Math.abs(aimElevation - elevation) > 0.08) {
        frame = requestAnimationFrame(tick);
      } else {
        last = 0;
      }
    };
    const start = () => {
      if (reduce) {
        angle = aimAngle;
        elevation = aimElevation;
        paint();
        return;
      }
      if (!frame && inView && !document.hidden) frame = requestAnimationFrame(tick);
    };
    controller.current = {
      aim: (azimuth, height, manual = true, immediate = false) => {
        sweeping = false;
        aimAngle = azimuth;
        aimElevation = height;
        if (manual) {
          homeAngle = azimuth;
          homeElevation = height;
        }
        if (immediate) {
          stop();
          angle = azimuth;
          elevation = height;
          paint();
          return;
        }
        start();
      },
      sweep: () => {
        if (reduce) return;
        sweeping = true;
        sweepTime = 0;
        start();
      },
      leave: () => {
        if (!aiming) return;
        aiming = false;
        sweeping = false;
        aimAngle = homeAngle;
        aimElevation = homeElevation;
        start();
      },
      visibility: (value) => {
        inView = value;
        if (!value) stop();
        else start();
      },
      reduce: (value) => {
        reduce = value;
        if (value) {
          sweeping = false;
          stop();
        }
        start();
      },
    };
    const pointer = (event: PointerEvent) => {
      if (reduce || event.pointerType === 'touch' || !window.matchMedia('(pointer: fine)').matches)
        return;
      interacted.current = true;
      aiming = true;
      const bounds = stage.getBoundingClientRect();
      controller.current?.aim(
        Math.max(0, Math.min(180, ((event.clientX - bounds.left) / bounds.width) * 180)),
        Math.max(8, Math.min(70, 70 - ((event.clientY - bounds.top) / bounds.height) * 62)),
        false
      );
    };
    const leave = () => controller.current?.leave();
    const visibility = () => {
      if (document.hidden) stop();
      else start();
    };
    stage.addEventListener('pointermove', pointer, { passive: true });
    stage.addEventListener('pointerleave', leave);
    stage.addEventListener('pointercancel', leave);
    document.addEventListener('visibilitychange', visibility);
    paint();
    return () => {
      stop();
      controller.current = null;
      stage.removeEventListener('pointermove', pointer);
      stage.removeEventListener('pointerleave', leave);
      stage.removeEventListener('pointercancel', leave);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [ref]);
  useEffect(() => controller.current?.visibility(visible), [visible]);
  useEffect(() => controller.current?.reduce(reduced), [reduced]);
  useEffect(() => {
    if (arrived && !introduced.current) {
      introduced.current = true;
      if (!interacted.current) controller.current?.sweep();
    }
  }, [arrived]);

  const aim = (angle: number, height: number, immediate = false) => {
    interacted.current = true;
    controller.current?.aim(angle, height, true, immediate);
  };
  return (
    <figure className={styles.terrain} data-arrived={arrived || undefined}>
      <div
        ref={ref}
        className={styles.terrainStage}
        role="img"
        aria-label="Illustrative crater relief with adjustable light"
      >
        <svg viewBox="0 0 800 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <filter
              id={`${id}-relief`}
              x="-10%"
              y="-10%"
              width="120%"
              height="120%"
              colorInterpolationFilters="sRGB"
            >
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .333 .333 .333 0 0"
              />
              <feGaussianBlur stdDeviation=".85" />
              <feDiffuseLighting
                surfaceScale="6"
                diffuseConstant="1.1"
                lightingColor="#ded9cf"
                result="illumination"
              >
                <feDistantLight ref={light} azimuth="25" elevation="22" />
              </feDiffuseLighting>
              <feImage
                href="/textures/2k_mercury.jpg"
                x="0"
                y="0"
                width="800"
                height="360"
                preserveAspectRatio="xMidYMid slice"
                result="albedo"
              />
              <feComposite
                in="albedo"
                in2="illumination"
                operator="arithmetic"
                k1="1.15"
                k2="0"
                k3="0"
                k4="0"
              />
            </filter>
            <radialGradient id={`${id}-crater`}>
              <stop stopColor="#505050" />
              <stop offset=".48" stopColor="#5a5a5a" />
              <stop offset=".72" stopColor="#818181" />
              <stop offset=".84" stopColor="#a0a0a0" />
              <stop offset="1" stopColor="#808080" />
            </radialGradient>
          </defs>
          <g filter={`url(#${id}-relief)`}>
            <path fill="#808080" d="M-80-40H880V400H-80z" />
            {craters.map((c, i) => (
              <circle key={i} cx={c.x} cy={c.y} r={c.r} fill={`url(#${id}-crater)`} />
            ))}
          </g>
        </svg>
        <span className={styles.lamp} aria-hidden="true">
          <i />
          <b>LIGHT</b>
        </span>
        <div className={styles.terrainRuler} aria-hidden="true">
          <span>Relief study</span>
          <span>Move across the surface</span>
        </div>
      </div>
      <div className={styles.lightControls}>
        <div>
          <label htmlFor={`${id}-angle`}>
            Light direction{' '}
            <output ref={angleOutput} htmlFor={`${id}-angle`}>
              25°
            </output>
          </label>
          <input
            ref={angleInput}
            id={`${id}-angle`}
            type="range"
            min="0"
            max="180"
            defaultValue="25"
            onFocus={() =>
              aim(
                Number(angleInput.current?.value ?? 25),
                Number(elevationInput.current?.value ?? 22),
                true
              )
            }
            onChange={(event) =>
              aim(Number(event.target.value), Number(elevationInput.current?.value ?? 22), true)
            }
          />
        </div>
        <div>
          <label htmlFor={`${id}-height`}>
            Light elevation{' '}
            <output ref={elevationOutput} htmlFor={`${id}-height`}>
              22°
            </output>
          </label>
          <input
            ref={elevationInput}
            id={`${id}-height`}
            type="range"
            min="8"
            max="70"
            defaultValue="22"
            onFocus={() =>
              aim(
                Number(angleInput.current?.value ?? 25),
                Number(elevationInput.current?.value ?? 22),
                true
              )
            }
            onChange={(event) =>
              aim(Number(angleInput.current?.value ?? 25), Number(event.target.value), true)
            }
          />
        </div>
        <div className={styles.lightPresets}>
          <button type="button" onClick={() => aim(25, 8)}>
            Grazing light
          </button>
          <button type="button" onClick={() => aim(110, 65)}>
            High Sun
          </button>
          <button
            type="button"
            onClick={() => {
              interacted.current = true;
              controller.current?.sweep();
            }}
          >
            Replay light pass ↻
          </button>
        </div>
      </div>
      <figcaption>
        Mercury texture over procedural relief. This is a lighting instrument, not a reconstruction
        of measured surface elevations.
      </figcaption>
    </figure>
  );
}
