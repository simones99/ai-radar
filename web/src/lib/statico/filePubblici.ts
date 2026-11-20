// I file statici del sito, come mappa da percorso a contenuto: chi costruisce il sito li scrive così come sono.
import { fileDelleEdizioni } from '../edizioni';
import { scriptUmami } from '../umami';
import { fileDelleCompetenze, nasconoLePagineDelleCompetenze } from './competenze';
import type { ContenutoStatico } from './contenuto';
import { homeInChiaro } from './home';
import type { OpzioniPagine } from './pagina';
import { robots, SITEMAP, sitemap } from './sitemap';

export interface OpzioniFilePubblici extends OpzioniPagine {
  /** L'HTML della home uscito dalla build: la mappa ne restituisce sempre una copia, con il testo della settimana dei dati e, se ci sono edizioni, il link al feed. */
  home: string;
  /** L'ID del sito Umami, già controllato: con un ID ogni pagina porta lo script che conta le visite, senza nessuna. */
  idUmami?: string | null;
}

/** Tutti i file statici del sito, per percorso. Un file nuovo del sito è una voce in più in questa mappa: chi costruisce il sito li scrive tutti allo stesso modo. */
export function filePubblici(contenuto: ContenutoStatico, opzioni: OpzioniFilePubblici): Record<string, string> {
  const { edizioni, dataset } = contenuto;
  // le testate portano alle competenze e alle edizioni solo se le loro pagine nascono
  const opzioniDellePagine: OpzioniPagine = { ...opzioni, linkAlleCompetenze: nasconoLePagineDelleCompetenze(dataset.radar), linkAlleEdizioni: edizioni.length > 0 };
  const pagine = { ...fileDelleEdizioni(edizioni, opzioniDellePagine), ...fileDelleCompetenze(dataset.radar, opzioniDellePagine) };
  // la home porta solo alle pagine che ci sono: nasce dopo le altre voci
  const file = { ...pagine, 'index.html': homeInChiaro({ home: opzioni.home, dataset, edizioni, indirizzoBase: opzioni.indirizzoBase, pagine: Object.keys(pagine) }) };
  return { ...conIlContatore(file, opzioni), [SITEMAP]: sitemap(Object.keys(file), contenuto, opzioni.indirizzoBase), ...robots(opzioni.indirizzoBase) };
}

/**
 * Lo script di Umami nel <head> di ogni voce HTML della mappa, anche di quelle che arriveranno: si aggiunge qui, quando la build scrive la pagina,
 * e non entra mai nei file fissi delle edizioni (ADR 0002). Le voci che non sono pagine restano come sono.
 */
function conIlContatore(file: Record<string, string>, { idUmami, indirizzoBase }: OpzioniFilePubblici): Record<string, string> {
  if (!idUmami) return file;
  const script = scriptUmami(idUmami, indirizzoBase);
  return Object.fromEntries(Object.entries(file).map(([percorso, html]) => [percorso, percorso.endsWith('.html') ? html.replace('</head>', () => `${script}\n</head>`) : html]));
}
