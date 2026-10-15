import { describe, expect, it } from 'vitest';
import { tileState } from './freshness';
import type { Status } from './types';

const status: Status = {
  aggiornato: '2026-10-15T08:00:00+00:00',
  fonti: {
    epoch: { stato: 'ok', ultimo_successo: '2026-10-15T08:00:00+00:00' },
    arxiv: { stato: 'errore', ultimo_successo: '2026-10-08T08:00:00+00:00', ultimo_tentativo: '2026-10-15T08:00:00+00:00', messaggio: '500' },
    adzuna: { stato: 'non configurata', messaggio: 'ADZUNA_APP_ID/ADZUNA_APP_KEY non impostati' },
  },
};

describe('tileState', () => {
  it('ok con la data dell’ultimo successo', () => {
    expect(tileState('epoch', status, true)).toEqual({ state: 'ok', aggiornato: '2026-10-15T08:00:00+00:00', fallito: null, motivo: null });
  });
  it('vecchio se l’ultimo giro è fallito ma c’è un dato buono', () => {
    const s = tileState('arxiv', status, true);
    expect(s.state).toBe('vecchio');
    expect(s.aggiornato).toBe('2026-10-08T08:00:00+00:00');
    expect(s.fallito).toBe('2026-10-15T08:00:00+00:00');
  });
  it('assente senza dati, con il motivo leggibile', () => {
    expect(tileState('adzuna', status, false)).toMatchObject({ state: 'assente', motivo: 'Serve la chiave gratuita di Adzuna.' });
    expect(tileState('owid', status, false)).toMatchObject({ state: 'assente', motivo: 'Dati non ancora disponibili.' });
    expect(tileState('epoch', undefined, false).state).toBe('assente');
  });
});
