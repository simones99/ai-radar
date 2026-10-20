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
}

export interface DetailProps {
  data: Dataset;
  today: Date;
  tile: TileDef;
  elemento: string | null;
  params: Params; // parametri del link (?ruolo=…)
  onclose: () => void;
}
