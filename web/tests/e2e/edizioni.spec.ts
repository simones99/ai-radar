// Le pagine delle edizioni in un browser vero. Fino al primo lunedì non esiste un'edizione vera, e questo sito è lo stesso che viene
// pubblicato: l'edizione di prova nasce dal FIXTURE e si serve con page.route, sul foglio di stile vero della build. Nella cartella di uscita non entra mai.
import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { creaEdizione, filePubblici, foglioDellaHome, type Edizione } from '../../src/lib/edizioni';
import type { Dataset } from '../../src/lib/data/types';
import { FIXTURE } from '../../src/lib/test/fixtures';

const d = FIXTURE as Dataset;
const TITOLO_LUNGO = 'Unaparolalunghissimachenonsispezzamaichedovrebbefaruscirelapaginadaibordianchesuuntelefonostretto & <altro>';
const prima = creaEdizione(
  { ...d, news: { ...d.news!, notizie: [...d.news!.notizie, { titolo: TITOLO_LUNGO, link: 'https://esempio.org/a', data: '2026-10-14', fonte: 'Esempio', tema: 'ricerca' }] } },
  null,
) as Edizione;
const conCorrezione: Edizione = { ...prima, correzioni: [{ data: '2026-10-20', testo: 'Il dato di Eurostat era quello del 2024.' }] };
const seconda = creaEdizione({ ...d, status: { ...d.status!, aggiornato: '2026-10-22T08:00:00+00:00' } }, conCorrezione) as Edizione;

const PRIMA = '/edizioni/2026-10-12/';
const SECONDA = '/edizioni/2026-10-19/';
const ARCHIVIO = '/edizioni/';

async function serviEdizioni(page: Page, request: APIRequestContext) {
  const home = await (await request.get('/')).text();
  const file = filePubblici([conCorrezione, seconda], { indirizzoBase: 'https://esempio.org/ai-radar/', foglio: foglioDellaHome(home) });
  for (const [percorso, body] of Object.entries(file)) {
    // il feed con il tipo con cui lo serve GitHub Pages
    const contentType = percorso.endsWith('.xml') ? 'application/xml' : 'text/html; charset=utf-8';
    await page.route(`**/${percorso.replace(/index\.html$/, '')}`, (route) => route.fulfill({ contentType, body }));
  }
}

test.beforeEach(async ({ page, request }) => {
  await page.route('**/data/*.json', async (route) => {
    const name = new URL(route.request().url()).pathname.split('/').pop()!.replace('.json', '');
    const body = (FIXTURE as Record<string, unknown>)[name];
    return body === undefined ? route.fulfill({ status: 404, body: '' }) : route.fulfill({ json: body });
  });
  await serviEdizioni(page, request);
});

// cast: come in dashboard.spec.ts, @axe-core/playwright usa un altro playwright-core
const violazioniGravi = async (page: Page) =>
  (await new AxeBuilder({ page: page as never }).analyze()).violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
const senzaScorrimento = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

for (const [nome, indirizzo] of [['la prima edizione', PRIMA], ['un’edizione con la precedente', SECONDA], ['l’archivio', ARCHIVIO]] as const) {
  test.describe(nome, () => {
    test('axe non trova problemi gravi, nel tema chiaro', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' });
      await page.goto(indirizzo);
      expect(await violazioniGravi(page)).toEqual([]);
    });

    test('segue il tema scuro da sola, e axe non trova problemi gravi', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto(indirizzo);
      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(11, 11, 10)');
      await expect(page.locator('body')).toHaveCSS('color', 'rgb(236, 236, 234)');
      expect(await violazioniGravi(page)).toEqual([]);
    });

    test('a 320 px non scorre di lato', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(indirizzo);
      expect(await senzaScorrimento(page)).toBe(true);
    });

    test('con «riduci movimento» niente si anima, nemmeno passando su un link', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(indirizzo);
      await page.getByRole('main').getByRole('link').first().hover();
      expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
      // anche ciò che partirebbe dopo: nessun elemento ha una transizione o un'animazione
      expect(await page.evaluate(() => [...document.querySelectorAll('*')].filter((el) => {
        const stile = getComputedStyle(el);
        return stile.animationName !== 'none' || stile.transitionDuration.split(', ').some((durata) => durata !== '0s');
      }).length)).toBe(0);
    });

    test('usa il font e la testata del sito', async ({ page }) => {
      await page.goto(indirizzo);
      await expect(page.locator('body')).toHaveCSS('font-family', /Bricolage Grotesque Variable/);
      await expect(page.getByRole('banner').getByRole('link', { name: 'AI Radar' })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.fonts.check('16px "Bricolage Grotesque Variable"'))).toBe(true);
    });
  });
}

test.describe('senza JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('si legge tutta: porte, frasi, notizie, fonti e correzione, con lo stile del sito', async ({ page }) => {
    await page.goto(PRIMA);
    await expect(page).toHaveTitle('AI Radar, settimana del 12 ott 2026');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settimana del 12 ott 2026');
    await expect(page.getByRole('link', { name: 'MCP entra tra le competenze da imparare ora; RAG esce' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'La situazione' })).toBeVisible();
    await expect(page.getByText('Il sito mostra i dati di oggi')).toBeVisible();
    await expect(page.getByText('Corretta il 20 ott 2026:')).toBeVisible();
    await expect(page.getByRole('link', { name: 'The Adzuna API' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: TITOLO_LUNGO })).toBeVisible(); // il titolo esterno è testo, con < e & compresi
    await expect(page.locator('script')).toHaveCount(0);
    await expect(page.locator('body')).toHaveCSS('font-family', /Bricolage Grotesque Variable/);
  });

  test('un crawler trova l’anteprima: la pagina ha la sua immagine, l’archivio quella della home', async ({ page }) => {
    await page.goto(PRIMA);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://esempio.org/ai-radar/edizioni/2026-10-12/anteprima.png');
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', /^AI Radar, settimana del 12 ott 2026\. Per te: MCP entra/);
    await page.goto(ARCHIVIO);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://esempio.org/ai-radar/anteprima.png');
  });

  test('l’archivio si legge, e porta all’edizione', async ({ page }) => {
    await page.goto(ARCHIVIO);
    const voci = page.getByRole('main').getByRole('listitem');
    await expect(voci).toHaveCount(2);
    await expect(voci.first()).toContainText('Settimana del 19 ott 2026');
    await expect(voci.first()).toContainText('MCP entra tra le competenze');
    await page.getByRole('link', { name: 'Settimana del 12 ott 2026' }).click();
    await expect(page).toHaveURL(new RegExp(`${PRIMA}$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settimana del 12 ott 2026');
  });

  test('una settimana dopo si legge cosa è ripetuto', async ({ page }) => {
    await page.goto(SECONDA);
    await expect(page.getByText('Nessun cambio qui dalla settimana scorsa')).toHaveCount(2);
    await expect(page.getByRole('heading', { level: 2, name: 'Nulla è cambiato dalla settimana scorsa' })).toBeVisible();
    await expect(page.getByText(/^Settimana senza novità/)).toBeVisible();
    await expect(page.getByText(/^Invariate: Competenze/)).toBeVisible();
  });
});

test('si passa da un’edizione a quella accanto senza tornare all’archivio', async ({ page }) => {
  await page.goto(PRIMA);
  await page.getByRole('navigation', { name: 'Altre edizioni' }).getByRole('link', { name: 'Edizione successiva: settimana del 19 ott 2026' }).click();
  await expect(page).toHaveURL(new RegExp(`${SECONDA}$`));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settimana del 19 ott 2026');
  await page.getByRole('navigation', { name: 'Altre edizioni' }).getByRole('link', { name: 'Edizione precedente: settimana del 12 ott 2026' }).click();
  await expect(page).toHaveURL(new RegExp(`${PRIMA}$`));
});

test('il titolo è la prima cosa del contenuto, senza un’etichetta sopra', async ({ page }) => {
  await page.goto(PRIMA);
  expect(await page.getByRole('main').evaluate((main) => main.textContent?.trim().startsWith('Settimana del 12 ott 2026'))).toBe(true);
});

test('da tastiera: prima il salto al contenuto, poi la testata; il link di una porta apre la sua card nella home', async ({ page }) => {
  await page.goto(PRIMA);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Vai al contenuto' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#contenuto$/);
  await expect(page.locator('#contenuto')).toBeFocused();
  await page.keyboard.press('Tab');
  const porta = page.getByRole('link', { name: 'MCP entra tra le competenze da imparare ora; RAG esce' });
  await expect(porta).toBeFocused();
  // il segno del fuoco si vede: viene dallo stesso foglio del sito
  await expect(porta).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/#competenze$/);
  await expect(page.locator('#detail-competenze')).toBeVisible();
});

test('una riga porta alla sua card, e la testata torna alla home', async ({ page }) => {
  await page.goto(PRIMA);
  await page.getByRole('link', { name: 'Norme', exact: true }).click();
  await expect(page).toHaveURL(/\/#norme$/);
  await expect(page.locator('#detail-norme')).toBeVisible();
  await page.goto(PRIMA);
  await page.getByRole('banner').getByRole('link', { name: 'AI Radar' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Su cosa formarti');
});

for (const [nome, indirizzo] of [['da un’edizione', PRIMA], ['dall’archivio', ARCHIVIO]] as const) {
  test(`il feed si trova partendo ${nome}: il link «Segui con RSS» si vede anche a 320 px e apre /feed.xml, senza JavaScript`, async ({ browser, request }) => {
    const contesto = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 640 } });
    const page = await contesto.newPage();
    await serviEdizioni(page, request);
    await page.goto(indirizzo);
    await expect(page.locator('head link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute('href', 'https://esempio.org/ai-radar/feed.xml');
    const link = page.getByRole('link', { name: 'Segui con RSS' });
    await expect(link).toBeInViewport();
    const [risposta] = await Promise.all([page.waitForResponse('**/feed.xml'), link.click()]);
    expect(new URL(risposta.url()).pathname).toBe('/feed.xml');
    expect(await risposta.text()).toContain('ai-radar:edizione:2026-10-12');
    await contesto.close();
  });
}

test('nel sito costruito ci sono solo le edizioni salvate nei dati: nessuna edizione di prova', () => {
  const cartella = (relativa: string) => fileURLToPath(new URL(relativa, import.meta.url));
  const salvate = process.env.AI_RADAR_DATA_DIR ? `${process.env.AI_RADAR_DATA_DIR}/edizioni` : cartella('../../../data/edizioni');
  const nomi = existsSync(salvate) ? readdirSync(salvate).filter((n) => n.endsWith('.json')).map((n) => n.replace('.json', '')) : [];
  const uscita = cartella('../../../_site/edizioni');
  const pagine = existsSync(uscita) ? readdirSync(uscita).filter((n) => n !== 'index.html') : [];
  expect(pagine.sort()).toEqual(nomi.sort());
  expect(existsSync(`${uscita}/index.html`)).toBe(nomi.length > 0);
  expect(existsSync(cartella('../../../_site/feed.xml'))).toBe(nomi.length > 0);
  expect(nomi).not.toContain('2026-10-12'); // la settimana del FIXTURE: la prima edizione vera esce dopo il rilascio
});
