'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { Regime, Sheet } from './jupiter/sheet';
import s from './JupiterPage.module.css';

type Mode = 'loading' | 'live' | 'static';
type SheetContextValue = { hold: (on: boolean) => void; holding: boolean; mode: Mode; reduced: boolean };

const SheetContext = createContext<SheetContextValue>({ hold: () => {}, holding: false, mode: 'loading', reduced: false });

/**
 * The page background is a live fluid simulation (components/planets/jupiter). This component
 * owns its canvas and decides, from the scroll position, which "regime" the sheet is in: camera,
 * grading, moons. Pointer movement over any open "zone" stirs it. Everything it draws is
 * written by the engine; React only renders the button labels.
 */
export default function JupiterSheet({ children, className }: { children: ReactNode; className: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sheetRef = useRef<Sheet | null>(null);
  const [mode, setMode] = useState<Mode>('loading');
  const [holding, setHolding] = useState(false);
  const [running, setRunning] = useState(true);
  const [reduced, setReduced] = useState(false);

  const hold = useCallback((on: boolean) => {
    setHolding(on);
    sheetRef.current?.setHold(on);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const lite = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches || new URLSearchParams(window.location.search).has('lite');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReduced(reducedMotion);
    let disposed = false;

    // Which regime owns the viewport's middle line.
    const marks = Array.from(root.querySelectorAll<HTMLElement>('[data-regime]'));
    let frame = 0;
    const pickRegime = () => {
      frame = 0;
      const middle = window.innerHeight * 0.5;
      for (const mark of marks) {
        const rect = mark.getBoundingClientRect();
        if (rect.top <= middle && rect.bottom >= middle) {
          sheetRef.current?.setRegime(mark.dataset.regime as Regime);
          return;
        }
      }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(pickRegime); };

    // Stirring: any pointer movement that is not over a text belt.
    const last = new Map<number, { x: number; y: number }>();
    const onMove = (event: PointerEvent) => {
      const previous = last.get(event.pointerId);
      last.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (!previous) return;
      const target = event.target as Element | null;
      if (target?.closest('[data-belt], nav, header, a, button')) return;
      sheetRef.current?.stir(event.clientX, event.clientY, event.clientX - previous.x, event.clientY - previous.y);
    };
    const onLeave = (event: PointerEvent) => { last.delete(event.pointerId); };
    const onResize = () => sheetRef.current?.resize();
    const releaseHold = () => hold(false);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onLeave);
    window.addEventListener('pointercancel', onLeave);
    window.addEventListener('blur', releaseHold);

    (async () => {
      try {
        const { createSheet } = await import('./jupiter/sheet');
        if (disposed) return;
        const created = await createSheet(canvas, '/images/jupiter/cloud-map.jpg', { lite, reduced: reducedMotion });
        if (disposed) { created.dispose(); return; }
        sheetRef.current = created;
        setMode('live');
        created.setActive(true);
        pickRegime();
      } catch {
        if (!disposed) setMode('static');
      }
    })();

    return () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onLeave);
      window.removeEventListener('pointercancel', onLeave);
      window.removeEventListener('blur', releaseHold);
      sheetRef.current?.dispose();
      sheetRef.current = null;
    };
  }, [hold]);

  const toggleRunning = () => {
    const next = !running;
    setRunning(next);
    sheetRef.current?.setRunning(next);
  };

  const value = useMemo<SheetContextValue>(() => ({ hold, holding, mode, reduced }), [hold, holding, mode, reduced]);

  return (
    <SheetContext.Provider value={value}>
      <div ref={rootRef} className={className} data-mode={mode} data-holding={holding}>
        <canvas ref={canvasRef} className={s.sheet} aria-hidden="true" />
        <div className={s.sheetStatic} aria-hidden="true" />
        <div className={s.content}>{children}</div>
        {mode === 'live' && !reduced && (
          <button type="button" className={s.pause} onClick={toggleRunning} aria-pressed={!running}>
            {running ? 'Pause the weather ❚❚' : 'Resume the weather ▶'}
          </button>
        )}
      </div>
    </SheetContext.Provider>
  );
}

/** Press and hold: the jets stop, and the sheet is left to churn. */
export function HoldControl() {
  const { hold, holding, mode, reduced } = useContext(SheetContext);
  if (mode === 'static' || reduced) {
    return <p className={s.modelNote}>{reduced ? 'Motion is reduced, so the weather is paused.' : 'The live weather needs WebGL, which this browser does not offer.'}</p>;
  }
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) { event.preventDefault(); hold(true); }
  };
  const onKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === ' ' || event.key === 'Enter') hold(false);
  };
  return (
    <button
      type="button"
      className={s.hold}
      aria-pressed={holding}
      onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); hold(true); }}
      onPointerUp={() => hold(false)}
      onPointerCancel={() => hold(false)}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onBlur={() => hold(false)}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span>{holding ? 'The jets are still' : 'Hold to still the jets'}</span>
      <small>{holding ? 'Let go and the flow rebuilds the stripes' : 'Then drag across the clouds'}</small>
    </button>
  );
}
