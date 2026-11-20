'use client';

import { useEffect, useRef, useState } from 'react';
import s from './EarthPage.module.css';

type Sun = { lat: number; lon: number; at: Date };
type View = 'zone' | 'noon' | 'midnight' | 'dusk';

/**
 * Where the Sun is directly overhead at a given instant (NOAA general solar position
 * formulas: declination and equation of time; good to a fraction of a degree).
 */
function subsolarPoint(date: Date): Sun {
  const year = date.getUTCFullYear();
  const dayOfYear = Math.floor((date.getTime() - Date.UTC(year, 0, 1)) / 864e5) + 1;
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const daysInYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
  const g = ((2 * Math.PI) / daysInYear) * (dayOfYear - 1 + (hours - 12) / 24);
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const declination = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const lon = ((-15 * (hours - 12 + eqTime / 60) + 540) % 360) - 180;
  return { lat: (declination * 180) / Math.PI, lon, at: date };
}

const fmt = (sun: Sun) =>
  `${Math.abs(sun.lat).toFixed(1)}° ${sun.lat >= 0 ? 'N' : 'S'}, ${Math.abs(sun.lon).toFixed(1)}° ${sun.lon >= 0 ? 'E' : 'W'}`;

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vObjNormal;
  varying vec3 vViewNormal;
  varying vec3 vViewPos;
  void main() {
    vUv = uv;
    vObjNormal = normalize(position);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mv.xyz;
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`;

/* Lighting is computed in the globe's own frame, so the day-night line stays fixed to the
   geography however the visitor turns the planet: it is where the Sun is, now. */
const FRAGMENT = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform vec3 sunDir;
  varying vec2 vUv;
  varying vec3 vObjNormal;
  varying vec3 vViewNormal;
  varying vec3 vViewPos;
  void main() {
    float d = dot(normalize(vObjNormal), normalize(sunDir));
    float dayMix = smoothstep(-0.09, 0.11, d);
    vec3 day = texture2D(dayMap, vUv).rgb;
    vec3 night = texture2D(nightMap, vUv).rgb;
    float glow = dot(night, vec3(0.299, 0.587, 0.114));
    vec3 lights = night * 0.45 + vec3(1.0, 0.78, 0.45) * smoothstep(0.2, 0.62, glow) * 0.95;
    vec3 lit = day * (0.2 + 0.92 * clamp(d * 1.25 + 0.12, 0.0, 1.0));
    vec3 colour = mix(lights, lit, dayMix);
    colour += vec3(1.0, 0.5, 0.24) * exp(-pow(d / 0.085, 2.0)) * 0.16;
    float rim = pow(1.0 - max(dot(normalize(vViewNormal), normalize(-vViewPos)), 0.0), 2.6);
    colour += vec3(0.36, 0.62, 1.0) * rim * (0.1 + 0.62 * dayMix);
    gl_FragColor = vec4(colour, 1.0);
  }
`;

const IDLE_SPIN = (Math.PI * 2) / 140; // one turn every 140 s while untouched

/**
 * The hero globe: Earth as it is lit at this moment. Three.js is imported after hydration,
 * renders only while on screen, and sleeps once still (always still under reduced motion).
 * Without WebGL the poster beneath stays in place.
 */
export default function EarthGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controls = useRef<{ goTo: (view: View) => void } | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [sun, setSun] = useState<Sun | null>(null);
  const [surface, setSurface] = useState<'January' | 'July' | null>(null);
  const [view, setView] = useState<View>('zone');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let cleanup = () => {};
    const sunRef = { current: subsolarPoint(new Date()) };
    const refreshSun = () => {
      sunRef.current = subsolarPoint(new Date());
      setSun(sunRef.current);
    };
    const firstSun = window.setTimeout(refreshSun, 0);
    const sunTimer = window.setInterval(refreshSun, 60_000);

    void (async () => {
      let THREE: typeof import('three');
      try {
        THREE = await import('three');
      } catch {
        if (!disposed) setStatus('fallback');
        return;
      }
      if (disposed) return;
      let renderer: import('three').WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      } catch {
        setStatus('fallback');
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      const month = new Date().getUTCMonth();
      const season = month >= 3 && month <= 8 ? 'jul' : 'jan';
      const loader = new THREE.TextureLoader();
      let day: import('three').Texture;
      let night: import('three').Texture;
      try {
        [day, night] = await Promise.all([
          loader.loadAsync(`/images/earth/globe-day-${season}.jpg`),
          loader.loadAsync('/images/earth/globe-night.jpg'),
        ]);
      } catch {
        renderer.dispose();
        if (!disposed) setStatus('fallback');
        return;
      }
      if (disposed) {
        renderer.dispose();
        day.dispose();
        night.dispose();
        return;
      }
      const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      day.anisotropy = anisotropy;
      night.anisotropy = anisotropy;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
      camera.position.set(0, 0, 4.15);
      const sunDir = new THREE.Vector3();
      const geometry = new THREE.SphereGeometry(1, 128, 96);
      const material = new THREE.ShaderMaterial({
        uniforms: { dayMap: { value: day }, nightMap: { value: night }, sunDir: { value: sunDir } },
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
      });
      const globe = new THREE.Mesh(geometry, material);
      scene.add(globe);

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const toRad = Math.PI / 180;
      const setSunVector = () => {
        const { lat, lon } = sunRef.current;
        sunDir.set(Math.cos(lat * toRad) * Math.cos(lon * toRad), Math.sin(lat * toRad), -Math.cos(lat * toRad) * Math.sin(lon * toRad));
      };
      setSunVector();

      // Facing longitude L at latitude B: yaw = -90° - L, pitch = B.
      const facing = (lon: number, lat: number) => ({ yaw: -Math.PI / 2 - lon * toRad, pitch: lat * toRad });
      const zoneLongitude = -new Date().getTimezoneOffset() / 4;
      let { yaw, pitch } = facing(zoneLongitude, 22);
      let velocity = 0;
      let tween: { yaw: number; pitch: number } | null = null;
      let dragging = false;
      let lastX = 0;
      let lastY = 0;
      let visible = true;
      let frame = 0;
      let last = 0;

      const resize = () => {
        const { clientWidth, clientHeight } = canvas;
        if (!clientWidth || !clientHeight) return;
        renderer.setSize(clientWidth, clientHeight, false);
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
      };

      const render = (now: number) => {
        frame = 0;
        if (!visible || document.hidden) {
          last = 0;
          return;
        }
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
        last = now;
        if (tween) {
          // Shortest way round to the target longitude.
          const delta = Math.atan2(Math.sin(tween.yaw - yaw), Math.cos(tween.yaw - yaw));
          yaw += delta * 0.08;
          pitch += (tween.pitch - pitch) * 0.08;
          if (Math.abs(delta) < 1e-3 && Math.abs(tween.pitch - pitch) < 1e-3) tween = null;
        } else if (!dragging) {
          velocity *= 0.94;
          yaw += velocity;
          if (!reduced && Math.abs(velocity) < 1e-4) yaw += IDLE_SPIN * dt;
        }
        setSunVector();
        globe.rotation.set(pitch, yaw, 0);
        renderer.render(scene, camera);
        const moving = dragging || tween !== null || Math.abs(velocity) > 1e-4 || !reduced;
        if (moving) frame = requestAnimationFrame(render);
      };
      const wake = () => {
        if (!frame) frame = requestAnimationFrame(render);
      };

      const onDown = (event: PointerEvent) => {
        dragging = true;
        tween = null;
        velocity = 0;
        lastX = event.clientX;
        lastY = event.clientY;
        try { canvas.setPointerCapture(event.pointerId); } catch { /* pointer already gone */ }
        wake();
      };
      const onMove = (event: PointerEvent) => {
        if (!dragging) return;
        const dx = event.clientX - lastX;
        const dy = event.clientY - lastY;
        lastX = event.clientX;
        lastY = event.clientY;
        velocity = dx * 0.0065;
        yaw += velocity;
        pitch = Math.max(-1.1, Math.min(1.1, pitch + dy * 0.0045));
        wake();
      };
      const onUp = (event: PointerEvent) => {
        dragging = false;
        if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
        wake();
      };

      controls.current = {
        goTo: (target: View) => {
          const now = sunRef.current;
          tween =
            target === 'noon' ? facing(now.lon, now.lat)
            : target === 'midnight' ? facing(now.lon + 180, -now.lat)
            : target === 'dusk' ? facing(now.lon + 90, 18)
            : facing(zoneLongitude, 22);
          velocity = 0;
          wake();
        },
      };

      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        wake();
      });
      observer.observe(canvas);
      const sizer = new ResizeObserver(() => {
        resize();
        wake();
      });
      sizer.observe(canvas);
      canvas.addEventListener('pointerdown', onDown);
      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerup', onUp);
      canvas.addEventListener('pointercancel', onUp);
      document.addEventListener('visibilitychange', wake);
      resize();
      wake();
      setSurface(season === 'jul' ? 'July' : 'January');
      setStatus('ready');

      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        sizer.disconnect();
        canvas.removeEventListener('pointerdown', onDown);
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerup', onUp);
        canvas.removeEventListener('pointercancel', onUp);
        document.removeEventListener('visibilitychange', wake);
        controls.current = null;
        geometry.dispose();
        material.dispose();
        day.dispose();
        night.dispose();
        renderer.dispose();
      };
    })();

    return () => {
      disposed = true;
      window.clearTimeout(firstSun);
      window.clearInterval(sunTimer);
      cleanup();
    };
  }, []);

  const go = (target: View) => {
    setView(target);
    controls.current?.goTo(target);
  };

  return (
    <figure className={s.globeFigure}>
      <div className={s.globeStage} data-status={status}>
        <div className={s.globePoster} aria-hidden="true" />
        <canvas
          ref={canvasRef}
          className={s.globeCanvas}
          role="img"
          aria-label="Earth as it is lit at this moment: daylight on one side, city lights on the night side. Drag to turn the planet."
        />
        <span className={s.globeStatus} aria-hidden="true">{status === 'fallback' ? 'Live globe unavailable on this device' : 'Locating the Sun'}</span>
      </div>
      <div className={s.globeControls} role="group" aria-label="Turn the globe">
        {([
          ['zone', 'Your time zone'],
          ['noon', 'Where it is noon'],
          ['dusk', 'The sunset line'],
          ['midnight', 'Where it is midnight'],
        ] as [View, string][]).map(([key, label]) => (
          <button key={key} type="button" aria-pressed={view === key} onClick={() => go(key)} disabled={status !== 'ready'}>
            {label}
          </button>
        ))}
      </div>
      <figcaption className={s.globeReadout}>
        <span>
          <small>Sun directly overhead</small>
          <b aria-live="polite">{sun ? fmt(sun) : 'Locating…'}</b>
        </span>
        <span>
          <small>Computed at</small>
          <b>{sun ? `${sun.at.toISOString().slice(11, 16)} UTC` : '—'}</b>
        </span>
        <span className={s.globeCredit}>
          Day: NASA Blue Marble {surface ?? 'monthly'} 2004 composite. Night: NASA Black Marble 2016. Lighting is computed live; clouds and weather are not shown.
        </span>
      </figcaption>
    </figure>
  );
}
