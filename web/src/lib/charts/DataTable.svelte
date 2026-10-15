<script lang="ts">
  import { nf } from '../text/format';
  import type { TableData } from './types';

  let { cols, rows }: TableData = $props();
  const fmt = (v: string | number) => (typeof v === 'number' ? nf(v, Number.isInteger(v) ? 0 : 1) : v);
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class="tw" tabindex="0" role="region" aria-label="Tabella dei dati">
  <table>
    <thead><tr>{#each cols as c (c)}<th scope="col">{c}</th>{/each}</tr></thead>
    <tbody>
      {#each rows as r, i (i)}
        <tr>
          {#each r as v, j (j)}
            {#if j === 0}<th scope="row">{fmt(v)}</th>{:else}<td class:num={typeof v === 'number'}>{fmt(v)}</td>{/if}
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .tw { overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; line-height: 24px; font-variant-numeric: tabular-nums; }
  th, td { text-align: left; padding: var(--s1); border-bottom: 1px solid var(--line); white-space: nowrap; }
  thead th { font-size: 12px; line-height: 16px; color: var(--fg-3); font-weight: 500; }
  tbody th { font-weight: 500; }
  .num { text-align: right; }
</style>
