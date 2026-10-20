import { daysTo, ym } from '../text/format';
import type { AiActItem, EpochPoint, EurostatSettori, News, NewsItem, Owid, OwidPoint, PerGeo, Quadrant, Radar, RadarRow, Rapporti, Report } from './types';

export const MOVE_MIN = 0.1; // spostamento minimo per disegnare una freccia: un decimo dell'asse
/** Domini fissi degli assi, simmetrici attorno alle soglie: slancio 0 e 3 annunci ogni 10mila stanno al centro. */
export const SLANCIO_DOM: [number, number] = [-0.5, 1];
export const DOMANDA_DOM: [number, number] = [0.1, 90];
const unit = (v: number) => Math.min(1, Math.max(0, v));
const lin = (v: number, [a, b]: [number, number]) => (v - a) / (b - a);
/** Posizione 0–1 sull'asse dello slancio: scala logaritmica di 1 + slancio. */
export const nx = (s: number): number =>
  unit(lin(Math.log(1 + s), [Math.log(1 + SLANCIO_DOM[0]), Math.log(1 + SLANCIO_DOM[1])]));
/** Posizione 0–1 sull'asse della domanda: scala logaritmica. */
export const ny = (d: number): number => unit(lin(Math.log(d), [Math.log(DOMANDA_DOM[0]), Math.log(DOMANDA_DOM[1])]));

export interface RadarRowM extends RadarRow {
  breve: string;
  slancio: number;
  domanda: number;
  quadrante: Quadrant;
  incerto: boolean;
  /** Il quadrante calcolato, se diverso da quello pubblicato: la competenza ci si sta muovendo. */
  moving: Quadrant | null;
  x: number; // posizione sul grafico, 0–1
  y: number;
  px: number | null; // posizione di un mese fa (senza la domanda di allora si usa quella di oggi)
  py: number | null;
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
  if (r.versione !== 2) return []; // radar.json della pipeline vecchia: ranghi, non unità vere
  return r.competenze
    .filter((c) => c.slancio != null && c.domanda != null && c.quadrante != null)
    .map((c) => {
      const s = c.slancio as number, d = c.domanda as number;
      const sp = c.slancio_prec ?? null, dp = c.domanda_prec ?? null, qp = c.quadrante_prec ?? null;
      const hasPrev = sp != null;
      const x = nx(s), y = ny(d);
      const px = hasPrev ? nx(sp as number) : null;
      const py = hasPrev ? ny(dp ?? d) : null;
      // Senza domanda di un mese fa il movimento è solo sullo slancio.
      const dS = px != null ? x - px : 0;
      const dD = hasPrev && dp != null ? y - ny(dp) : 0;
      const calc = c.quadrante_calcolato ?? null;
      return {
        ...c, breve: c.breve || c.nome, slancio: s, domanda: d, quadrante: c.quadrante as Quadrant,
        incerto: !!c.incerto, moving: calc && calc !== c.quadrante ? calc : null,
        x, y, px, py, sp, dp, qp, dS, dD, move: Math.max(Math.abs(dS), Math.abs(dD)), dC: (dS + dD) / 2,
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

/** Una voce (settore, scopo o barriera) con il valore italiano e quello UE; null se Eurostat non dà il numero. */
export interface RigaItUe { id: string; k: string; it: number | null; eu: number | null }

/** Righe Italia contro UE e nomi delle voci senza valore italiano, per la nota sotto il grafico. */
export interface ConfrontoItUe { righe: RigaItUe[]; senzaItalia: string[] }

/** Il settore che vale per tutti quelli rilevati (finanza esclusa). */
export const TUTTI = 'tutti';

/** L'anno più recente fra le chiavi delle serie (anche con valore null); null se non ce n'è nessuno. */
export function ultimoAnno(serie: Record<string, unknown>[]): string | null {
  const anni = serie.flatMap((s) => Object.keys(s).map(Number));
  return anni.length ? String(Math.max(...anni)) : null;
}

/** Dalla più alta alla più bassa per valore italiano. Senza valore italiano (null, mai 0) si va in fondo, per valore UE. */
function itUe(voci: [string, string][], it: (id: string) => number | null | undefined, eu: (id: string) => number | null | undefined): ConfrontoItUe {
  const righe = voci.map(([id, k]) => ({ id, k, it: it(id) ?? null, eu: eu(id) ?? null }));
  righe.sort((a, b) => (a.it == null) !== (b.it == null) ? (a.it == null ? 1 : -1) : (b.it ?? b.eu ?? -1) - (a.it ?? a.eu ?? -1));
  return { righe, senzaItalia: righe.filter((r) => r.it == null).map((r) => r.k) };
}

/** Adozione dei settori rilevati («Tutti» escluso) nell'ultimo anno con valori; senza anni, nessuna riga. */
export function adozionePerSettore(es: EurostatSettori): ConfrontoItUe & { anno: string | null } {
  const anno = ultimoAnno(Object.values(es.adozione).flatMap((g) => [g.IT, g.EU27_2020]));
  if (anno == null) return { anno, righe: [], senzaItalia: [] };
  const voci = es.settori.filter((s) => s.id !== TUTTI).map((s): [string, string] => [s.id, s.nome]);
  return { anno, ...itUe(voci, (id) => es.adozione[id]?.IT[anno], (id) => es.adozione[id]?.EU27_2020[anno]) };
}

/** Adozione di un settore anno per anno, in ordine di tempo: solo gli anni rilevati (il 2022 non c'è). */
export function andamentoItUe(es: EurostatSettori, settore: string): ConfrontoItUe {
  const g = es.adozione[settore];
  const anni = g ? [...new Set([...Object.keys(g.IT), ...Object.keys(g.EU27_2020)])].sort() : [];
  const righe = anni.map((a) => ({ id: a, k: a, it: g.IT[a] ?? null, eu: g.EU27_2020[a] ?? null }));
  return { righe, senzaItalia: righe.filter((r) => r.it == null).map((r) => r.k) };
}

const perVoce = (nomi: Record<string, string>, g: PerGeo | undefined): ConfrontoItUe =>
  itUe(Object.entries(nomi), (id) => g?.IT[id], (id) => g?.EU27_2020[id]);
/** Scopi di un settore, ultimo anno: % delle imprese che usano l'AI. */
export const scopiItUe = (es: EurostatSettori, settore = TUTTI): ConfrontoItUe => perVoce(es.nomi_scopi, es.scopi[settore]);
/** Barriere di un settore, ultimo anno: % delle imprese che hanno considerato l'AI senza usarla. */
export const barriereItUe = (es: EurostatSettori, settore = TUTTI): ConfrontoItUe => perVoce(es.nomi_barriere, es.barriere[settore]);
