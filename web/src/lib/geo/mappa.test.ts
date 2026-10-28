import { describe, expect, it } from 'vitest';
import { separa } from './mappa';

describe('separa: i segni della mappa non si coprono', () => {
  const dist = (a: { px: number; py: number }, b: { px: number; py: number }) => Math.hypot(a.px - b.px, a.py - b.py);

  it('due segni vicini si allontanano della stessa misura, lungo la retta che li unisce', () => {
    const [a, b] = separa([{ x: 0, y: 0 }, { x: 6, y: 0 }], 20);
    expect(dist(a, b)).toBeCloseTo(20);
    expect([a.px, a.py, b.px, b.py]).toEqual([-7, 0, 13, 0]);
    expect([a.x, b.x]).toEqual([0, 6]); // la posizione vera resta
  });

  it('due segni nello stesso posto si aprono in orizzontale', () => {
    const [a, b] = separa([{ x: 5, y: 5 }, { x: 5, y: 5 }], 10);
    expect([a.px, b.px, a.py, b.py]).toEqual([0, 10, 5, 5]);
  });

  it('i segni già lontani non si muovono; in tre vicini nessuna coppia resta sotto la distanza', () => {
    expect(separa([{ x: 0, y: 0 }, { x: 50, y: 0 }], 20).map((p) => [p.px, p.py])).toEqual([[0, 0], [50, 0]]);
    const tre = separa([{ x: 0, y: 0 }, { x: 4, y: 2 }, { x: 2, y: 6 }], 18);
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) expect(dist(tre[i], tre[j])).toBeGreaterThan(17.9);
  });
});
