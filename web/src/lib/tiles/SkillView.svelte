<script lang="ts">
  import Block from '../charts/Block.svelte';
  import LineChart from '../charts/LineChart.svelte';
  import type { Cite, Series } from '../charts/types';
  import type { RadarRowM } from '../data/derive';
  import type { Quadrant, Radar } from '../data/types';
  import { day, dayWith, monthShort, nf, per10k, signedPct } from '../text/format';

  let { row, quadranti, storico = [] }: {
    row: RadarRowM;
    quadranti: Record<Quadrant, string>;
    storico?: NonNullable<Radar['storico']>;
  } = $props();

  const FONTE: Record<string, string> = { arxiv: 'paper su arXiv', github: 'repository su GitHub', lavoro: 'annunci di lavoro' };
  const cite = (t: string, href: string): Cite => [{ t: 'Fonte: ' }, { t, href }, { t: '.' }];

  const seg = $derived(row.segnali ?? {});
  const heavy = $derived(
    (Object.entries(seg) as [string, { peso: number } | null | undefined][])
      .filter(([, s]) => s && s.peso > 0)
      .sort(([, a], [, b]) => (b?.peso ?? 0) - (a?.peso ?? 0))[0]?.[0] ?? null,
  );
  const margin = $derived(row.slancio_margine ?? null);
  const paperM = $derived(seg.arxiv?.mensile ?? []);
  const repoM = $derived(seg.github?.mensile ?? []);
  const ril = $derived(seg.lavoro?.rilevazioni ?? []);
  const paper = $derived<Series[]>([{ name: row.breve, hot: true, pts: paperM.flatMap((m, i) => (m.totale ? [{ x: i, y: (1000 * m.n) / m.totale }] : [])) }]);
  const repo = $derived<Series[]>([{ name: row.breve, hot: true, pts: repoM.flatMap((m, i) => (m.base ? [{ x: i, y: (1000 * m.n) / m.base }] : [])) }]);
  const annunci = $derived<Series[]>([
    { name: 'Media', hot: true, pts: ril.map((r, i) => ({ x: i, y: r.media })) },
    ...(ril.some((r) => r.it != null) ? [{ name: 'Italia', pts: ril.flatMap((r, i) => (r.it == null ? [] : [{ x: i, y: r.it }])) }] : []),
  ]);
  const percorso = $derived(storico.flatMap((p) => {
    const q = p.competenze[row.id]?.pubblicato;
    return q ? [{ mese: p.mese, q }] : [];
  }));
  const yf = (v: number) => nf(v, v < 10 ? 1 : 0);
  const monthAt = (mens: { mese: string }[]) => (i: number) => (mens[i] ? monthShort(mens[i].mese) : '');
  const dayAt = (i: number) => (ril[i] ? day(ril[i].data).replace(/ \d{4}$/, '') : '');
</script>

<nav class="back" aria-label="Competenze"><a href="#competenze">← Tutte le competenze</a></nav>
{#if row.incerto}
  <p class="warn" role="note">Dato incerto: {row.incerto_perche ?? 'il margine dello slancio è largo'}. La posizione sul radar può cambiare molto.</p>
{/if}

<Block span={4} title="Domanda" cite={cite('The Adzuna API', 'https://www.adzuna.co.uk')}>
  <p class="fig">{per10k(row.domanda)}</p>
  <p class="sub">annunci ogni 10mila, media dei Paesi{row.domanda_it != null ? ` · Italia: ${per10k(row.domanda_it)}` : ''}</p>
</Block>
<Block span={4} title="Slancio">
  <p class="fig">{signedPct(row.slancio)}</p>
  <p class="sub">in 6 mesi, rispetto all’AI{margin ? ` · margine: da ${signedPct(margin[0])} a ${signedPct(margin[1])}` : ''}</p>
</Block>
<Block span={4} title="Affidabilità">
  <p class="fig">{row.incerto ? 'incerta' : 'solida'}</p>
  <p class="sub">{heavy ? `pesa di più: ${FONTE[heavy]}` : ''}</p>
</Block>

<Block span={4} title="Paper" note="Paper su arXiv che ne parlano ogni 1.000 paper AI, mese per mese." cite={cite('arXiv', 'https://arxiv.org')}
  missing={paperM.length ? null : 'Nessun dato da arXiv.'}
  table={{ cols: ['Mese', 'Paper', 'Paper AI'], rows: paperM.map((m) => [m.mese, m.n, m.totale]) }}>
  <LineChart series={paper} label="Paper su {row.breve} ogni 1.000 paper AI" height={200} yFormat={yf} xFormat={monthAt(paperM)} />
</Block>
<Block span={4} title="Repository" note="Nuovi repository GitHub con il suo topic ogni 1.000 nuovi repository AI." cite={cite('GitHub', 'https://github.com')}
  missing={repoM.length ? null : 'Nessun dato da GitHub.'}
  table={{ cols: ['Mese', 'Repository', 'Repository AI'], rows: repoM.map((m) => [m.mese, m.n, m.base]) }}>
  <LineChart series={repo} label="Repository su {row.breve} ogni 1.000 repository AI" height={200} yFormat={yf} xFormat={monthAt(repoM)} />
</Block>
<Block span={4} title="Annunci" note="Annunci che la citano ogni 10mila, media dei Paesi e Italia." cite={cite('The Adzuna API', 'https://www.adzuna.co.uk')}
  missing={ril.length < 2 ? 'Serve un mese di rilevazioni.' : null}
  table={{ cols: ['Rilevazione', 'Media', 'Italia'], rows: ril.map((r) => [r.data, r.media, r.it ?? '—']) }}>
  <LineChart series={annunci} label="Annunci su {row.breve} ogni 10mila" height={200} yFormat={yf} xFormat={dayAt} />
</Block>

<Block span={12} title="Il percorso sul radar" note="Il quadrante di ogni mese. Cambia solo dopo due mesi di fila nel quadrante nuovo."
  missing={percorso.length ? null : 'Lo storico arriva con i prossimi aggiornamenti.'}>
  <ol class="path" role="list" aria-label="Il percorso sul radar">
    {#each percorso as p (p.mese)}<li class:hot={p.q === 'impara-ora'}><span>{monthShort(p.mese)} {p.mese.slice(0, 4)}</span><b>{quadranti[p.q]}</b></li>{/each}
  </ol>
</Block>

<Block span={6} title="Per iniziare" note="Scelte a mano, gratuite." missing={row.per_iniziare?.length ? null : 'Nessuna risorsa disponibile.'}>
  <ul class="res">
    {#each row.per_iniziare ?? [] as r (r.url)}
      <li><a href={r.url} target="_blank" rel="noopener">{r.titolo}</a><span class="meta">{r.tipo}{r.lingua !== 'it' ? ' · in inglese' : ''}</span></li>
    {/each}
  </ul>
</Block>
<Block span={6} title="Cosa si muove adesso" note="I repository con il suo topic creati negli ultimi 90 giorni, i più stellati." cite={cite('GitHub', 'https://github.com')}
  missing={row.in_crescita?.length ? null : 'Nessun repository nuovo con questo topic negli ultimi 90 giorni.'}>
  <ul class="res">
    {#each row.in_crescita ?? [] as r (r.url)}
      <li>
        <a href={r.url} target="_blank" rel="noopener">{r.nome}</a>
        <span class="meta">{nf(r.stelle)} stelle · creato {dayWith('il', r.creato)}</span>
        {#if r.descrizione}<span class="desc">{r.descrizione}</span>{/if}
      </li>
    {/each}
  </ul>
</Block>

<Block span={12} title="Fonti e metodo">
  <p class="sub">Fonti: <a href="https://arxiv.org" target="_blank" rel="noopener">arXiv</a>, <a href="https://github.com" target="_blank" rel="noopener">GitHub</a>, <a href="https://www.adzuna.co.uk" target="_blank" rel="noopener">The Adzuna API</a>. Come si calcolano slancio, domanda e incertezza: <a href="#competenze">vedi il metodo</a>.</p>
</Block>

<style>
  .back, .warn { grid-column: 1 / -1; }
  .back a { font-weight: 500; }
  .warn { margin: 0; padding: var(--s2); border-radius: var(--r-md); background: var(--accent-soft); font-size: 14px; line-height: 24px; }
  .fig { margin: 0; font-weight: 600; font-size: 40px; line-height: 48px; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
  .sub { margin: 0; font-size: 14px; line-height: 24px; color: var(--fg-2); }
  .path { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--s1); }
  .path li { display: grid; gap: 2px; padding: var(--s1) var(--s2); border-radius: var(--r-md); background: var(--bg); font-size: 12px; line-height: 16px; color: var(--fg-2); }
  .path b { font-weight: 600; color: var(--fg); }
  .path li.hot b { color: var(--accent); }
  .res { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--s2); }
  .res li { display: grid; gap: 2px; font-size: 14px; line-height: 24px; min-width: 0; overflow-wrap: anywhere; }
  .meta, .desc { font-size: 12px; line-height: 16px; color: var(--fg-3); }
</style>
