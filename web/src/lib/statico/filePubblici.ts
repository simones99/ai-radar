// I file statici del sito, come mappa da percorso a contenuto: chi costruisce il sito li scrive così come sono.
import type { Radar } from '../data/types';
import { fileDelleEdizioni, type Edizione, type OpzioniFileDelleEdizioni } from '../edizioni';

/** Da cosa nascono i file statici: le edizioni salvate e i dati di oggi del radar, che può mancare. */
export interface ContenutoStatico {
  edizioni: Edizione[];
  radar?: Radar;
}

/** Tutti i file statici del sito, per percorso. Un file nuovo del sito è una voce in più in questa mappa: chi costruisce il sito li scrive tutti allo stesso modo. */
export function filePubblici({ edizioni }: ContenutoStatico, opzioni: OpzioniFileDelleEdizioni): Record<string, string> {
  return fileDelleEdizioni(edizioni, opzioni);
}
