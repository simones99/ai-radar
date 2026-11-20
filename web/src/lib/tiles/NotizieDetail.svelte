<script lang="ts">
  import Block from '../charts/Block.svelte';
  import { parseHash, slug, toHash } from '../router';
  import { capitalize, day, lowerFirst } from '../text/format';
  import { settimanaDelleNotizie, TEMI_NOTIZIE as TEMI } from '../text/frasi';
  import Detail from './Detail.svelte';
  import type { DetailProps } from './types';

  let { data, today, tile, elemento, onclose }: DetailProps = $props();

  const head = $derived(tile.head(data, today));
  const all = $derived(data.news?.notizie ?? []);
  const fonti = $derived([...new Set(all.map((n) => n.fonte))]);
  const temi = $derived([...new Set(all.map((n) => n.tema ?? 'altro'))].sort());
  let fonte = $state<string | null>(null);
  let tema = $state<string | null>(null);
  $effect(() => {
    fonte = fonti.find((f) => elemento && slug(f) === elemento) ?? null;
  });
  const shown = $derived(all.filter((n) => (!fonte || n.fonte === fonte) && (!tema || (n.tema ?? 'altro') === tema)));
  // le stesse 7 giornate del titolo: il numero in testa corrisponde al primo gruppo
  const settimana = $derived(settimanaDelleNotizie(data));
  const gruppi = $derived([
    { nome: capitalize(settimana.periodo), voci: shown.filter((n) => settimana.voci.includes(n)) },
    { nome: 'Prima', voci: shown.filter((n) => !settimana.voci.includes(n)) },
  ].filter((g) => g.voci.length));
  const errori = $derived(Object.keys(data.news?.errori ?? {}));
  // sul telefono le fonti scorrono di lato: la fonte scelta da un link resta a vista, senza muovere la pagina
  let striscia = $state<HTMLDivElement>();
  $effect(() => {
    void fonte;
    const b = striscia?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!striscia || !b) return;
    const s = striscia.getBoundingClientRect(), r = b.getBoundingClientRect();
    if (r.left < s.left || r.right > s.right) striscia.scrollLeft += r.left - s.left - 16;
  });
  function pickFonte(f: string | null) {
    fonte = f;
    history.replaceState(history.state, '', toHash('notizie', f ? slug(f) : null, parseHash(location.hash)?.params)); // i parametri restano
  }
</script>

<Detail {tile} {head} {onclose}>
  <Block span={12} title="Tutte le notizie" note="Le notizie degli ultimi {data.news?.giorni ?? 45} giorni, dalla più recente.">
    <div class="filters">
      <div class="chips" role="group" aria-label="Filtra per fonte" bind:this={striscia}>
        <button type="button" aria-pressed={fonte === null} onclick={() => pickFonte(null)}>Tutte le fonti</button>
        {#each fonti as f (f)}<button type="button" aria-pressed={fonte === f} onclick={() => pickFonte(f)}>{f}</button>{/each}
      </div>
      <div class="chips" role="group" aria-label="Filtra per tema">
        <button type="button" aria-pressed={tema === null} onclick={() => (tema = null)}>Tutti i temi</button>
        {#each temi as t (t)}<button type="button" aria-pressed={tema === t} onclick={() => (tema = t)}>{TEMI[t] ?? t}</button>{/each}
      </div>
    </div>
    {#each gruppi as g (g.nome)}
      <div class="gruppo">
        <h4>{g.nome}</h4>
        <ul class="news" aria-label="Notizie: {lowerFirst(g.nome)}">
          {#each g.voci as n (n.link + '|' + n.fonte)}
            <li>
              <span class="meta">{day(n.data)}</span>
              <span><a href={n.link} target="_blank" rel="noopener">{n.titolo}</a><span class="meta">{n.fonte} · {TEMI[n.tema ?? 'altro'] ?? n.tema}</span></span>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
    {#if !shown.length}<p class="meta">Nessuna notizia con questi filtri.</p>{/if}
    {#if errori.length}<p class="meta">Non raggiunti all'ultimo aggiornamento: {errori.join(', ')}.</p>{/if}
  </Block>
</Detail>

<style>
  .filters { display: grid; gap: var(--s1); }
  .chips { display: flex; flex-wrap: wrap; gap: var(--s1); }
  .chips button { background: var(--bg); border: 0; border-radius: 999px; padding: var(--s1) 12px; min-height: 40px; font-size: 14px; line-height: 24px; cursor: pointer; color: var(--fg-2); }
  .chips button[aria-pressed='true'] { background: var(--fg); color: var(--card); }
  /* sul telefono ogni gruppo sta su una riga che scorre di lato fino al bordo della card, come le pillole dei temi: la prima notizia arriva subito */
  @media (max-width: 560px) {
    .chips { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; margin: -4px calc(-1 * var(--s2)); padding: 4px var(--s4) 4px var(--s2); /* 4px sopra e sotto: l'anello del fuoco non si taglia */
      mask-image: linear-gradient(to right, transparent, #000 var(--s2), #000 calc(100% - 32px), transparent); }
    .chips button { flex: none; white-space: nowrap; }
  }
  /* il titolo del gruppo sta attaccato alla sua prima notizia: lo stacco lo dà già il padding della riga */
  .gruppo { margin-top: var(--s1); }
  .gruppo h4 { font-size: 14px; line-height: 24px; font-weight: 600; color: var(--fg-2); }
  .news { list-style: none; margin: 0; padding: 0; display: grid; }
  .news li { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: var(--s2); padding-block: var(--s2); }
  .news li + li { border-top: 1px solid var(--line); }
  @media (max-width: 560px) { .news li { grid-template-columns: minmax(0, 1fr); gap: 4px; } }
  .news a { font-weight: 500; text-decoration: none; display: block; }
  @media (hover: hover) { .news a:hover { text-decoration: underline; } }
  .meta { font-size: 12px; line-height: 16px; color: var(--fg-3); display: block; }
</style>
