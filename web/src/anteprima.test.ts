// L'anteprima di condivisione della home, sul sito costruito davvero in una cartella a parte.
// I tag si leggono dall'HTML grezzo, come fa un crawler: nessun JavaScript eseguito.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const ALTRO_INDIRIZZO = 'https://altro-utente.github.io/altro-radar/';

describe('il sito costruito con un altro indirizzo base', () => {
  let cartella: string;
  let html: string;
  let pagina: Document;
  const meta = (attributo: string, nome: string) => pagina.querySelector(`meta[${attributo}="${nome}"]`)?.getAttribute('content');
  const og = (nome: string) => meta('property', `og:${nome}`);

  beforeAll(() => {
    cartella = mkdtempSync(join(tmpdir(), 'ai-radar-anteprima-'));
    execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', cartella, '--emptyOutDir', '--logLevel', 'error'], {
      env: { ...process.env, NODE_ENV: 'production', AI_RADAR_BASE_URL: ALTRO_INDIRIZZO },
    });
    html = readFileSync(join(cartella, 'index.html'), 'utf-8');
    pagina = new DOMParser().parseFromString(html, 'text/html');
  }, 180_000);
  afterAll(() => rmSync(cartella, { recursive: true, force: true }));

  it('la home ha titolo, descrizione e tipo dell’anteprima, sempre gli stessi', () => {
    expect(og('title')).toBe('AI Radar');
    expect(og('description')).toMatch(/^Cosa succede nell'AI ogni settimana/);
    expect(og('description')).toBe(meta('name', 'description'));
    expect(og('type')).toBe('website');
    expect(og('locale')).toBe('it_IT');
    expect(og('site_name')).toBe('AI Radar');
    expect(meta('name', 'twitter:card')).toBe('summary_large_image');
  });

  it('gli indirizzi sono assoluti e seguono l’indirizzo base', () => {
    expect(og('url')).toBe(ALTRO_INDIRIZZO);
    expect(pagina.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(ALTRO_INDIRIZZO);
    expect(og('image')).toMatch(new RegExp(`^${ALTRO_INDIRIZZO}[^/]+\\.png$`));
    expect(html).not.toContain('simones99');
  });

  it('l’immagine ha un testo alternativo, sta nel sito e misura 1200×630', () => {
    expect(og('image:alt')).toMatch(/AI Radar/);
    const png = readFileSync(join(cartella, og('image')!.slice(ALTRO_INDIRIZZO.length)));
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]); // larghezza e altezza nell'intestazione del PNG
  });

  it('la build copia l’immagine salvata nel repo, senza rifarla', () => {
    const nome = og('image')!.slice(ALTRO_INDIRIZZO.length);
    expect(readFileSync(join(cartella, nome)).equals(readFileSync(join('public', nome)))).toBe(true);
  });
});
