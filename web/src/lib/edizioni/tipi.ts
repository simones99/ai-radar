// La forma del file fisso di un'edizione, data/edizioni/AAAA-MM-GG.json. Ci sono i testi già composti, non i dati da cui
// derivano: le regole delle frasi possono cambiare senza alterare il passato. Un cambio di forma alza VERSIONE.
export const VERSIONE = 1;

export interface Destinazione { card: string; elemento: string | null; params?: Record<string, string> }

/** Da dove viene una riga: il nome, l'indirizzo se c'è e la licenza con cui si riusa. */
export interface Fonte { nome: string; url: string | null; licenza: string }
export interface FonteNonAggiornata { id: string; nome: string; ultimo_successo: string | null }

export interface VoceFissa { titolo: string; link: string; data: string; fonte: string }
export interface NotizieFisse {
  // totale, periodo e fonti restano come dati della settimana, che dopo non si possono più ricavare. Le pagine non li leggono:
  // il conteggio mostrato è nella card Notizie, ed è lì che si corregge
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
  /** La testa a cui appartiene: l'id della sua porta. */
  testa: PortaFissa['id'];
  // null: quella settimana la card non aveva dati
  cifra: string | null;
  unita: string | null;
  frase: string | null;
  destinazione: Destinazione;
  fonti: Fonte[];
  /** Come per le porte. Notizie è sempre falsa: il suo conteggio apre la sezione delle notizie. */
  cambiata: boolean;
  /** Il testo già composto che dice com'era la riga nell'edizione precedente; null se non è cambiata o se allora non aveva dati. */
  era: string | null;
}

/** Una porta senza dati ha il titolo vuoto. */
export const portaConDati = (p: Pick<PortaFissa, 'titolo'>): boolean => p.titolo.length > 0;
export const testoPorta = (p: Pick<PortaFissa, 'titolo'>): string => p.titolo.map((x) => x.t).join('');
/** La cifra con la sua unità: «5 su 16», ma «16%». */
export const cifraConUnita = (c: Pick<CardFissa, 'cifra' | 'unita'>): string => `${c.cifra ?? ''}${c.unita ? `${c.unita === '%' ? '' : ' '}${c.unita}` : ''}`;
/** Competenze ha il numero già nella frase: come in home (senzaCifra in tiles/registry), la cifra da sola lo ripeterebbe. */
export const cifraNellaFrase = (c: Pick<CardFissa, 'id'>): boolean => c.id === 'competenze';
/** La card Notizie non è una riga come le altre: la sua frase contiene la data e cambierebbe sempre, e il suo conteggio apre la sezione delle notizie. */
export const eCardNotizie = (c: Pick<CardFissa, 'id'>): boolean => c.id === 'notizie';

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
