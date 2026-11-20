type Point = { x: number; y: number };

const FLIGHT_DURATION = 4100;

function cubic(first: Point, second: Point, end: Point) {
  return ` C ${first.x} ${first.y} ${second.x} ${second.y} ${end.x} ${end.y}`;
}

function offset(point: Point, direction: Point, distance: number): Point {
  return { x: point.x + direction.x * distance, y: point.y + direction.y * distance };
}

export function playIntroOrbit(
  section: HTMLElement,
  word: HTMLElement,
  diagram: SVGSVGElement,
  trail: SVGPathElement,
  tip: SVGCircleElement,
) {
  const sectionBox = section.getBoundingClientRect();
  const wordBox = word.getBoundingClientRect();
  const diagramBox = diagram.getBoundingClientRect();
  const originY = sectionBox.top + section.clientTop;
  const center = {
    x: wordBox.left + wordBox.width / 2 - sectionBox.left,
    y: wordBox.top + wordBox.height / 2 - originY,
  };
  const rx = wordBox.width / 2 + 16;
  const ry = wordBox.height / 2 + 10;
  const scale = diagramBox.width / 320;
  const onDiagram = (x: number, y: number): Point => ({
    x: diagramBox.left - sectionBox.left + x * scale,
    y: diagramBox.top - originY + y * scale,
  });
  const dock = onDiagram(63, 134);
  const dockHandle = onDiagram(92, 126);
  const seed = Math.random() * 2 * Math.PI;
  const entryHeight = 32 + Math.random() * 44;

  function orbitAt(turn: number): Point {
    const angle = Math.PI + 0.46 + turn * Math.PI * 4;
    const drift = Math.sin(turn * 8 + seed);
    return {
      x: center.x + Math.cos(angle) * (rx + 9 * drift),
      y: center.y + Math.sin(angle) * (ry + 7 * Math.cos(turn * 7 - seed)) + 8 * drift,
    };
  }

  function tangentAt(turn: number): Point {
    const before = orbitAt(turn - 0.0001);
    const after = orbitAt(turn + 0.0001);
    return { x: (after.x - before.x) / 0.0002, y: (after.y - before.y) / 0.0002 };
  }

  const first = orbitAt(0);
  const last = orbitAt(1);
  const entry = { x: -24 - sectionBox.left, y: first.y + entryHeight };
  const entryTangent = tangentAt(0);
  const exitTangent = tangentAt(1);
  const entryHandle = Math.min(76, Math.max(20, (first.x - entry.x) * 0.28));
  const exitHandle = Math.min(160, Math.max(38, Math.hypot(dock.x - last.x, dock.y - last.y) * 0.32));

  // The entry, the two turns, and the diagram share tangents at their joins.
  // Gradual changes in radius keep the orbit varied without sudden direction changes.
  let flight = `M ${entry.x} ${entry.y}` + cubic(
    { x: entry.x + (first.x - entry.x) * 0.43, y: entry.y + 12 },
    offset(first, entryTangent, -entryHandle / Math.hypot(entryTangent.x, entryTangent.y)),
    first,
  );
  const segments = 32;
  for (let i = 0; i < segments; i++) {
    const from = i / segments;
    const to = (i + 1) / segments;
    const end = orbitAt(to);
    flight += cubic(
      offset(orbitAt(from), tangentAt(from), 1 / (3 * segments)),
      offset(end, tangentAt(to), -1 / (3 * segments)),
      end,
    );
  }
  trail.setAttribute('d', flight);
  const loopEndDistance = trail.getTotalLength();

  flight += cubic(
    offset(last, exitTangent, exitHandle / Math.hypot(exitTangent.x, exitTangent.y)),
    { x: 2 * dock.x - dockHandle.x, y: 2 * dock.y - dockHandle.y },
    dock,
  );
  trail.setAttribute('d', flight);
  const flightLength = trail.getTotalLength();

  // Extend the moving stroke along the exact diagram curve for the handoff.
  const pair = (x: number, y: number) => {
    const point = onDiagram(x, y);
    return `${point.x} ${point.y}`;
  };
  const toWaypoint = flight + ` C ${pair(92, 126)} ${pair(116, 64)} ${pair(160, 59)}`;
  trail.setAttribute('d', toWaypoint);
  const waypointDistance = trail.getTotalLength();
  trail.setAttribute('d', toWaypoint + ` S ${pair(234, 79)} ${pair(260, 68)}`);
  const totalLength = trail.getTotalLength();
  // Invert the point's easing to time the ring against the actual approach distance.
  const timeAtDistance = (distance: number) =>
    FLIGHT_DURATION * Math.acos(1 - 2 * distance / totalLength) / Math.PI;
  const ringEnd = timeAtDistance(flightLength);
  const ringStart = Math.min(timeAtDistance(loopEndDistance), ringEnd - 650);
  diagram.style.setProperty('--ring-start', `${ringStart}ms`);
  diagram.style.setProperty('--ring-duration', `${ringEnd - ringStart}ms`);
  diagram.style.setProperty('--dock-time', `${ringEnd}ms`);
  diagram.style.setProperty('--waypoint-time', `${timeAtDistance(waypointDistance)}ms`);
  let frameId = 0;
  let startedAt: number | undefined;
  const resizeObserver = new ResizeObserver(() => {
    const { width, height } = section.getBoundingClientRect();
    if (width !== sectionBox.width || height !== sectionBox.height) finish();
  });

  function finish() {
    cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
    section.dataset.orbit = 'settled';
  }

  function draw(now: number) {
    if (startedAt === undefined) {
      startedAt = now;
      section.dataset.orbit = 'flying';
    }
    const progress = Math.min(1, (now - startedAt) / FLIGHT_DURATION);
    const distance = totalLength * (0.5 - Math.cos(progress * Math.PI) / 2);
    const landing = Math.max(0, (distance - flightLength) / (totalLength - flightLength));
    const tail = Math.min(flightLength, Math.max(0, distance - Math.min(145, sectionBox.width * 0.35)));
    const tailStart = tail + (flightLength - tail) * landing;
    const head = trail.getPointAtLength(distance);
    trail.setAttribute('stroke-dasharray', `${distance - tailStart} ${totalLength}`);
    trail.setAttribute('stroke-dashoffset', String(-tailStart));
    trail.setAttribute('stroke-width', String(2.1 + (1.3 * scale - 2.1) * landing));
    tip.setAttribute('cx', String(head.x));
    tip.setAttribute('cy', String(head.y));
    tip.setAttribute('r', String(3.5 + (4 * scale - 3.5) * landing));

    if (progress < 1) {
      frameId = requestAnimationFrame(draw);
    } else {
      diagram.dataset.arrived = 'true';
      finish();
    }
  }

  resizeObserver.observe(section);
  frameId = requestAnimationFrame(draw);
  return finish;
}
