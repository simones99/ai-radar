<script lang="ts">
  import Block from '../charts/Block.svelte';
  import Timeline from '../charts/Timeline.svelte';
  import { monthYear } from '../text/format';
  import Detail from './Detail.svelte';
  import type { DetailProps } from './types';

  let { data, today, tile, onclose }: DetailProps = $props();

  const head = $derived(tile.head(data, today));
  const reps = $derived(data.rapporti?.rapporti ?? []);
  const items = $derived(reps.flatMap((r) => [
    ...r.edizioni.map((e) => ({ date: e.data, title: `${r.nome} ${e.anno}`, text: r.editore, href: e.url })),
    ...(r.prossima_prevista ? [{ date: r.prossima_prevista, title: `${r.nome}, prossima edizione (stima)`, text: r.editore, href: r.url }] : []),
  ]));
</script>

<Detail {tile} {head} {onclose}>
  <Block span={8} title="Uscite dei rapporti" missing={items.length ? null : 'Elenco dei rapporti non disponibile.'}
    cite={[{ t: 'Le prossime uscite sono stimate dalle edizioni precedenti. I link portano ai rapporti originali.' }]}>
    <Timeline label="Uscite dei rapporti periodici" {items} {today} />
  </Block>
  <Block span={4} title="I rapporti seguiti">
    <ul class="list">
      {#each reps as r (r.nome)}
        <li>
          <a href={r.url} target="_blank" rel="noopener">{r.nome}</a>
          <span>{r.editore} · {r.cadenza}</span>
          {#if r.prossima_prevista}<span>Prossima prevista: {monthYear(r.prossima_prevista)} (stima)</span>{/if}
        </li>
      {/each}
    </ul>
  </Block>
</Detail>

<style>
  .list { list-style: none; margin: 0; padding: 0; display: grid; }
  .list li { display: grid; gap: 4px; padding-block: var(--s2); }
  .list li + li { border-top: 1px solid var(--line); }
  .list a { font-weight: 600; text-decoration: none; }
  @media (hover: hover) { .list a:hover { text-decoration: underline; } }
  .list span { font-size: 12px; line-height: 16px; color: var(--fg-3); }
</style>
