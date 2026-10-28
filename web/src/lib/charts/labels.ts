import { versioneFont } from './font.svelte';

export interface Box { x0: number; y0: number; x1: number; y1: number }
export interface LabelItem { id: string; x: number; y: number; w: number; h: number }

/** Il font delle etichette (--font in app.css): le misure vanno prese con questo. */
export const FONT = '"Bricolage Grotesque Variable", system-ui, -apple-system, "Segoe UI", sans-serif';

const hits = (b: Box, taken: Box[]) => taken.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0);
/** Sposta la box dentro i bordi senza cambiarne le misure. */
const clamp = (b: Box, r: Box): Box => {
  const w = b.x1 - b.x0, h = b.y1 - b.y0;
  const x0 = Math.max(r.x0, Math.min(b.x0, r.x1 - w)), y0 = Math.max(r.y0, Math.min(b.y0, r.y1 - h));
  return { x0, y0, x1: x0 + w, y1: y0 + h };
};
const area = (b: Box, others: Box[]) => others.reduce((s, o) =>
  s + Math.max(0, Math.min(b.x1, o.x1) - Math.max(b.x0, o.x0)) * Math.max(0, Math.min(b.y1, o.y1) - Math.max(b.y0, o.y0)), 0);

/** Il posto libero più vicino al punto entro `reach` px, su una griglia di 4 px, almeno a `gap` px dal punto
 *  e con 2 px d'aria dagli altri segni: lì l'etichetta avrà la sua linea di richiamo. */
const nearest = ({ x, y, w, h }: LabelItem, r: Box, taken: Box[], gap: number, reach: number): Box | undefined => {
  const near: [number, Box][] = [];
  for (let x0 = Math.max(r.x0, x - reach - w); x0 <= Math.min(r.x1 - w, x + reach); x0 += 4)
    for (let y0 = Math.max(r.y0, y - reach - h); y0 <= Math.min(r.y1 - h, y + reach); y0 += 4) {
      const d = Math.hypot(Math.max(x0 - x, 0, x - x0 - w), Math.max(y0 - y, 0, y - y0 - h));
      if (d >= gap && d <= reach) near.push([d, { x0, y0, x1: x0 + w, y1: y0 + h }]);
    }
  const aria = (b: Box) => ({ x0: b.x0 - 2, y0: b.y0 - 2, x1: b.x1 + 2, y1: b.y1 + 2 });
  return near.sort((a, b) => a[0] - b[0]).find(([, b]) => !hits(aria(b), taken))?.[1];
};

/** Per ogni etichetta prova posizioni attorno al punto, spostate dentro i bordi, e tiene la prima libera;
 *  se attorno è tutto occupato cerca il posto libero più vicino entro `reach` px.
 *  Se non c'è nemmeno quello le etichette `optional` non si disegnano; le altre prendono la posizione
 *  che copre meno le etichette già messe e poi gli ostacoli. */
export function placeLabels(items: LabelItem[], bounds: Box, obstacles: Box[], gap = 10, optional?: (id: string) => boolean, reach = 120): Map<string, Box> {
  const taken = obstacles.slice();
  const placed: Box[] = [];
  const out = new Map<string, Box>();
  for (const it of items) {
    const { x, y, w, h } = it;
    const cands: [number, number][] = [
      [x + gap, y - h / 2], [x - gap - w, y - h / 2], [x - w / 2, y - gap - h], [x - w / 2, y + gap],
      [x + gap, y - h + 4], [x + gap, y - 4], [x - gap - w, y - h + 4], [x - gap - w, y - 4],
      [x + gap, y - h / 2 - h], [x + gap, y + h / 2], [x - gap - w, y - h / 2 - h], [x - gap - w, y + h / 2],
      [x - w / 2, y - gap - 2 * h], [x - w / 2, y + gap + h],
    ];
    const boxes = cands.map(([x0, y0]) => clamp({ x0, y0, x1: x0 + w, y1: y0 + h }, bounds));
    const free = boxes.find((b) => !hits(b, taken)) ?? (optional?.(it.id) ? undefined : nearest(it, bounds, taken, gap, reach));
    if (!free && optional?.(it.id)) continue;
    const cost = (b: Box) => area(b, placed) * 1000 + area(b, obstacles);
    const best = free ?? boxes.reduce((a, b) => (cost(b) < cost(a) ? b : a));
    out.set(it.id, best);
    taken.push(best);
    placed.push(best);
    // la linea di richiamo resta libera: le etichette dopo non ci si posano sopra
    const l = leader(it, best);
    if (l) for (let t = 0, n = Math.hypot(l.x2 - x, l.y2 - y); t < n; t += 6) {
      const px = x + ((l.x2 - x) * t) / n, py = y + ((l.y2 - y) * t) / n;
      taken.push({ x0: px - 2, y0: py - 2, x1: px + 2, y1: py + 2 });
    }
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
  versioneFont(); // dentro un $derived la misura si rifà quando arriva il font vero
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
