// I dati visti dal disco, per chi lavora in Node: il comando delle edizioni e la build. Mai nel browser, dove li carica load.ts.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
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
