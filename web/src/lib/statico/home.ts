// La home in chiaro: il testo della settimana dei dati dentro il contenitore dell'app, per chi legge l'HTML senza eseguire JavaScript.
// All'avvio l'app lo toglie e si monta al suo posto. Operazione pura: la data delle frasi è quella dei dati, mai l'orologio della build.
import type { Dataset } from '../data/types';
import { settimanaDeiDati, type Destinazione, type Edizione, type PortaDellaSettimana, type SettimanaDeiDati } from '../edizioni';
import { portaConDati } from '../edizioni/tipi';
import { FRASE_DI_APERTURA } from '../text/apertura';
import { dayWith } from '../text/format';
import { esc, INDICE_COMPETENZE, linkAlFeed, rigaFonti } from './pagina';

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

/**
 * Il testo statico, in ordine: testata, settimana e frase di apertura, le due porte. Senza dati sulla settimana restano testata e frase.
 * Le sezioni del corpo seguono l'ordine della home: quelle che vengono dopo le porte si aggiungono in coda a sezioni.
 */
function testoStatico(s: SettimanaDeiDati | null, link: Link): string {
  const sezioni = [
    apertura(s, link),
    ...(s ? [`<div class="ed-porte">\n${s.porte.map((p) => porta(p, link)).join('\n')}\n</div>`] : []),
  ];
  return `<div class="edizione">
${testata(link)}
<main>
${sezioni.join('\n')}
</main>
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
  return conFeed.replace(CONTENITORE, () => `<div id="app">\n${testoStatico(settimanaDeiDati(dataset), link)}\n</div>`);
}
