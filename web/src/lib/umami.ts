// Il contatore delle visite, con Umami Cloud: l'ID del sito arriva dal workflow in AI_RADAR_UMAMI_ID, che lo prende dalla variabile
// del repository UMAMI_WEBSITE_ID. Senza, il sito esce senza contatore: è lo stato delle build in locale e delle copie del progetto.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SCRIPT = 'https://cloud.umami.is/script.js';

/** L'ID del sito Umami, o null se non c'è. Un valore che non è un UUID ferma la build: altrimenti non si conterebbe niente, senza saperlo. */
export function idUmami(valore: string | undefined): string | null {
  if (!valore) return null;
  if (!UUID.test(valore)) throw new Error(`AI_RADAR_UMAMI_ID deve essere l'ID di un sito Umami, un UUID come bb5f6910-f64e-4045-879e-df65209b7ad5, non «${valore}»`);
  return valore;
}

/**
 * Lo script di Umami Cloud per il <head> di una pagina, con i valori predefiniti di Umami per tutto il resto. Conta solo sull'host
 * dell'indirizzo base: le prove in locale, gli end-to-end e le copie pubblicate altrove con lo stesso ID non mandano niente.
 */
export function scriptUmami(id: string, indirizzoBase: string): string {
  return `<script defer src="${SCRIPT}" data-website-id="${id}" data-domains="${new URL(indirizzoBase).hostname}"></script>`;
}

/** La pagina ha lo script di Umami, come lo scrive scriptUmami: l'app lo chiede alla pagina in cui gira, invece di farselo dire dalla build. */
export const conIlContatore = (pagina: Document): boolean => pagina.querySelector(`script[src="${SCRIPT}"]`) !== null;
