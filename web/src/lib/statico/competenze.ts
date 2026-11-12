// Le pagine statiche delle competenze: una per competenza di radar.json, con i dati di oggi, per chi arriva da un motore di ricerca o senza JavaScript.
// Non sono edizioni: si rifanno a ogni build. Le parole e le cifre sono quelle della pagina della competenza nell'app.
import { competenzeDi, rigaPagina, type RigaPagina } from '../data/derive';
import type { Radar } from '../data/types';
import { fontiDi } from '../edizioni/fonti';
import { toHash } from '../router';
import { dayWith, parseDay, per10k, quantiAnnunci, signedPct } from '../text/format';
import { avvisoIncerto, dettagliSlancio, ITALIA_SENZA_DATO, statoCompetenza } from '../text/frasi';
import { METODO_COMPETENZE } from '../text/metodo';
import { esc, IMMAGINE, IMMAGINE_HOME, pagina, rigaFonti, type OpzioniPagine } from './pagina';

type Competenza = Radar['competenze'][number];

const titolo = (c: Competenza): string => `${c.nome} negli annunci di lavoro, in Italia e all’estero · AI Radar`;

/** La competenza letta sui due mercati insieme: la pagina statica non ha i bottoni per scegliere. */
interface DueMercati { tutti: RigaPagina; italia: RigaPagina }

/** Dove sta la competenza in ciascun mercato, con i nomi dei mercati dei bottoni dell'app. Senza il dato italiano resta la frase dell'app, che lo dice già. */
function stato({ tutti, italia }: DueMercati, r: Radar): string {
  return `<p>Tutti i Paesi: ${esc(statoCompetenza(tutti, r.quadranti))}</p>
<p>${italia.senzaDato ? esc(`${ITALIA_SENZA_DATO}.`) : `Italia: ${esc(statoCompetenza(italia, r.quadranti))}`}</p>`;
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
<h3>Italia</h3>
${italia.senzaDato ? `<p>${esc(`${ITALIA_SENZA_DATO}.`)}</p>` : domandaDi(italia, true)}
</section>
<section>
<h2>Slancio</h2>
${cifra(signedPct(tutti.slancio), ` ${unita}`, note)}
</section>`;
}

const RADICE = '../../';
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
  return pagina({
    titolo: titolo(c),
    descrizione: descrizione(c, misure, r),
    percorso,
    radice: RADICE,
    nav: `<a href="${RADICE}">Dati di oggi</a>`,
    tipo: 'article',
    immagine: { percorso: `${percorso}${IMMAGINE}`, alt: IMMAGINE_HOME.alt },
    corpo: `<div class="ed-testa">
<h1>${esc(c.nome)}</h1>
${misure ? stato(misure, r) : `<p>${SENZA_DATI}</p>`}
<p>${esc(c.descrizione)}</p>
<p class="ed-nota">Dati raccolti ${esc(dayWith('il', r.generato))}. La pagina mostra sempre i dati più recenti e si aggiorna ogni lunedì.</p>
${misure?.tutti.incerto ? `<p class="ed-avviso" role="note">${esc(avvisoIncerto(misure.tutti))}</p>` : ''}
</div>
${misure ? misureDi(misure) : ''}
${inFondo(c, r)}`,
  }, opzioni);
}

/** Le immagini di anteprima che le pagine delle competenze si aspettano, per percorso: la build ci mette quella della home, il workflow quella della competenza. */
export const immaginiDelleCompetenze = (radar: Radar | undefined): string[] =>
  radar ? competenzeDi(radar).map((c) => `competenze/${c.id}/${IMMAGINE}`) : [];

/** Le pagine delle competenze, per percorso. Senza radar.json, o con quello della pipeline vecchia che l'app non legge, non ne nasce nessuna. */
export function fileDelleCompetenze(radar: Radar | undefined, opzioni: OpzioniPagine): Record<string, string> {
  if (!radar) return {};
  return Object.fromEntries(competenzeDi(radar).map((c) => [`competenze/${c.id}/index.html`, paginaCompetenza(c, radar, opzioni)]));
}
