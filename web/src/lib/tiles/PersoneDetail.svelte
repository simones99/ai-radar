<script lang="ts">
  import Bars from '../charts/Bars.svelte';
  import Block from '../charts/Block.svelte';
  import DotPlot from '../charts/DotPlot.svelte';
  import LineChart from '../charts/LineChart.svelte';
  import { owidLatestByEntity, owidPoints, radarRows, tNum } from '../data/derive';
  import { nf } from '../text/format';
  import { paese } from '../text/paesi';
  import { barsTable, dotsTable, fmtYm, owidCite, seriesTable, MISSING } from './cite';
  import Detail from './Detail.svelte';
  import type { DetailProps } from './types';

  let { data, today, tile, onclose }: DetailProps = $props();

  const head = $derived(tile.head(data, today));
  const o = $derived(data.owid);
  const s = (id: string) => o?.serie?.[id];
  const pctF = (v: number) => `${nf(v, v < 10 ? 1 : 0)}%`;
  const lines = (id: string, ents: string[]) => ents
    .map((e) => ({ name: paese(e), hot: e === 'Italy', pts: owidPoints(o, id, e).map((p) => ({ x: tNum(p.t), y: p.v })) }))
    .filter((x) => x.pts.length);
  const uso = $derived(lines('uso_genai', ['World', 'Italy', 'United States', 'China']));
  // primi 15 Paesi, più l'Italia se è più in basso: resta sempre nel grafico, in evidenza
  const dots = (id: string) => {
    const all = [...owidLatestByEntity(o, id)]
      .map(([e, x]) => ({ k: paese(e), now: x.now.v, was: x.was?.v ?? null, hot: e === 'Italy' }))
      .sort((a, b) => b.now - a.now);
    const top = all.slice(0, 15);
    const it = all.find((d) => d.hot);
    return it && !top.includes(it) ? [...top, it] : top;
  };
  const ue = $derived(dots('uso_genai_ue'));
  const giovani = $derived(dots('uso_genai_giovani_ue'));
  const dev = $derived(owidPoints(o, 'sviluppatori_ai', 'World').map((p) => ({ k: p.t, v: p.v })));
  const annunci = $derived(lines('annunci_ai', ['United States', 'Italy', 'Germany', 'France', 'Spain', 'United Kingdom']));
  const jobs = $derived(data.radar?.base_domanda === 'lavoro'
    ? radarRows(data.radar).filter((r) => r.lavoro?.media != null).sort((a, b) => (a.lavoro?.media ?? 0) - (b.lavoro?.media ?? 0)).slice(-10).map((r) => ({ k: r.breve, v: r.lavoro?.media ?? 0 }))
    : []);
</script>

<Detail {tile} {head} {onclose}>
  <Block span={8} title="Chi usa l'AI generativa" note="Quota stimata della popolazione che usa strumenti di AI generativa, %." missing={uso.length ? null : MISSING} cite={owidCite(s('uso_genai'))} table={seriesTable(uso, 'Mese', fmtYm)}>
    <LineChart label="Uso dell'AI generativa" series={uso} yFormat={pctF} />
  </Block>
  <Block span={4} title="In Europa, 16-74 anni" note="Persone che hanno usato l'AI generativa, ultimo anno. Punto vuoto: anno prima." missing={ue.length ? null : MISSING} cite={owidCite(s('uso_genai_ue'))} table={dotsTable(ue, ['Paese', 'Ultimo anno', 'Anno prima'])}>
    <DotPlot label="Uso dell'AI generativa in Europa" data={ue} />
  </Block>
  <Block title="Giovani europei, 16-24 anni" note="Stessa misura tra i più giovani." missing={giovani.length ? null : MISSING} cite={owidCite(s('uso_genai_giovani_ue'))} table={dotsTable(giovani, ['Paese', 'Ultimo anno', 'Anno prima'])}>
    <DotPlot label="Uso dell'AI generativa tra i giovani europei" data={giovani} />
  </Block>
  <Block title="Sviluppatori che usano strumenti AI" note="Sviluppatori professionisti, mondo, %." missing={dev.length ? null : MISSING} cite={owidCite(s('sviluppatori_ai'))}
    table={barsTable(dev, ['Anno', '%'])}>
    <Bars label="Sviluppatori che usano strumenti AI" data={dev} format={pctF} />
  </Block>
  <Block title="Annunci di lavoro che chiedono l'AI" note="Quota degli annunci online che chiedono competenze AI, %." missing={annunci.length ? null : MISSING} cite={owidCite(s('annunci_ai'))} table={seriesTable(annunci, 'Anno')}>
    <LineChart label="Quota di annunci di lavoro sull'AI" series={annunci} yFormat={pctF} />
  </Block>
  <Block title="Competenze più chieste negli annunci" note="Annunci che citano la competenza ogni 10.000, media tra i Paesi."
    missing={jobs.length ? null : 'Serve la chiave gratuita di Adzuna (ADZUNA_APP_ID e ADZUNA_APP_KEY nei secret del repository).'}
    cite={[{ t: 'Fonte: ' }, { t: 'The Adzuna API', href: 'https://www.adzuna.co.uk' }, { t: '.' }]} table={barsTable(jobs, ['Competenza', 'Ogni 10.000 annunci'])}>
    <Bars label="Competenze più chieste negli annunci" data={jobs} format={(v) => nf(v, 1)} />
  </Block>
</Detail>
