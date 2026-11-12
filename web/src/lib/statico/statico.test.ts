// La mappa dei file pubblici del sito: le edizioni, e i dati di radar.json per le pagine che ne nascono.
import { describe, expect, it } from 'vitest';
import type { Dataset } from '../data/types';
import { creaEdizione, fileDelleEdizioni, type Edizione } from '../edizioni';
import { FIXTURE } from '../test/fixtures';
import { filePubblici } from '.';

const opzioni = { indirizzoBase: 'https://esempio.org/ai-radar/', foglio: 'assets/index-abc.css' };
const d = FIXTURE as Dataset;
const edizione = creaEdizione(d, null) as Edizione;

describe('i file pubblici del sito', () => {
  it('con un’edizione e il radar ci sono la pagina dell’edizione, l’archivio e il feed', () => {
    const file = filePubblici({ edizioni: [edizione], radar: d.radar }, opzioni);
    expect(Object.keys(file)).toEqual(expect.arrayContaining([`edizioni/${edizione.settimana}/index.html`, 'edizioni/index.html', 'feed.xml']));
  });

  it('senza il radar i file sono esattamente quelli delle edizioni', () => {
    expect(filePubblici({ edizioni: [edizione] }, opzioni)).toEqual(fileDelleEdizioni([edizione], opzioni));
    expect(filePubblici({ edizioni: [] }, opzioni)).toEqual({});
  });

  it('il radar aggiunge le pagine delle competenze e non cambia i file delle edizioni', () => {
    const file = filePubblici({ edizioni: [edizione], radar: d.radar }, opzioni);
    expect(file).toMatchObject(fileDelleEdizioni([edizione], opzioni));
    expect(Object.keys(file).filter((p) => p.startsWith('competenze/')).length).toBeGreaterThan(0);
  });
});
