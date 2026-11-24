// I testi fissi della pagina di una competenza e il metodo della card: gli stessi nell'app e nella pagina statica, scritti una volta sola.
import type { RepoNuovo, Risorsa } from '../data/types';
import { dayWith, isDay, monthShort, nf } from './format';

/** I due mercati, con i nomi dei bottoni dell'app: gli stessi nella pagina statica e nella sua anteprima. */
export const MERCATI = { tutti: 'Tutti i Paesi', italia: 'Italia' } as const;

/** Una parte fissa della pagina di una competenza: il titolo, la nota sotto, e la frase che ne prende il posto quando non c'è niente da mostrare. */
export interface TestiParte { titolo: string; nota: string; vuota: string }

export const PERCORSO: TestiParte = {
  titolo: 'Il percorso sul radar',
  nota: 'Il quadrante di ogni mese. Cambia solo dopo due mesi di fila nel quadrante nuovo.',
  vuota: 'Lo storico arriva con i prossimi aggiornamenti.',
};
/** Un mese del percorso: «set 2026». */
export const meseDelPercorso = (mese: string): string => `${monthShort(mese)} ${mese.slice(0, 4)}`;

export const PER_INIZIARE: TestiParte = { titolo: 'Per iniziare', nota: 'Scelte a mano, gratuite.', vuota: 'Nessuna risorsa disponibile.' };
/** Accanto al titolo di una risorsa: il tipo, e la lingua se non è l'italiano. */
export const metaRisorsa = (r: Risorsa): string => `${r.tipo}${r.lingua !== 'it' ? ' · in inglese' : ''}`;

export const IN_CRESCITA: TestiParte = {
  titolo: 'Cosa si muove adesso',
  nota: 'I repository con il suo topic creati negli ultimi 90 giorni, i più stellati.',
  vuota: 'Nessun repository nuovo con questo topic negli ultimi 90 giorni.',
};
/** Accanto al nome di un repository: le stelle e quando è nato. Senza una data leggibile la data non si scrive. */
export const metaRepository = (r: RepoNuovo): string =>
  `${nf(r.stelle)} stelle${isDay(r.creato?.slice(0, 10) ?? '') ? ` · creato ${dayWith('il', r.creato)}` : ''}`;

/** Al posto delle misure, quando la competenza non sta sul radar nemmeno con tutti i Paesi: nella pagina statica e nella sua descrizione. */
export const COMPETENZA_SENZA_DATI = 'I dati di questa competenza non sono disponibili in questo momento.';

/**
 * Il metodo delle competenze, con il modo di dire i due mercati: nella card sono i bottoni, nella pagina statica, che non li ha, sono parole.
 * Il resto è lo stesso testo, scritto una volta sola.
 */
const metodo = ({ italia, tutti }: { italia: string; tutti: string }): string[] => [
  'Slancio: quanto è cambiata negli ultimi 6 mesi interi la quota della competenza sul totale dell’AI. Si stima con una retta sui dati di ogni mese, non confrontando solo due periodi.',
  'Paper: quota dei paper AI su arXiv che la citano nell’abstract. Repository: quota dei nuovi repository GitHub con il suo topic sui nuovi repository AI (topic llm, ai, artificial-intelligence, generative-ai). Annunci: quota degli annunci che la citano, quando ci sono almeno 8 settimane di rilevazioni con la stessa ricerca.',
  'I segnali si combinano pesando di più quelli più precisi; nessuno pesa più di due terzi.',
  'Domanda: annunci attivi che citano la competenza ogni 10.000 annunci del Paese. Ogni Paese vale la mediana delle sue ultime 4 rilevazioni con la stessa ricerca, così una settimana strana non sposta il numero. Il Paese a metà classifica è la mediana tra gli 8 Paesi: con un numero pari di Paesi, il valore a metà tra i due centrali. Il metodo è cambiato a novembre 2026: prima contava solo l’ultima rilevazione, e un solo Paese poteva spostare il valore.',
  'Quadranti a soglie fisse. Slancio sopra 0 (cresce più dell’AI) e almeno 3 annunci ogni 10mila: Impara ora. Solo lo slancio: Da provare. Solo la domanda: Da consolidare. Nessuna delle due: Tieni d’occhio.',
  'Prudenza: il quadrante cambia solo se il calcolo di due mesi di fila dà il quadrante nuovo. Nel frattempo la competenza è «in movimento verso» il quadrante nuovo.',
  `${italia} la domanda è quella italiana, la mediana delle ultime 4 rilevazioni in Italia, e accanto si legge il numero di annunci che ci sta dietro. Lo slancio è unico: la crescita si misura nel mondo e non cambia. La soglia è la stessa, 3 annunci ogni 10mila. I quadranti sono propri, con la stessa conferma di due mesi di fila.`,
  'Dato incerto (punto vuoto): il margine all’80% dello slancio è largo, l’estremo alto supera di oltre il 55% quello basso. Succede con pochi paper o repository, o con andamenti irregolari. Un margine che comprende lo zero non basta a rendere incerto il dato, ma dice che la competenza potrebbe non crescere più dell’AI.',
  `${italia} il dato è incerto anche quando la domanda è troppo vicina alla soglia: la soglia in annunci, 3 ogni 10mila annunci italiani, cioè qualche decina, cade dentro il margine all’80% del numero di annunci italiani della competenza. Il conto di una settimana oscilla di circa la sua radice quadrata, e lì pochi annunci decidono il quadrante, che resta quello calcolato. Una competenza con pochissimi annunci, molto sotto la soglia, resta invece un dato solido: uno o due annunci in più o in meno non la portano sopra. ${tutti} conta solo lo slancio.`,
  'Le parole cercate per ogni competenza sono in config/skills.yaml. Negli annunci si cerca per tutte una frase esatta in inglese, così le competenze sono confrontabili.',
];

/** Il metodo nella card Competenze, che ha i bottoni dei due mercati. */
export const METODO_COMPETENZE = metodo({ italia: 'Con «Italia»', tutti: 'Con «Tutti i Paesi»' });
/** Il metodo nella pagina statica di una competenza: non ha bottoni, e dice i mercati senza nominarli. */
export const METODO_COMPETENZE_IN_PAGINA = metodo({ italia: 'In Italia', tutti: 'Con tutti i Paesi' });
