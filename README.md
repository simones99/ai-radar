# AI Radar

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/immagini/home-scura.png">
  <img src="docs/immagini/home.png" width="1280" alt="La home di AI Radar il 24 novembre 2026, settimana del 23 novembre. A sinistra le due porte: Per te, «Slancio di LLMOps da +30% a −10%», e Per la tua organizzazione, «Tra 8 giorni: vietate le app che spogliano», scadenza dell'AI Act del 2 dicembre 2026. A destra il radar delle competenze nei quattro quadranti, con Agenti AI, RAG e Multimodali in Impara ora.">
</picture>

**In English.** A public dashboard on open data that updates itself every week: [simones99.github.io/ai-radar](https://simones99.github.io/ai-radar/). Every Monday a Python pipeline on GitHub Actions collects arXiv, GitHub, Adzuna job ads, Eurostat, Epoch AI, Our World in Data and lab news feeds, saves the results as JSON in the repository, and a Svelte + D3 front end on GitHub Pages shows them. Two views: *which skills to learn*, a radar of 16 AI skills that crosses research, open source and job demand in Europe and the US; and *AI in Italy*, for organisations. Its lead card, GeopoliticAI, shows where Italy and Europe stand on each link of the AI supply chain against the US and China, from raw materials and chips to data centres and models: for example, companies based in the Netherlands sell 81.5% of lithography machines, and China produces 99% of the world's primary gallium. The same view covers business adoption, people and jobs, AI Act deadlines and upcoming reports. Every Monday it also publishes a weekly edition with fixed text, its own page and share image, collected in an archive and an RSS feed. Every source is licensed and cited; pipeline and app are tested in CI. The interface and the rest of this README are in Italian.

Una dashboard pubblica con due teste, su dati aperti che si aggiornano da soli ogni settimana:

1. **Su cosa formarti**, per le persone. Un radar di 16 competenze che incrocia ricerca (arXiv), open source (GitHub) e mercato del lavoro (Adzuna), con un confronto tra Europa e USA. Accanto, i temi che lo alimentano: modelli e ricerca, open source, notizie dai laboratori e dalle newsletter di riferimento.
2. **L'AI in Italia**, per le organizzazioni. Un osservatorio con l'Italia in primo piano. La card che apre la testa è **GeopoliticAI**: dove stanno l'Italia e l'Europa, rispetto a USA e Cina, in ogni anello della catena dell'AI, dalle materie prime ai chip, ai data center, ai modelli (vedi [Come si legge GeopoliticAI](#come-si-legge-geopoliticai)). Accanto: imprese che usano l'AI, persone e lavoro, scadenze dell'AI Act, rapporti in arrivo.

In home due porte, *Per te* e *Per la tua organizzazione*, danno la notizia della settimana di ciascuna testa e con un clic aprono la card da cui viene. Sotto ci sono le card, 4 e 5: Competenze, Modelli e ricerca, Open source, Notizie; GeopoliticAI, Business, Persone e lavoro, Norme, Rapporti.

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
   - le chiavi facoltative in *Settings → Secrets and variables → Actions → New repository secret* (vedi sotto). Senza chiavi la dashboard funziona lo stesso; i due grafici che ne hanno bisogno spiegano cosa manca;
   - se vuoi contare le visite, la variabile facoltativa `UMAMI_WEBSITE_ID` in *Settings → Secrets and variables → Actions → Variables* (vedi [Le visite](#le-visite)). Senza, il sito non conta niente.
3. **Carica i file.** Dalla cartella del progetto:
   ```bash
   git init -b main
   git add .
   git commit -m "Prima versione di AI Radar"
   git remote add origin https://github.com/<tuo-utente>/ai-radar.git
   git push -u origin main
   ```
   In alternativa usa *Add file → Upload files* sul sito di GitHub, trascinando il contenuto della cartella; in quel caso controlla che la cartella `.github` sia stata caricata, perché alcuni sistemi nascondono le cartelle che iniziano con il punto.
4. **Avvia il primo giro a mano.** Il caricamento fa partire *Aggiorna e pubblica*, che però pubblica il sito con i dati già presenti nel repository e non ne raccoglie di nuovi. Per raccoglierli usa *Actions → Aggiorna e pubblica → Run workflow*, lasciando spenta la casella «Crea l'edizione della settimana dei dati»; se hai saltato il passo 2, completalo prima. Il primo giro di raccolta dura circa 25 minuti perché ricostruisce 13 mesi di storico; i successivi pochi minuti. Da lì in poi i dati si raccolgono da soli ogni lunedì, e con loro esce l'edizione della settimana.
5. La dashboard è su `https://<tuo-utente>.github.io/ai-radar/`. I link alle edizioni compaiono in home con la prima edizione. Gli indirizzi di feed e anteprime seguono il nome del tuo repository.

   Il sito si pubblica solo su `<tuo-utente>.github.io`, con o senza il nome del repository: un dominio proprio, con un CNAME, non è previsto. Il workflow ricava l'indirizzo base dal proprietario e dal nome del repository, e da lì nascono canonical, `og:url`, immagini di anteprima, feed, sitemap e il link al profilo GitHub dell'autore. Su un altro host tutti questi indirizzi punterebbero a `github.io`, e `robots.txt` mancherebbe. `AI_RADAR_BASE_URL` la imposta il workflow, e in locale serve solo per le prove: non sceglie l'indirizzo del sito pubblicato.
6. **Segnala la sitemap a Google.** La build scrive `sitemap.xml` accanto all'app, con l'indirizzo di ogni pagina statica: home, competenze, archivio ed edizioni. Scrive anche `robots.txt`, ma solo quando l'indirizzo base è la radice di un dominio, perché i crawler lo cercano solo lì: per un sito in `/ai-radar/` non esce. Il workflow ricava l'indirizzo base dal nome del repository: se lo chiami `<tuo-utente>.github.io`, il sito sta alla radice di `https://<tuo-utente>.github.io/` e `robots.txt` esce da solo, con l'indicazione della sitemap. Dopo il primo rilascio, quindi, la sitemap va segnalata a mano: in [Google Search Console](https://search.google.com/search-console) aggiungi una proprietà di tipo «Prefisso URL» con l'indirizzo base, `https://<tuo-utente>.github.io/ai-radar/`, e in *Sitemap* inserisci `sitemap.xml`, cioè `https://<tuo-utente>.github.io/ai-radar/sitemap.xml`.

## Chiavi facoltative

| Secret | A cosa serve | Come ottenerla |
| --- | --- | --- |
| `ADZUNA_APP_ID` e `ADZUNA_APP_KEY` | Domanda di competenze nel lavoro, Europa e USA | Gratuite su [developer.adzuna.com](https://developer.adzuna.com) |

**Nota su Adzuna.** I termini d'uso permettono la "ricerca personale" citando la fonte come *The Adzuna API*. I limiti di chiamate sono quelli del piano nel proprio account (una raccolta qui ne usa 136). I termini non dicono in modo esplicito se una pagina pubblica con conteggi aggregati rientri nella ricerca personale. Per questa pagina, che mostra solo conteggi aggregati con la fonte citata, la conferma è stata chiesta ad Adzuna il 5 novembre 2026. Adzuna ha risposto per iscritto il 16 novembre 2026 che va bene, purché si rispettino i [termini d'uso](https://developer.adzuna.com/docs/terms_of_service). Per questo ogni dato sugli annunci cita *The Adzuna API*, anche nelle immagini d'anteprima delle edizioni e delle competenze. Chi pubblica una propria copia chieda a sua volta la conferma dal loro modulo di contatto. Senza queste chiavi il radar non ha la domanda e quindi non si disegna.

**Se l'accordo con Adzuna finisce.** I termini chiedono di togliere subito i dati di Adzuna da tutte le pagine, edizioni comprese. I dati stanno in due file: `data/jobs.json`, con le rilevazioni, e `data/radar.json`, che ne ricava domanda, annunci, quadranti e storico. `radar.json` si ricalcola da `jobs.json` a ogni raccolta, ma un push non raccoglie: senza un avvio manuale app, home e pagine delle competenze tengono i dati di Adzuna fino al lunedì.

1. Togli i secret `ADZUNA_APP_ID` e `ADZUNA_APP_KEY`.
2. Elimina `data/jobs.json`, fai il commit e il push.
3. Avvia il giro a mano, con la casella dell'edizione spenta: la raccolta rifà `radar.json` senza la domanda, e il sito esce senza i dati di Adzuna.
4. Fai una correzione dichiarata su ogni edizione, immagine compresa (vedi [Correggere un'edizione](#edizioni-feed-e-correzioni)).
5. Sostituisci lo screenshot della home in cima a questo README (`docs/immagini/home.png` e `home-scura.png`): mostra il radar e la porta *Per te*, che usano i dati di Adzuna.

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

Per chi arriva da un motore di ricerca o senza JavaScript, ogni competenza ha anche una pagina in HTML statico, che si rifà a ogni build con i dati di quel giro:

| Indirizzo | Cosa c'è |
| --- | --- |
| `/competenze/<id>/` | la pagina di una competenza, con l'`id` di `config/skills.yaml`: dove sta nei due mercati, domanda, slancio, percorso sul radar, risorse, fonti e metodo, e la sua immagine di anteprima |
| `/competenze/` | l'indice delle competenze, raggruppate per quadrante |

L'`id` diventa la cartella della pagina: può avere solo minuscole, cifre e trattini, e la pipeline ferma il radar se non è così. Le immagini di anteprima delle competenze le fa `npm run anteprime-competenze`, dopo la build e con Chromium: il workflow lo lancia a ogni giro che pubblica.

Limiti da tenere a mente:

- le ricerche sono per parole chiave, quindi un termine ambiguo può gonfiare o sgonfiare un conteggio;
- i topic GitHub li sceglie chi crea il repository;
- negli annunci in Italia, Germania o Francia le parole tecniche inglesi sono comuni ma non universali, quindi il confronto tra Paesi va letto con cautela.

Per controllare un conteggio basta ripetere la stessa ricerca sulla fonte.

## Come si legge GeopoliticAI

GeopoliticAI risponde a una domanda: in quali passaggi dell'AI l'Europa e l'Italia contano, e in quali dipendono da altri. Con i dati del 23 novembre 2026, per esempio:

- l'81,5% del mercato delle macchine di litografia è di aziende con sede nei Paesi Bassi, e le macchine EUV, necessarie per i chip più avanzati, le fa solo ASML;
- nei data center AI censiti da Epoch AI, l'UE ha lo 0,5% del calcolo, gli USA l'86,3%. Sono però solo i siti che Epoch conosce, circa il 44% del calcolo AI mondiale e quasi tutti negli USA. Un'altra stima di Epoch, [*AI chip imports*](https://epoch.ai/data/ai-chip-imports), conta i chip AI arrivati in ogni Paese dal 2022 a giugno 2026: lì l'UE ha circa il 5% del calcolo, gli USA il 72%, la Cina il 10%. La card usa la prima, quindi lo 0,5% va letto come «nei siti censiti», non come la quota dell'UE nel mondo;
- il miglior modello europeo del 2026, Mistral Large 4, arriva a 154,6 sull'Epoch Capabilities Index; il migliore degli USA a 173,4, quello della Cina a 161,2;
- la Cina produce il 99% del gallio e l'87% del silicio metallico del mondo.

Questi numeri sono fermi al 23 novembre. Materie prime e chip cambiano solo quando cambiano le fonti; data center e modelli invece ogni lunedì, e i valori aggiornati sono nella card.

La catena ha sei **anelli**. Ognuno ha la sua misura, e gli anelli non si sommano:

| Anello | Misura | Fonte | Si aggiorna |
| --- | --- | --- | --- |
| Materie prime | quota della produzione mondiale di gallio, terre rare e silicio metallico; quota della raffinazione del germanio | USGS, *Mineral Commodity Summaries 2026*; Commissione europea, studio sulle materie prime critiche 2023 | a mano, a ogni nuova edizione delle fonti |
| Progettazione dei chip | quota del valore dei chip progettati, per sede dell'azienda | ETO, *Advanced Semiconductor Supply Chain Dataset* (dato 2022) | a mano |
| Fabbricazione dei chip | quota della capacità produttiva, per luogo dello stabilimento | ETO (dato 2022) | a mano |
| Macchinari | quota del mercato delle macchine di litografia, per sede dell'azienda | ETO (dato 2025) | a mano |
| Data center | H100 equivalenti dei siti censiti, operativi o in costruzione | Epoch AI, *AI data centers* | ogni lunedì |
| Modelli | capacità (Epoch Capabilities Index) e calcolo di addestramento dei modelli nazionali | Epoch AI, *AI models* | ogni lunedì |

Nella card:

- **Chi controlla la catena dell'AI**: una mappa che si apre sul **filo della catena**, un esempio scelto da noi e non un dato: segue un modello USA, UE o cinese attraverso i sei anelli, con una tappa per anello e la sua fonte. Con un clic mostra invece la quota di ogni Paese, anello per anello.
- **La scheda di un'area**: USA, Cina, Regno Unito, UE, Altri, o un singolo Paese UE, Italia compresa, con la capacità del miglior modello e il calcolo di addestramento del più grande.
- **Calcolo e capacità per area, anno per anno**: la stessa misura in una tabella che si confronta in orizzontale.
- **Chi addestra i modelli di grande scala**: la quota dei modelli sopra 10²³ FLOP usciti ogni anno, per area.

Un link apre una vista precisa, per esempio [il filo dell'UE](https://simones99.github.io/ai-radar/#geopoliticai?filo=ue) o [le quote per Paese](https://simones99.github.io/ai-radar/#geopoliticai?vista=quote).

I limiti:

- per progettazione e fabbricazione non esiste una fonte aperta più recente del dato 2022 di ETO;
- *AI data centers* copre circa il 44% del calcolo AI mondiale, quasi tutto negli USA, e oggi non ha siti in Italia. Il censimento più vecchio di Epoch, *GPU clusters*, fermo a marzo 2026, conta in Italia 9 cluster, tra cui Leonardo al CINECA: la mappa lo dice in una nota, come fotografia datata;
- Epoch non conta nessun modello italiano: Minerva (Sapienza), Velvet (Almawave) e i modelli di iGenius non sono nel suo database, e la scheda dell'Italia lo dice;
- energia e acqua non sono un anello.

Le scelte sulle fonti, con quelle scartate e perché, sono in `docs/research/fonti-mappa.md`.

## Edizioni, feed e correzioni

Un'**edizione** riassume una settimana: le due porte, le frasi delle card cambiate dalla settimana prima, fino a 3 notizie per tema e le fonti senza dati aggiornati a quel giro. Ogni riga ha fonte, licenza e link alla card. Il testo resta com'è anche quando i dati del sito cambiano: nel file sono salvate le frasi già composte, non i dati da cui derivano.

| Indirizzo | Cosa c'è |
| --- | --- |
| `/edizioni/AAAA-MM-GG/` | la pagina di un'edizione, con la data del lunedì, in HTML statico senza JavaScript, e la sua immagine di anteprima |
| `/edizioni/` | l'archivio con tutte le edizioni, dalla più recente |
| `/feed.xml` | il feed RSS: una voce per edizione a testo intero, le ultime 26 |

Prima della prima edizione questi indirizzi non esistono, e né la home né le pagine delle competenze hanno link al feed o `<link rel="alternate">`. Con la prima edizione compaiono «Edizioni» nella testata e «Segui con RSS» in fondo alla pagina; «Settimana del…» diventa un link quando l'ultima edizione è proprio di quella settimana. Porte e card non cambiano.

**Quando esce.**

- **Giro del lunedì:** l'edizione esce da sola.
- **Avvio manuale:** esce solo con la casella «Crea l'edizione della settimana dei dati», spenta di default. Serve anche a recuperare un lunedì andato male.
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

## Le visite

Il sito conta le visite con [Umami Cloud](https://umami.is), sul piano Hobby gratuito, con la regione dei dati UE. Il contatore non usa cookie, e le statistiche non contengono indirizzi IP. Lo script sta in ogni pagina HTML del sito: l'app, la home in chiaro, le edizioni con l'archivio, le pagine delle competenze con l'indice, la pagina Privacy. In fondo a ogni pagina una riga dice a chi legge che il sito conta le visite, e il suo link «Privacy» porta alla pagina Privacy del sito, in `privacy/`. La pagina dice chi è il titolare e come si contatta, cosa si raccoglie e perché, la base giuridica, per quanto tempo, chi tratta i dati per conto del titolare, e i diritti di chi legge. Il sito non ha un banner di consenso: il contatore non usa cookie e non scrive niente nel browser. Il testo della pagina sta in [`web/src/lib/text/privacy.ts`](web/src/lib/text/privacy.ts). Perché Umami, e cosa si accetta in privacy, è in [`docs/adr/0004-visite-contate-con-umami-cloud.md`](docs/adr/0004-visite-contate-con-umami-cloud.md).

I numeri delle visite non si pubblicano, né qui né nel sito, e il pannello di Umami non ha un link pubblico.

**L'ID del sito.** Sta nella variabile del repository `UMAMI_WEBSITE_ID`, in *Settings → Secrets and variables → Actions → Variables*. È una variabile e non un secret, perché finisce comunque nell'HTML pubblico. Il workflow *Aggiorna e pubblica* la passa alla build come `AI_RADAR_UMAMI_ID`.

- Per cambiare l'ID si cambia il valore della variabile. Per togliere il contatore si cancella la variabile: il sito esce senza script, senza riga e senza pagina Privacy. In tutti e due i casi il cambio vale dalla pubblicazione successiva, con un push o un avvio manuale.
- Un valore che non è un UUID ferma la build con un messaggio che nomina la variabile, e resta pubblicato il sito di prima.
- In locale la build ha il contatore solo con `AI_RADAR_UMAMI_ID` impostata. Anche così lo script conta solo sull'host dell'indirizzo base, quindi le prove in locale e gli end-to-end non mandano niente a Umami.

**Le proprie visite.** Per non contarle, apri il sito pubblicato, poi la console del browser, e scrivi `localStorage.setItem('umami.disabled', 1)`. Va fatto su ogni browser e su ogni dispositivo. Per tornare a contarle: `localStorage.removeItem('umami.disabled')`.

**In una copia del progetto.** Senza la variabile `UMAMI_WEBSITE_ID` il contatore resta spento: nessuno script, nessuna riga, nessuna pagina Privacy, niente arriva a Umami. Per accenderne uno tuo:

1. apri un account su [Umami Cloud](https://cloud.umami.is) e aggiungi un sito con il dominio della tua copia, per esempio `<tuo-utente>.github.io`;
2. copia il suo ID, il valore di `data-website-id` nel codice di tracciamento, nella variabile del repository `UMAMI_WEBSITE_ID`;
3. in [`web/src/lib/text/privacy.ts`](web/src/lib/text/privacy.ts) cambia il titolare, `TITOLARE`: il titolare del trattamento sei tu, e la pagina Privacy deve portare al tuo contatto e al tuo repository, non a quelli di AI Radar. Rileggi il resto della pagina, e cambia la data dell'aggiornamento;
4. ripubblica il sito, con un push o un avvio manuale.

Lo script conta solo sull'host del tuo indirizzo base. La riga in pagina e la pagina Privacy dicono che le statistiche sono conservate in UE, per 6 mesi: se scegli un'altra regione, un altro piano o un altro servizio, vanno cambiate.

**Le tre misure del lunedì.** Ogni lunedì, nel pannello di Umami, sulla settimana da lunedì a domenica appena finita:

1. **le visite alla home**: le visite della pagina `/ai-radar/`;
2. **le visite alle edizioni e alle competenze**: le visite delle pagine sotto `/ai-radar/edizioni/` e, a parte, di quelle sotto `/ai-radar/competenze/`;
3. **le visite di ritorno**: nel report *Retention*, chi era già passato in un'altra settimana dello stesso mese.

Il ritorno vale solo dentro il mese di calendario: Umami riconosce un visitatore con un sale che cambia ogni mese, quindi a inizio mese chi torna conta come nuovo e i ritorni ripartono da zero.

Le soglie delle tre misure si fissano dopo quattro settimane piene di dati, non prima. La prima settimana dopo l'accensione è parziale: le quattro settimane partono dal primo lunedì pieno.

Il piano Hobby conta fino a 100.000 eventi al mese e conserva i dati 6 mesi. L'uso si controlla nel pannello di Umami, in *Settings → Usage*.

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
cd web && npm ci && npm test                            # test dell'app, senza browser
cd .. && python scripts/build_site.py                   # copia i dati e costruisce _site/
cd web && npm run preview                               # apre il sito su http://localhost:4173
```

Con Chromium (`npx playwright install chromium`) ci sono anche `npm run test:browser`, i test del comando che fa l'immagine di un'edizione, `npm run e2e` e `npm run anteprime-competenze`, che sul sito già costruito in `_site/` sostituisce l'immagine segnaposto di ogni pagina delle competenze con la sua.

Per lavorare sull'app con il ricaricamento automatico: `mkdir -p web/public/data && cp data/*.json web/public/data/` e poi `cd web && npm run dev`.

Le chiavi si passano come variabili d'ambiente: `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `GITHUB_TOKEN`.

Per provare un'edizione senza rischiare di salvarla nel repository, usa una copia dei dati: `AI_RADAR_DATA_DIR=/una/cartella/a/parte`. La leggono sia `npm run edizione -- --evento schedule` sia la build.

`build_site.py` copia nell'app i JSON di una cartella sola, e la stessa la passa alla build di Vite, da cui nascono la home in chiaro, le edizioni, le competenze e la sitemap: è la cartella data come argomento, se c'è, altrimenti `AI_RADAR_DATA_DIR`, altrimenti `data/`. Così l'app e le pagine statiche partono sempre dagli stessi dati.

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

Dati di [Epoch AI](https://epoch.ai/data/ai-models) (CC BY 4.0), [arXiv](https://arxiv.org) (grazie ad arXiv per l'accesso aperto ai metadati), [GitHub](https://github.com), [Hugging Face](https://huggingface.co), [The Adzuna API](https://www.adzuna.co.uk), [Eurostat](https://ec.europa.eu/eurostat), [USGS](https://pubs.usgs.gov/periodicals/mcs2026/mcs2026.pdf) (pubblico dominio), [Commissione europea](https://op.europa.eu/en/publication-detail/-/publication/57318397-fdd4-11ed-a05c-01aa75ed71a1) (CC BY 4.0) ed [ETO](https://eto.tech/dataset-docs/chipexplorer) (CC BY-NC 4.0, quindi solo per un uso non commerciale: vedi `docs/adr/0001-dati-eto-in-cc-by-nc.md`). I confini della mappa sono di Natural Earth (pubblico dominio). Le notizie mostrano solo titolo, data e link agli articoli originali. Il progetto non è affiliato a nessuna delle fonti.

Codice con licenza MIT (vedi `LICENSE`). D3 (ISC), Svelte (MIT) e il font Bricolage Grotesque (OFL) arrivano da npm; i testi delle loro licenze sono in `web/public/THIRD_PARTY_LICENSES.txt`, linkato in fondo alla pagina. Le foto sono da Wikimedia Commons, con autore e licenza indicati in pagina. Our World in Data pubblica in CC BY 4.0, ma i dati restano dei produttori originali, sempre citati: le serie dell'AI Index (Stanford HAI: investimenti, imprese che usano l'AI, annunci di lavoro) sono CC BY-ND 4.0 e vanno citate senza modifiche; le cifre di IEA, NVIDIA e TSMC restano dei produttori. La licenza di ogni serie è nel campo `licenza` di `config/sources.yaml` e compare in pagina accanto alla fonte.
