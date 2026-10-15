# AI Radar: nuova dashboard a card

Data: 15 ottobre 2026
Stato: in revisione

## 1. Obiettivo

La dashboard attuale è una pagina lunga di grafici. La nuova versione deve:

- raccontare la settimana dell'AI per temi (modelli, open source, business, persone e lavoro, politica, competenze, notizie, rapporti), non solo per fonti;
- far scegliere il tema da approfondire: una home con 8 card, ognuna con un numero chiave e una frase, che si apre a tutta larghezza;
- mostrare il movimento (cosa è cambiato rispetto al mese prima) dove i dati lo permettono;
- restare gratuita e legale: solo fonti pubbliche, dati citati con la fonte, nessun testo copiato, nessun servizio a pagamento.

Pubblico: chi lavora con l'AI o vuole formarsi, in Italia. Lingua della pagina: italiano.

Criteri di successo:

- chi apre la home capisce in pochi secondi la notizia principale della settimana e quale tema approfondire;
- ogni numero in pagina ha una fonte cliccabile;
- la pagina funziona a 360px di larghezza, da tastiera e con il tema scuro;
- una fonte che non risponde non rompe la pagina né blocca le altre.

## 2. Fuori dal perimetro

- Sintesi o riassunti scritti da un LLM, gratuiti o a pagamento.
- Sintesi manuali dei rapporti: la sezione Rapporti mostra solo link e date.
- Account, commenti, newsletter, ricerca nel testo.
- Traduzione in altre lingue.

## 3. Decisioni prese

| Tema | Decisione |
| --- | --- |
| Interazione | Card che si espandono a tutta larghezza; una aperta alla volta; le altre diventano pillole in alto |
| Framework | Svelte 5 + Vite, build statica per GitHub Pages |
| Linguaggio front-end | TypeScript (tipi per i contratti dei JSON) |
| Grafici | Moduli D3 (`d3-scale`, `d3-shape`, `d3-array`) dentro componenti Svelte |
| Pipeline | Python come oggi; il JSON in `data/` è il contratto con il front-end |
| Stile | Minimal, ispirato a useportal.net; niente estetica "da AI" |
| Font | Solo Bricolage Grotesque, file nel repo |
| Colori | Neutro, testo, un blu |
| Foto | Reali, da Wikimedia Commons, con licenza verificata e credito |
| Analisi | Dati OWID automatici, linea del tempo dell'AI Act a mano, sezione Rapporti con link e date |

## 4. Struttura del repository

```
config/
  skills.yaml        competenze (campo "breve" già aggiunto)
  sources.yaml       fonti; nuovo blocco "owid"; campo "tema" per ogni feed
  ai_act.yaml        nuovo: scadenze dell'AI Act, a mano
  rapporti.yaml      nuovo: rapporti periodici, a mano
  foto.yaml          nuovo: foto per tema con autore, licenza e pagina Commons
pipeline/            moduli di oggi + owid.py, ai_act.py, rapporti.py
data/                JSON scritti dalla pipeline (+ owid.json, ai_act.json, rapporti.json)
web/                 app Svelte 5 + Vite (sostituisce site/)
  index.html
  src/
    app.css              token di colore, spazi, tipografia
    main.ts
    App.svelte
    lib/data/            caricamento JSON, tipi, freschezza delle fonti
    lib/text/            frasi scritte dai dati, formati italiani
    lib/router.ts        link diretti con hash
    lib/tiles/           Tile.svelte, Detail.svelte, Pills.svelte + un componente per tema
    lib/charts/          LineChart, Bars, DotPlot, Radar, Timeline, DataTable
  public/fonts/          Bricolage Grotesque .woff2 (OFL), solo caratteri latini
  src/assets/photos/     foto originali; la build crea WebP a 480 e 900px
  tests/                 unità e componenti (Vitest), e2e (Playwright)
scripts/build_site.py    copia data/ in web/public/data, esegue la build, scrive _site/
```

`site/` resta pubblicato finché la nuova app non supera i test end-to-end; poi si rimuove nello stesso cambio che aggiorna il workflow.

## 5. Le 8 card

Ogni card chiusa mostra: foto, nome del tema, data di aggiornamento, numero chiave, una frase scritta dai dati. Aperta mostra: foto con credito, titolo scritto dai dati, sottotitolo, blocchi di contenuto.

| Card | Numero chiave | Blocchi da aperta | Fonti |
| --- | --- | --- | --- |
| Modelli e ricerca | crescita annua del calcolo di addestramento dei modelli di frontiera dal 2018 (regressione log-lineare) | calcolo nel tempo; capacità contro prezzo; paper AI al mese; quota con pesi aperti; ultimi modelli notevoli; chi costruisce i modelli (USA, Cina, UE, Regno Unito) in piccoli multipli | Epoch AI, Artificial Analysis, arXiv |
| Open source | quanti dei 100 modelli di tendenza appartengono al tipo di compito più frequente, con il nome del tipo | modelli di tendenza; tipi di compito; repository da seguire con le stelle | Hugging Face, GitHub |
| Business | investimenti privati in AI nell'ultimo anno e variazione | *Investimenti*: per regione, AI generativa, per tipo. *Adozione*: imprese per area (McKinsey), imprese UE (Eurostat). *Infrastruttura*: spesa USA in data center, quota di elettricità, ricavi data center Nvidia, ricavi TSMC | OWID, Eurostat |
| Persone e lavoro | quota di persone nel mondo che usa l'AI generativa, con il dato italiano | uso dell'AI generativa (mondo, Italia, Paesi UE, giovani UE); sviluppatori che usano strumenti AI; quota di annunci AI (Lightcast); domanda di competenze (Adzuna) | OWID, Adzuna |
| Politica | giorni alla prossima scadenza dell'AI Act | linea del tempo dell'AI Act con link ai testi ufficiali; notizie dei feed con tema "politica" | ai_act.yaml, feed |
| Competenze | competenza che entra in "Impara ora" | radar (direzione A) con le frecce dal mese prima; pannello dei movimenti (direzione C); tabella delle competenze; metodo | radar.json |
| Notizie | notizie degli ultimi 7 giorni | elenco con filtro per fonte e per tema | feed RSS |
| Rapporti | prossimo rapporto previsto | linea del tempo delle uscite: editore, cadenza, ultima edizione con link, prossima prevista (stima dichiarata) | rapporti.yaml |

Stato dei link alle fonti: non è una card. È raggiungibile dalla testata ("Stato delle fonti") e mostra la tabella di `status.json`.

Elenco iniziale dei rapporti, da confermare in revisione: Stanford AI Index, State of AI Report, McKinsey The State of AI, Menlo Ventures State of Generative AI in the Enterprise.

## 6. Pipeline e contratti dei dati

### 6.1 Già fatto (non ancora in un commit)

- `config/skills.yaml`: campo `breve` per le 16 competenze.
- `pipeline/radar.py`: per ogni competenza scrive `breve`, `slancio_prec`, `domanda_prec`, `quadrante_prec`. La posizione precedente usa le stesse formule e la stessa base della domanda, con le serie mensili fermate al mese prima e le rilevazioni del lavoro di almeno 28 giorni prima. Se la domanda viene dal lavoro e manca una rilevazione abbastanza vecchia, `domanda_prec` e `quadrante_prec` valgono `null`.
- Test: `test_radar_previous_positions`, `test_radar_previous_demand_needs_old_job_snapshot`.

### 6.2 Nuovo: `pipeline/owid.py` → `data/owid.json`

Configurazione in `sources.yaml` (esempio di formato; l'elenco completo segue le serie della tabella al paragrafo 5):

```yaml
owid:
  - id: investimenti_privati
    slug: private-investment-in-artificial-intelligence
    colonna: private_investment
    entita: [World, United States, China, Europe]
  - id: investimenti_generativa
    slug: global-investment-in-generative-ai
    colonna: generative_ai
    entita: [World]
  # ... imprese, uso AI generativa, annunci, data center, Nvidia, TSMC
```

Per ogni serie la pipeline scarica `https://ourworldindata.org/grapher/<slug>.csv?v=1&csvType=full&useColumnShortNames=true` e i metadati `<slug>.metadata.json?v=1`, controlla che la colonna esista e salva:

```json
{
  "aggiornato": "2026-10-15T05:30:00+00:00",
  "serie": {
    "investimenti_privati": {
      "titolo": "Private investment in AI by region",
      "unita": "constant 2021 US$",
      "citazione": "Quid via AI Index Report (2026) – with major processing by Our World in Data",
      "url": "https://ourworldindata.org/grapher/private-investment-in-artificial-intelligence",
      "aggiornato_owid": "2026-04-20",
      "punti": [{"entita": "World", "t": "2025", "v": 290094148769}]
    }
  }
}
```

`t` è l'anno o la data, come nel CSV. Una serie con colonne cambiate va in errore da sola; le altre si salvano.

Licenze: OWID pubblica in CC BY 4.0, ma i dati restano dei produttori originali (Quid, McKinsey, Lightcast, Microsoft…). La pagina riporta sempre la citazione completa e il link. Prima del rilascio si verifica la licenza di ogni serie.

### 6.3 Nuovo: `config/ai_act.yaml` → `data/ai_act.json`

Esempio di formato (i link reali si inseriscono dopo la verifica su EUR-Lex):

```yaml
scadenze:
  - data: 2026-12-02
    titolo: Fine della transizione per la marcatura
    descrizione: "Articolo 50(2): anche i sistemi generativi già sul mercato devono marcare i contenuti."
    fonte: https://eur-lex.europa.eu/...
```

Controlli: data ISO, titolo non vuoto, `fonte` con `https`. Le date vanno verificate su EUR-Lex durante l'implementazione. Le fonti secondarie consultate il 15 ottobre 2026 dicono: Digital Omnibus sull'AI in vigore dal 27 luglio 2026; allegato III al 2 dicembre 2027; allegato I al 2 agosto 2028; articolo 50 dal 2 agosto 2026 con transizione fino al 2 dicembre 2026 per l'articolo 50(2).

### 6.4 Nuovo: `config/rapporti.yaml` → `data/rapporti.json`

Esempio di formato:

```yaml
rapporti:
  - nome: AI Index Report
    editore: Stanford HAI
    url: https://hai.stanford.edu/ai-index
    cadenza: annuale
    edizioni:
      - {anno: 2026, data: 2026-04, url: https://...}
    prossima_prevista: 2027-04
```

`prossima_prevista` è una stima e la pagina la chiama così. Nessun campo di sintesi.

### 6.5 Modifiche ai moduli esistenti

- `feeds.py`: ogni feed ha `tema` (politica, ricerca, prodotti, business); ogni notizia lo eredita.
- `feeds.py`: per i feed Substack che rispondono 403 da GitHub Actions, provare un altro User-Agent o un altro indirizzo; se non basta, lo stato lo segnala.
- `arxiv.py`: tentativi con attese più lunghe (30 e 60 s) su 500 e 429.
- `run.py`: nuove fonti `owid`, `ai_act`, `rapporti` nell'ordine, con lo stesso trattamento degli errori.

## 7. Stile

- **Direzione**: minimal e ariosa, ispirata a useportal.net. Niente bagliori, maiuscole da terminale o immagini generate.
- **Colori**: tre.
  - Neutro: fondo `#f4f4f2`, card `#ffffff`; scuro: `#0b0b0a` e `#161615`.
  - Testo: `#121211`; scuro: `#ececea`.
  - Blu: `#0068d6`; scuro: `#4ea3ff`. Indica solo ciò che va guardato: "Impara ora", valori in salita, serie in evidenza, prossima scadenza.
  - Linee e testo secondario: il colore del testo mescolato al fondo (`color-mix`), non colori nuovi.
- **Font**: solo Bricolage Grotesque (OFL), pesi 400, 500, 600, 700, dimensione ottica automatica, file `.woff2` nel repo ridotti ai caratteri latini. Minimo 10px. Scala: 10, 12, 14, 16, 20, 28/32, 40, 56.
- **Spazi**: multipli di 8 (8, 16, 24, 32, 40, 48, 64, 96). Raggi: 8, 16, 24.
- **Card**: bianche, raggio 24, ombra leggera; nel tema scuro un bordo da 1px al posto dell'ombra.
- **Grafici**: linee sottili, punti tondi, serie in evidenza in blu e il resto in grigio, etichette dirette, griglia appena visibile. Niente legende quando un'etichetta diretta basta.
- **Foto**: Wikimedia Commons, licenza CC0, pubblico dominio, CC BY o CC BY-SA, controllate a vista. Credito sotto ogni foto e elenco completo in fondo. Metadati in `config/foto.yaml`. Foto scelte nel prototipo:

| Tema | File su Commons | Licenza |
| --- | --- | --- |
| Modelli e ricerca | Rear of rack at NERSC data center - closeup.jpg | CC0 |
| Open source | Wikimedia Hackathon 2025 - day 3 - 001.jpg | CC BY-SA 4.0 |
| Business | Silicon wafer researcher.jpg | Pubblico dominio |
| Persone e lavoro | Working in open office space (Unsplash).jpg | CC0 |
| Politica | Hemicycle of the European Parliament, Strasbourg 2023 003.jpg | CC BY 4.0 |
| Competenze | Wiki Education at UC Berkeley April 2018 111.jpg | CC BY-SA 4.0 |
| Notizie | Interior view of newspaper delivery room … World-Telegram photo LCCN95506971.jpg (ritagliata) | Pubblico dominio |
| Rapporti | LOC Main Reading Room Highsmith.jpg | Pubblico dominio |

Prototipo di riferimento: https://claude.ai/artifact/3D8t5JPfwAS71YXdLk9ERF

## 8. Interazione

### Aprire e chiudere

- La card è un pulsante con `aria-expanded` e `aria-controls`. Si apre con clic, tocco, Invio, Spazio.
- Una card aperta alla volta. Le altre diventano pillole (foto rotonda + nome) sopra il dettaglio.
- Si chiude con ×, Esc, il tasto indietro, o un nuovo clic sulla pillola attiva.
- Transizione di 400 ms con la View Transitions API; senza supporto, apertura immediata; con `prefers-reduced-motion` nessuna animazione.
- I JSON si scaricano tutti all'avvio; i grafici si disegnano solo all'apertura della card.

### Link diretti

- `#<tema>` apre la card. `#competenze/<id>` evidenzia una competenza. `#notizie/<fonte>` applica il filtro.
- Aprire dalla home aggiunge un passo alla cronologia; passare da una card all'altra lo sostituisce. Un "indietro" riporta sempre alla home.
- Il titolo della scheda diventa "<Tema> · AI Radar".
- Pulsante "Copia link" nel dettaglio; se la copia non riesce, il testo del link viene selezionato.
- Hash sconosciuto: home.

### Tastiera e lettori di schermo

- Link "Vai ai temi" in cima.
- Ordine di Tab: testata, card, crediti.
- All'apertura il focus va al titolo della card (`tabindex="-1"`); alla chiusura torna alla card di partenza.
- Ogni grafico ha "Vedi i dati": una tabella con gli stessi numeri.
- Anello di focus blu da 2px sempre visibile.

### Telefono (sotto 560px)

- Card come righe compatte: foto quadrata da 88px, tema, numero a 28px, frase.
- Card aperta: le pillole diventano una striscia fissa in alto, scorrevole in orizzontale, con × a destra; rispetta le aree sicure dello schermo.
- Radar senza note di cambio quadrante; pannello dei movimenti sotto il radar.
- Tabelle e grafici larghi scorrono nel loro riquadro, mai la pagina.
- Bersagli toccabili alti almeno 40px. Effetti al passaggio del mouse solo con `(hover: hover)`. Al tocco: tooltip del punto; tocco su una riga dei movimenti evidenzia la competenza.

### Prestazioni

- Foto in WebP a 480 e 900px con `srcset`; le prime 4 subito, le altre in lazy loading.
- Font precaricato, solo caratteri latini.
- D3 importato per moduli.

## 9. Dati mancanti ed errori

### Stati di una card

- **ok**: dato aggiornato, con data.
- **vecchio**: l'ultimo aggiornamento della fonte è fallito; si mostra l'ultimo dato buono con la nota "aggiornamento non riuscito il <data>, dati del <data>".
- **assente**: la fonte non ha mai dato dati; foto, tema e motivo ("serve la chiave Adzuna"). La card si apre con la spiegazione.

Lo stato viene da `status.json`. Ogni blocco del dettaglio è indipendente.

### Frasi scritte dai dati

Ogni generatore riceve i dati della sua fonte e restituisce una frase o `null`. Con `null` la card usa una frase di riserva neutra. Casi coperti: nessun cambio di quadrante, più competenze che entrano o escono, posizione precedente mancante, nessuna scadenza futura dell'AI Act, nessuna notizia nella settimana.

### Errori nella pagina

- JSON non raggiungibile: fonte assente.
- Nessun JSON raggiungibile: avviso con "Riprova".
- Errore in un grafico: "Grafico non disponibile" nel blocco, errore in console, il resto funziona.
- Foto non caricata: riquadro neutro con il testo alternativo.

## 10. Test

### Python (pytest, senza rete)

- Test esistenti (19).
- `owid.py`: CSV di prova; colonna mancante va in errore solo per quella serie.
- `ai_act.py` e `rapporti.py`: file validi e non validi.
- `feeds.py`: il tema passa alle notizie.

### Front-end

- **Vitest, unità**: frasi scritte dai dati (tutti i casi del paragrafo 9), formati italiani di numeri e date, giorni mancanti, parsing e scrittura dei link diretti, calcolo degli stati ok/vecchio/assente.
- **Testing Library, componenti**: apertura e chiusura, `aria-expanded`, Esc, ritorno del focus, pillole.
- **Playwright + axe-core, end-to-end** sul sito costruito con dati di prova:
  - ogni card si apre con il clic e con il link diretto;
  - indietro chiude la card; un solo indietro dopo un cambio di card torna alla home;
  - percorso completo da tastiera;
  - a 360px nessuno scorrimento orizzontale della pagina;
  - tema scuro e `prefers-reduced-motion`;
  - nessuna violazione axe di gravità "serious" o "critical".

### Workflow

`pytest` → raccolta dati → `npm ci` → `vitest` → build → Playwright sul sito costruito → upload su Pages. Se un passo fallisce non si pubblica; resta online la versione precedente.

## 11. Passaggio dalla versione attuale

1. Pipeline: owid, ai_act, rapporti, tema dei feed, tentativi arXiv. `site/` continua a funzionare.
2. App Svelte in `web/`, con le 8 card e i test.
3. Workflow e `build_site.py` passano a `web/`; `site/` viene rimosso nello stesso cambio.
4. README aggiornato: struttura, sviluppo locale (`npm run dev`), nuove fonti, crediti delle foto.

## 12. Questioni aperte

- Date dell'AI Act da verificare su EUR-Lex.
- Elenco definitivo dei rapporti e delle loro date.
- Licenza delle singole serie OWID.
- Feed Substack bloccati da GitHub Actions: soluzione da trovare in implementazione.
- Le chiavi Adzuna e Artificial Analysis non sono configurate: le card relative partono nello stato "assente".
