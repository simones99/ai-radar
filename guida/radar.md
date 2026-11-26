# Come si legge il radar

Ogni competenza ha due coordinate in unità vere:

- **Slancio**: quanto è cambiata negli ultimi 6 mesi interi la sua quota sul totale dell'AI, per esempio "+25% in 6 mesi". Si stima con una retta sui dati di ogni mese, combinando
    - la quota di paper AI su arXiv che la citano nell'abstract,
    - la quota di nuovi repository GitHub con il suo topic sui nuovi repository AI (somma dei topic `llm`, `ai`, `artificial-intelligence`, `generative-ai`),
    - la quota di annunci di lavoro che la citano, quando ci sono almeno 8 settimane di rilevazioni con la stessa ricerca.

    I segnali più precisi pesano di più, nessuno più di due terzi.

- **Domanda**: annunci di lavoro che la citano ogni 10.000 annunci attivi, nel **Paese a metà classifica**. Ogni Paese vale la mediana delle sue ultime 4 rilevazioni con la stessa ricerca (con meno di 4, quelle che ci sono), così una settimana strana non sposta il numero. Il Paese a metà classifica è la mediana tra i Paesi: con un numero pari di Paesi, il valore a metà tra i due centrali. Il metodo è cambiato a novembre 2026: prima contava solo l'ultima rilevazione, e un solo Paese poteva spostare il valore. Lo storico si ricalcola a ogni raccolta, quindi il nuovo metodo vale anche per i mesi passati.

## Quadranti

I quadranti hanno **soglie fisse**: slancio sopra 0 (cresce più dell'AI nel suo complesso) e almeno 3 annunci ogni 10mila. **Impara ora** (entrambe), **Da provare** (solo lo slancio), **Da consolidare** (solo la domanda), **Tieni d'occhio** (nessuna delle due). Aggiungere o togliere una competenza non sposta le altre.

Il radar è **prudente**: il quadrante cambia solo se il calcolo di due mesi di fila dà il quadrante nuovo; nel frattempo la competenza è "in movimento verso" il quadrante nuovo. Una competenza è **incerta** (punto vuoto) quando il margine d'errore dello slancio è largo, di solito per pochi paper o repository: resta sul radar ma non finisce nella porta *Per te* della home.

## Il radar sull'Italia

Il radar si può leggere **sull'Italia**: nella card Competenze si sceglie il mercato, «Tutti i Paesi» o «Italia», e la scelta sta nel link (`#competenze?mercato=italia`). Con «Italia» la domanda è quella italiana, la mediana delle ultime 4 rilevazioni in Italia, e accanto si legge il numero di annunci che ci sta dietro. Lo slancio è unico: la crescita si misura nel mondo e non cambia. La soglia è la stessa, 3 annunci ogni 10mila. I quadranti sono propri, con la stessa conferma di due mesi di fila. Dove manca il dato italiano la pagina lo dice e non mostra uno zero.

## Le pagine delle competenze

Ogni competenza ha una sua pagina (`#competenze/mcp`) con l'andamento dei tre segnali, il percorso sul radar, le risorse per iniziare scelte a mano e i repository nuovi più stellati.

Per chi arriva da un motore di ricerca o senza JavaScript, ogni competenza ha anche una pagina in HTML statico, che si rifà a ogni build con i dati di quel giro:

| Indirizzo | Cosa c'è |
| --- | --- |
| `/competenze/<id>/` | la pagina di una competenza, con l'`id` di `config/skills.yaml`: dove sta nei due mercati, domanda, slancio, percorso sul radar, risorse, fonti e metodo, e la sua immagine di anteprima |
| `/competenze/` | l'indice delle competenze, raggruppate per quadrante |

L'`id` diventa la cartella della pagina: può avere solo minuscole, cifre e trattini, e la pipeline ferma il radar se non è così. Le immagini di anteprima delle competenze le fa `npm run anteprime-competenze`, dopo la build e con Chromium: il workflow lo lancia a ogni giro che pubblica.

## Limiti

- le ricerche sono per parole chiave, quindi un termine ambiguo può gonfiare o sgonfiare un conteggio;
- i topic GitHub li sceglie chi crea il repository;
- negli annunci in Italia, Germania o Francia le parole tecniche inglesi sono comuni ma non universali, quindi il confronto tra Paesi va letto con cautela.

Per controllare un conteggio basta ripetere la stessa ricerca sulla fonte.
