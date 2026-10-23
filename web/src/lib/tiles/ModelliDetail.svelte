<script lang="ts">
  import Bars from '../charts/Bars.svelte';
  import Block from '../charts/Block.svelte';
  import DataTable from '../charts/DataTable.svelte';
  import Scatter from '../charts/Scatter.svelte';
  import { tNum } from '../data/derive';
  import { toHash } from '../router';
  import { day, monthName, nf } from '../text/format';
  import Detail from './Detail.svelte';
  import type { DetailProps } from './types';

  let { data, today, tile, onclose }: DetailProps = $props();

  const head = $derived(tile.head(data, today));
  const ep = $derived(data.epoch);
  const aa = $derived(data.artificial_analysis);
  const ar = $derived(data.arxiv);
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const pow10 = (v: number) => `10${String(Math.round(Math.log10(v))).split('').map((c) => SUP[Number(c)]).join('')}`;
  const compute = $derived.by(() => {
    if (!ep) return [];
    const frontier = ep.punti.filter((p) => p.f && p.c).sort((a, b) => b.d.localeCompare(a.d)).slice(0, 3).map((p) => p.m);
    return ep.punti.filter((p) => p.c && p.c > 0).map((p) => ({ x: tNum(p.d), y: p.c as number, hot: p.f, label: frontier.includes(p.m) ? p.m : undefined }));
  });
  const aaPts = $derived((aa?.modelli ?? []).filter((m) => m.prezzo && m.prezzo > 0).slice(0, 40)
    .map((m, i) => ({ x: m.prezzo as number, y: m.indice, hot: i < 3, label: i < 3 ? m.nome : undefined })));
  const months = $derived(ar ? ar.mesi.slice(-12) : []);
  const papers = $derived(months.map((m) => ({ k: monthName(m).slice(0, 3), v: ar?.series._totale?.[m] ?? 0 })));
  const open = $derived((ep?.pesi_aperti ?? []).map((p) => ({ k: String(p.anno), v: p.totale ? (100 * p.aperti) / p.totale : 0 })));
  const epCite = $derived(ep ? [{ t: 'Fonte: ' }, { t: 'Epoch AI', href: ep.url }, { t: ' (CC BY 4.0).' }] : null);
</script>

<Detail {tile} {head} {onclose}>
  <Block span={8} title="Calcolo di addestramento dei modelli notevoli" note="FLOP usati per addestrare ogni modello, scala logaritmica. In blu i modelli di frontiera."
    missing={compute.length ? null : 'Dati di Epoch AI non disponibili in questo aggiornamento.'} cite={epCite}
    table={{ cols: ['Modello di frontiera', 'Data', 'FLOP'], rows: (ep?.punti ?? []).filter((p) => p.f && p.c).sort((a, b) => b.d.localeCompare(a.d)).slice(0, 20).map((p) => [p.m, day(p.d), (p.c as number).toExponential(1)]) }}>
    <Scatter label="Calcolo di addestramento dei modelli notevoli" pts={compute} yLog xTitle="anno di pubblicazione" yTitle="FLOP" yFormat={pow10} xFormat={(v) => String(Math.round(v))} />
  </Block>
  <Block span={4} title="Capacità contro prezzo" note="Indice di intelligenza di Artificial Analysis contro prezzo per milione di token, scala logaritmica."
    missing={aaPts.length ? null : 'Serve una chiave gratuita di Artificial Analysis (AA_API_KEY nei secret del repository).'}
    cite={aa ? [{ t: 'Fonte: ' }, { t: 'Artificial Analysis', href: aa.url }, { t: '.' }] : null}
    table={{ cols: ['Modello', '$ per milione di token', 'Indice'], rows: (aa?.modelli ?? []).filter((m) => m.prezzo).slice(0, 40).map((m) => [m.nome, m.prezzo as number, m.indice]) }}>
    <Scatter label="Capacità contro prezzo dei modelli linguistici" pts={aaPts} xLog xTitle="$ per milione di token" yTitle="indice" xFormat={(v) => `$${nf(v, v < 1 ? 2 : 0)}`} />
  </Block>
  <Block title="Paper sull'AI pubblicati ogni mese" note="Nuovi paper nelle categorie informatiche dell'AI su arXiv." missing={papers.length ? null : 'Dati di arXiv non disponibili in questo aggiornamento.'}
    cite={[{ t: 'Fonte: ' }, { t: 'arXiv', href: 'https://arxiv.org' }, { t: ' (metadati CC0). Grazie ad arXiv per l’accesso aperto ai metadati.' }]}
    table={{ cols: ['Mese', 'Paper'], rows: months.map((m, i) => [m, papers[i].v]) }}>
    <Bars label="Paper sull'AI al mese" data={papers} />
  </Block>
  <Block title="Quota di modelli con pesi aperti" note="Modelli notevoli pubblicati ogni anno con i pesi scaricabili, %." missing={open.length ? null : 'Dati di Epoch AI non disponibili.'}
    cite={epCite} table={{ cols: ['Anno', '% con pesi aperti'], rows: open.map((o) => [o.k, o.v]) }}>
    <Bars label="Quota di modelli con pesi aperti" data={open} format={(v) => `${nf(v)}%`} />
  </Block>
  <Block span={12} title="Chi costruisce i modelli, area per area" note="USA, Cina, UE, Regno Unito e gli altri Paesi: capacità, calcolo e quanti modelli di grande scala addestra ognuno sono in GeopoliticAI.">
    <p><a class="vai" href={toHash('geopoliticai')}>Vai a GeopoliticAI →</a></p>
  </Block>
  <Block span={12} title="Ultimi modelli notevoli" missing={ep?.recenti?.length ? null : 'Dati di Epoch AI non disponibili.'} cite={epCite}>
    <DataTable cols={['Modello', 'Organizzazione', 'Data', 'Area', 'Accesso']} rows={(ep?.recenti ?? []).map((r) => [r.m, r.o, day(r.d), r.a, r.accesso])} />
  </Block>
</Detail>

<style>
  .vai { font-size: 14px; line-height: 24px; color: var(--accent); }
</style>
