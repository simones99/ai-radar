// L'immagine dell'anteprima di un'edizione, dall'interfaccia del modulo: fotografa dà un PNG, e il PNG si legge a pixel, in un browser.
// I testi lunghi sono quelli che le regole di doorPerTe e doorItalia possono comporre con i nomi veri di config/skills.yaml, config/ai_act.yaml e config/rapporti.yaml.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { creaEdizione, type Edizione } from '../../src/lib/edizioni';
import { fotografa, preparaImmagine } from '../../src/lib/edizioni/immagine';
import type { Dataset } from '../../src/lib/data/types';
import { FIXTURE } from '../../src/lib/test/fixtures';

const base = creaEdizione(FIXTURE as Dataset, null) as Edizione;
const conPorte = (perTe: string, italia: string): Edizione => ({
  ...base,
  porte: [{ ...base.porte[0], titolo: [{ t: perTe }] }, { ...base.porte[1], titolo: [{ t: italia }] }],
});
const senzaDati: Edizione = { ...base, porte: [base.porte[0], { ...base.porte[1], titolo: [], meta: 'Dati non disponibili', destinazione: null }] };

const ENTRATE_E_USCITE = 'Context engineering, Data engineering e Agenti di coding entrano tra le competenze da imparare ora, di misura; Modelli locali, DB vettoriali e Sicurezza AI escono';
const TUTTE_ENTRANO = 'Context engineering, Data engineering, Agenti di coding, Modelli locali, DB vettoriali, Sicurezza AI, Multimodali, Fine-tuning, Governance, Agenti AI, AI per BI, Robotica, LLMOps, Eval, MCP e RAG entrano tra le competenze da imparare ora, di misura';
const MODELLI_EUROPEI = '12 dei 30 modelli di grande scala del 2026 sono europei (40%), finora';
const RAPPORTO = 'A settembre esce State of Generative AI in the Enterprise';
const SCADENZA = 'Tra 30 giorni: alto rischio nei prodotti regolati (allegato I)';

const CASI = [
  ['le entrate e uscite accanto ai modelli europei', conPorte(ENTRATE_E_USCITE, MODELLI_EUROPEI), 38],
  ['le entrate e uscite accanto a un rapporto', conPorte(ENTRATE_E_USCITE, RAPPORTO), 38],
  ['le entrate e uscite accanto a una scadenza', conPorte(ENTRATE_E_USCITE, SCADENZA), 38],
  ['tutte le competenze che entrano insieme', conPorte(TUTTE_ENTRANO, MODELLI_EUROPEI), 30],
  ['le frasi più corte', conPorte('RAG esce da Impara ora', 'Tra 3 giorni: divieti'), 56],
] as const;

const FOGLIO = readFileSync(fileURLToPath(new URL('../../src/app.css', import.meta.url)), 'utf-8');

/** I colori del tema chiaro, dai token di app.css: una sola fonte, anche qui. */
const coloriDelSito = async (page: Page) => {
  await page.setContent(`<!doctype html><html data-theme="light"><head><style>${FOGLIO}</style></head><body></body></html>`);
  return page.evaluate(() => {
    const colore = (token: string) => {
      const prova = document.body.appendChild(document.createElement('i'));
      prova.style.color = `var(${token})`;
      return getComputedStyle(prova).color;
    };
    return { fondo: colore('--bg'), card: colore('--card'), testo: colore('--fg'), evidenza: colore('--accent') };
  });
};

const BORDO = 24; // dentro la card: oltre gli angoli arrotondati, e prima del testo

/** Il PNG letto a pixel: misure, colore del fondo e, per ogni card, dov'è, dove sta il testo e di che colore. */
const leggiPng = (page: Page, png: Uint8Array, colori: Awaited<ReturnType<typeof coloriDelSito>>) =>
  page.evaluate(async ({ base64, colori, bordo }) => {
    const img = new Image();
    img.src = `data:image/png;base64,${base64}`;
    await img.decode();
    const tela = document.createElement('canvas');
    tela.width = img.naturalWidth;
    tela.height = img.naturalHeight;
    const g = tela.getContext('2d', { willReadFrequently: true })!;
    g.drawImage(img, 0, 0);
    const { data, width, height } = g.getImageData(0, 0, tela.width, tela.height);
    const colore = (x: number, y: number) => {
      const i = (y * width + x) * 4;
      return `rgb(${data[i]}, ${data[i + 1]}, ${data[i + 2]})`;
    };
    /** I tratti lunghi del colore delle card su una riga: su una riga senza testo, uno per card. */
    const tratti = (y: number) => {
      const fuori: [number, number][] = [];
      let da = -1;
      for (let x = 0; x <= width; x++) {
        const dentro = x < width && colore(x, y) === colori.card;
        if (dentro && da < 0) da = x;
        if (!dentro && da >= 0) {
          if (x - da >= 300) fuori.push([da, x - 1]);
          da = -1;
        }
      }
      return fuori;
    };
    // dal fondo dell'immagine: la prima riga con due tratti è il fondo delle card, ancora dentro gli angoli arrotondati
    let fondoCard = height - 1;
    while (fondoCard > 0 && tratti(fondoCard).length < 2) fondoCard--;
    const card = tratti(fondoCard - bordo).map(([sinistra, destra]) => {
      // lungo una colonna oltre l'angolo e prima del testo
      let cima = fondoCard - bordo;
      while (cima > 0 && colore(sinistra + bordo, cima - 1) === colori.card) cima--;
      let fondo = fondoCard - bordo;
      while (fondo < height - 1 && colore(sinistra + bordo, fondo + 1) === colori.card) fondo++;
      let testo = 0;
      let testoSulBordo = 0;
      const presenti = new Set<string>();
      for (let y = cima; y <= fondo; y++) {
        for (let x = sinistra; x <= destra; x++) {
          if (colore(x, y) === colori.card) continue;
          presenti.add(colore(x, y));
          const vicinoX = x < sinistra + bordo || x > destra - bordo;
          const vicinoY = y < cima + bordo || y > fondo - bordo;
          if (vicinoX && vicinoY) continue; // l'angolo arrotondato
          if (vicinoX || vicinoY) testoSulBordo++;
          else testo++;
        }
      }
      return { larghezza: destra - sinistra + 1, altezza: fondo - cima + 1, destra, fondo, testo, testoSulBordo, haTesto: presenti.has(colori.testo), haEvidenza: presenti.has(colori.evidenza) };
    });
    return { misure: [width, height], angolo: colore(0, 0), card };
  }, { base64: Buffer.from(png).toString('base64'), colori, bordo: BORDO });

test.describe('il PNG', () => {
  for (const [nome, e] of CASI) {
    test(`misura 1200×630, le due card sono uguali e il testo resta dentro, con ${nome}`, async ({ page }) => {
      const colori = await coloriDelSito(page);
      const { misure, card } = await leggiPng(page, await fotografa(e), colori);
      expect(misure).toEqual([1200, 630]);
      expect(card).toHaveLength(2);
      const [a, b] = card;
      // le due teste alla pari: stessa scatola, anche quando una delle due frasi è molto più lunga dell'altra
      expect(a.larghezza).toBe(b.larghezza);
      expect(a.altezza).toBe(b.altezza);
      for (const c of card) {
        expect(c.destra).toBeLessThan(1200);
        expect(c.fondo).toBeLessThan(630);
        expect(c.testo).toBeGreaterThan(0);
        expect(c.testoSulBordo).toBe(0);
      }
    });
  }

  test('testi che non entrano nemmeno al corpo più piccolo sono un errore, non un’immagine tagliata', async () => {
    await expect(fotografa(conPorte('Parole '.repeat(400), MODELLI_EUROPEI))).rejects.toThrow(/2026-10-12.*non entrano/);
  });

  test('ha i colori del sito, nel tema chiaro: fondo, card, testo e parti in evidenza', async ({ page }) => {
    const colori = await coloriDelSito(page);
    const png = await leggiPng(page, await fotografa(base), colori);
    expect(png.angolo).toBe(colori.fondo);
    expect(png.card.map((c) => [c.haTesto, c.haEvidenza])).toEqual([[true, true], [true, true]]);
  });

  test('una porta senza dati ha comunque il suo testo, nella sua card', async ({ page }) => {
    const colori = await coloriDelSito(page);
    const { card } = await leggiPng(page, await fotografa(senzaDati), colori);
    expect(card.map((c) => c.testo > 0)).toEqual([true, true]);
  });
});

// L'eccezione: da un PNG non si leggono le parole, il font, il corpo, né cosa ha chiesto la pagina per farlo.
// Queste prove guardano quindi la pagina che fotografa fotografa, dopo preparaImmagine, e dipendono da come è fatta.
test.describe('la pagina fotografata, per ciò che il PNG non dice', () => {
  /** La scatola del testo di ogni porta e della card che la contiene, misurate sui caratteri: un elemento può stare nella pagina anche se il suo testo ne esce. */
  const misure = (page: Page) => page.getByRole('article').evaluateAll((porte) => porte.map((porta) => {
    const testo = document.createRange();
    testo.selectNodeContents(porta);
    const { left, right, top, bottom } = testo.getBoundingClientRect();
    const card = porta.getBoundingClientRect();
    const stile = getComputedStyle(porta.querySelector('p')!);
    return { testo: { left, right, top, bottom }, card: { left: card.left, right: card.right, top: card.top, bottom: card.bottom }, corpo: stile.fontSize, peso: stile.fontWeight };
  }));

  for (const [nome, e, minimo] of CASI) {
    test(`il testo è dentro la card a caratteri grandi, con lo stesso corpo e peso nelle due porte, con ${nome}`, async ({ page }) => {
      await preparaImmagine(page, e);
      const [a, b] = await misure(page);
      for (const { testo, card } of [a, b]) {
        expect(testo.left).toBeGreaterThanOrEqual(card.left);
        expect(testo.right).toBeLessThanOrEqual(card.right);
        expect(testo.top).toBeGreaterThanOrEqual(card.top);
        expect(testo.bottom).toBeLessThanOrEqual(card.bottom);
      }
      expect(a.corpo).toBe(b.corpo);
      expect(a.peso).toBe(b.peso);
      expect(parseFloat(a.corpo)).toBeGreaterThanOrEqual(minimo);
    });
  }

  test('ha la data, le due porte, Per te per prima, e le parti in evidenza', async ({ page }) => {
    await preparaImmagine(page, base);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settimana del 12 ott 2026');
    await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Per te', 'Per la tua organizzazione']);
    await expect(page.getByRole('article').getByRole('paragraph')).toHaveText(['MCP entra tra le competenze da imparare ora; RAG esce', "16% delle imprese italiane usa l'AI (UE: 20%)"]);
    await expect(page.getByRole('article').getByRole('emphasis').first()).toHaveText('MCP');
  });

  test('sotto la frase c’è la riga meta di ogni porta: chi vede solo l’immagine sa da dove viene la notizia', async ({ page }) => {
    await preparaImmagine(page, base);
    await expect(page.getByRole('article').nth(0)).toContainText('Radar delle competenze · dati al 15 ott 2026');
    await expect(page.getByRole('article').nth(1)).toContainText(base.porte[1].meta);
  });

  test('una porta ripetuta dice «Nessun cambio dalla settimana scorsa», e una nuova no', async ({ page }) => {
    await preparaImmagine(page, { ...base, porte: [{ ...base.porte[0], cambiata: false }, base.porte[1]] });
    await expect(page.getByRole('article').nth(0)).toContainText('Nessun cambio dalla settimana scorsa');
    await expect(page.getByRole('article').nth(1)).not.toContainText('Nessun cambio');
    const [a, b] = await misure(page);
    expect(a.corpo).toBe(b.corpo); // le due teste restano alla pari anche se una delle due ha una riga in più
  });

  test('una porta senza dati non ripete «Dati non disponibili» nella riga meta', async ({ page }) => {
    await preparaImmagine(page, senzaDati);
    expect(await page.getByRole('article').nth(1).textContent()).toBe('Per la tua organizzazioneDati non disponibili');
  });

  test('usa il font del sito, e resta nel tema chiaro anche con il sistema scuro', async ({ page }) => {
    const colori = await coloriDelSito(page);
    await page.emulateMedia({ colorScheme: 'dark' });
    await preparaImmagine(page, base);
    await expect(page.locator('body')).toHaveCSS('font-family', /Bricolage Grotesque Variable/);
    expect(await page.evaluate(() => document.fonts.check('500 40px "Bricolage Grotesque Variable"') && [...document.fonts].some((f) => f.status === 'loaded'))).toBe(true);
    await expect(page.locator('body')).toHaveCSS('background-color', colori.fondo);
  });

  test('non usa foto né altro che venga da fuori: solo i file del progetto', async ({ page }) => {
    const richieste: string[] = [];
    page.on('request', (r) => richieste.push(r.url()));
    await preparaImmagine(page, base);
    await expect(page.locator('img, picture, svg image')).toHaveCount(0);
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundImage)).toBe('none');
    expect(richieste.length).toBeGreaterThan(0);
    expect(richieste.filter((u) => !u.startsWith('file:'))).toEqual([]);
  });

  test('una porta senza dati lo dice, alla stessa misura dell’altra', async ({ page }) => {
    await preparaImmagine(page, senzaDati);
    await expect(page.getByRole('article').getByRole('paragraph').nth(1)).toHaveText('Dati non disponibili');
    const [a, b] = await misure(page);
    expect(a.corpo).toBe(b.corpo);
  });

  test('un titolo con dei segni di HTML resta testo', async ({ page }) => {
    await preparaImmagine(page, conPorte('<script>window.rotta = 1</script> & <b>altro</b>', MODELLI_EUROPEI));
    await expect(page.getByRole('article').getByRole('paragraph').first()).toHaveText('<script>window.rotta = 1</script> & <b>altro</b>');
    await expect(page.locator('article script, article b')).toHaveCount(0);
  });
});
