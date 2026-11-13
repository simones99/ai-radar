// Le porte e le card della settimana dei dati, senza il confronto con la settimana prima: il passo comune all'edizione e alla home in chiaro.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Dataset } from '../data/types';
import { FIXTURE } from '../test/fixtures';
import { settimanaDeiDati, type SettimanaDeiDati } from '.';

const d = FIXTURE as Dataset;
const leggi = (dati: Dataset = d) => settimanaDeiDati(dati) as SettimanaDeiDati;
const testo = (parti: { t: string }[]) => parti.map((p) => p.t).join('');

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe('la settimana dei dati', () => {
  it('è il lunedì di status.aggiornato, con il momento della raccolta', () => {
    const s = leggi(); // aggiornato giovedì 15 ottobre 2026
    expect(s.settimana).toBe('2026-10-12');
    expect(s.raccolti).toBe('2026-10-15T08:00:00+00:00');
  });

  it('ha le due porte con la notizia della vista di partenza, senza il confronto', () => {
    const [perTe, italia] = leggi().porte;
    expect(perTe).toMatchObject({ id: 'per-te', nome: 'Per te', etichetta: 'Su cosa formarti', meta: 'Radar delle competenze · dati al 15 ott 2026', destinazione: { card: 'competenze', elemento: null } });
    expect(testo(perTe.titolo)).toBe('MCP entra tra le competenze da imparare ora; RAG esce');
    expect(italia).toMatchObject({ id: 'italia', nome: 'Per la tua organizzazione', etichetta: "L'AI in Italia", destinazione: { card: 'business', elemento: null } });
    expect(testo(italia.titolo)).toBe("16% delle imprese italiane usa l'AI (UE: 20%)");
    expect(perTe).not.toHaveProperty('cambiata');
  });

  it('ha le nove card per testa, nell’ordine della home, con cifra, unità e frase sulla data dei dati', () => {
    const { card } = leggi();
    expect(card.map((c) => [c.id, c.nome, c.testa])).toEqual([
      ['competenze', 'Competenze', 'per-te'], ['modelli', 'Modelli e ricerca', 'per-te'], ['open', 'Open source', 'per-te'], ['notizie', 'Notizie', 'per-te'],
      ['geopoliticai', 'GeopoliticAI', 'italia'], ['business', 'Business', 'italia'], ['persone', 'Persone e lavoro', 'italia'], ['norme', 'Norme', 'italia'], ['rapporti', 'Rapporti', 'italia'],
    ]);
    expect(card.find((c) => c.id === 'business')).toMatchObject({ cifra: '16', unita: '%', frase: "Imprese italiane che usano l'AI nel 2025. UE: 20%.", destinazione: { card: 'business', elemento: null } });
    // dal 15 ottobre al 2 dicembre 2026
    expect(card.find((c) => c.id === 'norme')).toMatchObject({ cifra: '48', unita: 'giorni' });
    for (const c of card) {
      expect(c).not.toHaveProperty('cambiata');
      expect(c).not.toHaveProperty('era');
    }
  });

  it('non dipende dall’orologio né dalle scelte ricordate', () => {
    const prima = leggi();
    vi.useFakeTimers({ now: new Date('2031-03-03T10:00:00') });
    localStorage.setItem('ai-radar:ruolo', 'compliance');
    localStorage.setItem('ai-radar:mercato', 'italia');
    localStorage.setItem('ai-radar:settore', 'ict');
    expect(leggi()).toEqual(prima);
  });

  it('senza lo stato delle fonti non c’è una settimana', () => {
    expect(settimanaDeiDati({ ...d, status: undefined })).toBeNull();
    expect(settimanaDeiDati({})).toBeNull();
  });

  it('con solo lo stato ci sono lo stesso le porte e le nove card, tutte senza dati', () => {
    const s = leggi({ status: d.status });
    expect(s.porte.map((p) => [p.id, p.titolo, p.meta, p.destinazione])).toEqual([['per-te', [], 'Dati non disponibili', null], ['italia', [], 'Dati non disponibili', null]]);
    expect(s.card).toHaveLength(9);
    for (const c of s.card) expect(c).toMatchObject({ cifra: null, unita: null, frase: null });
  });
});
