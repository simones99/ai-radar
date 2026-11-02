import type { Geopoliticai } from './types';

/** Le cinque aree, nell'ordine in cui si mostrano. Il primo di un anno si cerca solo tra queste. */
export const AREE = ['usa', 'cina', 'ue', 'uk', 'altri'] as const;
export type Misura = 'eci' | 'calcolo';

/** Il valore massimo di una zona in un anno, con il modello che lo ha. */
export interface Valore { zona: string; anno: number; v: number; modello: string }

export function valore(g: Geopoliticai, zona: string, misura: Misura, anno: number): Valore | null {
  const c = g.zone[zona]?.[misura][String(anno)];
  return c?.max != null && c.modello ? { zona, anno, v: c.max, modello: c.modello } : null;
}

/** L'ultimo anno con un valore, per una zona e una misura. */
export function ultimo(g: Geopoliticai, zona: string, misura: Misura): Valore | null {
  const anni = Object.keys(g.zone[zona]?.[misura] ?? {}).map(Number).sort((a, b) => b - a);
  for (const y of anni) {
    const v = valore(g, zona, misura, y);
    if (v) return v;
  }
  return null;
}

/** Le aree con un valore in quell'anno, dalla più alta. */
export const classifica = (g: Geopoliticai, misura: Misura, anno: number): Valore[] =>
  AREE.flatMap((k) => valore(g, k, misura, anno) ?? []).sort((a, b) => b.v - a.v);

/** Quanti modelli di grande scala di un anno sono di un'area o di un Paese dell'UE, sul totale delle cinque aree (Chi addestra). */
export function quota(g: Geopoliticai, area: string, anno: number): { n: number; tot: number } {
  const n = (a: string) => g.zone[a]?.calcolo[String(anno)]?.n ?? 0;
  return { n: n(area), tot: AREE.reduce((t, a) => t + n(a), 0) };
}

/** L'anno della card in home: quello in corso se l'UE ci ha già un valore, altrimenti l'ultimo chiuso. */
export const annoFaccia = (g: Geopoliticai): number =>
  valore(g, 'ue', 'eci', g.anno_corrente) ? g.anno_corrente : g.anno_corrente - 1;

/** Le tre aree che la card di GeopoliticAI mette a confronto, con il loro valore nell'anno: USA, Cina e UE. */
export const areeFaccia = (g: Geopoliticai, anno: number): Valore[] =>
  (['usa', 'cina', 'ue'] as const).flatMap((k) => valore(g, k, 'eci', anno) ?? []);

/** I Paesi UE del file, nell'ordine del file, con l'Italia sempre in fondo. */
export const paesiUe = (g: Geopoliticai): string[] =>
  Object.keys(g.zone).filter((k) => g.zone[k].tipo === 'paese-ue').sort((a, b) => Number(a === 'italia') - Number(b === 'italia'));

/** Le righe della matrice: le aree, con i Paesi UE subito sotto l'UE. */
export const righeMatrice = (g: Geopoliticai): string[] => AREE.flatMap((k) => (k === 'ue' ? [k, ...paesiUe(g)] : [k]));
