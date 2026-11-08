import { Fraunces } from 'next/font/google';
export { marsDisplay } from './marsFont';

export const venusDisplay = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-venus',
});

