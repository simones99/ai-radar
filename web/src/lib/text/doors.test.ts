import { describe, expect, it } from 'vitest';
import type { Dataset, Radar } from '../data/types';
import { FIXTURE, FIXTURE_TODAY as today, fromNorm } from '../test/fixtures';
import { doorItalia, doorPerTe, faceGeopoliticai } from './frasi';

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
  it('1. chi entra e chi esce è la notizia della testa, e il link apre chi entra', () => {
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
  it('1. più competenze che escono, nessuna entra', () => {
    const p = doorPerTe(radar([
      { quadrante: 'consolida', slancio: 0.3, domanda: 0.7, slancio_prec: 0.7, domanda_prec: 0.7, quadrante_prec: 'impara-ora' },
      { quadrante: 'consolida', slancio: 0.35, domanda: 0.8, slancio_prec: 0.6, domanda_prec: 0.8, quadrante_prec: 'impara-ora' },
    ]), today);
    expect(text(p.title)).toBe('C0 e C1 escono da Impara ora');
    expect(p.target).toEqual({ tema: 'competenze', elemento: 'c0' });
  });
  it('2. altri cambi verso lo stesso quadrante: tutti i nomi', () => {
    const p = doorPerTe(radar([
      { quadrante: 'prova', slancio: 0.7, domanda: 0.6, slancio_prec: 0.3, domanda_prec: 0.6, quadrante_prec: 'osserva' },
      { quadrante: 'prova', slancio: 0.6, domanda: 0.6, slancio_prec: 0.4, domanda_prec: 0.6, quadrante_prec: 'osserva' },
    ]), today);
    expect(text(p.title)).toBe('C0 e C1 passano a Da provare');
    expect(p.target).toEqual({ tema: 'competenze', elemento: 'c0' });
  });
  it('2. cambi verso quadranti diversi: solo lo spostamento più grande', () => {
    const p = doorPerTe(radar([
      { quadrante: 'prova', slancio: 0.6, domanda: 0.6, slancio_prec: 0.45, domanda_prec: 0.6, quadrante_prec: 'osserva' },
      { quadrante: 'osserva', slancio: 0.1, domanda: 0.6, slancio_prec: 0.7, domanda_prec: 0.6, quadrante_prec: 'prova' },
    ]), today);
    expect(text(p.title)).toBe("C1 passa a Tieni d'occhio");
    expect(p.target).toEqual({ tema: 'competenze', elemento: 'c1' });
  });
  it('3. nessun cambio: lo spostamento più grande, se almeno un decimo dell’asse, in unità vere', () => {
    const p = doorPerTe(radar([
      { quadrante: 'osserva', slancio: 0.0, domanda: 0.6, slancio_prec: 0.33, domanda_prec: 0.6, quadrante_prec: 'osserva' },
      { quadrante: 'prova', slancio: 0.9, domanda: 0.6, slancio_prec: 0.8, domanda_prec: 0.6, quadrante_prec: 'prova' },
    ]), today);
    expect(text(p.title)).toBe('Slancio di C0 da −21% a −50%');
    expect(p.title[1]).toEqual({ t: 'C0', em: true });
    expect(p.target).toEqual({ tema: 'competenze', elemento: 'c0' });
  });
  it('3. sullo slancio, un valore di un mese fa dentro il margine di oggi non è una notizia', () => {
    const giu = { quadrante: 'osserva', slancio: 0.0, domanda: 0.6, slancio_prec: 0.33, domanda_prec: 0.6, quadrante_prec: 'osserva' } as const;
    const p = doorPerTe(radar([giu]), today);
    expect(text(p.title)).toBe('Slancio di C0 da −21% a −50%');
    const conMargine = (m: [number, number]): Dataset => {
      const r = radar([giu]);
      return { radar: { ...r.radar!, competenze: [{ ...r.radar!.competenze[0], slancio_margine: m }] } };
    };
    expect(text(doorPerTe(conMargine([-0.6, -0.1]), today).title)).toMatch(/ha più annunci di tutte/);
    expect(text(doorPerTe(conMargine([-0.6, -0.4]), today).title)).toBe('Slancio di C0 da −21% a −50%');
  });
  it('3. spostamento sulla domanda', () => {
    const p = doorPerTe(radar([{ quadrante: 'impara-ora', slancio: 0.6, domanda: 0.9, slancio_prec: 0.6, domanda_prec: 0.6, quadrante_prec: 'impara-ora' }]), today);
    expect(text(p.title)).toBe('Domanda di C0 da 5,9 a 46 annunci ogni 10mila');
  });
  describe('sotto i 3 annunci ogni 10mila una competenza non fa notizia', () => {
    const poca = { quadrante: 'prova', slancio: 0.7, domanda: 0.2, slancio_prec: 0.3, domanda_prec: 0.2, quadrante_prec: 'osserva' } as const;
    it('2. un cambio di quadrante: tocca a una competenza con più annunci', () => {
      const p = doorPerTe(radar([poca, { quadrante: 'impara-ora', slancio: 0.6, domanda: 0.8 }]), today);
      expect(text(p.title)).toMatch(/^C1 cresce più di tutte: /);
    });
    it('3. lo spostamento più grande', () => {
      const p = doorPerTe(radar([{ quadrante: 'osserva', slancio: 0.0, domanda: 0.2, slancio_prec: 0.33, domanda_prec: 0.2, quadrante_prec: 'osserva' }, { quadrante: 'impara-ora', slancio: 0.6, domanda: 0.8 }]), today);
      expect(text(p.title)).toMatch(/^C1 cresce più di tutte: /);
    });
    it('4. lo slancio più alto', () => {
      const p = doorPerTe(radar([{ quadrante: 'prova', slancio: 0.9, domanda: 0.2 }, { quadrante: 'impara-ora', slancio: 0.6, domanda: 0.8 }]), today);
      expect(text(p.title)).toMatch(/^C1 cresce più di tutte: /);
    });
    it('1. un’uscita da Impara ora resta una notizia: è il fatto che gli annunci sono scesi', () => {
      const p = doorPerTe(radar([{ quadrante: 'prova', slancio: 0.7, domanda: 0.2, slancio_prec: 0.7, domanda_prec: 0.7, quadrante_prec: 'impara-ora' }]), today);
      expect(text(p.title)).toBe('C0 esce da Impara ora');
    });
  });
  it('le competenze incerte non fanno notizia: si passa alla riserva', () => {
    const p = doorPerTe(radar([{ quadrante: 'impara-ora', slancio: 0.7, domanda: 0.7, slancio_prec: 0.7, domanda_prec: 0.4, quadrante_prec: 'consolida', incerto: true }]), today);
    expect(text(p.title)).toBe('1 competenza su 1 da imparare ora');
  });
  describe('nomi plurali: il verbo al plurale anche con una sola competenza', () => {
    const esce = { quadrante: 'consolida', slancio: 0.3, domanda: 0.7, slancio_prec: 0.7, domanda_prec: 0.7, quadrante_prec: 'impara-ora' } as const;
    it('1. escono', () => {
      expect(text(doorPerTe(radar([{ ...esce, breve: 'DB vettoriali', plurale: true }]), today).title)).toBe('DB vettoriali escono da Impara ora');
    });
    it('4. crescono', () => {
      const p = doorPerTe(radar([{ breve: 'Agenti AI', plurale: true, quadrante: 'prova', slancio: 0.65, domanda: 0.6 }]), today);
      expect(text(p.title)).toMatch(/^Agenti AI crescono più di tutte: \+\d+% sull'AI in 6 mesi$/);
    });
    it('2. passano', () => {
      const p = doorPerTe(radar([{ breve: 'Multimodali', plurale: true, quadrante: 'prova', slancio: 0.7, domanda: 0.6, slancio_prec: 0.3, domanda_prec: 0.6, quadrante_prec: 'osserva' }]), today);
      expect(text(p.title)).toBe('Multimodali passano a Da provare');
    });
    it('5. hanno più annunci', () => {
      expect(text(doorPerTe(radar([{ breve: 'DB vettoriali', plurale: true }]), today).title)).toMatch(/^DB vettoriali hanno più annunci di tutte: /);
    });
    it('3. regola 3 senza accordo del verbo', () => {
      const perde = doorPerTe(radar([{ breve: 'DB vettoriali', plurale: true, quadrante: 'osserva', slancio: 0.0, domanda: 0.6, slancio_prec: 0.33, domanda_prec: 0.6, quadrante_prec: 'osserva' }]), today);
      expect(text(perde.title)).toBe('Slancio di DB vettoriali da −21% a −50%');
      const guadagna = doorPerTe(radar([{ breve: 'Agenti AI', plurale: true, slancio: 0.6, domanda: 0.9, slancio_prec: 0.6, domanda_prec: 0.6, quadrante_prec: 'impara-ora' }]), today);
      expect(text(guadagna.title)).toBe('Domanda di Agenti AI da 5,9 a 46 annunci ogni 10mila');
    });
  });
  it('5. riserva: la competenza con più annunci, perché quante sono da imparare ora lo dice già la card', () => {
    const p = doorPerTe(radar([{ quadrante: 'osserva', slancio: 0.2, domanda: 0.2 }, {}]), today);
    expect(text(p.title)).toMatch(/^C1 ha più annunci di tutte: [\d,]+ ogni 10mila$/);
    expect(p.title[0]).toEqual({ t: 'C1', em: true });
    expect(p.target).toEqual({ tema: 'competenze', elemento: 'c1' });
  });
  it('5. riserva: quante competenze da imparare ora, se la competenza con più annunci è incerta', () => {
    const p = doorPerTe(radar([{ quadrante: 'osserva', slancio: 0.2, domanda: 0.9, incerto: true }, {}]), today);
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
  const passa = { quadrante: 'prova', slancio: 0.7, domanda: 0.6, slancio_prec: 0.3, domanda_prec: 0.6, quadrante_prec: 'osserva' } as const;

  it('le regole si provano prima sulle competenze del ruolo; etichetta e link dicono il ruolo', () => {
    const p = doorPerTe(conRuoli([{ ...entra, ruoli: ['dati'] }, { ...passa, ruoli: ['prodotto'] }]), today, 'prodotto');
    expect(text(p.title)).toBe('C1 passa a Da provare');
    expect(p.scelta).toBe('Prodotto');
    expect(p.target).toEqual({ tema: 'competenze', elemento: 'c1', params: { ruolo: 'prodotto' } });
  });
  it('1. sul ruolo: solo le uscite delle sue competenze', () => {
    const esce = { quadrante: 'consolida', slancio: 0.3, domanda: 0.7, slancio_prec: 0.7, domanda_prec: 0.7, quadrante_prec: 'impara-ora' } as const;
    const p = doorPerTe(conRuoli([{ ...esce, ruoli: ['prodotto'] }, { ...esce, ruoli: ['dati'] }]), today, 'prodotto');
    expect(text(p.title)).toBe('C0 esce da Impara ora');
  });
  it('sul ruolo: chi entra viene prima degli altri cambi', () => {
    const p = doorPerTe(conRuoli([{ ...entra, ruoli: ['prodotto'] }, { ...passa, ruoli: ['prodotto'] }]), today, 'prodotto');
    expect(text(p.title)).toBe('C0 entra tra le competenze da imparare ora');
  });
  it('nessuna regola scatta sul ruolo: le stesse regole su tutte le competenze, con il ruolo nell’etichetta e nel link', () => {
    const p = doorPerTe(conRuoli([{ ...passa, ruoli: ['dati'] }, { ruoli: ['prodotto'] }]), today, 'prodotto');
    expect(text(p.title)).toBe('C0 passa a Da provare');
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
  const conScadenza = (data: string, titolo = 'Codici di buone pratiche'): Dataset =>
    ({ ...d, ai_act: { scadenze: [...d.ai_act!.scadenze, { ...d.ai_act!.scadenze[1], data, titolo }] } });
  it('1. scadenza entro 30 giorni, prima del dato italiano, con Oggi e Domani', () => {
    const p = doorItalia(d, at('2026-11-20'));
    expect(text(p.title)).toBe('Tra 12 giorni: fine della transizione per la marcatura');
    expect(p.title[0]).toEqual({ t: 'Tra 12 giorni', em: true });
    expect(p.meta).toBe('AI Act · scadenza del 2 dic 2026');
    expect(p.target).toEqual({ tema: 'norme', elemento: '2026-12-02' });
    expect(text(doorItalia(d, at('2026-12-01')).title)).toBe('Domani: fine della transizione per la marcatura');
    expect(text(doorItalia(d, at('2026-12-02')).title)).toBe('Oggi: fine della transizione per la marcatura');
  });
  it('1. due scadenze vicine: la prima', () => {
    expect(text(doorItalia(conScadenza('2026-11-25'), at('2026-11-20')).title)).toBe('Tra 5 giorni: codici di buone pratiche');
  });
  it('1. scadenza dell’11: «scadenza dell’11»', () => {
    const e = { ...d, ai_act: { scadenze: [{ ...d.ai_act!.scadenze[1], data: '2026-12-11' }] } };
    expect(doorItalia(e, at('2026-11-20')).meta).toBe('AI Act · scadenza dell’11 dic 2026');
  });
  it('2. oltre i 30 giorni dalla scadenza: il dato italiano, anche se non è appena uscito', () => {
    const p = doorItalia(d, today); // la scadenza è tra 48 giorni, il dato Eurostat del 15 giugno
    expect(text(p.title)).toBe("16% delle imprese italiane usa l'AI (UE: 20%)");
    expect(p.title[0]).toEqual({ t: '16% delle imprese italiane', em: true });
    expect(p.meta).toBe('Eurostat');
    expect(p.target).toEqual({ tema: 'business', elemento: null });
    const conData = { ...d, eurostat: { ...d.eurostat!, aggiornato_eurostat: '2026-06-15T11:00:00+0200' } };
    expect(doorItalia(conData, today).meta).toBe('Eurostat · aggiornato il 15 giu 2026');
  });
  describe('2. con un settore ricordato', () => {
    const generale = doorItalia(d, today);
    it('la notizia è quella del settore, con la sua forma nella frase, e il link apre la card con il settore', () => {
      const p = doorItalia(d, today, 'manifattura');
      expect(text(p.title)).toBe("15% delle imprese manifatturiere italiane usa l'AI (UE: 17%)");
      expect(p.title[0]).toEqual({ t: '15% delle imprese manifatturiere italiane', em: true });
      expect(p.meta).toBe('Eurostat · aggiornato il 15 giu 2026');
      expect(p.target).toEqual({ tema: 'business', elemento: null, params: { settore: 'manifattura' } });
      expect(p.scelta).toBe('Manifattura');
    });
    it('valore italiano del settore non affidabile: la frase generale, senza settore nell’etichetta', () => {
      const x = structuredClone(d);
      x.eurostat_settori!.adozione.manifattura.IT['2025'] = null;
      const p = doorItalia(x, today, 'manifattura');
      expect(p).toEqual(generale);
      expect(p.scelta).toBeUndefined();
    });
    it('con «Tutti», con un settore sconosciuto o senza dati dei settori: la frase generale', () => {
      for (const id of ['tutti', 'finanza', null]) expect(doorItalia(d, today, id)).toEqual(generale);
      expect(doorItalia({ ...d, eurostat_settori: undefined }, today, 'manifattura')).toEqual(generale);
    });
    it('valore UE del settore mancante: la frase senza il confronto UE', () => {
      const x = structuredClone(d);
      x.eurostat_settori!.adozione.ict.EU27_2020['2025'] = null;
      expect(text(doorItalia(x, today, 'ict').title)).toBe("51% delle imprese di informazione e comunicazione italiane usa l'AI");
    });
    it('una scadenza vicina viene prima anche del settore', () => {
      expect(doorItalia(d, at('2026-11-20'), 'manifattura')).toEqual(doorItalia(d, at('2026-11-20')));
    });
  });
  it('2. Eurostat senza Italia: l’uso dell’AI generativa in Italia, anche senza una data di aggiornamento', () => {
    const e = { ...d, eurostat: { ...d.eurostat!, serie: { EU27_2020: d.eurostat!.serie.EU27_2020 } } };
    const p = doorItalia(e, today);
    expect(text(p.title)).toBe("30% degli italiani usa l'AI generativa (mondo: 18%)");
    expect(p.meta).toBe('Microsoft via Our World in Data');
    expect(p.target).toEqual({ tema: 'persone', elemento: null });
  });
  it('2. l’uso dell’AI generativa dice la sua data, quando la fonte la dà', () => {
    const o = { ...d.owid!, serie: { ...d.owid!.serie, uso_genai: { ...d.owid!.serie.uso_genai, aggiornato_owid: '2026-10-01' } } };
    expect(doorItalia({ ...d, eurostat: undefined, owid: o }, today).meta).toBe('Microsoft via Our World in Data · aggiornato l’1 ott 2026');
  });
  // senza un dato italiano si arriva alla regola 3; senza GeopoliticAI, alle riserve
  const senzaItalia = { ...d, eurostat: undefined, owid: undefined };
  const senzaGeo = { ...senzaItalia, geopoliticai: undefined };
  describe('3. GeopoliticAI: quanti modelli di grande scala sono europei', () => {
    const conUe = (n: number) => {
      const x = structuredClone({ ...senzaItalia, rapporti: undefined });
      x.geopoliticai!.zone.ue.calcolo['2026'] = { n, nc: n, max: null, modello: null };
      return x;
    };
    it('nell’anno in corso, nessuno: la frase lo dice, con «finora», e apre GeopoliticAI sull’UE, anche con un rapporto vicino', () => {
      const p = doorItalia(senzaItalia, today);
      expect(text(p.title)).toBe('Nessuno dei 35 modelli di grande scala del 2026 è europeo, finora');
      expect(p.title[0]).toEqual({ t: 'Nessuno dei 35', em: true });
      expect(p.meta).toBe('Epoch AI · dati scaricati il 15 ott 2026');
      expect(p.target).toEqual({ tema: 'geopoliticai', elemento: 'chi-addestra', params: { area: 'ue' } });
    });
    it('nell’anno in corso, uno o più', () => {
      expect(text(doorItalia(conUe(2), today).title)).toBe('2 dei 37 modelli di grande scala del 2026 sono europei (5%), finora');
      expect(text(doorItalia(conUe(1), today).title)).toBe('1 dei 36 modelli di grande scala del 2026 è europeo (3%), finora');
    });
    it('nessun modello nell’anno in corso, di nessuna area: l’ultimo anno chiuso, senza «finora»', () => {
      const x = structuredClone({ ...senzaItalia, rapporti: undefined });
      for (const z of Object.values(x.geopoliticai!.zone)) delete z.calcolo['2026'];
      expect(text(doorItalia(x, today).title)).toBe('5 dei 165 modelli di grande scala del 2025 sono europei (3%)');
    });
    it('non ripete la card GeopoliticAI: né il distacco, né la capacità, né il modello', () => {
      const card = faceGeopoliticai(d, today)!;
      const porta = text(doorItalia({ ...senzaItalia, rapporti: undefined }, today).title);
      for (const t of [card.fig, card.unit, 'ECI', 'Mistral']) expect(porta).not.toContain(t);
    });
  });
  it('4. riserva: la prossima scadenza, anche lontana, anche con un rapporto vicino', () => {
    const p = doorItalia(senzaGeo, today);
    expect(text(p.title)).toBe('Tra 48 giorni: fine della transizione per la marcatura');
    expect(p.title[0]).toEqual({ t: 'Tra 48 giorni', em: true });
    expect(p.meta).toBe('AI Act · scadenza del 2 dic 2026');
    expect(p.target).toEqual({ tema: 'norme', elemento: '2026-12-02' });
  });
  describe('5. rapporto: solo quando non resta nient’altro', () => {
    const soloRapporti = { rapporti: d.rapporti };
    it('previsto entro 30 giorni', () => {
      const p = doorItalia(soloRapporti, today);
      expect(text(p.title)).toBe('A ottobre esce State of AI Report');
      expect(p.title[1]).toEqual({ t: 'State of AI Report', em: true });
      expect(p.meta).toBe('Data stimata, dai rapporti degli anni scorsi');
      expect(p.target).toEqual({ tema: 'rapporti', elemento: 'state-of-ai-report' });
    });
    it('lontano: la porta resta vuota', () => {
      const r = { rapporti: [{ ...d.rapporti!.rapporti[0], prossima_prevista: '2027-10' }] };
      expect(doorItalia({ rapporti: r }, today).target).toBeNull();
    });
    it('davanti ad aprile si scrive «Ad»', () => {
      expect(text(doorItalia(soloRapporti, at('2027-03-20')).title)).toBe('Ad aprile esce AI Index Report');
    });
  });
  it('senza dati: porta vuota e non cliccabile', () => {
    expect(doorItalia({}, today)).toEqual({ title: [], meta: 'Dati non ancora disponibili', target: null });
  });
});
