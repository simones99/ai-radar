// L'immagine dell'anteprima di un'edizione, fotografata con Playwright. La carica solo il comando: la build la copia soltanto, e non arriva mai fin qui.
import { chromium, type Page } from '@playwright/test';
import { dayWith } from '../text/format';
import { portaConDati, type Edizione } from './tipi';

const MODELLO = new URL('../../../scripts/immagine-edizione.html', import.meta.url).href;
// il corpo delle due porte, in pixel: il più grande a cui entrano tutte e due. A 30 si legge ancora nei 400 px di un elenco di post
const PIU_GRANDE = 72;
const PIU_PICCOLO = 30;

/**
 * Riempie il modello con l'edizione e sceglie il corpo delle due porte, lo stesso per entrambe. I testi entrano come testo, mai come HTML.
 * Se non entrano, o manca il font del sito, è un errore: meglio nessuna edizione che un'immagine tagliata.
 * L'interfaccia è fotografa: questa è esportata solo per le prove che un PNG non permette, dichiarate in tests/e2e/immagine.spec.ts.
 */
export async function preparaImmagine(page: Page, e: Edizione): Promise<void> {
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.goto(MODELLO);
  const contenuto = {
    data: `Settimana ${dayWith('del', e.settimana)}`,
    // senza dati la frase è già la riga meta: non si ripete
    porte: e.porte.map((p) => ({ nome: p.nome, parti: portaConDati(p) ? p.titolo : [{ t: p.meta }], meta: portaConDati(p) ? p.meta : '', ripetuta: portaConDati(p) && !p.cambiata })),
    da: PIU_GRANDE,
    a: PIU_PICCOLO,
  };
  const entra = await page.evaluate(async ({ data, porte, da, a }) => {
    document.querySelector('h1')!.textContent = data;
    const articoli = [...document.querySelectorAll('article')];
    porte.forEach((porta, i) => {
      articoli[i].querySelector('h2')!.textContent = porta.nome;
      const riga = articoli[i].querySelector('p')!;
      for (const parte of porta.parti) {
        if (parte.em) riga.appendChild(document.createElement('em')).textContent = parte.t;
        else riga.append(parte.t);
      }
      const fondo = articoli[i].querySelector('footer')!;
      // una porta ripetuta sembrerebbe una notizia nuova, in un post accanto a quello della settimana prima
      if (porta.ripetuta) fondo.appendChild(document.createElement('strong')).textContent = 'Nessun cambio dalla settimana scorsa';
      if (porta.meta) fondo.appendChild(document.createElement('span')).textContent = porta.meta;
    });
    const caricati = await document.fonts.load('500 40px "Bricolage Grotesque Variable"', document.body.textContent ?? '');
    if (!caricati.length) throw new Error('Il font del sito non si carica: serve npm ci in web/.');
    await document.fonts.ready;
    const righe = [...document.querySelectorAll('article p')];
    for (let corpo = da; corpo >= a; corpo--) {
      document.documentElement.style.setProperty('--corpo', `${corpo}px`);
      if (righe.every((r) => r.scrollHeight <= r.clientHeight && r.scrollWidth <= r.clientWidth)) return true;
    }
    return false;
  }, contenuto);
  if (!entra) throw new Error(`Edizione ${e.settimana}: le porte non entrano nell'immagine nemmeno a ${PIU_PICCOLO} px.`);
}

/** Il PNG dell'edizione, 1200×630, in memoria: finché non è pronto sul disco non si tocca nulla. */
export async function fotografa(e: Edizione): Promise<Uint8Array> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ colorScheme: 'light' });
    await preparaImmagine(page, e);
    return await page.screenshot();
  } finally {
    await browser.close();
  }
}
