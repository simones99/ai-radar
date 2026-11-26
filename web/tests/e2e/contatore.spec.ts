// Il contatore delle visite sul sito costruito, che è quello che viene pubblicato: ogni pagina ha lo script di Umami, e servita in locale
// non manda niente, perché lo script conta solo sull'host pubblico del sito. L'edizione di prova nasce dal FIXTURE, come in edizioni.spec.ts,
// con lo stesso ID e lo stesso indirizzo base della build. L'ID lo sceglie playwright.config.ts: in locale, se manca, è uno di prova; nel workflow
// è solo quello del repository, e senza la build esce senza contatore: queste prove si saltano, e senza-contatore.spec.ts prova che non c'è.
// Le stesse pagine, senza JavaScript, hanno in fondo la riga che lo dice a chi legge, con il link alla pagina Privacy del sito.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page, type Request } from '@playwright/test';
import { leggiDati } from '../../src/lib/data/cartella';
import { cartellaDeiDati } from '../../src/lib/data/cartellaDeiDati';
import type { Dataset } from '../../src/lib/data/types';
import { creaEdizione, type Edizione } from '../../src/lib/edizioni';
import { indirizzoBase } from '../../src/lib/indirizzoBase';
import { filePubblici, foglioDellaHome } from '../../src/lib/statico';
import { FIXTURE } from '../../src/lib/test/fixtures';
import { SCRIPT_DI_UMAMI } from '../../src/lib/umami';

const ID = process.env.AI_RADAR_UMAMI_ID!;
const HOST = new URL(indirizzoBase(process.env.AI_RADAR_BASE_URL)).hostname;
const DATI = cartellaDeiDati();
const COMPETENZA = leggiDati(DATI, ['radar']).radar?.competenze[0]?.id;
const edizione = creaEdizione(FIXTURE as Dataset, null) as Edizione;
const EDIZIONE = `/edizioni/${edizione.settimana}/`;
const PRIVACY = '/privacy/';

test.skip(!ID, 'nel workflow senza la variabile UMAMI_WEBSITE_ID la build degli end-to-end, che è quella pubblicata, esce senza contatore');

test.beforeEach(async ({ page, request }) => {
  const home = await (await request.get('/')).text();
  const file = filePubblici({ edizioni: [edizione], dataset: {} }, { indirizzoBase: indirizzoBase(process.env.AI_RADAR_BASE_URL), foglio: foglioDellaHome(home), home, idUmami: ID });
  await page.route(`**${EDIZIONE}`, (route) => route.fulfill({ contentType: 'text/html; charset=utf-8', body: file[`${EDIZIONE.slice(1)}index.html`] }));
});

/** Le richieste verso Umami mentre la pagina si apre, fino a quando la rete si ferma: lo script, se parte, ha già provato a contare. */
async function richiesteVersoUmami(page: Page, indirizzo: string): Promise<string[]> {
  const richieste: Request[] = [];
  page.on('request', (r) => {
    if (/(^|\.)umami\.(is|dev)$/.test(new URL(r.url()).hostname)) richieste.push(r);
  });
  await page.goto(indirizzo);
  await page.waitForLoadState('networkidle');
  return richieste.map((r) => `${r.method()} ${r.url()}`);
}

for (const [nome, indirizzo] of [['la home', '/'], ['un’edizione', EDIZIONE], ['una pagina di competenza', `/competenze/${COMPETENZA}/`], ['la pagina Privacy', PRIVACY]] as const) {
  test(`${nome} ha lo script di Umami, e in locale non manda niente a Umami`, async ({ page }) => {
    if (indirizzo.startsWith('/competenze/')) expect(COMPETENZA, 'nella cartella dei dati non ci sono competenze').toBeTruthy();
    const richieste = await richiesteVersoUmami(page, indirizzo);
    const script = page.locator(`head script[src="${SCRIPT_DI_UMAMI}"]`);
    await expect(script).toHaveCount(1);
    await expect(script).toHaveAttribute('data-website-id', ID);
    await expect(script).toHaveAttribute('data-domains', HOST);
    // il browser va a prendere lo script, e basta: nessun invio
    expect(richieste).toEqual([`GET ${SCRIPT_DI_UMAMI}`]);
  });
}

// cast: come in dashboard.spec.ts, @axe-core/playwright usa un altro playwright-core
const violazioniGravi = async (page: Page) =>
  (await new AxeBuilder({ page: page as never }).analyze()).violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
/** Dove porta un link, letto da dove sta la pagina: come lo segue il browser. */
const dovePorta = (link: Locator) => link.evaluate((a) => (a as HTMLAnchorElement).href);
/** La pagina Privacy del sito servito, dalla radice del sito. */
const paginaPrivacy = (page: Page) => new URL(PRIVACY, page.url()).href;
const nessunoScorrimentoOrizzontale = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

// le pagine statiche non hanno altro JavaScript che lo script di Umami; la home resta in chiaro senza l'app, come quando l'app non arriva.
// axe ha bisogno di JavaScript, per questo non lo si spegne
test.describe('la riga sul contatore', () => {
  for (const [nome, indirizzo] of [['la home in chiaro', '/'], ['un’edizione', EDIZIONE], ['una pagina di competenza', `/competenze/${COMPETENZA}/`], ['la pagina Privacy', PRIVACY]] as const) {
    for (const [tema, colorScheme] of [['chiaro', 'light'], ['scuro', 'dark']] as const) {
      test(`${nome}, in tema ${tema} a 320 px: la riga si legge in fondo, va a capo e porta alla pagina Privacy, e axe non trova problemi gravi`, async ({ page }) => {
        if (indirizzo === '/') await page.route('**/assets/*.js', (route) => route.abort());
        await page.emulateMedia({ colorScheme });
        await page.setViewportSize({ width: 320, height: 640 });
        await page.goto(indirizzo);
        const riga = page.getByRole('contentinfo').getByText('Il sito conta le visite con Umami');
        await expect(riga).toHaveCount(1);
        await riga.scrollIntoViewIfNeeded();
        await expect(riga).toBeVisible();
        await expect(riga).toHaveText('Il sito conta le visite con Umami, senza cookie: le statistiche non contengono indirizzi IP e sono conservate in UE. Privacy');
        const privacy = riga.getByRole('link', { name: 'Privacy' });
        expect(await dovePorta(privacy)).toBe(paginaPrivacy(page));
        await expect(privacy).not.toHaveAttribute('target');
        expect(await nessunoScorrimentoOrizzontale(page)).toBe(true);
        expect(await violazioniGravi(page)).toEqual([]);
      });
    }
  }
});

// la pagina Privacy è HTML statico come le edizioni: si legge a 320 px nei due temi, e la riga in fondo ci porta da ogni pagina
test.describe('la pagina Privacy', () => {
  for (const [tema, colorScheme] of [['chiaro', 'light'], ['scuro', 'dark']] as const) {
    test(`in tema ${tema} a 320 px: si legge dal titolo alla data dell’aggiornamento, senza scorrimento orizzontale, e axe non trova problemi gravi`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(PRIVACY);
      await expect(page).toHaveTitle('Privacy · AI Radar');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy');
      await expect(page.getByRole('main').getByRole('link', { name: 'profilo GitHub' })).toHaveAttribute('href', 'https://github.com/simones99');
      const aggiornata = page.getByRole('main').getByText('Aggiornata il 26 novembre 2026.');
      await aggiornata.scrollIntoViewIfNeeded();
      await expect(aggiornata).toBeVisible();
      expect(await nessunoScorrimentoOrizzontale(page)).toBe(true);
      expect(await violazioniGravi(page)).toEqual([]);
    });
  }

  test('dalla riga di un’edizione si arriva alla pagina Privacy', async ({ page }) => {
    await page.goto(EDIZIONE);
    const privacy = paginaPrivacy(page);
    await page.getByRole('contentinfo').getByRole('link', { name: 'Privacy' }).click();
    await expect(page).toHaveURL(privacy);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy');
  });
});

// l'app sa del contatore dalla pagina in cui gira: la home costruita ha lo script, e il colophon ha la riga nella nota con le fonti.
// I dati sono quelli del FIXTURE, come in dashboard.spec.ts
test.describe('la riga sul contatore nel colophon dell’app', () => {
  for (const [tema, colorScheme] of [['chiaro', 'light'], ['scuro', 'dark']] as const) {
    test(`in tema ${tema} a 320 px: la riga si legge accanto alle fonti e va a capo, e axe non trova problemi gravi`, async ({ page }) => {
      await page.clock.setFixedTime(new Date('2026-10-15T10:00:00'));
      await page.route('**/data/*.json', (route) => {
        const body = (FIXTURE as Record<string, unknown>)[new URL(route.request().url()).pathname.split('/').pop()!.replace('.json', '')];
        return body === undefined ? route.fulfill({ status: 404, body: '' }) : route.fulfill({ json: body });
      });
      await page.emulateMedia({ colorScheme });
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto('/');
      await expect(page.getByRole('link', { name: /MCP entra tra le competenze/ })).toBeVisible();
      const riga = page.getByRole('contentinfo').locator('p', { hasText: 'Il sito conta le visite con Umami' });
      await expect(riga).toHaveCount(1);
      await expect(riga).toContainText('Il progetto non è affiliato a nessuna delle fonti. Il sito conta le visite con Umami, senza cookie: le statistiche non contengono indirizzi IP e sono conservate in UE. Privacy.');
      await riga.scrollIntoViewIfNeeded();
      await expect(riga).toBeVisible();
      const privacy = riga.getByRole('link', { name: 'Privacy' });
      await expect(privacy).toHaveAttribute('href', 'privacy/');
      expect(await dovePorta(privacy)).toBe(paginaPrivacy(page));
      expect(await nessunoScorrimentoOrizzontale(page)).toBe(true);
      expect(await violazioniGravi(page)).toEqual([]);
    });
  }
});
