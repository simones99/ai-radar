// La tabella unica delle fonti: per ogni card, chi ha dato i numeri e con quale licenza, letti dai dati quando ci sono.
// Le frasi delle card non portano fonti e la meta di una porta è una riga di testo: per ricontrollare una riga dell'edizione serve questa.
import { nextDeadline, nextReport } from '../data/derive';
import type { Dataset } from '../data/types';
import type { TileId } from '../router';
import { NOMI_FONTI } from '../text/fonti';
import { CHI_ADDESTRA } from '../text/geopoliticai';
import type { Destinazione, Fonte, FonteNonAggiornata } from './tipi';

// Chi non pubblica con una licenza aperta si riusa alle sue condizioni: lo diciamo così, senza attribuirgli una licenza che non ha.
const ARXIV: Fonte = { nome: 'arXiv', url: 'https://arxiv.org', licenza: 'metadati CC0' };
const GITHUB: Fonte = { nome: 'GitHub', url: 'https://github.com', licenza: "termini d'uso di GitHub" };
const ADZUNA: Fonte = { nome: 'The Adzuna API', url: 'https://www.adzuna.co.uk', licenza: "termini d'uso di Adzuna" };

// Una voce per card: se ne manca una, è un errore di tipo.
const TABELLA: Record<TileId, (d: Dataset, oggi: Date, elemento: string | null) => Fonte[]> = {
  competenze: () => [ARXIV, GITHUB, ADZUNA],
  modelli: (d) => [{ nome: 'Epoch AI', url: d.epoch?.url ?? 'https://epoch.ai/data/ai-models', licenza: 'CC BY 4.0' }],
  open: (d) => [{ nome: 'Hugging Face', url: d.huggingface?.url ?? 'https://huggingface.co', licenza: "termini d'uso di Hugging Face" }],
  notizie: () => [], // nessuna porta ci arriva e la sua riga non ha fonti: ogni notizia ha accanto la sua
  business: (d) => [{ nome: 'Eurostat', url: d.eurostat?.url ?? 'https://ec.europa.eu/eurostat', licenza: 'CC BY 4.0' }],
  geopoliticai: (d, _oggi, elemento) => {
    const g = d.geopoliticai;
    // la porta su chi addestra i modelli di grande scala conta i modelli; la card riporta la capacità
    const [dato, url] = elemento === CHI_ADDESTRA ? ['Data on AI models', g?.url_modelli ?? 'https://epoch.ai/data/ai-models'] : ['Epoch Capabilities Index', g?.url_eci ?? 'https://epoch.ai/eci'];
    return [{ nome: `${g?.fonte ?? 'Epoch AI'}, ${dato}`, url, licenza: g?.licenza ?? 'CC BY 4.0' }];
  },
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
  dest ? (TABELLA[dest.tema as TileId]?.(d, oggi, dest.elemento) ?? []) : [];

/** Le fonti senza dati aggiornati a questo giro, in errore o non configurate. Un avviso su una fonte aggiornata non conta: i suoi dati ci sono. */
export const fontiNonAggiornate = (d: Dataset): FonteNonAggiornata[] =>
  Object.entries(d.status?.fonti ?? {}).filter(([, s]) => s.stato !== 'ok').map(([id, s]) => ({ id, nome: NOMI_FONTI[id] ?? id, ultimo_successo: s.ultimo_successo ?? null }));
