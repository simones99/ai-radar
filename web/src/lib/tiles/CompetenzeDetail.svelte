<script lang="ts">
  import Block from '../charts/Block.svelte';
  import type { Cite } from '../charts/types';
  import MovesPanel from '../charts/MovesPanel.svelte';
  import Radar from '../charts/Radar.svelte';
  import { radarRows } from '../data/derive';
  import type { Quadrant } from '../data/types';
  import { apri, toHash } from '../router';
  import { per10k, signedPct } from '../text/format';
  import { headSkill } from '../text/frasi';
  import Detail from './Detail.svelte';
  import SkillView from './SkillView.svelte';
  import type { DetailProps } from './types';

  let { data, today, tile, elemento, onclose }: DetailProps = $props();

  const rows = $derived(data.radar ? radarRows(data.radar) : []);
  const quadranti = $derived(data.radar?.quadranti ?? ({ 'impara-ora': 'Impara ora', prova: 'Da provare', consolida: 'Da consolidare', osserva: "Tieni d'occhio" } as Record<Quadrant, string>));
  const skill = $derived(rows.find((r) => r.id === elemento) ?? null);
  const head = $derived(skill ? headSkill(skill, quadranti) : tile.head(data, today));
  const old = $derived(!!data.radar && data.radar.versione !== 2);
  const all = $derived(data.radar?.versione === 2 ? data.radar.competenze : []);
  const placed = $derived(new Set(rows.map((r) => r.id)));
  let hovered = $state<string | null>(null); // anteprima al passaggio del mouse sui movimenti
  const arxivDown = $derived(data.status?.fonti?.arxiv?.stato === 'errore' ? 'In questo giro arXiv non ha risposto: lo slancio viene dagli altri segnali. ' : '');
  const sources: Cite = [
    { t: 'Fonti: ' }, { t: 'arXiv', href: 'https://arxiv.org' }, { t: ', ' }, { t: 'GitHub', href: 'https://github.com' },
    { t: ', ' }, { t: 'The Adzuna API', href: 'https://www.adzuna.co.uk' }, { t: '.' },
  ];
  const METODO = [
    'Slancio: quanto è cambiata negli ultimi 6 mesi interi la quota della competenza sul totale dell’AI. Si stima con una retta sui dati di ogni mese, non confrontando solo due periodi.',
    'Paper: quota dei paper AI su arXiv che la citano nell’abstract. Repository: quota dei nuovi repository GitHub con il suo topic sui nuovi repository AI (topic llm, ai, artificial-intelligence, generative-ai). Annunci: quota degli annunci che la citano, quando ci sono almeno 8 settimane di rilevazioni con la stessa ricerca.',
    'I segnali si combinano pesando di più quelli più precisi; nessuno pesa più di due terzi.',
    'Domanda: annunci attivi che citano la competenza ogni 10.000 annunci del Paese, media tra i Paesi.',
    'Quadranti a soglie fisse. Slancio sopra 0 (cresce più dell’AI) e almeno 3 annunci ogni 10mila: Impara ora. Solo lo slancio: Da provare. Solo la domanda: Da consolidare. Nessuna delle due: Tieni d’occhio.',
    'Prudenza: il quadrante cambia solo se il calcolo di due mesi di fila dà il quadrante nuovo. Nel frattempo la competenza è «in movimento verso» il quadrante nuovo.',
    'Dato incerto (punto vuoto): il margine all’80% dello slancio è largo, l’estremo alto supera di oltre il 55% quello basso. Succede con pochi paper o repository, o con andamenti irregolari.',
    'Le parole cercate per ogni competenza sono in config/skills.yaml. Negli annunci si cerca per tutte una frase esatta in inglese, così le competenze sono confrontabili.',
  ];
</script>

<Detail {tile} {head} {onclose}>
  {#if skill}
    <SkillView row={skill} {quadranti} storico={data.radar?.storico ?? []} />
  {:else if !rows.length}
    <Block span={12} title="Radar delle competenze"
      missing={old ? 'Il radar si aggiorna al prossimo giro della pipeline.' : 'Il radar si calcola dopo il primo aggiornamento di arXiv, GitHub e Adzuna.'} />
  {:else}
    <Block span={8} title="Radar delle competenze"
      note="Le linee sono soglie fisse: cresce più dell’AI, almeno 3 annunci ogni 10mila. Le frecce partono da dove era un mese fa. Punto vuoto: dato incerto. Tocca un punto per aprire la competenza."
      cite={arxivDown ? [{ t: arxivDown }, ...sources] : sources}
      table={{ cols: ['Competenza', 'Quadrante', 'Slancio in 6 mesi', 'Annunci ogni 10mila', 'Un mese fa (slancio · annunci)'],
               rows: rows.map((r) => [r.nome, quadranti[r.quadrante], signedPct(r.slancio), per10k(r.domanda),
                                      r.hasPrev ? `${signedPct(r.sp as number)} · ${r.dp != null ? per10k(r.dp) : '—'}` : '—']) }}>
      <Radar {rows} {quadranti} highlight={hovered} onpick={(id) => apri('competenze', id)} />
    </Block>
    <Block span={4} title="Movimenti del mese" cite={sources}>
      <MovesPanel {rows} {quadranti} bind:hovered />
    </Block>
    <Block span={12} title="Le competenze una per una">
      <!-- svelte-ignore a11y_no_noninteractive_tabindex: la tabella scorre in orizzontale e deve essere raggiungibile da tastiera -->
      <div class="tw" tabindex="0" role="region" aria-label="Le competenze una per una">
        <table>
          <thead><tr><th scope="col">Competenza</th><th scope="col">Cosa è</th><th scope="col">Quadrante</th><th scope="col">Slancio</th><th scope="col">Annunci ogni 10mila</th></tr></thead>
          <tbody>
            {#each all as c (c.id)}
              <tr>
                <th scope="row">{#if placed.has(c.id)}<a href={toHash('competenze', c.id)}>{c.nome}</a>{:else}{c.nome}{/if}</th>
                <td class="desc">{c.descrizione}</td>
                <td>{c.quadrante ? quadranti[c.quadrante] : 'dati insufficienti'}{c.incerto ? ' · incerto' : ''}</td>
                <td class="num">{c.slancio != null ? signedPct(c.slancio) : '—'}</td>
                <td class="num">{c.domanda != null ? per10k(c.domanda) : '—'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </Block>
    <Block span={12} title="Come si calcola">
      <ul class="method">{#each METODO as m (m)}<li>{m}</li>{/each}</ul>
    </Block>
  {/if}
</Detail>

<style>
  .method { margin: 0; padding-left: var(--s3); display: grid; gap: var(--s1); color: var(--fg-2); font-size: 14px; line-height: 24px; max-width: 80ch; }
  .tw { overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; line-height: 24px; font-variant-numeric: tabular-nums; }
  th, td { text-align: left; padding: var(--s1); border-bottom: 1px solid var(--line); white-space: nowrap; vertical-align: top; }
  thead th { font-size: 12px; line-height: 16px; color: var(--fg-3); font-weight: 500; }
  tbody th { font-weight: 500; }
  td.desc { white-space: normal; min-width: 24ch; color: var(--fg-2); }
  td.num { text-align: right; }
</style>
