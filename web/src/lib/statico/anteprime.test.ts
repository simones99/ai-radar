// Il comando delle anteprime quando non arriva a fare un'immagine, quindi senza Chromium. Quando la fa: anteprime.browser.test.ts, con gli end-to-end.
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { anteprimeSuDatiDiProva, COMPETENZE, SEGNAPOSTO } from '../test/anteprime';

describe('il comando delle anteprime delle competenze, senza browser', { timeout: 60_000 }, () => {
  const { dati, sito, leggi, lancia, senzaBrowser } = anteprimeSuDatiDiProva();

  it('senza il browser fallisce nominando la prima competenza, e tutte tengono il segnaposto', () => {
    const giro = lancia(senzaBrowser());
    expect(giro.status).toBe(1);
    expect(giro.stderr).toMatch(/«agenti»/);
    expect(COMPETENZE.map(leggi)).toEqual(COMPETENZE.map(() => SEGNAPOSTO));
  });

  it('senza radar.json non c’è niente da fare: non è un errore e non serve il browser', () => {
    rmSync(join(dati(), 'radar.json'));
    const giro = lancia(senzaBrowser());
    expect(giro.status).toBe(0);
    expect(giro.stdout).toMatch(/nessuna anteprima/i);
  });

  it('se il sito non è costruito con questi dati lo dice prima di aprire il browser, e non scrive niente', () => {
    rmSync(join(sito(), 'competenze', 'rag'), { recursive: true });
    const giro = lancia(senzaBrowser());
    expect(giro.status).toBe(1);
    expect(giro.stderr).toMatch(/rag.*npm run build/s);
    expect(leggi('agenti')).toBe(SEGNAPOSTO);
  });
});
