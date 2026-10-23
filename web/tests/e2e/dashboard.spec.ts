import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { TEMI } from '../../src/lib/router';
import { FIXTURE } from '../../src/lib/test/fixtures';

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-15T10:00:00'));
  await page.route('**/data/*.json', async (route) => {
    const name = new URL(route.request().url()).pathname.split('/').pop()!.replace('.json', '');
    const body = (FIXTURE as Record<string, unknown>)[name];
    if (body === undefined) return route.fulfill({ status: 404, body: '' });
    return route.fulfill({ json: body });
  });
});

const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
// attende la fine dello scorrimento morbido: scrollY fermo per 300 ms
const scrollSettled = (page: Page) =>
  expect.poll(async () => {
    const a = await page.evaluate(() => window.scrollY);
    await page.waitForTimeout(300);
    return a === (await page.evaluate(() => window.scrollY));
  }).toBe(true);
// cast: @axe-core/playwright usa playwright-core 1.64, @playwright/test 1.63: tipi Page nominalmente diversi
const seriousViolations = async (page: Page) =>
  (await new AxeBuilder({ page: page as never }).analyze()).violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

test('home: due porte, due sezioni, 9 temi', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText("Su cosa formarti e cosa succede all'AI in Italia");
  await expect(page.getByRole('link', { name: /MCP entra tra le competenze da imparare ora/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /A ottobre esce State of AI Report/ })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Su cosa formarti' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: "L'AI in Italia" })).toBeVisible();
  await expect(page.locator('button.face')).toHaveCount(9);
});

test('la settimana dell’8: articolo eliso nella data in testa', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-08T10:00:00'));
  await page.goto('/');
  await expect(page.getByText('Settimana dell’8 ott 2026')).toBeVisible();
});

test('porta Per te: apre Competenze sulla competenza della notizia', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /MCP entra tra le competenze da imparare ora/ }).click();
  await expect(page.locator('#detail-competenze')).toBeVisible();
  await expect(page).toHaveURL(/#competenze\/mcp$/);
  await expect(page.locator('#h-competenze')).toHaveText('Model Context Protocol (MCP)');
});

test('porta L’AI in Italia con una scadenza vicina: apre Norme sulla scadenza', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-20T10:00:00'));
  await page.goto('/');
  await page.getByRole('link', { name: /Tra 12 giorni/ }).click();
  await expect(page.locator('#detail-norme')).toBeVisible();
  await expect(page).toHaveURL(/#norme\/2026-12-02$/);
  await expect(page.locator('#detail-norme li[aria-current="true"]')).toContainText('Fine della transizione per la marcatura');
});

test('porta: Esc chiude come per le card, avanti la riapre, indietro la richiude', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /MCP entra tra le competenze da imparare ora/ }).click();
  await expect(page.locator('#detail-competenze')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('section.detail')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  await page.goForward();
  await expect(page.locator('#detail-competenze')).toBeVisible();
  await expect(page).toHaveURL(/#competenze\/mcp$/);
  await page.goBack();
  await expect(page.locator('section.detail')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});

test('porta con una card aperta: come una pillola, un solo indietro torna alla home', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 800 }); // da 1200px, con una card aperta, le porte non ci sono
  await page.goto('/');
  await page.locator('#tile-business .face').click();
  await expect(page.locator('#detail-business')).toBeVisible();
  await page.getByRole('link', { name: /MCP entra tra le competenze da imparare ora/ }).click();
  await expect(page.locator('#detail-competenze')).toBeVisible();
  await expect(page).toHaveURL(/#competenze\/mcp$/);
  await page.goBack();
  await expect(page.locator('section.detail')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});

test('porta verso la card già aperta: riapre la competenza e porta il focus al titolo', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 800 }); // da 1200px, con una card aperta, le porte non ci sono
  await page.goto('/');
  const porta = page.getByRole('link', { name: /MCP entra tra le competenze da imparare ora/ });
  await porta.click();
  await expect(page.locator('#h-competenze')).toHaveText('Model Context Protocol (MCP)');
  await page.getByRole('link', { name: '← Tutte le competenze' }).click();
  await expect(page.getByRole('img', { name: /Radar delle competenze/ })).toBeVisible();
  await porta.click();
  await expect(page.locator('#h-competenze')).toHaveText('Model Context Protocol (MCP)');
  await expect(page.locator('#h-competenze')).toBeFocused();
  await scrollSettled(page);
  await expect(page.locator('#h-competenze')).toBeInViewport();
  await page.goBack();
  await expect(page).toHaveURL(/#competenze$/);
  await expect(page.getByRole('img', { name: /Radar delle competenze/ })).toBeVisible();
  await page.goBack();
  await expect(page.locator('section.detail')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});

test('i vecchi link #politica aprono Norme e diventano #norme', async ({ page }) => {
  await page.goto('/#politica');
  await expect(page.locator('#detail-norme')).toBeVisible();
  await expect(page).toHaveURL(/#norme$/);
});

for (const id of TEMI) {
  test(`card ${id}: si apre con il clic e con il link diretto`, async ({ page }) => {
    await page.goto('/');
    await page.locator(`#tile-${id} .face`).click();
    await expect(page.locator(`#detail-${id}`)).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await page.goto(`/#${id}`);
    await page.reload();
    await expect(page.locator(`#detail-${id}`)).toBeVisible();
  });
}

test('indietro chiude; dopo un cambio di card un solo indietro torna alla home', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 800 }); // le pillole ci sono sotto 1200px
  await page.goto('/');
  await page.locator('#tile-business .face').click();
  await page.goBack();
  await expect(page.locator('section.detail')).toHaveCount(0);
  await page.locator('#tile-business .face').click();
  await page.getByRole('navigation', { name: 'Altri temi' }).getByRole('button', { name: 'Norme' }).click();
  await expect(page).toHaveURL(/#norme$/);
  await page.goBack();
  await expect(page.locator('section.detail')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});

test('tastiera: Invio apre e porta il focus al titolo, Esc chiude e lo riporta', async ({ page }) => {
  await page.goto('/');
  await page.locator('#tile-modelli .face').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#h-modelli')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#tile-modelli .face')).toBeFocused();
});

test('link diretto a una competenza: la sua pagina', async ({ page }) => {
  await page.goto('/#competenze/mcp');
  await expect(page.locator('#h-competenze')).toHaveText('Model Context Protocol (MCP)');
  await expect(page.getByRole('heading', { name: 'Per iniziare' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cosa si muove adesso' })).toBeVisible();
});

test('dal radar alla competenza e ritorno: clic sul punto, Indietro, Esc', async ({ page }) => {
  await page.goto('/');
  await page.locator('#tile-competenze .face').click();
  await page.locator('#detail-competenze g.pt').nth(1).locator('circle.hit').click(); // MCP
  await expect(page).toHaveURL(/#competenze\/mcp$/);
  await expect(page.locator('#h-competenze')).toHaveText('Model Context Protocol (MCP)');
  await page.goBack();
  await expect(page).toHaveURL(/#competenze$/);
  await expect(page.getByRole('img', { name: /Radar delle competenze/ })).toBeVisible();
  await page.getByRole('link', { name: /^RAG/ }).first().click(); // movimenti del mese ed elenco portano alla stessa pagina
  await expect(page.locator('#h-competenze')).toHaveText('RAG e ricerca semantica');
  await page.keyboard.press('Escape');
  await expect(page.locator('section.detail')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});

const ruoli = (page: Page) => page.getByRole('group', { name: 'Il tuo ruolo' });
const premuto = (page: Page) => ruoli(page).locator('button[aria-pressed="true"]');

test('ruolo: il link lo sceglie, il ricaricamento lo tiene, un link con un altro ruolo vince sul ricordo', async ({ page }) => {
  await page.goto('/#competenze?ruolo=compliance');
  await page.reload();
  await expect(premuto(page)).toHaveText('Legale e compliance');
  await expect(page.locator('#detail-competenze g.pt.altro')).not.toHaveCount(0);
  await page.goto('about:blank');
  await page.goto('/#competenze'); // senza ruolo nel link: vale il ricordo, che entra nel link
  await expect(premuto(page)).toHaveText('Legale e compliance');
  await expect(page).toHaveURL(/#competenze\?ruolo=compliance$/);
  await page.goto('about:blank');
  await page.goto('/#competenze?ruolo=dati');
  await expect(premuto(page)).toHaveText('Dati e analisi');
  await page.goto('about:blank');
  await page.goto('/#competenze');
  await expect(premuto(page)).toHaveText('Dati e analisi');
});

test('ruolo da tastiera: Tab tra i pulsanti, Invio sceglie; «Tutti» toglie il ruolo dal link', async ({ page }) => {
  await page.goto('/#competenze');
  await ruoli(page).getByRole('button', { name: 'Tutti' }).focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(ruoli(page).getByRole('button', { name: 'Prodotto' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(premuto(page)).toHaveText('Prodotto');
  await expect(page).toHaveURL(/#competenze\?ruolo=prodotto$/);
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Space');
  await expect(premuto(page)).toHaveText('Tutti');
  await expect(page).toHaveURL(/#competenze$/);
});

test('porta Per te: scelto un ruolo nella card, la home lo mostra e la porta riapre la card con il ruolo', async ({ page }) => {
  await page.goto('/#competenze');
  await ruoli(page).getByRole('button', { name: 'Prodotto' }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('section.detail')).toHaveCount(0);
  const porta = page.getByRole('link', { name: /Per te · Prodotto/ });
  await expect(porta).toContainText('RAG esce da Impara ora');
  await porta.click();
  await expect(page).toHaveURL(/#competenze\/rag\?ruolo=prodotto$/);
  await page.getByRole('link', { name: '← Tutte le competenze' }).click();
  await expect(premuto(page)).toHaveText('Prodotto');
});

test('ruolo a 320px: la fila va a capo, niente scorrimento orizzontale', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/#competenze?ruolo=dati');
  await page.reload();
  await expect(premuto(page)).toHaveText('Dati e analisi');
  const tops = await ruoli(page).getByRole('button').evaluateAll((bs) => new Set(bs.map((b) => b.getBoundingClientRect().top)).size);
  expect(tops).toBeGreaterThan(1);
  expect(await noHorizontalScroll(page)).toBe(true);
});

const aree = (page: Page) => page.getByRole('group', { name: 'Area' });
const paesiUe = (page: Page) => page.getByRole('group', { name: "Paesi dell'UE" });
const scheda = (page: Page) => page.locator('#detail-geopoliticai h3').first();

test('area: il link apre il Paese, il ricaricamento lo tiene, un link con un’altra area vince sul ricordo', async ({ page }) => {
  await page.goto('/#geopoliticai?area=italia');
  await expect(scheda(page)).toHaveText("Italia, nell'UE");
  await expect(paesiUe(page).locator('button[aria-pressed="true"]')).toHaveText('Italia');
  await page.reload();
  await expect(scheda(page)).toHaveText("Italia, nell'UE");
  await page.goto('about:blank');
  await page.goto('/#geopoliticai'); // senza area nel link: vale il ricordo, che entra nel link
  await expect(scheda(page)).toHaveText("Italia, nell'UE");
  await expect(page).toHaveURL(/#geopoliticai\?area=italia$/);
  await page.goto('about:blank');
  await page.goto('/#geopoliticai?area=cina');
  await expect(scheda(page)).toHaveText('Cina');
  await expect(aree(page).locator('button[aria-pressed="true"]')).toHaveText('Cina');
});

test('area non valida: si apre l’UE, senza errori', async ({ page }) => {
  const errori: string[] = [];
  page.on('pageerror', (e) => errori.push(e.message));
  await page.goto('/#geopoliticai?area=atlantide');
  await expect(scheda(page)).toHaveText('UE');
  await expect(aree(page).locator('button[aria-pressed="true"]')).toHaveText('UE');
  await expect(page).toHaveURL(/#geopoliticai$/);
  expect(errori).toEqual([]);
});

test('area da tastiera: Tab tra i pulsanti, Invio sceglie; «Tutta l’UE» toglie l’area dal link', async ({ page }) => {
  await page.goto('/#geopoliticai');
  await aree(page).getByRole('button', { name: 'USA' }).focus();
  await page.keyboard.press('Tab');
  await expect(aree(page).getByRole('button', { name: 'Cina' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(scheda(page)).toHaveText('Cina');
  await expect(page).toHaveURL(/#geopoliticai\?area=cina$/);
  await aree(page).getByRole('button', { name: 'UE' }).focus();
  await page.keyboard.press('Enter');
  await paesiUe(page).getByRole('button', { name: "Tutta l'UE" }).focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(scheda(page)).toHaveText("Francia, nell'UE");
  await expect(page).toHaveURL(/#geopoliticai\?area=francia$/);
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Space');
  await expect(scheda(page)).toHaveText('UE');
  await expect(page).toHaveURL(/#geopoliticai$/);
});

test('area a 320px: le file vanno a capo, niente scorrimento orizzontale', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/#geopoliticai?area=italia');
  await expect(scheda(page)).toHaveText("Italia, nell'UE");
  for (const fila of [aree(page), paesiUe(page)]) {
    const tops = await fila.getByRole('button').evaluateAll((bs) => new Set(bs.map((b) => b.getBoundingClientRect().top)).size);
    expect(tops).toBeGreaterThan(1);
  }
  expect(await noHorizontalScroll(page)).toBe(true);
});

test('Modelli e ricerca: il rimando apre GeopoliticAI, Indietro torna a Modelli e poi alla home', async ({ page }) => {
  await page.goto('/');
  await page.locator('#tile-modelli .face').click();
  await page.getByRole('link', { name: 'Vai a GeopoliticAI →' }).click();
  await expect(page).toHaveURL(/#geopoliticai$/);
  await expect(scheda(page)).toHaveText('UE');
  await page.goBack();
  await expect(page).toHaveURL(/#modelli$/);
  await expect(page.locator('#detail-modelli')).toBeVisible();
  await page.goBack();
  await expect(page.locator('section.detail')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});

const matrice = (page: Page) => page.getByRole('table', { name: 'Calcolo e capacità per area, anno per anno' });

test('matrice: un clic su una riga cambia l’area nel link e porta il focus alla scheda', async ({ page }) => {
  await page.goto('/#geopoliticai');
  await matrice(page).getByRole('button', { name: 'Germania' }).click();
  await expect(page).toHaveURL(/#geopoliticai\?area=germania$/);
  await expect(scheda(page)).toHaveText("Germania, nell'UE");
  await expect(page.getByRole('region', { name: "Germania, nell'UE" })).toBeFocused();
  await matrice(page).getByRole('button', { name: 'USA' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#geopoliticai\?area=usa$/);
  await expect(page.getByRole('region', { name: 'USA' })).toBeFocused();
});

test('matrice a 320px: scorre dentro il suo contenitore, non la pagina', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/#geopoliticai');
  await page.getByRole('group', { name: 'Misura' }).getByRole('button', { name: 'Calcolo di addestramento (FLOP)' }).click();
  const box = page.getByRole('region', { name: /scorre in orizzontale/ });
  expect(await box.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  expect(await noHorizontalScroll(page)).toBe(true);
});

for (const width of [320, 360]) {
  test(`${width}px: nessuno scorrimento orizzontale`, async ({ page }) => {
    await page.setViewportSize({ width, height: 780 });
    await page.goto('/');
    expect(await noHorizontalScroll(page)).toBe(true);
    for (const id of TEMI) {
      await page.goto(`/#${id}`);
      await page.reload();
      await expect(page.locator(`#detail-${id}`)).toBeVisible();
      expect(await noHorizontalScroll(page), id).toBe(true);
    }
    await page.goto('/#competenze/mcp');
    await page.reload();
    await expect(page.locator('#h-competenze')).toHaveText('Model Context Protocol (MCP)');
    expect(await noHorizontalScroll(page), 'competenze/mcp').toBe(true);
  });
}

test('tema scuro', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(11, 11, 10)');
});

test('riduci movimento: nessuna animazione all’apertura', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('#tile-norme .face').click();
  await expect(page.locator('#detail-norme')).toBeVisible();
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test('accessibilità: nessuna violazione grave in home e nelle card', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('button.face')).toHaveCount(9);
  expect(await seriousViolations(page)).toEqual([]);
  for (const id of TEMI) {
    await page.goto(`/#${id}`);
    await page.reload();
    await expect(page.locator(`#detail-${id}`)).toBeVisible();
    expect(await seriousViolations(page), id).toEqual([]);
  }
  await page.goto('/#competenze/mcp');
  await page.reload();
  await expect(page.locator('#h-competenze')).toHaveText('Model Context Protocol (MCP)');
  expect(await seriousViolations(page), 'competenze/mcp').toEqual([]);
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`accessibilità con un ruolo scelto, tema ${colorScheme}: le competenze attenuate restano leggibili`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/#competenze?ruolo=dati');
    await page.reload();
    await expect(page.locator('#detail-competenze .altro').first()).toBeVisible();
    expect(await seriousViolations(page)).toEqual([]);
  });
}

const SETTORI = ['Adozione per settore, Italia e UE', "A cosa serve l'AI, Italia e UE", 'Cosa frena chi non la usa, Italia e UE'];

test('Business in tema scuro: i grafici dei settori senza violazioni gravi', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/#business');
  await page.reload();
  for (const name of SETTORI) await expect(page.getByRole('img', { name })).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);
});

test('Business a 320px: i grafici dei settori senza scorrimento orizzontale', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/#business');
  await page.reload();
  for (const name of SETTORI) await expect(page.getByRole('img', { name })).toBeVisible();
  await expect(page.getByText(/^Eurostat non rileva finanza/)).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);
});

test('Business a 1440px: «Adozione per settore» resta sotto il titolo «Adozione», non sale fra gli investimenti', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#business');
  await page.reload();
  const titolo = await page.getByRole('heading', { name: 'Adozione', exact: true }).boundingBox();
  const blocco = await page.getByRole('heading', { name: /^Adozione per settore/ }).boundingBox();
  expect(blocco!.y).toBeGreaterThan(titolo!.y + titolo!.height);
});

const menuSettore = (page: Page) => page.getByRole('combobox', { name: 'Il tuo settore' });

test('settore: il link lo sceglie, il ricaricamento lo tiene, un link con un altro settore vince sul ricordo', async ({ page }) => {
  await page.goto('/#business?settore=ict');
  await page.reload();
  await expect(menuSettore(page)).toHaveValue('ict');
  await expect(page.getByRole('img', { name: 'Adozione in Informazione e comunicazione, Italia e UE' })).toBeVisible();
  await page.goto('about:blank');
  await page.goto('/#business'); // senza settore nel link: vale il ricordo, che entra nel link
  await expect(menuSettore(page)).toHaveValue('ict');
  await expect(page).toHaveURL(/#business\?settore=ict$/);
  await page.goto('about:blank');
  await page.goto('/#business?settore=manifattura');
  await expect(menuSettore(page)).toHaveValue('manifattura');
  await page.goto('about:blank');
  await page.goto('/#business');
  await expect(menuSettore(page)).toHaveValue('manifattura');
});

test('settore da tastiera: le frecce cambiano settore e link; «Tutti» toglie il settore dal link', async ({ page }) => {
  await page.goto('/#business');
  await menuSettore(page).focus();
  await page.keyboard.press('ArrowDown');
  await expect(menuSettore(page)).toHaveValue('manifattura');
  await expect(page).toHaveURL(/#business\?settore=manifattura$/);
  await expect(page.getByRole('heading', { name: 'Adozione in Manifattura, 2021-2025' })).toBeVisible();
  await expect(menuSettore(page)).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(menuSettore(page)).toHaveValue('tutti');
  await expect(page).toHaveURL(/#business$/);
  await expect(page.getByRole('heading', { name: /^Adozione in/ })).toHaveCount(0);
});

test('Per la tua organizzazione: scelto un settore nella card, con un dato appena uscito, la home lo mostra e riapre la card con il settore', async ({ page }) => {
  // dati dei settori usciti l'1 ottobre: negli ultimi 30 giorni rispetto al 15
  await page.route('**/data/eurostat_settori.json', (route) =>
    route.fulfill({ json: { ...FIXTURE.eurostat_settori, aggiornato_eurostat: '2026-10-01T11:00:00+0200' } }));
  await page.goto('/#business');
  await menuSettore(page).selectOption('manifattura');
  await page.keyboard.press('Escape');
  await expect(page.locator('section.detail')).toHaveCount(0);
  const porta = page.getByRole('link', { name: /Per la tua organizzazione · Manifattura/ });
  await expect(porta).toContainText("15% delle imprese manifatturiere italiane usa l'AI (UE: 17%)");
  await porta.click();
  await expect(page).toHaveURL(/#business\?settore=manifattura$/);
  await expect(menuSettore(page)).toHaveValue('manifattura');
});

test('settore a 320px: menu, andamento e confronti senza scorrimento orizzontale', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/#business?settore=immobiliare');
  await page.reload();
  await expect(menuSettore(page)).toHaveValue('immobiliare');
  await expect(page.getByRole('img', { name: 'Adozione in Immobiliare, Italia e UE' })).toBeVisible();
  await expect(page.getByText('Dato italiano non affidabile secondo Eurostat per: Logistica.')).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);
});

test('settore scelto in tema scuro: nessuna violazione grave', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/#business?settore=manifattura');
  await page.reload();
  await expect(page.getByRole('img', { name: 'Adozione in Manifattura, Italia e UE' })).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);
});

test('ancora interna con una card aperta: la pagina va all’ancora, non alle card', async ({ page }) => {
  await page.goto('/');
  await page.locator('#tile-business .face').click();
  await expect(page.locator('#detail-business')).toBeVisible();
  await page.getByRole('navigation', { name: 'Pagina' }).getByRole('link', { name: 'Stato delle fonti' }).click();
  await expect(page.locator('section.detail')).toHaveCount(0);
  await scrollSettled(page);
  await expect(page.locator('#stato')).toBeInViewport();
});

test('360px: all’apertura il titolo della card è nella finestra, sotto le pillole', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/');
  await page.locator('#tile-rapporti .face').click();
  await expect(page.locator('#detail-rapporti')).toBeVisible();
  await scrollSettled(page);
  await expect(page.locator('#h-rapporti')).toBeInViewport();
  await expect.poll(async () => {
    const pills = await page.locator('nav[aria-label="Altri temi"]').boundingBox();
    const det = await page.locator('#detail-rapporti').boundingBox();
    return pills && det ? det.y >= pills.y + pills.height : false;
  }).toBe(true);
});

test('Esc due volte di fila dalla pagina di una competenza: un solo salto, si resta nel sito', async ({ page }) => {
  await page.goto('/?esterna');
  await page.goto('/');
  await page.getByRole('button', { name: /^Competenze/ }).click();
  await page.evaluate(() => document.dispatchEvent(new CustomEvent('ai-radar:apri', { detail: { tema: 'competenze', elemento: 'mcp' } })));
  await expect(page).toHaveURL(/#competenze\/mcp$/);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(page.locator('#detail-competenze')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});

const box = async (page: Page, sel: string) => (await page.locator(sel).first().boundingBox())!;

test('1440px: in home intro e porte a sinistra delle card', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const intro = await box(page, '.intro');
  const temi = await box(page, '#temi');
  expect(intro.x + intro.width).toBeLessThanOrEqual(temi.x);
  expect(Math.abs(intro.y - temi.y)).toBeLessThan(40);
  expect(await noHorizontalScroll(page)).toBe(true);
});

test('1440px: card aperta con le altre in elenco accanto, senza intro né pillole; dall’elenco un solo indietro torna alla home', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.locator('#tile-business .face').click();
  await expect(page.locator('#detail-business')).toBeVisible();
  await expect(page.locator('.intro')).toBeHidden();
  await expect(page.locator('nav[aria-label="Altri temi"]')).toBeHidden();
  await expect(page.locator('button.face:visible')).toHaveCount(9);
  await expect(page.locator('#tile-business .face')).toHaveAttribute('aria-expanded', 'true');
  const elenco = await box(page, '#temi');
  const det = await box(page, '#detail-business');
  expect(elenco.x + elenco.width).toBeLessThanOrEqual(det.x);
  await page.locator('#tile-norme .face').click();
  await expect(page.locator('#detail-norme')).toBeVisible();
  await expect(page).toHaveURL(/#norme$/);
  await page.goBack();
  await expect(page.locator('section.detail')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.intro')).toBeVisible();
});

test('1920px: foto a tutta larghezza dietro il titolo, grafici almeno 3 per riga', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/#modelli');
  await expect(page.locator('#detail-modelli')).toBeVisible();
  const foto = await box(page, '#detail-modelli figure');
  const hero = await box(page, '#detail-modelli .d-hero');
  const titolo = await box(page, '#h-modelli');
  expect(foto.width).toBeGreaterThan(hero.width - 2);
  expect(titolo.x).toBeGreaterThanOrEqual(foto.x);
  expect(titolo.y + titolo.height).toBeLessThanOrEqual(foto.y + foto.height);
  const tops = await page.locator('#detail-modelli .blk').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  const perRiga = Math.max(...Object.values(tops.reduce<Record<number, number>>((m, t) => ({ ...m, [t]: (m[t] ?? 0) + 1 }), {})));
  expect(perRiga).toBeGreaterThanOrEqual(3);
});
