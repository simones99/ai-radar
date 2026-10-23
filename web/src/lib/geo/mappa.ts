// La mappa di GeopoliticAI: i confini generati da scripts/confini.py, gli anelli della catena e i testi dell'anello aperto.
import type { Cite, TableData } from '../charts/types';
import { AREE } from '../data/geopoliticai';
import type { Geopoliticai } from '../data/types';
import { dayWith } from '../text/format';
import { eci } from '../text/geopoliticai';
import CONFINI from './confini.json';

export interface Paese { id: string; nome: string; d: string; c: [number, number] }
export const PAESI = CONFINI.paesi as Paese[];
export const VIEWBOX = CONFINI.viewBox;
export const NOMI: Record<string, string> = Object.fromEntries(PAESI.map((p) => [p.id, p.nome]));
export const CENTRO: Record<string, [number, number]> = Object.fromEntries(PAESI.map((p) => [p.id, p.c]));

/** Le sei fermate della linea, nell'ordine della catena: dalla miniera al modello. */
export const ANELLI = [
  { key: 'materie', nome: 'Materie prime' },
  { key: 'progettazione', nome: 'Progettazione dei chip' },
  { key: 'fabbricazione', nome: 'Fabbricazione dei chip' },
  { key: 'macchinari', nome: 'Macchinari' },
  { key: 'datacenter', nome: 'Data center' },
  { key: 'modelli', nome: 'Modelli' },
] as const;
export type AnelloKey = (typeof ANELLI)[number]['key'];
/** Gli anelli che hanno già i dati: gli altri si accendono con i loro ticket. */
export const ATTIVI: readonly AnelloKey[] = ['modelli'];
/** ?anello=: un valore non valido, o un anello non ancora attivo, apre i modelli. */
export const anelloDi = (p: string | undefined): AnelloKey => (ATTIVI as readonly string[]).includes(p ?? '') ? (p as AnelloKey) : 'modelli';

const vuotoEci = (anno: number) => `nessun modello valutato nel ${anno}`;

/** I Paesi dell'anello dei modelli, dal valore più alto. */
export const valoriModelli = (g: Geopoliticai): [string, number, string][] =>
  Object.entries(g.eci_paesi.valori).map(([iso, v]): [string, number, string] => [iso, v.max, v.modello]).sort((a, b) => b[1] - a[1]);

/** Il valore di un Paese della mappa, o la frase onesta che lo sostituisce: per il nome dei pulsanti e il tooltip. */
export function testoPaese(g: Geopoliticai, iso: string): string {
  const v = g.eci_paesi.valori[iso];
  return v ? `${eci(v.max)} ECI, ${v.modello}` : vuotoEci(g.eci_paesi.anno);
}

export const misuraModelli = (g: Geopoliticai): string =>
  `ECI del miglior modello del ${g.eci_paesi.anno} · ${g.fonte}, dati scaricati ${dayWith('il', g.scaricato)}`;

/** I Paesi della mappa di una zona: «Altri» è tutto quello che non sta nelle altre aree. */
export function paesiZona(g: Geopoliticai, k: string): Set<string> {
  const z = g.zone[k];
  if (!z) return new Set();
  if (k !== 'altri') return new Set(z.paesi_mappa);
  const dentro = new Set(AREE.flatMap((a) => g.zone[a].paesi_mappa));
  return new Set(PAESI.map((p) => p.id).filter((i) => !dentro.has(i)));
}

/** Paese della mappa → la scelta di ?area= che gli corrisponde, dove c'è: gli USA, la Cina, il Regno Unito e i Paesi UE con una scheda. */
export const zonaDi = (g: Geopoliticai): Record<string, string> =>
  Object.fromEntries(Object.entries(g.zone).filter(([k, z]) => k !== 'ue' && z.paesi_mappa.length === 1).map(([k, z]) => [z.paesi_mappa[0], k]));

export interface Cifra { etichetta: string; nome?: string; valore?: string; modello?: string; vuoto?: string }
/** Il tabellone sotto la mappa: il primo, l'UE, l'Italia, e l'area scelta se non è già lì. */
export function tabellone(g: Geopoliticai, zona: string): Cifra[] {
  const anno = g.eci_paesi.anno;
  const [primo] = valoriModelli(g);
  const diZona = (k: string): Cifra => {
    const v = g.zone[k].eci[String(anno)];
    return v?.max != null && v.modello ? { etichetta: g.zone[k].nome, valore: `${eci(v.max)} ECI`, modello: v.modello } : { etichetta: g.zone[k].nome, vuoto: vuotoEci(anno) };
  };
  const out: Cifra[] = [];
  if (primo) out.push({ etichetta: 'Il primo', nome: NOMI[primo[0]] ?? primo[0], valore: `${eci(primo[1])} ECI`, modello: primo[2] });
  out.push(diZona('ue'), diZona('italia'));
  const giaPrimo = primo && g.zone[zona]?.paesi_mappa.length === 1 && g.zone[zona].paesi_mappa[0] === primo[0];
  if (g.zone[zona] && zona !== 'ue' && zona !== 'italia' && !giaPrimo) out.push(diZona(zona));
  return out;
}

/** La tabella dei Paesi dell'anello, che non dipende dal colore. */
export const tabellaModelli = (g: Geopoliticai): TableData => ({
  cols: ['Paese', 'Valore', 'Data'],
  rows: valoriModelli(g).map(([iso, v, m]) => [NOMI[iso] ?? iso, `${eci(v)} ECI, ${m}`, String(g.eci_paesi.anno)]),
});

export const citeModelli = (g: Geopoliticai): Cite => [
  { t: `Modelli: ${g.fonte}, ` }, { t: 'Epoch Capabilities Index', href: g.url_eci }, { t: ' (' },
  { t: g.licenza, href: 'https://creativecommons.org/licenses/by/4.0/' },
  { t: '), ECI massimo per Paese aggregato da AI Radar. Confini: ' }, { t: 'Natural Earth', href: 'https://www.naturalearthdata.com/' },
  { t: ', pubblico dominio.' },
];
