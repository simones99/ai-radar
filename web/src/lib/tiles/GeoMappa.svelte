<script lang="ts">
  // «Chi controlla la catena dell'AI»: la linea dei sei anelli, la mappa del mondo colorata per l'anello aperto con l'Europa
  // ingrandita, il tabellone e la tabella. Ci sono le materie prime (USGS e studio UE), i tre anelli dei chip (ETO), i data center e i modelli (Epoch).
  // Un tocco su un Paese apre il suo fumetto con tutti gli anelli, e se il Paese è una scelta di ?area= sceglie anche l'area.
  // Nei data center, con ?siti=1, un cerchio per ogni sito noto a Epoch, con il suo fumetto.
  // Con ?vista=filo, al posto delle quote il Filo della catena: un esempio scelto da noi (?filo=), con gli archi tra le sei tappe e il loro elenco.
  // Nel filo restano la tabella delle quote della fermata scelta e le note che non parlano delle quote.
  import { tick } from 'svelte';
  import Block from '../charts/Block.svelte';
  import type { Catena, Geopoliticai, GeoSito } from '../data/types';
  import {
    ANELLI, anelloDi, archi, attivi, CENTRO, CITE_FILO, citeSiti, datiFilo, didascaliaSiti, dominio, EUROPA as EUR, filiDi, filoDi, fumetto, materialeDi, materialiDi, NOMI,
    nomeFilo, nomeSito, PAESI, paesiZona, proietta, puntiSiti, schedaSito, VIEWBOX, vista, zonaDi, type AnelloKey, type Paese, type PuntoSito,
  } from '../geo/mappa';
  import { imposta } from '../router';
  import { NOTA_FILO, NOTA_GPU, NOTA_ITALIA } from '../text/geopoliticai';

  let { g, catena, zona, anello: param, materiale: paramMateriale, siti: paramSiti, vista: paramVista, filo: paramFilo, onscegli }: {
    g: Geopoliticai; catena: Catena | undefined; zona: string; anello: string | undefined; materiale: string | undefined; siti: string | undefined;
    vista: string | undefined; filo: string | undefined; onscegli: (k: string) => void;
  } = $props();

  const fili = $derived(filiDi(catena));
  const filo = $derived(filoDi(paramVista, paramFilo, catena));
  // nel filo ogni fermata ha la sua tappa, anche quella di un anello senza dati
  const ok = $derived(filo ? ANELLI.map((a) => a.key) : attivi(g, catena));
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
  const unico = $derived(new Set(v.europa != null && !filo ? g.zone.ue?.paesi_mappa ?? [] : []));
  const quote = $derived(Object.fromEntries(v.valori));
  // il colore: dal valore più basso della scala (appena sopra il grigio) al più alto
  function fill(iso: string): string {
    if (filo) return fillFilo(iso);
    const x = unico.has(iso) ? v.europa : quote[iso];
    if (x == null) return 'var(--line)';
    const [lo, hi] = v.scala;
    return `color-mix(in srgb, var(--c) ${Math.round(25 + (75 * (x - lo)) / (hi - lo || 1))}%, var(--card))`;
  }
  const nome = (iso: string) => (filo ? nomeFilo(filo, iso) : `${NOMI[iso] ?? iso}: ${v.testo(iso)}`);

  // il filo: i Paesi delle tappe in tinta leggera, quello della fermata scelta nel colore del suo anello
  const tappa = $derived(filo?.tappe[idx]);
  const tappe = $derived(filo ? filo.tappe.map((t, i) => { const [x, y] = proietta(t.lon, t.lat); return { ...t, i, x, y }; }) : []);
  const fillFilo = (iso: string) =>
    tappa?.iso === iso ? `color-mix(in srgb, var(--k-${tappa.anello}) 45%, var(--card))`
    : tappe.some((t) => t.iso === iso) ? 'color-mix(in srgb, var(--fg) 16%, var(--card))' : 'var(--line)';
  const linee = $derived(filo ? archi(filo, idx) : []);
  const dati = $derived(filo ? datiFilo(g, catena, anello, paramMateriale) : null);

  const [vx, vy, vw, vh] = VIEWBOX.split(' ').map(Number);
  /** La posizione di un punto della mappa, in percentuale del riquadro che la contiene. */
  const pos = (x: number, y: number, b = { x: vx, y: vy, w: vw, h: vh }) => ({ left: `${((x - b.x) / b.w) * 100}%`, top: `${((y - b.y) / b.h) * 100}%` });
  // dove i Paesi sono piccoli o affollati l'etichetta si sposta: [dx, dy]
  const SPOSTA: Record<string, [number, number]> = { FRA: [-30, 4], GBR: [-30, -6], DEU: [6, -10], KOR: [14, -2], JPN: [18, 4], TWN: [14, 6], ISR: [-12, 6], ARE: [10, 8] };
  // l'Europa del dato unico ha la sua etichetta sulla Germania
  const etichette = $derived(filo ? [] : [...v.valori, ...(v.europa != null ? [[EUR, v.europa] as [string, number]] : [])].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([iso, x]) => {
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
  const conSiti = $derived(!filo && anello === 'datacenter' && paramSiti === '1' && !!g.data_center);
  const punti = $derived(conSiti ? puntiSiti(g.data_center!) : []);
  const puntiEuropa = $derived(punti.filter((q) => nelRiquadro(q.x, q.y)));
  const tappeEuropa = $derived(tappe.filter((t) => nelRiquadro(t.x, t.y)));

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

{#snippet filoSvg(dentro: typeof tappe, k: number)}
  <!-- gli archi si disegnano anche nel riquadro: l'Europa si legge lì. La chiave cambia con la fermata scelta, così l'arco che ci arriva
       è un elemento nuovo e la sua animazione riparte -->
  {#each linee as a (`${filo?.key}-${a.verso}-${a.verso === idx}`)}
    <path d={a.d} class="arco" class:on={a.verso === idx} style:--c="var(--k-{ANELLI[a.verso].key})" stroke-dasharray={a.pieno ? undefined : '3 2'}
      pathLength="100" data-testid="arco" aria-hidden="true" />
  {/each}
  <!-- la tappa scelta sta sopra le altre: due tappe possono stare nello stesso posto -->
  {#each [...dentro.filter((t) => t.i !== idx), ...dentro.filter((t) => t.i === idx)] as t (t.i)}
    <!-- come i Paesi, fuori dal Tab: da tastiera le tappe si scelgono dall'elenco sotto la mappa -->
    <g class="tappa" class:on={t.i === idx} transform="translate({t.x} {t.y}) scale({k})" style:--c="var(--k-{t.anello})" role="button" tabindex="-1"
      aria-label="{t.i + 1}. {ANELLI[t.i].nome}: {t.luogo}" onclick={() => vai(t.anello)}
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); vai(t.anello); } }}>
      <circle r={t.i === idx ? 9.5 : 8} /><text y="3.2" text-anchor="middle" aria-hidden="true">{t.i + 1}</text>
    </g>
  {/each}
{/snippet}

<Block span={12} id="geo-mappa" title="Chi controlla la catena dell'AI" note={filo ? 'Sei anelli, dalla miniera al modello: il filo mostra da quali Paesi passa un modello.' : 'Sei anelli, dalla miniera al modello: la mappa mostra quanto ne ha ogni Paese.'}
  table={filo ? dati?.tabella ?? null : v.tabella} cite={filo ? dati?.cite ?? CITE_FILO : conSiti ? [...v.cite, ...citeSiti(g.data_center!)] : v.cite}>
  <div class="anello" style:--c="var(--k-{anello})">
    {#if fili.length}
      <div class="viste">
        <div class="scelte" role="group" aria-label="Vista">
          <button type="button" aria-pressed={filo ? 'false' : 'true'} onclick={() => imposta('vista', null)}>Quote per Paese</button>
          <button type="button" aria-pressed={filo ? 'true' : 'false'} onclick={() => imposta('vista', 'filo')}>Filo della catena</button>
        </div>
        {#if filo}
          <div class="scelte" role="group" aria-label="Esempio">
            {#each fili as f (f.key)}<button type="button" aria-pressed={f.key === filo.key ? 'true' : 'false'} onclick={() => imposta('filo', f.key)}>{f.nome}</button>{/each}
          </div>
        {/if}
      </div>
    {/if}
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
      {#if !filo && anello === 'materie'}
        <div class="scelte" role="group" aria-label="Materiale">
          {#each materiali as m (m.key)}
            <button type="button" aria-pressed={m.key === materiale ? 'true' : 'false'} onclick={() => imposta('materiale', m.key)}>{m.nome}</button>
          {/each}
        </div>
      {:else if !filo && anello === 'datacenter'}
        <div class="scelte">
          <button type="button" aria-pressed={conSiti ? 'true' : 'false'} onclick={() => imposta('siti', conSiti ? null : '1')}>Siti</button>
        </div>
      {/if}
      <span>{tappa ? `${tappa.luogo}, ${NOMI[tappa.iso] ?? tappa.iso}` : v.misura}</span>
    </div>

    <div class="cornice">
      <div class="mondo">
        <svg viewBox={VIEWBOX} role="group" aria-label="Mappa del mondo: {filo ? `Filo della catena, ${filo.nome.toLowerCase()}` : v.misura.split(' · ')[0]}">
          <defs>
            <pattern id="geo-tratteggio" width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="2" /></pattern>
          </defs>
          {#each PAESI as p (p.id)}{@render paese(p)}{/each}
          {#each PAESI.filter((p) => unico.has(p.id)) as p (p.id)}<path d={p.d} class="unico" />{/each}
          {#each PAESI.filter((p) => ev.has(p.id)) as p (p.id)}<path d={p.d} class="bordo" />{/each}
          {#if ita}<path d={ita.d} class="italia" />{/if}
          {#each punti as q (q.sito.nome)}{@render cerchio(q, !nelRiquadro(q.x, q.y))}{/each}
          {#if filo}{@render filoSvg(tappe, 1)}{/if}
        </svg>
        {#each etichette as e (e.iso)}
          <span class="et" data-testid="etichetta" style:left={e.left} style:top={e.top}>
            <span class="n">{e.nome}</span>{' '}<b>{e.testo}</b>
            {#if e.primo}
              <span class="segnalino" data-testid="segnalino" role="img" aria-label="Il primo: {e.nome}"></span>
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
          {#if filo}{@render filoSvg(tappeEuropa, 0.7)}{/if}
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

    {#if filo}
      <p class="esempio">{NOTA_FILO}</p>
      <ol class="tappe" aria-label="Le tappe del filo: {filo.nome.toLowerCase()}">
        {#each filo.tappe as t, i (i)}
          <li aria-current={i === idx ? 'step' : undefined} style:--c="var(--k-{t.anello})">
            <button type="button" onclick={() => vai(t.anello)}>
              <span class="tn">{i + 1}</span><span><b>{ANELLI[i].nome}</b>: {t.luogo}, {NOMI[t.iso] ?? t.iso}</span>
            </button>
            <p>{t.frase} <a href={t.fonte} target="_blank" rel="noopener">Fonte: {dominio(t.fonte)}</a></p>
          </li>
        {/each}
      </ol>
    {:else}
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
    {/if}
    <!-- le note dell'anello parlano delle quote: nel filo restano solo le due generali -->
    <ul class="note">
      {#if italiaAZero}<li>{NOTA_ITALIA}</li>{/if}
      <li>{NOTA_GPU}</li>
      {#if !filo}{#each v.note as n (n)}<li>{n}</li>{/each}{/if}
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
  /* il primo: «1º» bianco su un tondino nel colore dell'anello, con un filo di carta che lo stacca dalla mappa. Il testo sta nel CSS:
     chi non vede la mappa ha il nome del segnalino, e il numero dell'etichetta resta solo */
  .segnalino { display: inline-grid; place-items: center; width: 18px; height: 18px; align-self: center; border-radius: 50%; background: var(--c);
    box-shadow: 0 0 0 1.5px var(--card); color: #fff; font-size: 10px; line-height: 1; font-weight: 800; letter-spacing: -.02em; text-shadow: none; }
  .segnalino::after { content: '1º'; }
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

  .viste { display: flex; flex-wrap: wrap; gap: var(--s1) var(--s2); }
  .viste .scelte button[aria-pressed='true'] { background: var(--fg); border-color: var(--fg); color: var(--card); }
  /* l'arco che arriva alla fermata scelta si disegna; con «riduci movimento» no (app.css) */
  .arco { fill: none; stroke: var(--c); stroke-width: 1.2; stroke-linecap: round; opacity: .6; pointer-events: none; }
  .arco.on { stroke-width: 2.2; opacity: 1; animation: traccia .8s ease-out; }
  @keyframes traccia { from { stroke-dasharray: 100; stroke-dashoffset: 100; } to { stroke-dasharray: 100; stroke-dashoffset: 0; } }
  .europa .arco { stroke-width: .8; }
  .europa .arco.on { stroke-width: 1.5; }
  .tappa { cursor: pointer; }
  .tappa circle { fill: var(--c); stroke: #fff; stroke-width: 1.2; }
  .tappa.on circle { stroke: var(--fg); stroke-width: 1.8; }
  .tappa text { font-size: 9px; font-weight: 800; fill: #fff; pointer-events: none; }
  .tappa:focus-visible { outline: none; }
  .tappa:focus-visible circle { stroke: var(--accent); stroke-width: 2.4; }
  .esempio { margin: 0; font-size: 14px; line-height: 20px; font-style: italic; color: var(--fg-2); }
  .tappe { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
  .tappe li { display: grid; gap: 2px; padding: 6px 8px; border-radius: var(--r-sm); border-left: 4px solid var(--c); }
  .tappe li[aria-current='step'] { background: color-mix(in srgb, var(--c) 7%, var(--card)); }
  .tappe button { display: flex; align-items: center; gap: 10px; min-height: 44px; width: 100%; padding: 0; border: 0; background: none; text-align: left;
    font: inherit; font-size: 15px; line-height: 20px; color: var(--fg); cursor: pointer; }
  .tn { flex: none; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: var(--c); color: #fff; font-weight: 700; font-size: 13px; }
  .tappe p { margin: 0 0 0 38px; font-size: 13px; line-height: 20px; color: var(--fg-2); overflow-wrap: anywhere; }
  .tappe a { color: var(--accent); }

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
