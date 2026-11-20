'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import s from './JupiterPage.module.css';

const views = [
  { key: 'cloud', button: 'Cloud tops', label: 'JunoCam · visible light', title: 'An oval with an uneven edge.', copy: 'This processed JunoCam image records reflected light. It shows the shape of the vortex and the billows surrounding it. A camera can track features across successive images, but a single photograph cannot tell us how far the circulation extends downward.' },
  { key: 'storm', button: 'Storm depth', label: 'Juno gravity study · 2021', title: 'Within the upper 500 km.', copy: 'As Juno passed over the vortex, a small change in its velocity registered in the radio signal received on Earth. Researchers modeled how a density anomaly beneath the storm could produce that signal. The resulting depth constraint is an inference, not a sharply defined floor.' },
  { key: 'jets', button: 'Deep jets', label: 'Juno global gravity · 2018', title: 'About 3,000 km for the jets.', copy: 'The planet-wide jets leave a different signature in Jupiter’s gravity field. Models that connect the measured gravity to the cloud-level winds put the strongest large-scale flows in roughly the outer 3,000 km. This does not mean the Great Red Spot reaches the same depth.' },
] as const;

export default function JupiterStorm() {
  const [storyView, setStoryView] = useState(0);
  const [manualView, setManualView] = useState<number | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const active = manualView ?? storyView;
  const view = views[active];
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const onProgress = (event: Event) => {
      const progress = (event as CustomEvent<number>).detail;
      setStoryView(progress < .42 ? 0 : progress < .75 ? 1 : 2);
    };
    const onPreference = () => { if (reduce.matches) setStoryView(0); };
    element.addEventListener('jupiter:progress', onProgress);
    reduce.addEventListener('change', onPreference);
    return () => {
      element.removeEventListener('jupiter:progress', onProgress);
      reduce.removeEventListener('change', onPreference);
    };
  }, []);

  return <div className={s.stormStudy} data-view={view.key} data-follow={manualView === null}>
    <div className={s.studyControls} role="group" aria-label="Storm observation view">
      {views.map((item, i) => <button type="button" aria-pressed={i === active} key={item.key} onClick={() => setManualView(i)}>{item.button}</button>)}
      <button className={s.followScroll} type="button" aria-disabled={manualView === null} onClick={() => setManualView(null)}>Follow scroll ↘</button>
    </div>
    <div ref={stage} className={s.stormStage} data-ju-cue="storm">
      <div className={s.depthPanel} aria-hidden={active === 0} role="img" aria-label="Common depth scale below the clouds: the storm is constrained to the upper 500 kilometers; the large-scale jets extend approximately 3,000 kilometers.">
        <div className={s.depthScale}><span>Cloud reference</span><span>500 km</span><span>1,500 km</span><span>3,000 km</span></div>
        <div className={s.depthField}>
          <div className={s.stormDepth}>Storm constraint</div>
          <div className={s.jetDepth}>Jet estimate</div>
          <span key={manualView === null ? 'scroll' : view.key} className={s.depthSweep}/>
        </div>
      </div>
      <div className={s.cloudPlane} aria-hidden={active !== 0}><Image src="/images/jupiter/red-spot.jpg" alt="Processed JunoCam image: the orange Great Red Spot at right, with pale turbulent clouds trailing to its left" fill sizes="(max-width:760px) 100vw, 86vw" /><span className={s.stormTarget} aria-hidden="true"><i/><i/><i/></span></div>
    </div>
    <div className={s.studyReadouts} aria-live={manualView === null ? 'off' : 'polite'}>{views.map((item, i) => <div key={item.key} className={s.studyReadout} aria-hidden={i !== active}><div><span>{item.label}</span><h3>{item.title}</h3></div><p>{item.copy}</p></div>)}</div>
    <p className={s.studyNote}>JunoCam image: NASA / JPL-Caltech / SwRI / MSSS; processing: Kevin M. Gill (CC BY). Depth intervals are shown on a common vertical scale; their shapes are illustrative.</p>
  </div>;
}
