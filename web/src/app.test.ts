import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App.svelte';
import { FIXTURE } from './lib/test/fixtures';

afterEach(() => vi.unstubAllGlobals());

describe('App', () => {
  it('carica i dati e mostra le due porte', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const k = url.split('/').pop()!.replace('.json', '');
      const body = (FIXTURE as Record<string, unknown>)[k];
      return { ok: body !== undefined, json: async () => body } as Response;
    }));
    render(App);
    expect(await screen.findByRole('link', { name: /MCP entra tra le competenze da imparare ora/ })).toHaveAttribute('href', '#competenze/mcp');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Su cosa formarti e cosa succede all'AI in Italia");
    expect(document.querySelectorAll('button.face')).toHaveLength(9);
    expect(screen.getByRole('heading', { name: 'Stato delle fonti' })).toBeInTheDocument();
    expect(within(document.getElementById('stato')!).getByRole('rowheader', { name: 'Eurostat (settori)' })).toBeInTheDocument();
    expect(within(document.getElementById('stato')!).getByRole('rowheader', { name: "Catena dell'AI (dati curati)" })).toBeInTheDocument();
    // una fonte aggiornata può avere un avviso: le posizioni dei siti prese dall'ultima copia buona
    const geo = within(document.getElementById('stato')!).getByRole('rowheader', { name: 'Epoch (GeopoliticAI)' }).closest('tr')!;
    expect([...geo.children].map((c) => c.textContent)).toEqual(['Epoch (GeopoliticAI)', 'aggiornata', '15 ott 2026', 'pagina della mappa di Epoch non letta (HTTP 503): restano le posizioni salvate']);
    const crediti = document.getElementById('crediti')!;
    expect(within(crediti).getAllByRole('link', { name: 'CC BY-SA 4.0' })[0]).toHaveAttribute('href', 'https://creativecommons.org/licenses/by-sa/4.0/');
    expect(within(crediti).getAllByRole('link', { name: 'CC0' })[0]).toHaveAttribute('href', 'https://creativecommons.org/publicdomain/zero/1.0/');
    expect(within(crediti).getByRole('link', { name: 'Licenze del software' })).toHaveAttribute('href', 'THIRD_PARTY_LICENSES.txt');
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
