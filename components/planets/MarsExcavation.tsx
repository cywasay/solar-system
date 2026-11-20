'use client';
import { useState, type CSSProperties } from 'react';
import s from './MarsPage.module.css';
const materials=[
 {name:'Wind-blown cover',title:'The surface is the latest edit.',text:'Dust and sand move across older rocks. Their distribution can describe recent wind transport rather than the origin of the ground beneath. An abrasion removes some of that cover; erosion can expose entire outcrops.',color:'#b76447'},
 {name:'Sedimentary beds',title:'Geometry gives the deposit a context.',text:'The orientation and arrangement of beds help reconstruct deposition. Inclined layers alone do not identify a lake: dunes also build inclined beds. Grains, neighboring units, and mineral evidence narrow the interpretation.',color:'#d8b38b'},
 {name:'Fractured rock',title:'A rock can record more than its formation.',text:'An igneous rock can preserve cooling from melt and later alteration by fluids. Fractures provide routes for those fluids. Mineral changes may therefore describe an event younger than the rock itself.',color:'#715148'}
];
export default function MarsExcavation(){const [opening,setOpening]=useState(32);const [selected,setSelected]=useState(1);return <div className={s.excavationStudy}>
 <div className={s.cutaway} data-cue style={{'--opening':opening/100} as CSSProperties}>
 <svg viewBox="0 0 960 640" role="img" aria-label={`Conceptual strata separated ${opening} percent. Selected material: ${materials[selected].name}. Geometry is illustrative, not measured.`}>
 <g className={s.cutAssembly}>{[2,1,0].map(i=><g key={i} className={s.cutLayer} style={{transform:`translateY(${(i-1)*opening*.85}px)`,opacity:selected===i?1:.55}}>
 <path d={`M85 ${220+i*76}L340 ${100+i*76}L855 ${195+i*76}L605 ${330+i*76}Z`} fill={materials[i].color}/>
 <path d={`M85 ${220+i*76}L605 ${330+i*76}V${380+i*76}L85 ${270+i*76}Z`} fill={materials[i].color}/>
 <path d={`M605 ${330+i*76}L855 ${195+i*76}V${245+i*76}L605 ${380+i*76}Z`} fill="#201713" opacity=".85"/>
 <path d={`M85 ${240+i*76}L605 ${350+i*76}M85 ${256+i*76}L605 ${366+i*76}`} fill="none" stroke="#201713" opacity=".4"/>
 <path d={`M340 ${100+i*76}L405 ${170+i*76}L370 ${213+i*76}L495 ${250+i*76}L470 ${302+i*76}`} fill="none" stroke="#201713" strokeWidth="3" opacity=".5"/>
 </g>)}</g></svg>
 <div className={s.openControl}><label htmlFor="mars-open">Open the rock section</label><input id="mars-open" type="range" min="0" max="100" value={opening} onChange={e=>setOpening(Number(e.target.value))}/><button onClick={()=>setOpening(opening===0?100:0)}>{opening===0?'Separate':'Reassemble'} <span aria-hidden="true">↕</span></button></div>
 </div>
 <div className={s.materials}><div className={s.materialChoices} role="group" aria-label="Select material">{materials.map((m,i)=><button key={m.name} aria-pressed={selected===i} onClick={()=>{setSelected(i);setOpening(100);}}><span style={{background:m.color}} aria-hidden="true"/>{m.name}<b aria-hidden="true">↗</b></button>)}</div><div className={s.materialText} aria-live="polite"><h3>{materials[selected].title}</h3><p>{materials[selected].text}</p></div><p className={s.small}>Illustrative geology, not a surveyed section. Colors, layer thicknesses, and separation are conceptual.</p></div>
 </div>;}
