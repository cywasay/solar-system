'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { album, bestFor } from './neptune/album';
import { SHOT_LIST, T_END, T_START, LIGHT_DELAY, type TargetId } from './neptune/encounter';
import type { Flyby, Mode, Snapshot } from './neptune/flyby';
import s from './NeptunePage.module.css';

const CLOSEST = Date.UTC(1989, 7, 25, 3, 56);
const FINDER_FOV_DEG = 32;

const clock = (t: number) => {
  const sign = t < 0 ? '−' : '+';
  const m = Math.round(Math.abs(t) * 60);
  return `C/A ${sign}${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
const utc = (t: number) => {
  const d = new Date(CLOSEST + t * 3600e3);
  return `${d.getUTCDate()} Aug 1989 · ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
};

/**
 * Voyager 2's encounter with Neptune, played. You do not steer: the path is fixed. You aim the
 * camera and decide when to spend your frames.
 */
export default function NeptuneFlyby() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const flybyRef = useRef<Flyby | null>(null);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [f, setFlyby] = useState<Flyby | null>(null);
  const [failed, setFailed] = useState(false);
  const albumState = useSyncExternalStore(album.subscribe, album.get, album.server);
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;
    const lite = window.matchMedia('(max-width: 860px), (pointer: coarse)').matches || new URLSearchParams(window.location.search).has('lite');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let disposed = false;
    let io: IntersectionObserver | null = null;
    let visible = false;
    const sync = () => flybyRef.current?.setActive(visible && !document.hidden);
    const onResize = () => flybyRef.current?.resize();
    (async () => {
      try {
        const { createFlyby } = await import('./neptune/flyby');
        if (disposed) return;
        const f = await createFlyby(canvas, overlay, { lite, reduced });
        if (disposed) { f.dispose(); return; }
        flybyRef.current = f;
        setFlyby(f);
        f.onChange(setSnap);
        f.onPhoto((p) => album.add(p));
        setSnap(f.snapshot());
        io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { rootMargin: '60px' });
        io.observe(canvas);
        document.addEventListener('visibilitychange', sync);
        window.addEventListener('resize', onResize);
        if (process.env.NODE_ENV !== 'production') (window as unknown as { __flyby: Flyby }).__flyby = f;
      } catch (error) {
        console.warn('Flyby unavailable', error);
        if (!disposed) setFailed(true);
      }
    })();
    return () => {
      disposed = true;
      io?.disconnect();
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('resize', onResize);
      flybyRef.current?.dispose();
      flybyRef.current = null;
    };
  }, []);

  const phase = snap?.phase ?? 'briefing';
  const exposing = !!snap?.exposing;

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d || !f) return;
    const k = ((FINDER_FOV_DEG * Math.PI) / 180) / event.currentTarget.clientHeight;
    f.slew(-(event.clientX - d.x) * k, (event.clientY - d.y) * k);
    drag.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = () => { drag.current = null; };
  const onKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!f) return;
    const step = event.shiftKey ? 0.002 : 0.012;
    const keys: Record<string, () => void> = {
      ArrowLeft: () => f.slew(-step, 0), ArrowRight: () => f.slew(step, 0), ArrowUp: () => f.slew(0, step), ArrowDown: () => f.slew(0, -step),
      ' ': () => f.shutter(), p: () => f.setPaused(phase === 'running'), n: () => f.skipToNext(),
      c: () => f.setMode(snap?.mode === 'colour' ? 'bw' : 'colour'),
    };
    const fn = keys[event.key];
    if (fn) { event.preventDefault(); fn(); }
  };

  const recent = albumState.photos.slice(-6).reverse();
  const captured = (id: TargetId) => !!bestFor(albumState, id);

  if (failed) {
    return (
      <div className={s.flybyFallback}>
        <p>The encounter needs WebGL 2, which this browser does not offer. You can still read every chapter.</p>
        <button type="button" className={s.primary} onClick={() => album.showAll()}>Show all chapters</button>
      </div>
    );
  }

  return (
    <div className={s.flyby} data-phase={phase} data-exposing={exposing ? '' : undefined}>
      <div className={s.hud} aria-live="off">
        <span className={s.hudClock}>{clock(snap?.t ?? T_START)}</span>
        <span>{utc(snap?.t ?? T_START)}</span>
        <span>Range <b>{Math.round(snap?.rangeKm ?? 0).toLocaleString('en-GB')} km</b></span>
        <span>Speed <b>{(snap?.speed ?? 0).toFixed(1)} km/s</b></span>
        <span>Frames <b>{snap?.frames ?? 20}</b></span>
      </div>

      <div className={s.flybyMain}>
        <div className={s.finder} tabIndex={0} onKeyDown={onKey} role="application" aria-label="Voyager 2 camera finder. Arrow keys aim, space takes a picture, N skips to the next target, C switches colour.">
          <canvas ref={canvasRef} className={s.finderCanvas} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} />
          <canvas ref={overlayRef} className={s.finderOverlay} aria-hidden="true" />
          <p className={s.inFrame} aria-live="polite">{snap?.inFrame ? `In frame: ${snap.inFrame}` : ''}</p>
          {phase === 'briefing' && (
            <div className={s.briefing}>
              <p className={s.eyebrow}>Voyager 2 · 24 August 1989</p>
              <h3>Nine hours out. One pass.</h3>
              <p>You can’t steer: the path is fixed. Drag to aim the camera, then open the shutter and keep your target on the cross until it closes. You have 20 frames; a colour picture uses three.</p>
              <button type="button" className={s.primary} onClick={() => f?.start()}>Begin the encounter</button>
              <p className={s.keys}>Keys: arrows aim · space shoots · N next target · C colour · P pause</p>
            </div>
          )}
          {phase === 'ended' && (
            <div className={s.briefing}>
              <h3>Signal fading.</h3>
              <p>Voyager 2 is heading out of the Solar System, and it is still travelling today. Your frames are in the album below.</p>
              <button type="button" className={s.primary} onClick={() => f?.start()}>Fly it again</button>
            </div>
          )}
        </div>

        <aside className={s.shotList} aria-label="Shot list">
          <p className={s.eyebrow}>Shot list</p>
          <ol>
            {SHOT_LIST.map((shot) => {
              const t = snap?.t ?? T_START;
              const now = t >= shot.window[0] && t <= shot.window[1];
              const done = captured(shot.id);
              return (
                <li key={shot.id} data-now={now ? '' : undefined} data-done={done ? '' : undefined}>
                  <span className={s.shotMark} aria-hidden="true">{done ? '✓' : now ? '●' : '○'}</span>
                  <span className={s.shotText}><b>{shot.label}</b><i>{now ? shot.hint : clock(shot.window[0])}</i></span>
                  {now && phase !== 'briefing' && <button type="button" onClick={() => f?.pointAt(shot.id)}>Aim</button>}
                </li>
              );
            })}
          </ol>
          <p className={s.delay}>Each frame reaches Earth {LIGHT_DELAY} later.</p>
        </aside>
      </div>

      <div className={s.flybyControls}>
        <button type="button" className={s.shutter} onClick={() => f?.shutter()} disabled={!f || exposing || phase === 'briefing' || phase === 'ended' || (snap?.frames ?? 0) < (snap?.mode === 'colour' ? 3 : 1)}>
          {exposing ? `Exposing · ${snap?.exposing?.filter}` : 'Open shutter'}
        </button>
        <div className={s.segmented} role="group" aria-label="Picture type">
          {(['colour', 'bw'] as Mode[]).map((m) => (
            <button key={m} type="button" aria-pressed={snap?.mode === m} onClick={() => f?.setMode(m)}>{m === 'colour' ? 'Colour · 3 frames' : 'Black and white · 1'}</button>
          ))}
        </div>
        <button type="button" aria-pressed={phase === 'paused'} onClick={() => f?.setPaused(phase === 'running')} disabled={phase === 'briefing' || phase === 'ended'}>{phase === 'paused' ? 'Resume' : 'Pause'}</button>
        <button type="button" aria-pressed={!!snap?.fast} onClick={() => f?.setFast(!snap?.fast)}>Fast forward</button>
        <button type="button" onClick={() => f?.skipToNext()} disabled={phase === 'briefing'}>Next target</button>
        <label className={s.toggle}><input type="checkbox" checked={!!snap?.track} onChange={(e) => f?.setTrack(e.target.checked)} /> Motion compensation</label>
      </div>
      <label className={s.scrub}>
        <span>Mission time</span>
        <input type="range" min={T_START} max={T_END} step={0.01} value={snap?.t ?? T_START} disabled={phase === 'briefing' || exposing} onChange={(e) => f?.seek(Number(e.target.value))} aria-label="Mission time, hours from closest approach" />
      </label>

      <div className={s.downlink} aria-label="Frames received">
        {recent.length === 0 ? <p>No frames yet. Pictures you take arrive here, then unlock their chapter below.</p> : recent.map((p) => (
          <figure key={p.id}>
            {/* eslint-disable-next-line @next/next/no-img-element -- a frame generated in the browser */}
            <img src={p.url} alt={`Your frame: ${p.label}`} width={96} height={96} />
            <figcaption><b>{p.label}</b>{p.colour ? ' · colour' : ''}<br />{p.note}</figcaption>
          </figure>
        ))}
      </div>
      <p className={s.benchNote}>A simplified model of the encounter: the path is a single hyperbola timed to the real closest approaches (4,950 km above Neptune’s clouds, then about 40,000 km from Triton), and the Sun’s direction and the cloud features are placed for the game. Clouds drift with Voyager’s measured wind profile; Triton’s plumes are drawn far larger than the real ones. Motion compensation turns the camera with the target, as Voyager did by turning the whole spacecraft.</p>
    </div>
  );
}
