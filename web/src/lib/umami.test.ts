import { describe, expect, it } from 'vitest';
import { idDegliEndToEnd, idUmami } from './umami';

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

describe('idDegliEndToEnd', () => {
  const ID = 'bb5f6910-f64e-4045-879e-df65209b7ad5';

  it('con un ID gli end-to-end usano quello, in locale e nel workflow', () => {
    expect(idDegliEndToEnd({ AI_RADAR_UMAMI_ID: ID })).toBe(ID);
    expect(idDegliEndToEnd({ CI: 'true', AI_RADAR_UMAMI_ID: ID })).toBe(ID);
  });

  it('in locale, senza ID, la build degli end-to-end ha un ID di prova, valido, perché le prove del contatore girino', () => {
    for (const AI_RADAR_UMAMI_ID of [undefined, '']) {
      const id = idDegliEndToEnd({ AI_RADAR_UMAMI_ID });
      expect(idUmami(id)).not.toBeNull();
      expect(id).not.toBe(ID);
    }
  });

  it('nel workflow, senza la variabile del repository, la build degli end-to-end, che è quella pubblicata, esce senza contatore', () => {
    // GitHub dà come stringa vuota una variabile del repository che non c'è
    for (const AI_RADAR_UMAMI_ID of [undefined, '']) expect(idUmami(idDegliEndToEnd({ CI: 'true', AI_RADAR_UMAMI_ID }))).toBeNull();
  });
});
