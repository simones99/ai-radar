// Crea il file fisso di un'edizione dai dati del giro e dall'edizione precedente.
import type { Dataset } from '../data/types';
import type { TileId } from '../router';
import { lunediDi, parseDay } from '../text/format';
import {
  doorItalia, doorPerTe, faceBusiness, faceCompetenze, faceGeopoliticai, faceModelli, faceNorme, faceNotizie, faceOpen, facePersone, faceRapporti,
  type Door, type Face,
} from '../text/frasi';
import { VERSIONE, type CardFissa, type Edizione, type PortaFissa } from './tipi';

// La vista di partenza: nessun ruolo, «Tutti i Paesi», nessun settore. Non passa da tiles/registry, che legge le scelte ricordate.
const CARD: { id: TileId; nome: string; face: (d: Dataset, oggi: Date) => Face | null }[] = [
  { id: 'competenze', nome: 'Competenze', face: faceCompetenze },
  { id: 'modelli', nome: 'Modelli e ricerca', face: faceModelli },
  { id: 'open', nome: 'Open source', face: faceOpen },
  { id: 'notizie', nome: 'Notizie', face: faceNotizie },
  { id: 'business', nome: 'Business', face: faceBusiness },
  { id: 'geopoliticai', nome: 'GeopoliticAI', face: faceGeopoliticai },
  { id: 'persone', nome: 'Persone e lavoro', face: facePersone },
  { id: 'norme', nome: 'Norme', face: faceNorme },
  { id: 'rapporti', nome: 'Rapporti', face: faceRapporti },
];

const testo = (p: PortaFissa): string => p.titolo.map((x) => x.t).join('');
const suScadenza = (p: PortaFissa): boolean => p.destinazione?.tema === 'norme';
/** Il conto alla rovescia non è una notizia: una porta con una scadenza si confronta sulla scadenza a cui porta, le altre sul titolo. */
const stessaPorta = (a: PortaFissa, b: PortaFissa): boolean =>
  suScadenza(a) && suScadenza(b) ? a.destinazione?.elemento === b.destinazione?.elemento : testo(a) === testo(b);

/** Norme confronta solo la frase, perché la cifra è il conto alla rovescia. */
const stessaCard = (a: CardFissa, b: CardFissa): boolean =>
  a.frase === b.frase && (a.id === 'norme' || (a.cifra === b.cifra && a.unita === b.unita));

function porta(id: PortaFissa['id'], nome: string, etichetta: string, p: Door, precedente: Edizione | null): PortaFissa {
  const fissa: PortaFissa = {
    id, nome, etichetta,
    titolo: p.title,
    ...(p.nota && { nota: p.nota }),
    meta: p.meta,
    destinazione: p.target && { tema: p.target.tema, elemento: p.target.elemento, ...(p.target.params && { params: p.target.params }) },
    cambiata: true,
  };
  const prima = precedente?.porte.find((x) => x.id === id);
  return { ...fissa, cambiata: !prima || !stessaPorta(fissa, prima) };
}

function frase(c: (typeof CARD)[number], d: Dataset, oggi: Date, precedente: Edizione | null): CardFissa {
  const f = c.face(d, oggi);
  const fissa: CardFissa = { id: c.id, nome: c.nome, cifra: f?.fig ?? null, unita: f?.unit ?? null, frase: f?.sent ?? null, destinazione: { tema: c.id, elemento: null }, cambiata: true };
  // la frase di Notizie contiene la data e cambierebbe sempre: il suo conteggio apre la sezione delle notizie
  if (c.id === 'notizie') return { ...fissa, cambiata: false };
  const prima = precedente?.card.find((x) => x.id === c.id);
  return { ...fissa, cambiata: !prima || !stessaCard(fissa, prima) };
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
      porta('per-te', 'Per te', 'Su cosa formarti', perTe, precedente),
      porta('italia', 'Per la tua organizzazione', "L'AI in Italia", italia, precedente),
    ],
    card: CARD.map((c) => frase(c, d, oggi, precedente)),
  };
}
