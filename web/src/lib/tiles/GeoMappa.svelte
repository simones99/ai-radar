<script lang="ts">
  // «Chi controlla la catena dell'AI»: la linea dei sei anelli, la mappa del mondo colorata per l'anello aperto con l'Europa
  // ingrandita, il tabellone e la tabella. Ci sono le materie prime (USGS e studio UE), i tre anelli dei chip (ETO), i data center e i modelli (Epoch).
  // Un tocco su un Paese apre il suo fumetto con tutti gli anelli, e se il Paese è una scelta di ?area= sceglie anche l'area.
  // Nei data center, con ?siti=1, un cerchio per ogni sito noto a Epoch, con il suo fumetto.
  // Si apre sul Filo della catena: un esempio scelto da noi (?filo=, quello europeo se manca), con gli archi tra le sei tappe e il loro elenco;
  // nel filo resta la tabella delle quote della fermata scelta. Con ?vista=quote, la mappa delle quote per Paese con le sue note.
  import { tick } from 'svelte';
  import Block from '../charts/Block.svelte';
  import type { Catena, Geopoliticai, GeoSito } from '../data/types';
  import {
    ANELLI, anelloDi, archi, attivi, CENTRO, CITE_FILO, citeSiti, datiFilo, didascaliaSiti, dominio, EUROPA as EUR, filiDi, filoDi, fumetto, materialeDi, materialiDi, NOMI,
    nomeFilo, nomeSito, PAESI, paesiZona, proietta, puntiSiti, schedaSito, separa, tinta, VIEWBOX, vista, vistaMappa, zonaDi, type AnelloKey, type Paese, type PuntoSito,
  } from '../geo/mappa';
  import { imposta } from '../router';
  import { NOTA_FILO, NOTA_GPU } from '../text/geopoliticai';

  let { g, catena, zona, anello: param, materiale: paramMateriale, siti: paramSiti, vista: paramVista, filo: paramFilo, onscegli }: {
    g: Geopoliticai; catena: Catena | undefined; zona: string; anello: string | undefined; materiale: string | undefined; siti: string | undefined;
    vista: string | undefined; filo: string | undefined; onscegli: (k: string) => void;
  } = $props();

  const fili = $derived(filiDi(catena));
  const filo = $derived(filoDi(vistaMappa(paramVista, paramSiti), paramFilo, catena));
  // nel filo ogni fermata ha la sua tappa, anche quella di un anello senza dati
  const ok = $derived(filo ? ANELLI.map((a) => a.key) : attivi(g, catena));
  const anello = $derived(anelloDi(param, ok));
  const idx = $derived(ANELLI.findIndex((a) => a.key === anello));
  const attivo = (k: AnelloKey) => ok.includes(k);
  const vai = (k: AnelloKey) => imposta('anello', k);
  /** Al filo si torna togliendo ?vista=; ?siti=1 senza ?vista= vorrebbe dire le quote (vistaMappa), e nel filo non vale. */
  function alFilo() {
    imposta('siti', null);
    imposta('vista', null);
  }

  const materiali = $derived(materialiDi(catena));
  const materiale = $derived(materialeDi(paramMateriale, catena));
  const v = $derived(vista(g, catena, anello, materiale));
  const ev = $derived(paesiZona(g, zona));
  const scelte = $derived(zonaDi(g));
  /** I Paesi UE che prendono il valore unico dell'Europa, tratteggiati. */
  const unico = $derived(new Set(v.europa != null && !filo ? g.zone.ue?.paesi_mappa ?? [] : []));
  const quote = $derived(Object.fromEntries(v.valori));
  function fill(iso: string): string {
    if (filo) return fillFilo(iso);
    const x = unico.has(iso) ? v.europa : quote[iso];
    return x == null ? 'var(--line)' : tinta(x, ...v.scala);
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
  // le tappe della mappa del mondo hanno almeno 6 px di raggio a ogni larghezza. Sotto i 600 px (la mappa è larga meno di 520 px) l'Europa
  // ingrandita sta sotto, a tutta larghezza: lì ci sono le tappe europee, e sul mondo resta solo il riquadro che le indica
  let largo = $state(0);
  const kMondo = $derived(largo ? Math.max(1, (6 * vw) / (8 * largo)) : 1);
  const sotto = $derived(largo > 0 && largo < 520);
  const tappeMondo = $derived(sotto ? tappe.filter((t) => !nelRiquadro(t.x, t.y)) : tappe);

  // il fumetto, di un Paese o di un sito, si apre dal lato opposto rispetto al centro della mappa; l'Europa è anche nel riquadro,
  // a sinistra, e si apre sempre a destra, così il fumetto non la copre
  const EUROPEI = new Set(europei.map((p) => p.id));
  let aperto = $state<{ titolo: string; iso?: string; sito?: GeoSito; lato: 'destra' | 'sinistra'; da: Element | undefined } | null>(null);
  let pannello = $state<HTMLElement>();
  const anelliPaese = $derived(aperto?.iso ? fumetto(g, catena, aperto.iso) : []);
  async function apri(cosa: { titolo: string; iso?: string; sito?: GeoSito }, x: number, europeo: boolean, da: Element | undefined) {
    aperto = { ...cosa, lato: europeo || x < vx + vw / 2 ? 'destra' : 'sinistra', da };
    await tick();
    pannello?.focus();
  }
  // sulla mappa i Paesi si toccano e basta; da tastiera e con un lettore di schermo si aprono dal menu sotto la mappa, dove torna il focus
  let menuPaese = $state<HTMLSelectElement>();
  let paeseScelto = $state('');
  const paesiMenu = [...PAESI].filter((p) => NOMI[p.id]).sort((a, b) => NOMI[a.id].localeCompare(NOMI[b.id], 'it'));
  function tocca(p: Paese) {
    if (scelte[p.id]) onscegli(scelte[p.id]);
    return apri({ titolo: NOMI[p.id] ?? p.id, iso: p.id }, p.c[0], EUROPEI.has(p.id), menuPaese);
  }
  function apriDalMenu(e: SubmitEvent) {
    e.preventDefault();
    const p = PAESI.find((x) => x.id === paeseScelto);
    if (p) tocca(p);
  }
  const toccaSito = (q: PuntoSito, da: Element) => apri({ titolo: q.sito.nome, sito: q.sito }, q.x, nelRiquadro(q.x, q.y), da);
  function chiudi() {
    const da = aperto?.da as HTMLElement | SVGElement | undefined;
    aperto = null;
    da?.focus({ preventScroll: true });
  }

  const cifre = $derived(v.tabellone(zona));
</script>

{#snippet paese(p: Paese)}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions: i Paesi sono centinaia: da tastiera e con un lettore di schermo si aprono dal menu sotto la mappa -->
  <path d={p.d} fill={fill(p.id)} class="pz" class:ev={ev.has(p.id)} data-testid="paese-{p.id}" aria-hidden="true" onclick={() => tocca(p)}><title>{nome(p.id)}</title></path>
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
  <!-- due tappe vicine si allontanano quanto basta per leggerle tutte e due: una linea le lega al loro posto vero, segnato da un punto -->
  {@const sep = separa(dentro, 19 * k)}
  {#each sep.filter((t) => Math.hypot(t.px - t.x, t.py - t.y) > 0.5) as t (t.i)}
    <line class="richiamo" x1={t.x} y1={t.y} x2={t.px} y2={t.py} style:--c="var(--k-{t.anello})" aria-hidden="true" />
    <circle class="vero" cx={t.x} cy={t.y} r={1.6 * k} style:--c="var(--k-{t.anello})" aria-hidden="true" />
  {/each}
  <!-- la tappa scelta sta sopra le altre -->
  {#each [...sep.filter((t) => t.i !== idx), ...sep.filter((t) => t.i === idx)] as t (t.i)}
    <!-- come i Paesi, fuori dal Tab: da tastiera le tappe si scelgono dall'elenco sotto la mappa -->
    <g class="tappa" class:on={t.i === idx} transform="translate({t.px} {t.py}) scale({k})" style:--c="var(--k-{t.anello})" role="button" tabindex="-1"
      aria-label="{t.i + 1}. {ANELLI[t.i].nome}: {t.luogo}" onclick={() => vai(t.anello)}
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); vai(t.anello); } }}>
      <circle r={t.i === idx ? 9.5 : 8} /><text y="3.2" text-anchor="middle" aria-hidden="true">{t.i + 1}</text>
    </g>
  {/each}
{/snippet}

<Block span={12} id="geo-mappa" title="Chi controlla la catena dell'AI" note={filo ? 'Sei anelli, dalla miniera al modello: il filo mostra da quali Paesi passa un modello.' : 'Sei anelli, dalla miniera al modello: la mappa mostra quanto ne ha ogni Paese.'}
  table={filo ? dati?.tabella ?? null : v.tabella} cite={filo ? dati?.cite ?? CITE_FILO : conSiti ? [...v.cite, ...citeSiti(g.data_center!)] : v.cite}>
  <div class="anello scala" style:--c="var(--k-{anello})">
    {#if fili.length}
      <div class="viste">
        <div class="scelte" role="group" aria-label="Vista">
          <button type="button" aria-pressed={filo ? 'true' : 'false'} onclick={alFilo}>Filo <span class="lungo">della catena</span></button>
          <button type="button" aria-pressed={filo ? 'false' : 'true'} onclick={() => imposta('vista', 'quote')}>Quote <span class="lungo">per Paese</span></button>
        </div>
        {#if filo}
          <div class="scelte" role="group" aria-label="Esempio">
            {#each fili as f (f.key)}<button type="button" aria-pressed={f.key === filo.key ? 'true' : 'false'} aria-label={f.nome} onclick={() => imposta('filo', f.key)}>{f.corto}</button>{/each}
          </div>
        {/if}
      </div>
    {/if}
    <nav class="linea" aria-label="Gli anelli della catena dell'AI">
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
      <div class="mondo" bind:clientWidth={largo}>
        <svg viewBox={VIEWBOX} role="group" aria-label="Mappa del mondo: {filo ? `Filo della catena, ${filo.nome.toLowerCase()}` : v.misura.split(' · ')[0]}">
          <defs>
            <pattern id="geo-tratteggio" width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="2" /></pattern>
          </defs>
          {#each PAESI as p (p.id)}{@render paese(p)}{/each}
          {#each PAESI.filter((p) => unico.has(p.id)) as p (p.id)}<path d={p.d} class="unico" />{/each}
          {#each PAESI.filter((p) => ev.has(p.id)) as p (p.id)}<path d={p.d} class="bordo" />{/each}
          {#if ita}<path d={ita.d} class="italia" />{/if}
          {#each punti as q (q.sito.nome)}{@render cerchio(q, !nelRiquadro(q.x, q.y))}{/each}
          {#if sotto}<rect class="zona" x={EUROPA.x} y={EUROPA.y} width={EUROPA.w} height={EUROPA.h} rx="4" aria-hidden="true" />{/if}
          {#if filo}{@render filoSvg(tappeMondo, kMondo)}{/if}
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

    <form class="paese" onsubmit={apriDalMenu}>
      <label>
        <span>Un Paese</span>
        <select bind:this={menuPaese} bind:value={paeseScelto}>
          <option value="">Scegli</option>
          {#each paesiMenu as p (p.id)}<option value={p.id}>{nome(p.id)}</option>{/each}
        </select>
      </label>
      <button type="submit" disabled={!paeseScelto}>Apri</button>
    </form>

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
    <!-- le note parlano delle quote, e nel filo non ci sono; il censimento dei cluster sta con i data center, che lo citano.
         Dei modelli italiani dicono già la matrice e la scheda dell'Italia -->
    {#if !filo && (anello === 'datacenter' || v.note.length)}
      <ul class="note">
        {#if anello === 'datacenter'}<li>{NOTA_GPU}</li>{/if}
        {#each v.note as n (n)}<li>{n}</li>{/each}
      </ul>
    {/if}
  </div>
</Block>

<style>
  /* i colori degli anelli, la scala (--alto) e il segnalino del primo stanno in app.css: li usa anche la figura della card in home */
  .anello { --sito: color-mix(in srgb, var(--fg) 55%, transparent);
    display: grid; gap: var(--s2); min-width: 0; }
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
  /* il colore dell'anello è già nel tondo acceso della linea, sopra: il titolo non lo ripete */
  .titolo { display: grid; gap: 4px; }
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
  .europa { position: absolute; border-radius: var(--r-sm); border: 1px solid var(--fg-3); overflow: hidden; background: color-mix(in srgb, var(--bg) 60%, #9fc3d9); }
  .europa .pz { stroke-width: .3; }
  .europa .italia { stroke-width: 1; stroke-dasharray: 1.5 .8; }
  /* le due scritte del riquadro hanno un fondo di carta: sopra i confini si leggono */
  .in-t { position: absolute; left: 0; top: 0; padding: 2px 6px; border-bottom-right-radius: var(--r-sm); background: color-mix(in srgb, var(--card) 88%, transparent);
    font-size: 11px; line-height: 14px; font-weight: 600; color: var(--fg-2); pointer-events: none; }
  .et.it { font-size: 11px; font-weight: 700; color: var(--accent); padding: 0 4px; border-radius: 4px; background: color-mix(in srgb, var(--card) 85%, transparent); text-shadow: none; }
  .fumetto { position: absolute; top: 8px; z-index: 2; width: min(340px, 44%); display: grid; gap: var(--s1); padding: 12px; border-radius: var(--r-md);
    background: var(--card); border: 1px solid var(--line-2); box-shadow: 0 6px 20px rgb(0 0 0 / .18); }
  .fumetto.destra { right: 8px; }
  .fumetto.sinistra { left: 8px; }
  .fumetto .testa { display: flex; align-items: center; justify-content: space-between; gap: var(--s1); }
  .fumetto h5 { margin: 0; font-size: 18px; line-height: 24px; font-weight: 700; }
  .chiudi { min-width: 44px; min-height: 44px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--line-2); background: var(--bg); cursor: pointer; font-size: 14px; color: var(--fg-2); }
  .fumetto dl { margin: 0; display: grid; gap: 6px; }
  .fumetto .anelli-righe dt::before { content: ''; display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--c); margin-right: 6px; vertical-align: 1px; }
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
  .paese { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s1); }
  /* le voci del menu sono lunghe: non decidono loro la larghezza, altrimenti a 320px la pagina scorre */
  .paese label { display: flex; align-items: center; gap: var(--s1); flex: 0 1 28rem; min-width: 0; font-size: 14px; line-height: 24px; color: var(--fg-2); }
  .paese span { white-space: nowrap; }
  .paese select { flex: 1 1 0; width: 0; min-width: 0; background-color: var(--bg); }
  .paese button { min-height: 44px; padding: 0 var(--s2); border-radius: 999px; border: 1px solid var(--line-2); background: var(--bg); cursor: pointer; font-size: 14px; color: var(--fg-2); }
  .paese button:disabled { cursor: default; opacity: .6; }
  .didascalia { margin: 0; font-size: 13px; line-height: 20px; color: var(--fg-2); }
  @media (max-width: 599px) {
    /* sotto la mappa del mondo, a tutta larghezza: la posizione nell'oceano non vale più */
    .europa { position: relative; left: auto !important; top: auto !important; width: auto !important; margin-top: var(--s1); }
    .in-t { font-size: 12px; }
    .fumetto.destra, .fumetto.sinistra { position: relative; inset: auto; width: auto; margin-top: var(--s1); box-shadow: none; }
  }
  @media (max-width: 560px) {
    .linea { padding-bottom: 20px; }
    .pal { width: 36px; height: 36px; font-size: 13px; border-width: 2px; }
    .linea ol::before { top: 16px; }
    .lab { display: none; }
    li.on .lab { display: block; position: absolute; top: 46px; white-space: nowrap; }
    li:first-child.on .lab { left: 0; } li:last-child.on .lab { right: 0; }
  }

  .viste { display: flex; flex-wrap: wrap; gap: var(--s1) var(--s2); }
  .viste .scelte button[aria-pressed='true'] { background: var(--fg); border-color: var(--fg); color: var(--card); }
  /* sul telefono la vista e l'esempio stanno su una riga ciascuno: «Filo» e «Quote» bastano, il resto del nome resta per chi usa un lettore di schermo */
  @media (max-width: 560px) {
    .viste .scelte { flex-wrap: nowrap; }
    .viste .scelte button { padding-inline: var(--s1); }
    .lungo { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  }
  /* l'arco che arriva alla fermata scelta si disegna; con «riduci movimento» no (app.css) */
  .arco { fill: none; stroke: var(--c); stroke-width: 1.2; stroke-linecap: round; opacity: .6; pointer-events: none; }
  .arco.on { stroke-width: 2.2; opacity: 1; animation: traccia .8s ease-out; }
  @keyframes traccia { from { stroke-dasharray: 100; stroke-dashoffset: 100; } to { stroke-dasharray: 100; stroke-dashoffset: 0; } }
  .europa .arco { stroke-width: .8; }
  .europa .arco.on { stroke-width: 1.5; }
  .richiamo { stroke: var(--c); stroke-width: 1.5px; vector-effect: non-scaling-stroke; pointer-events: none; }
  .vero { fill: var(--c); stroke: var(--card); stroke-width: 1px; vector-effect: non-scaling-stroke; pointer-events: none; }
  .zona { fill: none; stroke: var(--fg-2); stroke-width: 1.5px; vector-effect: non-scaling-stroke; pointer-events: none; }
  .tappa { cursor: pointer; }
  .tappa circle { fill: var(--c); stroke: #fff; stroke-width: 1.2; }
  .tappa.on circle { stroke: var(--fg); stroke-width: 1.8; }
  .tappa text { font-size: 9px; font-weight: 800; fill: #fff; pointer-events: none; }
  .tappa:focus-visible { outline: none; }
  .tappa:focus-visible circle { stroke: var(--accent); stroke-width: 2.4; }
  .esempio { margin: 0; font-size: 14px; line-height: 20px; font-style: italic; color: var(--fg-2); }
  .tappe { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
  /* il colore della tappa sta nel suo tondo numerato */
  .tappe li { display: grid; gap: 2px; padding: 6px 8px; border-radius: var(--r-sm); }
  .tappe li[aria-current='step'] { background: color-mix(in srgb, var(--c) 7%, var(--card)); }
  .tappe button { display: flex; align-items: center; gap: 10px; min-height: 44px; width: 100%; padding: 0; border: 0; background: none; text-align: left;
    font: inherit; font-size: 15px; line-height: 20px; color: var(--fg); cursor: pointer; }
  .tn { flex: none; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: var(--c); color: #fff; font-weight: 700; font-size: 13px; }
  .tappe p { margin: 0 0 0 38px; font-size: 13px; line-height: 20px; color: var(--fg-2); overflow-wrap: anywhere; }
  .tappe a { color: inherit; }

  .tabellone { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: var(--s1); margin: 0; }
  .cifra { display: grid; gap: 2px; align-content: start; padding: 12px; border-radius: var(--r-sm); background: var(--bg); }
  dt { font-size: 12px; line-height: 16px; color: var(--fg-3); }
  dd { margin: 0; display: grid; }
  dd b { font-size: 16px; line-height: 20px; }
  dd strong { font-size: 24px; line-height: 32px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .cifra.primo strong { font-size: 32px; line-height: 40px; color: var(--alto); }
  .mod { font-size: 13px; line-height: 18px; color: var(--fg-2); }
  .vuoto { font-size: 15px; line-height: 22px; font-style: italic; color: var(--fg-2); }
  /* l'Italia ha accanto al nome il tratteggio del suo contorno sulla mappa */
  .cifra.it dt::before { content: ''; display: inline-block; width: 16px; margin-right: 6px; vertical-align: middle; border-top: 2px dashed var(--accent); }
  .note { font-size: 13px; line-height: 20px; color: var(--fg-2); padding-left: 1.2em; margin: 0; max-width: var(--misura); }
</style>
