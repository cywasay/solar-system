'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const CURSOR_SIZE = 87.4;
// Match BeginCta's magnetic follow, return, and scale response at 60 Hz.
const FOLLOW_LERP = 0.1;
const RETURN_LERP = 0.17;
const SCALE_LERP = 0.12;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture;
  uniform sampler2D uBlackHole;
  uniform vec2 uResolution;
  uniform vec3 uHole;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 offset = (vUv - uHole.xy) * uResolution;
    float distance = length(offset);
    float influence = 1.0 - smoothstep(12.0, 95.0, distance);
    vec2 radial = offset / max(distance, 1.0);
    // Lens the scanlines around the rendered center, not the uneased pointer.
    vec2 bend = radial * 19.0 + vec2(-radial.y, radial.x) * 4.0;
    vec2 uv = vUv + bend * influence * influence * uHole.z / uResolution;
    float mask = texture2D(uTexture, uv).a;
    float line = abs(fract(uv.y * 40.0) - 0.5);
    float edge = fwidth(uv.y * 40.0);
    float scanline = 1.0 - smoothstep(0.075 - edge, 0.075 + edge, line);
    float textAlpha = mask * scanline * 0.35;
    vec3 textColor = vec3(248.0, 250.0, 252.0) / 255.0;

    // Sample the wordmark beneath the black hole and around its rim. Radiance only
    // appears when that footprint overlaps a letter, so empty space stays untouched.
    vec2 probe = vec2(${(CURSOR_SIZE * 0.34).toFixed(3)}) * uHole.z / uResolution;
    float contact = texture2D(uTexture, uHole.xy).a;
    contact = max(contact, texture2D(uTexture, uHole.xy + vec2(probe.x, 0.0)).a);
    contact = max(contact, texture2D(uTexture, uHole.xy - vec2(probe.x, 0.0)).a);
    contact = max(contact, texture2D(uTexture, uHole.xy + vec2(0.0, probe.y)).a);
    contact = max(contact, texture2D(uTexture, uHole.xy - vec2(0.0, probe.y)).a);
    contact = smoothstep(0.08, 0.72, contact) * smoothstep(0.25, 0.9, uHole.z);
    float lineRadiance = contact * influence;
    vec3 glowColor = vec3(1.0, 0.29, 0.035);
    textColor = mix(textColor, glowColor, lineRadiance * 0.42);
    textAlpha = min(1.0, textAlpha * (1.0 + lineRadiance * 0.38));
    vec4 hole = vec4(0.0);
    if (uHole.z > 0.001) {
      vec2 spriteUv = offset / (${CURSOR_SIZE.toFixed(1)} * max(uHole.z, 0.001)) + 0.5;
      if (all(greaterThanEqual(spriteUv, vec2(0.0))) && all(lessThanEqual(spriteUv, vec2(1.0)))) {
        hole = texture2D(uBlackHole, spriteUv);
        // A restrained shimmer in the plasma; the silhouette never rotates.
        float shimmer = sin(uTime * 1.3 + spriteUv.x * 9.0) * sin(uTime * 0.7 + spriteUv.y * 6.0);
        hole.rgb *= 1.0 + shimmer * 0.035;
        hole.a *= smoothstep(0.0, 0.7, uHole.z);
      }
    }
    float haloRadius = ${(CURSOR_SIZE * 0.78).toFixed(3)} * max(uHole.z, 0.001);
    float halo = contact * exp(-pow(distance / haloRadius, 2.0)) * 0.14;
    float underAlpha = textAlpha + halo * (1.0 - textAlpha);
    vec3 underColor = textColor * textAlpha + glowColor * halo * (1.0 - textAlpha);
    float alpha = hole.a + underAlpha * (1.0 - hole.a);
    vec3 color = (hole.rgb * hole.a + underColor * (1.0 - hole.a)) / max(alpha, 0.0001);
    gl_FragColor = vec4(color, alpha);
  }
`;

function FluidPlane() {
  const { gl, size, invalidate } = useThree();
  const cursor = useRef({
    active: false, ready: false, visible: true,
    clientX: 0, clientY: 0, x: 0, y: 0, scale: 0, time: 0,
  });
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    uTexture: { value: null as THREE.CanvasTexture | null },
    uBlackHole: { value: null as THREE.Texture | null },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uHole: { value: new THREE.Vector3(0, 0, 0) },
    uTime: { value: 0 },
  }), []);

  useEffect(() => {
    let disposed = false;
    let texture: THREE.CanvasTexture | undefined;
    const font = getComputedStyle(gl.domElement).getPropertyValue('--font-bebas').trim() || 'sans-serif';

    // Explicitly load the canvas font; fonts.ready can resolve before it is requested.
    document.fonts.load(`400 100px ${font}`).then(() => {
      if (disposed) return;
      const canvas = document.createElement('canvas');
      canvas.width = 4096;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.font = `400 800px ${font}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = 'white';
      const text = 'THESSARIS';
      const bounds = ctx.measureText(text);
      const width = bounds.actualBoundingBoxLeft + bounds.actualBoundingBoxRight;
      const height = bounds.actualBoundingBoxAscent + bounds.actualBoundingBoxDescent;

      // Fit the actual ink, keeping a small border around the full wordmark.
      ctx.translate(canvas.width * 0.02, canvas.height * 0.06);
      ctx.scale(canvas.width * 0.96 / width, canvas.height * 0.88 / height);
      ctx.fillText(text, bounds.actualBoundingBoxLeft, bounds.actualBoundingBoxAscent);

      texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      if (material.current) material.current.uniforms.uTexture.value = texture;
      invalidate();
    });

    return () => {
      disposed = true;
      texture?.dispose();
    };
  }, [gl, invalidate]);

  useEffect(() => {
    const canvas = gl.domElement;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(pointer: fine)');
    let disposed = false;
    const state = cursor.current;
    const enabled = () => finePointer.matches && !motion.matches;

    const texture = new THREE.TextureLoader().load('/textures/black-hole-cursor.png', loaded => {
      if (disposed) {
        loaded.dispose();
        return;
      }
      if (material.current) material.current.uniforms.uBlackHole.value = loaded;
      state.ready = true;
      invalidate();
    }, undefined, () => {
      if (disposed) return;
      state.ready = false;
      state.active = false;
      canvas.style.cursor = '';
      invalidate();
    });

    const onMove = (event: PointerEvent) => {
      if (!enabled() || event.pointerType === 'touch') return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      state.clientX = event.clientX;
      state.clientY = event.clientY;
      if (state.scale === 0) {
        state.x = event.clientX - rect.left;
        state.y = event.clientY - rect.top;
      }
      state.active = true;
      invalidate();
    };
    const onLeave = () => {
      state.active = false;
      canvas.style.cursor = '';
      invalidate();
    };
    const reset = () => {
      state.scale = 0;
      onLeave();
    };
    const onScroll = () => {
      if (state.active) invalidate();
    };
    const onVisibility = () => {
      if (document.hidden) reset();
    };
    const onContextLost = () => {
      state.ready = false;
      reset();
    };
    const onContextRestored = () => {
      state.ready = Boolean(material.current?.uniforms.uBlackHole.value);
      invalidate();
    };
    const observer = new IntersectionObserver(([entry]) => {
      state.visible = entry.isIntersecting;
      if (!state.visible) reset();
    });
    observer.observe(canvas);
    canvas.addEventListener('pointerenter', onMove);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointercancel', onLeave);
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);
    window.addEventListener('blur', onLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    motion.addEventListener('change', reset);
    finePointer.addEventListener('change', reset);
    return () => {
      disposed = true;
      observer.disconnect();
      texture.dispose();
      state.ready = false;
      state.active = false;
      state.scale = 0;
      canvas.style.cursor = '';
      canvas.removeEventListener('pointerenter', onMove);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointercancel', onLeave);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      window.removeEventListener('blur', onLeave);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      motion.removeEventListener('change', reset);
      finePointer.removeEventListener('change', reset);
    };
  }, [gl, invalidate]);

  useFrame((_, delta) => {
    if (!material.current) return;
    const state = cursor.current;
    // Use screen coordinates so smooth scrolling cannot detach the lens from the pointer.
    const rect = gl.domElement.getBoundingClientRect();
    const px = state.clientX - rect.left;
    const py = state.clientY - rect.top;
    if (px < 0 || py < 0 || px > rect.width || py > rect.height) state.active = false;
    const active = state.active && state.ready && state.visible;
    gl.domElement.style.setProperty('cursor', active ? 'none' : '');
    const step = Math.min(delta, 0.05) * 60;
    const follow = 1 - Math.pow(1 - (active ? FOLLOW_LERP : RETURN_LERP), step);
    const easeScale = 1 - Math.pow(1 - SCALE_LERP, step);
    state.scale += ((active ? 1 : 0) - state.scale) * easeScale;
    if (!active && state.scale < 0.002) state.scale = 0;
    const radius = CURSOR_SIZE * state.scale / 2;
    const x = THREE.MathUtils.clamp(px, radius, Math.max(radius, size.width - radius));
    const y = THREE.MathUtils.clamp(py, radius, Math.max(radius, size.height - radius));
    state.x += (x - state.x) * follow;
    state.y += (y - state.y) * follow;
    state.x = THREE.MathUtils.clamp(state.x, radius, Math.max(radius, size.width - radius));
    state.y = THREE.MathUtils.clamp(state.y, radius, Math.max(radius, size.height - radius));
    state.time += Math.min(delta, 0.05);
    material.current.uniforms.uResolution.value.set(size.width, size.height);
    material.current.uniforms.uHole.value.set(state.x / size.width, 1 - state.y / size.height, state.scale);
    material.current.uniforms.uTime.value = state.time;
    if (active || state.scale > 0) invalidate();
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

export default function FooterFluidText() {
  return (
    <div aria-hidden="true" className="absolute inset-0 z-0 h-full w-full cursor-default select-none">
      <Canvas frameloop="demand" dpr={[1, 2]} gl={{ alpha: true, antialias: true }} style={{ touchAction: 'pan-y' }}>
        <FluidPlane />
      </Canvas>
    </div>
  );
}
