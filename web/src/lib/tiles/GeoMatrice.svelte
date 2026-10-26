<script lang="ts">
  // «Calcolo e capacità per area, anno per anno»: aree e Paesi UE in righe, anni in colonne, una misura alla volta.
  import Block from '../charts/Block.svelte';
  import { classifica, righeMatrice, type Misura } from '../data/geopoliticai';
  import type { Geopoliticai } from '../data/types';
  import { citeGeo, eci, flop, notaMatrice, scheda } from '../text/geopoliticai';

  let { g, zona, onscegli }: { g: Geopoliticai; zona: string; onscegli: (k: string) => void } = $props();

  const TITOLO = 'Calcolo e capacità per area, anno per anno';
  const DA: Record<Misura, number> = { eci: 2023, calcolo: 2020 };
  let misura = $state<Misura>('eci');
  const anni = $derived(Array.from({ length: g.anno_corrente - DA[misura] + 1 }, (_, i) => DA[misura] + i));
  const righe = $derived(righeMatrice(g));
  /** Chi è a zero (oggi l'Italia) ha una riga intera con la nota della sua scheda, al posto delle celle vuote. */
  const notaAZero = (k: string): string | null => {
    const s = scheda(g, k);
    return s.situazione === 'zero' ? s.frase : null;
  };

  interface Cella { testo: string; nome: string; modello: string | null; forza: number }
  /** Quanto la cella è vicina alla prima area dell'anno: per il calcolo in ordini di grandezza (fino a mille volte meno), per l'ECI in punti (fino a 40 sotto). */
  function forza(v: number, y: number): number {
    const primo = classifica(g, misura, y)[0];
    if (!primo) return 0;
    return misura === 'calcolo' ? Math.max(0.08, 1 - Math.log10(primo.v / v) / 3) : Math.max(0.08, 1 - (primo.v - v) / 40);
  }
  function cella(k: string, y: number): Cella {
    const c = g.zone[k][misura][String(y)];
    if (c?.max != null && c.modello) {
      const testo = misura === 'eci' ? eci(c.max) : flop(c.max);
      return { testo, nome: `${testo} ${misura === 'eci' ? 'ECI' : 'FLOP'}, ${c.modello}`, modello: c.modello, forza: Math.min(1, forza(c.max, y)) };
    }
    // le regole della scheda in forma breve: mai 0, mai una cella vuota
    const n = (c as { n?: number } | undefined)?.n ?? 0;
    if (misura === 'calcolo' && n > 0) return { testo: `${n} senza calcolo`, nome: `${n} ${n === 1 ? 'modello' : 'modelli'} di grande scala, senza il calcolo noto`, modello: null, forza: 0 };
    return { testo: 'nessuno', nome: misura === 'eci' ? 'nessun modello valutato' : 'nessun modello di grande scala', modello: null, forza: 0 };
  }
</script>

<Block span={12} title={TITOLO} cite={citeGeo(g)}>
  <div class="tog" role="group" aria-label="Misura">
    <button type="button" aria-pressed={misura === 'eci'} onclick={() => (misura = 'eci')}>Capacità (ECI)</button>
    <button type="button" aria-pressed={misura === 'calcolo'} onclick={() => (misura = 'calcolo')}>Calcolo di addestramento (FLOP)</button>
  </div>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex: la matrice scorre in orizzontale e deve essere raggiungibile da tastiera -->
  <div class="scroll" tabindex="0" role="region" aria-label="{TITOLO}, scorre in orizzontale">
    <table aria-label={TITOLO}>
      <thead>
        <tr>
          <th scope="col">Area</th>
          {#each anni as y (y)}<th scope="col" class:cur={y === g.anno_corrente}>{y}{#if y === g.anno_corrente}{' '}<small>in corso</small>{/if}</th>{/each}
        </tr>
      </thead>
      <tbody>
        {#each righe as k (k)}
          {@const z = g.zone[k]}
          <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions: il clic sulla riga è una scorciatoia, da tastiera c'è il pulsante -->
          <tr class:sel={k === zona} class:paese={z.tipo === 'paese-ue'} onclick={() => onscegli(k)}>
            <th scope="row"><button type="button" aria-pressed={k === zona} onclick={(e) => { e.stopPropagation(); onscegli(k); }}>{z.nome}</button></th>
            {#if notaAZero(k)}
              <td colspan={anni.length} class="zero">{notaAZero(k)}</td>
            {:else}
              {#each anni as y (y)}
                {@const c = cella(k, y)}
                <td class:cur={y === g.anno_corrente} title={c.modello} aria-label={c.nome}><span class="v" class:na={!c.modello} style:--a={c.forza}>{c.testo}</span></td>
              {/each}
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <p class="nota-matrice">{notaMatrice(g, misura)}</p>
</Block>

<style>
  .tog { display: inline-flex; justify-self: start; flex-wrap: wrap; border: 1px solid var(--line); border-radius: 999px; padding: 3px; gap: 3px; }
  .tog button { border: 0; background: none; border-radius: 999px; padding: var(--s1) 12px; min-height: 40px; cursor: pointer; font: inherit; font-size: 14px; color: var(--fg-2); }
  .tog button[aria-pressed='true'] { background: var(--fg); color: var(--card); }
  @media (max-width: 560px) { .tog { border: 0; padding: 0; } }
  .scroll { overflow-x: auto; }
  table { border-collapse: separate; border-spacing: 3px; width: 100%; font-size: 14px; line-height: 20px; font-variant-numeric: tabular-nums; }
  thead th { font-weight: 500; color: var(--fg-3); font-size: 12px; line-height: 16px; text-align: left; padding: var(--s1); white-space: nowrap; }
  thead th small { font-size: inherit; }
  tbody tr { cursor: pointer; }
  tbody th { text-align: left; white-space: nowrap; padding: 0; }
  tbody th button { border: 0; background: none; font: inherit; font-weight: 600; color: var(--fg); cursor: pointer; padding: var(--s1); min-height: 40px; border-radius: 6px; width: 100%; text-align: left; }
  tr.paese th button { font-weight: 400; color: var(--fg-2); padding-left: var(--s3); }
  tbody th button[aria-pressed='true'] { background: var(--fg); color: var(--card); }
  td { padding: 0; min-width: 96px; vertical-align: middle; }
  td.cur { background: repeating-linear-gradient(135deg, transparent 0 6px, var(--line) 6px 7px); }
  .v { display: block; padding: var(--s1); border-radius: 6px; white-space: nowrap; background: color-mix(in srgb, var(--accent) calc(var(--a) * 45%), transparent); }
  tr.sel .v:not(.na) { outline: 2px solid var(--fg); }
  td.zero { padding: var(--s1) 12px; font-size: 14px; line-height: 20px; color: var(--fg-2); border-left: 3px solid var(--accent); background: var(--bg); }
  .nota-matrice { font-size: 14px; line-height: 24px; color: var(--fg-2); max-width: 80ch; }
  .na { color: var(--fg-3); font-size: 12px; }
</style>
