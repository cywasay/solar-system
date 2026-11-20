import { Big_Shoulders_Stencil, Martian_Mono } from 'next/font/google';

/**
 * Mars reads like field equipment: stencilled display type (the markings on rover
 * hardware) and a mono for field notes and readouts. Both are variable fonts.
 */
export const marsDisplay = Big_Shoulders_Stencil({
  subsets: ['latin'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--font-mars',
});

export const marsMono = Martian_Mono({
  subsets: ['latin'],
  axes: ['wdth'],
  display: 'swap',
  variable: '--font-mars-mono',
});
