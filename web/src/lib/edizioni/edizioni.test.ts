// Il modulo Edizioni dagli ingressi alle uscite: dati del FIXTURE ed edizione precedente in entrata, JSON e file del sito in uscita.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Dataset } from '../data/types';
import { FIXTURE } from '../test/fixtures';
import { TESTE, TILES } from '../tiles/registry';
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

describe('le notizie scelte', () => {
  const voce = (titolo: string, data: string, fonte: string, tema?: string) => ({ titolo, link: `https://esempio.org/${encodeURIComponent(titolo)}`, data, fonte, tema });
  const conNotizie = (notizie: ReturnType<typeof voce>[]): Dataset => ({ ...d, news: { ...d.news!, notizie } });
  const titoli = (e: Edizione, tema: string) => e.notizie.temi.find((t) => t.tema === tema)?.voci.map((v) => v.titolo);

  it('si parte dalla finestra di 7 giorni fino all’ultimo aggiornamento: numero, periodo e numero di fonti', () => {
    const { notizie } = crea();
    expect(notizie.numero).toBe(2); // la terza del FIXTURE è del 20 settembre
    expect(notizie.periodo).toBe('nei 7 giorni fino al 15 ott 2026');
    expect(notizie.fonti).toBe(2);
    expect(notizie.temi.flatMap((t) => t.voci.map((v) => v.titolo))).not.toContain('Una notizia vecchia');
    expect(notizie.temi[0].voci[0]).toEqual({ titolo: 'AI Act: le linee guida sulla trasparenza', link: 'https://artificialintelligenceact.eu/b', data: '2026-10-12', fonte: 'EU AI Act Newsletter' });
  });

  it('fino a 3 per tema, le più recenti', () => {
    const e = crea(conNotizie([
      voce('a', '2026-10-10', 'F1', 'ricerca'), voce('b', '2026-10-13', 'F2', 'ricerca'), voce('c', '2026-10-11', 'F3', 'ricerca'), voce('d', '2026-10-14', 'F4', 'ricerca'),
    ]));
    expect(titoli(e, 'ricerca')).toEqual(['d', 'b', 'c']);
    expect(e.notizie.numero).toBe(4); // il conteggio resta quello di tutte le notizie della settimana
  });

  it('senza ripetere una fonte nello stesso tema, e la stessa fonte può tornare in un altro tema', () => {
    const e = crea(conNotizie([
      voce('a', '2026-10-14', 'F1', 'ricerca'), voce('b', '2026-10-13', 'F1', 'ricerca'), voce('c', '2026-10-12', 'F2', 'ricerca'),
      voce('d', '2026-10-14', 'F1', 'business'),
    ]));
    expect(titoli(e, 'ricerca')).toEqual(['a', 'c']);
    expect(titoli(e, 'business')).toEqual(['d']);
    expect(e.notizie.fonti).toBe(2);
  });

  it('a parità di data l’ordine è quello del file, e due giri danno lo stesso risultato', () => {
    const dati = conNotizie([voce('prima', '2026-10-14', 'F1', 'ricerca'), voce('seconda', '2026-10-14', 'F2', 'ricerca'), voce('terza', '2026-10-14', 'F3', 'ricerca')]);
    expect(titoli(crea(dati), 'ricerca')).toEqual(['prima', 'seconda', 'terza']);
    expect(crea(dati)).toEqual(crea(dati));
  });

  it('i temi stanno in ordine fisso, con il loro nome, e i temi vuoti non compaiono; una voce senza tema va in Altro, in fondo', () => {
    const e = crea(conNotizie([voce('a', '2026-10-14', 'F1'), voce('b', '2026-10-14', 'F1', 'business'), voce('c', '2026-10-14', 'F1', 'politica')]));
    expect(e.notizie.temi.map((t) => t.nome)).toEqual(['Politica', 'Business', 'Altro']);
  });

  it('la regola è scritta nell’edizione: se un giorno cambia, le vecchie continuano a dire la loro', () => {
    expect(crea().notizie.regola).toMatch(/^Fino a 3 notizie per tema, le più recenti, senza ripetere una fonte nello stesso tema/);
  });

  it('senza il file delle notizie la sezione resta vuota', () => {
    const { notizie } = crea({ ...d, news: undefined });
    expect(notizie).toMatchObject({ numero: 0, fonti: 0, temi: [] });
  });
});

describe('fonte e licenza su ogni riga', () => {
  const fonti = (e: Edizione, id: string) => card(e, id).fonti;
  const nomi = (xs: { nome: string }[]) => xs.map((f) => f.nome);

  it('ogni card e ogni porta con dati ha almeno una fonte, e ogni fonte ha una licenza', () => {
    const e = crea();
    for (const riga of [...e.card, ...e.porte]) {
      expect(riga.fonti.length, riga.nome).toBeGreaterThan(0);
      for (const f of riga.fonti) expect(f.licenza, `${riga.nome}: ${f.nome}`).not.toBe('');
    }
  });

  it('le righe con dati Adzuna citano «The Adzuna API»', () => {
    const e = crea();
    expect(nomi(fonti(e, 'competenze'))).toEqual(['arXiv', 'GitHub', 'The Adzuna API']);
    expect(nomi(e.porte[0].fonti)).toContain('The Adzuna API');
    expect(nomi(fonti(e, 'business'))).not.toContain('The Adzuna API');
  });

  it('una porta eredita le fonti della card a cui porta', () => {
    const e = crea();
    expect(e.porte[0].fonti).toEqual(fonti(e, 'competenze'));
    expect(e.porte[1].fonti).toEqual(fonti(e, 'business'));
  });

  it('una porta senza dati non ha fonti', () => {
    expect(crea({ status: d.status, radar: d.radar }).porte[1].fonti).toEqual([]);
  });

  it('fonti e licenze si leggono dai dati quando ci sono', () => {
    const conLicenza: Dataset = { ...d, owid: { ...d.owid!, serie: { ...d.owid!.serie, uso_genai: { ...d.owid!.serie.uso_genai, licenza: 'CC BY 4.0' } } } };
    expect(fonti(crea(conLicenza), 'persone')).toEqual([{ nome: 'Microsoft (2026)', url: 'https://ourworldindata.org/grapher/estimated-share-people-generative-ai', licenza: 'CC BY 4.0' }]);
    expect(fonti(crea(), 'modelli')).toEqual([{ nome: 'Epoch AI', url: 'https://epoch.ai/data/ai-models', licenza: 'CC BY 4.0' }]);
    expect(fonti(crea(), 'open')[0].url).toBe('https://huggingface.co/models?sort=trending');
    expect(fonti(crea(), 'business')[0]).toMatchObject({ nome: 'Eurostat', url: 'https://ec.europa.eu/eurostat/databrowser/view/isoc_eb_ai/default/table' });
    const g = fonti(crea(), 'geopoliticai')[0];
    expect(g.nome).toMatch(/^Epoch AI/);
    expect(g.licenza).toBe(d.geopoliticai!.licenza);
  });

  it('la fonte di Norme è quella della scadenza mostrata, e quella di Rapporti è il rapporto mostrato', () => {
    expect(fonti(crea(), 'norme')[0].url).toBe('https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai');
    expect(fonti(crea(), 'rapporti')[0]).toMatchObject({ nome: 'State of AI Report, Air Street Capital', url: 'https://www.stateof.ai' });
  });

  it('i nomi delle card e delle teste sono quelli della home', () => {
    const e = crea();
    expect(e.card.map((c) => [c.id, c.nome])).toEqual(expect.arrayContaining(TILES.map((t) => [t.id, t.label])));
    expect(e.porte.map((p) => [p.nome, p.etichetta])).toEqual(TESTE.map((t) => [t.eyebrow, t.label]));
  });
});

describe('le fonti che non hanno risposto al giro', () => {
  it('sono quelle in errore o non configurate, con il nome che hanno in pagina e l’ultimo successo; un avviso su una fonte aggiornata non conta', () => {
    expect(crea().fonti_mute).toEqual([
      { id: 'arxiv', nome: 'arXiv', ultimo_successo: '2026-10-08T08:00:00+00:00' },
      { id: 'adzuna', nome: 'Adzuna', ultimo_successo: null },
    ]);
  });
  it('quando rispondono tutte l’elenco è vuoto', () => {
    expect(crea({ ...d, status: { aggiornato: d.status!.aggiornato, fonti: { epoch: d.status!.fonti.epoch } } }).fonti_mute).toEqual([]);
  });
  it('un’edizione nuova nasce senza correzioni', () => {
    expect(crea().correzioni).toEqual([]);
  });
});
