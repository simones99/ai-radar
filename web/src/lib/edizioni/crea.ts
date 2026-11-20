// Crea il file fisso di un'edizione dai dati del giro e dall'edizione precedente.
import type { Dataset } from '../data/types';
import { fontiNonAggiornate } from './fonti';
import { notizieDi } from './notizie';
import { settimanaDeiDati, type CardDellaSettimana, type PortaDellaSettimana } from './settimana';
import { cifraConUnita, eCardNotizie, portaConDati, testoPorta, VERSIONE, type CardFissa, type Edizione, type PortaFissa } from './tipi';

const suScadenza = (p: PortaDellaSettimana): boolean => p.destinazione?.card === 'norme';
/** Il conto alla rovescia non è una notizia: una porta con una scadenza si confronta sulla scadenza a cui porta, le altre sul titolo. */
const stessaPorta = (a: PortaDellaSettimana, b: PortaDellaSettimana): boolean =>
  suScadenza(a) && suScadenza(b) ? a.destinazione?.elemento === b.destinazione?.elemento : testoPorta(a) === testoPorta(b);

/** Norme confronta solo la frase, perché la cifra è il conto alla rovescia. */
const stessaCard = (a: CardDellaSettimana, b: CardDellaSettimana): boolean =>
  a.frase === b.frase && (a.id === 'norme' || (a.cifra === b.cifra && a.unita === b.unita));

/** Senza una riga precedente con cui confrontarsi conta come cambiata: nella prima edizione si mostra tutto. */
const cambiata = <T>(ora: T, prima: T | undefined, stessa: (a: T, b: T) => boolean): boolean => !prima || !stessa(ora, prima);

/**
 * Com'era la riga nell'edizione precedente, già composto: il file resta fisso anche se la precedente viene corretta.
 * La cifra di Norme è un conto alla rovescia e quella di Rapporti un mese: non sono un confronto, come una cifra uguale o assente, e vale la frase.
 * In Open source la cifra conta i modelli del tipo in testa: se il tipo è un altro va detto, o sembrerebbe lo stesso numero cresciuto.
 */
function eraPrima(ora: CardDellaSettimana, prima: CardFissa | undefined): string | null {
  if (!prima?.frase) return null;
  const stessaCifra = prima.cifra === ora.cifra && prima.unita === ora.unita;
  if (ora.id === 'norme' || ora.id === 'rapporti' || stessaCifra || !prima.cifra || prima.cifra === '—') return `La settimana scorsa: ${prima.frase}`;
  return ora.id === 'open' && prima.frase !== ora.frase ? `Era ${cifraConUnita(prima)}: ${prima.frase}` : `Era ${cifraConUnita(prima)}.`;
}

const confrontaPorta = (p: PortaDellaSettimana, precedente: Edizione | null): PortaFissa =>
  ({ ...p, cambiata: cambiata(p, precedente?.porte.find((x) => x.id === p.id), stessaPorta) });

function confrontaCard(c: CardDellaSettimana, precedente: Edizione | null): CardFissa {
  const prima = precedente?.card.find((x) => x.id === c.id);
  const diversa = !eCardNotizie(c) && cambiata(c, prima, stessaCard);
  return { ...c, era: diversa ? eraPrima(c, prima) : null, cambiata: diversa };
}

/**
 * L'edizione della settimana dei dati: le porte e le card di settimanaDeiDati, confrontate con la precedente.
 * Null se non c'è niente da fissare: nessun dato sulla settimana, o tutte e due le porte senza dati.
 */
export function creaEdizione(d: Dataset, precedente: Edizione | null): Edizione | null {
  const s = settimanaDeiDati(d);
  if (!s || !s.porte.some(portaConDati)) return null;
  return {
    versione: VERSIONE,
    settimana: s.settimana,
    raccolti: s.raccolti,
    precedente: precedente?.settimana ?? null,
    porte: s.porte.map((p) => confrontaPorta(p, precedente)),
    card: s.card.map((c) => confrontaCard(c, precedente)),
    notizie: notizieDi(d),
    fonti_non_aggiornate: fontiNonAggiornate(d),
    correzioni: [],
  };
}
