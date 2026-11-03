// La tabella unica delle fonti: per ogni card, chi ha dato i numeri e con quale licenza, letti dai dati quando ci sono.
// Le frasi delle card non portano fonti e la meta di una porta è una riga di testo: per ricontrollare una riga dell'edizione serve questa.
import { nextDeadline, nextReport } from '../data/derive';
import type { Dataset, SourceStatus } from '../data/types';
import { NOMI_FONTI } from '../text/fonti';
import type { Destinazione, Fonte, FonteMuta } from './tipi';

// Chi non pubblica con una licenza aperta si riusa alle sue condizioni: lo diciamo così, senza attribuirgli una licenza che non ha.
const ARXIV: Fonte = { nome: 'arXiv', url: 'https://arxiv.org', licenza: 'metadati CC0' };
const GITHUB: Fonte = { nome: 'GitHub', url: 'https://github.com', licenza: "termini d'uso di GitHub" };
const ADZUNA: Fonte = { nome: 'The Adzuna API', url: 'https://www.adzuna.co.uk', licenza: "termini d'uso di Adzuna" };
const SOLO_LINK = 'solo titolo, data e link agli articoli originali';

const TABELLA: Record<string, (d: Dataset, oggi: Date, elemento: string | null) => Fonte[]> = {
  competenze: () => [ARXIV, GITHUB, ADZUNA],
  modelli: (d) => [{ nome: 'Epoch AI', url: d.epoch?.url ?? 'https://epoch.ai/data/ai-models', licenza: 'CC BY 4.0' }],
  open: (d) => [{ nome: 'Hugging Face', url: d.huggingface?.url ?? 'https://huggingface.co', licenza: "termini d'uso di Hugging Face" }],
  notizie: () => [{ nome: 'I feed delle fonti di ogni notizia', url: null, licenza: SOLO_LINK }],
  business: (d) => [{ nome: 'Eurostat', url: d.eurostat?.url ?? 'https://ec.europa.eu/eurostat', licenza: 'CC BY 4.0' }],
  geopoliticai: (d) => [{ nome: `${d.geopoliticai?.fonte ?? 'Epoch AI'}, Epoch Capabilities Index`, url: d.geopoliticai?.url_eci ?? 'https://epoch.ai/eci', licenza: d.geopoliticai?.licenza ?? 'CC BY 4.0' }],
  persone: (d) => {
    const s = d.owid?.serie?.uso_genai;
    return [{ nome: s?.citazione?.trim() || 'Our World in Data', url: s?.url ?? 'https://ourworldindata.org', licenza: s?.licenza ?? 'indicata dalla fonte' }];
  },
  norme: (d, oggi, elemento) => {
    const s = d.ai_act?.scadenze.find((x) => x.data === elemento) ?? nextDeadline(d.ai_act?.scadenze, oggi);
    return [{ nome: 'AI Act', url: s?.fonte ?? null, licenza: "atto pubblico dell'UE" }];
  },
  rapporti: (d, oggi) => {
    const r = nextReport(d.rapporti, oggi)?.report;
    return [{ nome: r ? `${r.nome}, ${r.editore}` : 'Gli editori dei rapporti', url: r?.url ?? null, licenza: 'solo link e date previste' }];
  },
};

/** Le fonti di una card; una porta eredita quelle della card a cui porta, per la sua scadenza se ne ha una. */
export const fontiDi = (d: Dataset, oggi: Date, dest: Destinazione | null): Fonte[] =>
  dest ? (TABELLA[dest.tema]?.(d, oggi, dest.elemento) ?? []) : [];

const NON_HA_RISPOSTO = (s: SourceStatus) => s.stato !== 'ok';
/** Le fonti rimaste indietro a questo giro. Un avviso su una fonte aggiornata non conta: la fonte ha risposto. */
export const fontiMute = (d: Dataset): FonteMuta[] =>
  Object.entries(d.status?.fonti ?? {}).filter(([, s]) => NON_HA_RISPOSTO(s)).map(([id, s]) => ({ id, nome: NOMI_FONTI[id] ?? id, ultimo_successo: s.ultimo_successo ?? null }));
