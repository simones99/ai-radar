# Standard del codice

Le regole che valgono in tutto il repo e che nessun controllo automatico vede. Le specs in `.scratch/` le danno per scontate: qui sono scritte una volta sola.

## Test

- **Solo il comportamento esterno.** Un test guarda il JSON che la pipeline scrive, il testo e i ruoli che la card mostra, l'URL. Regge un refactoring che non cambia quello che vede chi legge. Per questo non legge funzioni interne, stati, classi CSS, nomi di keyframe o la forma del DOM (`nextElementSibling`).
- **I test web partono dal `FIXTURE`** di `web/src/lib/test/fixtures.ts`, che rispetta la forma dei JSON della pipeline. Un campo nuovo in un JSON entra insieme in `web/src/lib/data/types.ts` e nel `FIXTURE`.
- **I file curati in `config/`** si validano nel loro passo e si provano sul modello di `tests/test_curated.py`: il file nel repo è valido, e i file sbagliati sono rifiutati con un messaggio chiaro.

## Pipeline

- **Un passo che fallisce lascia il file precedente** e lo dice nel log e in `status.json`: rete giù, colonne cambiate, pagina illeggibile. Mai un file vuoto o scritto a metà.

## Web

- **Ogni scelta sta nel link**, con un parametro `?nome=`: i valori non validi si ignorano, e un link vince sul ricordo.
- **Ogni vista nuova regge**: pulsanti di scelta con `aria-pressed`, tastiera, nessuno scorrimento orizzontale a 320 px, tema scuro, «riduci movimento» senza animazioni. Gli end-to-end in `web/tests/e2e/dashboard.spec.ts` lo provano.

## Dominio

- **Codice, test e testi usano i termini di `GLOSSARY.md`.** Un concetto nuovo che il glossario non ha si propone con `domain-modeling`; un sinonimo che il glossario evita non entra. Un contrasto con un ADR in `docs/adr/` si segnala.
