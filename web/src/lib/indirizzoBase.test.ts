import { describe, expect, it } from 'vitest';
import { indirizzoBase } from './indirizzoBase';

describe('indirizzoBase', () => {
  it('in locale, senza un valore, è il sito originale', () => {
    expect(indirizzoBase(undefined)).toBe('https://simones99.github.io/ai-radar/');
    expect(indirizzoBase('')).toBe('https://simones99.github.io/ai-radar/');
  });

  it('segue il valore ricevuto, con la barra finale anche se manca', () => {
    expect(indirizzoBase('https://altro-utente.github.io/altro-radar/')).toBe('https://altro-utente.github.io/altro-radar/');
    expect(indirizzoBase('https://altro-utente.github.io/altro-radar')).toBe('https://altro-utente.github.io/altro-radar/');
  });

  it('rifiuta un valore che non è un indirizzo assoluto', () => {
    expect(() => indirizzoBase('altro-radar/')).toThrow(/AI_RADAR_BASE_URL/);
  });
});
