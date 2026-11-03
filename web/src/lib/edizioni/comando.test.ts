// Il comando vero, su una cartella temporanea di dati: `npm run edizione`, come lo lancia il workflow.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FIXTURE } from '../test/fixtures';
import type { Edizione } from '.';

const SETTIMANA = '2026-10-12'; // il lunedì di status.aggiornato nel FIXTURE

describe('il comando che fissa l’edizione', { timeout: 60_000 }, () => {
  let dati: string;
  const edizioni = () => join(dati, 'edizioni');
  const fissa = () => join(edizioni(), `${SETTIMANA}.json`);
  const scriviDati = (parti: Record<string, unknown>) => {
    for (const [nome, contenuto] of Object.entries(parti)) writeFileSync(join(dati, `${nome}.json`), JSON.stringify(contenuto));
  };
  const lancia = (evento: string, casella = '') =>
    spawnSync(process.execPath, ['scripts/edizione.mjs', '--evento', evento, '--casella', casella], { env: { ...process.env, AI_RADAR_DATA_DIR: dati }, encoding: 'utf-8' });
  const leggi = (): Edizione => JSON.parse(readFileSync(fissa(), 'utf-8'));

  beforeEach(() => {
    dati = mkdtempSync(join(tmpdir(), 'ai-radar-edizione-'));
    scriviDati(FIXTURE as Record<string, unknown>);
  });
  afterEach(() => rmSync(dati, { recursive: true, force: true }));

  it('il giro programmato scrive il file della settimana, con i testi già composti e nient’altro accanto', () => {
    const giro = lancia('schedule');
    expect(giro.stderr).toBe('');
    expect(giro.status).toBe(0);
    expect(leggi()).toMatchObject({ versione: 1, settimana: SETTIMANA, precedente: null, correzioni: [] });
    expect(leggi().card).toHaveLength(9);
    expect(readdirSync(edizioni())).toEqual([`${SETTIMANA}.json`]);
  });

  it('un secondo giro non sovrascrive, nemmeno con la casella, e non è un errore', () => {
    lancia('schedule');
    const corretto = { ...leggi(), correzioni: [{ data: '2026-10-14', testo: 'Scritta a mano.' }] };
    writeFileSync(fissa(), JSON.stringify(corretto));
    const prima = readFileSync(fissa(), 'utf-8');
    for (const giro of [lancia('schedule'), lancia('workflow_dispatch', 'true')]) {
      expect(giro.status).toBe(0);
      expect(giro.stdout).toMatch(/esiste già|nessuna edizione/i);
    }
    expect(readFileSync(fissa(), 'utf-8')).toBe(prima);
  });

  it('un push non crea, nemmeno con la casella accesa', () => {
    expect(lancia('push', 'true').status).toBe(0);
    expect(existsSync(fissa())).toBe(false);
  });

  it('un push non crea nemmeno senza lo stato delle fonti, e non è un errore', () => {
    rmSync(join(dati, 'status.json'));
    expect(lancia('push').status).toBe(0);
  });

  it('l’avvio manuale con la casella spenta non crea', () => {
    for (const casella of ['false', '']) {
      expect(lancia('workflow_dispatch', casella).status).toBe(0);
      expect(existsSync(fissa())).toBe(false);
    }
  });

  it('l’avvio manuale con la casella accesa crea', () => {
    expect(lancia('workflow_dispatch', 'true').status).toBe(0);
    expect(leggi().settimana).toBe(SETTIMANA);
  });

  it('si confronta con l’edizione più recente tra quelle già uscite, non con una futura', () => {
    lancia('schedule');
    const prima = leggi();
    writeFileSync(join(edizioni(), '2026-10-05.json'), JSON.stringify({ ...prima, settimana: '2026-10-05' }));
    writeFileSync(join(edizioni(), '2026-10-26.json'), JSON.stringify({ ...prima, settimana: '2026-10-26' }));
    scriviDati({ status: { ...(FIXTURE.status as object), aggiornato: '2026-10-22T08:00:00+00:00' } });
    expect(lancia('schedule').status).toBe(0);
    const nuova = JSON.parse(readFileSync(join(edizioni(), '2026-10-19.json'), 'utf-8')) as Edizione;
    expect(nuova.precedente).toBe(SETTIMANA);
    expect(nuova.porte.map((p) => p.cambiata)).toEqual([false, false]);
  });

  it('con tutte e due le porte senza dati l’edizione non esce, e il giro lo segnala con un errore', () => {
    for (const nome of readdirSync(dati)) if (nome !== 'status.json') rmSync(join(dati, nome), { recursive: true });
    const giro = lancia('schedule');
    expect(giro.status).toBe(1);
    expect(giro.stderr).toMatch(/senza dati/);
    expect(existsSync(edizioni())).toBe(false);
  });

  it('un file di dati illeggibile è un errore, e non lascia un’edizione scritta a metà', () => {
    writeFileSync(join(dati, 'radar.json'), '{ rotto');
    const giro = lancia('schedule');
    expect(giro.status).toBe(1);
    expect(existsSync(fissa())).toBe(false);
  });

  it('un file il cui nome non è la sua settimana è un errore: l’indirizzo non sarebbe quello del file', () => {
    mkdirSync(edizioni());
    writeFileSync(join(edizioni(), '2026-10-05.json'), JSON.stringify({ settimana: '2026-09-28' }));
    const giro = lancia('schedule');
    expect(giro.status).toBe(1);
    expect(giro.stderr).toMatch(/2026-10-05\.json/);
  });
});
