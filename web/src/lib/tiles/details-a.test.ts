import { fireEvent, render, screen, within } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Dataset } from '../data/types';
import { IMPOSTA, type Params, type TileId } from '../router';
import { FIXTURE, FIXTURE_TODAY as today } from '../test/fixtures';
import { headBusiness, headCompetenze, headNotizie, headNorme, type Head } from '../text/frasi';
import BusinessDetail from './BusinessDetail.svelte';
import CompetenzeDetail from './CompetenzeDetail.svelte';
import NotizieDetail from './NotizieDetail.svelte';
import NormeDetail from './NormeDetail.svelte';
import type { DetailProps, TileDef } from './types';

const data = FIXTURE as Dataset;
const mk = (id: TileId, label: string, head: (d: Dataset, t: Date) => Head, Detail: Component<DetailProps>): TileDef =>
  ({ id, label, source: 'owid', eager: false, testa: 'italia', face: () => null, head, Detail });
const show = (Detail: Component<DetailProps>, tile: TileDef, elemento: string | null = null, params: Params = {}) =>
  render(Detail, { data, today, tile, elemento, params, onclose: () => {} });

describe('Competenze', () => {
  const tile = mk('competenze', 'Competenze', headCompetenze, CompetenzeDetail);
  it('titolo, radar, pannello, tabella e metodo', () => {
    show(CompetenzeDetail, tile);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('MCP entra tra le competenze da imparare ora');
    expect(screen.getByRole('img', { name: /Radar delle competenze/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Movimenti del mese' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Le competenze una per una' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Come si calcola' })).toBeInTheDocument();
  });
  it('radar e movimenti con fonti cliccabili, Adzuna compresa', () => {
    show(CompetenzeDetail, tile);
    for (const name of ['Radar delle competenze', 'Movimenti del mese']) {
      const blk = screen.getByRole('heading', { name }).closest('section')!;
      expect(within(blk).getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com');
      expect(within(blk).getByRole('link', { name: 'arXiv' })).toHaveAttribute('href', 'https://arxiv.org');
      expect(within(blk).getByRole('link', { name: 'The Adzuna API' })).toHaveAttribute('href', 'https://www.adzuna.co.uk');
    }
  });
  it('passando il mouse su una riga del pannello, nel radar le altre si attenuano', async () => {
    const { container } = show(CompetenzeDetail, tile);
    expect(container.querySelectorAll('g.pt.dim')).toHaveLength(0);
    const link = within(screen.getByRole('heading', { name: 'Movimenti del mese' }).closest('section')!).getAllByRole('link')[0];
    const ev = new Event('pointerenter');
    Object.defineProperty(ev, 'pointerType', { value: 'mouse' });
    await fireEvent(link, ev);
    expect(container.querySelectorAll('g.pt.dim').length).toBeGreaterThan(0);
  });
  it('elenco: ogni competenza porta alla sua pagina', () => {
    show(CompetenzeDetail, tile);
    const blk = screen.getByRole('heading', { name: 'Le competenze una per una' }).closest('section')!;
    expect(within(blk).getByRole('link', { name: 'Model Context Protocol (MCP)' })).toHaveAttribute('href', '#competenze/mcp');
    expect(within(blk).getByText('Da provare · incerto')).toBeInTheDocument();
  });
  it('link diretto a una competenza: la sua pagina al posto del radar', () => {
    show(CompetenzeDetail, tile, 'mcp');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Model Context Protocol (MCP)');
    expect(screen.getByText('Impara ora. Lo standard per collegare strumenti.')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /Radar delle competenze/ })).toBeNull();
  });
  it('radar.json della pipeline vecchia: avviso', () => {
    const old = { ...data, radar: { ...data.radar!, versione: undefined } } as Dataset;
    render(CompetenzeDetail, { data: old, today, tile, elemento: null, params: {}, onclose: () => {} });
    expect(screen.getByText('Il radar si aggiorna al prossimo giro della pipeline.')).toBeInTheDocument();
  });
  it('link diretto a una competenza che non esiste: il radar, nessun errore', () => {
    show(CompetenzeDetail, tile, 'inesistente');
    expect(screen.getByRole('img', { name: /Radar delle competenze/ })).toBeInTheDocument();
  });
});

describe('Competenze: il ruolo', () => {
  const tile = mk('competenze', 'Competenze', headCompetenze, CompetenzeDetail);
  const ruoli = () => screen.getByRole('group', { name: 'Il tuo ruolo' });
  beforeEach(() => localStorage.clear());

  it('fila di pulsanti sopra il radar: il ruolo del link è il solo premuto', () => {
    show(CompetenzeDetail, tile, null, { ruolo: 'compliance' });
    const btns = within(ruoli()).getAllByRole('button');
    expect(btns.map((b) => b.textContent)).toEqual(['Tutti', 'Sviluppo software', 'Prodotto', 'Dati e analisi', 'Legale e compliance']);
    expect(btns.filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.textContent)).toEqual(['Legale e compliance']);
  });

  it('radar: le competenze degli altri ruoli attenuate; la tabella dei dati dice quali sono del ruolo', () => {
    const { container } = show(CompetenzeDetail, tile, null, { ruolo: 'dati' });
    expect(container.querySelectorAll('g.pt.altro')).toHaveLength(3);
    const tab = within(screen.getByRole('heading', { name: 'Radar delle competenze' }).closest('section')!).getByRole('table');
    expect(within(tab).getAllByRole('columnheader').at(-1)).toHaveTextContent('Per il tuo ruolo');
    const riga = (nome: string) => within(tab).getByRole('rowheader', { name: nome }).closest('tr')!;
    expect(riga('RAG e ricerca semantica').lastElementChild).toHaveTextContent('sì');
    expect(riga('Model Context Protocol (MCP)').lastElementChild).toHaveTextContent('no');
  });
  it('con «Tutti» la tabella dei dati non ha la colonna del ruolo e niente è attenuato', () => {
    const { container } = show(CompetenzeDetail, tile);
    expect(container.querySelectorAll('.altro')).toHaveLength(0);
    const tab = within(screen.getByRole('heading', { name: 'Radar delle competenze' }).closest('section')!).getByRole('table');
    expect(within(tab).queryByRole('columnheader', { name: 'Per il tuo ruolo' })).toBeNull();
  });

  it('Movimenti del mese: prima le competenze del ruolo, poi le altre attenuate, ognuna nell’ordine di «Tutti»', () => {
    const movimenti = () => within(screen.getByRole('heading', { name: 'Movimenti del mese' }).closest('section')!).getAllByRole('link').filter((a) => a.matches('a.row'));
    const nomi = (as: HTMLElement[]) => as.map((a) => a.getAttribute('title'));
    const { unmount } = show(CompetenzeDetail, tile);
    const tutti = nomi(movimenti());
    unmount();
    show(CompetenzeDetail, tile, null, { ruolo: 'dati' });
    const conRuolo = movimenti();
    expect(nomi(conRuolo).slice(0, 2)).toEqual(['RAG e ricerca semantica', 'Database vettoriali']);
    expect(nomi(conRuolo).slice(2)).toEqual(tutti.filter((n) => n !== 'RAG e ricerca semantica' && n !== 'Database vettoriali'));
    expect(conRuolo.map((a) => a.closest('li')!.classList.contains('altro'))).toEqual(conRuolo.map((_, i) => i >= 2));
  });
  it('Le competenze una per una: prima le righe del ruolo, poi le altre attenuate; i numeri non cambiano', () => {
    const tabella = () => within(screen.getByRole('heading', { name: 'Le competenze una per una' }).closest('section')!).getByRole('table');
    const { unmount } = show(CompetenzeDetail, tile);
    const numeri = (t: HTMLElement) => Object.fromEntries([...t.querySelectorAll('tbody tr')].map((tr) => [tr.querySelector('th')!.textContent, [...tr.querySelectorAll('td')].slice(1).map((td) => td.textContent)]));
    const prima = numeri(tabella());
    unmount();
    show(CompetenzeDetail, tile, null, { ruolo: 'dati' });
    const righe = [...tabella().querySelectorAll('tbody tr')];
    expect(righe.map((tr) => tr.querySelector('th')!.textContent)).toEqual(['RAG e ricerca semantica', 'Database vettoriali', 'Agenti AI', 'Model Context Protocol (MCP)', 'AI fisica e robotica']);
    expect(righe.map((tr) => tr.classList.contains('altro'))).toEqual([false, false, true, true, true]);
    expect(numeri(tabella())).toEqual(prima);
  });

  it('il titolo e la frase in testa alla card non cambiano con il ruolo', () => {
    const { unmount } = show(CompetenzeDetail, tile);
    const testa = () => screen.getByRole('heading', { level: 2 }).closest('.d-text')!.textContent;
    const tutti = testa();
    unmount();
    show(CompetenzeDetail, tile, null, { ruolo: 'compliance' });
    expect(testa()).toBe(tutti);
  });

  describe('senza storage del browser', () => {
    beforeEach(() => {
      for (const m of ['getItem', 'setItem', 'removeItem'] as const) vi.spyOn(Storage.prototype, m).mockImplementation(() => { throw new Error('SecurityError'); });
    });
    afterEach(() => vi.restoreAllMocks());
    it('la card funziona, con e senza ruolo nel link, e i pulsanti rispondono', async () => {
      show(CompetenzeDetail, tile);
      expect(within(ruoli()).getByRole('button', { name: 'Tutti' })).toHaveAttribute('aria-pressed', 'true');
      await fireEvent.click(within(ruoli()).getByRole('button', { name: 'Prodotto' }));
      await fireEvent.click(within(ruoli()).getByRole('button', { name: 'Tutti' }));
      document.body.innerHTML = '';
      show(CompetenzeDetail, tile, null, { ruolo: 'dati' });
      expect(within(ruoli()).getByRole('button', { name: 'Dati e analisi' })).toHaveAttribute('aria-pressed', 'true');
    });
  });
});

describe('Business', () => {
  const tile = mk('business', 'Business', headBusiness, BusinessDetail);
  it('grafici con fonte cliccabile e serie mancanti dichiarate', () => {
    show(BusinessDetail, tile);
    expect(screen.getByRole('img', { name: 'Investimenti privati per regione' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Our World in Data' })[0]).toHaveAttribute('href', 'https://ourworldindata.org/grapher/private-investment-in-artificial-intelligence');
    const inv = screen.getByRole('img', { name: 'Investimenti privati per regione' }).closest('section')!;
    expect(within(inv).getByRole('link', { name: 'CC BY-ND 4.0' })).toHaveAttribute('href', 'https://creativecommons.org/licenses/by-nd/4.0/');
    // CC BY-ND: valori come pubblicati, in dollari e senza arrotondamenti
    expect(within(inv).getByText('230.000.000.000')).toBeInTheDocument();
    const gen = screen.getByRole('img', { name: 'Investimenti in AI generativa' }).closest('section')!;
    expect(within(gen).getByText('143.800.000.000')).toBeInTheDocument();
    expect(within(screen.getByRole('img', { name: 'Investimenti in AI generativa' })).getByText('144 B')).toBeInTheDocument();
    expect(within(screen.getByRole('img', { name: 'Investimenti privati per regione' })).getByText(/^Europa/)).toHaveClass('hot');
    expect(screen.getAllByText('Dati non disponibili in questo aggiornamento.').length).toBeGreaterThan(0);
    expect(within(screen.getByRole('img', { name: "Imprese europee che usano l'AI" })).getByText('Italia')).toHaveClass('hot');
  });

  describe('Adozione per settore, con «Tutti»', () => {
    const blk = (title: string) => screen.getByRole('heading', { name: title }).closest('section')!;
    const righe = (title: string) => within(blk(title)).getAllByRole('row').slice(1).map((r) => [...r.querySelectorAll('th, td')].map((c) => c.textContent));

    it('tre grafici Italia contro UE, con fonte Eurostat, anno e base scritta', () => {
      show(BusinessDetail, tile);
      for (const [title, img] of [
        ['Adozione per settore, 2025', "Adozione per settore, Italia e UE"],
        ["A cosa serve l'AI, 2025", "A cosa serve l'AI, Italia e UE"],
        ['Cosa frena chi non la usa, 2025', 'Cosa frena chi non la usa, Italia e UE'],
      ]) {
        const b = blk(title);
        expect(within(b).getByRole('img', { name: img })).toBeInTheDocument();
        expect(within(b).getByRole('link', { name: 'Eurostat, isoc_eb_ain2' })).toHaveAttribute('href', 'https://ec.europa.eu/eurostat/databrowser/view/isoc_eb_ain2/default/table');
        expect(b).toHaveTextContent('Dati 2025');
        expect(b).toHaveTextContent('Punto pieno: Italia; vuoto: UE.');
      }
      expect(blk("A cosa serve l'AI, 2025")).toHaveTextContent("% delle imprese che usano l'AI");
      expect(blk('Cosa frena chi non la usa, 2025')).toHaveTextContent("% delle imprese che hanno considerato l'AI senza usarla");
      // ordinati per valore italiano; le tabelle danno Italia e UE
      expect(righe('Adozione per settore, 2025')).toEqual([
        ['Informazione e comunicazione', '51,3', '62,5'], ['Manifattura', '14,7', '17,3'], ['Immobiliare', '14,0', '24,8'],
      ]);
      expect(righe("A cosa serve l'AI, 2025")[0]).toEqual(['Marketing e vendite', '33,1', '34,7']);
      expect(righe('Cosa frena chi non la usa, 2025')).toHaveLength(8);
      expect(screen.queryByText(/Dato italiano non affidabile/)).toBeNull();
    });

    it('una riga dice quali settori Eurostat non rileva e che «Tutti» esclude la finanza', () => {
      show(BusinessDetail, tile);
      expect(screen.getByText(/Eurostat non rileva finanza e assicurazioni, agricoltura, estrazione, pubblica amministrazione, istruzione, sanità, attività artistiche e altri servizi\./))
        .toHaveTextContent(/«Tutti» non comprende la finanza/);
    });

    it('valore italiano mancante: resta il punto UE, la nota sotto il grafico, «non affidabile» nella tabella', () => {
      const x = structuredClone(data);
      x.eurostat_settori!.adozione.ict.IT['2025'] = null;
      x.eurostat_settori!.scopi.tutti.IT.E_AI_PLOG = null;
      render(BusinessDetail, { data: x, today, tile, elemento: null, params: {}, onclose: () => {} });
      const ad = blk('Adozione per settore, 2025');
      expect(within(ad).getByText('Dato italiano non affidabile secondo Eurostat per: Informazione e comunicazione.')).toBeInTheDocument();
      expect(righe('Adozione per settore, 2025').at(-1)).toEqual(['Informazione e comunicazione', 'non affidabile', '62,5']);
      expect(ad.querySelectorAll('svg circle')).toHaveLength(5); // 3 punti UE, 2 italiani
      expect(within(blk("A cosa serve l'AI, 2025")).getByText('Dato italiano non affidabile secondo Eurostat per: Logistica.')).toBeInTheDocument();
      expect(righe("A cosa serve l'AI, 2025").at(-1)).toEqual(['Logistica', 'non affidabile', '6,1']);
    });

    it('nel grafico il numero accanto al punto UE è scritto come valore UE', () => {
      show(BusinessDetail, tile);
      const img = screen.getByRole('img', { name: 'Adozione per settore, Italia e UE' });
      expect(within(img).getByText('51 · UE 63')).toBeInTheDocument();
      expect(within(img).queryByText('51')).toBeNull();
    });

    it('valore UE mancante: la tabella scrive «—», «non affidabile» è solo per il dato italiano', () => {
      const x = structuredClone(data);
      x.eurostat_settori!.adozione.manifattura.EU27_2020['2025'] = null;
      render(BusinessDetail, { data: x, today, tile, elemento: null, params: {}, onclose: () => {} });
      expect(righe('Adozione per settore, 2025')).toContainEqual(['Manifattura', '14,7', '—']);
      expect(screen.queryByText(/Dato italiano non affidabile/)).toBeNull();
    });

    it('adozione senza nessun valore: il titolo resta senza anno e il blocco dice che i dati mancano', () => {
      const x = structuredClone(data);
      for (const g of Object.values(x.eurostat_settori!.adozione)) { g.IT = {}; g.EU27_2020 = {}; }
      render(BusinessDetail, { data: x, today, tile, elemento: null, params: {}, onclose: () => {} });
      expect(within(blk('Adozione per settore')).getByText('Dati non disponibili in questo aggiornamento.')).toBeInTheDocument();
      expect(screen.queryByText(/Infinity/)).toBeNull();
    });

    it('i blocchi stanno nella loro sezione: «Adozione per settore» è nel gruppo «Adozione»', () => {
      show(BusinessDetail, tile);
      const adozione = screen.getByRole('group', { name: 'Adozione' });
      expect(within(adozione).getByRole('heading', { name: 'Adozione per settore, 2025' })).toBeInTheDocument();
      expect(within(screen.getByRole('group', { name: 'Investimenti' })).queryByRole('heading', { name: 'Adozione per settore, 2025' })).toBeNull();
    });

    it('il resto della card non cambia: titolo, frase in testa e gli altri grafici', () => {
      show(BusinessDetail, tile);
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent("16% delle imprese italiane usa l'AI");
      expect(screen.getByText("Nel 2025, imprese con almeno 10 addetti. UE: 20%. Nel 2024 in Italia l'8%.")).toBeInTheDocument();
      for (const name of ["Imprese che usano l'AI, per area", "Imprese europee che usano l'AI, 2025", 'Investimenti privati per regione', 'Ricavi di TSMC'])
        expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    });

    it('senza i dati dei settori i tre grafici dicono che mancano', () => {
      render(BusinessDetail, { data: { ...data, eurostat_settori: undefined }, today, tile, elemento: null, params: {}, onclose: () => {} });
      expect(within(blk("A cosa serve l'AI")).getByText('Dati non disponibili in questo aggiornamento.')).toBeInTheDocument();
    });
  });
});

describe('Business: il settore', () => {
  const tile = mk('business', 'Business', headBusiness, BusinessDetail);
  const menu = () => screen.getByRole('combobox', { name: 'Il tuo settore' });
  const blk = (title: string) => screen.getByRole('heading', { name: title }).closest('section')!;
  const righe = (title: string) => within(blk(title)).getAllByRole('row').slice(1).map((r) => [...r.querySelectorAll('th, td')].map((c) => c.textContent));
  let link: Array<[string, string | null]>; // i parametri che la card chiede di cambiare nel link
  const ascolta = (e: Event) => link.push([(e as CustomEvent).detail.chiave, (e as CustomEvent).detail.valore]);
  beforeEach(() => {
    localStorage.clear();
    link = [];
    document.addEventListener(IMPOSTA, ascolta);
  });
  afterEach(() => document.removeEventListener(IMPOSTA, ascolta));

  it('menu «Il tuo settore» in testa alla sezione Adozione: «Tutti» e i settori, con la nota sui non rilevati sotto', () => {
    show(BusinessDetail, tile);
    expect(within(screen.getByRole('group', { name: 'Adozione' })).getByRole('combobox', { name: 'Il tuo settore' })).toBe(menu());
    expect(within(menu()).getAllByRole('option').map((o) => o.textContent)).toEqual(['Tutti', 'Manifattura', 'Informazione e comunicazione', 'Immobiliare']);
    expect(menu()).toHaveValue('tutti');
    expect(menu().closest('.scelta')!.nextElementSibling).toHaveTextContent(/^Eurostat non rileva finanza/);
    expect(screen.queryByRole('heading', { name: /^Adozione in/ })).toBeNull();
  });

  it('con un settore: in evidenza nel confronto, poi andamento, scopi e barriere del settore', () => {
    show(BusinessDetail, tile, null, { settore: 'manifattura' });
    expect(menu()).toHaveValue('manifattura');
    const confronto = screen.getByRole('img', { name: 'Adozione per settore, Italia e UE' });
    expect(within(confronto).getByText('Manifattura')).toHaveClass('hot');
    expect(within(confronto).getByText('Immobiliare')).not.toHaveClass('hot');
    expect(blk('Adozione per settore, 2025')).toHaveTextContent('In evidenza: Manifattura.');
    const titoli = within(screen.getByRole('group', { name: 'Adozione' })).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titoli.slice(0, 5)).toEqual(['Adozione', 'Adozione per settore, 2025', 'Adozione in Manifattura, 2021-2025', "A cosa serve l'AI in Manifattura, 2025", 'Cosa frena chi non la usa in Manifattura, 2025']);
    expect(within(blk('Adozione in Manifattura, 2021-2025')).getByRole('img', { name: 'Adozione in Manifattura, Italia e UE' })).toBeInTheDocument();
    expect(blk('Adozione in Manifattura, 2021-2025')).toHaveTextContent('Dati 2021-2025.');
    expect(righe('Adozione in Manifattura, 2021-2025')).toEqual([['2021', '6,6', '6,9'], ['2023', '4,9', '6,8'], ['2024', '8,0', '10,6'], ['2025', '14,7', '17,3']]);
    expect(righe("A cosa serve l'AI in Manifattura, 2025")[0]).toEqual(['Marketing e vendite', '28,7', '30,4']);
    expect(righe('Cosa frena chi non la usa in Manifattura, 2025')[0]).toEqual(['Mancano le competenze', '62,5', '71,1']);
  });

  it("l'andamento non disegna il 2022, né come punto né come tratto", () => {
    show(BusinessDetail, tile, null, { settore: 'ict' });
    const img = screen.getByRole('img', { name: 'Adozione in Informazione e comunicazione, Italia e UE' });
    expect(within(img).queryByText('2022')).toBeNull();
    expect(img.querySelectorAll('circle.dot')).toHaveLength(8); // 4 anni, Italia e UE
  });

  it('valori italiani mancanti del settore: la nota «non affidabile» sotto il grafico e nella tabella', () => {
    const x = structuredClone(data);
    x.eurostat_settori!.adozione.immobiliare.IT['2023'] = null;
    render(BusinessDetail, { data: x, today, tile, elemento: null, params: { settore: 'immobiliare' }, onclose: () => {} });
    // immobiliare, Italia, logistica: riservato (c) nei dati veri
    expect(within(blk("A cosa serve l'AI in Immobiliare, 2025")).getByText('Dato italiano non affidabile secondo Eurostat per: Logistica.')).toBeInTheDocument();
    const andamento = blk('Adozione in Immobiliare, 2021-2025');
    expect(within(andamento).getByText('Dato italiano non affidabile secondo Eurostat per: 2023.')).toBeInTheDocument();
    expect(righe('Adozione in Immobiliare, 2021-2025')[1]).toEqual(['2023', 'non affidabile', '8,5']);
    expect(andamento.querySelectorAll('circle.dot')).toHaveLength(7); // il 2023 italiano non c'è, quello UE sì
  });

  it("cambiare settore lo mette nel link e lo ricorda; «Tutti» toglie l'uno e l'altro", async () => {
    show(BusinessDetail, tile);
    await fireEvent.change(menu(), { target: { value: 'ict' } });
    expect(link).toEqual([['settore', 'ict']]);
    expect(localStorage.getItem('ai-radar:settore')).toBe('ict');
    await fireEvent.change(menu(), { target: { value: 'tutti' } });
    expect(link.at(-1)).toEqual(['settore', null]);
    expect(localStorage.getItem('ai-radar:settore')).toBeNull();
  });

  it('un settore sconosciuto nel link si ignora: la sezione è quella di «Tutti»', () => {
    show(BusinessDetail, tile, null, { settore: 'finanza' });
    expect(menu()).toHaveValue('tutti');
    expect(screen.queryByRole('heading', { name: /^Adozione in/ })).toBeNull();
    expect(screen.getByRole('heading', { name: "A cosa serve l'AI, 2025" })).toBeInTheDocument();
    expect(link).toEqual([['settore', null]]);
  });

  it('senza settore nel link vale il ricordo, che entra nel link', () => {
    localStorage.setItem('ai-radar:settore', 'immobiliare');
    show(BusinessDetail, tile);
    expect(link).toEqual([['settore', 'immobiliare']]);
  });

  describe('senza storage del browser', () => {
    beforeEach(() => {
      for (const m of ['getItem', 'setItem', 'removeItem'] as const) vi.spyOn(Storage.prototype, m).mockImplementation(() => { throw new Error('SecurityError'); });
    });
    afterEach(() => vi.restoreAllMocks());
    it('la card funziona e il menu risponde: il settore va nel link ma non resta', async () => {
      show(BusinessDetail, tile, null, { settore: 'ict' });
      expect(menu()).toHaveValue('ict');
      await fireEvent.change(menu(), { target: { value: 'manifattura' } });
      expect(link.at(-1)).toEqual(['settore', 'manifattura']);
    });
  });
});

describe('Norme', () => {
  const tile = mk('norme', 'Norme', headNorme, NormeDetail);
  it('link diretto a una scadenza: è evidenziata', () => {
    show(NormeDetail, tile, '2026-12-02');
    const li = screen.getByRole('link', { name: 'Fine della transizione per la marcatura' }).closest('li')!;
    expect(li).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: 'Modelli per uso generale' }).closest('li')).not.toHaveAttribute('aria-current');
  });
  it('linea del tempo con la prossima scadenza e notizie di policy', () => {
    show(NormeDetail, tile);
    const next = screen.getByRole('link', { name: 'Fine della transizione per la marcatura' });
    expect(next.closest('li')).toHaveClass('next');
    expect(screen.getByRole('link', { name: 'AI Act: le linee guida sulla trasparenza' })).toBeInTheDocument();
  });
});

describe('Notizie', () => {
  const tile = mk('notizie', 'Notizie', headNotizie, NotizieDetail);
  const items = () => within(screen.getByRole('list', { name: 'Elenco delle notizie' })).queryAllByRole('listitem');
  it('tutte le notizie, poi filtro per tema', async () => {
    show(NotizieDetail, tile);
    expect(items()).toHaveLength(3);
    await fireEvent.click(screen.getByRole('button', { name: 'Politica' }));
    expect(items()).toHaveLength(1);
    await fireEvent.click(screen.getByRole('button', { name: 'Tutti i temi' }));
    expect(items()).toHaveLength(3);
  });
  it('link diretto a una fonte: filtro già applicato', async () => {
    show(NotizieDetail, tile, 'the-decoder');
    await screen.findByRole('button', { name: 'The Decoder', pressed: true });
    expect(items()).toHaveLength(2);
  });
});
