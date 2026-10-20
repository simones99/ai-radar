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
</script>

<!-- aperta, il nome della transizione passa al dettaglio: due elementi con lo stesso nome annullano l'animazione -->
<button type="button" class="face" class:compact aria-expanded={expanded} aria-controls="detail-{tile.id}" style:view-transition-name={expanded ? null : `t-${tile.id}`} onclick={onopen}>
  {#if imgFailed}
    <span class="ph ph-empty" aria-hidden="true">{photo.alt}</span>
  {:else}
    <span class="ph"><img src={photo.src} srcset={photo.srcset} sizes="(max-width: 560px) 88px, (max-width: 1040px) 50vw, 25vw"
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
  .face { all: unset; box-sizing: border-box; display: grid; gap: var(--s2); width: 100%; height: 100%; align-content: start; padding: var(--s1) var(--s1) var(--s3); background: var(--card); border-radius: var(--r-lg); box-shadow: var(--shadow); cursor: pointer; transition: box-shadow .25s var(--ease), transform .25s var(--ease); }
  .face:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .ph { display: block; aspect-ratio: 4 / 3; border-radius: var(--r-md); overflow: hidden; background: var(--line); }
  .ph img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s var(--ease); }
  .ph-empty { display: grid; place-items: center; padding: var(--s2); font-size: 12px; line-height: 16px; color: var(--fg-2); text-align: center; }
  .f-body { display: grid; gap: var(--s1); padding-inline: var(--s2); }
  .f-lab { display: flex; justify-content: space-between; gap: var(--s1); font-size: 14px; line-height: 24px; color: var(--fg-2); }
  .f-lab .small { color: var(--fg-3); }
  .fig { font-weight: 600; font-size: 40px; line-height: 48px; letter-spacing: -.035em; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  .u { font-size: 20px; letter-spacing: -.01em; margin-left: 4px; color: var(--fg-2); font-weight: 500; }
  .sent { font-size: 14px; line-height: 24px; color: var(--fg-2); }
  .stale { font-size: 12px; line-height: 16px; color: var(--fg-3); }
  @media (hover: hover) {
    .face:hover { box-shadow: var(--shadow-up); transform: translateY(-2px); }
    .face:hover .ph img { transform: scale(1.03); }
  }
  .face.compact { grid-template-columns: 64px minmax(0, 1fr); align-items: center; gap: 12px; padding: var(--s1); border-radius: var(--r-md); background: transparent; box-shadow: none; }
  .compact .ph { aspect-ratio: 1; border-radius: var(--r-sm); }
  .compact .f-body { padding-inline: 0; gap: 0; }
  .compact .f-lab .small, .compact .sent { display: none; }
  .compact .fig { font-size: 22px; line-height: 28px; }
  .compact .u { font-size: 13px; }
  .face.compact[aria-expanded="true"] { background: var(--card); box-shadow: var(--shadow), inset 3px 0 0 var(--accent); }
  @media (hover: hover) {
    .face.compact:hover { background: var(--card); transform: none; }
    .face.compact:hover .ph img { transform: none; }
  }
  @media (max-width: 560px) {
    .face { grid-template-columns: 88px minmax(0, 1fr); align-items: center; padding: var(--s1); border-radius: var(--r-md); }
    .ph { aspect-ratio: 1; border-radius: var(--r-sm); }
    .f-body { padding-inline: 0 var(--s1); gap: 0; }
    .fig { font-size: 28px; line-height: 32px; }
    .u { font-size: 16px; }
  }
</style>
