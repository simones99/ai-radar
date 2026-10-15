<script lang="ts">
  import { max } from 'd3-array';
  import { scaleBand, scaleLinear } from 'd3-scale';
  import { nf } from '../text/format';

  let { data, label, height = 232, format = (v: number) => nf(v), hotLast = true }: {
    data: { k: string; v: number }[];
    label: string;
    height?: number;
    format?: (v: number) => string;
    hotLast?: boolean;
  } = $props();

  let cw = $state(0);
  const w = $derived(Math.max(cw, 280));
  const x = $derived(scaleBand(data.map((d) => d.k), [0, w]).padding(0.36));
  const y = $derived(scaleLinear([0, max(data, (d) => d.v) ?? 1], [height - 24, 24]));
  // con molte barre e poco spazio si scrive un'etichetta ogni "step"
  const step = $derived(Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(w / 48)))));
</script>

<div class="chart" bind:clientWidth={cw}>
  <svg viewBox="0 0 {w} {height}" width={w} {height} role="img" aria-label={label}>
    {#each data as d, i (d.k)}
      {@const hot = hotLast && i === data.length - 1}
      <rect class="bar" class:hot x={x(d.k)} y={y(d.v)} width={x.bandwidth()} height={y(0) - y(d.v)} rx="6" />
      {#if hot || i % step === 0}
        <text class={hot ? 't12b hot' : 't12'} x={(x(d.k) ?? 0) + x.bandwidth() / 2} y={y(d.v) - 8} text-anchor="middle">{format(d.v)}</text>
        <text class="t10" x={(x(d.k) ?? 0) + x.bandwidth() / 2} y={height - 8} text-anchor="middle">{d.k}</text>
      {/if}
    {/each}
  </svg>
</div>

<style>
  svg { display: block; width: 100%; height: auto; overflow: visible; }
  .bar { fill: var(--line-2); } .bar.hot { fill: var(--accent); }
</style>
