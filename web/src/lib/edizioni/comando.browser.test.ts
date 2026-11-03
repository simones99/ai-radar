// Il comando quando fa un'immagine, quindi con Chromium: `npm run test:browser`, che nel workflow gira con gli end-to-end.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { comandoSuDatiDiProva, SETTIMANA } from '../test/comando';
import { FIXTURE } from '../test/fixtures';
import type { Edizione } from '.';

/** Larghezza e altezza di un PNG, dalla sua intestazione. */
function misurePng(file: string): [number, number] {
  const png = readFileSync(file);
  expect(png.subarray(1, 4).toString()).toBe('PNG');
  return [png.readUInt32BE(16), png.readUInt32BE(20)];
}

describe('il comando che fissa l’edizione e ne fa l’immagine', { timeout: 60_000 }, () => {
  const { dati, edizioni, fissa, immagine, scriviDati, comando, lancia, senzaBrowser, leggi } = comandoSuDatiDiProva();

  it('il giro programmato scrive il file della settimana, con i testi già composti, e accanto solo la sua immagine di 1200×630', () => {
    const giro = lancia('schedule');
    expect(giro.stderr).toBe('');
    expect(giro.status).toBe(0);
    expect(leggi()).toMatchObject({ versione: 1, settimana: SETTIMANA, precedente: null, correzioni: [] });
    expect(leggi().card).toHaveLength(9);
    expect(readdirSync(edizioni())).toEqual([`${SETTIMANA}.json`, `${SETTIMANA}.png`]);
    expect(misurePng(immagine())).toEqual([1200, 630]);
  });

  it('dice al workflow la settimana dell’edizione creata, per il messaggio del commit', () => {
    const uscita = join(dati(), 'github-output');
    expect(lancia('schedule', '', { GITHUB_OUTPUT: uscita }).status).toBe(0);
    expect(readFileSync(uscita, 'utf-8')).toBe(`settimana=${SETTIMANA}\n`);
  });

  it('un giro che trova l’edizione già creata non la ripropone al workflow', () => {
    lancia('schedule');
    const uscita = join(dati(), 'github-output');
    expect(lancia('schedule', '', { GITHUB_OUTPUT: uscita }).status).toBe(0);
    expect(existsSync(uscita)).toBe(false);
  });

  it('un secondo giro non sovrascrive, nemmeno con la casella, e non è un errore', () => {
    lancia('schedule');
    const corretto = { ...leggi(), correzioni: [{ data: '2026-10-14', testo: 'Scritta a mano.' }] };
    writeFileSync(fissa(), JSON.stringify(corretto));
    writeFileSync(immagine(), 'immagine già salvata');
    const prima = readFileSync(fissa(), 'utf-8');
    for (const giro of [lancia('schedule'), lancia('workflow_dispatch', 'true')]) {
      expect(giro.status).toBe(0);
      expect(giro.stdout).toMatch(/esiste già|nessuna edizione/i);
    }
    expect(readFileSync(fissa(), 'utf-8')).toBe(prima);
    expect(readFileSync(immagine(), 'utf-8')).toBe('immagine già salvata');
  });

  describe('un errore nell’immagine è un errore di creazione: la settimana resta senza edizione, senza file a metà', () => {
    it('con una porta che non entra', () => {
      scriviDati({ ai_act: { scadenze: [{ data: '2026-10-20', titolo: 'Una scadenza '.repeat(200), descrizione: '', fonte: 'https://esempio.org' }] } });
      const giro = lancia('schedule');
      expect(giro.status).toBe(1);
      expect(giro.stderr).toMatch(/non entrano/);
      expect(existsSync(edizioni()) ? readdirSync(edizioni()) : []).toEqual([]);
    });

    it('si rimedia con un giro dopo: la settimana si crea come se niente fosse', () => {
      lancia('schedule', '', senzaBrowser());
      expect(lancia('workflow_dispatch', 'true').status).toBe(0);
      expect(readdirSync(edizioni())).toEqual([`${SETTIMANA}.json`, `${SETTIMANA}.png`]);
    });
  });

  describe('dopo una correzione, un comando rigenera l’immagine', () => {
    const ALTRA = '2026-10-05';
    const rigenera = (settimana: string, ambiente: Record<string, string> = {}) => comando(['--immagine', settimana], ambiente);
    const correggi = () => {
      const e = leggi();
      writeFileSync(fissa(), JSON.stringify({ ...e, porte: [{ ...e.porte[0], titolo: [{ t: 'Una porta corretta a mano' }] }, e.porte[1]], correzioni: [{ data: '2026-10-14', testo: 'La porta era sbagliata.' }] }));
    };

    beforeEach(() => {
      lancia('schedule');
      writeFileSync(join(edizioni(), `${ALTRA}.json`), JSON.stringify({ ...leggi(), settimana: ALTRA }));
      writeFileSync(join(edizioni(), `${ALTRA}.png`), 'l’immagine dell’altra edizione');
    });

    it('mostra il testo corretto e non tocca né il file fisso né le altre edizioni', () => {
      const vecchia = readFileSync(immagine());
      correggi();
      const fissi = readFileSync(fissa(), 'utf-8');
      const altra = readFileSync(join(edizioni(), `${ALTRA}.json`), 'utf-8');
      const giro = rigenera(SETTIMANA);
      expect(giro.stderr).toBe('');
      expect(giro.status).toBe(0);
      expect(readFileSync(immagine()).equals(vecchia)).toBe(false);
      expect(misurePng(immagine())).toEqual([1200, 630]);
      expect(readFileSync(fissa(), 'utf-8')).toBe(fissi);
      expect(readFileSync(join(edizioni(), `${ALTRA}.json`), 'utf-8')).toBe(altra);
      expect(readFileSync(join(edizioni(), `${ALTRA}.png`), 'utf-8')).toBe('l’immagine dell’altra edizione');
      expect(readdirSync(edizioni()).sort()).toEqual([`${ALTRA}.json`, `${ALTRA}.png`, `${SETTIMANA}.json`, `${SETTIMANA}.png`]);
    });

    it('se l’immagine nuova non si può fare, resta quella di prima', () => {
      const vecchia = readFileSync(immagine());
      correggi();
      expect(rigenera(SETTIMANA, senzaBrowser()).status).toBe(1);
      expect(readFileSync(immagine()).equals(vecchia)).toBe(true);
    });
  });

  it('se il file fisso non si può scrivere non resta l’immagine da sola', () => {
    mkdirSync(join(edizioni(), `${SETTIMANA}.json.tmp`), { recursive: true }); // al suo posto c'è una cartella: la scrittura fallisce
    expect(lancia('schedule').status).toBe(1);
    expect(existsSync(fissa())).toBe(false);
    expect(existsSync(immagine())).toBe(false);
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
});
