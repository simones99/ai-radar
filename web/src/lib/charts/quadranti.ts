import type { Quadrant } from '../data/types';
import type { Box } from './labels';

/** Un quadrante del radar disegnato: il suo riquadro e da che lato sta. */
export interface Riquadro extends Box { id: Quadrant; sinistra: boolean; alto: boolean }

/** Il punto in cui le due soglie del radar si incrociano, in pixel. */
export interface Centro { x: number; y: number }

/** I quattro quadranti del radar dentro `fuori`, divisi nel `centro` da una fuga larga 2·`mezzaFuga`:
 *  in alto da consolidare e impara ora, in basso tieni d'occhio e da provare. */
export function riquadriDelRadar(fuori: Box, centro: Centro, mezzaFuga: number): Riquadro[] {
  const sx = { x0: fuori.x0, x1: centro.x - mezzaFuga }, dx = { x0: centro.x + mezzaFuga, x1: fuori.x1 };
  const su = { y0: fuori.y0, y1: centro.y - mezzaFuga }, giu = { y0: centro.y + mezzaFuga, y1: fuori.y1 };
  return [
    { id: 'consolida', ...sx, ...su, sinistra: true, alto: true },
    { id: 'impara-ora', ...dx, ...su, sinistra: false, alto: true },
    { id: 'osserva', ...sx, ...giu, sinistra: true, alto: false },
    { id: 'prova', ...dx, ...giu, sinistra: false, alto: false },
  ];
}

/** Il centro della box sta in alto a destra del `centro`, nel quadrante «impara ora»: lì l'alone di un'etichetta ne prende il colore. */
export const inImparaOra = (b: Box, centro: Centro) => (b.x0 + b.x1) / 2 > centro.x && (b.y0 + b.y1) / 2 < centro.y;
