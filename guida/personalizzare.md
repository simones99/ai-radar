# Personalizzare

- **Competenze**: `config/skills.yaml`. Per ogni competenza si indicano le frasi da cercare su arXiv, un topic GitHub e la frase esatta da cercare negli annunci (in inglese, senza la parola "AI", che nell'indice italiano è una preposizione e viene ignorata). Alla raccolta successiva la pipeline ricalcola da sola lo storico di ciò che è cambiato. Ogni competenza ha anche 2-4 `risorse` «Per iniziare»: la pipeline controlla i link ogni settimana e nasconde quelli che danno errore per due settimane di fila.
- **Paesi, feed, repository da seguire**: `config/sources.yaml`.
- **Notizie**: in `config/sources.yaml`, blocco `feeds`. Ogni feed ha un `tema` (politica, ricerca, prodotti, business) e, se serve, degli indirizzi `alternativi` provati in ordine.
- **Serie di Our World in Data**: in `config/sources.yaml`, blocco `owid` (slug del grafico, colonna, entità, licenza dei dati).
- **Settori della card Business**: in `config/sources.yaml`, blocco `eurostat_settori` (id, nome, codice NACE e la forma da usare nella frase della porta per ogni settore; i nomi italiani degli scopi e delle barriere accanto ai codici Eurostat). Se Eurostat cambia un codice, il passo si ferma e resta il file del giro prima.
- **Scadenze dell'AI Act e rapporti**: `config/ai_act.yaml` e `config/rapporti.yaml`, da aggiornare a mano. Ogni voce ha un link alla fonte.
- **Cadenza**: la riga `cron` in `.github/workflows/aggiorna.yml`. I dati si raccolgono solo con quel giro o con un avvio manuale: un push pubblica il sito con i dati già salvati. Dopo una modifica a `pipeline/` o `config/`, quindi, per vederne subito l'effetto sui dati serve *Actions → Aggiorna e pubblica → Run workflow*; altrimenti arriva il lunedì dopo.
- **Questa guida**: le pagine sono in `guida/`, l'indice e il tema in `mkdocs.yml`. Un push che cambia la guida ripubblica il sito con i dati già salvati.
