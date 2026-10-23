<script lang="ts">
  import DataTable from '../charts/DataTable.svelte';
  import type { Status } from '../data/types';
  import { day } from '../text/format';

  let { status }: { status: Status | undefined } = $props();

  const NOMI: Record<string, string> = {
    epoch: 'Epoch AI', geopoliticai: 'Epoch (GeopoliticAI)', artificial_analysis: 'Artificial Analysis', arxiv: 'arXiv', github: 'GitHub', huggingface: 'Hugging Face',
    adzuna: 'Adzuna', eurostat: 'Eurostat', eurostat_settori: 'Eurostat (settori)', owid: 'Our World in Data', ai_act: 'AI Act (a mano)', rapporti: 'Rapporti (a mano)',
    feeds: 'Feed delle notizie', risorse: 'Link delle risorse', radar: 'Radar (calcolo)',
  };
  const STATI: Record<string, string> = { ok: 'aggiornata', errore: 'errore', 'non configurata': 'non configurata' };
  const rows = $derived(Object.entries(status?.fonti ?? {}).map(([k, s]) => [
    NOMI[k] ?? k, STATI[s.stato] ?? s.stato, s.ultimo_successo ? day(s.ultimo_successo) : '—', s.stato === 'ok' ? '' : (s.messaggio ?? ''),
  ]));
</script>

<section class="status" id="stato" aria-labelledby="stato-h">
  <h2 id="stato-h">Stato delle fonti</h2>
  {#if rows.length}
    <p class="muted small">Ultimo aggiornamento: {status ? day(status.aggiornato) : '—'}. Una fonte in errore mostra l'ultimo dato valido.</p>
    <DataTable cols={['Fonte', 'Stato', 'Ultimo successo', 'Note']} {rows} />
  {:else}
    <p class="muted small">Nessun aggiornamento registrato ancora.</p>
  {/if}
</section>

<style>
  .status { display: grid; gap: var(--s2); }
  h2 { font-weight: 600; font-size: 20px; line-height: 24px; }
</style>
