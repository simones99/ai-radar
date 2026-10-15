export const TEMI = ['modelli', 'open', 'business', 'persone', 'politica', 'competenze', 'notizie', 'rapporti'] as const;
export type TileId = (typeof TEMI)[number];

const isTile = (s: string): s is TileId => (TEMI as readonly string[]).includes(s);

/** "#tema" o "#tema/elemento". Elemento malformato: si apre il tema e lo si ignora. */
export function parseHash(hash: string): { tema: TileId; elemento: string | null } | null {
  const [tema, raw] = hash.replace(/^#/, '').split('/', 2);
  if (!tema || !isTile(tema)) return null;
  let elemento: string | null = null;
  if (raw) {
    try {
      elemento = decodeURIComponent(raw) || null;
    } catch {
      elemento = null;
    }
  }
  return { tema, elemento };
}

export const toHash = (tema: TileId, elemento?: string | null): string =>
  elemento ? `#${tema}/${encodeURIComponent(elemento)}` : `#${tema}`;

export const slug = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
