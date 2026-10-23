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
export const volte = (r: number): string =>
  r < 10 ? nf(r, 1) : String(Number(r.toPrecision(2))).replace(/\B(?=(\d{3})+$)/g, '.'); // «2.400», non «2400» come darebbe nf
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
/** Nelle schede con i vuoti le aree si dicono con il nome, i Paesi UE con l'aggettivo: «del Regno Unito», «tedesco». */
const chi = (z: GeoZona): string => (z.tipo === 'area' ? di(z.con_articolo) : (z.aggettivo ?? `di ${z.nome}`));
const elenco = (xs: string[]): string => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`);

export interface Cifra {
  fig: string;
  sotto: string;
  /** sotto la cifra del calcolo: per quanti modelli è noto */
  nota?: string;
}
/** Le cinque situazioni della scheda, nell'ordine in cui si controllano (spec, «La scheda dell'area»). */
export type Situazione = 'zero' | 'vecchi' | 'calcolo' | 'prima' | 'insegue';
export interface Scheda {
  titolo: string;
  situazione: Situazione;
  /** la frase in grassetto in testa */
  frase: string;
  capacita: Cifra | null;
  calcolo: Cifra | null;
  /** al posto della cifra del calcolo, quando non c'è: mai 0, mai una cella vuota */
  calcoloVuoto: string;
  /** la riga del calcolo e le righe di contesto */
  righe: string[];
  /** la nota fissa, in corsivo dopo le righe */
  nota: string | null;
  /** a zero: il testo del link alla mappa */
  mappa: string | null;
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

/** L'ultimo anno con modelli di grande scala ma senza il calcolo noto di nessuno: «2 modelli di grande scala». */
function senzaCalcolo(z: GeoZona): { n: number; anno: number } | null {
  const y = Object.keys(z.calcolo).map(Number).sort((a, b) => b - a).find((a) => z.calcolo[String(a)].n > 0);
  return y == null ? null : { n: z.calcolo[String(y)].n, anno: y };
}
const modelliGs = (n: number): string => `${n} ${n === 1 ? 'modello' : 'modelli'} di grande scala`;

/** In «Altri» si nomina la Corea del Sud, finché è il Paese che lì dentro pesa di più (ticket 06, Q5). */
function corea(g: Geopoliticai): string | null {
  const [primo, n] = Object.entries(g.altri_paesi)[0] ?? [];
  return primo === 'South Korea' ? `In «Altri» il Paese con più modelli di grande scala è la Corea del Sud: ${n} dal 2020.` : null;
}

/** Nota fissa, finché il Regno Unito non ha un valore nell'ultimo anno chiuso. */
const NOTA_UK = 'Epoch attribuisce Google DeepMind, che ha sede a Londra, agli USA: i suoi modelli contano lì.';

/** Nota fissa, finché l'Italia è a zero. */
const NOTA_ITALIA = 'Epoch non conta nessun modello italiano: Minerva (Sapienza), Velvet (Almawave) e i modelli di iGenius non sono nel suo database.';

/** «Nell'UE la frontiera è Mistral AI, in Francia: 150,0 ECI nel 2026, anno in corso.» */
function frontieraUe(g: Geopoliticai): string | null {
  const e = ultimo(g, 'ue', 'eci');
  if (!e) return null;
  const paese = Object.values(g.zone).find((z) => z.tipo === 'paese-ue' && z.eci[String(e.anno)]?.modello === e.modello);
  // l'organizzazione si nomina solo se è l'unica valutata nel suo Paese, altrimenti il modello
  const chi = paese?.org_eci.length === 1 ? paese.org_eci[0] : e.modello;
  return `Nell'UE la frontiera è ${chi}${paese ? `, in ${paese.nome}` : ''}: ${eci(e.v)} ECI nel ${annoTesto(g, e.anno)}.`;
}

/** La scheda di chi non ha nessun modello in nessun anno. */
function aZero(g: Geopoliticai, k: string): Scheda {
  const z = g.zone[k];
  const frontiera = z.tipo === 'paese-ue' ? frontieraUe(g) : null;
  return {
    titolo: z.tipo === 'paese-ue' ? `${z.nome}, nell'UE` : z.nome,
    situazione: 'zero',
    frase: k === 'italia' ? NOTA_ITALIA : `Epoch non conta nessun modello ${chi(z)}.`,
    capacita: null,
    calcolo: null,
    calcoloVuoto: 'nessun modello di grande scala',
    righe: frontiera ? [frontiera] : [],
    nota: null,
    mappa: `Dove sta ${z.con_articolo} nella catena dell'AI →`,
  };
}

/** La scheda di un'area o di un Paese UE: la capacità decide la frase, il calcolo ha sempre la sua riga. */
export function scheda(g: Geopoliticai, k: string): Scheda {
  const z = g.zone[k];
  const ha = (r: Record<string, { n: number }>) => Object.values(r).some((v) => v.n > 0);
  if (!ha(z.eci) && !ha(z.calcolo)) return aZero(g, k);
  const e = ultimo(g, k, 'eci');
  const c = ultimo(g, k, 'calcolo');
  const chiuso = g.anno_corrente - 1;
  const recente = (r: Record<string, { n: number }>) => [chiuso, g.anno_corrente].some((y) => (r[String(y)]?.n ?? 0) > 0);
  let situazione: Situazione = 'insegue';
  let frase = 'Nessun modello valutato.';
  if (!recente(z.eci) && !recente(z.calcolo)) {
    situazione = 'vecchi';
    frase = z.tipo === 'area'
      ? `Dal ${chiuso} Epoch non ha modelli ${chi(z)}, né valutati né di grande scala.`
      : `Dal ${chiuso} Epoch non ha nessun modello ${chi(z)}, né valutato né di grande scala.`;
  } else if (!recente(z.eci) && recente(z.calcolo)) {
    situazione = 'calcolo';
    // se c'è una capacità vecchia, la frase la nomina
    frase = !e
      ? `Nessun modello ${chi(z)} è valutato dall'ECI.`
      : `Dal ${chiuso} l'ECI non valuta ${z.tipo === 'area' ? 'modelli' : 'nessun modello'} ${chi(z)}: l'ultimo è ${e.modello}, ${eci(e.v)} nel ${annoTesto(g, e.anno)}.`;
  } else if (e) {
    const [primo, secondo] = classifica(g, 'eci', e.anno);
    const anno = annoTesto(g, e.anno);
    if (primo?.zona === k) {
      situazione = 'prima';
      frase = secondo
        ? `${e.modello} ha la capacità più alta del ${anno}: ${eci(e.v)} ECI, ${nf(e.v - secondo.v, 1)} punti più del migliore ${di(g.zone[secondo.zona].con_articolo)}.`
        : `${e.modello} ha la capacità più alta del ${anno}: ${eci(e.v)} ECI.`;
    } else if (primo) {
      frase = `Il miglior modello ${delModello(z)}, ${e.modello}, ha ${eci(e.v)} ECI nel ${anno}: ${nf(primo.v - e.v, 1)} punti sotto ${primo.modello} (${g.zone[primo.zona].nome}).`;
    }
  }
  const senza = senzaCalcolo(z);
  const righe: string[] = [];
  if (situazione === 'vecchi') {
    // gli ultimi valori, senza la distanza dal primo
    const ultimi = [e && `${e.modello}, ${eci(e.v)} ECI nel ${annoTesto(g, e.anno)}`, c && `${c.modello}, ${flop(c.v)} FLOP nel ${annoTesto(g, c.anno)}`].filter(Boolean);
    if (ultimi.length) righe.push(`${ultimi.length > 1 ? 'Gli ultimi' : "L'ultimo"}: ${ultimi.join(', e ')}.`);
  } else {
    const calcolo = c ? rigaCalcolo(g, k, c)
      : senza ? `Calcolo: ${modelliGs(senza.n)} nel ${annoTesto(g, senza.anno)}, senza il calcolo noto.`
      : 'Calcolo: nessun modello di grande scala.';
    // senza capacità recente la frase non parla del calcolo: la sua riga si legge da sola
    righe.push(situazione === 'calcolo' ? capitalize(calcolo.replace(/^Calcolo: /, '')) : calcolo);
    const inCorso = c && c.anno !== g.anno_corrente ? rigaAnnoInCorso(g, k) : null;
    if (inCorso) righe.push(inCorso);
  }
  righe.push(...soloOrg(z));
  const altrove = contanoAltrove(k, z);
  if (altrove) righe.push(altrove);
  const coreana = k === 'altri' ? corea(g) : null;
  if (coreana) righe.push(coreana);
  return {
    titolo: z.tipo === 'paese-ue' ? `${z.nome}, nell'UE` : z.nome,
    situazione,
    frase,
    capacita: cifra(g, e, eci),
    calcolo: c && { ...cifra(g, c, flop)!, nota: copertura(g, k, c.anno) },
    calcoloVuoto: senza ? `${modelliGs(senza.n)}, senza il calcolo noto` : 'nessun modello di grande scala',
    righe,
    nota: k === 'uk' && !z.eci[String(chiuso)] && !z.calcolo[String(chiuso)]?.n ? NOTA_UK : null,
    mappa: null,
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
