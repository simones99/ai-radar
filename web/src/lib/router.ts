// Ordine delle card: prima "Su cosa formarti", poi "L'AI in Italia".
export const TEMI = ['competenze', 'modelli', 'open', 'notizie', 'business', 'persone', 'norme', 'rapporti'] as const;
export type TileId = (typeof TEMI)[number];

// Id cambiati: i link vecchi continuano a funzionare.
const ALIAS: Record<string, TileId> = { politica: 'norme' };

const isTile = (s: string): s is TileId => (TEMI as readonly string[]).includes(s);

/** "#tema" o "#tema/elemento". Elemento malformato: si apre il tema e lo si ignora. */
export function parseHash(hash: string): { tema: TileId; elemento: string | null } | null {
  const [first, raw] = hash.replace(/^#/, '').split('/', 2);
  const tema = ALIAS[first] ?? first;
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
