// La home in chiaro in un browser vero. La build la riempie con i dati veri, che cambiano ogni lunedì: qui nasce dal FIXTURE sull'HTML e sul foglio
// di stile veri della build, e si serve con page.route come le edizioni di prova. L'app carica gli stessi dati, così le due porte dicono la stessa cosa.
// La cartella dei dati non si legge mai: un file rotto, che la build tollera, non manda in rosso questo spec.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import type { Dataset } from '../../src/lib/data/types';
import { filePubblici, foglioDellaHome } from '../../src/lib/statico';
import { FIXTURE } from '../../src/lib/test/fixtures';
import { FRASE_DI_APERTURA } from '../../src/lib/text/apertura';

const d = FIXTURE as Dataset;
/** Il testo delle due porte con i dati del FIXTURE, raccolti il 15 ottobre 2026, come lo legge chi guarda la pagina. */
const PORTE = ['MCP entra tra le competenze da imparare ora; RAG esce', "16% delle imprese italiane usa l'AI (UE: 20%)"];
/** Il titolo della sezione delle card nella home in chiaro: l'app non ce l'ha. */
const SITUAZIONE = 'La situazione';

/** L'HTML della build con il contenitore dell'app di nuovo vuoto, come prima che la build ci scrivesse il testo dei dati veri. */
function conIlContenitoreVuoto(home: string): string {
  const vuota = home.replace(/<div id="app">[\s\S]*<\/div>(\s*<\/body>)/, '<div id="app"></div>$1');
  if (vuota === home) throw new Error('Nella home della build non c’è il contenitore dell’app riempito dalla build.');
  return vuota;
}

/** La home e le pagine statiche che nascono dal FIXTURE, al posto di quelle della build. */
async function serviLaHomeDelFixture(page: Page, request: APIRequestContext) {
  const home = await (await request.get('/')).text();
  const file = filePubblici({ edizioni: [], dataset: d }, { indirizzoBase: 'https://esempio.org/ai-radar/', foglio: foglioDellaHome(home), home: conIlContenitoreVuoto(home) });
  for (const [percorso, body] of Object.entries(file)) {
    if (!percorso.endsWith('.html')) continue;
    const cartella = `/${percorso.replace(/index\.html$/, '')}`;
    await page.route((url) => url.pathname === cartella, (route) => route.fulfill({ contentType: 'text/html; charset=utf-8', body }));
  }
}

const serviIDatiDelFixture = (page: Page) =>
  page.route('**/data/*.json', async (route) => {
    const name = new URL(route.request().url()).pathname.split('/').pop()!.replace('.json', '');
    const body = (FIXTURE as Record<string, unknown>)[name];
    return body === undefined ? route.fulfill({ status: 404, body: '' }) : route.fulfill({ json: body });
  });

/** Quante volte un testo si legge nella pagina. */
const volte = (page: Page, testo: string) => page.evaluate((t) => document.body.innerText.replace(/\s+/g, ' ').split(t).length - 1, testo);
// cast: come in dashboard.spec.ts, @axe-core/playwright usa un altro playwright-core
const violazioniGravi = async (page: Page) =>
  (await new AxeBuilder({ page: page as never }).analyze()).violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

test.describe('con JavaScript', () => {
  test.beforeEach(async ({ page, request }) => {
    // le frasi dell'app sul giorno dei dati, come quelle della home in chiaro: la porta di Norme conta i giorni da oggi
    await page.clock.setFixedTime(new Date(d.status!.aggiornato));
    await serviIDatiDelFixture(page);
    await serviLaHomeDelFixture(page, request);
  });

  test('l’app prende il posto della home in chiaro: la home in chiaro non c’è più, un solo h1, e il testo di ogni porta una volta sola', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Stato delle fonti' })).toBeVisible();
    await expect(page.getByText('Caricamento dei dati…')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: SITUAZIONE, exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(FRASE_DI_APERTURA);
    await expect(page.locator('h1')).toHaveCount(1);
    for (const testo of PORTE) expect(await volte(page, testo), testo).toBe(1);
  });
});

test.describe('senza JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('la build ha scritto la home in chiaro: la frase di apertura c’è anche senza l’app', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(FRASE_DI_APERTURA);
  });

  test.describe('con i dati del FIXTURE', () => {
    test.beforeEach(async ({ page, request }) => serviLaHomeDelFixture(page, request));

    test('la home in chiaro c’è: la frase di apertura, le porte, le card, e la testata porta all’indice delle competenze', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(FRASE_DI_APERTURA);
      await expect(page.getByRole('heading', { name: SITUAZIONE, exact: true })).toBeVisible();
      for (const testo of PORTE) expect(await volte(page, testo), testo).toBe(1);
      await page.getByRole('banner').getByRole('link', { name: 'Competenze' }).click();
      await expect(page).toHaveURL(/\/competenze\/$/);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  });
});

// axe gira dentro la pagina e vuole JavaScript: qui JavaScript c'è, ma gli script del sito non arrivano, e la home in chiaro resta com'è
test.describe('senza gli script del sito, con i dati del FIXTURE', () => {
  test.beforeEach(async ({ page, request }) => {
    await page.route('**/*.js', (route) => route.abort());
    await serviLaHomeDelFixture(page, request);
  });

  test('la home in chiaro resta', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: SITUAZIONE, exact: true })).toBeVisible();
  });

  test('axe non trova problemi gravi, nel tema chiaro', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    expect(await violazioniGravi(page)).toEqual([]);
  });

  test('segue il tema scuro da sola, e axe non trova problemi gravi', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(11, 11, 10)');
    expect(await violazioniGravi(page)).toEqual([]);
  });

  test('a 320 px non scorre di lato', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: SITUAZIONE, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('con «riduci movimento» niente si anima, nemmeno passando su un link', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.getByRole('main').getByRole('link').first().hover();
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    expect(await page.evaluate(() => [...document.querySelectorAll('*')].filter((el) => {
      const stile = getComputedStyle(el);
      return stile.animationName !== 'none' || stile.transitionDuration.split(', ').some((durata) => durata !== '0s');
    }).length)).toBe(0);
  });
});
