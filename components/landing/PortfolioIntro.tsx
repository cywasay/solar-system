'use client';

import { useEffect, useRef } from 'react';
import { playIntroCopy } from './introCopy';
import { playIntroOrbit } from './introOrbit';
import styles from './PortfolioIntro.module.css';

const DESCRIPTION = 'I make interactive experiences for the web, working across design, motion, and code. I’m drawn to space because it makes me want to see things from another angle. Thessaris grew out of that feeling: I wanted a solar system I could move around in.';

let introPlayed = false;

export default function PortfolioIntro() {
  const sectionRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const typedRef = useRef<HTMLSpanElement>(null);
  const pendingRef = useRef<HTMLSpanElement>(null);
  const diagramRef = useRef<SVGSVGElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const tipRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const copy = copyRef.current;
    const title = titleRef.current;
    const word = wordRef.current;
    const typed = typedRef.current;
    const pending = pendingRef.current;
    const diagram = diagramRef.current;
    const trail = trailRef.current;
    const tip = tipRef.current;
    if (!section || !copy || !title || !word || !typed || !pending || !diagram || !trail || !tip || introPlayed) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches || new URLSearchParams(window.location.search).has('lite')) return;

    section.dataset.orbit = 'waiting';
    copy.dataset.reveal = 'waiting';
    let stopCopy: (() => void) | undefined;
    let stopOrbit: (() => void) | undefined;
    // On a phone, give the diagram below the heading time to enter the viewport.
    const triggerInset = Math.round(window.innerHeight * (window.innerWidth <= 760 ? 0.42 : 0.15));
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || introPlayed) return;
      observer.disconnect();
      introPlayed = true;
      if (reducedMotion.matches) {
        copy.dataset.reveal = 'complete';
        section.dataset.orbit = 'settled';
        return;
      }
      stopCopy = playIntroCopy(copy, typed, pending, DESCRIPTION, () => {
        if (reducedMotion.matches) {
          section.dataset.orbit = 'settled';
          return;
        }
        stopOrbit = playIntroOrbit(section, word, diagram, trail, tip);
      });
    }, { rootMargin: `0px 0px -${triggerInset}px 0px` });
    observer.observe(title);

    return () => {
      observer.disconnect();
      stopCopy?.();
      stopOrbit?.();
      delete section.dataset.orbit;
      delete copy.dataset.reveal;
    };
  }, []);

  return (
    <section ref={sectionRef} id="about" aria-labelledby="intro-title" className={styles.section}>
      <div className={styles.layout}>
        <div ref={copyRef} className={styles.copy}>
          <div ref={titleRef} className={styles.titleArea}>
            <h2 id="intro-title">I build things<br /><em>you can <span ref={wordRef} className={styles.word}>explore.</span></em></h2>
            <div className={styles.selection} aria-hidden="true">
              <svg className={styles.cursor} viewBox="0 0 20 24" fill="currentColor">
                <path d="M2 2v17l4.6-4.2L10 22l3-1.4-3.4-7.1 6.3-.2Z" stroke="var(--color-ink)" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <p className={styles.description}>
            <span className={styles.fullDescription}>{DESCRIPTION}</span>
            <span className={styles.typeLayer} aria-hidden="true">
              <span ref={typedRef} className={styles.typed} />
              <span ref={pendingRef} className={styles.pending}>{DESCRIPTION}</span>
            </span>
          </p>
        </div>

        <div className={styles.art} aria-hidden="true">
          <svg ref={diagramRef} viewBox="0 0 320 194" className={styles.diagram}>
            <g fill="none" stroke="currentColor" className={styles.guide}>
              <g className={styles.corners}>
                <path d="M20 26V16h10" />
                <path d="M290 16h10v10" />
                <path d="M20 168v10h10" />
                <path d="M290 178h10v-10" />
              </g>
              <path className={styles.horizontalAxis} d="M20 97h280" strokeDasharray="2 5" />
              <path className={styles.verticalAxis} d="M160 15v164" strokeDasharray="2 5" />
              <circle className={styles.innerCircle} cx="160" cy="97" r="38" />
              <circle
                className={styles.outerCircle}
                cx="160" cy="97" r="63" pathLength="1"
                transform="rotate(-90 160 97)"
              />
              <ellipse
                className={styles.tiltedRing}
                cx="160" cy="97" rx="127" ry="49" pathLength="1"
                transform="rotate(-22 160 97)"
              />
            </g>
            <g className={styles.restingOrbit}>
              <path
                d="M63 134C92 126 116 64 160 59s74 20 100 9"
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="1.3"
              />
              <circle cx="260" cy="68" r="4" fill="var(--color-accent)" />
            </g>
            <circle className={styles.dockNode} cx="63" cy="134" r="4" fill="var(--color-accent)" />
            <circle className={styles.waypoint} cx="160" cy="59" r="4" fill="var(--color-ink)" stroke="var(--color-accent)" />
            <circle className={styles.arrivalHalo} cx="260" cy="68" r="10" fill="none" stroke="var(--color-accent)" opacity=".45" />
          </svg>
        </div>
      </div>
      <svg className={styles.flight} aria-hidden="true">
        <path ref={trailRef} fill="none" stroke="var(--color-accent)" strokeLinecap="round" strokeLinejoin="round" />
        <circle ref={tipRef} r="3.5" fill="var(--color-accent)" />
      </svg>
    </section>
  );
}
