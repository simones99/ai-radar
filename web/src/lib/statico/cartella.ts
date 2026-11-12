// I file statici visti dal disco: la build gli passa la cartella dei dati e quella di uscita. Solo Node, mai nel browser.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { leggiDati } from '../data/cartella';
import { copiaImmagini, leggiEdizioni } from '../edizioni/cartella';
import { filePubblici } from './filePubblici';
import { foglioDellaHome } from './pagina';

/** Scrive nella cartella di uscita tutti i file statici del sito: i testi della mappa di filePubblici, e le immagini delle edizioni, che si copiano soltanto. */
export function scriviFilePubblici({ dati, uscita, indirizzoBase, htmlHome }: { dati: string; uscita: string; indirizzoBase: string; htmlHome: string }): void {
  const edizioni = leggiEdizioni(dati);
  const file = filePubblici({ edizioni, radar: leggiDati(dati, ['radar']).radar }, { indirizzoBase, foglio: foglioDellaHome(htmlHome), home: htmlHome });
  for (const [percorso, contenuto] of Object.entries(file)) {
    mkdirSync(dirname(join(uscita, percorso)), { recursive: true });
    writeFileSync(join(uscita, percorso), contenuto);
  }
  copiaImmagini({ dati, uscita, edizioni });
}
