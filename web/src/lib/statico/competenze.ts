// Le pagine statiche delle competenze: una per competenza di radar.json, con i dati di oggi, per chi arriva da un motore di ricerca o senza JavaScript.
// Non sono edizioni: si rifanno a ogni build. Le parole e le cifre sono quelle della pagina della competenza nell'app.
import { competenzeDi, pubblicatoDi, rigaPagina, type RigaPagina } from '../data/derive';
import type { Quadrant, Radar } from '../data/types';
import { fontiDi } from '../edizioni/fonti';
import { toHash } from '../router';
import { dayWith, isDay, parseDay, per10k, quantiAnnunci, signedPct } from '../text/format';
import { avvisoIncerto, contaPer, DATI_NON_DISPONIBILI, dettagliSlancio, ITALIA_SENZA_DATO, statoCompetenza } from '../text/frasi';
import { IN_CRESCITA, MERCATI, meseDelPercorso, type TestiParte, metaRepository, metaRisorsa, METODO_COMPETENZE, PER_INIZIARE, PERCORSO } from '../text/competenza';
import { esc, IMMAGINE, IMMAGINE_HOME, INDICE_COMPETENZE, linkEsterno, pagina, rigaFonti, type OpzioniPagine } from './pagina';

type Competenza = Radar['competenze'][number];

export const TITOLO_INDICE = 'Le competenze sull’AI negli annunci di lavoro, in Italia e all’estero · AI Radar';
const titolo = (c: Competenza): string => `${c.nome} negli annunci di lavoro, in Italia e all’estero · AI Radar`;

/** La competenza letta sui due mercati insieme: la pagina statica non ha i bottoni per scegliere. */
interface DueMercati { tutti: RigaPagina; italia: RigaPagina }

/** Dove sta la competenza in ciascun mercato, con i nomi dei mercati dei bottoni dell'app. Senza il dato italiano resta la frase dell'app, che lo dice già. */
function stato({ tutti, italia }: DueMercati, r: Radar): string {
  return `<p>${MERCATI.tutti}: ${esc(statoCompetenza(tutti, r.quadranti))}</p>
<p>${italia.senzaDato ? esc(`${ITALIA_SENZA_DATO}.`) : `${MERCATI.italia}: ${esc(statoCompetenza(italia, r.quadranti))}`}</p>`;
}

/** Una cifra grande con l'unità piccola, come nelle edizioni, e sotto le note: valore di un mese fa, annunci, margine. */
const cifra = (valore: string, unita: string, note: string[]): string =>
  `<p class="ed-cifra"><strong>${esc(valore)}</strong>${esc(unita)}</p>${note.length ? `
<p class="ed-nota">${esc(note.join(' · '))}</p>` : ''}`;

/** La domanda di un mercato: la cifra con l'unità, gli annunci dietro il dato italiano e il valore di un mese fa. */
const domandaDi = (r: RigaPagina, annunci: boolean): string =>
  cifra(per10k(r.domanda), ' annunci ogni 10mila', [...(annunci && r.annunci != null ? [quantiAnnunci(r.annunci)] : []), ...(r.dp != null ? [`era ${per10k(r.dp)} un mese fa`] : [])]);

function misureDi({ tutti, italia }: DueMercati): string {
  const { unita, note } = dettagliSlancio(tutti);
  return `<section>
<h2>Domanda</h2>
<h3>Paese a metà classifica</h3>
${domandaDi(tutti, false)}
<h3>${MERCATI.italia}</h3>
${italia.senzaDato ? `<p>${esc(`${ITALIA_SENZA_DATO}.`)}</p>` : domandaDi(italia, true)}
</section>
<section>
<h2>Slancio</h2>
${cifra(signedPct(tutti.slancio), ` ${unita}`, note)}
</section>`;
}

/** Il quadrante di ogni mese dello storico, con tutti i Paesi e in Italia: dove manca un mercato la cella lo dice con un trattino, e se manca in tutti i mesi lo dice la frase dell'app. */
function percorsoSulRadar(c: Competenza, r: Radar): string {
  const mesi = (r.storico ?? []).map((p) => ({ mese: p.mese, tutti: pubblicatoDi(p.competenze[c.id], 'tutti'), italia: pubblicatoDi(p.competenze[c.id], 'italia') }))
    .filter((m) => m.tutti || m.italia);
  const cella = (q: (typeof mesi)[number]['tutti']) => (q ? esc(r.quadranti[q]) : '—');
  const tabella = mesi.length ? `<table>
<thead><tr><th scope="col">Mese</th><th scope="col">${MERCATI.tutti}</th><th scope="col">${MERCATI.italia}</th></tr></thead>
<tbody>
${mesi.map((m) => `<tr><th scope="row">${esc(meseDelPercorso(m.mese))}</th><td>${cella(m.tutti)}</td><td>${cella(m.italia)}</td></tr>`).join('\n')}
</tbody>
</table>
${mesi.some((m) => m.italia) ? '' : `<p class="ed-nota">${esc(`${ITALIA_SENZA_DATO}.`)}</p>`}` : `<p>${esc(PERCORSO.vuota)}</p>`;
  return `<section>
<h2>${esc(PERCORSO.titolo)}</h2>
<p class="ed-nota">${esc(PERCORSO.nota)}</p>
${tabella}
</section>`;
}

/** Una sezione con il suo titolo e la nota dell'app; senza voci la frase dell'app, come nella pagina della competenza. */
function elenco(testi: TestiParte, voci: string[]): string {
  return `<section>
<h2>${esc(testi.titolo)}</h2>
<p class="ed-nota">${esc(testi.nota)}</p>
${voci.length ? `<ul class="ed-voci">\n${voci.join('\n')}\n</ul>` : `<p>${esc(testi.vuota)}</p>`}
</section>`;
}

// Risorse e repository vengono da fuori: titoli, descrizioni e indirizzi passano tutti dall'escape e dai link sicuri.

/** Le risorse scelte a mano per iniziare, con tipo e lingua. */
const perIniziare = (c: Competenza): string =>
  elenco(PER_INIZIARE, (c.per_iniziare ?? []).map((x) => `<li>${linkEsterno(x.url, x.titolo)} <span class="ed-fonte">${esc(metaRisorsa(x))}</span></li>`));

/** I repository nuovi più stellati con il suo topic, con stelle, data e descrizione. */
const inCrescita = (c: Competenza): string =>
  elenco(IN_CRESCITA, (c.in_crescita ?? []).map((x) => `<li>${linkEsterno(x.url, x.nome)} <span class="ed-fonte">${esc(metaRepository(x))}</span>${x.descrizione ? ` <span class="ed-nota">${esc(x.descrizione)}</span>` : ''}</li>`));

const RADICE = '../../';
/** I link della testata di una pagina delle competenze, prima di «Segui con RSS»: le edizioni, se esistono, e i dati di oggi nell'app. */
const navDelleCompetenze = (radice: string, opzioni: OpzioniPagine): string =>
  `${opzioni.linkAlleEdizioni ? `<a href="${radice}edizioni/">Edizioni</a>` : ''}<a href="${radice}">Dati di oggi</a>`;
/**
 * Il giorno dei dati, AAAA-MM-GG: quello che le pagine dichiarano e la sitemap dà come ultimo cambio. Null se generato non comincia
 * con un giorno che esiste: una data illeggibile, o impossibile come il 30 febbraio, che non va scritta come se fosse un'altra.
 */
export function giornoDeiDati(r: Radar): string | null {
  const giorno = r.generato.slice(0, 10);
  return isDay(giorno) ? giorno : null;
}
/** La data dei dati, in testa alle pagine e all'indice: non sono fissi come un'edizione. Senza un giorno valido la data non si scrive. */
function datiRaccolti(r: Radar): string {
  const giorno = giornoDeiDati(r);
  return `${giorno ? `Dati raccolti ${dayWith('il', giorno)}. ` : ''}La pagina mostra sempre i dati più recenti e si aggiorna ogni lunedì.`;
}
/** Quanto di una descrizione un motore di ricerca mostra per intero. */
const DESCRIZIONE_MAX = 160;
/** Al posto delle misure, quando la competenza non sta sul radar nemmeno con tutti i Paesi: la pagina resta, perché un link salvato non si rompa. */
const SENZA_DATI = 'I dati di questa competenza non sono disponibili questa settimana.';

/**
 * Fonti e metodo, e i due modi di aprire la competenza nell'app: lì ci sono i grafici e le scelte. Le fonti sono quelle della card, come nelle edizioni;
 * il metodo è lo stesso testo della card, per intero: chi arriva da fuori non deve aprire l'app per sapere come nasce un numero.
 */
function inFondo(c: Competenza, r: Radar): string {
  const app = (params = {}) => esc(`${RADICE}${toHash('competenze', c.id, params)}`);
  const nome = esc(c.breve || c.nome);
  return `<section>
<h2>Fonti e metodo</h2>
${rigaFonti(fontiDi({ radar: r }, parseDay(r.generato), { card: 'competenze', elemento: null }))}
<ul class="ed-voci">
${METODO_COMPETENZE.map((m) => `<li class="ed-nota">${esc(m)}</li>`).join('\n')}
</ul>
</section>
<section>
<h2>Nell’app</h2>
<p><a href="${app()}">Apri ${nome} nell’app, con i grafici</a></p>
<p><a href="${app({ mercato: 'italia' })}">Apri ${nome} nell’app, sul mercato Italia</a></p>
</section>`;
}

/** In testa le misure, che cambiano, poi la competenza: se non c'entra tutto si accorcia lei, a parola intera. */
function descrizione(c: Competenza, misure: DueMercati | null, r: Radar): string {
  let testa = `${SENZA_DATI} `;
  if (misure) {
    const { tutti, italia } = misure;
    const domanda = `Domanda: ${per10k(tutti.domanda)} annunci ogni 10mila nel Paese a metà classifica`;
    testa = italia.senzaDato
      ? `${r.quadranti[tutti.quadrante]} con tutti i Paesi. ${ITALIA_SENZA_DATO}. ${domanda}. `
      : `${r.quadranti[tutti.quadrante]} con tutti i Paesi, ${r.quadranti[italia.quadrante]} in Italia. ${domanda}, ${per10k(italia.domanda)} in Italia. `;
  }
  const intera = `${testa}${c.descrizione}`;
  if (intera.length <= DESCRIZIONE_MAX) return intera;
  const spazio = DESCRIZIONE_MAX - testa.length - 1; // il posto per «…»
  const pezzo = c.descrizione.slice(0, spazio + 1);
  // a parola intera; una parola sola più lunga dello spazio si taglia dove finisce lo spazio
  const tagliata = (/\s/.test(pezzo) ? pezzo.replace(/\s+\S*$/, '') : pezzo.slice(0, spazio)).replace(/[\s,;:.]+$/, '');
  return tagliata ? `${testa}${tagliata}…` : testa.trim();
}

function paginaCompetenza(c: Competenza, r: Radar, opzioni: OpzioniPagine): string {
  const percorso = `competenze/${c.id}/`;
  const tutti = rigaPagina(r, c.id);
  const italia = rigaPagina(r, c.id, 'italia');
  const misure = tutti && italia ? { tutti, italia } : null;
  const conta = contaPer(c.ruoli, r.ruoli ?? []);
  return pagina({
    titolo: titolo(c),
    descrizione: descrizione(c, misure, r),
    percorso,
    radice: RADICE,
    nav: navDelleCompetenze(RADICE, opzioni),
    tipo: 'article',
    immagine: { percorso: `${percorso}${IMMAGINE}`, alt: testoAlternativo(anteprimaDi(c, r)) },
    corpo: `<div class="ed-testa">
<h1>${esc(c.nome)}</h1>
${misure ? stato(misure, r) : `<p>${SENZA_DATI}</p>`}
<p>${esc(c.descrizione)}</p>
${conta && `<p class="ed-nota">${esc(conta)}</p>`}
<p class="ed-nota">${esc(datiRaccolti(r))}</p>
${misure?.tutti.incerto ? `<p class="ed-avviso" role="note">${esc(avvisoIncerto(misure.tutti))}</p>` : ''}
</div>
${misure ? misureDi(misure) : ''}
${percorsoSulRadar(c, r)}
${perIniziare(c)}
${inCrescita(c)}
${inFondo(c, r)}`,
  }, opzioni);
}

/** Un gruppo dell'indice: il titolo e le voci, ognuna con il link alla sua pagina e, sotto, la riga sull'Italia se c'è. */
function gruppo(titolo: string, voci: { c: Competenza; italia: string | null }[]): string {
  return `<section>
<h2>${esc(titolo)}</h2>
<ul class="ed-archivio">
${voci.map(({ c, italia }) => `<li>
<h3><a href="${esc(c.id)}/">${esc(c.nome)}</a></h3>
${italia ? `<p>${esc(italia)}</p>` : ''}
</li>`).join('\n')}
</ul>
</section>`;
}

/**
 * I gruppi dell'indice: uno per quadrante con tutti i Paesi, nell'ordine dei quadranti di radar.json e, dentro, delle competenze.
 * Accanto a ogni competenza il quadrante in Italia, o la frase dell'app; le competenze fuori dal radar stanno in fondo.
 */
function gruppiDellIndice(r: Radar): string {
  const voci = competenzeDi(r).map((c) => ({ c, tutti: rigaPagina(r, c.id), italia: rigaPagina(r, c.id, 'italia') }));
  const conDati = (Object.keys(r.quadranti) as Quadrant[]).flatMap((q) => {
    const nelQuadrante = voci.filter((v) => v.tutti?.quadrante === q);
    return nelQuadrante.length ? [gruppo(r.quadranti[q], nelQuadrante.map(({ c, italia }) => ({
      c, italia: !italia || italia.senzaDato ? `${ITALIA_SENZA_DATO}.` : `${MERCATI.italia}: ${r.quadranti[italia.quadrante]}`,
    })))] : [];
  });
  const senzaDati = voci.filter((v) => !v.tutti).map(({ c }) => ({ c, italia: null }));
  return [...conDati, ...(senzaDati.length ? [gruppo(DATI_NON_DISPONIBILI, senzaDati)] : [])].join('\n');
}

/** L'indice delle competenze: da qui si arriva a ogni pagina, anche partendo da un'edizione. */
function indice(r: Radar, opzioni: OpzioniPagine): string {
  return pagina({
    titolo: TITOLO_INDICE,
    descrizione: `Le ${competenzeDi(r).length} competenze sull’AI che il radar segue, con tutti i Paesi e in Italia: ricerca, open source e annunci di lavoro. Si aggiorna ogni lunedì.`,
    percorso: INDICE_COMPETENZE,
    radice: '../',
    nav: navDelleCompetenze('../', opzioni),
    tipo: 'website',
    immagine: IMMAGINE_HOME,
    corpo: `<div class="ed-testa">
<h1>Competenze</h1>
<p class="ed-nota">${esc(datiRaccolti(r))}</p>
</div>
${gruppiDellIndice(r)}`,
  }, { ...opzioni, linkAlleCompetenze: false }); // l'indice non porta a se stesso
}

/**
 * Un mercato nell'anteprima: il nome del bottone dell'app e il quadrante, o che il dato manca. In una riga sola, quindi senza ITALIA_SENZA_DATO.
 * Il tono: «caldo» per Impara ora, in evidenza come sul radar dell'app, «manca» per il dato che non c'è.
 */
export interface MercatoInAnteprima { nome: string; testo: string; tono: 'caldo' | 'manca' | null }
/**
 * Cosa mostra l'immagine di anteprima di una competenza, e quindi il suo testo alternativo. Nessuna cifra: in un post, senza unità e contesto, si leggerebbe male.
 * La data è null quando generato non ha un giorno valido: come le pagine, l'immagine allora non ne scrive nessuna.
 */
export interface Anteprima { id: string; nome: string; data: string | null; mercati: [MercatoInAnteprima, MercatoInAnteprima] }

function anteprimaDi(c: Competenza, r: Radar): Anteprima {
  const tutti = rigaPagina(r, c.id);
  const italia = rigaPagina(r, c.id, 'italia');
  const mercato = (nome: string, q: Quadrant | null): MercatoInAnteprima =>
    ({ nome, testo: q ? r.quadranti[q] : DATI_NON_DISPONIBILI, tono: !q ? 'manca' : q === 'impara-ora' ? 'caldo' : null });
  const giorno = giornoDeiDati(r);
  return {
    id: c.id,
    nome: c.nome,
    data: giorno ? `Dati ${dayWith('del', giorno)}` : null,
    // senza tutti i Paesi la pagina non ha misure, nemmeno quelle italiane: l'immagine fa lo stesso
    mercati: [mercato(MERCATI.tutti, tutti?.quadrante ?? null), mercato(MERCATI.italia, tutti && italia && !italia.senzaDato ? italia.quadrante : null)],
  };
}

/** Il testo alternativo dell'anteprima: le stesse cose dell'immagine, nello stesso ordine. Se l'immagine non si è potuta fare resta questo, sopra il segnaposto. */
const testoAlternativo = (a: Anteprima): string =>
  `${a.nome} su AI Radar. ${a.mercati.map((m) => `${m.nome}: ${m.testo}.`).join(' ')}${a.data ? ` ${a.data}.` : ''}`;

/**
 * Le immagini di anteprima che le pagine delle competenze si aspettano, con il percorso e cosa devono mostrare:
 * la build ci mette quella della home, il comando delle anteprime quella della competenza.
 */
export const anteprimeDelleCompetenze = (radar: Radar | undefined): { percorso: string; anteprima: Anteprima }[] =>
  radar ? competenzeDi(radar).map((c) => ({ percorso: `competenze/${c.id}/${IMMAGINE}`, anteprima: anteprimaDi(c, radar) })) : [];

/** Se le pagine delle competenze nascono: serve un radar.json della pipeline nuova con almeno una competenza. */
export const nasconoLePagineDelleCompetenze = (radar: Radar | undefined): boolean => !!radar && competenzeDi(radar).length > 0;

/** Le pagine delle competenze, per percorso. Senza radar.json, o con quello della pipeline vecchia che l'app non legge, non ne nasce nessuna. */
export function fileDelleCompetenze(radar: Radar | undefined, opzioni: OpzioniPagine): Record<string, string> {
  if (!radar || !nasconoLePagineDelleCompetenze(radar)) return {};
  return {
    'competenze/index.html': indice(radar, opzioni),
    ...Object.fromEntries(competenzeDi(radar).map((c) => [`competenze/${c.id}/index.html`, paginaCompetenza(c, radar, opzioni)])),
  };
}
