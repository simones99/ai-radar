<script lang="ts">
  import { onMount } from 'svelte';
  import Block from '../charts/Block.svelte';
  import Timeline from '../charts/Timeline.svelte';
  import { scorrimento } from '../movimento';
  import { day } from '../text/format';
  import Detail from './Detail.svelte';
  import type { DetailProps } from './types';

  let { data, today, tile, elemento, onclose }: DetailProps = $props();

  const head = $derived(tile.head(data, today));
  const items = $derived((data.ai_act?.scadenze ?? []).map((s) => ({ date: s.data, title: s.titolo, text: s.descrizione, href: s.fonte })));
  const policy = $derived((data.news?.notizie ?? []).filter((n) => n.tema === 'politica').slice(0, 8));
  // la linea parte dalle scadenze passate: si arriva su quella del link, o sulla prossima, che è il titolo. Dopo lo scorrimento di Detail, che si monta prima
  onMount(() => {
    const voce = document.querySelector('#detail-norme .tl .hl') ?? document.querySelector('#detail-norme .tl .next');
    voce?.scrollIntoView?.({ block: 'center', behavior: scorrimento() });
  });
</script>

<Detail {tile} {head} {onclose}>
  <Block span={8} title="Linea del tempo dell'AI Act" missing={items.length ? null : "Le scadenze dell'AI Act non sono disponibili in questo aggiornamento."}
    cite={[{ t: "Date dal Regolamento (UE) 2024/1689 e dal Digital Omnibus sull'AI. Ogni voce porta alla fonte ufficiale." }]}>
    <Timeline label="Scadenze dell'AI Act" {items} {today} highlight={elemento} />
  </Block>
  <!-- la linea del tempo è molto più lunga: le notizie restano a vista mentre si scorre, e la colonna non resta vuota -->
  <div class="lato">
    <Block span={4} title="Notizie di policy">
      {#if policy.length}
        <ul class="list" aria-label="Notizie di policy">
          {#each policy as n (n.link + '|' + n.fonte)}
            <li><a href={n.link} target="_blank" rel="noopener">{n.titolo}</a><span>{n.fonte} · {day(n.data)}</span></li>
          {/each}
        </ul>
      {:else}
        <p class="note">Nessuna notizia di policy negli ultimi {data.news?.giorni ?? 45} giorni.</p>
      {/if}
    </Block>
  </div>
</Detail>

<style>
  .lato { grid-column: span 4; min-width: 0; }
  @media (max-width: 900px) { .lato { grid-column: 1 / -1; } }
  @media (min-width: 901px) { .lato > :global(.blk) { position: sticky; top: var(--s3); max-height: calc(100vh - var(--s6)); overflow-y: auto; } }
  .list { list-style: none; margin: 0; padding: 0; display: grid; }
  .list li { display: grid; gap: 4px; padding-block: var(--s2); }
  .list li + li { border-top: 1px solid var(--line); }
  .list a { font-weight: 500; text-decoration: none; }
  @media (hover: hover) { .list a:hover { text-decoration: underline; } }
  .list span, .note { font-size: 12px; line-height: 16px; color: var(--fg-3); }
</style>
