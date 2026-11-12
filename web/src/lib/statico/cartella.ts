// I file statici visti dal disco: la build gli passa la cartella dei dati e quella di uscita. Solo Node, mai nel browser.
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { leggiDati } from '../data/cartella';
import { copiaImmagini, leggiEdizioni } from '../edizioni/cartella';
import { filePubblici } from './filePubblici';
import { immaginiDelleCompetenze } from './competenze';
import { foglioDellaHome, IMMAGINE_HOME } from './pagina';

/**
 * Scrive nella cartella di uscita tutti i file statici del sito: i testi della mappa di filePubblici, e le immagini, che si copiano soltanto.
 * Accanto a ogni pagina di competenza va la copia dell'immagine della home, già nella cartella di uscita: il workflow la sostituisce con quella
 * della competenza, e se non ci riesce il tag dell'immagine non porta comunque a un file che manca.
 */
export function scriviFilePubblici({ dati, uscita, indirizzoBase, htmlHome }: { dati: string; uscita: string; indirizzoBase: string; htmlHome: string }): void {
  const edizioni = leggiEdizioni(dati);
  const { radar } = leggiDati(dati, ['radar']);
  const file = filePubblici({ edizioni, radar }, { indirizzoBase, foglio: foglioDellaHome(htmlHome), home: htmlHome });
  for (const [percorso, contenuto] of Object.entries(file)) {
    mkdirSync(dirname(join(uscita, percorso)), { recursive: true });
    writeFileSync(join(uscita, percorso), contenuto);
  }
  copiaImmagini({ dati, uscita, edizioni });
  for (const immagine of immaginiDelleCompetenze(radar)) copyFileSync(join(uscita, IMMAGINE_HOME.percorso), join(uscita, immagine));
}
