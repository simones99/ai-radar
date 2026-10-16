<script lang="ts">
  import { scaleLinear } from 'd3-scale';
  import { MOVE_MIN, type RadarRowM } from '../data/derive';
  import type { Quadrant } from '../data/types';
  import { per10k, signedPct } from '../text/format';
  import { cambio } from '../text/frasi';
  import { leader, measureText, placeLabels, type Box } from './labels';

  let { rows, quadranti, highlight = null, label = 'Radar delle competenze con il movimento dall’ultimo mese', onpick }: {
    rows: RadarRowM[];
    quadranti: Record<Quadrant, string>;
    highlight?: string | null;
    label?: string;
    onpick?: (id: string) => void; // tocco o clic su un punto
  } = $props();

  const uid = $props.id();
  let cw = $state(0);
  const w = $derived(Math.max(cw, 300));
  const narrow = $derived(w < 520);
  const H = $derived(Math.round(Math.max(384, Math.min(w * 0.72, 544))));
  const m = { l: 24, r: 8, t: 24, b: 40 };
  const x = $derived(scaleLinear([-0.04, 1.04], [m.l, w - m.r]));
  const y = $derived(scaleLinear([-0.04, 1.04], [H - m.b, m.t]));
  const QL = $derived([
    { id: 'consolida' as Quadrant, x: m.l, y: m.t - 8, a: 'start' },
    { id: 'impara-ora' as Quadrant, x: w - m.r, y: m.t - 8, a: 'end' },
    { id: 'osserva' as Quadrant, x: m.l, y: H - m.b + 16, a: 'start' },
    { id: 'prova' as Quadrant, x: w - m.r, y: H - m.b + 16, a: 'end' },
  ]);
  const LH = 16;
  const layout = $derived.by(() => {
    const obstacles: Box[] = QL.map((q) => {
      const tw = measureText(quadranti[q.id], '600 12px sans-serif');
      const x0 = q.a === 'end' ? q.x - tw : q.x;
      return { x0: x0 - 4, y0: q.y - 14, x1: x0 + tw + 4, y1: q.y + 4 };
    });
    rows.forEach((r) => obstacles.push({ x0: x(r.x) - 7, y0: y(r.y) - 7, x1: x(r.x) + 7, y1: y(r.y) + 7 }));
    const order = (r: RadarRowM) => (r.changed ? 0 : r.quadrante === 'impara-ora' ? 1 : 2);
    const items = rows.slice().sort((a, b) => order(a) - order(b)).map((r) => {
      const lines = [r.breve, ...(r.changed && !narrow ? [cambio(r, quadranti)] : [])];
      const wd = Math.max(...lines.map((t, i) => measureText(t, `${i === 0 && r.quadrante === 'impara-ora' ? 600 : 400} 12px sans-serif`)));
      return { id: r.id, x: x(r.x), y: y(r.y), w: wd, h: lines.length * LH, lines, r };
    });
    const boxes = placeLabels(items, { x0: m.l + 2, y0: m.t + 2, x1: w - m.r - 2, y1: H - m.b - 2 }, obstacles);
    return items.map((it) => ({ ...it, box: boxes.get(it.id) as Box }));
  });
  const dim = (id: string) => highlight != null && highlight !== id;
</script>

<div class="chart" bind:clientWidth={cw}>
  <svg viewBox="0 0 {w} {H}" width={w} height={H} role="img" aria-label={label}>
    <defs>
      <marker id="{uid}-hot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" class="mk hot" /></marker>
      <marker id="{uid}-cold" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" class="mk" /></marker>
    </defs>
    <rect class="quad" x={x(0.5)} y={y(1.04)} width={x(1.04) - x(0.5)} height={y(0.5) - y(1.04)} rx="12" />
    <line class="median" x1={x(0.5)} x2={x(0.5)} y1={y(1.04)} y2={y(-0.04)} />
    <line class="median" x1={x(-0.04)} x2={x(1.04)} y1={y(0.5)} y2={y(0.5)} />
    {#each QL as q (q.id)}
      <text class="ql" class:hot={q.id === 'impara-ora'} x={q.x} y={q.y} text-anchor={q.a}>{quadranti[q.id]}</text>
    {/each}
    <text class="t12" x={(x(0) + x(1)) / 2} y={H - 4} text-anchor="middle">Slancio: crescita negli ultimi 3 mesi →</text>
    <text class="t12" transform="translate({m.l - 10},{(y(0) + y(1)) / 2}) rotate(-90)" text-anchor="middle">Domanda →</text>

    {#each rows as r (r.id)}
      {@const hot = r.quadrante === 'impara-ora'}
      <g class="pt" class:dim={dim(r.id)}>
        {#if r.hasPrev && r.move >= MOVE_MIN}
          {@const x0 = x(r.px as number)}
          {@const y0 = y(r.py as number)}
          {@const len = Math.hypot(x(r.x) - x0, y(r.y) - y0) || 1}
          {@const k = (len - 9) / len}
          <circle class="prev" class:hot cx={x0} cy={y0} r="3.5" />
          <line class="arrow" class:hot x1={x0} y1={y0} x2={x0 + (x(r.x) - x0) * k} y2={y0 + (y(r.y) - y0) * k}
            marker-end="url(#{uid}-{hot ? 'hot' : 'cold'})" />
        {/if}
        <circle class="dot" class:hot cx={x(r.x)} cy={y(r.y)} r={hot ? 6 : 4.5} />
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <!-- la tastiera usa il pannello dei movimenti; il cerchio trasparente allarga l'area di tocco e porta il suggerimento -->
        <circle class="hit" cx={x(r.x)} cy={y(r.y)} r="20" onclick={() => onpick?.(r.id)}>
          <title>{r.nome}: {quadranti[r.quadrante]}{r.changed && r.qp ? ` (era ${quadranti[r.qp]})` : ''}. Slancio {signedPct(r.slancio)} in 6 mesi, {per10k(r.domanda)} annunci ogni 10mila{r.incerto ? '. Dato incerto' : ''}.</title>
        </circle>
      </g>
    {/each}

    <g class="lbls">
      {#each layout as it (it.id)}
        {@const l = leader(it, it.box)}
        {#if l}<line class="leader" class:dim={dim(it.id)} x1={it.x} y1={it.y} x2={l.x2} y2={l.y2} />{/if}
        <text class:dim={dim(it.id)} x={it.box.x0} y={it.box.y0 + LH - 4}>
          {#each it.lines as t, i (i)}
            <tspan x={it.box.x0} dy={i ? LH : 0} class="halo {i === 0 ? (it.r.quadrante === 'impara-ora' ? 't12b' : 't12') : 'note'}">{t}</tspan>
          {/each}
        </text>
      {/each}
    </g>
  </svg>
</div>

<style>
  svg { display: block; width: 100%; height: auto; overflow: visible; }
  .quad { fill: var(--accent-soft); }
  .median { stroke: var(--line-2); stroke-dasharray: 2 4; }
  .ql { font: 500 12px var(--font); fill: var(--fg-3); } .ql.hot { fill: var(--accent); font-weight: 600; }
  .dot { fill: var(--fg-3); stroke: var(--card); stroke-width: 2; } .dot.hot { fill: var(--accent); }
  .hit { fill: transparent; cursor: pointer; }
  .prev { fill: var(--card); stroke: var(--fg-3); stroke-width: 1.25; } .prev.hot { stroke: var(--accent); }
  .arrow { stroke: var(--fg-3); stroke-width: 1.5; } .arrow.hot { stroke: var(--accent); }
  .mk { fill: var(--fg-3); } .mk.hot { fill: var(--accent); }
  .leader { stroke: var(--line-2); }
  .note { font: 400 12px var(--font); fill: var(--fg-3); }
  .pt, .lbls text, .leader { transition: opacity .15s; }
  .dim { opacity: .18; }
</style>
