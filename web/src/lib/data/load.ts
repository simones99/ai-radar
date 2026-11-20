import type { Dataset } from './types';
import { isDay } from '../text/format';

export const FILES = [
  'status', 'radar', 'owid', 'ai_act', 'rapporti', 'news', 'epoch', 'huggingface', 'github', 'arxiv',
  'eurostat', 'eurostat_settori', 'geopoliticai', 'catena',
] as const;
export type FileKey = (typeof FILES)[number];

/** L'indice con l'ultima edizione, per la home. La build lo scrive solo se esiste un'edizione: per questo non è tra i FILES, che se mancano fanno scattare l'avviso. */
export const INDICE_EDIZIONI = 'data/edizioni.json';

/** La settimana dell'ultima edizione, oppure null. Qualunque cosa vada storta vale come «nessuna edizione»: niente avvisi e niente link rotti. */
export async function caricaUltimaEdizione(fetchFn: typeof fetch = fetch): Promise<string | null> {
  try {
    const r = await fetchFn(INDICE_EDIZIONI, { cache: 'no-cache' });
    if (!r.ok) return null;
    const { ultima } = await r.json();
    return typeof ultima === 'string' && isDay(ultima) ? ultima : null;
  } catch {
    return null;
  }
}

/** Scarica tutti i JSON in parallelo. Un file che non arriva vale come fonte assente. */
export async function loadAll(base = 'data/', fetchFn: typeof fetch = fetch): Promise<{ data: Dataset; failed: FileKey[] }> {
  const res = await Promise.allSettled(
    FILES.map(async (k) => {
      const r = await fetchFn(`${base}${k}.json`, { cache: 'no-cache' });
      if (!r.ok) throw new Error(`${k}: HTTP non riuscito`);
      return r.json();
    }),
  );
  const data: Record<string, unknown> = {};
  const failed: FileKey[] = [];
  res.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value != null) data[FILES[i]] = r.value;
    else failed.push(FILES[i]);
  });
  return { data: data as Dataset, failed };
}
