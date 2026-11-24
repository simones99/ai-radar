// Il sito costruito senza ID di Umami, com'è nel workflow quando manca la variabile UMAMI_WEBSITE_ID: la build degli end-to-end è quella
// pubblicata, e non deve avere né lo script né la riga. Con un ID, o in locale con quello di prova di playwright.config.ts, la prova si salta:
// il contatore acceso lo prova contatore.spec.ts.
import { expect, test } from '@playwright/test';
import { leggiDati } from '../../src/lib/data/cartella';
import { cartellaDeiDati } from '../../src/lib/data/cartellaDeiDati';

const DATI = cartellaDeiDati();
const COMPETENZA = leggiDati(DATI, ['radar']).radar?.competenze[0]?.id;

test.skip(!!process.env.AI_RADAR_UMAMI_ID, 'la build ha l’ID di Umami: il contatore acceso lo prova contatore.spec.ts');

for (const [nome, indirizzo] of [['la home', '/'], ['l’indice delle competenze', '/competenze/'], ['una pagina di competenza', `/competenze/${COMPETENZA}/`]] as const) {
  test(`senza ID ${nome} esce senza lo script di Umami e senza la riga sul contatore`, async ({ request }) => {
    expect(COMPETENZA, 'nella cartella dei dati non ci sono competenze').toBeTruthy();
    const risposta = await request.get(indirizzo);
    expect(risposta.ok(), indirizzo).toBe(true);
    expect(await risposta.text()).not.toMatch(/umami/i);
  });
}

// il server di prova, come quello di un'app, può rispondere con la home a un indirizzo che non c'è: conta che la pagina non sia uscita
test('senza ID la pagina Privacy non esce, né nella sitemap: descrive un contatore che non c’è', async ({ request }) => {
  expect(await (await request.get('/privacy/')).text()).not.toMatch(/titolare del trattamento/);
  expect(await (await request.get('/sitemap.xml')).text()).not.toMatch(/privacy/);
});
