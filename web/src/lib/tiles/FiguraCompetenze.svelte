<script lang="ts">
  // La figura della card Competenze in home: il radar ridotto ai suoi quattro quadranti, con i punti di tutte le competenze
  // e i nomi di quelle da imparare ora; chi è appena entrato porta la scia da dove era un mese fa. Decorativa: la notizia è nel testo della card.
  import { scaleLinear } from 'd3-scale';
  import { radarRows, type RadarRowM } from '../data/derive';
  import type { Dataset, Quadrant } from '../data/types';
  import { FONT, measureText, placeLabels, type Box } from '../charts/labels';

  let { data }: { data: Dataset } = $props();

  const rows = $derived(data.radar ? radarRows(data.radar) : []);
  const quadranti = $derived(data.radar?.quadranti ?? ({ 'impara-ora': 'Impara ora', prova: 'Da provare', consolida: 'Da consolidare', osserva: "Tieni d'occhio" } as Record<Quadrant, string>));
  let cw = $state(0);
  let ch = $state(0);
  const w = $derived(Math.max(cw, 240));
  const h = $derived(Math.max(ch, 180));
  const P = 12; // margine interno dei quadranti
  const G = 3; // la fuga tra i quadranti
  const x = $derived(scaleLinear([-0.04, 1.04], [0, w]));
  const y = $derived(scaleLinear([-0.04, 1.04], [h, 0]));
  const quad = $derived([
    { id: 'consolida' as Quadrant, x0: 0, y0: 0, x1: x(0.5) - G / 2, y1: y(0.5) - G / 2, a: 'start', ty: 'top' },
    { id: 'impara-ora' as Quadrant, x0: x(0.5) + G / 2, y0: 0, x1: w, y1: y(0.5) - G / 2, a: 'end', ty: 'top' },
    { id: 'osserva' as Quadrant, x0: 0, y0: y(0.5) + G / 2, x1: x(0.5) - G / 2, y1: h, a: 'start', ty: 'bottom' },
    { id: 'prova' as Quadrant, x0: x(0.5) + G / 2, y0: y(0.5) + G / 2, x1: w, y1: h, a: 'end', ty: 'bottom' },
  ]);
  const nomi = $derived(quad.map((q) => {
    const hot = q.id === 'impara-ora';
    const tw = measureText(quadranti[q.id], `${hot ? 700 : 600} 13px ${FONT}`);
    const tx = q.a === 'start' ? q.x0 + P : q.x1 - P;
    const ty = q.ty === 'top' ? q.y0 + P + 12 : q.y1 - P;
    return { ...q, hot, tx, ty, box: { x0: (q.a === 'start' ? tx : tx - tw) - 4, y0: ty - 14, x1: (q.a === 'start' ? tx + tw : tx) + 4, y1: ty + 4 } };
  }));
  const scia = (r: RadarRowM) => r.changed && r.quadrante === 'impara-ora' && r.hasPrev;
  const LH = 16;
  const etichette = $derived.by(() => {
    const obstacles: Box[] = nomi.map((n) => n.box);
    rows.forEach((r) => obstacles.push({ x0: x(r.x) - 8, y0: y(r.y) - 8, x1: x(r.x) + 8, y1: y(r.y) + 8 }));
    const items = rows.filter((r) => r.quadrante === 'impara-ora')
      .sort((a, b) => Number(b.changed) - Number(a.changed))
      .map((r) => ({ id: r.id, x: x(r.x), y: y(r.y), w: measureText(r.breve, `600 13px ${FONT}`), h: LH, r }));
    const boxes = placeLabels(items, { x0: x(0.5) + G, y0: 2, x1: w - 2, y1: y(0.5) - G }, obstacles, 9, () => true);
    return items.filter((it) => boxes.has(it.id)).map((it) => ({ ...it, box: boxes.get(it.id) as Box }));
  });
</script>

<span class="radar" bind:clientWidth={cw} bind:clientHeight={ch}>
  <svg viewBox="0 0 {w} {h}" width={w} height={h} aria-hidden="true" focusable="false">
    {#each nomi as q (q.id)}
      <rect class="q" class:hot={q.hot} x={q.x0} y={q.y0} width={Math.max(0, q.x1 - q.x0)} height={Math.max(0, q.y1 - q.y0)} rx="12" />
    {/each}
    {#each nomi as q (q.id)}
      <text class="ql" class:hot={q.hot} x={q.tx} y={q.ty} text-anchor={q.a}>{quadranti[q.id]}</text>
    {/each}
    {#each rows.filter((r) => r.quadrante !== 'impara-ora') as r (r.id)}
      <circle class="dot" cx={x(r.x)} cy={y(r.y)} r="3.5" />
    {/each}
    {#each rows.filter(scia) as r (r.id)}
      <line class="scia" x1={x(r.px as number)} y1={y(r.py as number)} x2={x(r.x)} y2={y(r.y)} />
      <circle class="prev" cx={x(r.px as number)} cy={y(r.py as number)} r="3" />
    {/each}
    {#each rows.filter((r) => r.quadrante === 'impara-ora') as r (r.id)}
      {#if r.changed}<circle class="anello" cx={x(r.x)} cy={y(r.y)} r="11" />{/if}
      <circle class="dot hot" cx={x(r.x)} cy={y(r.y)} r="6" />
    {/each}
    {#each etichette as it (it.id)}
      <text class="lbl halo" x={it.box.x0} y={it.box.y0 + LH - 4}>{it.r.breve}</text>
    {/each}
  </svg>
</span>

<style>
  .radar { display: block; width: 100%; height: 100%; }
  svg { display: block; }
  .q { fill: color-mix(in srgb, var(--fg) 4%, var(--card)); }
  .q.hot { fill: color-mix(in srgb, var(--accent) 14%, var(--card)); }
  .ql { font: 600 13px var(--font); fill: var(--fg-2); }
  .ql.hot { font-weight: 700; fill: var(--accent); }
  .dot { fill: var(--fg-3); stroke: var(--card); stroke-width: 1.5; }
  .dot.hot { fill: var(--accent); stroke-width: 2; }
  .anello { fill: none; stroke: var(--accent); stroke-width: 1.5; }
  .scia { stroke: var(--accent); stroke-width: 1.5; stroke-dasharray: 2 3; stroke-linecap: round; }
  .prev { fill: var(--card); stroke: var(--accent); stroke-width: 1.25; }
  .lbl { font: 600 13px var(--font); fill: var(--fg); }
  .halo { stroke: color-mix(in srgb, var(--accent) 14%, var(--card)); }
</style>
