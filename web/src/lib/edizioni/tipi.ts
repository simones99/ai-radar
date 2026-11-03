// La forma del file fisso di un'edizione, data/edizioni/AAAA-MM-GG.json. Ci sono i testi già composti, non i dati da cui
// derivano: le regole delle frasi possono cambiare senza alterare il passato. Un cambio di forma alza VERSIONE.
export const VERSIONE = 1;

export interface Destinazione { card: string; elemento: string | null; params?: Record<string, string> }

/** Da dove viene una riga: il nome, l'indirizzo se c'è e la licenza con cui si riusa. */
export interface Fonte { nome: string; url: string | null; licenza: string }
export interface FonteNonAggiornata { id: string; nome: string; ultimo_successo: string | null }

export interface VoceFissa { titolo: string; link: string; data: string; fonte: string }
export interface NotizieFisse {
  /** Le notizie della settimana, non solo quelle scelte. */
  totale: number;
  periodo: string;
  /** Le fonti distinte tra le notizie della settimana. */
  fonti: number;
  regola: string;
  temi: { tema: string; nome: string; voci: VoceFissa[] }[];
}

export interface Correzione { data: string; testo: string }

export interface PortaFissa {
  id: 'per-te' | 'italia';
  nome: string;
  etichetta: string;
  titolo: { t: string; em?: boolean }[]; // vuoto se non ci sono dati
  nota?: string;
  meta: string;
  destinazione: Destinazione | null;
  fonti: Fonte[];
  /** Diversa dall'edizione precedente. Nella prima edizione è sempre vera: non c'è confronto, e si mostra tutto. */
  cambiata: boolean;
}

export interface CardFissa {
  id: string;
  nome: string;
  // null: quella settimana la card non aveva dati
  cifra: string | null;
  unita: string | null;
  frase: string | null;
  destinazione: Destinazione;
  fonti: Fonte[];
  /** Come per le porte. Notizie è sempre falsa: il suo conteggio apre la sezione delle notizie. */
  cambiata: boolean;
}

export interface Edizione {
  versione: number;
  /** Il lunedì della settimana, AAAA-MM-GG: è anche la chiave del file e dell'indirizzo. */
  settimana: string;
  /** Quando i dati sono stati raccolti: status.aggiornato. */
  raccolti: string;
  /** La settimana dell'edizione con cui è confrontata; null per la prima. */
  precedente: string | null;
  porte: PortaFissa[];
  card: CardFissa[];
  notizie: NotizieFisse;
  /** Le fonti senza dati aggiornati a questo giro: in errore o non configurate. */
  fonti_non_aggiornate: FonteNonAggiornata[];
  /** Si aggiungono a mano, con un commit: è l'unico modo in cui un'edizione cambia. */
  correzioni: Correzione[];
}
