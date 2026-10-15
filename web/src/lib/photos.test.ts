import { describe, expect, it } from 'vitest';
import { TEMI } from './router';
import { PHOTOS } from './photos';

describe('foto delle card', () => {
  it('una foto per tema, con immagini generate e credito su Commons', () => {
    expect(Object.keys(PHOTOS).sort()).toEqual([...TEMI].sort());
    for (const id of TEMI) {
      const p = PHOTOS[id];
      expect(p.src, id).toBeTruthy();
      expect(p.srcset, id).toContain('480w');
      expect(p.pagina, id).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(p.alt.length, id).toBeGreaterThan(10);
    }
  });
});
