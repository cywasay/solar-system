import { Unbounded } from 'next/font/google';

/** Wide, geometric display type for the sideways chapter titles. */
export const uranusDisplay = Unbounded({
  subsets: ['latin'],
  weight: 'variable',
  display: 'swap',
  preload: false,
  variable: '--font-uranus',
});
