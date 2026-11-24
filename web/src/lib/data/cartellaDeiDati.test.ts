// Da quale cartella leggono i dati la build, i comandi e i test che li lanciano.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cartellaDeiDati } from './cartellaDeiDati';

describe('la cartella dei dati', () => {
  it('è AI_RADAR_DATA_DIR, quando c’è', () => {
    expect(cartellaDeiDati({ AI_RADAR_DATA_DIR: '/altrove/dati' })).toBe('/altrove/dati');
  });

  it('senza la variabile è data/ nella radice della repo, dove la pipeline scrive status.json', () => {
    const dati = cartellaDeiDati({});
    expect(dati.replaceAll('\\', '/')).toMatch(/\/data$/);
    expect(existsSync(join(dati, 'status.json'))).toBe(true);
  });
});
