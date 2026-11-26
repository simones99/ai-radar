# Le visite

Il sito conta le visite con [Umami Cloud](https://umami.is), sul piano Hobby gratuito, con la regione dei dati UE. Il contatore non usa cookie, e le statistiche non contengono indirizzi IP. Lo script sta in ogni pagina HTML del sito, tranne questa guida: l'app, la home in chiaro, le edizioni con l'archivio, le pagine delle competenze con l'indice, la pagina Privacy. In fondo a ognuna una riga dice a chi legge che il sito conta le visite, e il suo link «Privacy» porta alla pagina Privacy del sito, in `privacy/`. La pagina dice chi è il titolare e come si contatta, cosa si raccoglie e perché, la base giuridica, per quanto tempo, chi tratta i dati per conto del titolare, e i diritti di chi legge. Il sito non ha un banner di consenso: il contatore non usa cookie e non scrive niente nel browser. Il testo della pagina sta in [`web/src/lib/text/privacy.ts`](https://github.com/simones99/ai-radar/blob/main/web/src/lib/text/privacy.ts). Perché Umami, e cosa si accetta in privacy, è in [ADR 0004](https://github.com/simones99/ai-radar/blob/main/docs/adr/0004-visite-contate-con-umami-cloud.md).

Questa guida non ha il contatore. Font, icone e ricerca stanno nella guida stessa, e nei browser di oggi non carica niente da altri siti. Solo un browser troppo vecchio per avere `ResizeObserver` (Chrome prima del 2018, Firefox prima del 2019, Safari prima del 2020) scarica da `unpkg.com` il pezzo che gli manca. Nel browser la guida tiene soltanto la scelta tra tema chiaro e scuro (vedi [ADR 0005](https://github.com/simones99/ai-radar/blob/main/docs/adr/0005-guida-con-zensical-senza-risorse-esterne.md)).

I numeri delle visite non si pubblicano, né nel sito né nella guida, e il pannello di Umami non ha un link pubblico.

## L'ID del sito

Sta nella variabile del repository `UMAMI_WEBSITE_ID`, in *Settings → Secrets and variables → Actions → Variables*. È una variabile e non un secret, perché finisce comunque nell'HTML pubblico. Il workflow *Aggiorna e pubblica* la passa alla build come `AI_RADAR_UMAMI_ID`.

- Per cambiare l'ID si cambia il valore della variabile. Per togliere il contatore si cancella la variabile: il sito esce senza script, senza riga e senza pagina Privacy. In tutti e due i casi il cambio vale dalla pubblicazione successiva, con un push o un avvio manuale.
- Un valore che non è un UUID ferma la build con un messaggio che nomina la variabile, e resta pubblicato il sito di prima.
- In locale la build ha il contatore solo con `AI_RADAR_UMAMI_ID` impostata. Anche così lo script conta solo sull'host dell'indirizzo base, quindi le prove in locale e gli end-to-end non mandano niente a Umami.

## Le proprie visite

Per non contarle, apri il sito pubblicato, poi la console del browser, e scrivi `localStorage.setItem('umami.disabled', 1)`. Va fatto su ogni browser e su ogni dispositivo. Per tornare a contarle: `localStorage.removeItem('umami.disabled')`.

## In una copia del progetto

Senza la variabile `UMAMI_WEBSITE_ID` il contatore resta spento: nessuno script, nessuna riga, nessuna pagina Privacy, niente arriva a Umami. Per accenderne uno tuo:

1. apri un account su [Umami Cloud](https://cloud.umami.is) e aggiungi un sito con il dominio della tua copia, per esempio `<tuo-utente>.github.io`;
2. copia il suo ID, il valore di `data-website-id` nel codice di tracciamento, nella variabile del repository `UMAMI_WEBSITE_ID`;
3. in [`web/src/lib/text/privacy.ts`](https://github.com/simones99/ai-radar/blob/main/web/src/lib/text/privacy.ts) cambia il titolare, `TITOLARE`: il titolare del trattamento sei tu, e la pagina Privacy deve portare al tuo contatto e al tuo repository, non a quelli di AI Radar. Rileggi il resto della pagina, e cambia la data dell'aggiornamento;
4. ripubblica il sito, con un push o un avvio manuale.

Lo script conta solo sull'host del tuo indirizzo base. La riga in pagina e la pagina Privacy dicono che le statistiche sono conservate in UE, per 6 mesi: se scegli un'altra regione, un altro piano o un altro servizio, vanno cambiate.

## Le tre misure del lunedì

Ogni lunedì, nel pannello di Umami, sulla settimana da lunedì a domenica appena finita:

1. **le visite alla home**: le visite della pagina `/ai-radar/`;
2. **le visite alle edizioni e alle competenze**: le visite delle pagine sotto `/ai-radar/edizioni/` e, a parte, di quelle sotto `/ai-radar/competenze/`;
3. **le visite di ritorno**: nel report *Retention*, chi era già passato in un'altra settimana dello stesso mese.

Il ritorno vale solo dentro il mese di calendario: Umami riconosce un visitatore con un sale che cambia ogni mese, quindi a inizio mese chi torna conta come nuovo e i ritorni ripartono da zero.

Le soglie delle tre misure si fissano dopo quattro settimane piene di dati, non prima. La prima settimana dopo l'accensione è parziale: le quattro settimane partono dal primo lunedì pieno.

Il piano Hobby conta fino a 100.000 eventi al mese e conserva i dati 6 mesi. L'uso si controlla nel pannello di Umami, in *Settings → Usage*.
