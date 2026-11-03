<script lang="ts">
  import Bars from '../charts/Bars.svelte';
  import Block from '../charts/Block.svelte';
  import DotPlot from '../charts/DotPlot.svelte';
  import LineChart from '../charts/LineChart.svelte';
  import { competenzeDi, owidLatestByEntity, owidPoints, tNum } from '../data/derive';
  import { exact, monthShort, nf } from '../text/format';
  import { paese } from '../text/paesi';
  import { barsTable, dotsTable, fmtYm, owidCite, seriesTable, MISSING } from './cite';
  import Detail from './Detail.svelte';
  import type { DetailProps } from './types';

  let { data, today, tile, onclose }: DetailProps = $props();

  const head = $derived(tile.head(data, today));
  const o = $derived(data.owid);
  const s = (id: string) => o?.serie?.[id];
  const pctF = (v: number) => `${nf(v, v && v < 10 ? 1 : 0)}%`;
  /** Sull'asse x un anno intero si scrive com'è; una data dentro l'anno, quando i dati coprono poco più di un anno, come «dic 2025». */
  const quando = (x: number) => (Number.isInteger(x) ? String(x) : `${monthShort(fmtYm(x))} ${Math.floor(x)}`);
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
  const competenze = $derived(data.radar ? competenzeDi(data.radar) : []);
  // Le 10 più cercate in Italia, dalla prima, anche se non hanno un posto sul radar. Questa card guarda l'Italia: il mercato scelto in Competenze qui non conta.
  const jobs = $derived(competenze
    .flatMap((c) => (c.domanda_it == null ? [] : [{ k: c.breve || c.nome, v: c.domanda_it, annunci: c.annunci_it ?? '—', metaClassifica: c.domanda ?? '—' }]))
    .sort((a, b) => b.v - a.v)
    .slice(0, 10));
  // Senza il radar la causa non si conosce; senza la chiave non c'è un annuncio in nessun Paese; senza l'Italia gli altri Paesi ci sono.
  const jobsMissing = $derived(jobs.length ? null
    : !competenze.length ? MISSING
    : competenze.some((c) => c.domanda != null) ? 'Mancano i dati italiani: le rilevazioni recenti di Adzuna non comprendono l’Italia.'
    : 'Serve la chiave gratuita di Adzuna (ADZUNA_APP_ID e ADZUNA_APP_KEY nei secret del repository).');
</script>

<Detail {tile} {head} {onclose}>
  <Block span={8} title="Chi usa l'AI generativa" note="Quota stimata della popolazione che usa strumenti di AI generativa, %." missing={uso.length ? null : MISSING} cite={owidCite(s('uso_genai'))} table={seriesTable(uso, 'Mese', fmtYm)}>
    <LineChart label="Uso dell'AI generativa" series={uso} yFormat={pctF} xFormat={quando} />
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
  <Block title="Annunci di lavoro che chiedono l'AI" note="Quota degli annunci online che chiedono competenze AI, %. Valori esatti nella tabella." missing={annunci.length ? null : MISSING} cite={owidCite(s('annunci_ai'))} table={{ ...seriesTable(annunci, 'Anno'), format: exact }}>
    <LineChart label="Quota di annunci di lavoro sull'AI" series={annunci} yFormat={pctF} xFormat={quando} />
  </Block>
  <Block title="Competenze più chieste negli annunci" note="Annunci in Italia che citano la competenza ogni 10mila, mediana delle ultime 4 rilevazioni."
    missing={jobsMissing}
    cite={[{ t: 'Fonte: ' }, { t: 'The Adzuna API', href: 'https://www.adzuna.co.uk' }, { t: '.' }]}
    table={{ cols: ['Competenza', 'Italia, ogni 10mila', 'Annunci in Italia', 'Paese a metà classifica, ogni 10mila'], rows: jobs.map((j) => [j.k, j.v, j.annunci, j.metaClassifica]) }}>
    <Bars label="Competenze più chieste negli annunci" data={[...jobs].reverse()} format={(v) => nf(v, 1)} />
  </Block>
</Detail>
