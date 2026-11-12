// L'immagine dell'anteprima di una competenza: il PNG dal fotografo, e la pagina fotografata per ciò che un PNG non dice.
// I nomi lunghi sono quello più lungo del FIXTURE, quelli veri di config/skills.yaml arrivano a 30 caratteri, e uno inventato ben più lungo.
import { expect, test, type Page } from '@playwright/test';
import type { Dataset, Radar } from '../../src/lib/data/types';
import { anteprimeDelleCompetenze, type Anteprima } from '../../src/lib/statico/competenze';
import { apriFotografo, preparaAnteprima } from '../../src/lib/statico/immagine';
import { FIXTURE } from '../../src/lib/test/fixtures';

const RADAR = (FIXTURE as Dataset).radar as Radar;
const anteprima = (id: string): Anteprima => anteprimeDelleCompetenze(RADAR).find((x) => x.anteprima.id === id)!.anteprima;
const conNome = (nome: string): Anteprima => ({ ...anteprima('mcp'), nome });
const PIU_LUNGO_DEL_FIXTURE = anteprimeDelleCompetenze(RADAR).map((x) => x.anteprima).sort((a, b) => b.nome.length - a.nome.length)[0];
const INVENTATO = 'Sviluppo, valutazione e messa in produzione di agenti AI con protocolli aperti';
const senzaDati: Anteprima = { ...anteprima('mcp'), mercati: [{ nome: 'Tutti i Paesi', testo: 'Dati non disponibili', tono: 'manca' }, { nome: 'Italia', testo: 'Dati non disponibili', tono: 'manca' }] };

const CASI = [
  ['il nome più lungo del FIXTURE', PIU_LUNGO_DEL_FIXTURE, 96],
  ['il nome vero più lungo', conNome('Valutazione dei modelli (eval)'), 96],
  ['un nome inventato molto più lungo', conNome(INVENTATO), 56],
  ['un nome corto', anteprima('rag'), 96],
  ['i dati che mancano in tutti e due i mercati', senzaDati, 96],
] as const;

/** Il colore di un token di app.css, nella pagina fotografata. */
const token = (page: Page, nome: string) => page.evaluate((nome) => {
  const prova = document.body.appendChild(document.createElement('i'));
  prova.style.color = `var(${nome})`;
  const colore = getComputedStyle(prova).color;
  prova.remove();
  return colore;
}, nome);

/** Larghezza e altezza di un PNG, dalla sua intestazione. */
const misurePng = (png: Uint8Array) => {
  const b = Buffer.from(png);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};

test.describe('il PNG', () => {
  test('misura 1200×630, per ogni anteprima, con un browser solo', async () => {
    const fotografo = await apriFotografo();
    try {
      for (const [, a] of CASI) expect(misurePng(await fotografo.fotografa(a))).toEqual([1200, 630]);
    } finally {
      await fotografo.chiudi();
    }
  });

  test('un nome che non entra nemmeno al corpo più piccolo è un errore, non un’immagine tagliata', async () => {
    const fotografo = await apriFotografo();
    try {
      await expect(fotografo.fotografa(conNome('Parole '.repeat(400)))).rejects.toThrow(/non entra/);
    } finally {
      await fotografo.chiudi();
    }
  });
});

// L'eccezione: da un PNG non si leggono le parole, il font, il corpo, né cosa ha chiesto la pagina per farlo.
// Queste prove guardano quindi la pagina che fotografa il fotografo, dopo preparaAnteprima, e dipendono da come è fatta.
test.describe('la pagina fotografata, per ciò che il PNG non dice', () => {
  /**
   * Ogni testo misurato sui suoi caratteri, con la scatola in cui deve stare: la sua card, o i margini dell'immagine. Un elemento può stare nella pagina
   * anche se il suo testo ne esce. Il nome, in più, finisce prima delle card.
   */
  const misure = (page: Page) => page.locator('h1, header p, article h2, article p').evaluateAll((testi) => {
    const margine = 40;
    const card = document.querySelector('main')!.getBoundingClientRect();
    return testi.map((t) => {
      const r = document.createRange();
      r.selectNodeContents(t);
      const caratteri = r.getBoundingClientRect();
      const scatola = t.closest('article')?.getBoundingClientRect() ?? { left: margine, right: 1200 - margine, top: margine, bottom: 630 - margine };
      return {
        testo: t.textContent,
        dentro: caratteri.left >= scatola.left && caratteri.right <= scatola.right && caratteri.top >= scatola.top && caratteri.bottom <= scatola.bottom,
        sopraLeCard: t.tagName !== 'H1' || caratteri.bottom <= card.top,
      };
    });
  });

  for (const [nome, a, minimo] of CASI) {
    test(`ogni testo sta nella sua scatola, e il nome è a caratteri grandi, con ${nome}`, async ({ page }) => {
      await preparaAnteprima(page, a);
      for (const m of await misure(page)) expect(m).toEqual({ testo: m.testo, dentro: true, sopraLeCard: true });
      expect(parseFloat(await page.locator('h1').evaluate((h) => getComputedStyle(h).fontSize))).toBeGreaterThanOrEqual(minimo);
    });
  }

  test('ha il marchio, la data dei dati, il nome e il quadrante nei due mercati, e nessuna cifra oltre la data', async ({ page }) => {
    await preparaAnteprima(page, anteprima('mcp'));
    await expect(page.getByText('AI Radar', { exact: true })).toBeVisible();
    await expect(page.getByText('Dati del 15 ott 2026', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Model Context Protocol (MCP)');
    await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Tutti i Paesi', 'Italia']);
    await expect(page.getByRole('article').getByRole('paragraph')).toHaveText(['Impara ora', 'Da provare']);
    expect((await page.locator('body').textContent())!.replace('15 ott 2026', '')).not.toMatch(/\d/);
  });

  test('Impara ora è in evidenza, come sul radar dell’app; gli altri quadranti e il dato che manca no', async ({ page }) => {
    await preparaAnteprima(page, anteprima('mcp'));
    const colore = (i: number) => page.getByRole('article').getByRole('paragraph').nth(i).evaluate((p) => getComputedStyle(p).color);
    const accento = await token(page, '--accent');
    expect(await colore(0)).toBe(accento);
    expect(await colore(1)).not.toBe(accento);
    await preparaAnteprima(page, senzaDati);
    expect(await colore(0)).not.toBe(accento);
  });

  test('un dato che manca lo dice con le parole dell’app', async ({ page }) => {
    await preparaAnteprima(page, senzaDati);
    await expect(page.getByRole('article').getByRole('paragraph')).toHaveText(['Dati non disponibili', 'Dati non disponibili']);
  });

  test('un nome con dei segni di HTML resta testo', async ({ page }) => {
    await preparaAnteprima(page, conNome('<b>MCP</b> & <script>window.rotta = 1</script>'));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('<b>MCP</b> & <script>window.rotta = 1</script>');
    await expect(page.locator('h1 b, h1 script')).toHaveCount(0);
  });

  test('usa il font del sito, e resta nel tema chiaro anche con il sistema scuro', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await preparaAnteprima(page, anteprima('mcp'));
    await expect(page.locator('body')).toHaveCSS('font-family', /Bricolage Grotesque Variable/);
    expect(await page.evaluate(() => [...document.fonts].some((f) => f.status === 'loaded'))).toBe(true);
    // il fondo del tema chiaro, dai token di app.css: la pagina è la stessa, letta con il tema forzato
    const fondoChiaro = await page.evaluate(() => {
      document.documentElement.dataset.theme = 'light';
      return getComputedStyle(document.body).backgroundColor;
    });
    await expect(page.locator('body')).toHaveCSS('background-color', fondoChiaro);
  });

  test('se il font del sito non si carica è un errore che dice cosa fare', async ({ page }) => {
    await page.addInitScript(() => {
      document.fonts.load = () => Promise.reject(new DOMException('Il file del font non c’è', 'NetworkError'));
    });
    await expect(preparaAnteprima(page, anteprima('mcp'))).rejects.toThrow('il font del sito non si carica: serve npm ci in web/.');
  });

  test('non usa foto né altro che venga da fuori: solo i file del progetto', async ({ page }) => {
    const richieste: string[] = [];
    page.on('request', (r) => richieste.push(r.url()));
    await preparaAnteprima(page, anteprima('mcp'));
    await expect(page.locator('img, picture, svg image')).toHaveCount(0);
    expect(richieste.length).toBeGreaterThan(0);
    expect(richieste.filter((u) => !u.startsWith('file:'))).toEqual([]);
  });
});
