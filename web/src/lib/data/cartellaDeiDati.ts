// La regola unica della cartella dei dati per chi gira in Node: la build di Vite, i comandi delle edizioni e delle anteprime, i test end-to-end.
// La pipeline e scripts/build_site.py seguono la stessa regola in Python. Nessuna dipendenza: la importa anche vite.config.ts.
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** AI_RADAR_DATA_DIR se c'è, altrimenti data/ nella radice della repo. */
export const cartellaDeiDati = (ambiente: Record<string, string | undefined> = process.env): string =>
  // il percorso del file, non new URL(…, import.meta.url): quella forma Vite la riscrive come indirizzo di un asset
  ambiente.AI_RADAR_DATA_DIR ?? resolve(dirname(fileURLToPath(import.meta.url)), '../../../../data');
