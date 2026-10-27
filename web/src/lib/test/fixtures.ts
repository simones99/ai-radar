import type { Dataset, Quadrant } from '../data/types';

export const FIXTURE_TODAY = new Date(2026, 9, 15, 10);

const q = { 'impara-ora': 'Impara ora', prova: 'Da provare', consolida: 'Da consolidare', osserva: "Tieni d'occhio" } as const;
const ok = { stato: 'ok' as const, ultimo_successo: '2026-10-15T08:00:00+00:00' };

const MESI = ['2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];
const paper = (n0: number, g: number) => MESI.map((mese, i) => ({ mese, n: Math.round(n0 * g ** i), totale: 12000 }));
const repo = (n0: number, g: number) => MESI.map((mese, i) => ({ mese, n: Math.round(n0 * g ** i), base: Math.round(6000 * 1.15 ** i) }));
const lavoro = (rilevazioni: { data: string; media: number; it: number | null }[]) => {
  const last = rilevazioni[rilevazioni.length - 1];
  return { variazione: null, margine: null, peso: 0, data: last.data, ogni_10mila: { it: last.it ?? 0, us: last.media }, rilevazioni };
};
const pt = (slancio: number, domanda: number, pub: Quadrant, incerto = false, calcolato: Quadrant = pub) =>
  ({ slancio, domanda, calcolato, pubblicato: pub, incerto });

/** Valori veri da posizioni 0–1 sul grafico (l'inverso di nx e ny), per scrivere i test pensando alla posizione. */
export function fromNorm<T extends { slancio?: number | null; domanda?: number | null; slancio_prec?: number | null; domanda_prec?: number | null }>(r: T): T {
  const s = (x: number | null | undefined) => (x == null ? x : 2 ** (2 * x - 1) - 1);
  const d = (y: number | null | undefined) => (y == null ? y : 0.1 * 900 ** y);
  return { ...r, slancio: s(r.slancio), domanda: d(r.domanda), slancio_prec: s(r.slancio_prec), domanda_prec: d(r.domanda_prec) } as T;
}

export const FIXTURE: Dataset & Record<string, unknown> = {
  status: {
    aggiornato: '2026-10-15T08:00:00+00:00',
    fonti: {
      epoch: ok, arxiv: { stato: 'errore', ultimo_successo: '2026-10-08T08:00:00+00:00', ultimo_tentativo: '2026-10-15T08:00:00+00:00', messaggio: '500' },
      github: ok, huggingface: ok, eurostat: ok, eurostat_settori: ok, owid: ok,
      // riuscita con le posizioni dei siti dalla copia: lo stato è ok, con l'avviso
      geopoliticai: { ...ok, messaggio: 'pagina della mappa di Epoch non letta (HTTP 503): restano le posizioni salvate' }, ai_act: ok, rapporti: ok, catena: ok, feeds: ok, radar: ok,
      adzuna: { stato: 'non configurata', messaggio: 'ADZUNA_APP_ID/ADZUNA_APP_KEY non impostati' },
    },
  },
  radar: {
    versione: 2, generato: '2026-10-15', quadranti: q,
    soglie: { slancio: 0, domanda: 3, rapporto_max: 1.55 },
    ruoli: [{ id: 'sviluppo', nome: 'Sviluppo software' }, { id: 'prodotto', nome: 'Prodotto' }, { id: 'dati', nome: 'Dati e analisi' }, { id: 'compliance', nome: 'Legale e compliance' }],
    competenze: [
      { id: 'agenti', nome: 'Agenti AI', breve: 'Agenti AI', plurale: true, descrizione: 'Sistemi che pianificano.',
        slancio: 0.52, slancio_margine: [0.45, 0.6], domanda: 26.4, domanda_it: 37.1, quadrante: 'impara-ora', quadrante_calcolato: 'impara-ora',
        incerto: false, incerto_perche: null, slancio_prec: 0.38, domanda_prec: 26.4, quadrante_prec: 'impara-ora',
        segnali: { arxiv: { variazione: 0.3, margine: [0.2, 0.4], peso: 0.5, mensile: paper(1200, 1.07) }, github: { variazione: 0.8, margine: [0.6, 1], peso: 0.5, mensile: repo(650, 1.3) },
          lavoro: lavoro([{ data: '2026-10-12', media: 26.4, it: 37.1 }]) },
        per_iniziare: [{ titolo: 'Corso gratuito di Hugging Face sugli agenti', url: 'https://huggingface.co/learn/agents-course/en/unit0/introduction', tipo: 'corso', lingua: 'en' }],
        in_crescita: [] },
      { id: 'mcp', nome: 'Model Context Protocol (MCP)', breve: 'MCP', descrizione: 'Lo standard per collegare strumenti.', ruoli: ['sviluppo'],
        slancio: 0.15, slancio_margine: [0.05, 0.27], domanda: 3.4, domanda_it: 2.6, quadrante: 'impara-ora', quadrante_calcolato: 'impara-ora',
        incerto: false, incerto_perche: null, slancio_prec: -0.27, domanda_prec: 3.4, quadrante_prec: 'consolida',
        segnali: { arxiv: { variazione: -0.04, margine: [-0.3, 0.3], peso: 0.33, mensile: paper(20, 1.07) }, github: { variazione: 0.4, margine: [0.2, 0.6], peso: 0.67, mensile: repo(900, 1.25) },
          lavoro: lavoro([{ data: '2026-09-14', media: 3.1, it: 2.4 }, { data: '2026-10-12', media: 3.4, it: 2.6 }]) },
        per_iniziare: [
          { titolo: 'Documentazione ufficiale di MCP: introduzione', url: 'https://modelcontextprotocol.io/docs/getting-started/intro', tipo: 'documentazione', lingua: 'en' },
          { titolo: 'Corso in italiano di prova', url: 'https://example.org/corso-mcp', tipo: 'corso', lingua: 'it' },
        ],
        in_crescita: [{ nome: 'acme/mcp-kit', url: 'https://github.com/acme/mcp-kit', descrizione: 'Kit per server MCP.', stelle: 1200, creato: '2026-08-02' }] },
      { id: 'rag', nome: 'RAG e ricerca semantica', breve: 'RAG', descrizione: 'Recupero di informazioni.', ruoli: ['dati', 'sviluppo', 'prodotto'],
        slancio: -0.27, slancio_margine: [-0.35, -0.18], domanda: 8, domanda_it: 6.1, quadrante: 'consolida', quadrante_calcolato: 'consolida',
        incerto: false, incerto_perche: null, slancio_prec: 0.04, domanda_prec: 8, quadrante_prec: 'impara-ora',
        segnali: { arxiv: { variazione: -0.39, margine: [-0.5, -0.25], peso: 0.33, mensile: paper(300, 0.97) }, github: { variazione: 0.1, margine: [0, 0.2], peso: 0.67, mensile: repo(1400, 1.1) },
          lavoro: lavoro([{ data: '2026-10-12', media: 8, it: 6.1 }]) },
        per_iniziare: [], in_crescita: [] },
      { id: 'robotica', nome: 'AI fisica e robotica', breve: 'Robotica', descrizione: 'Robot.', ruoli: [],
        slancio: 0.82, slancio_margine: [0.3, 1.6], domanda: 0.17, domanda_it: 0.28, quadrante: 'prova', quadrante_calcolato: 'prova',
        incerto: true, incerto_perche: 'pochi paper (45 al mese)', slancio_prec: 0.27, domanda_prec: 0.17, quadrante_prec: 'prova',
        segnali: { arxiv: { variazione: 0.9, margine: [0.2, 2], peso: 0.55, mensile: paper(30, 1.05) }, github: { variazione: 1.1, margine: [0.4, 2.2], peso: 0.45, mensile: repo(20, 1.3) },
          lavoro: lavoro([{ data: '2026-10-12', media: 0.17, it: 0.28 }]) },
        per_iniziare: [], in_crescita: [] },
      { id: 'vector-db', nome: 'Database vettoriali', breve: 'DB vettoriali', plurale: true, descrizione: 'Indici.', ruoli: ['sviluppo', 'dati'],
        slancio: 0.05, slancio_margine: [-0.05, 0.16], domanda: 0.9, domanda_it: 0.4, quadrante: 'osserva', quadrante_calcolato: 'prova',
        incerto: false, incerto_perche: null, slancio_prec: 0, domanda_prec: 0.9, quadrante_prec: 'osserva',
        segnali: { arxiv: { variazione: -0.1, margine: [-0.3, 0.1], peso: 0.33, mensile: paper(15, 1) }, github: { variazione: 0.1, margine: [0, 0.2], peso: 0.67, mensile: repo(180, 1.08) },
          lavoro: lavoro([{ data: '2026-10-12', media: 0.9, it: 0.4 }]) },
        per_iniziare: [], in_crescita: [] },
    ],
    storico: [
      { mese: '2026-07', competenze: { agenti: pt(0.4, 26, 'impara-ora'), mcp: pt(-0.3, 3.1, 'consolida'), rag: pt(0.05, 8, 'impara-ora'), robotica: pt(0.3, 0.2, 'prova', true), 'vector-db': pt(-0.1, 0.9, 'osserva') } },
      { mese: '2026-08', competenze: { agenti: pt(0.38, 26.4, 'impara-ora'), mcp: pt(-0.27, 3.4, 'consolida'), rag: pt(0.04, 8, 'impara-ora'), robotica: pt(0.27, 0.17, 'prova', true), 'vector-db': pt(0, 0.9, 'osserva') } },
      { mese: '2026-09', competenze: { agenti: pt(0.52, 26.4, 'impara-ora'), mcp: pt(0.15, 3.4, 'impara-ora'), rag: pt(-0.27, 8, 'consolida'), robotica: pt(0.82, 0.17, 'prova', true), 'vector-db': pt(0.05, 0.9, 'osserva', false, 'prova') } },
    ],
  },
  owid: {
    aggiornato: '2026-10-15T08:00:00+00:00', errori: {},
    serie: {
      investimenti_privati: { titolo: 'Private investment in AI', unita: 'constant 2021 US$', citazione: 'Quid via AI Index Report (2026)', url: 'https://ourworldindata.org/grapher/private-investment-in-artificial-intelligence', aggiornato_owid: '2026-04-20', licenza: 'CC BY-ND 4.0', punti: [
        { entita: 'World', t: '2024', v: 130850813417 }, { entita: 'World', t: '2025', v: 290094148769 },
        { entita: 'United States', t: '2024', v: 109e9 }, { entita: 'United States', t: '2025', v: 230e9 },
        { entita: 'China', t: '2024', v: 9e9 }, { entita: 'China', t: '2025', v: 12e9 },
        { entita: 'Europe', t: '2024', v: 15e9 }, { entita: 'Europe', t: '2025', v: 24e9 },
      ] },
      investimenti_generativa: { titolo: '', unita: 'constant 2021 US$', citazione: 'Quid via AI Index Report (2026)', url: 'https://ourworldindata.org/grapher/global-investment-in-generative-ai', aggiornato_owid: null, punti: [
        { entita: 'World', t: '2023', v: 25.4e9 }, { entita: 'World', t: '2024', v: 43.7e9 }, { entita: 'World', t: '2025', v: 143.8e9 },
      ] },
      uso_genai: { titolo: '', unita: '%', citazione: 'Microsoft (2026)', url: 'https://ourworldindata.org/grapher/estimated-share-people-generative-ai', aggiornato_owid: null, punti: [
        { entita: 'World', t: '2025-12-31', v: 16.3 }, { entita: 'World', t: '2026-03-31', v: 17.8 },
        { entita: 'Italy', t: '2025-12-31', v: 27.8 }, { entita: 'Italy', t: '2026-03-31', v: 30.2 },
      ] },
      imprese_ai: { titolo: '', unita: '%', citazione: 'McKinsey & Company via AI Index', url: 'https://ourworldindata.org/grapher/share-companies-using-artificial-intelligence', aggiornato_owid: null, punti: [
        { entita: 'Europe', t: '2024', v: 73 }, { entita: 'Europe', t: '2025', v: 80 },
        { entita: 'North America', t: '2024', v: 82 }, { entita: 'North America', t: '2025', v: 90 },
      ] },
    },
  },
  ai_act: { scadenze: [
    { data: '2025-08-02', titolo: 'Modelli per uso generale', descrizione: 'Obblighi GPAI.', fonte: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj' },
    { data: '2026-12-02', titolo: 'Fine della transizione per la marcatura', descrizione: 'Articolo 50(2).', fonte: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai' },
    { data: '2027-12-02', titolo: 'Sistemi ad alto rischio (allegato III)', descrizione: 'Selezione del personale.', fonte: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai' },
  ] },
  rapporti: { rapporti: [
    { nome: 'AI Index Report', editore: 'Stanford HAI', url: 'https://hai.stanford.edu/ai-index', cadenza: 'annuale', edizioni: [{ anno: 2026, data: '2026-04', url: 'https://hai.stanford.edu/ai-index' }], prossima_prevista: '2027-04' },
    { nome: 'State of AI Report', editore: 'Air Street Capital', url: 'https://www.stateof.ai', cadenza: 'annuale', edizioni: [{ anno: 2025, data: '2025-10', url: 'https://www.stateof.ai' }], prossima_prevista: '2026-10' },
  ] },
  news: {
    fonti: [{ nome: 'The Decoder', url: 'https://the-decoder.com/feed/', tema: 'prodotti' }, { nome: 'EU AI Act Newsletter', url: 'https://artificialintelligenceact.substack.com/feed', tema: 'politica' }],
    errori: {}, giorni: 45,
    notizie: [
      { titolo: "Google says self-improving AI isn't anywhere close", link: 'https://the-decoder.com/a', data: '2026-10-14', fonte: 'The Decoder', tema: 'prodotti' },
      { titolo: 'AI Act: le linee guida sulla trasparenza', link: 'https://artificialintelligenceact.eu/b', data: '2026-10-12', fonte: 'EU AI Act Newsletter', tema: 'politica' },
      { titolo: 'Una notizia vecchia', link: 'https://the-decoder.com/c', data: '2026-09-20', fonte: 'The Decoder', tema: 'prodotti' },
    ],
  },
  epoch: {
    fonte: 'Epoch AI, Data on AI Models (CC BY 4.0)', url: 'https://epoch.ai/data/ai-models',
    punti: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map((y, i) => ({ m: `Modello ${y}`, o: 'Lab', d: `${y}-06-01`, c: 1e22 * 4.8 ** i, f: true, a: 'USA', open: i % 2 === 0 })),
    per_anno: [2024, 2025].flatMap((anno) => [{ anno, area: 'USA', n: 60 }, { anno, area: 'Cina', n: 30 }, { anno, area: 'UE', n: 2 }, { anno, area: 'Regno Unito', n: 2 }]),
    pesi_aperti: [{ anno: 2024, aperti: 30, totale: 90 }, { anno: 2025, aperti: 40, totale: 100 }],
    recenti: [{ m: 'Gemini 4 Argon', o: 'Google DeepMind', d: '2026-09-30', a: 'USA', accesso: 'Limited access' }],
  },
  huggingface: {
    url: 'https://huggingface.co/models?sort=trending',
    top: [{ id: 'google/embeddinggemma-2', url: 'https://huggingface.co/google/embeddinggemma-2', tipo: 'feature-extraction', like: 2303, download: 135175, trending: 1070, creato: '2026-09-14' }],
    tipi_top100: { 'image-text-to-text': 37, 'text-generation': 15, 'text-to-image': 9, altro: 39 },
  },
  github: { repos: [{ repo: 'huggingface/transformers', url: 'https://github.com/huggingface/transformers', descrizione: 'Transformers', storico: [{ data: '2026-10-08', stelle: 167000 }, { data: '2026-10-15', stelle: 167707 }] }] },
  arxiv: { mesi: ['2026-08', '2026-09'], series: { _totale: { '2026-08': 21000, '2026-09': 22500 } } },
  eurostat: {
    indicatore: 'Imprese con almeno 10 addetti che usano almeno una tecnologia AI (% delle imprese)', url: 'https://ec.europa.eu/eurostat/databrowser/view/isoc_eb_ai/default/table',
    nomi: { EU27_2020: 'Unione europea (27)', IT: 'Italia', DK: 'Danimarca' },
    serie: { EU27_2020: { '2024': 13.48, '2025': 19.95 }, IT: { '2024': 8.2, '2025': 16.4 }, DK: { '2024': 27.58, '2025': 42.03 } },
  },
  // Valori veri di isoc_eb_ain2 (giugno 2026) per 4 settori su 11. Immobiliare, logistica, Italia: riservato (c), null.
  eurostat_settori: {
    fonte: 'Eurostat, isoc_eb_ain2', url: 'https://ec.europa.eu/eurostat/databrowser/view/isoc_eb_ain2/default/table',
    aggiornato_eurostat: '2026-06-15T11:00:00+0200', anno: '2025',
    settori: [
      { id: 'tutti', nome: 'Tutti', nace: 'C10-S951_X_K', nella_frase: 'delle imprese' },
      { id: 'manifattura', nome: 'Manifattura', nace: 'C', nella_frase: 'delle imprese manifatturiere' },
      { id: 'ict', nome: 'Informazione e comunicazione', nace: 'J', nella_frase: 'delle imprese di informazione e comunicazione' },
      { id: 'immobiliare', nome: 'Immobiliare', nace: 'L', nella_frase: 'delle imprese immobiliari' },
    ],
    nomi_scopi: {
      E_AI_PMS: 'Marketing e vendite', E_AI_PPP: 'Processi di produzione', E_AI_PBAM: 'Amministrazione e gestione', E_AI_PLOG: 'Logistica',
      E_AI_PITS: 'Sicurezza informatica', E_AI_PFIN: 'Contabilità e finanza', E_AI_PRDI: 'Ricerca, sviluppo e innovazione',
    },
    nomi_barriere: {
      E_AI_BCST: 'Costi troppo alti', E_AI_BLE: 'Mancano le competenze', E_AI_BINC: 'Incompatibile con i sistemi esistenti',
      E_AI_BDDT: 'Dati scarsi o di bassa qualità', E_AI_BCDP: 'Timori per privacy e protezione dei dati', E_AI_BLEG: 'Conseguenze legali poco chiare',
      E_AI_BEC: 'Questioni etiche', E_AI_BNU: "L'AI non serve all'impresa",
    },
    adozione: {
      tutti: { IT: { '2021': 6.17, '2023': 5.05, '2024': 8.2, '2025': 16.4 }, EU27_2020: { '2021': 7.65, '2023': 8.06, '2024': 13.48, '2025': 19.95 } },
      manifattura: { IT: { '2021': 6.63, '2023': 4.94, '2024': 8.03, '2025': 14.73 }, EU27_2020: { '2021': 6.93, '2023': 6.79, '2024': 10.57, '2025': 17.27 } },
      ict: { IT: { '2021': 16.19, '2023': 21.04, '2024': 34.6, '2025': 51.28 }, EU27_2020: { '2021': 25.37, '2023': 29.53, '2024': 48.72, '2025': 62.52 } },
      immobiliare: { IT: { '2021': 3.19, '2023': 2.73, '2024': 6.2, '2025': 13.96 }, EU27_2020: { '2021': 7.11, '2023': 8.5, '2024': 15.45, '2025': 24.76 } },
    },
    scopi: {
      tutti: { IT: { E_AI_PMS: 33.1, E_AI_PPP: 17.49, E_AI_PBAM: 25.7, E_AI_PLOG: 6.11, E_AI_PITS: 12.12, E_AI_PFIN: 10.19, E_AI_PRDI: 19.96 },
        EU27_2020: { E_AI_PMS: 34.7, E_AI_PPP: 20.76, E_AI_PBAM: 31.04, E_AI_PLOG: 6.08, E_AI_PITS: 19.77, E_AI_PFIN: 23.11, E_AI_PRDI: 19.05 } },
      manifattura: { IT: { E_AI_PMS: 28.67, E_AI_PPP: 15.69, E_AI_PBAM: 21.14, E_AI_PLOG: 4.54, E_AI_PITS: 11.75, E_AI_PFIN: 8.47, E_AI_PRDI: 18.87 },
        EU27_2020: { E_AI_PMS: 30.41, E_AI_PPP: 20.22, E_AI_PBAM: 27.05, E_AI_PLOG: 6.64, E_AI_PITS: 20.62, E_AI_PFIN: 16.93, E_AI_PRDI: 17.54 } },
      ict: { IT: { E_AI_PMS: 36.09, E_AI_PPP: 38.58, E_AI_PBAM: 28.82, E_AI_PLOG: 2.47, E_AI_PITS: 22.46, E_AI_PFIN: 11.52, E_AI_PRDI: 50.69 },
        EU27_2020: { E_AI_PMS: 40.64, E_AI_PPP: 35.17, E_AI_PBAM: 38.29, E_AI_PLOG: 3.76, E_AI_PITS: 28.28, E_AI_PFIN: 22.47, E_AI_PRDI: 42.5 } },
      immobiliare: { IT: { E_AI_PMS: 46.75, E_AI_PPP: 4.36, E_AI_PBAM: 42.37, E_AI_PLOG: null, E_AI_PITS: 17.72, E_AI_PFIN: 35.26, E_AI_PRDI: 19.32 },
        EU27_2020: { E_AI_PMS: 36.36, E_AI_PPP: 17.46, E_AI_PBAM: 31.55, E_AI_PLOG: 2.67, E_AI_PITS: 18.88, E_AI_PFIN: 26.61, E_AI_PRDI: 9.95 } },
    },
    barriere: {
      tutti: { IT: { E_AI_BCST: 42.98, E_AI_BLE: 58.61, E_AI_BINC: 38.1, E_AI_BDDT: 45.16, E_AI_BCDP: 43.21, E_AI_BLEG: 47.26, E_AI_BEC: 25.69, E_AI_BNU: 14.76 },
        EU27_2020: { E_AI_BCST: 38.37, E_AI_BLE: 70.31, E_AI_BINC: 41.6, E_AI_BDDT: 43.51, E_AI_BCDP: 52.72, E_AI_BLEG: 53.61, E_AI_BEC: 24.64, E_AI_BNU: 17.79 } },
      manifattura: { IT: { E_AI_BCST: 43.24, E_AI_BLE: 62.46, E_AI_BINC: 37.39, E_AI_BDDT: 43.78, E_AI_BCDP: 38.01, E_AI_BLEG: 45.43, E_AI_BEC: 20.63, E_AI_BNU: 11.69 },
        EU27_2020: { E_AI_BCST: 39.8, E_AI_BLE: 71.05, E_AI_BINC: 44.74, E_AI_BDDT: 45.29, E_AI_BCDP: 49.01, E_AI_BLEG: 51.08, E_AI_BEC: 21.41, E_AI_BNU: 15.87 } },
      ict: { IT: { E_AI_BCST: 26.51, E_AI_BLE: 53.06, E_AI_BINC: 27.07, E_AI_BDDT: 34.56, E_AI_BCDP: 36.94, E_AI_BLEG: 40.14, E_AI_BEC: 21.02, E_AI_BNU: 29.35 },
        EU27_2020: { E_AI_BCST: 34.11, E_AI_BLE: 54.35, E_AI_BINC: 32.41, E_AI_BDDT: 39.43, E_AI_BCDP: 54.08, E_AI_BLEG: 53.04, E_AI_BEC: 24.2, E_AI_BNU: 16.42 } },
      immobiliare: { IT: { E_AI_BCST: 62.11, E_AI_BLE: 46.33, E_AI_BINC: 41.68, E_AI_BDDT: 47.69, E_AI_BCDP: 44.87, E_AI_BLEG: 48.84, E_AI_BEC: 14.54, E_AI_BNU: 23.29 },
        EU27_2020: { E_AI_BCST: 28.11, E_AI_BLE: 67.45, E_AI_BINC: 35.59, E_AI_BDDT: 33.49, E_AI_BCDP: 61.32, E_AI_BLEG: 57.54, E_AI_BEC: 18.31, E_AI_BNU: 12.42 } },
    },
    flag: { adozione: {}, scopi: { immobiliare: { IT: { E_AI_PLOG: 'c' } } }, barriere: {} },
  },
  geopoliticai: {
    fonte: 'Epoch AI', licenza: 'CC BY 4.0', url_modelli: 'https://epoch.ai/data/ai-models', url_eci: 'https://epoch.ai/eci',
    scaricato: '2026-10-15', anno_corrente: 2026,
    // dai CSV registrati di tests/fixtures (Epoch, 23 ottobre 2026), solo le zone e gli anni dei test
    zone: {
      usa: { nome: 'USA', tipo: 'area', aggettivo: 'statunitense', con_articolo: 'gli USA',
        calcolo: { '2023': { n: 47, nc: 21, max: 5.0000000001e+25, modello: 'Gemini 1.0 Ultra' }, '2024': { n: 81, nc: 52, max: 3.8e+25, modello: 'Llama 3.1-405B' }, '2025': { n: 66, nc: 31, max: 5.0000000000001e+26, modello: 'Grok 4' }, '2026': { n: 19, nc: 9, max: 9.4e+26, modello: 'GPT-6 Astra' } },
        eci: { '2023': { n: 23, max: 125.74, modello: 'GPT-4 (Mar 2023)' }, '2024': { n: 42, max: 141.72, modello: 'o1' }, '2025': { n: 46, max: 156.33, modello: 'GPT-5.2 Pro' }, '2026': { n: 50, max: 168.83, modello: 'Claude Opus 5.5' } },
        org_eci: ['Anthropic', 'Cerebras Systems', 'Databricks', 'Google'], org_ls: ['Adept', 'Adobe', 'Allen Institute for AI', 'Amazon'], contano_altrove: 0, paesi_mappa: ['USA'] },
      cina: { nome: 'Cina', tipo: 'area', aggettivo: 'cinese', con_articolo: 'la Cina',
        calcolo: { '2023': { n: 49, nc: 27, max: 3.89e+24, modello: 'SenseChat' }, '2024': { n: 59, nc: 34, max: 2.505e+25, modello: 'Doubao-pro' }, '2025': { n: 84, nc: 62, max: 1.512e+25, modello: 'Qwen3-Max' }, '2026': { n: 12, nc: 12, max: 2.0001e+25, modello: 'Kimi K3' } },
        eci: { '2023': { n: 10, max: 117.33, modello: 'Yi-34B' }, '2024': { n: 8, max: 132.3, modello: 'DeepSeek-V3' }, '2025': { n: 21, max: 146.09, modello: 'DeepSeek-V3.2' }, '2026': { n: 33, max: 157.86, modello: 'Kimi K3' } },
        org_eci: ['01.AI', 'Alibaba', 'Baichuan', 'DeepSeek'], org_ls: ['01.AI', '360 Security Technology', 'Alibaba', 'Ant Group'], contano_altrove: 0, paesi_mappa: ['CHN'] },
      ue: { nome: 'UE', tipo: 'area', aggettivo: 'europeo', con_articolo: "l'UE",
        calcolo: { '2023': { n: 5, nc: 2, max: 7.74e+23, modello: 'Mixtral 8x7B' }, '2024': { n: 8, nc: 3, max: 2.34e+24, modello: 'Mixtral 8x22B' }, '2025': { n: 5, nc: 3, max: 1.152e+24, modello: 'Mistral Small 3' } },
        eci: { '2023': { n: 2, max: 118.44, modello: 'Mixtral 8x7B' }, '2024': { n: 7, max: 128.57, modello: 'Mistral Large 2 (Nov 2024)' }, '2025': { n: 3, max: 134.02, modello: 'Mistral Medium 3' }, '2026': { n: 2, max: 150.03, modello: 'Mistral Large 4' } },
        org_eci: ['Mistral AI'], org_ls: ['Aleph Alpha', 'INSAIT', 'LightOn', 'Mistral AI'], contano_altrove: 7, paesi_mappa: ['AUT', 'BEL', 'BGR', 'CYP', 'CZE', 'DEU', 'DNK', 'ESP', 'EST', 'FIN', 'FRA', 'GRC', 'HRV', 'HUN', 'IRL', 'ITA', 'LTU', 'LUX', 'LVA', 'MLT', 'NLD', 'POL', 'PRT', 'ROU', 'SVK', 'SVN', 'SWE'] },
      uk: { nome: 'Regno Unito', tipo: 'area', aggettivo: 'britannico', con_articolo: 'il Regno Unito',
        calcolo: { '2023': { n: 1, nc: 0, max: null, modello: null }, '2024': { n: 3, nc: 1, max: 2.91e+23, modello: 'Stable LM 2 12B' } },
        eci: { '2023': { n: 1, max: 117.02, modello: 'Stable Beluga 2' } },
        org_eci: ['Stability AI'], org_ls: ['DeepMind', 'Stability AI'], contano_altrove: 0, paesi_mappa: ['GBR'] },
      altri: { nome: 'Altri', tipo: 'area', aggettivo: null, con_articolo: '«Altri»',
        calcolo: { '2023': { n: 18, nc: 7, max: 3.76e+24, modello: 'Falcon-180B' }, '2024': { n: 16, nc: 11, max: 1.05e+25, modello: 'Aramco Metabrain AI' }, '2025': { n: 10, nc: 8, max: 6.74e+24, modello: 'Apertus 70B' }, '2026': { n: 4, nc: 4, max: 3.85e+24, modello: 'EXAONE 4.5' } },
        eci: { '2023': { n: 3, max: 111.96, modello: 'Falcon-180B' }, '2024': { n: 2, max: 119.2, modello: 'Command R+' } },
        org_eci: ['Cohere', 'Technology Innovation Institute'], org_ls: ['AI inside', 'AI21 Labs', 'Cohere', 'ETH Zurich'], contano_altrove: 0, paesi_mappa: [] },
      francia: { nome: 'Francia', tipo: 'paese-ue', aggettivo: 'francese', con_articolo: 'la Francia',
        calcolo: { '2023': { n: 5, nc: 2, max: 7.74e+23, modello: 'Mixtral 8x7B' }, '2024': { n: 6, nc: 1, max: 2.34e+24, modello: 'Mixtral 8x22B' }, '2025': { n: 3, nc: 1, max: 1.152e+24, modello: 'Mistral Small 3' } },
        eci: { '2023': { n: 2, max: 118.44, modello: 'Mixtral 8x7B' }, '2024': { n: 7, max: 128.57, modello: 'Mistral Large 2 (Nov 2024)' }, '2025': { n: 3, max: 134.02, modello: 'Mistral Medium 3' }, '2026': { n: 2, max: 150.03, modello: 'Mistral Large 4' } },
        org_eci: ['Mistral AI'], org_ls: ['LightOn', 'Mistral AI'], contano_altrove: 5, paesi_mappa: ['FRA'] },
      germania: { nome: 'Germania', tipo: 'paese-ue', aggettivo: 'tedesco', con_articolo: 'la Germania',
        calcolo: { '2024': { n: 1, nc: 1, max: 4.43e+23, modello: 'Pharia-1-LLM-7B' }, '2025': { n: 1, nc: 1, max: 2.1444092e+23, modello: 'Teuken 7B' } },
        eci: {  },
        org_eci: [], org_ls: ['Aleph Alpha', 'OpenGPT-X'], contano_altrove: 0, paesi_mappa: ['DEU'] },
      italia: { nome: 'Italia', tipo: 'paese-ue', aggettivo: 'italiano', con_articolo: "l'Italia",
        calcolo: {  },
        eci: {  },
        org_eci: [], org_ls: [], contano_altrove: 0, paesi_mappa: ['ITA'] },
    },
    senza_paese: { large: ['Poro 34B'], eci: ['Qwen2.5-Coder-14B', 'PaLM 2-L', 'internlm-20b'] },
    altri_paesi: { 'South Korea': 22, Canada: 7, 'United Arab Emirates': 7 },
    // dal CSV registrato (Epoch, 23 ottobre 2026), solo alcuni modelli; i record sono quelli calcolati su tutto il file
    punti_eci: [
      { m: 'Claude Opus 5', d: '2026-07-24', v: 163.94, lo: 161.12, hi: 168.24, r: true },
      { m: 'Kimi K3', d: '2026-07-16', v: 157.86, lo: 155.11, hi: 160.63, r: false },
      { m: 'Claude Fable 5.1', d: '2026-09-01', v: 166.49, lo: 163.47, hi: 171.35, r: true },
      { m: 'GPT-6 Astra', d: '2026-09-03', v: 168.81, lo: 165.45, hi: 174.51, r: true },
      { m: 'Claude Opus 5.5', d: '2026-09-22', v: 168.83, lo: 165.25, hi: 173.95, r: true },
      { m: 'Gemini 4 Argon', d: '2026-09-30', v: 166.45, lo: 163.23, hi: 171.52, r: false },
      { m: 'Mistral Large 4', d: '2026-10-06', v: 150.03, lo: 146.94, hi: 152.74, r: false },
    ],
    eci_paesi: { anno: 2025, valori: { USA: { max: 156.33, modello: 'GPT-5.2 Pro' }, CHN: { max: 146.09, modello: 'DeepSeek-V3.2' }, FRA: { max: 134.02, modello: 'Mistral Medium 3' } } },
    // dal CSV e dalla pagina della mappa registrati (Epoch, 26 ottobre 2026), solo alcuni Paesi e siti; per i test Waltham
    // Cross ha la posizione dall'indirizzo, e DayOne Nusajaya non ce l'ha
    data_center: {
      aggiornato: '2026-10-15',
      quote: { USA: 86.49, MYS: 8.69, CHN: 2.17, GBR: 0.84, FIN: 0.33, PRT: 0.22, ISL: 0.04 },
      siti: [
        { nome: 'Colossus 2', proprietario: 'SpaceXAI', iso: 'USA', h100e: 1111673, mw: 946, stato: 'operativo', lat: 34.98929, lon: -90.03857, posizione: 'epoch' },
        { nome: 'Google Waltham Cross', proprietario: 'Google', iso: 'GBR', h100e: 123800, mw: 88, stato: 'operativo', lat: 51.69543, lon: -0.04904, posizione: 'indirizzo' },
        { nome: 'Nebius Mantsala', proprietario: 'Nebius', iso: 'FIN', h100e: 48528, mw: 75, stato: 'operativo', lat: 60.62935, lon: 25.26047, posizione: 'epoch' },
        { nome: 'EcoDataCenter 2', proprietario: 'Mistral AI', iso: 'SWE', h100e: 0, mw: 0, stato: 'in costruzione', lat: 60.52633, lon: 15.41698, posizione: 'epoch' },
        { nome: 'DayOne Nusajaya', proprietario: null, iso: 'MYS', h100e: 160000, mw: 170, stato: 'operativo', lat: null, lon: null, posizione: null },
      ],
    },
  },
  // gli anelli dei file curati: quote arrotondate dalla ricerca sulle fonti della mappa, solo i Paesi dei test
  catena: {
    anelli: {
      materie: {
        materiali: {
          gallio: { nome: 'Gallio', misura: 'Quota della produzione primaria mondiale, stima del 2025', fonte: 'USGS', titolo: 'Mineral Commodity Summaries 2026',
            url: 'https://pubs.usgs.gov/periodicals/mcs2026/mcs2026.pdf', licenza: 'pubblico dominio',
            url_licenza: 'https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits', data: '2025',
            quote: { CHN: 99, RUS: 0.7, JPN: 0.3 }, europa: null },
          terre: { nome: 'Terre rare', misura: 'Quota della produzione mineraria mondiale, stima del 2025', fonte: 'USGS', titolo: 'Mineral Commodity Summaries 2026',
            url: 'https://pubs.usgs.gov/periodicals/mcs2026/mcs2026.pdf', licenza: 'pubblico dominio',
            url_licenza: 'https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits', data: '2025',
            quote: { CHN: 69.2, USA: 13.1, AUS: 7.4 }, europa: null },
          germanio: { nome: 'Germanio', misura: 'Quota della raffinazione mondiale, media 2016-2020', fonte: 'Commissione europea',
            titolo: 'Study on the critical raw materials for the EU 2023', url: 'https://op.europa.eu/en/publication-detail/-/publication/57318397-fdd4-11ed-a05c-01aa75ed71a1',
            licenza: 'CC BY 4.0', url_licenza: 'https://creativecommons.org/licenses/by/4.0/', data: '2016-2020',
            quote: { CHN: 83.1, RUS: 5, BEL: 4.5, DEU: 2.7 }, europa: null },
        },
      },
      progettazione: { misura: 'Quota del valore dei chip progettati, per sede dell’azienda', fonte: 'ETO', titolo: 'Advanced Semiconductor Supply Chain Dataset',
        url: 'https://eto.tech/dataset-docs/chipexplorer', licenza: 'CC BY-NC 4.0', url_licenza: 'https://creativecommons.org/licenses/by-nc/4.0/', data: '2022',
        quote: { USA: 51, KOR: 13, JPN: 9, TWN: 8, CHN: 6 }, europa: 10 },
      fabbricazione: { misura: 'Quota della capacità produttiva, per luogo dello stabilimento', fonte: 'ETO', titolo: 'Advanced Semiconductor Supply Chain Dataset',
        url: 'https://eto.tech/dataset-docs/chipexplorer', licenza: 'CC BY-NC 4.0', url_licenza: 'https://creativecommons.org/licenses/by-nc/4.0/', data: '2022',
        quote: { CHN: 24, TWN: 18, JPN: 17, KOR: 17, USA: 10 }, europa: 8 },
      macchinari: { misura: 'Quota del mercato delle macchine di litografia', fonte: 'ETO', titolo: 'Advanced Semiconductor Supply Chain Dataset',
        url: 'https://eto.tech/dataset-docs/chipexplorer', licenza: 'CC BY-NC 4.0', url_licenza: 'https://creativecommons.org/licenses/by-nc/4.0/', data: '2025',
        quote: { NLD: 81.5, JPN: 15, AUT: 1.6 }, europa: null,
        nota: 'Le macchine EUV, necessarie per i chip più avanzati, le fa solo ASML nei Paesi Bassi.' },
    },
    // gli esempi del Filo della catena: per i test bastano luoghi e frasi brevi, le fonti sono finte
    fili: {
      usa: { nome: 'Un modello americano', tappe: [
        { anello: 'materie', luogo: 'Gallio', iso: 'CHN', lat: 36.8, lon: 118.05, frase: 'Il gallio viene quasi tutto dalla Cina.', fonte: 'https://example.org/usa-1' },
        { anello: 'progettazione', luogo: 'NVIDIA, Santa Clara', iso: 'USA', lat: 37.37, lon: -121.96, frase: 'Progetta la GPU.', fonte: 'https://example.org/usa-2' },
        { anello: 'fabbricazione', luogo: 'TSMC, Tainan', iso: 'TWN', lat: 23.11, lon: 120.27, frase: 'Fabbrica il chip.', fonte: 'https://example.org/usa-3' },
        { anello: 'macchinari', luogo: 'ASML, Veldhoven', iso: 'NLD', lat: 51.42, lon: 5.4, frase: 'Fa le macchine EUV.', fonte: 'https://example.org/usa-4' },
        { anello: 'datacenter', luogo: 'OpenAI Stargate Abilene', iso: 'USA', lat: 32.5, lon: -99.79, frase: 'Il data center.', fonte: 'https://example.org/usa-5' },
        { anello: 'modelli', luogo: 'OpenAI, San Francisco', iso: 'USA', lat: 37.77, lon: -122.42, frase: 'Il modello.', fonte: 'https://example.org/usa-6' },
      ] },
      ue: { nome: 'Un modello europeo', tappe: [
        { anello: 'materie', luogo: 'Gallio', iso: 'CHN', lat: 36.8, lon: 118.05, frase: 'Anche per l’Europa il gallio viene dalla Cina.', fonte: 'https://example.org/ue-1' },
        { anello: 'progettazione', luogo: 'NVIDIA, Santa Clara', iso: 'USA', lat: 37.37, lon: -121.96, frase: 'Le GPU sono americane.', fonte: 'https://example.org/ue-2' },
        { anello: 'fabbricazione', luogo: 'TSMC, Tainan', iso: 'TWN', lat: 23.11, lon: 120.27, frase: 'Fabbricate a Taiwan.', fonte: 'https://example.org/ue-3' },
        { anello: 'macchinari', luogo: 'ASML, Veldhoven', iso: 'NLD', lat: 51.42, lon: 5.4, frase: 'Le macchine EUV sono olandesi.', fonte: 'https://example.org/ue-4' },
        { anello: 'datacenter', luogo: 'EcoDataCenter 2', iso: 'SWE', lat: 60.53, lon: 15.42, frase: 'Il data center di Mistral AI in Svezia.', fonte: 'https://example.org/ue-5' },
        { anello: 'modelli', luogo: 'Mistral AI, Parigi', iso: 'FRA', lat: 48.86, lon: 2.35, frase: 'Il modello.', fonte: 'https://example.org/ue-6' },
      ] },
      cina: { nome: 'Un modello cinese', tappe: [
        { anello: 'materie', luogo: 'Gallio', iso: 'CHN', lat: 36.8, lon: 118.05, frase: 'Il gallio è in casa.', fonte: 'https://example.org/cina-1' },
        { anello: 'progettazione', luogo: 'HiSilicon, Shenzhen', iso: 'CHN', lat: 22.54, lon: 114.06, frase: 'Progetta i chip Ascend.', fonte: 'https://example.org/cina-2' },
        { anello: 'fabbricazione', luogo: 'SMIC, Shanghai', iso: 'CHN', lat: 31.23, lon: 121.47, frase: 'Fabbrica senza EUV.', fonte: 'https://example.org/cina-3' },
        { anello: 'macchinari', luogo: 'ASML, Veldhoven', iso: 'NLD', lat: 51.42, lon: 5.4, frase: 'Solo macchine DUV.', fonte: 'https://example.org/cina-4' },
        { anello: 'datacenter', luogo: 'Huawei Horinger', iso: 'CHN', lat: 40.54, lon: 111.83, frase: 'Il data center.', fonte: 'https://example.org/cina-5' },
        { anello: 'modelli', luogo: 'Huawei, Shenzhen', iso: 'CHN', lat: 22.65, lon: 114.06, frase: 'Il modello.', fonte: 'https://example.org/cina-6' },
      ] },
    },
  },
};
