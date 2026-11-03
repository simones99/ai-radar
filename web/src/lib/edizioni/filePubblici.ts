// I file pubblici che nascono dalle edizioni, come mappa da percorso a contenuto: chi costruisce il sito li scrive così come sono.
import { INDICE_EDIZIONI } from '../data/load';
import { isDay } from '../text/format';
import { feed } from './feed';
import { archivio, linkAlFeed, paginaEdizione, type OpzioniPagine } from './pagine';
import { VERSIONE, type Edizione } from './tipi';

export interface OpzioniFilePubblici extends OpzioniPagine {
  /** L'HTML della home uscito dalla build: con almeno un'edizione la mappa ne restituisce una copia con il link al feed. */
  home?: string;
}

function controlla(e: Edizione): void {
  if (e.versione !== VERSIONE) throw new Error(`Edizione ${e.settimana}: versione ${e.versione} sconosciuta, il sito conosce la ${VERSIONE}.`);
  if (Number.isNaN(Date.parse(e.raccolti))) throw new Error(`Edizione ${e.settimana}: la data di raccolta non è valida, «${e.raccolti}».`);
  for (const c of e.correzioni) {
    if (!isDay(c.data)) throw new Error(`Edizione ${e.settimana}: una correzione ha una data non valida, «${c.data}»: serve AAAA-MM-GG.`);
  }
}

/**
 * Tutti i file che nascono dalle edizioni, per percorso. Senza edizioni non ne nasce nessuno: gli indirizzi esistono dalla prima in poi.
 * Un file nuovo del sito è una voce in più in questa mappa: chi costruisce il sito li scrive tutti allo stesso modo.
 */
export function filePubblici(edizioni: Edizione[], opzioni: OpzioniFilePubblici): Record<string, string> {
  edizioni.forEach(controlla);
  if (!edizioni.length) return {};
  const recenti = [...edizioni].sort((a, b) => b.settimana.localeCompare(a.settimana));
  return {
    'edizioni/index.html': archivio(recenti, opzioni),
    ...Object.fromEntries(recenti.map((e) => [`edizioni/${e.settimana}/index.html`, paginaEdizione(e, opzioni)])),
    'feed.xml': feed(recenti, opzioni.indirizzoBase),
    [INDICE_EDIZIONI]: `${JSON.stringify({ ultima: recenti[0].settimana })}\n`,
    // nell'HTML e non dall'app: un lettore di feed non esegue JavaScript. Senza edizioni la home resta quella uscita dalla build
    ...(opzioni.home ? { 'index.html': opzioni.home.replace('</head>', () => `  ${linkAlFeed(opzioni.indirizzoBase)}\n  </head>`) } : {}),
  };
}
