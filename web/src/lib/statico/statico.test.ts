// La mappa dei file pubblici del sito: le edizioni, e i dati di radar.json per le pagine che ne nascono.
import { describe, expect, it, vi } from 'vitest';
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

  it('è XML ben formato nel namespace delle sitemap, con soli elementi url, loc e lastmod, e lastmod dopo loc', () => {
    const doc = leggi(filePubblici({ edizioni: [edizione], radar: d.radar }, opzioni)['sitemap.xml']);
    expect(doc.documentElement.localName).toBe('urlset');
    expect(doc.documentElement.namespaceURI).toBe('http://www.sitemaps.org/schemas/sitemap/0.9');
    const nomi = new Set([...doc.documentElement.querySelectorAll('*')].map((e) => `${e.namespaceURI} ${e.localName}`));
    expect([...nomi].sort()).toEqual(['lastmod', 'loc', 'url'].map((n) => `http://www.sitemaps.org/schemas/sitemap/0.9 ${n}`));
    for (const url of doc.documentElement.children) expect([...url.children].map((e) => e.localName)).toEqual(['loc', 'lastmod']);
    for (const lastmod of doc.querySelectorAll('lastmod')) expect(lastmod.textContent).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  describe('la data di ultimo cambio', () => {
    /** Ogni indirizzo con il suo lastmod, o null se non ce l'ha. */
    const date = (c: ContenutoStatico, o: OpzioniFilePubblici = opzioni) =>
      Object.fromEntries([...leggi(filePubblici(c, o)['sitemap.xml']).querySelectorAll('url')]
        .map((u) => [u.querySelector('loc')!.textContent!.slice(opzioni.indirizzoBase.length), u.querySelector('lastmod')?.textContent ?? null]));
    // la prima edizione è raccolta il 15 ottobre e corretta il 2 novembre, la seconda raccolta il 22 ottobre e mai corretta
    const corretta: Edizione = { ...edizione, correzioni: [{ data: '2026-11-02', testo: 'Una cifra era sbagliata.' }] };
    const seconda: Edizione = { ...edizione, settimana: '2026-10-19', raccolti: '2026-10-22T07:30:00+00:00', precedente: edizione.settimana, correzioni: [] };

    it('una pagina di edizione ha il giorno della sua raccolta, o la sua correzione più recente', () => {
      expect(edizione.settimana).toBe('2026-10-12');
      expect(date({ edizioni: [edizione] })['edizioni/2026-10-12/']).toBe('2026-10-15');
      const d2 = date({ edizioni: [corretta, seconda] });
      expect(d2['edizioni/2026-10-12/']).toBe('2026-11-02');
      expect(d2['edizioni/2026-10-19/']).toBe('2026-10-22');
    });

    it('l’archivio ha la data più recente tra quelle delle sue edizioni, correzioni comprese', () => {
      expect(date({ edizioni: [edizione, seconda] })['edizioni/']).toBe('2026-10-22');
      expect(date({ edizioni: [corretta, seconda] })['edizioni/']).toBe('2026-11-02');
    });

    it('home, indice e pagine delle competenze hanno il giorno di generato di radar.json, e senza radar la home non ha data', () => {
      const radar = { ...d.radar!, generato: '2026-10-26' };
      expect(date({ edizioni: [corretta, seconda], radar })).toEqual({
        '': '2026-10-26',
        'competenze/': '2026-10-26',
        'competenze/agenti/': '2026-10-26',
        'competenze/mcp/': '2026-10-26',
        'competenze/rag/': '2026-10-26',
        'competenze/robotica/': '2026-10-26',
        'competenze/vector-db/': '2026-10-26',
        'edizioni/': '2026-11-02',
        'edizioni/2026-10-12/': '2026-11-02',
        'edizioni/2026-10-19/': '2026-10-22',
      });
      expect(date({ edizioni: [seconda] })['']).toBeNull();
      expect(date({ edizioni: [] })).toEqual({ '': null });
    });

    it('un generato con l’ora vale per il suo giorno, uno non valido non dà nessuna data', () => {
      expect(date({ edizioni: [], radar: { ...d.radar!, generato: '2026-10-26T06:15:00+00:00' } })['competenze/mcp/']).toBe('2026-10-26');
      // un giorno che non esiste: le pagine delle competenze nascono, ma nessuna ha la data
      const conDate = date({ edizioni: [seconda], radar: { ...d.radar!, generato: '2026-02-30' } });
      expect(conDate['']).toBeNull();
      expect(conDate['competenze/']).toBeNull();
      expect(conDate['competenze/mcp/']).toBeNull();
      expect(conDate['edizioni/2026-10-19/']).toBe('2026-10-22');
      // una data illeggibile, con un radar senza competenze: c'è la sola home, senza data
      for (const generato of ['ieri', '26/10/2026', '2026-13-01', '']) {
        expect(date({ edizioni: [], radar: { ...d.radar!, competenze: [], generato } }), generato).toEqual({ '': null });
      }
    });

    it('nessuna data viene dall’orologio: con gli stessi dati, in giorni e ore diversi, il testo è lo stesso', () => {
      const contenuto = { edizioni: [corretta, seconda], radar: d.radar };
      try {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-11-16T05:00:00Z'));
        const lunedi = filePubblici(contenuto, opzioni)['sitemap.xml'];
        vi.setSystemTime(new Date('2027-03-04T23:59:00Z'));
        expect(filePubblici(contenuto, opzioni)['sitemap.xml']).toBe(lunedi);
        expect(lunedi).not.toMatch(/2026-11-16|2027-03-0[45]/);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  it('un indirizzo con caratteri speciali passa dall’escape XML', () => {
    const radar = JSON.parse(JSON.stringify(d.radar).replaceAll('"vector-db"', '"vector&db<\'x\'>"'));
    const testo = filePubblici({ edizioni: [], radar }, opzioni)['sitemap.xml'];
    expect(testo).toContain('competenze/vector&amp;db&lt;&#39;x&#39;&gt;/');
    expect(indirizzi({ edizioni: [], radar })).toContain('https://esempio.org/ai-radar/competenze/vector&db<\'x\'>/');
  });
});

describe('robots.txt', () => {
  it('alla radice di un dominio c’è, vale per tutti i crawler, non esclude niente e indica la sitemap', () => {
    const file = filePubblici({ edizioni: [edizione] }, { ...opzioni, indirizzoBase: 'https://altro-utente.github.io/' });
    expect(file['robots.txt'], 'la mappa non ha robots.txt').toBeDefined();
    expect(file['robots.txt'].trim().split('\n')).toEqual(['User-agent: *', 'Allow: /', '', 'Sitemap: https://altro-utente.github.io/sitemap.xml']);
  });

  it('c’è anche su un dominio proprio, e anche senza edizioni né radar', () => {
    const file = filePubblici({ edizioni: [] }, { ...opzioni, indirizzoBase: 'https://radar.esempio.it/' });
    expect(file['robots.txt']).toContain('Sitemap: https://radar.esempio.it/sitemap.xml\n');
  });

  it('non c’è con l’indirizzo predefinito in /ai-radar/, né con qualunque altro percorso diverso da /', () => {
    for (const indirizzoBase of ['https://simones99.github.io/ai-radar/', 'https://esempio.org/ai-radar/', 'https://radar.esempio.it/sito/']) {
      const file = filePubblici({ edizioni: [edizione], radar: d.radar }, { ...opzioni, indirizzoBase });
      expect(Object.keys(file), indirizzoBase).not.toContain('robots.txt');
    }
  });
});
