import { Bricolage_Grotesque } from 'next/font/google';

/**
 * Earth's display face: a warm, slightly irregular grotesque. Its width and optical-size
 * axes let the instrument board run condensed labels and wide headlines from one family.
 */
export const earthDisplay = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['opsz', 'wdth'],
  display: 'swap',
  variable: '--font-earth',
});
