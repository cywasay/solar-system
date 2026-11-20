import { Bodoni_Moda } from 'next/font/google';

export const saturnDisplay = Bodoni_Moda({
  subsets: ['latin'],
  weight: 'variable',
  style: ['normal', 'italic'],
  display: 'swap',
  preload: false,
  variable: '--font-saturn',
});
