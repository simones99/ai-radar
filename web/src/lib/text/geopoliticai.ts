import { classifica, ultimo, valore, type Valore } from '../data/geopoliticai';
import type { Geopoliticai, GeoZona } from '../data/types';
import { capitalize, dayWith, nf } from './format';
import type { Cite } from '../charts/types';

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
/** 9,4 × 10²⁶ */
export function flop(v: number): string {
  const e = Math.floor(Math.log10(v));
  return `${nf(v / 10 ** e, 1)} × 10${String(e).split('').map((c) => SUP[Number(c)]).join('')}`;
}
export const eci = (v: number): string => nf(v, 1);
/** Quante volte: una cifra decimale sotto 10, due cifre significative sopra («420», «2.400»). */
export const volte = (r: number): string => (r < 10 ? nf(r, 1) : nf(Number(r.toPrecision(2))));
/** «2026, anno in corso» per l'anno non chiuso. */
export const annoTesto = (g: Geopoliticai, y: number): string => (y === g.anno_corrente ? `${y}, anno in corso` : String(y));

/** «la Cina» → «della Cina», «gli USA» → «degli USA», «l'UE» → «dell'UE». */
export function di(conArticolo: string): string {
  const m = /^(il|lo|la|i|gli|le|l')\s?(.*)$/.exec(conArticolo);
  if (!m) return `di ${conArticolo}`;
  const prep: Record<string, string> = { il: 'del ', lo: 'dello ', la: 'della ', i: 'dei ', gli: 'degli ', le: 'delle ', "l'": "dell'" };
  return `${prep[m[1]]}${m[2]}`;
}
/** «Il miglior modello europeo», «di «Altri»», «di Malta». */
const delModello = (z: GeoZona): string => (z.aggettivo ? z.aggettivo : `di ${z.tipo === 'area' ? z.con_articolo : z.nome}`);
const elenco = (xs: string[]): string => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`);

export interface Cifra {
  fig: string;
  sotto: string;
  /** sotto la cifra del calcolo: per quanti modelli è noto */
  nota?: string;
}
export interface Scheda {
  titolo: string;
  /** la frase in grassetto in testa */
  frase: string;
  capacita: Cifra | null;
  calcolo: Cifra | null;
  /** la riga del calcolo e le righe di contesto */
  righe: string[];
}

const cifra = (g: Geopoliticai, v: Valore | null, fmt: (x: number) => string): Cifra | null =>
  v && { fig: fmt(v.v), sotto: `${v.modello}, ${annoTesto(g, v.anno)}` };

function rigaCalcolo(g: Geopoliticai, k: string, c: Valore): string {
  const [primo, secondo] = classifica(g, 'calcolo', c.anno);
  if (!primo) return `Calcolo: ${c.modello}, ${flop(c.v)} FLOP nel ${annoTesto(g, c.anno)}.`;
  // un Paese UE non è in classifica: se supera il primo delle aree, è lui il più grande dell'anno
  if (primo.zona === k || (g.zone[k].tipo === 'paese-ue' && c.v >= primo.v)) {
    const altro = primo.zona === k ? secondo : primo;
    return altro
      ? `Calcolo: ${c.modello}, ${flop(c.v)} FLOP nel ${annoTesto(g, c.anno)}, ${volte(c.v / altro.v)} volte il più grande ${di(g.zone[altro.zona].con_articolo)}.`
      : `Calcolo: ${c.modello}, ${flop(c.v)} FLOP nel ${annoTesto(g, c.anno)}, il più grande dell'anno.`;
  }
  return `Calcolo: il più grande è ${c.modello}, del ${annoTesto(g, c.anno)}, con ${flop(c.v)} FLOP. `
    + `Il più grande del ${annoTesto(g, c.anno)}, ${primo.modello} (${g.zone[primo.zona].nome}), ne ha usati ${volte(primo.v / c.v)} volte tanto.`;
}

/** Il calcolo dell'anno in corso, quando l'ultimo valore è di un anno chiuso. */
function rigaAnnoInCorso(g: Geopoliticai, k: string): string | null {
  const c = g.zone[k].calcolo[String(g.anno_corrente)];
  if (c?.max != null) return null;
  const y = annoTesto(g, g.anno_corrente);
  if (!c?.n) return `${capitalize(y)}: nessun modello di grande scala.`;
  return `${capitalize(y)}: ${c.n} ${c.n === 1 ? 'modello' : 'modelli'} di grande scala, senza il calcolo noto.`;
}

/** «Calcolo noto per 3 dei 5 modelli di grande scala del 2025»: noto, mai «pubblicato» (spesso è una stima di Epoch). */
function copertura(g: Geopoliticai, k: string, y: number): string {
  const { n, nc } = g.zone[k].calcolo[String(y)];
  const dei = n === 1 ? "l'unico modello" : nc === n ? `tutti i ${n} modelli` : `${nc} dei ${n} modelli`;
  return `Calcolo noto per ${dei} di grande scala del ${annoTesto(g, y)}`;
}

/** «europeo» → «europea», «francese» resta: per «un'organizzazione …». */
const femminile = (agg: string): string => agg.replace(/o$/, 'a');

/** Nella vista UE e nei Paesi UE: i modelli con un'organizzazione della zona che contano per un'altra, se ce ne sono. */
function contanoAltrove(k: string, z: GeoZona): string | null {
  const n = z.contano_altrove;
  if (!n || !(k === 'ue' || z.tipo === 'paese-ue')) return null;
  const agg = z.aggettivo ? femminile(z.aggettivo) : `di ${z.nome}`;
  const altra = z.tipo === 'paese-ue' ? 'un altro Paese' : "un'altra area";
  return `Dal 2020, ${n} ${n === 1 ? 'modello' : 'modelli'} con un'organizzazione ${agg} ${n === 1 ? 'conta' : 'contano'} per ${altra}, perché la prima organizzazione non è ${agg}.`;
}

/** «Per l'UE l'ECI valuta solo Mistral AI»: le organizzazioni si nominano se sono fino a tre. */
function soloOrg(z: GeoZona): string[] {
  const out: string[] = [];
  if (z.org_eci.length && z.org_eci.length <= 3) out.push(`Per ${z.con_articolo} l'ECI valuta solo ${elenco(z.org_eci)}.`);
  if (z.org_ls.length && z.org_ls.length <= 3) out.push(`Per ${z.con_articolo} i modelli di grande scala sono solo di ${elenco(z.org_ls)}.`);
  return out;
}

/** La scheda di un'area o di un Paese UE: la capacità decide la frase, il calcolo ha sempre la sua riga. */
export function scheda(g: Geopoliticai, k: string): Scheda {
  const z = g.zone[k];
  const e = ultimo(g, k, 'eci');
  const c = ultimo(g, k, 'calcolo');
  let frase = 'Nessun modello valutato.';
  if (e) {
    const [primo, secondo] = classifica(g, 'eci', e.anno);
    const anno = annoTesto(g, e.anno);
    if (primo?.zona === k) {
      frase = secondo
        ? `${e.modello} ha la capacità più alta del ${anno}: ${eci(e.v)} ECI, ${nf(e.v - secondo.v, 1)} punti più del migliore ${di(g.zone[secondo.zona].con_articolo)}.`
        : `${e.modello} ha la capacità più alta del ${anno}: ${eci(e.v)} ECI.`;
    } else if (primo) {
      frase = `Il miglior modello ${delModello(z)}, ${e.modello}, ha ${eci(e.v)} ECI nel ${anno}: ${nf(primo.v - e.v, 1)} punti sotto ${primo.modello} (${g.zone[primo.zona].nome}).`;
    }
  }
  const righe = [c ? rigaCalcolo(g, k, c) : 'Calcolo: nessun modello di grande scala.'];
  const inCorso = c && c.anno !== g.anno_corrente ? rigaAnnoInCorso(g, k) : null;
  if (inCorso) righe.push(inCorso);
  righe.push(...soloOrg(z));
  const altrove = contanoAltrove(k, z);
  if (altrove) righe.push(altrove);
  return {
    titolo: z.tipo === 'paese-ue' ? `${z.nome}, nell'UE` : z.nome,
    frase,
    capacita: cifra(g, e, eci),
    calcolo: c && { ...cifra(g, c, flop)!, nota: copertura(g, k, c.anno) },
    righe,
  };
}

/** Fonte sotto la card (ticket 06, Q15). */
export const citeGeo = (g: Geopoliticai): Cite => [
  { t: 'Fonte: Epoch AI, ' }, { t: 'Data on AI models', href: g.url_modelli }, { t: ' ed ' },
  { t: 'Epoch Capabilities Index', href: g.url_eci }, { t: ' (' }, { t: g.licenza, href: 'https://creativecommons.org/licenses/by/4.0/' },
  { t: `), aggregati per area da AI Radar. Dati scaricati ${dayWith('il', g.scaricato)}.` },
];

/** La frase della card in home: l'UE contro USA e Cina, nello stesso anno. */
export function fraseFaccia(g: Geopoliticai, y: number): string | null {
  const ue = valore(g, 'ue', 'eci', y);
  if (!ue) return null;
  const altri = (['usa', 'cina'] as const).flatMap((k) => valore(g, k, 'eci', y) ?? []);
  const confronto = altri.map((v, i) => {
    const z = g.zone[v.zona];
    if (i > 0) return `${z.con_articolo} a ${eci(v.v)}`;
    return `${capitalize(z.con_articolo)} ${v.zona === 'usa' ? 'arrivano' : 'arriva'} a ${eci(v.v)}`;
  });
  return `Capacità del miglior modello europeo, ${ue.modello}, nel ${annoTesto(g, y)}.${confronto.length ? ` ${confronto.join(', ')}.` : ''}`;
}
