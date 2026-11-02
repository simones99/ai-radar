import type { Component } from 'svelte';
import type { Dataset } from '../data/types';
import type { Params, TileId } from '../router';
import type { Face, Head } from '../text/frasi';

/** Le due teste della home: le persone (radar) e le organizzazioni (Italia). */
export type Testa = 'per-te' | 'italia';

export interface TileDef {
  id: TileId;
  label: string;
  source: string;
  eager: boolean;
  testa: Testa;
  face: (d: Dataset, today: Date) => Face | null;
  head: (d: Dataset, today: Date) => Head;
  Detail: Component<DetailProps>;
  /** La figura disegnata con i dati che fa di questa una card di spicco (vedi diSpicco). Solo span e svg: sta dentro il pulsante della card. */
  Figura?: Component<{ data: Dataset }>;
  /** La notizia di questa card di spicco la dice la porta della sua testa: in home figura e frase, e la cifra resta nell'elenco accanto a una card aperta. */
  senzaCifra?: boolean;
  /** Larga due colonne, con la foto accanto al testo: chiude la riga lasciata a metà dalla card di spicco. */
  largo?: boolean;
}

/** La card di spicco, una per testa, è quella con la figura: in home prende tutta la riga, con la figura al posto della foto,
 *  e il dettaglio si apre sul titolo grande, senza foto. */
export const diSpicco = (t: TileDef) => t.Figura !== undefined;

export interface DetailProps {
  data: Dataset;
  today: Date;
  tile: TileDef;
  elemento: string | null;
  params: Params; // parametri del link (?ruolo=…)
  onclose: () => void;
}
