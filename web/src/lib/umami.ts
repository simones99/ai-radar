// Il contatore delle visite, con Umami Cloud: l'ID del sito arriva dal workflow in AI_RADAR_UMAMI_ID, che lo prende dalla variabile
// del repository UMAMI_WEBSITE_ID. Senza, il sito esce senza contatore: è lo stato delle build in locale e delle copie del progetto.
import { esc } from './statico/pagina';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** L'indirizzo dello script di Umami Cloud: chi scrive il tag e chi lo riconosce usano questo. */
export const SCRIPT_DI_UMAMI = 'https://cloud.umami.is/script.js';

/** L'ID del sito Umami, o null se non c'è. Un valore che non è un UUID ferma la build: altrimenti non si conterebbe niente, senza saperlo. */
export function idUmami(valore: string | undefined): string | null {
  if (!valore) return null;
  if (!UUID.test(valore)) throw new Error(`AI_RADAR_UMAMI_ID deve essere l'ID di un sito Umami, un UUID come bb5f6910-f64e-4045-879e-df65209b7ad5, non «${valore}»`);
  return valore;
}

/** Un ID che nessun sito Umami ha: gli end-to-end in locale lo usano perché le prove del contatore girino, e non conta niente. */
const ID_DI_PROVA = '00000000-0000-4000-8000-000000000000';

/**
 * L'ID con cui gira la build degli end-to-end. Nel workflow (CI) è la build che viene pubblicata: ha solo l'ID del repository, e senza
 * la variabile esce senza contatore, come il sito. In locale, senza un ID, ne usa uno di prova.
 */
export function idDegliEndToEnd({ CI, AI_RADAR_UMAMI_ID }: { CI?: string; AI_RADAR_UMAMI_ID?: string }): string {
  if (AI_RADAR_UMAMI_ID) return AI_RADAR_UMAMI_ID;
  return CI ? '' : ID_DI_PROVA;
}

/**
 * Lo script di Umami Cloud per il <head> di una pagina, con i valori predefiniti di Umami per tutto il resto. Conta solo sull'host
 * dell'indirizzo base: le prove in locale, gli end-to-end e le copie pubblicate altrove con lo stesso ID non mandano niente.
 */
export function scriptUmami(id: string, indirizzoBase: string): string {
  // gli attributi si scrivono come quelli delle pagine: un valore non controllato resta un valore, e non diventa HTML
  return `<script defer src="${SCRIPT_DI_UMAMI}" data-website-id="${esc(id)}" data-domains="${esc(new URL(indirizzoBase).hostname)}"></script>`;
}

/** La pagina ha lo script di Umami, come lo scrive scriptUmami: l'app lo chiede alla pagina in cui gira, invece di farselo dire dalla build. */
export const haLoScriptDiUmami = (pagina: Document): boolean => pagina.querySelector(`script[src="${SCRIPT_DI_UMAMI}"]`) !== null;
