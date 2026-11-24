// Lo scheletro delle pagine statiche del sito, e ciò che serve a ogni pagina per non far passare un testo o un link pericoloso.
// Ogni pagina è HTML statico, senza JavaScript, sul foglio di stile della home: token, font e testata hanno una sola fonte.
import { ICONA } from '../icona';
import { RIGA_SUL_CONTATORE } from '../text/contatore';
import { LICENZE } from '../tiles/cite';

/** Da dove viene un dato: il nome, l'indirizzo se c'è e la licenza con cui si riusa. */
export interface Fonte { nome: string; url: string | null; licenza: string }

export interface OpzioniPagine {
  /** L'indirizzo pubblico del sito, con la barra finale: da qui nascono gli indirizzi assoluti. */
  indirizzoBase: string;
  /** Il foglio di stile della home, relativo alla radice del sito: il suo nome cambia a ogni build. */
  foglio: string;
  /** La testata porta all'indice delle competenze: vale quando le loro pagine esistono, e non nell'indice stesso. È il link con cui un crawler le trova partendo da un'edizione. */
  linkAlleCompetenze?: boolean;
  /** Le edizioni esistono: le pagine che non ne fanno parte portano al loro archivio, e tutte portano al feed. Senza edizioni il feed non c'è, e nessun link ci porta. */
  linkAlleEdizioni?: boolean;
  /** In fondo c'è la riga che dice a chi legge come si contano le visite: va dove c'è lo script di Umami, e la mappa dei file pubblici la ricava dall'ID. */
  conLaRigaSulContatore?: boolean;
}

/** L'indice delle competenze, visto dalla radice del sito. */
export const INDICE_COMPETENZE = 'competenze/';

/** Il foglio di stile che la build ha dato alla home, relativo alla radice del sito. */
export function foglioDellaHome(html: string): string {
  const link = html.match(/<link\b[^>]*\brel="stylesheet"[^>]*>/)?.[0];
  const href = link?.match(/\bhref="(?:\.\/)?([^"]+)"/)?.[1];
  if (!href) throw new Error('La home non ha un foglio di stile: le pagine statiche non saprebbero quale usare.');
  return href;
}

// I testi arrivano anche da fonti esterne, e un file corretto a mano può contenere di tutto: niente entra nella pagina senza passare da qui.
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
export const linkEsterno = (url: string | null, testo: string): string => {
  const sicuro = linkSicuro(url);
  return sicuro ? `<a href="${esc(sicuro)}" target="_blank" rel="noopener">${esc(testo)}</a>` : esc(testo);
};

/** L'HTML dentro un link a un indirizzo del sito, o così com'è quando l'indirizzo non c'è. */
export const inLink = (href: string | null, html: string): string => (href ? `<a href="${esc(href)}">${html}</a>` : html);

/** La riga sul contatore delle visite, per il piè di pagina di una pagina che vede la radice del sito in radice: il link porta alla pagina Privacy, nella stessa scheda. */
export const rigaSulContatore = (radice: string): string =>
  `<p class="ed-nota">${esc(RIGA_SUL_CONTATORE.testo)} ${inLink(`${radice}${RIGA_SUL_CONTATORE.link.percorso}`, esc(RIGA_SUL_CONTATORE.link.testo))}</p>`;

export function rigaFonti(fonti: Fonte[]): string {
  if (!fonti.length) return '';
  const elenco = fonti.map((f) => `${linkEsterno(f.url, f.nome)} (${linkEsterno(LICENZE[f.licenza] ?? null, f.licenza)})`).join(', ');
  return `<p class="ed-fonte">${fonti.length === 1 ? 'Fonte' : 'Fonti'}: ${elenco}.</p>`;
}

/** Il nome dell'immagine di anteprima di una pagina, nella cartella della pagina stessa. */
export const IMMAGINE = 'anteprima.png';
/** L'immagine fissa della home, con il testo alternativo che ha in index.html: la usano le pagine che non ne hanno una propria. */
export const IMMAGINE_HOME = { percorso: 'anteprima.png', alt: "Il marchio di AI Radar con la frase: cosa succede nell'AI ogni settimana, su cosa formarti e come si muove l'AI in Italia." };

/** Il nome del feed del sito, che è anche quello dell'archivio delle edizioni: il feed ha una voce per edizione. */
export const TITOLO_DEL_FEED = 'AI Radar, le edizioni';

/** Il link con cui un lettore di feed trova il feed partendo da una pagina. */
export const linkAlFeed = (indirizzoBase: string): string => `<link rel="alternate" type="application/rss+xml" title="${esc(TITOLO_DEL_FEED)}" href="${esc(`${indirizzoBase}feed.xml`)}" />`;

/** Le date di un articolo, in ISO 8601: quando è uscito e, se è cambiato dopo, quando. Una data che manca non esce. */
export interface DateArticolo { pubblicata: string | null; modificata: string | null }

interface PaginaComune {
  titolo: string;
  descrizione: string;
  /** La pagina vista dalla radice, con la barra finale. */
  percorso: string;
  /** La radice del sito vista dalla pagina. */
  radice: string;
  /** I link della testata prima di «Segui con RSS», che c'è quando ci sono le edizioni. */
  nav: string;
  corpo: string;
  /** L'immagine di anteprima, con il percorso dalla radice. */
  immagine: { percorso: string; alt: string };
}

export type Pagina = PaginaComune & ({ tipo: 'website' } | { tipo: 'article'; date: DateArticolo });

/** L'autore delle pagine: il progetto, senza nomi di persona, come nella pagina Privacy. */
export const AUTORE = 'AI Radar';

/**
 * Il profilo GitHub di chi pubblica il sito, ricavato dall'indirizzo base: `https://<utente>.github.io/…` → `https://github.com/<utente>`.
 * Così una copia del progetto non punta all'originale. Con un dominio che non è di GitHub Pages non c'è un profilo da indicare.
 */
export function profiloGitHub(indirizzoBase: string): string | null {
  const utente = /^([a-z0-9-]+)\.github\.io$/i.exec(new URL(indirizzoBase).hostname)?.[1];
  return utente ? `https://github.com/${utente.toLowerCase()}` : null;
}

/** I tag di un articolo: il profilo di chi lo pubblica e le sue date, solo quelli che ci sono. */
function tagArticolo(date: DateArticolo, indirizzoBase: string): string {
  const profilo = profiloGitHub(indirizzoBase);
  return [
    profilo && `<meta property="article:author" content="${esc(profilo)}" />`,
    date.pubblicata && `<meta property="article:published_time" content="${esc(date.pubblicata)}" />`,
    date.modificata && `<meta property="article:modified_time" content="${esc(date.modificata)}" />`,
  ].filter(Boolean).map((t) => `${t}\n`).join('');
}

/** Lo scheletro comune delle pagine statiche. */
export function pagina(o: Pagina, opzioni: OpzioniPagine): string {
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${esc(o.titolo)}</title>
<meta name="description" content="${esc(o.descrizione)}" />
<meta name="author" content="${AUTORE}" />
<link rel="canonical" href="${esc(`${opzioni.indirizzoBase}${o.percorso}`)}" />
<meta property="og:title" content="${esc(o.titolo)}" />
<meta property="og:description" content="${esc(o.descrizione)}" />
<meta property="og:url" content="${esc(`${opzioni.indirizzoBase}${o.percorso}`)}" />
<meta property="og:image" content="${esc(`${opzioni.indirizzoBase}${o.immagine.percorso}`)}" />
<meta property="og:image:alt" content="${esc(o.immagine.alt)}" />
<meta property="og:type" content="${o.tipo}" />
${o.tipo === 'article' ? tagArticolo(o.date, opzioni.indirizzoBase) : ''}<meta property="og:locale" content="it_IT" />
<meta property="og:site_name" content="AI Radar" />
<meta name="twitter:card" content="summary_large_image" />
${opzioni.linkAlleEdizioni ? `${linkAlFeed(opzioni.indirizzoBase)}\n` : ''}<link rel="icon" href="${esc(ICONA)}" />
<link rel="stylesheet" href="${esc(`${o.radice}${opzioni.foglio}`)}" />
</head>
<body>
<a class="skip" href="#contenuto">Vai al contenuto</a>
<div class="edizione">
<header class="testata">
<a class="logo" href="${o.radice}"><i aria-hidden="true"></i>AI Radar</a>
<nav aria-label="Pagina">${opzioni.linkAlleCompetenze ? `<a href="${o.radice}${INDICE_COMPETENZE}">Competenze</a>` : ''}${o.nav}${opzioni.linkAlleEdizioni ? `<a href="${o.radice}feed.xml">Segui con RSS</a>` : ''}</nav>
</header>
<main id="contenuto" tabindex="-1">
${o.corpo}
</main>
<footer><p class="ed-nota">Il progetto non è affiliato a nessuna delle fonti.</p>${opzioni.conLaRigaSulContatore ? `\n${rigaSulContatore(o.radice)}` : ''}</footer>
</div>
</body>
</html>
`;
}
