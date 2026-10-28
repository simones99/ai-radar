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
  /** Le card di spicco, una per testa: in home la figura prende il posto della foto e la card è larga due colonne,
   *  e il dettaglio si apre sul titolo, senza foto. Solo span e svg: sta dentro il pulsante della card. */
  Figura?: Component<{ data: Dataset }>;
  /** Larga due colonne, con la foto accanto al testo: chiude la riga lasciata a metà dalla card di spicco. */
  largo?: boolean;
}

export interface DetailProps {
  data: Dataset;
  today: Date;
  tile: TileDef;
  elemento: string | null;
  params: Params; // parametri del link (?ruolo=…)
  onclose: () => void;
}
