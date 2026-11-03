// Il modulo Edizioni visto dal disco: legge e scrive data/edizioni/ per il comando e per la build. Solo Node, mai nel browser.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { FILES } from '../data/load';
import type { Dataset } from '../data/types';
import { lunediDi } from '../text/format';
import { creaEdizione, deveCreare, fileDelSito, foglioDellaHome, IMMAGINE } from '.';
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

/** I JSON della cartella principale, gli stessi che carica l'app. Come nell'app, un file che manca vale come fonte assente. */
function leggiDati(dati: string): Dataset {
  const parti: Record<string, unknown> = {};
  for (const k of FILES) {
    const file = join(dati, `${k}.json`);
    if (existsSync(file)) parti[k] = JSON.parse(readFileSync(file, 'utf-8'));
  }
  return parti as Dataset;
}

/** Mai un file scritto a metà: un giro interrotto non lascia un'edizione che sembra buona. */
function scrivi(file: string, contenuto: string | Uint8Array): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(`${file}.tmp`, contenuto);
  renameSync(`${file}.tmp`, file);
}

/** L'immagine di un'edizione, accanto al suo file fisso. */
const fileImmagine = (dati: string, settimana: string): string => join(dati, 'edizioni', `${settimana}.png`);

/** Scrive nella cartella di uscita tutti i file che nascono dalle edizioni. Un file nuovo del sito basta aggiungerlo a fileDelSito. */
export function scriviSito({ dati, uscita, indirizzoBase, htmlHome }: { dati: string; uscita: string; indirizzoBase: string; htmlHome: string }): void {
  const edizioni = leggiEdizioni(dati);
  const file = fileDelSito(edizioni, { indirizzoBase, foglio: foglioDellaHome(htmlHome), home: htmlHome });
  for (const [percorso, contenuto] of Object.entries(file)) {
    mkdirSync(dirname(join(uscita, percorso)), { recursive: true });
    writeFileSync(join(uscita, percorso), contenuto);
  }
  // le immagini si copiano soltanto: nascono una volta sola, con il comando
  for (const { settimana } of edizioni) {
    const immagine = fileImmagine(dati, settimana);
    if (!existsSync(immagine)) throw new Error(`L'edizione del ${settimana} è senza la sua immagine: rifalla con npm run edizione -- --immagine ${settimana}`);
    copyFileSync(immagine, join(uscita, 'edizioni', settimana, IMMAGINE));
  }
}

/** Rifà l'immagine di un'edizione già uscita, dopo una correzione: non tocca il file fisso né le altre edizioni. */
export async function rifaiImmagine({ settimana, dati, fotografa }: { settimana: string; dati: string; fotografa: Giro['fotografa'] }): Promise<string> {
  const fissa = join(dati, 'edizioni', `${settimana}.json`);
  if (!existsSync(fissa)) throw new Error(`Immagine non rifatta: non c'è un'edizione del ${settimana}.`);
  scrivi(fileImmagine(dati, settimana), await fotografa(JSON.parse(readFileSync(fissa, 'utf-8')) as Edizione));
  return `Immagine dell'edizione del ${settimana} rifatta.`;
}

export interface Giro {
  evento: string;
  casella: boolean;
  dati: string;
  /** Il PNG di un'edizione. Lo passa il comando: questo modulo lo usa anche la build, che non deve richiedere Playwright. */
  fotografa: (e: Edizione) => Promise<Uint8Array>;
}

/**
 * Il giro del comando: decide, crea e salva. Restituisce cosa è successo, da scrivere nel log.
 * Lancia un errore quando l'edizione doveva uscire e non può, anche per colpa dell'immagine: per il workflow è una creazione fallita.
 */
export async function fissaEdizione({ evento, casella, dati, fotografa }: Giro): Promise<string> {
  const status = join(dati, 'status.json');
  const aggiornato: string | undefined = existsSync(status) ? JSON.parse(readFileSync(status, 'utf-8')).aggiornato : undefined;
  const settimana = aggiornato ? lunediDi(aggiornato) : null;
  const fissa = (s: string) => join(dati, 'edizioni', `${s}.json`);
  const esiste = !!settimana && existsSync(fissa(settimana));
  if (!deveCreare({ evento, casella, esiste })) {
    return esiste ? `Nessuna edizione nuova: quella del ${settimana} esiste già.` : `Nessuna edizione: non si crea con l'evento «${evento}» e la casella ${casella ? 'accesa' : 'spenta'}.`;
  }
  if (!settimana) throw new Error('Edizione non creata: i dati sono senza data, in status.json.');
  // l'edizione con cui confrontarsi: la più recente tra quelle uscite prima di questa settimana
  const precedente = leggiEdizioni(dati).filter((e) => e.settimana < settimana).sort((a, b) => a.settimana.localeCompare(b.settimana)).at(-1) ?? null;
  const edizione = creaEdizione(leggiDati(dati), precedente);
  if (!edizione) throw new Error('Edizione non creata: tutte e due le porte sono senza dati.');
  // prima l'immagine, in memoria: se non si può fare, sul disco non è cambiato nulla e la settimana resta senza edizione.
  // Il file fisso per ultimo: è lui a dire che l'edizione esiste
  const png = await fotografa(edizione);
  const immagine = fileImmagine(dati, settimana);
  scrivi(immagine, png);
  try {
    scrivi(fissa(settimana), `${JSON.stringify(edizione, null, 2)}\n`);
  } catch (e) {
    rmSync(immagine, { force: true });
    throw e;
  }
  return `Edizione del ${settimana} creata, con la sua immagine.`;
}
