# In Italia il dato è incerto quando la domanda è vicina alla soglia, non sotto un minimo di annunci

Fino a novembre 2026 una competenza era incerta solo per lo slancio, che è uguale nei due mercati. La domanda italiana nasce da poche decine di annunci a settimana e non aveva nessun margine, quindi vicino alla soglia il quadrante italiano poteva dipendere da pochi annunci senza che la pagina lo dicesse. Abbiamo deciso che nel mercato Italia una competenza è incerta anche quando la soglia della domanda, contata in annunci italiani, cade dentro il margine all'80% del numero di annunci della competenza. Il quadrante resta quello calcolato, e il mercato Tutti i Paesi non cambia.

## La regola

- Il conto è il numero di annunci italiani che il radar già calcola, la mediana delle ultime 4 rilevazioni con la stessa ricerca. La soglia in annunci è la soglia della domanda, 3 ogni 10mila, applicata alla mediana del totale italiano delle stesse rilevazioni.
- Il margine all'80% di un conto di *n* annunci va da *n − 1,2816·√n* a *n + 1,2816·√n*. Con 0 annunci il margine è nullo, e la competenza è sotto la soglia senza incertezza.
- Incerta in Italia vuol dire incerta per lo slancio oppure con la domanda italiana vicina alla soglia. Senza dato italiano la domanda non rende incerto il dato.

## La verifica sui dati del 9 novembre 2026

La critica diceva che 7 competenze su 16 avevano 7 annunci italiani o meno, e che un quadrante italiano poteva dipendere da uno o due annunci. La prima metà era vera, la seconda no. In Italia ogni rilevazione conta circa 107-135mila annunci, quindi la soglia vale circa 37-51 annunci della competenza. Con 2-7 annunci una competenza sta a 0,1-0,5 ogni 10mila, molto sotto la soglia: uno o due annunci in più o in meno non la portano sopra.

Il rischio vero stava vicino alla soglia:

| Competenza | Annunci in Italia | Soglia in annunci | Quadrante in Italia | Con tutti i Paesi |
| --- | --- | --- | --- | --- |
| MCP | 44 | circa 37 | Impara ora | Impara ora |
| DB vettoriali | 43 | circa 40 | Da consolidare | Tieni d'occhio |
| Multimodali | 30 | circa 35 | Da provare | Impara ora |

Con la regola queste tre diventano incerte in Italia. Nessuna delle 7 con meno di 8 annunci lo diventa.

## Considered Options

- Un minimo di annunci sotto il quale il quadrante italiano non si mostra: toglierebbe proprio le competenze molto sotto la soglia, che sono i casi più sicuri, e lascerebbe solide quelle con 30-45 annunci, dove pochi annunci decidono il quadrante.
- Cambiare il quadrante o non confermarlo quando la domanda è vicina alla soglia: la regola dello slancio incerto non tocca il quadrante, e due regole diverse per la stessa parola confonderebbero chi legge.
- Un margine anche per la domanda di Tutti i Paesi: quel valore è la mediana tra 8 Paesi e non un conto di annunci, e la formula non vale.

## Consequences

- Il livello dell'80% è lo stesso dello slancio, così il sito ha un solo modo di dire «incerto».
- L'approssimazione normale di un conto è grossolana sotto i 10 annunci. Lì però la soglia è lontana molte volte il margine, e il risultato non cambia.
- Una competenza può essere incerta in Italia e solida con tutti i Paesi: la pagina deve dire a quale mercato si riferisce l'avviso.
- Lo storico mensile non registra l'incertezza: il percorso sul radar mostra solo i quadranti.
