// Il modulo Edizioni visto dal disco: legge e scrive data/edizioni/ per il comando, e per la build tramite il sito. Solo Node, mai nel browser.
import { copyFileSync, existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { leggiDati, scrivi } from '../data/cartella';
import { lunediDi } from '../text/format';
import { creaEdizione, deveCreare, IMMAGINE, raccoltaValida } from '.';
import type { Edizione } from './tipi';

/** Tutte le edizioni salvate; se la cartella non c'è ancora, nessuna. Il nome del file è l'indirizzo della pagina: deve essere la sua settimana. */
export function leggiEdizioni(dati: string): Edizione[] {
  const cartella = join(dati, 'edizioni');
  if (!existsSync(cartella)) return [];
  return readdirSync(cartella).filter((nome) => nome.endsWith('.json')).map((nome) => {
    const e = JSON.parse(readFileSync(join(cartella, nome), 'utf-8')) as Edizione;
    if (`${e.settimana}.json` !== nome) throw new Error(`data/edizioni/${nome}: il nome del file deve essere la sua settimana, che è ${e.settimana}.`);
    return e;
  });
}

const fileFisso = (dati: string, settimana: string): string => join(dati, 'edizioni', `${settimana}.json`);
/** L'immagine di un'edizione, accanto al suo file fisso. */
const fileImmagine =(dati: string, settimana: string): string => join(dati, 'edizioni', `${settimana}.png`);

/** Copia l'immagine di ogni edizione accanto alla sua pagina, nella cartella di uscita della build. Le immagini nascono una volta sola, con il comando. */
export function copiaImmagini({ dati, uscita, edizioni }: { dati: string; uscita: string; edizioni: Edizione[] }): void {
  for (const { settimana } of edizioni) {
    const immagine = fileImmagine(dati, settimana);
    if (!existsSync(immagine)) throw new Error(`L'edizione del ${settimana} è senza la sua immagine: rifalla con npm run edizione -- --immagine ${settimana}`);
    copyFileSync(immagine, join(uscita, 'edizioni', settimana, IMMAGINE));
  }
}

/** Rifà l'immagine di un'edizione già uscita, dopo una correzione: non tocca il file fisso né le altre edizioni. */
export async function rifaiImmagine({ settimana, dati, fotografa }: { settimana: string; dati: string; fotografa: Giro['fotografa'] }): Promise<string> {
  const fissa = fileFisso(dati, settimana);
  if (!existsSync(fissa)) throw new Error(`Immagine non rifatta: non c'è un'edizione del ${settimana}.`);
  scrivi(fileImmagine(dati, settimana), await fotografa(JSON.parse(readFileSync(fissa, 'utf-8')) as Edizione));
  return `Immagine dell'edizione del ${settimana} rifatta.`;
}

/** Il lunedì della settimana dei dati, da status.aggiornato; null senza il file o senza una data valida. Un file illeggibile è un errore che lo nomina. */
function settimanaDaStatus(status: string): string | null {
  if (!existsSync(status)) return null;
  let aggiornato: unknown;
  try {
    aggiornato = JSON.parse(readFileSync(status, 'utf-8'))?.aggiornato;
  } catch (e) {
    throw new Error(`Edizione non creata: status.json non si legge, ${e instanceof Error ? e.message : e}.`);
  }
  return typeof aggiornato === 'string' && raccoltaValida(aggiornato) ? lunediDi(aggiornato) : null;
}

export interface Giro {
  evento: string;
  casella: boolean;
  dati: string;
  /** Il PNG di un'edizione. Lo passa il comando: questo modulo lo usa anche la build, che non deve richiedere Playwright. */
  fotografa: (e: Edizione) => Promise<Uint8Array>;
}

/**
 * Il giro del comando: decide, crea e salva. Restituisce cosa è successo, da scrivere nel log, e la settimana se l'edizione è nata in questo giro.
 * Lancia un errore quando l'edizione doveva uscire e non può, anche per colpa dell'immagine: per il workflow è una creazione fallita.
 */
export async function fissaEdizione({ evento, casella, dati, fotografa }: Giro): Promise<{ messaggio: string; creata?: string }> {
  // prima evento e casella, senza leggere niente: un giro che non crea mai non si ferma per uno status.json rotto
  if (!deveCreare({ evento, casella, esiste: false })) {
    return { messaggio: `Nessuna edizione: non si crea con l'evento «${evento}» e la casella ${casella ? 'accesa' : 'spenta'}.` };
  }
  const settimana = settimanaDaStatus(join(dati, 'status.json'));
  if (!settimana) throw new Error('Edizione non creata: i dati sono senza una data valida, in status.json.');
  if (existsSync(fileFisso(dati, settimana))) return { messaggio: `Nessuna edizione nuova: quella del ${settimana} esiste già.` };
  // l'edizione con cui confrontarsi: la più recente tra quelle uscite prima della settimana dei dati
  const precedente = leggiEdizioni(dati).filter((e) => e.settimana < settimana).sort((a, b) => a.settimana.localeCompare(b.settimana)).at(-1) ?? null;
  const edizione = creaEdizione(leggiDati(dati), precedente);
  if (!edizione) throw new Error('Edizione non creata: tutte e due le porte sono senza dati.');
  // prima l'immagine, in memoria: se non si può fare, sul disco non è cambiato nulla e la settimana resta senza edizione.
  // Il file fisso per ultimo: è lui a dire che l'edizione esiste
  const png = await fotografa(edizione);
  const immagine = fileImmagine(dati, settimana);
  scrivi(immagine, png);
  try {
    scrivi(fileFisso(dati, settimana), `${JSON.stringify(edizione, null, 2)}\n`);
  } catch (e) {
    rmSync(immagine, { force: true });
    throw e;
  }
  return { messaggio: `Edizione del ${settimana} creata, con la sua immagine.`, creata: settimana };
}
