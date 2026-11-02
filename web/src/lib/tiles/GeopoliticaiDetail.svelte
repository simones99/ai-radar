<script lang="ts">
  import { onMount, tick } from 'svelte';
  import Block from '../charts/Block.svelte';
  import { AREE, annoFaccia, paesiUe, valore } from '../data/geopoliticai';
  import { area as areaRicordata } from '../scelta.svelte';
  import { annoTesto, eci, faccia, scheda } from '../text/geopoliticai';
  import Detail from './Detail.svelte';
  import GeoChiAddestra from './GeoChiAddestra.svelte';
  import GeoMappa from './GeoMappa.svelte';
  import GeoMatrice from './GeoMatrice.svelte';
  import type { DetailProps } from './types';

  let { data, today, tile, params, onclose }: DetailProps = $props();

  const head = $derived(tile.head(data, today));
  const g = $derived(data.geopoliticai);
  const validi = $derived(Object.keys(g?.zone ?? {}));
  const zona = $derived(params.area && validi.includes(params.area) ? params.area : 'ue'); // senza una scelta valida, l'UE
  onMount(() => areaRicordata.allinea(params.area, validi));
  const paesi = $derived(g ? paesiUe(g) : []);
  const scegli = (k: string) => areaRicordata.scegli(k === 'ue' ? null : k); // l'UE è la scelta di partenza
  const s = $derived(g && g.zone[zona] ? scheda(g, zona) : null);
  // la risposta al titolo, sempre sull'UE come la card in home, anche con un'altra area scelta
  const distacco = $derived(g ? faccia(g) : null);
  const annoDistacco = $derived(g ? annoFaccia(g) : 0);
  const treAree = $derived(g ? (['usa', 'cina', 'ue'] as const).flatMap((k) => valore(g, k, 'eci', annoDistacco) ?? []) : []);
  /** Dalla matrice: sceglie l'area, porta la scheda in vista e le dà il focus. */
  async function apriScheda(k: string) {
    scegli(k);
    await tick();
    const el = document.getElementById('geo-scheda');
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el?.scrollIntoView?.({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    el?.focus({ preventScroll: true });
  }
  /** Alla sezione della mappa quando c'è, altrimenti in fondo al dettaglio. */
  function versoLaMappa() {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const mappa = document.getElementById('geo-mappa');
    (mappa ?? document.getElementById('detail-geopoliticai'))?.scrollIntoView?.({ block: mappa ? 'start' : 'end', behavior: reduce ? 'auto' : 'smooth' });
  }
</script>

<Detail {tile} {head} {onclose}>
  <!-- prima la risposta al titolo, il distacco dell'UE; poi la mappa della catena, la scheda dell'area scelta, la matrice e chi addestra -->
  {#if g && distacco}
    <div class="distacco">
      <p class="cifra"><strong>{distacco.fig}</strong> {distacco.unit}</p>
      <dl>
        {#each treAree as v (v.zona)}
          <div class:ue={v.zona === 'ue'}><dt>{g.zone[v.zona].nome}</dt><dd>{eci(v.v)}</dd></div>
        {/each}
      </dl>
      <p class="come">
        Capacità del miglior modello di ogni area nel {annoTesto(g, annoDistacco)}, in punti dell'<a href="https://epoch.ai/eci" target="_blank" rel="noopener">Epoch Capabilities Index</a>.
        <button type="button" class="vai" onclick={() => apriScheda('ue')}>Vai alla scheda dell'UE</button>
      </p>
    </div>
  {/if}
  {#if g}
    <GeoMappa {g} catena={data.catena} {zona} anello={params.anello} materiale={params.materiale} siti={params.siti}
      vista={params.vista} filo={params.filo} onscegli={scegli} />
  {/if}
  <Block span={12} id="geo-scheda" title={s?.titolo ?? 'UE'} missing={s ? null : 'Dati di Epoch AI non disponibili in questo aggiornamento.'}>
    {#snippet azione()}
      <!-- un solo menu per l'area: le aree, e dentro l'UE i suoi Paesi; l'area si sceglie anche dalla mappa e dalla matrice -->
      {#if g}
        <label class="area">
          <span>Area</span>
          <select value={zona} onchange={(e) => scegli(e.currentTarget.value)}>
            {#each AREE as k (k)}
              {#if k === 'ue'}
                <option value="ue">UE, tutta</option>
                {#if paesi.length}
                  <optgroup label="Paesi dell'UE">
                    {#each paesi as p (p)}<option value={p}>{g.zone[p].nome}</option>{/each}
                  </optgroup>
                {/if}
              {:else}<option value={k}>{g.zone[k].nome}</option>{/if}
            {/each}
          </select>
        </label>
      {/if}
    {/snippet}
    {#if s}
      <p class="frase"><strong>{s.frase}</strong></p>
      {#if s.situazione !== 'zero'}
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
          {:else}<p class="sotto">{s.calcoloVuoto}</p>{/if}
        </section>
      </div>
      {/if}
      {#each s.righe as r, i (i)}<p class="riga">{r}</p>{/each}
      {#if s.nota}<p class="riga"><em>{s.nota}</em></p>{/if}
      {#if s.mappa}<p><button type="button" class="vai" onclick={versoLaMappa}>{s.mappa}</button></p>{/if}
    {/if}
  </Block>
  {#if g}
    <GeoMatrice {g} {zona} onscegli={apriScheda} />
    <GeoChiAddestra {g} {zona} />
  {/if}
</Detail>

<style>
  /* sulla carta, come il titolo: la riga del giornale tra il titolo e la mappa */
  .distacco { grid-column: 1 / -1; display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: var(--s2) var(--s5); padding-bottom: var(--s3); border-bottom: 1px solid var(--line-2); }
  .cifra { font-size: 22px; line-height: 28px; color: var(--fg-2); }
  .cifra strong { font-weight: 600; font-size: clamp(44px, 6vw, 64px); line-height: 1.05; letter-spacing: -.015em; font-variant-numeric: tabular-nums; color: var(--fg); }
  .distacco dl { display: flex; gap: var(--s4); margin: 0; }
  .distacco dt { font-size: 14px; line-height: 20px; color: var(--fg-2); }
  .distacco dd { margin: 0; font-weight: 600; font-size: 24px; line-height: 28px; font-variant-numeric: tabular-nums; }
  .distacco .ue dd { color: var(--accent); }
  .come { flex: 1 1 100%; font-size: 14px; line-height: 24px; color: var(--fg-2); }
  .area { display: inline-flex; align-items: center; gap: var(--s1); font-size: 14px; line-height: 24px; color: var(--fg-2); }
  /* il menu è sulla carta: prende il fondo della pagina, come le pillole della mappa */
  .area select { background-color: var(--bg); }
  .frase { font-size: 18px; line-height: 28px; max-width: var(--misura); }
  .due { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--s3); }
  h4 { font-size: 14px; line-height: 20px; font-weight: 600; color: var(--fg-2); }
  h4 span { display: block; font-weight: 400; color: var(--fg-3); }
  .fig { font-weight: 600; font-size: 40px; line-height: 48px; letter-spacing: -.03em; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  .sotto { font-size: 14px; line-height: 20px; color: var(--fg-2); }
  .vai { background: none; border: 0; padding: 0; font: inherit; font-size: 14px; line-height: 24px; color: var(--fg); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
  .riga { font-size: 14px; line-height: 24px; color: var(--fg-2); max-width: var(--misura); }
  @media (max-width: 560px) { .fig { font-size: 28px; line-height: 32px; } }
</style>
