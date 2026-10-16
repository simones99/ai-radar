<script lang="ts">
  import { onMount } from 'svelte';
  import { FILES, loadAll } from './lib/data/load';
  import type { Dataset } from './lib/data/types';
  import { PHOTOS } from './lib/photos';
  import { dayWith, isoDay } from './lib/text/format';
  import Doors from './lib/tiles/Doors.svelte';
  import SourcesStatus from './lib/tiles/SourcesStatus.svelte';
  import { TILES } from './lib/tiles/registry';
  import TileGrid from './lib/tiles/TileGrid.svelte';

  const today = new Date();
  let phase = $state<'loading' | 'ready' | 'error'>('loading');
  let data = $state<Dataset>({});

  async function load() {
    phase = 'loading';
    const r = await loadAll();
    data = r.data;
    phase = r.failed.length === FILES.length ? 'error' : 'ready';
  }
  onMount(load);

  const FONTI = [
    ['Epoch AI', 'https://epoch.ai/data/ai-models'], ['Artificial Analysis', 'https://artificialanalysis.ai/'], ['arXiv', 'https://arxiv.org'],
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

  {#if phase === 'error'}
    <section class="alert" role="alert">
      <p>Non riesco a caricare i dati.</p>
      <button type="button" onclick={load}>Riprova</button>
    </section>
  {:else}
    <section class="hero">
      <p class="small muted">Settimana {dayWith('del', isoDay(today))}</p>
      <h1>Su cosa formarti e cosa succede all'AI in Italia, con dati aperti aggiornati ogni lunedì.</h1>
    </section>
  {/if}

  {#if phase === 'ready'}
    <Doors {data} {today} />
    <TileGrid {data} {today} />
  {:else if phase === 'loading'}
    <p class="muted">Caricamento dei dati…</p>
  {/if}

  <footer class="credits" id="crediti">
    <h2>Foto e fonti</h2>
    <ul>
      {#each TILES as t (t.id)}
        {@const p = PHOTOS[t.id]}
        <li>{t.label}: <a href={p.pagina} target="_blank" rel="noopener">{p.titolo}</a> · {p.autore} · {#if p.licenzaUrl}<a href={p.licenzaUrl} target="_blank" rel="noopener">{p.licenza}</a>{:else}{p.licenza}{/if} · Wikimedia Commons</li>
      {/each}
    </ul>
    <p class="small muted">
      Dati di {#each FONTI as [n, u], i (n)}<a href={u} target="_blank" rel="noopener">{n}</a>{i < FONTI.length - 1 ? ', ' : '.'}{/each}
      Le notizie mostrano solo titolo, data e link agli articoli originali. Il progetto non è affiliato a nessuna delle fonti.
      <a href="THIRD_PARTY_LICENSES.txt">Licenze del software</a>.
    </p>
    <SourcesStatus status={data.status} />
  </footer>
</div>

<style>
  .bar { display: flex; justify-content: space-between; align-items: center; gap: var(--s2); }
  .logo { display: flex; align-items: center; gap: var(--s1); font-weight: 700; font-size: 20px; line-height: 24px; letter-spacing: -.01em; }
  .logo i { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--fg); position: relative; }
  .logo i::after { content: ''; position: absolute; inset: 3px; border-radius: 50%; background: var(--accent); }
  nav { display: flex; gap: var(--s3); font-size: 14px; }
  nav a { text-decoration: none; color: var(--fg-2); min-height: 40px; display: inline-flex; align-items: center; }
  @media (hover: hover) { nav a:hover { color: var(--fg); } }
  .hero { display: grid; gap: var(--s2); max-width: 880px; padding-top: var(--s4); }
  h1 { font-weight: 400; font-size: 20px; line-height: 32px; color: var(--fg-2); max-width: 60ch; }
  .alert { display: flex; flex-wrap: wrap; gap: var(--s2); align-items: center; background: var(--card); border-radius: var(--r-lg); box-shadow: var(--shadow); padding: var(--s3); }
  .alert button { border: 0; border-radius: 999px; background: var(--fg); color: var(--card); padding: var(--s1) var(--s3); min-height: 40px; cursor: pointer; }
  .credits { display: grid; gap: var(--s3); border-top: 1px solid var(--line-2); padding-top: var(--s3); }
  .credits h2 { font-weight: 600; font-size: 20px; line-height: 24px; }
  .credits ul { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--s1) var(--s3); font-size: 12px; line-height: 16px; color: var(--fg-2); }
</style>
