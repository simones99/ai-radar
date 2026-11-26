# Le visite si contano con Umami Cloud, l'unico che riconosce chi torna senza cookie

Fino a novembre 2026 AI Radar non sapeva se qualcuno lo leggeva, e un lancio senza misura non avrebbe insegnato niente. Servivano tre misure da guardare ogni lunedì: le visite alla home, le visite alle pagine delle edizioni e delle competenze, e le visite di ritorno. Il 20 novembre 2026 abbiamo deciso di contare le visite con Umami Cloud, sul piano Hobby gratuito, con la regione dei dati UE. Dei tre servizi gratuiti confrontati è l'unico che dà le visite di ritorno senza cookie: GoatCounter dimentica un visitatore dopo 8 ore, Cloudflare Web Analytics non conta né i visitatori né i ritorni.

## Cosa si accetta

- **Un hash tenuto un mese.** Umami riconosce un visitatore con un hash di IP e browser, calcolato con un sale che cambia ogni mese. GoatCounter tiene il suo hash 8 ore, solo in memoria. È il prezzo della terza misura, e il motivo per cui una visita di ritorno vale solo dentro il mese di calendario.
- **Gli IP nei log.** Le statistiche non contengono l'indirizzo IP. Umami e i suoi fornitori però possono tenerlo nei log tecnici e di sicurezza, per un tempo che l'informativa non dice: rimanda all'accordo sul trattamento dei dati.
- **La regione UE vale per le statistiche.** Rete di distribuzione, sicurezza, assistenza e log possono passare da servizi fuori dall'UE.
- **Un servizio cloud che non è open source.** Non si vede come gira. Il codice di Umami però è MIT: se il cloud cambia condizioni, i dati si esportano e lo stesso Umami si può ospitare altrove.

## La riga in pagina

In fondo a ogni pagina che ha lo script c'è la riga: «Il sito conta le visite con Umami, senza cookie: le statistiche non contengono indirizzi IP e sono conservate in UE. Privacy», con «Privacy» come link alla pagina Privacy del sito, nella stessa scheda. Fino al 20 novembre 2026 il link era «Umami», e portava all'informativa di Umami.

La riga promette solo quello che Umami scrive di garantire. La prima versione diceva «nessun indirizzo IP salvato, dati in UE», e prometteva di più. L'[informativa di Umami](https://umami.is/privacy), aggiornata il 19 ottobre 2026, dice che gli IP possono restare nei log tecnici e di sicurezza. Le [FAQ di Umami Cloud](https://docs.umami.is/docs/cloud/faq) dicono che la regione vale per la conservazione delle statistiche, mentre rete di distribuzione, sicurezza, assistenza e log possono passare fuori. Il resto lo dice la pagina Privacy, a cui la riga porta, con i link all'informativa di Umami.

«Conservate in UE» vale perché l'autore ha scelto la regione UE all'iscrizione, e l'ha confermata il 20 novembre 2026. Se la regione cambia, cambiano la riga e la pagina Privacy. Se Umami cambia l'informativa, vanno rilette tutte e due.

## Il banner di consenso

Il 20 novembre 2026 l'autore ha deciso di non mettere un banner di consenso. Il contatore non usa cookie e non scrive niente nel browser, e il sito non usa altri cookie né altri servizi che seguono chi legge. I numeri si guardano solo tutti insieme, e non si incrociano con altri dati. Il conteggio si basa sul legittimo interesse del titolare a capire se e come il sito viene letto (art. 6, par. 1, lett. f del GDPR), con dati ridotti al minimo. Il sito tiene nel browser solo le scelte di chi legge, per ritrovarle alla visita dopo: nell'app ruolo, mercato, settore e area, e dal 26 novembre 2026 nella guida il tema chiaro o scuro (ADR 0005). Non escono dal browser e non servono a contare. Umami non dice che il banner non serve: dice che dipende dagli altri servizi usati e dalle regole che si applicano. Se il sito aggiunge un servizio che usa cookie o segue chi legge, la decisione va rifatta.

Le informazioni stanno nella pagina Privacy del sito, in `privacy/`: chi è il titolare e come si contatta, cosa si raccoglie e perché, la base giuridica, per quanto tempo, chi tratta i dati per conto del titolare, chi ospita il sito, cosa resta nel browser, i diritti e il reclamo al Garante. Il titolare si contatta solo dal profilo GitHub, senza nomi di persona. Il testo sta in un modulo solo, `web/src/lib/text/privacy.ts`. La pagina c'è se e solo se c'è il contatore: una copia senza contatore non la pubblica.

La pagina dice solo quello che le fonti confermano, lette il 20 novembre 2026. Cosa manda lo script a ogni pagina aperta (indirizzo, titolo, pagina di provenienza, lingua, dimensione dello schermo) lo dicono le [funzioni del tracker](https://docs.umami.is/docs/tracker-functions). Browser, sistema operativo e dispositivo ricavati dalla richiesta, la posizione approssimativa ricavata dall'IP, e il codice del visitatore come hash di IP e browser con un sale che cambia ogni mese, senza cookie, lo dicono le [definizioni delle metriche](https://docs.umami.is/docs/metric-definitions). Umami Software, Inc., con sede a San Francisco, tratta i dati per conto di chi usa Umami Cloud secondo l'[accordo sul trattamento dei dati](https://umami.is/dpa), aggiornato il 2 agosto 2026: vale da solo, con l'uso del servizio, senza una firma a parte; comprende le clausole contrattuali tipo dell'UE per i trasferimenti fuori dall'UE; e lascia al cliente le informazioni e la base giuridica, che per questo stanno nella pagina Privacy. L'accordo elenca anche i tipi di dati, gli stessi della documentazione, più la data e l'ora della visita; eventi personalizzati, heatmap e replay il sito non li usa, e la pagina non li nomina. I fornitori di Umami sono nell'[elenco dei sub-responsabili](https://umami.is/subprocessors). Che GitHub registri l'IP di chi visita un sito su GitHub Pages, per sicurezza, lo dice la [documentazione di GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages#data-collection): la pagina non dà a GitHub un ruolo nel GDPR.

## Consequences

- L'ID del sito Umami sta nella variabile del repository `UMAMI_WEBSITE_ID`, una variabile e non un secret, perché finisce comunque nell'HTML pubblico. Senza la variabile il sito esce senza script, senza riga e senza pagina Privacy: è lo stato delle build in locale e delle copie del progetto. Una copia che accende il proprio contatore cambia il titolare nella pagina Privacy.
- Lo script conta solo sull'host dell'indirizzo base: le prove in locale, gli end-to-end e le copie pubblicate da altri non arrivano nelle statistiche.
- Il piano Hobby conta fino a 100.000 eventi al mese e conserva i dati 6 mesi. Cosa succede oltre il limite, le pagine di Umami non lo dicono in modo coerente. Con il traffico di oggi il limite è lontano, ma va controllato nel pannello di Umami, in *Settings → Usage*.
- I dati più vecchi di 6 mesi non si leggono più nel pannello: un confronto più lungo va annotato prima.
- Un ad-blocker può bloccare lo script: le misure contano meno visite di quelle vere.
- I numeri delle visite non si pubblicano, né nel sito né nella guida né nel README, e il pannello non ha un link pubblico, finché l'autore non decide altrimenti.
- Se un giorno il sito avrà una Content Security Policy, dovrà permettere `cloud.umami.is`.

## Considered Options

- GoatCounter: il più rigoroso, con i server in UE e l'hash tenuto 8 ore. Ma chi torna dopo 8 ore è un visitatore nuovo, e la terza misura andrebbe sostituita con un'approssimazione, per esempio gli arrivi dal feed: direbbe chi segue il sito, non chi torna.
- Cloudflare Web Analytics: non conta né i visitatori unici né i ritorni, e il codice è chiuso. Escludere i visitatori dall'UE si può solo per un sito che passa dal proxy di Cloudflare, dove Cloudflare mette lo script da sé: l'opzione è «Enable, excluding visitor data in the EU» della configurazione automatica. Un sito su `github.io` non passa da Cloudflare, e lo script va messo a mano nelle pagine, dove quell'opzione la [guida di Web Analytics](https://developers.cloudflare.com/web-analytics/get-started/) non la offre (letta il 20 novembre 2026).
- Ospitare Umami da sé: servirebbero un server e un database sempre accesi, che GitHub non dà gratis.
