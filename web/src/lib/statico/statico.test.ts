// La mappa dei file pubblici del sito: le edizioni, e i dati di radar.json per le pagine che ne nascono.
import { describe, expect, it } from 'vitest';
import type { Dataset } from '../data/types';
import { creaEdizione, fileDelleEdizioni, type Edizione } from '../edizioni';
import { FIXTURE } from '../test/fixtures';
import { filePubblici, type ContenutoStatico, type OpzioniFilePubblici } from '.';

const opzioni = { indirizzoBase: 'https://esempio.org/ai-radar/', foglio: 'assets/index-abc.css' };
const d = FIXTURE as Dataset;
const edizione = creaEdizione(d, null) as Edizione;
const PAGINA = `edizioni/${edizione.settimana}/index.html`;
/** Il link della testata verso l'indice delle competenze, come lo scrive la pagina. */
const LINK_COMPETENZE = /<a href="[^"]*competenze\/">Competenze<\/a>/;

describe('i file pubblici del sito', () => {
  it('con un’edizione e il radar ci sono la pagina dell’edizione, l’archivio e il feed', () => {
    const file = filePubblici({ edizioni: [edizione], radar: d.radar }, opzioni);
    expect(Object.keys(file)).toEqual(expect.arrayContaining([PAGINA, 'edizioni/index.html', 'feed.xml']));
  });

  it('senza il radar i file sono esattamente quelli delle edizioni, più la sitemap', () => {
    const { 'sitemap.xml': sitemap, ...resto } = filePubblici({ edizioni: [edizione] }, opzioni);
    expect(sitemap).toBeDefined();
    expect(resto).toEqual(fileDelleEdizioni([edizione], opzioni));
    expect(Object.keys(filePubblici({ edizioni: [] }, opzioni))).toEqual(['sitemap.xml']);
  });

  it('il radar aggiunge le pagine delle competenze, e i file delle edizioni cambiano solo per il link «Competenze» nella testata', () => {
    const file = filePubblici({ edizioni: [edizione], radar: d.radar }, opzioni);
    expect(Object.keys(file).filter((p) => p.startsWith('competenze/')).length).toBeGreaterThan(0);
    for (const [percorso, contenuto] of Object.entries(fileDelleEdizioni([edizione], opzioni))) {
      expect(file[percorso].replace(LINK_COMPETENZE, ''), percorso).toBe(contenuto);
    }
  });
});

describe('il link «Competenze» nella testata', () => {
  const file = filePubblici({ edizioni: [edizione], radar: d.radar }, opzioni);
  const testata = (percorso: string) => new DOMParser().parseFromString(file[percorso], 'text/html').querySelector('header nav');
  const linkCompetenze = (percorso: string) => [...testata(percorso)!.querySelectorAll('a')].find((a) => a.textContent === 'Competenze')?.getAttribute('href');

  it('porta all’indice da ogni pagina statica, con l’indirizzo relativo giusto a ogni livello', () => {
    expect(linkCompetenze(PAGINA)).toBe('../../competenze/');
    expect(linkCompetenze('edizioni/index.html')).toBe('../competenze/');
    expect(linkCompetenze('competenze/mcp/index.html')).toBe('../../competenze/');
  });

  it('l’indice non porta a se stesso', () => {
    expect(linkCompetenze('competenze/index.html')).toBeUndefined();
  });

  it('le pagine delle competenze e l’indice portano anche alle edizioni, quando esistono: la testata è la stessa ovunque', () => {
    const nav = (percorso: string, f = file) => [...new DOMParser().parseFromString(f[percorso], 'text/html').querySelectorAll('header nav a')].map((a) => [a.textContent, a.getAttribute('href')]);
    expect(nav('competenze/mcp/index.html')).toEqual([['Competenze', '../../competenze/'], ['Edizioni', '../../edizioni/'], ['Dati di oggi', '../../'], ['Segui con RSS', '../../feed.xml']]);
    expect(nav(PAGINA)).toEqual([['Competenze', '../../competenze/'], ['Edizioni', '../'], ['Dati di oggi', '../../'], ['Segui con RSS', '../../feed.xml']]);
    expect(nav('competenze/index.html')).toEqual([['Edizioni', '../edizioni/'], ['Dati di oggi', '../'], ['Segui con RSS', '../feed.xml']]);
    const senzaEdizioni = filePubblici({ edizioni: [], radar: d.radar }, opzioni);
    expect(nav('competenze/mcp/index.html', senzaEdizioni).map(([t]) => t)).toEqual(['Competenze', 'Dati di oggi', 'Segui con RSS']);
  });

  it('senza le pagine delle competenze nessuna testata ha il link', () => {
    for (const html of Object.values(filePubblici({ edizioni: [edizione] }, opzioni))) expect(html).not.toMatch(LINK_COMPETENZE);
  });
});

describe('la sitemap', () => {
  const leggi = (testo: string) => {
    const doc = new DOMParser().parseFromString(testo, 'application/xml');
    expect(doc.querySelector('parsererror')).toBeNull();
    return doc;
  };
  const indirizzi = (c: ContenutoStatico, o: OpzioniFilePubblici = opzioni) => {
    const sitemap = filePubblici(c, o)['sitemap.xml'];
    expect(sitemap, 'la mappa non ha sitemap.xml').toBeDefined();
    return [...leggi(sitemap).querySelectorAll('url > loc')].map((l) => l.textContent);
  };

  it('c’è sempre, e senza edizioni né radar ha la sola home', () => {
    expect(indirizzi({ edizioni: [] })).toEqual(['https://esempio.org/ai-radar/']);
  });

  it('con edizioni e radar elenca la home, l’indice e ogni competenza, l’archivio e ogni edizione, in ordine di percorso, e nient’altro', () => {
    expect(indirizzi({ edizioni: [edizione], radar: d.radar })).toEqual([
      'https://esempio.org/ai-radar/',
      'https://esempio.org/ai-radar/competenze/',
      'https://esempio.org/ai-radar/competenze/agenti/',
      'https://esempio.org/ai-radar/competenze/mcp/',
      'https://esempio.org/ai-radar/competenze/rag/',
      'https://esempio.org/ai-radar/competenze/robotica/',
      'https://esempio.org/ai-radar/competenze/vector-db/',
      'https://esempio.org/ai-radar/edizioni/',
      `https://esempio.org/ai-radar/edizioni/${edizione.settimana}/`,
    ]);
  });

  it('senza edizioni ha home e competenze, senza radar home ed edizioni', () => {
    expect(indirizzi({ edizioni: [], radar: d.radar })).toEqual(['', 'competenze/', 'competenze/agenti/', 'competenze/mcp/', 'competenze/rag/', 'competenze/robotica/', 'competenze/vector-db/'].map((c) => `https://esempio.org/ai-radar/${c}`));
    expect(indirizzi({ edizioni: [edizione] })).toEqual(['', 'edizioni/', `edizioni/${edizione.settimana}/`].map((c) => `https://esempio.org/ai-radar/${c}`));
  });

  it('la copia della home che la mappa contiene con le edizioni non aggiunge una seconda voce', () => {
    const home = '<!doctype html><html><head><link rel="canonical" href="https://esempio.org/ai-radar/" /></head><body></body></html>';
    const file = filePubblici({ edizioni: [edizione] }, { ...opzioni, home });
    expect(file['index.html']).toBeDefined();
    expect(indirizzi({ edizioni: [edizione] }, { ...opzioni, home })).toEqual(['', 'edizioni/', `edizioni/${edizione.settimana}/`].map((c) => `https://esempio.org/ai-radar/${c}`));
  });

  it('ogni indirizzo è assoluto e segue l’indirizzo base, anche quando non è quello predefinito', () => {
    const base = 'https://altro-utente.github.io/altro-radar/';
    const loc = indirizzi({ edizioni: [edizione], radar: d.radar }, { ...opzioni, indirizzoBase: base });
    expect(loc[0]).toBe(base);
    expect(loc).toHaveLength(9);
    for (const l of loc) expect(l!.startsWith(base), l!).toBe(true);
  });

  it('ogni indirizzo coincide con il canonical scritto nella pagina della mappa a quel percorso', () => {
    const home = '<!doctype html><html><head><link rel="canonical" href="https://esempio.org/ai-radar/" /></head><body></body></html>';
    const file = filePubblici({ edizioni: [edizione], radar: d.radar }, { ...opzioni, home });
    const canonical = (percorso: string) => new DOMParser().parseFromString(file[percorso], 'text/html').querySelector('link[rel="canonical"]')?.getAttribute('href');
    for (const l of indirizzi({ edizioni: [edizione], radar: d.radar }, { ...opzioni, home })) {
      expect(canonical(`${l!.slice(opzioni.indirizzoBase.length)}index.html`)).toBe(l);
    }
  });

  it('il feed, le immagini e i file JSON non ci sono', () => {
    const loc = indirizzi({ edizioni: [edizione], radar: d.radar });
    expect(loc.filter((l) => /\.(xml|json|png)$|#/.test(l!))).toEqual([]);
  });

  it('è XML ben formato nel namespace delle sitemap, con soli elementi url e loc', () => {
    const doc = leggi(filePubblici({ edizioni: [edizione], radar: d.radar }, opzioni)['sitemap.xml']);
    expect(doc.documentElement.localName).toBe('urlset');
    expect(doc.documentElement.namespaceURI).toBe('http://www.sitemaps.org/schemas/sitemap/0.9');
    const nomi = new Set([...doc.documentElement.querySelectorAll('*')].map((e) => `${e.namespaceURI} ${e.localName}`));
    expect([...nomi].sort()).toEqual(['http://www.sitemaps.org/schemas/sitemap/0.9 loc', 'http://www.sitemaps.org/schemas/sitemap/0.9 url']);
    for (const url of doc.documentElement.children) expect([...url.children].map((e) => e.localName)).toEqual(['loc']);
  });

  it('un indirizzo con caratteri speciali passa dall’escape XML', () => {
    const radar = JSON.parse(JSON.stringify(d.radar).replaceAll('"vector-db"', '"vector&db<\'x\'>"'));
    const testo = filePubblici({ edizioni: [], radar }, opzioni)['sitemap.xml'];
    expect(testo).toContain('competenze/vector&amp;db&lt;&#39;x&#39;&gt;/');
    expect(indirizzi({ edizioni: [], radar })).toContain('https://esempio.org/ai-radar/competenze/vector&db<\'x\'>/');
  });
});
