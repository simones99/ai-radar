// L'anteprima di condivisione sul sito che verrà pubblicato: la build rilanciata qui deve ricevere lo stesso indirizzo base del job.
import { expect, test } from '@playwright/test';
import { FIXTURE } from '../../src/lib/test/fixtures';

const INDIRIZZO = process.env.AI_RADAR_BASE_URL ?? 'https://simones99.github.io/ai-radar/';

test.describe('senza JavaScript, come un crawler', () => {
  test.use({ javaScriptEnabled: false });

  test('la home ha i tag dell’anteprima, con gli indirizzi assoluti', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'AI Radar');
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', INDIRIZZO);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `${INDIRIZZO}anteprima.png`);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', INDIRIZZO);
  });

  test('un link #card mostra la stessa anteprima della home', async ({ page }) => {
    await page.goto('/#competenze/mcp');
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'AI Radar');
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', INDIRIZZO);
  });
});

test('l’immagine dell’anteprima è nel sito', async ({ request }) => {
  const risposta = await request.get('/anteprima.png');
  expect(risposta.status()).toBe(200);
  expect(risposta.headers()['content-type']).toBe('image/png');
});

test('un link come #competenze/mcp apre la sua card', async ({ page }) => {
  await page.route('**/data/*.json', async (route) => {
    const name = new URL(route.request().url()).pathname.split('/').pop()!.replace('.json', '');
    const body = (FIXTURE as Record<string, unknown>)[name];
    return body === undefined ? route.fulfill({ status: 404, body: '' }) : route.fulfill({ json: body });
  });
  await page.goto('/#competenze/mcp');
  await expect(page.locator('#detail-competenze')).toBeVisible();
  await expect(page.locator('#h-competenze')).toHaveText('Model Context Protocol (MCP)');
  await expect(page).toHaveURL(/#competenze\/mcp$/);
});
