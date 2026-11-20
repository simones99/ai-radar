// L'ultima edizione vera del sito costruito, quella che sta per essere pubblicata: l'edizione di prova di edizioni.spec.ts nasce dal FIXTURE,
// questa ha i testi lunghi e le fonti dei dati veri. Prima della prima edizione non ce n'è nessuna, e questi test si saltano.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type APIRequestContext } from '@playwright/test';

/** La settimana dell'ultima edizione, dall'indice che legge anche la home. Senza edizioni il server risponde 404 o con la home. */
async function ultimaEdizione(request: APIRequestContext): Promise<string | null> {
  const risposta = await request.get('data/edizioni.json');
  if (!risposta.ok()) return null;
  return risposta.json().then((indice: { ultima?: string }) => indice.ultima ?? null, () => null);
}

test.describe('l’ultima edizione vera', () => {
  let indirizzo: string;

  test.beforeEach(async ({ request }) => {
    const ultima = await ultimaEdizione(request);
    test.skip(!ultima, 'nel sito costruito non ci sono edizioni');
    indirizzo = `edizioni/${ultima}/`;
  });

  test('si apre, e axe non trova problemi gravi', async ({ page }) => {
    const risposta = await page.goto(indirizzo);
    expect(risposta?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Settimana');
    // cast: come in dashboard.spec.ts, @axe-core/playwright usa un altro playwright-core
    const violazioni = (await new AxeBuilder({ page: page as never }).analyze()).violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(violazioni).toEqual([]);
  });

  test('a 320 px non scorre di lato', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(indirizzo);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
