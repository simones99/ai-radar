<script lang="ts">
  import Bars from '../charts/Bars.svelte';
  import Block from '../charts/Block.svelte';
  import DotPlot from '../charts/DotPlot.svelte';
  import LineChart from '../charts/LineChart.svelte';
  import { adozionePerSettore, barriereItUe, owidLatestByEntity, owidPoints, scopiItUe, tNum, type ConfrontoItUe } from '../data/derive';
  import { exact, nf, short } from '../text/format';
  import { barsTable, dotsTable, fmtYm, itUeTable, owidCite, seriesTable, MISSING } from './cite';
  import Detail from './Detail.svelte';
  import type { DetailProps } from './types';

  let { data, today, tile, onclose }: DetailProps = $props();

  const head = $derived(tile.head(data, today));
  const o = $derived(data.owid);
  const mld = (v: number) => nf(v, v < 10 ? 1 : 0);
  // investimenti: serie AI Index in CC BY-ND 4.0; nei grafici M/B, nelle tabelle i valori esatti come pubblicati
  const ND = 'Dollari USA a prezzi 2021 (M = milioni, B = miliardi). Valori esatti nella tabella.';
  const REG: [string, string][] = [['United States', 'USA'], ['China', 'Cina'], ['Europe', 'Europa']];
  const inv = $derived(REG.map(([e, name]) => ({ name, hot: e === 'Europe', pts: owidPoints(o, 'investimenti_privati', e).map((p) => ({ x: tNum(p.t), y: p.v })) })).filter((s) => s.pts.length));
  const gen = $derived(owidPoints(o, 'investimenti_generativa', 'World').map((p) => ({ k: p.t, v: p.v })));
  const TIPI: Record<string, string> = { 'Merger/acquisition': 'Acquisizioni', 'Minority stake': 'Quote di minoranza', 'Private investment': 'Investimenti privati', 'Public offering': 'Quotazioni' };
  const byType = $derived.by(() => {
    const m = owidLatestByEntity(o, 'investimenti_tipo');
    return Object.entries(TIPI).filter(([e]) => m.has(e)).map(([e, k]) => ({ k, v: m.get(e)?.now.v ?? 0 })).sort((a, b) => a.v - b.v);
  });
  const AREE: Record<string, string> = { 'All geographies': 'Mondo', 'Asia-Pacific': 'Asia-Pacifico', 'Developing markets': 'Paesi emergenti', Europe: 'Europa', 'Greater China': 'Cina', 'North America': 'Nord America' };
  const imprese = $derived([...owidLatestByEntity(o, 'imprese_ai')].map(([e, x]) => ({ k: AREE[e] ?? e, now: x.now.v, was: x.was?.v ?? null, hot: e === 'Europe' })).sort((a, b) => b.now - a.now));
  const eu = $derived(data.eurostat);
  const euYear = $derived(eu ? String(Math.max(...Object.values(eu.serie).flatMap((s) => Object.keys(s).map(Number)))) : '');
  const euRows = $derived(eu ? Object.entries(eu.serie)
    .map(([k, s]) => ({ k: eu.nomi[k] ?? k, now: s[euYear], was: s[String(Number(euYear) - 1)] ?? null, hot: k === 'IT' || k === 'EU27_2020' }))
    .filter((r) => r.now != null).sort((a, b) => b.now - a.now) : []);
  const dc = $derived(owidPoints(o, 'data_center_spesa', 'United States').slice(-36).map((p) => ({ x: tNum(p.t), y: p.v / 1e9 })));
  const ELE: [string, string][] = [['World', 'Mondo'], ['United States', 'USA'], ['China', 'Cina'], ['Europe (IEA)', 'Europa']];
  const ele = $derived(ELE.map(([e, name]) => ({ name, hot: e === 'Europe (IEA)', pts: owidPoints(o, 'data_center_elettricita', e).map((p) => ({ x: tNum(p.t), y: p.v })) })).filter((s) => s.pts.length));
  const nvidia = $derived(owidPoints(o, 'nvidia_ricavi', 'Data centers and AI').slice(-8).map((p) => ({ k: p.t.replace('-', ' '), v: p.v / 1e9 })));
  const tsmc = $derived(owidPoints(o, 'tsmc_ricavi', 'Taiwan').slice(-8).map((p) => ({ k: p.t, v: p.v / 1e9 })));
  const s = (id: string) => o?.serie?.[id];
  // settori (Eurostat isoc_eb_ain2): Italia punto pieno, UE punto vuoto
  const es = $derived(data.eurostat_settori);
  const perSettore = $derived(es ? adozionePerSettore(es) : null);
  const scopi = $derived(es ? scopiItUe(es) : null);
  const barriere = $derived(es ? barriereItUe(es) : null);
  const conAnno = (t: string, anno: string | undefined) => (anno ? `${t}, ${anno}` : t);
  const esCite = (anno: string) => (es ? [{ t: 'Fonte: ' }, { t: es.fonte, href: es.url }, { t: `. Dati ${anno}.` }] : null);
  const ITUE = 'Punto pieno: Italia; vuoto: UE.';
  const NON_RILEVATI = 'Eurostat non rileva finanza e assicurazioni, agricoltura, estrazione, pubblica amministrazione, istruzione, sanità, attività artistiche e altri servizi.';
</script>

{#snippet itUe(label: string, c: ConfrontoItUe)}
  <DotPlot {label} data={c.righe.map((r) => ({ k: r.k, now: r.it, was: r.eu }))} />
  {#if c.nonAffidabili.length}<p class="nota">Dato italiano non affidabile secondo Eurostat per: {c.nonAffidabili.join(', ')}.</p>{/if}
{/snippet}

<Detail {tile} {head} {onclose}>
  <h3 class="group">Investimenti</h3>
  <Block span={8} title="Investimenti privati per regione" note="{ND} Esclude le aziende quotate e la spesa interna delle grandi tecnologiche."
    missing={inv.length ? null : MISSING} cite={owidCite(s('investimenti_privati'))}
    table={{ ...seriesTable(inv, 'Anno'), format: exact }}>
    <LineChart label="Investimenti privati per regione" series={inv} yFormat={short} />
  </Block>
  <Block span={4} title="Di cui AI generativa" note="{ND} Mondo." missing={gen.length ? null : MISSING}
    cite={owidCite(s('investimenti_generativa'))} table={{ cols: ['Anno', 'Dollari'], rows: gen.map((g) => [g.k, g.v]), format: exact }}>
    <Bars label="Investimenti in AI generativa" data={gen} format={short} />
  </Block>
  <Block span={12} title="Investimenti delle aziende per tipo, ultimo anno" note={ND} missing={byType.length ? null : MISSING}
    cite={owidCite(s('investimenti_tipo'))} table={{ cols: ['Tipo', 'Dollari'], rows: byType.map((b) => [b.k, b.v]), format: exact }}>
    <Bars label="Investimenti delle aziende per tipo" data={byType} format={short} />
  </Block>

  <h3 class="group">Adozione</h3>
  <p class="group-note">{NON_RILEVATI} «Tutti» non comprende la finanza.</p>
  <Block title={conAnno('Adozione per settore', perSettore?.anno)} note="Imprese con almeno 10 addetti che usano almeno una tecnologia AI, %. {ITUE}"
    missing={perSettore?.righe.length ? null : MISSING} cite={perSettore ? esCite(perSettore.anno) : null}
    table={perSettore ? itUeTable(perSettore.righe, 'Settore') : null}>
    {#if perSettore}{@render itUe('Adozione per settore, Italia e UE', perSettore)}{/if}
  </Block>
  <Block title={conAnno("A cosa serve l'AI", es?.anno)} note="Tutti i settori rilevati, in % delle imprese che usano l'AI. {ITUE}"
    missing={scopi?.righe.length ? null : MISSING} cite={es ? esCite(es.anno) : null} table={scopi ? itUeTable(scopi.righe, 'Scopo') : null}>
    {#if scopi}{@render itUe("A cosa serve l'AI, Italia e UE", scopi)}{/if}
  </Block>
  <Block title={conAnno('Cosa frena chi non la usa', es?.anno)} note="Tutti i settori rilevati, in % delle imprese che hanno considerato l'AI senza usarla. {ITUE}"
    missing={barriere?.righe.length ? null : MISSING} cite={es ? esCite(es.anno) : null} table={barriere ? itUeTable(barriere.righe, 'Barriera') : null}>
    {#if barriere}{@render itUe('Cosa frena chi non la usa, Italia e UE', barriere)}{/if}
  </Block>
  <Block title="Imprese che usano l'AI, per area" note="Aziende intervistate che usano l'AI in almeno una funzione. Punto pieno: ultimo anno; vuoto: anno prima."
    missing={imprese.length ? null : MISSING} cite={owidCite(s('imprese_ai'))}
    table={{ ...dotsTable(imprese, ['Area', 'Ultimo anno', 'Anno prima']), format: exact }}>
    <DotPlot label="Imprese che usano l'AI, per area" data={imprese} />
  </Block>
  <Block title="Imprese europee che usano l'AI, {euYear}" note="Imprese con almeno 10 addetti che usano almeno una tecnologia AI. Punto vuoto: anno prima."
    missing={euRows.length ? null : MISSING} cite={eu ? [{ t: 'Fonte: ' }, { t: 'Eurostat, isoc_eb_ai', href: eu.url }, { t: '.' }] : null}
    table={{ cols: ['Paese', euYear, String(Number(euYear) - 1)], rows: euRows.map((r) => [r.k, r.now, r.was ?? '—']) }}>
    <DotPlot label="Imprese europee che usano l'AI" data={euRows} />
  </Block>

  <h3 class="group">Infrastruttura</h3>
  <Block title="Spesa per costruire data center negli USA" note="Miliardi di dollari al mese, prezzi costanti, ultimi 3 anni." missing={dc.length ? null : MISSING}
    cite={owidCite(s('data_center_spesa'))} table={seriesTable([{ name: 'Miliardi $', pts: dc }], 'Mese', fmtYm)}>
    <LineChart label="Spesa per data center negli USA" series={[{ name: 'USA', hot: true, pts: dc }]} yFormat={mld} />
  </Block>
  <Block title="Elettricità consumata dai data center" note="Quota della domanda totale di elettricità, %." missing={ele.length ? null : MISSING}
    cite={owidCite(s('data_center_elettricita'))} table={seriesTable(ele, 'Anno')}>
    <LineChart label="Elettricità consumata dai data center" series={ele} yFormat={(v) => `${nf(v, 1)}%`} />
  </Block>
  <Block title="Ricavi di Nvidia da data center e AI" note="Miliardi di dollari per trimestre." missing={nvidia.length ? null : MISSING} cite={owidCite(s('nvidia_ricavi'))} table={barsTable(nvidia, ['Trimestre', 'Miliardi $'])}>
    <Bars label="Ricavi trimestrali di Nvidia da data center" data={nvidia} format={mld} />
  </Block>
  <Block title="Ricavi di TSMC" note="Miliardi di dollari all'anno: il principale produttore di chip per l'AI." missing={tsmc.length ? null : MISSING} cite={owidCite(s('tsmc_ricavi'))} table={barsTable(tsmc, ['Anno', 'Miliardi $'])}>
    <Bars label="Ricavi annui di TSMC" data={tsmc} format={mld} />
  </Block>
</Detail>

<style>
  .group { grid-column: 1 / -1; font-weight: 600; font-size: 14px; line-height: 24px; color: var(--fg-2); padding-top: var(--s2); }
  .group-note { grid-column: 1 / -1; font-size: 14px; line-height: 24px; color: var(--fg-2); max-width: 72ch; }
  .nota { font-size: 14px; line-height: 24px; color: var(--fg-2); }
</style>
