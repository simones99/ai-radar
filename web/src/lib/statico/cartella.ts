// I file statici visti dal disco: la build gli passa la cartella dei dati e quella di uscita, il comando delle anteprime le stesse. Solo Node, mai nel browser.
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { leggiDati, leggiDatiComeLApp, scrivi } from '../data/cartella';
import { FILES } from '../data/load';
import { copiaImmagini, leggiEdizioni } from '../edizioni/cartella';
import { filePubblici } from './filePubblici';
import { anteprimeDelleCompetenze, type Anteprima } from './competenze';
import { foglioDellaHome, IMMAGINE_HOME } from './pagina';

/**
 * Scrive nella cartella di uscita tutti i file statici del sito: i testi della mappa di filePubblici, e le immagini, che si copiano soltanto.
 * Accanto a ogni pagina di competenza va la copia dell'immagine della home, già nella cartella di uscita: il comando delle anteprime la sostituisce
 * con quella della competenza, e se non ci riesce il tag dell'immagine non porta comunque a un file che manca.
 */
export function scriviFilePubblici({ dati, uscita, indirizzoBase, htmlHome }: { dati: string; uscita: string; indirizzoBase: string; htmlHome: string }): void {
  const edizioni = leggiEdizioni(dati);
  // un file di dati rotto vale come fonte assente, come nell'app, e la home in chiaro lo dice. radar.json no: rotto ferma la build,
  // perché senza le pagine delle competenze sparirebbero dal sito
  const dataset = { ...leggiDatiComeLApp(dati, FILES.filter((k) => k !== 'radar')), ...leggiDati(dati, ['radar']) };
  const file = filePubblici({ edizioni, dataset }, { indirizzoBase, foglio: foglioDellaHome(htmlHome), home: htmlHome });
  for (const [percorso, contenuto] of Object.entries(file)) {
    mkdirSync(dirname(join(uscita, percorso)), { recursive: true });
    writeFileSync(join(uscita, percorso), contenuto);
  }
  copiaImmagini({ dati, uscita, edizioni });
  for (const { percorso } of anteprimeDelleCompetenze(dataset.radar)) copyFileSync(join(uscita, IMMAGINE_HOME.percorso), join(uscita, percorso));
}

/**
 * Il giro del comando delle anteprime: al posto di ogni segnaposto della build scrive il PNG della competenza, nell'ordine di radar.json.
 * Al primo errore si ferma con un messaggio che nomina la competenza: le immagini già scritte restano, le altre tengono il segnaposto.
 * Il sito deve essere costruito con gli stessi dati: lo controlla prima di fotografare.
 */
export async function scriviAnteprime({ dati, sito, fotografa }: {
  dati: string;
  sito: string;
  /** Il PNG di un'anteprima. Lo passa il comando: questo modulo lo usa anche la build, che non deve richiedere Playwright. */
  fotografa: (a: Anteprima) => Promise<Uint8Array>;
}): Promise<string> {
  const anteprime = anteprimeDelleCompetenze(leggiDati(dati, ['radar']).radar);
  if (!anteprime.length) return 'Nessuna anteprima da fare: nei dati non ci sono competenze.';
  const senzaPagina = anteprime.filter(({ percorso }) => !existsSync(join(sito, percorso))).map(({ anteprima }) => anteprima.id);
  if (senzaPagina.length) throw new Error(`Nel sito in ${sito} manca il segnaposto dell'anteprima di ${senzaPagina.join(', ')}: prima npm run build, con gli stessi dati.`);
  for (const { percorso, anteprima } of anteprime) {
    try {
      scrivi(join(sito, percorso), await fotografa(anteprima));
    } catch (e) {
      throw new Error(`Anteprima di «${anteprima.id}» non fatta: ${e instanceof Error ? e.message : e} Questa e le competenze dopo di lei tengono il segnaposto.`);
    }
  }
  return `Anteprime delle competenze fatte: ${anteprime.length}.`;
}
