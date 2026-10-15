import {
  faceBusiness, faceCompetenze, faceModelli, faceNotizie, faceOpen, facePersone, facePolitica, faceRapporti,
  headBusiness, headCompetenze, headModelli, headNotizie, headOpen, headPersone, headPolitica, headRapporti,
} from '../text/frasi';
import BusinessDetail from './BusinessDetail.svelte';
import CompetenzeDetail from './CompetenzeDetail.svelte';
import ModelliDetail from './ModelliDetail.svelte';
import NotizieDetail from './NotizieDetail.svelte';
import OpenDetail from './OpenDetail.svelte';
import PersoneDetail from './PersoneDetail.svelte';
import PoliticaDetail from './PoliticaDetail.svelte';
import RapportiDetail from './RapportiDetail.svelte';
import type { TileDef } from './types';

export const TILES: TileDef[] = [
  { id: 'modelli', label: 'Modelli e ricerca', source: 'epoch', eager: true, face: faceModelli, head: headModelli, Detail: ModelliDetail },
  { id: 'open', label: 'Open source', source: 'huggingface', eager: true, face: faceOpen, head: headOpen, Detail: OpenDetail },
  { id: 'business', label: 'Business', source: 'owid', eager: true, face: faceBusiness, head: headBusiness, Detail: BusinessDetail },
  { id: 'persone', label: 'Persone e lavoro', source: 'owid', eager: true, face: facePersone, head: headPersone, Detail: PersoneDetail },
  { id: 'politica', label: 'Politica', source: 'ai_act', eager: false, face: facePolitica, head: headPolitica, Detail: PoliticaDetail },
  { id: 'competenze', label: 'Competenze', source: 'radar', eager: false, face: faceCompetenze, head: headCompetenze, Detail: CompetenzeDetail },
  { id: 'notizie', label: 'Notizie', source: 'feeds', eager: false, face: faceNotizie, head: headNotizie, Detail: NotizieDetail },
  { id: 'rapporti', label: 'Rapporti', source: 'rapporti', eager: false, face: faceRapporti, head: headRapporti, Detail: RapportiDetail },
];
