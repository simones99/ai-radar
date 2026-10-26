// La mappa di GeopoliticAI: i confini generati da scripts/confini.py, gli anelli della catena e i testi dell'anello aperto.
import type { Cite, TableData } from '../charts/types';
import { AREE } from '../data/geopoliticai';
import type { Catena, CatenaAnello, CatenaFilo, FiloKey, GeoDataCenter, Geopoliticai, GeoSito, Materiale } from '../data/types';
import { day, dayWith, nf } from '../text/format';
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

/** Gli anelli che hanno i dati: i modelli sempre, i data center se ci sono nel file di Epoch, materie prime e chip se c'è il file della catena. */
export function attivi(g: Geopoliticai, c: Catena | undefined): AnelloKey[] {
  const ok = (k: AnelloKey) =>
    k === 'modelli' || (k === 'datacenter' ? !!g.data_center : k === 'materie' ? materialiDi(c).length > 0 : !!c?.anelli[k as Chip]);
  return ANELLI.map((a) => a.key).filter(ok);
}
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
  /** Di quando è il dato: l'anno, il periodo o il giorno dello scarico. */
  data: string;
  tabellone: (zona: string) => Cifra[];
  tabella: TableData;
  cite: Cite;
  note: string[];
}

export function vista(g: Geopoliticai, c: Catena | undefined, k: AnelloKey, materiale?: string): Vista {
  if (k === 'materie') {
    const m = c?.anelli.materie?.materiali[materialeDi(materiale, c)];
    if (m) return vistaQuote(g, `Materie prime, ${m.nome.toLowerCase()}`, 'nessuna produzione', m, `dati del ${m.data}`);
  }
  if (k === 'datacenter' && g.data_center) return vistaDataCenter(g);
  const a = (CHIP as readonly string[]).includes(k) ? c?.anelli[k as Chip] : undefined;
  return a ? vistaQuote(g, ANELLI.find((x) => x.key === k)!.nome, VUOTO_CHIP[k as Chip], a, `dati del ${a.data}`) : vistaModelli(g);
}

/** Un anello nel fumetto del Paese: il valore di ogni materiale, o il valore unico, ognuno con la sua data. */
export interface AnelloFumetto { key: AnelloKey; nome: string; voci: { materiale?: string; testo: string; data?: string }[] }

/** Il fumetto di un Paese: i sei anelli, con la frase onesta dove il Paese non ha niente e «dati in arrivo» dove l'anello non c'è. */
export function fumetto(g: Geopoliticai, c: Catena | undefined, iso: string): AnelloFumetto[] {
  const ok = attivi(g, c);
  const voce = (v: Vista, materiale?: string) => ({ materiale, testo: v.testo(iso), data: v.data });
  return ANELLI.map(({ key, nome }) => ({
    key, nome,
    voci: !ok.includes(key) ? [{ testo: 'dati in arrivo' }]
      : key === 'materie' ? materialiDi(c).map((m) => voce(vista(g, c, key, m.key), m.nome))
      : [voce(vista(g, c, key))],
  }));
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
    valori, europa: null, scala: valori.length ? [valori[valori.length - 1][1] - 10, valori[0][1]] : [0, 1], breve: eci, testo, data: String(anno),
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

// ---------------------------------------------------------------- i Siti: un cerchio per ogni data center noto a Epoch

const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, M = Math.sqrt(3) / 2;
const S = 1000 / (2 * 2.70646);
/** Equal Earth, come in scripts/confini.py: le coordinate dei confini, larghe 1000, con il nord in alto. */
export function proietta(lon: number, lat: number): [number, number] {
  const th = Math.asin(M * Math.sin((lat * Math.PI) / 180));
  const t2 = th * th, t6 = t2 ** 3;
  const x = ((lon * Math.PI) / 180) * Math.cos(th) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)));
  return [500 + S * x, -S * th * (A1 + A2 * t2 + t6 * (A3 + A4 * t2))];
}

/** Il raggio del sito più grande e il più piccolo, anche per i siti in costruzione, nelle coordinate della mappa. */
const R_MAX = 14, R_MIN = 1.6;

export interface PuntoSito { sito: GeoSito; x: number; y: number; r: number }

/** I cerchi dei siti con una posizione: l'area cresce con gli H100 equivalenti, e i più grandi stanno sotto. */
export function puntiSiti(dc: GeoDataCenter): PuntoSito[] {
  const max = Math.max(1, ...dc.siti.map((s) => s.h100e));
  return dc.siti.flatMap((sito) => {
    if (sito.lat == null || sito.lon == null) return [];
    const [x, y] = proietta(sito.lon, sito.lat);
    const r = Math.max(R_MIN, R_MAX * Math.sqrt(sito.h100e / max));
    return [{ sito, x, y, r }];
  }).sort((a, b) => b.r - a.r);
}

/** Il nome di un cerchio, per il lettore di schermo e il tooltip. */
export const nomeSito = (s: GeoSito): string => `${s.nome}: ${s.stato === 'operativo' ? `${nf(s.h100e)} H100 equivalenti` : 'in costruzione'}`;

/** Le righe del fumetto di un sito. */
export function schedaSito(s: GeoSito): [string, string][] {
  return [
    ['Proprietario dei chip', s.proprietario ?? 'non noto'],
    ['Paese', s.iso ? NOMI[s.iso] ?? s.iso : 'non noto'],
    ['H100 equivalenti', s.stato === 'operativo' ? nf(s.h100e) : 'in costruzione'],
    ...(s.mw > 0 ? [['Potenza elettrica', `${nf(s.mw, Number.isInteger(s.mw) ? 0 : 1)} MW`] as [string, string]] : []),
    ['Stato', s.stato],
  ];
}

/** La didascalia dei Siti: cosa sono i cerchi, i siti che non ne hanno uno, e l'Italia quando non ha siti. */
export function didascaliaSiti(dc: GeoDataCenter): string {
  const senza = dc.siti.filter((s) => s.lat == null).length;
  return [
    'Ogni cerchio è un data center noto a Epoch, grande secondo i suoi H100 equivalenti; i cerchi vuoti sono in costruzione.',
    ...(senza ? [`${senza === 1 ? '1 sito non ha' : `${senza} siti non hanno`} una posizione: ${senza === 1 ? 'conta' : 'contano'} nella quota, ma senza cerchio.`] : []),
    ...(dc.siti.some((s) => s.iso === 'ITA') ? [] : ['In Italia Epoch non conta nessun data center: i cluster italiani sono nella nota sul censimento GPU clusters.']),
  ].join(' ');
}

/** L'attribuzione dei Siti, con OpenStreetMap solo se almeno una posizione viene da un indirizzo. */
export const citeSiti = (dc: GeoDataCenter): Cite => [
  { t: ' Siti dei data center: Epoch AI, ' }, { t: 'AI data centers', href: 'https://epoch.ai/data/ai-data-centers' }, { t: ', ' },
  { t: 'CC BY 4.0', href: 'https://creativecommons.org/licenses/by/4.0/' },
  { t: '. Posizioni ricavate dalla mappa di Epoch, dati rielaborati da AI Radar.' },
  ...(dc.siti.some((s) => s.posizione === 'indirizzo' && s.lat != null)
    ? [{ t: ' © ' }, { t: 'OpenStreetMap', href: 'https://www.openstreetmap.org/copyright' }, { t: ' contributors.' }] : []),
];

// ---------------------------------------------------------------- il Filo della catena: un esempio di percorso, una tappa per anello

/** Gli esempi del filo, nell'ordine del selettore. */
const FILI: readonly FiloKey[] = ['usa', 'ue', 'cina'];
/** Un esempio del filo, con la sua chiave di ?filo=. */
export type Filo = { key: FiloKey } & CatenaFilo;
/** Gli esempi nel file della catena; un file del giro prima non ne ha. */
export const filiDi = (c: Catena | undefined): Filo[] =>
  FILI.flatMap((key) => { const f = c?.fili?.[key]; return f ? [{ key, ...f }] : []; });
/** ?vista=filo&filo=: il filo da mostrare, o null per la vista «Quote per Paese». Un esempio non valido torna a quello europeo. */
export function filoDi(vista: string | undefined, p: string | undefined, c: Catena | undefined): Filo | null {
  const fili = filiDi(c);
  if (vista !== 'filo' || !fili.length) return null;
  return fili.find((f) => f.key === p) ?? fili.find((f) => f.key === 'ue') ?? fili[0];
}

/** Il punto più alto che un arco può toccare: il bordo della mappa tagliata, con un margine. */
const CIMA = Number(VIEWBOX.split(' ')[1]) + 6;
export interface Arco { d: string; verso: number; pieno: boolean }
/** Gli archi tra una tappa e la successiva, curvati verso l'alto: pieni fino alla fermata scelta, poi tratteggiati. */
export function archi(f: CatenaFilo, scelta: number): Arco[] {
  const punti = f.tappe.map((t) => proietta(t.lon, t.lat));
  return punti.slice(1).map(([x2, y2], i) => {
    const [x1, y1] = punti[i];
    const cy = Math.max(CIMA, Math.min(y1, y2) - Math.min(80, Math.max(6, Math.hypot(x2 - x1, y2 - y1) * 0.2)));
    return { d: `M${x1},${y1} Q${(x1 + x2) / 2},${cy} ${x2},${y2}`, verso: i + 1, pieno: i + 1 <= scelta };
  });
}

/** Il nome di un Paese nella vista del filo: le sue tappe, o nessuna. */
export function nomeFilo(f: CatenaFilo, iso: string): string {
  const qui = f.tappe.flatMap((t, i) => (t.iso === iso ? [`${i + 1}. ${t.luogo}`] : []));
  return `${NOMI[iso] ?? iso}: ${qui.length ? qui.join('; ') : 'nessuna tappa del filo'}`;
}

/** Il dominio della fonte di una tappa, per il testo del link: «Fonte: epoch.ai». */
export const dominio = (url: string): string => new URL(url).hostname.replace(/^www\./, '');

/** Sotto la mappa del filo: le fonti stanno nelle tappe, qui solo chi ha scelto l'esempio e i confini. */
export const CITE_FILO: Cite = [{ t: "Filo della catena: un esempio scelto da AI Radar, con la fonte di ogni tappa nell'elenco." }, ...CONFINI_CITE];

// ---------------------------------------------------------------- materie prime e chip: le quote per Paese, con il valore unico dell'Europa dove c'è

const pct = (v: number) => (v > 0 && v < 0.05 ? 'meno dello 0,1%' : `${nf(v, Number.isInteger(v) ? 0 : 1)}%`);

/** I data center: la quota per Paese degli H100 equivalenti dei siti noti a Epoch, aggiornata ogni settimana. */
function vistaDataCenter(g: Geopoliticai): Vista {
  const dc = g.data_center!;
  const a: CatenaAnello = {
    misura: 'Quota degli H100 equivalenti dei siti noti', fonte: g.fonte, titolo: 'AI data centers', url: 'https://epoch.ai/data/ai-data-centers',
    licenza: g.licenza, url_licenza: 'https://creativecommons.org/licenses/by/4.0/', data: day(dc.aggiornato), quote: dc.quote, europa: null,
    nota: 'I siti noti a Epoch coprono circa il 44% del calcolo AI mondiale: le quote sono calcolate solo su questi siti.',
  };
  return vistaQuote(g, 'Data center', 'nessun sito noto a Epoch', a, `dati scaricati ${dayWith('il', dc.aggiornato)}`);
}

/** `dati`: quando è il dato, dopo la fonte nel titolo e nella citazione («dati del 2022»). */
function vistaQuote(g: Geopoliticai, nome: string, vuoto: string, a: CatenaAnello, dati: string): Vista {
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
    misura: `${a.misura} · ${a.fonte}, ${dati}`,
    valori, europa: a.europa, scala: [0, Math.max(a.europa ?? 0, p?.[1] ?? 1)], breve: pct, testo, data: a.data,
    tabellone: (zona) => tabellone(g, zona, primo, diZona, p?.[0]),
    tabella: { cols: ['Paese', 'Valore', 'Data'], rows: righe.map(([iso, v]) => [iso === EUROPA ? DATO_UNICO : NOMI[iso] ?? iso, pct(v), a.data]) },
    cite: [
      { t: `${nome}: ${a.fonte}, ` }, { t: a.titolo, href: a.url }, { t: ' (' }, { t: a.licenza, href: a.url_licenza },
      { t: `${nc}), ${dati}, quote rielaborate da AI Radar.` }, ...CONFINI_CITE,
    ],
    note: [
      ...(a.europa != null ? [`${DATO_UNICO}: la fonte dà ${pct(a.europa)} per l'Europa intera, e la mappa colora allo stesso modo, a tratteggio, tutti i Paesi UE.`] : []),
      ...(a.nota ? [a.nota] : []),
    ],
  };
}
