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
