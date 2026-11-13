// Da cosa nascono i file statici del sito: un tipo solo per la mappa dei file pubblici e per la sitemap, che nasce dalle sue voci.
import type { Radar } from '../data/types';
import type { Edizione } from '../edizioni';

/** Da cosa nascono i file statici: le edizioni salvate, che la mappa controlla per prime, e i dati di oggi del radar, che può mancare. */
export interface ContenutoStatico {
  edizioni: Edizione[];
  radar?: Radar;
}
