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
});
