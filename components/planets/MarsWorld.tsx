'use client';

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from 'react';
import { HALF, SITES, WORLD, heightAt, type LaserTarget, type SiteId } from './mars/terrain';
import type { LakePhase, MarsWorld as Engine } from './mars/engine';
import s from './MarsPage.module.css';

type Phase = 'loading' | 'ready' | 'driving' | 'fallback';

const READINGS: Record<LaserTarget, { name: string; elements: [string, number][]; text: string }> = {
  dust: {
    name: 'Wind-blown dust',
    elements: [['Fe', 3], ['S', 2], ['Cl', 2], ['Mg', 1]],
    text: 'The flat ground is dust: iron oxide, sulfur, chlorine. It records recent wind, not the rock beneath. Aim at a steep face.',
  },
  mudstone: {
    name: 'Fine-grained bed',
    elements: [['Si', 3], ['Al', 2], ['Fe', 2], ['Mg', 1], ['K', 1]],
    text: 'Fine grains settle where water is still. Rocks like this can hold clays formed in long contact with water, but the neighbouring layers have to agree before it reads as a lake.',
  },
  sandstone: {
    name: 'Coarser bed',
    elements: [['Si', 3], ['Fe', 2], ['Ca', 1], ['Na', 1]],
    text: 'Coarser grains need more energy to move: a stronger current, or wind. One sandy layer cannot say which.',
  },
  vein: {
    name: 'Pale vein',
    elements: [['Ca', 3], ['S', 3], ['H', 2]],
    text: 'Calcium sulfate filled a crack after the rock formed; the hydrogen is water bound inside it. Water moved through this rock later.',
  },
};

const PANELS: Record<SiteId, { kicker: string; title: string; body: ReactNode }> = {
  outcrop: {
    kicker: 'Site · Layered outcrop',
    title: 'Fire the laser.',
    body: <p>Click the rock face. Curiosity’s ChemCam and Perseverance’s SuperCam vaporise a pinpoint of rock from several metres away and read the light it gives off. Every band in the face is a layer laid down at a different time.</p>,
  },
  jezero: {
    kicker: 'Site · Jezero crater',
    title: 'Water leaves. Evidence stays.',
    body: <p>Jezero was chosen because orbital images showed a former lake and a fan of sediment where a river once entered from the west. Hold to fill it, then let go and watch what the water leaves behind.</p>,
  },
  canyon: {
    kicker: 'Site · Canyon overlook',
    title: 'A surface pulled apart.',
    body: <p>This trough is a stand-in: the real Valles Marineris runs thousands of kilometres across the equator. No single river cut it. Faulting, collapse, erosion, and landslides shaped the walls, and the bands in them are layers from different times.</p>,
  },
  ice: {
    kicker: 'Site · Ice scarp',
    title: 'The water did not all disappear.',
    body: <p>Erosion has cut a terrace open: pale water ice under a thin dusty cover. A 2018 study found sheets like this at eight mid-latitude sites, starting as little as a metre or two down and running 100 metres or more deep. As exposed ice turns straight to vapour, the face retreats.</p>,
  },
  sky: {
    kicker: 'Site · Ridge',
    title: 'Look up.',
    body: <p>Butterscotch by day, blue at sunset: fine dust scatters blue light toward the setting Sun. Phobos rises in the west and crosses in hours, because it orbits faster than Mars turns; Deimos drifts slowly the other way. The air is thin, under 1% of Earth’s surface pressure, and most of the original atmosphere has been lost to space.</p>,
  },
};

const LAKE_TEXT: Record<LakePhase, string> = {
  dry: 'A dry basin. Hold to bring the river back.',
  filling: 'Sediment drops where the river meets still water.',
  draining: 'The lake is evaporating.',
  evidence: 'The water is gone. The delta stays.',
};

function Minimap({ dot }: { dot: RefObject<HTMLSpanElement | null> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const size = 120;
    const image = ctx.createImageData(size, size);
    for (let j = 0; j < size; j++) {
      for (let i = 0; i < size; i++) {
        const x = (i / size - 0.5) * WORLD;
        const z = (j / size - 0.5) * WORLD;
        const h = heightAt(x, z);
        const shade = heightAt(x - 3, z - 3) - h;
        const v = Math.max(0, Math.min(255, 120 + h * 3 + shade * 22));
        const k = (j * size + i) * 4;
        image.data[k] = v * 0.95;
        image.data[k + 1] = v * 0.58;
        image.data[k + 2] = v * 0.38;
        image.data[k + 3] = Math.max(Math.abs(x), Math.abs(z)) > HALF - 40 ? 90 : 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }, []);
  return (
    <div className={s.minimap} aria-hidden="true">
      <canvas ref={canvas} width={120} height={120} />
      {SITES.map((site) => (
        <i key={site.id} data-site={site.id} style={{ left: `${(site.x / WORLD + 0.5) * 100}%`, top: `${(site.z / WORLD + 0.5) * 100}%` }} />
      ))}
      <span ref={dot} className={s.mapDot} />
    </div>
  );
}

export default function MarsWorld() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const mapDot = useRef<HTMLSpanElement>(null);
  const speedValue = useRef<HTMLElement>(null);
  const speedNeedle = useRef<HTMLSpanElement>(null);
  const labels = useRef<Partial<Record<SiteId, HTMLElement | null>>>({});
  const engine = useRef<Engine | null>(null);
  const stickBase = useRef<HTMLDivElement>(null);
  const stickKnob = useRef<HTMLSpanElement>(null);

  const [phase, setPhase] = useState<Phase>('loading');
  const [progress, setProgress] = useState(0.1);
  const [site, setSite] = useState<SiteId | null>(null);
  const [found, setFound] = useState<SiteId[]>([]);
  const [reading, setReading] = useState<LaserTarget | null>(null);
  const [lake, setLake] = useState<{ level: number; phase: LakePhase }>({ level: 0, phase: 'dry' });
  const [clock, setClock] = useState({ time: '08:24', day: true });
  const [holding, setHolding] = useState(false);

  useEffect(() => {
    const surface = canvas.current;
    if (!surface) return;
    let disposed = false;
    const lite = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    void (async () => {
      try {
        setProgress(0.25);
        const { createMarsWorld } = await import('./mars/engine');
        if (disposed) return;
        engine.current = createMarsWorld(surface, { labels: labels.current, mapDot: mapDot.current, speedValue: speedValue.current, speedNeedle: speedNeedle.current }, {
          onProgress: (share) => setProgress(share),
          onReady: () => setPhase((current) => (current === 'loading' ? 'ready' : current)),
          onSite: (id) => {
            setSite(id);
            setReading(null);
          },
          onFound: (id) => {
            setFound((list) => (list.includes(id) ? list : [...list, id]));
            window.dispatchEvent(new CustomEvent('mars:found', { detail: id }));
          },
          onLaser: (target) => setReading(target),
          onLake: (level, lakePhase) => setLake({ level, phase: lakePhase }),
          onClock: (time, day) => setClock({ time, day }),
        }, { lite, reduced });
      } catch {
        if (!disposed) setPhase('fallback');
      }
    })();
    return () => {
      disposed = true;
      engine.current?.dispose();
      engine.current = null;
    };
  }, []);

  /**
   * Play happens full screen. The Fullscreen API is used where it exists; where it does not
   * (iPhone Safari only allows video), the game fills the window instead and Esc or the Exit
   * button leave just the same. Leaving full screen by any route ends play.
   */
  const pseudo = useRef(false);

  const leave = () => {
    if (pseudo.current) {
      pseudo.current = false;
      root.current?.removeAttribute('data-fullscreen');
      document.documentElement.style.removeProperty('overflow');
    }
    engine.current?.disengage();
    setSite(null);
    setHolding(false);
    setPhase((current) => (current === 'driving' ? 'ready' : current));
  };
  const leaveRef = useRef(leave);
  useEffect(() => {
    leaveRef.current = leave;
  });

  const play = () => {
    const world = root.current;
    if (!world || !engine.current) return;
    engine.current.engage();
    setPhase('driving');
    const fillWindow = () => {
      if (pseudo.current || document.fullscreenElement === world) return;
      pseudo.current = true;
      world.setAttribute('data-fullscreen', 'window');
      document.documentElement.style.overflow = 'hidden';
    };
    const unfillWindow = () => {
      pseudo.current = false;
      world.removeAttribute('data-fullscreen');
      document.documentElement.style.removeProperty('overflow');
    };
    if (document.fullscreenEnabled && world.requestFullscreen) {
      // Some hosts hold the request (a permission check, an embedded webview) without
      // settling it: fill the window meanwhile, and switch to real full screen if it arrives.
      const fallback = window.setTimeout(fillWindow, 700);
      world.requestFullscreen({ navigationUI: 'hide' })
        .then(() => {
          window.clearTimeout(fallback);
          if (pseudo.current) unfillWindow();
        })
        .catch(() => {
          window.clearTimeout(fallback);
          fillWindow();
        });
    } else {
      fillWindow();
    }
    world.focus({ preventScroll: true });
  };
  const playRef = useRef(play);
  useEffect(() => {
    playRef.current = play;
  });

  const exit = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else leave();
  };

  useEffect(() => {
    // Esc in real full screen is handled by the browser, which fires this event.
    const change = () => {
      if (document.fullscreenElement !== root.current && !pseudo.current) leaveRef.current();
    };
    // In window-filling mode, Esc is ours.
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && pseudo.current) leaveRef.current();
    };
    document.addEventListener('fullscreenchange', change);
    window.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('fullscreenchange', change);
      window.removeEventListener('keydown', escape);
      document.documentElement.style.removeProperty('overflow');
    };
  }, []);

  // The field journal can send the rover to a site. The click that dispatched this event is
  // still the user gesture, so full screen is allowed.
  useEffect(() => {
    const goto = (event: Event) => {
      const id = (event as CustomEvent<SiteId>).detail;
      if (!engine.current) return;
      playRef.current();
      engine.current.goTo(id);
    };
    window.addEventListener('mars:goto', goto);
    return () => window.removeEventListener('mars:goto', goto);
  }, []);

  const stick = (event: ReactPointerEvent<HTMLDivElement>, active: boolean) => {
    const base = stickBase.current;
    if (!base) return;
    if (!active) {
      engine.current?.setStick(0, 0);
      if (stickKnob.current) stickKnob.current.style.transform = 'translate3d(0,0,0)';
      return;
    }
    const box = base.getBoundingClientRect();
    const radius = box.width / 2;
    let dx = event.clientX - (box.left + radius);
    let dy = event.clientY - (box.top + radius);
    const length = Math.hypot(dx, dy);
    if (length > radius) {
      dx = (dx / length) * radius;
      dy = (dy / length) * radius;
    }
    if (stickKnob.current) stickKnob.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    engine.current?.setStick(dx / radius, dy / radius);
  };

  const hold = (on: boolean) => {
    setHolding(on);
    engine.current?.setLakeHold(on);
  };

  const panel = site ? PANELS[site] : null;
  const readingData = reading ? READINGS[reading] : null;

  return (
    <section ref={root} id="drive" className={s.world} data-phase={phase} data-site={site ?? undefined} tabIndex={-1} aria-label="Drive Mars: a mini game">
      <canvas ref={canvas} className={s.worldCanvas} aria-hidden="true" />

      <div className={s.labels} aria-hidden="true">
        {SITES.map((item) => (
          <span key={item.id} ref={(el) => { labels.current[item.id] = el; }} className={s.siteLabel} data-found={found.includes(item.id)}>
            <b>{item.name}</b>
          </span>
        ))}
      </div>

      {/* Always mounted (the engine moves the minimap marker directly); shown once driving. */}
      {(
        <div className={s.hud} aria-hidden={phase !== 'driving'}>
          <button type="button" className={s.exitGame} onClick={exit} tabIndex={phase === 'driving' ? 0 : -1}>Exit <kbd>Esc</kbd></button>
          <div className={s.hudClock}>
            <small>Local mean solar time</small>
            <b>{clock.time}</b>
            <span>{clock.day ? 'Sol 1 · day' : 'Sol 1 · night'} · 1 sol = 24 h 39 m 35 s</span>
          </div>
          <div className={s.hudMap}>
            <Minimap dot={mapDot} />
            <span>{found.length} / {SITES.length} sites logged</span>
          </div>
          <p className={s.hudHint}>
            <span className={s.keysHint}>W A S D to drive · drag to look around · scroll to zoom · click the ground to drive there · drive into a circle to explore</span>
            <span className={s.touchHint}>Joystick to drive · drag to look · tap the ground to drive there</span>
          </p>
          <div className={s.speedo} aria-hidden="true">
            <svg viewBox="0 0 120 120"><path d="M24.6 95.4A50 50 0 1 1 95.4 95.4" /><path className={s.speedoFill} d="M24.6 95.4A50 50 0 1 1 95.4 95.4" /></svg>
            <span ref={speedNeedle} className={s.speedoNeedle} />
            <b ref={speedValue}>0</b>
            <small>km/h</small>
            <em>Game speed. The real rover tops out near 0.15 km/h.</em>
          </div>
          <div ref={stickBase} className={s.stick} aria-hidden="true"
            onPointerDown={(event) => { try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer gone */ } stick(event, true); }}
            onPointerMove={(event) => { if (event.buttons || event.pointerType === 'touch') stick(event, true); }}
            onPointerUp={(event) => stick(event, false)} onPointerCancel={(event) => stick(event, false)}>
            <span ref={stickKnob} />
          </div>
        </div>
      )}

      {phase === 'driving' && panel && site && (
        <aside className={s.sitePanel} key={site} aria-live="polite">
          <p className={s.kicker}>{panel.kicker}</p>
          <h2>{panel.title}</h2>
          {panel.body}
          {site === 'outcrop' && (
            <div className={s.readout}>
              {readingData ? (
                <>
                  <p className={s.readoutName}>{readingData.name}</p>
                  <ul aria-label="Elements detected (illustrative)">
                    {readingData.elements.map(([element, level]) => (
                      <li key={element}><b>{element}</b><span style={{ '--level': level / 3 } as CSSProperties} /></li>
                    ))}
                  </ul>
                  <p>{readingData.text}</p>
                </>
              ) : <p className={s.readoutWait}>Awaiting a target…</p>}
              <p className={s.fine}>Readouts are illustrative: the kind of elements reported for each material, not a measurement.</p>
            </div>
          )}
          {site === 'jezero' && (
            <div className={s.readout}>
              <button type="button" className={s.hold} aria-pressed={holding}
                onPointerDown={(event) => { try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer gone */ } hold(true); }}
                onPointerUp={() => hold(false)} onPointerCancel={() => hold(false)} onLostPointerCapture={() => hold(false)}
                onKeyDown={(event) => { if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) { event.preventDefault(); hold(true); } }}
                onKeyUp={(event) => { if (event.key === ' ' || event.key === 'Enter') hold(false); }}
                onContextMenu={(event) => event.preventDefault()}>
                <span aria-hidden="true" style={{ transform: `scaleX(${lake.level})` }} />
                {holding ? 'Filling… keep holding' : 'Hold to fill the lake'}
              </button>
              <p className={s.readoutName}>Lake {Math.round(lake.level * 100)}%</p>
              <p>{LAKE_TEXT[lake.phase]}</p>
            </div>
          )}
          {site === 'sky' && (
            <div className={s.readout}>
              <button type="button" className={s.action} onClick={() => engine.current?.skipToSunset()}>Skip to sunset</button>
            </div>
          )}
          <div className={s.panelFoot}>
            <button type="button" className={s.action} onClick={() => engine.current?.dismissSite()}>Continue driving</button>
            <a href={`#journal-${site}`}>Field notes ↓</a>
          </div>
        </aside>
      )}

      {phase !== 'driving' && (
        <div className={s.start}>
          <p className={s.startTop}>Mini game · an imagined landscape built from Mars’s real features</p>
          <h2 className={s.gameTitle}>Drive Mars</h2>
          <p className={s.startLine}>Five sites. One rover. Read the rock.</p>
          {phase === 'fallback' ? (
            <p className={s.startNote}>This device could not start the 3D world. Everything it holds is in the field journal below.</p>
          ) : (
            <button type="button" className={s.begin} onClick={play} disabled={phase !== 'ready'}>
              <span className={s.beginBar} style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
              {phase === 'ready' ? 'Play' : `Landing… ${Math.round(progress * 100)}%`}
            </button>
          )}
          <p className={s.startNote}>Opens full screen. Press <kbd>Esc</kbd> to come back.</p>
        </div>
      )}
    </section>
  );
}
