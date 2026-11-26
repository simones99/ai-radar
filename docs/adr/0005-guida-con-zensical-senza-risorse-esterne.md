# La guida sta su Zensical, vestita come l'app, senza risorse da altri siti

Fino a novembre 2026 tutto quello che serviva per leggere, pubblicare e mantenere AI Radar stava nel README, che era arrivato a quasi 300 righe. Il 26 novembre 2026 abbiamo deciso che il README dice solo cos'è il progetto, dove si vede e come si prova in locale, e che il resto sta in una guida pubblicata con l'app, in `/guida/`. La guida è costruita con Zensical dal file `mkdocs.yml`, ha il font, i colori e il tema scuro dell'app, e non carica niente da altri siti. Il tema l'abbiamo scelto su un prototipo con cinque varianti sulle stesse pagine, che sta nel ramo `prototipo-temi-guida`.

## Perché Zensical

Material for MkDocs è il tema più usato per MkDocs, ma arriva a fine vita il 5 maggio 2027: fino ad allora riceve solo correzioni critiche e di sicurezza, e lo dice a ogni build. Zensical è il suo successore, fatto dalla stessa squadra, e legge lo stesso `mkdocs.yml`: nel prototipo ha costruito le stesse pagine con lo stesso foglio di stile, con lo stesso aspetto. È giovane, alla versione 0.1.3, e per questo la versione è fissata in `requirements-guida.txt`.

## Niente da altri siti

- **I font stanno nella guida.** Con le impostazioni predefinite sia Material sia Zensical prendono i caratteri da Google Fonts, e il browser di chi legge manda il suo indirizzo IP a Google. La pagina Privacy del sito nomina solo Umami e GitHub Pages. La guida usa `font: false` e il Bricolage Grotesque dell'app, copiato in `guida/font/` con la sua licenza OFL.
- **Niente `repo_url`.** Con l'indirizzo del repository il tema chiede stelle e fork a `api.github.com` a ogni pagina aperta. Il link al codice sta in fondo alla pagina, come semplice link.
- **Niente contatore.** La guida non ha lo script di Umami: le tre misure del lunedì riguardano l'app, e la guida resta fuori dal conteggio.

Nel prototipo, aprendo la guida, tutte le richieste restavano sull'host del sito. Il tema tiene nel browser la scelta tra chiaro e scuro, come l'app tiene le scelte di chi legge: non esce dal browser.

## Consequences

- Chi cambia `mkdocs.yml` controlla che non entri una risorsa esterna: un font, un'icona da una CDN, `repo_url`, un plugin che chiama un servizio. Se entra, la pagina Privacy va aggiornata, e la decisione sul banner dell'ADR 0004 va rifatta se il servizio segue chi legge.
- La guida si costruisce dopo gli end-to-end, in `_site/guida/`: gli end-to-end rifanno `_site/` e la cancellerebbero. Una guida che non si costruisce ferma la pubblicazione, come un test che fallisce.
- I link dalla guida ai file del repository puntano a `github.com/simones99/ai-radar`, anche in una copia del progetto.
- Prima del 5 maggio 2027 non serve fare niente: la guida non dipende da Material. Se Zensical cambia formato di configurazione, la migrazione riguarda `mkdocs.yml` e il foglio di stile.

## Considered Options

- Material for MkDocs vestito come l'app: stesso aspetto, più collaudato, ma a fine vita fra cinque mesi.
- Material o Zensical con i loro colori e font: un aspetto da documentazione tecnica che non somiglia all'app, e font da Google Fonts.
- Il tema Read the Docs incluso in MkDocs: nessuna dipendenza in più e font inclusi, ma niente tema scuro e un aspetto lontano da quello dell'app.
- Tenere tutto nel README: è quello che il README non deve più fare.
