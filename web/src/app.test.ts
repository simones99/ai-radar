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
    expect(await screen.findByRole('link', { name: /MCP entra tra le competenze da imparare ora/ })).toHaveAttribute('href', '#competenze');
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
    const datiDi = [...crediti.querySelectorAll('p')].find((p) => p.textContent!.startsWith('Dati di'))!;
    expect([...datiDi.querySelectorAll('a')].slice(0, 7).map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Epoch AI', 'https://epoch.ai/data/ai-models'], ['arXiv', 'https://arxiv.org'], ['GitHub', 'https://github.com'], ['Hugging Face', 'https://huggingface.co'],
      ['The Adzuna API', 'https://www.adzuna.co.uk'], ['Eurostat', 'https://ec.europa.eu/eurostat'], ['Our World in Data', 'https://ourworldindata.org'],
    ]);
    expect(datiDi.textContent).toMatch(/^Dati di Epoch AI, arXiv, GitHub, Hugging Face, The Adzuna API, Eurostat, Our World in Data\. /);
  });

  describe('un file di dati non arriva', () => {
    const conRisposte = (senza: string[]) => vi.fn(async (url: string) => {
      const k = url.split('/').pop()!.replace('.json', '');
      const body = senza.includes(k) ? undefined : (FIXTURE as Record<string, unknown>)[k];
      return { ok: body !== undefined, json: async () => body } as Response;
    });
    const stato = () => within(document.getElementById('stato')!);
    it('con tutti i file: nessun avviso e nessun Riprova', async () => {
      vi.stubGlobal('fetch', conRisposte([]));
      render(App);
      await screen.findByRole('heading', { level: 1 });
      await screen.findByRole('link', { name: /MCP entra/ });
      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Riprova' })).toBeNull();
    });
    it('il radar: lo dicono l’avviso e lo stato delle fonti, che non parla di tutte aggiornate; Riprova lo richiede e l’avviso sparisce', async () => {
      const f = conRisposte(['radar']);
      vi.stubGlobal('fetch', f);
      render(App);
      expect(await screen.findByRole('alert')).toHaveTextContent('Una parte dei dati non è arrivata');
      expect(stato().getByText(/non ha ricevuto i dati di/)).toHaveTextContent('Questa pagina non ha ricevuto i dati di: Radar (calcolo).');
      expect(document.getElementById('stato')).not.toHaveTextContent('sono aggiornate');
      expect(screen.getAllByText('Dati non disponibili').length).toBeGreaterThan(0);
      f.mockImplementation(conRisposte([]));
      await fireEvent.click(stato().getByRole('button', { name: 'Riprova' }));
      expect(await screen.findByRole('link', { name: /MCP entra/ })).toBeInTheDocument();
      expect(screen.queryByRole('alert')).toBeNull();
      expect(document.getElementById('stato')).toHaveTextContent('da controllare');
    });
    it('lo stato delle fonti: non dice che non c’è stato nessun aggiornamento', async () => {
      vi.stubGlobal('fetch', conRisposte(['status']));
      render(App);
      await screen.findByRole('alert');
      expect(stato().getByText('Lo stato delle fonti non è arrivato.')).toBeInTheDocument();
      expect(document.getElementById('stato')).not.toHaveTextContent('Nessun aggiornamento registrato');
    });
  });

  describe('l’indice delle edizioni', () => {
    /** I dati del FIXTURE, aggiornati il 15 ottobre 2026, cioè nella settimana del 12; e la risposta da dare a chi chiede l'indice. */
    const conIndice = (indice: () => Partial<Response>) => vi.fn(async (url: string) => {
      const k = url.split('/').pop()!.replace('.json', '');
      if (k === 'edizioni') return indice() as Response;
      return { ok: true, json: async () => (FIXTURE as Record<string, unknown>)[k] } as Response;
    });
    const indice = (ultima: unknown) => () => ({ ok: true, json: async () => ({ ultima }) });
    const caricata = async () => {
      render(App);
      await screen.findByRole('link', { name: /MCP entra/ });
    };
    const settimana = () => screen.queryByRole('link', { name: 'Settimana del 12 ott 2026' });

    it('l’ultima edizione è di questa settimana: «Settimana del…» porta all’edizione', async () => {
      vi.stubGlobal('fetch', conIndice(indice('2026-10-12')));
      await caricata();
      expect(await screen.findByRole('link', { name: 'Settimana del 12 ott 2026' })).toHaveAttribute('href', 'edizioni/2026-10-12/');
    });

    it('l’ultima edizione è di un’altra settimana: la riga resta testo semplice', async () => {
      vi.stubGlobal('fetch', conIndice(indice('2026-10-05')));
      await caricata();
      expect(screen.getByText('Settimana del 12 ott 2026')).toBeInTheDocument();
      await new Promise((r) => setTimeout(r));
      expect(settimana()).toBeNull();
    });

    it('con un’edizione qualsiasi: «Edizioni» in testata porta all’archivio, e «Segui con RSS» in fondo al feed', async () => {
      vi.stubGlobal('fetch', conIndice(indice('2026-10-05')));
      await caricata();
      expect(await within(screen.getByRole('banner')).findByRole('link', { name: 'Edizioni' })).toHaveAttribute('href', 'edizioni/');
      expect(within(screen.getByRole('contentinfo')).getByRole('link', { name: 'Segui con RSS' })).toHaveAttribute('href', 'feed.xml');
    });

    const senzaIndice: [string, () => Partial<Response>][] = [
      ['manca', () => ({ ok: false, json: async () => { throw new Error('non è JSON'); } })],
      ['al suo posto arriva una pagina HTML', () => ({ ok: true, json: async () => { throw new SyntaxError('non è JSON'); } })],
      ['non si raggiunge', () => { throw new TypeError('offline'); }],
      ['è vuoto', () => ({ ok: true, json: async () => null })],
      ['ha una data non valida', indice('../../altrove')],
    ];
    for (const [caso, risposta] of senzaIndice) {
      it(`${caso}: nessun avviso e nessun link`, async () => {
        vi.stubGlobal('fetch', conIndice(risposta));
        await caricata();
        await new Promise((r) => setTimeout(r));
        expect(screen.getByText('Settimana del 12 ott 2026')).toBeInTheDocument();
        expect(settimana()).toBeNull();
        expect(screen.queryByRole('link', { name: 'Edizioni' })).toBeNull();
        expect(screen.queryByRole('link', { name: 'Segui con RSS' })).toBeNull();
        expect(screen.queryByRole('alert')).toBeNull();
        expect(document.getElementById('stato')).not.toHaveTextContent('non ha ricevuto i dati');
      });
    }
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
