// Le pagine statiche delle competenze in un browser vero. Il sito costruito le ha con i dati veri, che cambiano ogni lunedì: qui nascono dal FIXTURE
// e si servono con page.route, sul foglio di stile vero della build, come le edizioni di prova.
import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import type { Dataset } from '../../src/lib/data/types';
import { creaEdizione, type Edizione } from '../../src/lib/edizioni';
import { filePubblici, foglioDellaHome } from '../../src/lib/statico';
import { FIXTURE } from '../../src/lib/test/fixtures';

const d = FIXTURE as Dataset;
const MCP = '/competenze/mcp/';
const ROBOTICA = '/competenze/robotica/'; // ha l'avviso di dato incerto
const INDICE = '/competenze/';
// un'edizione accanto alle competenze: la sua testata è il link con cui un crawler arriva all'indice
const edizione = creaEdizione(d, null) as Edizione;
const EDIZIONE = `/edizioni/${edizione.settimana}/`;

async function serviCompetenze(page: Page, request: APIRequestContext) {
  const home = await (await request.get('/')).text();
  const file = filePubblici({ edizioni: [edizione], radar: d.radar }, { indirizzoBase: 'https://esempio.org/ai-radar/', foglio: foglioDellaHome(home) });
  for (const [percorso, body] of Object.entries(file)) {
    await page.route(`**/${percorso.replace(/index\.html$/, '')}`, (route) => route.fulfill({ contentType: 'text/html; charset=utf-8', body }));
  }
}

test.beforeEach(async ({ page, request }) => {
  await page.route('**/data/*.json', async (route) => {
    const name = new URL(route.request().url()).pathname.split('/').pop()!.replace('.json', '');
    const body = (FIXTURE as Record<string, unknown>)[name];
    return body === undefined ? route.fulfill({ status: 404, body: '' }) : route.fulfill({ json: body });
  });
  await serviCompetenze(page, request);
});

// cast: come in dashboard.spec.ts, @axe-core/playwright usa un altro playwright-core
const violazioniGravi = async (page: Page) =>
  (await new AxeBuilder({ page: page as never }).analyze()).violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

for (const [nome, indirizzo] of [['una competenza', MCP], ['una competenza dal dato incerto', ROBOTICA], ['l’indice delle competenze', INDICE]] as const) {
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
      expect(await violazioniGravi(page)).toEqual([]);
    });

    test('a 320 px non scorre di lato', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(indirizzo);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });

    test('con «riduci movimento» niente si anima, nemmeno passando su un link', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(indirizzo);
      await page.getByRole('main').getByRole('link').first().hover();
      expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
      expect(await page.evaluate(() => [...document.querySelectorAll('*')].filter((el) => {
        const stile = getComputedStyle(el);
        return stile.animationName !== 'none' || stile.transitionDuration.split(', ').some((durata) => durata !== '0s');
      }).length)).toBe(0);
    });
  });
}

test.describe('senza JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('si legge tutta: stato nei due mercati, domanda, slancio, fonti e link all’app, con lo stile del sito', async ({ page }) => {
    await page.goto(MCP);
    await expect(page).toHaveTitle('Model Context Protocol (MCP) negli annunci di lavoro, in Italia e all’estero · AI Radar');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Model Context Protocol (MCP)');
    await expect(page.getByText('Tutti i Paesi: Impara ora, un mese fa Da consolidare.')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Domanda' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Slancio' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('row', { name: 'set 2026 Impara ora Da provare' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'acme/mcp-kit' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'The Adzuna API' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Apri MCP nell’app, sul mercato Italia' })).toBeVisible();
    await expect(page.locator('script')).toHaveCount(0);
    await expect(page.locator('body')).toHaveCSS('font-family', /Bricolage Grotesque Variable/);
  });

  test('l’indice si legge tutto: gruppi per quadrante, competenze con l’Italia accanto, e porta alle pagine', async ({ page }) => {
    await page.goto(INDICE);
    await expect(page).toHaveTitle('Le competenze sull’AI negli annunci di lavoro, in Italia e all’estero · AI Radar');
    await expect(page.getByRole('heading', { level: 2, name: 'Impara ora' })).toBeVisible();
    await expect(page.getByText('Italia: Da provare').first()).toBeVisible();
    await page.getByRole('link', { name: 'Model Context Protocol (MCP)' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Model Context Protocol (MCP)');
    await expect(page.locator('script')).toHaveCount(0);
  });

  test('da un’edizione la testata porta all’indice delle competenze', async ({ page }) => {
    await page.goto(EDIZIONE);
    await page.getByRole('banner').getByRole('link', { name: 'Competenze' }).click();
    await expect(page).toHaveURL(new RegExp(`${INDICE}$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Competenze');
  });

  test('il dato incerto si vede come avviso', async ({ page }) => {
    await page.goto(ROBOTICA);
    await expect(page.getByRole('note')).toHaveText('Dato incerto: pochi paper (45 al mese). La posizione sul radar può cambiare molto.');
  });
});

test('dall’indice si apre una competenza, e dalla sua testata si torna all’indice', async ({ page }) => {
  await page.goto(INDICE);
  await expect(page.getByRole('heading', { level: 2, name: 'Impara ora' })).toBeVisible();
  await page.getByRole('link', { name: 'Model Context Protocol (MCP)' }).click();
  await expect(page).toHaveURL(new RegExp(`${MCP}$`));
  await page.getByRole('banner').getByRole('link', { name: 'Competenze' }).click();
  await expect(page).toHaveURL(new RegExp(`${INDICE}$`));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Competenze');
});

test('l’indice da tastiera: prima il salto al contenuto, poi le competenze, e Invio apre la pagina', async ({ page }) => {
  await page.goto(INDICE);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Vai al contenuto' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#contenuto')).toBeFocused();
  await page.keyboard.press('Tab');
  const prima = page.getByRole('main').getByRole('link').first();
  await expect(prima).toBeFocused();
  await expect(prima).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/competenze\/agenti\/$/);
});

test('da tastiera: prima il salto al contenuto, poi la testata; il link all’app apre la competenza sul mercato Italia', async ({ page }) => {
  await page.goto(MCP);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Vai al contenuto' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#contenuto')).toBeFocused();
  const link = page.getByRole('link', { name: 'Apri MCP nell’app, sul mercato Italia' });
  await link.focus();
  await expect(link).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/#competenze\/mcp\?mercato=italia$/);
  await expect(page.locator('#detail-competenze')).toBeVisible();
});

test('il sito costruito ha una pagina per ogni competenza dei dati veri, servita come HTML con il suo titolo', async ({ request }) => {
  // request non passa da page.route: legge i file che la build ha scritto davvero
  const uscita = fileURLToPath(new URL('../../../_site/competenze', import.meta.url));
  const id = existsSync(uscita) ? readdirSync(uscita, { withFileTypes: true }).filter((x) => x.isDirectory()).map((x) => x.name) : [];
  expect(id.length).toBeGreaterThan(0);
  for (const competenza of id) {
    const risposta = await request.get(`/competenze/${competenza}/`);
    expect(risposta.ok()).toBe(true);
    const html = await risposta.text();
    expect(html).toMatch(/<h1>[^<]+<\/h1>/);
    expect(html).toContain(`<link rel="canonical" href="`);
    expect((await request.get(`/competenze/${competenza}/anteprima.png`)).ok()).toBe(true);
  }
});
