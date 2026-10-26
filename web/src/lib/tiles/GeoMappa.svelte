<script lang="ts">
  // «Chi controlla la catena dell'AI»: la linea dei sei anelli, la mappa del mondo colorata per l'anello aperto con l'Europa
  // ingrandita, il tabellone e la tabella. Ci sono le materie prime (USGS e studio UE), i tre anelli dei chip (ETO), i data center e i modelli (Epoch).
  // Un tocco su un Paese apre il suo fumetto con tutti gli anelli, e se il Paese è una scelta di ?area= sceglie anche l'area.
  // Nei data center, con ?siti=1, un cerchio per ogni sito noto a Epoch, con il suo fumetto.
  import { tick } from 'svelte';
  import Block from '../charts/Block.svelte';
  import type { Catena, Geopoliticai, GeoSito } from '../data/types';
  import {
    ANELLI, anelloDi, attivi, CENTRO, citeSiti, didascaliaSiti, EUROPA as EUR, fumetto, materialeDi, materialiDi, NOMI, nomeSito, PAESI, paesiZona,
    puntiSiti, schedaSito, VIEWBOX, vista, zonaDi, type AnelloKey, type Paese, type PuntoSito,
  } from '../geo/mappa';
  import { imposta } from '../router';
  import { NOTA_GPU, NOTA_ITALIA } from '../text/geopoliticai';

  let { g, catena, zona, anello: param, materiale: paramMateriale, siti: paramSiti, onscegli }: {
    g: Geopoliticai; catena: Catena | undefined; zona: string; anello: string | undefined; materiale: string | undefined; siti: string | undefined;
    onscegli: (k: string) => void;
  } = $props();

  const ok = $derived(attivi(g, catena));
  const anello = $derived(anelloDi(param, ok));
  const idx = $derived(ANELLI.findIndex((a) => a.key === anello));
  const attivo = (k: AnelloKey) => ok.includes(k);
  /** La fermata attiva più vicina in quella direzione, se c'è. */
  const vicino = (d: number): AnelloKey | null => {
    for (let i = idx + d; i >= 0 && i < ANELLI.length; i += d) if (attivo(ANELLI[i].key)) return ANELLI[i].key;
    return null;
  };
  const prima = $derived(vicino(-1));
  const dopo = $derived(vicino(1));
  const vai = (k: AnelloKey | null) => k && imposta('anello', k);

  const materiali = $derived(materialiDi(catena));
  const materiale = $derived(materialeDi(paramMateriale, catena));
  const v = $derived(vista(g, catena, anello, materiale));
  const ev = $derived(paesiZona(g, zona));
  const scelte = $derived(zonaDi(g));
  /** I Paesi UE che prendono il valore unico dell'Europa, tratteggiati. */
  const unico = $derived(new Set(v.europa != null ? g.zone.ue?.paesi_mappa ?? [] : []));
  const quote = $derived(Object.fromEntries(v.valori));
  // il colore: dal valore più basso della scala (appena sopra il grigio) al più alto
  function fill(iso: string): string {
    const x = unico.has(iso) ? v.europa : quote[iso];
    if (x == null) return 'var(--line)';
    const [lo, hi] = v.scala;
    return `color-mix(in srgb, var(--c) ${Math.round(25 + (75 * (x - lo)) / (hi - lo || 1))}%, var(--card))`;
  }
  const nome = (iso: string) => `${NOMI[iso] ?? iso}: ${v.testo(iso)}`;

  const [vx, vy, vw, vh] = VIEWBOX.split(' ').map(Number);
  /** La posizione di un punto della mappa, in percentuale del riquadro che la contiene. */
  const pos = (x: number, y: number, b = { x: vx, y: vy, w: vw, h: vh }) => ({ left: `${((x - b.x) / b.w) * 100}%`, top: `${((y - b.y) / b.h) * 100}%` });
  // dove i Paesi sono piccoli o affollati l'etichetta si sposta: [dx, dy]
  const SPOSTA: Record<string, [number, number]> = { FRA: [-30, 4], GBR: [-30, -6], DEU: [6, -10], KOR: [14, -2], JPN: [18, 4], TWN: [14, 6], ISR: [-12, 6], ARE: [10, 8] };
  // l'Europa del dato unico ha la sua etichetta sulla Germania
  const etichette = $derived([...v.valori, ...(v.europa != null ? [[EUR, v.europa] as [string, number]] : [])].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([iso, x]) => {
    const [cx, cy] = CENTRO[iso === EUR ? 'DEU' : iso] ?? [vx + vw / 2, 0];
    const [dx, dy] = SPOSTA[iso] ?? [0, 0];
    return { iso, nome: iso === EUR ? 'Europa' : NOMI[iso] ?? iso, testo: v.breve(x), primo: iso === v.valori[0]?.[0], ...pos(cx + dx, cy + dy) };
  }));

  // il riquadro dell'Europa, nell'oceano Pacifico del sud; sotto i 600 px diventa una seconda mappa sotto quella del mondo
  const EUROPA = { x: 462, y: -228, w: 165, h: 108 }; // abbastanza stretto da dare all'Italia 44 px a 320 px
  const IN = { x: 24, y: -6, k: 1.32 };
  const europei = PAESI.filter((p) => p.c[0] > EUROPA.x - 20 && p.c[0] < EUROPA.x + EUROPA.w + 20 && p.c[1] > EUROPA.y && p.c[1] < EUROPA.y + EUROPA.h + 10);
  const posEuropa = { left: `${((IN.x - vx) / vw) * 100}%`, top: `${((IN.y - vy) / vh) * 100}%`, width: `${((EUROPA.w * IN.k) / vw) * 100}%` };
  const etItalia = pos(CENTRO.ITA[0] + 2, CENTRO.ITA[1] + 10, EUROPA);
  const ita = PAESI.find((p) => p.id === 'ITA');
  const nelRiquadro = (x: number, y: number) => x >= EUROPA.x && x <= EUROPA.x + EUROPA.w && y >= EUROPA.y && y <= EUROPA.y + EUROPA.h;

  // i Siti valgono solo nei data center: con un altro anello ?siti=1 si ignora
  const conSiti = $derived(anello === 'datacenter' && paramSiti === '1' && !!g.data_center);
  const punti = $derived(conSiti ? puntiSiti(g.data_center!) : []);
  const puntiEuropa = $derived(punti.filter((q) => nelRiquadro(q.x, q.y)));

  // il fumetto, di un Paese o di un sito, si apre dal lato opposto rispetto al centro della mappa; l'Europa è anche nel riquadro,
  // a sinistra, e si apre sempre a destra, così il fumetto non la copre
  const EUROPEI = new Set(europei.map((p) => p.id));
  let aperto = $state<{ titolo: string; iso?: string; sito?: GeoSito; lato: 'destra' | 'sinistra'; da: SVGElement } | null>(null);
  let pannello = $state<HTMLElement>();
  const anelliPaese = $derived(aperto?.iso ? fumetto(g, catena, aperto.iso) : []);
  async function apri(cosa: { titolo: string; iso?: string; sito?: GeoSito }, x: number, europeo: boolean, da: SVGElement) {
    aperto = { ...cosa, lato: europeo || x < vx + vw / 2 ? 'destra' : 'sinistra', da };
    await tick();
    pannello?.focus();
  }
  function tocca(p: Paese, da: SVGElement) {
    if (scelte[p.id]) onscegli(scelte[p.id]);
    return apri({ titolo: NOMI[p.id] ?? p.id, iso: p.id }, p.c[0], EUROPEI.has(p.id), da);
  }
  const toccaSito = (q: PuntoSito, da: SVGElement) => apri({ titolo: q.sito.nome, sito: q.sito }, q.x, nelRiquadro(q.x, q.y), da);
  function chiudi() {
    const da = aperto?.da;
    aperto = null;
    da?.focus();
  }

  const cifre = $derived(v.tabellone(zona));
  const italiaAZero = $derived(!Object.keys(g.zone.italia?.calcolo ?? {}).length && !Object.keys(g.zone.italia?.eci ?? {}).length);
</script>

{#snippet paese(p: Paese)}
  <!-- aria-pressed solo per i Paesi che sono una scelta di ?area=: quelli di «Altri» aprono solo il fumetto -->
  <path d={p.d} fill={fill(p.id)} class="pz" class:ev={ev.has(p.id)} role="button" tabindex="-1" aria-label={nome(p.id)} aria-haspopup="dialog"
    aria-pressed={scelte[p.id] ? (ev.has(p.id) ? 'true' : 'false') : undefined} onclick={(e) => tocca(p, e.currentTarget)}
    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tocca(p, e.currentTarget); } }}><title>{nome(p.id)}</title></path>
{/snippet}

{#snippet cerchio(q: PuntoSito, tab: boolean)}
  <!-- un sito in costruzione ha il cerchio vuoto; i cerchi, pochi, si raggiungono con Tab, quelli europei solo nel riquadro -->
  <circle cx={q.x} cy={q.y} r={q.r} fill={q.sito.stato === 'operativo' ? 'var(--sito)' : 'none'} class="sito" role="button" tabindex={tab ? 0 : -1}
    aria-label={nomeSito(q.sito)} aria-haspopup="dialog" onclick={(e) => toccaSito(q, e.currentTarget)}
    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toccaSito(q, e.currentTarget); } }}><title>{nomeSito(q.sito)}</title></circle>
{/snippet}

<Block span={12} id="geo-mappa" title="Chi controlla la catena dell'AI" note="Sei anelli, dalla miniera al modello: la mappa mostra quanto ne ha ogni Paese." table={v.tabella} cite={conSiti ? [...v.cite, ...citeSiti(g.data_center!)] : v.cite}>
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
      {#if anello === 'materie'}
        <div class="scelte" role="group" aria-label="Materiale">
          {#each materiali as m (m.key)}
            <button type="button" aria-pressed={m.key === materiale ? 'true' : 'false'} onclick={() => imposta('materiale', m.key)}>{m.nome}</button>
          {/each}
        </div>
      {:else if anello === 'datacenter'}
        <div class="scelte">
          <button type="button" aria-pressed={conSiti ? 'true' : 'false'} onclick={() => imposta('siti', conSiti ? null : '1')}>Siti</button>
        </div>
      {/if}
      <span>{v.misura}</span>
    </div>

    <div class="cornice">
      <div class="mondo">
        <svg viewBox={VIEWBOX} role="group" aria-label="Mappa del mondo: {v.misura.split(' · ')[0]}">
          <defs>
            <pattern id="geo-tratteggio" width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="2" /></pattern>
          </defs>
          {#each PAESI as p (p.id)}{@render paese(p)}{/each}
          {#each PAESI.filter((p) => unico.has(p.id)) as p (p.id)}<path d={p.d} class="unico" />{/each}
          {#each PAESI.filter((p) => ev.has(p.id)) as p (p.id)}<path d={p.d} class="bordo" />{/each}
          {#if ita}<path d={ita.d} class="italia" />{/if}
          {#each punti as q (q.sito.nome)}{@render cerchio(q, !nelRiquadro(q.x, q.y))}{/each}
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
          {#each europei.filter((p) => unico.has(p.id)) as p (p.id)}<path d={p.d} class="unico" />{/each}
          {#each europei.filter((p) => ev.has(p.id)) as p (p.id)}<path d={p.d} class="bordo" />{/each}
          {#if ita}<path d={ita.d} class="italia" />{/if}
          {#each puntiEuropa as q (q.sito.nome)}{@render cerchio(q, true)}{/each}
        </svg>
        <span class="in-t" aria-hidden="true">Europa, ingrandita</span>
        <span class="et it" style:left={etItalia.left} style:top={etItalia.top} aria-hidden="true">Italia</span>
      </div>
      {#if aperto}
        <!-- sotto i 600 px non galleggia: è un pannello sotto le mappe -->
        <div class="fumetto {aperto.lato}" role="dialog" aria-labelledby="geo-fumetto-t" tabindex="-1" bind:this={pannello}
          onkeydown={(e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); chiudi(); } }}>
          <div class="testa">
            <h5 id="geo-fumetto-t">{aperto.titolo}</h5>
            <button type="button" class="chiudi" onclick={chiudi}>Chiudi</button>
          </div>
          {#if aperto.sito}
            <dl class="sito-righe">
              {#each schedaSito(aperto.sito) as [k, x] (k)}<div><dt>{k}</dt><dd>{x}</dd></div>{/each}
            </dl>
            {#if aperto.sito.posizione === 'indirizzo'}<p class="appross">Posizione approssimativa, ricavata dall'indirizzo.</p>{/if}
          {:else}
            <dl class="anelli-righe">
              {#each anelliPaese as a, i (a.key)}
                <div style:--c="var(--k-{a.key})">
                  <dt>{i + 1}. {a.nome}</dt>
                  {#each a.voci as x, j (j)}
                    <dd>{x.materiale ? `${x.materiale}: ` : ''}<b>{x.testo}</b>{#if x.data}<span class="data">{` · ${x.data}`}</span>{/if}</dd>
                  {/each}
                </div>
              {/each}
            </dl>
          {/if}
        </div>
      {/if}
    </div>
    {#if conSiti}<p class="didascalia">{didascaliaSiti(g.data_center!)}</p>{/if}

    <dl class="tabellone">
      {#each cifre as c (c.etichetta)}
        <div class="cifra" class:primo={c.etichetta === 'Il primo'} class:it={c.etichetta === 'Italia'}>
          <dt>{c.etichetta}</dt>
          <dd>
            {#if c.vuoto}<span class="vuoto">{c.vuoto}</span>
            {:else}{#if c.nome}<b>{c.nome}</b>{' '}{/if}<strong>{c.valore}</strong>{#if c.dettaglio}{' '}<span class="mod">{c.dettaglio}</span>{/if}{/if}
          </dd>
        </div>
      {/each}
    </dl>
    <ul class="note">
      {#if italiaAZero}<li>{NOTA_ITALIA}</li>{/if}
      <li>{NOTA_GPU}</li>
      {#each v.note as n (n)}<li>{n}</li>{/each}
    </ul>
  </div>
</Block>

<style>
  /* un colore per anello, con il testo bianco sopra a ≥ 4,5:1 */
  .anello { --k-materie: #8a6210; --k-progettazione: #2f5f9e; --k-fabbricazione: #1f6f66; --k-macchinari: #6a4a96; --k-datacenter: #a8432c; --k-modelli: #b2461f;
    --sito: color-mix(in srgb, var(--fg) 55%, transparent);
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
  .scelte { display: flex; flex-wrap: wrap; gap: var(--s1); }
  .scelte button { background: var(--bg); border: 1px solid var(--line-2); border-radius: 999px; padding: 4px 12px; min-height: 44px; font-size: 14px; line-height: 20px; cursor: pointer; color: var(--fg-2); }
  .scelte button[aria-pressed='true'] { background: var(--c); border-color: var(--c); color: #fff; }
  .titolo span { font-size: 13px; line-height: 20px; color: var(--fg-3); }

  .cornice { position: relative; }
  .mondo { position: relative; }
  svg { display: block; width: 100%; height: auto; }
  .mondo > svg { background: color-mix(in srgb, var(--bg) 70%, #9fc3d9); border-radius: var(--r-md); }
  .pz { stroke: var(--card); stroke-width: .4; }
  .pz { cursor: pointer; }
  .pz:hover { stroke: var(--fg); stroke-width: .8; }
  .unico { fill: url(#geo-tratteggio); pointer-events: none; }
  pattern line { stroke: var(--card); stroke-width: .7; }
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
  .fumetto { position: absolute; top: 8px; z-index: 2; width: min(340px, 44%); display: grid; gap: var(--s1); padding: 12px; border-radius: var(--r-md);
    background: var(--card); border: 1px solid var(--line-2); box-shadow: 0 6px 20px rgb(0 0 0 / .18); }
  .fumetto.destra { right: 8px; }
  .fumetto.sinistra { left: 8px; }
  .fumetto .testa { display: flex; align-items: center; justify-content: space-between; gap: var(--s1); }
  .fumetto h5 { margin: 0; font-size: 18px; line-height: 24px; font-weight: 700; }
  .chiudi { min-width: 44px; min-height: 44px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--line-2); background: var(--bg); cursor: pointer; font-size: 14px; color: var(--fg-2); }
  .fumetto dl { margin: 0; display: grid; gap: 6px; }
  .fumetto .anelli-righe > div { border-left: 4px solid var(--c); padding-left: 8px; }
  .fumetto dd { display: block; font-size: 13px; line-height: 18px; }
  .fumetto dd b { font-size: 13px; line-height: 18px; font-weight: 600; }
  .fumetto .data { color: var(--fg-3); }
  .fumetto .sito-righe > div { display: flex; gap: var(--s1); justify-content: space-between; border-bottom: 1px solid var(--line); padding-bottom: 4px; }
  .fumetto .sito-righe dt { font-size: 13px; line-height: 18px; color: var(--fg-3); }
  .fumetto .sito-righe dd { font-weight: 600; text-align: right; }
  .appross { margin: 0; font-size: 13px; line-height: 18px; font-style: italic; color: var(--fg-2); }
  /* i cerchi si toccano anche dentro, quando sono vuoti */
  .sito { stroke: var(--card); stroke-width: .6; cursor: pointer; pointer-events: all; }
  .sito[fill='none'] { stroke: var(--fg); stroke-width: .8; }
  .sito:hover, .sito:focus-visible { outline: none; stroke: var(--accent); stroke-width: 1.4; }
  .didascalia { margin: 0; font-size: 13px; line-height: 20px; color: var(--fg-2); }
  @media (max-width: 599px) {
    /* sotto la mappa del mondo, a tutta larghezza: la posizione nell'oceano non vale più */
    .europa { position: relative; left: auto !important; top: auto !important; width: auto !important; margin-top: var(--s1); }
    .in-t { font-size: 12px; }
    .fumetto.destra, .fumetto.sinistra { position: relative; inset: auto; width: auto; margin-top: var(--s1); box-shadow: none; }
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
