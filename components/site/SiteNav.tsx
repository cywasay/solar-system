'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { planets } from '@/data/planets';
import styles from './SiteNav.module.css';
import { useOrbitEntrance } from './useOrbitEntrance';

function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 19 19 5M5 5h14v14" />
    </svg>
  );
}

/** The header is one design on every page: only its palette changes with the planet. */
type Theme = 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune';
const THEMES: Record<Theme, { name: string; caption: string }> = {
  mercury: { name: 'Mercury', caption: 'A world cut by light' },
  venus: { name: 'Venus', caption: 'Seen only by radar' },
  earth: { name: 'Earth', caption: 'You are here' },
  mars: { name: 'Mars', caption: 'From orbit to grain' },
  jupiter: { name: 'Jupiter', caption: 'Stir the weather' },
  saturn: { name: 'Saturn', caption: 'Moons sculpt the rings' },
  uranus: { name: 'Uranus', caption: 'The planet on its side' },
  neptune: { name: 'Neptune', caption: 'One pass' },
};
const themeFor = (pathname: string): Theme | undefined => {
  const slug = pathname.startsWith('/planets/') ? pathname.slice('/planets/'.length).split('/')[0] : '';
  return slug in THEMES ? (slug as Theme) : undefined;
};

/**
 * The ruler: every planet on one line, placed by its real distance from the Sun on a log scale
 * (0.3 AU to 32 AU). It is also the planet navigation.
 */
const RULER_MIN = Math.log10(0.3);
const RULER_SPAN = Math.log10(32) - RULER_MIN;
const rulerX = (au: number) => (Math.log10(au) - RULER_MIN) / RULER_SPAN;
const RULER = planets.map((planet) => ({ planet, au: parseFloat(planet.facts.distance), href: `/planets/${planet.name.toLowerCase()}` }));
const TICKS = [{ au: 1, label: '1 AU' }, { au: 10, label: '10 AU' }];

/** Route changes remount only the small navigation. */
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
    if (!handedOff && !(entryOrigin && pathname !== entryOrigin && !pathname.startsWith('/explore'))) return;
    // Release the retained masthead after the destination has painted.
    const frame = requestAnimationFrame(onCancel);
    return () => cancelAnimationFrame(frame);
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

const noop = () => {};

function NavigationBar({ pathname, onBegin, onNavigate, onComplete, onCancel }: NavigationBarProps) {
  const [absorbing, setAbsorbing] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const exploreRef = useRef<HTMLAnchorElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const theme = themeFor(pathname);
  const themeInfo = theme ? THEMES[theme] : undefined;
  const { entering, overlay } = useOrbitEntrance({ rootRef, buttonRef: exploreRef, closePanel: noop, onBegin, onNavigate, onComplete, onCancel });

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
      for (const slot of slots) {
        const center = centerWithinHeader(slot);
        slot.style.setProperty('--travel-x', `${target.x - center.x}px`);
        slot.style.setProperty('--travel-y', `${target.y - center.y}px`);
      }
    };

    const update = () => {
      frame = 0;
      if (root.dataset.entering === 'true') return;
      // Only the landing page's header folds into the Explore disc as you scroll.
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
      if (inactive && root.querySelector('[data-nav-content]:focus-within')) explore.focus({ preventScroll: true });
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

  // The ruler magnifies around the pointer, dock-style. Only transforms and an opacity change.
  useEffect(() => {
    const ruler = rulerRef.current;
    if (!ruler || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let frame = 0;
    let pointerX = 0;
    const apply = (reset: boolean) => {
      frame = 0;
      const centers = itemRefs.current.map((item) => {
        if (!item) return Infinity;
        const rect = item.getBoundingClientRect();
        return rect.left + rect.width / 2;
      });
      let hot = -1;
      let hotDistance = Infinity;
      centers.forEach((center, index) => {
        const distance = Math.abs(pointerX - center);
        if (distance < hotDistance) { hotDistance = distance; hot = index; }
      });
      const engaged = !reset && hot >= 0 && hotDistance < 34;
      itemRefs.current.forEach((item, index) => {
        if (!item) return;
        const distance = Math.abs(pointerX - centers[index]);
        item.style.setProperty('--near', reset ? '0' : Math.exp(-((distance / 46) ** 2)).toFixed(3));
        item.toggleAttribute('data-hot', engaged && index === hot);
      });
      ruler.toggleAttribute('data-hot', engaged);
    };
    const onMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      if (!frame) frame = requestAnimationFrame(() => apply(false));
    };
    const onLeave = () => {
      if (frame) cancelAnimationFrame(frame);
      apply(true);
    };
    ruler.addEventListener('pointermove', onMove);
    ruler.addEventListener('pointerleave', onLeave);
    return () => {
      ruler.removeEventListener('pointermove', onMove);
      ruler.removeEventListener('pointerleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (<>
    <header
      className={styles.header}
      ref={rootRef}
      data-theme={theme}
      data-absorbing={absorbing}
      aria-busy={entering}
    >
      <div className={styles.rule} aria-hidden="true" />
      <nav className={styles.bar} aria-label="Main navigation">
        <div className={`${styles.absorb} ${styles.brandSlot}`} data-absorb data-nav-content inert={absorbing || entering}>
          <Link href="/" className={styles.brand} aria-label="Thessaris home">
            <span className={styles.sealSlot} data-orbit-piece="emblem">
              <svg className={styles.seal} viewBox="0 0 52 52" fill="none" aria-hidden="true">
                <circle cx="26" cy="26" r="17" stroke="currentColor" strokeWidth=".9" />
                <ellipse cx="26" cy="26" rx="25" ry="8" transform="rotate(-38 26 26)" stroke="currentColor" strokeWidth=".9" />
                <path d="M26 2v8m0 32v8M2 26h8m32 0h8" stroke="currentColor" strokeWidth=".6" />
                <circle cx="26" cy="26" r="3" fill="var(--nav-accent)" />
                <circle cx="39.4" cy="15.6" r="2" fill="currentColor" />
              </svg>
            </span>
            <span className={styles.brandType} data-orbit-piece="wordmark">
              <span className={styles.wordmark}>Thessaris<span className={styles.brandDot}>.</span></span>
              <span className={styles.brandCaption}>{themeInfo ? `${themeInfo.name} / ${themeInfo.caption}` : 'An independent observatory'}</span>
            </span>
          </Link>
        </div>

        <div className={styles.destinations} data-nav-content inert={absorbing || entering}>
          <div className={`${styles.absorb} ${styles.homeSlot}`} data-absorb style={{ '--lag': 0.035 } as CSSProperties}>
            <Link href="/" className={styles.key} data-orbit-piece="home" aria-current={pathname === '/' ? 'page' : undefined}>
              <span className={styles.navText}>{theme ? 'Portfolio' : 'Home'}</span>
            </Link>
          </div>

          <div className={`${styles.absorb} ${styles.rulerSlot}`} data-absorb style={{ '--lag': 0.07 } as CSSProperties}>
            <div ref={rulerRef} className={styles.ruler} data-has-current={theme ? true : undefined}>
              <nav aria-label="Planets, placed by distance from the Sun">
                <span className={styles.rulerTrack} aria-hidden="true" />
                <span className={styles.rulerSun} aria-hidden="true" />
                {TICKS.map((tick) => (
                  <span key={tick.label} className={styles.rulerTick} aria-hidden="true" style={{ '--x': rulerX(tick.au) } as CSSProperties}>{tick.label}</span>
                ))}
                <ol className={styles.rulerList}>
                  {RULER.map(({ planet, au, href }, index) => (
                    <li
                      key={planet.name}
                      ref={(node) => { itemRefs.current[index] = node; }}
                      className={styles.rulerItem}
                      style={{ '--x': rulerX(au), '--planet': planet.fallbackColor } as CSSProperties}
                    >
                      <Link href={href} className={styles.rulerLink} aria-current={pathname === href ? 'page' : undefined} aria-label={`${planet.name}, ${planet.facts.distance}`}>
                        <span className={styles.sphere} data-orbit-piece={`planet-${planet.name.toLowerCase()}`} style={{ backgroundImage: `url(${planet.textureFile})` }} />
                        <span className={styles.rulerName}>{planet.name} <i>{planet.facts.distance.replace(' from the Sun', '')}</i></span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </nav>
              <span className={styles.rulerHint} aria-hidden="true">Eight worlds · log scale</span>
            </div>
          </div>

          <div className={styles.absorb} data-absorb style={{ '--lag': 0.105 } as CSSProperties}>
            <Link href="/contact" className={styles.key} data-orbit-piece="contact" aria-current={pathname === '/contact' ? 'page' : undefined}>
              <span className={styles.navText}>Contact</span>
            </Link>
          </div>
          {!theme && <div className={styles.absorb} data-absorb style={{ '--lag': 0.14 } as CSSProperties}>
            <Link href="/admin" className={`${styles.key} ${styles.adminKey}`} data-orbit-piece="admin">
              <span className={styles.navText}>Admin</span>
            </Link>
          </div>}
        </div>

        <Link ref={exploreRef} href={themeInfo ? `/explore?focus=${themeInfo.name}` : '/explore'} className={styles.exploreKey} aria-label={themeInfo ? `Explore ${themeInfo.name}` : 'Explore'}>
          <span className={styles.exploreLabel}>Explore</span>
          <span className={styles.exploreArrow}><Arrow /></span>
        </Link>
      </nav>
    </header>
    {overlay}
  </>);
}
