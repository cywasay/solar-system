'use client';

import { useState, type CSSProperties } from 'react';
import Image from 'next/image';
import styles from './EarthPage.module.css';

const regions = [
  { name: 'Whole Earth', origin: '50% 50%', scale: 1 },
  { name: 'North Atlantic', origin: '29% 2%', scale: 2.1 },
  { name: 'South Asia', origin: '92% 21%', scale: 2.1 },
];

export default function EarthAtlas() {
  const [mode, setMode] = useState<'seasons' | 'night'>('seasons');
  const [july, setJuly] = useState(50);
  const [region, setRegion] = useState(0);
  const current = regions[region];
  return <div className={styles.atlas}>
    <div className={styles.atlasToolbar}>
      <div role="group" aria-label="Observation dataset" className={styles.datasetSwitch}>
        <button aria-pressed={mode === 'seasons'} onClick={() => setMode('seasons')}>Seasonal surface</button>
        <button aria-pressed={mode === 'night'} onClick={() => setMode('night')}>Night lights</button>
      </div>
      <div className={styles.regionLabel}><label htmlFor="earth-region">View</label><select id="earth-region" value={region} onChange={event => setRegion(Number(event.target.value))}>{regions.map((item,index) => <option value={index} key={item.name}>{item.name}</option>)}</select></div>
    </div>
    <div className={styles.mapWindow} style={{'--crop-origin':current.origin,'--crop-scale':current.scale} as CSSProperties} role="img" aria-label={mode === 'seasons' ? `${current.name}: January and July 2004 surface composites; July revealed across ${july}% of the map` : `${current.name}: 2016 satellite night-light composite`}>
      <div className={styles.mapCrop}>
        <Image src="/images/earth/january-2004.jpg" fill sizes="(max-width:760px) 190vw, 170vw" alt="" />
      </div>
      <div className={styles.julyLayer} style={{clipPath:`inset(0 ${100-july}% 0 0)`}}><div className={styles.mapCrop}><Image src="/images/earth/july-2004.jpg" fill sizes="(max-width:760px) 190vw, 170vw" alt="" /></div></div>
      <div className={styles.nightLayer} data-active={mode === 'night'}><div className={styles.mapCrop}><Image src="/images/earth/night-2016.png" fill sizes="(max-width:760px) 190vw, 170vw" alt="" /></div></div>
      <div className={styles.graticule} aria-hidden="true"/>
      {mode === 'seasons' && <div className={styles.mapKey}>{july > 0 && <span>July 2004</span>}{july < 100 && <span style={{marginLeft:'auto'}}>January 2004</span>}</div>}
      {mode === 'night' && <div className={styles.mapKey}><span>Black Marble · 2016</span><span>Suomi NPP / VIIRS</span></div>}
    </div>
    <div className={styles.atlasControls}>
      {mode === 'seasons' ? <><label htmlFor="earth-season">Reveal July</label><input id="earth-season" type="range" min="0" max="100" value={july} onChange={event => setJuly(Number(event.target.value))} style={{'--position':`${july}%`} as CSSProperties}/><output htmlFor="earth-season">{july}%</output></> : <p>Night-light brightness is not a direct measure of population or wealth.</p>}
    </div>
    <div className={styles.atlasCaption} aria-live="polite">
      <h3>{mode === 'seasons' ? 'A season is a pattern across a planet.' : 'Human activity leaves an optical signature.'}</h3>
      <div><p>{mode === 'seasons' ? 'Move the divider and watch northern snow cover and vegetation change between January and July. These NASA Blue Marble images combine many observations into monthly, cloud-screened mosaics. They show surface seasonality, not the weather at a single moment.' : 'The VIIRS instrument detects faint nighttime light. This processed 2016 composite makes settled corridors and coastlines legible, but lighting practices, energy access, fires, and industrial activity complicate interpretation. A dark area is not necessarily uninhabited.'}</p><p className={styles.note}>{mode === 'seasons' ? 'NASA Earth Observatory · Blue Marble Next Generation, 2004. Source maps: 5,400 × 2,700 pixels; displayed through responsive image derivatives. Persistent cloud and polar darkness can limit retrievals.' : 'NASA/GSFC · Black Marble 2016, processed by Joshua Stevens with Miguel Román. The source graphic’s footer is cropped; attribution is retained here. The 2004 surface and 2016 light maps are not simultaneous observations.'}</p><a href={mode === 'seasons' ? 'https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/' : 'https://svs.gsfc.nasa.gov/30876/'} target="_blank" rel="noreferrer">Dataset & processing notes ↗</a></div>
    </div>
  </div>;
}
