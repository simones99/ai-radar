/** Contratti dei JSON in data/, scritti dalla pipeline Python. */

export type Quadrant = 'impara-ora' | 'prova' | 'consolida' | 'osserva';

export interface SourceStatus {
  stato: 'ok' | 'errore' | 'non configurata';
  ultimo_successo?: string;
  ultimo_tentativo?: string;
  messaggio?: string;
}
export interface Status { aggiornato: string; fonti: Record<string, SourceStatus> }

export interface RadarRow {
  id: string;
  nome: string;
  breve?: string;
  descrizione: string;
  slancio: number | null;
  domanda: number | null;
  quadrante: Quadrant | null;
  slancio_prec?: number | null;
  domanda_prec?: number | null;
  quadrante_prec?: Quadrant | null;
  arxiv?: { crescita: number } | null;
  github?: { crescita: number; ultimi3: number; precedenti3: number } | null;
  lavoro?: { media: number | null; media_ue: number | null; usa: number | null } | null;
}
export interface Radar {
  generato: string;
  base_domanda: 'lavoro' | 'open-source';
  /** true: la domanda di un mese fa non c'è ancora, il quadrante di allora usa quella di oggi. */
  domanda_prec_attuale?: boolean;
  quadranti: Record<Quadrant, string>;
  competenze: RadarRow[];
  storico?: { mese: string; competenze: Record<string, { slancio: number | null; domanda: number | null }> }[];
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
}
