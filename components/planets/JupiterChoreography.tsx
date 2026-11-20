'use client';

import { useEffect, useRef, type ReactNode } from 'react';

const clamp = (value: number) => Math.max(0, Math.min(value, 1));
const smooth = (value: number) => {
  const progress = clamp(value);
  return progress * progress * (3 - 2 * progress);
};

export default function JupiterChoreography({ children, className }: { children: ReactNode; className: string }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const page = element;

    const masthead = document.querySelector<HTMLElement>('header[data-theme="jupiter"]');
    const chapters = page.querySelector<HTMLElement>('[data-ju-nav]');
    const links = Array.from(chapters?.querySelectorAll<HTMLAnchorElement>('a[href^="#"]') ?? []);
    const stops = links.map(link => document.getElementById(link.hash.slice(1)));
    const scenes = Array.from(page.querySelectorAll<HTMLElement>('[data-ju-cue]'));
    const moonPass = page.querySelector<HTMLElement>('[data-ju-cue="moon-pan"]');
    const moonPicture = moonPass?.querySelector<HTMLImageElement>('img');
    const moonWindow = moonPicture?.parentElement;
    const moonPlate = moonPass?.querySelector<HTMLElement>('figure');
    const closingIndex = scenes.findIndex(scene => scene.dataset.juCue === 'closing');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const wide = matchMedia('(min-width: 900px) and (min-height: 620px)');
    const lastProgress = new Map<Element, { progress: number; exit: number }>();
    let frame = 0;
    let activeStop = -2;

    function update() {
      frame = 0;
      const moving = !reduce.matches;
      const mastHeight = masthead?.offsetHeight ?? 0;
      const navHeight = wide.matches ? chapters?.offsetHeight ?? 0 : 0;
      const top = mastHeight + navHeight;
      const bottom = window.innerHeight;
      const space = Math.max(1, bottom - top);
      const pinTop = top + 16;
      const moonTravel = Math.max(1, (moonPass?.offsetHeight ?? 0) - (moonPlate?.offsetHeight ?? 0));
      const moonDistance = Math.max(0, (moonPicture?.offsetWidth ?? 0) - (moonWindow?.clientWidth ?? 0));
      const positions = stops.map(stop => stop?.getBoundingClientRect().top ?? Infinity);
      const geometry = scenes.map(scene => scene.getBoundingClientRect());
      let current = -1;
      for (let i = 0; i < positions.length; i++) {
        if (positions[i] <= top + space * .3) current = i;
      }
      if (current !== activeStop) {
        links.forEach((link, index) => {
          if (index === current) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
        activeStop = current;
      }

      page.style.setProperty('--ju-mast', `${mastHeight}px`);
      page.style.setProperty('--ju-top', `${top}px`);
      page.style.setProperty('--ju-pin', `${pinTop}px`);
      page.style.setProperty('--ju-moon-distance', `${moonDistance}px`);
      const closing = geometry[closingIndex];
      const storyStart = positions[0] ?? 0;
      const storyLength = Math.max(1, (closing?.top ?? storyStart) - storyStart);
      page.style.setProperty('--ju-story', String(clamp((top + space * .3 - storyStart) / storyLength)));
      if (!moving) return;

      scenes.forEach((scene, index) => {
        const bounds = geometry[index];
        const cue = scene.dataset.juCue;
        const start = top + space * .86;
        const end = top - Math.min(bounds.height, space) * .12;
        let progress = clamp((start - bounds.top) / (start - end));
        if (cue === 'title' || cue === 'hero-flow') {
          const lead = cue === 'hero-flow' ? bounds.height * .18 : 0;
          progress = clamp((top + lead - bounds.top) / Math.max(1, bounds.height));
        } else if (cue === 'moon-pan' && wide.matches) {
          progress = clamp((pinTop - bounds.top) / moonTravel);
        }
        const exit = Math.round(smooth((top + space * .32 - bounds.bottom) / (space * .32)) * 1000) / 1000;
        const quantized = Math.round(progress * 1000) / 1000;
        const previous = lastProgress.get(scene);
        if (previous?.progress === quantized && previous.exit === exit) return;
        scene.style.setProperty('--ju-progress', String(quantized));
        scene.style.setProperty('--ju-enter', String(smooth((quantized - .02) / .48)));
        scene.style.setProperty('--ju-exit', String(exit));
        lastProgress.set(scene, { progress: quantized, exit });
        if (previous?.progress !== quantized && (cue === 'flow' || cue === 'storm')) {
          scene.dispatchEvent(new CustomEvent<number>('jupiter:progress', { detail: quantized }));
        }
      });
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    function syncPreference() {
      if (reduce.matches) delete page.dataset.juScroll;
      else page.dataset.juScroll = 'true';
      lastProgress.clear();
      schedule();
    }

    const resize = new ResizeObserver(schedule);
    resize.observe(page);
    if (masthead) resize.observe(masthead);
    if (moonWindow) resize.observe(moonWindow);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    reduce.addEventListener('change', syncPreference);
    syncPreference();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      reduce.removeEventListener('change', syncPreference);
      delete page.dataset.juScroll;
    };
  }, []);

  return <main ref={root} className={className}>{children}</main>;
}
