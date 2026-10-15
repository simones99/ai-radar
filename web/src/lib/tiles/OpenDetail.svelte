<script lang="ts">
  import Bars from '../charts/Bars.svelte';
  import Block from '../charts/Block.svelte';
  import DataTable from '../charts/DataTable.svelte';
  import { nf } from '../text/format';
  import { tipoLabel } from '../text/frasi';
  import Detail from './Detail.svelte';
  import type { DetailProps } from './types';

  let { data, today, tile, onclose }: DetailProps = $props();

  const head = $derived(tile.head(data, today));
  const hf = $derived(data.huggingface);
  const tipi = $derived(Object.entries(hf?.tipi_top100 ?? {}).filter(([k]) => k !== 'altro').sort((a, b) => a[1] - b[1]).slice(-6).map(([k, v]) => ({ k: tipoLabel(k), v })));
  const repos = $derived((data.github?.repos ?? []).map((r) => {
    const st = r.storico;
    const last = st[st.length - 1]?.stelle ?? 0;
    const prev = st.length > 1 ? st[st.length - 2].stelle : null;
    return { r, last, delta: prev == null ? '—' : `${last - prev >= 0 ? '+' : '−'}${nf(Math.abs(last - prev))}` };
  }).sort((a, b) => b.last - a.last));
</script>

<Detail {tile} {head} {onclose}>
  <Block span={8} title="Modelli di tendenza su Hugging Face" missing={hf?.top?.length ? null : 'Dati di Hugging Face non disponibili.'}
    cite={hf ? [{ t: 'Fonte: ' }, { t: 'Hugging Face', href: hf.url }, { t: '.' }] : null}>
    <ol class="list">
      {#each (hf?.top ?? []).slice(0, 10) as m (m.id)}
        <li><a href={m.url} target="_blank" rel="noopener">{m.id}</a><span>{tipoLabel(m.tipo)} · {nf(m.like)} like</span></li>
      {/each}
    </ol>
  </Block>
  <Block span={4} title="Che compiti fanno" note="Tipi più frequenti tra i 100 modelli di tendenza." missing={tipi.length ? null : 'Dati di Hugging Face non disponibili.'}
    table={{ cols: ['Tipo', 'Modelli su 100'], rows: tipi.map((t) => [t.k, t.v]) }}>
    <Bars label="Tipi di compito dei modelli di tendenza" data={tipi} />
  </Block>
  <Block span={12} title="Progetti open source da seguire" note="Stelle su GitHub e variazione rispetto alla settimana prima."
    missing={repos.length ? null : 'Dati di GitHub non disponibili.'} cite={[{ t: 'Fonte: ' }, { t: 'GitHub', href: 'https://github.com' }, { t: '.' }]}>
    <DataTable cols={['Repository', 'Stelle', 'In una settimana']} rows={repos.map((x) => [x.r.repo, x.last, x.delta])} />
  </Block>
</Detail>

<style>
  .list { margin: 0; padding-left: var(--s3); display: grid; }
  .list li { padding-block: var(--s1); }
  .list li + li { border-top: 1px solid var(--line); }
  .list a { font-weight: 500; text-decoration: none; overflow-wrap: anywhere; }
  .list a:hover { text-decoration: underline; }
  .list span { display: block; font-size: 12px; line-height: 16px; color: var(--fg-3); }
</style>
