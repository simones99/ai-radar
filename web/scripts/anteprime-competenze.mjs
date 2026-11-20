// Fotografa l'anteprima di ogni competenza al posto del segnaposto della build: `npm run anteprime-competenze`, dopo `npm run build`.
// Il sito costruito è in _site, o dove dice --sito; i dati si leggono da AI_RADAR_DATA_DIR, come fanno la build e la pipeline, o da data/.
// È sottile apposta: il giro sta in src/lib/statico/cartella.ts, l'immagine in src/lib/statico/immagine.ts. Girano qui passando da Vite in modalità SSR.
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { runnerImport } from 'vite';

const { values } = parseArgs({ options: { sito: { type: 'string', default: fileURLToPath(new URL('../../_site', import.meta.url)) } } });
const dati = process.env.AI_RADAR_DATA_DIR ?? fileURLToPath(new URL('../../data', import.meta.url));
const modulo = async (nome) => (await runnerImport(fileURLToPath(new URL(`../src/lib/statico/${nome}.ts`, import.meta.url)), { logLevel: 'error' })).module;

// Playwright si carica e il browser si apre solo alla prima immagine da fare, e una volta sola per tutte
let fotografo;
const fotografa = async (a) => {
  fotografo ??= await (await modulo('immagine')).apriFotografo();
  return fotografo.fotografa(a);
};

try {
  console.log(await (await modulo('cartella')).scriviAnteprime({ dati, sito: values.sito, fotografa }));
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1; // per il workflow il sito esce lo stesso, con i segnaposto, e il giro finisce in rosso
} finally {
  await fotografo?.chiudi();
}
