# Le visite si contano con Umami Cloud, l'unico che riconosce chi torna senza cookie

Fino a novembre 2026 AI Radar non sapeva se qualcuno lo leggeva, e un lancio senza misura non avrebbe insegnato niente. Servivano tre misure da guardare ogni lunedì: le visite alla home, le visite alle pagine delle edizioni e delle competenze, e le visite di ritorno. Il 20 novembre 2026 abbiamo deciso di contare le visite con Umami Cloud, sul piano Hobby gratuito, con la regione dei dati UE. Dei tre servizi gratuiti confrontati è l'unico che dà le visite di ritorno senza cookie: GoatCounter dimentica un visitatore dopo 8 ore, Cloudflare Web Analytics non conta né i visitatori né i ritorni.

## Cosa si accetta

- **Un hash tenuto un mese.** Umami riconosce un visitatore con un hash di IP e browser, calcolato con un sale che cambia ogni mese. GoatCounter tiene il suo hash 8 ore, solo in memoria. È il prezzo della terza misura, e il motivo per cui una visita di ritorno vale solo dentro il mese di calendario.
- **Gli IP nei log.** Le statistiche non contengono l'indirizzo IP. Umami e i suoi fornitori però possono tenerlo nei log tecnici e di sicurezza, per un tempo che l'informativa non dice: rimanda all'accordo sul trattamento dei dati.
- **La regione UE vale per le statistiche.** Rete di distribuzione, sicurezza, assistenza e log possono passare da servizi fuori dall'UE.
- **Un servizio cloud che non è open source.** Non si vede come gira. Il codice di Umami però è MIT: se il cloud cambia condizioni, i dati si esportano e lo stesso Umami si può ospitare altrove.

## La riga in pagina

In fondo a ogni pagina che ha lo script c'è la riga: «Il sito conta le visite con Umami, senza cookie: le statistiche non contengono indirizzi IP e sono conservate in UE.», con «Umami» come link all'informativa.

La riga promette solo quello che Umami scrive di garantire. La prima versione diceva «nessun indirizzo IP salvato, dati in UE», e prometteva di più. L'[informativa di Umami](https://umami.is/privacy), aggiornata il 19 ottobre 2026, dice che gli IP possono restare nei log tecnici e di sicurezza. Le [FAQ di Umami Cloud](https://docs.umami.is/docs/cloud/faq) dicono che la regione vale per la conservazione delle statistiche, mentre rete di distribuzione, sicurezza, assistenza e log possono passare fuori. Il resto lo dice l'informativa, a cui la riga porta.

«Conservate in UE» vale perché l'autore ha scelto la regione UE all'iscrizione, e l'ha confermata il 20 novembre 2026. Se la regione cambia, cambia la riga. Se Umami cambia l'informativa, la riga va riletta.

## Il banner di consenso

Il sito non ha un banner di consenso: è una decisione dell'autore. Lo script di Umami non usa cookie, e il sito non ne usa altri né altri servizi che seguono chi legge. L'app tiene nel browser solo le scelte di chi legge (ruolo, mercato, settore, area), per ritrovarle alla visita dopo: non escono dal browser e non servono a contare. Umami non dice che il banner non serve: dice che dipende dagli altri servizi usati e dalle regole che si applicano. Se il sito aggiunge un servizio che usa cookie o segue chi legge, la decisione va rifatta.

## Consequences

- L'ID del sito Umami sta nella variabile del repository `UMAMI_WEBSITE_ID`, una variabile e non un secret, perché finisce comunque nell'HTML pubblico. Senza la variabile il sito esce senza script e senza riga: è lo stato delle build in locale e delle copie del progetto.
- Lo script conta solo sull'host dell'indirizzo base: le prove in locale, gli end-to-end e le copie pubblicate da altri non arrivano nelle statistiche.
- Il piano Hobby conta fino a 100.000 eventi al mese e conserva i dati 6 mesi. Cosa succede oltre il limite, le pagine di Umami non lo dicono in modo coerente. Con il traffico di oggi il limite è lontano, ma va controllato nel pannello di Umami, in *Settings → Usage*.
- I dati più vecchi di 6 mesi non si leggono più nel pannello: un confronto più lungo va annotato prima.
- Un ad-blocker può bloccare lo script: le misure contano meno visite di quelle vere.
- I numeri delle visite non si pubblicano, né nel sito né nel README, e il pannello non ha un link pubblico, finché l'autore non decide altrimenti.
- Se un giorno il sito avrà una Content Security Policy, dovrà permettere `cloud.umami.is`.

## Considered Options

- GoatCounter: il più rigoroso, con i server in UE e l'hash tenuto 8 ore. Ma chi torna dopo 8 ore è un visitatore nuovo, e la terza misura andrebbe sostituita con un'approssimazione, per esempio gli arrivi dal feed: direbbe chi segue il sito, non chi torna.
- Cloudflare Web Analytics: non conta né i visitatori unici né i ritorni, il codice è chiuso, e per un sito su GitHub Pages non c'è modo di escludere il traffico UE.
- Ospitare Umami da sé: servirebbero un server e un database sempre accesi, che GitHub non dà gratis.
