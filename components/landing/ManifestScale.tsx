import { planets } from '@/data/planets';
import Reveal from './Reveal';

const MAX_AU = 30.07;
const MIN_SCENE = planets[0].distanceFromSun;
const MAX_SCENE = planets[planets.length - 1].distanceFromSun;
const featured = ['Mercury', 'Earth', 'Jupiter', 'Neptune'].map((name) =>
  planets.find((planet) => planet.name === name)!
);

function actualPosition(planet: (typeof planets)[number]) {
  return Math.max(1.5, Math.min(98.5, (parseFloat(planet.facts.distance) / MAX_AU) * 100));
}

function compressedPosition(planet: (typeof planets)[number]) {
  return Math.max(1.5, Math.min(98.5,
    ((planet.distanceFromSun - MIN_SCENE) / (MAX_SCENE - MIN_SCENE)) * 100
  ));
}

function ScaleRail({
  label,
  detail,
  position,
}: {
  label: string;
  detail: string;
  position: (planet: (typeof planets)[number]) => number;
}) {
  return (
    <div className="border-t border-[#1E293B] py-6 sm:py-8">
      <div className="mb-9 flex items-baseline justify-between gap-4">
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{label}</span>
        <span className="text-xs text-slate-600">{detail}</span>
      </div>
      <div className="relative h-16">
        <span className="absolute left-0 right-0 top-1/2 h-px bg-[#1E293B]" />
        <span className="manifest-line absolute left-0 right-0 top-1/2 h-px origin-left bg-[#EA580C]/70" />
        {featured.map((planet, index) => (
          <span
            key={planet.name}
            className="manifest-stop absolute top-1/2"
            style={{
              left: `${position(planet)}%`,
              ['--stop-delay' as string]: `${180 + index * 110}ms`,
            }}
          >
            <span
              className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#EA580C] bg-[#020617]"
              style={{ boxShadow: `0 0 10px ${planet.fallbackColor}80` }}
            />
            <span className={`absolute whitespace-nowrap font-serif text-xs italic text-slate-400 ${index === 0 ? 'left-0' : index === featured.length - 1 ? 'right-0' : 'left-1/2 -translate-x-1/2'} ${index === 2 ? '-top-11' : index % 2 ? 'top-4' : '-top-7'}`}>
              {planet.name}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ManifestScale() {
  return (
    <div>
      <div className="grid grid-cols-1 gap-8 sm:gap-12 md:grid-cols-12">
        <Reveal className="md:col-span-7">
          <p className="font-serif text-xl leading-[1.4] tracking-tight text-slate-200 sm:text-2xl md:text-[2.1rem]">
            Played at true scale, the solar system is unwatchable
            <sup className="ml-0.5 font-serif text-base not-italic text-[#EA580C]">1</sup> — so
            this one compresses size, distance and time along separate curves, keeping the
            ratios honest<sup className="ml-0.5 font-serif text-base not-italic text-[#EA580C]">2</sup>.
            Everything else is real: sidereal spin rates, axial tilts, retrograde worlds, a
            camera that chases live positions
            <sup className="ml-0.5 font-serif text-base not-italic text-[#EA580C]">3</sup>. It is
            less a diagram than an <span className="italic">instrument</span>.
          </p>
        </Reveal>

        <Reveal className="md:col-span-4 md:col-start-9" delay={120}>
          <aside className="space-y-5 text-sm leading-relaxed text-slate-500">
            <p><span className="mr-1.5 font-serif text-[#EA580C]">1</span>At true scale, every planet is smaller than one pixel.</p>
            <p><span className="mr-1.5 font-serif text-[#EA580C]">2</span>Neptune&rsquo;s year runs 684&times; longer than Mercury&rsquo;s; ordering is always preserved.</p>
            <p><span className="mr-1.5 font-serif text-[#EA580C]">3</span>Positions are read from the scene graph every frame, never cached.</p>
            <p className="border-t border-[#1E293B] pt-4 text-slate-600">Data from NASA planetary fact sheets. Textures from Solar System Scope.</p>
          </aside>
        </Reveal>
      </div>

      <Reveal className="mt-16 sm:mt-24" delay={100}>
        <div className="relative overflow-hidden border-y border-[#1E293B] py-8 sm:py-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_50%,rgba(234,88,12,0.07),transparent_38%)]" />
          <div className="relative mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#EA580C]">Scale study</span>
              <h3 className="mt-2 max-w-2xl font-serif text-3xl text-white sm:text-4xl md:text-5xl">
                Keep the order. Bend the distance.
              </h3>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-slate-500">
              The published system collapses its inner worlds into a few pixels. The watchable model opens that space while preserving every planet&rsquo;s place in line.
            </p>
          </div>

          <ScaleRail label="Published distance" detail="0–30.07 astronomical units" position={actualPosition} />
          <ScaleRail label="Watchable model" detail="independently compressed scene units" position={compressedPosition} />

          <div className="grid grid-cols-3 border-t border-[#1E293B] pt-7">
            <div>
              <span className="block font-serif text-2xl text-white sm:text-4xl">3</span>
              <span className="mt-1 block text-[9px] uppercase tracking-[0.16em] text-slate-500 sm:text-[10px]">Separate curves</span>
            </div>
            <div className="border-l border-[#1E293B] pl-5 sm:pl-8">
              <span className="block font-serif text-2xl text-white sm:text-4xl">684×</span>
              <span className="mt-1 block text-[9px] uppercase tracking-[0.16em] text-slate-500 sm:text-[10px]">Year range</span>
            </div>
            <div className="border-l border-[#1E293B] pl-5 sm:pl-8">
              <span className="block font-serif text-2xl text-white sm:text-4xl">01–08</span>
              <span className="mt-1 block text-[9px] uppercase tracking-[0.16em] text-slate-500 sm:text-[10px]">Order preserved</span>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
