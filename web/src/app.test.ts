import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App.svelte';
import { FIXTURE } from './lib/test/fixtures';

afterEach(() => vi.unstubAllGlobals());

describe('App', () => {
  it('carica i dati e mostra la tesi della settimana', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const k = url.split('/').pop()!.replace('.json', '');
      const body = (FIXTURE as Record<string, unknown>)[k];
      return { ok: body !== undefined, json: async () => body } as Response;
    }));
    render(App);
    expect(await screen.findByText(/quelli di un anno fa/)).toBeInTheDocument();
    expect(document.querySelectorAll('button.face')).toHaveLength(8);
    expect(screen.getByRole('heading', { name: 'Stato delle fonti' })).toBeInTheDocument();
  });

  it('nessun dato raggiungibile: avviso e Riprova', async () => {
    const fetchFn = vi.fn(async () => { throw new TypeError('offline'); });
    vi.stubGlobal('fetch', fetchFn);
    render(App);
    expect(await screen.findByText('Non riesco a caricare i dati.')).toBeInTheDocument();
    const calls = fetchFn.mock.calls.length;
    await fireEvent.click(screen.getByRole('button', { name: 'Riprova' }));
    expect(fetchFn.mock.calls.length).toBeGreaterThan(calls);
  });
});
