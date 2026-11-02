<script lang="ts">
  import DataTable from '../charts/DataTable.svelte';
  import type { Status } from '../data/types';
  import { day } from '../text/format';

  let { status }: { status: Status | undefined } = $props();

  const NOMI: Record<string, string> = {
    epoch: 'Epoch AI', geopoliticai: 'Epoch (GeopoliticAI)', arxiv: 'arXiv', github: 'GitHub', huggingface: 'Hugging Face',
    adzuna: 'Adzuna', eurostat: 'Eurostat', eurostat_settori: 'Eurostat (settori)', owid: 'Our World in Data', ai_act: 'AI Act (a mano)', rapporti: 'Rapporti (a mano)', catena: "Catena dell'AI (dati curati)",
    feeds: 'Feed delle notizie', risorse: 'Link delle risorse', radar: 'Radar (calcolo)',
  };
  const STATI: Record<string, string> = { ok: 'aggiornata', errore: 'errore', 'non configurata': 'non configurata' };
  const fonti = $derived(Object.entries(status?.fonti ?? {}).map(([k, s]) => ({
    nome: NOMI[k] ?? k, stato: STATI[s.stato] ?? s.stato, ultimo: s.ultimo_successo ? day(s.ultimo_successo) : null, nota: s.messaggio ?? '',
    problema: s.stato !== 'ok' || !!s.messaggio, // anche una fonte aggiornata può avere un avviso
  })));
  const rows = $derived(fonti.map((f) => [f.nome, f.stato, f.ultimo ?? '—', f.nota]));
  // con tutto in ordine basta una riga; le fonti in errore o con un avviso si leggono subito, la tabella intera resta chiusa
  const problemi = $derived(fonti.filter((f) => f.problema));
</script>

<section class="status" id="stato" aria-labelledby="stato-h">
  <h2 id="stato-h">Stato delle fonti</h2>
  {#if rows.length}
    <p class="muted small">
      {#if problemi.length}{problemi.length} {problemi.length === 1 ? 'fonte' : 'fonti'} su {rows.length} da controllare.{:else}Tutte le {rows.length} fonti sono aggiornate.{/if}
      Ultimo aggiornamento: {status ? day(status.aggiornato) : '—'}. Una fonte in errore mostra l'ultimo dato valido.
    </p>
    {#if problemi.length}
      <ul class="problemi">
        {#each problemi as { nome, stato, ultimo, nota } (nome)}<li><b>{nome}</b>: {stato}{#if ultimo}, ultimo successo {ultimo}{/if}.{#if nota}<span class="nota">{nota}</span>{/if}</li>{/each}
      </ul>
    {/if}
    <details><summary>Vedi le {rows.length} fonti</summary><DataTable cols={['Fonte', 'Stato', 'Ultimo successo', 'Note']} {rows} /></details>
  {:else}
    <p class="muted small">Nessun aggiornamento registrato ancora.</p>
  {/if}
</section>

<style>
  .status { display: grid; gap: var(--s2); align-content: start; min-width: 0; }
  details { min-width: 0; } /* la tabella scorre dentro, non allarga la pagina */
  h2 { font-weight: 600; font-size: 20px; line-height: 24px; }
  .status > p { max-width: var(--misura); }
  .problemi { margin: 0; padding: 0; list-style: none; display: grid; gap: var(--s1); font-size: 14px; line-height: 20px; max-width: var(--misura); }
  .problemi b { font-weight: 600; }
  .nota { display: block; font-size: 12px; line-height: 16px; color: var(--fg-2); overflow-wrap: anywhere; }
</style>
