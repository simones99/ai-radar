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
- GitHub sospende i workflow pianificati nei repository pubblici senza attività da 60 giorni. I commit settimanali dei dati di norma bastano; se l'aggiornamento si ferma, riattivalo da *Actions*.
