<script lang="ts">
  import Block from '../charts/Block.svelte';
  import { slug, toHash } from '../router';
  import { day } from '../text/format';
  import Detail from './Detail.svelte';
  import type { DetailProps } from './types';

  let { data, today, tile, elemento, onclose }: DetailProps = $props();

  const head = $derived(tile.head(data, today));
  const all = $derived(data.news?.notizie ?? []);
  const fonti = $derived([...new Set(all.map((n) => n.fonte))]);
  const TEMI: Record<string, string> = { politica: 'Politica', ricerca: 'Ricerca', prodotti: 'Prodotti', business: 'Business', altro: 'Altro' };
  const temi = $derived([...new Set(all.map((n) => n.tema ?? 'altro'))].sort());
  let fonte = $state<string | null>(null);
  let tema = $state<string | null>(null);
  $effect(() => {
    fonte = fonti.find((f) => elemento && slug(f) === elemento) ?? null;
  });
  const shown = $derived(all.filter((n) => (!fonte || n.fonte === fonte) && (!tema || (n.tema ?? 'altro') === tema)));
  const errori = $derived(Object.keys(data.news?.errori ?? {}));
  function pickFonte(f: string | null) {
    fonte = f;
    history.replaceState(history.state, '', toHash('notizie', f ? slug(f) : null));
  }
</script>

<Detail {tile} {head} {onclose}>
  <Block span={12} title="Tutte le notizie" note="Le notizie degli ultimi {data.news?.giorni ?? 45} giorni, dalla più recente.">
    <div class="filters">
      <div class="chips" role="group" aria-label="Filtra per fonte">
        <button type="button" aria-pressed={fonte === null} onclick={() => pickFonte(null)}>Tutte le fonti</button>
        {#each fonti as f (f)}<button type="button" aria-pressed={fonte === f} onclick={() => pickFonte(f)}>{f}</button>{/each}
      </div>
      <div class="chips" role="group" aria-label="Filtra per tema">
        <button type="button" aria-pressed={tema === null} onclick={() => (tema = null)}>Tutti i temi</button>
        {#each temi as t (t)}<button type="button" aria-pressed={tema === t} onclick={() => (tema = t)}>{TEMI[t] ?? t}</button>{/each}
      </div>
    </div>
    <ul class="news" aria-label="Elenco delle notizie">
      {#each shown as n (n.link + '|' + n.fonte)}
        <li>
          <span class="meta">{day(n.data)}</span>
          <span><a href={n.link} target="_blank" rel="noopener">{n.titolo}</a><span class="meta">{n.fonte} · {TEMI[n.tema ?? 'altro'] ?? n.tema}</span></span>
        </li>
      {/each}
    </ul>
    {#if !shown.length}<p class="meta">Nessuna notizia con questi filtri.</p>{/if}
    {#if errori.length}<p class="meta">Non raggiunti all'ultimo aggiornamento: {errori.join(', ')}.</p>{/if}
  </Block>
</Detail>

<style>
  .filters { display: grid; gap: var(--s1); }
  .chips { display: flex; flex-wrap: wrap; gap: var(--s1); }
  .chips button { background: var(--bg); border: 0; border-radius: 999px; padding: var(--s1) 12px; min-height: 40px; font-size: 14px; line-height: 24px; cursor: pointer; color: var(--fg-2); }
  .chips button[aria-pressed='true'] { background: var(--fg); color: var(--card); }
  .news { list-style: none; margin: 0; padding: 0; display: grid; }
  .news li { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: var(--s2); padding-block: var(--s2); }
  .news li + li { border-top: 1px solid var(--line); }
  @media (max-width: 560px) { .news li { grid-template-columns: minmax(0, 1fr); gap: 4px; } }
  .news a { font-weight: 500; text-decoration: none; display: block; }
  @media (hover: hover) { .news a:hover { text-decoration: underline; } }
  .meta { font-size: 12px; line-height: 16px; color: var(--fg-3); display: block; }
</style>
