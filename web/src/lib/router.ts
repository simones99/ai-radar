// Ordine delle card: prima "Su cosa formarti", poi "L'AI in Italia".
export const TEMI = ['competenze', 'modelli', 'open', 'notizie', 'business', 'persone', 'norme', 'rapporti'] as const;
export type TileId = (typeof TEMI)[number];

// Id cambiati: i link vecchi continuano a funzionare.
const ALIAS: Record<string, TileId> = { politica: 'norme' };

const isTile = (s: string): s is TileId => (TEMI as readonly string[]).includes(s);

/** Parametri del link (?ruolo=dati&settore=ict): restano nel link anche cambiando card. */
export type Params = Record<string, string>;

const decode = (s: string): string | null => {
  try {
    return decodeURIComponent(s) || null;
  } catch {
    return null;
  }
};

/** "#tema", "#tema/elemento", con "?chiave=valore" in coda. Elemento o parametro malformato: si ignora. */
export function parseHash(hash: string): { tema: TileId; elemento: string | null; params: Params } | null {
  const [path, query = ''] = hash.replace(/^#/, '').split(/\?(.*)/s, 2);
  const [first, raw] = path.split('/', 2);
  const tema = ALIAS[first] ?? first;
  if (!tema || !isTile(tema)) return null;
  const params: Params = {};
  for (const pair of query.split('&')) {
    const [k, v] = pair.split(/=(.*)/s, 2).map(decode);
    if (k && v) params[k] = v;
  }
  return { tema, elemento: raw ? decode(raw) : null, params };
}

export const toHash = (tema: TileId, elemento?: string | null, params: Params = {}): string => {
  const query = Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  return `#${tema}${elemento ? `/${encodeURIComponent(elemento)}` : ''}${query ? `?${query}` : ''}`;
};

export const slug = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Apre una card, o un suo elemento, con la stessa cronologia dei link: TileGrid ascolta l'evento. */
export const APRI = 'ai-radar:apri';
export function apri(tema: TileId, elemento: string | null = null): void {
  document.dispatchEvent(new CustomEvent(APRI, { detail: { tema, elemento } }));
}

/** Cambia un parametro del link (null lo toglie) senza aggiungere passi alla cronologia: TileGrid ascolta l'evento. */
export const IMPOSTA = 'ai-radar:imposta';
export function imposta(chiave: string, valore: string | null): void {
  document.dispatchEvent(new CustomEvent(IMPOSTA, { detail: { chiave, valore } }));
}
