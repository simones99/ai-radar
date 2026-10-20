// Una scelta che sta nel link (?ruolo=) ed è ricordata nel browser con la chiave ai-radar:<parametro>.
// Senza storage (bloccato, finestra privata) la pagina funziona: la scelta va nel link ma non resta.
import { imposta } from './router';

let versione = $state(0); // cresce a ogni scelta: chi legge un ricordo in un $derived si aggiorna

export type SceltaRicordata = {
  /** Il valore ricordato, così com'è: chi lo usa ignora quelli che non conosce. */
  ricordato(): string | null;
  /** Lo mette nel link e lo ricorda; null ("Tutti") toglie l'uno e l'altro. */
  scegli(valore: string | null): void;
  /**
   * All'apertura della card: il valore del link vince e diventa il ricordato; senza (o sconosciuto) vale il ricordo,
   * che entra nel link senza aggiungere passi alla cronologia. Un valore fuori da `validi` si ignora.
   */
  allinea(nelLink: string | undefined, validi: readonly string[]): void;
};

export function sceltaRicordata(parametro: string): SceltaRicordata {
  const chiave = `ai-radar:${parametro}`;
  const ricordato = (): string | null => {
    void versione;
    try {
      return localStorage.getItem(chiave);
    } catch {
      return null;
    }
  };
  const ricorda = (valore: string | null): void => {
    try {
      if (valore) localStorage.setItem(chiave, valore);
      else localStorage.removeItem(chiave);
    } catch {
      // niente storage: la scelta non resta
    }
    versione++;
  };
  return {
    ricordato,
    scegli(valore) {
      ricorda(valore);
      imposta(parametro, valore);
    },
    allinea(nelLink, validi) {
      const valido = (v: string | null | undefined) => (v && validi.includes(v) ? v : null);
      const link = valido(nelLink);
      if (link) return ricorda(link);
      const mem = valido(ricordato()); // un ricordo di un valore che non c'è più si ignora
      if (mem || nelLink) imposta(parametro, mem); // senza ricordo, un valore sconosciuto esce dal link
    },
  };
}

/** Il ruolo (card Competenze, porta Per te). */
export const ruolo = sceltaRicordata('ruolo');
/** Il settore (card Business, porta Per la tua organizzazione). */
export const settore = sceltaRicordata('settore');
