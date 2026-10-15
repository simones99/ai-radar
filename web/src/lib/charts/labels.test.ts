import { describe, expect, it } from 'vitest';
import { leader, measureText, placeLabels, type Box } from './labels';

const overlap = (a: Box, b: Box) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
const bounds = { x0: 0, y0: 0, x1: 400, y1: 300 };

describe('placeLabels', () => {
  it('due punti nello stesso posto: etichette senza sovrapposizioni', () => {
    const m = placeLabels([{ id: 'a', x: 200, y: 150, w: 60, h: 16 }, { id: 'b', x: 200, y: 150, w: 60, h: 16 }], bounds, []);
    expect(overlap(m.get('a')!, m.get('b')!)).toBe(false);
  });
  it('resta dentro i bordi anche vicino al margine', () => {
    const b = placeLabels([{ id: 'a', x: 395, y: 5, w: 80, h: 16 }], bounds, []).get('a')!;
    expect(b.x0).toBeGreaterThanOrEqual(0);
    expect(b.x1).toBeLessThanOrEqual(400);
    expect(b.y0).toBeGreaterThanOrEqual(0);
  });
  it('evita gli ostacoli', () => {
    const obstacle = { x0: 205, y0: 130, x1: 300, y1: 170 };
    const b = placeLabels([{ id: 'a', x: 200, y: 150, w: 60, h: 16 }], bounds, [obstacle]).get('a')!;
    expect(overlap(b, obstacle)).toBe(false);
  });
  it('linea di richiamo solo se l’etichetta è lontana', () => {
    expect(leader({ id: 'a', x: 10, y: 10, w: 10, h: 10 }, { x0: 20, y0: 5, x1: 40, y1: 15 })).toBeNull();
    expect(leader({ id: 'a', x: 10, y: 10, w: 10, h: 10 }, { x0: 60, y0: 60, x1: 80, y1: 76 })).toEqual({ x2: 60, y2: 60 });
  });
  it('misura il testo anche senza canvas', () => {
    expect(measureText('MCP', '12px sans-serif')).toBeGreaterThan(10);
  });
});
