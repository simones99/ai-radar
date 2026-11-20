// Da cosa nascono i file statici del sito: un tipo solo per la mappa dei file pubblici e per la sitemap, che nasce dalle sue voci.
import type { Dataset } from '../data/types';
import type { Edizione } from '../edizioni';

/**
 * Da cosa nascono i file statici: le edizioni salvate, che la mappa controlla per prime, e i dati di oggi, gli stessi che carica l'app.
 * Ogni file del dataset può mancare, come nell'app: le pagine delle competenze nascono dal radar, e senza non nascono.
 */
export interface ContenutoStatico {
  edizioni: Edizione[];
  dataset: Dataset;
}
