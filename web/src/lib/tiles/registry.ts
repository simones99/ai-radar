import {
  faceBusiness, faceCompetenze, faceModelli, faceNotizie, faceOpen, facePersone, faceNorme, faceRapporti,
  headBusiness, headCompetenze, headModelli, headNotizie, headOpen, headPersone, headNorme, headRapporti,
} from '../text/frasi';
import BusinessDetail from './BusinessDetail.svelte';
import CompetenzeDetail from './CompetenzeDetail.svelte';
import ModelliDetail from './ModelliDetail.svelte';
import NotizieDetail from './NotizieDetail.svelte';
import OpenDetail from './OpenDetail.svelte';
import PersoneDetail from './PersoneDetail.svelte';
import NormeDetail from './NormeDetail.svelte';
import RapportiDetail from './RapportiDetail.svelte';
import type { Testa, TileDef } from './types';

export const TESTE: readonly { id: Testa; eyebrow: string; label: string }[] = [
  { id: 'per-te', eyebrow: 'Per te', label: 'Su cosa formarti' },
  { id: 'italia', eyebrow: 'Per la tua organizzazione', label: "L'AI in Italia" },
];

export const TILES: TileDef[] = [
  { id: 'competenze', label: 'Competenze', source: 'radar', eager: true, testa: 'per-te', face: faceCompetenze, head: headCompetenze, Detail: CompetenzeDetail },
  { id: 'modelli', label: 'Modelli e ricerca', source: 'epoch', eager: true, testa: 'per-te', face: faceModelli, head: headModelli, Detail: ModelliDetail },
  { id: 'open', label: 'Open source', source: 'huggingface', eager: true, testa: 'per-te', face: faceOpen, head: headOpen, Detail: OpenDetail },
  { id: 'notizie', label: 'Notizie', source: 'feeds', eager: true, testa: 'per-te', face: faceNotizie, head: headNotizie, Detail: NotizieDetail },
  { id: 'business', label: 'Business', source: 'owid', eager: false, testa: 'italia', face: faceBusiness, head: headBusiness, Detail: BusinessDetail },
  { id: 'persone', label: 'Persone e lavoro', source: 'owid', eager: false, testa: 'italia', face: facePersone, head: headPersone, Detail: PersoneDetail },
  { id: 'norme', label: 'Norme', source: 'ai_act', eager: false, testa: 'italia', face: faceNorme, head: headNorme, Detail: NormeDetail },
  { id: 'rapporti', label: 'Rapporti', source: 'rapporti', eager: false, testa: 'italia', face: faceRapporti, head: headRapporti, Detail: RapportiDetail },
];
