export interface Box { x0: number; y0: number; x1: number; y1: number }
export interface LabelItem { id: string; x: number; y: number; w: number; h: number }

const hits = (b: Box, taken: Box[]) => taken.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0);
const inside = (b: Box, r: Box) => b.x0 >= r.x0 && b.x1 <= r.x1 && b.y0 >= r.y0 && b.y1 <= r.y1;

/** Per ogni etichetta prova posizioni attorno al punto e tiene la prima libera e dentro i bordi. */
export function placeLabels(items: LabelItem[], bounds: Box, obstacles: Box[], gap = 10): Map<string, Box> {
  const taken = obstacles.slice();
  const out = new Map<string, Box>();
  for (const it of items) {
    const { x, y, w, h } = it;
    const cands: [number, number][] = [
      [x + gap, y - h / 2], [x - gap - w, y - h / 2], [x - w / 2, y - gap - h], [x - w / 2, y + gap],
      [x + gap, y - h + 4], [x + gap, y - 4], [x - gap - w, y - h + 4], [x - gap - w, y - 4],
      [x + gap, y - h / 2 - h], [x + gap, y + h / 2], [x - gap - w, y - h / 2 - h], [x - gap - w, y + h / 2],
      [x - w / 2, y - gap - 2 * h], [x - w / 2, y + gap + h],
    ];
    const boxes = cands.map(([x0, y0]) => ({ x0, y0, x1: x0 + w, y1: y0 + h }));
    const best = boxes.find((b) => inside(b, bounds) && !hits(b, taken)) ?? boxes.find((b) => inside(b, bounds)) ?? boxes[0];
    out.set(it.id, best);
    taken.push(best);
  }
  return out;
}

/** Punto della box più vicino al punto del dato, se l'etichetta è finita lontana (> 18 px). */
export function leader(it: LabelItem, b: Box): { x2: number; y2: number } | null {
  const x2 = Math.max(b.x0, Math.min(it.x, b.x1));
  const y2 = Math.max(b.y0, Math.min(it.y, b.y1));
  return Math.hypot(x2 - it.x, y2 - it.y) > 18 ? { x2, y2 } : null;
}

let ctx: CanvasRenderingContext2D | null | undefined;
/** Larghezza del testo in px; senza canvas (test) usa una stima prudente. */
export function measureText(text: string, font: string): number {
  if (ctx === undefined) {
    try {
      ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
    } catch {
      ctx = null;
    }
  }
  if (ctx) {
    ctx.font = font;
    const w = ctx.measureText(text).width;
    if (w > 0) return w;
  }
  const size = Number(font.match(/(\d+)px/)?.[1] ?? 12);
  return text.length * size * 0.56;
}
