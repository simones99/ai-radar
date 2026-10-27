import type { Status } from './types';

export interface TileState {
  state: 'ok' | 'vecchio' | 'assente';
  aggiornato: string | null;
  fallito: string | null;
  motivo: string | null;
}

const MOTIVI: Record<string, string> = {
  adzuna: 'Serve la chiave gratuita di Adzuna.',
};

/** Stato di una card dalla sua fonte principale in status.json. */
export function tileState(source: string, status: Status | undefined, hasData: boolean): TileState {
  const st = status?.fonti?.[source];
  if (!hasData) {
    return { state: 'assente', aggiornato: null, fallito: st?.ultimo_tentativo ?? null, motivo: MOTIVI[source] ?? 'Dati non ancora disponibili.' };
  }
  if (st?.stato === 'errore') {
    return { state: 'vecchio', aggiornato: st.ultimo_successo ?? null, fallito: st.ultimo_tentativo ?? null, motivo: null };
  }
  return { state: 'ok', aggiornato: st?.ultimo_successo ?? null, fallito: null, motivo: null };
}
