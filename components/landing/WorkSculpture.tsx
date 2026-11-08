'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import styles from './PortfolioWork.module.css';

let sculptureAssembled = false;
const SIDE = 43;
const project = (x: number, y: number, z: number) => [(x - y) * .866, (x + y) * .5 - z];
const polygon = (vertices: number[][]) => vertices.map(([x, y, z]) => project(x, y, z).join(',')).join(' ');
const faces = {
  top: polygon([[0, 0, SIDE], [SIDE, 0, SIDE], [SIDE, SIDE, SIDE], [0, SIDE, SIDE]]),
  left: polygon([[0, SIDE, 0], [SIDE, SIDE, 0], [SIDE, SIDE, SIDE], [0, SIDE, SIDE]]),
  right: polygon([[SIDE, 0, 0], [SIDE, SIDE, 0], [SIDE, SIDE, SIDE], [SIDE, 0, SIDE]]),
};
// Painter's order: rear pieces first, then the upper/front pieces.
const blocks = [
  [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
  [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1],
];

export default function WorkSculpture() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const button = ref.current;
    if (!button || sculptureAssembled) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches || new URLSearchParams(location.search).has('lite')) return;
    button.dataset.assembly = 'waiting';
    let timer: ReturnType<typeof setTimeout>;
    const finish = () => { button.dataset.assembly = 'complete'; };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      sculptureAssembled = true;
      button.dataset.assembly = 'playing';
      timer = setTimeout(finish, 4000);
    }, { threshold: .45 });
    observer.observe(button);
    preference.addEventListener('change', finish);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
      preference.removeEventListener('change', finish);
      delete button.dataset.assembly;
    };
  }, []);

  return (
    <button ref={ref} type="button" className={styles.sculpturePlay}
      aria-label="Unfold the sculpture" aria-pressed={open} data-open={open}
      onClick={() => {
        if (ref.current) ref.current.dataset.assembly = 'complete';
        sculptureAssembled = true;
        setOpen(value => !value);
      }}>
      <svg viewBox="0 0 440 290" aria-hidden="true">
        <g transform="translate(220 145) scale(1.25)">
          {blocks.map(([x, y, z], index) => {
            const [px, py] = project(x * 46 - 44.5, y * 46 - 44.5, z * 46 - 44.5);
            const [dx, dy] = project((x - .5) * 26, (y - .5) * 26, (z - .5) * 24);
            const accent = x === 1 && y === 1 && z === 1;
            return (
              <g key={index} transform={`translate(${px} ${py})`}>
                <g className={styles.blockArrival} style={{
                  '--piece-x': `${dx}px`, '--piece-y': `${dy}px`,
                  '--piece-delay': `${index * 130}ms`,
                  '--piece-angle': `${(index % 2 ? 1 : -1) * 14}deg`,
                } as CSSProperties}>
                  <g className={styles.sculptureBlock} data-accent={accent}>
                    <polygon className={styles.blockLeft} points={faces.left} />
                    <polygon className={styles.blockRight} points={faces.right} />
                    <polygon className={styles.blockTop} points={faces.top} />
                  </g>
                </g>
              </g>
            );
          })}
        </g>
      </svg>
      <span>{open ? 'Bring it together' : 'Pull it apart'} <span className={styles.sculptureToggle} aria-hidden="true">{open ? '−' : '+'}</span></span>
    </button>
  );
}
