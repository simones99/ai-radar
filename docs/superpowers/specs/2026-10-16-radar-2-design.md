# AI Radar: Radar 2.0

Data: 16 ottobre 2026
Stato: approvata

## 1. Contesto e obiettivo

Secondo dei quattro pezzi (home a due ingressi, **Radar 2.0**, Ruoli, Osservatorio Italia). La home è fatta e pubblicata.

Il radar di oggi ha tre difetti, visti sui dati del 16 ottobre:

1. **È instabile.** Lo slancio salta da un mese all'altro (Governance da 0,93 ad aprile a 0,10 ad agosto, text-to-SQL da 0,17 a 0,97). Tre cause: conteggi piccoli (text-to-SQL 13–33 paper al mese, rumore ±25–30% su 3 mesi), ranghi percentili che ingrandiscono differenze minime, finestre corte (3 mesi contro 3).
2. **I numeri sono solo relativi.** "Domanda 100" vuol dire "la prima delle 16", non "molto richiesta". Aggiungere una competenza sposta tutte le altre; metà delle competenze sta sopra la linea per costruzione.
3. **Non dice quanto fidarsi.** Agenti ha 4.558 annunci e 2.500 paper al mese; text-to-SQL 7 annunci e 25 paper. Le due crescite oggi pesano uguale.

In più, chi apre una competenza vede solo un punto sul radar: niente andamento, niente da dove iniziare.

Obiettivo: un radar stabile, in unità vere, che dichiara i dati incerti, e una pagina per ogni competenza con andamento e risorse.

Criteri di successo:

- un quadrante pubblicato non cambia per un mese solo: cambia dopo 2 mesi di fila nel quadrante nuovo;
- aggiungere o togliere una competenza non cambia slancio, domanda, quadrante e incertezza delle altre (test);
- slancio e domanda si leggono in unità vere: "+25% in 6 mesi", "3,4 annunci ogni 10mila";
- le competenze con dati incerti sono riconoscibili sul radar e non finiscono nelle porte della home;
- `#competenze/mcp` apre la pagina di MCP con tre andamenti, risorse per iniziare e repository in crescita;
- la pagina funziona a 320 px, da tastiera e con il tema scuro.

## 2. Fuori dal perimetro

- Ruoli e Osservatorio Italia.
- Cambiare l'elenco delle competenze o le frasi di ricerca (la prova su "prompt engineering" del 16 ottobre ha confermato che i conteggi sono pertinenti).
- Paper più citati (Semantic Scholar): scartati, i paper degli ultimi 3 mesi hanno ancora poche citazioni.
- Traduzione delle risorse: si indica la lingua, non si traduce.
- Il ripiego della domanda sui repository quando manca Adzuna: si toglie (sezione 4.3).

## 3. Decisioni prese

| Tema | Decisione |
| --- | --- |
| Ordine dei problemi | Instabilità, poi numeri relativi, poi affidabilità |
| Reattività | Prudente: un cambio di quadrante si vede dopo circa 2 mesi di tendenza |
| Unità | Assi in unità vere, soglie fisse: slancio 0, domanda 3 annunci ogni 10mila |
| Metodo | Tendenza su 6 mesi con margine d'errore, segnali combinati pesando i più precisi |
| Dati incerti | Restano sul radar, punto vuoto, hanno un quadrante, non entrano nelle porte |
| Pagina della competenza | Vista piena dentro la card Competenze, al posto del radar |
| Risorse | "Per iniziare" scelte a mano in `skills.yaml`; "Cosa si muove adesso" automatiche |
| Risorse automatiche | Solo GitHub: i 3 repository del topic creati negli ultimi 90 giorni con più stelle |

## 4. Il metodo

### 4.1 Base comune: tutto è una quota

Ogni segnale si misura come quota, cioè rispetto all'AI in generale:

- **arXiv**: paper che citano la competenza / paper AI del mese. C'è già (`_totale` in `arxiv.json`).
- **GitHub**: nuovi repository con il topic della competenza / nuovi repository AI del mese. La base AI è nuova: la somma dei nuovi repository con i topic `llm`, `ai`, `artificial-intelligence`, `generative-ai`. Un solo topic sarebbe fragile: tra marzo e settembre 2026 `llm` è cresciuto del 56% e `ai` è calato dell'11%. I doppi conteggi tra topic non contano: la base serve come indice dell'andamento, non come totale.
- **Lavoro**: annunci che citano la competenza ogni 10mila annunci del Paese. C'è già.

### 4.2 Slancio

Per ogni segnale si stima la tendenza della quota negli **ultimi 6 mesi interi** (lavoro: le rilevazioni degli ultimi 6 mesi):

- regressione pesata di `log((n + 0,5) / totale)` sul tempo, con peso `n + 0,5` (varianza di Poisson del logaritmo);
- dispersione stimata dai residui (quasi-Poisson): l'errore standard si moltiplica per la radice della dispersione, se maggiore di 1;
- risultato: variazione della quota nei 6 mesi, `exp(6 × pendenza mensile) − 1`, con margine all'80% (±1,28 errori standard sulla pendenza).

Non si proietta all'anno: proiettare gonfia i numeri (robotica risulterebbe +271%).

**Lavoro** nello slancio: per ogni Paese la pendenza sulle rilevazioni con la stessa ricerca della rilevazione più recente; entra solo se ci sono almeno 8 settimane tra la prima e l'ultima rilevazione usata. I Paesi si combinano come i segnali (sotto).

**Combinazione dei segnali**: media delle pendenze pesata per l'inverso della varianza. Nessun segnale può pesare più di 2/3 quando ce ne sono almeno due (i pesi oltre 2/3 si tagliano e si rinormalizzano): GitHub ha conteggi enormi e altrimenti deciderebbe da solo. L'errore standard combinato segue dagli stessi pesi.

**Soglia**: 0, cioè "la quota cresce: la competenza cresce più dell'AI nel suo complesso".

### 4.3 Domanda

- Annunci ogni 10mila, media tra i Paesi della rilevazione più recente, come oggi (`lavoro.media`).
- **Soglia fissa: 3 ogni 10mila** (circa 1 annuncio su 3.300). Il 16 ottobre ne sono sopra 8 su 16.
- Il dato italiano (`lavoro.ogni_10mila.it`) va nella pagina della competenza, non decide il quadrante.
- **Senza dati sul lavoro la competenza non ha domanda né quadrante.** Si toglie il ripiego sui repository di oggi (`base_domanda: open-source`), che mescola unità diverse.

### 4.4 Quadranti

| | domanda ≥ 3 | domanda < 3 |
| --- | --- | --- |
| **slancio > 0** | Impara ora | Da provare |
| **slancio ≤ 0** | Da consolidare | Tieni d'occhio |

Con soglie fisse un quadrante può svuotarsi (per esempio se l'AI rallenta in generale). È voluto: dice una cosa vera.

### 4.5 Incertezza

Una competenza è **incerta** se l'ampiezza del margine all'80% dello slancio combinato (estremo alto meno estremo basso, in variazione sui 6 mesi: da −10% a +30% fa 0,40) supera una soglia `MARGINE_MAX`. Il valore si tara nel piano sui dati veri, con un criterio fisso: text-to-SQL deve risultare incerto, agenti, MCP e RAG no. Il valore scelto va scritto in `radar.py` con il dato da cui viene.

La domanda bassa con pochi annunci **non** rende incerti: "pochi la chiedono" è un dato vero.

Ogni competenza incerta porta il motivo in chiaro (campo `incerto_perche`), costruito dai volumi: per esempio "pochi paper (25 al mese) e pochi repository (200 al mese)".

### 4.6 Prudenza: il quadrante pubblicato

Si calcola il quadrante mese per mese (lo storico, come oggi, ricalcolato a ogni giro dai dati, senza stato salvato). Il **quadrante pubblicato** del mese `t`:

- è il quadrante calcolato di `t` se è uguale a quello calcolato di `t − 1`;
- altrimenti resta il quadrante pubblicato di `t − 1`;
- nel primo mese dello storico, e quando manca il mese prima, è il quadrante calcolato.

Quando pubblicato e calcolato differiscono, la competenza è "in movimento verso" il quadrante calcolato.

La domanda del mese `t` nello storico usa le rilevazioni del lavoro fino a fine mese `t`. Prima della prima rilevazione non c'è domanda: lo storico ha slancio ma non quadrante.

### 4.7 Un mese fa e movimenti

Posizione di un mese fa: stesso calcolo con le serie fermate al mese prima e le rilevazioni di almeno 28 giorni prima, come oggi. Le frecce e i movimenti si misurano in coordinate del grafico (sezione 7.1), su cui `MOVE_MIN = 0,1` (un decimo dell'asse) mantiene il significato attuale.

## 5. Dati e pipeline

### 5.1 `config/sources.yaml`

Nuova chiave:

```yaml
github_base_topics: [llm, ai, artificial-intelligence, generative-ai]
```

### 5.2 `config/skills.yaml`

Nuovo campo `risorse` per ogni competenza, 2–4 voci:

```yaml
    risorse:
      - {titolo: "Documentazione ufficiale", url: "https://modelcontextprotocol.io", tipo: documentazione}
      - {titolo: "...", url: "...", tipo: corso, lingua: it}
```

- `tipo`: `documentazione`, `corso`, `guida`, `repository`.
- `lingua`: `en` se manca. La pagina scrive "in inglese" accanto alle risorse non in italiano.
- Le risorse le propone chi scrive il piano, scelte tra fonti aperte e gratuite (documentazione ufficiale, corsi gratuiti, repository di riferimento), e le approva l'utente prima dell'esecuzione. Ogni link va aperto e controllato.

### 5.3 `pipeline/github_signals.py`

- **Base AI**: serie mensile `base` (somma dei `github_base_topics`) in `github.json`, stessi mesi e stessa logica di aggiornamento dei topic (si ricontano gli ultimi 2 mesi; se cambia l'elenco dei topic si riparte). Costo: 4 × 13 = 52 chiamate al primo giro, poi 8 a giro.
- **Repository in crescita**: per ogni competenza una ricerca `topic:{topic} created:>={oggi − 90 giorni}`, ordinata per stelle, 3 risultati. In `github.json` sotto `in_crescita[{id}]`: `nome` (owner/repo), `url`, `descrizione` (200 caratteri), `stelle`, `creato`. Costo: 16 chiamate a giro. Se la ricerca fallisce per una competenza si tiene la lista del giro prima.

### 5.4 Controllo dei link delle risorse

Un passo nuovo della pipeline, `risorse`, prima di `radar`: per ogni URL di `skills.yaml` una richiesta (HEAD, poi GET se HEAD non è permesso), timeout breve, una volta a settimana come gli altri. Scrive `risorse.json`: per URL `ok` (stato < 400), `stato`, `controllato`. Un link non raggiungibile per **due giri di fila** è `ok: false` (un errore singolo non basta: i siti cadono). Lo stato delle fonti riporta il numero di link non raggiungibili. Il passo non fa mai fallire il giro.

### 5.5 `pipeline/radar.py`

Riscritto sul metodo della sezione 4. Funzioni pure, testabili una per una:

- `trend(ns, totali)` → `{variazione, margine, pendenza, errore}` (sezione 4.2);
- `combine(trends)` → stessa forma, con il tetto di 2/3;
- `quadrant(slancio, domanda)` con le soglie fisse;
- `published(calcolati)` → quadranti pubblicati mese per mese (sezione 4.6).

### 5.6 `radar.json`, versione 2

```jsonc
{
  "versione": 2,
  "generato": "2026-10-19",
  "soglie": { "slancio": 0, "domanda": 3, "margine_max": 0.4 },
  "quadranti": { "impara-ora": "Impara ora", ... },
  "competenze": [{
    "id": "mcp", "nome": "...", "breve": "MCP", "plurale": false, "descrizione": "...",
    "slancio": 0.25, "slancio_margine": [0.10, 0.42],   // variazione della quota in 6 mesi
    "domanda": 3.37, "domanda_it": 2.63,                // annunci ogni 10mila
    "quadrante": "impara-ora",                          // pubblicato
    "quadrante_calcolato": "impara-ora",                // diverso = "in movimento verso"
    "incerto": false, "incerto_perche": null,
    "slancio_prec": 0.18, "domanda_prec": null, "quadrante_prec": "impara-ora",
    "segnali": {
      "arxiv":  { "variazione": -0.04, "margine": [-0.3, 0.3], "peso": 0.2, "mensile": [{"mese": "2025-10", "n": 30, "totale": 12170}] },
      "github": { "variazione": 0.40, "margine": [...], "peso": 0.67, "mensile": [{"mese": "...", "n": 905, "base": 21000}] },
      "lavoro": { "variazione": null, "margine": null, "peso": 0, "rilevazioni": [{"data": "2026-10-16", "media": 3.37, "it": 2.63}], "ogni_10mila": {"it": 2.63, ...} }
    },
    "per_iniziare": [{ "titolo": "...", "url": "...", "tipo": "documentazione", "lingua": "en" }],
    "in_crescita": [{ "nome": "owner/repo", "url": "...", "descrizione": "...", "stelle": 1200, "creato": "2026-08-02" }]
  }],
  "storico": [{ "mese": "2026-09", "competenze": { "mcp": { "slancio": 0.2, "domanda": 3.1, "calcolato": "impara-ora", "pubblicato": "impara-ora", "incerto": false } } }]
}
```

`per_iniziare` contiene solo i link `ok` (o mai controllati). `base_domanda`, `crescita_lavoro_nello_slancio` e `domanda_prec_attuale` spariscono: `domanda_prec` è `null` finché manca una rilevazione di almeno 28 giorni prima, e allora il quadrante di un mese fa usa la domanda di oggi, come adesso.

## 6. La pagina della competenza

Si apre con `#competenze/{id}`: dal clic su un punto del radar, dalla tabella, dai movimenti del mese, dalle porte. Con un `id` sconosciuto la card mostra il radar, come oggi. Il passaggio del mouse sul radar continua a evidenziare senza aprire.

Dentro la card Competenze aperta, al posto del radar, dall'alto in basso:

1. Link "← Tutte le competenze" (`#competenze`). Indietro del browser fa lo stesso.
2. `h2` con il nome completo, etichetta del quadrante pubblicato; se è in movimento, "in movimento verso Da provare". Sotto, la descrizione.
3. Se incerta, un avviso breve: "Dato incerto: {incerto_perche}. La posizione sul radar può cambiare molto."
4. Tre numeri:
   - **Domanda**: "3,4 annunci ogni 10mila", sotto "Italia: 2,6";
   - **Slancio**: "+25% in 6 mesi", sotto "margine: da +10% a +42%";
   - **Affidabilità**: "solida" o "incerta", sotto il segnale che pesa di più ("pesa di più: GitHub").
5. **Andamento**, tre piccoli grafici a linea affiancati (uno sotto l'altro sotto 720 px):
   - paper che ne parlano ogni 1.000 paper AI, 13 mesi;
   - nuovi repository ogni 1.000 repository AI, 13 mesi;
   - annunci ogni 10mila, media e Italia, per rilevazione. Con meno di 2 rilevazioni: "Serve un mese di rilevazioni".

   Ogni grafico ha la sua tabella accessibile, come gli altri blocchi (`Block` con `table`).
6. **Il percorso sul radar**: una riga di mesi con il quadrante pubblicato di ognuno (dallo storico).
7. **Per iniziare** (scelte a mano) e **Cosa si muove adesso** (repository in crescita, con stelle e data di creazione), affiancate. Senza repository: "Nessun repository nuovo con questo topic negli ultimi 90 giorni."
8. Fonti: arXiv, GitHub, The Adzuna API, con il link ai criteri del metodo nella vista del radar.

All'apertura il focus va sull'`h2` e la pagina scorre fino alla card, come per gli elementi aperti dalle porte (meccanismo `riapri` già esistente).

Componenti nuovi in `web/src/lib/tiles/`: `SkillView.svelte` (la vista) e, se serve, `SkillTrend.svelte` (i tre grafici, sul `LineChart` esistente). `CompetenzeDetail.svelte` sceglie tra radar e vista in base a `elemento`.

## 7. Radar, card e porte

### 7.1 Il grafico

- Asse orizzontale: slancio su scala logaritmica di `1 + slancio`, dominio fisso da −50% a +100% (simmetrico attorno a 0), linea a 0. Etichette: "cresce meno dell'AI" / "cresce più dell'AI".
- Asse verticale: domanda su scala logaritmica, dominio fisso da 0,1 a 90 annunci ogni 10mila (simmetrico attorno a 3), linea a 3.
- I valori fuori dominio si disegnano sul bordo.
- Coordinate normalizzate in `[0, 1]` calcolate in `derive.ts`: frecce, `move` e `MOVE_MIN` lavorano lì.
- Punto pieno se solido, vuoto (solo contorno) se incerto. Legenda: "punto vuoto: dato incerto".
- Clic su un punto: apre la pagina della competenza.

### 7.2 Testi della vista del radar

- Nota del blocco: "Le linee sono soglie fisse: cresce più dell'AI, almeno 3 annunci ogni 10mila. Le frecce partono da dove era un mese fa."
- Tabelle con unità vere: slancio "+25%", domanda "3,4".
- `METODO` riscritto sulla sezione 4, in frasi brevi.
- Movimenti del mese: le competenze "in movimento verso" un quadrante compaiono con quella dicitura.

### 7.3 Faccia della card

"3 su 16" resta. Frase: "Competenze da imparare ora: crescono più dell'AI e hanno almeno 3 annunci ogni 10mila."

### 7.4 Porta "Per te"

Le regole restano quelle della spec della home, con due cambi:

- le competenze incerte non entrano nelle regole 1–3 (contano nella riserva);
- la regola 3 parla in unità vere, senza accordo di genere: "Slancio di **DB vettoriali** da +12% a −20%" oppure "Domanda di **MCP** da 2,1 a 3,4 annunci ogni 10mila". Vince lo spostamento più grande in coordinate normalizzate, se almeno `MOVE_MIN`.

## 8. Errori e casi limite

- **Meno di 6 mesi di serie** per un segnale: quel segnale non entra. Nessun segnale: niente slancio, niente quadrante, la competenza compare solo nella tabella con "dati insufficienti".
- **Mesi con totale 0** (arXiv giù): il mese si salta nella regressione; con meno di 4 mesi validi il segnale non entra.
- **arXiv incompleto** (`completo: false`): come oggi, arXiv non entra nel giro.
- **Base GitHub mancante**: il segnale GitHub non entra (non si usa il conteggio grezzo).
- **Ricerca Adzuna cambiata**: le rilevazioni con la ricerca vecchia non entrano nella tendenza del lavoro; la domanda di oggi resta.
- **App con `radar.json` vecchio** (senza `versione: 2`): la card Competenze mostra "Il radar si aggiorna al prossimo giro" e la porta usa la riserva senza dati. Serve solo per il tempo tra il push e il giro della pipeline.

## 9. Test

Pipeline (`tests/test_pipeline.py` o un file nuovo `tests/test_radar.py`):

- `trend` su una serie costruita con crescita nota ritrova la crescita; con conteggi piccoli il margine è più largo;
- dispersione: una serie molto rumorosa ha margine più largo di una regolare con gli stessi conteggi;
- `combine`: pesi per inverso della varianza, tetto di 2/3, un solo segnale passa invariato;
- soglie e quadranti ai bordi (slancio 0, domanda 3);
- `published`: un mese fuori quadrante non cambia il pubblicato, due mesi sì;
- aggiungere una competenza non cambia i valori delle altre;
- base GitHub: somma dei topic, ripartenza se l'elenco cambia;
- `in_crescita`: tiene la lista vecchia se la ricerca fallisce;
- controllo dei link: `ok: false` solo dopo due errori di fila.

App (vitest):

- coordinate normalizzate, bordi del dominio, `move`;
- porte: le incerte non entrano nelle regole 1–3; testo della regola 3 in unità vere;
- `CompetenzeDetail`: con `elemento` valido mostra la vista, con `elemento` sconosciuto il radar;
- vista: tre numeri, "in movimento verso", avviso di incertezza, grafico del lavoro con meno di 2 rilevazioni, risorse "in inglese", nessun repository in crescita;
- `radar.json` senza `versione: 2`.

E2e: clic su un punto del radar apre la pagina, "← Tutte le competenze" torna al radar, Indietro del browser torna al radar, la porta "Per te" apre la pagina della competenza; a 320 px nessuno scorrimento orizzontale.

## 10. Rilascio

- Pipeline, configurazione e app nello stesso push: il push su `pipeline/**` fa partire `aggiorna.yml`, che rigenera `radar.json` e pubblica il sito. Adzuna non rifà la rilevazione della settimana (ricerche invariate).
- Costi in più a giro: GitHub 8 + 16 chiamate (52 + 16 al primo), ~50 richieste di controllo dei link. Adzuna invariato.
- README: sezione del radar riscritta sul metodo nuovo.
- Dopo il rilascio: controllare sul sito la pagina di 2–3 competenze (una solida, una incerta) e che i quadranti abbiano senso.
