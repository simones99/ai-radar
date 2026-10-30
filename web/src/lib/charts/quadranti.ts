import type { Quadrant } from '../data/types';
import type { Box } from './labels';

/** Un quadrante del radar disegnato: il suo riquadro e da che lato sta. */
export interface Riquadro extends Box { id: Quadrant; sinistra: boolean; alto: boolean }

/** I quattro quadranti del radar dentro `fuori`, divisi nel punto (`cx`, `cy`) da una fuga larga 2·`mezzaFuga`:
 *  in alto da consolidare e impara ora, in basso tieni d'occhio e da provare. */
export function riquadriDelRadar(fuori: Box, cx: number, cy: number, mezzaFuga: number): Riquadro[] {
  const sx = { x0: fuori.x0, x1: cx - mezzaFuga }, dx = { x0: cx + mezzaFuga, x1: fuori.x1 };
  const su = { y0: fuori.y0, y1: cy - mezzaFuga }, giu = { y0: cy + mezzaFuga, y1: fuori.y1 };
  return [
    { id: 'consolida', ...sx, ...su, sinistra: true, alto: true },
    { id: 'impara-ora', ...dx, ...su, sinistra: false, alto: true },
    { id: 'osserva', ...sx, ...giu, sinistra: true, alto: false },
    { id: 'prova', ...dx, ...giu, sinistra: false, alto: false },
  ];
}

/** Il centro della box sta in alto a destra di (`cx`, `cy`), nel quadrante «impara ora»: lì l'alone di un'etichetta ne prende il colore. */
export const inImparaOra = (b: Box, cx: number, cy: number) => (b.x0 + b.x1) / 2 > cx && (b.y0 + b.y1) / 2 < cy;
