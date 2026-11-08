'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { planets } from '@/data/planets';
import styles from './SiteNav.module.css';
import { useOrbitEntrance } from './useOrbitEntrance';
import { venusDisplay } from '@/components/planets/planetFonts';

function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 19 19 5M5 5h14v14" />
    </svg>
  );
}

/** Route changes remount only the small navigation, dismissing its disclosure. */
export default function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [entryOrigin, setEntryOrigin] = useState<string | null>(null);
  const [entryFinished, setEntryFinished] = useState(false);
  const onBegin = useCallback((href: string) => {
    setEntryOrigin(pathname);
    setEntryFinished(false);
    router.prefetch(href);
  }, [pathname, router]);
  const onNavigate = useCallback((href: string) => router.push(href), [router]);
  const onComplete = useCallback(() => setEntryFinished(true), []);
  const onCancel = useCallback(() => { setEntryOrigin(null); setEntryFinished(false); }, []);
  const handedOff = entryFinished && pathname.startsWith('/explore');
  useEffect(() => {
    if (handedOff || (entryOrigin && pathname !== entryOrigin && !pathname.startsWith('/explore'))) onCancel();
  }, [handedOff, entryOrigin, pathname, onCancel]);
  // The simulation and admin already have dedicated navigation and controls.
  if (handedOff || (!entryOrigin && (pathname.startsWith('/explore') || pathname.startsWith('/admin') || pathname.startsWith('/lab')))) return null;
  // Preserve the original elements until the five-second choreography has ended,
  // even when the simulation route has already mounted underneath its cover.
  return <NavigationBar key={entryOrigin ?? pathname} pathname={entryOrigin ?? pathname}
    onBegin={onBegin} onNavigate={onNavigate} onComplete={onComplete} onCancel={onCancel} />;
}

interface NavigationBarProps {
  pathname: string;
  onBegin: (href: string) => void;
  onNavigate: (href: string) => void;
  onComplete: () => void;
  onCancel: () => void;
}

function NavigationBar({ pathname, onBegin, onNavigate, onComplete, onCancel }: NavigationBarProps) {
  const [planetsOpen, setPlanetsOpen] = useState(false);
  const [absorbing, setAbsorbing] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const exploreRef = useRef<HTMLAnchorElement>(null);
  const onPlanetPage = pathname.startsWith('/planets/');
  // Other planet identities opt in here as their pages are redesigned.
  const theme = pathname === '/planets/mercury' ? 'mercury' : pathname === '/planets/venus' ? 'venus' : pathname === '/planets/earth' ? 'earth' : undefined;
  const themeName = theme === 'earth' ? 'Earth' : theme === 'venus' ? 'Venus' : 'Mercury';
  const closePanel = useCallback(() => setPlanetsOpen(false), []);
  const { entering, overlay } = useOrbitEntrance({ rootRef, buttonRef: exploreRef, closePanel, onBegin, onNavigate, onComplete, onCancel });

  useLayoutEffect(() => {
    const root = rootRef.current;
    const explore = exploreRef.current;
    if (!root || !explore) return;

    const slots = Array.from(root.querySelectorAll<HTMLElement>('[data-absorb]'));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let lastProgress = -1;
    let inactive = false;

    // offset* ignores the transforms we are animating. Measurements happen only
    // when layout changes, never on scroll, and use the stable header as origin.
    const centerWithinHeader = (element: HTMLElement) => {
      let x = element.offsetWidth / 2;
      let y = element.offsetHeight / 2;
      let current: HTMLElement | null = element;
      while (current && current !== root) {
        x += current.offsetLeft;
        y += current.offsetTop;
        current = current.offsetParent as HTMLElement | null;
      }
      return { x, y };
    };

    const measure = () => {
      const target = centerWithinHeader(explore);
      root.style.setProperty('--sink-x', `${target.x}px`);
      root.style.setProperty('--sink-y', `${target.y}px`);
      root.style.setProperty('--panel-width', `${root.offsetWidth}px`);
      if (triggerRef.current) {
        const triggerCenter = centerWithinHeader(triggerRef.current);
        root.style.setProperty('--panel-offset', `${root.offsetWidth / 2 - triggerCenter.x}px`);
        root.style.setProperty('--panel-drop', `${root.offsetHeight - triggerCenter.y - triggerRef.current.offsetHeight / 2 + 12}px`);
      }
      for (const slot of slots) {
        const center = centerWithinHeader(slot);
        slot.style.setProperty('--travel-x', `${target.x - center.x}px`);
        slot.style.setProperty('--travel-y', `${target.y - center.y}px`);
      }
    };

    const update = () => {
      frame = 0;
      if (root.dataset.entering === 'true') return;
      const raw = theme ? 0 : Math.min(1, Math.max(0, (window.scrollY - 24) / 160));
      const progress = reducedMotion.matches ? (raw > 0.08 ? 1 : 0) : raw;
      if (progress === lastProgress || (progress > 0 && progress < 1 && Math.abs(progress - lastProgress) < 0.0001)) return;
      lastProgress = progress;
      root.style.setProperty('--collapse', progress.toFixed(4));
      root.dataset.compact = String(progress === 1);

      // A little hysteresis prevents tab targets flickering at the boundary.
      const nextInactive = inactive ? progress > 0.02 : progress > 0.08;
      if (inactive === nextInactive) return;
      inactive = nextInactive;
      if (inactive) {
        if (root.querySelector('[data-nav-content]:focus-within')) {
          explore.focus({ preventScroll: true });
        }
        setPlanetsOpen(false);
      }
      setAbsorbing(inactive);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    measure();
    update();
    const observer = new ResizeObserver(measure);
    for (const element of [root, explore, ...slots]) observer.observe(element);
    window.addEventListener('scroll', schedule, { passive: true });
    reducedMotion.addEventListener('change', schedule);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      reducedMotion.removeEventListener('change', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [theme]);

  useEffect(() => {
    if (!planetsOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setPlanetsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setPlanetsOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [planetsOpen]);

  return (<>
    <header
      className={`${styles.header} ${theme === 'venus' ? venusDisplay.variable : ''}`}
      ref={rootRef}
      data-theme={theme}
      data-absorbing={absorbing}
      aria-busy={entering}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPlanetsOpen(false);
      }}
    >
      <div className={styles.rule} aria-hidden="true" />
      <nav className={styles.bar} aria-label="Main navigation">
        <div className={`${styles.absorb} ${styles.brandSlot}`} data-absorb data-nav-content inert={absorbing || entering}>
          <Link href="/" className={styles.brand} aria-label="Thessaris home" onClick={() => setPlanetsOpen(false)}>
            <span className={styles.sealSlot} data-orbit-piece="emblem">
            {theme === 'earth' ? <svg className={styles.seal} viewBox="0 0 52 52" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="26" cy="26" r="20"/><ellipse cx="26" cy="26" rx="9" ry="20"/><path d="M6 26h40M10 14h32M10 38h32"/></svg> : theme === 'venus' ? <svg className={styles.seal} viewBox="0 0 52 52" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="26" cy="26" r="20"/><path d="M8 18c13-7 23 7 36 0M6 26c14-7 26 7 40 0M8 34c13-7 23 7 36 0"/></svg> : theme ? <svg className={styles.seal} viewBox="0 0 52 52" fill="none" aria-hidden="true"><circle cx="26" cy="26" r="19" stroke="currentColor" strokeWidth="1"/><path d="M26 7a19 19 0 0 0 0 38V7Z" fill="currentColor"/><path d="M26 0v5m0 42v5" stroke="currentColor"/></svg> : <svg className={styles.seal} viewBox="0 0 52 52" fill="none" aria-hidden="true">
              <circle cx="26" cy="26" r="17" stroke="currentColor" strokeWidth=".8" />
              <ellipse cx="26" cy="26" rx="25" ry="8" transform="rotate(-38 26 26)" stroke="currentColor" strokeWidth=".8" />
              <path d="M26 2v8m0 32v8M2 26h8m32 0h8" stroke="currentColor" strokeWidth=".6" />
              <circle cx="26" cy="26" r="3" fill="var(--color-accent-hover)" />
              <circle cx="39.4" cy="15.6" r="2" fill="currentColor" />
            </svg>}
            </span>
            <span className={styles.brandType} data-orbit-piece="wordmark">
              <span className={styles.wordmark}>Thessaris<span className={styles.brandDot}>.</span></span>
              <span className={styles.brandCaption}>{theme === 'earth' ? 'Earth / A living atlas' : theme === 'venus' ? 'Venus / Beauty under pressure' : theme ? 'Mercury / A world cut by light' : 'An independent observatory'}</span>
            </span>
          </Link>
        </div>

        <div className={styles.destinations} data-nav-content inert={absorbing || entering}>
          <div className={styles.absorb} data-absorb style={{ '--lag': 0.035 } as CSSProperties}>
            <Link href="/" className={styles.key} data-orbit-piece="home" aria-current={pathname === '/' ? 'page' : undefined} onClick={() => setPlanetsOpen(false)}>
              <span className={styles.navIndex} aria-hidden="true">01</span>
              <span className={styles.navText}>{theme ? 'Portfolio' : 'Home'}</span>
            </Link>
          </div>
          <div className={`${styles.absorb} ${styles.planetNavigation}`} data-absorb style={{ '--lag': 0.07 } as CSSProperties}>
            <button type="button" ref={triggerRef} className={styles.key} data-orbit-piece="planets"
              aria-expanded={planetsOpen} aria-controls="navbar-planets"
              data-active={onPlanetPage || undefined} onClick={() => setPlanetsOpen((open) => !open)}>
              <span className={styles.navIndex} aria-hidden="true">02</span>
              <span className={styles.navText}>{theme ? themeName : 'Planets'} <span className={styles.toggleGlyph} aria-hidden="true" /></span>
            </button>
            {planetsOpen && (
              <div className={styles.planetPanel} id="navbar-planets" data-lenis-prevent>
                <div className={styles.panelHeading}>
                  <span>The planetary atlas<span className={styles.panelDot}>.</span></span>
                  <span className={styles.panelEdition}>Our solar system<br />01 — 08</span>
                </div>
                <nav className={styles.planetGrid} aria-label="Planetary index">
                  {planets.map((planet, index) => {
                    const href = `/planets/${planet.name.toLowerCase()}`;
                    return (
                      <Link key={planet.name} href={href} className={styles.planetLink} onClick={() => setPlanetsOpen(false)}
                        aria-current={pathname === href ? 'page' : undefined}
                        style={{ '--planet-color': planet.fallbackColor } as CSSProperties}>
                        <span className={styles.planetOrdinal} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                        <span className={styles.planetSphere} aria-hidden="true" style={{ backgroundImage: `url(${planet.textureFile})` }} />
                        <span className={styles.planetText}>
                          <span>{planet.name}</span>
                          <span>{planet.facts.distance.replace(' from the Sun', '')}</span>
                        </span>
                        <Arrow className={styles.planetArrow} />
                      </Link>
                    );
                  })}
                </nav>
                <Link href="/explore" className={styles.panelExplore} onClick={() => setPlanetsOpen(false)}>
                  <span>See it all in motion</span><Arrow />
                </Link>
              </div>
            )}
          </div>
          <div className={styles.absorb} data-absorb style={{ '--lag': 0.105 } as CSSProperties}>
            <Link href="/contact" className={styles.key} data-orbit-piece="contact" aria-current={pathname === '/contact' ? 'page' : undefined} onClick={() => setPlanetsOpen(false)}>
              <span className={styles.navIndex} aria-hidden="true">03</span>
              <span className={styles.navText}>Contact</span>
            </Link>
          </div>
          {!theme && <div className={styles.absorb} data-absorb style={{ '--lag': 0.14 } as CSSProperties}>
            <Link href="/admin" className={`${styles.key} ${styles.adminKey}`} data-orbit-piece="admin" onClick={() => setPlanetsOpen(false)}>
              <span className={styles.navIndex} aria-hidden="true">04</span>
              <span className={styles.navText}>Admin</span>
            </Link>
          </div>}
        </div>

        <Link ref={exploreRef} href={theme ? `/explore?focus=${themeName}` : '/explore'} className={styles.exploreKey} aria-label={theme ? `Explore ${themeName}` : 'Explore'} onClick={() => setPlanetsOpen(false)}>
          <span className={styles.exploreLabel}>Explore</span>
          <span className={styles.exploreArrow}><Arrow /></span>
        </Link>
      </nav>
    </header>
    {overlay}
  </>);
}
