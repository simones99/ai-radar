<script lang="ts">
  import Block from '../charts/Block.svelte';
  import { citeGeo, scheda } from '../text/geopoliticai';
  import Detail from './Detail.svelte';
  import type { DetailProps } from './types';

  let { data, today, tile, onclose }: DetailProps = $props();

  const head = $derived(tile.head(data, today));
  const g = $derived(data.geopoliticai);
  const zona = 'ue'; // senza una scelta è in evidenza l'UE (la scelta dell'area arriva con il ticket 12)
  const s = $derived(g && g.zone[zona] ? scheda(g, zona) : null);
</script>

<Detail {tile} {head} {onclose}>
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
          {:else}<p class="sotto">nessun modello di grande scala</p>{/if}
        </section>
      </div>
      {#each s.righe as r, i (i)}<p class="riga">{r}</p>{/each}
    {/if}
  </Block>
</Detail>

<style>
  .frase { font-size: 18px; line-height: 28px; max-width: 60ch; }
  .due { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--s3); }
  h4 { font-size: 14px; line-height: 20px; font-weight: 600; color: var(--fg-2); }
  h4 span { display: block; font-weight: 400; color: var(--fg-3); }
  .fig { font-weight: 600; font-size: 40px; line-height: 48px; letter-spacing: -.03em; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  .sotto { font-size: 14px; line-height: 20px; color: var(--fg-2); }
  .riga { font-size: 14px; line-height: 24px; color: var(--fg-2); max-width: 70ch; }
  @media (max-width: 560px) { .fig { font-size: 28px; line-height: 32px; } }
</style>
