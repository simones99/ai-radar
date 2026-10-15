<script lang="ts">
  import { PHOTOS } from '../photos';
  import type { TileId } from '../router';
  import type { TileDef } from './types';

  let { tiles, onpick, onclose }: { tiles: TileDef[]; onpick: (id: TileId) => void; onclose: () => void } = $props();
</script>

<nav class="pills" aria-label="Altri temi">
  <div class="scroll">
    {#each tiles as t (t.id)}
      <button type="button" class="pill" style:view-transition-name="t-{t.id}" onclick={() => onpick(t.id)}>
        <img src={PHOTOS[t.id].src} alt="" loading="lazy" />{t.label}
      </button>
    {/each}
  </div>
  <button type="button" class="x" aria-label="Chiudi" onclick={onclose}>×</button>
</nav>

<style>
  .pills { display: flex; gap: var(--s1); align-items: center; }
  .scroll { display: flex; flex-wrap: wrap; gap: var(--s1); flex: 1; min-width: 0; }
  .pill { display: inline-flex; align-items: center; gap: var(--s1); min-height: 40px; padding: 4px var(--s2) 4px 4px; border: 0; border-radius: 999px; background: var(--card); box-shadow: var(--shadow); cursor: pointer; font-size: 14px; font-weight: 500; white-space: nowrap; }
  .pill img { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
  .x { flex: none; width: 40px; height: 40px; border-radius: 50%; border: 0; background: var(--card); box-shadow: var(--shadow); cursor: pointer; font-size: 24px; line-height: 40px; }
  @media (hover: hover) { .pill:hover, .x:hover { box-shadow: var(--shadow-up); } }
  @media (max-width: 560px) {
    .pills { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; background: var(--bg); padding-block: var(--s1); margin-inline: calc(-1 * var(--s2)); padding-inline: var(--s2); }
    .scroll { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; }
  }
</style>
