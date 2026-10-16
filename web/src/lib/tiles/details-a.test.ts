import { fireEvent, render, screen, within } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { describe, expect, it } from 'vitest';
import type { Dataset } from '../data/types';
import type { TileId } from '../router';
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
const show = (Detail: Component<DetailProps>, tile: TileDef, elemento: string | null = null) =>
  render(Detail, { data, today, tile, elemento, onclose: () => {} });

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
  it('radar e movimenti con fonti cliccabili; Adzuna solo con la domanda dagli annunci', () => {
    const { unmount } = show(CompetenzeDetail, tile);
    for (const name of ['Radar delle competenze', 'Movimenti del mese']) {
      const blk = screen.getByRole('heading', { name }).closest('section')!;
      expect(within(blk).getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com');
      expect(within(blk).getByRole('link', { name: 'arXiv' })).toHaveAttribute('href', 'https://arxiv.org');
      expect(within(blk).queryByRole('link', { name: 'The Adzuna API' })).not.toBeInTheDocument();
    }
    expect(screen.getByText(/nuovi repository open source/)).toBeInTheDocument();
    unmount();
    const lavoro = { ...data, radar: { ...data.radar!, base_domanda: 'lavoro' } } as Dataset;
    render(CompetenzeDetail, { data: lavoro, today, tile, elemento: null, onclose: () => {} });
    const blk = screen.getByRole('heading', { name: 'Radar delle competenze' }).closest('section')!;
    expect(within(blk).getByRole('link', { name: 'The Adzuna API' })).toHaveAttribute('href', 'https://www.adzuna.co.uk');
  });
  it('link diretto a una competenza: è evidenziata', async () => {
    show(CompetenzeDetail, tile, 'mcp');
    const row = await screen.findByRole('button', { name: /^MCP/ });
    expect(row).toHaveAttribute('aria-pressed', 'true');
  });
  it('link diretto a una competenza che non esiste: nessun errore, niente evidenziato', () => {
    show(CompetenzeDetail, tile, 'inesistente');
    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0);
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
