<script lang="ts">
  import type { Dataset } from '../data/types';
  import { tileState } from '../data/freshness';
  import { PHOTOS } from '../photos';
  import { day, dayWith } from '../text/format';
  import type { TileDef } from './types';

  // compact: riga dell'elenco accanto alla card aperta (da 1200px)
  let { tile, data, today, expanded, compact = false, onopen }: { tile: TileDef; data: Dataset; today: Date; expanded: boolean; compact?: boolean; onopen: () => void } = $props();

  const face = $derived(tile.face(data, today));
  const st = $derived(tileState(tile.source, data.status, face !== null));
  const photo = $derived(PHOTOS[tile.id]);
  let imgFailed = $state(false);
  // nell'elenco accanto alla card aperta anche le card di spicco tornano alla foto
  const Figura = $derived(compact ? undefined : tile.Figura);
</script>

<!-- aperta, il nome della transizione passa al dettaglio: due elementi con lo stesso nome annullano l'animazione -->
<button type="button" class="face" class:compact class:spicco={Figura !== undefined} class:largo={tile.largo && !compact} aria-expanded={expanded} aria-controls="detail-{tile.id}" style:view-transition-name={expanded ? null : `t-${tile.id}`} onclick={onopen}>
  {#if Figura}
    <span class="viz"><Figura {data} /></span>
  {:else if imgFailed}
    <span class="ph ph-empty" aria-hidden="true">{photo.alt}</span>
  {:else}
    <span class="ph" style:background-image="url({photo.anteprima})"><img src={photo.src} srcset={photo.srcset} sizes="(max-width: 560px) 88px, (max-width: 1040px) 50vw, 25vw"
      alt="" loading={tile.eager ? 'eager' : 'lazy'} decoding="async" onerror={() => (imgFailed = true)} /></span>
  {/if}
  <span class="f-body">
    <span class="f-lab">
      <span>{tile.label}</span>
      <span class="small">
        {#if st.state === 'assente'}non disponibile{:else if st.aggiornato}agg. {day(st.aggiornato)}{/if}
      </span>
    </span>
    {#if face}
      <span class="fig">{face.fig}{#if face.unit}<span class="u">{face.unit}</span>{/if}</span>
      <span class="sent">{face.sent}</span>
    {:else}
      <span class="sent">{st.motivo}</span>
    {/if}
    {#if st.state === 'vecchio' && st.fallito && st.aggiornato}
      <span class="stale">Aggiornamento non riuscito {dayWith('il', st.fallito)}. Dati aggiornati {dayWith('al', st.aggiornato)}.</span>
    {/if}
  </span>
</button>

<style>
  .face { all: unset; box-sizing: border-box; display: grid; gap: var(--s2); width: 100%; align-content: start; padding: var(--s1) var(--s1) var(--s3); background: var(--card); border-radius: var(--r-lg); box-shadow: var(--shadow); cursor: pointer; transition: box-shadow .25s var(--ease), transform .25s var(--ease); }
  .face:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .ph { display: block; aspect-ratio: 16 / 9; border-radius: var(--r-md); overflow: hidden; background: var(--line) center / cover no-repeat; } /* sotto la foto, finché arriva, la sua anteprima */
  .ph img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s var(--ease); }
  .ph-empty { display: grid; place-items: center; padding: var(--s2); font-size: 12px; line-height: 16px; color: var(--fg-2); text-align: center; }
  .f-body { display: grid; gap: var(--s1); padding-inline: var(--s2); }
  .f-lab { display: flex; justify-content: space-between; gap: var(--s1); font-size: 14px; line-height: 24px; color: var(--fg-2); }
  .f-lab .small { color: var(--fg-3); }
  .fig { font-weight: 600; font-size: 40px; line-height: 48px; letter-spacing: -.02em; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  .u { display: inline-block; white-space: nowrap; font-size: 20px; letter-spacing: -.01em; margin-left: 4px; color: var(--fg-2); font-weight: 500; }
  .sent { font-size: 14px; line-height: 24px; color: var(--fg-2); }
  .stale { font-size: 12px; line-height: 16px; color: var(--fg-3); }
  @media (hover: hover) {
    .face:hover { box-shadow: var(--shadow-up); transform: translateY(-2px); }
    .face:hover .ph img { transform: scale(1.03); }
  }
  .face.compact { grid-template-columns: 56px minmax(0, 1fr); align-items: center; gap: 12px; padding: var(--s1); border-radius: var(--r-md); background: transparent; box-shadow: none; }
  .compact .ph { aspect-ratio: 1; border-radius: var(--r-sm); }
  .compact .f-body { padding-inline: 0; gap: 0; }
  .compact .f-lab .small, .compact .sent { display: none; }
  .compact .fig { font-size: 22px; line-height: 28px; }
  .compact .u { font-size: 13px; }
  /* la card aperta è la riga sulla carta, le altre stanno sul fondo */
  .face.compact[aria-expanded="true"] { background: var(--card); box-shadow: var(--shadow); }
  @media (hover: hover) {
    .face.compact:hover { background: var(--card); transform: none; }
    .face.compact:hover .ph img { transform: none; }
  }
  /* la card di spicco: la figura al posto della foto, la cifra più grande */
  .viz { display: block; aspect-ratio: 4 / 3; border-radius: var(--r-md); overflow: hidden; background: var(--card); min-height: 0; }
  .spicco { grid-template-rows: minmax(0, 1fr) auto; }
  .spicco .viz { aspect-ratio: auto; min-height: 240px; }
  .spicco .fig { font-size: 48px; line-height: 52px; letter-spacing: -.015em; text-wrap: balance; }
  .spicco .sent { color: var(--fg); max-width: 46ch; }
  .spicco .u { display: block; margin: var(--s1) 0 0; font-size: 22px; line-height: 28px; }
  /* larga: il testo accanto alla foto, più piccola */
  @container (min-width: 480px) {
    .largo { grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); align-content: stretch; gap: var(--s3); }
    .largo .ph { order: 2; aspect-ratio: auto; height: 100%; min-height: 200px; }
    .largo .f-body { order: 1; align-content: end; padding: var(--s3) 0 var(--s2) var(--s2); }
  }
  /* di spicco e larga abbastanza: la figura è una striscia in alto, sotto la cifra e la frase affiancate */
  @container (min-width: 720px) {
    .spicco .viz { width: 100%; aspect-ratio: 5 / 2; min-height: 0; max-height: 360px; }
    .spicco .f-body { grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); column-gap: var(--s4); align-items: end; padding: var(--s1) var(--s3) 0; }
    .spicco .f-lab, .spicco .stale { grid-column: 1 / -1; }
    .spicco .fig { font-size: clamp(44px, 6cqi, 64px); line-height: 1.05; }
    .spicco .sent { padding-bottom: 4px; }
  }
  @media (max-width: 560px) {
    .face { grid-template-columns: 88px minmax(0, 1fr); align-items: center; padding: var(--s1); border-radius: var(--r-md); }
    .face.spicco { grid-template-columns: minmax(0, 1fr); align-items: stretch; padding: var(--s1) var(--s1) var(--s2); }
    .spicco .viz { min-height: 0; aspect-ratio: 4 / 3; }
    .spicco .f-body { padding-inline: var(--s1); gap: 4px; }
    .spicco .fig { font-size: 36px; line-height: 40px; }
    .ph { aspect-ratio: 1; border-radius: var(--r-sm); }
    .f-body { padding-inline: 0 var(--s1); gap: 0; }
    .fig { font-size: 28px; line-height: 32px; }
    .u { font-size: 16px; }
  }
</style>
