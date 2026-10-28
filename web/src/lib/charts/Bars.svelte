<script lang="ts">
  import { max } from 'd3-array';
  import { scaleBand, scaleLinear } from 'd3-scale';
  import { nf } from '../text/format';
  import { FONT, measureText } from './labels';

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
  // nomi più larghi dello spazio che hanno anche scrivendone uno ogni "step": barre orizzontali, l'ultima (in evidenza) in cima
  const across = $derived(data.some((d) => measureText(d.k, `400 10px ${FONT}`) > step * x.step() - 4));
  // un nome più largo di metà grafico (come «riconoscimento vocale» in una card stretta) va sopra la sua barra, che prende tutta la larghezza
  const lungo = $derived(Math.max(...data.map((d) => measureText(d.k, `600 12px ${FONT}`))) + 12);
  const sopra = $derived(lungo > w * 0.45);
  const RH = $derived(sopra ? 40 : 28);
  const ml = $derived(sopra ? 0 : lungo);
  const xh = $derived(scaleLinear([0, max(data, (d) => d.v) ?? 1], [ml, w - 48]));
  /** Si scrive la barra in evidenza e una ogni "step", ma non quella che starebbe a meno di uno "step" dall'evidenza: le due etichette si toccherebbero. */
  const scritta = (i: number) => (hotLast && i === data.length - 1) || (i % step === 0 && (!hotLast || data.length - 1 - i >= step));
  /** Il valore sopra la barra non si scrive se, largo com'è, toccherebbe una barra vicina più alta: resta nella tabella. */
  const valore = (i: number) => {
    if (hotLast && i === data.length - 1) return true;
    const c = (x(data[i].k) ?? 0) + x.bandwidth() / 2, half = measureText(format(data[i].v), `400 12px ${FONT}`) / 2 + 2;
    return data.every((d, j) => {
      const x0 = x(d.k) ?? 0;
      return j === i || x0 > c + half || x0 + x.bandwidth() < c - half || y(d.v) > y(data[i].v) - 4;
    });
  };
  const rows = $derived(data.map((d, i) => ({ ...d, hot: hotLast && i === data.length - 1 })).reverse());
</script>

<div class="chart" bind:clientWidth={cw}>
  {#if across}
    <svg viewBox="0 0 {w} {rows.length * RH}" width={w} height={rows.length * RH} role="img" aria-label={label}>
      {#each rows as d, i (d.k)}
        {@const yy = i * RH + (sopra ? 28 : RH / 2)}
        <text class={d.hot ? 't12b hot' : 't12'} x={sopra ? 0 : ml - 12} y={sopra ? yy - 14 : yy + 4} text-anchor={sopra ? 'start' : 'end'}>{d.k}</text>
        <rect class="bar" class:hot={d.hot} x={ml} y={yy - 8} width={Math.max(0, xh(d.v) - ml)} height="16" rx="4" />
        <text class={d.hot ? 't12b hot' : 't12'} x={xh(d.v) + 8} y={yy + 4}>{format(d.v)}</text>
      {/each}
    </svg>
  {:else}
    <svg viewBox="0 0 {w} {height}" width={w} {height} role="img" aria-label={label}>
      {#each data as d, i (d.k)}
        {@const hot = hotLast && i === data.length - 1}
        <rect class="bar" class:hot x={x(d.k)} y={y(d.v)} width={x.bandwidth()} height={y(0) - y(d.v)} rx="6" />
        {#if scritta(i)}
          {#if valore(i)}<text class={hot ? 't12b hot' : 't12'} x={(x(d.k) ?? 0) + x.bandwidth() / 2} y={y(d.v) - 8} text-anchor="middle">{format(d.v)}</text>{/if}
          <text class="t10" x={(x(d.k) ?? 0) + x.bandwidth() / 2} y={height - 8} text-anchor="middle">{d.k}</text>
        {/if}
      {/each}
    </svg>
  {/if}
</div>

<style>
  svg { display: block; width: 100%; height: auto; overflow: visible; }
  .bar { fill: var(--line-2); } .bar.hot { fill: var(--accent); }
</style>
