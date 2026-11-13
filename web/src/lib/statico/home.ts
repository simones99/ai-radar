// La home in chiaro: il testo della settimana dei dati dentro il contenitore dell'app, per chi legge l'HTML senza eseguire JavaScript.
// All'avvio l'app lo toglie e si monta al suo posto. Operazione pura: la data delle frasi è quella dei dati, mai l'orologio della build.
import type { Dataset } from '../data/types';
import { settimanaDeiDati, type CardDellaSettimana, type Destinazione, type Edizione, type PortaDellaSettimana, type SettimanaDeiDati } from '../edizioni';
import { cifraGrande } from '../edizioni/pagine';
import { cifraNellaFrase, portaConDati } from '../edizioni/tipi';
import { FRASE_DI_APERTURA } from '../text/apertura';
import { FONTI_DEI_DATI } from '../text/fonti';
import { dayWith } from '../text/format';
import { esc, INDICE_COMPETENZE, linkAlFeed, linkEsterno, rigaFonti } from './pagina';

export interface HomeInChiaro {
  /** L'HTML della home uscito dalla build, con il contenitore vuoto dell'app. */
  home: string;
  dataset: Dataset;
  edizioni: Edizione[];
  indirizzoBase: string;
  /** Le altre voci della mappa dei file pubblici: un link nasce solo verso una pagina che c'è. */
  pagine: readonly string[];
}

const CONTENITORE = /<div id="app">\s*<\/div>/;

/** Gli indirizzi sono relativi alla home, come quelli che l'app usa per le edizioni: valgono con qualunque indirizzo base. */
type Link = (cartella: string) => string | null;

/** Dove porta una destinazione per chi non ha JavaScript: solo alle pagine delle competenze, l'unica card che ha pagine statiche. Le altre restano testo. */
function versoUnaPagina(d: Destinazione | null, link: Link): string | null {
  if (d?.card !== 'competenze') return null;
  return link(d.elemento ? `competenze/${d.elemento}/` : INDICE_COMPETENZE);
}

const conLink = (href: string | null, html: string): string => (href ? `<a href="${esc(href)}">${html}</a>` : html);

function testata(link: Link): string {
  // l'indice delle competenze e l'archivio delle edizioni, solo quando le loro pagine nascono
  const voci = ([[INDICE_COMPETENZE, 'Competenze'], ['edizioni/', 'Edizioni']] as const).flatMap(([cartella, nome]) => {
    const href = link(cartella);
    return href ? [conLink(href, nome)] : [];
  });
  return `<header class="testata">
<span class="logo"><i aria-hidden="true"></i>AI Radar</span>
${voci.length ? `<nav aria-label="Pagina">${voci.join('')}</nav>` : ''}
</header>`;
}

/** La settimana dei dati sopra la frase di apertura, come nell'app: porta all'edizione di quella settimana solo se esiste. */
function apertura(s: SettimanaDeiDati | null, link: Link): string {
  const settimana = s ? `<p class="ed-nota">${conLink(link(`edizioni/${s.settimana}/`), esc(`Settimana ${dayWith('del', s.settimana)}`))}</p>\n` : '';
  return `<div class="ed-testa">
${settimana}<h1>${esc(FRASE_DI_APERTURA)}</h1>
</div>`;
}

/** Una porta come nell'edizione: nome della testa, notizia, nota e riga sotto. Senza dati resta la riga che lo dice. */
function porta(p: PortaDellaSettimana, link: Link): string {
  const titolo = p.titolo.map((x) => (x.em ? `<em>${esc(x.t)}</em>` : esc(x.t))).join('');
  return `<article class="ed-porta">
<h2>${esc(p.nome)} <span>${esc(p.etichetta)}</span></h2>
${portaConDati(p) ? `<p class="ed-notizia">${conLink(versoUnaPagina(p.destinazione, link), titolo)}</p>` : ''}
${p.nota ? `<p class="ed-nota">${esc(p.nota)}</p>` : ''}
<p class="ed-fonte">${esc(p.meta)}</p>
${rigaFonti(p.fonti)}
</article>`;
}

/** Una card come nell'edizione: nome, cifra con l'unità e frase. Il nome porta a una pagina solo se la card ne ha una. */
function rigaCard(c: CardDellaSettimana, link: Link): string {
  return `<li>
<h4>${conLink(versoUnaPagina(c.destinazione, link), esc(c.nome))}</h4>
${cifraNellaFrase(c) ? '' : cifraGrande(c)}
<p>${esc(c.frase ?? '')}</p>
${rigaFonti(c.fonti)}
</li>`;
}

/** Le card di una testa sotto il suo nome. Quelle senza dati stanno in una riga che lo dice, come nell'edizione, e non spariscono. */
function cardDellaTesta(p: PortaDellaSettimana, card: CardDellaSettimana[], link: Link): string {
  const proprie = card.filter((c) => c.testa === p.id);
  const conDati = proprie.filter((c) => c.frase != null);
  const senzaDati = proprie.filter((c) => c.frase == null);
  return `<div class="ed-gruppo">
<h3>${esc(p.nome)} <span>${esc(p.etichetta)}</span></h3>
${conDati.length ? `<ul class="ed-righe">\n${conDati.map((c) => rigaCard(c, link)).join('\n')}\n</ul>` : ''}
${senzaDati.length ? `<p class="ed-nota">Dati non disponibili: ${senzaDati.map((c) => conLink(versoUnaPagina(c.destinazione, link), esc(c.nome))).join(', ')}.</p>` : ''}
</div>`;
}

/** Le nove card divise per testa: senza confronto con la settimana prima, come la prima edizione. */
function situazione(s: SettimanaDeiDati, link: Link): string {
  return `<section>
<h2>La situazione</h2>
${s.porte.map((p) => cardDellaTesta(p, s.card, link)).join('\n')}
</section>`;
}

/** In fondo, sempre, le fonti dei dati come nel colophon dell'app; con almeno un'edizione anche il feed. */
function fondo(conFeed: boolean): string {
  return `<footer>
<p class="ed-nota">Dati di ${FONTI_DEI_DATI.map((f) => linkEsterno(f.url, f.nome)).join(', ')}. Il progetto non è affiliato a nessuna delle fonti.</p>
${conFeed ? `<p class="ed-nota"><a href="feed.xml">Segui con RSS</a></p>\n` : ''}</footer>`;
}

/**
 * Il testo statico, in ordine: testata, settimana e frase di apertura, le due porte, le card per testa, e in fondo le fonti e il feed.
 * Senza dati sulla settimana restano testata, frase e fondo.
 */
function testoStatico(s: SettimanaDeiDati | null, link: Link, conFeed: boolean): string {
  const sezioni = [
    apertura(s, link),
    ...(s ? [`<div class="ed-porte">\n${s.porte.map((p) => porta(p, link)).join('\n')}\n</div>`, situazione(s, link)] : []),
  ];
  return `<div class="edizione">
${testata(link)}
<main>
${sezioni.join('\n')}
</main>
${fondo(conFeed)}
</div>`;
}

/**
 * La home con il testo della settimana dei dati dentro il contenitore dell'app. Titolo, descrizione, canonical e anteprima restano quelli
 * ricevuti; con almeno un'edizione la testa guadagna il link al feed, nell'HTML perché un lettore di feed non esegue JavaScript.
 */
export function homeInChiaro({ home, dataset, edizioni, indirizzoBase, pagine }: HomeInChiaro): string {
  // senza il contenitore vuoto il testo non ha dove andare, e la home resta com'è: l'end-to-end della home in chiaro se ne accorge
  const esistono = new Set(pagine);
  const link: Link = (cartella) => (esistono.has(`${cartella}index.html`) ? cartella : null);
  const conFeed = edizioni.length ? home.replace('</head>', () => `  ${linkAlFeed(indirizzoBase)}\n  </head>`) : home;
  return conFeed.replace(CONTENITORE, () => `<div id="app">\n${testoStatico(settimanaDeiDati(dataset), link, edizioni.length > 0)}\n</div>`);
}
