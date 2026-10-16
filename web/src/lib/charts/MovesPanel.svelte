<script lang="ts">
  import type { RadarRowM } from '../data/derive';
  import type { Quadrant } from '../data/types';
  import { toHash } from '../router';
  import { per10k, signedPct } from '../text/format';

  let { rows, quadranti, hovered = $bindable(null) }: {
    rows: RadarRowM[];
    quadranti: Record<Quadrant, string>;
    hovered?: string | null; // anteprima nel grafico al passaggio del mouse
  } = $props();

  const moved = $derived(rows.filter((r) => r.hasPrev || r.moving).sort((a, b) => Number(b.changed || !!b.moving) - Number(a.changed || !!a.moving) || Math.abs(b.dC) - Math.abs(a.dC) || b.move - a.move).slice(0, 8));
  const cls = (v: number) => (v > 0.005 ? 'up' : v < -0.005 ? 'down' : 'flat');
  const arrow = (c: string) => (c === 'up' ? '↑' : c === 'down' ? '↓' : '');
  const verso = (c: string) => (c === 'up' ? ', in aumento' : c === 'down' ? ', in calo' : '');
</script>

{#if moved.length === 0}
  <p class="note">Il movimento sarà disponibile dal prossimo aggiornamento.</p>
{:else}
  <div class="panel">
    <div class="sum">
      <div><b>{rows.filter((r) => r.changed).length}</b><span>cambi di quadrante</span></div>
      <div><b>{rows.filter((r) => r.moving).length}</b><span>in movimento verso un altro quadrante</span></div>
    </div>
    <div class="head" aria-hidden="true"><span>Competenza</span><span>slancio</span><span>annunci</span></div>
    <ul>
      {#each moved as r (r.id)}
        {@const cs = cls(r.dS)}
        {@const cd = r.dp == null ? 'flat' : cls(r.dD)}
        <li>
          <a class="row" href={toHash('competenze', r.id)} title={r.nome}
            onpointerenter={(e) => { if (e.pointerType === 'mouse') hovered = r.id; }}
            onpointerleave={(e) => { if (e.pointerType === 'mouse') hovered = null; }}>
            <span class="n">{r.breve}</span>
            <span class="v {cs}"><span class="sr">slancio</span>{" "}{signedPct(r.slancio)}<span class="ar" aria-hidden="true">{arrow(cs)}</span>{#if arrow(cs)}<span class="sr">{verso(cs)}</span>{/if}</span>
            <span class="v {cd}">{per10k(r.domanda)}{" "}<span class="sr">annunci ogni 10mila</span><span class="ar" aria-hidden="true">{arrow(cd)}</span>{#if arrow(cd)}<span class="sr">{verso(cd)}</span>{/if}</span>
            {#if r.changed && r.qp}<span class="chip">{quadranti[r.qp]} → {quadranti[r.quadrante]}</span>{/if}
            {#if r.moving}<span class="chip">in movimento verso {quadranti[r.moving]}</span>{/if}
          </a>
        </li>
      {/each}
    </ul>
    <p class="cite">Valori di oggi: slancio in 6 mesi, annunci ogni 10mila. Freccia e blu: cosa è salito nell’ultimo mese. Passa sopra una riga per trovarla nel grafico; aprila con un clic.</p>
  </div>
{/if}

<style>
  .panel { display: grid; gap: var(--s2); align-content: start; }
  .note { font-size: 14px; line-height: 24px; color: var(--fg-2); }
  .sum { display: grid; grid-template-columns: 1fr 1fr; gap: var(--s1); }
  .sum div { background: var(--bg); border-radius: var(--r-md); padding: var(--s2); display: grid; gap: 4px; }
  .sum b { font-weight: 600; font-size: 32px; line-height: 40px; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
  .sum span { font-size: 12px; line-height: 16px; color: var(--fg-2); }
  .head { display: grid; grid-template-columns: minmax(0, 1fr) 64px 64px; gap: 0 var(--s1); padding-inline: var(--s1); font-size: 12px; line-height: 16px; color: var(--fg-3); }
  .head span + span { text-align: right; }
  ul { list-style: none; margin: 0; padding: 0; display: grid; }
  li + li { border-top: 1px solid var(--line); }
  .row { all: unset; box-sizing: border-box; width: 100%; min-height: 40px; padding-block: var(--s1); border-radius: var(--r-sm); cursor: pointer; font-size: 14px; line-height: 24px; font-variant-numeric: tabular-nums; display: grid; grid-template-columns: minmax(0, 1fr) 64px 64px; gap: 0 var(--s1); padding-inline: var(--s1); }
  .row:focus-visible { background: var(--accent-soft); outline: 2px solid var(--accent); }
  @media (hover: hover) { .row:hover { background: var(--accent-soft); } }
  .n { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
  .v { text-align: right; position: relative; white-space: nowrap; }
  .ar { display: inline-block; width: 1em; text-align: right; }
  .up { color: var(--accent); font-weight: 600; }
  .down { color: var(--fg-2); }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .flat { color: var(--fg-3); }
  .chip { grid-column: 1 / -1; font-size: 12px; line-height: 16px; color: var(--fg-2); }
  .cite { font-size: 12px; line-height: 16px; color: var(--fg-3); }
</style>
