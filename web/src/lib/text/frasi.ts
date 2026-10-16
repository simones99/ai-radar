import {
  computeGrowth, newsInLastDays, nextDeadline, nextReport, owidLatest, owidPrev, radarChanges, radarRows,
} from '../data/derive';
import type { Dataset } from '../data/types';
import { capitalize, day, daysTo, exact, lowerFirst, monthName, monthYear, nf, short } from './format';

export interface Face { fig: string; unit: string; sent: string }
export type TitleParts = { t: string; em?: boolean }[];
export interface Head { title: TitleParts; deck: string | null }

const TIPI: Record<string, string> = {
  'image-text-to-text': 'immagine e testo',
  'text-generation': 'generazione di testo',
  'text-to-image': 'da testo a immagine',
  'text-classification': 'classificazione di testo',
  'text-to-speech': 'sintesi vocale',
  'automatic-speech-recognition': 'riconoscimento vocale',
  'image-text-to-video': 'da immagine e testo a video',
  'text-to-video': 'da testo a video',
  'feature-extraction': 'embedding',
  'any-to-any': 'multimodale',
  altro: 'altro',
};
export const tipoLabel = (k: string): string => TIPI[k] ?? k;
const joinE = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`);
const plain = (t: string): TitleParts => [{ t }];

// ---------------------------------------------------------------- modelli
export function faceModelli(d: Dataset, _today?: Date): Face | null {
  const g = d.epoch ? computeGrowth(d.epoch.punti) : null;
  return g && { fig: `×${nf(g.fattore, 1)}`, unit: "all'anno", sent: 'Quanto cresce il calcolo per addestrare i modelli di frontiera, dal 2018.' };
}
export function headModelli(d: Dataset, _today?: Date): Head {
  const g = d.epoch ? computeGrowth(d.epoch.punti) : null;
  if (!g) return { title: plain('Modelli e ricerca'), deck: null };
  return {
    title: [{ t: 'Il calcolo dei modelli di frontiera cresce di ' }, { t: `${nf(g.fattore, 1)} volte`, em: true }, { t: " all'anno" }],
    deck: `Stima su ${g.n} modelli di frontiera dal 2018, dai dati di Epoch AI.`,
  };
}

// ---------------------------------------------------------------- open source
function topTipo(d: Dataset): [string, number] | null {
  const e = Object.entries(d.huggingface?.tipi_top100 ?? {}).filter(([k]) => k !== 'altro').sort((a, b) => b[1] - a[1]);
  return e[0] ?? null;
}
export function faceOpen(d: Dataset, _today?: Date): Face | null {
  const t = topTipo(d);
  return t && { fig: String(t[1]), unit: 'su 100', sent: `Modelli di tendenza su Hugging Face di tipo «${tipoLabel(t[0])}».` };
}
export function headOpen(d: Dataset, _today?: Date): Head {
  const t = topTipo(d);
  if (!t) return { title: plain('Open source'), deck: null };
  const first = d.huggingface?.top[0]?.id;
  return {
    title: [{ t: 'Tra i modelli di tendenza vince il tipo ' }, { t: tipoLabel(t[0]), em: true }],
    deck: `${t[1]} dei 100 modelli più seguiti questa settimana su Hugging Face.${first ? ` Il primo è ${first}.` : ''}`,
  };
}

// ---------------------------------------------------------------- business
// Numero chiave e titolo: imprese italiane che usano l'AI (Eurostat, CC BY 4.0), interi.
// Senza Eurostat il titolo resta sugli investimenti AI Index (CC BY-ND 4.0): importi brevi, nessun rapporto tra anni.

/** Articolo davanti a una percentuale intera: "l'8%", "l'11%", "l'80%", "il 16%". */
const art = (v: number): string => {
  const n = Math.round(v);
  return n === 1 || n === 8 || n === 11 || (n >= 80 && n <= 89) ? "l'" : 'il ';
};

function impreseUe(d: Dataset) {
  const s = d.eurostat?.serie;
  const ue = s?.EU27_2020;
  if (!ue) return null;
  const anni = Object.keys(ue).sort();
  const t = anni[anni.length - 1];
  const prev = anni[anni.length - 2];
  if (!t) return null;
  return { t, v: ue[t], prev: prev ? { t: prev, v: ue[prev], it: s?.IT?.[prev] ?? null } : null, it: s?.IT?.[t] ?? null };
}
export function faceBusiness(d: Dataset, _today?: Date): Face | null {
  const e = impreseUe(d);
  if (!e) return null;
  if (e.it == null) return { fig: nf(e.v, 0), unit: '%', sent: `Imprese dell'UE che usano l'AI nel ${e.t}; manca il dato italiano.` };
  return { fig: nf(e.it, 0), unit: '%', sent: `Imprese italiane che usano l'AI nel ${e.t}. UE: ${nf(e.v, 0)}%.` };
}
export function headBusiness(d: Dataset, _today?: Date): Head {
  const e = impreseUe(d);
  if (e?.it != null) {
    return {
      title: [{ t: `${nf(e.it, 0)}%`, em: true }, { t: " delle imprese italiane usa l'AI" }],
      deck: `Nel ${e.t}, imprese con almeno 10 addetti. UE: ${nf(e.v, 0)}%.` +
        (e.prev?.it != null ? ` Nel ${e.prev.t} in Italia ${art(e.prev.it)}${nf(e.prev.it, 0)}%.` : ''),
    };
  }
  const last = owidLatest(d.owid, 'investimenti_privati', 'World');
  if (!last) return { title: plain('Business'), deck: null };
  const prev = owidPrev(d.owid, 'investimenti_privati', 'World');
  return {
    title: [{ t: `Investimenti privati in AI nel ${last.t}: ` }, { t: `${short(last.v)} $`, em: true }],
    deck: 'A prezzi 2021, in aziende AI non quotate.' + (prev ? ` Nel ${prev.t}: ${short(prev.v)} $.` : '') + ' B = miliardi.',
  };
}

// ---------------------------------------------------------------- persone
export function facePersone(d: Dataset, _today?: Date): Face | null {
  const w = owidLatest(d.owid, 'uso_genai', 'World');
  const it = owidLatest(d.owid, 'uso_genai', 'Italy');
  if (it) return { fig: nf(it.v, 0), unit: '%', sent: "Italiani che usano l'AI generativa." + (w ? ` Mondo: ${nf(w.v, 0)}%.` : '') };
  if (w) return { fig: nf(w.v, 0), unit: '%', sent: "Persone nel mondo che usano l'AI generativa; manca il dato italiano." };
  return null;
}
export function headPersone(d: Dataset, _today?: Date): Head {
  const w = owidLatest(d.owid, 'uso_genai', 'World');
  const it = owidLatest(d.owid, 'uso_genai', 'Italy');
  if (it) {
    return {
      title: [{ t: "Usa l'AI generativa il " }, { t: `${nf(it.v, 0)}%`, em: true }, { t: ' degli italiani' }],
      deck: `${w ? `Nel mondo ${art(w.v)}${nf(w.v, 0)}%. ` : ''}Stima di Microsoft al ${day(it.t)}.`,
    };
  }
  if (!w) return { title: plain('Persone e lavoro'), deck: null };
  return {
    title: [{ t: "Usa l'AI generativa il " }, { t: `${nf(w.v, 0)}%`, em: true }, { t: ' delle persone nel mondo' }],
    deck: `Manca il dato italiano. Stima di Microsoft al ${day(w.t)}.`,
  };
}

// ---------------------------------------------------------------- norme
export function faceNorme(d: Dataset, today: Date): Face | null {
  if (!d.ai_act?.scadenze?.length) return null;
  const n = nextDeadline(d.ai_act.scadenze, today);
  if (!n) return { fig: '0', unit: 'scadenze in arrivo', sent: "Nessuna scadenza dell'AI Act in arrivo." };
  const days = daysTo(n.data, today);
  return { fig: String(days), unit: days === 1 ? 'giorno' : 'giorni', sent: `Alla prossima scadenza dell'AI Act, il ${day(n.data)}: ${lowerFirst(n.titolo)}.` };
}
export function headNorme(d: Dataset, today: Date): Head {
  const n = nextDeadline(d.ai_act?.scadenze, today);
  if (!n) return { title: plain("Nessuna scadenza dell'AI Act in arrivo"), deck: null };
  const days = daysTo(n.data, today);
  return {
    title: [{ t: `${days} ${days === 1 ? 'giorno' : 'giorni'}`, em: true }, { t: " alla prossima scadenza dell'AI Act" }],
    deck: `Il ${day(n.data)}: ${lowerFirst(n.titolo)}. ${n.descrizione}`,
  };
}

// ---------------------------------------------------------------- competenze
export function faceCompetenze(d: Dataset, _today?: Date): Face | null {
  const rows = d.radar ? radarRows(d.radar) : [];
  if (!rows.length) return null;
  const { inn, out } = radarChanges(rows);
  if (inn.length) {
    return {
      fig: inn.map((r) => r.breve).join(', '), unit: '',
      sent: `${inn.length > 1 ? 'Entrano' : 'Entra'} tra le competenze da imparare ora` +
        (out.length ? `; ${out.map((r) => r.breve).join(', ')} ${out.length > 1 ? 'escono' : 'esce'}.` : '.'),
    };
  }
  const n = rows.filter((r) => r.quadrante === 'impara-ora').length;
  return { fig: String(n), unit: `su ${rows.length}`, sent: 'Competenze da imparare ora: sopra la mediana sia per slancio sia per domanda.' };
}
export function headCompetenze(d: Dataset, _today?: Date): Head {
  const rows = d.radar ? radarRows(d.radar) : [];
  if (!rows.length) return { title: plain('Competenze'), deck: null };
  const { inn, out } = radarChanges(rows);
  const n = rows.filter((r) => r.quadrante === 'impara-ora').length;
  const tail = `Oggi ${n} competenze su ${rows.length} sono sopra la mediana sia per slancio sia per domanda.`;
  if (!inn.length) return { title: plain('Nessun cambio tra le competenze da imparare ora'), deck: tail };
  return {
    title: [{ t: joinE(inn.map((r) => r.breve)), em: true }, { t: ` ${inn.length > 1 ? 'entrano' : 'entra'} tra le competenze da imparare ora` }],
    deck: (out.length ? `${joinE(out.map((r) => r.breve))} ${out.length > 1 ? 'escono' : 'esce'} da Impara ora. ` : '') + tail,
  };
}

// ---------------------------------------------------------------- notizie
/** "N fonti": le fonti distinte tra le notizie date, non i feed configurati. */
const fontiDi = (items: { fonte: string }[]): string => {
  const k = new Set(items.map((x) => x.fonte)).size;
  return `${k} ${k === 1 ? 'fonte' : 'fonti'}`;
};
export function faceNotizie(d: Dataset, today: Date): Face | null {
  if (!d.news) return null;
  const week = newsInLastDays(d.news, today);
  if (!week.length) return { fig: '0', unit: '', sent: 'Nessuna notizia negli ultimi 7 giorni.' };
  return { fig: String(week.length), unit: '', sent: `Notizie negli ultimi 7 giorni da ${fontiDi(week)}.` };
}
export function headNotizie(d: Dataset, today: Date): Head {
  if (!d.news) return { title: plain('Notizie'), deck: null };
  const n = newsInLastDays(d.news, today).length;
  return {
    title: [{ t: String(n), em: true }, { t: n === 1 ? ' notizia in una settimana' : ' notizie in una settimana' }],
    deck: `Solo titolo, data e link agli articoli originali, da ${fontiDi(d.news.notizie)}.`,
  };
}

// ---------------------------------------------------------------- rapporti
export function faceRapporti(d: Dataset, today: Date): Face | null {
  if (!d.rapporti?.rapporti?.length) return null;
  const n = nextReport(d.rapporti, today);
  if (!n) return { fig: '—', unit: '', sent: 'Nessun rapporto previsto nei prossimi mesi.' };
  return { fig: capitalize(monthName(n.ym)), unit: n.ym.slice(0, 4), sent: `Prossimo rapporto previsto: ${n.report.nome}.` };
}
export function headRapporti(d: Dataset, today: Date): Head {
  const n = nextReport(d.rapporti, today);
  if (!n) return { title: plain('Rapporti periodici sull’AI'), deck: 'Solo link e date: nessuna sintesi.' };
  return {
    title: [{ t: 'Prossimo rapporto: ' }, { t: n.report.nome, em: true }],
    deck: `Previsto per ${monthYear(n.ym)}: è una stima. Qui trovi solo link e date, nessuna sintesi.`,
  };
}

// ---------------------------------------------------------------- tesi della home
// Solo dati che cambiano ogni settimana (i modelli di tendenza su Hugging Face) o quasi (il radar),
// mai un valore annuale: la home racconta la settimana.
export function heroThesis(d: Dataset, today: Date): TitleParts {
  const parts: TitleParts = [];
  const top = d.huggingface?.top[0];
  if (top) {
    const [org, name] = top.id.includes('/') ? top.id.split('/', 2) : ['', top.id];
    parts.push({ t: 'Il modello più seguito della settimana su Hugging Face è ' }, { t: name, em: true }, { t: org ? ` di ${org}.` : '.' });
  }
  const rows = d.radar ? radarRows(d.radar) : [];
  const { inn } = radarChanges(rows);
  if (inn.length) {
    if (parts.length) parts.push({ t: ' ' });
    parts.push({ t: joinE(inn.map((r) => r.breve)), em: true }, { t: ` ${inn.length > 1 ? 'entrano' : 'entra'} tra le competenze da imparare ora.` });
  }
  void today;
  return parts.length ? parts : plain("Cosa succede nell'AI questa settimana.");
}
