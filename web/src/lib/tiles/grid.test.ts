import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
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
    await fireEvent.click(screen.getByRole('button', { name: 'Politica' }));
    expect(location.hash).toBe('#politica');
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
