// Uno screenshot di una vista del sito, per guardarla a occhio. Non è un test: gira solo con `npm run scatto`.
//
//   SCATTO_URL='#geopoliticai?vista=filo&filo=ue' SCATTO_FILE=/percorso/vista.png npm run scatto
//
// SCATTO_URL     l'hash da aprire (obbligatorio)
// SCATTO_FILE    il PNG da scrivere, meglio fuori dal repo (obbligatorio)
// SCATTO_LARGHEZZA  larghezza della finestra in px, 1280 se manca
// SCATTO_TEMA    light o dark, light se manca
// SCATTO_REGIONE il nome accessibile di una region da fotografare da sola, per esempio
//                "Chi controlla la catena dell'AI"; se manca, la pagina intera
// SCATTO_DATI    una cartella di JSON (per esempio scritti dalla pipeline con AI_RADAR_DATA_DIR):
//                ogni file lì dentro prende il posto della parte del FIXTURE con lo stesso nome
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from '@playwright/test';
import { FIXTURE } from '../../src/lib/test/fixtures';

const { SCATTO_URL, SCATTO_FILE, SCATTO_REGIONE, SCATTO_DATI } = process.env;
const larghezza = Number(process.env.SCATTO_LARGHEZZA ?? 1280);
const tema = process.env.SCATTO_TEMA === 'dark' ? 'dark' : 'light';

test('scatto', async ({ page }) => {
  if (!SCATTO_URL || !SCATTO_FILE) throw new Error('Servono SCATTO_URL e SCATTO_FILE: vedi il commento in testa al file.');
  await page.clock.setFixedTime(new Date('2026-10-15T10:00:00'));
  await page.route('**/data/*.json', async (route) => {
    const name = new URL(route.request().url()).pathname.split('/').pop()!.replace('.json', '');
    const file = SCATTO_DATI && join(SCATTO_DATI, `${name}.json`);
    const body = file && existsSync(file) ? JSON.parse(readFileSync(file, 'utf-8')) : (FIXTURE as Record<string, unknown>)[name];
    return body === undefined ? route.fulfill({ status: 404, body: '' }) : route.fulfill({ json: body });
  });
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: tema });
  await page.setViewportSize({ width: larghezza, height: 900 });
  await page.goto(`/${SCATTO_URL.startsWith('#') ? SCATTO_URL : `#${SCATTO_URL}`}`);
  if (SCATTO_REGIONE) {
    const regione = page.getByRole('region', { name: SCATTO_REGIONE });
    await regione.scrollIntoViewIfNeeded();
    await regione.screenshot({ path: SCATTO_FILE });
  } else {
    await page.screenshot({ path: SCATTO_FILE, fullPage: true });
  }
});
