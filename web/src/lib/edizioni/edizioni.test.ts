// Il modulo Edizioni dagli ingressi alle uscite: dati del FIXTURE ed edizione precedente in entrata, JSON e file del sito in uscita.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Dataset } from '../data/types';
import { parseHash } from '../router';
import { FIXTURE } from '../test/fixtures';
import { TESTE, TILES } from '../tiles/registry';
import { creaEdizione, deveCreare, filePubblici, type Destinazione, type Edizione } from '.';

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
    expect(perTe.destinazione).toEqual({ card: 'competenze', elemento: null });
    expect(italia.nome).toBe('Per la tua organizzazione');
    expect(testo(italia.titolo)).toBe("16% delle imprese italiane usa l'AI (UE: 20%)");
    expect(italia.destinazione).toEqual({ card: 'business', elemento: null });
  });

  it('contiene tutte le nove frasi di card, ciascuna con cifra, unità, frase e destinazione', () => {
    const e = crea();
    expect(e.card.map((c) => c.id)).toEqual(['competenze', 'modelli', 'open', 'notizie', 'business', 'geopoliticai', 'persone', 'norme', 'rapporti']);
    expect(card(e, 'business')).toMatchObject({ nome: 'Business', cifra: '16', unita: '%', frase: "Imprese italiane che usano l'AI nel 2025. UE: 20%.", destinazione: { card: 'business', elemento: null } });
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

  describe('com’era la settimana prima, salvato nel file fisso', () => {
    /** L'edizione precedente con una riga scritta a mano, per fissare i valori di prima. */
    const conRiga = (id: string, riga: Partial<Edizione['card'][number]>) => {
      const prima = crea();
      return { ...prima, card: prima.card.map((c) => (c.id === id ? { ...c, ...riga } : c)) };
    };

    it('la prima edizione non ha niente con cui confrontarsi, e una card uguale non dice nulla', () => {
      expect(crea().card.map((c) => c.era)).toEqual(crea().card.map(() => null));
      expect(dopo(settimanaDopo, crea()).card.map((c) => c.era)).toEqual(crea().card.map(() => null));
    });
    it('con la cifra diversa dà la cifra di prima, con la sua unità', () => {
      expect(card(dopo(settimanaDopo, conRiga('modelli', { cifra: '×9,9', unita: 'all’anno' })), 'modelli').era).toBe('Era ×9,9 all’anno.');
      expect(card(dopo(settimanaDopo, conRiga('business', { cifra: '12', unita: '%' })), 'business').era).toBe('Era 12%.');
    });
    it('con la stessa cifra e la frase diversa dà la frase di prima: è quella che è cambiata', () => {
      expect(card(dopo(settimanaDopo, conRiga('modelli', { frase: 'Un’altra frase.' })), 'modelli').era).toBe('La settimana scorsa: Un’altra frase.');
    });
    it('Open source dà anche la frase se è cambiato il tipo: 26 su 100 di un altro tipo non è lo stesso numero', () => {
      const altroTipo = conRiga('open', { cifra: '26', frase: 'Modelli di tendenza su Hugging Face di tipo «generazione di testo».' });
      expect(card(dopo(settimanaDopo, altroTipo), 'open').era).toBe('Era 26 su 100: Modelli di tendenza su Hugging Face di tipo «generazione di testo».');
      const stessoTipo = conRiga('open', { cifra: '26' });
      expect(card(dopo(settimanaDopo, stessoTipo), 'open').era).toBe('Era 26 su 100.');
    });
    it('Norme dà la frase: il numero di prima è un conto alla rovescia, non un confronto', () => {
      expect(card(dopo(settimanaDopo, conRiga('norme', { cifra: '12', frase: 'Alla scadenza di prima.' })), 'norme').era).toBe('La settimana scorsa: Alla scadenza di prima.');
    });
    it('Rapporti dà la frase: il mese di prima non è una misura', () => {
      expect(card(dopo(settimanaDopo, conRiga('rapporti', { cifra: 'Marzo', frase: 'Prossimo rapporto previsto: Un altro.' })), 'rapporti').era).toBe('La settimana scorsa: Prossimo rapporto previsto: Un altro.');
    });
    it('una card che la settimana prima non aveva dati non dice com’era', () => {
      const senza = dopo(settimanaDopo, conRiga('modelli', { cifra: null, unita: null, frase: null }));
      expect(card(senza, 'modelli').cambiata).toBe(true);
      expect(card(senza, 'modelli').era).toBeNull();
    });
  });
});

describe('le notizie scelte', () => {
  const voce = (titolo: string, data: string, fonte: string, tema?: string) => ({ titolo, link: `https://esempio.org/${encodeURIComponent(titolo)}`, data, fonte, tema });
  const conNotizie = (notizie: ReturnType<typeof voce>[]): Dataset => ({ ...d, news: { ...d.news!, notizie } });
  const titoli = (e: Edizione, tema: string) => e.notizie.temi.find((t) => t.tema === tema)?.voci.map((v) => v.titolo);

  it('si parte dalla finestra di 7 giorni fino all’ultimo aggiornamento: totale, periodo e fonti distinte', () => {
    const { notizie } = crea();
    expect(notizie.totale).toBe(2); // la terza del FIXTURE è del 20 settembre
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
    expect(e.notizie.totale).toBe(4); // il conteggio resta quello di tutte le notizie della settimana
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
    expect(notizie).toMatchObject({ totale: 0, fonti: 0, temi: [] });
  });
});

describe('fonte e licenza su ogni riga', () => {
  const fonti = (e: Edizione, id: string) => card(e, id).fonti;
  const nomi = (xs: { nome: string }[]) => xs.map((f) => f.nome);

  it('ogni card e ogni porta con dati ha almeno una fonte, e ogni fonte ha una licenza; Notizie no, perché ogni voce ha accanto la sua', () => {
    const e = crea();
    expect(fonti(e, 'notizie')).toEqual([]);
    for (const riga of [...e.card.filter((c) => c.id !== 'notizie'), ...e.porte]) {
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

  it('una riga di GeopoliticAI mostra le fonti del dato che riporta: la card la capacità, la porta i modelli di grande scala', () => {
    const g = d.geopoliticai!;
    expect(fonti(crea(), 'geopoliticai')).toEqual([{ nome: 'Epoch AI, Epoch Capabilities Index', url: g.url_eci, licenza: g.licenza }]);
    const porta = crea({ status: d.status, geopoliticai: g }).porte[1];
    expect(testo(porta.titolo)).toMatch(/modelli di grande scala/);
    expect(porta.fonti).toEqual([{ nome: 'Epoch AI, Data on AI models', url: g.url_modelli, licenza: g.licenza }]);
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

describe('le fonti senza dati aggiornati a questo giro', () => {
  it('sono quelle in errore o non configurate, con il nome che hanno in pagina e l’ultimo successo; un avviso su una fonte aggiornata non conta', () => {
    expect(crea().fonti_non_aggiornate).toEqual([
      { id: 'arxiv', nome: 'arXiv', ultimo_successo: '2026-10-08T08:00:00+00:00' },
      { id: 'adzuna', nome: 'Adzuna', ultimo_successo: null },
    ]);
  });
  it('quando sono tutte aggiornate l’elenco è vuoto', () => {
    expect(crea({ ...d, status: { aggiornato: d.status!.aggiornato, fonti: { epoch: d.status!.fonti.epoch } } }).fonti_non_aggiornate).toEqual([]);
  });
  it('un’edizione nuova nasce senza correzioni', () => {
    expect(crea().correzioni).toEqual([]);
  });
});

describe('la pagina di un’edizione', () => {
  const BASE = 'https://altro-utente.github.io/altro-radar/';
  const FOGLIO = 'assets/index-abc123.css';
  const file = (...ed: Edizione[]) => filePubblici(ed, { indirizzoBase: BASE, foglio: FOGLIO });
  const html = (e: Edizione) => file(e)[`edizioni/${e.settimana}/index.html`];
  const pagina = (e: Edizione) => new DOMParser().parseFromString(html(e), 'text/html');
  const titoli = (doc: Document) => [...doc.querySelectorAll('h2')].map((h) => h.textContent);
  const link = (doc: ParentNode, nome: string | RegExp) => [...doc.querySelectorAll('a')].filter((a) => (typeof nome === 'string' ? a.textContent === nome : nome.test(a.textContent ?? '')));
  /** La sezione che comincia con questo titolo. */
  const sezione = (doc: Document, titolo: string) => [...doc.querySelectorAll('section')].find((s) => s.querySelector('h2')?.textContent === titolo);
  const settimanaDopo: Dataset = { ...d, status: { ...d.status!, aggiornato: '2026-10-22T08:00:00+00:00' } };

  it('sta al suo indirizzo, senza JavaScript', () => {
    expect(Object.keys(file(crea()))).toContain('edizioni/2026-10-12/index.html');
    const doc = pagina(crea());
    expect(doc.querySelector('script')).toBeNull();
    expect(html(crea())).not.toMatch(/\son\w+=/);
    expect(doc.documentElement.lang).toBe('it');
  });

  it('ha il titolo con la data, la descrizione con le due porte, Per te per prima, e il canonical assoluto', () => {
    const doc = pagina(crea());
    expect(doc.title).toBe('AI Radar, settimana del 12 ott 2026');
    expect(doc.querySelector('meta[name="description"]')?.getAttribute('content')).toBe("MCP entra tra le competenze da imparare ora; RAG esce. 16% delle imprese italiane usa l'AI (UE: 20%).");
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${BASE}edizioni/2026-10-12/`);
    expect(html(crea())).not.toContain('simones99');
  });

  describe('l’anteprima di condivisione, nell’HTML grezzo', () => {
    const tag = (doc: Document, nome: string) => doc.querySelector(`meta[property="${nome}"], meta[name="${nome}"]`)?.getAttribute('content');

    it('ha tutti i tag, con gli indirizzi assoluti che seguono l’indirizzo base', () => {
      const doc = pagina(crea());
      expect(tag(doc, 'og:title')).toBe('AI Radar, settimana del 12 ott 2026');
      expect(tag(doc, 'og:url')).toBe(`${BASE}edizioni/2026-10-12/`);
      expect(tag(doc, 'og:image')).toBe(`${BASE}edizioni/2026-10-12/anteprima.png`);
      expect(tag(doc, 'og:type')).toBe('article');
      expect(tag(doc, 'og:locale')).toBe('it_IT');
      expect(tag(doc, 'og:site_name')).toBe('AI Radar');
      expect(tag(doc, 'twitter:card')).toBe('summary_large_image');
    });

    it('la descrizione ha le due porte, Per te per prima', () => {
      expect(tag(pagina(crea()), 'og:description')).toBe("MCP entra tra le competenze da imparare ora; RAG esce. 16% delle imprese italiane usa l'AI (UE: 20%).");
    });

    it('il testo alternativo dice cosa mostra l’immagine: data e due porte', () => {
      expect(tag(pagina(crea()), 'og:image:alt')).toBe("AI Radar, settimana del 12 ott 2026. Per te: MCP entra tra le competenze da imparare ora; RAG esce. Per la tua organizzazione: 16% delle imprese italiane usa l'AI (UE: 20%).");
    });

    it('una porta senza dati, nell’immagine, dice «Dati non disponibili»: anche il testo alternativo', () => {
      const doc = pagina(crea({ status: d.status, radar: d.radar }));
      expect(tag(doc, 'og:image:alt')).toContain('Per la tua organizzazione: Dati non disponibili.');
      expect(tag(doc, 'og:description')).toBe('MCP entra tra le competenze da imparare ora; RAG esce.');
    });

    it('un titolo con le virgolette non esce dall’attributo', () => {
      const e = crea();
      const doc = pagina({ ...e, porte: [{ ...e.porte[0], titolo: [{ t: 'A "b" <script>' }] }, e.porte[1]] });
      expect(tag(doc, 'og:description')).toContain('A "b" <script>');
      expect(tag(doc, 'og:image:alt')).toContain('A "b" <script>');
      expect(doc.querySelector('script')).toBeNull();
    });
  });

  it('il titolo elide l’articolo davanti a 1, 8 e 11', () => {
    expect(pagina({ ...crea(), settimana: '2027-02-08' }).title).toBe('AI Radar, settimana dell’8 feb 2027');
  });

  it('una porta senza dati non entra nella descrizione', () => {
    const doc = pagina(crea({ status: d.status, radar: d.radar }));
    expect(doc.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('MCP entra tra le competenze da imparare ora; RAG esce.');
  });

  it('usa il foglio di stile del sito, con un indirizzo relativo, e ha la testata con il ritorno alla home', () => {
    const doc = pagina(crea());
    expect(doc.querySelector('link[rel="stylesheet"]')?.getAttribute('href')).toBe('../../assets/index-abc123.css');
    expect(doc.querySelector('header')?.textContent).toContain('AI Radar');
    expect(link(doc, 'AI Radar')[0].getAttribute('href')).toBe('../../');
    expect(link(doc, 'Edizioni')[0].getAttribute('href')).toBe('../');
  });

  it('dice che il sito mostra i dati di oggi e quando sono stati raccolti quelli dell’edizione', () => {
    const t = pagina(crea()).body.textContent;
    expect(t).toMatch(/il sito mostra i dati di oggi, quindi può dire altro/i);
    expect(t).toContain('15 ott 2026');
  });

  it('parla a chi legge: niente termini interni del progetto', () => {
    const tutte = crea({ ...d, status: { aggiornato: d.status!.aggiornato, fonti: {} } });
    for (const doc of [pagina(crea()), pagina(tutte)]) expect(doc.body.textContent).not.toMatch(/a questo giro|le card del sito/i);
    const archivio = new DOMParser().parseFromString(file(crea())['edizioni/index.html'], 'text/html');
    expect(archivio.querySelector('meta[name="description"]')?.getAttribute('content')).not.toMatch(/porte/);
  });

  it('mostra le due porte, Per te per prima, con la meta, la fonte e il link alla card', () => {
    const doc = pagina(crea());
    const porte = [...doc.querySelectorAll('article')];
    expect(porte.map((p) => p.querySelector('h2')?.textContent)).toEqual(['Per te Su cosa formarti', "Per la tua organizzazione L'AI in Italia"]);
    const a = porte[0].querySelector('a[href^="../../#"]');
    expect(a?.textContent).toBe('MCP entra tra le competenze da imparare ora; RAG esce');
    expect(a?.getAttribute('href')).toBe('../../#competenze');
    expect(a?.querySelector('em')?.textContent).toBe('MCP');
    expect(porte[0].textContent).toContain('Radar delle competenze · dati al 15 ott 2026');
    expect(porte[0].textContent).toContain('The Adzuna API');
  });

  it('i link alle card nascono dalla destinazione salvata, compresi elemento, parametri e vecchi id del router', () => {
    const base = crea();
    const conDest = (destinazione: Destinazione) => ({ ...base, porte: [{ ...base.porte[0], destinazione }, base.porte[1]] });
    const href = (e: Edizione) => pagina(e).querySelector('article a')?.getAttribute('href') as string;
    expect(href(conDest({ card: 'norme', elemento: '2026-12-02' }))).toBe('../../#norme/2026-12-02');
    expect(href(conDest({ card: 'business', elemento: null, params: { settore: 'ict', altro: 'a b' } }))).toBe('../../#business?settore=ict&altro=a%20b');
    // «politica» è il vecchio id di Norme: il link salvato resta valido perché il router lo riconosce
    const vecchio = href(conDest({ card: 'politica', elemento: null }));
    expect(vecchio).toBe('../../#politica');
    expect(parseHash(vecchio.slice('../../'.length))?.tema).toBe('norme');
  });

  describe('la prima edizione', () => {
    it('mostra tutte le frasi con il titolo «La situazione», e il conteggio delle notizie apre la loro sezione', () => {
      const doc = pagina(crea());
      expect(titoli(doc)).toContain('La situazione');
      expect(titoli(doc)).not.toContain('Cambiato dalla settimana scorsa');
      const righe = sezione(doc, 'La situazione')!.textContent;
      for (const c of crea().card.filter((x) => x.id !== 'notizie')) expect(righe).toContain(c.frase);
      expect(sezione(doc, 'Notizie')!.textContent).toMatch(/2\s+Notizie nei 7 giorni fino al 15 ott 2026, da 2 fonti\./);
    });
    it('non dice «Nessun cambio» accanto alle porte', () => {
      expect(pagina(crea()).body.textContent).not.toContain('Nessun cambio qui');
    });
  });

  describe('una settimana dopo', () => {
    const prima = crea();
    const conModelli = { ...prima, card: prima.card.map((c) => (c.id === 'modelli' ? { ...c, frase: 'Altra.' } : c)) };

    it('mostra solo le frasi cambiate, sotto «Cambiato dalla settimana scorsa»', () => {
      const doc = pagina(crea(settimanaDopo, conModelli));
      const s = sezione(doc, 'Cambiato dalla settimana scorsa')!;
      expect(s.textContent).toContain('Quanto cresce il calcolo');
      expect(s.textContent).not.toContain("Imprese italiane che usano l'AI");
      expect(titoli(doc)).not.toContain('La situazione');
    });
    it('una riga cambiata dice com’era', () => {
      const doc = pagina(crea(settimanaDopo, { ...prima, card: prima.card.map((c) => (c.id === 'modelli' ? { ...c, cifra: '×9,9' } : c)) }));
      const riga = [...sezione(doc, 'Cambiato dalla settimana scorsa')!.querySelectorAll('li')].find((li) => li.textContent?.includes('Modelli e ricerca'))!;
      expect([...riga.querySelectorAll('p')].map((p) => p.textContent)).toContain("Era ×9,9 all'anno.");
    });
    it('dice con quale settimana si confronta, con il link a quell’edizione', () => {
      const s = sezione(pagina(crea(settimanaDopo, conModelli)), 'Cambiato dalla settimana scorsa')!;
      expect(s.textContent).toContain('Rispetto alla settimana del 12 ott 2026.');
      expect(link(s, 'settimana del 12 ott 2026')[0].getAttribute('href')).toBe('../../edizioni/2026-10-12/');
    });
    it('la prima edizione non si confronta con nessuna', () => {
      expect(pagina(crea()).body.textContent).not.toContain('Rispetto alla settimana');
    });
    it('in fondo porta all’edizione prima e a quella dopo, quando ci sono', () => {
      const seconda = crea(settimanaDopo, prima);
      const terza = crea({ ...d, status: { ...d.status!, aggiornato: '2026-10-29T08:00:00+00:00' } }, seconda);
      const tutte = file(prima, terza, seconda);
      const voci = (settimana: string) => [...new DOMParser().parseFromString(tutte[`edizioni/${settimana}/index.html`], 'text/html').querySelectorAll('nav[aria-label="Altre edizioni"] a')].map((a) => [a.textContent, a.getAttribute('href'), a.getAttribute('rel')]);
      expect(voci('2026-10-19')).toEqual([
        ['Edizione precedente: settimana del 12 ott 2026', '../2026-10-12/', 'prev'],
        ['Edizione successiva: settimana del 26 ott 2026', '../2026-10-26/', 'next'],
      ]);
      expect(voci('2026-10-12')).toEqual([['Edizione successiva: settimana del 19 ott 2026', '../2026-10-19/', 'next']]);
      expect(voci('2026-10-26')).toEqual([['Edizione precedente: settimana del 19 ott 2026', '../2026-10-19/', 'prev']]);
    });
    it('un’edizione sola non ha quel blocco', () => {
      expect(pagina(crea()).querySelector('nav[aria-label="Altre edizioni"]')).toBeNull();
    });
    it('nomina le card invariate in una riga, ciascuna con il suo link, e Notizie non è tra loro', () => {
      const doc = pagina(crea(settimanaDopo, conModelli));
      const riga = [...doc.querySelectorAll('p')].find((p) => p.textContent?.startsWith('Invariate'))!;
      expect(riga.textContent).toBe('Invariate: Competenze, Open source, Business, GeopoliticAI, Persone e lavoro, Norme, Rapporti.');
      expect(riga.querySelector('a')?.getAttribute('href')).toBe('../../#competenze');
    });
    it('una settimana senza novità lo dice in testa, con il titolo giusto e senza ripeterlo sotto', () => {
      const conNotizia = { ...settimanaDopo, news: { ...d.news!, notizie: [{ titolo: 'Una notizia di questa settimana', link: 'https://esempio.org/a', data: '2026-10-20', fonte: 'Esempio', tema: 'ricerca' }] } };
      const doc = pagina(crea(conNotizia, prima));
      const riga = [...doc.querySelectorAll('p')].find((p) => p.textContent?.startsWith('Settimana senza novità'))!;
      expect(riga.textContent).toBe('Settimana senza novità: le frasi sono quelle della settimana scorsa. Qui sotto le notizie.');
      expect(riga.compareDocumentPosition(doc.querySelector('article')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(titoli(doc)).not.toContain('Cambiato dalla settimana scorsa');
      expect(titoli(doc)).toContain('Nulla è cambiato dalla settimana scorsa');
      expect(doc.body.textContent).not.toContain('Nessuna frase è cambiata');
      expect(sezione(doc, 'Nulla è cambiato dalla settimana scorsa')!.textContent).toContain('Rispetto alla settimana del 12 ott 2026.');
    });
    it('una settimana senza novità e senza notizie non promette notizie', () => {
      const t = pagina(crea({ ...settimanaDopo, news: { ...d.news!, notizie: [] } }, prima)).body.textContent;
      expect(t).toContain('Settimana senza novità: le frasi sono quelle della settimana scorsa.');
      expect(t).not.toContain('Qui sotto le notizie');
    });
    it('una settimana con una sola cosa cambiata non è senza novità', () => {
      expect(pagina(crea(settimanaDopo, conModelli)).body.textContent).not.toContain('Settimana senza novità');
      const conPorta = { ...prima, porte: [{ ...prima.porte[0], titolo: [{ t: 'Altra notizia' }] }, prima.porte[1]] };
      const doc = pagina(crea(settimanaDopo, conPorta));
      expect(doc.body.textContent).not.toContain('Settimana senza novità');
      // la porta è cambiata, le frasi no: il titolo non può dire che è cambiato nulla
      expect(titoli(doc)).toContain('Nessuna frase è cambiata dalla settimana scorsa');
      expect(titoli(doc)).not.toContain('Nulla è cambiato dalla settimana scorsa');
    });
    it('una porta ripetuta lo dice anche nella descrizione e nel testo alternativo dell’anteprima', () => {
      const doc = pagina(crea(settimanaDopo, prima));
      const tag = (nome: string) => doc.querySelector(`meta[property="${nome}"]`)?.getAttribute('content');
      expect(tag('og:description')).toBe("MCP entra tra le competenze da imparare ora; RAG esce (nessun cambio). 16% delle imprese italiane usa l'AI (UE: 20%) (nessun cambio).");
      expect(tag('og:image:alt')).toContain('Per te: MCP entra tra le competenze da imparare ora; RAG esce (nessun cambio).');
    });
    it('una porta ripetuta resta visibile e dice «Nessun cambio qui dalla settimana scorsa»', () => {
      const [perTe, italia] = [...pagina(crea(settimanaDopo, prima)).querySelectorAll('article')];
      expect(perTe.textContent).toContain('MCP entra tra le competenze');
      expect(perTe.textContent).toContain('Nessun cambio qui dalla settimana scorsa');
      expect(italia.textContent).toContain('Nessun cambio qui dalla settimana scorsa');
    });
  });

  describe('cifra e frase di una riga', () => {
    const riga = (doc: Document, nome: string) => [...doc.querySelectorAll('li')].find((li) => li.querySelector('h3')?.textContent === nome)!;
    const paragrafi = (el: Element) => [...el.querySelectorAll('p')].map((p) => p.textContent);

    it('stanno in due paragrafi, come i due livelli della home: senza foglio di stile non si incollano', () => {
      const doc = pagina(crea());
      expect(paragrafi(riga(doc, 'Business')).slice(0, 2)).toEqual(['16%', "Imprese italiane che usano l'AI nel 2025. UE: 20%."]);
      expect(paragrafi(riga(doc, 'Modelli e ricerca')).slice(0, 2)).toEqual(["×4,8 all'anno", 'Quanto cresce il calcolo per addestrare i modelli più grandi, dal 2018.']);
    });
    it('Competenze ha già il numero nella frase, e non lo ripete: come nella home', () => {
      expect(TILES.filter((t) => t.senzaCifra).map((t) => t.id)).toEqual(['competenze']);
      const r = riga(pagina(crea()), 'Competenze');
      expect(paragrafi(r)[0]).toBe("2 competenze su 5 da imparare ora: crescono più dell'AI e hanno almeno 3 annunci ogni 10mila.");
      expect(r.textContent).not.toContain('2 su 5');
    });
    it('il conteggio delle notizie sta in due paragrafi anche lui', () => {
      const ps = [...sezione(pagina(crea()), 'Notizie')!.querySelectorAll('p')].map((p) => p.textContent);
      expect(ps.slice(0, 2)).toEqual(['2', 'Notizie nei 7 giorni fino al 15 ott 2026, da 2 fonti.']);
    });
  });

  it('una porta senza dati dice «Dati non disponibili», senza link e senza fonte', () => {
    const doc = pagina(crea({ status: d.status, radar: d.radar }));
    const italia = doc.querySelectorAll('article')[1];
    expect(italia.textContent).toContain('Dati non disponibili');
    expect(italia.querySelector('a')).toBeNull();
    expect(italia.textContent).not.toContain('Nessun cambio');
  });

  it('una card senza dati sta in una riga a parte', () => {
    const doc = pagina(crea({ ...d, epoch: undefined }));
    expect([...doc.querySelectorAll('p')].find((p) => p.textContent?.startsWith('Dati non'))?.textContent).toBe('Dati non disponibili: Modelli e ricerca.');
  });

  it('ogni riga ha fonte, licenza e link alla card', () => {
    const doc = pagina(crea());
    const righe = [...sezione(doc, 'La situazione')!.querySelectorAll('li')];
    expect(righe).toHaveLength(8);
    for (const r of righe) {
      expect(r.textContent).toMatch(/Font[ei]: .+\(.+\)/);
      expect(r.querySelector('a[href^="../../#"]')).not.toBeNull();
    }
    const competenze = righe[0];
    expect(competenze.textContent).toContain("The Adzuna API (termini d'uso di Adzuna)");
    expect(competenze.querySelector('a[href^="../../#"]')?.textContent).toBe('Competenze');
  });

  describe('la sezione delle notizie', () => {
    it('spiega la regola, porta alla card Notizie e dà titolo, fonte, data e link di ogni voce, sotto il nome del tema', () => {
      const s = sezione(pagina(crea()), 'Notizie')!;
      expect(s.textContent).toContain('non sono una classifica');
      expect(s.querySelector('a[href="../../#notizie"]')).not.toBeNull();
      expect([...s.querySelectorAll('h3')].map((h) => h.textContent)).toEqual(['Politica', 'Prodotti']);
      const a = [...s.querySelectorAll('a')].find((x) => x.getAttribute('href') === 'https://the-decoder.com/a')!;
      expect(a.textContent).toBe("Google says self-improving AI isn't anywhere close");
      expect(a.closest('li')?.textContent).toContain('The Decoder');
      expect(a.closest('li')?.textContent).toContain('14 ott 2026');
      expect(s.textContent).toMatch(/solo titolo, data e link/i);
    });
    it('una settimana senza notizie lo dice, senza temi', () => {
      const s = sezione(pagina(crea({ ...d, news: { ...d.news!, notizie: [] } })), 'Notizie')!;
      expect(s.textContent).toContain('Nessuna notizia nei 7 giorni fino al 15 ott 2026.');
      expect(s.textContent).not.toContain('0 Nessuna');
      expect(s.querySelector('h3')).toBeNull();
    });
    it('il conteggio è la frase salvata nel file fisso: una correzione a quella frase si vede', () => {
      const e = crea();
      const corretta = { ...e, card: e.card.map((c) => (c.id === 'notizie' ? { ...c, cifra: '3', frase: 'Notizie corrette a mano, da 3 fonti.' } : c)) };
      const t = sezione(pagina(corretta), 'Notizie')!.textContent;
      expect(t).toMatch(/3\s+Notizie corrette a mano, da 3 fonti\./);
      expect(t).not.toContain('nei 7 giorni');
    });
    it('senza il file delle notizie dice «Dati non disponibili»', () => {
      expect(sezione(pagina(crea({ ...d, news: undefined })), 'Notizie')!.textContent).toContain('Dati non disponibili');
    });
  });

  describe('neutralizzare i testi esterni', () => {
    const conVoce = (titolo: string, link: string, fonte = 'F<1>'): Edizione => {
      const e = crea();
      return { ...e, notizie: { ...e.notizie, temi: [{ tema: 'ricerca', nome: 'Ricerca', voci: [{ titolo, link, data: '2026-10-14', fonte }] }] } };
    };
    it('< e & nei titoli restano testo, in un titolo e in una fonte', () => {
      const e = conVoce('<img src=x onerror=alert(1)> A & B', 'https://esempio.org/?a=1&b=2');
      const doc = pagina(e);
      const a = sezione(doc, 'Notizie')!.querySelector('li a')!;
      expect(a.textContent).toBe('<img src=x onerror=alert(1)> A & B');
      expect(a.querySelector('img')).toBeNull();
      expect(a.getAttribute('href')).toBe('https://esempio.org/?a=1&b=2');
      expect(html(e)).toContain('&lt;img src=x');
      expect(html(e)).toContain('A &amp; B');
      expect(html(e)).toContain('F&lt;1&gt;');
    });
    it('le virgolette non escono da un attributo', () => {
      const a = sezione(pagina(conVoce('t', 'https://esempio.org/"><script>x</script>')), 'Notizie')!.querySelector('li a');
      expect(a?.getAttribute('href')).toBe('https://esempio.org/"><script>x</script>');
      expect(pagina(conVoce('t', 'https://esempio.org/"><script>x</script>')).querySelector('script')).toBeNull();
    });
    it.each(['javascript:alert(1)', 'JAVASCRIPT:alert(1)', ' javascript:alert(1)', 'data:text/html,x', 'vbscript:x', 'ftp://esempio.org/x', '/relativo', ''])('il link «%s» non diventa un link: la voce resta, come testo', (link) => {
      const s = sezione(pagina(conVoce('Un titolo', link)), 'Notizie')!;
      expect(s.querySelector('ul')?.textContent).toContain('Un titolo');
      expect(s.querySelector('li a')).toBeNull();
    });
    it('anche l’indirizzo di una fonte passa dallo stesso controllo', () => {
      const e = crea();
      const f = { ...e, card: e.card.map((c) => ({ ...c, fonti: [{ nome: 'Fonte', url: 'javascript:alert(1)', licenza: 'CC0' }] })) };
      expect(html(f)).not.toContain('javascript:');
    });
    it('le maiuscole di http e https sono ammesse', () => {
      expect(sezione(pagina(conVoce('t', 'HTTPS://esempio.org/x')), 'Notizie')!.querySelector('li a')).not.toBeNull();
    });
  });

  describe('le correzioni', () => {
    const corretta = (...correzioni: Edizione['correzioni']): Edizione => ({ ...crea(), correzioni });
    it('senza correzioni la pagina non ne parla', () => {
      expect(pagina(crea()).body.textContent).not.toContain('Corretta');
    });
    it('mostrano «Corretta il…» e il loro testo, neutralizzato', () => {
      const doc = pagina(corretta({ data: '2026-10-20', testo: 'Il dato <b>Eurostat</b> era sbagliato.' }, { data: '2026-11-08', testo: 'Seconda.' }));
      const t = doc.body.textContent;
      expect(t).toContain('Corretta il 20 ott 2026: Il dato <b>Eurostat</b> era sbagliato.');
      expect(t).toContain('Corretta l’8 nov 2026: Seconda.');
    });
    it('compaiono in testa, prima delle porte', () => {
      const doc = pagina(corretta({ data: '2026-10-20', testo: 'Testo.' }));
      const correzione = [...doc.querySelectorAll('p')].find((p) => p.textContent?.startsWith('Corretta'))!;
      expect(correzione.compareDocumentPosition(doc.querySelector('article')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
    it('una correzione senza una data valida ferma il sito con un messaggio chiaro', () => {
      expect(() => file(corretta({ data: 'ieri', testo: 'Testo.' }))).toThrow(/2026-10-12.*correzion.*data/i);
    });
  });

  it('una versione del file che il sito non conosce ferma il sito con un messaggio chiaro', () => {
    expect(() => file({ ...crea(), versione: 99 })).toThrow(/2026-10-12.*versione 99/);
  });

  it('dice quali fonti non hanno dati aggiornati, in errore o non configurate, con una frase vera per tutte e due, e l’ultimo dato che hanno dato', () => {
    const s = sezione(pagina(crea()), 'Senza dati aggiornati questa settimana')!;
    expect(s.textContent).toContain('arXiv');
    expect(s.textContent).toContain('8 ott 2026');
    expect(s.textContent).toContain('Adzuna');
    expect(pagina(crea()).body.textContent).not.toMatch(/hanno risposto/);
    const tutte = crea({ ...d, status: { aggiornato: d.status!.aggiornato, fonti: {} } });
    expect(pagina(tutte).body.textContent).toContain('Tutte le fonti hanno dati aggiornati questa settimana.');
    expect(pagina(tutte).body.textContent).not.toMatch(/hanno risposto/);
    expect(sezione(pagina(tutte), 'Senza dati aggiornati questa settimana')).toBeUndefined();
  });

  it('è la stessa con la stessa edizione: niente dipende dal momento della build', () => {
    const e = crea();
    const prima = html(e);
    vi.useFakeTimers({ now: new Date('2031-03-03T10:00:00') });
    expect(html(e)).toBe(prima);
  });
});

describe('l’archivio', () => {
  const BASE = 'https://altro-utente.github.io/altro-radar/';
  const opzioni = { indirizzoBase: BASE, foglio: 'assets/index-abc123.css' };
  const prima = creaEdizione(d, null) as Edizione;
  const seconda = creaEdizione({ ...d, status: { ...d.status!, aggiornato: '2026-10-22T08:00:00+00:00' } }, prima) as Edizione;
  const archivio = (...ed: Edizione[]) => new DOMParser().parseFromString(filePubblici(ed, opzioni)['edizioni/index.html'], 'text/html');

  it('senza edizioni non esistono né pagine né archivio', () => {
    expect(filePubblici([], opzioni)).toEqual({});
  });

  it('elenca tutte le edizioni, dalla più recente, qualunque sia l’ordine in cui arrivano, ciascuna con il suo link', () => {
    const doc = archivio(prima, seconda);
    const voci = [...doc.querySelectorAll('main li')];
    expect(voci.map((v) => v.querySelector('h2')?.textContent)).toEqual(['Settimana del 19 ott 2026', 'Settimana del 12 ott 2026']);
    expect(voci.map((v) => v.querySelector('a')?.getAttribute('href'))).toEqual(['2026-10-19/', '2026-10-12/']);
  });

  it('ogni voce ha la data e le due porte, Per te per prima', () => {
    const t = archivio(prima).querySelector('main li')!.textContent;
    expect(t).toMatch(/Per te[^]*MCP entra tra le competenze[^]*Per la tua organizzazione[^]*16% delle imprese italiane/);
  });

  it('una porta ripetuta dice che non è cambiata, e una nuova no', () => {
    const [nuova, ripetuta] = [...archivio(prima, seconda).querySelectorAll('main li')].reverse();
    expect(ripetuta.textContent).toContain('RAG esce (nessun cambio)');
    expect(nuova.textContent).not.toContain('nessun cambio');
  });

  it('una porta senza dati lo dice anche qui', () => {
    const conVuota = creaEdizione({ status: d.status, radar: d.radar }, null) as Edizione;
    expect(archivio(conVuota).querySelector('main li')!.textContent).toContain('Dati non disponibili');
  });

  it('non perde nessuna edizione', () => {
    const tante = Array.from({ length: 60 }, (_, i) => ({ ...prima, settimana: `20${10 + i}-01-04` }));
    expect(archivio(...tante).querySelectorAll('main li')).toHaveLength(60);
  });

  it('ha titolo, descrizione, canonical, testata e tema del sito, e nessun JavaScript', () => {
    const doc = archivio(prima);
    expect(doc.title).toBe('AI Radar, le edizioni');
    expect(doc.querySelector('h1')?.textContent).toBe('Edizioni');
    expect(doc.querySelector('meta[name="description"]')?.getAttribute('content')).toBeTruthy();
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${BASE}edizioni/`);
    expect(doc.querySelector('link[rel="stylesheet"]')?.getAttribute('href')).toBe('../assets/index-abc123.css');
    expect(doc.querySelector('script')).toBeNull();
    expect([...doc.querySelectorAll('header a')][0].getAttribute('href')).toBe('../');
  });

  it('ha i suoi tag di anteprima, con l’immagine fissa della home e gli indirizzi assoluti', () => {
    const doc = archivio(prima);
    const tag = (nome: string) => doc.querySelector(`meta[property="${nome}"], meta[name="${nome}"]`)?.getAttribute('content');
    expect(tag('og:title')).toBe('AI Radar, le edizioni');
    expect(tag('og:description')).toBe(doc.querySelector('meta[name="description"]')?.getAttribute('content'));
    expect(tag('og:url')).toBe(`${BASE}edizioni/`);
    expect(tag('og:image')).toBe(`${BASE}anteprima.png`);
    expect(tag('og:image:alt')).toMatch(/^Il marchio di AI Radar/);
    expect(tag('og:type')).toBe('website');
    expect(tag('og:locale')).toBe('it_IT');
    expect(tag('og:site_name')).toBe('AI Radar');
    expect(tag('twitter:card')).toBe('summary_large_image');
  });

  it('i testi esterni sono neutralizzati anche qui', () => {
    const e = { ...prima, porte: [{ ...prima.porte[0], titolo: [{ t: '<script>x</script>' }] }, prima.porte[1]] };
    expect(archivio(e).querySelector('script')).toBeNull();
  });
});

describe('l’indice per la home', () => {
  const opzioni = { indirizzoBase: 'https://esempio.org/ai-radar/', foglio: 'assets/index-abc123.css' };
  const prima = crea();
  const seconda = crea({ ...d, status: { ...d.status!, aggiornato: '2026-10-22T08:00:00+00:00' } }, prima);

  it('dice qual è l’ultima edizione, qualunque sia l’ordine in cui arrivano', () => {
    expect(JSON.parse(filePubblici([prima, seconda], opzioni)['data/edizioni.json'])).toEqual({ ultima: '2026-10-19' });
    expect(JSON.parse(filePubblici([seconda, prima], opzioni)['data/edizioni.json'])).toEqual({ ultima: '2026-10-19' });
  });

  it('senza edizioni non esiste', () => {
    expect(filePubblici([], opzioni)).not.toHaveProperty(['data/edizioni.json']);
  });
});

describe('decidere se un giro crea l’edizione', () => {
  it('il giro programmato sì, se il file non c’è', () => {
    expect(deveCreare({ evento: 'schedule', casella: false, esiste: false })).toBe(true);
  });
  it('l’avvio manuale solo con la casella accesa', () => {
    expect(deveCreare({ evento: 'workflow_dispatch', casella: true, esiste: false })).toBe(true);
    expect(deveCreare({ evento: 'workflow_dispatch', casella: false, esiste: false })).toBe(false);
  });
  it('il push mai, nemmeno con la casella', () => {
    expect(deveCreare({ evento: 'push', casella: true, esiste: false })).toBe(false);
    expect(deveCreare({ evento: 'push', casella: false, esiste: false })).toBe(false);
  });
  it('mai se il file esiste già', () => {
    expect(deveCreare({ evento: 'schedule', casella: false, esiste: true })).toBe(false);
    expect(deveCreare({ evento: 'workflow_dispatch', casella: true, esiste: true })).toBe(false);
  });
  it('un evento che non conosce: no', () => {
    expect(deveCreare({ evento: 'pull_request', casella: true, esiste: false })).toBe(false);
    expect(deveCreare({ evento: '', casella: true, esiste: false })).toBe(false);
  });
});
