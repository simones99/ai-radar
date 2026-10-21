<script lang="ts">
  import { scaleLinear } from 'd3-scale';
  import { nf } from '../text/format';
  import { FONT, measureText } from './labels';

  let { data, label, unit = '%', maxV = 100, altro = null }: {
    /** now null: si disegna solo il punto vuoto, senza zero; la nota la scrive chi usa il grafico */
    data: { k: string; now: number | null; was?: number | null; hot?: boolean }[];
    label: string;
    unit?: string;
    maxV?: number;
    /** Il punto vuoto è un'altra serie (es. «UE»), non l'anno prima: si scrivono i due valori, «51 · UE 63», dopo il punto più a destra. */
    altro?: string | null;
  } = $props();

  let cw = $state(0);
  const w = $derived(Math.max(cw, 280));
  const lw = $derived(Math.max(48, ...data.map((d) => measureText(d.k, `12px ${FONT}`))) + 16);
  // nomi più larghi di metà grafico (settori, barriere): il nome va sopra la riga dei punti, che prende tutta la larghezza
  const above = $derived(lw > w * 0.45);
  const rh = $derived(above ? 40 : 24);
  const m = $derived({ l: above ? 8 : lw, r: 40, t: 8, b: 24 });
  const H = $derived(m.t + m.b + data.length * rh);
  const x = $derived(scaleLinear([0, maxV], [m.l, w - m.r]));
  const fmt = (v: number) => nf(v, v < 10 ? 1 : 0);
  const coppia = (now: number | null, was: number | null | undefined) =>
    [now != null ? fmt(now) : null, was != null ? `${altro} ${fmt(was)}` : null].filter((t) => t != null).join(' · ');
</script>

<div class="chart" bind:clientWidth={cw}>
  <svg viewBox="0 0 {w} {H}" width={w} height={H} role="img" aria-label={label}>
    {#each [0, 25, 50, 75, 100].map((p) => (p * maxV) / 100) as v (v)}
      <line x1={x(v)} x2={x(v)} y1={m.t} y2={H - m.b} class="grid" />
      <text class="t10" x={x(v)} y={H - 8} text-anchor="middle">{nf(v)}{unit}</text>
    {/each}
    {#each data as d, i (d.k)}
      {@const yy = m.t + i * rh + (above ? 28 : rh / 2)}
      {#if above}
        <text class="{d.hot ? 't12b hot' : 't12'} halo" x={m.l} y={yy - 12}>{d.k}</text>
      {:else}
        <text class={d.hot ? 't12b hot' : 't12'} x={m.l - 12} y={yy + 4} text-anchor="end">{d.k}</text>
      {/if}
      {#if d.was != null}
        {#if d.now != null}<line class="link" class:hot={d.hot} x1={x(d.was)} x2={x(d.now)} y1={yy} y2={yy} />{/if}
        <circle class="was" class:hot={d.hot} cx={x(d.was)} cy={yy} r="3.5" />
      {/if}
      {#if d.now != null}<circle class="now" class:hot={d.hot} cx={x(d.now)} cy={yy} r="4.5" />{/if}
      {#if altro}
        <!-- dopo il punto più a destra, con il nome della serie: nessun numero si legge come quello dell'altro punto -->
        <text class={d.hot ? 't12b hot' : 't12'} x={x(Math.max(d.now ?? 0, d.was ?? 0)) + 10} y={yy + 4}>{coppia(d.now, d.was)}</text>
      {:else if d.now != null}
        <text class={d.hot ? 't12b hot' : 't12'} x={x(d.now) + 10} y={yy + 4}>{fmt(d.now)}</text>
      {/if}
    {/each}
  </svg>
</div>

<style>
  svg { display: block; width: 100%; height: auto; overflow: visible; }
  .grid { stroke: var(--line); }
  .link { stroke: var(--fg-3); stroke-width: 2; opacity: .35; } .link.hot { stroke: var(--accent); }
  .was { fill: var(--card); stroke: var(--fg-3); stroke-width: 1.25; } .was.hot { stroke: var(--accent); }
  .now { fill: var(--fg-3); } .now.hot { fill: var(--accent); }
</style>
