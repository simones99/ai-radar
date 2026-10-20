<script lang="ts">
  import type { Snippet } from 'svelte';
  import DataTable from './DataTable.svelte';
  import type { Cite, TableData } from './types';

  let { title, note = null, span = 6, cite = null, table = null, missing = null, children }: {
    title: string;
    note?: string | null;
    span?: 4 | 6 | 8 | 12;
    cite?: Cite | null;
    table?: TableData | null;
    missing?: string | null;
    children?: Snippet;
  } = $props();
</script>

<section class="blk w{span}">
  <h3>{title}</h3>
  {#if note}<p class="note">{note}</p>{/if}
  {#if missing}
    <p class="note">{missing}</p>
  {:else if children}
    <svelte:boundary onerror={(e) => console.error(e)}>
      {@render children()}
      {#snippet failed()}<p class="note">Grafico non disponibile.</p>{/snippet}
    </svelte:boundary>
  {/if}
  {#if cite && !missing}
    <p class="cite">
      {#each cite as c, i (i)}{#if c.href}<a href={c.href} target="_blank" rel="noopener">{c.t}</a>{:else}{c.t}{/if}{/each}
    </p>
  {/if}
  {#if table && !missing}
    <details class="data"><summary>Vedi i dati</summary><DataTable cols={table.cols} rows={table.rows} format={table.format} /></details>
  {/if}
</section>

<style>
  .blk { grid-column: span 6; display: grid; gap: var(--s2); align-content: start; min-width: 0; background: var(--card); border-radius: var(--r-lg); box-shadow: var(--shadow); padding: var(--s3); }
  .w4 { grid-column: span 4; } .w8 { grid-column: span 8; } .w12 { grid-column: 1 / -1; }
  @media (max-width: 900px) { .blk { grid-column: 1 / -1; } }
  @media (max-width: 560px) { .blk { padding: var(--s2); } }
  /* da 1200px le colonne del dettaglio sono di larghezza fissa: 8 diventa due colonne, 12 tutta la riga */
  @media (min-width: 1200px) { .blk { grid-column: auto; } .w8 { grid-column: span 2; } .w12 { grid-column: 1 / -1; } }
  h3 { font-weight: 600; font-size: 20px; line-height: 24px; letter-spacing: -.01em; }
  .note { font-size: 14px; line-height: 24px; color: var(--fg-2); }
  .cite { font-size: 12px; line-height: 16px; color: var(--fg-3); }
  .cite a { color: inherit; }
  details summary { cursor: pointer; font-size: 14px; color: var(--fg-2); min-height: 40px; display: flex; align-items: center; }
</style>
