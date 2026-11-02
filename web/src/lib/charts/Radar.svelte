<script lang="ts">
  import { scaleLinear } from 'd3-scale';
  import { MOVE_MIN, nx, ny, type RadarRowM } from '../data/derive';
  import type { Quadrant } from '../data/types';
  import { nf, per10k, signedPct } from '../text/format';
  import { cambio } from '../text/frasi';
  import { FONT, hits, leader, measureText, placeLabels, tratti, type Box } from './labels';
  import { inImparaOra, riquadriDelRadar } from './quadranti';

  let { rows, quadranti, highlight = null, delRuolo = null, label = 'Radar delle competenze con il movimento dall’ultimo mese', href, onpick }: {
    rows: RadarRowM[];
    quadranti: Record<Quadrant, string>;
    highlight?: string | null;
    delRuolo?: string[] | null; // competenze del ruolo scelto: le altre si attenuano; null con «Tutti»
    label?: string;
    href?: (id: string) => string; // il link di ogni punto: lo rende raggiungibile da tastiera
    onpick?: (id: string) => void; // tocco, clic o Invio su un punto
  } = $props();

  const uid = $props.id();
  let cw = $state(0);
  const w = $derived(Math.max(cw, 300));
  const narrow = $derived(w < 520);
  const H = $derived(Math.round(Math.max(384, Math.min(w * 0.7, 680))));
  const m = { l: 48, r: 8, t: 24, b: 64 };
  const x = $derived(scaleLinear([-0.04, 1.04], [m.l, w - m.r]));
  const y = $derived(scaleLinear([-0.04, 1.04], [H - m.b, m.t]));
  // Tacche in unità vere sugli assi logaritmici (domini e soglie in derive.ts).
  const XT = [-0.5, -0.25, 0, 0.5, 1];
  const YT = [0.1, 1, 3, 10, 90];
  const xLabel = (v: number) => (v === 0 ? '0' : signedPct(v));
  const yLabel = (v: number) => nf(v, v < 1 ? 1 : 0);
  const MEZZA_FUGA = 2; // px, tra i quadranti: ci passa la linea della soglia
  // i quattro quadranti a tono, staccati dalla fuga
  const riquadri = $derived(riquadriDelRadar({ x0: x(-0.04), y0: y(1.04), x1: x(1.04), y1: y(-0.04) }, x(0.5), y(0.5), MEZZA_FUGA));
  // i nomi dei quadranti, fuori agli angoli
  const angoli = $derived([
    { id: 'consolida' as Quadrant, x: m.l, y: m.t - 8, a: 'start' },
    { id: 'impara-ora' as Quadrant, x: w - m.r, y: m.t - 8, a: 'end' },
    { id: 'osserva' as Quadrant, x: m.l, y: H - m.b + 16, a: 'start' },
    { id: 'prova' as Quadrant, x: w - m.r, y: H - m.b + 16, a: 'end' },
  ]);
  const raggio = (r: RadarRowM) => (r.quadrante === 'impara-ora' ? 6 : 4.5);
  // La scia di un mese: un cuneo da dove era (sottile) a dove è (largo quanto il punto); il verso si legge senza punta.
  const scie = $derived(rows.filter((r) => r.hasPrev && r.move >= MOVE_MIN).map((r) => {
    const x0 = x(r.px as number), y0 = y(r.py as number), x1 = x(r.x), y1 = y(r.y);
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    const nX = -(y1 - y0) / len, nY = (x1 - x0) / len;
    const a = 0.75, b = raggio(r) - 1.5;
    const d = `M${x0 + nX * a},${y0 + nY * a} L${x1 + nX * b},${y1 + nY * b} L${x1 - nX * b},${y1 - nY * b} L${x0 - nX * a},${y0 - nY * a} Z`;
    return { id: r.id, x0, y0, x1, y1, d };
  }));
  const scia = $derived(new Map(scie.map((s) => [s.id, s])));
  // La scia detta a parole: chi non la vede sente dove era il punto un mese fa.
  const mese = (r: RadarRowM) => (scia.has(r.id) ? `. Un mese fa: slancio ${signedPct(r.sp as number)}${r.dp != null ? `, ${per10k(r.dp)} annunci` : ''}` : '');
  // Punti e scie, a tratti di 6 px: né le soglie scritte né le etichette ci si posano sopra.
  const segni = $derived<Box[]>([
    ...rows.map((r) => ({ x0: x(r.x) - 7, y0: y(r.y) - 7, x1: x(r.x) + 7, y1: y(r.y) + 7 })),
    ...scie.flatMap((s) => tratti(s.x0, s.y0, s.x1, s.y1, 3, 8)),
  ]);
  // Le soglie scritte sulle loro linee, nel primo posto libero dai punti e fuori da Impara ora; senza posto non si scrivono:
  // le dice anche la nota sopra il grafico.
  const soglie = $derived.by(() => {
    const spot = (t: string, c: { x: number; y: number; a: 'start' | 'end' }[]) => {
      const tw = measureText(t, `500 11px ${FONT}`);
      return c.map((p) => ({ t, ...p, box: { x0: (p.a === 'start' ? p.x : p.x - tw) - 4, y0: p.y - 11, x1: (p.a === 'start' ? p.x + tw : p.x) + 4, y1: p.y + 4 } }))
        .find((p) => !hits(p.box, segni));
    };
    return [
      spot('↑ almeno 3 annunci ogni 10mila', [
        { x: x(-0.04) + 8, y: y(0.5) - 8, a: 'start' }, { x: x(-0.04) + 8, y: y(0.5) + 16, a: 'start' }, { x: x(1.04) - 8, y: y(0.5) + 16, a: 'end' }]),
      spot('cresce più dell’AI →', [
        { x: x(0.5) + 8, y: y(-0.04) - 8, a: 'start' }, { x: x(0.5) - 8, y: y(-0.04) - 8, a: 'end' }, { x: x(0.5) - 8, y: y(1.04) + 16, a: 'end' }]),
    ].filter((p) => p != null);
  });
  const LH = 16;
  const perNomi = $derived<Box>({ x0: m.l + 2, y0: m.t + 2, x1: w - m.r - 2, y1: H - m.b - 2 }); // dove possono stare i nomi
  const layout = $derived.by(() => {
    const obstacles: Box[] = angoli.map((q) => {
      const tw = measureText(quadranti[q.id], `500 12px ${FONT}`);
      const x0 = q.a === 'end' ? q.x - tw : q.x;
      return { x0: x0 - 4, y0: q.y - 14, x1: x0 + tw + 4, y1: q.y + 4 };
    });
    obstacles.push(...soglie.map((s) => s.box), ...segni);
    // gli anelli: un nome non ci si posa sopra
    rows.filter((r) => r.changed || r.moving).forEach((r) => {
      const a = raggio(r) + (r.changed ? 7 : 5);
      obstacles.push({ x0: x(r.x) - a, y0: y(r.y) - a, x1: x(r.x) + a, y1: y(r.y) + a });
    });
    // Sul telefono le etichette di Impara ora, che si disegnano sempre, scelgono il posto prima di quelle che possono saltare.
    const order = (r: RadarRowM) => (narrow ? (r.quadrante === 'impara-ora' ? 0 : 2) - Number(r.changed) : r.changed ? 0 : r.quadrante === 'impara-ora' ? 1 : 2);
    const items = rows.slice().sort((a, b) => order(a) - order(b)).map((r) => {
      const hot = r.quadrante === 'impara-ora';
      const lines = [r.breve, ...(r.changed && !narrow ? [cambio(r, quadranti)] : [])];
      const wd = Math.max(...lines.map((t, i) => measureText(t, i === 0 && hot ? `600 13px ${FONT}` : `400 12px ${FONT}`)));
      return { id: r.id, x: x(r.x), y: y(r.y), w: wd, h: lines.length * LH, lines, r, hot };
    });
    // Sul telefono un'etichetta senza posto libero, se non è di Impara ora, non si disegna: resta il suggerimento sul punto.
    const skip = (id: string) => narrow && rows.find((r) => r.id === id)?.quadrante !== 'impara-ora';
    const boxes = placeLabels(items, perNomi, obstacles, 10, skip);
    return items.filter((it) => boxes.has(it.id)).map((it) => ({ ...it, box: boxes.get(it.id) as Box }));
  });
  // Da tastiera: se il punto col focus non ha l'etichetta (sul telefono), il nome compare accanto finché resta lì.
  let focused = $state<string | null>(null);
  const tip = $derived.by(() => {
    const r = focused != null && !layout.some((it) => it.id === focused) ? rows.find((q) => q.id === focused) : null;
    if (!r) return null;
    const it = { id: r.id, x: x(r.x), y: y(r.y), w: measureText(r.breve, `600 13px ${FONT}`), h: LH };
    const taken = [...layout.map((l) => l.box), ...soglie.map((l) => l.box), ...segni];
    const b = placeLabels([it], perNomi, taken, 10).get(r.id) as Box;
    return { t: r.breve, x: b.x0, y: b.y0 + LH - 4, hot: inImparaOra(b, x(0.5), y(0.5)), px: it.x, py: it.y, l: leader(it, b) };
  });
  const dim = (id: string) => highlight != null && highlight !== id;
  const altro = (id: string) => highlight == null && delRuolo != null && !delRuolo.includes(id); // durante l'anteprima conta solo quella
</script>

<div class="chart" bind:clientWidth={cw}>
  <svg viewBox="0 0 {w} {H}" width={w} height={H} role="group" aria-label={label}>
    <defs>
      {#each rows as r (r.id)}
        {@const s = scia.get(r.id)}
        {#if s}
          <linearGradient id="{uid}-s-{r.id}" gradientUnits="userSpaceOnUse" x1={s.x0} y1={s.y0} x2={s.x1} y2={s.y1}>
            <stop offset="0" class="st0" class:hot={r.quadrante === 'impara-ora'} />
            <stop offset="1" class="st1" class:hot={r.quadrante === 'impara-ora'} />
          </linearGradient>
        {/if}
      {/each}
    </defs>
    <g aria-hidden="true">
      {#each riquadri as q (q.id)}
        <rect class="quad" class:hot={q.id === 'impara-ora'} x={q.x0} y={q.y0} width={Math.max(0, q.x1 - q.x0)} height={Math.max(0, q.y1 - q.y0)} rx="12" />
      {/each}
      {#each XT as v (v)}
        {#if v !== 0}<line class="tick" x1={x(nx(v))} x2={x(nx(v))} y1={y(1.04)} y2={y(-0.04)} />{/if}
        <text class="t10" x={x(nx(v))} y={H - m.b + 34} text-anchor="middle">{xLabel(v)}</text>
      {/each}
      {#each YT as v (v)}
        {#if v !== 3}<line class="tick" x1={x(-0.04)} x2={x(1.04)} y1={y(ny(v))} y2={y(ny(v))} />{/if}
        <text class="t10" x={m.l - 6} y={y(ny(v)) + 3} text-anchor="end">{yLabel(v)}</text>
      {/each}
      <line class="soglia" x1={x(0.5)} x2={x(0.5)} y1={y(1.04)} y2={y(-0.04)} />
      <line class="soglia" x1={x(-0.04)} x2={x(1.04)} y1={y(0.5)} y2={y(0.5)} />
      {#each soglie as s (s.t)}
        <text class="sl halo" x={s.x} y={s.y} text-anchor={s.a}>{s.t}</text>
      {/each}
      {#each angoli as q (q.id)}
        <text class="ql" class:hot={q.id === 'impara-ora'} x={q.x} y={q.y} text-anchor={q.a}>{quadranti[q.id]}</text>
      {/each}
      <text class="t12" x={(x(0) + x(1)) / 2} y={H - 4} text-anchor="middle">Slancio in 6 mesi, rispetto all’AI →</text>
      <text class="t12" transform="translate(12,{(y(0) + y(1)) / 2}) rotate(-90)" text-anchor="middle">Annunci ogni 10mila →</text>
    </g>

    <!-- prima tutte le scie, poi tutti i punti: una scia non passa mai sopra il punto di un'altra competenza -->
    {#each scie as s (s.id)}
      {@const hot = rows.find((r) => r.id === s.id)?.quadrante === 'impara-ora'}
      <g class="sc" class:dim={dim(s.id)} class:altro={altro(s.id)} aria-hidden="true">
        <path class="scia" d={s.d} fill="url(#{uid}-s-{s.id})" />
        <circle class="prev" class:hot cx={s.x0} cy={s.y0} r="1.75" />
      </g>
    {/each}
    {#each rows as r (r.id)}
      {@const hot = r.quadrante === 'impara-ora'}
      <g class="pt" class:dim={dim(r.id)} class:altro={altro(r.id)}>
        <!-- anello pieno: ha appena cambiato quadrante; tratteggiato: il colore è il quadrante confermato, il calcolo di oggi dà già un altro -->
        {#if r.changed}<circle class="anello" class:hot cx={x(r.x)} cy={y(r.y)} r={raggio(r) + 5.5} aria-hidden="true" />{/if}
        {#if r.moving}<circle class="attesa" class:hot cx={x(r.x)} cy={y(r.y)} r={raggio(r) + 3.5} aria-hidden="true" />{/if}
        <circle class="dot" class:hot class:hollow={r.incerto} cx={x(r.x)} cy={y(r.y)} r={raggio(r)} aria-hidden="true" />
        <!-- il punto è un link: Tab lo raggiunge, Invio lo apre; il cerchio trasparente allarga l'area di tocco e porta il suggerimento -->
        <a class="pick" href={href?.(r.id)} onclick={(e) => { if (onpick) { e.preventDefault(); onpick(r.id); } }}
          onfocus={() => (focused = r.id)} onblur={() => { if (focused === r.id) focused = null; }} aria-labelledby="{uid}-n-{r.id}">
          <title id="{uid}-n-{r.id}">{r.nome}{delRuolo?.includes(r.id) ? ', del tuo ruolo' : ''}: {quadranti[r.quadrante]}{r.changed && r.qp ? ` (era ${quadranti[r.qp]})` : ''}. Slancio {signedPct(r.slancio)} in 6 mesi, {per10k(r.domanda)} annunci ogni 10mila{r.incerto ? '. Dato incerto' : ''}{r.moving ? `. Il calcolo di oggi dà ${quadranti[r.moving]}, da confermare` : ''}{mese(r)}.</title>
          <circle class="hit" cx={x(r.x)} cy={y(r.y)} r="20" />
          <circle class="ring" class:hot cx={x(r.x)} cy={y(r.y)} r={raggio(r) + 4} />
        </a>
      </g>
    {/each}

    <g class="lbls" aria-hidden="true">
      <!-- prima tutte le linee di richiamo, poi tutti i nomi: una linea non passa mai sopra un nome -->
      {#each layout as it (it.id)}
        {@const l = leader(it, it.box)}
        {#if l}<line class="leader" class:dim={dim(it.id)} class:altro={altro(it.id)} x1={it.x} y1={it.y} x2={l.x2} y2={l.y2} />{/if}
      {/each}
      {#each layout as it (it.id)}
        {@const tono = inImparaOra(it.box, x(0.5), y(0.5)) ? 'halo-hot' : 'halo-q'}
        <text class:dim={dim(it.id)} class:altro={altro(it.id)} x={it.box.x0} y={it.box.y0 + LH - 4}>
          {#each it.lines as t, i (i)}
            <tspan x={it.box.x0} dy={i ? LH : 0} class="halo {tono} {i === 0 ? (it.hot ? 'lb-hot' : 't12') : 'note'}">{t}</tspan>
          {/each}
        </text>
      {/each}
      {#if tip}
        {#if tip.l}<line class="leader" x1={tip.px} y1={tip.py} x2={tip.l.x2} y2={tip.l.y2} />{/if}
        <text class="halo lb-hot {tip.hot ? 'halo-hot' : 'halo-q'}" x={tip.x} y={tip.y}>{tip.t}</text>
      {/if}
    </g>
  </svg>
</div>

<style>
  /* i toni dei quadranti: Impara ora nel blu dei dati, gli altri tre in un grigio appena sopra la carta */
  .chart { --q: var(--quadrante); --q-hot: var(--accent-soft); }
  svg { display: block; width: 100%; height: auto; overflow: visible; }
  .quad { fill: var(--q); } .quad.hot { fill: var(--q-hot); }
  .soglia { stroke: var(--line-2); stroke-dasharray: 2 4; }
  .tick { stroke: var(--line); }
  .ql { font: 500 12px var(--font); fill: var(--fg-3); } .ql.hot { fill: var(--accent); font-weight: 600; }
  .sl { font: 500 11px var(--font); fill: var(--fg-3); stroke: var(--q); }
  .dot { fill: var(--fg-3); stroke: var(--card); stroke-width: 2; } .dot.hot { fill: var(--accent); }
  .dot.hollow { fill: var(--card); stroke: var(--fg-3); stroke-width: 1.5; } .dot.hollow.hot { stroke: var(--accent); }
  .anello, .attesa { fill: none; stroke: var(--fg-3); stroke-width: 1.5; } .anello.hot, .attesa.hot { stroke: var(--accent); }
  .attesa { stroke-dasharray: 2 2.5; }
  .st0 { stop-color: var(--fg-3); stop-opacity: .12; } .st1 { stop-color: var(--fg-3); stop-opacity: .5; }
  .st0.hot, .st1.hot { stop-color: var(--accent); }
  .prev { fill: var(--fg-3); opacity: .55; } .prev.hot { fill: var(--accent); }
  .pick { outline: none; cursor: pointer; }
  .hit { fill: transparent; }
  .ring { fill: none; stroke: var(--fg-2); stroke-width: 1.5; opacity: 0; transition: opacity .15s; } .ring.hot { stroke: var(--accent); }
  @media (hover: hover) { .pick:hover .ring { opacity: .6; } }
  .pick:focus-visible .ring { opacity: 1; stroke-width: 2; }
  .leader { stroke: var(--line-2); }
  .lbls { pointer-events: none; } /* nomi e linee di richiamo non coprono i punti, che si toccano */
  .halo-q { stroke: var(--q); } .halo-hot { stroke: var(--q-hot); }
  .lb-hot { font: 600 13px var(--font); fill: var(--fg); }
  .note { font: 400 12px var(--font); fill: var(--fg-3); }
  .pt, .sc, .lbls text, .leader { transition: opacity .15s; }
  /* altri ruoli: i segni si attenuano con l'opacità, il testo con il colore, che resta AA */
  .pt.altro, .sc.altro, .leader.altro { opacity: .35; }
  .lbls text.altro tspan { fill: var(--fg-3); font-weight: 400; }
  .dim { opacity: .18; }
  @media (prefers-reduced-motion: reduce) { .pt, .sc, .lbls text, .leader, .ring { transition: none; } }
</style>
