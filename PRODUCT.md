# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Due pubblici alla pari, uno per **testa** (vedi `GLOSSARY.md`):

- **Per te**: chi lavora in Italia, o vuole lavorarci, e si chiede su quali competenze sull'AI formarsi. Sceglie un **ruolo** (Sviluppo software, Prodotto, Dati e analisi, Legale e compliance) o guarda tutte le competenze.
- **Per la tua organizzazione**: chi decide in un'organizzazione italiana e vuole sapere quanto le imprese usano l'AI, nel suo **settore** e in UE, cosa chiede l'AI Act e quando, e dove stanno l'Italia e l'Europa nella catena dell'AI.

Nessuno dei due viene prima. C'è un terzo pubblico, secondario: chi guarda il progetto come vetrina del lavoro dell'autore.

## Product Purpose

AI Radar è una dashboard pubblica sull'AI, in italiano, costruita su dati aperti che si aggiornano da soli ogni lunedì. Chi apre la home capisce in pochi secondi la notizia della settimana di ciascuna testa e con un clic arriva alla prova, nella card da cui viene.

Ogni lunedì esce anche un'**edizione**, il riassunto fisso della settimana con un suo indirizzo, che si può citare e rileggere. Chi vuole seguire il sito senza ricordarsi di aprirlo usa il feed RSS, senza account né email.

È un progetto personale, gratuito e senza scopo commerciale, che fa anche da vetrina professionale. Funziona se le persone lo usano e si fidano dei numeri, e se chi lo guarda ne ricava un'impressione di cura e rigore.

## Positioning

Ogni numero si può ricontrollare: ha la sua fonte cliccabile e la sua licenza, e le misure sono in unità vere (per esempio "+25% in 6 mesi", annunci ogni 10.000). Le soglie del radar sono fisse e il quadrante cambia solo dopo due mesi di fila, quindi una competenza non salta da una settimana all'altra. Dove i dati mancano, la pagina lo dice. Tutto gira gratis su GitHub, e il metodo è scritto nel README.

## Operating Context

- Una visita tipica parte dalla home: due porte, *Per te* e *Per la tua organizzazione*, ognuna con una notizia; sotto, 9 card divise per testa (4 e 5). Una card si apre a tutta larghezza; da 1200 px le altre restano in un elenco a sinistra.
- Ogni scelta (card, ruolo, mercato, settore, area, anello) sta nel link con `#card?nome=valore`, così un link si condivide e vince sul ricordo della visita precedente.
- I dati arrivano da GitHub Actions e cambiano solo il lunedì o con un avvio manuale: un push pubblica il sito con i dati già salvati. GitHub Pages pubblica il sito statico. Una fonte che non risponde lascia l'ultimo dato valido e lo segnala nella sezione *Stato delle fonti*.
- Dalla home si arriva alle edizioni: «Settimana del…» porta all'edizione di quella settimana, «Edizioni» sta nella testata e «Segui con RSS» in fondo alla pagina. Prima della prima edizione questi link non ci sono.

## Capabilities and Constraints

- Card della testa *Per te*: Competenze (radar di 16 competenze su arXiv, GitHub e Adzuna, Europa contro USA, con una pagina per competenza), Modelli e ricerca, Open source, Notizie.
- Card della testa *Per la tua organizzazione*: Business (adozione per settore, scopi e barriere, Italia contro UE), GeopoliticAI (capacità e calcolo per area, mappa della catena dell'AI), Persone e lavoro, Norme (scadenze dell'AI Act), Rapporti (solo link e date).
- Edizioni: una pagina statica per settimana (`/edizioni/AAAA-MM-GG/`), con le due porte, le frasi cambiate, fino a 3 notizie per tema, fonte e licenza su ogni riga, e un'immagine di anteprima propria. L'archivio (`/edizioni/`) le tiene tutte. Il testo non cambia, salvo correzioni dichiarate con la data e cosa è cambiato. I testi sono scritti dai dati con regole fisse, senza note d'autore.
- Feed: RSS (`/feed.xml`) con una voce per edizione a testo intero, le ultime 26. Una correzione compare nella voce, che non torna a essere nuova.
- Terminologia: codice, test e testi usano i termini di `GLOSSARY.md`, ed evitano i sinonimi che il glossario esclude.
- Solo fonti pubbliche e servizi gratuiti: GitHub Actions e GitHub Pages, nessun account, nessuna newsletter, nessun testo copiato. Le notizie mostrano solo titolo, data e link.
- Oggi le frasi e le notizie delle porte sono scritte dai dati con regole fisse, senza LLM. È la scelta attuale, non un vincolo dichiarato.
- Solo italiano; traduzioni fuori perimetro.
- Le chiavi API (Artificial Analysis, Adzuna) sono facoltative: senza, i grafici che ne dipendono spiegano cosa manca.
- Da chiarire: se i termini di Adzuna coprono una pagina pubblica con conteggi aggregati (README, *Nota su Adzuna*).

## Brand Commitments

- Nome: **AI Radar**. Nomi delle teste: *Per te*, "Su cosa formarti"; *Per la tua organizzazione*, "L'AI in Italia".
- Voce: italiano piano, frasi brevi e concrete, numeri con l'unità, nessun gergo e nessun tono promozionale. I testi di README, spec e interfaccia sono il riferimento.

## Evidence on Hand

- Dati reali e storico: `data/*.json`, scritti dalla pipeline; stato delle fonti in `data/status.json`.
- Edizioni: `data/edizioni/`, un JSON e un'immagine per settimana, a partire dal primo lunedì dopo il rilascio.
- File curati a mano: `config/` (competenze e risorse, fonti, AI Act, rapporti, catena dell'AI).
- Foto: `web/src/assets/photos/`, da Wikimedia Commons, con autore e licenza in pagina.
- Licenze: codice MIT; dati ETO in CC BY-NC 4.0 (`docs/adr/0001-dati-eto-in-cc-by-nc.md`); serie AI Index in CC BY-ND 4.0, da citare senza modifiche; licenza di ogni serie OWID in `config/sources.yaml`.
- Non ci sono testimonianze, utenti nominati, numeri di visite, stampa o partner: il lavoro futuro non deve inventarli. Il progetto non è affiliato a nessuna delle fonti.

## Product Principles

1. **Ogni numero ha la sua fonte.** Fonte cliccabile e licenza accanto al dato, e la si può ricontrollare ripetendo la stessa ricerca.
2. **Dati mancanti detti onestamente.** Un dato che manca non diventa mai uno zero o un vuoto muto: lo dice una frase.
3. **Gratis e aperto.** Solo fonti pubbliche e servizi gratuiti, nessun account, nessun testo copiato.
4. **Due teste alla pari.** Nessuna delle due viene sacrificata all'altra, in home come nelle card.
5. **Prudenza nelle misure.** Soglie fisse, unità vere, cambi confermati nel tempo: meglio un segnale lento che uno che salta.

## Accessibility & Inclusion

Ogni vista regge a 320 px senza scorrimento orizzontale, da tastiera, con lettore di schermo, con il tema scuro e con «riduci movimento» senza animazioni. I pulsanti di scelta usano `aria-pressed`; il testo secondario resta almeno a 4,5:1 (AA). Gli end-to-end in `web/tests/e2e/dashboard.spec.ts`, con axe-core, lo provano.
