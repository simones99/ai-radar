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

  it('per ora i file sono esattamente quelli delle edizioni, con il radar e senza', () => {
    for (const radar of [d.radar, undefined]) {
      expect(filePubblici({ edizioni: [edizione], radar }, opzioni)).toEqual(fileDelleEdizioni([edizione], opzioni));
      expect(filePubblici({ edizioni: [], radar }, opzioni)).toEqual({});
    }
  });
});
