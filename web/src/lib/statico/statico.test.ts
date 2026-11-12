// La mappa dei file pubblici del sito: le edizioni, e i dati di radar.json per le pagine che ne nascono.
import { describe, expect, it } from 'vitest';
import type { Dataset } from '../data/types';
import { creaEdizione, fileDelleEdizioni, type Edizione } from '../edizioni';
import { FIXTURE } from '../test/fixtures';
import { filePubblici } from '.';

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

  it('senza il radar i file sono esattamente quelli delle edizioni', () => {
    expect(filePubblici({ edizioni: [edizione] }, opzioni)).toEqual(fileDelleEdizioni([edizione], opzioni));
    expect(filePubblici({ edizioni: [] }, opzioni)).toEqual({});
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
