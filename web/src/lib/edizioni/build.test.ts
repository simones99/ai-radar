// Pagine e archivio escono dallo stesso comando di build del sito: gli end-to-end la rilanciano, e il workflow pubblica quella cartella.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Dataset } from '../data/types';
import { FIXTURE } from '../test/fixtures';
import { scriviSito } from './cartella';
import { creaEdizione, type Edizione } from '.';

const ALTRO_INDIRIZZO = 'https://altro-utente.github.io/altro-radar/';
/** Non serve un'immagine vera: la build non la guarda. */
const PNG = (settimana: string) => `il png del ${settimana}`;

describe('il sito costruito', () => {
  let cartella: string;
  const conEdizioni = () => join(cartella, 'con');
  const senzaEdizioni = () => join(cartella, 'senza');
  const pagina = (...parti: string[]) => new DOMParser().parseFromString(readFileSync(join(conEdizioni(), ...parti), 'utf-8'), 'text/html');

  const build = (uscita: string, dati: string) =>
    execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', uscita, '--emptyOutDir', '--logLevel', 'error'], {
      // senza un browser a disposizione: la build le immagini le copia soltanto
      env: { ...process.env, NODE_ENV: 'production', AI_RADAR_BASE_URL: ALTRO_INDIRIZZO, AI_RADAR_DATA_DIR: dati, PLAYWRIGHT_BROWSERS_PATH: join(cartella, 'nessun-browser') },
    });

  beforeAll(() => {
    cartella = mkdtempSync(join(tmpdir(), 'ai-radar-build-'));
    const dati = join(cartella, 'dati');
    const vuota = join(cartella, 'vuota');
    mkdirSync(join(dati, 'edizioni'), { recursive: true });
    mkdirSync(vuota);
    const d = FIXTURE as Dataset;
    const prima = creaEdizione(d, null) as Edizione;
    const seconda = creaEdizione({ ...d, status: { ...d.status!, aggiornato: '2026-10-22T08:00:00+00:00' } }, prima) as Edizione;
    for (const e of [prima, seconda]) {
      writeFileSync(join(dati, 'edizioni', `${e.settimana}.json`), JSON.stringify(e));
      writeFileSync(join(dati, 'edizioni', `${e.settimana}.png`), PNG(e.settimana));
    }
    writeFileSync(join(dati, 'edizioni', 'LEGGIMI.txt'), 'non è un’edizione');
    build(conEdizioni(), dati);
    build(senzaEdizioni(), vuota);
  }, 300_000);
  afterAll(() => rmSync(cartella, { recursive: true, force: true }));

  it('con le edizioni salvate ci sono le loro pagine e l’archivio', () => {
    expect(readdirSync(join(conEdizioni(), 'edizioni')).sort()).toEqual(['2026-10-12', '2026-10-19', 'index.html']);
    expect(pagina('edizioni', '2026-10-12', 'index.html').title).toBe('AI Radar, settimana del 12 ott 2026');
    expect(pagina('edizioni', 'index.html').querySelectorAll('main li')).toHaveLength(2);
  });

  it('gli indirizzi assoluti seguono l’indirizzo base', () => {
    expect(pagina('edizioni', '2026-10-19', 'index.html').querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${ALTRO_INDIRIZZO}edizioni/2026-10-19/`);
  });

  it('l’immagine di ogni edizione è copiata così com’è accanto alla sua pagina, e il tag porta lì', () => {
    for (const settimana of ['2026-10-12', '2026-10-19']) {
      expect(readdirSync(join(conEdizioni(), 'edizioni', settimana)).sort()).toEqual(['anteprima.png', 'index.html']);
      expect(readFileSync(join(conEdizioni(), 'edizioni', settimana, 'anteprima.png'), 'utf-8')).toBe(PNG(settimana));
      expect(pagina('edizioni', settimana, 'index.html').querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(`${ALTRO_INDIRIZZO}edizioni/${settimana}/anteprima.png`);
    }
  });

  it('l’archivio usa l’immagine fissa della home, con lo stesso testo alternativo, e quell’immagine è nel sito', () => {
    const home = new DOMParser().parseFromString(readFileSync(join(conEdizioni(), 'index.html'), 'utf-8'), 'text/html');
    const archivio = pagina('edizioni', 'index.html');
    for (const tag of ['og:image', 'og:image:alt', 'og:locale', 'og:site_name']) {
      const selettore = `meta[property="${tag}"]`;
      expect(archivio.querySelector(selettore)?.getAttribute('content')).toBe(home.querySelector(selettore)?.getAttribute('content'));
    }
    expect(existsSync(join(conEdizioni(), 'anteprima.png'))).toBe(true);
  });

  it('un’edizione salvata senza la sua immagine ferma la build con un messaggio chiaro, invece di pubblicare un’anteprima rotta', () => {
    const dati = join(cartella, 'senza-immagine');
    mkdirSync(join(dati, 'edizioni'), { recursive: true });
    writeFileSync(join(dati, 'edizioni', '2026-10-12.json'), JSON.stringify(creaEdizione(FIXTURE as Dataset, null)));
    const scrivi = () => scriviSito({ dati, uscita: join(dati, 'uscita'), indirizzoBase: ALTRO_INDIRIZZO, htmlHome: '<link rel="stylesheet" href="./assets/a.css">' });
    expect(scrivi).toThrow(/2026-10-12.*senza la sua immagine.*--immagine 2026-10-12/);
  });

  it('il foglio di stile delle pagine è quello della home, e contiene i token', () => {
    const home = new DOMParser().parseFromString(readFileSync(join(conEdizioni(), 'index.html'), 'utf-8'), 'text/html');
    const dallaHome = home.querySelector('link[rel="stylesheet"]')?.getAttribute('href') as string;
    expect(pagina('edizioni', '2026-10-12', 'index.html').querySelector('link[rel="stylesheet"]')?.getAttribute('href')).toBe(`../../${dallaHome.replace(/^\.\//, '')}`);
    expect(pagina('edizioni', 'index.html').querySelector('link[rel="stylesheet"]')?.getAttribute('href')).toBe(`../${dallaHome.replace(/^\.\//, '')}`);
    const css = readFileSync(join(conEdizioni(), dallaHome), 'utf-8');
    expect(css).toContain('--accent');
    expect(css).toContain('Bricolage Grotesque Variable');
  });

  it('senza edizioni pagine e archivio non esistono', () => {
    expect(existsSync(join(senzaEdizioni(), 'edizioni'))).toBe(false);
  });

  it('la home e i dati caricati dall’app non cambiano: nessun JSON di edizione tra i file serviti', () => {
    expect(readFileSync(join(conEdizioni(), 'index.html'), 'utf-8')).toBe(readFileSync(join(senzaEdizioni(), 'index.html'), 'utf-8'));
    expect(existsSync(join(conEdizioni(), 'data', 'edizioni'))).toBe(false);
    expect(readdirSync(conEdizioni()).sort()).toEqual([...readdirSync(senzaEdizioni()), 'edizioni'].sort());
  });
});
