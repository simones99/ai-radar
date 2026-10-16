# AI Radar

Una dashboard pubblica con due teste, su dati aperti che si aggiornano da soli ogni settimana:

1. **Su cosa formarti**, per le persone. Un radar di 16 competenze che incrocia ricerca (arXiv), open source (GitHub) e mercato del lavoro (Adzuna), con un confronto tra Europa e USA. Accanto, i temi che lo alimentano: modelli e ricerca, open source, notizie dai laboratori e dalle newsletter di riferimento.
2. **L'AI in Italia**, per le organizzazioni. Un osservatorio con l'Italia in primo piano: imprese che usano l'AI, persone e lavoro, scadenze dell'AI Act, rapporti in arrivo.

In home due porte, *Per te* e *Per la tua organizzazione*, danno la notizia della settimana di ciascuna testa e con un clic aprono la card da cui viene. Sotto ci sono le card, 4 per testa: Competenze, Modelli e ricerca, Open source, Notizie; Business, Persone e lavoro, Norme, Rapporti.

Tutto gira gratis su GitHub: GitHub Actions raccoglie i dati ogni lunedì e GitHub Pages pubblica la pagina.

```
fonti pubbliche ──► pipeline Python ──► data/*.json ──► app Svelte (D3) ──► GitHub Pages
                     (GitHub Actions, ogni lunedì)      salvati nel repo
```

## Pubblicarlo in 10 minuti

1. **Crea il repository.** Su GitHub: *New repository*, nome per esempio `ai-radar`, visibilità **Public** (GitHub Pages è gratuito per i repository pubblici).
2. **Prepara le impostazioni prima di caricare i file**, perché il primo caricamento avvia subito il workflow:
   - *Settings → Pages → Build and deployment → Source:* **GitHub Actions**;
   - *Settings → Actions → General → Workflow permissions →* **Read and write permissions** (serve al workflow per salvare i dati nel repository);
   - le chiavi facoltative in *Settings → Secrets and variables → Actions → New repository secret* (vedi sotto). Senza chiavi la dashboard funziona lo stesso; i due grafici che ne hanno bisogno spiegano cosa manca.
3. **Carica i file.** Dalla cartella del progetto:
   ```bash
   git init -b main
   git add .
   git commit -m "Prima versione di AI Radar"
   git remote add origin https://github.com/<tuo-utente>/ai-radar.git
   git push -u origin main
   ```
   In alternativa usa *Add file → Upload files* sul sito di GitHub, trascinando il contenuto della cartella; in quel caso controlla che la cartella `.github` sia stata caricata, perché alcuni sistemi nascondono le cartelle che iniziano con il punto.
4. **Segui il primo aggiornamento.** Il caricamento avvia da solo *Aggiorna e pubblica*: lo trovi nella scheda *Actions*. Il primo giro dura circa 25 minuti perché ricostruisce 13 mesi di storico; i successivi pochi minuti. Se hai saltato il passo 2, completalo e rilancia con *Actions → Aggiorna e pubblica → Run workflow*.
5. La dashboard è su `https://<tuo-utente>.github.io/ai-radar/`.

## Chiavi facoltative

| Secret | A cosa serve | Come ottenerla |
| --- | --- | --- |
| `AA_API_KEY` | Grafico capacità/prezzo e modello più capace | Gratuita su [artificialanalysis.ai](https://artificialanalysis.ai/documentation) (1.000 richieste al giorno; qui ne serve una a settimana) |
| `ADZUNA_APP_ID` e `ADZUNA_APP_KEY` | Domanda di competenze nel lavoro, Europa e USA | Gratuite su [developer.adzuna.com](https://developer.adzuna.com) |

**Nota su Adzuna.** I termini d'uso permettono la "ricerca personale" citando la fonte come *The Adzuna API*, con limiti di 250 chiamate al giorno e 1.000 a settimana (un giro qui ne usa 136). Non dicono in modo esplicito se una pagina pubblica con conteggi aggregati rientri nella ricerca personale. Prima di renderla pubblica conviene chiedere conferma scritta ad Adzuna dal loro modulo di contatto. Senza queste chiavi il radar ha lo slancio ma non la domanda, quindi nessun quadrante.

`GITHUB_TOKEN` non va creato: GitHub lo fornisce in automatico al workflow.

## Come si legge il radar

Ogni competenza ha due coordinate in unità vere:

- **Slancio**: quanto è cambiata negli ultimi 6 mesi interi la sua quota sul totale dell'AI, per esempio "+25% in 6 mesi". Si stima con una retta sui dati di ogni mese, combinando
  - la quota di paper AI su arXiv che la citano nell'abstract,
  - la quota di nuovi repository GitHub con il suo topic sui nuovi repository AI (somma dei topic `llm`, `ai`, `artificial-intelligence`, `generative-ai`),
  - la quota di annunci di lavoro che la citano, quando ci sono almeno 8 settimane di rilevazioni con la stessa ricerca.

  I segnali più precisi pesano di più, nessuno più di due terzi.
- **Domanda**: annunci di lavoro che la citano ogni 10.000 annunci attivi, in media tra i Paesi.

I quadranti hanno **soglie fisse**: slancio sopra 0 (cresce più dell'AI nel suo complesso) e almeno 3 annunci ogni 10mila. **Impara ora** (entrambe), **Da provare** (solo lo slancio), **Da consolidare** (solo la domanda), **Tieni d'occhio** (nessuna delle due). Aggiungere o togliere una competenza non sposta le altre.

Il radar è **prudente**: il quadrante cambia solo se il calcolo di due mesi di fila dà il quadrante nuovo; nel frattempo la competenza è "in movimento verso" il quadrante nuovo. Una competenza è **incerta** (punto vuoto) quando il margine d'errore dello slancio è largo, di solito per pochi paper o repository: resta sul radar ma non finisce nelle notizie della home.

Ogni competenza ha una sua pagina (`#competenze/mcp`) con l'andamento dei tre segnali, il percorso sul radar, le risorse per iniziare scelte a mano e i repository nuovi più stellati.

Limiti da tenere a mente:

- le ricerche sono per parole chiave, quindi un termine ambiguo può gonfiare o sgonfiare un conteggio;
- i topic GitHub li sceglie chi crea il repository;
- negli annunci in Italia, Germania o Francia le parole tecniche inglesi sono comuni ma non universali, quindi il confronto tra Paesi va letto con cautela.

Per controllare un conteggio basta ripetere la stessa ricerca sulla fonte.

## Personalizzare

- **Competenze**: `config/skills.yaml`. Per ogni competenza si indicano le frasi da cercare su arXiv, un topic GitHub e la frase esatta da cercare negli annunci (in inglese, senza la parola "AI", che nell'indice italiano è una preposizione e viene ignorata). Al giro successivo la pipeline ricalcola da sola lo storico di ciò che è cambiato. Ogni competenza ha anche 2-4 `risorse` «Per iniziare»: la pipeline controlla i link ogni settimana e nasconde quelli che non rispondono per due settimane di fila.
- **Paesi, feed, repository da seguire**: `config/sources.yaml`.
- **Notizie**: in `config/sources.yaml`, blocco `feeds`. Ogni feed ha un `tema` (politica, ricerca, prodotti, business) e, se serve, degli indirizzi `alternativi` provati in ordine.
- **Serie di Our World in Data**: in `config/sources.yaml`, blocco `owid` (slug del grafico, colonna, entità, licenza dei dati).
- **Scadenze dell'AI Act e rapporti**: `config/ai_act.yaml` e `config/rapporti.yaml`, da aggiornare a mano. Ogni voce ha un link alla fonte.
- **Cadenza**: la riga `cron` in `.github/workflows/aggiorna.yml`.

## Provarlo sul proprio computer

Servono Python 3.12 e Node 24.

```bash
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m pytest -q                                     # test della pipeline, senza rete
python -m pipeline.run --months 7                       # dati veri, storico corto
cd web && npm ci && npm test                            # test dell'app
cd .. && python scripts/build_site.py                   # copia i dati e costruisce _site/
cd web && npm run preview                               # apre il sito su http://localhost:4173
```

Per lavorare sull'app con il ricaricamento automatico: `mkdir -p web/public/data && cp data/*.json web/public/data/` e poi `cd web && npm run dev`.

Le chiavi si passano come variabili d'ambiente: `AA_API_KEY`, `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `GITHUB_TOKEN`.

## Struttura

```
config/      competenze, fonti, scadenze AI Act, rapporti (da modificare)
pipeline/    un modulo per fonte + radar.py (calcolo) + run.py (orchestrazione)
data/        dati raccolti e storico (scritti dalla pipeline)
web/         app Svelte: porte, card, grafici, foto, test
scripts/     build_site.py (costruisce _site/), fetch_photos.py (foto da Commons)
tests/       test della pipeline con risposte HTTP simulate
.github/     workflow settimanale
```

## Robustezza

- Ogni fonte è indipendente: se una non risponde, le altre si aggiornano, in pagina resta l'ultimo dato valido e la sezione *Fonti* mostra l'errore.
- La pipeline rispetta i limiti delle API: arXiv una richiesta ogni 3 secondi, GitHub 30 ricerche al minuto, Adzuna 25 chiamate al minuto.
- GitHub sospende i workflow pianificati nei repository pubblici senza attività da 60 giorni. I commit settimanali dei dati di norma bastano; se l'aggiornamento si ferma, riattivalo da *Actions*.

## Fonti e licenze

Dati di [Epoch AI](https://epoch.ai/data/ai-models) (CC BY 4.0), [Artificial Analysis](https://artificialanalysis.ai/), [arXiv](https://arxiv.org) (grazie ad arXiv per l'accesso aperto ai metadati), [GitHub](https://github.com), [Hugging Face](https://huggingface.co), [The Adzuna API](https://www.adzuna.co.uk) ed [Eurostat](https://ec.europa.eu/eurostat). Le notizie mostrano solo titolo, data e link agli articoli originali. Il progetto non è affiliato a nessuna delle fonti.

Codice con licenza MIT (vedi `LICENSE`). D3 (ISC), Svelte (MIT) e il font Bricolage Grotesque (OFL) arrivano da npm; i testi delle loro licenze sono in `web/public/THIRD_PARTY_LICENSES.txt`, linkato in fondo alla pagina. Le foto sono da Wikimedia Commons, con autore e licenza indicati in pagina. Our World in Data pubblica in CC BY 4.0, ma i dati restano dei produttori originali, sempre citati: le serie dell'AI Index (Stanford HAI: investimenti, imprese che usano l'AI, annunci di lavoro) sono CC BY-ND 4.0 e vanno citate senza modifiche; le cifre di IEA, NVIDIA e TSMC restano dei produttori. La licenza di ogni serie è nel campo `licenza` di `config/sources.yaml` e compare in pagina accanto alla fonte.
