import { Fraunces } from 'next/font/google';
export { marsDisplay } from './marsFont';

/**
 * Variable Fraunces with its SOFT axis: Venus's type is soft and luminous in the clouds and
 * hardens and gains weight as the page descends (see VenusDescent).
 */
export const venusDisplay = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['SOFT', 'opsz'],
  display: 'swap',
  variable: '--font-venus',
});

export { jupiterDisplay } from './jupiterFont';
export { saturnDisplay } from './saturnFont';
export { uranusDisplay } from './uranusFont';
export { neptuneDisplay } from './neptuneFont';
