// I file pubblici che nascono dalle edizioni, come mappa da percorso a contenuto: la mappa del sito li comprende così come sono.
import { INDICE_EDIZIONI } from '../data/load';
import { isDay } from '../text/format';
import { feed } from './feed';
import { linkAlFeed, type OpzioniPagine } from '../statico/pagina';
import { archivio, paginaEdizione } from './pagine';
import { VERSIONE, type Edizione } from './tipi';

export interface OpzioniFileDelleEdizioni extends OpzioniPagine {
  /** L'HTML della home uscito dalla build: con almeno un'edizione la mappa ne restituisce una copia con il link al feed. */
  home?: string;
}

function controlla(e: Edizione): void {
  if (e.versione !== VERSIONE) throw new Error(`Edizione ${e.settimana}: versione ${e.versione} sconosciuta, il sito conosce la ${VERSIONE}.`);
  // l'istante intero deve essere leggibile e il giorno con cui comincia deve esistere: è quello che le pagine, il feed e la sitemap scrivono
  if (Number.isNaN(Date.parse(e.raccolti)) || !isDay(e.raccolti.slice(0, 10))) {
    throw new Error(`Edizione ${e.settimana}: la data di raccolta non è valida, «${e.raccolti}»: serve un istante che comincia con AAAA-MM-GG.`);
  }
  for (const c of e.correzioni) {
    if (!isDay(c.data)) throw new Error(`Edizione ${e.settimana}: una correzione ha una data non valida, «${c.data}»: serve AAAA-MM-GG.`);
  }
}

/**
 * Tutti i file che nascono dalle edizioni, per percorso. Senza edizioni non ne nasce nessuno: gli indirizzi esistono dalla prima in poi.
 */
export function fileDelleEdizioni(edizioni: Edizione[], opzioni: OpzioniFileDelleEdizioni): Record<string, string> {
  edizioni.forEach(controlla);
  if (!edizioni.length) return {};
  const recenti = [...edizioni].sort((a, b) => b.settimana.localeCompare(a.settimana));
  return {
    'edizioni/index.html': archivio(recenti, opzioni),
    ...Object.fromEntries(recenti.map((e, i) => [`edizioni/${e.settimana}/index.html`, paginaEdizione(e, opzioni, { precedente: recenti[i + 1], successiva: recenti[i - 1] })])),
    'feed.xml': feed(recenti, opzioni.indirizzoBase),
    [INDICE_EDIZIONI]: `${JSON.stringify({ ultima: recenti[0].settimana })}\n`,
    // nell'HTML e non dall'app: un lettore di feed non esegue JavaScript. Senza edizioni la home resta quella uscita dalla build
    ...(opzioni.home ? { 'index.html': opzioni.home.replace('</head>', () => `  ${linkAlFeed(opzioni.indirizzoBase)}\n  </head>`) } : {}),
  };
}
