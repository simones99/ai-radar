// Il modulo Edizioni dagli ingressi alle uscite: dati del FIXTURE ed edizione precedente in entrata, JSON e file del sito in uscita.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Dataset } from '../data/types';
import { FIXTURE } from '../test/fixtures';
import { creaEdizione, type Edizione } from '.';

const d = FIXTURE as Dataset;
const crea = (dati: Dataset = d, precedente: Edizione | null = null) => creaEdizione(dati, precedente) as Edizione;
const testo = (parti: { t: string }[]) => parti.map((p) => p.t).join('');
const card = (e: Edizione, id: string) => e.card.find((c) => c.id === id)!;

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe('creare un’edizione', () => {
  it('la settimana è il lunedì di status.aggiornato, con il momento della raccolta e il numero di versione', () => {
    const e = crea(); // aggiornato giovedì 15 ottobre 2026
    expect(e.versione).toBe(1);
    expect(e.settimana).toBe('2026-10-12');
    expect(e.raccolti).toBe('2026-10-15T08:00:00+00:00');
  });

  it('contiene le due porte, con i testi già composti: titolo con le parti in evidenza, nota, meta e destinazione', () => {
    const [perTe, italia] = crea().porte;
    expect(perTe.nome).toBe('Per te');
    expect(testo(perTe.titolo)).toBe('MCP entra tra le competenze da imparare ora; RAG esce');
    expect(perTe.titolo[0]).toEqual({ t: 'MCP', em: true });
    expect(perTe.meta).toBe('Radar delle competenze · dati al 15 ott 2026');
    expect(perTe.destinazione).toEqual({ tema: 'competenze', elemento: null });
    expect(italia.nome).toBe('Per la tua organizzazione');
    expect(testo(italia.titolo)).toBe("16% delle imprese italiane usa l'AI (UE: 20%)");
    expect(italia.destinazione).toEqual({ tema: 'business', elemento: null });
  });

  it('contiene tutte le nove frasi di card, ciascuna con cifra, unità, frase e destinazione', () => {
    const e = crea();
    expect(e.card.map((c) => c.id)).toEqual(['competenze', 'modelli', 'open', 'notizie', 'business', 'geopoliticai', 'persone', 'norme', 'rapporti']);
    expect(card(e, 'business')).toMatchObject({ nome: 'Business', cifra: '16', unita: '%', frase: "Imprese italiane che usano l'AI nel 2025. UE: 20%.", destinazione: { tema: 'business', elemento: null } });
    // la data delle frasi è quella dei dati: dal 15 ottobre al 2 dicembre 2026
    expect(card(e, 'norme')).toMatchObject({ cifra: '48', unita: 'giorni' });
  });

  it('non dipende dall’orologio né dalle scelte ricordate da chi lancia il comando', () => {
    const prima = crea();
    vi.useFakeTimers({ now: new Date('2031-03-03T10:00:00') });
    localStorage.setItem('ai-radar:ruolo', 'compliance');
    localStorage.setItem('ai-radar:mercato', 'italia');
    localStorage.setItem('ai-radar:settore', 'ict');
    expect(crea()).toEqual(prima);
  });

  it('senza lo stato delle fonti non c’è una settimana: l’edizione non si crea', () => {
    expect(creaEdizione({ ...d, status: undefined }, null)).toBeNull();
  });

  describe('porte senza dati', () => {
    // la porta dell'organizzazione ha cinque riserve: resta vuota solo se mancano tutte
    const senzaItalia: Dataset = { status: d.status, radar: d.radar };
    const senzaPerTe: Dataset = { ...d, radar: undefined };

    it('con tutte e due le porte senza dati l’edizione non si crea', () => {
      expect(creaEdizione({ status: d.status }, null)).toBeNull();
    });
    it('con una sola, quella porta dice «Dati non disponibili» e non porta da nessuna parte', () => {
      const [perTe, italia] = crea(senzaItalia).porte;
      expect(testo(perTe.titolo)).toMatch(/^MCP entra/);
      expect(italia).toMatchObject({ titolo: [], meta: 'Dati non disponibili', destinazione: null });
      expect(crea(senzaPerTe).porte[0]).toMatchObject({ titolo: [], meta: 'Dati non disponibili', destinazione: null });
    });
    it('una card senza dati resta tra le nove, senza cifra né frase', () => {
      expect(card(crea(senzaPerTe), 'competenze')).toMatchObject({ nome: 'Competenze', cifra: null, unita: null, frase: null });
    });
  });
});

describe('il confronto con l’edizione precedente', () => {
  const dopo = (dati: Dataset, precedente: Edizione | null) => crea(dati, precedente);
  /** I dati di una settimana dopo: 7 giorni di conto alla rovescia in più, tutto il resto uguale. */
  const settimanaDopo: Dataset = { ...d, status: { ...d.status!, aggiornato: '2026-10-22T08:00:00+00:00' } };
  const scadenzaVicina: Dataset = { ...d, ai_act: { scadenze: [{ data: '2026-11-05', titolo: 'Marcatura', descrizione: '', fonte: 'https://eur-lex.europa.eu/x' }] } };

  it('la prima edizione non ha precedente: tutte le card e le porte contano come da mostrare, tranne Notizie', () => {
    const e = crea();
    expect(e.precedente).toBeNull();
    expect(e.porte.map((p) => p.cambiata)).toEqual([true, true]);
    expect(e.card.filter((c) => !c.cambiata).map((c) => c.id)).toEqual(['notizie']);
  });

  it('con dati uguali niente è cambiato, e l’edizione nomina la precedente', () => {
    const e = dopo(settimanaDopo, crea());
    expect(e.precedente).toBe('2026-10-12');
    expect(e.settimana).toBe('2026-10-19');
    expect(e.porte.map((p) => p.cambiata)).toEqual([false, false]);
    expect(e.card.filter((c) => c.cambiata)).toEqual([]);
  });

  it('una card cambia se è diversa la cifra, l’unità o la frase', () => {
    const prima = crea();
    const conCifra = { ...prima, card: prima.card.map((c) => (c.id === 'modelli' ? { ...c, cifra: '×9,9' } : c)) };
    const conUnita = { ...prima, card: prima.card.map((c) => (c.id === 'modelli' ? { ...c, unita: 'al mese' } : c)) };
    const conFrase = { ...prima, card: prima.card.map((c) => (c.id === 'modelli' ? { ...c, frase: 'Altra.' } : c)) };
    for (const p of [conCifra, conUnita, conFrase]) expect(dopo(settimanaDopo, p).card.filter((c) => c.cambiata).map((c) => c.id)).toEqual(['modelli']);
  });

  it('il conto alla rovescia non conta come cambio nella card Norme, ma una scadenza diversa sì', () => {
    const e = dopo(settimanaDopo, crea());
    expect(card(e, 'norme').cifra).toBe('41'); // sette giorni in meno
    expect(card(e, 'norme').cambiata).toBe(false);
    const altra: Dataset = { ...settimanaDopo, ai_act: { scadenze: d.ai_act!.scadenze.slice(2) } };
    expect(card(dopo(altra, crea()), 'norme').cambiata).toBe(true);
  });

  it('una porta con una scadenza si confronta sulla scadenza a cui porta, non su «Tra N giorni»', () => {
    const prima = crea({ ...scadenzaVicina, status: { ...d.status!, aggiornato: '2026-10-15T08:00:00+00:00' } });
    const e = dopo({ ...scadenzaVicina, status: { ...d.status!, aggiornato: '2026-10-22T08:00:00+00:00' } }, prima);
    expect(testo(prima.porte[1].titolo)).toBe('Tra 21 giorni: marcatura');
    expect(testo(e.porte[1].titolo)).toBe('Tra 14 giorni: marcatura');
    expect(e.porte[1].cambiata).toBe(false);
    const altra: Dataset = { ...scadenzaVicina, status: { ...d.status!, aggiornato: '2026-10-22T08:00:00+00:00' }, ai_act: { scadenze: [{ data: '2026-11-06', titolo: 'Altro', descrizione: '', fonte: 'https://eur-lex.europa.eu/y' }] } };
    expect(dopo(altra, prima).porte[1].cambiata).toBe(true);
  });

  it('le altre porte si confrontano sul testo del titolo', () => {
    const prima = crea();
    const conAltroTitolo = { ...prima, porte: [{ ...prima.porte[0], titolo: [{ t: 'Altra notizia' }] }, prima.porte[1]] };
    expect(dopo(settimanaDopo, conAltroTitolo).porte.map((p) => p.cambiata)).toEqual([true, false]);
  });

  it('la card Notizie resta fuori dal confronto, anche se la sua frase cambia sempre con la data', () => {
    const e = dopo(settimanaDopo, crea());
    expect(card(e, 'notizie').frase).not.toBe(card(crea(), 'notizie').frase);
    expect(card(e, 'notizie').cambiata).toBe(false);
  });
});
