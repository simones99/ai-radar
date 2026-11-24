// La macchina delle immagini di anteprima, fotografate con Playwright: quella di un'edizione e quella di una competenza.
// Ognuna ha il suo modello in scripts/ e decide cosa scriverci; qui ci sono il browser, la misura, il font del sito e il corpo che entra.
// La caricano solo i comandi e le prove con il browser: la build non richiede Playwright.
import { chromium, type Page } from '@playwright/test';

/** Apre il modello, un file HTML di web/scripts/, nella misura delle anteprime dei post: 1200×630. */
export async function apriModello(page: Page, modello: string): Promise<void> {
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.goto(new URL(`../../scripts/${modello}`, import.meta.url).href);
}

/**
 * Se il font del sito è caricato, per i testi già scritti nel modello, al peso dato. Un file del font che manca fa fallire il caricamento;
 * un foglio che manca lascia il font senza nessun file: tutti e due vogliono npm ci.
 */
export const fontCaricato = (page: Page, peso: number): Promise<boolean> =>
  page.evaluate(async (peso) => {
    const caricati = await document.fonts.load(`${peso} 40px "Bricolage Grotesque Variable"`, document.body.textContent ?? '').catch(() => []);
    if (!caricati.length) return false;
    await document.fonts.ready;
    return true;
  }, peso);

/** I testi degli elementi che non entrano nel loro riquadro, nell'ordine della pagina. */
export const nonEntrano = (page: Page, selettore: string): Promise<string[]> =>
  page.evaluate((selettore) => [...document.querySelectorAll(selettore)]
    .filter((t) => t.scrollHeight > t.clientHeight || t.scrollWidth > t.clientWidth)
    .map((t) => t.textContent ?? ''), selettore);

/** Il corpo più grande, da `da` a `fino` pixel, a cui entrano tutti gli elementi del selettore: il modello lo legge da --corpo. Null se non entrano mai. */
export async function scegliCorpo(page: Page, selettore: string, da: number, fino: number): Promise<number | null> {
  for (let corpo = da; corpo >= fino; corpo--) {
    await page.evaluate((corpo) => document.documentElement.style.setProperty('--corpo', `${corpo}px`), corpo);
    if (!(await nonEntrano(page, selettore)).length) return corpo;
  }
  return null;
}

/** Un browser solo per tutte le foto, nel tema chiaro anche con il sistema scuro: fotografa prepara la pagina e dà il PNG in memoria, chiudi lo spegne. */
export async function apriFotografo<T>(prepara: (page: Page, x: T) => Promise<void>): Promise<{ fotografa: (x: T) => Promise<Uint8Array>; chiudi: () => Promise<void> }> {
  const browser = await chromium.launch();
  const page = await browser.newPage({ colorScheme: 'light' }).catch(async (e: unknown) => {
    await browser.close();
    throw e;
  });
  return {
    fotografa: async (x) => {
      await prepara(page, x);
      return page.screenshot();
    },
    chiudi: () => browser.close(),
  };
}
