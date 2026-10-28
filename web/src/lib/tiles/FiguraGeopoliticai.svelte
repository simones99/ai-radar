<script lang="ts">
  // La figura della card GeopoliticAI in home: la mappa delle tre aree della frase (USA, Cina, UE) colorate per la capacità
  // del loro miglior modello nell'anno della card, come l'anello dei modelli nel dettaglio. Decorativa: i numeri sono nel testo della card.
  import { annoFaccia, valore } from '../data/geopoliticai';
  import type { Dataset } from '../data/types';
  import { CENTRO, PAESI, proietta } from '../geo/mappa';
  import { eci } from '../text/geopoliticai';

  let { data }: { data: Dataset } = $props();

  const g = $derived(data.geopoliticai);
  // l'inquadratura: dalla costa ovest degli USA alla Cina, dalla Scandinavia al Tropico; il mare riempie il resto della card
  const vx = proietta(-136, 48)[0], vy = proietta(0, 72)[1];
  const vw = proietta(146, 42)[0] - vx, VH = proietta(0, 4)[1] - vy;
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
    if (!a) return 'var(--line)';
    return `color-mix(in srgb, var(--k-modelli) ${Math.round(25 + (75 * (a.v - lo)) / (hi - lo || 1))}%, var(--card))`;
  }
  const etichette = $derived(aree.map((a) => {
    const [iso, dx, dy] = DOVE[a.k];
    const [cx, cy] = CENTRO[iso] ?? [vx + vw / 2, vy + VH / 2];
    return { ...a, left: `${((cx + dx - vx) / vw) * 100}%`, top: `${((cy + dy - vy) / VH) * 100}%` };
  }));
</script>

<span class="mappa"><span class="carta" style:aspect-ratio="{vw} / {VH}">
  <svg viewBox="{vx} {vy} {vw} {VH}" aria-hidden="true" focusable="false">
    {#each PAESI as p (p.id)}<path d={p.d} fill={fill(p.id)} />{/each}
  </svg>
  {#each etichette as e (e.k)}
    <span class="et" class:ue={e.k === 'ue'} style:left={e.left} style:top={e.top}>
      <span class="n">{e.nome}</span>{' '}<b>{eci(e.v)}</b>{#if e.k === primo}<span class="segnalino"></span>{/if}
    </span>
  {/each}
</span></span>

<style>
  /* lo stesso colore dell'anello dei modelli nella mappa del dettaglio (GeoMappa) */
  .mappa { --k-modelli: #b2461f; display: grid; align-items: center; width: 100%; height: 100%; overflow: hidden;
    background: color-mix(in srgb, var(--bg) 70%, #9fc3d9); }
  .carta { position: relative; display: block; width: 100%; }
  svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: hidden; }
  path { stroke: var(--card); stroke-width: .5; }
  .et { position: absolute; transform: translate(-50%, -50%); display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;
    font-size: 13px; line-height: 16px; color: var(--fg); text-shadow: 0 0 3px var(--card), 0 0 3px var(--card), 0 0 2px var(--card); }
  .et .n { color: var(--fg-2); }
  .et b { font-size: 16px; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: -.01em; }
  .et.ue .n { color: var(--fg); font-weight: 700; }
  /* il primo: lo stesso «1º» della mappa del dettaglio */
  .segnalino { display: inline-grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; background: var(--fg);
    box-shadow: 0 0 0 1.5px var(--card); color: var(--card); font-size: 10px; line-height: 1; font-weight: 800; letter-spacing: -.02em; text-shadow: none; }
  .segnalino::after { content: '1º'; }
</style>
