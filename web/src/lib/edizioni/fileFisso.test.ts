// Il file fisso di un'edizione già uscita si legge sempre come quando è uscito. La copia in test/edizioni è quella del 23 novembre 2026,
// la prima edizione vera, identica al byte: il file in data/ può cambiare con una correzione, la copia no.
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Dataset } from '../data/types';
import { FIXTURE } from '../test/fixtures';
import { leggiEdizioni } from './cartella';
import { creaEdizione, fileDelleEdizioni, type Edizione } from '.';
import { testoPorta, VERSIONE, type Fonte } from './tipi';

// i test girano da web/, come npm test
const USCITE = resolve('src/lib/test');
const OPZIONI = { indirizzoBase: 'https://esempio.org/ai-radar/', foglio: 'assets/home.css' };

/**
 * La forma della fonte salvata in ogni VERSIONE del file fisso: chiavi e tipi. Una fonte con un'altra forma è un formato nuovo,
 * che vuole una VERSIONE nuova e la sua riga qui: le edizioni già uscite restano con la loro.
 */
const FORMA_DELLA_FONTE: Record<number, Record<string, string[]>> = {
  1: { nome: ['string'], url: ['string', 'null'], licenza: ['string'] },
};

const tipo = (v: unknown) => (v === null ? 'null' : typeof v);
const fontiDi = (e: Edizione): Fonte[] => [...e.porte, ...e.card].flatMap((riga) => riga.fonti);
/** Le fonti che non hanno la forma della VERSIONE, con il motivo. */
function fuoriForma(fonti: Fonte[]): string[] {
  const forma = FORMA_DELLA_FONTE[VERSIONE];
  if (!forma) return [`la versione ${VERSIONE} non ha la sua forma in FORMA_DELLA_FONTE`];
  return fonti.flatMap((f) => {
    const chiavi = Object.keys(f).sort();
    if (chiavi.join() !== Object.keys(forma).sort().join()) return [`${JSON.stringify(f)}: chiavi ${chiavi.join(', ')}`];
    return Object.entries(f).filter(([k, v]) => !forma[k].includes(tipo(v))).map(([k, v]) => `${JSON.stringify(f)}: ${k} è ${tipo(v)}`);
  });
}

describe('l’edizione del 23 novembre 2026', () => {
  const edizioni = leggiEdizioni(USCITE);
  const e = edizioni[0];
  const pagina = () => {
    const html = fileDelleEdizioni(edizioni, OPZIONI)[`edizioni/${e.settimana}/index.html`];
    return new DOMParser().parseFromString(html, 'text/html').body.textContent!.replace(/\s+/g, ' ');
  };

  it('si legge con la versione di oggi', () => {
    expect(edizioni.map((x) => x.settimana)).toEqual(['2026-11-23']);
    expect(e.versione).toBe(VERSIONE);
  });

  it('la sua pagina dice le porte, le card, le notizie e le fonti salvate', () => {
    const testo = pagina();
    const attesi = [
      ...e.porte.map(testoPorta).filter(Boolean),
      ...e.card.flatMap((c) => (c.frase ? [c.frase] : [])),
      ...e.notizie.temi.flatMap((t) => t.voci.map((v) => v.titolo)),
      ...fontiDi(e).map((f) => f.nome),
    ];
    expect(attesi.length).toBeGreaterThan(20);
    expect(attesi.filter((a) => !testo.includes(a.replace(/\s+/g, ' ')))).toEqual([]);
  });

  it('le sue fonti hanno la forma della versione', () => {
    expect(fuoriForma(fontiDi(e))).toEqual([]);
  });
});

describe('la forma della fonte salvata', () => {
  it('un’edizione nuova salva le fonti con la forma della sua VERSIONE: cambiarla vuol dire alzare VERSIONE', () => {
    const nuova = creaEdizione(FIXTURE as Dataset, null) as Edizione;
    expect(fontiDi(nuova).length).toBeGreaterThan(0);
    expect(fuoriForma(fontiDi(nuova))).toEqual([]);
  });

  it('una fonte con un campo in più o con un tipo diverso è fuori forma', () => {
    const fonte: Fonte = { nome: 'arXiv', url: null, licenza: 'metadati CC0' };
    expect(fuoriForma([fonte])).toEqual([]);
    expect(fuoriForma([{ ...fonte, anno: 2026 } as Fonte])).toHaveLength(1);
    expect(fuoriForma([{ nome: 'arXiv', licenza: 'metadati CC0' } as Fonte])).toHaveLength(1);
    expect(fuoriForma([{ ...fonte, url: 3 } as unknown as Fonte])).toHaveLength(1);
  });
});
