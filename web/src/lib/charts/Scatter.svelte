<script lang="ts">
  import { extent } from 'd3-array';
  import { scaleLinear, scaleLog } from 'd3-scale';
  import { nf } from '../text/format';
  import { leader, measureText, placeLabels } from './labels';

  type Pt = { x: number; y: number; label?: string; hot?: boolean };
  let { pts, label, xLog = false, yLog = false, xFormat = (v: number) => nf(v), yFormat = (v: number) => nf(v), xTitle, yTitle, height = 320 }: {
    pts: Pt[];
    label: string;
    xLog?: boolean;
    yLog?: boolean;
    xFormat?: (v: number) => string;
    yFormat?: (v: number) => string;
    xTitle: string;
    yTitle: string;
    height?: number;
  } = $props();

  let cw = $state(0);
  const w = $derived(Math.max(cw, 280));
  const m = { l: 48, r: 16, t: 16, b: 40 };
  const x = $derived((xLog ? scaleLog() : scaleLinear()).domain(extent(pts, (p) => p.x) as [number, number]).range([m.l, w - m.r]).nice());
  const y = $derived((yLog ? scaleLog() : scaleLinear()).domain(extent(pts, (p) => p.y) as [number, number]).range([height - m.b, m.t]).nice());
  const powers = (t: number[], log: boolean) => (log ? t.filter((v) => Number.isInteger(Math.log10(v))) : t);
  const xTicks = $derived(powers(x.ticks(5), xLog).slice(0, 7));
  const yTicks = $derived(powers(y.ticks(5), yLog).slice(0, 7));
  const labelled = $derived(pts.filter((p) => p.label));
  const boxes = $derived(placeLabels(
    labelled.map((p, i) => ({ id: String(i), x: x(p.x), y: y(p.y), w: measureText(p.label as string, '600 12px sans-serif'), h: 16 })),
    { x0: m.l, y0: m.t, x1: w - m.r, y1: height - m.b },
    pts.map((p) => ({ x0: x(p.x) - 5, y0: y(p.y) - 5, x1: x(p.x) + 5, y1: y(p.y) + 5 })),
  ));
</script>

<div class="chart" bind:clientWidth={cw}>
  <svg viewBox="0 0 {w} {height}" width={w} {height} role="img" aria-label={label}>
    {#each yTicks as v (v)}
      <line x1={m.l} x2={w - m.r} y1={y(v)} y2={y(v)} class="grid" />
      <text class="t10" x={m.l - 8} y={y(v) + 3} text-anchor="end">{yFormat(v)}</text>
    {/each}
    {#each xTicks as v (v)}<text class="t10" x={x(v)} y={height - m.b + 16} text-anchor="middle">{xFormat(v)}</text>{/each}
    <text class="t12" x={(m.l + w - m.r) / 2} y={height - 4} text-anchor="middle">{xTitle}</text>
    <text class="t12" x={m.l} y={m.t - 4}>{yTitle}</text>
    {#each pts as p, i (i)}<circle class="pt" class:hot={p.hot} cx={x(p.x)} cy={y(p.y)} r={p.hot ? 4.5 : 3} />{/each}
    {#each labelled as p, i (i)}
      {@const b = boxes.get(String(i))}
      {#if b}
        {@const l = leader({ id: '', x: x(p.x), y: y(p.y), w: 0, h: 0 }, b)}
        {#if l}<line class="leader" x1={x(p.x)} y1={y(p.y)} x2={l.x2} y2={l.y2} />{/if}
        <text class="t12b halo" class:hot={p.hot} x={b.x0} y={b.y1 - 4}>{p.label}</text>
      {/if}
    {/each}
  </svg>
</div>

<style>
  svg { display: block; width: 100%; height: auto; overflow: visible; }
  .grid { stroke: var(--line); }
  .pt { fill: var(--fg-3); opacity: .55; } .pt.hot { fill: var(--accent); opacity: 1; }
  .leader { stroke: var(--line-2); }
</style>
