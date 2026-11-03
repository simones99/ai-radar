// La home con e senza l'indice delle edizioni, in un browser vero. Fino al primo lunedì non esiste un'edizione vera:
// l'indice e le pagine di prova nascono dal FIXTURE e si servono con page.route, mai nella cartella di uscita.
import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import type { Dataset } from '../../src/lib/data/types';
import { creaEdizione, filePubblici, foglioDellaHome, type Edizione } from '../../src/lib/edizioni';
import { FIXTURE } from '../../src/lib/test/fixtures';

const QUESTA_SETTIMANA = '2026-10-12'; // i dati del FIXTURE sono aggiornati il 15 ottobre 2026
const SETTIMANA = 'Settimana del 12 ott 2026';
const edizione = creaEdizione(FIXTURE as Dataset, null) as Edizione;

/** I file delle edizioni che il sito costruito non ha, compreso l'indice: l'ultima edizione è quella passata. */
async function conEdizioni(page: Page, request: APIRequestContext, ultima = QUESTA_SETTIMANA) {
  const home = await (await request.get('/')).text();
  const file = filePubblici([edizione], { indirizzoBase: 'https://esempio.org/ai-radar/', foglio: foglioDellaHome(home) });
  for (const [percorso, body] of Object.entries(file)) {
    const contentType = percorso.endsWith('.xml') ? 'application/xml' : 'text/html; charset=utf-8';
    await page.route(`**/${percorso.replace(/index\.html$/, '')}`, (route) => route.fulfill({ contentType, body }));
  }
  await page.route('**/data/edizioni.json', (route) => route.fulfill({ json: { ultima } }));
}

test.beforeEach(async ({ page }) => {
  // l'indice non è nel FIXTURE: come un file che non c'è, risponde 404 finché un test non lo serve
  await page.route('**/data/*.json', async (route) => {
    const name = new URL(route.request().url()).pathname.split('/').pop()!.replace('.json', '');
    const body = (FIXTURE as Record<string, unknown>)[name];
    return body === undefined ? route.fulfill({ status: 404, body: '' }) : route.fulfill({ json: body });
  });
});

const caricata = async (page: Page) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /MCP entra/ })).toBeVisible();
};
const conLink = (page: Page) => expect(page.getByRole('banner').getByRole('link', { name: 'Edizioni' })).toBeVisible();
// cast: come in dashboard.spec.ts, @axe-core/playwright usa un altro playwright-core
const violazioniGravi = async (page: Page) =>
  (await new AxeBuilder({ page: page as never }).analyze()).violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
const senzaScorrimento = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const fuoco = (page: Page) => page.evaluate(() => document.activeElement?.textContent?.trim());

test.describe('senza indice', () => {
  test('nessun avviso e nessun link: la riga resta testo, senza «Edizioni» né «Segui con RSS»', async ({ page }) => {
    await caricata(page);
    await expect(page.getByText(SETTIMANA)).toBeVisible();
    await expect(page.getByRole('link', { name: SETTIMANA })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Edizioni' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Segui con RSS' })).toHaveCount(0);
    await expect(page.locator('a[href*="edizioni"], a[href*="feed.xml"]')).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Riprova' })).toHaveCount(0);
  });
});

test.describe('con l’indice', () => {
  test('l’ultima edizione è di questa settimana: la riga apre l’edizione', async ({ page, request }) => {
    await conEdizioni(page, request);
    await caricata(page);
    await page.getByRole('link', { name: SETTIMANA }).click();
    await expect(page).toHaveURL(new RegExp(`/edizioni/${QUESTA_SETTIMANA}/$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(SETTIMANA);
  });

  test('l’ultima edizione è di un’altra settimana: la riga resta testo, «Edizioni» e «Segui con RSS» restano', async ({ page, request }) => {
    await conEdizioni(page, request, '2026-10-05');
    await caricata(page);
    await conLink(page);
    await expect(page.getByText(SETTIMANA)).toBeVisible();
    await expect(page.getByRole('link', { name: SETTIMANA })).toHaveCount(0);
    await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Segui con RSS' })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('«Edizioni» apre l’archivio, che porta all’edizione', async ({ page, request }) => {
    await conEdizioni(page, request);
    await caricata(page);
    await page.getByRole('banner').getByRole('link', { name: 'Edizioni' }).click();
    await expect(page).toHaveURL(/\/edizioni\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Edizioni');
    await expect(page.getByRole('link', { name: SETTIMANA })).toBeVisible();
  });

  test('«Segui con RSS» apre il feed', async ({ page, request }) => {
    await conEdizioni(page, request);
    await caricata(page);
    const [risposta] = await Promise.all([page.waitForResponse('**/feed.xml'), page.getByRole('link', { name: 'Segui con RSS' }).click()]);
    expect(new URL(risposta.url()).pathname).toBe('/feed.xml');
    expect(await risposta.text()).toContain(`ai-radar:edizione:${QUESTA_SETTIMANA}`);
  });

  test('i link funzionano anche da una card aperta: restano relativi alla radice del sito', async ({ page, request }) => {
    await conEdizioni(page, request);
    await page.goto('/#norme');
    await expect(page.locator('#detail-norme')).toBeVisible();
    await page.getByRole('banner').getByRole('link', { name: 'Edizioni' }).click();
    await expect(page).toHaveURL(/\/edizioni\/$/);
  });

  test('da tastiera: dopo il salto al contenuto si passa da «Edizioni» e si arriva alla riga, che con Invio apre l’edizione', async ({ page, request }) => {
    await conEdizioni(page, request);
    await caricata(page);
    await conLink(page);
    const visti: (string | undefined)[] = [];
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      visti.push(await fuoco(page));
    }
    expect(visti).toEqual(['Vai al contenuto', 'Edizioni', 'Foto e fonti', 'Stato delle fonti', SETTIMANA]);
    const riga = page.getByRole('link', { name: SETTIMANA });
    await expect(riga).toBeFocused();
    await expect(riga).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/edizioni/${QUESTA_SETTIMANA}/$`));
  });

  test('da tastiera si arriva anche a «Segui con RSS», con il segno del fuoco', async ({ page, request }) => {
    await conEdizioni(page, request);
    await caricata(page);
    await conLink(page);
    const rss = page.getByRole('link', { name: 'Segui con RSS' });
    for (let i = 0; i < 200 && !(await rss.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab');
    await expect(rss).toBeFocused();
    await expect(rss).toHaveCSS('outline-style', 'solid');
  });

  test('porte e card sono le stesse di quando l’indice non c’è', async ({ page, request }) => {
    const contenuto = () => page.locator('.doors, .board').evaluateAll((els) => els.map((el) => el.outerHTML));
    await caricata(page);
    const senza = await contenuto();
    await conEdizioni(page, request);
    await caricata(page);
    await conLink(page);
    expect(await contenuto()).toEqual(senza);
    expect(senza).toHaveLength(2);
  });
});

for (const [nome, prepara] of [
  ['senza indice', async () => {}],
  ['con l’indice', conEdizioni],
] as [string, (page: Page, request: APIRequestContext) => Promise<void>][]) {
  test.describe(`la home ${nome}`, () => {
    const pronta = async (page: Page, request: APIRequestContext) => {
      await prepara(page, request);
      await caricata(page);
      if (nome === 'con l’indice') await conLink(page);
    };

    test('axe non trova problemi gravi, nel tema chiaro', async ({ page, request }) => {
      await page.emulateMedia({ colorScheme: 'light' });
      await pronta(page, request);
      expect(await violazioniGravi(page)).toEqual([]);
    });

    test('in tema scuro axe non trova problemi gravi', async ({ page, request }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await pronta(page, request);
      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(11, 11, 10)');
      expect(await violazioniGravi(page)).toEqual([]);
    });

    test('a 320 px non scorre di lato, e axe non trova problemi gravi', async ({ page, request }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await pronta(page, request);
      expect(await senzaScorrimento(page)).toBe(true);
      expect(await violazioniGravi(page)).toEqual([]);
    });
  });
}

test('a 320 px i link delle edizioni si vedono tutti e si possono toccare: almeno 24 px di altezza', async ({ page, request }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await conEdizioni(page, request);
  await caricata(page);
  await conLink(page);
  for (const link of [page.getByRole('banner').getByRole('link', { name: 'Edizioni' }), page.getByRole('link', { name: SETTIMANA }), page.getByRole('link', { name: 'Segui con RSS' })]) {
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeInViewport({ ratio: 1 });
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(24);
  }
});

test.describe('senza JavaScript, come un lettore di feed', () => {
  test.use({ javaScriptEnabled: false });

  test('la home ha il link al feed solo se ci sono edizioni salvate nei dati, e l’indice lo stesso', async ({ page }) => {
    const cartella = (relativa: string) => fileURLToPath(new URL(relativa, import.meta.url));
    const salvate = process.env.AI_RADAR_DATA_DIR ? `${process.env.AI_RADAR_DATA_DIR}/edizioni` : cartella('../../../data/edizioni');
    const ce = existsSync(salvate) && readdirSync(salvate).some((n) => n.endsWith('.json'));
    await page.goto('/');
    await expect(page.locator('head link[rel="alternate"][type="application/rss+xml"]')).toHaveCount(ce ? 1 : 0);
    expect(existsSync(cartella('../../../_site/data/edizioni.json'))).toBe(ce);
  });
});
