// L'immagine dell'anteprima della pagina di una competenza, fotografata con Playwright. La carica solo il comando delle anteprime: la build lascia il segnaposto.
import type { Page } from '@playwright/test';
import { apriFotografo as apriIlFotografo, apriModello, fontCaricato, nonEntrano, scegliCorpo } from '../fotografia';
import type { Anteprima } from './competenze';

// il corpo del nome, in pixel: il più grande a cui entra. A 56 un nome di quattro righe si legge ancora nei 400 px di un elenco di post
const PIU_GRANDE = 136;
const PIU_PICCOLO = 56;

/**
 * Riempie il modello con l'anteprima e sceglie il corpo del nome. I testi entrano come testo, mai come HTML.
 * Se non entrano, o manca il font del sito, è un errore: meglio il segnaposto che un'immagine tagliata.
 * L'interfaccia è apriFotografo: questa è esportata solo per le prove che un PNG non permette, in tests/e2e/anteprima-competenza.spec.ts.
 */
export async function preparaAnteprima(page: Page, a: Anteprima): Promise<void> {
  await apriModello(page, 'immagine-competenza.html');
  await page.evaluate((a) => {
    document.querySelector('header p')!.textContent = a.data ?? '';
    document.querySelector('h1')!.textContent = a.nome;
    document.querySelector('footer p')!.textContent = a.fonti;
    const articoli = [...document.querySelectorAll('article')];
    a.mercati.forEach((m, i) => {
      articoli[i].querySelector('h2')!.textContent = m.nome;
      const riga = articoli[i].querySelector('p')!;
      riga.textContent = m.testo;
      if (m.tono) riga.classList.add(m.tono);
    });
  }, a);
  if (!(await fontCaricato(page, 600))) throw new Error('il font del sito non si carica: serve npm ci in web/.');
  // i testi che vengono dai dati: data ed etichette dei mercati hanno una forma fissa. I quadranti hanno un corpo fisso, il nome lo cerca
  const [quadrante] = await nonEntrano(page, 'article p');
  if (quadrante !== undefined) throw new Error(`il quadrante «${quadrante}» non entra nella sua card.`);
  if ((await nonEntrano(page, 'footer p')).length) throw new Error(`le fonti «${a.fonti}» non entrano nell'immagine.`);
  if ((await scegliCorpo(page, 'h1', PIU_GRANDE, PIU_PICCOLO)) === null) throw new Error(`il nome non entra nell'immagine nemmeno a ${PIU_PICCOLO} px.`);
}

/** Un browser solo per tutte le anteprime: fotografa dà il PNG di 1200×630 in memoria, chiudi lo spegne. */
export const apriFotografo = (): ReturnType<typeof apriIlFotografo<Anteprima>> => apriIlFotografo(preparaAnteprima);
