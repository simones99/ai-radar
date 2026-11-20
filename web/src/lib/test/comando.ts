// Il comando vero su una cartella temporanea di dati, `npm run edizione` come lo lancia il workflow: la base dei due file di test del comando.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach } from 'vitest';
import type { Edizione } from '../edizioni';
import { FIXTURE } from './fixtures';

export const SETTIMANA = '2026-10-12'; // il lunedì di status.aggiornato nel FIXTURE

/** Una cartella di dati nuova per ogni test, con i dati del FIXTURE, e il comando che la usa. */
export function comandoSuDatiDiProva() {
  let dati: string;
  const edizioni = () => join(dati, 'edizioni');
  const fissa = () => join(edizioni(), `${SETTIMANA}.json`);
  const scriviDati = (parti: Record<string, unknown>) => {
    for (const [nome, contenuto] of Object.entries(parti)) writeFileSync(join(dati, `${nome}.json`), JSON.stringify(contenuto));
  };
  const comando = (argomenti: string[], ambiente: Record<string, string> = {}) =>
    spawnSync(process.execPath, ['scripts/edizione.mjs', ...argomenti], { env: { ...process.env, AI_RADAR_DATA_DIR: dati, ...ambiente }, encoding: 'utf-8' });

  beforeEach(() => {
    dati = mkdtempSync(join(tmpdir(), 'ai-radar-edizione-'));
    scriviDati(FIXTURE as Record<string, unknown>);
  });
  afterEach(() => rmSync(dati, { recursive: true, force: true }));

  return {
    dati: () => dati,
    edizioni,
    fissa,
    immagine: () => join(edizioni(), `${SETTIMANA}.png`),
    scriviDati,
    comando,
    lancia: (evento: string, casella = '', ambiente: Record<string, string> = {}) => comando(['--evento', evento, '--casella', casella], ambiente),
    /** Una cartella di browser vuota: per il comando, Chromium non è installato. */
    senzaBrowser: () => ({ PLAYWRIGHT_BROWSERS_PATH: join(dati, 'nessun-browser') }),
    leggi: (): Edizione => JSON.parse(readFileSync(fissa(), 'utf-8')),
  };
}
