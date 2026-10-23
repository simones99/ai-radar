<script lang="ts">
  // «Chi controlla la catena dell'AI»: la linea dei sei anelli, la mappa del mondo colorata per l'anello aperto con l'Europa
  // ingrandita, il tabellone e la tabella. Per ora c'è solo l'anello dei modelli: l'ECI massimo per Paese dell'ultimo anno chiuso.
  import Block from '../charts/Block.svelte';
  import type { Geopoliticai } from '../data/types';
  import {
    ANELLI, ATTIVI, anelloDi, CENTRO, citeModelli, misuraModelli, NOMI, PAESI, paesiZona, tabellaModelli, tabellone, testoPaese,
    valoriModelli, VIEWBOX, zonaDi, type AnelloKey,
  } from '../geo/mappa';
  import { imposta } from '../router';
  import { eci, NOTA_ITALIA } from '../text/geopoliticai';

  let { g, zona, anello: param, onscegli }: { g: Geopoliticai; zona: string; anello: string | undefined; onscegli: (k: string) => void } = $props();

  const anello = $derived(anelloDi(param));
  const idx = $derived(ANELLI.findIndex((a) => a.key === anello));
  const attivo = (k: AnelloKey) => ATTIVI.includes(k);
  /** La fermata attiva più vicina in quella direzione, se c'è. */
  const vicino = (d: number): AnelloKey | null => {
    for (let i = idx + d; i >= 0 && i < ANELLI.length; i += d) if (attivo(ANELLI[i].key)) return ANELLI[i].key;
    return null;
  };
  const prima = $derived(vicino(-1));
  const dopo = $derived(vicino(1));
  const vai = (k: AnelloKey | null) => k && imposta('anello', k);

  const valori = $derived(valoriModelli(g));
  const ev = $derived(paesiZona(g, zona));
  const scelte = $derived(zonaDi(g));
  // il colore: dal valore più basso (appena sopra il grigio) al più alto
  const [lo, hi] = $derived(valori.length ? [valori[valori.length - 1][1] - 10, valori[0][1]] : [0, 1]);
  function fill(iso: string): string {
    const v = g.eci_paesi.valori[iso]?.max;
    if (v == null) return 'var(--line)';
    return `color-mix(in srgb, var(--c) ${Math.round(25 + (75 * (v - lo)) / (hi - lo || 1))}%, var(--card))`;
  }
  const nome = (iso: string) => `${NOMI[iso] ?? iso}: ${testoPaese(g, iso)}`;

  const [vx, vy, vw, vh] = VIEWBOX.split(' ').map(Number);
  /** La posizione di un punto della mappa, in percentuale del riquadro che la contiene. */
  const pos = (x: number, y: number, b = { x: vx, y: vy, w: vw, h: vh }) => ({ left: `${((x - b.x) / b.w) * 100}%`, top: `${((y - b.y) / b.h) * 100}%` });
  // dove i Paesi sono piccoli o affollati l'etichetta si sposta: [dx, dy]
  const SPOSTA: Record<string, [number, number]> = { FRA: [-30, 4], GBR: [-30, -6], DEU: [6, -10], KOR: [14, -2], JPN: [18, 4], TWN: [14, 6], ISR: [-12, 6], ARE: [10, 8] };
  const etichette = $derived(valori.slice(0, 5).map(([iso, v], i) => {
    const [x, y] = CENTRO[iso] ?? [vx + vw / 2, 0];
    const [dx, dy] = SPOSTA[iso] ?? [0, 0];
    return { iso, nome: NOMI[iso] ?? iso, testo: eci(v), primo: i === 0, ...pos(x + dx, y + dy) };
  }));

  // il riquadro dell'Europa, nell'oceano Pacifico del sud; sotto i 600 px diventa una seconda mappa sotto quella del mondo
  const EUROPA = { x: 462, y: -228, w: 165, h: 108 }; // abbastanza stretto da dare all'Italia 44 px a 320 px
  const IN = { x: 24, y: -6, k: 1.32 };
  const europei = PAESI.filter((p) => p.c[0] > EUROPA.x - 20 && p.c[0] < EUROPA.x + EUROPA.w + 20 && p.c[1] > EUROPA.y && p.c[1] < EUROPA.y + EUROPA.h + 10);
  const posEuropa = { left: `${((IN.x - vx) / vw) * 100}%`, top: `${((IN.y - vy) / vh) * 100}%`, width: `${((EUROPA.w * IN.k) / vw) * 100}%` };
  const etItalia = pos(CENTRO.ITA[0] + 2, CENTRO.ITA[1] + 10, EUROPA);
  const ita = PAESI.find((p) => p.id === 'ITA');

  const cifre = $derived(tabellone(g, zona));
  const italiaAZero = $derived(!Object.keys(g.zone.italia?.calcolo ?? {}).length && !Object.keys(g.zone.italia?.eci ?? {}).length);
</script>

{#snippet paese(p: (typeof PAESI)[number])}
  {#if scelte[p.id]}
    <path d={p.d} fill={fill(p.id)} class="pz sc" class:ev={ev.has(p.id)} role="button" tabindex="-1" aria-label={nome(p.id)} aria-pressed={ev.has(p.id) ? 'true' : 'false'}
      onclick={() => onscegli(scelte[p.id])} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onscegli(scelte[p.id])}><title>{nome(p.id)}</title></path>
  {:else}
    <path d={p.d} fill={fill(p.id)} class="pz" class:ev={ev.has(p.id)} aria-hidden="true"><title>{nome(p.id)}</title></path>
  {/if}
{/snippet}

<Block span={12} id="geo-mappa" title="Chi controlla la catena dell'AI" note="Sei anelli, dalla miniera al modello: la mappa mostra quanto ne ha ogni Paese." table={tabellaModelli(g)} cite={citeModelli(g)}>
  <div class="anello" style:--c="var(--k-{anello})">
    <nav class="linea" aria-label="Gli anelli della catena dell'AI">
      <button type="button" class="fr" disabled={!prima} onclick={() => vai(prima)} aria-label="Anello precedente">←</button>
      <ol>
        {#each ANELLI as a, i (a.key)}
          <li class:on={a.key === anello} style:--c="var(--k-{a.key})">
            <button type="button" disabled={!attivo(a.key)} aria-current={a.key === anello ? 'step' : undefined} onclick={() => vai(a.key)}>
              <span class="pal">{i + 1}</span>
              <span class="lab">{a.nome}{#if !attivo(a.key)}<span class="arriva">{' '}(in arrivo)</span>{/if}</span>
            </button>
          </li>
        {/each}
      </ol>
      <button type="button" class="fr" disabled={!dopo} onclick={() => vai(dopo)} aria-label="Anello successivo">→</button>
    </nav>

    <div class="titolo">
      <h4>{idx + 1}. {ANELLI[idx].nome}</h4>
      <span>{misuraModelli(g)}</span>
    </div>

    <div class="cornice">
      <div class="mondo">
        <svg viewBox={VIEWBOX} role="group" aria-label="Mappa del mondo: {misuraModelli(g).split(' · ')[0]}">
          {#each PAESI as p (p.id)}{@render paese(p)}{/each}
          {#each PAESI.filter((p) => ev.has(p.id)) as p (p.id)}<path d={p.d} class="bordo" />{/each}
          {#if ita}<path d={ita.d} class="italia" />{/if}
        </svg>
        {#each etichette as e (e.iso)}
          <span class="et" data-testid="etichetta" style:left={e.left} style:top={e.top}>
            <span class="n">{e.nome}</span>{' '}<b>{e.testo}</b>
            {#if e.primo}
              <span class="segnalino" data-testid="segnalino" role="img" aria-label="Il primo: {e.nome}">
                <svg viewBox="0 0 24 16" aria-hidden="true"><path d="M5 6h10l2 3H3zM8 3h6v3H8zM14 4h9v1.4h-9zM2 10h20a2.5 2.5 0 0 1 0 5H2a2.5 2.5 0 0 1 0-5z" /></svg>
              </span>
            {/if}
          </span>
        {/each}
      </div>
      <div class="europa" style:left={posEuropa.left} style:top={posEuropa.top} style:width={posEuropa.width}>
        <svg viewBox="{EUROPA.x} {EUROPA.y} {EUROPA.w} {EUROPA.h}" role="group" aria-label="Europa, ingrandita">
          {#each europei as p (p.id)}{@render paese(p)}{/each}
          {#each europei.filter((p) => ev.has(p.id)) as p (p.id)}<path d={p.d} class="bordo" />{/each}
          {#if ita}<path d={ita.d} class="italia" />{/if}
        </svg>
        <span class="in-t" aria-hidden="true">Europa, ingrandita</span>
        <span class="et it" style:left={etItalia.left} style:top={etItalia.top} aria-hidden="true">Italia</span>
      </div>
    </div>

    <dl class="tabellone">
      {#each cifre as c (c.etichetta)}
        <div class="cifra" class:primo={c.etichetta === 'Il primo'} class:it={c.etichetta === 'Italia'}>
          <dt>{c.etichetta}</dt>
          <dd>
            {#if c.vuoto}<span class="vuoto">{c.vuoto}</span>
            {:else}{#if c.nome}<b>{c.nome}</b>{' '}{/if}<strong>{c.valore}</strong>{' '}<span class="mod">{c.modello}</span>{/if}
          </dd>
        </div>
      {/each}
    </dl>
    {#if italiaAZero}<ul class="note"><li>{NOTA_ITALIA}</li></ul>{/if}
  </div>
</Block>

<style>
  /* un colore per anello, con il testo bianco sopra a ≥ 4,5:1 */
  .anello { --k-materie: #8a6210; --k-progettazione: #2f5f9e; --k-fabbricazione: #1f6f66; --k-macchinari: #6a4a96; --k-datacenter: #a8432c; --k-modelli: #b2461f;
    display: grid; gap: var(--s2); min-width: 0; }
  .linea { display: grid; grid-template-columns: 44px minmax(0, 1fr) 44px; align-items: start; gap: var(--s1); }
  .fr { width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--line-2); background: var(--card); cursor: pointer; font-size: 20px; }
  .fr:disabled { cursor: default; color: var(--fg-3); opacity: .5; }
  .linea ol { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); position: relative; }
  .linea ol::before { content: ''; position: absolute; left: 8%; right: 8%; top: 20px; height: 4px; background: var(--line-2); border-radius: 2px; }
  .linea li button { position: relative; display: grid; justify-items: center; gap: 4px; width: 100%; min-height: 44px; border: 0; background: none; cursor: pointer; padding: 0 2px; }
  .linea li button:disabled { cursor: default; }
  .pal { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: var(--card); border: 3px solid var(--c); font-weight: 700; font-size: 15px; }
  li.on .pal { background: var(--c); color: #fff; }
  button:disabled .pal { border-color: var(--line-2); color: var(--fg-3); }
  .lab { font-size: 12px; line-height: 16px; color: var(--fg-2); text-align: center; }
  .arriva { display: block; color: var(--fg-3); }
  li.on .lab { font-weight: 700; color: var(--fg); }
  .titolo { display: grid; gap: 4px; border-left: 5px solid var(--c); padding-left: 10px; }
  .titolo h4 { margin: 0; font-size: 22px; line-height: 28px; font-weight: 600; }
  .titolo span { font-size: 13px; line-height: 20px; color: var(--fg-3); }

  .cornice { position: relative; }
  .mondo { position: relative; }
  svg { display: block; width: 100%; height: auto; }
  .mondo > svg { background: color-mix(in srgb, var(--bg) 70%, #9fc3d9); border-radius: var(--r-md); }
  .pz { stroke: var(--card); stroke-width: .4; }
  .pz.sc { cursor: pointer; }
  .pz.sc:hover { stroke: var(--fg); stroke-width: .8; }
  .bordo { fill: none; stroke: var(--fg); stroke-width: .7; pointer-events: none; }
  .italia { fill: none; stroke: var(--accent); stroke-width: 1.4; stroke-dasharray: 2 1; pointer-events: none; }
  .et { position: absolute; transform: translate(-50%, -50%); display: inline-flex; align-items: baseline; gap: 4px; white-space: nowrap; pointer-events: none;
    font-size: 12px; line-height: 16px; color: var(--fg); text-shadow: 0 0 3px var(--card), 0 0 3px var(--card), 0 0 2px var(--card); }
  .et .n { color: var(--fg-2); }
  .et b { font-size: 14px; font-weight: 800; }
  .segnalino { display: inline-block; width: 22px; height: 15px; align-self: center; }
  .segnalino svg { fill: var(--fg); stroke: var(--card); stroke-width: 1.2; paint-order: stroke; overflow: visible; }
  .europa { position: absolute; border-radius: var(--r-sm); border: 1px solid var(--fg-3); overflow: hidden; background: color-mix(in srgb, var(--bg) 60%, #9fc3d9); }
  .europa .pz { stroke-width: .3; }
  .europa .italia { stroke-width: 1; stroke-dasharray: 1.5 .8; }
  .in-t { position: absolute; left: 6px; top: 4px; font-size: 11px; line-height: 14px; font-weight: 600; color: var(--fg-2); pointer-events: none; text-shadow: 0 0 3px var(--card), 0 0 2px var(--card); }
  .et.it { font-size: 11px; font-weight: 700; color: var(--accent); }
  @media (max-width: 599px) {
    /* sotto la mappa del mondo, a tutta larghezza: la posizione nell'oceano non vale più */
    .europa { position: relative; left: auto !important; top: auto !important; width: auto !important; margin-top: var(--s1); }
    .in-t { font-size: 12px; }
  }
  @media (max-width: 560px) {
    .linea { grid-template-columns: 36px minmax(0, 1fr) 36px; gap: 4px; padding-bottom: 20px; }
    .fr { width: 36px; height: 44px; font-size: 16px; border-radius: 18px; }
    .pal { width: 36px; height: 36px; font-size: 13px; border-width: 2px; }
    .linea ol::before { top: 16px; }
    .lab { display: none; }
    li.on .lab { display: block; position: absolute; top: 46px; white-space: nowrap; }
    li:first-child.on .lab { left: 0; } li:last-child.on .lab { right: 0; }
  }

  .tabellone { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: var(--s1); margin: 0; }
  .cifra { display: grid; gap: 2px; align-content: start; padding: 12px; border-radius: var(--r-sm); background: var(--bg); }
  dt { font-size: 12px; line-height: 16px; color: var(--fg-3); }
  dd { margin: 0; display: grid; }
  dd b { font-size: 16px; line-height: 20px; }
  dd strong { font-size: 24px; line-height: 32px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .cifra.primo strong { font-size: 32px; line-height: 40px; color: var(--c); }
  .mod { font-size: 13px; line-height: 18px; color: var(--fg-2); }
  .vuoto { font-size: 15px; line-height: 22px; font-style: italic; color: var(--fg-2); }
  .cifra.it { border-left: 3px dashed var(--accent); }
  .note { font-size: 13px; line-height: 20px; color: var(--fg-2); padding-left: 1.2em; margin: 0; }
</style>
