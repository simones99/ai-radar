# I dati dei chip di ETO entrano con la loro licenza CC BY-NC

La mappa di GeopoliticAI mostra tre anelli dei chip: progettazione, fabbricazione e macchinari. L'unica fonte per Paese è il dataset di ETO, che ha licenza CC BY-NC 4.0 e non si scarica in automatico. Abbiamo deciso di tenerne una copia fissa nel repo, aggiornata a mano, anche se il repo è MIT: senza ETO i chip resterebbero fuori dalla mappa.

## Consequences

- Il file di ETO non è MIT. Accanto ci sta la sua licenza, e sotto la mappa c'è la dicitura di attribuzione con il divieto di uso commerciale.
- Chi riusa il repo per scopi commerciali deve togliere quel file, o chiedere il permesso a ETO.
- Una volta pubblicato, il file resta nella storia di git: tornare indietro non lo cancella.
- La lettura automatica dalla pipeline richiede il permesso di ETO, che per ora non si chiede.

## Considered Options

- Lasciare fuori i chip: la catena perde tre anelli su sei, proprio quelli in cui Taiwan, la Corea e i Paesi Bassi contano di più.
- Mostrare i dati di ETO senza tenerli nel repo: non regge, perché il sito si costruisce dal repo.
