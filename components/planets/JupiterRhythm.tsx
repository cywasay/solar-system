'use client';

import { useState, type CSSProperties } from 'react';
import s from './JupiterPage.module.css';

const tracks = [{name:'Io', orbits:4}, {name:'Europa', orbits:2}, {name:'Ganymede', orbits:1}];

export default function JupiterRhythm() {
  const [pass, setPass] = useState(0);
  const [playing, setPlaying] = useState(false);
  return <figure className={s.rhythm} data-ju-cue="rhythm">
    <figcaption><div><h3>Four. Two. One.</h3><p>Completed orbits in the same interval.</p></div><button type="button" onClick={() => { setPass(pass + 1); setPlaying(true); }}>Replay rhythm <span aria-hidden="true">↻</span></button></figcaption>
    <div key={pass} className={s.rhythmGrid} data-playing={playing}>
      {tracks.map(({name, orbits}) => <div className={s.rhythmRow} key={name}><span>{name} <b>{orbits}</b></span><div className={s.rhythmTrack} aria-hidden="true">{Array.from({length:orbits}, (_, i) => <i key={i} style={{'--beat':(i + 1)/orbits} as CSSProperties}/>)}</div></div>)}
      <div className={s.rhythmTime} aria-hidden="true"><i onAnimationEnd={() => setPlaying(false)}/></div>
    </div>
    <p className={s.studyNote}>The horizontal axis represents time. Dot spacing does not represent distance from Jupiter.</p>
  </figure>;
}
