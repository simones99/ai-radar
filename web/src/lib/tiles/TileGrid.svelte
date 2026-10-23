<script lang="ts">
  import { flushSync, onDestroy, tick } from 'svelte';
  import type { Dataset } from '../data/types';
  import { APRI, IMPOSTA, parseHash, toHash, type Params, type TileId } from '../router';
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
  let currentEl: string | null = start?.elemento ?? null; // sincrono, come current
  let params = $state<Params>(start?.params ?? {}); // ?ruolo=…: restano nel link finché la card è aperta, anche cambiando card
  let depth = 0; // passi aggiunti alla cronologia da quando la card è aperta (0: aperta da un link diretto)
  let jumping: 'close' | 'back' | null = null; // salto nella cronologia in corso: finché non arriva popstate, niente altri salti
  let jumpTimer: ReturnType<typeof setTimeout> | undefined;

  function jump(kind: 'close' | 'back', n: number) {
    jumping = kind;
    clearTimeout(jumpTimer);
    jumpTimer = setTimeout(() => (jumping = null), 1000); // ripiego: se popstate non arriva, non resta appeso
    history.go(-n);
  }
  let riapri = $state(0); // cresce a ogni link alla card già aperta: la scheda si ricrea come a una nuova apertura
  const open = $derived(TILES.find((t) => t.id === openId));
  setTitle(start?.tema ?? null);

  // I vecchi link (#politica) si aprono e l'indirizzo diventa quello di oggi (#norme): «Copia link» copia quello.
  function canonical(h: ReturnType<typeof parseHash>) {
    if (h && location.hash !== toHash(h.tema, h.elemento, h.params)) history.replaceState(history.state, '', toHash(h.tema, h.elemento, h.params));
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
    currentEl = el;
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

  // I parametri di un link si aggiungono a quelli già nel link; a parità di nome vince il link.
  // `rimando`: un link dentro un dettaglio verso un'altra card aggiunge un passo, e Indietro torna alla card di prima.
  function openTile(id: TileId, el: string | null = null, extra: Params = {}, rimando = false) {
    if (jumping) return;
    params = { ...params, ...extra };
    if (current === null) {
      depth = 1;
      history.pushState({ tema: id, depth }, '', toHash(id, el, params));
    } else if (current === id && el !== null && el !== currentEl) {
      depth += 1; // dentro la card, verso un elemento: Indietro torna a dove si era
      history.pushState({ tema: id, depth, daRadar: currentEl === null }, '', toHash(id, el, params));
    } else if (rimando && current !== id) {
      depth += 1;
      history.pushState({ tema: id, depth }, '', toHash(id, el, params));
    } else if (current === id && el === null && currentEl !== null && history.state?.daRadar) {
      jump('back', 1); // «Tutte le competenze» dopo esserci entrati dal radar: come Indietro
      return;
    } else {
      history.replaceState(history.state, '', toHash(id, el, params));
    }
    show(id, el, current === id); // la stessa card: di nuovo evidenza, scorrimento e focus sul titolo
  }

  // Link a una card (le porte): stessa cronologia del clic su una card; da dentro un dettaglio è un rimando. Clic centrale, Ctrl e Maiusc restano al browser.
  function onLink(e: MouseEvent) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.('a[href^="#"]');
    const href = a?.getAttribute('href');
    const h = href ? parseHash(href) : null;
    if (!h) return;
    e.preventDefault();
    openTile(h.tema, h.elemento, h.params, !!a?.closest('section.detail'));
  }

  function closeTile() {
    if (current === null || jumping) return;
    if (depth > 0) {
      jump('close', depth); // onPop chiude e riporta il focus
      return;
    }
    history.replaceState(null, '', location.pathname + location.search);
    params = {};
    refocus(show(null));
  }

  function onPop() {
    const h = parseHash(location.hash);
    const kind = jumping;
    jumping = null;
    clearTimeout(jumpTimer);
    if (kind === 'close') {
      depth = 0;
      if (h) history.replaceState(null, '', location.pathname + location.search); // aperta da un link diretto: si chiude davvero
      params = {};
      refocus(show(null));
      return;
    }
    if (!h && current === null) return;
    depth = history.state?.depth ?? (history.state?.tema != null ? 1 : 0);
    // Con la card aperta valgono i parametri di adesso: Indietro e Avanti cambiano card ed elemento, non il ruolo scelto nel frattempo.
    params = !h ? {} : current === null ? h.params : params;
    canonical(h && { ...h, params });
    if (!h && location.hash) {
      show(null); // ancora interna (#stato, #crediti, #temi): chiude la card e lascia la pagina dove va il link
      return;
    }
    const again = h != null && current === h.tema && currentEl !== h.elemento; // stessa card, altro elemento: scheda ricreata
    const p = show(h?.tema ?? null, h?.elemento ?? null, again);
    if (!h) refocus(p);
  }

  // Aperture chieste dal codice (il clic su un punto del radar): come un link.
  $effect(() => {
    const onApri = (e: Event) => {
      const { tema, elemento } = (e as CustomEvent<{ tema: TileId; elemento: string | null }>).detail;
      openTile(tema, elemento);
    };
    document.addEventListener(APRI, onApri);
    return () => document.removeEventListener(APRI, onApri);
  });

  // Un parametro cambiato dalla card (il ruolo): il link si aggiorna al suo posto.
  // In ascolto da subito, non in un $effect: la card aperta da un link diretto lo chiede già quando si monta.
  function onImposta(e: Event) {
    const { chiave, valore } = (e as CustomEvent<{ chiave: string; valore: string | null }>).detail;
    if (current === null) return;
    const { [chiave]: _, ...resto } = params;
    params = valore ? { ...params, [chiave]: valore } : resto;
    history.replaceState(history.state, '', toHash(current, currentEl, params));
  }
  document.addEventListener(IMPOSTA, onImposta);
  onDestroy(() => document.removeEventListener(IMPOSTA, onImposta));

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && current) {
      e.preventDefault();
      closeTile();
    }
  }
</script>

<svelte:window onpopstate={onPop} onkeydown={onKey} />
<svelte:document onclick={onLink} />

<!-- Card aperta: sotto 1200px pillole e dettaglio al posto delle card; da 1200px le card restano in elenco accanto al dettaglio. -->
<div class="board" class:has-open={open !== undefined}>
  {#if open}
    <Pills tiles={TILES.filter((t) => t.id !== openId)} onpick={(id) => openTile(id)} onclose={closeTile} />
  {/if}

  <div class="groups" id="temi">
    {#each TESTE as g (g.id)}
      <section class="group" aria-labelledby="g-{g.id}">
        <h2 id="g-{g.id}" class="g-h">{g.label}</h2>
        <div class="tiles">
          {#each TILES.filter((t) => t.testa === g.id) as t (t.id)}
            <article class="tile" id="tile-{t.id}">
              <TileFace tile={t} {data} {today} expanded={openId === t.id} compact={open !== undefined} onopen={() => toggleTile(t.id)} />
            </article>
          {/each}
        </div>
      </section>
    {/each}
  </div>

  {#if open}
    {@const D = open.Detail}
    <div class="pane">{#key riapri}<D {data} {today} tile={open} {elemento} {params} onclose={closeTile} />{/key}</div>
  {/if}
</div>

<style>
  .board { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--s6); }
  .groups { display: grid; gap: var(--s4); }
  .group { display: grid; gap: var(--s2); }
  .g-h { font-weight: 600; font-size: 20px; line-height: 24px; }
  .tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--s2); }
  @media (max-width: 1040px) { .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 560px) { .tiles { grid-template-columns: minmax(0, 1fr); gap: var(--s1); } }
  .tile, .pane { min-width: 0; }
  .has-open .groups { display: none; }
  @media (min-width: 1200px) {
    .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .has-open { grid-template-columns: 300px minmax(0, 1fr); gap: var(--s4); align-items: start; }
    /* l'elenco resta a vista mentre si scorre il dettaglio */
    .has-open .groups { display: grid; gap: var(--s3); position: sticky; top: var(--s3); max-height: calc(100vh - var(--s6)); overflow-y: auto; padding: 4px; margin: -4px; }
    .has-open .tiles { grid-template-columns: minmax(0, 1fr); gap: var(--s1); }
    .has-open .g-h { font-size: 12px; line-height: 16px; letter-spacing: .06em; text-transform: uppercase; color: var(--fg-2); padding-inline: var(--s1); }
  }
  @media (min-width: 1680px) { .board:not(.has-open) .tiles { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
</style>
