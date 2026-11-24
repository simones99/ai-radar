// Fissa l'edizione della settimana dei dati e ne genera l'immagine, accanto al file fisso: `npm run edizione -- --evento schedule --casella false`.
// Dopo una correzione a mano rifà l'immagine di quell'edizione, e nient'altro: `npm run edizione -- --immagine 2026-11-02`.
// È sottile apposta: il workflow gli passa l'evento e la casella, e tutte le condizioni stanno nel modulo Edizioni, provate senza GitHub Actions.
// I dati si leggono da AI_RADAR_DATA_DIR, come fa la pipeline, o da data/: la regola è in src/lib/data/cartellaDeiDati.ts. Le regole sono in TypeScript e girano qui passando da Vite in modalità SSR.
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { runnerImport } from 'vite';

const { values } = parseArgs({ options: { evento: { type: 'string', default: '' }, casella: { type: 'string', default: '' }, immagine: { type: 'string' } } });
const modulo = async (nome) => (await runnerImport(fileURLToPath(new URL(`../src/lib/${nome}.ts`, import.meta.url)), { logLevel: 'error' })).module;
const dati = (await modulo('data/cartellaDeiDati')).cartellaDeiDati();
// Playwright si carica solo quando c'è un'immagine da fare: un giro che non crea niente non lo richiede
const fotografa = async (e) => (await modulo('edizioni/immagine')).fotografa(e);

try {
  const { fissaEdizione, rifaiImmagine } = await modulo('edizioni/cartella');
  if (values.immagine) {
    console.log(await rifaiImmagine({ settimana: values.immagine, dati, fotografa }));
  } else {
    const { messaggio, creata } = await fissaEdizione({ evento: values.evento, casella: values.casella === 'true', dati, fotografa });
    console.log(messaggio);
    // al workflow, che salva l'edizione solo se è nata in questo giro e con la sua settimana nel messaggio del commit
    if (creata && process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `settimana=${creata}\n`);
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1; // per il workflow è una creazione fallita: dati e sito proseguono, e il giro finisce in rosso
}
