// Le pagine delle edizioni e l'archivio, e il testo di un'edizione che la voce del feed riusa. Lo scheletro è quello di tutte le pagine statiche.
import { toHash, type TileId } from '../router';
import { esc, IMMAGINE, IMMAGINE_HOME, linkEsterno, pagina, TITOLO_DEL_FEED, type OpzioniPagine } from '../statico/pagina';
import { day, dayWith } from '../text/format';
import { cardDellaTesta, cifraGrande, porta, type LinkDellaDestinazione } from './porteECard';
import { eCardNotizie, portaConDati, testoPorta, type Edizione, type PortaFissa } from './tipi';

/** Il link a una card nasce dalla destinazione salvata: il router riconosce anche i vecchi id. radice: la radice del sito vista da dove sta il link. */
const versoLaCard = (radice: string): LinkDellaDestinazione => (destinazione) =>
  destinazione && `${radice}${toHash(destinazione.card as TileId, destinazione.elemento, destinazione.params)}`;
export const titoloPagina = (e: Edizione): string => `AI Radar, settimana ${dayWith('del', e.settimana)}`;

/** Una porta in una riga, dove non c'è spazio per altro: chi la vede fuori dalla pagina non deve scambiare una frase ripetuta per una novità. */
const portaInBreve = (p: PortaFissa): string => `${testoPorta(p)}${p.cambiata ? '' : ' (nessun cambio)'}`;

/** Né le porte né le frasi diverse dall'edizione precedente; la prima edizione non ha con cosa confrontarsi. */
const senzaNovita = (e: Edizione): boolean => !!e.precedente && !e.porte.some((p) => p.cambiata) && !e.card.some((c) => c.cambiata);

function frasi(e: Edizione, radice: string): string {
  const card = e.card.filter((c) => !eCardNotizie(c));
  const titolo = !e.precedente ? 'La situazione'
    : card.some((c) => c.frase != null && c.cambiata) ? 'Cambiato dalla settimana scorsa'
      : senzaNovita(e) ? 'Nulla è cambiato dalla settimana scorsa' : 'Nessuna frase è cambiata dalla settimana scorsa';
  return `<section>
<h2>${titolo}</h2>
${e.precedente ? `<p class="ed-nota">Rispetto alla <a href="${esc(`${radice}edizioni/${e.precedente}/`)}">settimana ${esc(dayWith('del', e.precedente))}</a>.</p>` : ''}
${e.porte.map((p) => cardDellaTesta(p, card, versoLaCard(radice))).join('\n')}
</section>`;
}

function notizie(e: Edizione, radice: string): string {
  const n = e.notizie;
  const card = e.card.find(eCardNotizie);
  // cifra e frase come salvate nel file fisso, così una correzione si vede. Con zero notizie la frase dice già «Nessuna notizia»
  const conteggio = card?.frase ? `<div class="ed-conteggio">\n${card.cifra && card.cifra !== '0' ? cifraGrande({ cifra: card.cifra, unita: null }) : ''}\n<p>${esc(card.frase)}</p>\n</div>` : '<p>Dati non disponibili.</p>';
  const temi = n.temi.map((t) => `<h3>${esc(t.nome)}</h3>
<ul class="ed-voci">
${t.voci.map((v) => `<li>${linkEsterno(v.link, v.titolo)} <span class="ed-fonte">${esc(v.fonte)} · ${esc(day(v.data))}</span></li>`).join('\n')}
</ul>`).join('\n');
  return `<section>
<h2>Notizie</h2>
${conteggio}
${n.temi.length ? `<p class="ed-nota">${esc(n.regola)} Di ogni notizia ci sono solo titolo, data e link all'articolo originale, nella sua lingua.</p>\n${temi}` : ''}
<p><a href="${esc(`${radice}${toHash('notizie')}`)}">Le altre notizie, nella card Notizie</a></p>
</section>`;
}

/** Una fonte in errore e una non configurata non hanno fatto la stessa cosa, ma a tutte e due mancano i dati di questo giro. */
function fontiNonAggiornate(e: Edizione): string {
  if (!e.fonti_non_aggiornate.length) return '<p class="ed-nota">Tutte le fonti hanno dati aggiornati questa settimana.</p>';
  const righe = e.fonti_non_aggiornate.map((f) => `<li>${esc(f.nome)}${f.ultimo_successo ? `: ultimo dato ${esc(dayWith('del', f.ultimo_successo))}` : ''}</li>`).join('\n');
  return `<section>
<h2>Senza dati aggiornati questa settimana</h2>
<ul class="ed-voci">
${righe}
</ul>
</section>`;
}

/**
 * Il testo di un'edizione, lo stesso nella pagina e nella voce del feed.
 * radice: la radice del sito vista dai link; intestazione: il titolo, che nella voce mostra già il lettore di feed.
 */
export function corpoEdizione(e: Edizione, radice: string, intestazione = ''): string {
  const correzioni = e.correzioni.map((c) => `<p class="ed-corretta"><strong>Corretta ${esc(dayWith('il', c.data))}:</strong> ${esc(c.testo)}</p>`).join('\n');
  return `<div class="ed-testa">
${intestazione}
<p class="ed-nota">Questa edizione resta com'è, con i dati raccolti ${esc(dayWith('il', e.raccolti))}. Il sito mostra i dati di oggi, quindi può dire altro.</p>
${senzaNovita(e) ? `<p class="ed-quieta">Settimana senza novità: le frasi sono quelle della settimana scorsa.${e.notizie.temi.length ? ' Qui sotto le notizie.' : ''}</p>` : ''}
${correzioni}
</div>
<div class="ed-porte">
${e.porte.map((p) => porta(p, versoLaCard(radice))).join('\n')}
</div>
${frasi(e, radice)}
${notizie(e, radice)}
${fontiNonAggiornate(e)}`;
}

export const descrizioneEdizione = (e: Edizione): string => e.porte.filter(portaConDati).map((p) => `${portaInBreve(p)}.`).join(' ');

/** Le edizioni accanto a questa nell'archivio. Solo nella pagina: nel lettore di feed le voci sono già in fila, e questi link cambiano quando ne esce una nuova. */
function altreEdizioni(precedente?: Edizione, successiva?: Edizione): string {
  const voce = (rel: 'prev' | 'next', nome: string, altra: Edizione) => `<a rel="${rel}" href="../${esc(altra.settimana)}/">Edizione ${nome}: settimana ${esc(dayWith('del', altra.settimana))}</a>`;
  const voci = [precedente && voce('prev', 'precedente', precedente), successiva && voce('next', 'successiva', successiva)].filter(Boolean);
  return voci.length ? `<nav class="ed-altre" aria-label="Altre edizioni">\n${voci.join('\n')}\n</nav>` : '';
}

export function paginaEdizione(e: Edizione, opzioni: OpzioniPagine, { precedente, successiva }: { precedente?: Edizione; successiva?: Edizione } = {}): string {
  const radice = '../../';
  return pagina({
    titolo: titoloPagina(e),
    descrizione: descrizioneEdizione(e),
    percorso: `edizioni/${e.settimana}/`,
    radice,
    nav: `<a href="../">Edizioni</a><a href="${radice}">Dati di oggi</a>`,
    corpo: corpoEdizione(e, radice, `<h1>Settimana ${esc(dayWith('del', e.settimana))}</h1>`) + altreEdizioni(precedente, successiva),
    tipo: 'article',
    immagine: {
      percorso: `edizioni/${e.settimana}/${IMMAGINE}`,
      alt: `${titoloPagina(e)}. ${e.porte.map((p) => `${p.nome}: ${portaConDati(p) ? portaInBreve(p) : p.meta}.`).join(' ')}`,
    },
  }, opzioni);
}

export const TITOLO_ARCHIVIO = TITOLO_DEL_FEED;
export const DESCRIZIONE_ARCHIVIO = 'Tutte le edizioni di AI Radar, dalla più recente: il riassunto fisso di ogni settimana, con quello che è cambiato e le notizie.';

export function archivio(edizioni: Edizione[], opzioni: OpzioniPagine): string {
  const voci = edizioni.map((e) => `<li>
<h2><a href="${esc(e.settimana)}/">Settimana ${esc(dayWith('del', e.settimana))}</a></h2>
${e.porte.map((p) => `<p><strong>${esc(p.nome)}:</strong> ${esc(portaConDati(p) ? portaInBreve(p) : p.meta)}</p>`).join('\n')}
</li>`).join('\n');
  return pagina({
    titolo: TITOLO_ARCHIVIO,
    descrizione: DESCRIZIONE_ARCHIVIO,
    percorso: 'edizioni/',
    radice: '../',
    nav: '<a href="../">Dati di oggi</a>',
    tipo: 'website',
    immagine: IMMAGINE_HOME,
    corpo: `<div class="ed-testa">
<h1>Edizioni</h1>
<p class="ed-nota">Il riassunto di ogni settimana. Esce il lunedì e dopo non cambia, salvo correzioni dichiarate.</p>
</div>
<ul class="ed-archivio">
${voci}
</ul>`,
  }, opzioni);
}
