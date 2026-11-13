// I file statici del sito, come mappa da percorso a contenuto: chi costruisce il sito li scrive così come sono.
import { fileDelleEdizioni } from '../edizioni';
import { fileDelleCompetenze, nasconoLePagineDelleCompetenze } from './competenze';
import type { ContenutoStatico } from './contenuto';
import { homeInChiaro } from './home';
import type { OpzioniPagine } from './pagina';
import { robots, SITEMAP, sitemap } from './sitemap';

export interface OpzioniFilePubblici extends OpzioniPagine {
  /** L'HTML della home uscito dalla build: la mappa ne restituisce sempre una copia, con il testo della settimana dei dati e, se ci sono edizioni, il link al feed. */
  home?: string;
}

/** Tutti i file statici del sito, per percorso. Un file nuovo del sito è una voce in più in questa mappa: chi costruisce il sito li scrive tutti allo stesso modo. */
export function filePubblici(contenuto: ContenutoStatico, opzioni: OpzioniFilePubblici): Record<string, string> {
  const { edizioni, dataset } = contenuto;
  // le testate portano alle competenze e alle edizioni solo se le loro pagine nascono
  const conLink = { ...opzioni, linkAlleCompetenze: nasconoLePagineDelleCompetenze(dataset.radar), linkAlleEdizioni: edizioni.length > 0 };
  const pagine = { ...fileDelleEdizioni(edizioni, conLink), ...fileDelleCompetenze(dataset.radar, conLink) };
  // la home porta solo alle pagine che ci sono: nasce dopo le altre voci
  const home: Record<string, string> = opzioni.home ? { 'index.html': homeInChiaro({ home: opzioni.home, dataset, edizioni, indirizzoBase: opzioni.indirizzoBase, pagine: Object.keys(pagine) }) } : {};
  const file = { ...pagine, ...home };
  return { ...file, [SITEMAP]: sitemap(Object.keys(file), contenuto, opzioni.indirizzoBase), ...robots(opzioni.indirizzoBase) };
}
