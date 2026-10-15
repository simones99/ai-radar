<script lang="ts">
  import { flushSync, tick } from 'svelte';
  import type { Dataset } from '../data/types';
  import { parseHash, toHash, type TileId } from '../router';
  import Pills from './Pills.svelte';
  import { TILES } from './registry';
  import TileFace from './TileFace.svelte';

  let { data, today }: { data: Dataset; today: Date } = $props();

  const start = parseHash(location.hash);
  let openId = $state<TileId | null>(start?.tema ?? null);
  let elemento = $state<string | null>(start?.elemento ?? null);
  let lastOpened: TileId | null = start?.tema ?? null;
  let pushed = false; // la card aperta ha aggiunto un passo alla cronologia
  setTitle(start?.tema ?? null);

  function setTitle(id: TileId | null) {
    document.title = id ? `${TILES.find((t) => t.id === id)?.label} · AI Radar` : 'AI Radar';
  }

  function withTransition(update: () => void) {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (doc.startViewTransition && !reduce) doc.startViewTransition(() => flushSync(update));
    else update();
  }

  function show(id: TileId | null, el: string | null = null) {
    withTransition(() => {
      openId = id;
      elemento = el;
      if (id) lastOpened = id;
    });
    setTitle(id);
  }

  async function refocus() {
    await tick();
    if (lastOpened) document.querySelector<HTMLButtonElement>(`#tile-${lastOpened} .face`)?.focus();
  }

  function openTile(id: TileId) {
    if (openId === id) return closeTile();
    if (openId === null) {
      history.pushState({ tema: id }, '', toHash(id));
      pushed = true;
    } else {
      history.replaceState(history.state, '', toHash(id));
    }
    show(id);
  }

  function closeTile() {
    if (openId === null) return;
    if (pushed) {
      pushed = false;
      history.back(); // onPop chiude e riporta il focus
      return;
    }
    history.replaceState(null, '', location.pathname + location.search);
    show(null);
    refocus();
  }

  function onPop() {
    const h = parseHash(location.hash);
    pushed = false;
    show(h?.tema ?? null, h?.elemento ?? null);
    if (!h) refocus();
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && openId) {
      e.preventDefault();
      closeTile();
    }
  }
</script>

<svelte:window onpopstate={onPop} onkeydown={onKey} />

{#if openId}
  <Pills tiles={TILES.filter((t) => t.id !== openId)} onpick={openTile} onclose={closeTile} />
{/if}

<div class="tiles" class:has-open={openId !== null} id="temi">
  {#each TILES as t (t.id)}
    <article class="tile" class:open={openId === t.id} class:hidden={openId !== null && openId !== t.id} id="tile-{t.id}">
      <TileFace tile={t} {data} {today} expanded={openId === t.id} onopen={() => openTile(t.id)} />
      {#if openId === t.id}
        {@const D = t.Detail}
        <D {data} {today} tile={t} {elemento} onclose={closeTile} />
      {/if}
    </article>
  {/each}
</div>

<style>
  .tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--s2); }
  @media (max-width: 1040px) { .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 560px) { .tiles { grid-template-columns: minmax(0, 1fr); gap: var(--s1); } }
  .tile { min-width: 0; }
  .has-open { grid-template-columns: minmax(0, 1fr); }
  .hidden { display: none; }
  .open :global(.face) { display: none; }
</style>
