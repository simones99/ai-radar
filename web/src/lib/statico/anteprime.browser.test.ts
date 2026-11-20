// Il comando delle anteprime quando fa le immagini, quindi con Chromium: `npm run test:browser`, che nel workflow gira con gli end-to-end.
import { describe, expect, it } from 'vitest';
import { anteprimeSuDatiDiProva, COMPETENZE, RADAR, SEGNAPOSTO } from '../test/anteprime';

describe('il comando delle anteprime delle competenze', { timeout: 120_000 }, () => {
  const { leggi, lancia, scriviRadar } = anteprimeSuDatiDiProva();

  it('al posto di ogni segnaposto scrive il PNG della competenza, di 1200×630', () => {
    const giro = lancia();
    expect(giro.stderr).toBe('');
    expect(giro.status).toBe(0);
    expect(COMPETENZE.map(leggi)).toEqual(COMPETENZE.map(() => [1200, 630]));
  });

  it('un nome che non entra è un errore che nomina la competenza: le immagini già fatte restano, le altre tengono il segnaposto', () => {
    scriviRadar({ ...RADAR, competenze: RADAR.competenze.map((c) => (c.id === 'rag' ? { ...c, nome: 'Parole '.repeat(400) } : c)) });
    const giro = lancia();
    expect(giro.status).toBe(1);
    expect(giro.stderr).toMatch(/«rag».*non entra/s);
    const dopo = COMPETENZE.indexOf('rag');
    expect(COMPETENZE.map(leggi)).toEqual(COMPETENZE.map((_, i) => (i < dopo ? [1200, 630] : SEGNAPOSTO)));
  });
});
