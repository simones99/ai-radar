/** La pagina Privacy del sito, vista dalla radice: c'è dove c'è il contatore delle visite, e la riga sul contatore porta lì. */
export const PAGINA_PRIVACY = 'privacy/';

/**
 * La riga sul contatore delle visite, la stessa nelle pagine statiche, nella home in chiaro, nella pagina Privacy e nel colophon dell'app: c'è solo
 * dove c'è lo script di Umami. Promette solo quello che Umami scrive di garantire, e il link porta alla pagina Privacy del sito per il resto
 * (ADR 0004). Il link è un indirizzo del sito, relativo alla radice: ogni pagina lo scrive a partire da dove sta.
 */
export const RIGA_SUL_CONTATORE = {
  testo: 'Il sito conta le visite con Umami, senza cookie: le statistiche non contengono indirizzi IP e sono conservate in UE.',
  link: { testo: 'Privacy', percorso: PAGINA_PRIVACY },
} as const;
