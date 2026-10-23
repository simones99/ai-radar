import type { Dataset } from './types';

export const FILES = [
  'status', 'radar', 'owid', 'ai_act', 'rapporti', 'news', 'epoch', 'huggingface', 'github', 'arxiv',
  'artificial_analysis', 'jobs', 'eurostat', 'eurostat_settori', 'geopoliticai',
] as const;
export type FileKey = (typeof FILES)[number];

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
