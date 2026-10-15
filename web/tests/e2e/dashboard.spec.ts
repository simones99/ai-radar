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
// cast: @axe-core/playwright usa playwright-core 1.64, @playwright/test 1.63: tipi Page nominalmente diversi
const seriousViolations = async (page: Page) =>
  (await new AxeBuilder({ page: page as never }).analyze()).violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

test('home: tesi e 8 temi', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('quelli di un anno fa');
  await expect(page.locator('button.face')).toHaveCount(8);
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
  await page.getByRole('navigation', { name: 'Altri temi' }).getByRole('button', { name: 'Politica' }).click();
  await expect(page).toHaveURL(/#politica$/);
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
  await page.locator('#tile-politica .face').click();
  await expect(page.locator('#detail-politica')).toBeVisible();
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
