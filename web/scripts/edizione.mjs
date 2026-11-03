// Fissa l'edizione della settimana dei dati e ne genera l'immagine, accanto al file fisso: `npm run edizione -- --evento schedule --casella false`.
// È sottile apposta: il workflow gli passa l'evento e la casella, e tutte le condizioni stanno nel modulo Edizioni, provate senza GitHub Actions.
// I dati si leggono da AI_RADAR_DATA_DIR, come fa la pipeline, o da data/. Le regole sono in TypeScript e girano qui passando da Vite in modalità SSR.
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { runnerImport } from 'vite';

const { values } = parseArgs({ options: { evento: { type: 'string', default: '' }, casella: { type: 'string', default: '' } } });
const dati = process.env.AI_RADAR_DATA_DIR ?? fileURLToPath(new URL('../../data', import.meta.url));
const modulo = async (nome) => (await runnerImport(fileURLToPath(new URL(`../src/lib/edizioni/${nome}.ts`, import.meta.url)), { logLevel: 'error' })).module;
// Playwright si carica solo quando c'è un'immagine da fare: un giro che non crea niente non lo richiede
const fotografa = async (e) => (await modulo('immagine')).fotografa(e);

try {
  const { fissaEdizione } = await modulo('cartella');
  console.log(await fissaEdizione({ evento: values.evento, casella: values.casella === 'true', dati, fotografa }));
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1; // per il workflow è una creazione fallita: dati e sito proseguono, e il giro finisce in rosso
}
