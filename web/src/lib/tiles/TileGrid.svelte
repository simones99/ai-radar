<script lang="ts">
  import { flushSync, tick } from 'svelte';
  import type { Dataset } from '../data/types';
  import { parseHash, toHash, type TileId } from '../router';
  import Pills from './Pills.svelte';
  import { TESTE, TILES } from './registry';
  import TileFace from './TileFace.svelte';

  let { data, today }: { data: Dataset; today: Date } = $props();

  const start = parseHash(location.hash);
  canonical(start);
  let openId = $state<TileId | null>(start?.tema ?? null);
  let elemento = $state<string | null>(start?.elemento ?? null);
  let current: TileId | null = start?.tema ?? null; // sincrono, per le guardie
  let lastOpened: TileId | null = start?.tema ?? null;
  let pushed = false; // la card aperta ha aggiunto un passo alla cronologia
  let riapri = $state(0); // cresce a ogni link alla card già aperta: la scheda si ricrea come a una nuova apertura
  setTitle(start?.tema ?? null);

  // I vecchi link (#politica) si aprono e l'indirizzo diventa quello di oggi (#norme): «Copia link» copia quello.
  function canonical(h: ReturnType<typeof parseHash>) {
    if (h && location.hash !== toHash(h.tema, h.elemento)) history.replaceState(history.state, '', toHash(h.tema, h.elemento));
  }

  function setTitle(id: TileId | null) {
    document.title = id ? `${TILES.find((t) => t.id === id)?.label} · AI Radar` : 'AI Radar';
  }

  function withTransition(update: () => void): Promise<void> {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { updateCallbackDone?: Promise<void> } };
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (doc.startViewTransition && !reduce) {
      const t = doc.startViewTransition(() => flushSync(update));
      return (t?.updateCallbackDone ?? Promise.resolve()).catch(() => {});
    }
    update();
    return Promise.resolve();
  }

  function show(id: TileId | null, el: string | null = null, again = false): Promise<void> {
    current = id;
    if (id) lastOpened = id;
    const p = withTransition(() => {
      openId = id;
      elemento = el;
      if (again) riapri++;
    });
    setTitle(id);
    return p;
  }

  async function refocus(done: Promise<void>) {
    await done;
    await tick();
    if (lastOpened) document.querySelector<HTMLButtonElement>(`#tile-${lastOpened} .face`)?.focus();
  }

  function toggleTile(id: TileId) {
    if (current === id) closeTile();
    else openTile(id);
  }

  function openTile(id: TileId, el: string | null = null) {
    if (current === null) {
      history.pushState({ tema: id }, '', toHash(id, el));
      pushed = true;
    } else {
      history.replaceState(history.state, '', toHash(id, el));
    }
    show(id, el, current === id); // la stessa card: di nuovo evidenza, scorrimento e focus sul titolo
  }

  // Link a una card (le porte): stessa cronologia del clic su una card. Clic centrale, Ctrl e Maiusc restano al browser.
  function onLink(e: MouseEvent) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const href = (e.target as Element | null)?.closest?.('a[href^="#"]')?.getAttribute('href');
    const h = href ? parseHash(href) : null;
    if (!h) return;
    e.preventDefault();
    openTile(h.tema, h.elemento);
  }

  function closeTile() {
    if (current === null) return;
    if (pushed) {
      pushed = false;
      history.back(); // onPop chiude e riporta il focus
      return;
    }
    history.replaceState(null, '', location.pathname + location.search);
    refocus(show(null));
  }

  function onPop() {
    const h = parseHash(location.hash);
    if (!h && current === null) return;
    pushed = history.state?.tema != null;
    canonical(h);
    if (!h && location.hash) {
      show(null); // ancora interna (#stato, #crediti, #temi): chiude la card e lascia la pagina dove va il link
      return;
    }
    const p = show(h?.tema ?? null, h?.elemento ?? null);
    if (!h) refocus(p);
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && current) {
      e.preventDefault();
      closeTile();
    }
  }
</script>

<svelte:window onpopstate={onPop} onkeydown={onKey} />
<svelte:document onclick={onLink} />

{#if openId}
  <Pills tiles={TILES.filter((t) => t.id !== openId)} onpick={(id) => openTile(id)} onclose={closeTile} />
{/if}

<div class="groups" class:has-open={openId !== null} id="temi">
  {#each TESTE as g (g.id)}
    {@const tiles = TILES.filter((t) => t.testa === g.id)}
    <section class="group" class:hidden={openId !== null && !tiles.some((t) => t.id === openId)} aria-labelledby="g-{g.id}">
      <h2 id="g-{g.id}" class="g-h" class:hidden={openId !== null}>{g.label}</h2>
      <div class="tiles">
        {#each tiles as t (t.id)}
          <article class="tile" class:open={openId === t.id} class:hidden={openId !== null && openId !== t.id} id="tile-{t.id}">
            <TileFace tile={t} {data} {today} expanded={openId === t.id} onopen={() => toggleTile(t.id)} />
            {#if openId === t.id}
              {@const D = t.Detail}
              {#key riapri}<D {data} {today} tile={t} {elemento} onclose={closeTile} />{/key}
            {/if}
          </article>
        {/each}
      </div>
    </section>
  {/each}
</div>

<style>
  .groups { display: grid; gap: var(--s4); }
  .group { display: grid; gap: var(--s2); }
  .g-h { font-weight: 600; font-size: 20px; line-height: 24px; }
  .tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--s2); }
  @media (max-width: 1040px) { .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 560px) { .tiles { grid-template-columns: minmax(0, 1fr); gap: var(--s1); } }
  .tile { min-width: 0; }
  .has-open .tiles { grid-template-columns: minmax(0, 1fr); }
  .has-open { gap: 0; }
  .hidden { display: none; }
  .open :global(.face) { display: none; }
</style>
