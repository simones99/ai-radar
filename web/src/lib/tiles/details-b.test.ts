import { render, screen, within } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { describe, expect, it } from 'vitest';
import type { Dataset } from '../data/types';
import type { TileId } from '../router';
import { FIXTURE, FIXTURE_TODAY as today } from '../test/fixtures';
import { paese } from '../text/paesi';
import { headModelli, headOpen, headPersone, headRapporti, type Head } from '../text/frasi';
import ModelliDetail from './ModelliDetail.svelte';
import OpenDetail from './OpenDetail.svelte';
import PersoneDetail from './PersoneDetail.svelte';
import RapportiDetail from './RapportiDetail.svelte';
import type { DetailProps, TileDef } from './types';

const data = FIXTURE as Dataset;
const mk = (id: TileId, label: string, head: (d: Dataset, t: Date) => Head, Detail: Component<DetailProps>): TileDef =>
  ({ id, label, source: 'epoch', eager: false, testa: 'italia', face: () => null, head, Detail });
const show = (Detail: Component<DetailProps>, tile: TileDef) => render(Detail, { data, today, tile, elemento: null, params: {}, onclose: () => {} });

describe('paesi', () => {
  it('traduce i nomi più comuni', () => {
    expect(paese('Italy')).toBe('Italia');
    expect(paese('United Kingdom')).toBe('Regno Unito');
    expect(paese('Atlantide')).toBe('Atlantide');
  });
});

describe('Modelli', () => {
  it('calcolo, modelli recenti, chiave mancante dichiarata', () => {
    show(ModelliDetail, mk('modelli', 'Modelli e ricerca', headModelli, ModelliDetail));
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('4,8 volte');
    expect(screen.getByRole('img', { name: 'Calcolo di addestramento dei modelli notevoli' })).toBeInTheDocument();
    expect(screen.getByText('Gemini 4 Argon')).toBeInTheDocument();
    expect(screen.getByText(/Serve una chiave gratuita di Artificial Analysis/)).toBeInTheDocument();
    expect(screen.queryAllByRole('img', { name: /Modelli notevoli all'anno/ })).toHaveLength(0);
    expect(screen.queryByRole('heading', { name: 'Chi costruisce i modelli notevoli' })).toBeNull();
  });
  it('chi costruisce i modelli ora sta in GeopoliticAI: il rimando apre la card', () => {
    show(ModelliDetail, mk('modelli', 'Modelli e ricerca', headModelli, ModelliDetail));
    expect(screen.getByRole('link', { name: 'Vai a GeopoliticAI →' })).toHaveAttribute('href', '#geopoliticai');
  });
});

describe('Open source', () => {
  it('modelli di tendenza e stelle della settimana', () => {
    show(OpenDetail, mk('open', 'Open source', headOpen, OpenDetail));
    expect(screen.getByRole('link', { name: 'google/embeddinggemma-2' })).toHaveAttribute('href', 'https://huggingface.co/google/embeddinggemma-2');
    expect(screen.getByText('+707')).toBeInTheDocument();
    const blk = screen.getByRole('heading', { name: 'Che compiti fanno' }).closest('section')!;
    expect(within(blk).getByRole('link', { name: 'Hugging Face' })).toBeInTheDocument();
  });
});

describe('Persone', () => {
  it('uso dell’AI generativa con l’Italia in evidenza, lavoro senza chiave', () => {
    show(PersoneDetail, mk('persone', 'Persone e lavoro', headPersone, PersoneDetail));
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent("Usa l'AI generativa il 30% degli italiani");
    expect(screen.getByText(/Italia 30/)).toHaveClass('hot');
    expect(screen.getByRole('img', { name: 'Competenze più chieste negli annunci' })).toBeInTheDocument();
    expect(screen.queryByText(/Serve la chiave gratuita di Adzuna/)).toBeNull();
  });
});

describe('Persone: Italia nei grafici europei', () => {
  it('con molti Paesi l’Italia in fondo alla classifica resta nel grafico, in evidenza', () => {
    const ents = Array.from({ length: 22 }, (_, i) => `Paese ${String.fromCharCode(65 + i)}`);
    const punti = [...ents.map((e, i) => ({ entita: e, t: '2025', v: 80 - i })), { entita: 'Italy', t: '2025', v: 10 }];
    const base = data.owid!;
    const ue = { titolo: '', unita: '%', citazione: 'Eurostat (2026)', url: 'https://ourworldindata.org/grapher/share-europe-using-generative-ai', aggiornato_owid: null, punti };
    const d = { ...data, owid: { ...base, serie: { ...base.serie, uso_genai_ue: ue } } } as Dataset;
    const tile = mk('persone', 'Persone e lavoro', headPersone, PersoneDetail);
    render(PersoneDetail, { data: d, today, tile, elemento: null, params: {}, onclose: () => {} });
    const chart = screen.getByRole('img', { name: "Uso dell'AI generativa in Europa" });
    expect(within(chart).getByText('Italia')).toHaveClass('hot');
    expect(within(chart).getByText('Paese A')).toBeInTheDocument();
    expect(within(chart).queryByText('Paese V')).not.toBeInTheDocument(); // 22ª: fuori dai primi 15
  });
});

describe('Rapporti', () => {
  it('link diretto a un rapporto: è evidenziato', () => {
    render(RapportiDetail, { data, today, tile: mk('rapporti', 'Rapporti', headRapporti, RapportiDetail), elemento: 'state-of-ai-report', params: {}, onclose: () => {} });
    const li = screen.getByRole('link', { name: 'State of AI Report' }).closest('li')!;
    expect(li).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: 'AI Index Report' }).closest('li')).not.toHaveAttribute('aria-current');
  });
  it('uscite passate e prossime stimate, con link', () => {
    show(RapportiDetail, mk('rapporti', 'Rapporti', headRapporti, RapportiDetail));
    expect(screen.getByRole('link', { name: 'AI Index Report 2026' })).toHaveAttribute('href', 'https://hai.stanford.edu/ai-index');
    expect(screen.getByRole('link', { name: 'State of AI Report, prossima edizione (stima)' })).toBeInTheDocument();
    expect(screen.getByText('Prossima prevista: aprile 2027 (stima)')).toBeInTheDocument();
  });
});
