# AI Radar

**In English.** A public dashboard on open data that updates itself every week: [simones99.github.io/ai-radar](https://simones99.github.io/ai-radar/). Every Monday a Python pipeline on GitHub Actions collects arXiv, GitHub, Adzuna job ads, Eurostat, Epoch AI, Our World in Data and lab news feeds, saves the results as JSON in the repository, and a Svelte + D3 front end on GitHub Pages shows them. Two views: *which skills to learn*, a radar of 16 AI skills that crosses research, open source and job demand in Europe and the US; and *AI in Italy*, on business adoption, people and jobs, AI Act deadlines and upcoming reports. A third view, GeopoliticAI, follows the supply chain country by country, from raw materials and chips to data centres and model capability. Every Monday it also publishes a weekly edition with fixed text, its own page and share image, collected in an archive and an RSS feed. Every source is licensed and cited; pipeline and app are tested in CI. The interface and the rest of this README are in Italian.

Una dashboard pubblica con due teste, su dati aperti che si aggiornano da soli ogni settimana:

1. **Su cosa formarti**, per le persone. Un radar di 16 competenze che incrocia ricerca (arXiv), open source (GitHub) e mercato del lavoro (Adzuna), con un confronto tra Europa e USA. Accanto, i temi che lo alimentano: modelli e ricerca, open source, notizie dai laboratori e dalle newsletter di riferimento.
2. **L'AI in Italia**, per le organizzazioni. Un osservatorio con l'Italia in primo piano: imprese che usano l'AI, persone e lavoro, scadenze dell'AI Act, rapporti in arrivo.

In home due porte, *Per te* e *Per la tua organizzazione*, danno la notizia della settimana di ciascuna testa e con un clic aprono la card da cui viene. Sotto ci sono le card, 4 per testa: Competenze, Modelli e ricerca, Open source, Notizie; Business, Persone e lavoro, Norme, Rapporti.

Ogni lunedì esce anche un'**edizione**: il riassunto fisso della settimana, con un suo indirizzo, un archivio e un feed RSS. Vedi [Edizioni, feed e correzioni](#edizioni-feed-e-correzioni).

Tutto gira gratis su GitHub: GitHub Actions raccoglie i dati ogni lunedì, o con un avvio manuale, e GitHub Pages pubblica la pagina.

```
fonti pubbliche ──► pipeline Python ──► data/*.json ──┬─► app Svelte (D3) ──────────┬─► GitHub Pages
                     (GitHub Actions, ogni lunedì)    │                             │
                                                      └─► data/edizioni/ ──► pagine,┘
                                                          testo fisso e      archivio,
                                                          immagine           feed
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
4. **Avvia il primo giro a mano.** Il caricamento fa partire *Aggiorna e pubblica*, che però pubblica il sito con i dati già presenti nel repository e non ne raccoglie di nuovi. Per raccoglierli usa *Actions → Aggiorna e pubblica → Run workflow*, lasciando spenta la casella «Crea l'edizione di questa settimana»; se hai saltato il passo 2, completalo prima. Il primo giro di raccolta dura circa 25 minuti perché ricostruisce 13 mesi di storico; i successivi pochi minuti. Da lì in poi i dati si raccolgono da soli ogni lunedì, e con loro esce l'edizione della settimana.
5. La dashboard è su `https://<tuo-utente>.github.io/ai-radar/`. I link alle edizioni compaiono in home con la prima edizione. Gli indirizzi di feed e anteprime seguono il nome del tuo repository.

## Chiavi facoltative

| Secret | A cosa serve | Come ottenerla |
| --- | --- | --- |
| `ADZUNA_APP_ID` e `ADZUNA_APP_KEY` | Domanda di competenze nel lavoro, Europa e USA | Gratuite su [developer.adzuna.com](https://developer.adzuna.com) |

**Nota su Adzuna.** I termini d'uso permettono la "ricerca personale" citando la fonte come *The Adzuna API*, con limiti di 250 chiamate al giorno e 1.000 a settimana (una raccolta qui ne usa 136). Non dicono in modo esplicito se una pagina pubblica con conteggi aggregati rientri nella ricerca personale. Prima di renderla pubblica conviene chiedere conferma scritta ad Adzuna dal loro modulo di contatto. Senza queste chiavi il radar non ha la domanda e quindi non si disegna.

`GITHUB_TOKEN` non va creato: GitHub lo fornisce in automatico al workflow.

## Come si legge il radar

Ogni competenza ha due coordinate in unità vere:

- **Slancio**: quanto è cambiata negli ultimi 6 mesi interi la sua quota sul totale dell'AI, per esempio "+25% in 6 mesi". Si stima con una retta sui dati di ogni mese, combinando
  - la quota di paper AI su arXiv che la citano nell'abstract,
  - la quota di nuovi repository GitHub con il suo topic sui nuovi repository AI (somma dei topic `llm`, `ai`, `artificial-intelligence`, `generative-ai`),
  - la quota di annunci di lavoro che la citano, quando ci sono almeno 8 settimane di rilevazioni con la stessa ricerca.

  I segnali più precisi pesano di più, nessuno più di due terzi.
- **Domanda**: annunci di lavoro che la citano ogni 10.000 annunci attivi, nel **Paese a metà classifica**. Ogni Paese vale la mediana delle sue ultime 4 rilevazioni con la stessa ricerca (con meno di 4, quelle che ci sono), così una settimana strana non sposta il numero. Il Paese a metà classifica è la mediana tra i Paesi: con un numero pari di Paesi, il valore a metà tra i due centrali. Il metodo è cambiato a novembre 2026: prima contava solo l'ultima rilevazione, e un solo Paese poteva spostare il valore. Lo storico si ricalcola a ogni raccolta, quindi il nuovo metodo vale anche per i mesi passati.

I quadranti hanno **soglie fisse**: slancio sopra 0 (cresce più dell'AI nel suo complesso) e almeno 3 annunci ogni 10mila. **Impara ora** (entrambe), **Da provare** (solo lo slancio), **Da consolidare** (solo la domanda), **Tieni d'occhio** (nessuna delle due). Aggiungere o togliere una competenza non sposta le altre.

Il radar è **prudente**: il quadrante cambia solo se il calcolo di due mesi di fila dà il quadrante nuovo; nel frattempo la competenza è "in movimento verso" il quadrante nuovo. Una competenza è **incerta** (punto vuoto) quando il margine d'errore dello slancio è largo, di solito per pochi paper o repository: resta sul radar ma non finisce nella porta *Per te* della home.

Il radar si può leggere **sull'Italia**: nella card Competenze si sceglie il mercato, «Tutti i Paesi» o «Italia», e la scelta sta nel link (`#competenze?mercato=italia`). Con «Italia» la domanda è quella italiana, la mediana delle ultime 4 rilevazioni in Italia, e accanto si legge il numero di annunci che ci sta dietro. Lo slancio è unico: la crescita si misura nel mondo e non cambia. La soglia è la stessa, 3 annunci ogni 10mila. I quadranti sono propri, con la stessa conferma di due mesi di fila. Dove manca il dato italiano la pagina lo dice e non mostra uno zero.

Ogni competenza ha una sua pagina (`#competenze/mcp`) con l'andamento dei tre segnali, il percorso sul radar, le risorse per iniziare scelte a mano e i repository nuovi più stellati.

Limiti da tenere a mente:

- le ricerche sono per parole chiave, quindi un termine ambiguo può gonfiare o sgonfiare un conteggio;
- i topic GitHub li sceglie chi crea il repository;
- negli annunci in Italia, Germania o Francia le parole tecniche inglesi sono comuni ma non universali, quindi il confronto tra Paesi va letto con cautela.

Per controllare un conteggio basta ripetere la stessa ricerca sulla fonte.

## Edizioni, feed e correzioni

Un'**edizione** riassume una settimana: le due porte, le frasi delle card cambiate dalla settimana prima, fino a 3 notizie per tema e le fonti che non hanno risposto. Ogni riga ha fonte, licenza e link alla card. Il testo resta com'è anche quando i dati del sito cambiano: nel file sono salvate le frasi già composte, non i dati da cui derivano.

| Indirizzo | Cosa c'è |
| --- | --- |
| `/edizioni/AAAA-MM-GG/` | la pagina di un'edizione, con la data del lunedì, in HTML statico senza JavaScript, e la sua immagine di anteprima |
| `/edizioni/` | l'archivio con tutte le edizioni, dalla più recente |
| `/feed.xml` | il feed RSS: una voce per edizione a testo intero, le ultime 26 |

Prima della prima edizione questi indirizzi non esistono, e la home non ha link né `<link rel="alternate">`. Con la prima edizione compaiono «Edizioni» nella testata e «Segui con RSS» in fondo alla pagina; «Settimana del…» diventa un link quando l'ultima edizione è proprio di quella settimana. Porte e card non cambiano.

**Quando esce.**

- **Giro del lunedì:** l'edizione esce da sola.
- **Avvio manuale:** esce solo con la casella «Crea l'edizione di questa settimana», spenta di default. Serve anche a recuperare un lunedì andato male.
- **Push:** non crea mai un'edizione.

Un'edizione esistente non si sovrascrive. Senza dati in tutte e due le porte l'edizione non esce. Diventa definitiva solo dopo gli end-to-end: se falliscono non si salva e il sito non esce. Se fallisce la sola creazione, dati e sito vanno avanti e il giro finisce in rosso, così arriva la mail di GitHub.

**Dove stanno.** Ogni edizione è in `data/edizioni/AAAA-MM-GG.json`, con accanto l'immagine `AAAA-MM-GG.png`. La build le legge da lì e produce pagine, archivio, feed e un piccolo `data/edizioni.json` con l'ultima edizione, che la home usa per i link. Quell'indice è facoltativo: se manca, la home non mostra né link né avvisi.

**Correggere un'edizione.** È l'unica eccezione alla regola per cui `data/` la scrive solo il workflow:

1. Modifica a mano `data/edizioni/AAAA-MM-GG.json`: correggi il testo e aggiungi una voce a `correzioni`, per esempio `{ "data": "2026-11-05", "testo": "Il dato di Eurostat era quello del 2024." }`.
2. Rifai la sua immagine, che non tocca il file fisso né le altre edizioni. Se manca Chromium, prima `npx playwright install chromium`.
   ```bash
   cd web && npm run edizione -- --immagine AAAA-MM-GG
   ```
3. Fai il commit dei due file e il push: il push ripubblica il sito.

Pagina e voce del feed mostrano «Corretta il…» con il testo della correzione. L'identificativo della voce non cambia, quindi i lettori di feed non la segnalano come nuova.

## Personalizzare

- **Competenze**: `config/skills.yaml`. Per ogni competenza si indicano le frasi da cercare su arXiv, un topic GitHub e la frase esatta da cercare negli annunci (in inglese, senza la parola "AI", che nell'indice italiano è una preposizione e viene ignorata). Alla raccolta successiva la pipeline ricalcola da sola lo storico di ciò che è cambiato. Ogni competenza ha anche 2-4 `risorse` «Per iniziare»: la pipeline controlla i link ogni settimana e nasconde quelli che danno errore per due settimane di fila.
- **Paesi, feed, repository da seguire**: `config/sources.yaml`.
- **Notizie**: in `config/sources.yaml`, blocco `feeds`. Ogni feed ha un `tema` (politica, ricerca, prodotti, business) e, se serve, degli indirizzi `alternativi` provati in ordine.
- **Serie di Our World in Data**: in `config/sources.yaml`, blocco `owid` (slug del grafico, colonna, entità, licenza dei dati).
- **Settori della card Business**: in `config/sources.yaml`, blocco `eurostat_settori` (id, nome, codice NACE e la forma da usare nella frase della porta per ogni settore; i nomi italiani degli scopi e delle barriere accanto ai codici Eurostat). Se Eurostat cambia un codice, il passo si ferma e resta il file del giro prima.
- **Scadenze dell'AI Act e rapporti**: `config/ai_act.yaml` e `config/rapporti.yaml`, da aggiornare a mano. Ogni voce ha un link alla fonte.
- **Cadenza**: la riga `cron` in `.github/workflows/aggiorna.yml`. I dati si raccolgono solo con quel giro o con un avvio manuale: un push pubblica il sito con i dati già salvati. Dopo una modifica a `pipeline/` o `config/`, quindi, per vederne subito l'effetto sui dati serve *Actions → Aggiorna e pubblica → Run workflow*; altrimenti arriva il lunedì dopo.

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

Le chiavi si passano come variabili d'ambiente: `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `GITHUB_TOKEN`.

Per provare un'edizione senza rischiare di salvarla nel repository, usa una copia dei dati: `AI_RADAR_DATA_DIR=/una/cartella/a/parte`. La leggono sia `npm run edizione -- --evento schedule` sia la build.

## Struttura

```
config/      competenze, fonti, scadenze AI Act, rapporti (da modificare)
pipeline/    un modulo per fonte + radar.py (calcolo) + run.py (orchestrazione)
data/        dati raccolti e storico (scritti dalla pipeline)
data/edizioni/  un JSON e un'immagine per edizione (scritti una volta sola; a mano solo per le correzioni)
web/         app Svelte: porte, card, grafici, foto, test; pagine delle edizioni, archivio e feed
scripts/     build_site.py (costruisce _site/), fetch_photos.py (foto da Commons)
tests/       test della pipeline con risposte HTTP simulate
.github/     workflow settimanale
```

## Robustezza

- Ogni fonte è indipendente: se una non risponde, le altre si aggiornano, in pagina resta l'ultimo dato valido e la sezione *Fonti* mostra l'errore.
- La pipeline rispetta i limiti delle API: arXiv una richiesta ogni 3 secondi, GitHub 30 ricerche al minuto, Adzuna 25 chiamate al minuto.
- GitHub sospende i workflow pianificati nei repository pubblici senza attività da 60 giorni. I commit settimanali dei dati di norma bastano; se l'aggiornamento si ferma, riattivalo da *Actions*.

## Fonti e licenze

Dati di [Epoch AI](https://epoch.ai/data/ai-models) (CC BY 4.0), [arXiv](https://arxiv.org) (grazie ad arXiv per l'accesso aperto ai metadati), [GitHub](https://github.com), [Hugging Face](https://huggingface.co), [The Adzuna API](https://www.adzuna.co.uk) ed [Eurostat](https://ec.europa.eu/eurostat). Le notizie mostrano solo titolo, data e link agli articoli originali. Il progetto non è affiliato a nessuna delle fonti.

Codice con licenza MIT (vedi `LICENSE`). D3 (ISC), Svelte (MIT) e il font Bricolage Grotesque (OFL) arrivano da npm; i testi delle loro licenze sono in `web/public/THIRD_PARTY_LICENSES.txt`, linkato in fondo alla pagina. Le foto sono da Wikimedia Commons, con autore e licenza indicati in pagina. Our World in Data pubblica in CC BY 4.0, ma i dati restano dei produttori originali, sempre citati: le serie dell'AI Index (Stanford HAI: investimenti, imprese che usano l'AI, annunci di lavoro) sono CC BY-ND 4.0 e vanno citate senza modifiche; le cifre di IEA, NVIDIA e TSMC restano dei produttori. La licenza di ogni serie è nel campo `licenza` di `config/sources.yaml` e compare in pagina accanto alla fonte.
