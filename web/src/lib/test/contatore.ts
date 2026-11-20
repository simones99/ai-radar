// Le prove del contatore delle visite leggono le pagine come un motore, senza eseguire niente, e la riga come la trova un lettore di schermo.
// Le usano la mappa dei file pubblici e il sito costruito.
import { within } from '@testing-library/svelte';

/** L'ID del sito Umami di AI Radar, come lo dà Umami. */
export const ID = 'bb5f6910-f64e-4045-879e-df65209b7ad5';

/** Le voci HTML di una mappa da percorso a contenuto, lette come le legge un motore: senza eseguire niente. */
export const pagine = (file: Record<string, string>) =>
  Object.entries(file).filter(([percorso]) => percorso.endsWith('.html')).map(([percorso, html]) => [percorso, new DOMParser().parseFromString(html, 'text/html')] as const);

/** Gli script di una pagina che vengono da Umami, scritti bene o male. */
export const scriptDiUmami = (doc: Document) => [...doc.querySelectorAll('script[src*="umami"]')];

/**
 * Il piè di pagina, come lo trova chi usa un lettore di schermo. hidden: true perché la pagina letta non ha una finestra che calcoli
 * gli stili; che la riga non sia nascosta lo prova la sua prova.
 */
export const piede = (doc: Document) => within(doc.body).getByRole('contentinfo', { hidden: true });

/** Le righe del piè di pagina che parlano del contatore. */
export const righeSulContatore = (doc: Document) => within(piede(doc)).queryAllByText(/Il sito conta le visite con/);
