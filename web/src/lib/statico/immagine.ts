// L'immagine dell'anteprima della pagina di una competenza, fotografata con Playwright. La carica solo il comando delle anteprime: la build lascia il segnaposto.
import { chromium, type Page } from '@playwright/test';
import type { Anteprima } from './competenze';

const MODELLO = new URL('../../../scripts/immagine-competenza.html', import.meta.url).href;
// il corpo del nome, in pixel: il più grande a cui entra. A 56 un nome di quattro righe si legge ancora nei 400 px di un elenco di post
const PIU_GRANDE = 136;
const PIU_PICCOLO = 56;

/**
 * Riempie il modello con l'anteprima e sceglie il corpo del nome. I testi entrano come testo, mai come HTML.
 * Se non entrano, o manca il font del sito, è un errore: meglio il segnaposto che un'immagine tagliata.
 * L'interfaccia è apriFotografo: questa è esportata solo per le prove che un PNG non permette, in tests/e2e/anteprima-competenza.spec.ts.
 */
export async function preparaAnteprima(page: Page, a: Anteprima): Promise<void> {
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.goto(MODELLO);
  const esito = await page.evaluate(async ({ a, da, fino }) => {
    document.querySelector('header p')!.textContent = a.data;
    document.querySelector('h1')!.textContent = a.nome;
    const articoli = [...document.querySelectorAll('article')];
    a.mercati.forEach((m, i) => {
      articoli[i].querySelector('h2')!.textContent = m.nome;
      const riga = articoli[i].querySelector('p')!;
      riga.textContent = m.testo;
      if (m.tono) riga.classList.add(m.tono);
    });
    // un file del font che manca fa fallire il caricamento; un foglio che manca lascia il font senza nessun file: tutti e due vogliono npm ci
    const caricati = await document.fonts.load('600 40px "Bricolage Grotesque Variable"', document.body.textContent ?? '').catch(() => []);
    if (!caricati.length) return 'font';
    await document.fonts.ready;
    // i testi che vengono dai dati: data ed etichette dei mercati hanno una forma fissa. I quadranti hanno un corpo fisso, il nome lo cerca
    const entra = (t: Element) => t.scrollHeight <= t.clientHeight && t.scrollWidth <= t.clientWidth;
    const quadrante = [...document.querySelectorAll('article p')].find((p) => !entra(p));
    if (quadrante) return `quadrante:${quadrante.textContent}`;
    const nome = document.querySelector('h1')!;
    for (let corpo = da; corpo >= fino; corpo--) {
      document.documentElement.style.setProperty('--corpo', `${corpo}px`);
      if (entra(nome)) return 'entra';
    }
    return 'nome';
  }, { a, da: PIU_GRANDE, fino: PIU_PICCOLO });
  if (esito === 'font') throw new Error('il font del sito non si carica: serve npm ci in web/.');
  if (esito === 'nome') throw new Error(`il nome non entra nell'immagine nemmeno a ${PIU_PICCOLO} px.`);
  if (esito.startsWith('quadrante:')) throw new Error(`il quadrante «${esito.slice('quadrante:'.length)}» non entra nella sua card.`);
}

/** Un browser solo per tutte le anteprime: fotografa dà il PNG di 1200×630 in memoria, chiudi lo spegne. */
export async function apriFotografo(): Promise<{ fotografa: (a: Anteprima) => Promise<Uint8Array>; chiudi: () => Promise<void> }> {
  const browser = await chromium.launch();
  const page = await browser.newPage({ colorScheme: 'light' });
  return {
    fotografa: async (a) => {
      await preparaAnteprima(page, a);
      return page.screenshot();
    },
    chiudi: () => browser.close(),
  };
}
