// Il feed visto da chi lo legge: l'XML che esce dal modulo Edizioni, letto con un parser.
import { describe, expect, it } from 'vitest';
import type { Dataset } from '../data/types';
import { FIXTURE } from '../test/fixtures';
import { creaEdizione, fileDelSito, type Edizione } from '.';

const BASE = 'https://altro-utente.github.io/altro-radar/';
const d = FIXTURE as Dataset;
const prima = creaEdizione(d, null) as Edizione;
const seconda = creaEdizione({ ...d, status: { ...d.status!, aggiornato: '2026-10-22T08:00:00+00:00' } }, prima) as Edizione;

const opzioni = (indirizzoBase = BASE) => ({ indirizzoBase, foglio: 'assets/index-abc123.css' });
const xml = (...ed: Edizione[]) => fileDelSito(ed, opzioni())['feed.xml'];
const leggi = (testo: string) => {
  const doc = new DOMParser().parseFromString(testo, 'application/xml');
  expect(doc.querySelector('parsererror')).toBeNull();
  return doc;
};
const canale = (...ed: Edizione[]) => leggi(xml(...ed)).querySelector('rss > channel')!;
const figlio = (el: Element, nome: string) => [...el.children].find((c) => c.tagName === nome);
const voci = (...ed: Edizione[]) => [...canale(...ed).querySelectorAll('item')];

describe('il canale del feed', () => {
  it('prima della prima edizione non esiste', () => {
    expect(fileDelSito([], opzioni())).not.toHaveProperty(['feed.xml']);
  });

  it('è RSS 2.0, in italiano, e ha titolo, link e descrizione', () => {
    const doc = leggi(xml(prima));
    expect(doc.documentElement.tagName).toBe('rss');
    expect(doc.documentElement.getAttribute('version')).toBe('2.0');
    const c = canale(prima);
    expect(figlio(c, 'language')?.textContent).toBe('it');
    expect(figlio(c, 'title')?.textContent).toBe('AI Radar, le edizioni');
    expect(figlio(c, 'link')?.textContent).toBe(`${BASE}edizioni/`);
    expect(figlio(c, 'description')?.textContent).toBeTruthy();
  });

  it('ha un atom:link verso se stesso, nello spazio dei nomi di Atom', () => {
    const atom = canale(prima).getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'link')[0];
    expect(atom.getAttribute('href')).toBe(`${BASE}feed.xml`);
    expect(atom.getAttribute('rel')).toBe('self');
    expect(atom.getAttribute('type')).toBe('application/rss+xml');
  });

  it('ha una voce per edizione, dalla più recente, qualunque sia l’ordine in cui arrivano', () => {
    expect(voci(prima, seconda).map((v) => figlio(v, 'title')?.textContent)).toEqual(['AI Radar, settimana del 19 ott 2026', 'AI Radar, settimana del 12 ott 2026']);
  });

  it('tiene le ultime 26 edizioni, mentre l’archivio resta completo', () => {
    const tante = Array.from({ length: 30 }, (_, i) => ({ ...prima, settimana: `20${10 + i}-01-04` }));
    const v = voci(...tante);
    expect(v).toHaveLength(26);
    expect(figlio(v[0], 'title')?.textContent).toContain('2039');
    expect(figlio(v[25], 'title')?.textContent).toContain('2014');
    const archivio = new DOMParser().parseFromString(fileDelSito(tante, opzioni())['edizioni/index.html'], 'text/html');
    expect(archivio.querySelectorAll('main li')).toHaveLength(30);
    expect(Object.keys(fileDelSito(tante, opzioni())).filter((p) => /^edizioni\/\d/.test(p))).toHaveLength(30);
  });
});

describe('una voce del feed', () => {
  const voce = (e: Edizione = prima) => voci(e)[0];
  /** Il testo intero della voce, come lo apre un lettore di feed. */
  const testoIntero = (e: Edizione = prima) => {
    const html = voce(e).getElementsByTagNameNS('http://purl.org/rss/1.0/modules/content/', 'encoded')[0].textContent ?? '';
    return new DOMParser().parseFromString(html, 'text/html');
  };

  it('ha il titolo con la data, il link all’edizione e pubDate dal momento della raccolta', () => {
    const v = voce();
    expect(figlio(v, 'title')?.textContent).toBe('AI Radar, settimana del 12 ott 2026');
    expect(figlio(v, 'link')?.textContent).toBe(`${BASE}edizioni/2026-10-12/`);
    expect(figlio(v, 'pubDate')?.textContent).toBe('Thu, 15 Oct 2026 08:00:00 GMT');
  });

  it('la descrizione contiene le due porte, Per te per prima', () => {
    expect(figlio(voce(), 'description')?.textContent).toBe("MCP entra tra le competenze da imparare ora; RAG esce. 16% delle imprese italiane usa l'AI (UE: 20%).");
  });

  it('ha il testo intero in HTML: porte, frasi, notizie, fonti e link', () => {
    const doc = testoIntero();
    const t = doc.body.textContent;
    expect(t).toContain('MCP entra tra le competenze da imparare ora; RAG esce');
    expect(t).toContain("16% delle imprese italiane usa l'AI (UE: 20%)");
    expect(t).toContain("Imprese italiane che usano l'AI nel 2025. UE: 20%.");
    expect(t).toContain("The Adzuna API (termini d'uso di Adzuna)");
    expect(t).toContain('non sono una classifica');
    const notizia = [...doc.querySelectorAll('a')].find((a) => a.textContent === "Google says self-improving AI isn't anywhere close")!;
    expect(notizia.getAttribute('href')).toBe('https://the-decoder.com/a');
    expect(notizia.closest('li')?.textContent).toContain('The Decoder');
    expect([...doc.querySelectorAll('a')].find((a) => a.textContent === 'The Adzuna API')?.getAttribute('href')).toMatch(/^https:/);
  });

  it('i link alle card sono assoluti e seguono l’indirizzo base: nel lettore non c’è una pagina da cui partire', () => {
    const doc = testoIntero();
    expect([...doc.querySelectorAll('a')].find((a) => a.textContent === 'Norme')?.getAttribute('href')).toBe(`${BASE}#norme`);
    expect([...doc.querySelectorAll('a')].find((a) => a.textContent === 'Le altre notizie, nella card Notizie')?.getAttribute('href')).toBe(`${BASE}#notizie`);
    for (const a of doc.querySelectorAll('a')) expect(a.getAttribute('href')).toMatch(/^https?:\/\//);
  });

  it('non ripete il titolo, che il lettore mostra già, e non parla di una pagina', () => {
    const doc = testoIntero();
    expect(doc.querySelector('h1')).toBeNull();
    expect(doc.body.textContent).toMatch(/Questa edizione resta com'è, con i dati raccolti il 15 ott 2026/);
  });
});
