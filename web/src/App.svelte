<script lang="ts">
  import { onMount } from 'svelte';
  import { FILES, loadAll, type FileKey } from './lib/data/load';
  import type { Dataset } from './lib/data/types';
  import { PHOTOS } from './lib/photos';
  import { dayWith } from './lib/text/format';
  import Doors from './lib/tiles/Doors.svelte';
  import SourcesStatus from './lib/tiles/SourcesStatus.svelte';
  import { TILES } from './lib/tiles/registry';
  import TileGrid from './lib/tiles/TileGrid.svelte';

  const today = new Date();
  let phase = $state<'loading' | 'ready' | 'error'>('loading');
  let data = $state<Dataset>({});
  let mancanti = $state<FileKey[]>([]);

  async function load() {
    phase = 'loading';
    const r = await loadAll();
    data = r.data;
    mancanti = r.failed;
    phase = r.failed.length === FILES.length ? 'error' : 'ready';
  }
  onMount(load);

  const FONTI = [
    ['Epoch AI', 'https://epoch.ai/data/ai-models'], ['arXiv', 'https://arxiv.org'],
    ['GitHub', 'https://github.com'], ['Hugging Face', 'https://huggingface.co'], ['The Adzuna API', 'https://www.adzuna.co.uk'],
    ['Eurostat', 'https://ec.europa.eu/eurostat'], ['Our World in Data', 'https://ourworldindata.org'],
  ];
</script>

<a class="skip" href="#temi">Vai ai temi</a>
<div class="wrap">
  <header class="bar">
    <span class="logo"><i aria-hidden="true"></i>AI Radar</span>
    <nav aria-label="Pagina"><a href="#crediti">Foto e fonti</a><a href="#stato">Stato delle fonti</a></nav>
  </header>

  <main>
  {#if phase === 'error'}
    <section class="alert" role="alert">
      <p>Non riesco a caricare i dati.</p>
      <button type="button" class="riprova" onclick={load}>Riprova</button>
    </section>
  {:else}
    {#if phase === 'ready' && mancanti.length}
      <section class="alert" role="alert">
        <p>Una parte dei dati non è arrivata: alcune card restano vuote. <a href="#stato">Quali</a></p>
        <button type="button" class="riprova" onclick={load}>Riprova</button>
      </section>
    {/if}
    <div class="intro">
      <section class="hero">
        <!-- la settimana dei dati, non quella dell'orologio di chi legge -->
        {#if data.status?.aggiornato}<p class="small muted">Settimana {dayWith('del', data.status.aggiornato)}</p>{/if}
        <h1>Su cosa formarti e cosa succede all'AI in Italia, con dati aperti aggiornati ogni lunedì.</h1>
      </section>
      {#if phase === 'ready'}<Doors {data} {today} />{/if}
    </div>
  {/if}

  {#if phase === 'ready'}
    <TileGrid {data} {today} />
  {:else if phase === 'loading'}
    <p class="muted">Caricamento dei dati…</p>
  {/if}
  </main>

  <footer class="colophon">
    <section class="credits" id="crediti" aria-labelledby="crediti-h">
      <h2 id="crediti-h">Foto e fonti</h2>
      <ul>
        {#each TILES as t (t.id)}
          {@const p = PHOTOS[t.id]}
          <li>{t.label}: <a href={p.pagina} target="_blank" rel="noopener">{p.titolo}</a>&nbsp;· {p.autore}&nbsp;· {#if p.licenzaUrl}<a href={p.licenzaUrl} target="_blank" rel="noopener">{p.licenza}</a>{:else}{p.licenza}{/if}&nbsp;· Wikimedia Commons</li>
        {/each}
      </ul>
      <p class="small muted">
        Dati di {#each FONTI as [n, u], i (n)}<a href={u} target="_blank" rel="noopener">{n}</a>{i < FONTI.length - 1 ? ', ' : '.'}{/each}
        Le notizie mostrano solo titolo, data e link agli articoli originali. Il progetto non è affiliato a nessuna delle fonti.
        <a href="THIRD_PARTY_LICENSES.txt">Licenze del software</a>.
      </p>
    </section>
    <!-- senza nessun file l'avviso e il suo Riprova stanno già in testa: qui basta dire che lo stato non è arrivato -->
    <SourcesStatus status={data.status} {mancanti} onriprova={phase === 'ready' ? load : undefined} />
  </footer>
</div>

<style>
  /* dove non stanno in una riga i link vanno sotto il nome, ognuno intero */
  .bar { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0 var(--s2); }
  .logo { white-space: nowrap; display: flex; align-items: center; gap: var(--s1); font-weight: 700; font-size: 20px; line-height: 24px; letter-spacing: -.01em; }
  .logo i { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--fg); position: relative; }
  .logo i::after { content: ''; position: absolute; inset: 3px; border-radius: 50%; background: var(--accent); }
  nav { display: flex; gap: var(--s3); font-size: 14px; }
  nav a { white-space: nowrap; text-decoration: none; color: var(--fg-2); min-height: 40px; display: inline-flex; align-items: center; }
  @media (hover: hover) { nav a:hover { color: var(--fg); } }
  .intro { display: grid; gap: var(--s6); }
  .hero { display: grid; gap: var(--s2); max-width: 880px; padding-top: var(--s4); }
  /* main non fa una scatola sua: i suoi figli stanno nella griglia di .wrap, come la testata e il colophon */
  main { display: contents; }
  /* da 1200px: intro e porte in una colonna a sinistra, le card a destra; con una card aperta la card prende tutto, e la h1 resta per i lettori di schermo */
  @media (min-width: 1200px) {
    .wrap { max-width: 1920px; grid-template-columns: minmax(300px, 380px) minmax(0, 1fr); column-gap: var(--s5); }
    .wrap > :global(*), main > :global(*) { grid-column: 1 / -1; }
    main > .intro { grid-column: 1; align-self: start; position: sticky; top: var(--s3); gap: var(--s4); }
    main > :global(.board) { grid-column: 2; }
    .wrap:has(:global(.board.has-open)) .intro { display: contents; }
    .wrap:has(:global(.board.has-open)) .intro :global(.doors) { display: none; }
    .wrap:has(:global(.board.has-open)) .hero p { display: none; }
    .wrap:has(:global(.board.has-open)) .hero { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    main > :global(.board.has-open) { grid-column: 1 / -1; }
    .hero { padding-top: 0; }
  }
  h1 { font-weight: 600; font-size: clamp(28px, 3.4vw, 36px); line-height: 1.15; letter-spacing: -.01em; max-width: 24ch; }
  /* nella colonna stretta accanto alle card */
  @media (min-width: 1200px) { h1 { font-size: 28px; } }
  .alert { display: flex; flex-wrap: wrap; gap: var(--s2); align-items: center; background: var(--card); border-radius: var(--r-lg); box-shadow: var(--shadow); padding: var(--s3); }
  /* il colophon: crediti e stato delle fonti affiancati da 960px */
  .colophon { --fondo: var(--bg); display: grid; gap: var(--s5); border-top: 1px solid var(--line-2); padding-top: var(--s3); }
  @media (min-width: 960px) { .colophon { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); column-gap: var(--s6); } }
  .credits { display: grid; gap: var(--s3); align-content: start; }
  .credits h2 { font-weight: 600; font-size: 20px; line-height: 24px; }
  .credits > p { max-width: var(--misura); }
  /* in colonne di giornale: ogni credito segue il precedente, senza i vuoti di una griglia allineata al più lungo della riga */
  .credits ul { list-style: none; margin: 0; padding: 0; columns: 220px; column-gap: var(--s3); font-size: 12px; line-height: 16px; color: var(--fg-2); }
  .credits li { break-inside: avoid; margin-bottom: var(--s1); }
</style>
