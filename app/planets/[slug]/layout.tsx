import type { ReactNode } from 'react';
import SmoothScroll from '@/components/landing/SmoothScroll';

export default function PlanetLayout({ children }: { children: ReactNode }) {
  return <><SmoothScroll />{children}</>;
}
