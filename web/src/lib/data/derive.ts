import { daysTo, ym } from '../text/format';
import type { AiActItem, EpochPoint, News, NewsItem, Owid, OwidPoint, Quadrant, Radar, RadarRow, Rapporti, Report } from './types';

export const MOVE_MIN = 0.1; // spostamento minimo per disegnare una freccia: 10 punti percentili

export interface RadarRowM extends RadarRow {
  breve: string;
  slancio: number;
  domanda: number;
  quadrante: Quadrant;
  sp: number | null;
  dp: number | null;
  qp: Quadrant | null;
  dS: number;
  dD: number;
  move: number;
  dC: number;
  changed: boolean;
  hasPrev: boolean;
}

export function radarRows(r: Radar): RadarRowM[] {
  return r.competenze
    .filter((c) => c.slancio != null && c.domanda != null && c.quadrante != null)
    .map((c) => {
      const s = c.slancio as number, d = c.domanda as number;
      const sp = c.slancio_prec ?? null, dp = c.domanda_prec ?? null, qp = c.quadrante_prec ?? null;
      // Senza domanda di un mese fa (una sola rilevazione del lavoro) il movimento è solo sullo slancio.
      const hasPrev = sp != null;
      const dS = hasPrev ? s - (sp as number) : 0;
      const dD = hasPrev && dp != null ? d - dp : 0;
      return {
        ...c, breve: c.breve || c.nome, slancio: s, domanda: d, quadrante: c.quadrante as Quadrant,
        sp, dp, qp, dS, dD, move: Math.max(Math.abs(dS), Math.abs(dD)), dC: (dS + dD) / 2,
        changed: hasPrev && qp != null && qp !== c.quadrante, hasPrev,
      };
    });
}

export function radarChanges(rows: RadarRowM[]): { inn: RadarRowM[]; out: RadarRowM[] } {
  return {
    inn: rows.filter((r) => r.changed && r.quadrante === 'impara-ora'),
    out: rows.filter((r) => r.changed && r.qp === 'impara-ora'),
  };
}

/** Crescita annua del calcolo dei modelli di frontiera: regressione su log10(FLOP). */
export function computeGrowth(punti: EpochPoint[], since = 2018): { fattore: number; n: number } | null {
  const pts = punti.filter((p) => p.f && p.c && p.c > 0 && p.d >= `${since}-01-01`).map((p) => [tNum(p.d), Math.log10(p.c as number)]);
  if (pts.length < 5) return null;
  const mx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const my = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const sxy = pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0);
  const sxx = pts.reduce((a, p) => a + (p[0] - mx) ** 2, 0);
  if (!sxx) return null;
  return { fattore: 10 ** (sxy / sxx), n: pts.length };
}

/** Tempo come numero: 2025, "2026-07", "2026-Q3", "2026-03-31". */
export function tNum(t: string): number {
  const y = Number(t.slice(0, 4));
  const q = t.match(/^\d{4}-Q([1-4])$/);
  if (q) return y + (Number(q[1]) - 1) / 4 + 0.125;
  const md = t.match(/^\d{4}-(\d{2})(?:-(\d{2}))?$/);
  if (!md) return y;
  const m = Number(md[1]);
  if (!md[2]) return y + (m - 1) / 12 + 1 / 24;
  const start = Date.UTC(y, 0, 1), end = Date.UTC(y + 1, 0, 1);
  return y + (Date.UTC(y, m - 1, Number(md[2])) - start) / (end - start);
}

export function owidPoints(o: Owid | undefined, id: string, entita?: string): OwidPoint[] {
  const pts = o?.serie?.[id]?.punti ?? [];
  return pts.filter((p) => entita === undefined || p.entita === entita).slice().sort((a, b) => tNum(a.t) - tNum(b.t));
}
export const owidLatest = (o: Owid | undefined, id: string, entita: string): OwidPoint | null => owidPoints(o, id, entita).at(-1) ?? null;
export const owidPrev = (o: Owid | undefined, id: string, entita: string): OwidPoint | null => owidPoints(o, id, entita).at(-2) ?? null;

export function owidLatestByEntity(o: Owid | undefined, id: string): Map<string, { now: OwidPoint; was: OwidPoint | null }> {
  const by = new Map<string, OwidPoint[]>();
  for (const p of owidPoints(o, id)) by.set(p.entita, [...(by.get(p.entita) ?? []), p]);
  const out = new Map<string, { now: OwidPoint; was: OwidPoint | null }>();
  by.forEach((pts, e) => out.set(e, { now: pts[pts.length - 1], was: pts[pts.length - 2] ?? null }));
  return out;
}

export function nextDeadline(items: AiActItem[] | undefined, today: Date): AiActItem | null {
  return (items ?? []).slice().sort((a, b) => a.data.localeCompare(b.data)).find((x) => daysTo(x.data, today) > 0) ?? null;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}/;
export function newsInLastDays(news: News | undefined, today: Date, days = 7): NewsItem[] {
  return (news?.notizie ?? []).filter((n) => {
    if (!ISO_DAY.test(n.data)) return false;
    const ago = -daysTo(n.data, today);
    return ago >= 0 && ago < days;
  });
}

export function nextReport(r: Rapporti | undefined, today: Date): { report: Report; ym: string } | null {
  const now = ym(today);
  const cands = (r?.rapporti ?? []).filter((x) => x.prossima_prevista && x.prossima_prevista >= now);
  cands.sort((a, b) => (a.prossima_prevista as string).localeCompare(b.prossima_prevista as string));
  return cands[0] ? { report: cands[0], ym: cands[0].prossima_prevista as string } : null;
}
