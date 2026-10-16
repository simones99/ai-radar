# AI Radar: home a due ingressi

Data: 16 ottobre 2026
Stato: in revisione

## 1. Contesto e obiettivo

AI Radar diventa un prodotto con due teste:

- **Su cosa formarti**, per le persone: il radar delle competenze e i temi che lo alimentano.
- **L'AI in Italia**, per le organizzazioni: imprese, persone, norme e rapporti, con l'Italia in primo piano.

Questo è il primo di quattro pezzi, da costruire in ordine, ognuno con la sua spec e il suo piano:

1. **Home a due ingressi** (questo documento): riordino della home e delle card attuali, senza fonti nuove.
2. **Radar 2.0**: metodo più solido, pagina per competenza con andamento e risorse per iniziare.
3. **Ruoli**: il radar pesato per ruolo (sviluppatore, PM, analista, legale).
4. **Osservatorio Italia**: fonti nuove (Istat, annunci italiani con le ricerche "IA" e "intelligenza artificiale", legge italiana sull'AI, norme armonizzate).

Obiettivo di questo pezzo: chi apre la home vede subito le due teste, ognuna con la sua notizia della settimana, e con un clic arriva alla prova di quella notizia.

Criteri di successo:

- sopra la piega, a 1280 px di larghezza, si vedono le due porte con le loro notizie;
- ogni porta con una notizia apre la card da cui la notizia viene, già sull'elemento giusto;
- le card della testa "L'AI in Italia" mostrano un numero italiano quando la fonte lo ha;
- la pagina funziona a 320 px, da tastiera e con il tema scuro, come oggi.

## 2. Fuori dal perimetro

- Fonti nuove: Istat, legge italiana sull'AI, norme armonizzate, annunci italiani con "IA".
- Cambi alla pipeline Python: tutto ciò che serve è già nei JSON.
- Radar 2.0 e Ruoli.
- Un titolo generale della settimana sopra le porte: si è scelto di non averlo.

## 3. Decisioni prese

| Tema | Decisione |
| --- | --- |
| Pubblico | Il radar per le persone, l'osservatorio per le organizzazioni |
| Architettura | Un sito, home a due ingressi, le 8 card divise 4 e 4 |
| Sopra le porte | Nessun titolo della settimana: data, una riga che spiega il sito, poi le porte |
| Notizia delle porte | Regole a priorità, scritte dai dati senza LLM (sezione 5) |
| Clic sulla porta | Apre la card da cui viene la notizia, sull'elemento giusto |
| Card della testa Italia | Prima l'Italia, il confronto con UE o mondo nella frase |
| Numeri | Interi su card e porte, esatti nelle tabelle |
| Politica | Si chiama Norme; i vecchi link `#politica` continuano a funzionare |
| Pillole | Due gruppi, ciascuno con il nome della sua testa |
| Dove sta la logica | Nell'app, in `web/src/lib/text/frasi.ts`, come le altre frasi |

## 4. La pagina

Dall'alto in basso:

1. Barra con logo e link a "Foto e fonti" e "Stato delle fonti", come oggi.
2. Data: "Settimana del 16 ott 2026".
3. `h1` con la riga che spiega il sito: "Su cosa formarti e cosa succede all'AI in Italia, con dati aperti aggiornati ogni lunedì." In stile testo grande, non titolo enorme: le porte sono il titolo visivo.
4. Le due porte affiancate, stessa larghezza e stessa altezza. Sotto 720 px vanno una sotto l'altra, prima "Per te".
5. Sezione "Su cosa formarti", titolo `h2`, 4 card in questo ordine: Competenze, Modelli e ricerca, Open source, Notizie.
6. Sezione "L'AI in Italia", titolo `h2`, 4 card in questo ordine: Business, Persone e lavoro, Norme, Rapporti.
7. Foto e fonti, stato delle fonti: come oggi.

Ogni porta contiene:

- un'etichetta piccola: "Per te" oppure "Per la tua organizzazione";
- il nome della testa: "Su cosa formarti" oppure "L'AI in Italia";
- la notizia, in grande, con la parte importante in evidenza (stesso sistema `TitleParts` dei titoli delle card);
- una riga con fonte e data del dato, per esempio "Radar delle competenze · dati al 15 ott 2026".

La porta è un unico elemento cliccabile (`<a>` con l'hash della card), con il focus visibile come le card.

Il link "Vai ai temi" in cima resta e porta alla sezione "Su cosa formarti".

Una card aperta si apre, come oggi, a tutta larghezza al posto della griglia. Le pillole delle altre card stanno in due gruppi: "Su cosa formarti" con le sue card, poi "L'AI in Italia" con le sue. La card aperta non compare tra le pillole.

## 5. Le regole delle porte

Due funzioni pure in `frasi.ts`:

```ts
export interface Door {
  title: TitleParts;            // vuoto se non ci sono dati
  meta: string;                 // fonte e data del dato
  target: { tema: TileId; elemento: string | null } | null;  // null: porta non cliccabile
}
export function doorPerTe(d: Dataset, today: Date): Door;
export function doorItalia(d: Dataset, today: Date): Door;
```

Vince la prima regola che trova qualcosa.

### Porta "Per te · Su cosa formarti" (da `radar.json`)

1. Una o più competenze entrano o escono da "Impara ora" (`radarChanges`). Titolo: "**MCP** entra tra le competenze da imparare ora"; con più nomi "**MCP** e **RAG** entrano…"; se ci sono anche uscite: "…; **LLMOps** esce". Target: Competenze, elemento = la prima competenza che entra (o esce, se nessuna entra).
2. Altri cambi di quadrante. Titolo: "**MCP** e **Multimodali** passano a Da provare" se il quadrante d'arrivo è lo stesso; altrimenti "**MCP** passa a Da provare" per la competenza con lo spostamento più grande. Target: quella competenza.
3. Lo spostamento più grande, se è di almeno `MOVE_MIN` (10 punti) su slancio o domanda. Titolo: "**DB vettoriali** perde 33 punti di slancio" oppure "guadagna". Target: quella competenza.
4. Riserva: "**3 competenze su 16** da imparare ora". Target: Competenze, senza elemento.

Riga meta: "Radar delle competenze · dati al {data di radar.generato}".
Senza radar: titolo vuoto, meta "Dati non ancora disponibili", target `null`.

### Porta "Per la tua organizzazione · L'AI in Italia"

1. Una scadenza di `ai_act.scadenze` tra oggi e 30 giorni. Titolo: "**Tra 12 giorni**: {titolo della scadenza, iniziale minuscola}" ("**Domani**" a 1 giorno, "**Oggi**" a 0). Target: Norme, elemento = data della scadenza (`2026-12-02`). Meta: "AI Act · scadenza del {data}".
2. Un dato italiano uscito negli ultimi 30 giorni. Si guardano, in quest'ordine:
   - Eurostat: `aggiornato_eurostat` negli ultimi 30 giorni e valore `IT` presente. Titolo: "**16% delle imprese italiane** usa l'AI (UE: 20%)". Target: Business. Meta: "Eurostat · aggiornato il {data}".
   - OWID `uso_genai`: `aggiornato_owid` negli ultimi 30 giorni e punto `Italy` presente. Titolo: "**30% degli italiani** usa l'AI generativa (mondo: 18%)". Target: Persone e lavoro. Meta: "Microsoft via Our World in Data · aggiornato il {data}".
3. Un rapporto previsto entro 30 giorni (`nextReport`). Titolo: "A {mese} esce **{nome del rapporto}**". Target: Rapporti, elemento = `slug(nome)`. Meta: "Data stimata, dai rapporti degli anni scorsi".
4. Riserva: la prossima scadenza, anche lontana. Titolo: "**47 giorni** alla prossima scadenza dell'AI Act". Target: Norme, elemento = data della scadenza. Meta: "AI Act · {titolo della scadenza}".

Senza scadenze, dati e rapporti: titolo vuoto, meta "Dati non ancora disponibili", target `null`.

Le regole Italia useranno, quando arriverà l'Osservatorio, anche le scadenze della legge italiana e gli annunci con "IA": entreranno come regole nuove in questa lista, non come una porta diversa.

## 6. Card con l'Italia in primo piano

| Card | Numero (faccia) | Frase (faccia) | Titolo (aperta) |
| --- | --- | --- | --- |
| Business | Italia, Eurostat, ultimo anno: "16 %" | "Imprese italiane che usano l'AI nel 2025. UE: 20%." | "**16%** delle imprese italiane usa l'AI" + deck con UE e anno precedente |
| Persone e lavoro | Italia, OWID `uso_genai`: "30 %" | "Italiani che usano l'AI generativa. Mondo: 18%." | "Usa l'AI generativa il **30%** degli italiani" + deck con mondo e data |

Se la fonte non ha l'Italia, la card mostra il dato UE (Business) o mondiale (Persone) e la frase lo dice: "Imprese dell'UE che usano l'AI nel 2025; manca il dato italiano."

Numeri interi su porte e facce delle card, arrotondati all'unità (`nf(v, 0)`). Le tabelle "Vedi i dati" restano con i valori esatti (`exact`). Le serie CC BY-ND dell'AI Index restano come pubblicate nelle tabelle; nei grafici e nei titoli valgono le forme brevi già in uso.

Le altre card non cambiano: Competenze, Modelli, Open source, Notizie, Rapporti. Norme cambia solo nome e id.

## 7. Norme e link diretti

- `TEMI` in `router.ts`: `politica` diventa `norme`. `parseHash` accetta `politica` come alias e lo traduce in `norme`, con l'eventuale elemento.
- `PoliticaDetail.svelte` diventa `NormeDetail.svelte`; `facePolitica`/`headPolitica` diventano `faceNorme`/`headNorme`. La foto resta `politica.jpg`, con lo stesso credito.
- `NormeDetail` usa `elemento` come in Competenze: se è la data di una scadenza, quella scadenza è evidenziata nella linea del tempo e nella tabella.
- `RapportiDetail` usa `elemento`: se è lo slug del nome di un rapporto, quella riga è evidenziata.
- `TILES` in `registry.ts` prende un campo `testa: 'per-te' | 'italia'`; la griglia e le pillole raggruppano per testa, nell'ordine della sezione 4.

## 8. Test

Unità (vitest):

- `doorPerTe`: un caso per ognuna delle 4 regole, più il caso senza radar.
- `doorItalia`: un caso per ognuna delle 4 regole, compresi "Oggi" e "Domani", il caso Eurostat senza `IT`, il caso senza dati.
- Card Business e Persone: Italia presente, Italia assente.
- `parseHash('#politica')` e `parseHash('#politica/2026-12-02')` aprono Norme.
- Griglia: due sezioni con 4 card ciascuna, nell'ordine giusto; pillole in due gruppi.
- Norme e Rapporti evidenziano l'elemento del link diretto.
- I test esistenti su `heroThesis` si tolgono con la funzione.

End-to-end (Playwright):

- home: due porte, due `h2` di sezione, 8 card;
- clic sulla porta "Per te": si apre Competenze con l'elemento evidenziato;
- clic sulla porta "L'AI in Italia" con i dati di prova: si apre Norme sulla scadenza;
- `#politica` apre Norme;
- accessibilità senza violazioni gravi; nessuno scorrimento orizzontale a 320 e 360 px; tema scuro.

## 9. Rischi

- **Porte vuote o ferme.** La porta Italia oggi ha poche notizie vere: spesso vincerà la riserva (giorni alla prossima scadenza). È accettato: migliora con l'Osservatorio.
- **Date di aggiornamento delle fonti.** `aggiornato_owid` e `aggiornato_eurostat` dicono quando la fonte ha aggiornato la serie, non quando è uscito un dato italiano nuovo. Un aggiornamento che corregge solo altri Paesi farebbe vincere la regola 2 senza un dato italiano nuovo. Si accetta per ora; se diventa un problema, la pipeline potrà salvare la data in cui ha visto per la prima volta l'ultimo valore italiano.
- **Link vecchi.** `#politica` resta valido grazie all'alias; nessun altro id cambia.
