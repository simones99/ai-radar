// Le porte e le card della settimana dei dati, senza il confronto con la settimana prima: l'edizione ci aggiunge il confronto, la home in chiaro no.
import type { Dataset } from '../data/types';
import type { TileId } from '../router';
import { lunediDi, parseDay } from '../text/format';
import {
  doorItalia, doorPerTe, faceBusiness, faceCompetenze, faceGeopoliticai, faceModelli, faceNorme, faceNotizie, faceOpen, facePersone, faceRapporti,
  type Door, type Face,
} from '../text/frasi';
import { fontiDi } from './fonti';
import type { CardFissa, PortaFissa } from './tipi';

/** Una porta della settimana, senza il confronto con l'edizione precedente. */
export type PortaDellaSettimana = Omit<PortaFissa, 'cambiata'>;
/** Una card della settimana, senza il confronto con l'edizione precedente. */
export type CardDellaSettimana = Omit<CardFissa, 'cambiata' | 'era'>;

export interface SettimanaDeiDati {
  /** Il lunedì della settimana dei dati, AAAA-MM-GG. */
  settimana: string;
  /** Quando i dati sono stati raccolti: status.aggiornato. */
  raccolti: string;
  /** Per te, poi Per la tua organizzazione. Una porta senza dati ha il titolo vuoto. */
  porte: PortaDellaSettimana[];
  /** Le nove card nell'ordine della home. Una card senza dati ha cifra, unità e frase null. */
  card: CardDellaSettimana[];
}

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

function porta(id: PortaFissa['id'], nome: string, etichetta: string, p: Door, d: Dataset, oggi: Date): PortaDellaSettimana {
  const destinazione = p.target && { card: p.target.tema, elemento: p.target.elemento, ...(p.target.params && { params: p.target.params }) };
  return {
    id, nome, etichetta,
    titolo: p.title,
    ...(p.nota && { nota: p.nota }),
    meta: p.meta,
    destinazione,
    fonti: fontiDi(d, oggi, destinazione),
  };
}

function frase(c: (typeof CARD)[number], d: Dataset, oggi: Date): CardDellaSettimana {
  const f = c.face(d, oggi);
  const destinazione = { card: c.id, elemento: null };
  return { id: c.id, nome: c.nome, testa: c.testa, cifra: f?.fig ?? null, unita: f?.unit ?? null, frase: f?.sent ?? null, destinazione, fonti: fontiDi(d, oggi, destinazione) };
}

/**
 * Le due porte e le nove card della settimana dei dati, nella vista di partenza. La data delle frasi è quella dei dati, mai l'orologio.
 * Null solo senza dati sulla settimana, cioè senza status.aggiornato: una porta o una card senza dati resta, vuota.
 */
export function settimanaDeiDati(d: Dataset): SettimanaDeiDati | null {
  const raccolti = d.status?.aggiornato;
  if (!raccolti) return null;
  const oggi = parseDay(raccolti);
  return {
    settimana: lunediDi(raccolti),
    raccolti,
    porte: [
      porta('per-te', 'Per te', 'Su cosa formarti', doorPerTe(d, oggi), d, oggi),
      porta('italia', 'Per la tua organizzazione', "L'AI in Italia", doorItalia(d, oggi), d, oggi),
    ],
    card: CARD.map((c) => frase(c, d, oggi)),
  };
}
