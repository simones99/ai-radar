import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { TEMI } from '../../src/lib/router';
import { FIXTURE } from '../../src/lib/test/fixtures';

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-15T10:00:00'));
  await page.route('**/data/*.json', async (route) => {
    const name = new URL(route.request().url()).pathname.split('/').pop()!.replace('.json', '');
    const body = (FIXTURE as Record<string, unknown>)[name];
    if (body === undefined) return route.fulfill({ status: 404, body: '' });
    return route.fulfill({ json: body });
  });
});

const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
// attende la fine dello scorrimento morbido: scrollY fermo per 300 ms
const scrollSettled = (page: Page) =>
  expect.poll(async () => {
    const a = await page.evaluate(() => window.scrollY);
    await page.waitForTimeout(300);
    return a === (await page.evaluate(() => window.scrollY));
  }).toBe(true);
// Le violazioni gravi di axe, in tutta la pagina o solo nelle parti dei selettori.
// cast: @axe-core/playwright usa playwright-core 1.64, @playwright/test 1.63: tipi Page nominalmente diversi
const seriousViolations = async (page: Page, ...parti: string[]) =>
  (await parti.reduce((axe, p) => axe.include(p), new AxeBuilder({ page: page as never })).analyze()).violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

test('home: due porte, due sezioni, 9 temi', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText("Su cosa formarti e cosa succede all'AI in Italia");
  await expect(page.getByRole('link', { name: /MCP entra tra le competenze/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /16% delle imprese italiane usa l'AI/ })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Su cosa formarti' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: "L'AI in Italia" })).toBeVisible();
  await expect(page.locator('button.face')).toHaveCount(9);
});

test('home: il contenuto sta nel main, e una card si chiama con la sua cifra, con la frase come descrizione', async ({ page }) => {
  await page.goto('/');
  const card = page.getByRole('main').getByRole('button', { name: 'GeopoliticAI: 18,8 punti sotto gli USA', exact: true });
  await expect(card).toHaveAccessibleDescription(/^Capacità del miglior modello europeo/);
});

test('1920px: note, metodo e crediti restano nella misura di una riga di testo, circa 75 caratteri', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/#competenze');
  for (const testo of [/^Le linee sono soglie fisse/, /^Quadranti a soglie fisse/, /Le notizie mostrano solo titolo/]) {
    const em = await page.getByText(testo).evaluate((el) => el.getBoundingClientRect().width / parseFloat(getComputedStyle(el).fontSize));
    expect(em).toBeLessThanOrEqual(34.01);
  }
});

test('la settimana in testa è quella dei dati, non dell’orologio di chi legge: dal suo lunedì, con l’articolo eliso', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-05T10:00:00'));
  await page.route('**/data/status.json', (route) => route.fulfill({ json: { ...(FIXTURE.status as object), aggiornato: '2026-06-10T08:00:00+00:00' } })); // un mercoledì
  await page.goto('/');
  await expect(page.getByText('Settimana dell’8 giu 2026')).toBeVisible();
});

test('senza lo stato delle fonti la riga della settimana non c’è', async ({ page }) => {
  await page.route('**/data/status.json', (route) => route.fulfill({ status: 404, body: '' }));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText(/^Settimana /)).toHaveCount(0);
});

test('un file di dati bloccato: l’avviso e lo stato delle fonti lo dicono, e Riprova lo richiede', async ({ page }) => {
  let bloccato = true;
  await page.route('**/data/radar.json', (route) => (bloccato ? route.fulfill({ status: 500, body: '' }) : route.fulfill({ json: FIXTURE.radar })));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Una parte dei dati non è arrivata');
  const stato = page.getByRole('region', { name: 'Stato delle fonti' });
  await expect(stato).toContainText('Radar (calcolo)');
  await expect(stato).not.toContainText('sono aggiornate');
  expect(await noHorizontalScroll(page)).toBe(true);
  bloccato = false;
  await page.getByRole('alert').getByRole('button', { name: 'Riprova' }).click();
  await expect(page.getByRole('link', { name: /MCP entra/ })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('la prova prima delle parole: la legenda sta sotto il radar', async ({ page }) => {
  await page.goto('/#competenze');
  await scrollSettled(page);
  const radar = (await page.getByRole('group', { name: /Radar delle competenze/ }).boundingBox())!;
  const legenda = (await page.getByText(/^Le linee sono soglie fisse/).boundingBox())!;
  expect(legenda.y).toBeGreaterThanOrEqual(radar.y + radar.height);
});

for (const [w, h] of [[1280, 800], [320, 640]]) {
  test(`Norme a ${w}px: si apre sulla prossima scadenza`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/');
    await page.locator('#tile-norme .face').click();
    await expect(page.locator('#detail-norme .tl li.next')).toBeFocused();
    await scrollSettled(page);
    await expect(page.locator('#detail-norme .tl li.next')).toBeInViewport();
    // da tastiera si prosegue da lì: il primo Tab non riporta in cima alla pagina
    await page.keyboard.press('Tab');
    await expect(page.locator('#detail-norme .tl li.next a')).toBeFocused();
    await scrollSettled(page);
    await expect(page.locator('#detail-norme .tl li.next')).toBeInViewport();
  });
}

test('Norme a 1280px: le notizie di policy restano a vista accanto alla scadenza', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/#norme');
  await scrollSettled(page);
  await expect(page.locator('#detail-norme .tl li.next')).toBeInViewport();
  await expect(page.getByRole('region', { name: 'Notizie di policy' })).toBeInViewport();
});

test('Norme da una porta: si apre sulla scadenza del link', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-20T10:00:00'));
  await page.goto('/');
  await page.getByRole('link', { name: /Per la tua organizzazione/ }).getByText('Tra 12 giorni').click();
  await scrollSettled(page);
  await expect(page.locator('#detail-norme .tl li[aria-current="true"]')).toBeInViewport();
});

test('radar a 320px, con le posizioni di un radar vero: chi ha cambiato quadrante ha il suo nome, anche fuori da Impara ora', async ({ page }) => {
  // id, nome, slancio e il suo valore di un mese fa, annunci e il loro valore di un mese fa, quadrante, calcolato, di un mese fa, incerto
  const righe = [
    ["agenti", "Agenti AI", 0.4257, 0.4658, 30.787, null, "impara-ora", "impara-ora", "impara-ora", false],
    ["coding-agenti", "Agenti di coding", 0.8743, 1.6903, 1.913, null, "prova", "prova", "prova", false],
    ["mcp", "MCP", 0.3022, 0.1221, 4.678, null, "impara-ora", "impara-ora", "impara-ora", false],
    ["rag", "RAG", -0.3412, 0.1491, 9.545, null, "impara-ora", "consolida", "impara-ora", true],
    ["valutazione", "Eval", 0.5339, 1.253, 1.269, null, "prova", "prova", "prova", false],
    ["post-training", "Fine-tuning", 0.1356, 0.0801, 0.323, null, "prova", "prova", "osserva", false],
    ["context-engineering", "Context engineering", -0.265, -0.0519, 14.342, null, "consolida", "consolida", "impara-ora", false],
    ["sicurezza", "Sicurezza AI", 0.0346, 0.1244, 0.467, null, "prova", "prova", "prova", false],
    ["governance", "Governance", -0.2422, -0.1061, 3.211, null, "consolida", "consolida", "impara-ora", true],
    ["dati-per-ai", "Data engineering", 0.0958, -0.047, 3.268, null, "consolida", "impara-ora", "consolida", false],
    ["text-to-sql", "AI per BI", 1.1455, 1.1254, 0.127, null, "prova", "prova", "prova", true],
    ["vector-db", "DB vettoriali", -0.4834, -0.2222, 5.337, null, "consolida", "consolida", "consolida", true],
    ["multimodale", "Multimodali", 0.0946, 0.0255, 8.866, null, "impara-ora", "impara-ora", "consolida", false],
    ["llmops", "LLMOps", 0.2381, 0.5952, 17.719, null, "impara-ora", "impara-ora", "impara-ora", true],
    ["modelli-locali", "Modelli locali", 0.184, 0.2605, 0.179, null, "prova", "prova", "prova", false],
    ["robotica", "Robotica", 1.1953, 0.55, 0.232, null, "prova", "prova", "prova", true]
  ] as const;
  const base = FIXTURE.radar!.competenze[0];
  const competenze = righe.map(([id, breve, slancio, slancio_prec, domanda, domanda_prec, quadrante, quadrante_calcolato, quadrante_prec, incerto]) =>
    ({ ...base, id, nome: breve, breve, slancio, slancio_prec, domanda, domanda_prec, quadrante, quadrante_calcolato, quadrante_prec, incerto }));
  await page.route('**/data/radar.json', (route) => route.fulfill({ json: { ...FIXTURE.radar, competenze } }));
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/#competenze');
  const radar = page.getByRole('group', { name: /^Radar delle competenze/ });
  for (const nome of ["Fine-tuning", "Context engineering", "Governance", "Multimodali"]) await expect(radar.getByText(nome, { exact: true })).toBeVisible();
});

test('sul telefono la foto viene dopo il primo blocco; da 720px sta accanto al titolo', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/#modelli');
  await scrollSettled(page);
  // tutto nello stesso istante: tra due misure separate la pagina può ancora scorrere
  const misure = () => page.evaluate(() => {
    const box = (e: Element) => { const r = e.getBoundingClientRect(); return { y: r.y, bottom: r.bottom }; };
    const [su, giu] = [...document.querySelectorAll('#detail-modelli section.blk')].map(box);
    return { su, giu, foto: box(document.querySelector('#detail-modelli figure')!), titolo: box(document.querySelector('#h-modelli')!) };
  });
  const telefono = await misure();
  expect(telefono.su.y).toBeGreaterThan(telefono.titolo.y);
  expect(telefono.foto.y).toBeGreaterThanOrEqual(telefono.su.bottom);
  expect(telefono.foto.bottom).toBeLessThanOrEqual(telefono.giu.y);
  expect(await noHorizontalScroll(page)).toBe(true);
  await page.setViewportSize({ width: 800, height: 640 });
  await scrollSettled(page);
  const largo = await misure();
  expect(largo.foto.y).toBeLessThan(largo.su.y);
});

test('mappa a 1280px: il fumetto si legge tutto e non copre il tabellone', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/#geopoliticai?vista=quote');
  await page.getByRole('region', { name: "Chi controlla la catena dell'AI" }).getByRole('combobox', { name: 'Un Paese' }).selectOption('CHN');
  await page.getByRole('region', { name: "Chi controlla la catena dell'AI" }).getByRole('button', { name: 'Apri' }).click();
  await expect(page.getByRole('dialog', { name: 'Cina' })).toBeVisible();
  await scrollSettled(page);
  const dialogo = page.getByRole('dialog', { name: 'Cina' });
  const fumetto = (await dialogo.boundingBox())!;
  expect(await dialogo.evaluate((el) => el.scrollHeight <= el.clientHeight)).toBe(true);
  const menu = (await page.getByRole('combobox', { name: 'Un Paese' }).boundingBox())!;
  expect(fumetto.y + fumetto.height).toBeLessThanOrEqual(menu.y);
  await expect(page.getByRole('combobox', { name: 'Un Paese' })).toHaveValue('CHN');
  // la posizione del riquadro dell'Europa non dipende dall'altezza del fumetto
  const riquadro = (await page.getByRole('group', { name: 'Europa, ingrandita' }).boundingBox())!;
  const mondo = (await page.getByRole('group', { name: /^Mappa del mondo/ }).boundingBox())!;
  expect(riquadro.y + riquadro.height).toBeLessThanOrEqual(mondo.y + mondo.height);
  await dialogo.getByRole('button', { name: 'Chiudi' }).click();
  await expect(page.getByRole('combobox', { name: 'Un Paese' })).toHaveValue('');
});

test('porta Per te: chi entra e chi esce insieme: apre il radar, dove si vedono tutti e due', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /MCP entra tra le competenze.*RAG esce/ }).click();
  await expect(page).toHaveURL(/#competenze$/);
  await expect(page.getByRole('heading', { level: 2, name: 'MCP entra tra le competenze da imparare ora' })).toBeVisible();
  await expect(page.getByText(/^RAG esce da Impara ora\./)).toBeVisible();
  const radar = page.getByRole('group', { name: /Radar delle competenze/ });
  await expect(radar.getByRole('link', { name: /^Model Context Protocol \(MCP\): Impara ora/ })).toBeAttached();
  await expect(radar.getByRole('link', { name: /^RAG e ricerca semantica: Da consolidare/ })).toBeAttached();
});

// nella fixture MCP entra e RAG esce: qui RAG era già fuori, e la notizia è di una competenza sola
const soloMcpEntra = (page: Page) => page.route('**/data/radar.json', (route) => route.fulfill({
  json: { ...FIXTURE.radar!, competenze: FIXTURE.radar!.competenze.map((c) => (c.id === 'rag' ? { ...c, quadrante_prec: 'consolida' } : c)) },
}));

test('porta Per te: solo chi entra: apre Competenze sulla competenza della notizia', async ({ page }) => {
  await soloMcpEntra(page);
  await page.goto('/');
  await page.getByRole('link', { name: /MCP entra tra le competenze/ }).click();
  await expect(page.locator('#detail-competenze')).toBeVisible();
  await expect(page).toHaveURL(/#competenze\/mcp$/);
  await expect(page.locator('#h-competenze')).toHaveText('Model Context Protocol (MCP)');
  await expect(page.getByText(/^Impara ora, un mese fa Da consolidare\./)).toBeVisible();
});

test('porta L’AI in Italia: il dato italiano apre Business', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Per la tua organizzazione/ }).getByText('16% delle imprese italiane').click();
  await expect(page.locator('#detail-business')).toBeVisible();
  await expect(page).toHaveURL(/#business$/);
});

test('porta L’AI in Italia: una scadenza entro 30 giorni viene prima del dato italiano', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-20T10:00:00'));
  await page.goto('/');
  await page.getByRole('link', { name: /Per la tua organizzazione/ }).getByText('Tra 12 giorni').click();
  await expect(page.locator('#detail-norme')).toBeVisible();
  await expect(page).toHaveURL(/#norme\/2026-12-02$/);
});

test('porta L’AI in Italia: senza un dato italiano dice la quota dell’UE e apre GeopoliticAI sull’UE', async ({ page }) => {
  await page.route(/data\/(eurostat|owid)\.json$/, (route) => route.fulfill({ status: 404, body: '' }));
  await page.goto('/');
  await page.getByRole('link', { name: /Per la tua organizzazione/ }).getByText('Nessuno dei 35').click();
  await expect(page.locator('#detail-geopoliticai')).toBeVisible();
  await expect(page).toHaveURL(/#geopoliticai\/chi-addestra\?area=ue$/);
  // si arriva sul blocco della notizia, e il numero della porta è lì
  const blocco = page.getByRole('region', { name: 'Chi addestra i modelli di grande scala' });
  await expect(blocco).toBeFocused();
  await scrollSettled(page);
  await expect(blocco).toBeInViewport();
  await expect(blocco).toContainText('nessuno dei 35');
});

test('una voce grande per testa: la card Competenze ha figura e frase, GeopoliticAI tiene la cifra alla misura delle altre', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const competenze = page.getByRole('button', { name: 'Competenze: 2 su 5', exact: true });
  await expect(competenze).toContainText('2 competenze su 5 da imparare ora');
  await expect(competenze.getByText('su 5', { exact: true })).toHaveCount(0);
  const corpo = (nome: RegExp) => page.getByRole('button', { name: nome }).getByText(/^(18,8|×\d)/).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(await corpo(/^GeopoliticAI/)).toBe(await corpo(/^Modelli e ricerca/));
});

test('elenco accanto a una card aperta: a 800px di altezza ci stanno tutte le card, senza scorrere', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/#business');
  await expect(page.locator('#tile-rapporti .face')).toBeVisible();
  expect(await page.locator('.has-open .groups').evaluate((el) => el.scrollHeight <= el.clientHeight)).toBe(true);
});

test('elenco accanto a una card aperta: Competenze dice la sua cifra', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/#business');
  await expect(page.getByRole('button', { name: 'Competenze: 2 su 5', exact: true })).toContainText('su 5');
});

test('porta: Esc chiude come per le card, avanti la riapre, indietro la richiude', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /MCP entra tra le competenze/ }).click();
  await expect(page.locator('#detail-competenze')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('section.detail')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  await page.goForward();
  await expect(page.locator('#detail-competenze')).toBeVisible();
  await expect(page).toHaveURL(/#competenze$/);
  await page.goBack();
  await expect(page.locator('section.detail')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});

test('porta: Esc e Indietro tornano alla porta, non alla card', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-20T10:00:00'));
  await page.goto('/');
  const porta = page.getByRole('link', { name: /Per la tua organizzazione/ });
  await porta.click();
  await expect(page.locator('#detail-norme')).toBeVisible();
  await scrollSettled(page);
  await page.keyboard.press('Escape');
  await expect(porta).toBeFocused();
  await scrollSettled(page);
  await expect(porta).toBeInViewport();
  await porta.click();
  await expect(page.locator('#detail-norme')).toBeVisible();
  await scrollSettled(page);
  await page.goBack();
  await expect(porta).toBeFocused();
  await scrollSettled(page);
  await expect(porta).toBeInViewport();
  // aperta dalla card, si torna alla card
  await page.locator('#tile-norme .face').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#tile-norme .face')).toBeFocused();
});

test('porta con una card aperta: come una pillola, un solo indietro torna alla home', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 800 }); // da 1200px, con una card aperta, le porte non ci sono
  await page.goto('/');
  await page.locator('#tile-business .face').click();
  await expect(page.locator('#detail-business')).toBeVisible();
  await page.getByRole('link', { name: /MCP entra tra le competenze/ }).click();
  await expect(page.locator('#detail-competenze')).toBeVisible();
  await expect(page).toHaveURL(/#competenze$/);
  await page.goBack();
  await expect(page.locator('section.detail')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});

test('porta verso la card già aperta: riapre la competenza e porta il focus al titolo', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 800 }); // da 1200px, con una card aperta, le porte non ci sono
  await soloMcpEntra(page);
  await page.goto('/');
  const porta = page.getByRole('link', { name: /MCP entra tra le competenze/ });
  await porta.click();
  await expect(page.locator('#h-competenze')).toHaveText('Model Context Protocol (MCP)');
  await page.getByRole('link', { name: '← Tutte le competenze' }).click();
  await expect(page.getByRole('group', { name: /Radar delle competenze/ })).toBeVisible();
  await porta.click();
  await expect(page.locator('#h-competenze')).toHaveText('Model Context Protocol (MCP)');
  await expect(page.locator('#h-competenze')).toBeFocused();
  await scrollSettled(page);
  await expect(page.locator('#h-competenze')).toBeInViewport();
  await page.goBack();
  await expect(page).toHaveURL(/#competenze$/);
  await expect(page.getByRole('group', { name: /Radar delle competenze/ })).toBeVisible();
  await page.goBack();
  await expect(page.locator('section.detail')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});

test('i vecchi link #politica aprono Norme e diventano #norme', async ({ page }) => {
  await page.goto('/#politica');
  await expect(page.locator('#detail-norme')).toBeVisible();
  await expect(page).toHaveURL(/#norme$/);
});

for (const id of TEMI) {
  test(`card ${id}: si apre con il clic e con il link diretto`, async ({ page }) => {
    await page.goto('/');
    await page.locator(`#tile-${id} .face`).click();
    await expect(page.locator(`#detail-${id}`)).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await page.goto(`/#${id}`);
    await page.reload();
    await expect(page.locator(`#detail-${id}`)).toBeVisible();
  });
}

test('indietro chiude; dopo un cambio di card un solo indietro torna alla home', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 800 }); // le pillole ci sono sotto 1200px
  await page.goto('/');
  await page.locator('#tile-business .face').click();
  await page.goBack();
  await expect(page.locator('section.detail')).toHaveCount(0);
  await page.locator('#tile-business .face').click();
  await page.getByRole('navigation', { name: 'Altre card' }).getByRole('button', { name: 'Norme' }).click();
  await expect(page).toHaveURL(/#norme$/);
  await page.goBack();
  await expect(page.locator('section.detail')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});

test('tastiera: Invio apre e porta il focus al titolo, Esc chiude e lo riporta', async ({ page }) => {
  await page.goto('/');
  await page.locator('#tile-modelli .face').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#h-modelli')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#tile-modelli .face')).toBeFocused();
});

test('link diretto a una competenza: la sua pagina', async ({ page }) => {
  await page.goto('/#competenze/mcp');
  await expect(page.locator('#h-competenze')).toHaveText('Model Context Protocol (MCP)');
  await expect(page.getByRole('heading', { name: 'Per iniziare' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cosa si muove adesso' })).toBeVisible();
});

test('dal radar alla competenza e ritorno: clic sul punto, Indietro, Esc', async ({ page }) => {
  await page.goto('/');
  await page.locator('#tile-competenze .face').click();
  await page.locator('#detail-competenze g.pt').nth(1).locator('circle.hit').click(); // MCP
  await expect(page).toHaveURL(/#competenze\/mcp$/);
  await expect(page.locator('#h-competenze')).toHaveText('Model Context Protocol (MCP)');
  await page.goBack();
  await expect(page).toHaveURL(/#competenze$/);
  await expect(page.getByRole('group', { name: /Radar delle competenze/ })).toBeVisible();
  await page.getByRole('link', { name: /^RAG/ }).first().click(); // movimenti del mese ed elenco portano alla stessa pagina
  await expect(page.locator('#h-competenze')).toHaveText('RAG e ricerca semantica');
  await page.keyboard.press('Escape');
  await expect(page.locator('section.detail')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});

const ruoli = (page: Page) => page.getByRole('group', { name: 'Il tuo ruolo' });
const premuto = (page: Page) => ruoli(page).locator('button[aria-pressed="true"]');

test('ruolo: il link lo sceglie, il ricaricamento lo tiene, un link con un altro ruolo vince sul ricordo', async ({ page }) => {
  await page.goto('/#competenze?ruolo=compliance');
  await page.reload();
  await expect(premuto(page)).toHaveText('Legale e compliance');
  await expect(page.locator('#detail-competenze g.pt.altro')).not.toHaveCount(0);
  await page.goto('about:blank');
  await page.goto('/#competenze'); // senza ruolo nel link: vale il ricordo, che entra nel link
  await expect(premuto(page)).toHaveText('Legale e compliance');
  await expect(page).toHaveURL(/#competenze\?ruolo=compliance$/);
  await page.goto('about:blank');
  await page.goto('/#competenze?ruolo=dati');
  await expect(premuto(page)).toHaveText('Dati e analisi');
  await page.goto('about:blank');
  await page.goto('/#competenze');
  await expect(premuto(page)).toHaveText('Dati e analisi');
});

test('ruolo da tastiera: Tab tra i pulsanti, Invio sceglie; «Tutti» toglie il ruolo dal link', async ({ page }) => {
  await page.goto('/#competenze');
  await ruoli(page).getByRole('button', { name: 'Tutti' }).focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(ruoli(page).getByRole('button', { name: 'Prodotto' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(premuto(page)).toHaveText('Prodotto');
  await expect(page).toHaveURL(/#competenze\?ruolo=prodotto$/);
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Space');
  await expect(premuto(page)).toHaveText('Tutti');
  await expect(page).toHaveURL(/#competenze$/);
});

test('porta Per te: scelto un ruolo nella card, la home lo mostra e la porta riapre la card con il ruolo', async ({ page }) => {
  await page.goto('/#competenze');
  await ruoli(page).getByRole('button', { name: 'Prodotto' }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('section.detail')).toHaveCount(0);
  const porta = page.getByRole('link', { name: /Per te · Prodotto/ });
  await expect(porta).toContainText('RAG esce da Impara ora');
  await porta.click();
  await expect(page).toHaveURL(/#competenze\/rag\?ruolo=prodotto$/);
  await page.getByRole('link', { name: '← Tutte le competenze' }).click();
  await expect(premuto(page)).toHaveText('Prodotto');
});

test('ruolo a 320px: la fila va a capo, niente scorrimento orizzontale', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/#competenze?ruolo=dati');
  await page.reload();
  await expect(premuto(page)).toHaveText('Dati e analisi');
  const tops = await ruoli(page).getByRole('button').evaluateAll((bs) => new Set(bs.map((b) => b.getBoundingClientRect().top)).size);
  expect(tops).toBeGreaterThan(1);
  expect(await noHorizontalScroll(page)).toBe(true);
});

const mercati = (page: Page) => page.getByRole('group', { name: 'Mercato' });
const mercatoPremuto = (page: Page) => mercati(page).getByRole('button', { pressed: true });
const rigaItalia = 'La crescita è mondiale, la domanda è italiana.';

test('mercato: il link apre l’Italia, il ricaricamento la tiene, «Tutti i Paesi» toglie la scelta dal link e dal ricordo', async ({ page }) => {
  await page.goto('/#competenze?mercato=italia');
  await expect(mercatoPremuto(page)).toHaveText('Italia');
  await expect(page.getByRole('heading', { level: 2, name: 'RAG esce da Impara ora' })).toBeVisible();
  await expect(page.getByText(rigaItalia)).toBeVisible();
  await expect(page.getByRole('link', { name: /^Model Context Protocol \(MCP\): Da provare.*2,6 ogni 10mila, 32 annunci/ })).toBeAttached();
  await page.reload();
  await expect(mercatoPremuto(page)).toHaveText('Italia');
  await page.goto('about:blank');
  await page.goto('/#competenze'); // senza mercato nel link: vale il ricordo, che entra nel link
  await expect(mercatoPremuto(page)).toHaveText('Italia');
  await expect(page).toHaveURL(/#competenze\?mercato=italia$/);
  await mercati(page).getByRole('button', { name: 'Tutti i Paesi' }).click();
  await expect(page).toHaveURL(/#competenze$/);
  await expect(page.getByText(rigaItalia)).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 2, name: 'MCP entra tra le competenze da imparare ora' })).toBeVisible();
  await page.goto('about:blank');
  await page.goto('/#competenze');
  await expect(mercatoPremuto(page)).toHaveText('Tutti i Paesi');
  await expect(page).toHaveURL(/#competenze$/);
});

test('mercato: un valore sconosciuto nel link si ignora e vale il ricordo', async ({ page }) => {
  await page.goto('/#competenze?mercato=francia');
  await expect(mercatoPremuto(page)).toHaveText('Tutti i Paesi');
  await expect(page).toHaveURL(/#competenze$/);
  await mercati(page).getByRole('button', { name: 'Italia' }).click();
  await expect(page).toHaveURL(/#competenze\?mercato=italia$/);
  await page.goto('about:blank');
  await page.goto('/#competenze?mercato=francia');
  await expect(mercatoPremuto(page)).toHaveText('Italia');
  await expect(page).toHaveURL(/#competenze\?mercato=italia$/);
});

test('mercato e ruolo stanno nello stesso link, e tutti e due entrano dal ricordo', async ({ page }) => {
  await page.goto('/#competenze?mercato=italia&ruolo=dati');
  await expect(mercatoPremuto(page)).toHaveText('Italia');
  await expect(premuto(page)).toHaveText('Dati e analisi');
  await page.goto('about:blank');
  await page.goto('/#competenze');
  await expect(mercatoPremuto(page)).toHaveText('Italia');
  await expect(premuto(page)).toHaveText('Dati e analisi');
  await expect(page).toHaveURL(/#competenze\?(?=.*mercato=italia)(?=.*ruolo=dati)/);
});

test('mercato da tastiera: Tab tra i pulsanti, Invio sceglie, Spazio torna a tutti i Paesi', async ({ page }) => {
  await page.goto('/#competenze');
  await mercati(page).getByRole('button', { name: 'Tutti i Paesi' }).focus();
  await page.keyboard.press('Tab');
  await expect(mercati(page).getByRole('button', { name: 'Italia' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(mercatoPremuto(page)).toHaveText('Italia');
  await expect(page).toHaveURL(/#competenze\?mercato=italia$/);
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Space');
  await expect(mercatoPremuto(page)).toHaveText('Tutti i Paesi');
  await expect(page).toHaveURL(/#competenze$/);
});

test('mercato Italia a 320px: niente scorrimento orizzontale, e i pulsanti restano interi', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/#competenze?mercato=italia');
  await expect(mercatoPremuto(page)).toHaveText('Italia');
  await expect(page.getByText(rigaItalia)).toBeVisible();
  await expect(page.getByRole('group', { name: /^Radar delle competenze in Italia/ })).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);
  const scelte = await mercati(page).boundingBox();
  expect(scelte!.x + scelte!.width).toBeLessThanOrEqual(320);
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`accessibilità con il mercato Italia, tema ${colorScheme}: nessuna violazione grave`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/#competenze?mercato=italia');
    await expect(page.getByText(rigaItalia)).toBeVisible();
    expect(await seriousViolations(page)).toEqual([]);
  });
}

const bloccoDomanda = (page: Page) => page.getByRole('region', { name: 'Domanda' });
const paginaItalia = '2,6 ogni 10mila in Italia, 32 annunci · era 2,4 un mese fa · Paese a metà classifica: 3,4';

test('pagina di una competenza: il link apre l’Italia, senza bottoni, con i quadranti italiani', async ({ page }) => {
  await page.goto('/#competenze/mcp?mercato=italia');
  await expect(page.getByRole('heading', { level: 2, name: 'Model Context Protocol (MCP)' })).toBeVisible();
  await expect(bloccoDomanda(page)).toContainText(paginaItalia);
  await expect(page.getByText("In Italia: Da provare, un mese fa Tieni d'occhio.")).toBeVisible();
  await expect(page.getByRole('list', { name: 'Il percorso sul radar' }).getByRole('listitem').last()).toHaveText('set 2026Da provare');
  await expect(mercati(page)).toHaveCount(0);
  await page.reload();
  await expect(bloccoDomanda(page)).toContainText(paginaItalia);
});

test('pagina di una competenza: senza mercato nel link vale il ricordo, che entra nel link', async ({ page }) => {
  await page.goto('/#competenze?mercato=italia');
  await expect(mercatoPremuto(page)).toHaveText('Italia');
  await page.goto('about:blank');
  await page.goto('/#competenze/mcp');
  await expect(bloccoDomanda(page)).toContainText(paginaItalia);
  await expect(page).toHaveURL(/#competenze\/mcp\?mercato=italia$/);
});

test('pagina di una competenza: «Tutte le competenze» e i punti del radar conservano mercato e ruolo', async ({ page }) => {
  await page.goto('/#competenze?mercato=italia&ruolo=sviluppo');
  await expect(mercatoPremuto(page)).toHaveText('Italia');
  const punto = page.getByRole('group', { name: /^Radar delle competenze/ }).getByRole('link', { name: /^Model Context Protocol \(MCP\), del tuo ruolo: Da provare/ });
  await expect(punto).toHaveAttribute('href', '#competenze/mcp?mercato=italia&ruolo=sviluppo');
  await punto.focus();
  await page.keyboard.press('Enter');
  await expect(bloccoDomanda(page)).toContainText(paginaItalia);
  await expect(page).toHaveURL(/#competenze\/mcp\?mercato=italia&ruolo=sviluppo$/);
  await expect(page.getByRole('link', { name: '← Tutte le competenze' })).toHaveAttribute('href', '#competenze?mercato=italia&ruolo=sviluppo');
  await page.getByRole('link', { name: '← Tutte le competenze' }).click();
  await expect(mercatoPremuto(page)).toHaveText('Italia');
  await expect(page).toHaveURL(/#competenze\?mercato=italia&ruolo=sviluppo$/);
});

test('pagina di una competenza a 320px: niente scorrimento orizzontale, e le etichette del grafico Annunci restano nella scheda', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  for (const hash of ['#competenze/mcp?mercato=italia', '#competenze/mcp']) {
    await page.goto(`/${hash}`);
    await page.reload();
    const annunci = page.getByRole('region', { name: 'Annunci' });
    const etichetta = annunci.getByRole('img', { name: /^Annunci su MCP ogni 10mila/ }).getByText('Paese a metà classifica');
    await expect(etichetta).toBeVisible();
    expect(await noHorizontalScroll(page), hash).toBe(true);
    const scheda = (await annunci.boundingBox())!;
    const testo = (await etichetta.boundingBox())!;
    expect(testo.x + testo.width, hash).toBeLessThanOrEqual(scheda.x + scheda.width);
  }
});

for (const { nome, hash, evidenza, altra } of [
  { nome: 'Tutti i Paesi', hash: '#competenze/mcp', evidenza: 'Paese a metà classifica', altra: /^Italia/ },
  { nome: 'Italia', hash: '#competenze/mcp?mercato=italia', evidenza: /^Italia/, altra: 'Paese a metà classifica' },
]) {
  test(`grafico Annunci con «${nome}»: il colore in evidenza va sul mercato scelto`, async ({ page }) => {
    await page.goto(`/${hash}`);
    const grafico = page.getByRole('region', { name: 'Annunci' }).getByRole('img', { name: /^Annunci su MCP ogni 10mila/ });
    const colore = (testo: string | RegExp) => grafico.getByText(testo).evaluate((el) => getComputedStyle(el).fill);
    const blu = await page.evaluate(() => {
      const prova = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      prova.style.fill = 'var(--accent)';
      document.body.append(prova);
      const fill = getComputedStyle(prova).fill;
      prova.remove();
      return fill;
    });
    expect(await colore(evidenza)).toBe(blu);
    expect(await colore(altra)).not.toBe(blu);
  });
}

for (const width of [1200, 1280]) {
  test(`tabella delle competenze con «Italia» a ${width}px: il numero di annunci va a capo e la tabella non scorre di lato`, async ({ page }) => {
    const radar = FIXTURE.radar!;
    const [prima, ...altre] = radar.competenze;
    await page.route('**/data/radar.json', (route) => route.fulfill({
      json: { ...radar, competenze: [{ ...prima, nome: 'LLMOps e messa in produzione', quadrante_it: 'consolida', incerto: true, domanda_it: 38.4, annunci_it: 529 }, ...altre] },
    }));
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#competenze?mercato=italia');
    const tabella = page.getByRole('region', { name: 'Tabella delle competenze' });
    const cella = tabella.getByRole('row', { name: /LLMOps e messa in produzione/ }).getByRole('cell').last();
    await expect(cella).toHaveText('38 ogni 10mila, 529 annunci');
    expect(await tabella.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    const alto = (testo: string) => cella.evaluate((el, cercato) => {
      const nodi = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      while (nodi.nextNode()) {
        if (nodi.currentNode.textContent!.includes(cercato)) {
          const tratto = document.createRange();
          tratto.selectNodeContents(nodi.currentNode);
          return tratto.getBoundingClientRect().top;
        }
      }
      throw new Error(`testo non trovato: ${cercato}`);
    }, testo);
    expect(await alto('529 annunci')).toBeGreaterThan(await alto('38 ogni 10mila'));
  });
}

for (const colorScheme of ['light', 'dark'] as const) {
  test(`accessibilità nella pagina di una competenza con «Italia», tema ${colorScheme}: nessuna violazione grave`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/#competenze/mcp?mercato=italia');
    await expect(bloccoDomanda(page)).toContainText(paginaItalia);
    expect(await seriousViolations(page)).toEqual([]);
  });
}

// Con il FIXTURE: su tutti i Paesi 2 competenze in Impara ora, con i nomi Agenti AI e MCP nella figura; in Italia una sola, Agenti AI.
const cardCompetenze = (page: Page) => page.getByRole('button', { name: /^Competenze/ });
const homeItaliana = async (page: Page) => {
  const porta = page.getByRole('link', { name: /Per te · Italia/ });
  await expect(porta).toContainText('RAG esce da Impara ora');
  await expect(porta).not.toContainText('sotto soglia');
  await expect(cardCompetenze(page)).toHaveAccessibleName('Competenze · Italia: 1 su 5');
  await expect(cardCompetenze(page)).toHaveAccessibleDescription(/^1 competenza su 5 da imparare ora: cresce/);
  await expect(cardCompetenze(page).getByText('Competenze · Italia')).toBeVisible();
  await expect(cardCompetenze(page).getByText('Agenti AI')).toBeVisible();
  await expect(cardCompetenze(page).getByText('MCP')).toHaveCount(0);
};

test('home e mercato: scelta l’Italia nella card, porta e figura sono italiane, anche dopo un ricaricamento; «Tutti i Paesi» le riporta indietro', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Per te/ }).first()).toContainText('MCP entra tra le competenze');
  await expect(page.getByRole('link', { name: /Per te/ }).first()).toContainText('sotto soglia');
  await expect(cardCompetenze(page)).toHaveAccessibleName('Competenze: 2 su 5');
  await expect(cardCompetenze(page).getByText('MCP')).toBeVisible();
  await cardCompetenze(page).click();
  await mercati(page).getByRole('button', { name: 'Italia' }).click();
  await page.keyboard.press('Escape');
  await expect(mercati(page)).toHaveCount(0);
  await homeItaliana(page);
  await page.reload();
  await homeItaliana(page);

  await page.getByRole('link', { name: /Per te · Italia/ }).click();
  await expect(page).toHaveURL(/#competenze\/rag\?mercato=italia$/);
  await page.goto('/#competenze');
  await mercati(page).getByRole('button', { name: 'Tutti i Paesi' }).click();
  await page.keyboard.press('Escape');
  await expect(cardCompetenze(page)).toHaveAccessibleName('Competenze: 2 su 5');
  await expect(page.getByRole('link', { name: /Per te/ }).first()).toContainText('MCP entra tra le competenze');
  await expect(cardCompetenze(page).getByText('MCP')).toBeVisible();
});

test('home e mercato: ruolo e Italia stanno insieme nell’etichetta e nel link della porta', async ({ page }) => {
  await page.goto('/#competenze?mercato=italia&ruolo=prodotto');
  await expect(mercatoPremuto(page)).toHaveText('Italia');
  await page.keyboard.press('Escape');
  const porta = page.getByRole('link', { name: /Per te · Prodotto · Italia/ });
  await expect(porta).toHaveAttribute('href', '#competenze/rag?mercato=italia&ruolo=prodotto');
});

test('home e mercato: un link con l’Italia aperto da solo basta perché la home la segua', async ({ page }) => {
  await page.goto('/#competenze?mercato=italia');
  await expect(mercatoPremuto(page)).toHaveText('Italia');
  await page.keyboard.press('Escape');
  await homeItaliana(page);
});

test('elenco accanto a una card aperta: la scelta del mercato si vede subito sulla card Competenze', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/#competenze');
  await expect(cardCompetenze(page)).toHaveAccessibleName('Competenze: 2 su 5');
  await mercati(page).getByRole('button', { name: 'Italia' }).click();
  await expect(cardCompetenze(page)).toHaveAccessibleName('Competenze · Italia: 1 su 5');
  await expect(cardCompetenze(page).getByText('Competenze · Italia')).toBeVisible();
  await page.keyboard.press('Escape');
  await homeItaliana(page);
});

test('home e mercato con nessun dato italiano: porta e card lo dicono', async ({ page }) => {
  const radar = { ...FIXTURE.radar!, competenze: FIXTURE.radar!.competenze.map((c) => ({ ...c, domanda_it: null, annunci_it: null, quadrante_it: null, quadrante_calcolato_it: null })) };
  await page.route('**/data/radar.json', (route) => route.fulfill({ json: radar }));
  await page.addInitScript(() => localStorage.setItem('ai-radar:mercato', 'italia'));
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Per te · Italia/ })).toContainText('Per l’Italia il dato non è disponibile');
  await expect(cardCompetenze(page)).toHaveAccessibleDescription('Per l’Italia il dato non è disponibile in questo momento.');
});

test('home con l’Italia a 320px, nei due temi: niente scorrimento orizzontale, nessuna violazione grave', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.addInitScript(() => localStorage.setItem('ai-radar:mercato', 'italia'));
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto('/');
    await homeItaliana(page);
    expect(await noHorizontalScroll(page)).toBe(true);
    expect(await seriousViolations(page)).toEqual([]);
  }
  await page.addInitScript(() => localStorage.setItem('ai-radar:ruolo', 'compliance')); // l'etichetta più lunga
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Per te · Legale e compliance · Italia/ })).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);
});

const menuArea = (page: Page) => page.getByRole('combobox', { name: 'Area' });
// la scheda dell'area è la regione che porta il nome dell'area: il suo titolo
const scheda = (page: Page, area: string) => page.getByRole('region', { name: area, exact: true });

test('area: il link apre il Paese, il ricaricamento lo tiene, un link con un’altra area vince sul ricordo', async ({ page }) => {
  await page.goto('/#geopoliticai?area=italia');
  await expect(scheda(page, "Italia, nell'UE")).toBeVisible();
  await expect(menuArea(page)).toHaveValue('italia');
  await page.reload();
  await expect(scheda(page, "Italia, nell'UE")).toBeVisible();
  await page.goto('about:blank');
  await page.goto('/#geopoliticai'); // senza area nel link: vale il ricordo, che entra nel link
  await expect(scheda(page, "Italia, nell'UE")).toBeVisible();
  await expect(page).toHaveURL(/#geopoliticai\?area=italia$/);
  await page.goto('about:blank');
  await page.goto('/#geopoliticai?area=cina');
  await expect(scheda(page, 'Cina')).toBeVisible();
  await expect(menuArea(page)).toHaveValue('cina');
});

test('area non valida: si apre l’UE, senza errori', async ({ page }) => {
  const errori: string[] = [];
  page.on('pageerror', (e) => errori.push(e.message));
  await page.goto('/#geopoliticai?area=atlantide');
  await expect(scheda(page, 'UE')).toBeVisible();
  await expect(menuArea(page)).toHaveValue('ue');
  await expect(page).toHaveURL(/#geopoliticai$/);
  expect(errori).toEqual([]);
});

test('area dal menu accanto al titolo della scheda, anche da tastiera; «UE, tutta» toglie l’area dal link', async ({ page }) => {
  await page.goto('/#geopoliticai');
  await menuArea(page).selectOption('cina');
  await expect(scheda(page, 'Cina')).toBeVisible();
  await expect(page).toHaveURL(/#geopoliticai\?area=cina$/);
  await menuArea(page).focus();
  await page.keyboard.press('ArrowDown'); // dopo la Cina viene l'UE
  await expect(scheda(page, 'UE')).toBeVisible();
  await expect(page).toHaveURL(/#geopoliticai$/);
  await page.keyboard.press('ArrowDown');
  await expect(scheda(page, "Francia, nell'UE")).toBeVisible();
  await expect(page).toHaveURL(/#geopoliticai\?area=francia$/);
  await menuArea(page).selectOption('ue');
  await expect(page).toHaveURL(/#geopoliticai$/);
});

test('area a 320px: il menu sta accanto o sotto il titolo, niente scorrimento orizzontale', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/#geopoliticai?area=italia');
  await expect(scheda(page, "Italia, nell'UE")).toBeVisible();
  const menu = (await menuArea(page).boundingBox())!;
  expect(menu.height).toBeGreaterThanOrEqual(44);
  expect(await noHorizontalScroll(page)).toBe(true);
});

for (const width of [320, 1280]) {
  test(`GeopoliticAI a ${width}px: il distacco è nello schermo del titolo, sopra la mappa`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#geopoliticai');
    await expect(page.getByRole('heading', { level: 2, name: /Chi costruisce i modelli/ })).toBeVisible();
    await scrollSettled(page);
    const titolo = (await page.getByRole('heading', { level: 2, name: /Chi costruisce i modelli/ }).boundingBox())!;
    const cifra = (await page.getByText('18,8', { exact: true }).boundingBox())!;
    expect(cifra.y).toBeGreaterThan(titolo.y);
    expect(cifra.y - titolo.y).toBeLessThan(900);
    const mappa = (await page.getByRole('region', { name: "Chi controlla la catena dell'AI" }).boundingBox())!;
    expect(cifra.y).toBeLessThan(mappa.y);
    expect(await noHorizontalScroll(page)).toBe(true);
  });
}

test('GeopoliticAI: dal distacco alla scheda dell’UE, anche con un’altra area scelta', async ({ page }) => {
  await page.goto('/#geopoliticai?area=cina');
  await expect(scheda(page, 'Cina')).toBeVisible();
  await page.getByRole('button', { name: "Vai alla scheda dell'UE" }).click();
  await expect(scheda(page, 'UE')).toBeFocused();
});

for (const width of [320, 390, 480]) {
  test(`card GeopoliticAI a ${width}px: i nomi delle aree stanno interi nella card`, async ({ page }) => {
    await page.setViewportSize({ width, height: 780 });
    await page.goto('/');
    const card = page.getByRole('button', { name: /GeopoliticAI/ });
    await expect(card).toBeVisible();
    const fuori = (await card.boundingBox())!;
    for (const nome of ['USA', 'Cina', 'UE']) {
      const box = (await card.getByText(nome, { exact: true }).boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(fuori.x);
      expect(box.x + box.width).toBeLessThanOrEqual(fuori.x + fuori.width);
    }
    expect(await noHorizontalScroll(page)).toBe(true);
  });
}

test('GeopoliticAI: «Dove sta l’Italia» apre le quote con il suo fumetto, il link lo dice, e chiudendolo il link torna senza', async ({ page }) => {
  await page.goto('/#geopoliticai?area=italia');
  await page.getByRole('button', { name: "Dove sta l'Italia nella catena dell'AI →" }).click();
  const fumetto = page.getByRole('dialog', { name: 'Italia' });
  await expect(fumetto).toBeFocused();
  await expect(page).toHaveURL(/vista=quote/);
  await expect(page).toHaveURL(/paese=ITA/);
  await page.reload();
  await expect(fumetto).toBeVisible();
  await fumetto.getByRole('button', { name: 'Chiudi' }).click();
  await expect(fumetto).toHaveCount(0);
  await expect(page).not.toHaveURL(/paese=/);
  await expect(page).toHaveURL(/vista=quote/);
});

test('GeopoliticAI: il Paese scelto dal menu e dalla mappa sta nel link, e il ricaricamento lo riapre', async ({ page }) => {
  await page.goto('/#geopoliticai?vista=quote');
  const mappa = page.getByRole('region', { name: "Chi controlla la catena dell'AI" });
  await mappa.getByRole('combobox', { name: 'Un Paese' }).selectOption('CHN');
  await mappa.getByRole('button', { name: 'Apri' }).click();
  await expect(page).toHaveURL(/paese=CHN/);
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Cina' })).toBeVisible();
  await mappa.getByRole('group', { name: /^Mappa del mondo/ }).getByTestId('paese-USA').dispatchEvent('click'); // il fumetto della Cina copre gli USA
  await expect(page).toHaveURL(/paese=USA/);
  await expect(page.getByRole('dialog', { name: 'USA' })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Cina' })).toHaveCount(0);
});
for (const width of [320, 390, 480, 768, 1280]) {
  test(`mappa delle quote a ${width}px: le etichette non si coprono, e la più alta c'è sempre`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#geopoliticai?vista=quote');
    const mappa = page.getByRole('region', { name: "Chi controlla la catena dell'AI" });
    const etichette = mappa.getByTestId('etichetta');
    await expect(etichette.first()).toContainText('USA 156,3');
    const box = await Promise.all((await etichette.all()).map(async (e) => (await e.boundingBox())!));
    for (const [i, a] of box.entries()) for (const b of box.slice(i + 1)) {
      const insieme = a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
      expect(insieme).toBe(false);
    }
    await expect(mappa.getByRole('img', { name: 'Il primo: USA' })).toBeVisible();
  });
}

test('GeopoliticAI: un ?paese= sconosciuto si ignora', async ({ page }) => {
  await page.goto('/#geopoliticai?vista=quote&paese=XXX');
  await expect(page.getByRole('region', { name: "Chi controlla la catena dell'AI" })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('Modelli e ricerca: il rimando apre GeopoliticAI, Indietro torna a Modelli e poi alla home', async ({ page }) => {
  await page.goto('/');
  await page.locator('#tile-modelli .face').click();
  await page.getByRole('link', { name: 'Vai a GeopoliticAI →' }).click();
  await expect(page).toHaveURL(/#geopoliticai$/);
  await expect(scheda(page, 'UE')).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#modelli$/);
  await expect(page.locator('#detail-modelli')).toBeVisible();
  await page.goBack();
  await expect(page.locator('section.detail')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});

const matrice = (page: Page) => page.getByRole('table', { name: 'Calcolo e capacità per area, anno per anno' });

test('matrice: un clic su una riga cambia l’area nel link e porta il focus alla scheda', async ({ page }) => {
  await page.goto('/#geopoliticai');
  await matrice(page).getByRole('button', { name: 'Germania' }).click();
  await expect(page).toHaveURL(/#geopoliticai\?area=germania$/);
  await expect(scheda(page, "Germania, nell'UE")).toBeFocused();
  await matrice(page).getByRole('button', { name: 'USA' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#geopoliticai\?area=usa$/);
  await expect(scheda(page, 'USA')).toBeFocused();
});

test('matrice a 320px: scorre dentro il suo contenitore, non la pagina', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/#geopoliticai');
  await page.getByRole('group', { name: 'Misura' }).getByRole('button', { name: 'Calcolo di addestramento (FLOP)' }).click();
  const box = page.getByRole('region', { name: /scorre in orizzontale/ });
  expect(await box.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  expect(await noHorizontalScroll(page)).toBe(true);
});

const mappa = (page: Page) => page.getByRole('region', { name: "Chi controlla la catena dell'AI" });
const europa = (page: Page) => mappa(page).getByRole('group', { name: 'Europa, ingrandita' });
const italiaInEuropa = (page: Page) => europa(page).getByTestId('paese-ITA');
const menuPaese = (page: Page) => mappa(page).getByRole('combobox', { name: 'Un Paese' });
const valoreItalia = (page: Page, testo: string) => expect(menuPaese(page).getByRole('option', { name: `Italia: ${testo}` })).toBeAttached();

test('mappa: ?anello=modelli apre l’anello, e un clic sulla fermata lo mette nel link', async ({ page }) => {
  await page.goto('/#geopoliticai?anello=modelli');
  await expect(mappa(page).getByRole('heading', { level: 4 })).toHaveText('6. Modelli');
  await page.goto('/#geopoliticai?anello=boh'); // non valido: si aprono i modelli
  await expect(mappa(page).getByRole('heading', { level: 4 })).toHaveText('6. Modelli');
  await page.goto('/#geopoliticai');
  await mappa(page).getByRole('button', { name: '6 Modelli', exact: true }).click();
  await expect(page).toHaveURL(/#geopoliticai\?anello=modelli$/);
  // l'anello non si ricorda tra le visite: resta solo nel link
  await page.goto('about:blank');
  await page.goto('/#geopoliticai');
  await expect(mappa(page).getByRole('heading', { level: 4 })).toHaveText('6. Modelli');
  await expect(page).toHaveURL(/#geopoliticai$/);
});

test('mappa: ?anello=fabbricazione apre l’anello dei chip, e un clic su una fermata aggiorna il link', async ({ page }) => {
  await page.goto('/#geopoliticai?vista=quote&anello=fabbricazione');
  await expect(mappa(page).getByRole('heading', { level: 4 })).toHaveText('3. Fabbricazione dei chip');
  await valoreItalia(page, 'Europa, dato unico, 8%');
  await mappa(page).getByRole('button', { name: '4 Macchinari', exact: true }).click();
  await expect(page).toHaveURL(/#geopoliticai\?vista=quote&anello=macchinari$/);
  await expect(mappa(page).getByRole('heading', { level: 4 })).toHaveText('4. Macchinari');
  await expect(mappa(page).getByText(/Le macchine EUV/)).toBeVisible();
});

test('mappa: ?anello=materie&materiale=terre apre le terre rare, e un clic su un materiale aggiorna il link', async ({ page }) => {
  await page.goto('/#geopoliticai?vista=quote&anello=materie&materiale=terre');
  await expect(mappa(page).getByRole('heading', { level: 4 })).toHaveText('1. Materie prime');
  const materiali = mappa(page).getByRole('group', { name: 'Materiale' });
  await expect(materiali.getByRole('button', { name: 'Terre rare' })).toHaveAttribute('aria-pressed', 'true');
  await valoreItalia(page, 'nessuna produzione');
  await materiali.getByRole('button', { name: 'Germanio' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#geopoliticai\?vista=quote&anello=materie&materiale=germanio$/);
  await expect(materiali.getByRole('button', { name: 'Germanio' })).toHaveAttribute('aria-pressed', 'true');
});

test('mappa: ?anello=datacenter apre le quote dei data center, con la nota sulla copertura', async ({ page }) => {
  await page.goto('/#geopoliticai?vista=quote&anello=datacenter');
  await expect(mappa(page).getByRole('heading', { level: 4 })).toHaveText('5. Data center');
  await valoreItalia(page, 'nessun sito noto a Epoch');
  await expect(mappa(page).getByText(/coprono circa il 44% del calcolo AI mondiale/)).toBeVisible();
});

/** Un tocco su un punto della mappa, nelle coordinate dei confini: il centro del riquadro di un Paese con territori lontani cade nell'oceano. */
async function tocca(page: Page, svg: ReturnType<typeof europa>, [x, y]: [number, number]) {
  await svg.scrollIntoViewIfNeeded();
  const punto = await svg.evaluate((el, [x, y]) => {
    const s = el as SVGSVGElement;
    const p = Object.assign(s.createSVGPoint(), { x, y }).matrixTransform(s.getScreenCTM()!);
    return { x: p.x, y: p.y };
  }, [x, y]);
  await page.mouse.click(punto.x, punto.y);
  return punto;
}
const FRANCIA: [number, number] = [505.8, -163.6]; // il centro della Francia metropolitana, da confini.json

test('mappa: un tocco sulla Francia apre il fumetto senza coprirla né l’Europa e sceglie ?area=francia; Esc chiude solo il fumetto', async ({ page }) => {
  await page.goto('/#geopoliticai?vista=quote');
  const mondo = mappa(page).getByRole('group', { name: /^Mappa del mondo/ });
  const punto = await tocca(page, mondo, FRANCIA);
  const fumetto = mappa(page).getByRole('dialog', { name: 'Francia' });
  await expect(fumetto).toBeFocused();
  await expect(page).toHaveURL(/#geopoliticai\?vista=quote&area=francia&paese=FRA$/);
  await expect(scheda(page, "Francia, nell'UE")).toBeVisible();
  const box = (await fumetto.boundingBox())!;
  const riquadro = (await europa(page).boundingBox())!;
  expect(punto.x < box.x || punto.x > box.x + box.width || punto.y < box.y || punto.y > box.y + box.height).toBe(true);
  expect(box.x).toBeGreaterThan(riquadro.x + riquadro.width); // il riquadro dell'Europa resta scoperto
  await page.keyboard.press('Escape');
  await expect(fumetto).toBeHidden();
  await expect(menuPaese(page)).toBeFocused();
  await expect(scheda(page, "Francia, nell'UE")).toBeVisible(); // il dettaglio resta aperto
});

test('mappa da tastiera: il menu sotto la mappa apre il fumetto del Paese, e Esc riporta al menu', async ({ page }) => {
  await page.goto('/#geopoliticai?vista=quote');
  await menuPaese(page).selectOption('DEU');
  await menuPaese(page).focus();
  await page.keyboard.press('Tab');
  await expect(mappa(page).getByRole('button', { name: 'Apri' })).toBeFocused();
  await page.keyboard.press('Enter');
  const fumetto = mappa(page).getByRole('dialog', { name: 'Germania' });
  await expect(fumetto).toBeFocused();
  await expect(page).toHaveURL(/area=germania/);
  await page.keyboard.press('Escape');
  await expect(fumetto).toBeHidden();
  await expect(menuPaese(page)).toBeFocused();
});

test('mappa a 320px: il fumetto è un pannello sotto le mappe, con il pulsante per chiuderlo', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/#geopoliticai');
  // l'Italia dal riquadro e la Cina dal mondo: sul desktop i loro fumetti si aprono da lati diversi
  const paesi = [['Italia', italiaInEuropa(page)], ['Cina', mappa(page).getByRole('group', { name: /^Mappa del mondo/ }).getByTestId('paese-CHN')]] as const;
  for (const [nome, paese] of paesi) {
    await paese.click();
    const fumetto = mappa(page).getByRole('dialog', { name: nome });
    await expect(fumetto).toBeVisible();
    const [mondo, riquadro, pannello] = await mappa(page).evaluate((el) =>
      ['svg[aria-label^="Mappa del mondo"]', 'svg[aria-label="Europa, ingrandita"]', '[role="dialog"]'].map((s) => el.querySelector(s)!.getBoundingClientRect().toJSON()));
    expect(pannello.y).toBeGreaterThanOrEqual(riquadro.y + riquadro.height);
    expect([pannello.x, pannello.width]).toEqual([mondo.x, mondo.width]); // a tutta larghezza, come la mappa
    expect(await noHorizontalScroll(page)).toBe(true);
    await fumetto.getByRole('button', { name: 'Chiudi' }).click();
    await expect(fumetto).toBeHidden();
  }
});

test('mappa: un tocco sull’Italia nel riquadro dell’Europa la sceglie', async ({ page }) => {
  await page.goto('/#geopoliticai');
  await menuArea(page).selectOption('francia');
  await italiaInEuropa(page).click();
  await expect(page).toHaveURL(/#geopoliticai\?area=italia&paese=ITA$/);
  await expect(scheda(page, "Italia, nell'UE")).toBeVisible();
});

test('mappa a 320px: il riquadro dell’Europa sta sotto la mappa, l’Italia si tocca bene', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/#geopoliticai');
  // le due mappe misurate insieme: tra due misure separate la pagina può scorrere
  const [mondo, riquadro] = await mappa(page).evaluate((el) =>
    ['svg[aria-label^="Mappa del mondo"]', 'svg[aria-label="Europa, ingrandita"]'].map((s) => el.querySelector(s)!.getBoundingClientRect().toJSON()));
  expect(riquadro.y).toBeGreaterThanOrEqual(mondo.y + mondo.height);
  expect(riquadro.width).toBeGreaterThan(mondo.width - 4);
  const it = (await italiaInEuropa(page).boundingBox())!;
  expect(Math.min(it.width, it.height)).toBeGreaterThanOrEqual(44);
  expect(await noHorizontalScroll(page)).toBe(true);
});

test('mappa: ?anello=datacenter&siti=1 mostra i cerchi dei siti, e ?anello=modelli&siti=1 no', async ({ page }) => {
  const cerchi = () => mappa(page).getByRole('button', { name: /: (.+ H100 equivalenti|in costruzione)$/ });
  await page.goto('/#geopoliticai?vista=quote&anello=datacenter');
  await expect(cerchi()).toHaveCount(0);
  await mappa(page).getByRole('button', { name: 'Siti' }).click();
  await expect(page).toHaveURL(/#geopoliticai\?vista=quote&anello=datacenter&siti=1$/);
  await expect(mappa(page).getByRole('group', { name: /^Mappa del mondo/ }).getByRole('button', { name: /^Colossus 2:/ })).toBeVisible();
  await europa(page).getByRole('button', { name: /^Google Waltham Cross:/ }).click();
  await expect(mappa(page).getByRole('dialog', { name: 'Google Waltham Cross' })).toBeFocused();
  expect(await seriousViolations(page, '#geo-mappa')).toEqual([]);
  await page.goto('about:blank'); // a card aperta un hash nuovo tiene i parametri: si riparte
  await page.goto('/#geopoliticai?vista=quote&anello=modelli&siti=1');
  await expect(mappa(page).getByRole('heading', { level: 4 })).toHaveText('6. Modelli');
  await expect(cerchi()).toHaveCount(0);
  await expect(mappa(page).getByRole('button', { name: 'Siti' })).toHaveCount(0);
});

/** I tratti degli archi del filo nel riquadro dell'Europa, nell'ordine delle fermate: null è un arco pieno. */
const tratti = (page: Page) => europa(page).getByTestId('arco').evaluateAll((as) => as.map((a) => a.getAttribute('stroke-dasharray')));

test('filo: si parte dal filo, ?filo=cina apre l’esempio cinese, e un clic su una fermata sposta l’arco pieno', async ({ page }) => {
  await page.goto('/#geopoliticai?filo=cina');
  await expect(mappa(page).getByRole('group', { name: 'Vista' }).getByRole('button', { name: 'Filo della catena' })).toHaveAttribute('aria-pressed', 'true');
  await expect(mappa(page).getByRole('group', { name: 'Esempio' }).getByRole('button', { name: 'Un modello cinese' })).toHaveAttribute('aria-pressed', 'true');
  await expect(mappa(page).getByRole('list', { name: 'Le tappe del filo: un modello cinese' })).toBeVisible();
  await expect(mappa(page).getByText(/^Un esempio scelto da noi, non un dato/)).toBeVisible();
  expect(await tratti(page)).toEqual([null, null, null, null, null]);
  await mappa(page).getByRole('button', { name: '3 Fabbricazione dei chip', exact: true }).click();
  await expect(page).toHaveURL(/#geopoliticai\?filo=cina&anello=fabbricazione$/);
  await expect.poll(() => tratti(page)).toEqual([null, null, '3 2', '3 2', '3 2']);
  // alle quote: il filo resta nel link, ma la vista è quella delle quote; e si torna
  await mappa(page).getByRole('button', { name: 'Quote per Paese' }).click();
  await expect(page).toHaveURL(/#geopoliticai\?filo=cina&anello=fabbricazione&vista=quote$/);
  await expect(mappa(page).getByText('Il primo', { exact: true })).toBeVisible();
  await expect(europa(page).getByTestId('arco')).toHaveCount(0);
  await mappa(page).getByRole('button', { name: 'Filo della catena' }).click();
  await expect(page).toHaveURL(/#geopoliticai\?filo=cina&anello=fabbricazione$/);
});

test('filo a 320px: nessuno scorrimento orizzontale, e gli archi d’Europa nel riquadro sotto la mappa', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/#geopoliticai');
  await expect(mappa(page).getByRole('list', { name: 'Le tappe del filo: un modello europeo' })).toBeVisible();
  await expect(europa(page).getByTestId('arco').first()).toBeAttached();
  expect(await noHorizontalScroll(page)).toBe(true);
  expect(await seriousViolations(page, '#geo-mappa')).toEqual([]);
});

test('filo con «riduci movimento»: gli archi non si animano', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#geopoliticai');
  await mappa(page).getByRole('button', { name: '4 Macchinari', exact: true }).click();
  await expect(page).toHaveURL(/anello=macchinari/);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test('filo senza «riduci movimento»: l’arco che arriva alla fermata scelta si disegna', async ({ page }) => {
  await page.goto('/#geopoliticai');
  await mappa(page).getByRole('button', { name: '4 Macchinari', exact: true }).click();
  await expect(page).toHaveURL(/anello=macchinari/);
  expect(await page.evaluate(() => document.getAnimations().length)).toBeGreaterThan(0);
});

test('mappa in tema scuro: nessuna violazione grave', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/#geopoliticai?area=cina');
  await page.reload();
  await expect(mappa(page)).toBeVisible();
  expect(await seriousViolations(page, '#geo-mappa')).toEqual([]);
});

/** Il contrasto WCAG tra il testo di un elemento con uno sfondo pieno e quello sfondo, con i colori come li disegna il browser. */
const contrasto = (l: Locator) => l.evaluate((el) => {
  const ctx = document.createElement('canvas').getContext('2d')!;
  const lum = (css: string) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = [...ctx.getImageData(0, 0, 1, 1).data].map((v) => v / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const s = getComputedStyle(el);
  const [a, b] = [lum(s.color), lum(s.backgroundColor)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
});

test('menu «Area» e quote per Paese in tema scuro: nessuna violazione grave', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/#geopoliticai?vista=quote');
  await page.reload();
  await menuArea(page).selectOption('italia'); // un Paese dentro il gruppo dell'UE
  await expect(page).toHaveURL(/#geopoliticai\?vista=quote&area=italia$/);
  await expect(scheda(page, "Italia, nell'UE")).toBeVisible();
  await expect(mappa(page).getByText('Il primo', { exact: true })).toBeVisible();
  expect(await seriousViolations(page, '#geo-scheda', '#geo-mappa')).toEqual([]);
  // axe lascia il menu in sospeso, per il gradiente della freccia sullo sfondo: il contrasto del testo lo misura il test
  expect(await contrasto(menuArea(page))).toBeGreaterThanOrEqual(4.5);
});

test('mappa con «riduci movimento»: nessuna animazione nel scegliere un Paese', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#geopoliticai');
  await italiaInEuropa(page).click();
  await expect(page).toHaveURL(/area=italia/);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

for (const width of [320, 360]) {
  test(`${width}px: nessuno scorrimento orizzontale`, async ({ page }) => {
    await page.setViewportSize({ width, height: 780 });
    await page.goto('/');
    expect(await noHorizontalScroll(page)).toBe(true);
    for (const id of TEMI) {
      await page.goto(`/#${id}`);
      await page.reload();
      await expect(page.locator(`#detail-${id}`)).toBeVisible();
      expect(await noHorizontalScroll(page), id).toBe(true);
    }
    await page.goto('/#competenze/mcp');
    await page.reload();
    await expect(page.locator('#h-competenze')).toHaveText('Model Context Protocol (MCP)');
    expect(await noHorizontalScroll(page), 'competenze/mcp').toBe(true);
  });
}

test('tema scuro', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(11, 11, 10)');
});

test('riduci movimento: nessuna animazione all’apertura', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('#tile-norme .face').click();
  await expect(page.locator('#detail-norme')).toBeVisible();
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

// Un test per pagina: axe su tutte le card in un test solo supera i 30 s.
test('accessibilità: nessuna violazione grave in home', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('button.face')).toHaveCount(9);
  expect(await seriousViolations(page)).toEqual([]);
});

for (const id of TEMI) {
  test(`accessibilità: nessuna violazione grave nella card ${id}`, async ({ page }) => {
    await page.goto(`/#${id}`);
    await expect(page.locator(`#detail-${id}`)).toBeVisible();
    expect(await seriousViolations(page)).toEqual([]);
  });
}

test('accessibilità: in Competenze due regioni non hanno lo stesso nome', async ({ page }) => {
  await page.goto('/#competenze');
  const { violations } = await new AxeBuilder({ page: page as never }).withRules(['landmark-unique']).analyze();
  expect(violations).toEqual([]);
});

test('accessibilità: nessuna violazione grave in competenze/mcp', async ({ page }) => {
  await page.goto('/#competenze/mcp');
  await expect(page.locator('#h-competenze')).toHaveText('Model Context Protocol (MCP)');
  expect(await seriousViolations(page)).toEqual([]);
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`accessibilità con un ruolo scelto, tema ${colorScheme}: le competenze attenuate restano leggibili`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/#competenze?ruolo=dati');
    await page.reload();
    await expect(page.locator('#detail-competenze .altro').first()).toBeVisible();
    expect(await seriousViolations(page)).toEqual([]);
  });
}

const SETTORI = ['Adozione per settore, Italia e UE', "A cosa serve l'AI, Italia e UE", 'Le barriere di chi non la usa, Italia e UE'];

test('Business in tema scuro: i grafici dei settori senza violazioni gravi', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/#business');
  await page.reload();
  for (const name of SETTORI) await expect(page.getByRole('img', { name })).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);
});

test('Business a 320px: i grafici dei settori senza scorrimento orizzontale', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/#business');
  await page.reload();
  for (const name of SETTORI) await expect(page.getByRole('img', { name })).toBeVisible();
  await expect(page.getByText(/^Eurostat non rileva finanza/)).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);
});

const COMPETENZE_ITALIA = 'Competenze più chieste negli annunci';

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Persone a 320px, tema ${colorScheme}: le competenze più chieste in Italia, con la tabella aperta, senza scorrimento né violazioni gravi`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.setViewportSize({ width: 320, height: 780 });
    await page.goto('/#persone');
    await page.reload();
    const blocco = page.getByRole('region', { name: COMPETENZE_ITALIA });
    await expect(blocco.getByRole('img', { name: COMPETENZE_ITALIA })).toBeVisible();
    await blocco.getByText('Vedi i dati').click();
    await expect(blocco.getByRole('columnheader', { name: 'Annunci in Italia' })).toBeAttached();
    await expect(blocco.getByRole('row', { name: /Agenti AI/ })).toContainText('460');
    expect(await noHorizontalScroll(page)).toBe(true);
    expect(await seriousViolations(page)).toEqual([]);
  });
}

test('Persone: le competenze più chieste restano quelle italiane con qualsiasi mercato, nel link o ricordato', async ({ page }) => {
  const righe = async () => {
    await page.reload();
    const blocco = page.getByRole('region', { name: COMPETENZE_ITALIA });
    await blocco.getByText('Vedi i dati').click();
    return blocco.getByRole('row').allTextContents();
  };
  await page.goto('/#persone');
  const senzaScelta = await righe();
  expect(senzaScelta[1]).toContain('Agenti AI');
  expect(senzaScelta[1]).toContain('37,1');
  await page.goto('/#persone?mercato=italia');
  expect(await righe()).toEqual(senzaScelta);
  await page.evaluate(() => localStorage.setItem('ai-radar:mercato', 'italia'));
  await page.goto('/#persone');
  expect(await righe()).toEqual(senzaScelta);
});

test('Business: si legge prima l’adozione, la risposta al titolo, poi gli investimenti', async ({ page }) => {
  await page.goto('/#business');
  const y = async (name: string) => (await page.getByRole('group', { name }).boundingBox())!.y;
  expect(await y('Adozione')).toBeLessThan(await y('Investimenti'));
});

test('Business a 1440px: «Adozione per settore» resta sotto il titolo «Adozione», non sale fra gli investimenti', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#business');
  await page.reload();
  const titolo = await page.getByRole('heading', { name: 'Adozione', exact: true }).boundingBox();
  const blocco = await page.getByRole('heading', { name: /^Adozione per settore/ }).boundingBox();
  expect(blocco!.y).toBeGreaterThan(titolo!.y + titolo!.height);
});

const menuSettore = (page: Page) => page.getByRole('combobox', { name: 'Il tuo settore' });

test('settore: il link lo sceglie, il ricaricamento lo tiene, un link con un altro settore vince sul ricordo', async ({ page }) => {
  await page.goto('/#business?settore=ict');
  await page.reload();
  await expect(menuSettore(page)).toHaveValue('ict');
  await expect(page.getByRole('img', { name: 'Adozione in Informazione e comunicazione, Italia e UE' })).toBeVisible();
  await page.goto('about:blank');
  await page.goto('/#business'); // senza settore nel link: vale il ricordo, che entra nel link
  await expect(menuSettore(page)).toHaveValue('ict');
  await expect(page).toHaveURL(/#business\?settore=ict$/);
  await page.goto('about:blank');
  await page.goto('/#business?settore=manifattura');
  await expect(menuSettore(page)).toHaveValue('manifattura');
  await page.goto('about:blank');
  await page.goto('/#business');
  await expect(menuSettore(page)).toHaveValue('manifattura');
});

test('settore da tastiera: le frecce cambiano settore e link; «Tutti» toglie il settore dal link', async ({ page }) => {
  await page.goto('/#business');
  await menuSettore(page).focus();
  await page.keyboard.press('ArrowDown');
  await expect(menuSettore(page)).toHaveValue('manifattura');
  await expect(page).toHaveURL(/#business\?settore=manifattura$/);
  await expect(page.getByRole('heading', { name: 'Adozione in Manifattura, 2021-2025' })).toBeVisible();
  await expect(menuSettore(page)).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(menuSettore(page)).toHaveValue('tutti');
  await expect(page).toHaveURL(/#business$/);
  await expect(page.getByRole('heading', { name: /^Adozione in/ })).toHaveCount(0);
});

test('Per la tua organizzazione: scelto un settore nella card, con un dato appena uscito, la home lo mostra e riapre la card con il settore', async ({ page }) => {
  // dati dei settori usciti l'1 ottobre: negli ultimi 30 giorni rispetto al 15
  await page.route('**/data/eurostat_settori.json', (route) =>
    route.fulfill({ json: { ...FIXTURE.eurostat_settori, aggiornato_eurostat: '2026-10-01T11:00:00+0200' } }));
  await page.goto('/#business');
  await menuSettore(page).selectOption('manifattura');
  await page.keyboard.press('Escape');
  await expect(page.locator('section.detail')).toHaveCount(0);
  const porta = page.getByRole('link', { name: /Per la tua organizzazione · Manifattura/ });
  await expect(porta).toContainText("15% delle imprese manifatturiere italiane usa l'AI (UE: 17%)");
  await porta.click();
  await expect(page).toHaveURL(/#business\?settore=manifattura$/);
  await expect(menuSettore(page)).toHaveValue('manifattura');
});

test('settore a 320px: menu, andamento e confronti senza scorrimento orizzontale', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/#business?settore=immobiliare');
  await page.reload();
  await expect(menuSettore(page)).toHaveValue('immobiliare');
  await expect(page.getByRole('img', { name: 'Adozione in Immobiliare, Italia e UE' })).toBeVisible();
  await expect(page.getByText('Dato italiano non affidabile secondo Eurostat per: Logistica.')).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);
});

test('settore scelto in tema scuro: nessuna violazione grave', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/#business?settore=manifattura');
  await page.reload();
  await expect(page.getByRole('img', { name: 'Adozione in Manifattura, Italia e UE' })).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);
});

test('ancora interna con una card aperta: la pagina va all’ancora, non alle card', async ({ page }) => {
  await page.goto('/');
  await page.locator('#tile-business .face').click();
  await expect(page.locator('#detail-business')).toBeVisible();
  await page.getByRole('navigation', { name: 'Pagina' }).getByRole('link', { name: 'Stato delle fonti' }).click();
  await expect(page.locator('section.detail')).toHaveCount(0);
  await scrollSettled(page);
  await expect(page.locator('#stato')).toBeInViewport();
});

for (const width of [768, 1280, 1920]) {
  test(`${width}px, un file bloccato e una card aperta dal link: «Quali» porta allo stato delle fonti`, async ({ page }) => {
    await page.route('**/data/radar.json', (route) => route.fulfill({ status: 500, body: '' }));
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/#competenze');
    await scrollSettled(page);
    await page.getByRole('alert').getByRole('link', { name: 'Quali' }).click();
    await expect(page.locator('section.detail')).toHaveCount(0);
    await scrollSettled(page);
    await expect(page.getByRole('region', { name: 'Stato delle fonti' })).toBeInViewport();
  });
}

test.describe('sul telefono, senza un mouse', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 800 } });
  test('Movimenti: le istruzioni dicono di toccare, non di passare sopra', async ({ page }) => {
    await page.goto('/#competenze');
    const movimenti = page.getByRole('region', { name: 'Radar delle competenze' });
    await expect(movimenti.getByText('Tocca una riga per aprirla.')).toBeVisible();
    await expect(movimenti.getByText(/^Passa sopra una riga/)).toBeHidden();
  });
});

test('il salto al contenuto: in home porta al titolo, e il Tab dopo alla prima porta', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Vai al contenuto' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: /^Per te/ })).toBeFocused();
});

for (const width of [390, 1280]) {
  test(`${width}px, il salto al contenuto con una card aperta: porta al suo titolo, e la card resta aperta`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/#business');
    await scrollSettled(page);
    await page.evaluate(() => scrollTo(0, 0));
    await page.getByRole('link', { name: 'Vai al contenuto' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#h-business')).toBeFocused();
    await scrollSettled(page);
    await expect(page.locator('#h-business')).toBeInViewport();
    await expect(page).toHaveURL(/#business$/);
  });
}

test('tutti i dati bloccati: il salto al contenuto ha ancora dove andare', async ({ page }) => {
  await page.route('**/data/*.json', (route) => route.fulfill({ status: 500, body: '' }));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Non riesco a caricare i dati.');
  await page.getByRole('link', { name: 'Vai al contenuto' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('alert')).toBeFocused();
});

test('Stato delle fonti, tabella impilata: ogni valore resta sotto il nome della sua colonna, e una nota lunga non spezza le parole', async ({ page }) => {
  await page.goto('/');
  const stato = page.getByRole('region', { name: 'Stato delle fonti' });
  await stato.getByText(/Vedi le \d+ fonti/).click();
  const adzuna = stato.getByRole('row', { name: /^Adzuna/ });
  // sotto il nome della colonna (16px), anche se la nota accanto è più alta
  const dalNome = await adzuna.getByRole('cell', { name: /non configurata/ }).evaluate((td) => {
    const r = document.createRange();
    r.selectNodeContents(td);
    return r.getBoundingClientRect().top - td.getBoundingClientRect().top;
  });
  expect(dalNome).toBeLessThan(24);
  // la parola si cerca come con Ctrl+F: compare anche nell'elenco delle fonti da controllare, e sta su una riga dappertutto
  const righe = await page.evaluate(() => {
    const trovate: number[] = [];
    getSelection()?.removeAllRanges();
    while ((window as Window & { find?: (s: string) => boolean }).find?.('ADZUNA_APP_ID/ADZUNA_APP_KEY')) {
      trovate.push(new Set([...getSelection()!.getRangeAt(0).getClientRects()].map((x) => Math.round(x.top))).size);
    }
    return trovate;
  });
  expect(new Set(righe)).toEqual(new Set([1]));
});

for (const width of [320, 360]) {
  test(`${width}px: le pillole dicono il nome della loro testa, e la pagina non scorre di lato`, async ({ page }) => {
    await page.setViewportSize({ width, height: 640 });
    await page.goto('/#rapporti');
    const pillole = page.getByRole('navigation', { name: 'Altre card' });
    // parte dalla testa della card aperta: si legge dove si è
    await expect(pillole.getByRole('group', { name: "L'AI in Italia" }).getByText("L'AI in Italia")).toBeInViewport();
    await expect(pillole.getByRole('group', { name: 'Su cosa formarti' }).getByText('Su cosa formarti')).toBeAttached();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('360px: all’apertura il titolo della card è nella finestra, sotto le pillole', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/');
  await page.locator('#tile-rapporti .face').click();
  await expect(page.locator('#detail-rapporti')).toBeVisible();
  await scrollSettled(page);
  await expect(page.locator('#h-rapporti')).toBeInViewport();
  await expect.poll(async () => {
    const pills = await page.locator('nav[aria-label="Altre card"]').boundingBox();
    const det = await page.locator('#detail-rapporti').boundingBox();
    return pills && det ? det.y >= pills.y + pills.height : false;
  }).toBe(true);
});

test('Esc due volte di fila dalla pagina di una competenza: un solo salto, si resta nel sito', async ({ page }) => {
  await page.goto('/?esterna');
  await page.goto('/');
  await page.getByRole('button', { name: /^Competenze/ }).click();
  await page.evaluate(() => document.dispatchEvent(new CustomEvent('ai-radar:apri', { detail: { tema: 'competenze', elemento: 'mcp' } })));
  await expect(page).toHaveURL(/#competenze\/mcp$/);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(page.locator('#detail-competenze')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});

const box = async (page: Page, sel: string) => (await page.locator(sel).first().boundingBox())!;

test('1440px: in home intro e porte a sinistra delle card', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const intro = await box(page, '.intro');
  const temi = await box(page, '#temi');
  expect(intro.x + intro.width).toBeLessThanOrEqual(temi.x);
  expect(Math.abs(intro.y - temi.y)).toBeLessThan(40);
  expect(await noHorizontalScroll(page)).toBe(true);
});

test('1440px: card aperta con le altre in elenco accanto, senza intro né pillole; dall’elenco un solo indietro torna alla home', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.locator('#tile-business .face').click();
  await expect(page.locator('#detail-business')).toBeVisible();
  await expect(page.getByRole('link', { name: /Per te/ })).toBeHidden(); // né le porte
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeAttached(); // la h1 resta per i lettori di schermo
  await expect(page.locator('nav[aria-label="Altre card"]')).toBeHidden();
  await expect(page.locator('button.face:visible')).toHaveCount(9);
  await expect(page.locator('#tile-business .face')).toHaveAttribute('aria-expanded', 'true');
  const elenco = await box(page, '#temi');
  const det = await box(page, '#detail-business');
  expect(elenco.x + elenco.width).toBeLessThanOrEqual(det.x);
  await page.locator('#tile-norme .face').click();
  await expect(page.locator('#detail-norme')).toBeVisible();
  await expect(page).toHaveURL(/#norme$/);
  await page.goBack();
  await expect(page.locator('section.detail')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.intro')).toBeVisible();
});

test('1920px: foto piccola accanto al titolo, il primo grafico nella finestra, nessuna riga di blocchi lasciata a metà', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/#modelli');
  const det = page.locator('#detail-modelli');
  await expect(det).toBeVisible();
  const pagina = (await det.boundingBox())!;
  const foto = (await det.getByRole('figure').boundingBox())!;
  const titolo = (await det.getByRole('heading', { level: 2 }).boundingBox())!;
  expect(foto.width).toBeLessThan(pagina.width / 2);
  expect(titolo.x + titolo.width).toBeLessThanOrEqual(foto.x);
  // i blocchi sono le regioni della pagina, ognuna col titolo del suo grafico
  const regioni = det.getByRole('region').filter({ has: page.getByRole('heading', { level: 3 }) });
  await expect(regioni).toHaveCount(await det.getByRole('heading', { level: 3 }).count());
  await expect(regioni.first()).toBeInViewport();
  // dodici colonne a ogni larghezza: in ogni riga i blocchi vanno dal bordo sinistro della pagina al destro
  const blocchi = await regioni.evaluateAll((els) => els.map((e) => {
    const r = e.getBoundingClientRect();
    return { top: Math.round(r.top), x0: r.left, x1: r.right };
  }));
  const righe = Object.values(blocchi.reduce<Record<number, { x0: number; x1: number }[]>>((m, b) => ({ ...m, [b.top]: [...(m[b.top] ?? []), b] }), {}));
  expect(righe.length).toBeGreaterThan(1);
  for (const riga of righe) {
    expect(Math.min(...riga.map((b) => b.x0))).toBeCloseTo(pagina.x, 0);
    expect(Math.max(...riga.map((b) => b.x1))).toBeCloseTo(pagina.x + pagina.width, 0);
  }
});
