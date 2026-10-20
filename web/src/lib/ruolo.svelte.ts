// Il ruolo ricordato nel browser. Senza storage (bloccato, finestra privata) la pagina funziona: il ruolo non resta.
const CHIAVE = 'ai-radar:ruolo';
let versione = $state(0); // cresce a ogni ricorda(): chi legge il ricordo in un $derived si aggiorna

export function ricordato(): string | null {
  void versione;
  try {
    return localStorage.getItem(CHIAVE);
  } catch {
    return null;
  }
}

/** null dimentica il ruolo ("Tutti"). */
export function ricorda(id: string | null): void {
  try {
    if (id) localStorage.setItem(CHIAVE, id);
    else localStorage.removeItem(CHIAVE);
  } catch {
    // niente storage: il ruolo non resta
  }
  versione++;
}
