'use client';
import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// A single item in the trail
type TrailPoint = {
  x: number;
  y: number;
  age: number;
};

const TRAIL_LENGTH = 32;

const FluidShader = {
  uniforms: {
    uTexture: { value: null },
    uTrail: { value: new Array(TRAIL_LENGTH).fill(new THREE.Vector3(0, 0, 1)) }, // 1 means dead
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      // Map exactly to screen space
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uTexture;
    uniform vec3 uTrail[${TRAIL_LENGTH}];
    varying vec2 vUv;
    
    void main() {
      vec2 uv = vUv;
      vec2 force = vec2(0.0);
      
      // Calculate influence from mouse trail
      for(int i = 0; i < ${TRAIL_LENGTH}; i++) {
        vec3 point = uTrail[i];
        if(point.z >= 1.0) continue; // dead point
        
        vec2 dir = uv - point.xy;
        // Adjust distance for the 4:1 canvas aspect ratio so the distortion is roughly circular
        dir.x *= 4.0;
        
        float dist = length(dir);
        // The radius of the 'allergic' reaction
        float radius = 0.25;
        float intensity = smoothstep(radius, 0.0, dist);
        
        // Fade out as it ages
        intensity *= (1.0 - point.z);
        
        // Easing out the force
        float power = 0.015;
        force += normalize(dir) * intensity * power;
      }
      
      vec2 distortedUv = uv - force;
      
      // Sample the text mask
      // The canvas text is white (alpha 1) on transparent (alpha 0)
      float mask = texture2D(uTexture, distortedUv).a;
      
      // Generate scanlines based on the distorted Y
      // 40 lines across the height
      float lineCount = 40.0; 
      
      // We want a very thin line.
      float scanline = step(0.85, fract(distortedUv.y * lineCount));
      
      // Color: slate-50 (#F8FAFC)
      vec3 color = vec3(248.0/255.0, 250.0/255.0, 252.0/255.0);
      
      // Opacity: 0.35 max
      float alpha = mask * scanline * 0.35;
      
      gl_FragColor = vec4(color * alpha, alpha);
    }
  `
};

const FluidPlane = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const trailRef = useRef<TrailPoint[]>([]);
  
  // Create the canvas texture once the font is ready
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    // Ensure fonts are loaded before drawing.
    document.fonts.ready.then(() => {
      if (!isMounted) return;
      
      const canvas = document.createElement('canvas');
      canvas.width = 4096; // 4:1 aspect ratio
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Transparent background
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Canvas API doesn't support var() directly, we must read the computed value
      const computedFont = getComputedStyle(document.documentElement).getPropertyValue('--font-bebas') || 'sans-serif';
      
      // Draw text to fill the canvas width
      // 950px fits "THESSARIS" nicely within 4096 width for Bebas Neue
      ctx.font = `400 950px ${computedFont}, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      
      // Bebas Neue baseline often needs slight manual tweaking
      ctx.fillText('THESSARIS', canvas.width / 2, canvas.height / 2 + 50);
      
      const tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      setTexture(tex);
    });
    
    return () => { isMounted = false; };
  }, []);

  useFrame((state, delta) => {
    if (!materialRef.current) return;
    
    // Convert R3F pointer (-1 to 1) to UV space (0 to 1)
    const uvX = (state.pointer.x + 1) / 2;
    // R3F Y is positive up, UV Y is positive up.
    const uvY = (state.pointer.y + 1) / 2;
    
    // Add point to trail if mouse moved
    const lastPoint = trailRef.current[trailRef.current.length - 1];
    if (!lastPoint || Math.abs(lastPoint.x - uvX) > 0.005 || Math.abs(lastPoint.y - uvY) > 0.005) {
      trailRef.current.push({ x: uvX, y: uvY, age: 0 });
    }
    
    // Age and prune trail
    const speed = 1.2; // how fast the trail fades (1.0 = 1 second)
    trailRef.current.forEach(p => p.age += delta * speed);
    trailRef.current = trailRef.current.filter(p => p.age < 1.0);
    
    // Build uniform array
    const uniformsArray = materialRef.current.uniforms.uTrail.value as THREE.Vector3[];
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      if (i < trailRef.current.length) {
        const p = trailRef.current[i];
        uniformsArray[i].set(p.x, p.y, p.age);
      } else {
        uniformsArray[i].set(0, 0, 1); // dead
      }
    }
  });

  if (!texture) return null;

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={FluidShader.vertexShader}
        fragmentShader={FluidShader.fragmentShader}
        uniforms={{
          ...FluidShader.uniforms,
          uTexture: { value: texture }
        }}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  );
};

export default function FooterFluidText() {
  return (
    <div className="w-full h-full absolute inset-0 cursor-crosshair z-0">
      <Canvas
        gl={{ alpha: true, antialias: true }}
      >
        <FluidPlane />
      </Canvas>
    </div>
  );
}
