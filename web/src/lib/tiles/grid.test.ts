import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Dataset } from '../data/types';
import { FIXTURE, FIXTURE_TODAY as today } from '../test/fixtures';
import TileGrid from './TileGrid.svelte';

const data = FIXTURE as Dataset;
const face = (label: string) => screen.getByRole('button', { name: new RegExp(`^${label}`) });
const details = () => document.querySelectorAll('section.detail');

beforeEach(() => {
  history.replaceState(null, '', '/');
  document.title = 'AI Radar';
});

describe('TileGrid', () => {
  it('due sezioni da 4 card, nell’ordine delle teste', () => {
    render(TileGrid, { data, today });
    const sezione = (name: string) => screen.getByRole('heading', { level: 2, name }).closest('section')!;
    const ids = (s: Element) => [...s.querySelectorAll('article.tile')].map((a) => a.id);
    expect(ids(sezione('Su cosa formarti'))).toEqual(['tile-competenze', 'tile-modelli', 'tile-open', 'tile-notizie']);
    expect(ids(sezione("L'AI in Italia"))).toEqual(['tile-business', 'tile-persone', 'tile-norme', 'tile-rapporti']);
  });

  it('pillole in due gruppi con il nome della testa', async () => {
    render(TileGrid, { data, today });
    await fireEvent.click(face('Business'));
    const nav = screen.getByRole('navigation', { name: 'Altri temi' });
    const perTe = within(nav).getByRole('group', { name: 'Su cosa formarti' });
    const italia = within(nav).getByRole('group', { name: "L'AI in Italia" });
    expect(within(perTe).getAllByRole('button').map((b) => b.textContent)).toEqual(['Competenze', 'Modelli e ricerca', 'Open source', 'Notizie']);
    expect(within(italia).getAllByRole('button').map((b) => b.textContent)).toEqual(['Persone e lavoro', 'Norme', 'Rapporti']);
  });

  it('8 card chiuse', () => {
    render(TileGrid, { data, today });
    expect(document.querySelectorAll('button.face')).toHaveLength(8);
    document.querySelectorAll('button.face').forEach((b) => expect(b).toHaveAttribute('aria-expanded', 'false'));
  });

  it('apre una card: link diretto, titolo della scheda, pillole', async () => {
    render(TileGrid, { data, today });
    await fireEvent.click(face('Business'));
    expect(document.getElementById('detail-business')).not.toBeNull();
    expect(location.hash).toBe('#business');
    expect(document.title).toBe('Business · AI Radar');
    expect(face('Business')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: 'Altri temi' }).querySelectorAll('button.pill')).toHaveLength(7);
  });

  it('Esc chiude e riporta il focus sulla card', async () => {
    render(TileGrid, { data, today });
    await fireEvent.click(face('Business'));
    await fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(details()).toHaveLength(0));
    expect(location.hash).toBe('');
    await waitFor(() => expect(document.activeElement).toBe(face('Business')));
  });

  it('indietro chiude la card', async () => {
    render(TileGrid, { data, today });
    await fireEvent.click(face('Business'));
    history.back();
    await waitFor(() => expect(details()).toHaveLength(0));
  });

  it('cambio di card con le pillole: un solo indietro torna alla home', async () => {
    render(TileGrid, { data, today });
    await fireEvent.click(face('Business'));
    await fireEvent.click(screen.getByRole('button', { name: 'Norme' }));
    expect(location.hash).toBe('#norme');
    expect(details()).toHaveLength(1);
    history.back();
    await waitFor(() => expect(details()).toHaveLength(0));
    expect(location.hash).toBe('');
  });

  it('link diretto all’avvio, anche con un elemento', async () => {
    history.replaceState(null, '', '/#competenze/mcp');
    render(TileGrid, { data, today });
    expect(document.getElementById('detail-competenze')).not.toBeNull();
    expect(await screen.findByRole('button', { name: /^MCP/, pressed: true })).toBeInTheDocument();
  });

  it('link alla card già aperta sullo stesso elemento: lo rimette in evidenza, scorre e porta il focus al titolo', async () => {
    const a = document.body.appendChild(document.createElement('a'));
    a.setAttribute('href', '#competenze/mcp');
    a.textContent = 'Porta';
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    try {
      render(TileGrid, { data, today });
      await fireEvent.click(a);
      expect(await screen.findByRole('button', { name: /^MCP/, pressed: true })).toBeInTheDocument();
      await fireEvent.click(screen.getByRole('button', { name: /^RAG/ }));
      expect(screen.getByRole('button', { name: /^RAG/, pressed: true })).toBeInTheDocument();
      a.focus();
      scroll.mockClear();
      await fireEvent.click(a);
      await waitFor(() => expect(screen.getByRole('button', { name: /^MCP/, pressed: true })).toBeInTheDocument());
      expect(screen.getByRole('button', { name: /^RAG/, pressed: false })).toBeInTheDocument();
      await waitFor(() => expect(document.activeElement).toBe(document.getElementById('h-competenze')));
      expect(scroll).toHaveBeenCalled();
      expect(location.hash).toBe('#competenze/mcp');
      expect(details()).toHaveLength(1);
    } finally {
      a.remove();
      delete (Element.prototype as Partial<Element>).scrollIntoView;
    }
  });

  it('doppio clic rapido: stato coerente', async () => {
    render(TileGrid, { data, today });
    const b = face('Business');
    await fireEvent.click(b);
    await fireEvent.click(b);
    await waitFor(() => {
      const n = details().length;
      expect(n === 0 ? location.hash === '' : location.hash === '#business' && n === 1).toBe(true);
    });
  });

  it('con View Transitions il focus torna sulla card dopo Esc', async () => {
    const doc = document as unknown as Record<string, unknown>;
    doc.startViewTransition = (cb: () => void) => {
      const updateCallbackDone = new Promise<void>((r) => setTimeout(() => { cb(); r(); }, 0));
      return { updateCallbackDone, finished: updateCallbackDone, ready: updateCallbackDone, skipTransition() {} };
    };
    try {
      render(TileGrid, { data, today });
      await fireEvent.click(face('Business'));
      await waitFor(() => expect(details()).toHaveLength(1));
      await fireEvent.keyDown(window, { key: 'Escape' });
      await waitFor(() => expect(document.activeElement).toBe(face('Business')));
    } finally {
      delete doc.startViewTransition;
    }
  });

  it('un’ancora della pagina dopo la chiusura non ruba il focus', async () => {
    render(TileGrid, { data, today });
    await fireEvent.click(face('Business'));
    await fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(details()).toHaveLength(0));
    await waitFor(() => expect(document.activeElement).toBe(face('Business')));
    (document.activeElement as HTMLElement).blur();
    history.pushState(null, '', '#stato');
    window.dispatchEvent(new PopStateEvent('popstate'));
    await new Promise((r) => setTimeout(r, 20));
    expect(document.activeElement).not.toBe(face('Business'));
    expect(details()).toHaveLength(0);
  });

  it('indietro, avanti, Esc: chiude e azzera l’indirizzo', async () => {
    render(TileGrid, { data, today });
    await fireEvent.click(face('Business'));
    history.back();
    await waitFor(() => expect(details()).toHaveLength(0));
    history.forward();
    await waitFor(() => expect(details()).toHaveLength(1));
    await fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(details()).toHaveLength(0));
    await waitFor(() => expect(location.hash).toBe(''));
  });
});
