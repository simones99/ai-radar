# Fonti per la domanda di lavoro

Ricerca per il passo P0.1 di `.scratch/crescita/piano.md`, «Adzuna: una scadenza e un piano B». La domanda: quali fonti possono sostituire Adzuna per la domanda di lavoro per competenza e Paese, e con quale licenza. Pagine consultate e file scaricati il 13 novembre 2026, tra le 13:51 e le 14:05 UTC.

## Sintesi

1. **Cosa va sostituito.** Oggi `pipeline/adzuna.py` fa una rilevazione a settimana (settimana ISO) in 8 Paesi: Stati Uniti, Regno Unito, Germania, Francia, Italia, Spagna, Paesi Bassi e Polonia.
   - Per ogni Paese chiede il numero totale di annunci pubblicati negli ultimi 30 giorni, più un conteggio per ciascuna delle 16 competenze. Il conteggio usa una frase esatta in inglese (`what_phrase`, per esempio «Model Context Protocol»). Sono 17 × 8 = 136 chiamate, e da ogni risposta si legge solo il campo `count`.
   - `pipeline/radar.py` ne ricava la **domanda**, cioè gli annunci ogni 10mila: per ogni Paese la mediana delle ultime 4 rilevazioni, poi la mediana tra i Paesi (il Paese a metà classifica). Nel mercato «Italia» usa anche il numero di annunci italiani, che fa scattare il dato incerto (ADR 0003).
   - Lo storico tiene fino a 104 rilevazioni per Paese.
   - Il radar ha quindi bisogno di tre cose: **un conteggio per competenza scelta da noi (testo libero), per Paese, Italia compresa, ogni settimana, insieme al totale dello stesso Paese.**
2. **La risposta breve: nessuna delle fonti aperte che ho trovato dà questo.** Le fonti con una licenza chiara si dividono in tre gruppi:
   - quelle che contano **l'AI in blocco** per Paese, senza le singole competenze: Indeed Hiring Lab, AI Index/Lightcast, OECD.AI/LinkedIn;
   - quelle che danno **categorie fisse e larghe**: Eurostat (specialisti ICT, professioni ISCO), Excelsior (competenze digitali), Skills-OVATE ed EURES (competenze ESCO);
   - quelle che cercano **testo libero ma in un solo Paese**, e mai in Italia: JobTech in Svezia, la Bundesagentur in Germania.

   Le API dei siti di annunci che coprono l'Italia (Jooble, Careerjet) servono a mostrare annunci con un link e non a fare statistiche, e i loro termini sono più stretti di quelli di Adzuna.
3. **Candidati valutati: 22.**
   - Dati pubblici: Indeed Hiring Lab (due archivi e l'API), Eurostat (annunci online e posti vacanti), Cedefop Skills-OVATE, EURES, Istat, Excelsior, Ministero del Lavoro (comunicazioni obbligatorie).
   - Dati commerciali o ripubblicati: Lightcast, AI Index (via Our World in Data), OECD.AI, LinkedIn.
   - API di annunci: Jooble, Careerjet, The Muse, USAJOBS, Arbeitsagentur, France Travail, JobTech.
   - Proxy: Hacker News «Who is hiring», Stack Overflow Developer Survey, GitHub Innovation Graph.
4. **Licenza.** Nessuna delle fonti con licenza aperta ha un divieto di dashboard pubblica o di unione con altri dati come il §2.4(c-d) di Artificial Analysis.
   - **Indeed Hiring Lab:** CC BY 4.0, con la citazione di Hiring Lab.
   - **Eurostat:** CC BY 4.0. **Istat** ed **Excelsior:** CC BY 4.0, Excelsior anche per uso commerciale.
   - **JobTech:** CC0.
   - **AI Index:** CC BY-ND 4.0, cioè niente versioni modificate. Il sito lo usa già, via OWID.
   - **OECD.AI e LinkedIn:** nessuna licenza dichiarata sulla pagina, solo «All rights reserved». In più LinkedIn vieta di copiare i dati.
   - **Jooble e Careerjet:** API per siti che pubblicano annunci. Jooble vieta i bot e la ripubblicazione dei contenuti.
5. **Copertura.**

   | Fonte | Italia | Per competenza | Frequenza | Ritardo |
   |---|---|---|---|---|
   | Adzuna (oggi) | sì | testo libero | settimanale (nostra) | nessuno |
   | Indeed AI tracker | sì | no, solo «AI» | dato giornaliero, aggiornato ogni mese | circa 6 settimane |
   | Eurostat `isoc_sk_oja` | sì, anche per regione | no, solo specialisti ICT | trimestrale | 2 trimestri |
   | AI Index / Lightcast | sì | no; i 10 gruppi di competenze AI solo per gli USA | annuale | 4 mesi |
   | OECD.AI / LinkedIn | non verificato | no, solo «AI» | mensile | non verificato |
   | Excelsior | solo Italia | competenze larghe (digitali), non le nostre 16 | mensile e annuale | non verificato |
   | JobTech | no, solo Svezia | testo libero | continuo | nessuno |

6. **Accesso.**
   - **Indeed, Eurostat e JobTech:** file o API senza chiave e senza account. Vanno bene per una pipeline in CI.
   - **Cedefop Skills-OVATE:** il sito rispondeva 403 a ogni client automatico, quindi non l'ho potuto leggere.
   - **Eurostat WIH-OJA:** i microdati, gli unici con le competenze ESCO per Paese, sono solo per gli istituti statistici e per i ricercatori accreditati. Non si scaricano.
   - **Lightcast:** gli annunci si comprano. L'accesso gratuito copre solo la tassonomia.

**Raccomandazioni**

- **Prima scelta: Indeed Hiring Lab, *AI tracker*** (CC BY 4.0, file CSV su GitHub senza chiave). Dà la quota di annunci che citano l'AI in 9 Paesi, Italia compresa, dal 2019.
  - **Cosa si perde:** la domanda **per competenza**. Il radar non potrebbe più mettere le 16 competenze sull'asse della domanda: resterebbe lo slancio (il prototipo «solo slancio» di P0.1), con accanto la domanda di AI per Paese come contesto, Italia contro gli altri.
  - **Il cambio di frequenza:** dalla rilevazione settimanale a un dato giornaliero aggiornato una volta al mese.
  - **La domanda da fare:** Indeed ha un'API per ricercatori, con le chiavi date su richiesta. Va chiesto per iscritto se può dare la quota per parole chiave scelte da noi: sarebbe l'unico modo trovato per avere le competenze con una licenza aperta e l'Italia (vedi «Domande aperte»).
- **Alternativa, per la testa *Per la tua organizzazione*: Eurostat `isoc_sk_oja`** (domanda di specialisti ICT negli annunci online, trimestrale, CC BY 4.0, API senza chiave, Italia e regioni). Si può affiancare a **Excelsior** (CC BY 4.0), per le entrate previste dalle imprese italiane con competenze digitali. Nessuna delle due misura le competenze del radar.
- **Non reggono:**
  - **Lightcast:** a pagamento.
  - **LinkedIn:** nessun dato scaricabile, e i termini vietano di copiarne i dati.
  - **OECD.AI:** licenza non dichiarata, e la pagina dei termini OECD risponde 403.
  - **AI Index:** annuale, CC BY-ND, i gruppi di competenze solo per gli USA. Resta buono per la card Persone e lavoro, dove già si usa.
  - **Jooble e Careerjet:** API da editori di annunci, termini contro bot e ripubblicazione.
  - **Arbeitsagentur:** API non ufficiale, e cerca solo nel titolo.
  - **France Travail:** l'API oggi non è più esposta.
  - **EURES:** nessuna API ufficiale.
  - **USAJOBS e The Muse:** solo impieghi federali USA, o pagine bloccate.
  - **Hacker News:** i termini di YC vietano lo scraping, e gli annunci italiani sono pochissimi.
  - **Survey e Innovation Graph:** misurano chi programma, non chi assume.
  - **Skills-OVATE:** il sito è bloccato ai client automatici, va chiesto a Cedefop.
- **Prima di tutto questo:** se Adzuna risponde no alla «personal research», la strada più corta per tenere il radar com'è resta **chiedere ad Adzuna una licenza** per un sito gratuito senza ricavi. I termini prevedono un accordo scritto per «any other use».

## Tabella di confronto

| Fonte | Licenza (alla fonte) | Dashboard pubblica | Unione con altri dati | Download automatico in CI | Paesi | Granularità | Frequenza e storico | Accesso |
|---|---|---|---|---|---|---|---|---|
| **Adzuna** (oggi) | termini propri: «Personal and academic research» | non detto in modo esplicito (conferma chiesta il 5/11) | non vietata | sì, nei limiti del piano | 8 dei nostri, e altri | testo libero, frase esatta | settimanale (nostra), annunci degli ultimi 30 giorni | chiave gratuita, 250 chiamate al giorno |
| **Indeed Hiring Lab, AI tracker** | CC BY 4.0 | sì | sì | sì (CSV su GitHub) | AU, CA, DE, FR, GB, IE, IT, NL, US | solo «AI», in blocco | giornaliera, aggiornata ogni mese; dal 2019-01-01 al 2026-09-30 | nessuna chiave |
| **Indeed Hiring Lab, job postings** | CC BY 4.0 | sì | sì | sì | 10 Paesi più EA; Italia solo come totale | indice del totale, settori solo fuori dall'Italia | giornaliera, aggiornata ogni settimana; dal 2020-02-01 | nessuna chiave |
| **Indeed Hiring Lab API** | termini di servizio di Indeed (non letti per intero) | non verificato | non verificato | sì, con chiave | per dataset | `aiShare` | giornaliera | chiave su richiesta via email |
| **Eurostat `isoc_sk_oja1-3`** | CC BY 4.0 | sì | sì | sì (API senza chiave) | UE, Islanda, Liechtenstein, Norvegia, Svizzera, Regno Unito; Italia e regioni NUTS 2 | specialisti ICT, e professioni ISCO | trimestrale, da fine 2019 a 2026-Q2; T+2 trimestri | nessuna chiave |
| **Eurostat WIH-OJA** (microdati) | accesso riservato | — | — | no: «cannot be downloaded» | UE ed EFTA | competenze ESCO | trimestrale | istituti statistici e ricercatori, nel DataLab |
| **Cedefop Skills-OVATE** | non verificato (403) | non verificato | non verificato | non verificato | non verificato | ESCO (da snippet) | trimestrale (da snippet) | sito bloccato ai client |
| **EURES, statistiche** | © ELA, riuso con citazione | probabile | non verificato | no, nessuna API ufficiale | Stati EURES | competenze ESCO (top) | non dichiarata | tabella scaricabile a mano |
| **AI Index 2026 / Lightcast** | CC BY-ND 4.0 | sì, senza modifiche | dubbio (ND) | sì, via OWID | 22 Paesi, Italia 2023-2025 | «AI» per Paese; gruppi solo USA | annuale (aprile) | OWID senza chiave |
| **Lightcast** (diretto) | commerciale | no, senza contratto | no | no | 165 Paesi (non verificato) | tassonomia di 33mila competenze | — | a pagamento; gratis solo la tassonomia, per non profit |
| **OECD.AI / LinkedIn** | «All rights reserved»; termini OECD non letti (403) | non verificato | non verificato | non verificato | Paesi con copertura LinkedIn ≥ 40% | «AI» | mensile | solo grafici |
| **LinkedIn** | User Agreement §8.2 | no | no | no | — | — | — | nessun dato pubblico |
| **Excelsior** | CC BY 4.0, anche commerciale | sì | sì | non verificato (nessun formato aperto trovato) | solo Italia | professione, settore, titolo di studio, competenze larghe | mensile e annuale | banca dati web, PDF |
| **Istat, posti vacanti** / **Eurostat `jvs_q_nace2`** | CC BY 4.0 | sì | sì | sì | Italia, UE | settore NACE | trimestrale | nessuna chiave |
| **Ministero del Lavoro, comunicazioni obbligatorie** | non verificata | — | — | non verificato | solo Italia | qualifica professionale, non competenze | trimestrale e annuale | tabelle Excel |
| **Jooble** | termini del sito: no bot, no ripubblicazione | no, per statistiche | — | — | molti, Italia non verificata | testo libero | — | chiave su modulo, per «webmasters» |
| **Careerjet** | termini da editore non trovati | per mostrare annunci | — | — | per locale, Italia non verificata | testo libero (`hits`) | — | chiave per sito editore; chiede l'IP dell'utente |
| **Arbeitsagentur Jobsuche** | nessuna API ufficiale | non verificato | — | rischioso | solo Germania | testo libero sul **titolo** | continua | chiave pubblica nota |
| **France Travail, Offres d'emploi** | «Licence non renseignée» | — | — | no: API «plus exposée» | solo Francia | — | — | sospesa |
| **JobTech (Arbetsförmedlingen)** | CC0 | sì | sì | sì | solo Svezia | testo libero, con `total` | continua; storico dal 2006 | nessuna chiave |
| **USAJOBS**, **The Muse** | pagine bloccate (403) | non verificato | — | — | USA (USAJOBS: sito dell'OPM) | — | — | chiave |
| **Hacker News «Who is hiring»** | termini YC: no scraping | — | — | API ufficiale senza limiti | soprattutto USA e remoto | testo libero | mensile | nessuna chiave |
| **Stack Overflow Survey** | ODbL 1.0 / DbCL 1.0 | sì (con condivisione allo stesso modo) | sì, con obblighi ODbL | sì | mondo | domande del questionario | annuale | nessuna chiave |
| **GitHub Innovation Graph** | CC0 1.0 | sì | sì | sì | economie del mondo | topic GitHub | trimestrale dal 2020 | nessuna chiave |

## 0. Adzuna, il riferimento

- **Cosa usa la pipeline:** `GET https://api.adzuna.com/v1/api/jobs/{paese}/search/1` con `results_per_page=1` e `max_days_old=30`, e legge solo `count`. La chiamata senza filtro dà il totale, quella con `what_phrase` dà la competenza. Limiti del piano gratuito, dal docstring di `pipeline/adzuna.py`: 25 chiamate al minuto, 250 al giorno, 1.000 a settimana, 2.500 al mese.
- **Termini** (https://developer.adzuna.com/docs/terms_of_service):
  - L'API «may be used for» un elenco che comprende «Personal and academic research».
  - «Any other use, including commercial analysis, resale of data, and sales prospecting or lead generation» richiede un accordo scritto con Adzuna.
  - «for any use in a product or service that generates revenue or leads, a licence agreement is required».
  - Chi la usa è «encouraged to publish Adzuna listings, salary estimates and/or data», con l'attribuzione.
  - Per la ricerca bisogna «acknowledge Adzuna as the source of all salary and vacancies data wherever it is published», con la dicitura «The Adzuna API» e il link ad adzuna.co.uk.
  - «Either party may terminate this Agreement at any time». Alla fine dell'accordo bisogna «immediately remove all insertion codes and data acquired from Adzuna from all pages of its web sites»: lo storico salvato in `data/jobs.json` andrebbe tolto dalle pagine.
  - I limiti non sono nei termini: «The plans available to you, and their limits, are shown in your account».
- **Il punto aperto** è lo stesso del README: «personal research» non dice se copra una pagina pubblica. La frase sull'«encouraged to publish» fa pensare di sì, ma non lo dice per la ricerca.

## 1. Indeed Hiring Lab

### AI tracker (la prima scelta)

- **Cosa misura:** README di https://github.com/hiring-lab/ai-tracker: «the share of AI (and generative AI) job postings, as a percentage of overall job postings, using a seven-day trailing average».
  - Le parole chiave sono date solo come esempi: «Machine Learning», «Data Science» e «Artificial Intelligence» per l'AI; «Generative AI», «Large Language Models» e «Chat GPT» per l'AI generativa.
  - La pagina sul metodo (https://hiringlab.indeed.com/2023/09/21/indeed-ai-jobs-tracker/) parla di «a broader list of keywords indicating skills associated with AI», senza pubblicare l'elenco.
- **Licenza:** «The data generated by Indeed Hiring Lab are available under the Creative Commons Attribution 4.0 International License». E ancora: «The data and files that we have generated are freely available for public use, as long as Hiring Lab is cited as a source». L'API di GitHub conferma `"spdx_id": "CC-BY-4.0"`.
- **Aggiornamento:** «The frequency of the data is daily and it is refreshed each month». L'ultimo commit «data update» è dell'8 ottobre 2026, il precedente del 10 settembre.
- **Cosa c'è nel file** (`AI_posting.csv`, scaricato alle 13:52 UTC, 786.552 byte):
  - Colonne: `date`, `jobcountry`, `AI_share_postings`.
  - **9 Paesi:** AU, CA, DE, FR, GB, IE, **IT**, NL, US. Ognuno ha 2.830 righe giornaliere, dal 2019-01-01 al 2026-09-30.
  - Il 30 settembre 2026: Italia 4,76%, Germania 5,74%, Paesi Bassi 3,63%, USA 7,34%.
  - Spagna e Polonia, che il radar segue oggi, **mancano**.
  - Il README cita anche `GenAI_posting.csv`, che però non c'è nel repo (404).
- **Adatto al radar?** Solo in parte.
  - **Pro:** licenza chiara, unione permessa, download automatico senza chiave, l'Italia c'è.
  - **Contro:** misura l'AI in blocco con un elenco di parole che Indeed non pubblica, quindi non si può ripetere la stessa ricerca, come chiede il primo principio di `PRODUCT.md`. Non dà le 16 competenze.
  - **Ritardo:** il dato arriva una volta al mese, con circa 6 settimane di ritardo (il 13 novembre l'ultimo giorno è il 30 settembre).
  - **Unità:** è una quota sul totale, come la nostra domanda, quindi resta «annunci ogni 10mila» (4,76% = 476 ogni 10mila).

### Job postings tracker

- https://github.com/hiring-lab/job_postings_tracker: indice degli annunci (100 = 1° febbraio 2020), con e senza correzione stagionale, per il totale e per i «new postings».
- **Licenza:** CC BY 4.0, con la stessa frase (`spdx_id` CC-BY-4.0). Il README dice che il dato è giornaliero e aggiornato ogni settimana; l'ultimo push è del 12 novembre 2026.
- **Paesi:** AU, CA, DE, EA, ES, FR, GB, IE, IT, NL, US. Per l'Italia c'è **solo** `aggregate_job_postings_IT.csv`, con ultima riga al 2026-11-06. Il file per settori italiano non esiste (404).
- Non ha competenze. Può servire come denominatore o come contesto («annunci in Italia +x% da febbraio 2020»).

### API di Hiring Lab

- https://docs.indeed.com/hiring-lab-api/: le chiavi vanno a «partners and researchers who need Hiring Lab data», su richiesta a hiring-lab-api@indeed.com.
- I dataset sono quattro: Job Postings, Remote Work, Wage Growth e AI Jobs. AI Jobs dà `aiShare` ogni giorno. La documentazione non dice che si possa filtrare per parola chiave o per competenza.
- **Termini:** «By using this API and its documentation and building an integration, you agree to Indeed's terms of service». I termini di Indeed (https://www.indeed.com/legal, più di 340mila caratteri) li ho letti solo nel primo terzo, che non parla di Hiring Lab.

### Un segnale contrario da tenere presente

- FRED ripubblica l'indice di Indeed con la nota «Copyrighted: Pre-approval required. Contact Indeed to request permission to use the data» e con termini per gli utenti finali come «End Users will refrain from any external distribution of Indeed Data except in oral or written presentations» (https://fred.stlouisfed.org/release?rid=476).
- Sono termini della licenza tra Indeed e FRED, non del repo GitHub, che dichiara CC BY 4.0. Per prudenza conviene una conferma scritta che la CC BY 4.0 del repo valga per un sito pubblico (vedi «Domande aperte»).

## 2. Eurostat

### Annunci online: domanda di specialisti ICT (`isoc_sk_oja1`, `isoc_sk_oja2`, `isoc_sk_oja3`)

- **Cosa misurano**, dai metadati https://ec.europa.eu/eurostat/cache/metadata/en/isoc_sk_oja_esmsip2.htm:
  - la quota di annunci per specialisti ICT sul totale degli annunci online, per regione NUTS 2;
  - la loro distribuzione per professione ISCO-08;
  - la variazione sullo stesso trimestre dell'anno prima.
  - Le quote usano quattro trimestri mobili. Il rilascio è a «T+2 quarters». Sono dati sperimentali.
- **Dal servizio API** (`https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/isoc_sk_oja1`, senza chiave, letto alle 14:02 UTC):
  - ultimo aggiornamento il 26 agosto 2026, trimestri da 2019-Q4 a **2026-Q2**;
  - 32 Paesi: i 27 dell'UE, Islanda, Liechtenstein, Norvegia, Svizzera e Regno Unito. **L'Italia c'è**, con le sue regioni.
- **Licenza** (https://ec.europa.eu/eurostat/help/copyright-notice): «The copyright for the editorial content of this website, which is owned by the EU, is licensed under the Creative Commons Attribution 4.0 International licence». E: «you can re-use the content provided you acknowledge the source and indicate any changes you have made». Eccezioni: «The permission granted above does not extend to any material whose copyright is identified as belonging to a third-party», e l'elenco dei dati non riusabili a scopo commerciale. AI Radar non è commerciale.
- **Adatto al radar?** No per le competenze: misura una famiglia di professioni, non le competenze AI. Va bene per la testa *Per la tua organizzazione*, accanto alla card Persone e lavoro: Italia contro UE, per regione, con lo stesso codice di `pipeline/eurostat.py`.

### Microdati WIH-OJA (Web Intelligence Hub)

- https://cros.ec.europa.eu/node/889: i microdati sono «available to the European Statistical System (ESS) members», con accesso per i ricercatori dal DataLab o dal portale dei microdati, e «WIH OJA microdata cannot be downloaded». Il rilascio è trimestrale.
- Sono questi i dati con le competenze ESCO per annuncio, ma una pipeline pubblica non li può leggere.
- **Prodotti pubblici dagli stessi dati:**
  - l'app *Top & trending skills*, per professione, annuale (https://ec.europa.eu/eurostat/web/products-eurostat-news/w/wdn-20231214-1, letta solo dallo snippet della ricerca);
  - `jvs_a_isco3_r1`, posti vacanti per professione ISCO a 3 cifre. Nella notizia di Eurostat (https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20251210-3) i Paesi con il dettaglio non comprendono l'Italia. Dall'API: ultimo anno 2024, e con `geo=IT` nessun valore.

### Posti vacanti (`jvs_q_nace2`) e Istat

- `jvs_q_nace2`: posti vacanti per settore NACE, trimestrali, Italia compresa (ultimo trimestre letto con `geo=IT`: 2025-Q4). CC BY 4.0 come sopra.
- L'Istat pubblica lo stesso tasso. Note legali (https://www.istat.it/note-legali/): «Salvo diversa indicazione, tutti i contenuti pubblicati su questo sito sono soggetti alla licenza Creative Commons – Attribuzione – versione 4.0».
- Nessuna delle due ha professioni fini o competenze: non servono al radar.

## 3. Cedefop Skills-OVATE

- **Non letto.** https://www.cedefop.europa.eu/en/tools/skills-online-vacancies e https://www.cedefop.europa.eu/en/legal-notice rispondevano **403** sia a WebFetch sia a `curl`. `robots.txt` invece rispondeva 200. Non ho provato ad aggirare il blocco.
- **Dagli snippet del motore di ricerca**, non verificati alla fonte: lo strumento «presents data for the last 4 available quarters and is updated four times a year», mostra le competenze «via ESCO version 1 or O*Net» e copre 28-32 Paesi europei. Usa gli stessi annunci del WIH-OJA.
- **Adatto al radar?** Non lo so. È il candidato europeo più vicino per le competenze, ma servono tre risposte scritte di Cedefop: se i dati si scaricano, con che licenza, e se le competenze ESCO comprendono voci come RAG o MCP. Con ESCO v1 è improbabile, ma non l'ho verificato.

## 4. EURES

- **Statistiche** (https://eures.europa.eu/eures-services/eures-portal-statistics/job-vacancy-statistics_en): posti vacanti per professione, luogo, titolo di studio e «most common skills expected», codificati con ESCO. Le tabelle si scaricano: «You can download the table by using the download button on the top right of the specific statistic view». La pagina non dà né la frequenza né la data di riferimento.
- **Note legali** (https://eures.europa.eu/eures-legal-notice_en): «Copyright © for the entire content of this website unless otherwise stated: European Labour Authority (ELA)», con riuso permesso citando l'ELA come fonte. Non parlano degli annunci né dell'estrazione automatica.
- **API:** nessuna API ufficiale trovata. Le sole descrizioni di un'API vengono da documenti non ufficiali e da scraper di terzi, che non uso come fonte.
- **Adatto al radar?** No: niente download automatico, competenze ESCO fisse, e l'Italia in EURES pesa quanto i servizi pubblici per l'impiego che ci mandano gli annunci (non verificato).

## 5. Lightcast, AI Index e OECD.AI

### Lightcast

- **Accesso gratuito** (https://docs.lightcast.io/lightcast-api/docs/api-access): «Free access is available for nonprofit organizations and public-good initiatives, subject to approval». Comprende «up to 50 skill extraction API calls per month», e non comprende le altre tassonomie.
- Per il resto: «A commercial license is required for for-profit or production use cases».
- La pagina non nomina gli annunci, che Lightcast vende. La pagina della tassonomia (https://lightcast.io/open-skills, che reindirizza) dice che le 34mila competenze si consultano «for free».
- `https://docs.lightcast.dev/apis/skills` e `/job-postings` restituiscono solo il titolo, perché sono generate in JavaScript.
- **Adatto al radar?** No: gli annunci sono a pagamento.

### AI Index 2026 (dati Lightcast)

- **Licenza:** il PDF (https://hai.stanford.edu/assets/files/ai_index_report_2026.pdf, scaricato alle 13:58 UTC, 41.875.988 byte, p. 5) dice: «The AI Index 2026 Annual Report by Stanford University is licensed under Attribution-NoDerivatives 4.0 International». I dati grezzi sono su Google Drive, cartella «PUBLIC DATA: 2026 AI INDEX REPORT», sottocartella «Economy», di cui non si vede il contenuto.
- **Copertura:** «AI job postings (% of all job postings) by select geographic areas, 2014–25». I 10 gruppi di competenze (tra cui *Generative AI*, *Natural Language Processing* e *Agentic AI*, aggiunto quest'anno) ci sono **solo per gli USA**: «AI job postings (% of all job postings) in the United States by skill cluster, 2010–25».
- **Su OWID** (https://ourworldindata.org/grapher/share-artificial-intelligence-job-postings, CSV scaricato alle 13:55 UTC):
  - fonte «Lightcast via AI Index Report (2026) – with minor processing by Our World in Data»;
  - ultimo aggiornamento 20 aprile 2026, prossimo atteso ad aprile 2027;
  - 22 Paesi. L'Italia ha 12 anni, 2014-2025 (1,33% nel 2025, 0,71% nel 2024, 0,61% nel 2023).
  - Il sito usa già questa serie (`annunci_ai` in `config/sources.yaml`, licenza «CC BY-ND 4.0»).
- **Adatto al radar?** No: annuale, l'AI in blocco fuori dagli USA, e la clausola ND sconsiglia di ricavarne indicatori nuovi.

### OECD.AI

- https://oecd.ai/en/data?selectedArea=ai-jobs-and-skills: la sezione cita solo LinkedIn: le viste «leverage data from LinkedIn to show trends in the demand and supply of AI talent across countries and sectors over time». Tra queste c'è «Share of AI job postings by country».
- **Metodo** (https://oecd.ai/en/LinkedIn): la misura «measures employer demand for AI talent by calculating the share of job postings that qualify as AI roles». È mensile, per i Paesi con almeno il 40% della forza lavoro su LinkedIn. La pagina non dice se l'Italia c'è.
- **Licenza:** sulle pagine c'è solo «© 2026 OECD. All rights reserved», e https://oecd.ai/en/terms non ha clausole sui dati. I termini generali OECD (https://www.oecd.org/en/about/terms-conditions.html) rispondevano **403**: non li ho letti.
- **Adatto al radar?** No: l'AI in blocco, nessun download descritto, licenza non chiara.

## 6. LinkedIn Economic Graph

- https://economicgraph.linkedin.com/ ora reindirizza a https://pulse.linkedin.com/: rapporti in PDF e un programma di partner, nessun dataset descritto, «© 2026 LinkedIn All rights reserved».
- **User Agreement §8.2** (https://www.linkedin.com/legal/user-agreement) vieta di usare mezzi automatici per «scrape or copy the Services, including profiles and other data from the Services», e di «Copy, use, display or distribute any information (including content) obtained from the Services» senza il consenso del titolare.
- **Adatto al radar?** No. I dati di LinkedIn arrivano solo filtrati, da OECD.AI o dai rapporti.

## 7. Italia: Excelsior e comunicazioni obbligatorie

### Excelsior (Unioncamere e Ministero del Lavoro)

- **Licenza** (https://excelsior.unioncamere.net/note-legali e https://excelsior.unioncamere.net/avvertenze): «Salvo diversa indicazione, tutti i contenuti pubblicati su questo sito sono soggetti alla licenza» Creative Commons Attribuzione 4.0. I dati e le analisi si possono riprodurre e adattare «anche a scopi commerciali, a condizione che venga citata la fonte».
  - La citazione da usare: «Unioncamere-Ministero del Lavoro e delle Politiche Sociali, Sistema Informativo Excelsior».
  - È vietato copiare il software del sito.
- **Copertura:**
  - entrate previste dalle imprese italiane, con bollettini mensili e trimestrali e rapporti annuali;
  - la banca dati costruisce tabelle per «professione, settore, titolo di studio»;
  - le competenze sono categorie larghe, come le competenze digitali, con un rapporto annuale dedicato. Il rapporto 2024 ha un «Focus: intelligenza artificiale», ma l'ho visto solo in copie ospitate da camere di commercio.
- **Accesso:** sul sito ho trovato PDF e la banca dati via web, nessun file CSV o API. Non verificato se la banca dati esporti in un formato aperto.
- **Adatto al radar?** No per le 16 competenze. Sì, come fonte italiana CC BY 4.0, per una frase della card Persone e lavoro, per esempio sulla quota di entrate con competenze digitali richieste.

### Ministero del Lavoro, comunicazioni obbligatorie

- Assunzioni per qualifica professionale (CP2011), con note trimestrali e un rapporto annuale con tabelle Excel su cliclavoro.gov.it (per esempio https://www.cliclavoro.gov.it/sites/default/files/2025-09/Rapporto-annuale-sulle-comunicazioni-obbligatorie-2025.pdf).
- **Licenza:** non verificata. Non misura le competenze: non serve al radar.

## 8. API di siti di annunci

### Jooble

- https://jooble.org/api/about: «Jooble allows webmasters of an internet portal or search engine to extend the functionality of their website». La chiave si chiede con un modulo.
- **Termini del sito** (https://jooble.org/info/terms): «You may not use any web spiders, bots, indexers, robots, crawlers, harvesters», «Our Site content may not be copied for republication, either online or on paper», e «You will not access our Site to gain a competitive advantage». Non c'è una clausola specifica sulle statistiche dell'API.
- Non ho verificato alla fonte che l'API restituisca un conteggio totale, né che l'Italia ci sia.
- **Adatto al radar?** No: l'API serve a mostrare annunci con click, e i termini sono più stretti di quelli di Adzuna.

### Careerjet

- https://www.careerjet.com/partners/api/: «Each publisher website requires a unique API key». Chiede `user_ip` e `user_agent` dell'utente che fa la ricerca: senza, risponde 403 «Missing param user_ip or user_agent». La risposta ha `hits`, il numero di risultati.
- Non ho trovato i termini per gli editori.
- **Adatto al radar?** No: l'API presuppone un utente vero che cerca, e una pipeline settimanale senza utenti non rientra nell'uso previsto. Termini non verificati.

### The Muse e USAJOBS

- **The Muse:** https://www.themuse.com/developers/api/v2 rispondeva **403**.
- **USAJOBS:** https://developer.usajobs.gov/ rispondeva **403** a `curl` e una pagina d'errore a WebFetch, e così anche le guide. La pagina dice solo che «USAJOBS is a United States Office of Personnel Management website».
- Non verificati. In ogni caso coprono solo gli USA, e USAJOBS solo il settore pubblico federale (non verificato alla fonte).

## 9. Servizi pubblici per l'impiego nazionali

### Bundesagentur für Arbeit, Jobsuche (Germania)

- Il README della documentazione comunitaria (https://github.com/bundesAPI/jobsuche-api, pubblicata come https://jobsuche.api.bund.dev/) dice che la Bundesagentur «bietet … dafür bis heute keine offizielle API an». La chiave `jobboerse-jobsuche` è quella del sito pubblico.
- Il parametro `was` è una «Freitextsuche Jobtitel»: cerca nel titolo, non nel testo dell'annuncio.
- **Adatto al radar?** No: API non ufficiale, termini non dichiarati, e la ricerca nel solo titolo non è confrontabile con Adzuna.

### France Travail, *API Offres d'emploi* (Francia)

- **Stato:** la scheda su data.gouv.fr (https://www.data.gouv.fr/dataservices/api-offres-demploi) dice che l'API «n'est actuellement plus exposée» su francetravail.io, mentre France Travail rivede come diffonderla. Licenza: «Licence non renseignée».
- **CGU** (https://www.francetravail.fr/informations/informations-legales-et-conditio/conditions-generales-dutilisatio.html): le offerte sono date ai partner che aderiscono alla licenza di riuso, e «pourront être réutilisées pour tout usage et notamment être rediffusées sur des sites tiers».
- **Adatto al radar?** Oggi no: l'API non è disponibile.

### JobTech, Arbetsförmedlingen (Svezia)

- **Licenza:** lo swagger di https://jobsearch.api.jobtechdev.se/ dice `"license": {"name": "Ads are licensed under CC0"}`. La pagina di Arbetsförmedlingen (https://arbetsformedlingen.se/other-languages/english-engelska/about-the-website/apis-and-open-data) dice «Our open data, open APIs and open source code is free for anyone to use».
- **Accesso:** senza chiave. Una ricerca di prova (`/search?q="prompt engineering"&limit=0`, alle 13:58 UTC) ha restituito `{"total": {"value": 21}}`.
- jobtechdev.se non risolveva il DNS, quindi non ho letto la pagina degli annunci storici. Dallo snippet della ricerca: annunci dal 2006.
- **Adatto al radar?** Mostra come sarebbe la fonte ideale (testo libero, totale, CC0, senza chiave), ma copre solo la Svezia, che il radar non segue, e annunci in gran parte in svedese. Non sostituisce l'Italia.

## 10. Proxy della domanda

- **Hacker News, «Who is hiring».** L'API ufficiale (https://github.com/HackerNews/API) ha licenza MIT per il codice e dice «There is currently no rate limit». I termini di Y Combinator (https://www.ycombinator.com/legal/) però vietano «any data mining, robots, scraping or similar data gathering or extraction methods», e non dicono se l'API ufficiale ne sia esclusa. Il thread è uno al mese, quasi tutto USA e lavoro da remoto: in Italia il campione è troppo piccolo. Non adatto.
- **Stack Overflow Developer Survey** (https://survey.stackoverflow.co/): «Survey data licensed under ODbL 1.0, contents under DbCL 1.0». Esce una volta l'anno, l'ultima nel 2026. Misura chi programma e cosa usa, non chi assume. Una pagina che unisce dati ODbL deve rispettarne la condivisione allo stesso modo per il database derivato. Non adatto alla domanda.
- **GitHub Innovation Graph** (https://github.com/github/innovationgraph): «This project is released under CC0-1.0», trimestrale dal 2020, con i topic per economia. Misura l'attività open source, che il radar già prende da GitHub. Non è domanda di lavoro.

## Domande aperte

Da chiedere per iscritto, come si è fatto con Adzuna:

1. **Adzuna** (in attesa dal 5 novembre): se la risposta è no, chiedere quanto costa e cosa prevede una licenza per un sito gratuito, senza pubblicità e senza ricavi. I termini prevedono un «written agreement» per «any other use».
2. **Indeed Hiring Lab** (hiring-lab-api@indeed.com):
   - se la CC BY 4.0 dei repo GitHub vale per una dashboard pubblica che unisce i dati con altre fonti, dato che FRED li ripubblica con «Pre-approval required»;
   - se esiste, o si può avere con una chiave dell'API, la quota di annunci per **parole chiave scelte da noi** (le 16 frasi di `config/skills.yaml`), per Paese e per settimana;
   - se possono pubblicare l'elenco delle parole chiave dell'AI tracker, così la misura si può ripetere;
   - se pensano di aggiungere Spagna e Polonia;
   - perché `GenAI_posting.csv` è nel README ma non nel repo.
3. **Cedefop** (Skills-OVATE): se i dati si scaricano, con che licenza, ogni quanto, se l'Italia c'è e se le competenze ESCO comprendono voci come «prompt engineering» o «retrieval augmented generation». Va chiesto anche perché il sito blocca i client automatici.
4. **Eurostat, Web Intelligence Hub:** se un ricercatore indipendente, senza ente, può avere l'accesso al DataLab, e se esiste o è prevista una tabella pubblica per competenza ESCO e Paese.
5. **OECD:** la licenza dei dati LinkedIn su OECD.AI, visto che la pagina dei termini rispondeva 403.
6. **Excelsior:** se la banca dati esporta in CSV o ha un'API, e se c'è una voce sull'intelligenza artificiale tra le competenze richieste.
7. **Prodotto (Decide Simone):** se il radar può vivere con la domanda di AI per Paese come contesto e lo slancio come unico asse per competenza. Va deciso con il prototipo «solo slancio» di P0.1 in mano.

## Metodo

- **File scaricati il 13/11/2026**, in cartelle temporanee fuori dal repo:
  - Indeed Hiring Lab: `https://raw.githubusercontent.com/hiring-lab/ai-tracker/main/AI_posting.csv` (786.552 byte, 13:52 UTC); `https://raw.githubusercontent.com/hiring-lab/job_postings_tracker/master/IT/aggregate_job_postings_IT.csv` (13:59 UTC); metadati dei repo e dei commit dall'API di GitHub.
  - Our World in Data: `https://ourworldindata.org/grapher/share-artificial-intelligence-job-postings.csv` e `.metadata.json` (13:55 UTC).
  - AI Index 2026: `https://hai.stanford.edu/assets/files/ai_index_report_2026.pdf` (41.875.988 byte, 13:58 UTC), letto con `pdftotext -layout`.
  - Eurostat, API di diffusione: `isoc_sk_oja1`, `isoc_sk_oja2`, `isoc_sk_oja3`, `jvs_a_isco3_r1` e `jvs_q_nace2`, in JSON, con e senza `geo=IT` (14:02 UTC).
  - JobTech: una ricerca di prova e lo swagger di `https://jobsearch.api.jobtechdev.se/` (13:58 UTC).
  - bundesAPI: `README.md` di `https://github.com/bundesAPI/jobsuche-api`.
- **Conteggi:** Paesi, righe e date dei CSV con `awk`; dimensioni, periodi e Paesi dei dataset Eurostat con `python -I` sul JSON. Nessun file scaricato è entrato nel repo.
- **Accessi falliti:**
  - Cedefop (`/en/tools/skills-online-vacancies` e `/en/legal-notice`): 403. Non ho tentato di aggirare il blocco.
  - Termini OECD (`https://www.oecd.org/en/about/terms-conditions.html`): 403.
  - The Muse (`https://www.themuse.com/developers/api/v2`): 403.
  - USAJOBS (`https://developer.usajobs.gov/` e le guide): 403, o pagina d'errore.
  - jobtechdev.se: il DNS non risolveva.
  - Documentazione Lightcast su `docs.lightcast.dev`, francetravail.io e databrowser di Eurostat: pagine generate in JavaScript, lette vuote.
  - Le note legali di EURES hanno risposto 429 la prima volta e poi, all'indirizzo nuovo, 200.
  - `https://docs.lightcast.io/lightcast-api/docs/free-api-access`: 404.
  - Termini di Indeed: letti solo nei primi 100mila caratteri su circa 349mila.
- **Fonti secondarie:** alcuni dati vengono solo dagli snippet di un motore di ricerca, e sono segnati come tali nel testo: la frequenza e le competenze di Skills-OVATE, lo storico di JobTech, il focus IA del rapporto Excelsior.

## Fonti

Tutte consultate il 13 novembre 2026.

- Adzuna, termini d'uso dell'API: https://developer.adzuna.com/docs/terms_of_service
- Indeed Hiring Lab, AI tracker: https://github.com/hiring-lab/ai-tracker. Metodo: https://hiringlab.indeed.com/2023/09/21/indeed-ai-jobs-tracker/
- Indeed Hiring Lab, job postings tracker: https://github.com/hiring-lab/job_postings_tracker (anche https://github.com/hiring-lab/data)
- Indeed Hiring Lab API: https://docs.indeed.com/hiring-lab-api/. Termini di Indeed: https://www.indeed.com/legal
- FRED, *Job Postings on Indeed*: https://fred.stlouisfed.org/release?rid=476
- Eurostat, avviso sul copyright: https://ec.europa.eu/eurostat/help/copyright-notice
- Eurostat, metadati di `isoc_sk_oja`: https://ec.europa.eu/eurostat/cache/metadata/en/isoc_sk_oja_esmsip2.htm. Pagina del tema: https://ec.europa.eu/eurostat/web/statistics-under-development/topics/labour-market-demand-ict-specialists. API: https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/isoc_sk_oja1
- Eurostat, professioni più richieste nel 2024 (`jvs_a_isco3_r1`): https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20251210-3
- Web Intelligence Hub, dati OJA: https://cros.ec.europa.eu/node/889 e https://cros.ec.europa.eu/wih/oja
- Cedefop, Skills-OVATE: https://www.cedefop.europa.eu/en/tools/skills-online-vacancies (403)
- EURES, statistiche dei posti vacanti: https://eures.europa.eu/eures-services/eures-portal-statistics/job-vacancy-statistics_en. Note legali: https://eures.europa.eu/eures-legal-notice_en
- Istat, note legali: https://www.istat.it/note-legali/
- Excelsior: https://excelsior.unioncamere.net/, note legali https://excelsior.unioncamere.net/note-legali, avvertenze https://excelsior.unioncamere.net/avvertenze
- Ministero del Lavoro, rapporto annuale sulle comunicazioni obbligatorie 2025: https://www.cliclavoro.gov.it/sites/default/files/2025-09/Rapporto-annuale-sulle-comunicazioni-obbligatorie-2025.pdf
- Lightcast, accesso all'API: https://docs.lightcast.io/lightcast-api/docs/api-access. Tassonomia: https://lightcast.io/open-skills
- Stanford HAI, AI Index 2026: https://hai.stanford.edu/ai-index/2026-ai-index-report. PDF: https://hai.stanford.edu/assets/files/ai_index_report_2026.pdf. Dati pubblici: https://drive.google.com/drive/folders/1zJTOg0iR0j5SijCwFutwWvDt143lW277
- Our World in Data, *Share of artificial intelligence jobs among all job postings*: https://ourworldindata.org/grapher/share-artificial-intelligence-job-postings
- OECD.AI, lavoro e competenze: https://oecd.ai/en/data?selectedArea=ai-jobs-and-skills. Metodo LinkedIn: https://oecd.ai/en/LinkedIn. Termini del sito: https://oecd.ai/en/terms. Termini OECD: https://www.oecd.org/en/about/terms-conditions.html (403)
- LinkedIn: https://pulse.linkedin.com/ (già economicgraph.linkedin.com). User Agreement: https://www.linkedin.com/legal/user-agreement
- Jooble: https://jooble.org/api/about e https://jooble.org/info/terms
- Careerjet: https://www.careerjet.com/partners/api/
- The Muse: https://www.themuse.com/developers/api/v2 (403). USAJOBS: https://developer.usajobs.gov/ (403)
- Bundesagentur für Arbeit, Jobsuche (documentazione comunitaria): https://github.com/bundesAPI/jobsuche-api e https://jobsuche.api.bund.dev/
- France Travail, *API Offres d'emploi*: https://www.data.gouv.fr/dataservices/api-offres-demploi. CGU: https://www.francetravail.fr/informations/informations-legales-et-conditio/conditions-generales-dutilisatio.html
- JobTech: https://jobsearch.api.jobtechdev.se/. Arbetsförmedlingen, API e dati aperti: https://arbetsformedlingen.se/other-languages/english-engelska/about-the-website/apis-and-open-data
- Hacker News API: https://github.com/HackerNews/API. Termini di Y Combinator: https://www.ycombinator.com/legal/
- Stack Overflow Developer Survey: https://survey.stackoverflow.co/
- GitHub Innovation Graph: https://github.com/github/innovationgraph
- Ricerche precedenti con lo stesso metodo: `docs/research/fonti-mappa.md` e `docs/research/fonte-capacita.md`.
