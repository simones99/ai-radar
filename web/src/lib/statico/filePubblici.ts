// I file statici del sito, come mappa da percorso a contenuto: chi costruisce il sito li scrive così come sono.
import type { Radar } from '../data/types';
import { fileDelleEdizioni, type Edizione } from '../edizioni';
import { fileDelleCompetenze, nasconoLePagineDelleCompetenze } from './competenze';
import type { OpzioniPagine } from './pagina';
import { robots, SITEMAP, sitemap } from './sitemap';

/** Da cosa nascono i file statici: le edizioni salvate e i dati di oggi del radar, che può mancare. */
export interface ContenutoStatico {
  edizioni: Edizione[];
  radar?: Radar;
}

export interface OpzioniFilePubblici extends OpzioniPagine {
  /** L'HTML della home uscito dalla build: con almeno un'edizione la mappa ne restituisce una copia con il link al feed. */
  home?: string;
}

/** Tutti i file statici del sito, per percorso. Un file nuovo del sito è una voce in più in questa mappa: chi costruisce il sito li scrive tutti allo stesso modo. */
export function filePubblici({ edizioni, radar }: ContenutoStatico, opzioni: OpzioniFilePubblici): Record<string, string> {
  // le testate portano alle competenze e alle edizioni solo se le loro pagine nascono
  const conLink = { ...opzioni, linkAlleCompetenze: nasconoLePagineDelleCompetenze(radar), linkAlleEdizioni: edizioni.length > 0 };
  const file = { ...fileDelleEdizioni(edizioni, conLink), ...fileDelleCompetenze(radar, conLink) };
  return { ...file, [SITEMAP]: sitemap(Object.keys(file), opzioni.indirizzoBase), ...robots(opzioni.indirizzoBase) };
}
