/**
 * Resolves once an image's bytes are loaded (drawable), then gives decode() a short chance
 * to finish off the main thread. decode() alone can stall indefinitely in background or
 * hidden tabs, so it is never awaited unbounded. Never rejects.
 */
export function whenImageReady(src: string, image: HTMLImageElement = new window.Image()): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const settle = () => {
      Promise.race([image.decode().catch(() => undefined), new Promise((r) => window.setTimeout(r, 250))]).then(() => resolve(image));
    };
    image.decoding = 'async';
    image.addEventListener('load', settle, { once: true });
    image.addEventListener('error', () => resolve(image), { once: true });
    image.src = src;
    if (image.complete && image.naturalWidth) settle();
  });
}
