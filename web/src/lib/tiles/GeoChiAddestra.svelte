<script lang="ts">
  // «Chi addestra i modelli di grande scala»: per ogni anno una barra al 100% con la quota per area. È un conteggio, non una misura di potenza.
  import Block from '../charts/Block.svelte';
  import { AREE } from '../data/geopoliticai';
  import type { Geopoliticai } from '../data/types';
  import { nf } from '../text/format';
  import { fraseChiAddestra } from '../text/geopoliticai';

  let { g, zona }: { g: Geopoliticai; zona: string } = $props();

  const DA = 2020;
  // con un Paese UE scelto è in evidenza l'UE
  const scelta = $derived(g.zone[zona]?.tipo === 'paese-ue' ? 'ue' : zona);
  const n = (k: string, y: number) => g.zone[k].calcolo[String(y)]?.n ?? 0;
  const anni = $derived(
    Array.from({ length: g.anno_corrente - DA + 1 }, (_, i) => DA + i)
      .map((y) => ({ y, per: AREE.map((k) => ({ k, n: n(k, y) })), tot: AREE.reduce((t, k) => t + n(k, y), 0) }))
      .filter((a) => a.tot > 0),
  );
  const nome = (k: string) => g.zone[k].nome;
</script>

<Block span={12} title="Chi addestra i modelli di grande scala" note="Quota dei modelli di grande scala usciti ogni anno, per area. È un conteggio: non dice quanto sono potenti."
  table={{ cols: ['Anno', ...AREE.map(nome), 'Totale'], rows: anni.map((a) => [String(a.y), ...a.per.map((p) => p.n), a.tot]) }}>
  <ul class="legenda">
    {#each AREE as k, i (k)}<li aria-current={k === scelta ? 'true' : undefined}><span class="sw s{i % 2}" class:hot={k === scelta}></span>{nome(k)}</li>{/each}
  </ul>
  <div class="barre">
    {#each anni as a (a.y)}
      <span class="anno">{a.y}{#if a.y === g.anno_corrente}{' '}<small>in corso</small>{/if}</span>
      <div class="barra" role="img" aria-label="{a.y}: {a.per.map((p) => `${nome(p.k)} ${p.n}`).join(', ')}. Totale {a.tot}.">
        {#each a.per as p, i (p.k)}
          {#if p.n}<span class="seg s{i % 2}" class:hot={p.k === scelta} style:flex-grow={p.n} title="{nome(p.k)}: {p.n} ({nf((100 * p.n) / a.tot)}%)"></span>{/if}
        {/each}
      </div>
      <span class="tot">{a.tot}</span>
    {/each}
  </div>
  <p class="frase">{fraseChiAddestra(g, zona)}</p>
</Block>

<style>
  .legenda { display: flex; flex-wrap: wrap; gap: var(--s1) var(--s2); margin: 0; padding: 0; list-style: none; font-size: 12px; line-height: 16px; color: var(--fg-2); }
  .legenda li { display: flex; align-items: center; gap: 6px; }
  .legenda li[aria-current='true'] { color: var(--fg); font-weight: 600; }
  .sw { width: 12px; height: 12px; border-radius: 3px; }
  .barre { display: grid; grid-template-columns: auto 1fr auto; gap: var(--s1) var(--s2); align-items: center; font-size: 12px; line-height: 16px; font-variant-numeric: tabular-nums; }
  .anno { color: var(--fg-3); white-space: nowrap; }
  .anno small { font-size: inherit; }
  .barra { display: flex; height: 20px; gap: 2px; border-radius: 4px; overflow: hidden; min-width: 0; }
  .seg { flex-basis: 0; min-width: 2px; }
  .s0 { background: color-mix(in srgb, var(--fg-3) 45%, var(--card)); }
  .s1 { background: color-mix(in srgb, var(--fg-3) 25%, var(--card)); }
  .hot { background: var(--accent); }
  .tot { color: var(--fg-2); text-align: right; }
  .frase { font-size: 14px; line-height: 24px; color: var(--fg-2); max-width: 70ch; }
</style>
