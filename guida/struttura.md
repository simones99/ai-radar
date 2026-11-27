# Struttura e robustezza

## Struttura

```
config/         competenze, fonti, scadenze AI Act, rapporti (da modificare)
pipeline/       un modulo per fonte + radar.py (calcolo) + run.py (orchestrazione)
data/           dati raccolti e storico (scritti dalla pipeline)
data/edizioni/  un JSON e un'immagine per edizione
                (scritti una volta sola; a mano solo per le correzioni)
web/            app Svelte: porte, card, grafici, foto, test;
                pagine delle edizioni, archivio e feed
guida/          questa guida (Zensical, configurata in mkdocs.yml)
scripts/        build_site.py (costruisce _site/), fetch_photos.py (foto da Commons)
tests/          test della pipeline con risposte HTTP simulate
docs/           decisioni (adr/) e ricerche sulle fonti (research/)
.github/        workflow settimanale e controlli
```

## Robustezza

- Ogni fonte è indipendente: se una non risponde, le altre si aggiornano, in pagina resta l'ultimo dato valido e la sezione *Fonti* mostra l'errore.
- La pipeline rispetta i limiti delle API: arXiv una richiesta ogni 3 secondi, GitHub 30 ricerche al minuto, Adzuna 25 chiamate al minuto.
- Ogni file di dati si scrive prima in un `.tmp`, che poi prende il posto del vecchio: un giro interrotto non lascia un JSON a metà. Su Windows un antivirus può tenere per qualche millisecondo un file appena scritto, e la sostituzione fallisce con «Accesso negato» anche se nessuno lo tiene aperto. La pipeline la ritenta fino a cinque volte, a 50 ms l'una dall'altra. Su Linux, quindi su GitHub Actions, non succede.
- Se il salvataggio dei dati raccolti non arriva al repository, per la rete o perché GitHub non risponde, il giro rifà pull e push dopo 5 e poi 15 minuti: dati non salvati vanno persi, e per riaverli serve un giro a mano. Un conflitto con un push arrivato nel frattempo non si ritenta: il giro annulla il rebase e finisce in rosso. In rosso, il log dice quanti tentativi ha fatto e come rimediare. Il salvataggio di un'edizione fa un tentativo solo, e si rifà con la casella del giro manuale.
- GitHub sospende i workflow pianificati nei repository pubblici senza attività da 60 giorni. I commit settimanali dei dati di norma bastano; se l'aggiornamento si ferma, riattivalo da *Actions*.
