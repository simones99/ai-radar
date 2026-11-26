# Edizioni, feed e correzioni

Un'**edizione** riassume una settimana: le due porte, le frasi delle card cambiate dalla settimana prima, fino a 3 notizie per tema e le fonti senza dati aggiornati a quel giro. Ogni riga ha fonte, licenza e link alla card. Il testo resta com'è anche quando i dati del sito cambiano: nel file sono salvate le frasi già composte, non i dati da cui derivano.

Un'edizione si confronta con l'ultima uscita prima di lei. Se un lunedì è saltato e non è stato recuperato, quella è più vecchia di una settimana, e i testi la nominano con la sua data: «Cambiato dall’edizione del 9 nov 2026» al posto di «Cambiato dalla settimana scorsa», e lo stesso nelle porte ripetute, nella riga di una settimana senza novità e nell'immagine. Le frasi «com'era» salvate nelle edizioni già uscite restano come sono.

| Indirizzo | Cosa c'è |
| --- | --- |
| `/edizioni/AAAA-MM-GG/` | la pagina di un'edizione, con la data del lunedì, in HTML statico senza JavaScript, e la sua immagine di anteprima |
| `/edizioni/` | l'archivio con tutte le edizioni, dalla più recente |
| `/feed.xml` | il feed RSS: una voce per edizione a testo intero, le ultime 26 |

Prima della prima edizione questi indirizzi non esistono, e né la home né le pagine delle competenze hanno link al feed o `<link rel="alternate">`. Con la prima edizione compaiono «Edizioni» nella testata e «Segui con RSS» in fondo alla pagina; «Settimana del…» diventa un link quando l'ultima edizione è proprio di quella settimana. Porte e card non cambiano.

## Quando esce

- **Giro del lunedì:** l'edizione esce da sola.
- **Avvio manuale:** esce solo con la casella «Crea l'edizione della settimana dei dati», spenta di default. Serve anche a recuperare un lunedì andato male.
- **Push:** non crea mai un'edizione.

Un'edizione esistente non si sovrascrive. Senza dati in tutte e due le porte l'edizione non esce. Diventa definitiva solo dopo gli end-to-end: se falliscono non si salva e il sito non esce. Se fallisce la sola creazione, dati e sito vanno avanti e il giro finisce in rosso, così arriva la mail di GitHub.

## Dove stanno

Ogni edizione è in `data/edizioni/AAAA-MM-GG.json`, con accanto l'immagine `AAAA-MM-GG.png`. La build le legge da lì e produce pagine, archivio, feed e un piccolo `data/edizioni.json` con l'ultima edizione, che la home usa per i link. Quell'indice è facoltativo: se manca, la home non mostra né link né avvisi.

## Correggere un'edizione { #correggere }

È l'unica eccezione alla regola per cui `data/` la scrive solo il workflow:

1. Modifica a mano `data/edizioni/AAAA-MM-GG.json`: correggi il testo e aggiungi una voce a `correzioni`, per esempio `{ "data": "2026-11-05", "testo": "Il dato di Eurostat era quello del 2024." }`.
2. Rifai la sua immagine, che non tocca il file fisso né le altre edizioni. Se manca Chromium, prima `npx playwright install chromium`.

    ```bash
    cd web && npm run edizione -- --immagine AAAA-MM-GG
    ```

3. Fai il commit dei due file e il push: il push ripubblica il sito.

Pagina e voce del feed mostrano «Corretta il…» con il testo della correzione. L'identificativo della voce non cambia, quindi i lettori di feed non la segnalano come nuova.

Perché il testo di un'edizione è fisso e i dati si raccolgono solo il lunedì è in [ADR 0002](https://github.com/simones99/ai-radar/blob/main/docs/adr/0002-edizioni-a-testo-fisso-e-dati-solo-il-lunedi.md).
