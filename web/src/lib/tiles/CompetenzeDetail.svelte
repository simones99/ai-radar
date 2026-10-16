<script lang="ts">
  import Block from '../charts/Block.svelte';
  import type { Cite } from '../charts/types';
  import DataTable from '../charts/DataTable.svelte';
  import MovesPanel from '../charts/MovesPanel.svelte';
  import Radar from '../charts/Radar.svelte';
  import { radarRows } from '../data/derive';
  import type { Quadrant } from '../data/types';
  import Detail from './Detail.svelte';
  import type { DetailProps } from './types';

  let { data, today, tile, elemento, onclose }: DetailProps = $props();

  const head = $derived(tile.head(data, today));
  const rows = $derived(data.radar ? radarRows(data.radar) : []);
  const quadranti = $derived(data.radar?.quadranti ?? ({ 'impara-ora': 'Impara ora', prova: 'Da provare', consolida: 'Da consolidare', osserva: "Tieni d'occhio" } as Record<Quadrant, string>));
  let highlight = $state<string | null>(null); // selezione fissata (clic, tocco, link diretto)
  let hovered = $state<string | null>(null); // anteprima al passaggio del mouse
  $effect(() => {
    highlight = elemento && rows.some((r) => r.id === elemento) ? elemento : null;
  });
  const pct = (v: number | null) => (v == null ? '—' : Math.round(v * 100));
  const basis = $derived(data.radar?.base_domanda === 'lavoro'
    ? 'Domanda dagli annunci di lavoro in Europa e USA (The Adzuna API).'
    : 'Senza la chiave di Adzuna la domanda si stima dai nuovi repository open source degli ultimi 3 mesi.');
  const arxivDown = $derived(data.status?.fonti?.arxiv?.stato === 'errore' ? ' In questo giro arXiv non ha risposto: lo slancio viene solo da GitHub.' : '');
  const sources = $derived<Cite>([
    { t: 'Fonti: ' }, { t: 'arXiv', href: 'https://arxiv.org' }, { t: ', ' }, { t: 'GitHub', href: 'https://github.com' },
    ...(data.radar?.base_domanda === 'lavoro' ? [{ t: ', ' }, { t: 'The Adzuna API', href: 'https://www.adzuna.co.uk' }] : []),
    { t: '.' },
  ]);
  const METODO = [
    'Slancio e domanda sono ranghi percentili da 0 a 100 tra le competenze del radar: 0 è la più bassa, 100 la più alta.',
    "Paper: quota di paper AI su arXiv che citano la competenza nell'abstract, ultimi 3 mesi interi rispetto ai 3 precedenti.",
    'Repository: nuovi repository GitHub con il topic della competenza, ultimi 3 mesi rispetto ai 3 precedenti.',
    'Lavoro: annunci attivi che citano la competenza ogni 10.000 annunci del Paese, media tra i Paesi.',
    "Quadranti: sopra la mediana su entrambe le misure = Impara ora; solo slancio = Da provare; solo domanda = Da consolidare; nessuna delle due = Tieni d'occhio.",
    'La posizione di un mese fa usa le stesse formule sulle serie fermate al mese precedente. Finché manca una rilevazione del lavoro di almeno 4 settimane prima, il quadrante di allora usa la domanda di oggi.',
    'Le parole cercate per ogni competenza sono in config/skills.yaml. Negli annunci si cerca per tutte una frase esatta in inglese, così le competenze sono confrontabili.',
  ];
</script>

<Detail {tile} {head} {onclose}>
  {#if !rows.length}
    <Block span={12} title="Radar delle competenze" missing="Il radar si calcola dopo il primo aggiornamento di arXiv e GitHub." />
  {:else}
    <Block span={8} title="Radar delle competenze"
      note="Posizione rispetto alle altre competenze: al centro la mediana. Le frecce partono da dove era un mese fa."
      cite={[{ t: basis + arxivDown + ' ' }, ...sources]}
      table={{ cols: ['Competenza', 'Quadrante', 'Slancio', 'Domanda', 'Un mese fa (slancio / domanda)'],
               rows: rows.map((r) => [r.nome, quadranti[r.quadrante], pct(r.slancio), pct(r.domanda), r.hasPrev ? `${pct(r.sp)} / ${pct(r.dp)}` : '—']) }}>
      <Radar {rows} {quadranti} highlight={hovered ?? highlight} onpick={(id) => (highlight = highlight === id ? null : id)} />
    </Block>
    <Block span={4} title="Movimenti del mese" cite={sources}
      note={data.radar?.domanda_prec_attuale ? 'Per ora si muove solo lo slancio: la domanda di un mese fa arriva con una rilevazione del lavoro di almeno 4 settimane prima.' : null}>
      <MovesPanel {rows} {quadranti} bind:highlight bind:hovered />
    </Block>
    <Block span={12} title="Le competenze una per una">
      <DataTable cols={['Competenza', 'Cosa è', 'Quadrante', 'Slancio', 'Domanda']}
        rows={rows.map((r) => [r.nome, r.descrizione, quadranti[r.quadrante], pct(r.slancio), pct(r.domanda)])} />
    </Block>
    <Block span={12} title="Come si calcola">
      <ul class="method">{#each METODO as m (m)}<li>{m}</li>{/each}</ul>
    </Block>
  {/if}
</Detail>

<style>
  .method { margin: 0; padding-left: var(--s3); display: grid; gap: var(--s1); color: var(--fg-2); font-size: 14px; line-height: 24px; max-width: 80ch; }
</style>
