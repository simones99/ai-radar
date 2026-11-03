<script lang="ts">
  import { onMount } from 'svelte';
  import Block from '../charts/Block.svelte';
  import type { Cite } from '../charts/types';
  import MovesPanel from '../charts/MovesPanel.svelte';
  import Radar from '../charts/Radar.svelte';
  import { competenzeDi, MERCATI_DA_SCEGLIERE, mercatoScelto, radarDisponibile, radarRows, rigaPagina, type CompetenzaNelMercato } from '../data/derive';
  import type { Quadrant } from '../data/types';
  import { apri, toHash } from '../router';
  import { mercato as sceltaMercato, ruolo as sceltaRuolo } from '../scelta.svelte';
  import { conAnnunci, monthName, per10k, signedPct } from '../text/format';
  import { headSkill, ITALIA_SENZA_DATO } from '../text/frasi';
  import Detail from './Detail.svelte';
  import SkillView from './SkillView.svelte';
  import type { DetailProps } from './types';

  let { data, today, tile, elemento, params, onclose }: DetailProps = $props();

  const mercato = $derived(mercatoScelto(params.mercato));
  const italia = $derived(mercato === 'italia');
  const rows = $derived(data.radar ? radarRows(data.radar, mercato) : []);
  const radarVuoto = $derived(!radarDisponibile(data.radar)); // con tutti i Paesi: senza il dato italiano la scelta resta, per tornare indietro
  const quadranti = $derived(data.radar?.quadranti ?? ({ 'impara-ora': 'Impara ora', prova: 'Da provare', consolida: 'Da consolidare', osserva: "Tieni d'occhio" } as Record<Quadrant, string>));
  const ruoli = $derived(data.radar?.ruoli ?? []);
  const ruolo = $derived(ruoli.find((r) => r.id === params.ruolo) ?? null); // un ruolo sconosciuto nel link si ignora
  onMount(() => {
    sceltaRuolo.allinea(params.ruolo, ruoli.map((r) => r.id));
    sceltaMercato.allinea(params.mercato, MERCATI_DA_SCEGLIERE);
  });
  const skill = $derived(data.radar && elemento ? rigaPagina(data.radar, elemento, mercato) : null);
  const head = $derived(skill ? headSkill(skill, quadranti, ruoli, mercato) : tile.head(data, today, params));
  const old = $derived(!!data.radar && data.radar.versione !== 2);
  const all = $derived(data.radar ? competenzeDi(data.radar, mercato) : []);
  const colAnnunci = $derived(italia ? 'Annunci in Italia' : 'Annunci ogni 10mila');
  const annunciDi = (c: CompetenzaNelMercato, domanda: number) => (italia ? conAnnunci(domanda, c.annunci) : per10k(domanda));
  const placed = $derived(new Set(rows.map((r) => r.id)));
  const delRuolo = $derived(ruolo ? all.filter((c) => c.ruoli?.includes(ruolo.id)).map((c) => c.id) : null);
  const altro = (id: string) => delRuolo != null && !delRuolo.includes(id);
  const elenco = $derived(delRuolo ? [...all.filter((c) => !altro(c.id)), ...all.filter((c) => altro(c.id))] : all); // prima il ruolo, l'ordine resta
  const meseMovimenti = $derived(data.radar?.storico?.at(-1)?.mese); // i movimenti vanno di mese in mese: non è per forza il mese di chi legge
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
    'Domanda: annunci attivi che citano la competenza ogni 10.000 annunci del Paese. Ogni Paese vale la mediana delle sue ultime 4 rilevazioni con la stessa ricerca, così una settimana strana non sposta il numero. Il Paese a metà classifica è la mediana tra gli 8 Paesi: con un numero pari di Paesi, il valore a metà tra i due centrali. Il metodo è cambiato a novembre 2026: prima contava solo l’ultima rilevazione, e un solo Paese poteva spostare il valore.',
    'Quadranti a soglie fisse. Slancio sopra 0 (cresce più dell’AI) e almeno 3 annunci ogni 10mila: Impara ora. Solo lo slancio: Da provare. Solo la domanda: Da consolidare. Nessuna delle due: Tieni d’occhio.',
    'Prudenza: il quadrante cambia solo se il calcolo di due mesi di fila dà il quadrante nuovo. Nel frattempo la competenza è «in movimento verso» il quadrante nuovo.',
    'Con «Italia» la domanda è quella italiana, la mediana delle ultime 4 rilevazioni in Italia, e accanto si legge il numero di annunci che ci sta dietro. Lo slancio è unico: la crescita si misura nel mondo e non cambia. La soglia è la stessa, 3 annunci ogni 10mila. I quadranti sono propri, con la stessa conferma di due mesi di fila.',
    'Dato incerto (punto vuoto): il margine all’80% dello slancio è largo, l’estremo alto supera di oltre il 55% quello basso. Succede con pochi paper o repository, o con andamenti irregolari. Un margine che comprende lo zero non basta a rendere incerto il dato, ma dice che la competenza potrebbe non crescere più dell’AI.',
    'Le parole cercate per ogni competenza sono in config/skills.yaml. Negli annunci si cerca per tutte una frase esatta in inglese, così le competenze sono confrontabili.',
  ];
</script>

<Detail {tile} {head} {onclose}>
  {#if skill}
    <SkillView row={skill} {quadranti} {mercato} storico={data.radar?.storico ?? []} indietro={toHash('competenze', null, params)} />
  {:else if radarVuoto}
    <Block span={12} title="Radar delle competenze"
      missing={old ? 'Il radar si aggiorna al prossimo giro della pipeline.' : 'Il radar non è disponibile in questo momento.'} />
  {:else}
    <div class="scelte">
      {#if ruoli.length}
        <div class="chips" role="group" aria-label="Il tuo ruolo">
          <button type="button" aria-pressed={ruolo === null} onclick={() => sceltaRuolo.scegli(null)}>Tutti</button>
          {#each ruoli as r (r.id)}<button type="button" aria-pressed={ruolo?.id === r.id} onclick={() => sceltaRuolo.scegli(r.id)}>{r.nome}</button>{/each}
        </div>
      {/if}
      <div class="chips" role="group" aria-label="Mercato">
        <button type="button" aria-pressed={mercato === 'tutti'} onclick={() => sceltaMercato.scegli(null)}>Tutti i Paesi</button>
        <button type="button" aria-pressed={mercato === 'italia'} onclick={() => sceltaMercato.scegli('italia')}>Italia</button>
      </div>
    </div>
    {#if rows.length}
      <Block span={12} title="Radar delle competenze"
        cite={arxivDown ? [{ t: arxivDown }, ...sources] : sources}
        table={{ cols: ['Competenza', 'Quadrante', 'Slancio in 6 mesi', colAnnunci, 'Un mese fa (slancio · annunci)', ...(delRuolo ? ['Per il tuo ruolo'] : [])],
                 rows: rows.map((r) => [r.nome, quadranti[r.quadrante], signedPct(r.slancio), annunciDi(r, r.domanda),
                                        r.hasPrev ? `${signedPct(r.sp as number)} · ${r.dp != null ? per10k(r.dp) : '—'}` : '—',
                                        ...(delRuolo ? [delRuolo.includes(r.id) ? 'sì' : 'no'] : [])]) }}>
        <!-- il radar a tutta larghezza, con la legenda sotto: prima la figura. Accanto, quando c'è posto, i movimenti che ci si leggono: le stesse fonti -->
        <div class="rm"><div class="radar-mov">
          <div class="col">
            <Radar {rows} {quadranti} {mercato} highlight={hovered} {delRuolo} label={italia ? 'Radar delle competenze in Italia con il movimento dall’ultimo mese' : undefined} href={(id) => toHash('competenze', id, params)} onpick={(id) => apri('competenze', id)} />
            {#if italia}<p class="legenda">La crescita è mondiale, la domanda è italiana.</p>{/if}
            <p class="legenda">Le linee sono soglie fisse: cresce più dell’AI, almeno 3 annunci ogni 10mila. Il colore è il quadrante confermato, la posizione il calcolo di oggi: dopo due mesi di fila il quadrante cambia, e il contorno tratteggiato segna chi aspetta. Scia: da dove era un mese fa. Punto vuoto: dato incerto. Tocca un punto per aprirlo.</p>
            <p class="legenda">Da novembre 2026 la domanda è la mediana delle ultime 4 rilevazioni, nel Paese a metà classifica.</p>
          </div>
          <div class="mov">
            <h4>Movimenti {meseMovimenti ? `di ${monthName(meseMovimenti)}` : 'del mese'}</h4>
            <MovesPanel {rows} {quadranti} {delRuolo} {params} bind:hovered />
          </div>
        </div></div>
      </Block>
    {:else}
      <Block span={12} title="Radar delle competenze" missing="{ITALIA_SENZA_DATO}." />
    {/if}
    <Block span={12} title="Le competenze una per una">
      <!-- svelte-ignore a11y_no_noninteractive_tabindex: la tabella scorre in orizzontale e deve essere raggiungibile da tastiera -->
      <div class="tw scorre" tabindex="0" role="region" aria-label="Tabella delle competenze">
        <!-- svelte-ignore a11y_no_redundant_roles: i ruoli ripetono quelli della tabella, perché impilata cambia il display e alcuni browser altrimenti la leggono come testo -->
        <table role="table">
          <thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">Competenza</th><th scope="col" role="columnheader">Cosa è</th><th scope="col" role="columnheader">Quadrante</th><th scope="col" role="columnheader">Slancio</th><th scope="col" role="columnheader">{colAnnunci}</th></tr></thead>
          <tbody role="rowgroup">
            {#each elenco as c (c.id)}
              <tr role="row" class:altro={altro(c.id)}>
                <th scope="row" role="rowheader">{#if placed.has(c.id)}<a href={toHash('competenze', c.id, params)}>{c.nome}</a>{:else}{c.nome}{/if}</th>
                <td role="cell" class="desc">{c.descrizione}</td>
                <td role="cell" data-label="Quadrante">{#if italia && c.domanda == null}dato non disponibile{:else}{c.quadrante ? quadranti[c.quadrante] : 'dati insufficienti'}{c.incerto ? ' · incerto' : ''}{/if}</td>
                <td role="cell" class="num" data-label="Slancio">{c.slancio != null ? signedPct(c.slancio) : '—'}</td>
                <td role="cell" class="num" data-label={colAnnunci}>{c.domanda != null ? annunciDi(c, c.domanda) : '—'}</td>
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
  .scelte { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: var(--s2) var(--s4); }
  .chips { display: flex; flex-wrap: wrap; gap: var(--s1); }
  .rm { container-type: inline-size; min-width: 0; }
  .radar-mov { display: grid; gap: var(--s4); min-width: 0; }
  .radar-mov > :global(*) { min-width: 0; }
  .col { display: grid; gap: var(--s2); align-content: start; min-width: 0; }
  .legenda { font-size: 14px; line-height: 24px; color: var(--fg-2); max-width: var(--misura); }
  .mov { display: grid; gap: var(--s2); align-content: start; max-width: 640px; }
  .mov h4 { margin: 0; font-weight: 600; font-size: 16px; line-height: 24px; }
  @container (min-width: 960px) { .radar-mov { grid-template-columns: minmax(0, 1fr) 320px; } .mov { max-width: none; border-left: 1px solid var(--line); padding-left: var(--s3); } }
  .chips button { background: var(--card); border: 0; border-radius: 999px; padding: var(--s1) 12px; min-height: 40px; font-size: 14px; line-height: 24px; cursor: pointer; color: var(--fg-2); }
  .chips button[aria-pressed='true'] { background: var(--fg); color: var(--card); }
  .method { margin: 0; padding-left: var(--s3); display: grid; gap: var(--s1); color: var(--fg-2); font-size: 14px; line-height: 24px; max-width: var(--misura); }
  table { border-collapse: collapse; width: 100%; font-size: 14px; line-height: 24px; font-variant-numeric: tabular-nums; }
  th, td { text-align: left; padding: var(--s1); border-bottom: 1px solid var(--line); white-space: nowrap; vertical-align: top; }
  thead th { font-size: 12px; line-height: 16px; color: var(--fg-3); font-weight: 500; }
  tbody th { font-weight: 500; }
  td.desc { white-space: normal; min-width: 24ch; color: var(--fg-2); }
  td.num { text-align: right; }
  /* sul telefono ogni competenza si impila: il nome, cosa è, e sotto le tre misure con il loro nome */
  .tw { container-type: inline-size; }
  @container (max-width: 480px) {
    :is(table, tbody) { display: block; }
    thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    tbody tr { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr); gap: 4px var(--s2); padding-block: 12px; border-bottom: 1px solid var(--line); }
    :is(th, td, td.num) { padding: 0; border: 0; white-space: normal; text-align: left; }
    tbody th, td.desc { grid-column: 1 / -1; }
    td.desc { min-width: 0; font-size: 13px; line-height: 20px; }
    /* nome della misura e valore su due righe comuni alle tre celle: i valori stanno in fila anche quando un nome va a capo */
    td[data-label] { display: grid; grid-row: span 2; grid-template-rows: subgrid; row-gap: 2px; }
    td[data-label]::before { content: attr(data-label); align-self: end; font-size: 12px; line-height: 16px; color: var(--fg-3); }
  }
  /* altri ruoli: colore più chiaro invece dell'opacità, il contrasto resta AA */
  tr.altro :is(th, td, a) { color: var(--fg-3); font-weight: 400; }
</style>
