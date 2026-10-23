<script lang="ts">
  import { onMount } from 'svelte';
  import Block from '../charts/Block.svelte';
  import { AREE } from '../data/geopoliticai';
  import { area as areaRicordata } from '../scelta.svelte';
  import { citeGeo, scheda } from '../text/geopoliticai';
  import Detail from './Detail.svelte';
  import type { DetailProps } from './types';

  let { data, today, tile, params, onclose }: DetailProps = $props();

  const head = $derived(tile.head(data, today));
  const g = $derived(data.geopoliticai);
  const validi = $derived(Object.keys(g?.zone ?? {}));
  const zona = $derived(params.area && validi.includes(params.area) ? params.area : 'ue'); // senza una scelta valida, l'UE
  onMount(() => areaRicordata.allinea(params.area, validi));
  const nellUe = $derived(zona === 'ue' || g?.zone[zona]?.tipo === 'paese-ue');
  // i Paesi UE del file, con l'Italia sempre in fondo
  const paesi = $derived(Object.keys(g?.zone ?? {}).filter((k) => g!.zone[k].tipo === 'paese-ue').sort((a, b) => Number(a === 'italia') - Number(b === 'italia')));
  const scegli = (k: string) => areaRicordata.scegli(k === 'ue' ? null : k); // l'UE è la scelta di partenza
  const s = $derived(g && g.zone[zona] ? scheda(g, zona) : null);
</script>

<Detail {tile} {head} {onclose}>
  {#if g}
    <div class="chips" role="group" aria-label="Area">
      {#each AREE as k (k)}<button type="button" aria-pressed={k === 'ue' ? nellUe : zona === k} onclick={() => scegli(k)}>{g.zone[k].nome}</button>{/each}
    </div>
    {#if nellUe}
      <div class="chips" role="group" aria-label="Paesi dell'UE">
        <button type="button" aria-pressed={zona === 'ue'} onclick={() => scegli('ue')}>Tutta l'UE</button>
        {#each paesi as k (k)}<button type="button" aria-pressed={zona === k} onclick={() => scegli(k)}>{g.zone[k].nome}</button>{/each}
      </div>
    {/if}
  {/if}
  <Block span={12} title={s?.titolo ?? 'UE'} missing={s ? null : 'Dati di Epoch AI non disponibili in questo aggiornamento.'} cite={g ? citeGeo(g) : null}>
    {#if s}
      <p class="frase"><strong>{s.frase}</strong></p>
      <div class="due">
        <section aria-labelledby="geo-cap">
          <h4 id="geo-cap">Capacità <span>Epoch Capabilities Index</span></h4>
          {#if s.capacita}
            <p class="fig">{s.capacita.fig}</p>
            <p class="sotto">{s.capacita.sotto}</p>
          {:else}<p class="sotto">nessun modello valutato</p>{/if}
        </section>
        <section aria-labelledby="geo-calc">
          <h4 id="geo-calc">Calcolo di addestramento <span>FLOP del modello più grande</span></h4>
          {#if s.calcolo}
            <p class="fig">{s.calcolo.fig}</p>
            <p class="sotto">{s.calcolo.sotto}</p>
            {#if s.calcolo.nota}<p class="sotto">{s.calcolo.nota}</p>{/if}
          {:else}<p class="sotto">nessun modello di grande scala</p>{/if}
        </section>
      </div>
      {#each s.righe as r, i (i)}<p class="riga">{r}</p>{/each}
    {/if}
  </Block>
</Detail>

<style>
  .chips { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: var(--s1); }
  .chips button { background: var(--card); border: 0; border-radius: 999px; padding: var(--s1) 12px; min-height: 40px; font-size: 14px; line-height: 24px; cursor: pointer; color: var(--fg-2); }
  .chips button[aria-pressed='true'] { background: var(--fg); color: var(--card); }
  .frase { font-size: 18px; line-height: 28px; max-width: 60ch; }
  .due { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--s3); }
  h4 { font-size: 14px; line-height: 20px; font-weight: 600; color: var(--fg-2); }
  h4 span { display: block; font-weight: 400; color: var(--fg-3); }
  .fig { font-weight: 600; font-size: 40px; line-height: 48px; letter-spacing: -.03em; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  .sotto { font-size: 14px; line-height: 20px; color: var(--fg-2); }
  .riga { font-size: 14px; line-height: 24px; color: var(--fg-2); max-width: 70ch; }
  @media (max-width: 560px) { .fig { font-size: 28px; line-height: 32px; } }
</style>
