// Il ruolo ricordato nel browser. Senza storage (bloccato, finestra privata) la pagina funziona: il ruolo non resta.
const CHIAVE = 'ai-radar:ruolo';

export function ricordato(): string | null {
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
    // niente storage: il ruolo vale solo per questa visita
  }
}
