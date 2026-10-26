# Dati

Questa cartella la riempie e aggiorna da sola la pipeline (`python -m pipeline.run`),
ogni settimana tramite GitHub Actions. Non serve modificarla a mano.

| File | Contenuto | Fonte |
| --- | --- | --- |
| `epoch.json` | Modelli AI notevoli: calcolo di addestramento, area, pesi aperti | Epoch AI (CC BY 4.0) |
| `artificial_analysis.json` | Indice di intelligenza, prezzo e velocità dei modelli linguistici | Artificial Analysis |
| `arxiv.json` | Paper AI al mese, totali e per competenza | arXiv (metadati CC0) |
| `github.json` | Nuovi repository al mese per topic; serie `base` (nuovi repository AI al mese, somma dei topic di base); `in_crescita` (repository nuovi più stellati per competenza); stelle dei progetti seguiti | GitHub |
| `huggingface.json` | Modelli di tendenza e tipi di compito | Hugging Face |
| `jobs.json` | Annunci di lavoro per competenza e Paese | The Adzuna API |
| `eurostat.json` | Imprese UE che usano l'AI | Eurostat, isoc_eb_ai |
| `eurostat_settori.json` | Per settore, Italia e UE: adozione dell'AI (2021, 2023-2025), scopi e barriere dell'ultimo anno; `null` dove Eurostat non dà il numero, con il flag in `flag` | Eurostat, isoc_eb_ain2 |
| `news.json` | Titoli e link dai feed RSS configurati | Feed dei siti indicati |
| `owid.json` | Investimenti, adozione, uso dell'AI generativa, data center | Our World in Data (dati dei produttori citati) |
| `ai_act.json` | Scadenze dell'AI Act | `config/ai_act.yaml`, a mano |
| `rapporti.json` | Rapporti periodici: edizioni e prossime uscite | `config/rapporti.yaml`, a mano |
| `catena.json` | Gli anelli curati della mappa di GeopoliticAI, quote per Paese: le materie prime per materiale (gallio, terre rare, silicio metallico, germanio) e i chip (progettazione, fabbricazione, macchinari) | `config/catena/materie.yaml`, a mano da USGS (pubblico dominio) e dallo studio UE 2023 (CC BY 4.0); `config/catena/eto.yaml`, a mano dal dataset ETO (CC BY-NC 4.0, non per uso commerciale: vedi `config/catena/LICENSE-ETO.md`) |
| `risorse.json` | Stato settimanale dei link «Per iniziare» delle competenze | Controllo della pipeline |
| `radar.json` | Radar delle competenze (versione 2: unità vere, soglie fisse, incertezza), calcolato dai file sopra | Calcolo della pipeline |
| `status.json` | Esito dell'ultimo aggiornamento di ogni fonte | Pipeline |

I file con storico (arXiv, GitHub, Hugging Face, Adzuna, Artificial Analysis) si
arricchiscono a ogni giro: per questo sono salvati nel repository.
