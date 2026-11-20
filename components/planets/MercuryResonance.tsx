'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useMercuryCue } from './useMercuryMotion';
import styles from './MercuryPage.module.css';

export default function MercuryResonance() {
  const { ref, arrived, visible, reduced } = useMercuryCue<HTMLDivElement>();
  const id = useId().replace(/:/g, '');
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const current = useRef(0);
  const played = useRef(false);
  const controls = useRef<{
    play: () => void;
    pause: () => void;
    scrub: (value: number) => void;
  } | null>(null);
  const visibility = useRef(false);
  const reduce = useRef(true);

  useEffect(() => {
    let frame = 0,
      last = 0,
      running = false;
    const stopFrame = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
    };
    const paint = (value: number) => {
      current.current = value;
      setProgress(value);
    };
    const tick = (now: number) => {
      frame = 0;
      if (document.hidden || !visibility.current) {
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
      const dt = last ? Math.min(50, now - last) : 0;
      last = now;
      const value = Math.min(1, current.current + dt / 9000);
      paint(value);
      if (value === 1) {
        running = false;
        setPlaying(false);
        last = 0;
      } else frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running && !frame && visibility.current && !document.hidden)
        frame = requestAnimationFrame(tick);
    };
    controls.current = {
      play: () => {
        played.current = true;
        if (reduce.current) {
          paint(current.current < 0.499 ? 0.5 : current.current < 0.999 ? 1 : 0);
          return;
        }
        if (current.current >= 0.999) paint(0);
        running = true;
        setPlaying(true);
        start();
      },
      pause: () => {
        running = false;
        stopFrame();
        setPlaying(false);
      },
      scrub: (value) => {
        played.current = true;
        running = false;
        stopFrame();
        setPlaying(false);
        paint(value);
      },
    };
    const onVisibility = () => {
      if (document.hidden || !visibility.current) stopFrame();
      else start();
    };
    document.addEventListener('visibilitychange', onVisibility);
    const stage = ref.current;
    const observer = new IntersectionObserver(([entry]) => {
      visibility.current = entry.isIntersecting;
      onVisibility();
    });
    if (stage) observer.observe(stage);
    return () => {
      stopFrame();
      observer.disconnect();
      controls.current = null;
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [ref]);
  useEffect(() => {
    visibility.current = visible;
  }, [visible]);
  useEffect(() => {
    reduce.current = reduced;
    if (reduced) controls.current?.pause();
  }, [reduced]);
  useEffect(() => {
    if (arrived && !reduced && !played.current) controls.current?.play();
  }, [arrived, reduced]);

  const orbitalAngle = -Math.PI / 2 + progress * Math.PI * 4;
  const x = 310 + Math.cos(orbitalAngle) * 184,
    y = 228 + Math.sin(orbitalAngle) * 168;
  const spin = 90 + progress * 1080;
  return (
    <section className={styles.time}>
      <div className={styles.timeCopy}>
        <p className={styles.kicker}>A clock with two movements</p>
        <h2>
          THREE TURNS.
          <br />
          <em>
            Two journeys
            <br />
            around the Sun.
          </em>
        </h2>
        <p>
          Mercury rotates three times for every two orbits. A solar day—the interval between
          successive noons—lasts about two Mercury years.
        </p>
        <p className={styles.quiet}>
          The small marker identifies a fixed place on the surface. After one orbit it faces the
          other way. After two, it returns to the same noon alignment.
        </p>
        <a className={styles.scienceLink} href="https://www.esa.int/content/view/full/487435">
          ESA · the 3:2 spin–orbit resonance ↗
        </a>
      </div>
      <figure className={styles.clockFigure} data-arrived={arrived || undefined}>
        <div ref={ref} className={styles.clockStage}>
          <svg
            viewBox="0 0 620 455"
            role="img"
            aria-label={`Spin–orbit model: ${(progress * 3).toFixed(2)} rotations and ${(progress * 2).toFixed(2)} orbits completed.`}
          >
            <defs>
              <pattern
                id={`${id}-texture`}
                width="1"
                height="1"
                patternContentUnits="objectBoundingBox"
              >
                <image
                  href="/textures/2k_mercury.jpg"
                  width="1"
                  height="1"
                  preserveAspectRatio="xMidYMid slice"
                />
              </pattern>
            </defs>
            <ellipse cx="310" cy="228" rx="184" ry="168" className={styles.clockTrack} />
            <path d="M310 35v20m0 347v18M100 228h20m380 0h20" className={styles.clockTicks} />
            <circle cx="310" cy="228" r="26" fill="#bda68a" />
            <text x="310" y="278" textAnchor="middle">
              Sun
            </text>
            <path
              d={`M310 228 ${x} ${y}`}
              stroke="#bda68a"
              strokeOpacity=".4"
              strokeDasharray="4 8"
            />
            <g transform={`translate(${x} ${y})`}>
              <g transform={`rotate(${spin})`}>
                <circle r="27" fill={`url(#${id}-texture)`} />
                <path d="M0 0H34" stroke="#ded9cf" strokeWidth="1.6" />
                <circle cx="34" r="4" fill="#ded9cf" />
              </g>
            </g>
            <text x="18" y="30">
              ROTATIONS
            </text>
            <text x="18" y="64" className={styles.clockCount}>
              {(progress * 3).toFixed(2)}
            </text>
            <text x="512" y="30">
              ORBITS
            </text>
            <text x="512" y="64" className={styles.clockCount}>
              {(progress * 2).toFixed(2)}
            </text>
          </svg>
        </div>
        <div className={styles.clockControls}>
          <button
            type="button"
            onClick={() => (playing ? controls.current?.pause() : controls.current?.play())}
          >
            {reduced
              ? 'Next alignment'
              : playing
                ? 'Pause clock'
                : progress >= 0.999
                  ? 'Replay two orbits ↻'
                  : 'Run the clock →'}
          </button>
          <label htmlFor={`${id}-time`}>
            Move through one solar day <span>{Math.round(progress * 176)} / 176 Earth days</span>
          </label>
          <input
            id={`${id}-time`}
            type="range"
            min="0"
            max="1000"
            value={Math.round(progress * 1000)}
            onFocus={() => controls.current?.pause()}
            onChange={(event) => controls.current?.scrub(Number(event.target.value) / 1000)}
            aria-valuetext={`${(progress * 3).toFixed(2)} rotations; ${(progress * 2).toFixed(2)} orbits`}
          />
        </div>
        <figcaption>
          Schematic viewing geometry. The loop represents orbital phase, not orbital shape;
          distance, size, and time are compressed. Real Mercury moves along an eccentric orbit at a
          changing speed.
        </figcaption>
      </figure>
    </section>
  );
}
