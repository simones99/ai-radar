// Il modulo Edizioni visto dal disco: legge e scrive data/edizioni/ per il comando e per la build. Solo Node, mai nel browser.
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { FILES } from '../data/load';
import type { Dataset } from '../data/types';
import { lunediDi } from '../text/format';
import { creaEdizione, deveCreare } from '.';
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
function scrivi(file: string, contenuto: string): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(`${file}.tmp`, contenuto);
  renameSync(`${file}.tmp`, file);
}

export interface Giro { evento: string; casella: boolean; dati: string }

/**
 * Il giro del comando: decide, crea e salva. Restituisce cosa è successo, da scrivere nel log.
 * Lancia un errore quando l'edizione doveva uscire e non può: per il workflow è una creazione fallita.
 */
export function fissaEdizione({ evento, casella, dati }: Giro): string {
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
  scrivi(fissa(settimana), `${JSON.stringify(edizione, null, 2)}\n`);
  return `Edizione del ${settimana} creata.`;
}
