import type { Cite, Series, TableData } from '../charts/types';
import type { OwidSeries } from '../data/types';

export const MISSING = 'Dati non disponibili in questo aggiornamento.';

/** Citazione completa di una serie OWID: produttore originale + link al grafico. */
export function owidCite(s: OwidSeries | undefined): Cite {
  if (!s) return [];
  return [{ t: `${s.citazione || 'Our World in Data'}. Elaborazione: ` }, { t: 'Our World in Data', href: s.url }, { t: '.' }];
}

const pad = (n: number) => String(n).padStart(2, '0');
/** Tempo numerico (tNum) → "AAAA-MM", per le tabelle dei dati mensili o giornalieri. */
export const fmtYm = (x: number): string => {
  const y = Math.floor(x);
  return `${y}-${pad(Math.min(12, Math.floor((x - y) * 12) + 1))}`;
};

/** Tabella "Vedi i dati" per un grafico a linee: una colonna per serie. */
export function seriesTable(series: Series[], xLabel: string, fmtX: (x: number) => string = (x) => String(Math.round(x))): TableData {
  const xs = [...new Set(series.flatMap((s) => s.pts.map((p) => p.x)))].sort((a, b) => a - b);
  return { cols: [xLabel, ...series.map((s) => s.name)], rows: xs.map((x) => [fmtX(x), ...series.map((s) => s.pts.find((p) => p.x === x)?.y ?? '—')]) };
}
export const barsTable = (data: { k: string; v: number }[], cols: [string, string]): TableData => ({ cols, rows: data.map((d) => [d.k, d.v]) });
export const dotsTable = (data: { k: string; now: number; was?: number | null }[], cols: [string, string, string]): TableData =>
  ({ cols, rows: data.map((d) => [d.k, d.now, d.was ?? '—']) });
