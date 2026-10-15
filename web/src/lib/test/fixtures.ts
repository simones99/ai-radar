import type { Dataset } from '../data/types';

export const FIXTURE_TODAY = new Date(2026, 9, 15, 10);

const q = { 'impara-ora': 'Impara ora', prova: 'Da provare', consolida: 'Da consolidare', osserva: "Tieni d'occhio" } as const;
const ok = { stato: 'ok' as const, ultimo_successo: '2026-10-15T08:00:00+00:00' };

export const FIXTURE: Dataset & Record<string, unknown> = {
  status: {
    aggiornato: '2026-10-15T08:00:00+00:00',
    fonti: {
      epoch: ok, arxiv: { stato: 'errore', ultimo_successo: '2026-10-08T08:00:00+00:00', ultimo_tentativo: '2026-10-15T08:00:00+00:00', messaggio: '500' },
      github: ok, huggingface: ok, eurostat: ok, owid: ok, ai_act: ok, rapporti: ok, feeds: ok, radar: ok,
      adzuna: { stato: 'non configurata', messaggio: 'ADZUNA_APP_ID/ADZUNA_APP_KEY non impostati' },
      artificial_analysis: { stato: 'non configurata', messaggio: 'AA_API_KEY non impostata' },
    },
  },
  radar: {
    generato: '2026-10-15', base_domanda: 'open-source', quadranti: q,
    competenze: [
      { id: 'agenti', nome: 'Agenti AI', breve: 'Agenti AI', descrizione: 'Sistemi che pianificano.', slancio: 0.8, domanda: 1, quadrante: 'impara-ora', slancio_prec: 0.73, domanda_prec: 1, quadrante_prec: 'impara-ora', github: { crescita: 0.7, ultimi3: 51344, precedenti3: 30073 } },
      { id: 'mcp', nome: 'Model Context Protocol (MCP)', breve: 'MCP', descrizione: 'Lo standard per collegare strumenti.', slancio: 0.6, domanda: 0.93, quadrante: 'impara-ora', slancio_prec: 0.27, domanda_prec: 0.93, quadrante_prec: 'consolida', github: { crescita: 0.43, ultimi3: 36474, precedenti3: 25412 } },
      { id: 'rag', nome: 'RAG e ricerca semantica', breve: 'RAG', descrizione: 'Recupero di informazioni.', slancio: 0.27, domanda: 0.87, quadrante: 'consolida', slancio_prec: 0.53, domanda_prec: 0.87, quadrante_prec: 'impara-ora', github: { crescita: 0.24, ultimi3: 17574, precedenti3: 14129 } },
      { id: 'robotica', nome: 'AI fisica e robotica', breve: 'Robotica', descrizione: 'Robot.', slancio: 0.93, domanda: 0, quadrante: 'prova', slancio_prec: 0.67, domanda_prec: 0, quadrante_prec: 'prova', github: { crescita: 1.1, ultimi3: 478, precedenti3: 224 } },
      { id: 'vector-db', nome: 'Database vettoriali', breve: 'DB vettoriali', descrizione: 'Indici.', slancio: 0, domanda: 0.33, quadrante: 'osserva', slancio_prec: 0, domanda_prec: 0.33, quadrante_prec: 'osserva', github: { crescita: -0.07, ultimi3: 1721, precedenti3: 1852 } },
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
};
