# Capacità per area con Artificial Analysis

Ricerca per il ticket wayfinder «02: Capacità per area con Artificial Analysis» (GeopoliticAI). Consultazione delle fonti: 22 ottobre 2026. Senza `AA_API_KEY`: i numeri vengono dalla documentazione, dalle pagine pubbliche di Artificial Analysis (AA), da `data/artificial_analysis.json` (60 modelli, dati del 21 ottobre 2026) e dal CSV di Epoch.

## Sintesi

1. **Copertura.** AA dichiara di valutare 131 modelli nella vista corrente; il suo database ne conta 706. La classifica pubblica mostra circa 55 creatori. Quasi tutti sono statunitensi o cinesi. Per l'UE ci sono solo Mistral (Francia, al massimo 38 sull'indice) e Multiverse Computing (Spagna, 27). Non c'è nessun creatore del Regno Unito (Epoch attribuisce Google DeepMind agli USA) e nessun creatore italiano. Nei primi 60 salvati dalla pipeline ci sono 51 varianti USA e 9 cinesi, e nessuna di altre aree. Nessun modello fuori da USA e Cina supera 40,8, la soglia del 60° posto.
2. **Creatore → Paese.** L'API gratuita dà il creatore (`model_creator`: `id`, `name`, `slug`) ma non il Paese. La tabella creatore → Paese → area si costruisce a mano: dei 55 creatori, 48 sono in Epoch con «Country (of organization)» e 7 mancano. 11 casi sono segnati come dubbi: i 7 assenti più Google (DeepMind), SpaceXAI, Inception e Institute of Foundation Models. Il sito di AA ha una vista «By Country», quindi AA il Paese lo conosce, ma l'API documentata non lo espone.
3. **Storico.** L'API documentata non dà la data di uscita dei modelli (c'è solo per gli endpoint media), non ha serie storiche e non dice la versione dell'indice. L'indice cambia spesso: ci sono state 4 versioni solo a settembre 2026 (v4.2, v4.3, v4.3.1, v4.3.2). I punteggi cambiano molto da una versione all'altra (per esempio Apodex 1.1: 44 in v4.1.1, 26 in v4.3.2). I valori vecchi quindi non sono confrontabili. Uno storico onesto per area si può fare solo accumulando fotografie nostre e spezzando la serie a ogni cambio di versione. In più, i dati «Performance Over Time» di AA sono riservati al piano Commercial.
4. **Limiti.** Con la chiave gratuita i [Data Platform Terms v1.1](https://artificialanalysiscdn.com/legal/ProDataPlatformTerms.pdf) del 19 agosto 2026 permettono solo:
   - l'uso interno;
   - la condivisione pubblica di grafici, con il logo di AA visibile;
   - brevi citazioni di singoli valori, con «Source: Artificial Analysis (artificialanalysis.ai)» e il link, mai in forma tabellare o leggibile da una macchina.

   Vietano invece:
   - di pubblicare i dati grezzi (anche in JSON);
   - di esporli in una dashboard pubblica;
   - di combinarli con dati di terzi (per esempio i Paesi di Epoch) in un prodotto aperto a terzi.

   Il limite di richieste (1.000 al giorno) non è un problema. **Una card per area basata sull'indice di AA richiede quindi il permesso scritto di AA.** Anche l'uso attuale nel sito (il JSON nel repo pubblico e la tabella dei primi 40 modelli) è probabilmente fuori dai termini.

## 1. Copertura per area

### Quanti modelli valuta AA

Lo stesso sito dà numeri diversi:

| Dove | Cosa dice | Fonte |
|---|---|---|
| Pagina modelli, FAQ | «out of 131 models evaluated»; «There are 66 open weights models out of 131 total evaluated» | [artificialanalysis.ai/models](https://artificialanalysis.ai/models), 22/10/2026 |
| Pagina modelli, FAQ | «Performance metrics are measured directly using standardized prompts across 271 models» | come sopra |
| Pagina modelli, filtri | «27 of 706 models» (la dimensione del database, modelli ritirati compresi) | come sopra |
| Classifica | «over 250 AI models (LLMs)» | [artificialanalysis.ai/leaderboards/models](https://artificialanalysis.ai/leaderboards/models), 22/10/2026 |

Il 131 riguarda i modelli con l'indice di intelligenza nella vista «Current», cioè quelli che servono per la capacità. Quanti modelli restituisce davvero `GET /api/v2/data/llms/models`, e con quale filtro sullo stato, **si può sapere solo con la chiave**.

Attenzione: AA conta come modelli distinti anche le varianti di sforzo di ragionamento. Nei 60 salvati ci sono 28 modelli base (per esempio Claude Opus 5.5 compare in 4 varianti: Max, Xhigh, High e Medium). Per contare i modelli di un'area bisogna raggrupparli per modello base, togliendo il suffisso tra parentesi. Questo raggruppamento è euristico.

### I 60 modelli salvati dalla pipeline (21 ottobre 2026)

Fonte: `data/artificial_analysis.json`. L'area viene dalla tabella della sezione 2.

| Area | Varianti | Modelli base | Indice massimo | Indice minimo |
|---|---|---|---|---|
| USA | 51 | 19 | 57,6 (Claude Opus 5.5, Max) | 40,8 |
| Cina | 9 | 9 | 46,3 (MiMo-V2.6-Pro, Xiaomi) | 41,1 |
| UE, Regno Unito, Altri | 0 | 0 | — | — |

I modelli cinesi presenti sono MiMo-V2.6-Pro (Xiaomi), Qwen3.8 Max (Alibaba), DeepSeek V4.1 Flash (DeepSeek), GLM-5.3 e GLM-5.3-Flash (Z AI), Step 5 Preview (StepFun), Kimi K3 (Kimi/Moonshot), MiniMax-M3.1-Flash (MiniMax) e Ling 3.1 Flash (InclusionAI). Il 60° modello ha 40,8: le altre aree stanno tutte sotto.

### Fuori dai primi 60 (classifica pubblica, 22 ottobre 2026)

Il miglior modello di ogni creatore non statunitense e non cinese, più quelli con il Paese incerto. I valori sono letti dalla classifica pubblica, arrotondati all'intero. L'asterisco nella pagina segna le stime: nelle pagine dei modelli c'è scritto «Estimate (independent evaluation forthcoming)». La pagina è stata letta in modo parziale, quindi i numeri di righe sono indicativi.

| Area | Creatore | Miglior modello | Indice |
|---|---|---|---|
| UE (Francia) | Mistral | Mistral Large 4 Preview | 38 |
| UE (Spagna) | Multiverse Computing | Quasar 438B (max) | 27 |
| Altri (Singapore) | Sapiens AI | Agnes 2.5 Pro Beta | 35* |
| Altri (Corea del Sud) | Motif Technologies | Motif 3 | 34* |
| Altri (EAU) | Institute of Foundation Models (MBZUAI) | K2 Horizon 375B A23B | 31 |
| ? (sede ignota) | Apodex | Apodex 1.1 | 26 |
| ? (sede ignota) | AI9Stars | G9v3-39A5B | 22* |
| Cina (dubbio) | Nex AGI | Nex-N2-Pro | 28* |
| Altri (Corea del Sud) | Upstage | Solar Open2 250B | 25* |
| Altri (Corea del Sud) | SK Telecom | A.X-K2 | 21 |
| Altri (Corea del Sud) | LG AI Research | K-EXAONE 2.0 | 20* |
| Altri (Canada) | Cohere | Command A+ | 13 |
| Altri (Corea del Sud) | Korea Telecom | Mi:dm K 2.5 Pro | 11* |
| Altri (Corea del Sud) | Naver | HyperCLOVA X SEED Think (32B) | 11* |
| Altri (Corea del Sud) | Trillion Labs | Tri-21B-Think | 9* |
| Altri (India) | Sarvam | Sarvam 105B (high) | 9* |
| Altri (EAU) | TII UAE | Falcon-H1R-7B | 8* |
| Altri (Israele) | AI21 Labs | Jamba 1.7 Large | 6* |

- **Regno Unito**: nessun creatore. L'unico candidato sarebbe Google DeepMind (sede a Londra), ma AA lo chiama «Google» ed Epoch attribuisce agli USA tutti i modelli Gemini (44 righe su 44 nel CSV `all_ai_models`).
- **UE**: solo Mistral e Multiverse Computing. Aleph Alpha (Germania), il progetto svizzero Apertus (fuori dall'UE comunque) e Black Forest Labs (che fa modelli di immagini) non compaiono nella classifica degli LLM.
- **Italia**: nessun creatore italiano nella classifica pubblica. Una ricerca di Velvet (Almawave), Minerva (Sapienza), Modello Italia (iGenius/Domyn) su artificialanalysis.ai non trova pagine. Anche in Epoch i modelli con «Italy» sono 13 in tutto, e nessuno è un LLM generalista recente. L'Italia andrebbe mostrata con zero modelli valutati.
- **«Altri»** è dominato dalla Corea del Sud: almeno 7 creatori, più di qualsiasi area tranne USA e Cina. Questo conferma la domanda aperta della mappa («Se dividere Altri»). Un grafico di AA, citato dalla stampa coreana, mette la Corea al terzo posto dopo USA e Cina ([mt.co.kr, 26/08/2026](https://www.mt.co.kr/en/tech/2026/08/26/2026082608375762808), fonte secondaria).

## 2. Creatore → Paese → area

### Cosa dà l'API

Dalla [documentazione](https://artificialanalysis.ai/documentation), consultata il 22/10/2026, i campi di `GET /api/v2/data/llms/models` sono:

- `id`: «Unique identifier (stable)».
- `name`: «Full name (may change)».
- `slug`.
- `model_creator`: «Creator information (id, name, slug)».
- `evaluations`, con chiavi tra cui `artificial_analysis_intelligence_index`, `artificial_analysis_coding_index`, `artificial_analysis_math_index` e i singoli benchmark.
- `pricing`, `median_output_tokens_per_second`, `median_time_to_first_token_seconds`.

L'endpoint non ha parametri di query documentati.

Mancano il **Paese**, la **data di uscita** e il campo **open weights**. AA il Paese lo conosce: la home ha un filtro «By Country» nella sezione dell'indice ([artificialanalysis.ai](https://artificialanalysis.ai/), 22/10/2026). AA pubblica anche un grafico «Trend of Open-Weight AI Model Performance by Country» (citato in [mt.co.kr](https://www.mt.co.kr/en/tech/2026/08/26/2026082608375762808)). Questi dati però non sono nell'API gratuita documentata. La pipeline va a chiave sul `model_creator.id`, che è stabile; il nome può cambiare.

### Tabella

Riferimento: la colonna «Country (of organization)» di [`all_ai_models.csv` di Epoch](https://epoch.ai/data/all_ai_models.csv), scaricato il 22/10/2026 (3.628 righe). Il nome dell'organizzazione in Epoch è tra parentesi quando è diverso da quello di AA. L'area si ottiene applicando `regions_of()` di `pipeline/epoch.py`. I creatori sono quelli della classifica pubblica nella vista «Current», più quelli dei 60 salvati.

| Creatore AA | Organizzazione in Epoch | Paese (Epoch) | Area | Nota |
|---|---|---|---|---|
| Anthropic | Anthropic | United States of America | USA | |
| OpenAI | OpenAI | United States of America | USA | |
| Google | Google DeepMind | United States of America | USA | **Dubbio**: DeepMind ha sede a Londra. I modelli DeepMind pre-fusione sono in Epoch come United Kingdom (45 righe), i Gemini come USA. |
| Meta | Meta AI | United States of America | USA | Alcuni modelli FAIR sono «USA, France». |
| SpaceXAI | xAI | United States of America | USA | Il nome in AA è diverso da quello in Epoch: da verificare che sia la stessa organizzazione. |
| Amazon | Amazon | United States of America | USA | |
| Microsoft | Microsoft | United States of America | USA | Microsoft Research Asia è China in Epoch, ma qui non conta. |
| NVIDIA | Nvidia | United States of America | USA | |
| IBM | IBM | United States of America | USA | |
| Perplexity | Perplexity | United States of America | USA | |
| Nous Research | Nous Research | United States of America | USA | |
| Allen Institute for AI | Allen Institute for AI | United States of America | USA | |
| Prime Intellect | Prime Intellect | United States of America | USA | |
| Thinking Machines | Thinking Machines | United States of America | USA | |
| Liquid AI | Liquid | United States of America | USA | |
| ServiceNow | (solo in collaborazioni) | United States of America | USA | Lieve dubbio: Epoch lo ha solo insieme ad altri. |
| Arcee AI | (solo in collaborazioni) | United States of America | USA | Lieve dubbio, come sopra. |
| Inception | Inception Labs | United States of America | USA | **Dubbio**: in Epoch esiste anche «Inception G42» (EAU). Il creatore di AA dovrebbe essere Inception Labs (Mercury). |
| Reka AI | Reka AI | United States of America | USA | |
| Reflection | — | (USA) | USA | **Dubbio**: non è in Epoch. È un laboratorio di New York ([OfficeChai](https://officechai.com/ai/reflection-ai-releases-beam-becomes-second-best-us-open-model-on-artificial-analysis-intelligence-index/), [SCMP](https://scmp.com/tech/tech-trends/article/3369885/nvidia-backed-reflection-ai-challenges-chinese-dominance-open-weight-models)). |
| Celeris | — | (USA) | USA | **Dubbio**: non è in Epoch. Celeris Labs ha sede a San Francisco ([Dealroom](https://app.dealroom.co/companies/celeris_labs)). |
| Alibaba | Alibaba | China | Cina | |
| DeepSeek | DeepSeek | China | Cina | |
| Z AI | Z.ai (Zhipu AI) | China | Cina | |
| Kimi | Moonshot | China | Cina | Il nome in AA è quello del prodotto. |
| MiniMax | MiniMax | China | Cina | |
| StepFun | StepFun | China | Cina | |
| Xiaomi | Xiaomi Corp | China | Cina | |
| InclusionAI | Ant Group | China | Cina | InclusionAI è il marchio open source di Ant Group. |
| Tencent | Tencent | China | Cina | |
| Baidu | Baidu | China | Cina | |
| ByteDance Seed | ByteDance | China | Cina | |
| China Mobile | China Mobile | China | Cina | |
| KwaiKAT | Kuaishou Technology | China | Cina | |
| LongCat | Meituan Inc | China | Cina | |
| OpenBMB | OpenBMB / ModelBest | China | Cina | |
| Nanbeige | Nanbeige LLM Lab | China | Cina | |
| Nex AGI | — | (China) | Cina | **Dubbio**: non è in Epoch. È un consorzio legato allo Shanghai Innovation Institute e la sede legale non è chiara ([RuntimeWire](https://runtimewire.com/article/nex-n2-5-open-agent-models-35b-1-6t)). Il suo modello Nex-N2-Pro è basato su Qwen3.5. |
| AI9Stars | — | ? | ? | **Dubbio**: non è in Epoch e la sede non si trova. Crea G9v3-39A5B. |
| Mistral | Mistral AI | France | UE | |
| Multiverse Computing | — | (Spain) | UE | **Dubbio** solo perché non è in Epoch. La sede è a San Sebastián ([comunicato aziendale, 18/12/2025](https://multiversecomputing.com/resources/multiverse-computing-opens-new-offices-in-madrid-and-strengthens-its-position-as-spain-s-ai), [PitchBook](https://pitchbook.com/profiles/company/439154-83)). Fa versioni compresse di modelli altrui. |
| Cohere | Cohere | Canada | Altri | |
| AI21 Labs | AI21 Labs | Israel | Altri | |
| LG AI Research | LG AI Research | South Korea | Altri | |
| Upstage | Upstage | South Korea | Altri | |
| SK Telecom | SK Telecom | South Korea | Altri | |
| Korea Telecom | KT | South Korea | Altri | |
| Naver | NAVER | South Korea | Altri | |
| Motif Technologies | Motif Technologies | South Korea | Altri | |
| Trillion Labs | Trillion Labs | South Korea | Altri | |
| Sarvam | Sarvam | India | Altri | |
| TII UAE | Technology Innovation Institute | United Arab Emirates | Altri | |
| Institute of Foundation Models | MBZUAI (solo in collaborazioni) | United Arab Emirates | Altri | **Dubbio**: IFM è un istituto di MBZUAI (Abu Dhabi) con laboratori anche nella Silicon Valley e a Parigi ([MBZUAI](https://mbzuai.ac.ae/news/mbzuais-institute-of-foundation-models-launches-k2-horizon-the-worlds-largest-fully-open-ai-mo)). |
| Sapiens AI | — | (Singapore) | Altri | **Dubbio**: non è in Epoch. La sede è a Singapore secondo un comunicato ([TechNode Global](https://technode.global/prnasia/sapiensai-launches-agnes-singapores-homegrown-answer-to-deepseek/)). |
| Apodex | — | ? | ? | **Dubbio**: non è in Epoch e la sede non si trova (G2 dice «HQ Location: N/A»). Alcuni blog indicano come fondatore Chen Tianqiao: Cina o Singapore. |

In tutto ci sono 55 creatori: 21 USA, 17 Cina (Nex AGI incerto), 2 UE, 0 Regno Unito, 13 Altri e 2 senza Paese (AI9Stars, Apodex). 48 sono in Epoch, anche solo in collaborazioni, e 7 mancano. I creatori non statunitensi né cinesi sono pochi e hanno modelli piccoli, quindi la tabella si mantiene a mano. Conviene metterla nel codice con la fonte per ogni riga e far fallire la pipeline (o segnalare) quando arriva un `model_creator.id` che non c'è.

## 3. Storico e versioni dell'indice

### Cosa non c'è

- **Data di uscita**: non c'è nell'endpoint LLM. La documentazione mette `release_date` solo negli endpoint media. Le pagine pubbliche dei modelli invece la mostrano a mesi, per esempio «Release: August 2026» per Apodex 1.1 ([confronto Apodex/Nex](https://artificialanalysis.ai/models/comparisons/apodex-1-1-vs-nex-n2-pro)). Leggerla da lì però sarebbe scraping, vietato dai [Terms of Use](https://artificialanalysis.ai/docs/legal/Terms-of-Use.pdf), §3.3(b)(vi). In alternativa si può prendere la «Publication date» di Epoch abbinando i nomi, ma l'abbinamento è fragile.
- **Serie storiche**: la documentazione non ha endpoint storici, e ogni endpoint restituisce lo stato corrente. Nei Data Platform Terms, §1.13 e §2.3, «performance-over-time data» è solo del piano Commercial, con un Order Form.
- **Versione dell'indice**: la risposta non la dice. La versione è scritta solo nelle didascalie del sito, per esempio «Artificial Analysis Intelligence Index v4.3.2 incorporates 10 evaluations…» sulla home.

### Le versioni cambiano spesso

Dalla sezione «Version History» della [metodologia](https://artificialanalysis.ai/methodology/intelligence-benchmarking), consultata il 22/10/2026:

| Versione | Periodo | Cambi principali |
|---|---|---|
| v1.0–1.3 | gen 2024 – 10 feb 2025 | — |
| v2.0 | 11 feb – 4 ago 2025 | — |
| v2.1 / v2.2 | ago 2025 | Entrano IFBench, AIME 2025 e AA-LCR; escono MATH-500 e AIME 2024. |
| v3.0 | 2 set – dic 2025 | Entrano Terminal-Bench Hard e τ²-Bench Telecom. |
| v4.0 | gen 2026 | Entrano GDPval-AA, AA-Omniscience e CritPt; escono MMLU-Pro, LiveCodeBench e AIME 2025; i pesi diventano per categoria. |
| v4.0.1–v4.0.4 | gen – giu 2026 | Cambiano grader e ancore Elo. |
| v4.1 / v4.1.1 | giu – set 2026 | GDPval-AA v2 con l'Elo «re-baselined»; Terminal-Bench 2.1 e τ³-Banking; esce IFBench. |
| v4.2 | set 2026 | Entrano AA-Briefcase e GDP.pdf, esce GPQA Diamond. |
| v4.3 / v4.3.1 / v4.3.2 | set 2026 – oggi | Entrano AutomationBench-AA e Terminal-Bench 4.0; l'Elo viene ri-ancorato. |

La metodologia **non dice** che i punteggi siano confrontabili tra versioni. Su singole componenti dice il contrario: per AA-LCR v1.1 «Scores are not directly comparable with v1.0», e per Harvey LAB-AA «scores are not comparable across the two versions». Avverte anche che «Artificial Analysis may update the reference parameters as models progress against the evaluation». Un esempio concreto: Apodex 1.1 aveva 44 in v4.1.1 (lo dice l'estratto di un motore di ricerca della stessa pagina di confronto, quindi è una fonte secondaria) e oggi ha 26 in v4.3.2 ([pagina di confronto](https://artificialanalysis.ai/models/comparisons/apodex-1-1-vs-nex-n2-pro)). È lo stesso modello, ma il punteggio è sceso di 18 punti.

### Cosa significa per GeopoliticAI

- **La fotografia attuale per area si può fare.** Per ogni area si prende il miglior modello oggi (o il numero di modelli sopra una soglia), sulla versione corrente dell'indice.
- **Lo storico della capacità non si ricostruisce all'indietro** con l'API gratuita. Si può accumulare in avanti con le nostre rilevazioni, come fa già lo `storico` della pipeline (che è partito il 15/10/2026 e tiene solo l'indice massimo globale). Bisogna però:
  - salvare per ogni area, non solo il massimo globale;
  - segnare la versione dell'indice, che l'API non dà: si può riconoscere da un salto improvviso nei punteggi dello stesso `id`, oppure annotarla a mano;
  - spezzare la serie a ogni cambio di versione.

  A settembre 2026 una serie così si sarebbe spezzata 4 volte in un mese. Da qui il consiglio: **niente storico della capacità nella prima versione**. L'andamento nel tempo resta al calcolo di addestramento (Epoch, dal 2016). In ogni caso, anche lo storico accumulato da noi incontra i limiti della sezione 4.

## 4. Termini d'uso, attribuzione e limiti

Due documenti, entrambi richiamati dalla documentazione («Use of the API is subject to our Terms of Use and Data Platform Terms»):

- [Website Terms of Use](https://artificialanalysis.ai/docs/legal/Terms-of-Use.pdf), v1.0 del 28/04/2024, per il sito.
- [Data Platform Terms and Conditions](https://artificialanalysiscdn.com/legal/ProDataPlatformTerms.pdf), v1.1 del 19/08/2026, che si applicano esplicitamente anche all'API gratuita: «These Terms also govern access to and use of the Artificial Analysis API on the free tier».

### Cosa è permesso con la chiave gratuita

Data Platform Terms, §2.3 «All Tiers»:

- l'uso interno («Internal Use»);
- «share charts and visualizations publicly», con l'attribuzione del §5;
- «brief citations of individual Data points in publicly available content (e.g., blog posts, articles, press releases)», con l'attribuzione «Source: Artificial Analysis (artificialanalysis.ai)» e il link, a condizione che **«do not reproduce Data in a structured, tabular, or machine-readable format»**.

Creare e distribuire all'esterno i «Derived Data» (aggregati, medie, indici derivati) è permesso solo ai piani Pro e Commercial (§2.3, «Pro and Commercial»). Inoltre §1.10 dice che non sono Derived Data gli output «where the underlying Data remains individually identifiable». Il «miglior indice per area» coincide con il punteggio di un singolo modello, quindi è un dato individuale e non un dato derivato.

### Cosa è vietato (a tutti i piani)

- §2.4(a)(b): distribuire i file di dati grezzi, anche «JSON», o offrirli in download.
- §2.4(c): **«Embed or otherwise make raw Data available through any customer-facing product, API, dashboard, or service»**.
- §2.4(d): **«Combine Data with data from third-party sources to create a product, dataset, or service that is made available to any third party»**. Unire l'indice di AA ai Paesi di Epoch e pubblicarlo ricade qui.
- §2.5: creare un «Competitive Product», cioè un servizio il cui scopo principale è il benchmarking o il confronto di modelli. AI Radar non lo è, ma una classifica per area ci si avvicina.
- §3.2: presentare i dati in modo selettivo e fuorviante attribuendolo ad AA.
- §2.6(d): usare i dati per addestrare modelli.
- Website Terms of Use §2.2 e §3.3(b)(vi): copiare o ripubblicare contenuti del sito, e fare scraping delle pagine.

### Attribuzione

Data Platform Terms, §5: l'attribuzione è obbligatoria «at all subscription tiers and in all use cases… There are no exceptions».

| Contenuto | Attribuzione richiesta |
|---|---|
| Grafici e visualizzazioni | Il logo di Artificial Analysis visibile sul grafico (c'è un [brand kit](https://artificialanalysiscdn.com/brand-kit/aa_brand_kit.zip)). |
| Dati e metriche | «Source: Artificial Analysis (artificialanalysis.ai)», con il link quando si può. |
| Derived Data (solo Pro e Commercial) | «Based on data from Artificial Analysis» più una dichiarazione che AA non approva il contenuto (§5.2). |

La documentazione dell'API aggiunge: «Attribution is required for all use of our free API. Please provide attribution to https://artificialanalysis.ai/».

### Limiti di richieste e altro

- «The API is rate-limited to 1,000 requests per day» ([documentazione](https://artificialanalysis.ai/documentation)). Una richiesta restituisce tutti i modelli, quindi non è un vincolo.
- La documentazione chiede di non mettere la chiave nel codice client e di salvare le risposte in cache.
- Quando il contratto finisce, i dati grezzi vanno cancellati entro 30 giorni (§11.7). AA può chiudere l'accesso in qualsiasi momento (§11.6) e può controllare l'uso (§6).

### Conseguenze

- **La card GeopoliticAI con la capacità per area**, cioè una vista pubblica che unisce l'indice di AA e i Paesi di Epoch, **non sta nei termini della chiave gratuita**: violerebbe §2.4(c) e (d). Con il piano Pro resta comunque un dubbio su §2.4(c) e (d). Per farla serve il consenso scritto di AA o un Order Form. Il contatto indicato nei termini è `hello@artificialanalysis.ai`.
- **Le strade pulite senza permesso** sono due:
  - una o due citazioni in prosa («il miglior modello europeo, Mistral Large 4 Preview, ha 38 sull'indice di AA; il migliore statunitense 58»), con «Source: Artificial Analysis (artificialanalysis.ai)» e il link, senza tabelle;
  - un link alla vista «By Country» sul sito di AA.
- **Da segnalare per l'uso attuale.** I termini v1.1 (19/08/2026) sono precedenti alla pipeline (15/10/2026). Due cose esistenti sembrano in contrasto:
  - `data/artificial_analysis.json` è un file JSON di dati grezzi in un repo pubblico, con le versioni giornaliere nella storia git (§2.4(a)(b) e §2.3);
  - `web/src/lib/tiles/ModelliDetail.svelte` mostra una tabella dei primi 40 modelli e uno scatter senza il logo di AA (§2.3, che vieta la forma tabellare, e §5.1, che chiede il logo sui grafici).

  Va deciso a parte. È fuori da questo ticket, ma pesa sulla scelta.

## 5. Cosa resta da verificare con la chiave

1. Quanti modelli restituisce l'API: tutti i 706 del database, solo quelli «Current» (131) o un altro sottoinsieme. E quanti hanno `artificial_analysis_intelligence_index` non nullo.
2. I campi esatti della risposta: se `model_creator` ha davvero solo `id`, `name` e `slug`, e se ci sono campi non documentati come `release_date`, il Paese, gli open weights o la versione dell'indice.
3. L'elenco completo dei `model_creator` restituiti, da confrontare con la tabella della sezione 2. La lettura della classifica pubblica era parziale.
4. I valori esatti dei creatori non USA e non cinesi (la classifica pubblica arrotonda e segna le stime) e se le stime con asterisco hanno un segnale nell'API.
5. Se SpaceXAI, Inception, Institute of Foundation Models e Apodex sono le organizzazioni che si suppone (con il `model_creator.slug`).
6. La sede di AI9Stars, Apodex e Nex AGI.

## Fonti

Tutte consultate il 22 ottobre 2026.

- Artificial Analysis, documentazione API: <https://artificialanalysis.ai/documentation>
- Artificial Analysis, Data Platform Terms and Conditions v1.1 (19/08/2026): <https://artificialanalysiscdn.com/legal/ProDataPlatformTerms.pdf>
- Artificial Analysis, Website Terms of Use v1.0 (28/04/2024): <https://artificialanalysis.ai/docs/legal/Terms-of-Use.pdf>
- Artificial Analysis, metodologia dell'indice e storia delle versioni: <https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- Artificial Analysis, home (filtro «By Country», grafico «Frontier Language Model Intelligence, Over Time»): <https://artificialanalysis.ai/>
- Artificial Analysis, pagina modelli (131, 271 e 706 modelli): <https://artificialanalysis.ai/models>
- Artificial Analysis, classifica LLM: <https://artificialanalysis.ai/leaderboards/models>
- Artificial Analysis, confronto Apodex 1.1 / Nex-N2-Pro: <https://artificialanalysis.ai/models/comparisons/apodex-1-1-vs-nex-n2-pro>
- Epoch AI, `all_ai_models.csv` (colonne «Organization» e «Country (of organization)»): <https://epoch.ai/data/all_ai_models.csv>
- AI Radar, `data/artificial_analysis.json` (21/10/2026) e `pipeline/epoch.py` (`regions_of()`), in questo repo.
- Sedi dei creatori assenti da Epoch: [Multiverse Computing](https://multiversecomputing.com/resources/multiverse-computing-opens-new-offices-in-madrid-and-strengthens-its-position-as-spain-s-ai), [PitchBook su Multiverse](https://pitchbook.com/profiles/company/439154-83), [Reflection AI (OfficeChai)](https://officechai.com/ai/reflection-ai-releases-beam-becomes-second-best-us-open-model-on-artificial-analysis-intelligence-index/), [Reflection AI (SCMP)](https://scmp.com/tech/tech-trends/article/3369885/nvidia-backed-reflection-ai-challenges-chinese-dominance-open-weight-models), [Celeris Labs (Dealroom)](https://app.dealroom.co/companies/celeris_labs), [Sapiens AI (TechNode Global)](https://technode.global/prnasia/sapiensai-launches-agnes-singapores-homegrown-answer-to-deepseek/), [IFM di MBZUAI](https://mbzuai.ac.ae/news/mbzuais-institute-of-foundation-models-launches-k2-horizon-the-worlds-largest-fully-open-ai-mo), [Nex AGI (RuntimeWire)](https://runtimewire.com/article/nex-n2-5-open-agent-models-35b-1-6t), [Apodex (G2)](https://www.g2.com/sellers/apodex).
- Corea del Sud terza nel grafico per Paese di AA (fonte secondaria): <https://www.mt.co.kr/en/tech/2026/08/26/2026082608375762808>
