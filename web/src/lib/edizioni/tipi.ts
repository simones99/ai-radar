// La forma del file fisso di un'edizione, data/edizioni/AAAA-MM-GG.json. Ci sono i testi già composti, non i dati da cui
// derivano: le regole delle frasi possono cambiare senza alterare il passato. Un cambio di forma alza VERSIONE.
export const VERSIONE = 1;

export interface Destinazione { tema: string; elemento: string | null; params?: Record<string, string> }

export interface PortaFissa {
  id: 'per-te' | 'italia';
  nome: string;
  etichetta: string;
  titolo: { t: string; em?: boolean }[]; // vuoto se non ci sono dati
  nota?: string;
  meta: string;
  destinazione: Destinazione | null;
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
}
