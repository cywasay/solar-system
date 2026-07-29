import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { planets } from '@/data/planets';
import { planetEditorial } from '@/data/planetEditorial';

/** All eight pages are prerendered at build time from the simulation's own data. */
export function generateStaticParams() {
  return planets.map((planet) => ({ slug: planet.name.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const planet = planets.find((p) => p.name.toLowerCase() === slug);
  if (!planet) return {};
  return {
    title: `${planet.name} — Thessaris`,
    description: planet.facts.description,
  };
}

export default async function PlanetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const index = planets.findIndex((p) => p.name.toLowerCase() === slug);
  if (index === -1) notFound();

  const planet = planets[index];
  const editorial = planetEditorial[planet.name];
  const previous = planets[(index + planets.length - 1) % planets.length];
  const next = planets[(index + 1) % planets.length];
  const ordinal = String(index + 1).padStart(2, '0');

  // Simulation facts, single source of truth — reshaped for the table, never restated.
  const dataRows = [
    { label: 'Diameter', value: `${planet.facts.diameterKm.toLocaleString('en-US')} km` },
    { label: 'Distance', value: planet.facts.distance.replace(' from the Sun', '') },
    { label: 'Orbital period', value: planet.facts.orbitalPeriod },
    { label: 'Day length', value: planet.facts.dayLength },
    ...editorial.stats,
  ];

  return (
    <main className="min-h-screen bg-[#09090B] text-[#FAFAFA] page-in">
      {/* Chrome bar, same register as the landing nav */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-6 font-mono text-[10px] md:text-xs tracking-widest uppercase border-b border-[#27272A]/40 text-[#71717A]">
        <Link href="/" className="hover:text-[#FF4500] transition-colors duration-200 text-[#FAFAFA]">
          Simulation.01
        </Link>
        <span>
          Planetary Index — {ordinal} / {String(planets.length).padStart(2, '0')}
        </span>
      </nav>

      {/* Masthead */}
      <header className="px-6 md:px-12 pt-16 md:pt-24 pb-12 border-b border-[#27272A]/40 relative overflow-hidden">
        <p className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-[#71717A] mb-8">
          {editorial.classification}
        </p>
        <h1 className="font-serif uppercase text-[16vw] md:text-[13vw] leading-[0.82] tracking-tight">
          {planet.name}
          <span className="text-[#FF4500]">.</span>
        </h1>
        {/* Ghost ordinal — the landing's oversized grey numerals, used as a watermark. */}
        <span
          aria-hidden
          className="absolute right-6 md:right-12 bottom-4 font-mono text-[#27272A] text-[10vw] leading-none select-none"
        >
          {ordinal}
        </span>
      </header>

      {/* Longform + hero stat */}
      <section className="px-6 md:px-12 py-16 md:py-24 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
        <div className="md:col-span-7 space-y-8 font-serif text-xl md:text-2xl leading-[1.55] text-[#A1A1AA]">
          <p className="text-[#FAFAFA]">{editorial.paragraphs[0]}</p>
          <p>{editorial.paragraphs[1]}</p>
        </div>

        <aside className="md:col-span-4 md:col-start-9">
          <div className="border-t-2 border-[#FF4500] pt-6">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-7xl md:text-8xl tracking-tighter leading-none">
                {editorial.heroStat.value}
              </span>
              <span className="font-mono text-xl md:text-2xl text-[#71717A]">
                {editorial.heroStat.unit}
              </span>
            </div>
            <p className="mt-4 font-mono text-[10px] md:text-xs uppercase tracking-[0.15em] leading-relaxed text-[#71717A]">
              {editorial.heroStat.label}
            </p>
          </div>

          {/* The simulation's own one-liner, quoted — shared voice across app and site. */}
          <p className="mt-12 font-serif italic text-lg leading-relaxed text-[#A1A1AA] border-l border-[#27272A] pl-5">
            {planet.facts.description}
          </p>
        </aside>
      </section>

      {/* Data sheet */}
      <section className="border-t border-[#27272A]/40">
        <h2 className="sr-only">{planet.name} data sheet</h2>
        <dl className="grid grid-cols-2 md:grid-cols-4">
          {dataRows.map((row, i) => (
            <div
              key={row.label}
              className={`px-6 md:px-8 py-8 border-b border-[#27272A]/40 ${
                // Hairline verticals between cells, none on the row's leading edge.
                i % 4 !== 0 ? 'md:border-l' : ''
              } ${i % 2 !== 0 ? 'border-l md:border-l' : ''} border-[#27272A]/40`}
            >
              <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#71717A]">
                {row.label}
              </dt>
              <dd className="mt-3 font-serif text-2xl md:text-3xl tracking-tight">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Live view + satellites */}
      <section className="px-6 md:px-12 py-16 border-b border-[#27272A]/40 flex flex-col md:flex-row md:items-center gap-10 md:gap-16">
        <Link
          href={`/explore?focus=${planet.name}`}
          className="group relative overflow-hidden inline-block border border-[#FAFAFA]/30 px-8 py-4 font-mono text-xs uppercase tracking-[0.2em] transition-colors duration-300 hover:border-[#FF4500] hover:text-[#09090B] self-start"
        >
          <span className="absolute inset-0 bg-[#FF4500] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.83,0,0.17,1)]" />
          <span className="relative">[ View {planet.name} live ]</span>
        </Link>

        {planet.moons && (
          <div className="flex items-baseline gap-4 flex-wrap font-mono text-[10px] uppercase tracking-[0.15em]">
            <span className="text-[#71717A]">Satellites</span>
            {planet.moons.map((moon) => (
              <Link
                key={moon.name}
                href={`/explore?focus=${moon.name}`}
                className="border border-[#27272A] px-3 py-1.5 text-[#A1A1AA] hover:text-[#FF4500] hover:border-[#FF4500] transition-colors duration-200"
              >
                {moon.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Prev / next */}
      <nav aria-label="Adjacent planets" className="grid grid-cols-2">
        <Link
          href={`/planets/${previous.name.toLowerCase()}`}
          className="group px-6 md:px-12 py-12 border-r border-[#27272A]/40 hover:bg-[#FAFAFA]/[0.03] transition-colors duration-200"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#71717A]">
            ← Previous
          </span>
          <span className="block mt-3 font-serif text-3xl md:text-4xl tracking-tight text-[#A1A1AA] group-hover:text-[#FF4500] transition-colors duration-200">
            {previous.name}
          </span>
        </Link>
        <Link
          href={`/planets/${next.name.toLowerCase()}`}
          className="group px-6 md:px-12 py-12 text-right hover:bg-[#FAFAFA]/[0.03] transition-colors duration-200"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#71717A]">
            Next →
          </span>
          <span className="block mt-3 font-serif text-3xl md:text-4xl tracking-tight text-[#A1A1AA] group-hover:text-[#FF4500] transition-colors duration-200">
            {next.name}
          </span>
        </Link>
      </nav>
    </main>
  );
}
