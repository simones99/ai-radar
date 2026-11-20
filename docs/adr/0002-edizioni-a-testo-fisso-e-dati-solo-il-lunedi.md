# Le edizioni hanno un testo fisso, e i dati si raccolgono solo il lunedì o a mano

AI Radar non lasciava traccia della settimana, e un numero citato oggi poteva essere diverso domani nello stesso link. La pipeline girava anche a ogni push: dal 26 ottobre al 3 novembre 2026 i giri riusciti sono stati 12, e la home è cambiata a metà settimana continuando a dire «Settimana del 2 nov». Abbiamo deciso che ogni lunedì esce un'edizione con i testi già composti, che dopo non cambia salvo correzioni dichiarate, e che i dati si raccolgono solo il lunedì o con un avvio manuale: un push non raccoglie più nulla. Così home ed edizione dicono la stessa cosa per tutta la settimana.

## Consequences

- Dopo una modifica alla pipeline o a `config/` i dati non cambiano da soli: per vederne l'effetto serve un avvio manuale.
- Chi ripubblica il progetto deve avviare a mano il primo giro, perché il caricamento dei file non raccoglie dati.
- Un avvio manuale a metà settimana può far divergere la home dall'edizione: per quel caso vale la riga con la data dei dati.
- Un'edizione salva i testi, non i dati da cui derivano. Le regole delle frasi possono cambiare senza alterare il passato, ma un'edizione vecchia non si ricalcola con le regole nuove: un errore si corregge a mano, con una riga visibile.
- `data/` non è più scritta solo dal workflow: le correzioni a mano sono l'unica eccezione.
- Le immagini delle edizioni aggiungono qualche MB l'anno al repo, e un'edizione corretta riscrive la sua immagine nella storia di git.
- I link alle notizie esterne possono rompersi col tempo: il sito non ne conserva una copia.

## Considered Options

- Lasciare la raccolta a ogni push e fissare solo l'edizione: la home si allontanerebbe dall'edizione già durante la settimana, e il promesso «aggiornati ogni lunedì» resterebbe falso.
- Salvare una copia completa dei dati di ogni settimana e ricomporre i testi a ogni build: il testo di una vecchia edizione cambierebbe con le regole, e non sarebbe più fisso.
