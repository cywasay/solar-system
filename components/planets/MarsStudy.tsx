'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './MarsPage.module.css';

const layers = [
  {name:'Surface cover',title:'The youngest material can hide the oldest story.',text:'Wind redistributes sand and dust across exposed rock. A surface texture may describe recent transport rather than the process that formed the rock underneath. Removing that cover—by erosion or a rover’s abrasion tool—can reveal a different record.',color:'#b96c4f'},
  {name:'Sedimentary beds',title:'A layer is a deposit. Its geometry is evidence.',text:'Grain size, bedding direction, and the contacts between units help distinguish environments. Inclined beds can record a migrating dune or a growing delta: the surrounding geology and mineral measurements are needed to decide between them.',color:'#d7ad83'},
  {name:'Fractured foundation',title:'The foundation can preserve more than one event.',text:'Igneous rock records cooling from molten material. Later fractures can carry fluids that alter its minerals. A rock can therefore preserve both a volcanic origin and a younger history of water moving through it.',color:'#785044'},
];

export default function MarsStudy(){
  const [active,setActive]=useState(1);
  const [open,setOpen]=useState(false);
  const drawing=useRef<HTMLDivElement>(null);
  useEffect(()=>{const el=drawing.current;if(!el)return;const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){el.dataset.arrived='true';observer.disconnect();}},{threshold:.6});observer.observe(el);return()=>observer.disconnect();},[]);
  return <div className={styles.study}>
    <div className={styles.studyDrawing} ref={drawing} data-open={open}>
      <svg viewBox="0 0 900 510" role="img" aria-label={`Illustrative geological cutaway, ${open?'layers separated':'layers assembled'}. Selected: ${layers[active].name}. Not measured terrain.`}>
        <g className={styles.strata}>
          {layers.map((layer,index)=><g key={layer.name} className={styles.stratum} style={{transform:`translateY(${open?(index-1)*65:0}px)`,opacity:active===index?1:.48}}>
            <path d={`M90 ${175+index*74} L345 ${70+index*74} L800 ${150+index*74} L550 ${270+index*74}Z`} fill={layer.color}/>
            <path d={`M90 ${175+index*74} L550 ${270+index*74} L550 ${320+index*74} L90 ${225+index*74}Z`} fill={layer.color} style={{filter:'brightness(.72)'}}/>
            <path d={`M550 ${270+index*74} L800 ${150+index*74} L800 ${200+index*74} L550 ${320+index*74}Z`} fill={layer.color} style={{filter:'brightness(.5)'}}/>
            <path d={`M120 ${189+index*74} L550 ${280+index*74} L780 ${168+index*74}M120 ${206+index*74} L550 ${298+index*74} L780 ${185+index*74}`} fill="none" stroke="#241815" strokeOpacity=".35"/>
          </g>)}
        </g>
      </svg>
      <button className={styles.separate} aria-pressed={open} onClick={()=>setOpen(!open)}>{open?'Reassemble the strata':'Separate the strata'} <span aria-hidden="true">{open?'↥':'↧'}</span></button>
    </div>
    <div className={styles.studyReading}>
      <div role="group" aria-label="Geological layer" className={styles.layerButtons}>{layers.map((layer,index)=><button key={layer.name} aria-pressed={active===index} onClick={()=>{setActive(index);setOpen(true);}}>{layer.name}</button>)}</div>
      <div className={styles.layerCopy} aria-live="polite"><h3>{layers[active].title}</h3><p>{layers[active].text}</p></div>
      <p className={styles.note}>Conceptual cutaway, not a measured section of Jezero or Valles Marineris. Layer thicknesses, colors, and spacing are illustrative.</p>
    </div>
  </div>;
}
