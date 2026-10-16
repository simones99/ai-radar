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

test('link diretto a una competenza la evidenzia', async ({ page }) => {
  await page.goto('/#competenze/mcp');
  await expect(page.getByRole('button', { name: /^MCP/, pressed: true })).toBeVisible();
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
  await expect(page.locator('button.face')).toHaveCount(8);
  expect(await seriousViolations(page)).toEqual([]);
  for (const id of TEMI) {
    await page.goto(`/#${id}`);
    await page.reload();
    await expect(page.locator(`#detail-${id}`)).toBeVisible();
    expect(await seriousViolations(page), id).toEqual([]);
  }
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
