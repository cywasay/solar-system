'use client';

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { usePathname } from 'next/navigation';
import ExploreLoader from './ExploreLoader';
import styles from './ExploreTransition.module.css';

type Phase = 'idle' | 'entry' | 'loading' | 'exiting';
const EXIT_DURATION = 650;
interface TransitionContext {
  phase: Phase;
  loaderRef: RefObject<HTMLDivElement | null>;
  beginEntry: () => void;
  finishEntry: () => void;
  cancelEntry: () => void;
  prepareScene: () => void;
  markSceneReady: () => void;
}
const Context = createContext<TransitionContext | null>(null);

/** One loader instance survives the entire entry, route request, and GPU warm-up. */
export default function ExploreTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>(() => pathname === '/explore' ? 'loading' : 'idle');
  const [sceneReady, setSceneReady] = useState(false);
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const cameFromEntry = useRef(false);
  const previousPath = useRef(pathname);

  const beginEntry = useCallback(() => {
    cameFromEntry.current = true;
    setSceneReady(false);
    setMinimumElapsed(false);
    setPhase('entry');
  }, []);
  const finishEntry = useCallback(() => setPhase(current => current === 'entry' ? 'loading' : current), []);
  const cancelEntry = useCallback(() => {
    cameFromEntry.current = false;
    setPhase('idle');
    setSceneReady(false);
    setMinimumElapsed(false);
  }, []);
  const prepareScene = useCallback(() => {
    setPhase(current => current === 'idle' ? 'loading' : current);
  }, []);
  const markSceneReady = useCallback(() => setSceneReady(true), []);

  useLayoutEffect(() => {
    if (previousPath.current !== pathname && pathname !== '/explore') cancelEntry();
    if (previousPath.current !== '/explore' && pathname === '/explore') prepareScene();
    previousPath.current = pathname;
  }, [pathname, cancelEntry, prepareScene]);

  useEffect(() => {
    if (phase !== 'loading') return;
    const timer = window.setTimeout(() => setMinimumElapsed(true), cameFromEntry.current ? 700 : 1_500);
    return () => window.clearTimeout(timer);
  }, [phase]);
  useEffect(() => {
    if (phase === 'loading' && minimumElapsed && sceneReady) setPhase('exiting');
  }, [phase, minimumElapsed, sceneReady]);
  useEffect(() => {
    if (phase !== 'exiting') return;
    const timer = window.setTimeout(() => setPhase('idle'), EXIT_DURATION);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const context = useMemo(() => ({ phase, loaderRef, beginEntry, finishEntry, cancelEntry, prepareScene, markSceneReady }),
    [phase, beginEntry, finishEntry, cancelEntry, prepareScene, markSceneReady]);

  return <Context.Provider value={context}>
    {phase !== 'idle' && <div ref={loaderRef} className={styles.cover} data-loader-phase={phase} aria-hidden={phase === 'entry'}>
      <ExploreLoader />
    </div>}
    {children}
  </Context.Provider>;
}

export function useExploreTransition() {
  const context = useContext(Context);
  if (!context) throw new Error('ExploreTransition must wrap the public site.');
  return context;
}

/** Suspense feedback uses the same persistent loader, including direct visits. */
export function ExploreRouteLoading() {
  const { prepareScene } = useExploreTransition();
  useLayoutEffect(() => prepareScene(), [prepareScene]);
  return null;
}
