'use client';

import { useEffect, useState } from 'react';
import * as THREE from 'three';

export interface UseOptionalTextureOptions {
  /**
   * Tag the texture SRGBColorSpace after load. Correct for colour/albedo maps, and the
   * default. MUST be false for data textures — normal, roughness, bump — whose RGB
   * values are vectors/scalars, not colours: an sRGB transfer function applied to a
   * normal map visibly warps the lighting.
   */
  srgb?: boolean;
}

/**
 * Loads a texture, resolving to `null` when the file is absent instead of throwing.
 *
 * Deliberately not Drei's `useTexture`. That builds on `useLoader`, which throws on a
 * 404; an error boundary can catch it, but Next's dev overlay reports boundary-caught
 * errors too, so every missing texture became a full-screen error toast. Swallowing the
 * failure at the loader keeps a missing file a non-event rather than a recoverable crash.
 *
 * Accepts `null` for "this body has no such map", so callers with optional maps don't
 * need conditional hook calls. Returns `null` on the first render and while loading, so
 * callers must be able to draw something without a texture.
 */
export default function useOptionalTexture(
  url: string | null,
  options?: UseOptionalTextureOptions
): THREE.Texture | null {
  const srgb = options?.srgb ?? true;
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    // No-op without a URL, and outside the browser (SSR, headless test renderers) —
    // TextureLoader needs the DOM's Image.
    if (!url || typeof window === 'undefined') return;

    let active = true;
    let loaded: THREE.Texture | undefined;

    new THREE.TextureLoader().load(
      url,
      (loadedTexture) => {
        loaded = loadedTexture;
        // Effects run twice under StrictMode; drop the orphaned first load.
        if (!active) {
          loadedTexture.dispose();
          return;
        }
        if (srgb) loadedTexture.colorSpace = THREE.SRGBColorSpace;
        setTexture(loadedTexture);
      },
      undefined,
      () => {
        if (!active) return;
        setTexture(null);
        if (process.env.NODE_ENV !== 'production') {
          // console.warn, not console.error — Next's dev overlay surfaces errors.
          console.warn(
            `[solar-system] No texture at ${url}; using the fallback colour. ` +
              `See public/textures/README.md.`
          );
        }
      }
    );

    return () => {
      active = false;
      setTexture(null);
      loaded?.dispose();
    };
  }, [url, srgb]);

  return texture;
}
