import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { planets } from '@/data/planets';
import MercuryPage from '@/components/planets/MercuryPage';
import VenusPage from '@/components/planets/VenusPage';
import EarthPage from '@/components/planets/EarthPage';
import MarsPage from '@/components/planets/MarsPage';
import JupiterPage from '@/components/planets/JupiterPage';
import SaturnPage from '@/components/planets/SaturnPage';
import UranusPage from '@/components/planets/UranusPage';
import NeptunePage from '@/components/planets/NeptunePage';

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
    description: slug === 'uranus' ? 'Travel sideways with Uranus along its 84-year orbit: a live tilted planet, its corkscrew magnetic field, a re-run of the 1977 ring discovery, Webb infrared, the revised heat budget and its moons.' : slug === 'neptune' ? 'Follow Neptune from mathematical prediction to observation, atmospheric storms, changing climate, and Triton through an interactive discovery sequence.' : slug === 'earth' ? 'Explore Earth as a connected system: an interactive seasonal atlas, ocean heat, plate tectonics, carbon cycling, tides, and the evidence behind planetary change.' : slug === 'mars' ? 'Explore Mars as a landscape that keeps evidence: an interactive rock cutaway, Valles Marineris, ancient water, atmospheric loss, buried ice, and its two moons.' : slug === 'jupiter' ? 'Explore Jupiter’s opposing cloud jets, Great Red Spot, deep interior, and Galilean moons through spacecraft imagery and an interactive depth comparison.' : slug === 'saturn' ? 'Follow Saturn through its ring plane, from an edge-on view and ring divisions to Titan, Enceladus, and Cassini’s final pass.' : planet.facts.description,
  };
}

export default async function PlanetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const index = planets.findIndex((p) => p.name.toLowerCase() === slug);
  if (index === -1) notFound();
  if (slug === 'mercury') return <MercuryPage />;
  if (slug === 'venus') return <VenusPage />;
  if (slug === 'earth') return <EarthPage />;
  if (slug === 'mars') return <MarsPage />;
  if (slug === 'jupiter') return <JupiterPage />;
  if (slug === 'saturn') return <SaturnPage />;

  if (slug === 'uranus') return <UranusPage />;
  if (slug === 'neptune') return <NeptunePage />;
  notFound();
}
