import { describe, expect, it } from 'vitest';
import { idUmami } from './umami';

describe('idUmami', () => {
  it('senza un valore non c’è il contatore', () => {
    expect(idUmami(undefined)).toBeNull();
    expect(idUmami('')).toBeNull();
  });

  it('un UUID è l’ID del sito, così com’è', () => {
    expect(idUmami('bb5f6910-f64e-4045-879e-df65209b7ad5')).toBe('bb5f6910-f64e-4045-879e-df65209b7ad5');
  });

  it('rifiuta un valore che non è un UUID, e dice quale variabile correggere', () => {
    for (const valore of ['bb5f6910', 'bb5f6910-f64e-4045-879e-df65209b7ad5x', '<script>', 'bb5f6910 f64e 4045 879e df65209b7ad5']) {
      expect(() => idUmami(valore), valore).toThrow(/AI_RADAR_UMAMI_ID/);
    }
  });
});
