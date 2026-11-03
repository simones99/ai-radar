// Il comando quando non arriva a fare un'immagine, quindi senza Chromium. Quando la fa: comando.browser.test.ts, con gli end-to-end.
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { comandoSuDatiDiProva } from '../test/comando';

describe('il comando che fissa l’edizione, senza browser', { timeout: 60_000 }, () => {
  const { dati, edizioni, fissa, comando, lancia, senzaBrowser } = comandoSuDatiDiProva();

  it('un push non crea, nemmeno con la casella accesa', () => {
    expect(lancia('push', 'true').status).toBe(0);
    expect(existsSync(fissa())).toBe(false);
  });

  it('un giro che non crea non ha bisogno del browser', () => {
    expect(lancia('push', '', senzaBrowser()).status).toBe(0);
  });

  it('un giro che non crea non dice al workflow nessuna settimana', () => {
    const uscita = join(dati(), 'github-output');
    expect(lancia('push', '', { GITHUB_OUTPUT: uscita }).status).toBe(0);
    expect(existsSync(uscita)).toBe(false);
  });

  it('senza il browser l’edizione non si crea: è un errore, non resta nessun file a metà e il workflow non ha niente da salvare', () => {
    const uscita = join(dati(), 'github-output');
    const giro = lancia('schedule', '', { ...senzaBrowser(), GITHUB_OUTPUT: uscita });
    expect(giro.status).toBe(1);
    expect(giro.stderr).not.toBe('');
    expect(existsSync(edizioni()) ? readdirSync(edizioni()) : []).toEqual([]);
    expect(existsSync(uscita)).toBe(false);
  });

  it('un push non crea nemmeno senza lo stato delle fonti, e non è un errore', () => {
    rmSync(join(dati(), 'status.json'));
    expect(lancia('push').status).toBe(0);
  });

  it('l’avvio manuale con la casella spenta non crea', () => {
    for (const casella of ['false', '']) {
      expect(lancia('workflow_dispatch', casella).status).toBe(0);
      expect(existsSync(fissa())).toBe(false);
    }
  });

  it('con tutte e due le porte senza dati l’edizione non esce, e il giro lo segnala con un errore', () => {
    for (const nome of readdirSync(dati())) if (nome !== 'status.json') rmSync(join(dati(), nome), { recursive: true });
    const giro = lancia('schedule');
    expect(giro.status).toBe(1);
    expect(giro.stderr).toMatch(/senza dati/);
    expect(existsSync(edizioni())).toBe(false);
  });

  it('un file di dati illeggibile è un errore, e non lascia un’edizione scritta a metà', () => {
    writeFileSync(join(dati(), 'radar.json'), '{ rotto');
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

  it('rifare l’immagine di un’edizione che non esiste è un errore, e non crea niente', () => {
    const giro = comando(['--immagine', '2026-09-07']);
    expect(giro.status).toBe(1);
    expect(giro.stderr).toMatch(/2026-09-07/);
    expect(existsSync(join(edizioni(), '2026-09-07.png'))).toBe(false);
  });
});
