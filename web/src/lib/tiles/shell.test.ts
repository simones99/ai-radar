import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet, type Component } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import type { Dataset } from '../data/types';
import { FIXTURE, FIXTURE_TODAY as today } from '../test/fixtures';
import Detail from './Detail.svelte';
import Pills from './Pills.svelte';
import TileFace from './TileFace.svelte';
import type { DetailProps, TileDef } from './types';

const tile = (over: Partial<TileDef> = {}): TileDef => ({
  id: 'business', label: 'Business', source: 'owid', eager: true,
  face: () => ({ fig: '290', unit: 'mld $', sent: 'Investimenti privati.' }),
  head: () => ({ title: [{ t: 'Titolo ' }, { t: 'in blu', em: true }], deck: 'Sottotitolo.' }),
  Detail: (() => {}) as unknown as Component<DetailProps>,
  ...over,
});
const blocks = createRawSnippet(() => ({ render: () => '<p>blocchi</p>' }));

describe('TileFace', () => {
  it('numero, unità, frase e data di aggiornamento', async () => {
    const onopen = vi.fn();
    render(TileFace, { tile: tile(), data: FIXTURE as Dataset, today, expanded: false, onopen });
    const b = screen.getByRole('button', { name: /Business/ });
    expect(b).toHaveAttribute('aria-expanded', 'false');
    expect(b).toHaveAttribute('aria-controls', 'detail-business');
    expect(b).toHaveTextContent('290mld $');
    expect(b).toHaveTextContent('agg. 15 ott 2026');
    await fireEvent.click(b);
    expect(onopen).toHaveBeenCalledOnce();
  });
  it('fonte assente: spiega il motivo', () => {
    render(TileFace, { tile: tile({ source: 'adzuna', face: () => null }), data: FIXTURE as Dataset, today, expanded: false, onopen: () => {} });
    expect(screen.getByText('Serve la chiave gratuita di Adzuna.')).toBeInTheDocument();
    expect(screen.getByText('non disponibile')).toBeInTheDocument();
  });
  it('fonte con l’ultimo giro fallito: dice da quando sono i dati', () => {
    render(TileFace, { tile: tile({ source: 'arxiv' }), data: FIXTURE as Dataset, today, expanded: false, onopen: () => {} });
    expect(screen.getByText('Aggiornamento non riuscito il 15 ott 2026. Dati aggiornati all’8 ott 2026.')).toBeInTheDocument();
  });
  it('foto che non carica: riquadro con il testo alternativo', async () => {
    const { container } = render(TileFace, { tile: tile(), data: FIXTURE as Dataset, today, expanded: false, onopen: () => {} });
    await fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('.ph-empty')).toHaveTextContent('Ricercatrice in camera bianca con un wafer di silicio');
  });
});

describe('Detail', () => {
  it('titolo con parte in evidenza, focus sul titolo, credito della foto', () => {
    render(Detail, { tile: tile(), head: tile().head(FIXTURE as Dataset, today), onclose: () => {}, children: blocks });
    const h2 = screen.getByRole('heading', { level: 2 });
    expect(h2).toHaveTextContent('Titolo in blu');
    expect(h2.querySelector('em')).toHaveTextContent('in blu');
    expect(document.activeElement).toBe(h2);
    expect(screen.getByText('blocchi')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Foto' })).toHaveAttribute('href', expect.stringContaining('commons.wikimedia.org'));
  });
  it('chiudi', async () => {
    const onclose = vi.fn();
    render(Detail, { tile: tile(), head: tile().head({}, today), onclose, children: blocks });
    await fireEvent.click(screen.getByRole('button', { name: 'Chiudi Business' }));
    expect(onclose).toHaveBeenCalledOnce();
  });
  it('copia link: con gli appunti', async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(Detail, { tile: tile(), head: tile().head({}, today), onclose: () => {}, children: blocks });
    await fireEvent.click(screen.getByRole('button', { name: 'Copia link' }));
    expect(writeText).toHaveBeenCalledWith(location.href);
    expect(await screen.findByRole('button', { name: 'Link copiato' })).toBeInTheDocument();
  });
  it('copia link: se gli appunti rifiutano, mostra il link selezionato', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn(async () => { throw new Error('no'); }) }, configurable: true });
    render(Detail, { tile: tile(), head: tile().head({}, today), onclose: () => {}, children: blocks });
    await fireEvent.click(screen.getByRole('button', { name: 'Copia link' }));
    const input = await screen.findByRole('textbox', { name: 'Link da copiare' });
    expect(input).toHaveValue(location.href);
  });
});

describe('Pills', () => {
  it('sceglie un altro tema o chiude', async () => {
    const onpick = vi.fn(), onclose = vi.fn();
    render(Pills, { tiles: [tile(), tile({ id: 'politica', label: 'Politica' })], onpick, onclose });
    await fireEvent.click(screen.getByRole('button', { name: 'Politica' }));
    expect(onpick).toHaveBeenCalledWith('politica');
    await fireEvent.click(screen.getByRole('button', { name: 'Chiudi' }));
    expect(onclose).toHaveBeenCalledOnce();
  });
});
