# Chiavi e Adzuna

| Secret | A cosa serve | Come ottenerla |
| --- | --- | --- |
| `ADZUNA_APP_ID` e `ADZUNA_APP_KEY` | Domanda di competenze nel lavoro, Europa e USA | Gratuite su [developer.adzuna.com](https://developer.adzuna.com) |

`GITHUB_TOKEN` non va creato: GitHub lo fornisce in automatico al workflow.

!!! note "Nota su Adzuna"
    I termini d'uso permettono la "ricerca personale" citando la fonte come *The Adzuna API*. I limiti di chiamate sono quelli del piano nel proprio account (una raccolta qui ne usa 136). I termini non dicono in modo esplicito se una pagina pubblica con conteggi aggregati rientri nella ricerca personale. Per questa pagina, che mostra solo conteggi aggregati con la fonte citata, la conferma è stata chiesta ad Adzuna il 5 novembre 2026. Adzuna ha risposto per iscritto il 16 novembre 2026 che va bene, purché si rispettino i [termini d'uso](https://developer.adzuna.com/docs/terms_of_service). Per questo ogni dato sugli annunci cita *The Adzuna API*, anche nelle immagini d'anteprima delle edizioni e delle competenze. Chi pubblica una propria copia chieda a sua volta la conferma dal loro modulo di contatto. Senza queste chiavi il radar non ha la domanda e quindi non si disegna.

## Se l'accordo con Adzuna finisce

I termini chiedono di togliere subito i dati di Adzuna da tutte le pagine, edizioni comprese. I dati stanno in due file: `data/jobs.json`, con le rilevazioni, e `data/radar.json`, che ne ricava domanda, annunci, quadranti e storico. `radar.json` si ricalcola da `jobs.json` a ogni raccolta, ma un push non raccoglie: senza un avvio manuale app, home e pagine delle competenze tengono i dati di Adzuna fino al lunedì.

1. Togli i secret `ADZUNA_APP_ID` e `ADZUNA_APP_KEY`.
2. Elimina `data/jobs.json`, fai il commit e il push.
3. Avvia il giro a mano, con la casella dell'edizione spenta: la raccolta rifà `radar.json` senza la domanda, e il sito esce senza i dati di Adzuna.
4. Fai una correzione dichiarata su ogni edizione, immagine compresa (vedi [Correggere un'edizione](edizioni.md#correggere)).
5. Sostituisci lo screenshot della home, in cima al README e alla [panoramica](index.md) di questa guida (`guida/immagini/home.png` e `home-scura.png`): mostra il radar e la porta *Per te*, che usano i dati di Adzuna.
