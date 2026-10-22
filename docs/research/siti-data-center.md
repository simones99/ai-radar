# Siti dei data center

Ricerca per il ticket wayfinder «10: Siti dei data center» (GeopoliticAI). Domanda: il dataset di Epoch AI sui data center dà la posizione di ogni sito, per un livello «Siti» sulla mappa (un punto per data center, con un fumetto)? Fonti consultate e file scaricati il 22 ottobre 2026, tra le 15:29 e le 15:36 UTC.

## Sintesi

1. **Coordinate.** Sì, ma **non nei file scaricabili**.
   - Il CSV e lo ZIP di *AI data centers* hanno solo `Country` e `Address` (indirizzo in testo, pieno per 81 siti su 95). Non hanno latitudine e longitudine.
   - Le coordinate stanno nella **pagina della mappa** (https://epoch.ai/data/ai-data-centers/map), dentro i dati della pagina: campo `lngLat` per **tutti i 95 siti**.
   - `lngLat` è il centro del riquadro (`bounds`) che contiene gli edifici disegnati da Epoch sulle immagini satellitari. Il riquadro è largo in mediana 0,8 km (da 0,16 a 7,9 km). La precisione è quindi quella del sito, molto più del necessario per una mappa del mondo.
   - Sono gli stessi 95 siti del CSV, quelli su cui Epoch stima la copertura del 44%. I nomi coincidono tutti (`id` della mappa = `Name` del CSV).
2. **Campi per il fumetto.** Ci sono quasi tutti.
   - Dal CSV: nome (`Name`), proprietario dei chip (`Owner`, non il proprietario dell'edificio), utenti (`Users`), Paese (`Country`), H100 equivalenti e MW attuali (`Current H100 equivalents`, `Current power (MW)`).
   - Lo **stato** non è una colonna, ma si ricava: H100 equivalenti attuali > 0 vuol dire operativo. Coincide al 100% con il campo `operational` della mappa (74 operativi, 21 in costruzione).
   - Gli **H100 equivalenti previsti** vengono dalla cronologia (`data_center_timelines.csv`): 54 siti hanno righe con date future, fino al 2030.
   - Una **data di aggiornamento per sito** non c'è. Si può usare l'ultima data della cronologia non futura (tra il 16/11/2025 e il 19/10/2026), oppure la data globale «Updated Oct. 20, 2026».
3. **Licenza.** CC BY 4.0. L'avviso dice «Epoch's data is free to use, distribute, and reproduce provided the source and authors are credited». Non ho trovato termini d'uso del sito, né divieti di scaricamento automatico o di dashboard pubblica.
   - Le coordinate sono dati di Epoch (disegnate da loro), quindi le considero coperte. Epoch però non lo scrive in modo esplicito per la pagina della mappa.
   - **Escluse di fatto le immagini satellitari**: portano il copyright di terzi («Image © 2026 Vantor», «© Airbus DS 2026», Vexcel, Siwei, Pléiades Neo). La CC BY copre solo ciò che Epoch ha il diritto di licenziare. Il livello «Siti» non deve usarle.
   - L'attribuzione chiede nome dell'autore, rimando alla licenza, link alla fonte e l'indicazione delle modifiche.
4. **Accesso.** Tutto pubblico, senza chiave.
   - CSV e ZIP hanno URL stabili e documentati, aggiornati spesso: il registro delle modifiche ha voci quasi ogni settimana (sette solo in ottobre 2026).
   - Le coordinate invece richiedono di leggere l'HTML della mappa (3,1 MB) e di decodificare il formato interno di Astro. Non è un formato documentato e può cambiare senza preavviso.
   - `pipeline/epoch.py` scarica già CSV di Epoch con `http_get`: la pipeline può farlo da sola, con una richiesta in più e un parser più fragile.
5. **Italia ed Europa.** **Nessun sito italiano.** Leonardo (CINECA) ed Eni HPC6 non ci sono: stanno solo nel vecchio *GPU clusters*.
   - UE: 3 siti. Nebius Mäntsälä (Finlandia), Start Campus Sines (Portogallo), EcoDataCenter 2 a Borlänge (Svezia, per Mistral AI, ancora in costruzione).
   - Europa fuori UE: 4 siti. Google Waltham Cross (Regno Unito), CoreWeave e Microsoft Narvik (Norvegia), Nscale Keflavík (Islanda).
6. ***GPU clusters*.** Ha le colonne `latitude` e `longitude`, nel CSV stesso, con licenza CC BY 4.0. Ma è un'altra cosa.
   - 447 cluster su 482 hanno coordinate. Per 277 sono il **centro del Paese** (tutti i 188 cluster cinesi, anonimi, sullo stesso punto). Solo 101 hanno un indirizzo vero.
   - L'Italia ha 9 cluster su 6 punti. Leonardo (Bologna, via Gobetti) ed Eni HPC6 (Ferrera Erbognone) hanno l'indirizzo. Eni HPC2 sta sul centro dell'Italia.
   - È fermo al 13/03/2026, conta cluster e non siti, e copre il 10-20% del calcolo. Non va mescolato ai punti di *AI data centers*.

**Verdetto: sì, con condizioni.** Il livello «Siti» si può fare con Epoch *AI data centers*:

- **Dati del fumetto:** `https://epoch.ai/data/data_centers/data_centers.csv` (oppure lo ZIP), colonne `Name`, `Owner`, `Users`, `Country`, `Current H100 equivalents`, `Current power (MW)`. Per i previsti, `data_center_timelines.csv`, colonne `Data center`, `Date`, `H100 equivalents`.
- **Coordinate:** `https://epoch.ai/data/ai-data-centers/map`, l'elemento `<astro-island>` del componente `SearchFilterMap`, attributo `props`, lista `dataCenters`, campi `id` e `lngLat` (`[longitudine, latitudine]`). Unione su `id` = `Name`.
- **Condizioni:**
  - le coordinate vanno salvate nel repo come cache, e il livello deve reggere se il parser della mappa si rompe (si tengono le ultime coordinate buone, i siti nuovi restano fuori finché non si risolve);
  - conviene chiedere a Epoch (data@epoch.ai) di rimettere latitudine e longitudine nel CSV: a novembre 2025 c'erano;
  - nessuna immagine satellitare;
  - in Italia il livello non mostra nessun punto, e la card lo deve dire.
- **Attribuzione** (sotto la mappa o nel fumetto): «Siti dei data center: Epoch AI, *AI data centers* (https://epoch.ai/data/ai-data-centers), licenza CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Posizioni ricavate dalla mappa di Epoch, dati rielaborati da AI Radar.»

## 1. Coordinate

### Cosa c'è nei file scaricabili

- Lo ZIP `https://epoch.ai/data/data_centers/data_centers.zip` (117.730 byte, file interni datati 22/10/2026 15:15) contiene `README.md`, `data_centers.csv`, `data_center_timelines.csv`, `data_center_chip_quantities.csv`, `data_center_chillers.csv`, `data_center_cooling_towers.csv` e `chip_types.csv`. Il `data_centers.csv` scaricato da solo è identico a quello dello ZIP.
- `data_centers.csv` ha 95 righe e 16 colonne: `Name, Current H100 equivalents, Current power (MW), Current total capital cost (2025 USD billions), Owner, Users, Selected Sources, Calculations sheet, Project, Current chip types, All chip types, Investors, Construction companies, Energy companies, Country, Address`.
- **Nessuna colonna di latitudine o longitudine**, in nessun file dello ZIP.
- La pagina dei campi (`/data/data-centers-documentation/records`) descrive `Address` come «Street address, based on public records», con copertura «85%, 81 out of 95 records». Alcuni indirizzi sono vaghi: «Bayin, Ulanqab, China», «Wuhu, China». Per 14 siti è vuoto, tra cui Nebius Mäntsälä e Oracle Batam.
- **Prima c'erano.** Una copia dell'Internet Archive del 05/11/2025 del vecchio file `https://epoch.ai/data/generated/data_centers/data_centers.csv` (13 siti) ha le colonne `Latitude` e `Longitude`, in gradi e primi (per esempio `32°35'25"N`, `90°05'35"W`). Quel URL oggi risponde 404, e il CSV attuale non le ha più.

### Dove sono: la pagina della mappa

- La pagina `https://epoch.ai/data/ai-data-centers/map` è generata con Astro. I dati della mappa sono nell'attributo `props` dell'elemento `<astro-island>` con `component-url="/_astro/SearchFilterMap.DHgsDD6V.js"` (il suffisso cambia a ogni versione del sito).
- Il contenuto è JSON con le entità HTML e una codifica di Astro: ogni valore è una coppia `[tipo, valore]`, con `0` per i valori semplici e gli oggetti e `1` per le liste.
- Decodificato, `dataCenters` ha **95 siti**. Ogni sito ha `id`, `timeline`, `facts`, `geoJsonFile`, `img`, `lngLat`, `bounds` e `shapes`.
  - `lngLat`: `[longitudine, latitudine]` in gradi decimali. C'è per tutti i 95 siti.
  - `bounds`: il riquadro `[ovest, sud, est, nord]`. In tutti i 95 casi `lngLat` è esattamente il suo centro.
  - `shapes`: i poligoni disegnati sugli edifici, con `type` («Building», «Cooling», «Power substation», «Backup generator») e `complete`. Manca solo per OpenAI Stargate New Mexico, che ha comunque `lngLat` e un riquadro largo circa 7 km.
  - `facts`: `operational`, `city`, `state`, `country`, `owner`, `users`, `project`, `sources`, `estimationMethods`, `additionalInformation`, `calculationsSheet`.
- **Precisione.** I numeri hanno fino a 18 decimali perché sono calcolati, ma la posizione vera è quella del sito. Larghezza del riquadro, est-ovest: minimo 0,16 km, mediana 0,76 km, massimo 7,86 km (Huawei Wuhu). Qualche controllo:
  - OpenAI Stargate Abilene, «5502 Spinks Rd, Abilene, TX»: `[-99.78561, 32.50131]`;
  - Google Waltham Cross, «Great Cambridge Road, Cheshunt»: `[-0.04904, 51.69543]`;
  - Start Campus Sines: `[-8.81272, 37.93497]`.
- Gli stessi poligoni si scaricano anche come GeoJSON, sito per sito, da `https://epoch.ai/data/data_centers/annotations/<nome>.geojson` (il nome viene da `geoJsonFile`). Ho scaricato tutti i 94 file indicati: tutti con risposta 200, tipo `application/geo+json`. Questo indirizzo però **non è documentato né linkato**: l'ho ricavato dal percorso interno. Non lo raccomando come fonte principale.

### Copertura

- I 95 siti della mappa sono esattamente i 95 del CSV: confronto `id` contro `Name`, nessuno in più o in meno.
- La copertura del 44% è dichiarata per tutto il database: «we estimate this database's coverage of global deployed AI computing capacity to be 44% as of October 22, 2026 (90% CI: 30% to 78%)» (`/data/data-centers-documentation/methodology`). Conta il calcolo installato, quindi i 74 siti operativi. I 21 in costruzione oggi valgono zero.
- Somma degli H100 equivalenti attuali nel CSV: 14.752.152.

## 2. Campi per il fumetto

| Dato del fumetto | Dove | Note |
|---|---|---|
| Nome | `data_centers.csv`, `Name` | 95 su 95 |
| Proprietario | `Owner` | 85 su 95. È «who owns the AI hardware in the data center. This is not necessarily the owner or operator of the facility». Ha l'etichetta di confidenza `#confident`, `#likely` o `#speculative`, da togliere e tradurre. |
| Utenti | `Users` | 70 su 95, con la stessa etichetta. Per esempio Microsoft è «#speculative» a Mäntsälä. |
| Paese | `Country` | 95 su 95. Città e regione solo nella mappa (`facts.city`, `facts.state`). |
| H100 equivalenti attuali | `Current H100 equivalents` | 95 su 95, «as of the current date» |
| MW attuali | `Current power (MW)` | 95 su 95, potenza IT |
| Stato | ricavato: `Current H100 equivalents` > 0 | 74 operativi e 21 in costruzione. Coincide con `facts.operational` della mappa in 95 casi su 95. |
| H100 equivalenti previsti | `data_center_timelines.csv`: `H100 equivalents` sulla riga con `Date` futura più lontana | 54 siti hanno righe future; la data più lontana è 01/01/2030. Somma dei massimi: 67.155.797. |
| Aggiornamento | nessun campo per sito | Ultima `Date` non futura della cronologia, tra il 16/11/2025 e il 19/10/2026. Oppure «Updated Oct. 20, 2026» dalla pagina. |

- La cronologia ha 567 righe. La colonna `Construction status` descrive a parole lo stato (per esempio «Land clearing begins»), ma è testo libero in inglese, non una categoria.

## 3. Licenza

- `README.md` dello ZIP: «Epoch AI's data is free to use, distribute, and reproduce provided the source and authors are credited under the Creative Commons Attribution license», con link a CC BY 4.0. Citazione indicata: «Epoch AI, 'AI data centers'. Published online at epoch.ai. Retrieved from 'https://epoch.ai/data/ai-data-centers' [online resource].»
- La stessa frase è nella pagina principale (`/data/ai-data-centers`, sezione «Citations») e nella documentazione (`/data/data-centers-documentation`, «Use This Work»).
- La pagina della mappa non ripete l'avviso. Le coordinate e i poligoni sono però prodotti da Epoch, come i numeri del CSV, e nel novembre 2025 erano nel CSV stesso. Li considero coperti dalla CC BY.
- **Termini d'uso.** Il piede del sito ha solo «Privacy policy» e «Cookie policy». `https://epoch.ai/terms` e `/terms-of-use` rispondono 404. Nella privacy policy non ci sono clausole sullo scaricamento automatico. `robots.txt` blocca solo `/assets/` (tranne le immagini), `/inspect-viewer/` e una pagina di FrontierMath: `/data/` è libero.
- **Immagini satellitari.** Le voci della cronologia nella mappa hanno un campo `attribution`. Ho contato le attribuzioni: «Image © 2026 Vantor» (98), «© Airbus DS 2026» (45), «Image © 2025 Vantor» (29), «© Airbus DS 2025» (27), «From Vexcel, delivered by SkyFi» (10), «From Siwei, delivered by SkyFi» (8) e altre. La metodologia dice che le immagini sono comprate («We mostly use SkyWatch, both to purchase existing high-resolution satellite imagery…»). La CC BY 4.0 concede solo i diritti «that the Licensor has authority to license» (§1, *Licensed Rights*), e avverte che altri possono avere diritti sul materiale. **Le immagini restano fuori.** I punti e i numeri no.
- **Attribuzione.** La CC BY 4.0, §3(a)(1), chiede: il nome dell'autore nel modo richiesto, un avviso che rimandi alla licenza, un link al materiale, l'indicazione delle modifiche e il link alla licenza. Il §3(a)(2) permette di farlo «in any reasonable manner», anche con un link a una pagina che contiene le informazioni. Testo proposto nella Sintesi.

## 4. Accesso

- **File dati** (documentati in `/data/data-centers-documentation/downloads`, tutti «Updated Oct. 20, 2026»):
  - `https://epoch.ai/data/data_centers/data_centers.zip`
  - `https://epoch.ai/data/data_centers/data_centers.csv`
  - `https://epoch.ai/data/data_centers/data_center_timelines.csv`
  - La documentazione dà anche l'esempio `pd.read_csv("https://epoch.ai/data/data_centers/data_centers.csv")`.
- Nessuna chiave e nessun login. Le risposte passano da Cloudflare con `Cache-Control: public, max-age=0, must-revalidate` e un `ETag`.
- **Frequenza.** La pagina `/data/ai-data-centers/updates` è «A changelog of data centers added, and major changes … generated automatically from our dataset». In ottobre 2026 ha voci il 1, 2, 5, 8, 12, 19 e 20. In totale: 72 siti aggiunti, 40 avanzamenti dei lavori e 280 revisioni.
- **Coordinate.** Non c'è un file o un'API. Bisogna:
  1. scaricare `https://epoch.ai/data/ai-data-centers/map` (3.096.131 byte);
  2. trovare l'`<astro-island>` il cui `component-url` contiene `SearchFilterMap`;
  3. fare `html.unescape` dell'attributo `props` e leggerlo come JSON;
  4. decodificare le coppie `[0, valore]` e `[1, lista]`;
  5. prendere `id` e `lngLat` da `dataCenters`.

  Ho fatto esattamente questo con la libreria standard di Python, in una trentina di righe.
- **Rischi del parser.** Il formato `props` è interno ad Astro, il nome del componente può cambiare, e la pagina può passare a caricare i dati in altro modo. Per questo:
  - salvare le coordinate in un file del repo (cambiano poco: un sito non si sposta);
  - se il parser fallisce o trova meno siti del CSV, tenere le coordinate salvate e segnalarlo nel log, senza far fallire tutta la pipeline;
  - i siti nuovi senza coordinate restano fuori dal livello finché il parser non torna a funzionare.
- **Alternativa scartata: geocodificare `Address`.** Mancano 14 indirizzi, alcuni sono solo una città, e i servizi gratuiti (Nominatim, cioè OpenStreetMap) danno risultati sotto licenza ODbL, che aggiunge un obbligo in più.
- **La pipeline.** `pipeline/epoch.py` scarica `notable_ai_models.csv` con `http_get(s, url, timeout=120)` da `pipeline/common.py`. Per i siti serve lo stesso schema: due CSV, più la pagina della mappa.

## 5. Italia ed Europa

- `Country` nel CSV (95 siti): Stati Uniti 77, Cina 5, Malesia 3, Norvegia 2, e un sito ciascuno per Regno Unito, Indonesia, Finlandia, Australia, Portogallo, Islanda, Svezia ed Emirati.
- **Italia: nessun sito.** Ho cercato anche «Italy», «CINECA», «Leonardo» ed «Eni HPC» in tutti i file dello ZIP e nei dati della mappa: niente.
- **Siti europei** (H100 equivalenti a oggi e massimo previsto dalla cronologia):

| Sito | Paese | Proprietario dei chip | Utenti | H100e oggi | H100e previsti (max) | MW oggi | Stato | `lngLat` |
|---|---|---|---|---|---|---|---|---|
| Nebius Mantsala | Finlandia (UE) | Nebius #confident | Microsoft #speculative | 48.528 | 226.234 | 75 | operativo | 25.2605, 60.6293 |
| Start Campus Sines Data Campus | Portogallo (UE) | Nscale #confident | Microsoft #confident | 31.834 | 540.677 | 33 | operativo | -8.8127, 37.9350 |
| EcoDataCenter 2 | Svezia (UE) | Mistral AI #confident | Mistral AI #confident | 0 | 138.912 | 0 | in costruzione | 15.4170, 60.5263 |
| Google Waltham Cross | Regno Unito | Google #confident | Google DeepMind #speculative | 123.800 | 123.800 | 88 | operativo | -0.0490, 51.6954 |
| CoreWeave Norway | Norvegia | CoreWeave #confident | OpenAI #speculative | 50.773 | 50.773 | 42 | operativo | 7.8984, 58.2588 |
| Microsoft Narvik Norway | Norvegia | Nscale #likely | Microsoft #likely | 0 | 265.285 | 0 | in costruzione | 17.5963, 68.5763 |
| Nscale Keflavik | Islanda | Nscale #confident | – | 5.821 | 11.642 | 5 | operativo | -22.5764, 63.9762 |

- Leonardo ed Eni HPC6 compaiono **solo** in *GPU clusters* (sezione 6).

## 6. Il censimento *GPU clusters*

- **Stato.** La pagina dice «This dataset is deprecated. For data on site-level infrastructure, users, and satellite analysis, explore the AI data centers database» e «Updated Mar. 13, 2026». Copertura: «an estimated 10–20% of existing global aggregate GPU cluster performance as of March 2025».
- **Licenza.** CC BY 4.0: «This public dataset includes all of our data on clusters outside of China and Hong Kong, along with anonymized data on clusters within China, with values rounded to one significant figure and names and links removed». Compatibile come quella dei data center.
- **Coordinate.** Il CSV (`https://epoch.ai/data/gpu_clusters.csv`, 304.311 byte, 482 righe, uguale a quello della ricerca precedente) ha le ultime due colonne `latitude` e `longitude`, in gradi decimali con 4-6 decimali. La pagina dei campi (`/data/gpu-clusters-documentation/records`) documenta `Location` («Specific location where the supercomputer is physicaly located»), ma non `latitude` e `longitude`.
- **Precisione** (conti miei). 447 cluster su 482 hanno coordinate. Mancano per 16 senza Paese, 12 della Corea del Sud, 6 del Regno Unito e 1 dell'Islanda. Le 447 si dividono così:
  - 277 sul **centro del Paese**, cioè lo stesso punto usato dove `Location` è solo il nome del Paese. Ci sono tutti i 188 cluster cinesi, chiamati «Anonymized Chinese System», sul punto `35.486703, 101.901875`, e 56 cluster USA sul punto `39.381266, -97.922211`;
  - 101 con un indirizzo o un codice postale in `Location`;
  - 66 con una città, una regione o un nome di istituto;
  - 3 con `Location` vuota.
- **Italia** (9 cluster, 6 punti diversi):

| Cluster | Proprietario | H100e | Dal | Posizione |
|---|---|---|---|---|
| EuroHPC Leonardo | EuroHPC JU | 4.359 | 22/11/2022 | Via Piero Gobetti 101, Bologna: `44.522194, 11.338427` |
| Eni HPC6 | Eni | 2.688 | 18/11/2024 | Via per la Corradina 35, Ferrera Erbognone: `45.101078, 8.859647` |
| Eni HPC5 | Eni | 460 | 21/02/2020 | stesso punto di HPC6 |
| Cineca Marconi-100 | Cineca | 250 | 20/04/2020 | «Bologna», centro città: `44.495735, 11.344672` |
| Fastweb NeXXt AI Factory | Fastweb | 248 | 09/07/2024 | Ponte San Pietro (Bergamo): `45.706852, 9.590379` |
| Leonardo SpA davinci-1 | Leonardo SpA | 101 | 01/11/2020 | «Genoa», centro città |
| Eni HPC4 Phase 2 e Phase 1 | Eni | 79 e 30 | 2021 e 2018 | stesso punto di HPC6 (Phase 1 è `Superseded by` Phase 2) |
| Eni HPC2 | Eni | 6 | 15/11/2014 | `Location` vuota, **centro dell'Italia** `42.504154, 12.646361` |

- **UE:** 54 cluster in 12 Paesi, tutti con coordinate. Sei sono sul centro del Paese: Sweden 4k H100 Cluster, Novo Nordisk Gefion, CEA EXA1-HE Phase 2 e 3, Atos Spartan2, Microsoft Azure Pioneer-WEU.
- **Uso per la mappa.** Non lo raccomando come punti nello stesso livello:
  - misura **cluster**, non siti: Eni HPC4, HPC5 e HPC6 sono quattro righe sullo stesso punto, e alcune fasi sostituiscono le precedenti;
  - un terzo dei punti è il centro di un Paese, che sulla mappa sembrerebbe un sito vero;
  - è fermo a marzo 2026, con metodo e copertura diversi da *AI data centers*.

  Per l'Italia basta una nota nella card, per esempio: «Epoch non ha ancora siti italiani tra i data center AI. Nel vecchio censimento dei cluster di GPU (fermo a marzo 2026) l'Italia ha 9 cluster, i maggiori Leonardo a Bologna ed Eni HPC6 a Ferrera Erbognone.» Se si vuole un punto, va disegnato in modo diverso e solo per i cluster con indirizzo (Leonardo, Eni HPC6), con la data.

## 7. Cosa resta incerto

- **La licenza della pagina della mappa.** La CC BY è dichiarata per «Epoch's data», non per la pagina della mappa in particolare. Il rischio è basso, ma una conferma di Epoch (data@epoch.ai) chiuderebbe la questione, insieme alla richiesta di rimettere le coordinate nel CSV.
- **La durata del parser.** Il formato `props` di Astro e il nome `SearchFilterMap` non sono garantiti. Non so quanto spesso cambino.
- **Perché le coordinate sono sparite dal CSV.** Il CSV di novembre 2025 le aveva. Non ho trovato una spiegazione di Epoch. Non so se sia una scelta (per esempio legata alle immagini comprate) o una semplificazione.
- **L'URL dei GeoJSON per sito** funziona oggi per tutti i 94 file, ma non è documentato.
- **L'Italia.** Epoch scrive «We continue to expand coverage globally, including Asia, Europe and the Middle East», ma non dà date né elenchi di siti in arrivo.

## Metodo

- **File scaricati il 22/10/2026**, tra le 15:29 e le 15:36 UTC, in una cartella temporanea fuori dal repo:
  - `https://epoch.ai/data/data_centers/data_centers.zip` (117.730 byte) e `https://epoch.ai/data/data_centers/data_centers.csv` (71.165 byte, identico a quello dello ZIP);
  - `https://epoch.ai/data/gpu_clusters.csv` (304.311 byte);
  - le pagine HTML `https://epoch.ai/data/ai-data-centers`, `/map`, `/directory`, `/directory/colossus-2`, `/updates`, la documentazione `/data/data-centers-documentation` con le sottopagine `methodology`, `records`, `downloads` e `acknowledgements`, `https://epoch.ai/data/gpu-clusters` e `/data/gpu-clusters-documentation` con le sottopagine, `https://epoch.ai/privacy` e `https://epoch.ai/robots.txt`;
  - i 94 GeoJSON `https://epoch.ai/data/data_centers/annotations/<nome>.geojson`;
  - la copia dell'Internet Archive `https://web.archive.org/web/20251105130227/https://epoch.ai/data/generated/data_centers/data_centers.csv`;
  - il testo legale `https://creativecommons.org/licenses/by/4.0/legalcode.en`.
- **Accessi falliti:** `https://epoch.ai/data/generated/data_centers/data_centers.csv` (404 oggi), `https://epoch.ai/terms` e `https://epoch.ai/terms-of-use` (404).
- **Script** (fuori dal repo, lanciati con `python -I`, con i percorsi passati come argomenti):
  - `unzip.py`: estrae lo ZIP senza percorsi fuori cartella;
  - `mappa.py`: estrae e decodifica i `props` di `SearchFilterMap` dalla pagina della mappa;
  - `csv_dc.py`, `mappa2.py`, `stato.py`: colonne e campi pieni del CSV, Paesi, confronto dei nomi con la mappa, decimali e riquadri di `lngLat`, stato, previsti, siti europei;
  - `gpu.py`, `gpu2.py`: coordinate di *GPU clusters*, punti ripetuti, classificazione della precisione, Italia e UE;
  - `testo.py`: testo delle pagine HTML.
- **Regole:**
  - «centro del Paese» = un punto usato da almeno un cluster con `Location` uguale al nome del Paese (15 punti);
  - «operativo» = `Current H100 equivalents` > 0;
  - «previsti» = valore massimo di `H100 equivalents` nella cronologia del sito;
  - la larghezza del riquadro è (est − ovest) × 111 km × cos(latitudine).

## Fonti

Tutte consultate il 22 ottobre 2026.

- Epoch AI, *AI data centers*: https://epoch.ai/data/ai-data-centers. Mappa: https://epoch.ai/data/ai-data-centers/map. Registro delle modifiche: https://epoch.ai/data/ai-data-centers/updates
- Epoch AI, documentazione di *AI data centers*: https://epoch.ai/data/data-centers-documentation, con `/methodology`, `/records` (definizioni e copertura dei campi) e `/downloads`
- Epoch AI, file: https://epoch.ai/data/data_centers/data_centers.zip (`README.md`, `data_centers.csv`, `data_center_timelines.csv`), https://epoch.ai/data/data_centers/data_centers.csv, https://epoch.ai/data/data_centers/data_center_timelines.csv
- Epoch AI, GeoJSON di un sito (non documentato): https://epoch.ai/data/data_centers/annotations/Amazon_Madison_Mega_Site.geojson
- Epoch AI, vecchio CSV con `Latitude` e `Longitude`, copia del 05/11/2025: https://web.archive.org/web/20251105130227/https://epoch.ai/data/generated/data_centers/data_centers.csv
- Epoch AI, *GPU clusters*: https://epoch.ai/data/gpu-clusters. File: https://epoch.ai/data/gpu_clusters.csv. Documentazione: https://epoch.ai/data/gpu-clusters-documentation/records
- Epoch AI, privacy policy e robots.txt: https://epoch.ai/privacy, https://epoch.ai/robots.txt
- Creative Commons, *Attribution 4.0 International*, §1, §3(a): https://creativecommons.org/licenses/by/4.0/legalcode.en
- Codice del repo: `pipeline/epoch.py` (commit `490aea7`)
- Ricerca precedente: `docs/research/fonti-mappa.md` (ramo `research/fonti-mappa`)
