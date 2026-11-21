'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import type { Preset, Rings, View } from './saturn/rings';
import s from './SaturnPage.module.css';

type Step = 'hero' | 'edge' | 'rings' | 'pole' | 'titan' | 'enceladus' | 'finale';
type Mode = 'loading' | 'live' | 'static';

const rad = (deg: number) => (deg * Math.PI) / 180;

/** What the plate shows for each chapter: the view, and a caption in the atlas's voice. */
const STEPS: Record<Step, { view: Partial<View>; plate: string; caption: string }> = {
  hero: { view: { tilt: rad(52), viewR: 3.0, centerX: 0, centerY: 0, hex: 0, labels: 'none', finale: false, orbits: false }, plate: 'Plate I', caption: 'A particle model of Saturn’s rings, tilted as seen from Earth’s side of the Sun.' },
  edge: { view: { tilt: rad(86.5), viewR: 3.0, centerX: 0, centerY: 0, hex: 0, labels: 'none', finale: false, orbits: false }, plate: 'Plate II', caption: 'The same rings, turned toward edge-on. Drag the slider to tilt them yourself.' },
  rings: { view: { tilt: rad(30), viewR: 2.7, centerX: 0, centerY: 0, hex: 0, labels: 'rings', finale: false, orbits: false }, plate: 'Plate III', caption: 'About half a million particles on Kepler orbits, at the real ring radii.' },
  pole: { view: { tilt: rad(2), viewR: 1.22, centerX: 0, centerY: 0, hex: 1, labels: 'none', finale: false, orbits: false }, plate: 'Plate IV', caption: 'Looking down on the north pole: the six-sided jet and its vortex. Drawn schematically.' },
  titan: { view: { tilt: rad(58), viewR: 24, centerX: 0, centerY: 0, hex: 0, labels: 'none', finale: false, orbits: true }, plate: 'Plate V', caption: 'The whole system to scale. Titan’s orbit is far outside the bright rings.' },
  enceladus: { view: { tilt: rad(52), viewR: 5.6, centerX: 0, centerY: 0, hex: 0, labels: 'none', finale: false, orbits: true }, plate: 'Plate VI', caption: 'Grains leave Enceladus and spread along its orbit. Over a minute they build a faint ring.' },
  finale: { view: { tilt: rad(74), viewR: 2.3, centerX: 0, centerY: 0, hex: 0, labels: 'none', finale: true, orbits: false }, plate: 'Plate VII', caption: 'An illustration of Cassini’s final orbits: steep, and threading the gap inside the rings.' },
};

const PRESETS: { id: Preset; label: string; note: string }[] = [
  { id: 'real', label: 'The real rings', note: 'Real ring radii. Click the rings to drop a moon.' },
  { id: 'pan', label: 'A moon in the A ring', note: 'A heavy toy moon in a smooth band: watch a lane clear and wakes trail behind it.' },
  { id: 'shepherds', label: 'Two shepherds', note: 'A narrow ring between two moons. Click to add a third and watch it respond.' },
  { id: 'free', label: 'An empty belt', note: 'A smooth belt. Click anywhere on it to place moons.' },
];

/**
 * The page's central object is a plate: a live particle model of the rings, driven by the
 * chapter you are reading. Chapters scroll on the left; the plate stays in view on the right.
 */
export default function SaturnAtlas({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelsRef = useRef<HTMLCanvasElement>(null);
  const ringsRef = useRef<Rings | null>(null);
  const stepRef = useRef<Step>('hero');
  const [mode, setMode] = useState<Mode>('loading');
  const [step, setStep] = useState<Step>('hero');
  const [preset, setPreset] = useState<Preset>('real');
  const [speed, setSpeed] = useState(1);
  const [tilt, setTilt] = useState(86.5);
  const [reduced, setReduced] = useState(false);
  const presetRef = useRef<Preset>('real');

  const applyStep = useCallback((next: Step) => {
    stepRef.current = next;
    setStep(next);
    ringsRef.current?.setView(STEPS[next].view);
    if (next === 'edge') setTilt(86.5);
    // Leaving the sandbox puts the real rings back.
    if (next !== 'rings' && presetRef.current !== 'real') {
      presetRef.current = 'real';
      setPreset('real');
      ringsRef.current?.setPreset('real');
    }
    if (next !== 'rings') { ringsRef.current?.setSpeed(1); setSpeed(1); }
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const labels = labelsRef.current;
    if (!root || !canvas || !labels) return;
    const lite = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches || new URLSearchParams(window.location.search).has('lite');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReduced(reducedMotion);
    let disposed = false;

    const marks = Array.from(root.querySelectorAll<HTMLElement>('[data-step]'));
    let frame = 0;
    const pick = () => {
      frame = 0;
      const middle = window.innerHeight * 0.52;
      for (const mark of marks) {
        const rect = mark.getBoundingClientRect();
        if (rect.top <= middle && rect.bottom >= middle) {
          const next = mark.dataset.step as Step;
          if (next !== stepRef.current) applyStep(next);
          return;
        }
      }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(pick); };
    const onResize = () => ringsRef.current?.resize();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    (async () => {
      try {
        const { createRings } = await import('./saturn/rings');
        if (disposed) return;
        const created = await createRings(canvas, labels, '/textures/2k_saturn.jpg', { lite, reduced: reducedMotion });
        if (disposed) { created.dispose(); return; }
        ringsRef.current = created;
        created.setView(STEPS[stepRef.current].view);
        setMode('live');
        created.setActive(true);
        pick();
      } catch {
        if (!disposed) setMode('static');
      }
    })();

    return () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      ringsRef.current?.dispose();
      ringsRef.current = null;
    };
  }, [applyStep]);

  const choosePreset = (next: Preset) => {
    presetRef.current = next;
    setPreset(next);
    ringsRef.current?.setPreset(next);
    if (next !== 'real') { ringsRef.current?.setSpeed(8); setSpeed(8); }
  };
  const chooseSpeed = (next: number) => { setSpeed(next); ringsRef.current?.setSpeed(next); };
  const onTilt = (value: number) => {
    setTilt(value);
    ringsRef.current?.setView({ tilt: rad(value) });
  };
  const onPlatePointer = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (stepRef.current !== 'rings' || reduced) return;
    const hit = ringsRef.current?.pick(event.clientX, event.clientY);
    if (hit && hit.a > 1.2 && hit.a < 2.9) ringsRef.current?.dropMoon(hit.a, hit.phase);
  };

  const info = STEPS[step];
  const activePreset = PRESETS.find((p) => p.id === preset)!;

  return (
    <div ref={rootRef} className={s.atlas} data-step={step} data-mode={mode}>
      <div className={s.notes}>{children}</div>
      <aside className={s.plateColumn} aria-label="Ring model">
        <figure className={s.plateFigure}>
          <div className={s.plate}>
            <canvas ref={canvasRef} className={s.plateCanvas} onPointerDown={onPlatePointer} aria-hidden="true" />
            <canvas ref={labelsRef} className={s.plateLabels} aria-hidden="true" />
            <div className={s.protractor} aria-hidden="true" />
          </div>
          <figcaption><b>{info.plate}</b> · {info.caption}</figcaption>
        </figure>

        <div className={s.controls}>
          {mode === 'static' && <p className={s.note}>The live ring model needs WebGL, which this browser does not offer.</p>}
          {mode !== 'static' && step === 'edge' && (
            <label className={s.slider}>
              <span>Tilt the rings <i>{tilt < 10 ? 'top-down' : tilt > 85 ? 'edge-on' : `${Math.round(tilt)}°`}</i></span>
              <input type="range" min={0} max={89.6} step={0.1} value={tilt} onChange={(event) => onTilt(Number(event.target.value))} aria-label="Ring tilt, from top-down to edge-on" />
            </label>
          )}
          {mode !== 'static' && step === 'rings' && (
            reduced
              ? <p className={s.note}>Motion is reduced, so the model is paused. The rings are drawn at their real radii.</p>
              : (
                <>
                  <div className={s.chips} role="group" aria-label="Ring experiments">
                    {PRESETS.map((p) => (
                      <button key={p.id} type="button" aria-pressed={preset === p.id} onClick={() => choosePreset(p.id)}>{p.label}</button>
                    ))}
                  </div>
                  <div className={s.chips} role="group" aria-label="Time-lapse speed">
                    {[1, 4, 8].map((v) => <button key={v} type="button" aria-pressed={speed === v} onClick={() => chooseSpeed(v)}>{v}×</button>)}
                    <button type="button" onClick={() => ringsRef.current?.clearMoons()}>Clear moons</button>
                  </div>
                  <p className={s.note}>{activePreset.note} Moons here are far heavier than real ones, and particles do not collide, so a lane clears in seconds.</p>
                </>
              )
          )}
        </div>
      </aside>
    </div>
  );
}
