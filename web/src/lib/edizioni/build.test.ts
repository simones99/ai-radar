// Pagine e archivio escono dallo stesso comando di build del sito: gli end-to-end la rilanciano, e il workflow pubblica quella cartella.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Dataset } from '../data/types';
import { FIXTURE } from '../test/fixtures';
import { creaEdizione, type Edizione } from '.';

const ALTRO_INDIRIZZO = 'https://altro-utente.github.io/altro-radar/';

describe('il sito costruito', () => {
  let cartella: string;
  const conEdizioni = () => join(cartella, 'con');
  const senzaEdizioni = () => join(cartella, 'senza');
  const pagina = (...parti: string[]) => new DOMParser().parseFromString(readFileSync(join(conEdizioni(), ...parti), 'utf-8'), 'text/html');

  const build = (uscita: string, dati: string) =>
    execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', uscita, '--emptyOutDir', '--logLevel', 'error'], {
      env: { ...process.env, NODE_ENV: 'production', AI_RADAR_BASE_URL: ALTRO_INDIRIZZO, AI_RADAR_DATA_DIR: dati },
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
    for (const e of [prima, seconda]) writeFileSync(join(dati, 'edizioni', `${e.settimana}.json`), JSON.stringify(e));
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
    expect(readdirSync(conEdizioni()).sort()).toEqual([...readdirSync(senzaEdizioni()), 'edizioni', 'feed.xml'].sort());
  });

  it('il feed sta nella radice del sito con le voci delle edizioni salvate, e i suoi indirizzi seguono l’indirizzo base', () => {
    const feed = new DOMParser().parseFromString(readFileSync(join(conEdizioni(), 'feed.xml'), 'utf-8'), 'application/xml');
    expect(feed.querySelector('parsererror')).toBeNull();
    expect(feed.querySelectorAll('item')).toHaveLength(2);
    expect(feed.getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'link')[0].getAttribute('href')).toBe(`${ALTRO_INDIRIZZO}feed.xml`);
  });

  it('senza edizioni il feed non esiste', () => {
    expect(existsSync(join(senzaEdizioni(), 'feed.xml'))).toBe(false);
  });
});
