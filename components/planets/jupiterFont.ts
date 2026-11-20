import { Anybody } from 'next/font/google';

export const jupiterDisplay = Anybody({
  subsets: ['latin'], weight: 'variable', axes: ['wdth'], display: 'swap',
  variable: '--font-jupiter', preload: false,
});
