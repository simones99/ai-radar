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
- Di un'edizione è fisso il contenuto: porte, frasi delle card, notizie e fonti, salvati nel suo file. La cornice invece si rigenera a ogni build con il codice del momento, nella pagina e nella voce del feed: titoli delle sezioni, note, testata e metadati. L'autore l'ha deciso il 24 novembre 2026, quando la PR #23 aveva aggiunto i metadati e la #24 cambiava «Tutte le fonti hanno dati aggiornati questa settimana» anche nell'edizione già uscita del 23 novembre. Un cambio della cornice non è una correzione e non lascia una riga «Corretta il…». I fatti stanno nel contenuto, e la cornice può cambiare solo il modo di dirli. Per esempio, l'elenco delle fonti senza dati aggiornati è nel file, mentre la nota «In questa edizione tutte le fonti hanno dati aggiornati» è cornice. Un cambio che dicesse un fatto diverso, come un'altra fonte o un'altra data, sarebbe una correzione.

## Considered Options

- Lasciare la raccolta a ogni push e fissare solo l'edizione: la home si allontanerebbe dall'edizione già durante la settimana, e il promesso «aggiornati ogni lunedì» resterebbe falso.
- Salvare una copia completa dei dati di ogni settimana e ricomporre i testi a ogni build: il testo di una vecchia edizione cambierebbe con le regole, e non sarebbe più fisso.
- Fissare anche la cornice, salvandola nel file o legando ogni edizione a una versione del modello di pagina: una pagina uscita non cambierebbe mai, ma ogni ritocco al sito andrebbe fatto due volte, e le edizioni vecchie non avrebbero i miglioramenti di accessibilità e di anteprima.
- Una correzione dichiarata per ogni ritocco della cornice: trasparente, ma riempirebbe le edizioni di «Corretta il…» per cambi che non toccano i dati, e toglierebbe peso alle correzioni vere.
