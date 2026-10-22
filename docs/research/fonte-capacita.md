# Quale fonte per la capacità

Ricerca per il ticket wayfinder «05: Quale fonte per la capacità» (GeopoliticAI). Fonti consultate e file scaricati il 22 ottobre 2026, tra le 08:37 e le 08:50 UTC.

## Sintesi

1. **Candidati.** Ne ho valutati sette.
   - **Epoch Capabilities Index (ECI)**, di Epoch AI. Unisce più di 50 benchmark in una sola scala di «capacità generale», con un modello statistico (IRT). Copre 270 modelli dal febbraio 2023 e si aggiorna quasi ogni giorno: l'ultimo aggiornamento è del 22 ottobre 2026.
   - **Benchmarking Hub di Epoch**: i risultati dei singoli benchmark, con 580 gruppi di modelli nel file. Non dà un punteggio aggregato. L'aggregato è l'ECI stesso.
   - **Arena**, ex LMArena (Arena Intelligence, Inc.). Dà un punteggio Bradley-Terry ricavato dai voti di preferenza degli utenti. Ha 417 modelli nella classifica testo del 20 ottobre 2026, e le pubblicazioni sono circa settimanali.
   - **HELM Capabilities** (Stanford CRFM), **LiveBench**, **Open LLM Leaderboard** (Hugging Face) ed **EuroEval**. Le ho escluse: sono ferme, non hanno una licenza sui dati, oppure non misurano la capacità generale (sezione 4).
2. **Licenza.**
   - L'**ECI è CC BY 4.0**. Si può mostrare in una card pubblica, aggregarlo per area e unirlo ai Paesi di Epoch, che vengono dallo stesso database. L'attribuzione chiede tre cose: la citazione «Epoch AI, 'Epoch Capabilities Index'», con il link a https://epoch.ai/eci; il link alla licenza; la frase che i dati sono stati modificati (aggregati per area).
   - **Arena** pubblica su Hugging Face un dataset della classifica in **CC BY 4.0**. I termini d'uso del sito però vietano di riprodurre il servizio e di fare scraping. Il dataset si può usare, il sito no.
   - Nessuna delle due ha clausole come il §2.4(c-d) dei termini di Artificial Analysis.
3. **Copertura per area (ECI, 270 modelli).**

   | Area | Modelli | Note |
   |---|---|---|
   | USA | 161 | |
   | Cina | 72 | |
   | UE | 14 | Tutti di **Mistral AI** (Francia). |
   | Regno Unito | 1 | Stable Beluga 2, 2023. |
   | Altri | 5 | Falcon degli Emirati e Command R+ del Canada, nessuno dopo il 2024. |
   | Senza Paese | 17 | Modelli piccoli del 2023-2024. |

   Non c'è **nessun modello italiano** e nessun modello coreano. Nel 2025-2026 l'ECI dice qualcosa solo su USA, Cina e UE. Il miglior modello UE, Mistral Large 4, ha 150,0; il migliore USA ha 168,8 e il migliore cinese 157,9.
4. **Paese e aggancio.** `eci_scores.csv` ha già le colonne `Organization` e `Country (of organization)`, prese dal database dei modelli di Epoch. Quindi **non serve nessun abbinamento**: `regions_of()` si applica direttamente. Il nome `Model` coincide con `Model` di `all_ai_models.csv` per 218 modelli su 270, e in tutti i 218 casi il Paese è lo stesso. Non c'è un id stabile in comune. Arena invece dà solo uno slug dell'organizzazione (per esempio `mistral`), e il Paese va attribuito a mano.
5. **Storico.** L'ECI ha la data di uscita di ogni modello (colonna `date`, dal 2023-02-24), quindi la serie per area si ricostruisce da una sola fotografia. Ogni aggiornamento rifà il calcolo su tutti i dati, e i valori passati si muovono un po'. Le ancore restano fisse (Claude 3.5 Sonnet = 130, GPT-5 = 150) in tutte le fotografie da gennaio 2026. Dal 1° gennaio al 22 ottobre 2026 lo scarto mediano sullo stesso modello è di 0,8 punti; in un mese è di 0,1-0,2. Basta quindi riscaricare l'intera serie a ogni aggiornamento, senza accumularla. A settembre 2026 è cambiato il formato del file.
6. **Accesso.** Il file è https://epoch.ai/data/eci_scores.csv (CSV, 33 KB, 270 righe). Si scarica senza chiave e senza limiti dichiarati, e `robots.txt` non blocca `/data/`. Lo stesso file è anche nello ZIP https://epoch.ai/data/benchmark_data.zip (2,4 MB). Il client Python `epochai` richiede invece una copia della base Airtable e un token personale, e non serve.

**Raccomandazione: usare l'Epoch Capabilities Index (ECI) per la capacità.** È aperto (CC BY 4.0), viene dallo stesso editore e dalla stessa colonna Paese del calcolo, ha le date di uscita e una serie coerente dal 2023, e si scarica senza chiave. La card però deve dire chiaramente i suoi limiti:
- per l'UE l'ECI misura solo Mistral;
- per il Regno Unito e «Altri» non ci sono modelli valutati dopo il 2024;
- l'Italia è a zero, come nel calcolo.

Il glossario va aggiornato, perché oggi **Capacità** è definita con l'indice di Artificial Analysis. Arena resta un'alternativa di riserva: è aperta come dataset, ma misura la preferenza degli utenti, non la capacità, e la sua scala si sposta nel tempo.

## 1. Epoch Capabilities Index (ECI)

### Cos'è

- **Chi la mantiene:** Epoch AI, lo stesso editore dei dati sui modelli che la pipeline usa già (`pipeline/epoch.py`).
- **Cosa misura:**
  - Un punteggio di «capacità generale» per modello, stimato insieme alle difficoltà di più di 50 benchmark (59 nel file di input di oggi) con il modello `performance = sigmoid(discriminability × (capability − difficulty))`. Il codice è in `epoch-research/eci-public`, con licenza MIT; il metodo è nel paper *A Rosetta Stone for AI Benchmarks* (arXiv 2512.00193).
  - La scala è lineare, ma i valori assoluti non hanno significato da soli: contano i confronti tra modelli. Le ancore sono Claude 3.5 Sonnet = 130 e GPT-5 = 150, e Epoch avverte che «these calibration points may be revisited».
  - Ogni punteggio ha un intervallo di confidenza al 90% (`eci_ci_low`, `eci_ci_high`).
- **Chi entra:** i modelli con almeno 4 benchmark valutati. Epoch dice di puntare ai modelli «plausibly-frontier». I modelli specializzati possono avere un ECI basso. Gli input sono valutazioni di Epoch, classifiche indipendenti e risultati dichiarati dai laboratori. Tra le fonti dei 2.888 punteggi in input (`processed_data_for_eci.csv`) non c'è Artificial Analysis.
- **Aggiornamento:** sulla pagina c'è «Updated Oct. 22, 2026». Wayback Machine ha 11 versioni diverse dello ZIP tra il 2 e il 19 ottobre 2026, quindi l'aggiornamento è quasi quotidiano. Non c'è un calendario dichiarato e non c'è un changelog.

### Licenza e attribuzione

- **Pagina ECI e pagina «Use this data»:** «Epoch AI's data is free to use, distribute, and reproduce provided the source and authors are credited under the Creative Commons Attribution license» (CC BY 4.0). Lo stesso testo è nel `README.md` dello ZIP. Nella documentazione Epoch scrive che l'ECI è un suo prodotto e che ne ha pieni diritti, anche se il paper è finanziato da Google DeepMind.
- **Riserve dell'Hub:** «Benchmark questions and answers are the property of their respective creators» e «data sourced from external projects … retains its original licensing». Riguardano i file dei singoli benchmark, non `eci_scores.csv`. C'è però una trappola: nello ZIP, `scicode_external.csv` ha come fonte artificialanalysis.ai (226 righe). Quel file non entra nell'ECI (`in_eci = False` in `benchmark_metadata.csv`), ma la pipeline **non deve** ripubblicarlo.
- **Termini del sito:** epoch.ai non ha termini d'uso generali. Ci sono solo i termini delle consulenze (`/consulting-terms`), che non riguardano i dati pubblici. Scaricare il CSV pubblicato non è scraping, e `robots.txt` vieta solo `/assets/`, `/inspect-viewer/` e i problemi di FrontierMath.
- **Citazione suggerita** (dalla pagina): «Epoch AI, 'Epoch Capabilities Index'. Published online at epoch.ai. Retrieved from 'https://epoch.ai/eci' [online resource]. Accessed 22 Oct 2026.» Per CC BY 4.0, §3(a), servono anche il link alla licenza e l'indicazione delle modifiche, per esempio: «aggregato per area da AI Radar».
- **Conseguenza:** la card può mostrare punteggi, tabelle e grafici per area, uniti al calcolo di Epoch. È la stessa licenza che il sito rispetta già per `notable_ai_models.csv`.

### Campi di `eci_scores.csv`

`Model, Display name, eci, eci_ci_low, eci_ci_high, date, Organization, Country (of organization), Model accessibility, Accessibility group, model_versions`

- `Country (of organization)` ha un solo valore per riga: nessuna delle 270 righe ha più Paesi. Così sparisce il problema dei modelli congiunti visto nel ticket 01. L'organizzazione può invece essere multipla, per esempio «Hugging Face,ServiceNow,Nvidia,BigCode» per StarCoder 2, con Paese «United States of America».
- `date` è la data di uscita. Sui 218 modelli che sono anche in `all_ai_models.csv`, coincide con `Publication date` in 177 casi; negli altri la differenza è di pochi giorni.
- `model_versions` è vuota in tutte le righe. Gli id delle API, per esempio `gpt-5.6-sol_max`, sono solo in `processed_data_for_eci.csv` e `model_metadata.csv`.
- `Accessibility group`: Closed weights 125, Open weights 121, Other 24.

### Copertura per area

Fonte: `eci_scores.csv`, da https://epoch.ai/data/eci_scores.csv, scaricato il 22/10/2026. È identico byte per byte al file nello ZIP dello stesso giorno. L'anno è `date[:4]`. Le aree vengono da `regions_of()` importata da `pipeline/epoch.py` (commit `490aea7`). Le righe con Paese vuoto sono messe a parte, mentre `aggregate()` le conterebbe in «Altri». Script: `copertura_eci.py` e `tabella_eci.py` (sezione Metodo).

| Area | 2023 | 2024 | 2025 | 2026 | Totale | ECI ≥ 140 | ECI ≥ 150 | Organizzazioni |
|---|---|---|---|---|---|---|---|---|
| USA | 23 | 42 | 46 | 50 | 161 | 79 | 47 | 19 |
| Cina | 10 | 8 | 21 | 33 | 72 | 39 | 13 | 8 |
| UE | 2 | 7 | 3 | 2 | 14 | 2 | 1 | 1 (Mistral AI) |
| Regno Unito | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 1 (Stability AI) |
| Altri | 3 | 2 | 0 | 0 | 5 | 0 | 0 | 2 (TII, Cohere) |
| Senza Paese | 11 | 6 | 0 | 0 | 17 | 0 | 0 | — |
| **Tutti** | 50 | 65 | 70 | 85 | 270 | | | |

**ECI massimo per area e anno**

| Area | 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|---|
| USA | 125,7 GPT-4 (Mar 2023) | 141,7 o1 | 156,3 GPT-5.2 Pro | 168,8 Claude Opus 5.5 |
| Cina | 117,3 Yi-34B | 132,3 DeepSeek-V3 | 146,1 DeepSeek-V3.2 | 157,9 Kimi K3 |
| UE | 118,4 Mixtral 8x7B | 128,6 Mistral Large 2 (Nov 2024) | 134,0 Mistral Medium 3 | 150,0 Mistral Large 4 |
| Regno Unito | 117,0 Stable Beluga 2 | – | – | – |
| Altri | 112,0 Falcon-180B | 119,2 Command R+ | – | – |

- **UE:** sono 14 modelli, tutti di Mistral AI e tutti francesi: Mistral Large 4 (150,0, 6 ottobre 2026), Mistral Medium 3.5 (141,4), Mistral Medium 3 (134,0), Magistral Small 1.0 (133,1), Mistral Large 2 di novembre e di luglio 2024 (128,6 e 127,6), Mistral Small 3.1 (127,5), Mistral Large (122,1), Mixtral 8x22B (122,0), Mistral NeMo (118,7), Mixtral 8x7B (118,4), Ministral 3B (118,0), Mistral 7B v0.1 (112,1) e v0.3 (108,9).
  - Per il dettaglio dei Paesi UE esiste solo la **Francia**.
  - Mancano Aleph Alpha, DeepL, Black Forest Labs, Silo AI, OpenGPT-X e Multiverse Computing.
- **Italia: zero.** Nessun modello ha «Italy» nel Paese. Lo stesso vale per `model_metadata.csv` dell'Hub e, secondo il ticket 01, per tutti i file di Epoch: Minerva, Velvet e Modello Italia non ci sono.
- **Regno Unito:** c'è solo Stable Beluga 2 (Stability AI, 2023). Epoch attribuisce agli USA i modelli di Google DeepMind (`Google DeepMind`, da solo o con `Google`, → United States of America in 25 modelli del 2025-2026), come già nel calcolo.
- **Altri:** ci sono Falcon-180B, Falcon-40B, Falcon-7B e Falcon 2 11B (TII, Emirati) e Command R+ (Cohere, Canada). Non c'è **nessun modello coreano**, anche se nel ticket 01 la Corea è l'unica parte di «Altri» che regge da sola. Nell'Hub ci sono LG AI Research e Upstage (`model_metadata.csv`), ma con meno di 4 benchmark, quindi senza ECI.
- **Cina:** le organizzazioni sono 8 (01.AI, Alibaba, Baichuan, DeepSeek, MiniMax, Moonshot, Peking University, Z.ai). Mancano Xiaomi, StepFun, Tencent, ByteDance, Baidu e Meituan, che sono invece nella classifica di AA. La Cina è quindi sottostimata nel conteggio, ma non nel massimo: i suoi laboratori di punta ci sono.
- **Senza Paese (17):** sono modelli piccoli o vecchi, con nomi di versione che non sono in `all_ai_models.csv`, quindi il Paese non si recupera per nome. Dal nome sono, secondo me, 10 cinesi (Qwen2.5-Coder ×3, internlm ×2, Yi-9B, chatglm2-6b, CodeQwen1.5-7B, Qwen-1_8B, DeepSeek-Coder-V2-Lite-Base), 6 statunitensi (PaLM 2-L/M/S, vicuna-13b, open_llama_7b, RedPajama-INCITE-7B-Base) e 1 britannico (stablelm-tuned-alpha-7b). Nessuno è del 2025-2026 e nessuno supera 117: per i massimi recenti non contano. La pipeline deve però escluderli, oppure contarli come «senza Paese», non in «Altri».
- **Quanti modelli Epoch hanno un ECI.** Nei modelli di linguaggio 2024-2026, per area:

  | Area | Notable | Large-scale |
  |---|---|---|
  | USA | 67/132 | 63/128 |
  | Cina | 27/87 | 27/133 |
  | UE | 1/6 | 3/18 |
  | Regno Unito | 0/0 | 0/1 |
  | Altri | 0/20 | 2/28 |

  L'abbinamento è per nome esatto e quindi sottostima un po' (vedi il punto successivo). Il conteggio dei modelli per area con l'ECI è quindi una misura della **copertura di Epoch**, non della forza di un'area. La card dovrebbe mostrare il **massimo** per area, non il numero.

### Paese e aggancio a Epoch

- Il Paese è già nel file e viene dallo stesso database del calcolo. L'abbinamento serve solo se si vuole mettere sullo stesso modello ECI e calcolo.
- Per nome esatto (`Model`), 218 modelli su 270 sono in `all_ai_models.csv`, 109 nel notable e 118 nel large-scale. 99 dei 218 hanno il calcolo.
- I 52 non abbinati sono quasi tutti versioni datate («Gemini 2.5 Flash (Sep 2025)», «GPT-4o (May 2024)», «Mistral Large 2 (Nov 2024)»), modelli troppo recenti per il database («Mistral Large 4», «Claude Haiku 5.5») o i 17 senza Paese.
- Il Paese diverge in 9 casi su 218, ma solo per i doppioni di `all_ai_models.csv` («Canada,Canada» contro «Canada») e per RedPajama, vuoto nell'ECI e USA nel database. Non c'è nessun Paese diverso nella sostanza.

### Storico e confrontabilità

- La serie storica si ricostruisce da una sola fotografia, perché ogni riga ha la data di uscita. Parte dal 24 febbraio 2023. Prima non c'è nulla, quindi la capacità avrà una serie più corta di quella del calcolo (dal 2016).
- **I valori si muovono a ogni aggiornamento.** Epoch scrive: «values may shift slightly even for models whose data have not changed». Ho confrontato l'ECI di oggi con cinque fotografie dello ZIP su Wayback Machine. Ho abbinato i modelli per nome; nel vecchio formato ho preso il massimo tra le versioni dello stesso modello.

  | Fotografia | Modelli con ECI | In comune | Scarto mediano | Scarto massimo | Scarti > 2 punti | Ancore 130/150 |
  |---|---|---|---|---|---|---|
  | 1 gen 2026 | 140 | 129 | 0,80 | 11,3 (Cerebras-GPT-13B) | 29 | uguali |
  | 10 giu 2026 | 164 | 148 | 0,67 | 3,6 (GPT-5.5 Pro) | 7 | uguali |
  | 20 ago 2026 | 200 | 183 | 0,64 | 3,0 (Nemotron 3 Ultra) | 3 | uguali |
  | 17 set 2026 | 266 | 256 | 0,09 | 2,5 (GPT-6 Astra) | 2 | uguali |
  | 2 ott 2026 | 270 | 261 | 0,15 | 2,3 (GPT-6 Astra) | 2 | uguali |

  Gli scarti grandi riguardano modelli vecchi e piccoli, oppure modelli appena usciti con pochi benchmark. Dal 20 agosto, i primi 10 modelli sono sempre lo stesso insieme.
- **Conseguenza per la pipeline:** a ogni esecuzione conviene riscaricare `eci_scores.csv` e ricalcolare l'intera serie per area. Non bisogna accumulare valori di giorni diversi, come fa lo `storico` di Artificial Analysis. Una serie accumulata mescolerebbe calibrazioni diverse.
- **Il formato è cambiato** tra il 20 agosto e il 17 settembre 2026:
  - prima c'era `epoch_capabilities_index.csv` con `Model version, ECI Score, Release date, Organization, Country, …`, una riga per versione;
  - ora c'è `epoch_capabilities_index/eci_scores.csv` con `Model, eci, date, …`, una riga per modello.

  Il parser deve controllare le colonne e fermarsi se cambiano.
- **Limiti del confronto nel tempo:** per Epoch «Absolute ECI values are meaningless by themselves». Si possono confrontare le aree e gli anni sulla stessa fotografia, ma non dire «l'UE è a X punti di capacità» come una misura assoluta. Gli ECI per dominio (matematica, software, cyber) per esplicita avvertenza di Epoch non servono a misurare il progresso nel tempo: la card non deve usarli.

### Accesso

| Cosa | URL | Formato | Chiave | Limiti |
|---|---|---|---|---|
| Punteggi ECI | https://epoch.ai/data/eci_scores.csv | CSV, 33 KB | no | nessuno dichiarato |
| Hub completo (ECI, input, singoli benchmark, metadati) | https://epoch.ai/data/benchmark_data.zip | ZIP, 2,4 MB, 89 file | no | nessuno dichiarato |
| Difficoltà dei benchmark | https://epoch.ai/data/edi_scores.csv | CSV | no | — |
| Client Python `epochai` (MIT) | https://github.com/epoch-research/epochai-python | API Airtable | sì: una copia della base Airtable e un token personale | quelli di Airtable |

Il client serve solo a chi vuole le relazioni tra le entità. Per la card basta il CSV.

## 2. Benchmarking Hub di Epoch (singoli benchmark)

- Lo ZIP contiene 89 file: un CSV per benchmark (molti `*_external.csv`), `benchmark_metadata.csv`, `model_metadata.csv` e la cartella `epoch_capabilities_index/`. La pagina dice 411 modelli e 93 benchmark. `model_metadata.csv` ha 1.172 righe e 580 `model_group` distinti, con `organization` e `country`.
- **Copertura di `model_metadata.csv` per gruppo di modelli** (con `regions_of()`): USA 270, Cina 150, UE 38, Regno Unito 3, Altri 9, senza Paese 115.
  - L'UE comprende Mistral 35, poi BigScience, Mistral con All Hands AI ed EleutherAI con LAION (Germania), uno ciascuno.
  - Il Regno Unito comprende DeepMind 2 e Stability AI 1.
  - Altri comprende TII 4, Cohere 3, LG AI Research 1 e Upstage 1.
  - Nessun modello italiano.
- **Perché non basta:** non ha un punteggio aggregato. Scegliere un singolo benchmark, come GPQA Diamond, con 183 modelli nell'input dell'ECI, darebbe una misura più stretta e già satura in alto. L'aggregato giusto è l'ECI. L'Hub serve solo a capire perché un modello non ha l'ECI: ha meno di 4 benchmark.
- **Licenza:** è CC BY 4.0 per i dati di Epoch, mentre i file `*_external` mantengono la licenza della fonte originale. Esempio: `scicode_external.csv` viene da Artificial Analysis. Non vanno ripubblicati.

## 3. Arena (ex LMArena)

- **Chi e cosa:** Arena Intelligence, Inc. Il punteggio (`rating`) è un Bradley-Terry stimato dai voti degli utenti che confrontano due risposte. Misura la **preferenza umana**, con correzione per lo stile, non la capacità su compiti verificabili.
- **Licenza:**
  - Il dataset https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset è dichiarato `license: cc-by-4.0` nella scheda, non è ad accesso riservato ed è stato aggiornato il 21/10/2026. L'annuncio è il post del 2 aprile 2026: https://arena.ai/blog/arena-leaderboard-dataset/.
  - I **Terms of Use** del sito (aggiornati il 23/02/2026) limitano l'uso del servizio a «personal or internal business use» (§1). Vietano di riprodurre o distribuire il servizio e i suoi output (§5(i)), l'accesso automatico (§5(vi)) e lo scraping, compresi i nomi dei modelli (§5(vii)). Non parlano del dataset.
  - Ne deduco che si può usare **solo il dataset CC BY 4.0**, mai il sito. Resta un piccolo rischio di interpretazione sul §5(i).
- **Campi:** `model_name, organization, license, rating, rating_lower, rating_upper, variance, vote_count, rank, category, leaderboard_publish_date`. Non c'è il Paese, l'organizzazione è uno slug (`mistral`, `zai`, `thinky`) e non c'è la data di uscita, solo la data di pubblicazione della classifica.
- **Copertura per area.** Fonte: `text_style_control/latest-00000-of-00001.parquet`, classifica del 20/10/2026, `category = overall`, 417 modelli, scaricato il 22/10/2026. Lo slug è mappato sul Paese più frequente della stessa organizzazione in `all_ai_models.csv`, con una piccola tabella di alias. Script: `copertura_arena.py`.

  | Area | Modelli | Migliore |
  |---|---|---|
  | USA | 202 | 1.524 Gemini 4 Argon (High) |
  | Cina | 124 | 1.488 Kimi K3 (Max) |
  | UE | 18 (tutti Mistral) | 1.433 Mistral Large 4 |
  | Regno Unito | 0 | — |
  | Altri | 9 (Cohere 7, Upstage 2) | 1.388 Solar Pro 4 (Upstage, Corea del Sud) |
  | Sconosciuto | 64 | — |

  - Dei 64 sconosciuti, 49 non hanno l'organizzazione: sono modelli vecchi, tra cui Vicuna, Falcon 180B Chat, Jamba 1.5, Yi e Reka.
  - Gli altri 15 hanno uno slug che non ho trovato in Epoch: `allenai` 8, `thinky` 2, `ant-group` 2, `inception-ai` 2, `reflection` 1. A mano sono USA e Cina.
  - Nessun modello italiano. Rispetto all'ECI, Arena ha **in più la Corea** (Upstage), ma è comunque un solo creatore.
- **Storico:** lo split `full` ha 191 pubblicazioni dal 28/08/2024 al 20/10/2026 e 848 modelli distinti. Ma la scala si sposta: lo stesso `gpt-4o-2024-05-13` passa da 1.261 (agosto 2024) a 1.346 (ottobre 2026). Inoltre il metodo è cambiato più volte: Elo → Bradley-Terry nel gennaio 2024, controllo dello stile di default nel maggio 2025, ripesatura nel luglio 2025. I punteggi di date diverse non sono confrontabili. Si può confrontare solo l'ultima classifica.
- **Accesso:** parquet su Hugging Face, senza chiave. È circa 0,6 MB per `latest` e 54 MB per `full`.
- **Giudizio:** è una buona riserva per la sola fotografia di oggi, con la Corea in più. Però misura la preferenza degli utenti, non la capacità. Il Paese va attribuito a mano e lo storico non regge.

## 4. Fonti escluse

| Fonte | Chi | Perché esclusa |
|---|---|---|
| Artificial Analysis | Artificial Analysis | Data Platform Terms v1.1, §2.4(c-d): vietano la dashboard pubblica e l'unione con dati di terzi (ticket 02). |
| HELM Capabilities | Stanford CRFM | **Ferma**: l'ultima release, v1.15.0, ha `"date": "2025-11-24"` (`summary.json` sul bucket pubblico `crfm-helm-public`). Ha 68 modelli con un «Mean score»: OpenAI 13, Anthropic 9, Google 8, Mistral 5, Qwen 5, DeepSeek 2, nessun modello del 2026. Il codice è Apache 2.0, ma non ho trovato una licenza dichiarata per i risultati. |
| LiveBench | Abacus.AI, NYU e altri | Nessuna licenza sui dati: i dataset `livebench/*` su Hugging Face non dichiarano una licenza, tranne `liveswebench-patches` (MIT). Il repo GitHub è `NOASSERTION`, con codice Apache 2.0 derivato da FastChat. `model_judgment` è fermo al 7/4/2025. Non dà né organizzazione né Paese. |
| Open LLM Leaderboard | Hugging Face | **Archiviata**: il dataset `open-llm-leaderboard/contents` è fermo al 20/03/2025. Ha solo modelli a pesi aperti e nessuna licenza dichiarata sui risultati. |
| EuroEval | Alexandra Institute (Danimarca) | Classifiche per lingua, anche l'italiano, con un «Rank score» che è un rango medio relativo, non una scala di capacità. Ha il repo `EuroEval/leaderboards` (MIT), ma l'ultimo push è del 20/04/2026 e il CSV italiano lì ha 151 modelli, nessuno italiano (ho cercato Minerva, Velvet, iGenius, Almawave, LLaMAntino, Maestrale e Cerbero). Non dà il Paese. Utile solo per dire come va un modello in italiano. |
| OpenCompass | Shanghai AI Lab | Codice Apache 2.0. La classifica (rank.opencompass.org.cn) è in JavaScript e non ho trovato né un download né una licenza dei dati: **non verificata**. |

## Metodo

- **File scaricati il 22/10/2026** in una cartella temporanea fuori dal repo:
  - `https://epoch.ai/data/benchmark_data.zip` (2.356.799 byte; file interni datati 22/10/2026 08:20);
  - `https://epoch.ai/data/eci_scores.csv` (33.260 byte, identico a quello nello ZIP);
  - `all_ai_models.csv`, `notable_ai_models.csv` e `large_scale_ai_models.csv` da `https://epoch.ai/data/`;
  - le fotografie dello ZIP su Wayback Machine `20260101232245`, `20260610165052`, `20260820132734`, `20260917172847` e `20261002085223`, scaricate da `https://web.archive.org/web/<ts>id_/https://epoch.ai/data/benchmark_data.zip`;
  - dal dataset Arena su Hugging Face, `text_style_control/latest-00000-of-00001.parquet` e `text_style_control/full-00000-of-00001.parquet`;
  - per HELM, `schema.json`, `summary.json` e `groups/core_scenarios.json` della release v1.15.0;
  - per EuroEval, `leaderboards/italian_all_simplified.csv` dal repo GitHub.
- **Script** (fuori dal repo, lanciati con `python -I`):
  - `copertura_eci.py`: conteggi e massimi per area e anno, abbinamento per nome ai CSV dei modelli, copertura dell'Hub e quota dei modelli Epoch con l'ECI;
  - `tabella_eci.py`: la tabella per area con i senza Paese a parte, le soglie e le organizzazioni;
  - `stabilita_eci.py`: il confronto tra le fotografie;
  - `copertura_arena.py`: la copertura di Arena, con `pyarrow`.

  Tutti importano `regions_of()` da `pipeline/epoch.py`, al commit `490aea7`. I moduli `requests` e `yaml`, richiesti da `pipeline/common.py`, sono sostituiti da moduli vuoti, perché il conteggio non li usa.
- **Regole:**
  - l'anno è `date[:4]` per l'ECI e `Publication date[:4]` per i CSV dei modelli;
  - un modello conta una volta per ogni area restituita da `regions_of()`; nell'ECI nessun modello ha più aree;
  - le righe con Paese vuoto vanno in «Senza Paese», non in «Altri»;
  - «Modelli di linguaggio» vuol dire che `Domain` contiene «Language»;
  - gli abbinamenti tra file sono per nome esatto, con spazi tolti ai bordi.

## Fonti

Tutte consultate il 22 ottobre 2026.

- Epoch AI, *Epoch Capabilities Index*, con licenza, citazione e download: https://epoch.ai/eci
- Epoch AI, documentazione dell'ECI, nelle pagine panoramica, metodologia e FAQ: https://epoch.ai/data/eci-documentation, https://epoch.ai/data/eci-documentation/methodology, https://epoch.ai/data/eci-documentation/faq
- Epoch AI, *Capabilities & benchmarking*, panoramica e «Use this data» (licenza, citazione, ZIP): https://epoch.ai/benchmarks, https://epoch.ai/benchmarks/use-this-data
- File: https://epoch.ai/data/eci_scores.csv, https://epoch.ai/data/benchmark_data.zip, https://epoch.ai/data/all_ai_models.csv, https://epoch.ai/data/notable_ai_models.csv, https://epoch.ai/data/large_scale_ai_models.csv
- Epoch AI, `robots.txt`: https://epoch.ai/robots.txt. Termini delle consulenze, gli unici termini sul sito: https://epoch.ai/consulting-terms
- Codice: https://github.com/epoch-research/eci-public (MIT) e https://github.com/epoch-research/epochai-python (MIT)
- Paper: *A Rosetta Stone for AI Benchmarks*, https://arxiv.org/abs/2512.00193
- Wayback Machine, elenco delle fotografie dello ZIP: https://web.archive.org/cdx/search/cdx?url=epoch.ai/data/benchmark_data.zip
- Creative Commons, *Attribution 4.0 International*, sezione 3(a): https://creativecommons.org/licenses/by/4.0/legalcode.en
- Arena, dataset della classifica, con scheda e licenza: https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset. Annuncio: https://arena.ai/blog/arena-leaderboard-dataset/. Terms of Use (aggiornati il 23/02/2026): https://help.arena.ai/articles/5629909088-terms-of-use
- HELM Capabilities, release v1.15.0: https://storage.googleapis.com/crfm-helm-public/capabilities/benchmark_output/releases/v1.15.0/summary.json. Codice: https://github.com/stanford-crfm/helm (Apache 2.0)
- LiveBench: https://github.com/LiveBench/LiveBench, dataset https://huggingface.co/livebench
- Open LLM Leaderboard: https://huggingface.co/datasets/open-llm-leaderboard/contents
- EuroEval: https://euroeval.com/leaderboards/italian e https://github.com/EuroEval/leaderboards (MIT)
- OpenCompass: https://rank.opencompass.org.cn/home e https://github.com/open-compass/opencompass (Apache 2.0)
- Ricerche precedenti di questa mappa: `docs/research/epoch-per-paese.md` (ramo `research/epoch-per-paese`) e `docs/research/capacita-artificial-analysis.md` (ramo `research/capacita-artificial-analysis`).
