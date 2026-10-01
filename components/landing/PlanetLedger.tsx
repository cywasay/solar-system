'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { planets, type PlanetRingConfig } from '@/data/planets';
import { planetEditorial } from '@/data/planetEditorial';

const EASE = 'ease-[cubic-bezier(0.16,1,0.3,1)]';

const auOf = (name: string) => parseFloat(
  planets.find((planet) => planet.name === name)!.facts.distance
).toFixed(2);

const velocityOf = (name: string) =>
  planetEditorial[name].stats.find((stat) => stat.label === 'Orbital velocity')?.value ?? '';

function announcePlanet(index: number | null) {
  window.dispatchEvent(new CustomEvent('thessaris:planet-preview', {
    detail: index === null ? null : {
      index,
      name: planets[index].name,
      au: auOf(planets[index].name),
    },
  }));
}

/**
 * The simulation maps Saturn's one-dimensional ring strip by radial distance.
 * Rebuild that same annulus once in canvas, then show it twice so the near half can
 * pass in front of the sphere while the far half remains behind it.
 */
function SaturnRingPreview({ ring }: { ring: PlanetRingConfig }) {
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const back = backRef.current;
    const front = frontRef.current;
    if (!back || !front) return;

    let cancelled = false;
    const image = new Image();
    image.decoding = 'async';
    image.src = ring.textureFile;

    image.onload = () => {
      if (cancelled) return;

      const source = document.createElement('canvas');
      source.width = image.naturalWidth;
      source.height = image.naturalHeight;
      const sourceContext = source.getContext('2d', { willReadFrequently: true });
      const backContext = back.getContext('2d');
      const frontContext = front.getContext('2d');
      if (!sourceContext || !backContext || !frontContext) return;

      sourceContext.drawImage(image, 0, 0);
      const sourcePixels = sourceContext.getImageData(0, 0, source.width, source.height).data;
      const output = backContext.createImageData(back.width, back.height);
      const centre = back.width / 2;
      const outerRadius = centre - 2;
      const innerRatio = ring.innerRadius / ring.outerRadius;
      const sourceY = Math.floor(source.height / 2);

      for (let y = 0; y < back.height; y += 1) {
        for (let x = 0; x < back.width; x += 1) {
          const dx = (x + 0.5 - centre) / outerRadius;
          const dy = (y + 0.5 - centre) / outerRadius;
          const radius = Math.sqrt(dx * dx + dy * dy);
          if (radius < innerRatio || radius > 1) continue;

          const radialPosition = (radius - innerRatio) / (1 - innerRatio);
          const sourceX = Math.min(source.width - 1, Math.round(radialPosition * (source.width - 1)));
          const sourceOffset = (sourceY * source.width + sourceX) * 4;
          const outputOffset = (y * back.width + x) * 4;

          output.data[outputOffset] = sourcePixels[sourceOffset];
          output.data[outputOffset + 1] = sourcePixels[sourceOffset + 1];
          output.data[outputOffset + 2] = sourcePixels[sourceOffset + 2];
          output.data[outputOffset + 3] = sourcePixels[sourceOffset + 3];
        }
      }

      backContext.putImageData(output, 0, 0);
      frontContext.putImageData(output, 0, 0);
    };

    return () => {
      cancelled = true;
      image.onload = null;
    };
  }, [ring]);

  return (
    <>
      <canvas ref={backRef} width={640} height={640} className="saturn-ring-canvas saturn-ring-canvas--back" />
      <canvas ref={frontRef} width={640} height={640} className="saturn-ring-canvas saturn-ring-canvas--front" />
    </>
  );
}

export default function PlanetLedger() {
  const [activeIndex, setActiveIndex] = useState(2);
  const active = planets[activeIndex];

  const activate = (index: number) => {
    setActiveIndex(index);
    announcePlanet(index);
  };

  return (
    <div
      className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] gap-10 lg:gap-16"
      onMouseLeave={() => announcePlanet(null)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) announcePlanet(null);
      }}
    >
      <ul className="relative z-10">
        {planets.map((planet, index) => {
          const selected = index === activeIndex;
          const period = (2 * Math.PI) / planet.orbitSpeed;
          const phase = ((index * 0.382) % 1) * period;
          return (
            <li key={planet.name}>
              <Link
                href={`/planets/${planet.name.toLowerCase()}`}
                onMouseEnter={() => activate(index)}
                onFocus={() => activate(index)}
                className={`group relative flex min-h-20 items-center gap-3 border-b border-[#1E293B] py-4 transition-[background-color,color] duration-500 first:border-t focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#EA580C] sm:gap-5 sm:py-5 md:min-h-28 md:gap-7 md:py-7 ${selected ? 'bg-[#F8FAFC]/[0.025]' : 'hover:bg-[#F8FAFC]/[0.018]'}`}
              >
                <span
                  aria-hidden
                  className={`absolute inset-y-0 left-0 w-px origin-center bg-[#EA580C] transition-transform duration-500 ${EASE} ${selected ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-50'}`}
                />

                <span
                  aria-hidden
                  className={`relative hidden h-8 w-8 shrink-0 rounded-full border transition-[border-color,transform] duration-500 sm:inline-block ${selected ? 'scale-110 border-[#EA580C]/70' : 'border-[#1E293B]'}`}
                >
                  <span
                    className="orbit-arm absolute inset-0"
                    style={{
                      animation: `orbit-spin ${period.toFixed(1)}s linear infinite`,
                      animationDelay: `-${phase.toFixed(1)}s`,
                    }}
                  >
                    <span
                      className="absolute left-1/2 top-0 h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{
                        backgroundColor: planet.fallbackColor,
                        boxShadow: selected ? `0 0 12px 2px ${planet.fallbackColor}` : 'none',
                      }}
                    />
                  </span>
                </span>

                <span className={`w-6 text-sm tabular-nums transition-colors duration-300 ${selected ? 'text-[#EA580C]' : 'text-slate-500'}`}>
                  {String(index + 1).padStart(2, '0')}
                </span>

                <span className={`flex-1 font-serif text-2xl leading-none transition-[transform,color] duration-500 sm:text-3xl md:text-5xl ${EASE} ${selected ? 'translate-x-2 text-white' : 'text-slate-200 group-hover:translate-x-2 group-hover:text-white'}`}>
                  {planet.name}
                </span>

                <span
                  aria-hidden
                  className={`planet-row-sphere h-10 w-10 shrink-0 rounded-full lg:hidden ${selected ? 'opacity-100' : 'opacity-45'}`}
                  style={{
                    backgroundImage: `url(${planet.textureFile})`,
                    ['--planet-color' as string]: planet.fallbackColor,
                  }}
                />

                <span className="hidden w-24 text-right text-sm tabular-nums text-slate-500 sm:block">
                  {auOf(planet.name)} AU
                </span>
                <span className="hidden w-28 text-right text-sm text-slate-500 xl:block">
                  {planet.facts.orbitalPeriod}
                </span>
                <span className="hidden w-28 text-right text-sm tabular-nums text-slate-500 xl:block">
                  {velocityOf(planet.name)}
                </span>

                <span
                  aria-hidden
                  className={`text-lg text-[#EA580C] transition-[opacity,transform] duration-500 ${EASE} ${selected ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`}
                >
                  →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <aside className="relative hidden lg:block" aria-live="polite">
        <div className="sticky top-[16vh] flex h-[68vh] min-h-[480px] flex-col overflow-hidden border-l border-[#1E293B] pl-10 xl:pl-14">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-4 text-[10px] uppercase tracking-[0.2em] text-slate-500">
            <span>Live encounter</span>
            <span className="text-[#EA580C]">Tracking {String(activeIndex + 1).padStart(2, '0')}</span>
          </div>

          <div className="relative flex flex-1 items-center justify-center">
            <span className="absolute h-[82%] aspect-square rounded-full border border-[#1E293B]/70" />
            <span className="absolute h-[58%] aspect-square rounded-full border border-[#1E293B]" />
            <span className="absolute h-px w-full bg-[#1E293B]/70" />

            <div
              key={active.name}
              className="planet-preview-in relative z-10 flex items-center justify-center"
              style={{ ['--planet-color' as string]: active.fallbackColor }}
            >
              {active.ring && <SaturnRingPreview ring={active.ring} />}
              <span
                className={`planet-preview-sphere block rounded-full ${active.ring ? 'h-[min(17vw,210px)] w-[min(17vw,210px)]' : 'h-[min(22vw,260px)] w-[min(22vw,260px)]'}`}
                style={{ backgroundImage: `url(${active.textureFile})` }}
              />
            </div>
          </div>

          <div className="border-t border-[#1E293B] pt-5">
            <div className="flex items-end justify-between gap-5">
              <h3 className="font-serif text-4xl text-white xl:text-5xl">{active.name}</h3>
              <span className="pb-1 text-xs tabular-nums text-[#EA580C]">{auOf(active.name)} AU</span>
            </div>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
              {active.facts.description}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
