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
      github: ok, huggingface: ok, eurostat: ok, owid: ok, ai_act: ok, rapporti: ok, feeds: ok, radar: ok,
      adzuna: { stato: 'non configurata', messaggio: 'ADZUNA_APP_ID/ADZUNA_APP_KEY non impostati' },
      artificial_analysis: { stato: 'non configurata', messaggio: 'AA_API_KEY non impostata' },
    },
  },
  radar: {
    versione: 2, generato: '2026-10-15', quadranti: q,
    soglie: { slancio: 0, domanda: 3, rapporto_max: 1.55 },
    competenze: [
      { id: 'agenti', nome: 'Agenti AI', breve: 'Agenti AI', plurale: true, descrizione: 'Sistemi che pianificano.',
        slancio: 0.52, slancio_margine: [0.45, 0.6], domanda: 26.4, domanda_it: 37.1, quadrante: 'impara-ora', quadrante_calcolato: 'impara-ora',
        incerto: false, incerto_perche: null, slancio_prec: 0.38, domanda_prec: 26.4, quadrante_prec: 'impara-ora',
        segnali: { arxiv: { variazione: 0.3, margine: [0.2, 0.4], peso: 0.5, mensile: paper(1200, 1.07) }, github: { variazione: 0.8, margine: [0.6, 1], peso: 0.5, mensile: repo(650, 1.3) },
          lavoro: lavoro([{ data: '2026-10-12', media: 26.4, it: 37.1 }]) },
        per_iniziare: [{ titolo: 'Corso gratuito di Hugging Face sugli agenti', url: 'https://huggingface.co/learn/agents-course/en/unit0/introduction', tipo: 'corso', lingua: 'en' }],
        in_crescita: [] },
      { id: 'mcp', nome: 'Model Context Protocol (MCP)', breve: 'MCP', descrizione: 'Lo standard per collegare strumenti.',
        slancio: 0.15, slancio_margine: [0.05, 0.27], domanda: 3.4, domanda_it: 2.6, quadrante: 'impara-ora', quadrante_calcolato: 'impara-ora',
        incerto: false, incerto_perche: null, slancio_prec: -0.27, domanda_prec: 3.4, quadrante_prec: 'consolida',
        segnali: { arxiv: { variazione: -0.04, margine: [-0.3, 0.3], peso: 0.33, mensile: paper(20, 1.07) }, github: { variazione: 0.4, margine: [0.2, 0.6], peso: 0.67, mensile: repo(900, 1.25) },
          lavoro: lavoro([{ data: '2026-09-14', media: 3.1, it: 2.4 }, { data: '2026-10-12', media: 3.4, it: 2.6 }]) },
        per_iniziare: [
          { titolo: 'Documentazione ufficiale di MCP: introduzione', url: 'https://modelcontextprotocol.io/docs/getting-started/intro', tipo: 'documentazione', lingua: 'en' },
          { titolo: 'Corso in italiano di prova', url: 'https://example.org/corso-mcp', tipo: 'corso', lingua: 'it' },
        ],
        in_crescita: [{ nome: 'acme/mcp-kit', url: 'https://github.com/acme/mcp-kit', descrizione: 'Kit per server MCP.', stelle: 1200, creato: '2026-08-02' }] },
      { id: 'rag', nome: 'RAG e ricerca semantica', breve: 'RAG', descrizione: 'Recupero di informazioni.',
        slancio: -0.27, slancio_margine: [-0.35, -0.18], domanda: 8, domanda_it: 6.1, quadrante: 'consolida', quadrante_calcolato: 'consolida',
        incerto: false, incerto_perche: null, slancio_prec: 0.04, domanda_prec: 8, quadrante_prec: 'impara-ora',
        segnali: { arxiv: { variazione: -0.39, margine: [-0.5, -0.25], peso: 0.33, mensile: paper(300, 0.97) }, github: { variazione: 0.1, margine: [0, 0.2], peso: 0.67, mensile: repo(1400, 1.1) },
          lavoro: lavoro([{ data: '2026-10-12', media: 8, it: 6.1 }]) },
        per_iniziare: [], in_crescita: [] },
      { id: 'robotica', nome: 'AI fisica e robotica', breve: 'Robotica', descrizione: 'Robot.',
        slancio: 0.82, slancio_margine: [0.3, 1.6], domanda: 0.17, domanda_it: 0.28, quadrante: 'prova', quadrante_calcolato: 'prova',
        incerto: true, incerto_perche: 'pochi paper (45 al mese)', slancio_prec: 0.27, domanda_prec: 0.17, quadrante_prec: 'prova',
        segnali: { arxiv: { variazione: 0.9, margine: [0.2, 2], peso: 0.55, mensile: paper(30, 1.05) }, github: { variazione: 1.1, margine: [0.4, 2.2], peso: 0.45, mensile: repo(20, 1.3) },
          lavoro: lavoro([{ data: '2026-10-12', media: 0.17, it: 0.28 }]) },
        per_iniziare: [], in_crescita: [] },
      { id: 'vector-db', nome: 'Database vettoriali', breve: 'DB vettoriali', plurale: true, descrizione: 'Indici.',
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
};
