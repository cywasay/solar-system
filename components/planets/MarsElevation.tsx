'use client';

import { useId, useState } from 'react';
import styles from './MarsPage.module.css';

interface ProfilePoint {
  distKm: number;
  elevKm: number;
  label: string;
  detail: string;
}

interface ProfileDataset {
  id: string;
  title: string;
  subtitle: string;
  spanKm: number;
  minElev: number;
  maxElev: number;
  description: string;
  evidence: string;
  points: ProfilePoint[];
}

const profiles: ProfileDataset[] = [
  {
    id: 'valles-marineris',
    title: 'Valles Marineris chasm system',
    subtitle: '4,000 km tectonic rift · up to 7.2 km deep',
    spanKm: 4000,
    minElev: -8,
    maxElev: 5,
    description:
      'Valles Marineris cuts a canyon system across nearly a fifth of Mars’s circumference. Unlike Earth’s Grand Canyon, which was carved primarily by river erosion, this chasm originated as a massive tectonic rift when the neighbouring Tharsis volcanic plateau arched the crust upward.',
    evidence:
      'MOLA topographic data and MRO high-resolution imaging reveal exposed rock strata thousands of metres thick in the canyon walls, recording billions of years of volcanic layering, fault slips, and later catastrophic landslides.',
    points: [
      { distKm: 0, elevKm: 4.1, label: 'Tharsis rise plateau', detail: 'Elevated volcanic plateau flanking the western start of the canyon.' },
      { distKm: 650, elevKm: 1.8, label: 'Noctis Labyrinthus', detail: 'Complex network of intersecting graben fractures and fault valleys.' },
      { distKm: 1450, elevKm: -3.4, label: 'Candor Chasma', detail: 'Towering layered interior deposits rich in hydrated sulfate minerals.' },
      { distKm: 2150, elevKm: -7.2, label: 'Melas Chasma floor', detail: 'Deepest floor of the central rift, dropping more than 7 km below the datum.' },
      { distKm: 3100, elevKm: -4.1, label: 'Coprates Chasma', detail: 'Sheer linear fault scarps and immense landslide debris aprons.' },
      { distKm: 4000, elevKm: -1.5, label: 'Eos Chasma outflow', detail: 'Transitions into chaotic terrain and ancient outflow channels draining into Chryse Planitia.' },
    ],
  },
  {
    id: 'olympus-mons',
    title: 'Olympus Mons shield volcano',
    subtitle: '21.9 km summit · 600 km basal diameter',
    spanKm: 600,
    minElev: -4,
    maxElev: 22,
    description:
      'The largest known planetary volcano. Olympus Mons dwarfs Earth’s Mauna Kea (10.2 km from ocean floor) and Mount Everest (8.8 km above sea level). It accumulated as an immense shield of low-viscosity basaltic lava over hundreds of millions of years.',
    evidence:
      'Because Mars lacks moving tectonic plates, the crust remained stationary over a localized mantle plume (hotspot). Instead of forming a chain of smaller volcanoes like Hawaii, basalt continued piling up in a single location for epochs.',
    points: [
      { distKm: 0, elevKm: -3.5, label: 'Northern plains datum', detail: 'Smooth lowlands surrounding the volcanic aureole.' },
      { distKm: 45, elevKm: 2.8, label: 'Basal scarp cliff', detail: 'A near-vertical cliff up to 6–8 km high surrounding the base of the volcano.' },
      { distKm: 180, elevKm: 9.6, label: 'Lower shield flank', detail: 'Broad, gentle slopes (averaging only ~5°) paved with countless lava flows.' },
      { distKm: 270, elevKm: 16.8, label: 'Upper shield flank', detail: 'Thin atmosphere (< 1 mbar) allows rapid lava cooling and narrow levees.' },
      { distKm: 300, elevKm: 21.9, label: 'Caldera summit rim', detail: 'Peak elevation: 21.9 km above Mars MOLA topographic datum.' },
      { distKm: 335, elevKm: 18.5, label: 'Nested caldera floor', detail: 'An 80 × 60 km depression created by six distinct collapsed magma chambers.' },
      { distKm: 550, elevKm: 3.1, label: 'Eastern basal scarp', detail: 'Symmetric outer cliff dropping abruptly back toward the Tharsis plains.' },
      { distKm: 600, elevKm: -2.8, label: 'Tharsis plain boundary', detail: 'Surrounding volcanic plains affected by regional crustal loading.' },
    ],
  },
  {
    id: 'jezero-delta',
    title: 'Jezero crater river delta',
    subtitle: '45 km impact basin · Perseverance exploration site',
    spanKm: 45,
    minElev: -3,
    maxElev: 1,
    description:
      'Around 3.7 billion years ago during the Noachian–Hesperian transition, an active river (Neretva Vallis) breached the rim of Jezero Crater, emptying into an open-basin paleolake and depositing a prominent fan-shaped sedimentary delta.',
    evidence:
      'NASA’s Perseverance rover has abraded and cored sedimentary rock layers here, confirming river-deposited sandstones, conglomerates, and lacustrine mudstones rich in clays and carbonates that can preserve biosignatures.',
    points: [
      { distKm: 0, elevKm: 0.8, label: 'Western crater rim', detail: 'Ancient Noachian basement rock fractured by the initial basin-forming impact.' },
      { distKm: 9, elevKm: -1.7, label: 'Neretva Vallis breach', detail: 'Inflow channel where energetic floodwaters breached the crater wall.' },
      { distKm: 18, elevKm: -2.3, label: 'Delta top distributaries', detail: 'Network of meandering channels that spread sediment across the lake margin.' },
      { distKm: 24, elevKm: -2.5, label: 'Delta front scarp (Kodiak)', detail: 'Prominent 70 m layered cliffs recording bottomset, foreset, and topset beds.' },
      { distKm: 33, elevKm: -2.65, label: 'Crater floor lakebed', detail: 'Fine-grained mudstones deposited in deep, still water, later covered by volcanic caprock.' },
      { distKm: 45, elevKm: 0.4, label: 'Eastern crater floor', detail: 'Gradual rise toward the degraded eastern rim of the impact basin.' },
    ],
  },
];

export default function MarsElevation() {
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  const [selectedPointIndex, setSelectedPointIndex] = useState(0);
  const sliderId = useId();

  const current = profiles[selectedProfileIndex];
  const activePoint = current.points[selectedPointIndex] ?? current.points[0];

  // SVG dimensions
  const width = 840;
  const height = 280;
  const paddingX = 54;
  const paddingY = 40;

  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  const elevRange = current.maxElev - current.minElev;

  const toSvgX = (dist: number) => paddingX + (dist / current.spanKm) * innerWidth;
  const toSvgY = (elev: number) => paddingY + ((current.maxElev - elev) / elevRange) * innerHeight;

  // Build SVG path
  const pathD = current.points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${toSvgX(p.distKm).toFixed(1)} ${toSvgY(p.elevKm).toFixed(1)}`)
    .join(' ');

  // Fill area under the profile
  const baselineY = toSvgY(current.minElev);
  const areaD = `${pathD} L ${toSvgX(current.points[current.points.length - 1].distKm).toFixed(1)} ${baselineY.toFixed(1)} L ${toSvgX(current.points[0].distKm).toFixed(1)} ${baselineY.toFixed(1)} Z`;

  // Zero datum line (0 km MOLA)
  const zeroDatumY = toSvgY(0);

  return (
    <div className={styles.elevationModule}>
      <div className={styles.elevationNav} role="tablist" aria-label="Select topographic feature">
        {profiles.map((p, idx) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={selectedProfileIndex === idx}
            className={styles.elevationTab}
            onClick={() => {
              setSelectedProfileIndex(idx);
              setSelectedPointIndex(0);
            }}
          >
            <span>{p.title}</span>
            <small>{p.subtitle}</small>
          </button>
        ))}
      </div>

      <div className={styles.elevationDisplay}>
        <div className={styles.chartWrapper}>
          <svg viewBox={`0 0 ${width} ${height}`} className={styles.elevationSvg} role="img" aria-label={`Elevation profile of ${current.title}`}>
            <defs>
              <linearGradient id="mars-strata-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#BB6247" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#785044" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#241815" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1={paddingX} y1={zeroDatumY} x2={width - paddingX} y2={zeroDatumY} stroke="#BB6247" strokeWidth="1" strokeDasharray="3 4" strokeOpacity="0.45" />
            <text x={paddingX + 6} y={zeroDatumY - 6} fill="#E7D3B8" fontSize="10" opacity="0.6" fontFamily="var(--font-mono)">
              0 km MOLA datum
            </text>

            {/* Profile Area and Line */}
            <path d={areaD} fill="url(#mars-strata-grad)" />
            <path d={pathD} fill="none" stroke="#E7D3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Waypoint markers */}
            {current.points.map((point, idx) => {
              const cx = toSvgX(point.distKm);
              const cy = toSvgY(point.elevKm);
              const isSelected = selectedPointIndex === idx;
              return (
                <g key={point.label} className={styles.svgPoint} onClick={() => setSelectedPointIndex(idx)}>
                  <circle cx={cx} cy={cy} r={isSelected ? 6.5 : 4} fill={isSelected ? '#BB6247' : '#E7D3B8'} stroke="#241815" strokeWidth="2" />
                  {isSelected && (
                    <circle cx={cx} cy={cy} r={11} fill="none" stroke="#BB6247" strokeWidth="1.5" strokeDasharray="2 2" />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Scrubbing slider & point selector */}
        <div className={styles.elevationScrubber}>
          <label htmlFor={sliderId} className={styles.scrubberLabel}>
            Trace elevation across transect (0 to {current.spanKm.toLocaleString()} km):
          </label>
          <input
            id={sliderId}
            type="range"
            min={0}
            max={current.points.length - 1}
            value={selectedPointIndex}
            onChange={(e) => setSelectedPointIndex(Number(e.target.value))}
            className={styles.rangeInput}
            aria-label="Transect waypoint slider"
          />
        </div>

        {/* Readout of current waypoint */}
        <div className={styles.waypointCard} aria-live="polite">
          <div className={styles.waypointHeader}>
            <span className={styles.waypointTag}>Waypoint {selectedPointIndex + 1} of {current.points.length}</span>
            <div className={styles.waypointMetrics}>
              <span><strong>{activePoint.distKm}</strong> km along path</span>
              <span><strong>{activePoint.elevKm > 0 ? `+${activePoint.elevKm}` : activePoint.elevKm}</strong> km elevation</span>
            </div>
          </div>
          <h4>{activePoint.label}</h4>
          <p>{activePoint.detail}</p>
        </div>

        <div className={styles.elevationNotes}>
          <p>{current.description}</p>
          <p className={styles.evidenceNote}><strong>Geological evidence:</strong> {current.evidence}</p>
          <small className={styles.datumNotice}>
            Data referenced to Mars Global Surveyor MOLA elevation model. Vertical relief exaggerated ~10× for diagrammatic readability.
          </small>
        </div>
      </div>
    </div>
  );
}

