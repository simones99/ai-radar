<script lang="ts">
  import { onMount, tick, type Snippet } from 'svelte';
  import { PHOTOS } from '../photos';
  import type { Head } from '../text/frasi';
  import { diSpicco, type TileDef } from './types';

  let { tile, head, onclose, children }: { tile: TileDef; head: Head; onclose: () => void; children: Snippet } = $props();

  const photo = $derived(PHOTOS[tile.id]);
  // le card di spicco si aprono sul titolo senza foto; le altre con la foto piccola accanto. In tutte il grafico viene subito dopo
  const spicco = $derived(diSpicco(tile));
  let h2: HTMLHeadingElement;
  let urlInput: HTMLInputElement | undefined = $state();
  let copied = $state(false);
  let fallbackUrl = $state<string | null>(null);

  onMount(() => {
    h2.focus({ preventScroll: true });
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; // jsdom non ha matchMedia
    h2.closest('.detail')?.scrollIntoView?.({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  });

  async function copy() {
    try {
      await navigator.clipboard.writeText(location.href);
      copied = true;
    } catch {
      fallbackUrl = location.href;
      await tick();
      urlInput?.select();
    }
  }
</script>

<section class="detail" class:spicco id="detail-{tile.id}" aria-labelledby="h-{tile.id}" style:view-transition-name="t-{tile.id}">
  <div class="d-hero">
    <div class="d-text">
      <span class="lab">{tile.label}</span>
      <h2 id="h-{tile.id}" tabindex="-1" bind:this={h2}>
        {#each head.title as p, i (i)}{#if p.em}<em>{p.t}</em>{:else}{p.t}{/if}{/each}
      </h2>
      {#if head.deck}<p class="deck">{head.deck}</p>{/if}
      {#if head.nota}<p class="nota">{head.nota}</p>{/if}
      <div class="actions">
        <button type="button" class="copy" onclick={copy}>{copied ? 'Link copiato' : 'Copia link'}</button>
        <span class="sr" aria-live="polite">{copied ? 'Link copiato' : ''}</span>
        {#if fallbackUrl}<input class="copy-url" readonly value={fallbackUrl} bind:this={urlInput} aria-label="Link da copiare" />{/if}
      </div>
    </div>
    {#if !spicco}
    <figure>
      <span class="ph" style:background-image="url({photo.anteprima})"><img src={photo.src} srcset={photo.srcset} sizes="(max-width: 720px) 100vw, 400px" alt={photo.alt} /></span>
      <figcaption class="credit"><a href={photo.pagina} target="_blank" rel="noopener">Foto</a>: {photo.autore}, {#if photo.licenzaUrl}<a href={photo.licenzaUrl} target="_blank" rel="noopener">{photo.licenza}</a>{:else}{photo.licenza}{/if}</figcaption>
    </figure>
    {/if}
    <button type="button" class="close" aria-label="Chiudi {tile.label}" onclick={onclose}><svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg></button>
  </div>
  <div class="blocks">{@render children()}</div>
</section>

<style>
  .detail { display: grid; gap: var(--s3); scroll-margin-top: var(--s2); }
  @media (max-width: 560px) { .detail { scroll-margin-top: var(--s8); } }
  /* l'intestazione da giornale: titolo sulla carta, la foto piccola accanto con il suo credito, un filetto sotto; il grafico viene subito dopo */
  .d-hero { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--s3); position: relative; padding-bottom: var(--s4); border-bottom: 1px solid var(--line-2); }
  @media (min-width: 720px) { .d-hero:has(figure) { grid-template-columns: minmax(0, 1fr) clamp(220px, 30%, 360px); gap: var(--s5); align-items: start; } }
  .d-text { display: grid; gap: var(--s2); align-content: start; padding-top: var(--s2); }
  /* il posto del pulsante di chiusura, che c'è solo da 1200px */
  @media (min-width: 1200px) { .spicco .d-text { padding-right: var(--s8); } }
  .lab { font-size: 14px; color: var(--fg-2); font-weight: 600; }
  h2 { font-weight: 600; font-size: clamp(32px, 4vw, 48px); line-height: 1.1; letter-spacing: -.015em; max-width: 20ch; outline: none; }
  h2 em { font-style: normal; color: var(--accent); }
  /* il taglio da titolo di Bricolage è già stretto: la spaziatura resta appena negativa */
  .spicco h2 { font-size: clamp(36px, 5.2vw, 72px); line-height: 1.04; letter-spacing: -.012em; max-width: 17ch; }
  .deck { color: var(--fg-2); font-size: 18px; line-height: 28px; max-width: var(--misura); }
  .nota { font-size: 14px; line-height: 24px; color: var(--fg-2); max-width: var(--misura); }
  figure { display: grid; gap: var(--s1); }
  .ph { display: block; aspect-ratio: 2 / 1; border-radius: var(--r-md); overflow: hidden; background: var(--line) center / cover no-repeat; } /* sotto la foto, finché arriva, la sua anteprima */
  @media (min-width: 720px) { .ph { aspect-ratio: 4 / 3; } }
  .ph img { width: 100%; height: 100%; object-fit: cover; }
  .credit { font-size: 12px; line-height: 16px; color: var(--fg-3); }
  .actions { display: flex; flex-wrap: wrap; gap: var(--s1); align-items: center; }
  .copy { background: var(--card); color: var(--fg); border: 0; border-radius: 999px; padding: var(--s1) var(--s2); min-height: 40px; cursor: pointer; font-size: 14px; box-shadow: var(--shadow); }
  .copy-url { font: inherit; font-size: 14px; border: 1px solid var(--line-2); border-radius: var(--r-sm); padding: var(--s1); min-width: 0; flex: 1 1 240px; background: var(--card); color: var(--fg); }
  /* in alto a destra: sull'angolo della foto, o accanto al titolo in una card di spicco */
  .close { position: absolute; top: var(--s1); right: var(--s1); width: 40px; height: 40px; border-radius: 50%; border: 0; background: var(--card); color: var(--fg); box-shadow: var(--shadow); cursor: pointer; display: grid; place-items: center; padding: 0; }
  .spicco .close { top: 0; right: 0; }
  /* sotto i 1200px chiude la × accanto alle pillole: una sola chiusura per volta */
  @media (max-width: 1199px) { .close { display: none; } }
  .ico { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; }
  @media (hover: hover) { .copy:hover, .close:hover { background: var(--line-2); } }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  /* dodici colonne a ogni larghezza: i blocchi tengono le loro misure (4, 6, 8, 12) e le coppie restano affiancate */
  .blocks { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: var(--s2); }
</style>
