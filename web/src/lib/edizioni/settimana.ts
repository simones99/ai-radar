// Le porte e le card della settimana dei dati, senza il confronto con la settimana prima: l'edizione ci aggiunge il confronto, la home in chiaro no.
import type { Dataset } from '../data/types';
import type { TileId } from '../router';
import { isDay, lunediDi, parseDay } from '../text/format';
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

/**
 * Che cosa è la cifra di una card: decide come l'edizione la confronta con la settimana prima e come la mostra.
 * - misura: un numero che si confronta, «Era 12%.»
 * - nella-frase: la frase dice già il numero, e la cifra da sola lo ripeterebbe. Come in home, dove la card ha senzaCifra in tiles/registry
 * - conta-il-tipo: conta i modelli del tipo in testa. Se il tipo cambia va detto, o sembrerebbe lo stesso numero cresciuto
 * - mese: un mese, non un confronto: com'era si dice con la frase
 * - conto-alla-rovescia: cambia da solo ogni settimana e non è una notizia: si confronta solo la frase, e una porta che ci arriva si confronta sulla scadenza
 * - notizie: il numero delle notizie, che apre la loro sezione. La card non è una riga come le altre: la sua frase contiene la data e cambierebbe sempre
 */
export type Cifra = 'misura' | 'nella-frase' | 'conta-il-tipo' | 'mese' | 'conto-alla-rovescia' | 'notizie';

// La vista di partenza: nessun ruolo, «Tutti i Paesi», nessun settore. Non passa da tiles/registry, che legge le scelte ricordate.
const CARD: { id: TileId; nome: string; testa: PortaFissa['id']; cifra: Cifra; face: (d: Dataset, oggi: Date) => Face | null }[] = [
  { id: 'competenze', nome: 'Competenze', testa: 'per-te', cifra: 'nella-frase', face: faceCompetenze },
  { id: 'modelli', nome: 'Modelli e ricerca', testa: 'per-te', cifra: 'misura', face: faceModelli },
  { id: 'open', nome: 'Open source', testa: 'per-te', cifra: 'conta-il-tipo', face: faceOpen },
  { id: 'notizie', nome: 'Notizie', testa: 'per-te', cifra: 'notizie', face: faceNotizie },
  { id: 'geopoliticai', nome: 'GeopoliticAI', testa: 'italia', cifra: 'misura', face: faceGeopoliticai },
  { id: 'business', nome: 'Business', testa: 'italia', cifra: 'misura', face: faceBusiness },
  { id: 'persone', nome: 'Persone e lavoro', testa: 'italia', cifra: 'misura', face: facePersone },
  { id: 'norme', nome: 'Norme', testa: 'italia', cifra: 'conto-alla-rovescia', face: faceNorme },
  { id: 'rapporti', nome: 'Rapporti', testa: 'italia', cifra: 'mese', face: faceRapporti },
];

/** Che cosa è la cifra della card con questo id, anche letta da un file fisso. Un id che non c'è più vale come una misura. */
export const cifraDi = (id: string): Cifra => CARD.find((c) => c.id === id)?.cifra ?? 'misura';

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

/** Un istante di raccolta che si legge per intero e comincia con un giorno che esiste: da qui nascono la settimana, le date delle pagine, del feed e della sitemap. */
export const raccoltaValida = (raccolti: string | undefined): raccolti is string =>
  !!raccolti && !Number.isNaN(Date.parse(raccolti)) && isDay(raccolti.slice(0, 10));

/**
 * Le due porte e le nove card della settimana dei dati, nella vista di partenza. La data delle frasi è quella dei dati, mai l'orologio.
 * Null solo senza dati sulla settimana: senza status.aggiornato, o con un istante che non si legge o che non comincia con un giorno che esiste,
 * la stessa regola con cui il sito accetta un'edizione. Meglio nessuna settimana che una sbagliata. Una porta o una card senza dati resta, vuota.
 */
export function settimanaDeiDati(d: Dataset): SettimanaDeiDati | null {
  const raccolti = d.status?.aggiornato;
  if (!raccoltaValida(raccolti)) return null;
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
