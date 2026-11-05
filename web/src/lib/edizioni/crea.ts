// Crea il file fisso di un'edizione dai dati del giro e dall'edizione precedente.
import type { Dataset } from '../data/types';
import type { TileId } from '../router';
import { lunediDi, parseDay } from '../text/format';
import {
  doorItalia, doorPerTe, faceBusiness, faceCompetenze, faceGeopoliticai, faceModelli, faceNorme, faceNotizie, faceOpen, facePersone, faceRapporti,
  type Door, type Face,
} from '../text/frasi';
import { fontiDi, fontiNonAggiornate } from './fonti';
import { notizieDi } from './notizie';
import { cifraConUnita, eCardNotizie, testoPorta, VERSIONE, type CardFissa, type Edizione, type PortaFissa } from './tipi';

// La vista di partenza: nessun ruolo, «Tutti i Paesi», nessun settore. Non passa da tiles/registry, che legge le scelte ricordate.
const CARD: { id: TileId; nome: string; testa: PortaFissa['id']; face: (d: Dataset, oggi: Date) => Face | null }[] = [
  { id: 'competenze', nome: 'Competenze', testa: 'per-te', face: faceCompetenze },
  { id: 'modelli', nome: 'Modelli e ricerca', testa: 'per-te', face: faceModelli },
  { id: 'open', nome: 'Open source', testa: 'per-te', face: faceOpen },
  { id: 'notizie', nome: 'Notizie', testa: 'per-te', face: faceNotizie },
  { id: 'geopoliticai', nome: 'GeopoliticAI', testa: 'italia', face: faceGeopoliticai },
  { id: 'business', nome: 'Business', testa: 'italia', face: faceBusiness },
  { id: 'persone', nome: 'Persone e lavoro', testa: 'italia', face: facePersone },
  { id: 'norme', nome: 'Norme', testa: 'italia', face: faceNorme },
  { id: 'rapporti', nome: 'Rapporti', testa: 'italia', face: faceRapporti },
];

type SenzaConfronto<T> = Omit<T, 'cambiata'>;

const suScadenza = (p: SenzaConfronto<PortaFissa>): boolean => p.destinazione?.card === 'norme';
/** Il conto alla rovescia non è una notizia: una porta con una scadenza si confronta sulla scadenza a cui porta, le altre sul titolo. */
const stessaPorta = (a: SenzaConfronto<PortaFissa>, b: SenzaConfronto<PortaFissa>): boolean =>
  suScadenza(a) && suScadenza(b) ? a.destinazione?.elemento === b.destinazione?.elemento : testoPorta(a) === testoPorta(b);

/** Norme confronta solo la frase, perché la cifra è il conto alla rovescia. */
const stessaCard = (a: SenzaConfronto<CardFissa>, b: SenzaConfronto<CardFissa>): boolean =>
  a.frase === b.frase && (a.id === 'norme' || (a.cifra === b.cifra && a.unita === b.unita));

/** Senza una riga precedente con cui confrontarsi conta come cambiata: nella prima edizione si mostra tutto. */
const cambiata = <T>(ora: T, prima: T | undefined, stessa: (a: T, b: T) => boolean): boolean => !prima || !stessa(ora, prima);

/**
 * Com'era la riga nell'edizione precedente, già composto: il file resta fisso anche se la precedente viene corretta.
 * La cifra di Norme è un conto alla rovescia e quella di Rapporti un mese: non sono un confronto, come una cifra uguale o assente, e vale la frase.
 * In Open source la cifra conta i modelli del tipo in testa: se il tipo è un altro va detto, o sembrerebbe lo stesso numero cresciuto.
 */
function eraPrima(ora: SenzaConfronto<CardFissa>, prima: CardFissa | undefined): string | null {
  if (!prima?.frase) return null;
  const stessaCifra = prima.cifra === ora.cifra && prima.unita === ora.unita;
  if (ora.id === 'norme' || ora.id === 'rapporti' || stessaCifra || !prima.cifra || prima.cifra === '—') return `La settimana scorsa: ${prima.frase}`;
  return ora.id === 'open' && prima.frase !== ora.frase ? `Era ${cifraConUnita(prima)}: ${prima.frase}` : `Era ${cifraConUnita(prima)}.`;
}

function porta(id: PortaFissa['id'], nome: string, etichetta: string, p: Door, d: Dataset, oggi: Date, precedente: Edizione | null): PortaFissa {
  const destinazione = p.target && { card: p.target.tema, elemento: p.target.elemento, ...(p.target.params && { params: p.target.params }) };
  const fissa: SenzaConfronto<PortaFissa> = {
    id, nome, etichetta,
    titolo: p.title,
    ...(p.nota && { nota: p.nota }),
    meta: p.meta,
    destinazione,
    fonti: fontiDi(d, oggi, destinazione),
  };
  return { ...fissa, cambiata: cambiata(fissa, precedente?.porte.find((x) => x.id === id), stessaPorta) };
}

function frase(c: (typeof CARD)[number], d: Dataset, oggi: Date, precedente: Edizione | null): CardFissa {
  const f = c.face(d, oggi);
  const destinazione = { card: c.id, elemento: null };
  const fissa: SenzaConfronto<CardFissa> = { id: c.id, nome: c.nome, testa: c.testa, cifra: f?.fig ?? null, unita: f?.unit ?? null, frase: f?.sent ?? null, destinazione, fonti: fontiDi(d, oggi, destinazione), era: null };
  const prima = precedente?.card.find((x) => x.id === c.id);
  const diversa = !eCardNotizie(c) && cambiata(fissa, prima, stessaCard);
  return { ...fissa, cambiata: diversa, era: diversa ? eraPrima(fissa, prima) : null };
}

/**
 * L'edizione della settimana dei dati, confrontata con la precedente. La data delle frasi è quella dei dati, mai l'orologio di chi lancia il comando.
 * Null se non c'è niente da fissare: nessun dato sulla settimana, o tutte e due le porte senza dati.
 */
export function creaEdizione(d: Dataset, precedente: Edizione | null): Edizione | null {
  const raccolti = d.status?.aggiornato;
  if (!raccolti) return null;
  const oggi = parseDay(raccolti);
  const perTe = doorPerTe(d, oggi);
  const italia = doorItalia(d, oggi);
  if (!perTe.title.length && !italia.title.length) return null;
  return {
    versione: VERSIONE,
    settimana: lunediDi(raccolti),
    raccolti,
    precedente: precedente?.settimana ?? null,
    porte: [
      porta('per-te', 'Per te', 'Su cosa formarti', perTe, d, oggi, precedente),
      porta('italia', 'Per la tua organizzazione', "L'AI in Italia", italia, d, oggi, precedente),
    ],
    card: CARD.map((c) => frase(c, d, oggi, precedente)),
    notizie: notizieDi(d),
    fonti_non_aggiornate: fontiNonAggiornate(d),
    correzioni: [],
  };
}
