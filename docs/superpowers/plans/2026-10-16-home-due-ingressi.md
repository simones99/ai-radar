# Home a due ingressi: piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La home di AI Radar mostra due porte ("Per te · Su cosa formarti" e "Per la tua organizzazione · L'AI in Italia"), ognuna con una notizia scritta dai dati che apre la card da cui viene, e le 8 card divise in due sezioni da 4.

**Architecture:** Tutto nell'app Svelte (`web/`): la pipeline Python non cambia. Le regole delle porte sono funzioni pure in `web/src/lib/text/frasi.ts`, accanto alle altre frasi; un componente `Doors.svelte` le mostra come link con l'hash della card (`#competenze/mcp`), che `TileGrid` già sa aprire. Il registro delle card prende un campo `testa`, che griglia e pillole usano per raggruppare. `politica` diventa `norme`, con alias per i link vecchi.

**Tech Stack:** Svelte 5, TypeScript, Vite, vitest + @testing-library/svelte, Playwright + axe.

**Spec:** `docs/superpowers/specs/2026-10-16-home-due-ingressi-design.md`

**Convenzioni del progetto**

- Tutti i comandi si lanciano da `web/` (`cd web`).
- Test di unità: `npx vitest run <file>`; tutti: `npx vitest run`. Tipi: `npm run check`. End-to-end: `npm run e2e`.
- Testi, commenti e messaggi di commit in italiano, frasi brevi. Messaggi di commit nello stile del repository (una riga descrittiva, senza prefissi `feat:`).
- La data di prova è `FIXTURE_TODAY` = 15 ottobre 2026 (`web/src/lib/test/fixtures.ts`).
- Sul repository `core.autocrlf` è attivo: gli avvisi "LF will be replaced by CRLF" sono normali.

## Mappa dei file

| File | Cosa cambia |
| --- | --- |
| `web/src/lib/router.ts` | `TEMI` nel nuovo ordine, `politica` → `norme`, alias in `parseHash` |
| `web/src/lib/photos.ts` | chiave `politica` → `norme` (stessa foto) |
| `web/src/lib/tiles/types.ts` | tipo `Testa`, campo `testa` in `TileDef` |
| `web/src/lib/tiles/registry.ts` | `TESTE`, ordine e `testa` delle card, Norme |
| `web/src/lib/tiles/PoliticaDetail.svelte` → `NormeDetail.svelte` | rinomina, evidenzia la scadenza del link diretto |
| `web/src/lib/tiles/RapportiDetail.svelte` | evidenzia il rapporto del link diretto |
| `web/src/lib/charts/Timeline.svelte` | prop `highlight` (data da evidenziare) |
| `web/src/lib/tiles/TileGrid.svelte` | due sezioni con `h2` |
| `web/src/lib/tiles/Pills.svelte` | pillole in due gruppi |
| `web/src/lib/tiles/Doors.svelte` | nuovo: le due porte |
| `web/src/lib/text/frasi.ts` | Norme, Italia prima in Business e Persone, `doorPerTe`, `doorItalia`, via `heroThesis` |
| `web/src/lib/data/types.ts` | `aggiornato_eurostat` in `Eurostat` |
| `web/src/App.svelte` | `h1` con la riga del sito, porte, via la tesi |
| test | `router.test.ts`, `frasi.test.ts`, `grid.test.ts`, `shell.test.ts`, `details-a.test.ts`, `details-b.test.ts`, nuovo `doors.test.ts`, `app.test.ts`, `tests/e2e/dashboard.spec.ts` |

---

### Task 1: Politica diventa Norme, con alias per i link vecchi

**Files:**
- Modify: `web/src/lib/router.ts`
- Modify: `web/src/lib/photos.ts:10-11,40`
- Rename: `web/src/lib/tiles/PoliticaDetail.svelte` → `web/src/lib/tiles/NormeDetail.svelte`
- Modify: `web/src/lib/tiles/registry.ts`
- Modify: `web/src/lib/text/frasi.ts:104-121`
- Test: `web/src/lib/router.test.ts`, `web/src/lib/text/frasi.test.ts`, `web/src/lib/tiles/grid.test.ts`, `web/src/lib/tiles/shell.test.ts`, `web/src/lib/tiles/details-a.test.ts`, `web/tests/e2e/dashboard.spec.ts`

- [x] **Step 1: Test del router che falliscono**

In `web/src/lib/router.test.ts` sostituisci il test `scrive gli hash` e aggiungi il test dell'alias:

```ts
  it('scrive gli hash', () => {
    expect(toHash('norme')).toBe('#norme');
    expect(toHash('competenze', 'mcp')).toBe('#competenze/mcp');
  });
  it('i vecchi link a Politica aprono Norme', () => {
    expect(parseHash('#politica')).toEqual({ tema: 'norme', elemento: null });
    expect(parseHash('#politica/2026-12-02')).toEqual({ tema: 'norme', elemento: '2026-12-02' });
    expect(parseHash('#norme/2026-12-02')).toEqual({ tema: 'norme', elemento: '2026-12-02' });
  });
```

- [x] **Step 2: Verifica che fallisca**

Run: `npx vitest run src/lib/router.test.ts`
Expected: FAIL (`'norme'` non è un `TileId`; `parseHash('#politica')` restituisce `tema: 'politica'`).

- [x] **Step 3: Router con Norme e alias**

Sostituisci le prime righe di `web/src/lib/router.ts` (fino a `parseHash` compreso) con:

```ts
// Ordine delle card: prima "Su cosa formarti", poi "L'AI in Italia".
export const TEMI = ['competenze', 'modelli', 'open', 'notizie', 'business', 'persone', 'norme', 'rapporti'] as const;
export type TileId = (typeof TEMI)[number];

// Id cambiati: i link vecchi continuano a funzionare.
const ALIAS: Record<string, TileId> = { politica: 'norme' };

const isTile = (s: string): s is TileId => (TEMI as readonly string[]).includes(s);

/** "#tema" o "#tema/elemento". Elemento malformato: si apre il tema e lo si ignora. */
export function parseHash(hash: string): { tema: TileId; elemento: string | null } | null {
  const [first, raw] = hash.replace(/^#/, '').split('/', 2);
  const tema = ALIAS[first] ?? first;
  if (!tema || !isTile(tema)) return null;
  let elemento: string | null = null;
  if (raw) {
    try {
      elemento = decodeURIComponent(raw) || null;
    } catch {
      elemento = null;
    }
  }
  return { tema, elemento };
}
```

`toHash` e `slug` restano come sono.

- [x] **Step 4: Foto, dettaglio, frasi e registro**

In `web/src/lib/photos.ts` rinomina solo la chiave del record (gli import della foto restano `politica`):

```ts
  norme: { src: politica, srcset: politicaSet, alt: "L'emiciclo del Parlamento europeo a Strasburgo",
```

Rinomina il file del dettaglio:

```bash
git mv src/lib/tiles/PoliticaDetail.svelte src/lib/tiles/NormeDetail.svelte
```

In `web/src/lib/text/frasi.ts`, nel blocco `// ---- politica`, cambia l'intestazione in `// ---------------------------------------------------------------- norme` e rinomina le due funzioni (il corpo non cambia):

```ts
export function faceNorme(d: Dataset, today: Date): Face | null {
```

```ts
export function headNorme(d: Dataset, today: Date): Head {
```

In `web/src/lib/tiles/registry.ts`:
- negli import da `'../text/frasi'` sostituisci `facePolitica` con `faceNorme` e `headPolitica` con `headNorme`;
- sostituisci `import PoliticaDetail from './PoliticaDetail.svelte';` con `import NormeDetail from './NormeDetail.svelte';`;
- sostituisci la riga di Politica con:

```ts
  { id: 'norme', label: 'Norme', source: 'ai_act', eager: false, face: faceNorme, head: headNorme, Detail: NormeDetail },
```

- [x] **Step 5: Aggiorna i test esistenti al nuovo nome**

`web/src/lib/text/frasi.test.ts`: nell'import sostituisci `facePolitica` → `faceNorme`, `headPolitica` → `headNorme`; nel corpo sostituisci ogni `facePolitica(` con `faceNorme(` e ogni `headPolitica(` con `headNorme(`.

`web/src/lib/tiles/grid.test.ts`, test `cambio di card con le pillole`:

```ts
    await fireEvent.click(screen.getByRole('button', { name: 'Norme' }));
    expect(location.hash).toBe('#norme');
```

`web/src/lib/tiles/shell.test.ts`: nei test `licenza della foto` e `Pills` sostituisci `tile({ id: 'politica', label: 'Politica' })` con `tile({ id: 'norme', label: 'Norme' })`; nel test `Pills` sostituisci `{ name: 'Politica' }` con `{ name: 'Norme' }` e `toHaveBeenCalledWith('politica')` con `toHaveBeenCalledWith('norme')`.

`web/src/lib/tiles/details-a.test.ts`: nell'import sostituisci `headPolitica` → `headNorme` e `import PoliticaDetail from './PoliticaDetail.svelte';` → `import NormeDetail from './NormeDetail.svelte';`; il blocco `describe('Politica', …)` diventa:

```ts
describe('Norme', () => {
  const tile = mk('norme', 'Norme', headNorme, NormeDetail);
  it('linea del tempo con la prossima scadenza e notizie di policy', () => {
    show(NormeDetail, tile);
    const next = screen.getByRole('link', { name: 'Fine della transizione per la marcatura' });
    expect(next.closest('li')).toHaveClass('next');
    expect(screen.getByRole('link', { name: 'AI Act: le linee guida sulla trasparenza' })).toBeInTheDocument();
  });
});
```

(Il filtro `Politica` nel test di Notizie resta: è il tema delle notizie, non la card.)

`web/tests/e2e/dashboard.spec.ts`:
- test `indietro chiude; dopo un cambio di card…`: `getByRole('button', { name: 'Norme' })` e `toHaveURL(/#norme$/)`;
- test `riduci movimento`: `#tile-norme .face` e `#detail-norme`.

- [x] **Step 6: Verifica**

Run: `npx vitest run && npm run check`
Expected: tutti i test PASS, `0 ERRORS`.

- [x] **Step 7: Commit**

```bash
git add -A src tests
git commit -m "Politica diventa Norme; i link #politica aprono ancora la card"
```

---

### Task 2: Le card in due teste, griglia e pillole raggruppate

**Files:**
- Modify: `web/src/lib/tiles/types.ts`
- Modify: `web/src/lib/tiles/registry.ts`
- Modify: `web/src/lib/tiles/TileGrid.svelte`
- Modify: `web/src/lib/tiles/Pills.svelte`
- Test: `web/src/lib/tiles/grid.test.ts`, `web/src/lib/tiles/shell.test.ts`

- [x] **Step 1: Test che falliscono**

In `web/src/lib/tiles/grid.test.ts`, dentro `describe('TileGrid', …)`, aggiungi:

```ts
  it('due sezioni da 4 card, nell’ordine delle teste', () => {
    render(TileGrid, { data, today });
    const sezione = (name: string) => screen.getByRole('heading', { level: 2, name }).closest('section')!;
    const ids = (s: Element) => [...s.querySelectorAll('article.tile')].map((a) => a.id);
    expect(ids(sezione('Su cosa formarti'))).toEqual(['tile-competenze', 'tile-modelli', 'tile-open', 'tile-notizie']);
    expect(ids(sezione("L'AI in Italia"))).toEqual(['tile-business', 'tile-persone', 'tile-norme', 'tile-rapporti']);
  });

  it('pillole in due gruppi con il nome della testa', async () => {
    render(TileGrid, { data, today });
    await fireEvent.click(face('Business'));
    const nav = screen.getByRole('navigation', { name: 'Altri temi' });
    const perTe = within(nav).getByRole('group', { name: 'Su cosa formarti' });
    const italia = within(nav).getByRole('group', { name: "L'AI in Italia" });
    expect(within(perTe).getAllByRole('button').map((b) => b.textContent)).toEqual(['Competenze', 'Modelli e ricerca', 'Open source', 'Notizie']);
    expect(within(italia).getAllByRole('button').map((b) => b.textContent)).toEqual(['Persone e lavoro', 'Norme', 'Rapporti']);
  });
```

Nell'import in cima aggiungi `within`:

```ts
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
```

In `web/src/lib/tiles/shell.test.ts`, nella funzione `tile`, aggiungi `testa: 'italia'` dopo `eager: true`:

```ts
  id: 'business', label: 'Business', source: 'owid', eager: true, testa: 'italia',
```

- [x] **Step 2: Verifica che falliscano**

Run: `npx vitest run src/lib/tiles/grid.test.ts`
Expected: FAIL (nessun `h2` "Su cosa formarti"; nessun `group`).

- [x] **Step 3: Tipo `Testa` e registro**

In `web/src/lib/tiles/types.ts` aggiungi il tipo e il campo:

```ts
/** Le due teste della home: le persone (radar) e le organizzazioni (Italia). */
export type Testa = 'per-te' | 'italia';

export interface TileDef {
  id: TileId;
  label: string;
  source: string;
  eager: boolean;
  testa: Testa;
  face: (d: Dataset, today: Date) => Face | null;
  head: (d: Dataset, today: Date) => Head;
  Detail: Component<DetailProps>;
}
```

In `web/src/lib/tiles/registry.ts` cambia l'import dei tipi in `import type { Testa, TileDef } from './types';` e sostituisci l'array `TILES` con:

```ts
export const TESTE: readonly { id: Testa; eyebrow: string; label: string }[] = [
  { id: 'per-te', eyebrow: 'Per te', label: 'Su cosa formarti' },
  { id: 'italia', eyebrow: 'Per la tua organizzazione', label: "L'AI in Italia" },
];

export const TILES: TileDef[] = [
  { id: 'competenze', label: 'Competenze', source: 'radar', eager: true, testa: 'per-te', face: faceCompetenze, head: headCompetenze, Detail: CompetenzeDetail },
  { id: 'modelli', label: 'Modelli e ricerca', source: 'epoch', eager: true, testa: 'per-te', face: faceModelli, head: headModelli, Detail: ModelliDetail },
  { id: 'open', label: 'Open source', source: 'huggingface', eager: true, testa: 'per-te', face: faceOpen, head: headOpen, Detail: OpenDetail },
  { id: 'notizie', label: 'Notizie', source: 'feeds', eager: true, testa: 'per-te', face: faceNotizie, head: headNotizie, Detail: NotizieDetail },
  { id: 'business', label: 'Business', source: 'owid', eager: false, testa: 'italia', face: faceBusiness, head: headBusiness, Detail: BusinessDetail },
  { id: 'persone', label: 'Persone e lavoro', source: 'owid', eager: false, testa: 'italia', face: facePersone, head: headPersone, Detail: PersoneDetail },
  { id: 'norme', label: 'Norme', source: 'ai_act', eager: false, testa: 'italia', face: faceNorme, head: headNorme, Detail: NormeDetail },
  { id: 'rapporti', label: 'Rapporti', source: 'rapporti', eager: false, testa: 'italia', face: faceRapporti, head: headRapporti, Detail: RapportiDetail },
];
```

- [x] **Step 4: Griglia in due sezioni**

In `web/src/lib/tiles/TileGrid.svelte`, nello `<script>` cambia l'import del registro in `import { TESTE, TILES } from './registry';`. Sostituisci il blocco `<div class="tiles" …>…</div>` con:

```svelte
<div class="groups" class:has-open={openId !== null} id="temi">
  {#each TESTE as g (g.id)}
    {@const tiles = TILES.filter((t) => t.testa === g.id)}
    <section class="group" class:hidden={openId !== null && !tiles.some((t) => t.id === openId)} aria-labelledby="g-{g.id}">
      <h2 id="g-{g.id}" class="g-h" class:hidden={openId !== null}>{g.label}</h2>
      <div class="tiles">
        {#each tiles as t (t.id)}
          <article class="tile" class:open={openId === t.id} class:hidden={openId !== null && openId !== t.id} id="tile-{t.id}">
            <TileFace tile={t} {data} {today} expanded={openId === t.id} onopen={() => openTile(t.id)} />
            {#if openId === t.id}
              {@const D = t.Detail}
              <D {data} {today} tile={t} {elemento} onclose={closeTile} />
            {/if}
          </article>
        {/each}
      </div>
    </section>
  {/each}
</div>
```

Sostituisci il blocco `<style>` con:

```svelte
<style>
  .groups { display: grid; gap: var(--s4); }
  .group { display: grid; gap: var(--s2); }
  .g-h { font-weight: 600; font-size: 20px; line-height: 24px; }
  .tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--s2); }
  @media (max-width: 1040px) { .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 560px) { .tiles { grid-template-columns: minmax(0, 1fr); gap: var(--s1); } }
  .tile { min-width: 0; }
  .has-open .tiles { grid-template-columns: minmax(0, 1fr); }
  .has-open { gap: 0; }
  .hidden { display: none; }
  .open :global(.face) { display: none; }
</style>
```

- [x] **Step 5: Pillole in due gruppi**

Sostituisci `web/src/lib/tiles/Pills.svelte` con:

```svelte
<script lang="ts">
  import { PHOTOS } from '../photos';
  import type { TileId } from '../router';
  import { TESTE } from './registry';
  import type { TileDef } from './types';

  let { tiles, onpick, onclose }: { tiles: TileDef[]; onpick: (id: TileId) => void; onclose: () => void } = $props();
</script>

<nav class="pills" aria-label="Altri temi">
  <div class="scroll">
    {#each TESTE as g (g.id)}
      {@const mine = tiles.filter((t) => t.testa === g.id)}
      {#if mine.length}
        <div class="group" role="group" aria-label={g.label}>
          <span class="glab" aria-hidden="true">{g.label}</span>
          {#each mine as t (t.id)}
            <button type="button" class="pill" style:view-transition-name="t-{t.id}" onclick={() => onpick(t.id)}>
              <img src={PHOTOS[t.id].src} alt="" loading="lazy" />{t.label}
            </button>
          {/each}
        </div>
      {/if}
    {/each}
  </div>
  <button type="button" class="x" aria-label="Chiudi" onclick={onclose}>×</button>
</nav>

<style>
  .pills { display: flex; gap: var(--s1); align-items: center; }
  .scroll { display: flex; flex-wrap: wrap; gap: var(--s1) var(--s3); flex: 1; min-width: 0; }
  .group { display: flex; flex-wrap: wrap; gap: var(--s1); align-items: center; }
  .glab { font-size: 12px; line-height: 16px; color: var(--fg-3); white-space: nowrap; }
  .pill { display: inline-flex; align-items: center; gap: var(--s1); min-height: 40px; padding: 4px var(--s2) 4px 4px; border: 0; border-radius: 999px; background: var(--card); box-shadow: var(--shadow); cursor: pointer; font-size: 14px; font-weight: 500; white-space: nowrap; }
  .pill img { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
  .x { flex: none; width: 40px; height: 40px; border-radius: 50%; border: 0; background: var(--card); box-shadow: var(--shadow); cursor: pointer; font-size: 24px; line-height: 40px; }
  @media (hover: hover) { .pill:hover, .x:hover { box-shadow: var(--shadow-up); } }
  @media (max-width: 560px) {
    .pills { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; background: var(--bg); padding-block: var(--s1); margin-inline: calc(-1 * var(--s2)); padding-inline: var(--s2); }
    .scroll, .group { flex-wrap: nowrap; }
    .scroll { overflow-x: auto; scrollbar-width: none; }
  }
</style>
```

- [x] **Step 6: Verifica**

Run: `npx vitest run && npm run check`
Expected: tutti i test PASS (compresi i due nuovi), `0 ERRORS`.

- [x] **Step 7: Commit**

```bash
git add src
git commit -m "Card divise in due teste: Su cosa formarti e L'AI in Italia, anche nelle pillole"
```

---

### Task 3: Business e Persone con l'Italia in primo piano

**Files:**
- Modify: `web/src/lib/text/frasi.ts` (blocchi `business` e `persone`, import da `./format`)
- Test: `web/src/lib/text/frasi.test.ts`, `web/src/lib/tiles/details-b.test.ts`

- [x] **Step 1: Test che falliscono**

In `web/src/lib/text/frasi.test.ts` sostituisci i test `business: …` e `persone: mondo e Italia` con:

```ts
  it('business: prima l’Italia, numeri interi, UE nella frase', () => {
    expect(faceBusiness(d, today)).toEqual({ fig: '16', unit: '%', sent: "Imprese italiane che usano l'AI nel 2025. UE: 20%." });
    const senzaIt = { eurostat: { ...d.eurostat!, serie: { EU27_2020: d.eurostat!.serie.EU27_2020 } } };
    expect(faceBusiness(senzaIt, today)).toEqual({ fig: '20', unit: '%', sent: "Imprese dell'UE che usano l'AI nel 2025; manca il dato italiano." });
    expect(faceBusiness({}, today)).toBeNull();
  });
  it('persone: prima l’Italia, mondo nella frase', () => {
    expect(facePersone(d, today)).toEqual({ fig: '30', unit: '%', sent: "Italiani che usano l'AI generativa. Mondo: 18%." });
    const senzaIt = { owid: { ...d.owid!, serie: { uso_genai: { ...d.owid!.serie.uso_genai, punti: d.owid!.serie.uso_genai.punti.filter((p) => p.entita === 'World') } } } };
    expect(facePersone(senzaIt, today)).toEqual({ fig: '18', unit: '%', sent: "Persone nel mondo che usano l'AI generativa; manca il dato italiano." });
  });
```

Nel test `business e politica` (blocco `titoli e tesi`) sostituisci le due righe su `headBusiness` con:

```ts
    const hb = headBusiness(d, today);
    expect(text(hb.title)).toBe("16% delle imprese italiane usa l'AI");
    expect(hb.title[0]).toEqual({ t: '16%', em: true });
    expect(hb.deck).toBe("Nel 2025, imprese con almeno 10 addetti. UE: 20%. Nel 2024 in Italia l'8%.");
    // senza Eurostat resta il titolo sugli investimenti (serie CC BY-ND: importi brevi)
    const senzaEu = { ...d, eurostat: undefined };
    expect(text(headBusiness(senzaEu, today).title)).toBe('Investimenti privati in AI nel 2025: 290 B $');
```

In `web/src/lib/tiles/details-b.test.ts`, test `Persone`, sostituisci l'attesa sul titolo:

```ts
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent("Usa l'AI generativa il 30% degli italiani");
```

- [x] **Step 2: Verifica che falliscano**

Run: `npx vitest run src/lib/text/frasi.test.ts src/lib/tiles/details-b.test.ts`
Expected: FAIL sui test Business e Persone.

- [x] **Step 3: Implementa**

In `web/src/lib/text/frasi.ts`:

1. La riga di import da `./format` per ora non cambia: `exact` serve ancora a `heroThesis`, che sparisce alla Task 7.

2. Sostituisci il blocco `// ---- business` (commento, `impreseUe`, `faceBusiness`, `headBusiness`) con:

```ts
// ---------------------------------------------------------------- business
// Numero chiave e titolo: imprese italiane che usano l'AI (Eurostat, CC BY 4.0), interi.
// Senza Eurostat il titolo resta sugli investimenti AI Index (CC BY-ND 4.0): importi brevi, nessun rapporto tra anni.

/** Articolo davanti a una percentuale intera: "l'8%", "l'11%", "l'80%", "il 16%". */
const art = (v: number): string => {
  const n = Math.round(v);
  return n === 1 || n === 8 || n === 11 || (n >= 80 && n <= 89) ? "l'" : 'il ';
};

function impreseUe(d: Dataset) {
  const s = d.eurostat?.serie;
  const ue = s?.EU27_2020;
  if (!ue) return null;
  const anni = Object.keys(ue).sort();
  const t = anni[anni.length - 1];
  const prev = anni[anni.length - 2];
  if (!t) return null;
  return { t, v: ue[t], prev: prev ? { t: prev, v: ue[prev], it: s?.IT?.[prev] ?? null } : null, it: s?.IT?.[t] ?? null };
}
export function faceBusiness(d: Dataset, _today?: Date): Face | null {
  const e = impreseUe(d);
  if (!e) return null;
  if (e.it == null) return { fig: nf(e.v, 0), unit: '%', sent: `Imprese dell'UE che usano l'AI nel ${e.t}; manca il dato italiano.` };
  return { fig: nf(e.it, 0), unit: '%', sent: `Imprese italiane che usano l'AI nel ${e.t}. UE: ${nf(e.v, 0)}%.` };
}
export function headBusiness(d: Dataset, _today?: Date): Head {
  const e = impreseUe(d);
  if (e?.it != null) {
    return {
      title: [{ t: `${nf(e.it, 0)}%`, em: true }, { t: " delle imprese italiane usa l'AI" }],
      deck: `Nel ${e.t}, imprese con almeno 10 addetti. UE: ${nf(e.v, 0)}%.` +
        (e.prev?.it != null ? ` Nel ${e.prev.t} in Italia ${art(e.prev.it)}${nf(e.prev.it, 0)}%.` : ''),
    };
  }
  const last = owidLatest(d.owid, 'investimenti_privati', 'World');
  if (!last) return { title: plain('Business'), deck: null };
  const prev = owidPrev(d.owid, 'investimenti_privati', 'World');
  return {
    title: [{ t: `Investimenti privati in AI nel ${last.t}: ` }, { t: `${short(last.v)} $`, em: true }],
    deck: 'A prezzi 2021, in aziende AI non quotate.' + (prev ? ` Nel ${prev.t}: ${short(prev.v)} $.` : '') + ' B = miliardi.',
  };
}
```

(Con il dato di prova, Italia 2024 = 8,2 → "l'8%".)

3. Sostituisci il blocco `// ---- persone` con:

```ts
// ---------------------------------------------------------------- persone
export function facePersone(d: Dataset, _today?: Date): Face | null {
  const w = owidLatest(d.owid, 'uso_genai', 'World');
  const it = owidLatest(d.owid, 'uso_genai', 'Italy');
  if (it) return { fig: nf(it.v, 0), unit: '%', sent: "Italiani che usano l'AI generativa." + (w ? ` Mondo: ${nf(w.v, 0)}%.` : '') };
  if (w) return { fig: nf(w.v, 0), unit: '%', sent: "Persone nel mondo che usano l'AI generativa; manca il dato italiano." };
  return null;
}
export function headPersone(d: Dataset, _today?: Date): Head {
  const w = owidLatest(d.owid, 'uso_genai', 'World');
  const it = owidLatest(d.owid, 'uso_genai', 'Italy');
  if (it) {
    return {
      title: [{ t: "Usa l'AI generativa il " }, { t: `${nf(it.v, 0)}%`, em: true }, { t: ' degli italiani' }],
      deck: `${w ? `Nel mondo ${art(w.v)}${nf(w.v, 0)}%. ` : ''}Stima di Microsoft al ${day(it.t)}.`,
    };
  }
  if (!w) return { title: plain('Persone e lavoro'), deck: null };
  return {
    title: [{ t: "Usa l'AI generativa il " }, { t: `${nf(w.v, 0)}%`, em: true }, { t: ' delle persone nel mondo' }],
    deck: `Manca il dato italiano. Stima di Microsoft al ${day(w.t)}.`,
  };
}
```

- [x] **Step 4: Verifica**

Run: `npx vitest run && npm run check`
Expected: tutti PASS, `0 ERRORS`.

- [x] **Step 5: Commit**

```bash
git add src
git commit -m "Business e Persone: prima il dato italiano, confronto con UE e mondo nella frase"
```

---

### Task 4: Porta "Per te": la notizia del radar

**Files:**
- Modify: `web/src/lib/text/frasi.ts` (import e nuovo blocco in fondo)
- Create: `web/src/lib/text/doors.test.ts`

- [x] **Step 1: Test che falliscono**

Crea `web/src/lib/text/doors.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Dataset, Radar } from '../data/types';
import { FIXTURE, FIXTURE_TODAY as today } from '../test/fixtures';
import { doorPerTe } from './frasi';

const d = FIXTURE as Dataset;
const text = (parts: { t: string }[]) => parts.map((p) => p.t).join('');
const radar = (rows: Partial<Radar['competenze'][number]>[]): Dataset => ({
  radar: {
    generato: '2026-10-15', base_domanda: 'open-source', quadranti: d.radar!.quadranti,
    competenze: rows.map((r, i) => ({ id: `c${i}`, nome: `Competenza ${i}`, breve: `C${i}`, descrizione: '', slancio: 0.5, domanda: 0.5, quadrante: 'impara-ora', ...r })),
  },
});

describe('porta Per te', () => {
  it('1. chi entra e chi esce da Impara ora', () => {
    const p = doorPerTe(d, today);
    expect(text(p.title)).toBe('MCP entra tra le competenze da imparare ora; RAG esce');
    expect(p.title[0]).toEqual({ t: 'MCP', em: true });
    expect(p.meta).toBe('Radar delle competenze · dati al 15 ott 2026');
    expect(p.target).toEqual({ tema: 'competenze', elemento: 'mcp' });
  });
  it('1. solo uscite', () => {
    const p = doorPerTe(radar([{ quadrante: 'consolida', slancio: 0.3, domanda: 0.7, slancio_prec: 0.7, domanda_prec: 0.7, quadrante_prec: 'impara-ora' }]), today);
    expect(text(p.title)).toBe('C0 esce da Impara ora');
    expect(p.target).toEqual({ tema: 'competenze', elemento: 'c0' });
  });
  it('2. altri cambi verso lo stesso quadrante: tutti i nomi', () => {
    const p = doorPerTe(radar([
      { quadrante: 'prova', slancio: 0.7, domanda: 0.2, slancio_prec: 0.3, domanda_prec: 0.2, quadrante_prec: 'osserva' },
      { quadrante: 'prova', slancio: 0.6, domanda: 0.3, slancio_prec: 0.4, domanda_prec: 0.3, quadrante_prec: 'osserva' },
    ]), today);
    expect(text(p.title)).toBe('C0 e C1 passano a Da provare');
    expect(p.target).toEqual({ tema: 'competenze', elemento: 'c0' });
  });
  it('2. cambi verso quadranti diversi: solo lo spostamento più grande', () => {
    const p = doorPerTe(radar([
      { quadrante: 'prova', slancio: 0.6, domanda: 0.2, slancio_prec: 0.45, domanda_prec: 0.2, quadrante_prec: 'osserva' },
      { quadrante: 'osserva', slancio: 0.1, domanda: 0.3, slancio_prec: 0.7, domanda_prec: 0.3, quadrante_prec: 'prova' },
    ]), today);
    expect(text(p.title)).toBe("C1 passa a Tieni d'occhio");
    expect(p.target).toEqual({ tema: 'competenze', elemento: 'c1' });
  });
  it('3. nessun cambio: lo spostamento più grande, se almeno 10 punti', () => {
    const p = doorPerTe(radar([
      { quadrante: 'osserva', slancio: 0.0, domanda: 0.3, slancio_prec: 0.33, domanda_prec: 0.3, quadrante_prec: 'osserva' },
      { quadrante: 'prova', slancio: 0.9, domanda: 0.1, slancio_prec: 0.8, domanda_prec: 0.1, quadrante_prec: 'prova' },
    ]), today);
    expect(text(p.title)).toBe('C0 perde 33 punti di slancio');
    expect(p.target).toEqual({ tema: 'competenze', elemento: 'c0' });
  });
  it('3. spostamento sulla domanda', () => {
    const p = doorPerTe(radar([{ quadrante: 'impara-ora', slancio: 0.6, domanda: 0.9, slancio_prec: 0.6, domanda_prec: 0.6, quadrante_prec: 'impara-ora' }]), today);
    expect(text(p.title)).toBe('C0 guadagna 30 punti di domanda');
  });
  it('4. riserva: quante competenze da imparare ora', () => {
    const p = doorPerTe(radar([{}, { quadrante: 'osserva', slancio: 0.2, domanda: 0.2 }]), today);
    expect(text(p.title)).toBe('1 competenza su 2 da imparare ora');
    expect(p.title[0]).toEqual({ t: '1 competenza su 2', em: true });
    expect(p.target).toEqual({ tema: 'competenze', elemento: null });
  });
  it('senza radar: porta vuota e non cliccabile', () => {
    expect(doorPerTe({}, today)).toEqual({ title: [], meta: 'Dati non ancora disponibili', target: null });
  });
});
```

- [x] **Step 2: Verifica che falliscano**

Run: `npx vitest run src/lib/text/doors.test.ts`
Expected: FAIL (`doorPerTe` non esportata).

- [x] **Step 3: Implementa**

In `web/src/lib/text/frasi.ts`:

1. Import in cima: sostituisci le prime righe con

```ts
import {
  MOVE_MIN, computeGrowth, newsInLastDays, nextDeadline, nextReport, owidLatest, owidPrev, radarChanges, radarRows,
  type RadarRowM,
} from '../data/derive';
import type { Dataset } from '../data/types';
import type { TileId } from '../router';
```

(la riga di import da `./format` resta quella della Task 3).

2. In fondo al file aggiungi:

```ts
// ---------------------------------------------------------------- porte della home
// Ogni porta mostra la prima notizia che i dati permettono, in ordine di priorità (spec, sezione 5).
export interface Door {
  title: TitleParts; // vuoto se non ci sono dati
  meta: string; // fonte e data del dato
  target: { tema: TileId; elemento: string | null } | null; // null: porta non cliccabile
}
const NO_DATA: Door = { title: [], meta: 'Dati non ancora disponibili', target: null };

/** "A", "A e B", "A, B e C", con i nomi in evidenza. */
const names = (rows: RadarRowM[]): TitleParts =>
  rows.flatMap((r, i) => [...(i === 0 ? [] : [{ t: i === rows.length - 1 ? ' e ' : ', ' }]), { t: r.breve, em: true }]);

export function doorPerTe(d: Dataset, _today?: Date): Door {
  const rows = d.radar ? radarRows(d.radar) : [];
  if (!d.radar || !rows.length) return NO_DATA;
  const meta = `Radar delle competenze · dati al ${day(d.radar.generato)}`;
  const to = (r: RadarRowM | null): Door['target'] => ({ tema: 'competenze', elemento: r?.id ?? null });

  // 1. entrate e uscite da Impara ora
  const { inn, out } = radarChanges(rows);
  if (inn.length || out.length) {
    const title: TitleParts = [];
    if (inn.length) title.push(...names(inn), { t: ` ${inn.length > 1 ? 'entrano' : 'entra'} tra le competenze da imparare ora` });
    if (out.length) {
      if (inn.length) title.push({ t: '; ' });
      title.push(...names(out), { t: ` ${out.length > 1 ? 'escono' : 'esce'}${inn.length ? '' : ' da Impara ora'}` });
    }
    return { title, meta, target: to(inn[0] ?? out[0]) };
  }

  // 2. altri cambi di quadrante
  const changed = rows.filter((r) => r.changed).sort((a, b) => b.move - a.move);
  if (changed.length) {
    const dest = changed[0].quadrante;
    const who = changed.every((r) => r.quadrante === dest) ? changed : [changed[0]];
    return { title: [...names(who), { t: ` ${who.length > 1 ? 'passano' : 'passa'} a ${d.radar.quadranti[dest]}` }], meta, target: to(who[0]) };
  }

  // 3. lo spostamento più grande, se almeno MOVE_MIN
  const big = rows.filter((r) => r.hasPrev && r.move >= MOVE_MIN).sort((a, b) => b.move - a.move)[0];
  if (big) {
    const onSlancio = Math.abs(big.dS) >= Math.abs(big.dD);
    const v = onSlancio ? big.dS : big.dD;
    return {
      title: [{ t: big.breve, em: true }, { t: ` ${v > 0 ? 'guadagna' : 'perde'} ${Math.round(Math.abs(v) * 100)} punti di ${onSlancio ? 'slancio' : 'domanda'}` }],
      meta, target: to(big),
    };
  }

  // 4. riserva
  const n = rows.filter((r) => r.quadrante === 'impara-ora').length;
  return { title: [{ t: `${n} ${n === 1 ? 'competenza' : 'competenze'} su ${rows.length}`, em: true }, { t: ' da imparare ora' }], meta, target: to(null) };
}
```

- [x] **Step 4: Verifica**

Run: `npx vitest run src/lib/text/doors.test.ts && npm run check`
Expected: 8 PASS, `0 ERRORS`.

- [x] **Step 5: Commit**

```bash
git add src/lib/text
git commit -m "Porta Per te: la notizia della settimana scritta dal radar"
```

---

### Task 5: Porta "L'AI in Italia"

**Files:**
- Modify: `web/src/lib/data/types.ts` (interfaccia `Eurostat`)
- Modify: `web/src/lib/text/frasi.ts` (import da `./format` e `../router`, nuova funzione in fondo)
- Modify: `web/src/lib/text/doors.test.ts`

- [x] **Step 1: Test che falliscono**

In `web/src/lib/text/doors.test.ts` cambia l'import in `import { doorItalia, doorPerTe } from './frasi';` e aggiungi in fondo:

```ts
describe('porta L’AI in Italia', () => {
  const at = (iso: string) => new Date(`${iso}T10:00:00`);
  it('1. scadenza entro 30 giorni, con Oggi e Domani', () => {
    const p = doorItalia(d, at('2026-11-20'));
    expect(text(p.title)).toBe('Tra 12 giorni: fine della transizione per la marcatura');
    expect(p.title[0]).toEqual({ t: 'Tra 12 giorni', em: true });
    expect(p.meta).toBe('AI Act · scadenza del 2 dic 2026');
    expect(p.target).toEqual({ tema: 'norme', elemento: '2026-12-02' });
    expect(text(doorItalia(d, at('2026-12-01')).title)).toBe('Domani: fine della transizione per la marcatura');
    expect(text(doorItalia(d, at('2026-12-02')).title)).toBe('Oggi: fine della transizione per la marcatura');
  });
  it('2. dato Eurostat italiano aggiornato negli ultimi 30 giorni', () => {
    const e = { ...d, eurostat: { ...d.eurostat!, aggiornato_eurostat: '2026-10-01T11:00:00+0200' } };
    const p = doorItalia(e, today);
    expect(text(p.title)).toBe("16% delle imprese italiane usa l'AI (UE: 20%)");
    expect(p.title[0]).toEqual({ t: '16% delle imprese italiane', em: true });
    expect(p.meta).toBe('Eurostat · aggiornato il 1 ott 2026');
    expect(p.target).toEqual({ tema: 'business', elemento: null });
  });
  it('2. Eurostat aggiornato ma senza Italia: si passa oltre', () => {
    const e = { ...d, eurostat: { ...d.eurostat!, aggiornato_eurostat: '2026-10-01', serie: { EU27_2020: d.eurostat!.serie.EU27_2020 } } };
    expect(doorItalia(e, today).target?.tema).toBe('rapporti');
  });
  it('2. uso dell’AI generativa in Italia aggiornato negli ultimi 30 giorni', () => {
    const o = { ...d.owid!, serie: { ...d.owid!.serie, uso_genai: { ...d.owid!.serie.uso_genai, aggiornato_owid: '2026-10-01' } } };
    const p = doorItalia({ ...d, owid: o }, today);
    expect(text(p.title)).toBe("30% degli italiani usa l'AI generativa (mondo: 18%)");
    expect(p.meta).toBe('Microsoft via Our World in Data · aggiornato il 1 ott 2026');
    expect(p.target).toEqual({ tema: 'persone', elemento: null });
  });
  it('3. rapporto previsto entro 30 giorni', () => {
    const p = doorItalia(d, today);
    expect(text(p.title)).toBe('A ottobre esce State of AI Report');
    expect(p.title[1]).toEqual({ t: 'State of AI Report', em: true });
    expect(p.meta).toBe('Data stimata, dai rapporti degli anni scorsi');
    expect(p.target).toEqual({ tema: 'rapporti', elemento: 'state-of-ai-report' });
  });
  it('4. riserva: la prossima scadenza, anche lontana', () => {
    const p = doorItalia({ ...d, rapporti: undefined }, today);
    expect(text(p.title)).toBe("48 giorni alla prossima scadenza dell'AI Act");
    expect(p.meta).toBe('AI Act · Fine della transizione per la marcatura');
    expect(p.target).toEqual({ tema: 'norme', elemento: '2026-12-02' });
  });
  it('senza dati: porta vuota e non cliccabile', () => {
    expect(doorItalia({}, today)).toEqual({ title: [], meta: 'Dati non ancora disponibili', target: null });
  });
});
```

- [x] **Step 2: Verifica che falliscano**

Run: `npx vitest run src/lib/text/doors.test.ts`
Expected: FAIL (`doorItalia` non esportata).

- [x] **Step 3: Tipo Eurostat**

In `web/src/lib/data/types.ts` aggiungi il campo (la pipeline lo scrive già in `data/eurostat.json`):

```ts
export interface Eurostat {
  indicatore: string;
  url: string;
  aggiornato_eurostat?: string; // ultimo aggiornamento della serie da parte di Eurostat
  nomi: Record<string, string>;
  serie: Record<string, Record<string, number>>;
}
```

- [x] **Step 4: Implementa**

In `web/src/lib/text/frasi.ts`:

1. Import da `./format`: aggiungi `ym`:

```ts
import { capitalize, day, daysTo, exact, lowerFirst, monthName, monthYear, nf, short, ym } from './format';
```

2. Import dal router: sostituisci `import type { TileId } from '../router';` con

```ts
import { slug, type TileId } from '../router';
```

3. In fondo al file, dopo `doorPerTe`:

```ts
const SOON = 30; // giorni: scadenze vicine, dati appena usciti, rapporti in arrivo

export function doorItalia(d: Dataset, today: Date): Door {
  const ahead = (iso: string) => daysTo(iso, today);
  const recent = (iso: string | null | undefined) => !!iso && ahead(iso) <= 0 && ahead(iso) >= -SOON;
  const scad = (d.ai_act?.scadenze ?? []).slice().sort((a, b) => a.data.localeCompare(b.data));

  // 1. una scadenza entro 30 giorni (anche oggi)
  const near = scad.find((s) => ahead(s.data) >= 0 && ahead(s.data) <= SOON);
  if (near) {
    const n = ahead(near.data);
    return {
      title: [{ t: n === 0 ? 'Oggi' : n === 1 ? 'Domani' : `Tra ${n} giorni`, em: true }, { t: `: ${lowerFirst(near.titolo)}` }],
      meta: `AI Act · scadenza del ${day(near.data)}`,
      target: { tema: 'norme', elemento: near.data },
    };
  }

  // 2. un dato italiano uscito negli ultimi 30 giorni: Eurostat, poi uso dell'AI generativa (OWID)
  const e = impreseUe(d);
  const euAgg = d.eurostat?.aggiornato_eurostat;
  if (e?.it != null && recent(euAgg)) {
    return {
      title: [{ t: `${nf(e.it, 0)}% delle imprese italiane`, em: true }, { t: ` usa l'AI (UE: ${nf(e.v, 0)}%)` }],
      meta: `Eurostat · aggiornato il ${day(euAgg as string)}`,
      target: { tema: 'business', elemento: null },
    };
  }
  const genAgg = d.owid?.serie?.uso_genai?.aggiornato_owid;
  const it = owidLatest(d.owid, 'uso_genai', 'Italy');
  if (it && recent(genAgg)) {
    const w = owidLatest(d.owid, 'uso_genai', 'World');
    return {
      title: [{ t: `${nf(it.v, 0)}% degli italiani`, em: true }, { t: ` usa l'AI generativa${w ? ` (mondo: ${nf(w.v, 0)}%)` : ''}` }],
      meta: `Microsoft via Our World in Data · aggiornato il ${day(genAgg as string)}`,
      target: { tema: 'persone', elemento: null },
    };
  }

  // 3. un rapporto previsto entro 30 giorni (le date dei rapporti sono mesi stimati)
  const r = nextReport(d.rapporti, today);
  if (r && r.ym <= ym(new Date(today.getTime() + SOON * 864e5))) {
    return {
      title: [{ t: `A ${monthName(r.ym)} esce ` }, { t: r.report.nome, em: true }],
      meta: 'Data stimata, dai rapporti degli anni scorsi',
      target: { tema: 'rapporti', elemento: slug(r.report.nome) },
    };
  }

  // 4. riserva: la prossima scadenza, anche lontana
  const next = scad.find((s) => ahead(s.data) > 0);
  if (next) {
    const n = ahead(next.data);
    return {
      title: [{ t: `${n} ${n === 1 ? 'giorno' : 'giorni'}`, em: true }, { t: " alla prossima scadenza dell'AI Act" }],
      meta: `AI Act · ${next.titolo}`,
      target: { tema: 'norme', elemento: next.data },
    };
  }
  return NO_DATA;
}
```

- [x] **Step 5: Verifica**

Run: `npx vitest run src/lib/text/doors.test.ts && npm run check`
Expected: 15 PASS, `0 ERRORS`.

- [x] **Step 6: Commit**

```bash
git add src/lib/text src/lib/data/types.ts
git commit -m "Porta L'AI in Italia: scadenze, dati italiani nuovi, rapporti in arrivo"
```

---

### Task 6: Norme e Rapporti evidenziano l'elemento del link diretto

**Files:**
- Modify: `web/src/lib/charts/Timeline.svelte`
- Modify: `web/src/lib/tiles/NormeDetail.svelte`
- Modify: `web/src/lib/tiles/RapportiDetail.svelte`
- Test: `web/src/lib/tiles/details-a.test.ts`, `web/src/lib/tiles/details-b.test.ts`

- [x] **Step 1: Test che falliscono**

In `web/src/lib/tiles/details-a.test.ts`, dentro `describe('Norme', …)`, aggiungi:

```ts
  it('link diretto a una scadenza: è evidenziata', () => {
    show(NormeDetail, tile, '2026-12-02');
    const li = screen.getByRole('link', { name: 'Fine della transizione per la marcatura' }).closest('li')!;
    expect(li).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: 'Modelli per uso generale' }).closest('li')).not.toHaveAttribute('aria-current');
  });
```

In `web/src/lib/tiles/details-b.test.ts`, dentro `describe('Rapporti', …)`, aggiungi:

```ts
  it('link diretto a un rapporto: è evidenziato', () => {
    render(RapportiDetail, { data, today, tile: mk('rapporti', 'Rapporti', headRapporti, RapportiDetail), elemento: 'state-of-ai-report', onclose: () => {} });
    const li = screen.getByRole('link', { name: 'State of AI Report' }).closest('li')!;
    expect(li).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: 'AI Index Report' }).closest('li')).not.toHaveAttribute('aria-current');
  });
```

- [x] **Step 2: Verifica che falliscano**

Run: `npx vitest run src/lib/tiles/details-a.test.ts src/lib/tiles/details-b.test.ts`
Expected: FAIL (nessun `aria-current`).

- [x] **Step 3: Timeline con `highlight`**

In `web/src/lib/charts/Timeline.svelte`:

Props:

```ts
  let { items, today, label, highlight = null }: { items: Item[]; today: Date; label: string; highlight?: string | null } = $props();
```

Nel markup sostituisci `<li class={r.cls}>` con:

```svelte
      <li class={r.cls} class:hl={highlight != null && r.it.date === highlight} aria-current={highlight != null && r.it.date === highlight ? 'true' : undefined}>
```

Nello `<style>` aggiungi:

```css
  .hl { background: var(--accent-soft); border-radius: var(--r-sm); }
```

- [x] **Step 4: Norme passa l'elemento alla linea del tempo**

In `web/src/lib/tiles/NormeDetail.svelte`:

```ts
  let { data, today, tile, elemento, onclose }: DetailProps = $props();
```

e

```svelte
    <Timeline label="Scadenze dell'AI Act" {items} {today} highlight={elemento} />
```

- [x] **Step 5: Rapporti evidenzia il rapporto**

In `web/src/lib/tiles/RapportiDetail.svelte`:

Script: props con `elemento` e import di `slug`:

```ts
  import { slug } from '../router';
```

```ts
  let { data, today, tile, elemento, onclose }: DetailProps = $props();
```

Nel blocco "I rapporti seguiti" sostituisci `<li>` con:

```svelte
        <li class:hl={elemento === slug(r.nome)} aria-current={elemento === slug(r.nome) ? 'true' : undefined}>
```

Nello `<style>` aggiungi:

```css
  .list li.hl { background: var(--accent-soft); border-radius: var(--r-sm); padding-inline: var(--s1); }
```

- [x] **Step 6: Verifica**

Run: `npx vitest run && npm run check`
Expected: tutti PASS, `0 ERRORS`.

- [x] **Step 7: Commit**

```bash
git add src
git commit -m "Norme e Rapporti: il link diretto evidenzia la scadenza o il rapporto"
```

---

### Task 7: Le porte in home, al posto della tesi

**Files:**
- Create: `web/src/lib/tiles/Doors.svelte`
- Create: `web/src/lib/tiles/doors-ui.test.ts`
- Modify: `web/src/App.svelte`
- Modify: `web/src/lib/text/frasi.ts` (togli `heroThesis`)
- Test: `web/src/app.test.ts`, `web/src/lib/text/frasi.test.ts`

- [x] **Step 1: Test che falliscono**

Crea `web/src/lib/tiles/doors-ui.test.ts`:

```ts
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import type { Dataset } from '../data/types';
import { FIXTURE, FIXTURE_TODAY as today } from '../test/fixtures';
import Doors from './Doors.svelte';

describe('Doors', () => {
  it('due porte come link alla card della notizia', () => {
    render(Doors, { data: FIXTURE as Dataset, today });
    const perTe = screen.getByRole('link', { name: /Per te.*Su cosa formarti.*MCP entra tra le competenze da imparare ora/ });
    expect(perTe).toHaveAttribute('href', '#competenze/mcp');
    expect(perTe.querySelector('em')).toHaveTextContent('MCP');
    const italia = screen.getByRole('link', { name: /Per la tua organizzazione.*L'AI in Italia.*A ottobre esce State of AI Report/ });
    expect(italia).toHaveAttribute('href', '#rapporti/state-of-ai-report');
    expect(screen.getByText('Radar delle competenze · dati al 15 ott 2026')).toBeInTheDocument();
  });
  it('senza dati: porte non cliccabili che lo dicono', () => {
    render(Doors, { data: {}, today });
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.getAllByText('Dati non ancora disponibili')).toHaveLength(2);
    expect(screen.getByText('Su cosa formarti')).toBeInTheDocument();
  });
});
```

In `web/src/app.test.ts`, nel primo test, sostituisci la riga con `findByText(/modello più seguito della settimana/)` con:

```ts
    expect(await screen.findByRole('link', { name: /MCP entra tra le competenze da imparare ora/ })).toHaveAttribute('href', '#competenze/mcp');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Su cosa formarti e cosa succede all'AI in Italia");
```

e rinomina il test in `'carica i dati e mostra le due porte'`.

In `web/src/lib/text/frasi.test.ts` togli `heroThesis` dall'import e cancella il test `'tesi della home e riserva'`.

- [x] **Step 2: Verifica che falliscano**

Run: `npx vitest run src/lib/tiles/doors-ui.test.ts src/app.test.ts`
Expected: FAIL (`Doors.svelte` non esiste; la home non ha le porte).

- [x] **Step 3: Componente `Doors.svelte`**

Crea `web/src/lib/tiles/Doors.svelte`:

```svelte
<script lang="ts">
  import type { Dataset } from '../data/types';
  import { toHash } from '../router';
  import { doorItalia, doorPerTe, type Door } from '../text/frasi';
  import { TESTE } from './registry';

  let { data, today }: { data: Dataset; today: Date } = $props();

  const doors = $derived([
    { g: TESTE[0], d: doorPerTe(data, today) },
    { g: TESTE[1], d: doorItalia(data, today) },
  ]);
</script>

{#snippet body(g: (typeof TESTE)[number], d: Door)}
  <span class="eyebrow">{g.eyebrow}</span>
  <span class="name">{g.label}</span>
  {#if d.title.length}
    <span class="news">{#each d.title as p, i (i)}{#if p.em}<em>{p.t}</em>{:else}{p.t}{/if}{/each}</span>
  {/if}
  <span class="meta">{d.meta}</span>
{/snippet}

<div class="doors">
  {#each doors as { g, d } (g.id)}
    {#if d.target}
      <a class="door" href={toHash(d.target.tema, d.target.elemento)}>{@render body(g, d)}</a>
    {:else}
      <div class="door">{@render body(g, d)}</div>
    {/if}
  {/each}
</div>

<style>
  .doors { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--s2); }
  @media (max-width: 720px) { .doors { grid-template-columns: minmax(0, 1fr); } }
  .door { display: grid; gap: var(--s1); align-content: start; padding: var(--s3); background: var(--card); border-radius: var(--r-lg); box-shadow: var(--shadow); color: inherit; text-decoration: none; transition: box-shadow .25s var(--ease), transform .25s var(--ease); }
  a.door:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  @media (hover: hover) { a.door:hover { box-shadow: var(--shadow-up); transform: translateY(-2px); } }
  .eyebrow { font-size: 12px; line-height: 16px; letter-spacing: .06em; text-transform: uppercase; color: var(--accent); font-weight: 600; }
  .name { font-size: 14px; line-height: 24px; color: var(--fg-2); }
  .news { font-weight: 500; font-size: clamp(24px, 3.2vw, 36px); line-height: 1.15; letter-spacing: -.02em; text-wrap: balance; }
  .news em { font-style: normal; color: var(--accent); font-weight: 700; }
  .meta { font-size: 12px; line-height: 16px; color: var(--fg-3); }
</style>
```

- [x] **Step 4: Home senza tesi, con le porte**

In `web/src/App.svelte`:

- togli `import { heroThesis } from './lib/text/frasi';` e la riga `const thesis = $derived(heroThesis(data, today));`;
- aggiungi `import Doors from './lib/tiles/Doors.svelte';`;
- sostituisci la `<section class="hero">…</section>` con:

```svelte
    <section class="hero">
      <p class="small muted">Settimana del {day(isoDay(today))}</p>
      <h1>Su cosa formarti e cosa succede all'AI in Italia, con dati aperti aggiornati ogni lunedì.</h1>
    </section>
```

- sostituisci il blocco `{#if phase === 'ready'}<TileGrid …/>` con:

```svelte
  {#if phase === 'ready'}
    <Doors {data} {today} />
    <TileGrid {data} {today} />
```

- nello `<style>` sostituisci le regole `h1`, `h1 em` e `.intro` con:

```css
  h1 { font-weight: 400; font-size: 20px; line-height: 32px; color: var(--fg-2); max-width: 60ch; }
```

In `web/src/lib/text/frasi.ts` cancella il blocco `// ---- tesi della home` con la funzione `heroThesis`, e togli `exact` dall'import da `./format`, che non serve più:

```ts
import { capitalize, day, daysTo, lowerFirst, monthName, monthYear, nf, short, ym } from './format';
```

- [x] **Step 5: Verifica**

Run: `npx vitest run && npm run check`
Expected: tutti PASS, `0 ERRORS`.

- [x] **Step 6: Commit**

```bash
git add src
git commit -m "Home a due ingressi: le porte Per te e L'AI in Italia al posto della tesi"
```

---

### Task 8: Test end-to-end e controllo finale

**Files:**
- Modify: `web/tests/e2e/dashboard.spec.ts`

- [x] **Step 1: Aggiorna e aggiungi i test**

Sostituisci il test `'home: tesi e 8 temi'` con:

```ts
test('home: due porte, due sezioni, 8 temi', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText("Su cosa formarti e cosa succede all'AI in Italia");
  await expect(page.getByRole('link', { name: /MCP entra tra le competenze da imparare ora/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /A ottobre esce State of AI Report/ })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Su cosa formarti' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: "L'AI in Italia" })).toBeVisible();
  await expect(page.locator('button.face')).toHaveCount(8);
});

test('porta Per te: apre Competenze sulla competenza della notizia', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /MCP entra tra le competenze da imparare ora/ }).click();
  await expect(page.locator('#detail-competenze')).toBeVisible();
  await expect(page).toHaveURL(/#competenze\/mcp$/);
  await expect(page.getByRole('button', { name: /^MCP/, pressed: true })).toBeVisible();
});

test('porta L’AI in Italia con una scadenza vicina: apre Norme sulla scadenza', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-20T10:00:00'));
  await page.goto('/');
  await page.getByRole('link', { name: /Tra 12 giorni/ }).click();
  await expect(page.locator('#detail-norme')).toBeVisible();
  await expect(page).toHaveURL(/#norme\/2026-12-02$/);
  await expect(page.locator('#detail-norme li[aria-current="true"]')).toContainText('Fine della transizione per la marcatura');
});

test('i vecchi link #politica aprono Norme', async ({ page }) => {
  await page.goto('/#politica');
  await expect(page.locator('#detail-norme')).toBeVisible();
});
```

Il test di accessibilità aspetta già 8 `button.face` e controlla la home: le porte entrano nel controllo senza modifiche. I cicli su `TEMI` usano già `norme` (Task 1).

- [x] **Step 2: Lancia tutto**

Run (da `web/`):

```bash
npm run check
npx vitest run
npm run e2e
```

Expected: `0 ERRORS`; tutti i test di unità PASS; tutti i test end-to-end PASS (prima di questo piano erano 19, ora 22).

Se un test di 320/360 px segnala scorrimento orizzontale, la causa probabile è il titolo lungo di una porta: verifica che `.news` abbia `overflow-wrap: anywhere` e aggiungilo se serve.

- [x] **Step 3: Controllo a occhio con i dati veri**

Da `web/`:

```bash
mkdir -p public/data && cp ../data/*.json public/data/
npx vite build
npx vite preview --port 4173 --strictPort
```

Apri `http://localhost:4173/` (non `/ai-radar/`: `base` è `./`). Controlla a 1280 px che le due porte siano sopra la piega, poi a 360 px che stiano una sotto l'altra. Ferma il server.

- [x] **Step 4: Commit**

```bash
git add tests
git commit -m "Test end-to-end della home a due ingressi"
```
