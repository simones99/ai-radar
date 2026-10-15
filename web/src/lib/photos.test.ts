import { describe, expect, it } from 'vitest';
import { TEMI } from './router';
import { PHOTOS } from './photos';

const LICENZE: Record<string, string> = {
  'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/',
  'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
  CC0: 'https://creativecommons.org/publicdomain/zero/1.0/',
  'Pubblico dominio': '',
};

describe('foto delle card', () => {
  it('una foto per tema, con immagini generate e credito su Commons', () => {
    expect(Object.keys(PHOTOS).sort()).toEqual([...TEMI].sort());
    for (const id of TEMI) {
      const p = PHOTOS[id];
      expect(p.src, id).toBeTruthy();
      expect(p.srcset, id).toContain('480w');
      expect(p.pagina, id).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(p.alt.length, id).toBeGreaterThan(10);
      expect(p.licenzaUrl, id).toBe(LICENZE[p.licenza]);
    }
  });
});
