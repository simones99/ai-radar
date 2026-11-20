// I dati visti dal disco, per chi lavora in Node: i comandi delle edizioni e delle anteprime, e la build. Mai nel browser, dove li carica load.ts.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { FILES, type FileKey } from './load';
import type { Dataset } from './types';

/**
 * I JSON della cartella principale, gli stessi che carica l'app, o solo quelli chiesti. Come nell'app, un file che manca vale come fonte assente.
 * Un file illeggibile invece è un errore: la pipeline non lo scrive mai a metà, quindi è un guasto da vedere.
 */
export function leggiDati(dati: string, quali: readonly FileKey[] = FILES): Dataset {
  const parti: Record<string, unknown> = {};
  for (const k of quali) {
    const file = join(dati, `${k}.json`);
    if (existsSync(file)) parti[k] = JSON.parse(readFileSync(file, 'utf-8'));
  }
  return parti as Dataset;
}

/**
 * I JSON chiesti come li vede l'app: un file che manca, illeggibile o con null vale come fonte assente.
 * Per chi deve uscire con i dati che ci sono, come la home in chiaro, che dice quali mancano.
 */
export function leggiDatiComeLApp(dati: string, quali: readonly FileKey[] = FILES): Dataset {
  const parti: Record<string, unknown> = {};
  for (const k of quali) {
    try {
      const valore: unknown = JSON.parse(readFileSync(join(dati, `${k}.json`), 'utf-8'));
      if (valore != null) parti[k] = valore;
    } catch {
      // che manchi o sia rotto, per l'app il file non è arrivato
    }
  }
  return parti as Dataset;
}

/** Mai un file scritto a metà: un giro interrotto non lascia un'edizione, o un'immagine, che sembra buona. */
export function scrivi(file: string, contenuto: string | Uint8Array): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(`${file}.tmp`, contenuto);
  renameSync(`${file}.tmp`, file);
}
