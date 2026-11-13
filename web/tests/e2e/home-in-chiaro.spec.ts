// La home in chiaro sul sito costruito: il testo della settimana dei dati sta nell'HTML, e con JavaScript l'app ne prende il posto.
// Il testo statico nasce dalla cartella dei dati della build: qui l'app carica gli stessi file, così le due porte dicono la stessa cosa.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { leggiDati } from '../../src/lib/data/cartella';
import { settimanaDeiDati } from '../../src/lib/edizioni';
import { portaConDati, testoPorta } from '../../src/lib/edizioni/tipi';
import { FRASE_DI_APERTURA } from '../../src/lib/text/apertura';

const DATI = process.env.AI_RADAR_DATA_DIR ?? fileURLToPath(new URL('../../../data', import.meta.url));
const settimana = settimanaDeiDati(leggiDati(DATI));
/** Il testo delle porte con dati, come lo legge chi guarda la pagina. */
const PORTE = (settimana?.porte ?? []).filter(portaConDati).map(testoPorta);

/** Il titolo della sezione delle card nel testo statico: l'app non ce l'ha. */
const SITUAZIONE = 'La situazione';

/** Quante volte un testo si legge nella pagina. */
const volte = (page: Page, testo: string) => page.evaluate((t) => document.body.innerText.replace(/\s+/g, ' ').split(t).length - 1, testo);

test.describe('con JavaScript', () => {
  test.beforeEach(async ({ page }) => {
    // le frasi dell'app sul giorno dei dati, come quelle del testo statico: la porta di Norme conta i giorni da oggi
    if (settimana) await page.clock.setFixedTime(new Date(settimana.raccolti));
    await page.route('**/data/*.json', async (route) => {
      const file = join(DATI, new URL(route.request().url()).pathname.split('/').pop()!);
      return existsSync(file) ? route.fulfill({ contentType: 'application/json', body: readFileSync(file, 'utf-8') }) : route.fulfill({ status: 404, body: '' });
    });
  });

  test('l’app prende il posto del testo statico: il testo statico non c’è più, un solo h1, e il testo di ogni porta una volta sola', async ({ page }) => {
    expect(PORTE.length, 'nella cartella dei dati non ci sono porte con dati').toBeGreaterThan(0);
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

  test('il testo statico c’è: la frase di apertura, le porte, le card, e la testata porta all’indice delle competenze', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(FRASE_DI_APERTURA);
    await expect(page.getByRole('heading', { name: SITUAZIONE, exact: true })).toBeVisible();
    for (const testo of PORTE) expect(await volte(page, testo), testo).toBe(1);
    await page.getByRole('banner').getByRole('link', { name: 'Competenze' }).click();
    await expect(page).toHaveURL(/\/competenze\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
