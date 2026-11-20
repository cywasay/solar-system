/**
 * Depth engine shared by hero sections.
 *
 * Publishes `--mx` / `--my` (pointer, -1..1, eased) and `--sp` (how far the element has
 * scrolled past the top of the viewport, 0..1, eased) on `element`. Layers read these
 * at different multipliers, which is what reads as depth. Same model as the landing
 * page's HeroStage.
 *
 * Cost control: only the custom properties are written (consumers stay few), the loop
 * sleeps when nothing is moving, stops while the element is off-screen, and pointer
 * tracking only starts on fine-pointer devices. Returns a cleanup function.
 */
export function attachDepth(element: HTMLElement): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  let frame = 0;
  let visible = true;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let progress = 0;
  let lastX = -999;
  let lastY = -999;
  let lastProgress = -1;

  const scrollTarget = () => {
    const bounds = element.getBoundingClientRect();
    return Math.min(1, Math.max(0, -bounds.top / (bounds.height || 1)));
  };

  const tick = () => {
    currentX += (targetX - currentX) * 0.06;
    currentY += (targetY - currentY) * 0.06;
    const next = scrollTarget();
    progress += (next - progress) * 0.12;

    let changed = false;
    if (Math.abs(currentX - lastX) > 5e-4) {
      element.style.setProperty('--mx', currentX.toFixed(3));
      lastX = currentX;
      changed = true;
    }
    if (Math.abs(currentY - lastY) > 5e-4) {
      element.style.setProperty('--my', currentY.toFixed(3));
      lastY = currentY;
      changed = true;
    }
    if (Math.abs(progress - lastProgress) > 5e-4) {
      element.style.setProperty('--sp', progress.toFixed(3));
      lastProgress = progress;
      changed = true;
    }
    const moving =
      Math.abs(targetX - currentX) > 1e-4 ||
      Math.abs(targetY - currentY) > 1e-4 ||
      Math.abs(next - progress) > 1e-4;
    frame = visible && (moving || changed) ? requestAnimationFrame(tick) : 0;
  };
  const wake = () => {
    if (visible && !frame) frame = requestAnimationFrame(tick);
  };
  const onPointerMove = (event: PointerEvent) => {
    targetX = (event.clientX / (window.innerWidth || 1)) * 2 - 1;
    targetY = (event.clientY / (window.innerHeight || 1)) * 2 - 1;
    wake();
  };
  const onPointerLeave = () => {
    targetX = 0;
    targetY = 0;
    wake();
  };

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    wake();
  });
  observer.observe(element);
  window.addEventListener('scroll', wake, { passive: true });
  window.addEventListener('resize', wake);
  if (finePointer) {
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave);
  }
  wake();

  return () => {
    observer.disconnect();
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener('scroll', wake);
    window.removeEventListener('resize', wake);
    window.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerleave', onPointerLeave);
  };
}
