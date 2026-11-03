// L'immagine dell'anteprima di un'edizione, nel browser che poi la fotografa. I testi lunghi sono quelli che le regole di doorPerTe e doorItalia
// possono comporre con i nomi veri di config/skills.yaml, config/ai_act.yaml e config/rapporti.yaml.
import { expect, test, type Page } from '@playwright/test';
import { creaEdizione, type Edizione } from '../../src/lib/edizioni';
import { preparaImmagine } from '../../src/lib/edizioni/immagine';
import type { Dataset } from '../../src/lib/data/types';
import { FIXTURE } from '../../src/lib/test/fixtures';

const base = creaEdizione(FIXTURE as Dataset, null) as Edizione;
const conPorte = (perTe: string, italia: string): Edizione => ({
  ...base,
  porte: [{ ...base.porte[0], titolo: [{ t: perTe }] }, { ...base.porte[1], titolo: [{ t: italia }] }],
});

const ENTRATE_E_USCITE = 'Context engineering, Data engineering e Agenti di coding entrano tra le competenze da imparare ora, di misura; Modelli locali, DB vettoriali e Sicurezza AI escono';
const TUTTE_ENTRANO = 'Context engineering, Data engineering, Agenti di coding, Modelli locali, DB vettoriali, Sicurezza AI, Multimodali, Fine-tuning, Governance, Agenti AI, AI per BI, Robotica, LLMOps, Eval, MCP e RAG entrano tra le competenze da imparare ora, di misura';
const MODELLI_EUROPEI = '12 dei 30 modelli di grande scala del 2026 sono europei (40%), finora';
const RAPPORTO = 'A settembre esce State of Generative AI in the Enterprise';
const SCADENZA = 'Tra 30 giorni: alto rischio nei prodotti regolati (allegato I)';

/** La scatola del testo di ogni porta e della card che la contiene, misurate sui caratteri: un elemento può stare nella pagina anche se il suo testo ne esce. */
const misure = (page: Page) => page.locator('article').evaluateAll((porte) => porte.map((porta) => {
  const testo = document.createRange();
  testo.selectNodeContents(porta);
  const { left, right, top, bottom } = testo.getBoundingClientRect();
  const card = porta.getBoundingClientRect();
  const stile = getComputedStyle(porta.querySelector('p')!);
  return { testo: { left, right, top, bottom }, card: { left: card.left, right: card.right, top: card.top, bottom: card.bottom }, corpo: stile.fontSize, peso: stile.fontWeight };
}));

for (const [nome, e, minimo] of [
  ['le entrate e uscite accanto ai modelli europei', conPorte(ENTRATE_E_USCITE, MODELLI_EUROPEI), 40],
  ['le entrate e uscite accanto a un rapporto', conPorte(ENTRATE_E_USCITE, RAPPORTO), 40],
  ['le entrate e uscite accanto a una scadenza', conPorte(ENTRATE_E_USCITE, SCADENZA), 40],
  ['tutte le competenze che entrano insieme', conPorte(TUTTE_ENTRANO, MODELLI_EUROPEI), 30],
  ['le frasi più corte', conPorte('RAG esce da Impara ora', 'Tra 3 giorni: divieti'), 56],
] as const) {
  test(`non esce nulla dall’immagine, con ${nome}`, async ({ page }) => {
    await preparaImmagine(page, e);
    expect(page.viewportSize()).toEqual({ width: 1200, height: 630 });
    expect(await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight])).toEqual([1200, 630]);
    const [a, b] = await misure(page);
    for (const { testo, card } of [a, b]) {
      expect(testo.left).toBeGreaterThanOrEqual(card.left);
      expect(testo.right).toBeLessThanOrEqual(card.right);
      expect(testo.top).toBeGreaterThanOrEqual(card.top);
      expect(testo.bottom).toBeLessThanOrEqual(card.bottom);
      expect(card.right).toBeLessThanOrEqual(1200);
      expect(card.bottom).toBeLessThanOrEqual(630);
    }
    // le due teste alla pari: stessa misura, anche quando una delle due frasi è molto più lunga dell'altra
    expect(a.corpo).toBe(b.corpo);
    expect(a.peso).toBe(b.peso);
    expect(a.card.right - a.card.left).toBe(b.card.right - b.card.left);
    expect(a.card.bottom - a.card.top).toBe(b.card.bottom - b.card.top);
    expect(parseFloat(a.corpo)).toBeGreaterThanOrEqual(minimo);
  });
}

test('testi che non entrano nemmeno al corpo più piccolo sono un errore, non un’immagine tagliata', async ({ page }) => {
  await expect(preparaImmagine(page, conPorte('Parole '.repeat(400), MODELLI_EUROPEI))).rejects.toThrow(/2026-10-12.*non entrano/);
});

test('ha la data, le due porte, Per te per prima, e le parti in evidenza', async ({ page }) => {
  await preparaImmagine(page, base);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settimana del 12 ott 2026');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Per te', 'Per la tua organizzazione']);
  await expect(page.locator('article p')).toHaveText(['MCP entra tra le competenze da imparare ora; RAG esce', "16% delle imprese italiane usa l'AI (UE: 20%)"]);
  await expect(page.locator('article p em').first()).toHaveText('MCP');
});

test('usa il font e i colori del sito, sempre nel tema chiaro', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await preparaImmagine(page, base);
  await expect(page.locator('body')).toHaveCSS('font-family', /Bricolage Grotesque Variable/);
  expect(await page.evaluate(() => document.fonts.check('500 40px "Bricolage Grotesque Variable"') && [...document.fonts].some((f) => f.status === 'loaded'))).toBe(true);
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(244, 244, 242)');
  await expect(page.locator('article').first()).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.locator('article p').first()).toHaveCSS('color', 'rgb(18, 18, 17)');
  await expect(page.locator('article p em').first()).toHaveCSS('color', 'rgb(0, 104, 214)');
});

test('non usa foto né altro che venga da fuori: solo i file del progetto', async ({ page }) => {
  const richieste: string[] = [];
  page.on('request', (r) => richieste.push(r.url()));
  await preparaImmagine(page, base);
  await expect(page.locator('img, picture, svg image')).toHaveCount(0);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundImage)).toBe('none');
  expect(richieste.length).toBeGreaterThan(0);
  expect(richieste.filter((u) => !u.startsWith('file:'))).toEqual([]);
});

test('una porta senza dati lo dice, alla stessa misura dell’altra', async ({ page }) => {
  const e: Edizione = { ...base, porte: [base.porte[0], { ...base.porte[1], titolo: [], meta: 'Dati non disponibili', destinazione: null }] };
  await preparaImmagine(page, e);
  await expect(page.locator('article p').nth(1)).toHaveText('Dati non disponibili');
  const [a, b] = await misure(page);
  expect(a.corpo).toBe(b.corpo);
});

test('un titolo con dei segni di HTML resta testo', async ({ page }) => {
  await preparaImmagine(page, conPorte('<script>window.rotta = 1</script> & <b>altro</b>', MODELLI_EUROPEI));
  await expect(page.locator('article p').first()).toHaveText('<script>window.rotta = 1</script> & <b>altro</b>');
  await expect(page.locator('article script, article b')).toHaveCount(0);
});
