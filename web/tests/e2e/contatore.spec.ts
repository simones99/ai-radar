// Il contatore delle visite sul sito costruito, che è quello che viene pubblicato: ogni pagina ha lo script di Umami, e servita in locale
// non manda niente, perché lo script conta solo sull'host pubblico del sito. L'edizione di prova nasce dal FIXTURE, come in edizioni.spec.ts,
// con lo stesso ID e lo stesso indirizzo base della build. L'ID, se il repository non lo dà, è quello di prova di playwright.config.ts.
import { fileURLToPath } from 'node:url';
import { expect, test, type Page, type Request } from '@playwright/test';
import { leggiDati } from '../../src/lib/data/cartella';
import type { Dataset } from '../../src/lib/data/types';
import { creaEdizione, type Edizione } from '../../src/lib/edizioni';
import { indirizzoBase } from '../../src/lib/indirizzoBase';
import { filePubblici, foglioDellaHome } from '../../src/lib/statico';
import { FIXTURE } from '../../src/lib/test/fixtures';

const ID = process.env.AI_RADAR_UMAMI_ID!;
const SCRIPT = 'https://cloud.umami.is/script.js';
const HOST = new URL(indirizzoBase(process.env.AI_RADAR_BASE_URL)).hostname;
const DATI = process.env.AI_RADAR_DATA_DIR ?? fileURLToPath(new URL('../../../data', import.meta.url));
const COMPETENZA = leggiDati(DATI, ['radar']).radar?.competenze[0]?.id;
const edizione = creaEdizione(FIXTURE as Dataset, null) as Edizione;
const EDIZIONE = `/edizioni/${edizione.settimana}/`;

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

for (const [nome, indirizzo] of [['la home', '/'], ['un’edizione', EDIZIONE], ['una pagina di competenza', `/competenze/${COMPETENZA}/`]] as const) {
  test(`${nome} ha lo script di Umami, e in locale non manda niente a Umami`, async ({ page }) => {
    expect(ID, 'manca l’ID di Umami: lo dà playwright.config.ts').toBeTruthy();
    if (indirizzo.startsWith('/competenze/')) expect(COMPETENZA, 'nella cartella dei dati non ci sono competenze').toBeTruthy();
    const richieste = await richiesteVersoUmami(page, indirizzo);
    const script = page.locator(`head script[src="${SCRIPT}"]`);
    await expect(script).toHaveCount(1);
    await expect(script).toHaveAttribute('data-website-id', ID);
    await expect(script).toHaveAttribute('data-domains', HOST);
    // il browser va a prendere lo script, e basta: nessun invio
    expect(richieste).toEqual([`GET ${SCRIPT}`]);
  });
}
