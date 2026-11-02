import {
  MOVE_MIN, computeGrowth, newsInLastDays, nextDeadline, nextReport, owidLatest, owidPrev, radarChanges, radarRows, settoreScelto, ultimoAnno,
  type RadarRowM,
} from '../data/derive';
import { quota } from '../data/geopoliticai';
import type { AiActItem, Dataset, Quadrant, Ruolo } from '../data/types';
import { CHI_ADDESTRA, faccia } from './geopoliticai';
import { slug, type Params, type TileId } from '../router';
import { capitalize, dayWith, daysTo, lowerFirst, monthName, monthYear, nf, per10k, short, signedPct, ym } from './format';

export interface Face { fig: string; unit: string; sent: string }
export type TitleParts = { t: string; em?: boolean }[];
export interface Head { title: TitleParts; deck: string | null; nota?: string } // nota: riga piccola sotto il sottotitolo

const TIPI: Record<string, string> = {
  'image-text-to-text': 'immagine e testo',
  'text-generation': 'generazione di testo',
  'text-to-image': 'da testo a immagine',
  'image-to-image': 'da immagine a immagine',
  'image-to-text': 'da immagine a testo',
  'image-to-video': 'da immagine a video',
  'video-to-video': 'da video a video',
  'text-to-audio': 'da testo ad audio',
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
/** Verbo accordato ai nomi brevi: plurale con più competenze o con un nome plurale («Multimodali entrano»). */
const verbo = (rows: { plurale?: boolean }[], sing: string, plur: string): string =>
  rows.length > 1 || rows[0]?.plurale ? plur : sing;

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
      deck: `${w ? `Nel mondo ${art(w.v)}${nf(w.v, 0)}%. ` : ''}Stima di Microsoft ${dayWith('al', it.t)}.`,
    };
  }
  if (!w) return { title: plain('Persone e lavoro'), deck: null };
  return {
    title: [{ t: "Usa l'AI generativa il " }, { t: `${nf(w.v, 0)}%`, em: true }, { t: ' delle persone nel mondo' }],
    deck: `Manca il dato italiano. Stima di Microsoft ${dayWith('al', w.t)}.`,
  };
}

// ---------------------------------------------------------------- norme
export function faceNorme(d: Dataset, today: Date): Face | null {
  if (!d.ai_act?.scadenze?.length) return null;
  const n = nextDeadline(d.ai_act.scadenze, today);
  if (!n) return { fig: '0', unit: 'scadenze in arrivo', sent: "Nessuna scadenza dell'AI Act in arrivo." };
  const days = daysTo(n.data, today);
  return { fig: String(days), unit: days === 1 ? 'giorno' : 'giorni', sent: `Alla prossima scadenza dell'AI Act, ${dayWith('il', n.data)}: ${lowerFirst(n.titolo)}.` };
}
export function headNorme(d: Dataset, today: Date): Head {
  const n = nextDeadline(d.ai_act?.scadenze, today);
  if (!n) return { title: plain("Nessuna scadenza dell'AI Act in arrivo"), deck: null };
  const days = daysTo(n.data, today);
  return {
    title: [{ t: `${days} ${days === 1 ? 'giorno' : 'giorni'}`, em: true }, { t: " alla prossima scadenza dell'AI Act" }],
    deck: `${dayWith('Il', n.data)}: ${lowerFirst(n.titolo)}. ${n.descrizione}`,
  };
}

// ---------------------------------------------------------------- competenze
const MIN_ANNUNCI = 3; // ogni 10mila, la soglia del radar: sotto, un cambio non è una notizia per chi deve scegliere su cosa formarsi
/** Perché n competenze sono da imparare ora: la frase della card e del titolo. */
const perche = (n: number) => `${n === 1 ? "cresce più dell'AI e ha" : "crescono più dell'AI e hanno"} almeno ${MIN_ANNUNCI} annunci ogni 10mila`;
/** Chi è ancora in Impara ora ma per il calcolo del mese è già altrove: il quadrante cambia solo dopo due mesi, e la frase non può dire che cresce. */
function inBilico(rows: RadarRowM[]): string {
  return rows.filter((r) => r.quadrante === 'impara-ora' && r.moving).map((r) => {
    const motivo = r.moving === 'prova'
      ? `${verbo([r], 'ha', 'hanno')} meno di ${MIN_ANNUNCI} annunci ogni 10mila`
      : `${verbo([r], 'sta', 'stanno')} perdendo slancio (${signedPct(r.slancio)})`;
    return `${r.breve} ${motivo} e ${verbo([r], 'può', 'possono')} uscirne`;
  }).join('; ');
}
/** Chi entra e chi esce lo dice la porta Per te: la card dice quante sono, sotto il radar che le mostra. */
export function faceCompetenze(d: Dataset, _today?: Date): Face | null {
  const rows = d.radar ? radarRows(d.radar) : [];
  if (!rows.length) return null;
  const n = rows.filter((r) => r.quadrante === 'impara-ora').length;
  const quante = `${n} ${n === 1 ? 'competenza' : 'competenze'} su ${rows.length} da imparare ora`;
  const bilico = inBilico(rows);
  return { fig: String(n), unit: `su ${rows.length}`, sent: bilico ? `${quante}; ${bilico}.` : `${quante}: ${perche(n)}.` };
}
/** Etichetta del cambio di quadrante sul radar, sotto il nome breve. */
export const cambio = (r: RadarRowM, quadranti: Record<Quadrant, string>): string =>
  r.quadrante === 'impara-ora' ? `${verbo([r], 'entra', 'entrano')} in Impara ora`
    : r.qp === 'impara-ora' ? `${verbo([r], 'esce', 'escono')} da Impara ora`
      : `${verbo([r], 'passa', 'passano')} a ${quadranti[r.quadrante]}`;
export function headCompetenze(d: Dataset, _today?: Date): Head {
  const rows = d.radar ? radarRows(d.radar) : [];
  if (!rows.length) return { title: plain('Competenze'), deck: null };
  const { inn, out } = radarChanges(rows);
  const n = rows.filter((r) => r.quadrante === 'impara-ora').length;
  const bilico = inBilico(rows);
  const quante = `Oggi ${n === 1 ? '1 competenza' : `${n} competenze`} su ${rows.length}`;
  const tail = bilico ? `${quante} ${n === 1 ? 'è' : 'sono'} in Impara ora; ${bilico}.` : `${quante} ${perche(n)}.`;
  if (!inn.length && !out.length) return { title: plain('Nessun cambio tra le competenze da imparare ora'), deck: tail };
  if (!inn.length) return { title: [{ t: joinE(out.map((r) => r.breve)), em: true }, { t: ` ${verbo(out, 'esce', 'escono')} da Impara ora` }], deck: tail };
  return {
    title: [{ t: joinE(inn.map((r) => r.breve)), em: true }, { t: ` ${verbo(inn, 'entra', 'entrano')} tra le competenze da imparare ora` }],
    deck: (out.length ? `${joinE(out.map((r) => r.breve))} ${verbo(out, 'esce', 'escono')} da Impara ora. ` : '') + tail,
  };
}

/** Titolo della pagina di una competenza: il nome; sotto, quadrante, da dove viene se è appena cambiato, eventuale movimento e descrizione. */
export function headSkill(r: RadarRowM, quadranti: Record<Quadrant, string>, ruoli: Ruolo[] = []): Head {
  const moving = r.moving ? `, in movimento verso ${quadranti[r.moving]}` : '';
  const prima = r.changed && r.qp ? `, un mese fa ${quadranti[r.qp]}` : '';
  const conta = ruoli.filter((x) => r.ruoli?.includes(x.id)).map((x) => x.nome).join(', '); // nell'ordine dei ruoli
  return { title: plain(r.nome), deck: `${quadranti[r.quadrante]}${prima}${moving}. ${r.descrizione}`, ...(conta && { nota: `Conta per: ${conta}` }) };
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
    deck: `Solo titolo, data e link agli articoli originali. L'elenco copre gli ultimi ${d.news.giorni} giorni, da ${fontiDi(d.news.notizie)}.`,
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

// ---------------------------------------------------------------- geopoliticai
/** Sempre l'UE, anche con un'altra area scelta nel dettaglio (ticket 04, Q12). */
export function faceGeopoliticai(d: Dataset, _today?: Date): Face | null {
  return d.geopoliticai ? faccia(d.geopoliticai) : null;
}
export function headGeopoliticai(d: Dataset, _today?: Date): Head {
  if (!d.geopoliticai) return { title: plain('GeopoliticAI'), deck: null };
  return {
    title: [{ t: 'Chi costruisce i modelli più potenti, ' }, { t: "e dov'è l'Europa", em: true }],
    deck: "Calcolo di addestramento e capacità dei modelli AI per area, dal 2020. Un modello conta per il Paese della prima organizzazione che l'ha sviluppato.",
  };
}

// ---------------------------------------------------------------- porte della home
// Ogni porta mostra la prima notizia che i dati permettono, in ordine di priorità (spec, sezione 5).
export interface Door {
  title: TitleParts; // vuoto se non ci sono dati
  meta: string; // fonte e data del dato
  target: { tema: TileId; elemento: string | null; params?: Params } | null; // null: porta non cliccabile
  scelta?: string; // nome del ruolo o del settore ricordato, per l'etichetta (Per te · Prodotto)
}
const NO_DATA: Door = { title: [], meta: 'Dati non ancora disponibili', target: null };

/** "A", "A e B", "A, B e C", con i nomi in evidenza. */
const names = (rows: RadarRowM[]): TitleParts =>
  rows.flatMap((r, i) => [...(i === 0 ? [] : [{ t: i === rows.length - 1 ? ' e ' : ', ' }]), { t: r.breve, em: true }]);

// Regole 1-4 della porta Per te: la prima che scatta su queste competenze, con la competenza a cui porta.
function notiziaRadar(sure: RadarRowM[], quadranti: Record<Quadrant, string>): { title: TitleParts; competenza: RadarRowM } | null {
  // 1. entrate e uscite da Impara ora
  const { inn, out } = radarChanges(sure);
  if (inn.length || out.length) {
    const title: TitleParts = [];
    if (inn.length) title.push(...names(inn), { t: ` ${verbo(inn, 'entra', 'entrano')} tra le competenze da imparare ora` });
    if (out.length) {
      if (inn.length) title.push({ t: '; ' });
      title.push(...names(out), { t: ` ${verbo(out, 'esce', 'escono')}${inn.length ? '' : ' da Impara ora'}` });
    }
    return { title, competenza: inn[0] ?? out[0] };
  }

  const cercate = sure.filter((r) => r.domanda >= MIN_ANNUNCI);

  // 2. altri cambi di quadrante
  const changed = cercate.filter((r) => r.changed).sort((a, b) => b.move - a.move);
  if (changed.length) {
    const dest = changed[0].quadrante;
    const who = changed.every((r) => r.quadrante === dest) ? changed : [changed[0]];
    return { title: [...names(who), { t: ` ${verbo(who, 'passa', 'passano')} a ${quadranti[dest]}` }], competenza: who[0] };
  }

  // 3. lo spostamento più grande, se almeno MOVE_MIN (un decimo dell'asse). Sullo slancio, il valore di un mese fa
  // dentro il margine di oggi non è una notizia: i due numeri non si distinguono
  const suSlancio = (r: RadarRowM) => Math.abs(r.dS) >= Math.abs(r.dD);
  const dentroMargine = ({ sp, slancio_margine: m }: RadarRowM) => sp != null && !!m && sp >= m[0] && sp <= m[1];
  const big = cercate.filter((r) => r.hasPrev && r.move >= MOVE_MIN && !(suSlancio(r) && dentroMargine(r))).sort((a, b) => b.move - a.move)[0];
  if (big) {
    const title: TitleParts = suSlancio(big)
      ? [{ t: 'Slancio di ' }, { t: big.breve, em: true }, { t: ` da ${signedPct(big.sp as number)} a ${signedPct(big.slancio)}` }]
      : [{ t: 'Domanda di ' }, { t: big.breve, em: true }, { t: ` da ${per10k(big.dp as number)} a ${per10k(big.domanda)} annunci ogni 10mila` }];
    return { title, competenza: big };
  }

  // 4. la competenza con più slancio, se cresce più dell'AI
  const top = cercate.slice().sort((a, b) => b.slancio - a.slancio)[0];
  if (top && top.slancio > 0) return { title: [{ t: top.breve, em: true }, { t: ` ${verbo([top], 'cresce', 'crescono')} più di tutte: ${signedPct(top.slancio)} sull'AI in 6 mesi` }], competenza: top };
  return null;
}

/** Con un ruolo ricordato le regole si provano prima sulle sue competenze, poi su tutte (spec Ruoli, sezione 6). */
export function doorPerTe(d: Dataset, _today?: Date, ruoloId: string | null = null): Door {
  const rows = d.radar ? radarRows(d.radar) : [];
  if (!d.radar || !rows.length) return NO_DATA;
  const meta = `Radar delle competenze · dati ${dayWith('al', d.radar.generato)}`;
  // i dati incerti non fanno notizia (spec Radar 2.0, 7.4)
  const sure = rows.filter((r) => !r.incerto);
  const ruolo = d.radar.ruoli?.find((r) => r.id === ruoloId) ?? null; // un ruolo sconosciuto: come senza
  const conRuolo = ruolo ? { scelta: ruolo.nome } : {};
  const to = (r: RadarRowM | null): Door['target'] => ({ tema: 'competenze', elemento: r?.id ?? null, ...(ruolo && { params: { ruolo: ruolo.id } }) });

  const notizia = (ruolo && notiziaRadar(sure.filter((r) => r.ruoli?.includes(ruolo.id)), d.radar.quadranti)) || notiziaRadar(sure, d.radar.quadranti);
  if (notizia) return { title: notizia.title, meta, target: to(notizia.competenza), ...conRuolo };

  // 5. riserva, quando nessuna regola scatta. Senza ruolo quante competenze sono da imparare ora lo dice già la card:
  // la porta dice la competenza con più annunci, se non è incerta
  const piuCercata = rows.slice().sort((a, b) => b.domanda - a.domanda)[0];
  if (!ruolo && !piuCercata.incerto) {
    const title: TitleParts = [{ t: piuCercata.breve, em: true }, { t: ` ${verbo([piuCercata], 'ha', 'hanno')} più annunci di tutte: ${per10k(piuCercata.domanda)} ogni 10mila` }];
    return { title, meta, target: to(piuCercata) };
  }
  // altrimenti, quante competenze da imparare ora: con un ruolo, quante delle sue
  const base = ruolo ? rows.filter((r) => r.ruoli?.includes(ruolo.id)) : rows;
  const daImparare = base.filter((r) => r.quadrante === 'impara-ora').length;
  const quante = ruolo ? `${daImparare} delle ${base.length} competenze di ${ruolo.nome}` : `${daImparare} ${daImparare === 1 ? 'competenza' : 'competenze'} su ${rows.length}`;
  return { title: [{ t: quante, em: true }, { t: ' da imparare ora' }], meta, target: to(null), ...conRuolo };
}

const SOON = 30; // giorni: scadenze vicine, rapporti in arrivo
/** La riga meta di un dato: una fonte che non dice quando si è aggiornata resta senza data. */
const aggiornato = (fonte: string, iso: string | null | undefined): string => (iso ? `${fonte} · aggiornato ${dayWith('il', iso)}` : fonte);

/** Con un settore ricordato la regola 2 dice prima il dato del settore (spec Settori, sezione 6). */
export function doorItalia(d: Dataset, today: Date, settoreId: string | null = null): Door {
  const ahead = (iso: string) => daysTo(iso, today);
  const scad = (d.ai_act?.scadenze ?? []).slice().sort((a, b) => a.data.localeCompare(b.data));
  const scadenza = (s: AiActItem): Door => {
    const n = ahead(s.data);
    return {
      title: [{ t: n === 0 ? 'Oggi' : n === 1 ? 'Domani' : `Tra ${n} giorni`, em: true }, { t: `: ${lowerFirst(s.titolo)}` }],
      meta: `AI Act · scadenza ${dayWith('del', s.data)}`,
      target: { tema: 'norme', elemento: s.data },
    };
  };

  // 1. una scadenza entro 30 giorni (anche oggi)
  const near = scad.find((s) => ahead(s.data) >= 0 && ahead(s.data) <= SOON);
  if (near) return scadenza(near);

  // 2. il dato italiano, anche se non è appena uscito: Eurostat (prima il settore ricordato), poi uso dell'AI generativa (OWID)
  const es = d.eurostat_settori;
  const settore = settoreScelto(es, settoreId); // «Tutti» o un settore sconosciuto: come senza
  const g = settore && es?.adozione[settore.id];
  const anno = g && ultimoAnno([g.IT, g.EU27_2020]);
  if (settore && g && anno && g.IT[anno] != null) {
    const ue = g.EU27_2020[anno];
    return {
      title: [{ t: `${nf(g.IT[anno], 0)}% ${settore.nella_frase} italiane`, em: true }, { t: ` usa l'AI${ue != null ? ` (UE: ${nf(ue, 0)}%)` : ''}` }],
      meta: aggiornato('Eurostat', es.aggiornato_eurostat),
      target: { tema: 'business', elemento: null, params: { settore: settore.id } },
      scelta: settore.nome,
    };
  }
  const e = impreseUe(d);
  if (e?.it != null) {
    return {
      title: [{ t: `${nf(e.it, 0)}% delle imprese italiane`, em: true }, { t: ` usa l'AI (UE: ${nf(e.v, 0)}%)` }],
      meta: aggiornato('Eurostat', d.eurostat?.aggiornato_eurostat),
      target: { tema: 'business', elemento: null },
    };
  }
  const it = owidLatest(d.owid, 'uso_genai', 'Italy');
  if (it) {
    const w = owidLatest(d.owid, 'uso_genai', 'World');
    return {
      title: [{ t: `${nf(it.v, 0)}% degli italiani`, em: true }, { t: ` usa l'AI generativa${w ? ` (mondo: ${nf(w.v, 0)}%)` : ''}` }],
      meta: aggiornato('Microsoft via Our World in Data', d.owid?.serie?.uso_genai?.aggiornato_owid),
      target: { tema: 'persone', elemento: null },
    };
  }

  // 3. senza un dato italiano, GeopoliticAI: quanti modelli di grande scala dell'anno in corso sono europei, o dell'ultimo anno chiuso se nell'anno in corso
  // non ce n'è ancora nessuno
  const geo = d.geopoliticai;
  const q = geo && [geo.anno_corrente, geo.anno_corrente - 1].map((y) => ({ y, ...quota(geo, 'ue', y) })).find((x) => x.tot > 0);
  if (geo && q) {
    const pct = (100 * q.n) / q.tot;
    const finora = q.y === geo.anno_corrente ? ', finora' : '';
    return {
      title: q.n
        ? [{ t: `${q.n} dei ${q.tot}`, em: true }, { t: ` modelli di grande scala del ${q.y} ${q.n === 1 ? 'è europeo' : 'sono europei'} (${nf(pct, pct < 1 ? 1 : 0)}%)${finora}` }]
        : [{ t: `Nessuno dei ${q.tot}`, em: true }, { t: ` modelli di grande scala del ${q.y} è europeo${finora}` }],
      meta: `Epoch AI · dati scaricati ${dayWith('il', geo.scaricato)}`,
      target: { tema: 'geopoliticai', elemento: CHI_ADDESTRA, params: { area: 'ue' } },
    };
  }

  // 4. riserva: la prossima scadenza, anche lontana
  const dopo = scad.find((s) => ahead(s.data) > 0);
  if (dopo) return scadenza(dopo);

  // 5. un rapporto previsto entro 30 giorni: la data è un mese stimato, viene dopo tutto quello che è un fatto
  const r = nextReport(d.rapporti, today);
  if (r && r.ym <= ym(new Date(today.getTime() + SOON * 864e5))) {
    const mese = monthName(r.ym);
    return {
      title: [{ t: `${mese.startsWith('a') ? 'Ad' : 'A'} ${mese} esce ` }, { t: r.report.nome, em: true }],
      meta: 'Data stimata, dai rapporti degli anni scorsi',
      target: { tema: 'rapporti', elemento: slug(r.report.nome) },
    };
  }
  return NO_DATA;
}
