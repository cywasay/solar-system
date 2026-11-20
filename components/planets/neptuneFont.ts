import { Syne } from 'next/font/google';

export const neptuneDisplay = Syne({
  subsets: ['latin'],
  weight: 'variable',
  display: 'swap',
  preload: false,
  variable: '--font-neptune',
});
