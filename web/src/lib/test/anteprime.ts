// Il comando delle anteprime delle competenze, vero, su una cartella temporanea di dati e su un sito costruito finto: la base dei suoi due file di test.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach } from 'vitest';
import type { Dataset, Radar } from '../data/types';
import { FIXTURE } from './fixtures';

export const SEGNAPOSTO = 'la copia dell’immagine della home';
export const RADAR = (FIXTURE as Dataset).radar as Radar;
/** Le competenze del FIXTURE, nell'ordine di radar.json: quello in cui il comando le fotografa. */
export const COMPETENZE = RADAR.competenze.map((c) => c.id);

/** Una cartella di dati con il FIXTURE e un sito con i segnaposto che lascia la build, nuovi per ogni test. */
export function anteprimeSuDatiDiProva() {
  let cartella: string;
  const dati = () => join(cartella, 'dati');
  const sito = () => join(cartella, 'sito');
  const immagine = (id: string) => join(sito(), 'competenze', id, 'anteprima.png');

  beforeEach(() => {
    cartella = mkdtempSync(join(tmpdir(), 'ai-radar-anteprime-'));
    mkdirSync(dati());
    for (const [nome, contenuto] of Object.entries(FIXTURE)) writeFileSync(join(dati(), `${nome}.json`), JSON.stringify(contenuto));
    for (const id of COMPETENZE) {
      mkdirSync(join(sito(), 'competenze', id), { recursive: true });
      writeFileSync(immagine(id), SEGNAPOSTO);
    }
  });
  afterEach(() => rmSync(cartella, { recursive: true, force: true }));

  return {
    dati,
    sito,
    /** Ciò che c'è al posto dell'immagine: il segnaposto, o le misure del PNG dalla sua intestazione. */
    leggi: (id: string): string | [number, number] => {
      const file = readFileSync(immagine(id));
      return file.subarray(1, 4).toString() === 'PNG' ? [file.readUInt32BE(16), file.readUInt32BE(20)] : file.toString();
    },
    scriviRadar: (radar: Radar) => writeFileSync(join(dati(), 'radar.json'), JSON.stringify(radar)),
    lancia: (ambiente: Record<string, string> = {}) =>
      spawnSync(process.execPath, ['scripts/anteprime-competenze.mjs', '--sito', sito()], { env: { ...process.env, AI_RADAR_DATA_DIR: dati(), ...ambiente }, encoding: 'utf-8' }),
    /** Una cartella di browser vuota: per il comando, Chromium non è installato. */
    senzaBrowser: () => ({ PLAYWRIGHT_BROWSERS_PATH: join(cartella, 'nessun-browser') }),
  };
}
