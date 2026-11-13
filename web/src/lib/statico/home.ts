// La home in chiaro: il testo della settimana dei dati dentro il contenitore dell'app, per chi legge l'HTML senza eseguire JavaScript.
// All'avvio l'app lo toglie e si monta al suo posto. Operazione pura: la data delle frasi è quella dei dati, mai l'orologio della build.
import type { Dataset } from '../data/types';
import { cardDellaTesta, porta, settimanaDeiDati, type Edizione, type LinkDellaDestinazione, type SettimanaDeiDati } from '../edizioni';
import { FRASE_DI_APERTURA } from '../text/apertura';
import { FONTI_DEI_DATI } from '../text/fonti';
import { dayWith } from '../text/format';
import { esc, inLink, INDICE_COMPETENZE, linkAlFeed, linkEsterno } from './pagina';

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
const versoUnaPagina = (link: Link): LinkDellaDestinazione => (destinazione) => {
  if (destinazione?.card !== 'competenze') return null;
  return link(destinazione.elemento ? `competenze/${destinazione.elemento}/` : INDICE_COMPETENZE);
};

function testata(link: Link): string {
  // l'indice delle competenze e l'archivio delle edizioni, solo quando le loro pagine nascono
  const voci = ([[INDICE_COMPETENZE, 'Competenze'], ['edizioni/', 'Edizioni']] as const).flatMap(([cartella, nome]) => {
    const href = link(cartella);
    return href ? [inLink(href, nome)] : [];
  });
  return `<header class="testata">
<span class="logo"><i aria-hidden="true"></i>AI Radar</span>
${voci.length ? `<nav aria-label="Pagina">${voci.join('')}</nav>` : ''}
</header>`;
}

/** La settimana dei dati sopra la frase di apertura, come nell'app: porta all'edizione di quella settimana solo se esiste. */
function apertura(s: SettimanaDeiDati | null, link: Link): string {
  const settimana = s ? `<p class="ed-nota">${inLink(link(`edizioni/${s.settimana}/`), esc(`Settimana ${dayWith('del', s.settimana)}`))}</p>\n` : '';
  return `<div class="ed-testa">
${settimana}<h1>${esc(FRASE_DI_APERTURA)}</h1>
</div>`;
}

/** Le nove card divise per testa: senza confronto con la settimana prima, come la prima edizione. */
function situazione(s: SettimanaDeiDati, verso: LinkDellaDestinazione): string {
  return `<section>
<h2>La situazione</h2>
${s.porte.map((p) => cardDellaTesta(p, s.card, verso)).join('\n')}
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
  const verso = versoUnaPagina(link);
  const sezioni = [
    apertura(s, link),
    ...(s ? [`<div class="ed-porte">\n${s.porte.map((p) => porta(p, verso)).join('\n')}\n</div>`, situazione(s, verso)] : []),
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
  const daRiempire = edizioni.length ? home.replace('</head>', () => `  ${linkAlFeed(indirizzoBase)}\n  </head>`) : home;
  return daRiempire.replace(CONTENITORE, () => `<div id="app">\n${testoStatico(settimanaDeiDati(dataset), link, edizioni.length > 0)}\n</div>`);
}
