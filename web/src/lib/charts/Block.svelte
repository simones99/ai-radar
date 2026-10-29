<script lang="ts">
  import type { Snippet } from 'svelte';
  import DataTable from './DataTable.svelte';
  import type { Cite, TableData } from './types';

  let { title, note = null, span = 6, cite = null, table = null, missing = null, id = null, azione, children }: {
    title: string;
    note?: string | null;
    span?: 4 | 6 | 8 | 12;
    cite?: Cite | null;
    table?: TableData | null;
    missing?: string | null;
    /** con un id il blocco può ricevere il focus */
    id?: string | null;
    /** un comando accanto al titolo, che cambia quello che il blocco mostra */
    azione?: Snippet;
    children?: Snippet;
  } = $props();
  // ogni blocco è una regione con il suo titolo: i lettori di schermo ci arrivano per nome
  const uid = $props.id();
  const tid = $derived(`${id ?? uid}-t`);
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex: tabindex è -1 o assente, serve a dare il focus al blocco da codice -->
<section class="blk w{span}" id={id} tabindex={id ? -1 : undefined} aria-labelledby={tid}>
  {#if azione}
    <div class="testa"><h3 id={tid}>{title}</h3>{@render azione()}</div>
  {:else}
    <h3 id={tid}>{title}</h3>
  {/if}
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
  /* ogni blocco è alto quanto il suo contenuto: accanto a uno più lungo non si allunga a vuoto */
  .blk { grid-column: span 6; align-self: start; display: grid; gap: var(--s2); align-content: start; min-width: 0; background: var(--card); border-radius: var(--r-lg); box-shadow: var(--shadow); padding: var(--s3); }
  .w4 { grid-column: span 4; } .w8 { grid-column: span 8; } .w12 { grid-column: 1 / -1; }
  @media (max-width: 900px) { .blk { grid-column: 1 / -1; } }
  @media (max-width: 560px) { .blk { padding: var(--s2); } }
  .testa { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--s1) var(--s2); }
  h3 { font-weight: 600; font-size: 20px; line-height: 24px; letter-spacing: -.01em; }
  .note { font-size: 14px; line-height: 24px; color: var(--fg-2); max-width: 72ch; }
  .cite { font-size: 12px; line-height: 16px; color: var(--fg-3); max-width: 72ch; }
  .cite a { color: inherit; }
</style>
