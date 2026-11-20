const BLINK_MS = 320;
const DRAG_MS = 760;
const HOLD_MS = 120;
const RELEASE_MS = 180;
const TYPE_START = BLINK_MS + DRAG_MS + HOLD_MS + RELEASE_MS;
const CARET_RELEASE_MS = 260;

function ease(progress: number) {
  const t = Math.max(0, Math.min(1, progress));
  return t * t * (3 - 2 * t);
}

export function playIntroCopy(
  copy: HTMLDivElement,
  typed: HTMLSpanElement,
  pending: HTMLSpanElement,
  description: string,
  onTitleReady: () => void,
) {
  const characters = Array.from(description);
  let startedAt: number | undefined;
  let typedCount = 0;
  let nextCharacterAt = TYPE_START;
  let typing = false;
  let typedAt: number | undefined;
  copy.style.setProperty('--press-delay', `${BLINK_MS}ms`);
  let frame = requestAnimationFrame(draw);

  function draw(now: number) {
    if (startedAt === undefined) {
      startedAt = now;
      copy.dataset.reveal = 'selecting';
    }
    const elapsed = now - startedAt;

    if (elapsed < TYPE_START) {
      const drag = (elapsed - BLINK_MS) / DRAG_MS;
      const fade = 1 - ease((elapsed - TYPE_START + RELEASE_MS) / RELEASE_MS);
      const cursor = elapsed < BLINK_MS && Math.floor(elapsed / 80) % 2 === 1 ? 0 : fade;
      const reach = ease(drag / 0.92);
      const drop = ease((drag - 0.1) / 0.9);
      const lean = Math.sin(Math.PI * reach);
      copy.style.setProperty('--drag-width', `${100 * reach}%`);
      copy.style.setProperty('--drag-height', `${100 * drop}%`);
      copy.style.setProperty('--drag-opacity', String(cursor));
      copy.style.setProperty('--box-opacity', String(ease(drag / 0.14)));
      copy.style.setProperty('--pointer-lean', `${-12 * lean}deg`);
    } else {
      if (!typing) {
        typing = true;
        copy.dataset.reveal = 'typing';
        onTitleReady();
      }
      // Pauses after punctuation and small changes in speed give the typing a rhythm.
      const previousCount = typedCount;
      while (typedCount < characters.length && elapsed >= nextCharacterAt) {
        const character = characters[typedCount];
        const pause = /[.!?]/.test(character) ? 120 : /[,:]/.test(character) ? 55 : character === ' ' ? 8 : 0;
        nextCharacterAt += 9 + (typedCount * 7) % 11 + pause;
        typedCount++;
      }
      if (typedCount !== previousCount) {
        typed.textContent = characters.slice(0, typedCount).join('');
        pending.textContent = characters.slice(typedCount).join('');
      }
      if (typedCount === characters.length) {
        if (typedAt === undefined) {
          typedAt = elapsed;
          copy.dataset.reveal = 'finishing';
        }
        if (elapsed - typedAt >= CARET_RELEASE_MS) {
          copy.dataset.reveal = 'complete';
          return;
        }
      }
    }
    frame = requestAnimationFrame(draw);
  }

  return () => cancelAnimationFrame(frame);
}
