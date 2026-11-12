// I file statici del sito, come mappa da percorso a contenuto: chi costruisce il sito li scrive così come sono.
import type { Radar } from '../data/types';
import { fileDelleEdizioni, type Edizione } from '../edizioni';
import { fileDelleCompetenze } from './competenze';
import type { OpzioniPagine } from './pagina';

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
  return { ...fileDelleEdizioni(edizioni, opzioni), ...fileDelleCompetenze(radar, opzioni) };
}
