// Come i testi di un'edizione nominano quella con cui si confronta. Di solito è della settimana prima; dopo un lunedì saltato è più
// vecchia, e «la settimana scorsa» sarebbe falso: si nomina con la sua data, la stessa della riga «Rispetto alla settimana del…».
import { dayWith, isoDay, parseDay } from '../text/format';

/** Le edizioni di cui si parla: la settimana dell'una e quella della precedente, come le salva il file fisso. */
export interface Confronto { settimana: string; precedente: string | null }

/** La regola, una sola per pagina, card, immagine e creazione: la precedente è del lunedì prima. Senza precedente non c'è niente da datare. */
function dellaSettimanaPrima({ settimana, precedente }: Confronto): boolean {
  if (!precedente) return true;
  const lunediPrima = parseDay(settimana);
  lunediPrima.setDate(lunediPrima.getDate() - 7);
  return precedente === isoDay(lunediPrima);
}

const FORME = {
  La: ['La settimana scorsa', 'L’edizione'],
  da: ['dalla settimana scorsa', 'dall’edizione'],
  di: ['della settimana scorsa', 'dell’edizione'],
} as const;

/** La precedente nella forma che chiede la frase: «La settimana scorsa», o «L’edizione del 9 nov 2026» se non è della settimana prima. */
export const laPrecedente = (forma: keyof typeof FORME, c: Confronto): string =>
  dellaSettimanaPrima(c) ? FORME[forma][0] : `${FORME[forma][1]} ${dayWith('del', c.precedente!)}`;
