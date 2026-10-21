import { describe, expect, it, vi } from 'vitest';
import { FIXTURE } from '../test/fixtures';
import { FILES, loadAll } from './load';

const ok = (body: unknown) => ({ ok: true, json: async () => body }) as Response;

describe('loadAll', () => {
  it('tiene i file arrivati e segna quelli mancanti', async () => {
    const fetchFn = vi.fn(async (url: string) => {
      if (url === 'data/status.json') return ok({ aggiornato: 'x', fonti: {} });
      if (url === 'data/radar.json') throw new TypeError('rete');
      return { ok: false, json: async () => ({}) } as Response;
    });
    const { data, failed } = await loadAll('data/', fetchFn as unknown as typeof fetch);
    expect(data.status).toEqual({ aggiornato: 'x', fonti: {} });
    expect(data.radar).toBeUndefined();
    expect(failed).toContain('radar');
    expect(failed).toContain('owid');
    expect(failed).not.toContain('status');
    expect(failed).toHaveLength(FILES.length - 1);
  });

  it('carica i dati dei settori', async () => {
    const fetchFn = vi.fn(async (url: string) => {
      const k = url.split('/').pop()!.replace('.json', '');
      const body = (FIXTURE as Record<string, unknown>)[k];
      return body === undefined ? ({ ok: false, json: async () => ({}) } as Response) : ok(body);
    });
    const { data, failed } = await loadAll('data/', fetchFn as unknown as typeof fetch);
    expect(fetchFn).toHaveBeenCalledWith('data/eurostat_settori.json', { cache: 'no-cache' });
    expect(failed).not.toContain('eurostat_settori');
    expect(data.eurostat_settori?.scopi.tutti.IT.E_AI_PMS).toBe(33.1);
  });

  it('chiede ogni file una volta, senza cache', async () => {
    const fetchFn = vi.fn(async () => ok({}));
    await loadAll('data/', fetchFn as unknown as typeof fetch);
    expect(fetchFn).toHaveBeenCalledTimes(FILES.length);
    expect(fetchFn).toHaveBeenCalledWith('data/news.json', { cache: 'no-cache' });
  });
});
