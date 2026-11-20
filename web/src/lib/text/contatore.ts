/**
 * La riga sul contatore delle visite, la stessa nelle pagine statiche, nella home in chiaro e nel colophon dell'app: c'è solo dove c'è lo script
 * di Umami. Promette solo quello che Umami scrive di garantire, e il nome porta alla sua informativa per il resto (ADR 0004). Il testo è diviso
 * attorno al link perché ogni pagina lo scriva con i suoi link esterni.
 */
export const RIGA_SUL_CONTATORE = {
  prima: 'Il sito conta le visite con ',
  link: { testo: 'Umami', url: 'https://umami.is/privacy' },
  dopo: ', senza cookie: le statistiche non contengono indirizzi IP e sono conservate in UE.',
} as const;
