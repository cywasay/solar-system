/** Five seconds, shared by every body, the aperture, and the route handoff. */
export const ENTRANCE_DURATION = 5_000;
export const COVER_TIME = 4_500;

type Point = { x: number; y: number };
export type Body = Point & { width: number; height: number };
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };

function bezier(a: Point, b: Point, c: Point, d: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u ** 3 * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t ** 3 * d.x,
    y: u ** 3 * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t ** 3 * d.y,
  };
}

/** Sample once on activation. The browser compositor plays the real DOM nodes;
 * there are no clones, frame-by-frame layout reads, or React animation renders. */
export function orbitKeyframes(body: Body, sink: Point, viewport: Point, index: number, startScale = { x: 1, y: 1 }): Keyframe[] {
  const delay = index * 55;
  const captureEnd = 1_050 + index * 35;
  const swallowAt = 3_720 + index * 68;
  const halfDiagonal = Math.hypot(body.width, body.height) / 2;
  const room = Math.max(24, Math.min(sink.x, viewport.x - sink.x) - halfDiagonal - 20);
  const rx = Math.min(viewport.x * .27, room) * (1 - index * .065);
  const ry = Math.min(rx * .76, viewport.y * .23);
  // Separate arrival angles keep the phone's tightly packed nav from becoming
  // one unreadable clump. The capture curves still start at each original node.
  const phase = -2.6 + index * (Math.PI / 3) + Math.atan2(body.y - sink.y, body.x - sink.x) * .10;
  const entry = { x: sink.x + Math.cos(phase) * rx, y: sink.y + Math.sin(phase) * ry };
  const tangent = { x: -Math.sin(phase), y: Math.cos(phase) };
  const controlA = { x: body.x + (entry.x - body.x) * .24, y: body.y + (entry.y - body.y) * .12 + 50 };
  const controlB = { x: entry.x - tangent.x * rx * .48, y: entry.y - tangent.y * ry * .48 };
  const frames: Keyframe[] = [];

  for (let step = 0; step <= 200; step++) {
    const time = step / 200 * ENTRANCE_DURATION;
    let point = body;
    let scaleX = startScale.x;
    let scaleY = startScale.y;
    let rotation = 0;
    let stretch = 0;
    if (time > delay && time < captureEnd) {
      const t = clamp((time - delay) / (captureEnd - delay));
      point = { ...body, ...bezier(body, controlA, controlB, entry, t) };
      scaleX = startScale.x + (.88 - startScale.x) * smooth(t);
      scaleY = startScale.y + (.88 - startScale.y) * smooth(t);
      rotation = (index % 2 ? 18 : -24) * smooth(t);
    } else if (time >= captureEnd) {
      const q = clamp((time - captureEnd) / (swallowAt - captureEnd));
      const sweep = Math.PI * 2 * (2.2 + index * .075) * (.60 * q + .40 * q * q);
      const radius = 1 - q ** 2.15;
      point = { ...body, x: sink.x + rx * radius * Math.cos(phase + sweep), y: sink.y + ry * radius * Math.sin(phase + sweep) };
      const consumed = smooth((q - .42) / .58);
      scaleX = scaleY = .88 * (1 - consumed) ** .7;
      rotation = (index % 2 ? 18 : -24) + (1.6 + index * .12) * 360 * (.6 * q + .4 * q * q);
      stretch = consumed * .55;
    }
    // A restrained, deterministic tremor gives the pull some tension. It dies
    // away before the endpoint, so every body still lands exactly in the well.
    const vibration = smooth((time - delay) / 220) * (1 - smooth((time - swallowAt + 380) / 380));
    const seconds = (time - delay) / 1000;
    const tension = vibration * (time < captureEnd ? 1.25 : 1.8);
    point = {
      ...point,
      x: point.x + tension * Math.sin(seconds * 71 + index * 1.9),
      y: point.y + tension * .65 * Math.sin(seconds * 53 + index * 2.3),
    };
    rotation += vibration * .9 * Math.sin(seconds * 61 + index);
    frames.push({
      offset: step / 200,
      transform: `translate3d(${(point.x - body.x).toFixed(3)}px, ${(point.y - body.y).toFixed(3)}px, 0) rotate(${rotation.toFixed(3)}deg) scale(${(scaleX * (1 + stretch)).toFixed(5)}, ${(scaleY * (1 - stretch)).toFixed(5)})`,
    });
  }
  return frames;
}

/** Independent translate/rotate properties keep the well's tremor separate from
 * its main capture/expansion transform, without multiplying jitter as it grows. */
export function tremorKeyframes(): Keyframe[] {
  return Array.from({ length: 201 }, (_, step) => {
    const time = step / 200;
    const envelope = smooth((time - .10) / .12) * (1 - smooth((time - .74) / .07));
    const strength = envelope * (1.0 + time * 1.5);
    return {
      offset: time,
      translate: `${(Math.sin(time * 380) * strength).toFixed(3)}px ${(Math.sin(time * 291) * strength * .6).toFixed(3)}px`,
      rotate: `${(Math.sin(time * 257) * envelope * .65).toFixed(3)}deg`,
    };
  });
}

export function apertureKeyframes(origin: Body, sink: Point, viewport: Point): Keyframe[] {
  const dx = sink.x - origin.x;
  const dy = sink.y - origin.y;
  const radius = Math.max(...[0, viewport.x].flatMap(x => [0, viewport.y].map(y => Math.hypot(x - sink.x, y - sink.y)))) + 16;
  const coverScale = radius * 2 / Math.min(origin.width, origin.height);
  const at = (scale: number) => `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`;
  return [
    { offset: 0, transform: 'translate3d(0,0,0) scale(1)', easing: 'cubic-bezier(.4,0,.16,1)' },
    { offset: .21, transform: at(1), easing: 'linear' },
    { offset: .79, transform: at(1), easing: 'cubic-bezier(.55,0,.4,1)' },
    { offset: .82, transform: at(.88), easing: 'cubic-bezier(.65,0,.2,1)' },
    { offset: .90, transform: at(coverScale) },
    { offset: 1, transform: at(coverScale) },
  ];
}
