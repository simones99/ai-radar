import { describe, expect, it } from 'vitest';
import type { Dataset, Radar } from '../data/types';
import { FIXTURE, FIXTURE_TODAY as today, fromNorm } from '../test/fixtures';
import { doorItalia, doorPerTe } from './frasi';

const d = FIXTURE as Dataset;
const text = (parts: { t: string }[]) => parts.map((p) => p.t).join('');
// Le righe si scrivono pensando alla posizione sul grafico (0–1): fromNorm la porta in valori veri.
const radar = (rows: Partial<Radar['competenze'][number]>[]): Dataset => ({
  radar: {
    versione: 2, generato: '2026-10-15', quadranti: d.radar!.quadranti,
    competenze: rows.map((r, i) => fromNorm({ id: `c${i}`, nome: `Competenza ${i}`, breve: `C${i}`, descrizione: '', slancio: 0.5, domanda: 0.5, quadrante: 'impara-ora', ...r })),
  },
});

describe('porta Per te', () => {
  it('1. chi entra e chi esce da Impara ora', () => {
    const p = doorPerTe(d, today);
    expect(text(p.title)).toBe('MCP entra tra le competenze da imparare ora; RAG esce');
    expect(p.title[0]).toEqual({ t: 'MCP', em: true });
    expect(p.meta).toBe('Radar delle competenze · dati al 15 ott 2026');
    expect(p.target).toEqual({ tema: 'competenze', elemento: 'mcp' });
  });
  it('1. solo uscite', () => {
    const p = doorPerTe(radar([{ quadrante: 'consolida', slancio: 0.3, domanda: 0.7, slancio_prec: 0.7, domanda_prec: 0.7, quadrante_prec: 'impara-ora' }]), today);
    expect(text(p.title)).toBe('C0 esce da Impara ora');
    expect(p.target).toEqual({ tema: 'competenze', elemento: 'c0' });
  });
  it('1. radar dell’11: «dati all’11»', () => {
    const r = radar([{ quadrante: 'consolida', slancio: 0.3, domanda: 0.7, slancio_prec: 0.7, domanda_prec: 0.7, quadrante_prec: 'impara-ora' }]);
    const p = doorPerTe({ radar: { ...r.radar!, generato: '2026-10-11' } }, today);
    expect(p.meta).toBe('Radar delle competenze · dati all’11 ott 2026');
  });
  it('1. più competenze che entrano, nessuna esce', () => {
    const p = doorPerTe(radar([
      { quadrante: 'impara-ora', slancio: 0.7, domanda: 0.7, slancio_prec: 0.7, domanda_prec: 0.4, quadrante_prec: 'consolida' },
      { quadrante: 'impara-ora', slancio: 0.6, domanda: 0.8, slancio_prec: 0.6, domanda_prec: 0.45, quadrante_prec: 'consolida' },
    ]), today);
    expect(text(p.title)).toBe('C0 e C1 entrano tra le competenze da imparare ora');
    expect(p.target).toEqual({ tema: 'competenze', elemento: 'c0' });
  });
  it('2. altri cambi verso lo stesso quadrante: tutti i nomi', () => {
    const p = doorPerTe(radar([
      { quadrante: 'prova', slancio: 0.7, domanda: 0.2, slancio_prec: 0.3, domanda_prec: 0.2, quadrante_prec: 'osserva' },
      { quadrante: 'prova', slancio: 0.6, domanda: 0.3, slancio_prec: 0.4, domanda_prec: 0.3, quadrante_prec: 'osserva' },
    ]), today);
    expect(text(p.title)).toBe('C0 e C1 passano a Da provare');
    expect(p.target).toEqual({ tema: 'competenze', elemento: 'c0' });
  });
  it('2. cambi verso quadranti diversi: solo lo spostamento più grande', () => {
    const p = doorPerTe(radar([
      { quadrante: 'prova', slancio: 0.6, domanda: 0.2, slancio_prec: 0.45, domanda_prec: 0.2, quadrante_prec: 'osserva' },
      { quadrante: 'osserva', slancio: 0.1, domanda: 0.3, slancio_prec: 0.7, domanda_prec: 0.3, quadrante_prec: 'prova' },
    ]), today);
    expect(text(p.title)).toBe("C1 passa a Tieni d'occhio");
    expect(p.target).toEqual({ tema: 'competenze', elemento: 'c1' });
  });
  it('3. nessun cambio: lo spostamento più grande, se almeno un decimo dell’asse, in unità vere', () => {
    const p = doorPerTe(radar([
      { quadrante: 'osserva', slancio: 0.0, domanda: 0.3, slancio_prec: 0.33, domanda_prec: 0.3, quadrante_prec: 'osserva' },
      { quadrante: 'prova', slancio: 0.9, domanda: 0.1, slancio_prec: 0.8, domanda_prec: 0.1, quadrante_prec: 'prova' },
    ]), today);
    expect(text(p.title)).toBe('Slancio di C0 da −21% a −50%');
    expect(p.title[1]).toEqual({ t: 'C0', em: true });
    expect(p.target).toEqual({ tema: 'competenze', elemento: 'c0' });
  });
  it('3. spostamento sulla domanda', () => {
    const p = doorPerTe(radar([{ quadrante: 'impara-ora', slancio: 0.6, domanda: 0.9, slancio_prec: 0.6, domanda_prec: 0.6, quadrante_prec: 'impara-ora' }]), today);
    expect(text(p.title)).toBe('Domanda di C0 da 5,9 a 46 annunci ogni 10mila');
  });
  it('le competenze incerte non fanno notizia: si passa alla riserva', () => {
    const p = doorPerTe(radar([{ quadrante: 'impara-ora', slancio: 0.7, domanda: 0.7, slancio_prec: 0.7, domanda_prec: 0.4, quadrante_prec: 'consolida', incerto: true }]), today);
    expect(text(p.title)).toBe('1 competenza su 1 da imparare ora');
  });
  describe('nomi plurali: il verbo al plurale anche con una sola competenza', () => {
    const entra = { quadrante: 'impara-ora', slancio: 0.7, domanda: 0.7, slancio_prec: 0.7, domanda_prec: 0.4, quadrante_prec: 'consolida' } as const;
    const esce = { quadrante: 'consolida', slancio: 0.3, domanda: 0.7, slancio_prec: 0.7, domanda_prec: 0.7, quadrante_prec: 'impara-ora' } as const;
    it('1. entrano, escono', () => {
      expect(text(doorPerTe(radar([{ ...entra, breve: 'Multimodali', plurale: true }]), today).title)).toBe('Multimodali entrano tra le competenze da imparare ora');
      expect(text(doorPerTe(radar([{ ...esce, breve: 'DB vettoriali', plurale: true }]), today).title)).toBe('DB vettoriali escono da Impara ora');
      expect(text(doorPerTe(radar([{ ...entra, breve: 'Multimodali', plurale: true }, esce]), today).title))
        .toBe('Multimodali entrano tra le competenze da imparare ora; C1 esce');
    });
    it('2. passano', () => {
      const p = doorPerTe(radar([{ breve: 'Multimodali', plurale: true, quadrante: 'prova', slancio: 0.7, domanda: 0.2, slancio_prec: 0.3, domanda_prec: 0.2, quadrante_prec: 'osserva' }]), today);
      expect(text(p.title)).toBe('Multimodali passano a Da provare');
    });
    it('3. regola 3 senza accordo del verbo', () => {
      const perde = doorPerTe(radar([{ breve: 'DB vettoriali', plurale: true, quadrante: 'osserva', slancio: 0.0, domanda: 0.3, slancio_prec: 0.33, domanda_prec: 0.3, quadrante_prec: 'osserva' }]), today);
      expect(text(perde.title)).toBe('Slancio di DB vettoriali da −21% a −50%');
      const guadagna = doorPerTe(radar([{ breve: 'Agenti AI', plurale: true, slancio: 0.6, domanda: 0.9, slancio_prec: 0.6, domanda_prec: 0.6, quadrante_prec: 'impara-ora' }]), today);
      expect(text(guadagna.title)).toBe('Domanda di Agenti AI da 5,9 a 46 annunci ogni 10mila');
    });
  });
  it('4. riserva: quante competenze da imparare ora', () => {
    const p = doorPerTe(radar([{}, { quadrante: 'osserva', slancio: 0.2, domanda: 0.2 }]), today);
    expect(text(p.title)).toBe('1 competenza su 2 da imparare ora');
    expect(p.title[0]).toEqual({ t: '1 competenza su 2', em: true });
    expect(p.target).toEqual({ tema: 'competenze', elemento: null });
  });
  it('senza radar: porta vuota e non cliccabile', () => {
    expect(doorPerTe({}, today)).toEqual({ title: [], meta: 'Dati non ancora disponibili', target: null });
  });
});

describe('porta Per te con un ruolo', () => {
  const RUOLI = [{ id: 'prodotto', nome: 'Prodotto' }, { id: 'dati', nome: 'Dati e analisi' }];
  const conRuoli = (rows: Partial<Radar['competenze'][number]>[]): Dataset => ({ radar: { ...radar(rows).radar!, ruoli: RUOLI } });
  const entra = { quadrante: 'impara-ora', slancio: 0.7, domanda: 0.7, slancio_prec: 0.7, domanda_prec: 0.4, quadrante_prec: 'consolida' } as const;
  const passa = { quadrante: 'prova', slancio: 0.7, domanda: 0.2, slancio_prec: 0.3, domanda_prec: 0.2, quadrante_prec: 'osserva' } as const;

  it('le regole si provano prima sulle competenze del ruolo; etichetta e link dicono il ruolo', () => {
    const p = doorPerTe(conRuoli([{ ...entra, ruoli: ['dati'] }, { ...passa, ruoli: ['prodotto'] }]), today, 'prodotto');
    expect(text(p.title)).toBe('C1 passa a Da provare');
    expect(p.scelta).toBe('Prodotto');
    expect(p.target).toEqual({ tema: 'competenze', elemento: 'c1', params: { ruolo: 'prodotto' } });
  });
  it('1. sul ruolo: solo le entrate e uscite delle sue competenze', () => {
    const esce = { quadrante: 'consolida', slancio: 0.3, domanda: 0.7, slancio_prec: 0.7, domanda_prec: 0.7, quadrante_prec: 'impara-ora' } as const;
    const p = doorPerTe(conRuoli([{ ...entra, ruoli: ['prodotto'] }, { ...esce, ruoli: ['dati'] }]), today, 'prodotto');
    expect(text(p.title)).toBe('C0 entra tra le competenze da imparare ora');
  });
  it('nessuna regola scatta sul ruolo: le stesse regole su tutte le competenze, con il ruolo nell’etichetta e nel link', () => {
    const p = doorPerTe(conRuoli([{ ...entra, ruoli: ['dati'] }, { ruoli: ['prodotto'] }]), today, 'prodotto');
    expect(text(p.title)).toBe('C0 entra tra le competenze da imparare ora');
    expect(p.scelta).toBe('Prodotto');
    expect(p.target).toEqual({ tema: 'competenze', elemento: 'c0', params: { ruolo: 'prodotto' } });
  });
  it('le competenze incerte del ruolo non fanno notizia: si passa a tutte', () => {
    const p = doorPerTe(conRuoli([{ ...entra, ruoli: ['prodotto'], incerto: true }, { ...passa, ruoli: ['dati'] }]), today, 'prodotto');
    expect(text(p.title)).toBe('C1 passa a Da provare');
  });
  it('senza ruolo («Tutti») o con un ruolo che non c’è: la porta di oggi', () => {
    for (const r of [null, 'boh']) {
      const p = doorPerTe(d, today, r);
      expect(text(p.title)).toBe('MCP entra tra le competenze da imparare ora; RAG esce');
      expect(p.target).toStrictEqual({ tema: 'competenze', elemento: 'mcp' });
      expect(p).not.toHaveProperty('ruolo');
    }
  });
  it('riserva: conta le competenze del ruolo da imparare ora', () => {
    const fuori = { quadrante: 'osserva', slancio: 0.2, domanda: 0.2 } as const;
    const p = doorPerTe(conRuoli([{ ruoli: ['prodotto'] }, { ruoli: ['prodotto'] }, { ...fuori, ruoli: ['prodotto'] }, { ruoli: ['dati'] }, { ...fuori, ruoli: ['prodotto'] }]), today, 'prodotto');
    expect(text(p.title)).toBe('2 delle 4 competenze di Prodotto da imparare ora');
    expect(p.title[0]).toEqual({ t: '2 delle 4 competenze di Prodotto', em: true });
    expect(p.scelta).toBe('Prodotto');
    expect(p.target).toEqual({ tema: 'competenze', elemento: null, params: { ruolo: 'prodotto' } });
    const una = doorPerTe(conRuoli([{ ruoli: ['dati'] }, { ...fuori, ruoli: ['dati'] }, { ...fuori, ruoli: ['dati'] }, { ...fuori, ruoli: ['dati'] }]), today, 'dati');
    expect(text(una.title)).toBe('1 delle 4 competenze di Dati e analisi da imparare ora');
  });
});

describe('porta L’AI in Italia', () => {
  const at = (iso: string) => new Date(`${iso}T10:00:00`);
  it('1. scadenza entro 30 giorni, con Oggi e Domani', () => {
    const p = doorItalia(d, at('2026-11-20'));
    expect(text(p.title)).toBe('Tra 12 giorni: fine della transizione per la marcatura');
    expect(p.title[0]).toEqual({ t: 'Tra 12 giorni', em: true });
    expect(p.meta).toBe('AI Act · scadenza del 2 dic 2026');
    expect(p.target).toEqual({ tema: 'norme', elemento: '2026-12-02' });
    expect(text(doorItalia(d, at('2026-12-01')).title)).toBe('Domani: fine della transizione per la marcatura');
    expect(text(doorItalia(d, at('2026-12-02')).title)).toBe('Oggi: fine della transizione per la marcatura');
  });
  it('1. scadenza dell’11: «scadenza dell’11»', () => {
    const e = { ...d, ai_act: { scadenze: [{ ...d.ai_act!.scadenze[1], data: '2026-12-11' }] } };
    expect(doorItalia(e, at('2026-11-20')).meta).toBe('AI Act · scadenza dell’11 dic 2026');
  });
  it('2. dato Eurostat italiano aggiornato negli ultimi 30 giorni', () => {
    const e = { ...d, eurostat: { ...d.eurostat!, aggiornato_eurostat: '2026-10-01T11:00:00+0200' } };
    const p = doorItalia(e, today);
    expect(text(p.title)).toBe("16% delle imprese italiane usa l'AI (UE: 20%)");
    expect(p.title[0]).toEqual({ t: '16% delle imprese italiane', em: true });
    expect(p.meta).toBe('Eurostat · aggiornato l’1 ott 2026');
    expect(p.target).toEqual({ tema: 'business', elemento: null });
  });
  describe('2. con un settore ricordato', () => {
    // dati dei settori usciti l'1 ottobre, cioè negli ultimi 30 giorni
    const s = { ...d, eurostat_settori: { ...d.eurostat_settori!, aggiornato_eurostat: '2026-10-01T11:00:00+0200' } };
    it('la notizia è quella del settore, con la sua forma nella frase, e il link apre la card con il settore', () => {
      const p = doorItalia(s, today, 'manifattura');
      expect(text(p.title)).toBe("15% delle imprese manifatturiere italiane usa l'AI (UE: 17%)");
      expect(p.title[0]).toEqual({ t: '15% delle imprese manifatturiere italiane', em: true });
      expect(p.meta).toBe('Eurostat · aggiornato l’1 ott 2026');
      expect(p.target).toEqual({ tema: 'business', elemento: null, params: { settore: 'manifattura' } });
      expect(p.scelta).toBe('Manifattura');
    });
    // anche il dato nazionale è uscito di recente: è la frase generale di oggi
    const tutte = { ...s, eurostat: { ...d.eurostat!, aggiornato_eurostat: '2026-10-01T11:00:00+0200' } };
    const generale = doorItalia(tutte, today);
    it('valore italiano del settore non affidabile: la frase generale, senza settore nell’etichetta', () => {
      const x = structuredClone(tutte);
      x.eurostat_settori!.adozione.manifattura.IT['2025'] = null;
      const p = doorItalia(x, today, 'manifattura');
      expect(text(p.title)).toBe("16% delle imprese italiane usa l'AI (UE: 20%)");
      expect(p).toEqual(generale);
      expect(p.scelta).toBeUndefined();
    });
    it('con «Tutti», con un settore sconosciuto o senza dati dei settori: la porta di oggi', () => {
      for (const id of ['tutti', 'finanza', null]) expect(doorItalia(tutte, today, id)).toEqual(generale);
      expect(doorItalia({ ...tutte, eurostat_settori: undefined }, today, 'manifattura')).toEqual(generale);
    });
    it('dati dei settori non recenti: la regola 2 del settore non scatta', () => {
      expect(doorItalia({ ...tutte, eurostat_settori: d.eurostat_settori }, today, 'manifattura')).toEqual(generale);
      expect(doorItalia({ ...d, eurostat_settori: d.eurostat_settori }, today, 'manifattura').target?.tema).toBe('rapporti');
    });
    it('valore UE del settore mancante: la frase senza il confronto UE', () => {
      const x = structuredClone(s);
      x.eurostat_settori!.adozione.ict.EU27_2020['2025'] = null;
      expect(text(doorItalia(x, today, 'ict').title)).toBe("51% delle imprese di informazione e comunicazione italiane usa l'AI");
    });
    it('le regole 1, 3 e 4 non cambiano con un settore', () => {
      const vicina = { ...s, ai_act: { scadenze: [{ ...d.ai_act!.scadenze[1], data: '2026-10-20' }] } }; // tra 5 giorni
      expect(doorItalia(vicina, today, 'manifattura').target?.tema).toBe('norme');
      expect(doorItalia(vicina, today, 'manifattura')).toEqual(doorItalia(vicina, today));
      expect(doorItalia(d, today, 'manifattura')).toEqual(doorItalia(d, today));
      expect(doorItalia({ ...d, rapporti: undefined }, today, 'manifattura')).toEqual(doorItalia({ ...d, rapporti: undefined }, today));
    });
  });
  it('2. Eurostat aggiornato ma senza Italia: si passa oltre', () => {
    const e = { ...d, eurostat: { ...d.eurostat!, aggiornato_eurostat: '2026-10-01', serie: { EU27_2020: d.eurostat!.serie.EU27_2020 } } };
    expect(doorItalia(e, today).target?.tema).toBe('rapporti');
  });
  it('2. uso dell’AI generativa in Italia aggiornato negli ultimi 30 giorni', () => {
    const o = { ...d.owid!, serie: { ...d.owid!.serie, uso_genai: { ...d.owid!.serie.uso_genai, aggiornato_owid: '2026-10-01' } } };
    const p = doorItalia({ ...d, owid: o }, today);
    expect(text(p.title)).toBe("30% degli italiani usa l'AI generativa (mondo: 18%)");
    expect(p.meta).toBe('Microsoft via Our World in Data · aggiornato l’1 ott 2026');
    expect(p.target).toEqual({ tema: 'persone', elemento: null });
  });
  it('3. rapporto previsto entro 30 giorni', () => {
    const p = doorItalia(d, today);
    expect(text(p.title)).toBe('A ottobre esce State of AI Report');
    expect(p.title[1]).toEqual({ t: 'State of AI Report', em: true });
    expect(p.meta).toBe('Data stimata, dai rapporti degli anni scorsi');
    expect(p.target).toEqual({ tema: 'rapporti', elemento: 'state-of-ai-report' });
  });
  it('2. dati vecchi di mesi: la regola 2 non scatta', () => {
    const o = { ...d.owid!, serie: { ...d.owid!.serie, uso_genai: { ...d.owid!.serie.uso_genai, aggiornato_owid: '2026-06-12' } } };
    const e = { ...d, owid: o, eurostat: { ...d.eurostat!, aggiornato_eurostat: '2026-06-15T11:00:00+0200' } };
    const tema = doorItalia(e, today).target?.tema;
    expect(tema).not.toBe('business');
    expect(tema).not.toBe('persone');
    expect(tema).toBe('rapporti');
  });
  it('3. rapporto lontano: la regola 3 non scatta, resta la riserva', () => {
    const r = { rapporti: [{ ...d.rapporti!.rapporti[0], prossima_prevista: '2027-10' }] };
    const p = doorItalia({ ...d, rapporti: r }, today);
    expect(p.target?.tema).toBe('norme');
    expect(text(p.title)).toBe("48 giorni alla prossima scadenza dell'AI Act");
  });
  it('3. davanti ad aprile si scrive «Ad»', () => {
    const p = doorItalia(d, at('2027-03-20'));
    expect(text(p.title)).toBe('Ad aprile esce AI Index Report');
  });
  it('4. riserva: la prossima scadenza, anche lontana', () => {
    const p = doorItalia({ ...d, rapporti: undefined }, today);
    expect(text(p.title)).toBe("48 giorni alla prossima scadenza dell'AI Act");
    expect(p.meta).toBe('AI Act · Fine della transizione per la marcatura');
    expect(p.target).toEqual({ tema: 'norme', elemento: '2026-12-02' });
  });
  it('senza dati: porta vuota e non cliccabile', () => {
    expect(doorItalia({}, today)).toEqual({ title: [], meta: 'Dati non ancora disponibili', target: null });
  });
});
