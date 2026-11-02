<script lang="ts">
  import { nf } from '../text/format';
  import type { TableData } from './types';

  let { cols, rows, format }: TableData = $props();
  const fmt = (v: string | number) => (typeof v === 'number' ? (format ? format(v) : nf(v, Number.isInteger(v) ? 0 : 1)) : v);
  // le colonne con testi lunghi (le note dello Stato delle fonti): impilate prendono tutta la riga, in una colonna stretta andrebbero a capo a ogni parola
  const lunga = $derived(cols.map((_, j) => rows.some((r) => typeof r[j] === 'string' && r[j].length > 32)));
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex: la tabella scorre in orizzontale e deve essere raggiungibile da tastiera -->
<div class="tw scorre" class:impila={cols.length >= 3} tabindex="0" role="region" aria-label="Tabella dei dati">
  <!-- svelte-ignore a11y_no_redundant_roles: i ruoli ripetono quelli della tabella, perché impilata cambia il display e alcuni browser altrimenti la leggono come testo -->
  <table role="table">
    <thead role="rowgroup"><tr role="row">{#each cols as c (c)}<th scope="col" role="columnheader">{c}</th>{/each}</tr></thead>
    <tbody role="rowgroup">
      {#each rows as r, i (i)}
        <tr role="row">
          {#each r as v, j (j)}
            {#if j === 0}<th scope="row" role="rowheader">{fmt(v)}</th>{:else}<td role="cell" class:num={typeof v === 'number'} class:lunga={lunga[j]} data-label={cols[j]}>{fmt(v)}</td>{/if}
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .tw { container-type: inline-size; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; line-height: 24px; font-variant-numeric: tabular-nums; }
  th, td { text-align: left; padding: var(--s1); border-bottom: 1px solid var(--line); white-space: nowrap; }
  thead th { font-size: 12px; line-height: 16px; color: var(--fg-3); font-weight: 500; }
  tbody th { font-weight: 500; }
  .num { text-align: right; }
  /* in uno spazio stretto, da tre colonne in su, ogni riga si impila: il primo valore sopra, gli altri sotto con il nome della loro colonna */
  @container (max-width: 480px) {
    .impila :is(table, tbody) { display: block; }
    .impila thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    .impila tbody tr { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(7rem, 100%), 1fr)); gap: 4px var(--s2); padding-block: 12px; border-bottom: 1px solid var(--line); }
    .impila :is(tbody th, td) { padding: 0; border: 0; white-space: normal; overflow-wrap: anywhere; text-align: left; }
    .impila :is(tbody th, td.lunga) { grid-column: 1 / -1; }
    /* il valore resta sotto il nome della colonna anche quando un'altra cella della riga è più alta */
    .impila td { display: grid; align-content: start; }
    .impila td::before { content: attr(data-label); font-size: 12px; line-height: 16px; color: var(--fg-3); }
    /* una cella vuota non ha niente da dire: niente nome della colonna, così non aggiunge una riga */
    .impila td:empty::before { content: none; }
  }
</style>
