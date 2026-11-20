'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import s from './VenusPage.module.css';
import { whenImageReady } from './venusImages';

/** The Magellan globe asset is centred on 180° E (see public/images/venus/README.md). */
const CENTRE_LONGITUDE = 180;
const TITLE = 'Venus';
/** Lens radius as a fraction of the disc diameter. */
const LENS = 0.21;
const START = { x: 0.5, y: 0.44 };

function coordinates(x: number, y: number) {
  const u = x * 2 - 1;
  const v = 1 - y * 2;
  if (u * u + v * v > 1) return null;
  const latitude = Math.asin(v);
  const ratio = Math.max(-1, Math.min(1, u / Math.max(Math.cos(latitude), 1e-6)));
  const longitude = (CENTRE_LONGITUDE + (Math.asin(ratio) * 180) / Math.PI + 360) % 360;
  const lat = (latitude * 180) / Math.PI;
  return `${Math.abs(lat).toFixed(1)}° ${lat >= 0 ? 'N' : 'S'} · ${longitude.toFixed(1)}° E`;
}

/** Raw globe for the canvas lens; the same file next/image optimises for the full view. */
const RADAR_SRC = '/images/venus/magellan-globe.jpg';
/** The source has a black margin; the page crops it by scaling the globe 1.112x about its centre. */
const CROP = 1.112;

/**
 * The radar lens. Visible light shows only the cloud deck; the lens is a round window onto
 * NASA's Magellan radar globe beneath it.
 *
 * The radar is drawn into a canvas each frame, clipped to the lens and the disc. Moving a
 * clipped window over a large composited image made the browser rasterise newly exposed
 * tiles on the fly, which flickered dark at the lens edge. A canvas redraw is a single
 * cheap GPU blit with nothing left to rasterise. The ring is a small DOM layer moved by
 * transform in the same frame. The drift sleeps off-screen, in hidden tabs, and while the
 * full radar view is open.
 */
function RadarDisc({ full }: { full: boolean }) {
  const disc = useRef<HTMLDivElement>(null);
  const lens = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const position = useRef({ ...START });
  const fullRef = useRef(full);
  const wakeRef = useRef<() => void>(() => {});

  useEffect(() => {
    const element = disc.current;
    if (!element) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let visible = true;
    let lastInput = -1e9;
    let size = element.offsetWidth || 1;
    let target = { ...position.current };
    let lastText = '';
    const context = canvas.current?.getContext('2d', { alpha: true }) ?? null;
    const image = new window.Image();
    let imageReady = false;
    void whenImageReady(RADAR_SRC, image).then(() => {
      imageReady = image.naturalWidth > 0;
      paint();
    });

    const sizeCanvas = () => {
      size = element.offsetWidth || 1;
      const surface = canvas.current;
      if (!surface) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = Math.round(size * ratio);
      surface.height = Math.round(size * ratio);
      context?.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (context) context.imageSmoothingQuality = 'high';
    };

    const draw = (cx: number, cy: number, radius: number) => {
      if (!context) return;
      context.clearRect(0, 0, size, size);
      context.save();
      context.beginPath();
      context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      context.clip();
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.clip();
      context.fillStyle = '#2b1607';
      context.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      if (imageReady) {
        const drawn = size * CROP;
        const offset = (drawn - size) / 2;
        context.drawImage(image, -offset, -offset, drawn, drawn);
      }
      context.restore();
    };

    const paint = () => {
      const { x, y } = position.current;
      const radius = LENS * size;
      const px = x * size - radius;
      const py = y * size - radius;
      if (lens.current) lens.current.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
      draw(x * size, y * size, radius);
      const text = coordinates(x, y) ?? 'Beyond the limb';
      if (text !== lastText && readout.current) readout.current.textContent = text;
      lastText = text;
    };

    const tick = (now: number) => {
      frame = 0;
      if (!visible || document.hidden || fullRef.current) return;
      const idle = now - lastInput > 3200;
      if (idle && !reduced) {
        const t = now / 1000;
        target = { x: 0.5 + Math.sin(t * 0.21) * 0.27, y: 0.48 + Math.sin(t * 0.29 + 1.3) * 0.22 };
      }
      const ease = idle ? 0.025 : 0.18;
      const p = position.current;
      p.x += (target.x - p.x) * ease;
      p.y += (target.y - p.y) * ease;
      paint();
      const settling = Math.abs(target.x - p.x) + Math.abs(target.y - p.y) > 1e-4;
      if (!reduced || settling) frame = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    wakeRef.current = wake;

    const steer = (event: PointerEvent) => {
      const bounds = element.getBoundingClientRect();
      target = {
        x: Math.min(1.05, Math.max(-0.05, (event.clientX - bounds.left) / bounds.width)),
        y: Math.min(1.05, Math.max(-0.05, (event.clientY - bounds.top) / bounds.height)),
      };
      lastInput = performance.now();
      wake();
    };

    const resize = new ResizeObserver(() => {
      sizeCanvas();
      paint();
    });
    sizeCanvas();
    resize.observe(element);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    observer.observe(element);
    element.addEventListener('pointermove', steer, { passive: true });
    element.addEventListener('pointerdown', steer, { passive: true });
    paint();
    wake();
    return () => {
      resize.disconnect();
      observer.disconnect();
      cancelAnimationFrame(frame);
      element.removeEventListener('pointermove', steer);
      element.removeEventListener('pointerdown', steer);
    };
  }, []);

  // The full view opens from wherever the lens is, so pin that point when it toggles.
  useEffect(() => {
    fullRef.current = full;
    const element = disc.current;
    if (element) {
      element.style.setProperty('--fx', `${(position.current.x * 100).toFixed(2)}%`);
      element.style.setProperty('--fy', `${(position.current.y * 100).toFixed(2)}%`);
    }
    if (!full) wakeRef.current();
  }, [full]);

  const radar = <Image src={RADAR_SRC} alt="" fill sizes="(max-width: 760px) 92vw, 46vw" />;

  return (
    <div
      ref={disc}
      className={s.disc}
      data-full={full}
      data-ambient
      role="img"
      aria-label="Venus as a bright, featureless cloud-covered disc. A movable radar lens reveals NASA Magellan radar imagery of the volcanic surface hidden beneath the clouds."
      style={{ '--fx': `${START.x * 100}%`, '--fy': `${START.y * 100}%` } as CSSProperties}
    >
      <div className={s.cloudDeck} aria-hidden="true"><div className={s.cloudBand} /></div>
      <div className={s.radarLayer} aria-hidden="true">
        <canvas ref={canvas} className={s.lensCanvas} />
        <div className={s.radarFull}>{radar}</div>
      </div>
      <div className={s.discShade} aria-hidden="true" />
      <div ref={lens} className={s.lens} aria-hidden="true">
        <span className={s.lensBand}>S-band radar · 12.6 cm</span>
        <span ref={readout} className={s.lensReadout} />
      </div>
    </div>
  );
}

export default function VenusHero() {
  const [full, setFull] = useState(false);

  return (
    <header className={s.hero} data-depth>
      <div className={s.sky} aria-hidden="true" />
      <div className={s.heroCopy}>
        <p className={s.heroIndex}><span>02</span>The second planet from the Sun</p>
        <h1 className={s.title} aria-label={TITLE}>
          {[...TITLE].map((letter, index) => (
            <span key={index} aria-hidden="true" style={{ '--i': index } as CSSProperties}>{letter}</span>
          ))}
        </h1>
        <p className={s.tagline}>Beauty<br /><em>under pressure.</em></p>
        <p className={s.heroLede}>
          The brightest planet in our night sky, and the one we can see least of. Its clouds
          hand sunlight straight back. Only radar comes back with the ground.
        </p>
        <div className={s.heroActions}>
          <button type="button" className={s.radarToggle} aria-pressed={full} onClick={() => setFull(!full)}>
            <span className={s.toggleLamp} aria-hidden="true" />
            {full ? 'Return to visible light' : 'See the whole surface by radar'}
          </button>
          <a href="#descent" className={s.descendLink}>Descend through the atmosphere <span aria-hidden="true">↓</span></a>
        </div>
      </div>

      <figure className={s.instrument}>
        <RadarDisc full={full} />
        <figcaption>
          <span className={s.pointerHint}>Move across the planet to look beneath the clouds.</span>
          <span className={s.touchHint}>Drag across the planet to look beneath the clouds.</span>
          <small>Clouds: illustrative texture. Radar: NASA/JPL Magellan mosaic on a simulated globe, simulated colour.</small>
        </figcaption>
      </figure>

      <dl className={s.vitals}>
        <div><dt>Diameter</dt><dd>12,104<span>km</span></dd></div>
        <div><dt>Distance from the Sun</dt><dd>0.72<span>AU</span></dd></div>
        <div><dt>One orbit</dt><dd>224.7<span>Earth days</span></dd></div>
      </dl>
    </header>
  );
}
