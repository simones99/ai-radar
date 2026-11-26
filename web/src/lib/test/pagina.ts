// Una pagina statica letta come la legge un lettore di schermo: ruoli e nomi accessibili, non la forma del DOM (CODING_STANDARDS §Test).
import { within } from '@testing-library/dom';

/**
 * Carica l'HTML nel documento di jsdom e lo dà da leggere per ruoli e nomi. Un documento di DOMParser non ha una finestra,
 * e senza finestra Testing Library non sa cosa è nascosto: per questo la pagina entra nel documento del test. Gli script non partono.
 */
export function apri(html: string) {
  const letto = new DOMParser().parseFromString(html, 'text/html');
  document.documentElement.innerHTML = letto.documentElement.innerHTML;
  return within(document.body);
}

/** Il testo come si legge: spazi e a capo dell'HTML ridotti a uno. */
export const pulito = (s: string | null | undefined): string => (s ?? '').replace(/\s+/g, ' ').trim();
