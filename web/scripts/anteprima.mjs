// Rifà l'immagine fissa dell'anteprima della home, quando cambiano marchio o colori: `npm run anteprima`.
// Non è un passo della build: il PNG è salvato in public/ e la build lo copia soltanto.
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, colorScheme: 'light' });
await page.goto(new URL('./anteprima.html', import.meta.url).href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: fileURLToPath(new URL('../public/anteprima.png', import.meta.url)) });
await browser.close();
