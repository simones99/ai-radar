<script lang="ts">
  import { extent, max } from 'd3-array';
  import { scaleLinear } from 'd3-scale';
  import { curveMonotoneX, line } from 'd3-shape';
  import { nf } from '../text/format';
  import { FONT, measureText } from './labels';
  import type { Series, SeriesPt } from './types';

  let { series, label, height = 304, yFormat = (v: number) => nf(v), xFormat = (v: number) => String(Math.round(v)), passo = null }: {
    series: Series[];
    label: string;
    height?: number;
    yFormat?: (v: number) => string;
    xFormat?: (v: number) => string;
    /** Serie con periodi mancanti (Eurostat non ha il 2022): due punti distanti più di passo non si uniscono, ogni punto si disegna e l'asse dice solo i periodi rilevati. */
    passo?: number | null;
  } = $props();

  let cw = $state(0);
  const w = $derived(Math.max(cw, 280));
  const endLabel = (s: Series) => `${s.name} ${yFormat(s.pts[s.pts.length - 1].y)}`;
  // a destra c'è posto per l'etichetta finale più lunga, fino a metà della larghezza
  const r = $derived(Math.min(w * 0.5, Math.max(56, ...series.filter((s) => s.pts.length).map((s) => measureText(endLabel(s), `600 12px ${FONT}`))) + 16));
  const m = $derived({ l: 40, r, t: 16, b: 32 });
  const all = $derived(series.flatMap((s) => s.pts));
  const x = $derived(scaleLinear(extent(all, (p) => p.x) as [number, number], [m.l, w - m.r]));
  const y = $derived(scaleLinear([0, max(all, (p) => p.y) ?? 1], [height - m.b, m.t]).nice());
  const xTicks = $derived(passo ? [...new Set(all.map((p) => p.x))] : x.ticks(Math.max(2, Math.min(6, Math.floor(w / 96)))).filter(Number.isInteger));
  const ordered = $derived(series.slice().sort((a, b) => Number(!!a.hot) - Number(!!b.hot)));
  const path = (pts: SeriesPt[]) => line<SeriesPt>().curve(curveMonotoneX).x((p) => x(p.x)).y((p) => y(p.y))(pts) ?? '';
  /** I tratti senza buchi; un punto isolato non fa tratto. */
  const tratti = (pts: SeriesPt[]): SeriesPt[][] => {
    if (!passo) return [pts];
    const out: SeriesPt[][] = [];
    pts.forEach((p, i) => (i && p.x - pts[i - 1].x <= passo ? out[out.length - 1].push(p) : out.push([p])));
    return out.filter((t) => t.length > 1);
  };
  const ends = $derived.by(() => {
    const e = series.filter((s) => s.pts.length).map((s) => {
      const lp = s.pts[s.pts.length - 1];
      return { s, lp, ty: y(lp.y) };
    }).sort((a, b) => a.ty - b.ty);
    for (let i = 1; i < e.length; i++) e[i].ty = Math.max(e[i].ty, e[i - 1].ty + 16);
    return e;
  });
</script>

<div class="chart" bind:clientWidth={cw}>
  <svg viewBox="0 0 {w} {height}" width={w} {height} role="img" aria-label={label}>
    {#each y.ticks(4) as v (v)}
      <line x1={m.l} x2={w - m.r} y1={y(v)} y2={y(v)} class={v ? 'grid' : 'base'} />
      <text class="t10" x={m.l - 8} y={y(v) + 3} text-anchor="end">{yFormat(v)}</text>
    {/each}
    {#each xTicks as v (v)}<text class="t10" x={x(v)} y={height - 12} text-anchor="middle">{xFormat(v)}</text>{/each}
    {#each ordered as s (s.name)}
      {#each tratti(s.pts) as t (t[0].x)}<path d={path(t)} class="ln" class:hot={s.hot} />{/each}
      {#if passo}
        {#each s.pts as p (p.x)}<circle cx={x(p.x)} cy={y(p.y)} r={s.hot ? 4.5 : 3.5} class="dot" class:hot={s.hot} />{/each}
      {:else if s.pts.length}
        {@const lp = s.pts[s.pts.length - 1]}
        <circle cx={x(lp.x)} cy={y(lp.y)} r={s.hot ? 4.5 : 3.5} class="dot" class:hot={s.hot} />
      {/if}
    {/each}
    {#each ends as e (e.s.name)}
      <text class={e.s.hot ? 't12b hot' : 't12'} x={w - m.r + 10} y={e.ty + 4}>{endLabel(e.s)}</text>
    {/each}
  </svg>
</div>

<style>
  svg { display: block; width: 100%; height: auto; overflow: visible; }
  .grid { stroke: var(--line); } .base { stroke: var(--line-2); }
  .ln { fill: none; stroke: var(--fg-3); stroke-width: 1.5; stroke-linecap: round; }
  .ln.hot { stroke: var(--accent); stroke-width: 2.5; }
  .dot { fill: var(--fg-3); } .dot.hot { fill: var(--accent); }
</style>
