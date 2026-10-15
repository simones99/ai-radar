<script lang="ts">
  import { MOVE_MIN, type RadarRowM } from '../data/derive';
  import type { Quadrant } from '../data/types';
  import { signedPts } from '../text/format';

  let { rows, quadranti, highlight = $bindable(null) }: {
    rows: RadarRowM[];
    quadranti: Record<Quadrant, string>;
    highlight?: string | null;
  } = $props();

  const moved = $derived(rows.filter((r) => r.hasPrev).sort((a, b) => Math.abs(b.dC) - Math.abs(a.dC) || b.move - a.move).slice(0, 8));
  const cls = (v: number) => (v > 0.005 ? 'up' : v < -0.005 ? 'down' : 'flat');
</script>

{#if moved.length === 0}
  <p class="note">Il movimento sarà disponibile dal prossimo aggiornamento.</p>
{:else}
  <div class="panel">
    <div class="sum">
      <div><b>{rows.filter((r) => r.changed).length}</b><span>cambi di quadrante</span></div>
      <div><b>{rows.filter((r) => r.hasPrev && r.move >= MOVE_MIN).length}</b><span>spostamenti di almeno 10 punti</span></div>
    </div>
    <div class="head" aria-hidden="true"><span>Competenza</span><span>slancio</span><span>domanda</span></div>
    <ul>
      {#each moved as r (r.id)}
        <li>
          <button type="button" class="row" aria-pressed={highlight === r.id} title={r.nome}
            onpointerenter={() => (highlight = r.id)} onpointerleave={() => (highlight = null)}
            onfocus={() => (highlight = r.id)} onblur={() => (highlight = null)}
            onclick={() => (highlight = highlight === r.id ? null : r.id)}>
            <span class="n">{r.breve}</span>
            <span class="v {cls(r.dS)}">{signedPts(r.dS)}</span>
            <span class="v {cls(r.dD)}">{signedPts(r.dD)}</span>
            {#if r.changed && r.qp}<span class="chip">{quadranti[r.qp]} → {quadranti[r.quadrante]}</span>{/if}
          </button>
        </li>
      {/each}
    </ul>
    <p class="cite">In blu ciò che sale. Passa sopra una riga, o toccala, per trovarla nel grafico.</p>
  </div>
{/if}

<style>
  .panel { display: grid; gap: var(--s2); align-content: start; }
  .note { font-size: 14px; line-height: 24px; color: var(--fg-2); }
  .sum { display: grid; grid-template-columns: 1fr 1fr; gap: var(--s1); }
  .sum div { background: var(--bg); border-radius: var(--r-md); padding: var(--s2); display: grid; gap: 4px; }
  .sum b { font-weight: 600; font-size: 32px; line-height: 40px; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
  .sum span { font-size: 12px; line-height: 16px; color: var(--fg-2); }
  .head, .row { display: grid; grid-template-columns: minmax(0, 1fr) 56px 56px; gap: 0 var(--s1); padding-inline: var(--s1); }
  .head { font-size: 12px; line-height: 16px; color: var(--fg-3); }
  .head span + span { text-align: right; }
  ul { list-style: none; margin: 0; padding: 0; display: grid; }
  li + li { border-top: 1px solid var(--line); }
  .row { all: unset; box-sizing: border-box; width: 100%; min-height: 40px; padding-block: var(--s1); border-radius: var(--r-sm); cursor: pointer; font-size: 14px; line-height: 24px; font-variant-numeric: tabular-nums; display: grid; grid-template-columns: minmax(0, 1fr) 56px 56px; gap: 0 var(--s1); padding-inline: var(--s1); }
  .row:hover, .row[aria-pressed='true'], .row:focus-visible { background: var(--accent-soft); }
  .row:focus-visible { outline: 2px solid var(--accent); }
  .n { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
  .v { text-align: right; }
  .up { color: var(--accent); font-weight: 600; }
  .flat { color: var(--fg-3); }
  .chip { grid-column: 1 / -1; font-size: 12px; line-height: 16px; color: var(--fg-2); }
  .cite { font-size: 12px; line-height: 16px; color: var(--fg-3); }
</style>
