import type { Component } from 'svelte';
import type { Dataset } from '../data/types';
import type { TileId } from '../router';
import type { Face, Head } from '../text/frasi';

export interface TileDef {
  id: TileId;
  label: string;
  source: string;
  eager: boolean;
  face: (d: Dataset, today: Date) => Face | null;
  head: (d: Dataset, today: Date) => Head;
  Detail: Component<DetailProps>;
}

export interface DetailProps {
  data: Dataset;
  today: Date;
  tile: TileDef;
  elemento: string | null;
  onclose: () => void;
}
