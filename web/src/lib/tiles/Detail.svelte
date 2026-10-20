<script lang="ts">
  import { onMount, tick, type Snippet } from 'svelte';
  import { PHOTOS } from '../photos';
  import type { Head } from '../text/frasi';
  import type { TileDef } from './types';

  let { tile, head, onclose, children }: { tile: TileDef; head: Head; onclose: () => void; children: Snippet } = $props();

  const photo = $derived(PHOTOS[tile.id]);
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

<section class="detail" id="detail-{tile.id}" aria-labelledby="h-{tile.id}" style:view-transition-name="t-{tile.id}">
  <div class="d-hero">
    <figure>
      <span class="ph"><img src={photo.src} srcset={photo.srcset} sizes="(max-width: 860px) 100vw, (min-width: 1200px) 80vw, 40vw" alt={photo.alt} /></span>
      <figcaption class="credit"><a href={photo.pagina} target="_blank" rel="noopener">Foto</a>: {photo.autore}, {#if photo.licenzaUrl}<a href={photo.licenzaUrl} target="_blank" rel="noopener">{photo.licenza}</a>{:else}{photo.licenza}{/if}</figcaption>
    </figure>
    <div class="d-text">
      <span class="lab">{tile.label}</span>
      <h2 id="h-{tile.id}" tabindex="-1" bind:this={h2}>
        {#each head.title as p, i (i)}{#if p.em}<em>{p.t}</em>{:else}{p.t}{/if}{/each}
      </h2>
      {#if head.deck}<p class="deck">{head.deck}</p>{/if}
      <div class="actions">
        <button type="button" class="copy" onclick={copy}>{copied ? 'Link copiato' : 'Copia link'}</button>
        <span class="sr" aria-live="polite">{copied ? 'Link copiato' : ''}</span>
        {#if fallbackUrl}<input class="copy-url" readonly value={fallbackUrl} bind:this={urlInput} aria-label="Link da copiare" />{/if}
      </div>
      <button type="button" class="close" aria-label="Chiudi {tile.label}" onclick={onclose}>×</button>
    </div>
  </div>
  <div class="blocks">{@render children()}</div>
</section>

<style>
  .detail { display: grid; gap: var(--s3); scroll-margin-top: var(--s2); }
  @media (max-width: 560px) { .detail { scroll-margin-top: var(--s8); } }
  .d-hero { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: var(--s4); background: var(--card); border-radius: var(--r-lg); box-shadow: var(--shadow); padding: var(--s1); }
  @media (max-width: 860px) { .d-hero { grid-template-columns: minmax(0, 1fr); gap: var(--s2); } }
  figure { display: grid; gap: var(--s1); }
  .ph { display: block; min-height: 280px; height: 100%; border-radius: var(--r-md); overflow: hidden; background: var(--line); }
  @media (max-width: 860px) { .ph { min-height: 0; aspect-ratio: 16 / 9; } }
  .ph img { width: 100%; height: 100%; object-fit: cover; }
  .credit { font-size: 12px; line-height: 16px; color: var(--fg-3); padding-inline: var(--s1); }
  .d-text { display: grid; gap: var(--s2); align-content: center; padding: var(--s3) var(--s8) var(--s3) 0; position: relative; }
  @media (max-width: 860px) { .d-text { padding: 0 var(--s2) var(--s3); } }
  .lab { font-size: 14px; color: var(--fg-2); }
  h2 { font-weight: 600; font-size: clamp(28px, 3.6vw, 40px); line-height: 1.2; letter-spacing: -.025em; text-wrap: balance; max-width: 22ch; outline: none; }
  h2 em { font-style: normal; color: var(--accent); }
  .deck { color: var(--fg-2); max-width: 56ch; }
  .actions { display: flex; flex-wrap: wrap; gap: var(--s1); align-items: center; }
  .copy { background: var(--bg); border: 0; border-radius: 999px; padding: var(--s1) var(--s2); min-height: 40px; cursor: pointer; font-size: 14px; }
  .copy-url { font: inherit; font-size: 14px; border: 1px solid var(--line-2); border-radius: var(--r-sm); padding: var(--s1); min-width: 0; flex: 1 1 240px; background: var(--card); color: var(--fg); }
  .close { position: absolute; top: var(--s2); right: var(--s2); width: 40px; height: 40px; border-radius: 50%; border: 0; background: var(--bg); cursor: pointer; font-size: 24px; line-height: 40px; }
  @media (max-width: 860px) { .close { display: none; } }
  @media (hover: hover) { .copy:hover, .close:hover { background: var(--line-2); } }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .blocks { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: var(--s2); }
  /* da 1200px: foto a tutta larghezza dietro il testo, grafici in colonne da almeno 360px */
  @media (min-width: 1200px) {
    .d-hero { grid-template-columns: minmax(0, 1fr); position: relative; min-height: 400px; padding: 0; overflow: hidden; }
    figure { position: absolute; inset: 0; }
    .ph { border-radius: 0; min-height: 0; }
    .credit { position: absolute; right: var(--s2); bottom: var(--s1); color: rgba(255, 255, 255, .9); text-shadow: 0 1px 2px rgba(0, 0, 0, .6); }
    .d-text { align-content: end; padding: var(--s8) var(--s12) var(--s5) var(--s6); color: #fff;
      background: linear-gradient(90deg, rgba(0, 0, 0, .8) 0%, rgba(0, 0, 0, .6) 45%, rgba(0, 0, 0, 0) 85%); }
    .lab, .deck { color: rgba(255, 255, 255, .9); }
    h2 { font-size: clamp(40px, 3.2vw, 56px); max-width: 18ch; }
    h2 em { color: #8fc4ff; }
    .copy { background: rgba(255, 255, 255, .18); color: #fff; }
    .close { background: rgba(255, 255, 255, .92); color: #121211; }
    @media (hover: hover) { .copy:hover { background: rgba(255, 255, 255, .3); } .close:hover { background: #fff; } }
    .blocks { grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); grid-auto-flow: dense; }
  }
</style>
