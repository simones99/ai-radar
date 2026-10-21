/** Contratti dei JSON in data/, scritti dalla pipeline Python. */

export type Quadrant = 'impara-ora' | 'prova' | 'consolida' | 'osserva';

export interface SourceStatus {
  stato: 'ok' | 'errore' | 'non configurata';
  ultimo_successo?: string;
  ultimo_tentativo?: string;
  messaggio?: string;
}
export interface Status { aggiornato: string; fonti: Record<string, SourceStatus> }

export interface Risorsa { titolo: string; url: string; tipo: 'documentazione' | 'corso' | 'guida' | 'repository'; lingua: string }
export interface RepoNuovo { nome: string; url: string; descrizione: string; stelle: number; creato: string }
/** Un segnale dello slancio: variazione della quota in 6 mesi, margine all'80%, peso nella combinazione. */
export interface Segnale { variazione: number | null; margine: [number, number] | null; peso: number }
export interface RadarRow {
  id: string;
  nome: string;
  breve?: string;
  /** true se breve è al plurale: il verbo si accorda («Multimodali entrano»). */
  plurale?: boolean;
  descrizione: string;
  /** Id dei ruoli per cui la competenza conta (lente scelta a mano, non cambia i numeri). */
  ruoli?: string[];
  /** Variazione in 6 mesi della quota sul totale dell'AI: 0,25 = +25%. */
  slancio: number | null;
  slancio_margine?: [number, number] | null;
  /** Annunci ogni 10mila, media dei Paesi. */
  domanda: number | null;
  domanda_it?: number | null;
  /** Quadrante pubblicato: cambia dopo due mesi di fila nel quadrante nuovo. */
  quadrante: Quadrant | null;
  quadrante_calcolato?: Quadrant | null;
  incerto?: boolean;
  incerto_perche?: string | null;
  slancio_prec?: number | null;
  domanda_prec?: number | null;
  quadrante_prec?: Quadrant | null;
  segnali?: {
    arxiv?: (Segnale & { mensile: { mese: string; n: number; totale: number }[] }) | null;
    github?: (Segnale & { mensile: { mese: string; n: number; base: number }[] }) | null;
    lavoro?: (Segnale & { rilevazioni: { data: string; media: number; it: number | null }[]; ogni_10mila: Record<string, number>; data: string }) | null;
  };
  per_iniziare?: Risorsa[];
  in_crescita?: RepoNuovo[];
}
export interface Ruolo { id: string; nome: string }
export interface Radar {
  /** 2: unità vere e soglie fisse. Senza versione è un radar.json della pipeline vecchia e l'app non lo usa. */
  versione?: number;
  generato: string;
  soglie?: { slancio: number; domanda: number; rapporto_max: number };
  quadranti: Record<Quadrant, string>;
  ruoli?: Ruolo[];
  competenze: RadarRow[];
  storico?: { mese: string; competenze: Record<string, { slancio: number | null; domanda: number | null; calcolato: Quadrant | null; pubblicato: Quadrant | null; incerto: boolean }> }[];
}

export interface OwidPoint { entita: string; t: string; v: number }
export interface OwidSeries {
  titolo: string;
  unita: string;
  citazione: string;
  url: string;
  aggiornato_owid: string | null;
  licenza?: string; // licenza dei dati, da config/sources.yaml
  punti: OwidPoint[];
}
export interface Owid { aggiornato: string; errori: Record<string, string>; serie: Record<string, OwidSeries> }

export interface AiActItem { data: string; titolo: string; descrizione: string; fonte: string }
export interface AiAct { scadenze: AiActItem[] }

export interface Edition { anno: number; data: string; url: string }
export interface Report {
  nome: string;
  editore: string;
  url: string;
  cadenza: string;
  edizioni: Edition[];
  prossima_prevista: string | null;
}
export interface Rapporti { rapporti: Report[] }

export interface NewsItem { titolo: string; link: string; data: string; fonte: string; tema?: string }
export interface News {
  fonti: { nome: string; url: string; tema?: string }[];
  errori: Record<string, string>;
  giorni: number;
  notizie: NewsItem[];
}

export interface EpochPoint { m: string; o: string; d: string; c: number | null; f: boolean; a: string; open: boolean }
export interface Epoch {
  fonte: string;
  url: string;
  punti: EpochPoint[];
  per_anno: { anno: number; area: string; n: number }[];
  pesi_aperti: { anno: number; aperti: number; totale: number }[];
  recenti: { m: string; o: string; d: string; a: string; accesso: string }[];
}

export interface HuggingFace {
  url: string;
  top: { id: string; url: string; tipo: string; like: number; download: number; trending: number; creato: string }[];
  tipi_top100: Record<string, number>;
}

export interface Github {
  repos: { repo: string; url: string; descrizione: string; storico: { data: string; stelle: number }[] }[];
}

export interface Arxiv { mesi: string[]; series: Record<string, Record<string, number>> }

export interface ArtificialAnalysis {
  data: string;
  url: string;
  modelli: { nome: string; creatore: string; indice: number; prezzo: number | null }[];
}

export interface Jobs {
  paesi: Record<string, string>;
  snapshots: { data: string; paese: string; totale: number; competenze: Record<string, number> }[];
}

export interface Eurostat {
  indicatore: string;
  url: string;
  aggiornato_eurostat?: string; // ultimo aggiornamento della serie da parte di Eurostat
  nomi: Record<string, string>;
  serie: Record<string, Record<string, number>>;
}

/** Italia e UE, gli unici due territori dei dati per settore. */
export type Geo = 'IT' | 'EU27_2020';
/** Valori per Italia e UE; null quando Eurostat non dà il numero (riservato o poco affidabile), mai 0. */
export type PerGeo<K extends string = string> = Record<Geo, Record<K, number | null>>;
/** Flag Eurostat delle celle che ne hanno uno: «u» affidabilità bassa, «c» riservato. */
export type FlagPerGeo = Partial<Record<Geo, Record<string, string>>>;
export interface Settore { id: string; nome: string; nace: string; /** «delle imprese manifatturiere», per la frase della porta */ nella_frase: string }
export interface EurostatSettori {
  fonte: string;
  url: string;
  aggiornato_eurostat?: string;
  /** Anno di scopi e barriere: l'ultimo con valori. */
  anno: string;
  settori: Settore[];
  nomi_scopi: Record<string, string>;
  nomi_barriere: Record<string, string>;
  /** Per settore: anni rilevati (2021, 2023-2025; il 2022 non c'è). */
  adozione: Record<string, PerGeo>;
  /** Per settore: % delle imprese che usano l'AI, per scopo. */
  scopi: Record<string, PerGeo>;
  /** Per settore: % delle imprese che hanno considerato l'AI senza usarla, per barriera. */
  barriere: Record<string, PerGeo>;
  flag: Record<'adozione' | 'scopi' | 'barriere', Record<string, FlagPerGeo>>;
}

export interface Dataset {
  status?: Status;
  radar?: Radar;
  owid?: Owid;
  ai_act?: AiAct;
  rapporti?: Rapporti;
  news?: News;
  epoch?: Epoch;
  huggingface?: HuggingFace;
  github?: Github;
  arxiv?: Arxiv;
  artificial_analysis?: ArtificialAnalysis;
  jobs?: Jobs;
  eurostat?: Eurostat;
  eurostat_settori?: EurostatSettori;
}
