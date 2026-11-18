import { Fredoka, Nunito } from 'next/font/google';

import { cn } from '@/lib/utils';

/** Títulos: Fredoka 600 y 700. */
const fontHeading = Fredoka({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-fredoka',
  display: 'swap'
});

/** Cuerpo: Nunito 400, 600 y 700. */
const fontBody = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-nunito',
  display: 'swap'
});

/** Clases que declaran las variables CSS de las dos fuentes (se aplican en <html>). */
export const fontVariables = cn(fontHeading.variable, fontBody.variable);
