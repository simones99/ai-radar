<script lang="ts">
  // La figura della card GeopoliticAI in home: la mappa delle tre aree della frase (USA, Cina, UE) colorate per la capacità
  // del loro miglior modello nell'anno della card, come l'anello dei modelli nel dettaglio. Decorativa: i numeri sono nel testo della card.
  import { annoFaccia, valore } from '../data/geopoliticai';
  import type { Dataset } from '../data/types';
  import { CENTRO, PAESI, proietta, tinta } from '../geo/mappa';
  import { eci } from '../text/geopoliticai';

  let { data }: { data: Dataset } = $props();

  const g = $derived(data.geopoliticai);
  // l'inquadratura: dalla costa ovest degli USA alla Cina, dalla Scandinavia al Tropico; fuori da lì la carta continua fino ai bordi del riquadro
  const sinistra = proietta(-136, 48)[0], cima = proietta(0, 72)[1];
  const larga = proietta(146, 42)[0] - sinistra, alta = proietta(0, 4)[1] - cima;
  // dove mettere l'etichetta di ogni area: l'UE sulla Germania, come il dato unico dell'Europa nella mappa del dettaglio
  const DOVE: Record<string, [string, number, number]> = { usa: ['USA', 0, 0], cina: ['CHN', 0, 0], ue: ['DEU', 6, -16] };
  const aree = $derived.by(() => {
    if (!g) return [];
    const y = annoFaccia(g);
    return (['usa', 'cina', 'ue'] as const).flatMap((k) => {
      const v = valore(g, k, 'eci', y);
      return v ? [{ k, v: v.v, nome: g.zone[k].nome, paesi: new Set(g.zone[k].paesi_mappa) }] : [];
    });
  });
  const lo = $derived(Math.min(...aree.map((a) => a.v)) - 10);
  const hi = $derived(Math.max(...aree.map((a) => a.v)));
  const primo = $derived(aree.find((a) => a.v === hi)?.k);
  function fill(iso: string): string {
    const a = aree.find((x) => x.paesi.has(iso));
    return a ? tinta(a.v, lo, hi) : 'var(--line)';
  }
  // misurate, così su un telefono un'etichetta intera resta nel riquadro anche se il suo Paese sta vicino al bordo
  let cartaPx = $state(0);
  let etichettaPx = $state<Record<string, number>>({});
  const etichette = $derived(aree.map((a) => {
    const [iso, dx, dy] = DOVE[a.k];
    const [cx, cy] = CENTRO[iso] ?? [sinistra + larga / 2, cima + alta / 2];
    const frazione = (cx + dx - sinistra) / larga;
    const mezza = (etichettaPx[a.k] ?? 0) / 2 + 4;
    const left = cartaPx ? `${Math.min(Math.max(frazione * cartaPx, mezza), cartaPx - mezza)}px` : `${frazione * 100}%`;
    return { ...a, left, top: `${((cy + dy - cima) / alta) * 100}%` };
  }));
</script>

<span class="mappa scala"><span class="carta" style:aspect-ratio="{larga} / {alta}" bind:clientWidth={cartaPx}>
  <svg viewBox="{sinistra} {cima} {larga} {alta}" aria-hidden="true" focusable="false">
    {#each PAESI as p (p.id)}<path d={p.d} fill={fill(p.id)} />{/each}
  </svg>
  {#each etichette as e (e.k)}
    <span class="et" class:ue={e.k === 'ue'} style:left={e.left} style:top={e.top} bind:clientWidth={etichettaPx[e.k]}>
      <span class="n">{e.nome}</span>{' '}<b>{eci(e.v)}</b>{#if e.k === primo}<span class="segnalino"></span>{/if}
    </span>
  {/each}
</span></span>

<style>
  /* la scala nel colore dell'anello dei modelli, come nella mappa del dettaglio; colori, scala e segnalino stanno in app.css */
  .mappa { --c: var(--k-modelli); display: grid; align-items: center; width: 100%; height: 100%; overflow: hidden;
    background: color-mix(in srgb, var(--bg) 70%, #9fc3d9); }
  .carta { position: relative; display: block; width: 100%; }
  /* il taglio lo fa il riquadro, ai suoi bordi: le terre non si fermano a metà */
  svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
  path { stroke: var(--card); stroke-width: .5; }
  .et { position: absolute; transform: translate(-50%, -50%); display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;
    font-size: 13px; line-height: 16px; color: var(--fg); text-shadow: 0 0 3px var(--card), 0 0 3px var(--card), 0 0 2px var(--card); }
  .et .n { font-weight: 600; }
  .et b { font-size: 16px; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: -.01em; }
  .et.ue .n { font-weight: 700; }
  /* sul telefono il riquadro prende la forma della carta */
  @media (max-width: 560px) { .mappa { height: auto; aspect-ratio: 2 / 1; } }
</style>
