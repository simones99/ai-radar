<script lang="ts">
  import type { Dataset } from '../data/types';
  import { toHash } from '../router';
  import { ruolo, settore } from '../scelta.svelte';
  import { doorItalia, doorPerTe, type Door } from '../text/frasi';
  import { TESTE } from './registry';

  let { data, today }: { data: Dataset; today: Date } = $props();

  const doors = $derived([
    { g: TESTE[0], d: doorPerTe(data, today, ruolo.ricordato()) },
    { g: TESTE[1], d: doorItalia(data, today, settore.ricordato()) },
  ]);
</script>

{#snippet body(g: (typeof TESTE)[number], d: Door)}
  <!-- la testa in una riga sola, il suo nome e il nome della porta: sopra la notizia non c'è un'occhiello in maiuscoletto -->
  <span class="testa"><b>{g.eyebrow}{d.scelta ? ` · ${d.scelta}` : ''}</b>{' '}<span>{g.label}</span></span>
  {#if d.title.length}
    <span class="news">{#each d.title as p, i (i)}{#if p.em}<em>{p.t}</em>{:else}{p.t}{/if}{/each}</span>
  {/if}
  <span class="meta">{d.meta}</span>
{/snippet}

<div class="doors">
  {#each doors as { g, d } (g.id)}
    {#if d.target}
      <a class="door" href={toHash(d.target.tema, d.target.elemento, d.target.params)}>{@render body(g, d)}</a>
    {:else}
      <div class="door">{@render body(g, d)}</div>
    {/if}
  {/each}
</div>

<style>
  .doors { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--s2); }
  @media (max-width: 720px), (min-width: 1200px) { .doors { grid-template-columns: minmax(0, 1fr); } }
  .door { display: grid; gap: var(--s1); align-content: start; padding: var(--s3); background: var(--card); border-radius: var(--r-lg); box-shadow: var(--shadow); color: inherit; text-decoration: none; transition: box-shadow .25s var(--ease), transform .25s var(--ease); }
  a.door:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  @media (hover: hover) { a.door:hover { box-shadow: var(--shadow-up); transform: translateY(-2px); } }
  .testa { font-size: 14px; line-height: 20px; color: var(--fg-2); }
  .testa b { font-weight: 600; color: var(--fg); }
  .testa span { white-space: nowrap; }
  .news { font-weight: 500; font-size: clamp(24px, 2.8vw, 32px); line-height: 1.15; letter-spacing: -.01em; text-wrap: balance; overflow-wrap: anywhere; }
  .news em { font-style: normal; color: var(--accent); font-weight: 700; }
  @media (min-width: 1200px) { .news { font-size: 26px; } }
  .meta { font-size: 12px; line-height: 16px; color: var(--fg-3); }
</style>
