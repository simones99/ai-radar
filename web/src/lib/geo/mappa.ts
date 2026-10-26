// La mappa di GeopoliticAI: i confini generati da scripts/confini.py, gli anelli della catena e i testi dell'anello aperto.
import type { Cite, TableData } from '../charts/types';
import { AREE } from '../data/geopoliticai';
import type { Catena, CatenaAnello, Geopoliticai, Materiale } from '../data/types';
import { dayWith, nf } from '../text/format';
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
type Chip = 'progettazione' | 'fabbricazione' | 'macchinari';
const CHIP: readonly Chip[] = ['progettazione', 'fabbricazione', 'macchinari'];
/** La frase onesta di un Paese senza quota, per anello dei chip. */
const VUOTO_CHIP: Record<Chip, string> = { progettazione: 'nessuna quota', fabbricazione: 'nessuno stabilimento', macchinari: 'nessuna produzione' };

/** I materiali delle materie prime, nell'ordine del selettore. */
const MATERIALI: readonly Materiale[] = ['gallio', 'terre', 'silicio', 'germanio'];

/** Gli anelli che hanno i dati: i modelli sempre, materie prime e chip se c'è il file della catena. Gli altri si accendono con i loro ticket. */
export const attivi = (c: Catena | undefined): AnelloKey[] =>
  ANELLI.map((a) => a.key).filter((k) => k === 'modelli' || (k === 'materie' ? materialiDi(c).length > 0 : (CHIP as readonly string[]).includes(k) && !!c?.anelli[k as Chip]));
/** I materiali nel file della catena, con il loro nome. */
export const materialiDi = (c: Catena | undefined): { key: Materiale; nome: string }[] =>
  MATERIALI.flatMap((key) => { const m = c?.anelli.materie?.materiali[key]; return m ? [{ key, nome: m.nome }] : []; });
/** ?materiale=: un valore non valido torna al gallio, o al primo materiale che c'è. */
export function materialeDi(p: string | undefined, c: Catena | undefined): Materiale {
  const ok = materialiDi(c).map((m) => m.key);
  return ok.includes(p as Materiale) ? (p as Materiale) : ok.includes('gallio') ? 'gallio' : ok[0] ?? 'gallio';
}
/** ?anello=: un valore non valido, o un anello non attivo, apre i modelli. */
export const anelloDi = (p: string | undefined, ok: readonly AnelloKey[]): AnelloKey => (ok as readonly string[]).includes(p ?? '') ? (p as AnelloKey) : 'modelli';

/** «Europa, dato unico»: la chiave del valore unico, come se fosse un Paese, nelle etichette e nella tabella. */
export const EUROPA = 'EUR';
const DATO_UNICO = 'Europa, dato unico';

export interface Cifra { etichetta: string; nome?: string; valore?: string; dettaglio?: string; vuoto?: string }

/** Quello che la mappa mostra per l'anello aperto: i valori per Paese, i testi, il tabellone, la tabella, le fonti e le note. */
export interface Vista {
  /** La riga sotto il titolo: misura, fonte e data. */
  misura: string;
  /** I Paesi con un valore, dal più alto; il valore unico dell'Europa sta a parte. */
  valori: [string, number][];
  europa: number | null;
  /** Il valore che prende il colore più chiaro e quello che prende il più scuro. */
  scala: [number, number];
  /** Il valore breve, per le etichette sulla mappa. */
  breve: (v: number) => string;
  /** Il valore di un Paese, o la frase onesta che lo sostituisce: per il nome dei pulsanti e il tooltip. */
  testo: (iso: string) => string;
  tabellone: (zona: string) => Cifra[];
  tabella: TableData;
  cite: Cite;
  note: string[];
}

export function vista(g: Geopoliticai, c: Catena | undefined, k: AnelloKey, materiale?: string): Vista {
  if (k === 'materie') {
    const m = c?.anelli.materie?.materiali[materialeDi(materiale, c)];
    if (m) return vistaQuote(g, `Materie prime, ${m.nome.toLowerCase()}`, 'nessuna produzione', m);
  }
  const a = (CHIP as readonly string[]).includes(k) ? c?.anelli[k as Chip] : undefined;
  return a ? vistaQuote(g, ANELLI.find((x) => x.key === k)!.nome, VUOTO_CHIP[k as Chip], a) : vistaModelli(g);
}

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

/** Il tabellone sotto la mappa: il primo, l'UE, l'Italia, e l'area scelta se non è già lì. */
function tabellone(g: Geopoliticai, zona: string, primo: Cifra | null, diZona: (k: string) => Cifra, primoIso: string | undefined): Cifra[] {
  const out: Cifra[] = [];
  if (primo) out.push(primo);
  out.push(diZona('ue'), diZona('italia'));
  const giaPrimo = primoIso && g.zone[zona]?.paesi_mappa.length === 1 && g.zone[zona].paesi_mappa[0] === primoIso;
  if (g.zone[zona] && zona !== 'ue' && zona !== 'italia' && !giaPrimo) out.push(diZona(zona));
  return out;
}

const CONFINI_CITE: Cite = [{ t: ' Confini: ' }, { t: 'Natural Earth', href: 'https://www.naturalearthdata.com/' }, { t: ', pubblico dominio.' }];

// ---------------------------------------------------------------- l'anello dei modelli: l'ECI massimo per Paese dell'ultimo anno chiuso

function vistaModelli(g: Geopoliticai): Vista {
  const anno = g.eci_paesi.anno;
  const vuoto = `nessun modello valutato nel ${anno}`;
  const valori = Object.entries(g.eci_paesi.valori).map(([iso, v]): [string, number] => [iso, v.max]).sort((a, b) => b[1] - a[1]);
  const testo = (iso: string) => {
    const v = g.eci_paesi.valori[iso];
    return v ? `${eci(v.max)} ECI, ${v.modello}` : vuoto;
  };
  const diZona = (k: string): Cifra => {
    const v = g.zone[k].eci[String(anno)];
    return v?.max != null && v.modello ? { etichetta: g.zone[k].nome, valore: `${eci(v.max)} ECI`, dettaglio: v.modello } : { etichetta: g.zone[k].nome, vuoto };
  };
  const [p] = valori;
  const primo = p ? { etichetta: 'Il primo', nome: NOMI[p[0]] ?? p[0], valore: `${eci(p[1])} ECI`, dettaglio: g.eci_paesi.valori[p[0]].modello } : null;
  return {
    misura: `ECI del miglior modello del ${anno} · ${g.fonte}, dati scaricati ${dayWith('il', g.scaricato)}`,
    valori, europa: null, scala: valori.length ? [valori[valori.length - 1][1] - 10, valori[0][1]] : [0, 1], breve: eci, testo,
    tabellone: (zona) => tabellone(g, zona, primo, diZona, p?.[0]),
    tabella: { cols: ['Paese', 'Valore', 'Data'], rows: valori.map(([iso]) => [NOMI[iso] ?? iso, testo(iso), String(anno)]) },
    cite: [
      { t: `Modelli: ${g.fonte}, ` }, { t: 'Epoch Capabilities Index', href: g.url_eci }, { t: ' (' },
      { t: g.licenza, href: 'https://creativecommons.org/licenses/by/4.0/' },
      { t: '), ECI massimo per Paese aggregato da AI Radar.' }, ...CONFINI_CITE,
    ],
    note: [],
  };
}

// ---------------------------------------------------------------- materie prime e chip: le quote per Paese, con il valore unico dell'Europa dove c'è

const pct = (v: number) => `${nf(v, Number.isInteger(v) ? 0 : 1)}%`;

function vistaQuote(g: Geopoliticai, nome: string, vuoto: string, a: CatenaAnello): Vista {
  const ue = new Set(g.zone.ue?.paesi_mappa ?? []);
  const valori = Object.entries(a.quote).sort((x, y) => y[1] - x[1]);
  const inEuropa = (iso: string) => a.europa != null && ue.has(iso);
  const testo = (iso: string) => (inEuropa(iso) ? `${DATO_UNICO}, ${pct(a.europa!)}` : a.quote[iso] != null ? pct(a.quote[iso]) : vuoto);
  /** La quota di una zona: la somma dei suoi Paesi, o il valore unico dell'Europa per l'UE e i Paesi UE. */
  const diZona = (z: string): Cifra => {
    const etichetta = g.zone[z].nome;
    const paesi = [...paesiZona(g, z)];
    if (a.europa != null && paesi.every((iso) => ue.has(iso))) return { etichetta, valore: pct(a.europa), dettaglio: DATO_UNICO };
    const somma = paesi.reduce((s, iso) => s + (a.quote[iso] ?? 0), 0);
    return somma > 0 ? { etichetta, valore: pct(Math.round(somma * 10) / 10) } : { etichetta, vuoto };
  };
  const [p] = valori;
  const primo = p ? { etichetta: 'Il primo', nome: NOMI[p[0]] ?? p[0], valore: pct(p[1]) } : null;
  const righe: [string, number][] = [...valori, ...(a.europa != null ? [[EUROPA, a.europa] as [string, number]] : [])].sort((x, y) => y[1] - x[1]);
  const nc = /NC/.test(a.licenza) ? ', uso commerciale non consentito' : '';
  return {
    misura: `${a.misura} · ${a.fonte}, dati del ${a.data}`,
    valori, europa: a.europa, scala: [0, Math.max(a.europa ?? 0, p?.[1] ?? 1)], breve: pct, testo,
    tabellone: (zona) => tabellone(g, zona, primo, diZona, p?.[0]),
    tabella: { cols: ['Paese', 'Valore', 'Data'], rows: righe.map(([iso, v]) => [iso === EUROPA ? DATO_UNICO : NOMI[iso] ?? iso, pct(v), a.data]) },
    cite: [
      { t: `${nome}: ${a.fonte}, ` }, { t: a.titolo, href: a.url }, { t: ' (' }, { t: a.licenza, href: a.url_licenza },
      { t: `${nc}), dati del ${a.data}, quote rielaborate da AI Radar.` }, ...CONFINI_CITE,
    ],
    note: [
      ...(a.europa != null ? [`${DATO_UNICO}: la fonte dà ${pct(a.europa)} per l'Europa intera, e la mappa colora allo stesso modo, a tratteggio, tutti i Paesi UE.`] : []),
      ...(a.nota ? [a.nota] : []),
    ],
  };
}
