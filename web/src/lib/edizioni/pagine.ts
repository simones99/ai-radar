// Le pagine delle edizioni e l'archivio, e il testo di un'edizione che la voce del feed riusa.
// Ogni pagina è HTML statico, senza JavaScript, sul foglio di stile della home: token, font e testata hanno una sola fonte.
import { ICONA } from '../icona';
import { toHash, type TileId } from '../router';
import { day, dayWith } from '../text/format';
import { cifraConUnita, cifraNellaFrase, eCardNotizie, portaConDati, testoPorta, type CardFissa, type Destinazione, type Edizione, type Fonte, type PortaFissa } from './tipi';

export interface OpzioniPagine {
  /** L'indirizzo pubblico del sito, con la barra finale: da qui nascono gli indirizzi assoluti. */
  indirizzoBase: string;
  /** Il foglio di stile della home, relativo alla radice del sito: il suo nome cambia a ogni build. */
  foglio: string;
}

/** Il foglio di stile che la build ha dato alla home, relativo alla radice del sito. */
export function foglioDellaHome(html: string): string {
  const link = html.match(/<link\b[^>]*\brel="stylesheet"[^>]*>/)?.[0];
  const href = link?.match(/\bhref="(?:\.\/)?([^"]+)"/)?.[1];
  if (!href) throw new Error('La home non ha un foglio di stile: le pagine delle edizioni non saprebbero quale usare.');
  return href;
}

// I titoli delle notizie arrivano da fonti esterne, e un'edizione corretta a mano può contenere di tutto: niente entra nella pagina senza passare da qui.
export const esc = (s: string): string => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

/** L'indirizzo se è http o https, altrimenti null: il resto non diventa un link. */
function linkSicuro(url: string | null): string | null {
  if (!url) return null;
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol) ? url.trim() : null;
  } catch {
    return null;
  }
}
const linkEsterno = (url: string | null, testo: string): string => {
  const sicuro = linkSicuro(url);
  return sicuro ? `<a href="${esc(sicuro)}" target="_blank" rel="noopener">${esc(testo)}</a>` : esc(testo);
};

/** Il link a una card nasce dalla destinazione salvata: il router riconosce anche i vecchi id. radice: la radice del sito vista da dove sta il link. */
const hrefCard = (d: Destinazione, radice: string): string => esc(`${radice}${toHash(d.card as TileId, d.elemento, d.params)}`);
export const titoloPagina = (e: Edizione): string => `AI Radar, settimana ${dayWith('del', e.settimana)}`;

function rigaFonti(fonti: Fonte[]): string {
  if (!fonti.length) return '';
  const elenco = fonti.map((f) => `${linkEsterno(f.url, f.nome)} (${esc(f.licenza)})`).join(', ');
  return `<p class="ed-fonte">${fonti.length === 1 ? 'Fonte' : 'Fonti'}: ${elenco}.</p>`;
}

/** Una porta in una riga, dove non c'è spazio per altro: chi la vede fuori dalla pagina non deve scambiare una frase ripetuta per una novità. */
const portaInBreve = (p: PortaFissa): string => `${testoPorta(p)}${p.cambiata ? '' : ' (nessun cambio)'}`;

/** Né le porte né le frasi diverse dall'edizione precedente; la prima edizione non ha con cosa confrontarsi. */
const senzaNovita = (e: Edizione): boolean => !!e.precedente && !e.porte.some((p) => p.cambiata) && !e.card.some((c) => c.cambiata);

function porta(p: PortaFissa, radice: string): string {
  const titolo = p.titolo.map((x) => (x.em ? `<em>${esc(x.t)}</em>` : esc(x.t))).join('');
  const notizia = portaConDati(p) && p.destinazione ? `<p class="ed-notizia"><a href="${hrefCard(p.destinazione, radice)}">${titolo}</a></p>` : '';
  return `<article class="ed-porta">
<h2>${esc(p.nome)} <span>${esc(p.etichetta)}</span></h2>
${notizia}
${portaConDati(p) && !p.cambiata ? '<p class="ed-ripetuta">Nessun cambio qui dalla settimana scorsa</p>' : ''}
${p.nota ? `<p class="ed-nota">${esc(p.nota)}</p>` : ''}
<p class="ed-fonte">${esc(p.meta)}</p>
${rigaFonti(p.fonti)}
</article>`;
}

/** La cifra in un paragrafo suo, grande con l'unità piccola come in home: messa nella frase, si leggeva «47 Notizie nei 7 giorni». */
function cifraGrande(c: Pick<CardFissa, 'cifra' | 'unita'>): string {
  return c.cifra ? `<p class="ed-cifra"><strong>${esc(c.cifra)}</strong>${esc(cifraConUnita(c).slice(c.cifra.length))}</p>` : '';
}

function rigaCard(c: CardFissa, radice: string): string {
  return `<li>
<h4><a href="${hrefCard(c.destinazione, radice)}">${esc(c.nome)}</a></h4>
${cifraNellaFrase(c) ? '' : cifraGrande(c)}
<p>${esc(c.frase ?? '')}</p>
${c.era ? `<p class="ed-nota">${esc(c.era)}</p>` : ''}
${rigaFonti(c.fonti)}
</li>`;
}

/** Le righe di una testa: chi decide in un'organizzazione deve vedere dove comincia la sua parte, e trovarci anche ciò che non è cambiato. */
function frasiDellaTesta(p: PortaFissa, card: CardFissa[], radice: string): string {
  const proprie = card.filter((c) => c.testa === p.id);
  const conDati = proprie.filter((c) => c.frase != null);
  const righe = conDati.filter((c) => c.cambiata);
  const invariate = conDati.filter((c) => !c.cambiata);
  const senzaDati = proprie.filter((c) => c.frase == null);
  const elenco = (xs: CardFissa[]) => xs.map((c) => `<a href="${hrefCard(c.destinazione, radice)}">${esc(c.nome)}</a>`).join(', ');
  return `<div class="ed-gruppo">
<h3>${esc(p.nome)} <span>${esc(p.etichetta)}</span></h3>
${righe.length ? `<ul class="ed-righe">\n${righe.map((c) => rigaCard(c, radice)).join('\n')}\n</ul>` : ''}
${invariate.length ? `<p class="ed-nota">Invariate: ${elenco(invariate)}.</p>` : ''}
${senzaDati.length ? `<p class="ed-nota">Dati non disponibili: ${elenco(senzaDati)}.</p>` : ''}
</div>`;
}

function frasi(e: Edizione, radice: string): string {
  const card = e.card.filter((c) => !eCardNotizie(c));
  const titolo = !e.precedente ? 'La situazione'
    : card.some((c) => c.frase != null && c.cambiata) ? 'Cambiato dalla settimana scorsa'
      : senzaNovita(e) ? 'Nulla è cambiato dalla settimana scorsa' : 'Nessuna frase è cambiata dalla settimana scorsa';
  return `<section>
<h2>${titolo}</h2>
${e.precedente ? `<p class="ed-nota">Rispetto alla <a href="${esc(`${radice}edizioni/${e.precedente}/`)}">settimana ${esc(dayWith('del', e.precedente))}</a>.</p>` : ''}
${e.porte.map((p) => frasiDellaTesta(p, card, radice)).join('\n')}
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

/** Il nome dell'immagine di un'edizione nel sito, nella cartella della sua pagina. */
export const IMMAGINE = 'anteprima.png';
/** L'immagine fissa della home, con il testo alternativo che ha in index.html: l'archivio non ne ha una propria. */
const IMMAGINE_HOME = { percorso: 'anteprima.png', alt: "Il marchio di AI Radar con la frase: cosa succede nell'AI ogni settimana, su cosa formarti e come si muove l'AI in Italia." };

/** Il link con cui un lettore di feed trova il feed partendo da una pagina. */
export const linkAlFeed = (indirizzoBase: string): string => `<link rel="alternate" type="application/rss+xml" title="${esc(TITOLO_ARCHIVIO)}" href="${esc(`${indirizzoBase}feed.xml`)}" />`;

/** Lo scheletro comune delle pagine. radice: la radice del sito vista dalla pagina; percorso: la pagina vista dalla radice. */
function pagina(o: { titolo: string; descrizione: string; percorso: string; radice: string; nav: string; corpo: string; tipo: 'article' | 'website'; immagine: { percorso: string; alt: string } }, opzioni: OpzioniPagine): string {
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${esc(o.titolo)}</title>
<meta name="description" content="${esc(o.descrizione)}" />
<link rel="canonical" href="${esc(`${opzioni.indirizzoBase}${o.percorso}`)}" />
<meta property="og:title" content="${esc(o.titolo)}" />
<meta property="og:description" content="${esc(o.descrizione)}" />
<meta property="og:url" content="${esc(`${opzioni.indirizzoBase}${o.percorso}`)}" />
<meta property="og:image" content="${esc(`${opzioni.indirizzoBase}${o.immagine.percorso}`)}" />
<meta property="og:image:alt" content="${esc(o.immagine.alt)}" />
<meta property="og:type" content="${o.tipo}" />
<meta property="og:locale" content="it_IT" />
<meta property="og:site_name" content="AI Radar" />
<meta name="twitter:card" content="summary_large_image" />
${linkAlFeed(opzioni.indirizzoBase)}
<link rel="icon" href="${esc(ICONA)}" />
<link rel="stylesheet" href="${esc(`${o.radice}${opzioni.foglio}`)}" />
</head>
<body>
<a class="skip" href="#contenuto">Vai al contenuto</a>
<div class="edizione">
<header class="testata">
<a class="logo" href="${o.radice}"><i aria-hidden="true"></i>AI Radar</a>
<nav aria-label="Pagina">${o.nav}<a href="${o.radice}feed.xml">Segui con RSS</a></nav>
</header>
<main id="contenuto" tabindex="-1">
${o.corpo}
</main>
<footer><p class="ed-nota">Il progetto non è affiliato a nessuna delle fonti.</p></footer>
</div>
</body>
</html>
`;
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
${e.porte.map((p) => porta(p, radice)).join('\n')}
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

export const TITOLO_ARCHIVIO = 'AI Radar, le edizioni';
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
