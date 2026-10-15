# Dati

Questa cartella la riempie e aggiorna da sola la pipeline (`python -m pipeline.run`),
ogni settimana tramite GitHub Actions. Non serve modificarla a mano.

| File | Contenuto | Fonte |
| --- | --- | --- |
| `epoch.json` | Modelli AI notevoli: calcolo di addestramento, area, pesi aperti | Epoch AI (CC BY 4.0) |
| `artificial_analysis.json` | Indice di intelligenza, prezzo e velocità dei modelli linguistici | Artificial Analysis |
| `arxiv.json` | Paper AI al mese, totali e per competenza | arXiv (metadati CC0) |
| `github.json` | Nuovi repository al mese per topic; stelle dei progetti seguiti | GitHub |
| `huggingface.json` | Modelli di tendenza e tipi di compito | Hugging Face |
| `jobs.json` | Annunci di lavoro per competenza e Paese | The Adzuna API |
| `eurostat.json` | Imprese UE che usano l'AI | Eurostat, isoc_eb_ai |
| `news.json` | Titoli e link dai feed RSS configurati | Feed dei siti indicati |
| `radar.json` | Radar delle competenze, calcolato dai file sopra | Calcolo della pipeline |
| `status.json` | Esito dell'ultimo aggiornamento di ogni fonte | Pipeline |

I file con storico (arXiv, GitHub, Hugging Face, Adzuna, Artificial Analysis) si
arricchiscono a ogni giro: per questo sono salvati nel repository.
