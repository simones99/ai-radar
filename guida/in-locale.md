# Provarlo in locale

Servono Python 3.12 e Node 24. Sono i comandi del README, con in più i test:

```bash
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
npm ci --prefix web
python -m pytest -q                                     # test della pipeline, senza rete
npm test --prefix web                                   # test dell'app, senza browser
python -m pipeline.run --months 7                       # dati veri, storico corto
python scripts/build_site.py                            # copia i dati e costruisce _site/
cd web && npm run preview                               # apre il sito su http://localhost:4173
```

Con Chromium (`npx playwright install chromium`) ci sono anche `npm run test:browser`, i test del comando che fa l'immagine di un'edizione, `npm run e2e` e `npm run anteprime-competenze`, che sul sito già costruito in `_site/` sostituisce l'immagine segnaposto di ogni pagina delle competenze con la sua.

Per lavorare sull'app con il ricaricamento automatico: `mkdir -p web/public/data && cp data/*.json web/public/data/` e poi `cd web && npm run dev`.

Le chiavi si passano come variabili d'ambiente: `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `GITHUB_TOKEN`.

Per provare un'edizione senza rischiare di salvarla nel repository, usa una copia dei dati: `AI_RADAR_DATA_DIR=/una/cartella/a/parte`. La leggono sia `npm run edizione -- --evento schedule` sia la build.

`build_site.py` copia nell'app i JSON di una cartella sola, e la stessa la passa alla build di Vite, da cui nascono la home in chiaro, le edizioni, le competenze e la sitemap: è la cartella data come argomento, se c'è, altrimenti `AI_RADAR_DATA_DIR`, altrimenti `data/`. Così l'app e le pagine statiche partono sempre dagli stessi dati.

## La guida

La guida ha dipendenze sue, separate da quelle della pipeline:

```bash
pip install -r requirements-guida.txt
zensical serve                                          # la guida su http://localhost:8000, si ricarica da sola
zensical build --strict                                 # la costruisce in _site/guida/, e si ferma su un link rotto
```
