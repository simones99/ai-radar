import { fireEvent, render, screen, within } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Dataset } from '../data/types';
import type { Params, TileId } from '../router';
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
