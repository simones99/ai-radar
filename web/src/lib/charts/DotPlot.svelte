<script lang="ts">
  import { scaleLinear } from 'd3-scale';
  import { nf } from '../text/format';
  import { FONT, measureText } from './labels';

  let { data, label, unit = '%', maxV = 100 }: {
    /** now null: si disegna solo il punto vuoto, senza zero e senza etichetta; la nota la scrive chi usa il grafico */
    data: { k: string; now: number | null; was?: number | null; hot?: boolean }[];
    label: string;
    unit?: string;
    maxV?: number;
  } = $props();

  let cw = $state(0);
  const w = $derived(Math.max(cw, 280));
  const lw = $derived(Math.max(48, ...data.map((d) => measureText(d.k, `12px ${FONT}`))) + 16);
  // nomi più larghi di metà grafico (settori, barriere): il nome va sopra la riga dei punti, che prende tutta la larghezza
  const above = $derived(lw > w * 0.45);
  const RH = $derived(above ? 40 : 24);
  const m = $derived({ l: above ? 8 : lw, r: 40, t: 8, b: 24 });
  const H = $derived(m.t + m.b + data.length * RH);
  const x = $derived(scaleLinear([0, maxV], [m.l, w - m.r]));
</script>

<div class="chart" bind:clientWidth={cw}>
  <svg viewBox="0 0 {w} {H}" width={w} height={H} role="img" aria-label={label}>
    {#each [0, 25, 50, 75, 100].map((p) => (p * maxV) / 100) as v (v)}
      <line x1={x(v)} x2={x(v)} y1={m.t} y2={H - m.b} class="grid" />
      <text class="t10" x={x(v)} y={H - 8} text-anchor="middle">{nf(v)}{unit}</text>
    {/each}
    {#each data as d, i (d.k)}
      {@const yy = m.t + i * RH + (above ? 28 : RH / 2)}
      {#if above}
        <text class="{d.hot ? 't12b hot' : 't12'} halo" x={m.l} y={yy - 12}>{d.k}</text>
      {:else}
        <text class={d.hot ? 't12b hot' : 't12'} x={m.l - 12} y={yy + 4} text-anchor="end">{d.k}</text>
      {/if}
      {#if d.was != null}
        {#if d.now != null}<line class="link" class:hot={d.hot} x1={x(d.was)} x2={x(d.now)} y1={yy} y2={yy} />{/if}
        <circle class="was" class:hot={d.hot} cx={x(d.was)} cy={yy} r="3.5" />
      {/if}
      {#if d.now != null}
        <circle class="now" class:hot={d.hot} cx={x(d.now)} cy={yy} r="4.5" />
        <!-- il valore dopo il punto più a destra, per non coprire il punto vuoto quando è più alto -->
        <text class={d.hot ? 't12b hot' : 't12'} x={x(Math.max(d.now, d.was ?? d.now)) + 10} y={yy + 4}>{nf(d.now, d.now < 10 ? 1 : 0)}</text>
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
