# Fonti e licenze per la mappa

Ricerca per il ticket wayfinder «08: Fonti e licenze per la mappa» (GeopoliticAI). Fonti consultate e file scaricati il 22 ottobre 2026, tra le 11:20 e le 11:45 UTC.

## Sintesi

1. **Candidati.** Ne ho valutati quindici, per quattro temi.
   - **Chip:** il dataset della catena dei semiconduttori dell'Emerging Technology Observatory (ETO, Georgetown CSET), i dati di Epoch AI sulle vendite di chip AI e sull'hardware, e quattro fonti scartate (SIA/WSTS, OECD *The chip landscape*, SEMI e TechInsights, UN Comtrade).
   - **Server e data center:** il database *AI data centers* di Epoch AI, il vecchio dataset *GPU clusters* di Epoch (deprecato), TOP500, i dati IEA sull'energia dei data center (anche tramite Our World in Data) e il database UE dei data center della direttiva sull'efficienza energetica.
   - **Materie prime:** USGS *Mineral Commodity Summaries 2026* (MCS), lo studio UE sulle materie prime critiche del 2023 con la lista del Critical Raw Materials Act, il portale RMIS del JRC e le statistiche minerarie del BGS.
   - **Confini:** Natural Earth, il pacchetto `world-atlas` che lo ridistribuisce e GISCO di Eurostat.
2. **Licenza.** Nessuna delle fonti raccomandate ha clausole come il §2.4(c-d) di Artificial Analysis, cioè niente divieto di dashboard pubblica o di unione con altri dati.
   - **Epoch AI:** CC BY 4.0, come per i modelli.
   - **USGS:** pubblico dominio (CC0 1.0).
   - **Studio UE:** CC BY 4.0, salvo indicazione contraria.
   - **Natural Earth:** pubblico dominio, senza obbligo di citazione.
   - **ETO:** **CC BY-NC 4.0**. Va bene per un sito gratuito senza pubblicità come AI Radar. I termini però vietano di scaricare i dati «using web scrapers or other automated or semi-automated means».
   - **Fonti che non reggono per la licenza:** IEA (al massimo 5 numeri, e niente download), BGS (solo uso accademico non commerciale, niente cessione a terzi), GISCO (non commerciale, con l'avviso di EuroGeographics) e TOP500 (nessuna licenza, solo «Copyright 1993-2026 TOP500.org»).
3. **Copertura.** Conteggi miei sui file scaricati, salvo dove è indicato il PDF.

   | Risorsa e fonte | USA | Cina | Regno Unito | UE | Italia | Taiwan, Corea, Giappone, Paesi Bassi |
   |---|---|---|---|---|---|---|
   | Chip, fasi della catena (ETO) | sì | sì | solo macchinari | come «Europe», un blocco unico | solo strumenti di test, 0,7-3,3% | tutti |
   | Data center AI (Epoch, 95 siti) | 77 siti, 86,5% del calcolo | 5 siti, 2,2% | 1 sito, 0,8% | 3 siti (Finlandia, Portogallo, Svezia), 0,5% | **nessuno** | nessuno |
   | Cluster di GPU (Epoch, fermo a marzo 2026) | 119, 79,5% | 190, 7,0% | 6, 0,5% | 54 in 12 Paesi, 5,1% | 9 cluster, 0,5% | tutti, Giappone 1,2% |
   | Materie prime per chip (USGS, dal PDF) | sì | sì | no | Francia, Germania, Spagna (silicio); Belgio, Francia (indio) | **nessuna** | Giappone (gallio, indio), Corea (indio) |

4. **Unità.**
   - **Chip:** quota del mercato mondiale per fase o per macchinario, in %.
   - **Data center AI:** calcolo in H100 equivalenti e potenza in MW, con la cronologia di ogni sito.
   - **Materie prime:** produzione e riserve in tonnellate o chilogrammi, da cui si ricava la quota mondiale.
   - **Serie storiche:** solo Epoch ha serie vere (sito per sito, dal 2024 in avanti). ETO ha una sola fotografia e mescola anni diversi (2019, 2022, 2025). USGS dà due anni per edizione, e la serie si costruisce unendo le edizioni.
5. **Accesso.**
   - **Epoch:** ZIP e CSV pubblici, senza chiave. La pipeline li legge da sola.
   - **ETO:** CSV su GitHub. Per i termini d'uso conviene una copia scaricata a mano, oppure il permesso di ETO per la lettura automatica.
   - **USGS:** il CSV è su ScienceBase, che il 22 ottobre rispondeva 403 (pagina di controllo Cloudflare) a ogni client non browser. Il PDF su pubs.usgs.gov si scarica. Serve quindi un download a mano una volta l'anno: MCS esce a febbraio.
   - **Studio UE:** solo PDF. RMIS e EUR-Lex bloccavano i client automatici.
   - **Natural Earth:** GeoJSON su GitHub, senza limiti.
6. **Confini.** Natural Earth mostra i confini *de facto*.
   - **Taiwan** è un poligono a sé (`ADM0_A3 = TWN`).
   - **Hong Kong e Macao** sono poligoni a sé, con sovranità cinese, solo dalla scala 1:50m in su. A 1:110m stanno dentro la Cina.
   - **La Crimea** nella versione standard è russa. Nella versione «punto di vista italiano» (`_ita`, solo a 1:10m) è ucraina, e il Sahara Occidentale è separato dal Marocco.
   - Alla scala 1:110m mancano Malta, Singapore e Hong Kong. Per il dettaglio dei Paesi UE serve 1:50m.

**Raccomandazioni**

- **Chip: usare il dataset ETO**, con quattro condizioni:
  - una copia fissa nel repo, aggiornata a mano, perché i termini vietano lo scaricamento automatico;
  - la licenza CC BY-NC dichiarata sotto la card e accanto al file;
  - le quote per fase (progettazione, fabbricazione, assemblaggio) dette per quello che sono: dati SIA del 2022, attribuiti alla sede per la progettazione e al luogo dello stabilimento per la fabbricazione;
  - l'UE mostrata come «Europa», perché ETO non la divide in Paesi.

  Se il vincolo non commerciale o la copia a mano non vanno bene, **i chip restano fuori dalla mappa**: non esiste una fonte aperta sulla capacità delle fonderie per Paese.
- **Server e data center: usare Epoch *AI data centers*** (CC BY 4.0, automatico). È la sola fonte aperta che misura la capacità AI, in H100 equivalenti e MW. Va detto chiaramente che copre circa il 44% del calcolo mondiale, che è quasi tutto negli USA e che per l'Italia non ha siti. Il vecchio dataset *GPU clusters* è fermo a marzo 2026, ma dà ancora un dettaglio dei Paesi UE, Italia compresa: si può usare come fotografia datata. TOP500 e IEA restano fuori.
- **Materie prime: usare USGS MCS** (pubblico dominio) per gallio, terre rare, silicio, indio e tungsteno, con un download annuale a mano. Per il **germanio** USGS non dà numeri per Paese: si può usare la tabella dello studio UE 2023 (CC BY 4.0, media 2016-2020), oppure lasciarlo fuori. L'Italia non produce nessuno di questi materiali, e la card deve dirlo.
- **Confini: Natural Earth 1:50m** (pubblico dominio). Hong Kong e Macao vanno uniti alla Cina, come decide il ticket 06. Taiwan resta a sé e va colorata in «Altri». Per la Crimea conviene il punto di vista italiano: si prende dal file `_ita` 1:10m semplificato, oppure si riassegna il poligono della Crimea del livello «breakaway» 1:50m.

## 1. Chip

### ETO, Advanced Semiconductor Supply Chain Dataset

- **Chi la mantiene:** l'Emerging Technology Observatory, il gruppo dati del Center for Security and Emerging Technology (CSET) di Georgetown. Il dataset alimenta il *Supply Chain Explorer*.
- **Cosa misura:** per ogni fase e per ogni input (progettazione, fabbricazione, assemblaggio e test, macchinari, materiali) dà la quota del mercato mondiale per Paese e per azienda. I file sono cinque CSV: `inputs`, `providers`, `provision`, `sequence` e `stages`.
- **Come è definita la quota:** «the total market share of all companies whose ultimate parent is headquartered in that country». Fa eccezione la fase di fabbricazione, che usa la «share of global fabrication capacity … by site location» (`stages.csv`).
- **Aggiornamento:** è uscito il 13/10/2022. Il 14/07/2025 i dati sono passati dal 2019 al 2024, e il 15/09/2026 quasi tutti al 2025. ETO scrive «the next update isn't scheduled yet» e «Some data are out of date».

**Cosa c'è nel file** (`provision.csv`, scaricato il 22/10/2026, 1.300 righe):

- Gli anni sono misti: 977 righe del 2025, 264 del 2019, 43 del 2022 e 16 del 2021.
- Le fonti: 977 righe dicono «CSET analysis of TechInsights data (2025). Data used for analysis were published by TechInsights on July 3, 2026». Le altre vengono dal rapporto CSET del 2021, che a sua volta cita SEMI, SIA e altri.
- Le tre fasi (`stages.csv`, dati 2022) citano come fonte la Semiconductor Industry Association (SIA) e WSTS.
- I Paesi sono 23, tra cui «Europe» e «Various countries».
- Hanno quote per Paese 96 dei 129 input e fasi.

**Quote mondiali per Paese**, dal file:

| Fase o input | Anno | Quote |
|---|---|---|
| Progettazione (tutti i chip) | 2022 | USA 51%, Corea del Sud 13%, Europa 10%, Giappone 9%, Taiwan 8%, Cina 6% |
| Progettazione di chip logici | 2022 | USA 65%, Taiwan 11%, Europa 9%, Cina 5%, Giappone 4%, Corea 3% |
| Fabbricazione, capacità per luogo | 2022 | Cina 24%, Taiwan 18%, Giappone 17%, Corea 17%, USA 10%, Europa 8% |
| Assemblaggio, test e packaging | 2022 | Cina 30%, Taiwan 28%, vari 20%, Corea 9%, Giappone 6%, Europa 3%, USA 3% |
| Macchinari di litografia | 2025 | Paesi Bassi 81,5%, Giappone 15%, Austria 1,6% |
| Litografia EUV | 2025 | Paesi Bassi 100% |
| Deposizione | 2025 | USA 60,3%, Giappone 14%, Paesi Bassi 10,9%, Cina 9,8% |
| Incisione e pulizia | 2025 | USA 52,6%, Giappone 32,6%, Cina 10,1% |
| Software EDA | 2019 | USA 96%, Giappone 3% |

**Copertura**

- USA, Cina, Taiwan, Corea, Giappone e Paesi Bassi ci sono sempre.
- Il **Regno Unito** compare solo in alcuni macchinari, sempre sotto l'1%, e nell'EDA con l'1%.
- **L'UE** nelle tre fasi è un unico «Europe», e la documentazione non dice se comprende Paesi fuori dall'UE. I Paesi UE singoli (Germania, Paesi Bassi, Austria, Francia, Svezia, Italia e altri) compaiono solo nei macchinari.
- **Italia:** nel file ci sono 4 aziende (ELES, EDA Industries, SPEA, LPE). L'Italia ha quote solo negli strumenti di test: 3,3% nel burn-in, 1,6% in handler e prober, 0,8% nel test SoC, 0,7% nel test in generale.

**Licenza e attribuzione**

- `LICENSE.md` del repo: «This work is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License».
- I termini d'uso di ETO (https://eto.tech/tou) dicono «ETO Resources are licensed under a Creative Commons Attribution-Non Commercial 4.0 International License». Ci sono però due riserve:
  - «ETO Resources may not be downloaded, copied, or extracted using web scrapers or other automated or semi-automated means»;
  - «Some material in the ETO Resources may be owned by third parties, as indicated», e per quel materiale servono i permessi dei terzi.
- In CC BY-NC 4.0, §1(i), *NonCommercial* vuol dire «not primarily intended for or directed towards commercial advantage or monetary compensation». AI Radar è gratuito e non ha pubblicità, quindi rientra. La licenza §2(a)(1)(B) permette di produrre e condividere materiale adattato, cioè gli aggregati per area. La §3(a)(1) chiede il nome dell'autore, il link alla licenza e l'indicazione delle modifiche.
- **Non ci sono** divieti di dashboard pubblica o di unione con altri dati.
- **I rischi:**
  - La lettura automatica dalla pipeline può ricadere nel divieto dei termini. Per questo raccomando una copia scaricata a mano, o un permesso scritto.
  - I numeri vengono in gran parte da fornitori commerciali (TechInsights, SIA). ETO li pubblica come «CSET analysis», ma non li segna come materiale di terzi. Il rischio è basso, ma non è zero.
  - Il repo è MIT. Un file derivato da ETO, messo in `data/`, deve portare la sua licenza CC BY-NC, perché chi fa un fork non la erediti per sbaglio come MIT.

### Epoch AI: vendite di chip AI e hardware

- *AI chip sales* (CC BY 4.0, `ai_chip_sales.zip`) stima il calcolo venduto per progettista, in H100 equivalenti per trimestre. Il dato cumulato più recente dà USA circa 96,5% (Nvidia 65,9%, Google 20,8%, AMD 5,2%, Amazon 4,6%) e Cina 3,5% (Huawei 3,3%, Cambricon 0,2%). Le date finali non sono uguali per tutti: 30/09/2026 per Nvidia e Google, 30/06/2026 per gli altri.
- Ci sono **solo due Paesi**, USA e Cina. Nessun progettista è dell'UE, del Regno Unito o dell'Italia. Serve per il confronto USA-Cina, non per una mappa.
- *AI chip components* e *AI chip owners* sono per azienda e non hanno il Paese.
- *Machine learning hardware* (183 chip) ha la colonna `Foundry`: TSMC 89, Samsung 10, SMIC 9, Intel 3, vuota per 71. Dice chi fabbrica ogni modello di chip, non i volumi per Paese.

### Fonti scartate

- **SIA/WSTS e SEMI.** Sono la fonte delle quote per fase di ETO, ma pubblicano rapporti protetti da copyright, oppure database a pagamento come il SEMI World Fab Forecast. Non ho trovato un file aperto.
- **OECD, *The chip landscape* (dicembre 2025).** Mappa la capacità delle fonderie per economia, ma con «disaggregated data … sourced from two commercial data providers, SEMI (World Fab Watch third quarter 2025) and TechInsights Inc.». L'OECD scrive che «Data aggregation is required to ensure co-operation with industry and commercial data providers». Il database non è pubblico, e il rapporto non ha un file dati scaricabile.
- **UN Comtrade.** Misura il commercio (per esempio la voce HS 8542, circuiti integrati), non la capacità produttiva, ed è falsato dai transiti (Hong Kong, Singapore). Le FAQ permettono di pubblicare dati trasformati («Transformed data from UN Comtrade is no longer subject to copyright restrictions»). Non lo raccomando per la mappa.

## 2. Server e data center

### Epoch AI, *AI data centers*

- **Cosa misura:** per ogni sito, la potenza IT (MW), il calcolo (H100 equivalenti e OP/s a 8 bit), il costo, il proprietario e gli utenti, con una cronologia (`data_center_timelines.csv`, 567 righe). Le stime vengono da immagini satellitari e da permessi.
- **Aggiornamento:** sulla pagina c'è «Updated Oct. 20, 2026». Lo ZIP scaricato ha file datati 22/10/2026.
- **Copertura dichiarata:** il 44% del calcolo AI mondiale installato al 22/10/2026 (intervallo al 90%: 30-78%), e il 22% nel primo trimestre del 2024. Epoch scrive: «We continue to expand coverage globally, including Asia, Europe and the Middle East».
- **Chi entra:** di solito i siti operativi dal 2024 in poi. Fuori dagli USA la soglia di capacità è più bassa: «we have a lower bar for capacity internationally compared to the US, to achieve more globally balanced coverage».
- **Licenza:** «free to use, distribute, and reproduce provided the source and authors are credited» (CC BY 4.0), anche nel `README.md` dello ZIP. Citazione: «Epoch AI, 'AI data centers'».

**Copertura nel file** (`data_centers.csv`, 95 siti):

| Area | Siti | H100 equivalenti attuali | Quota | MW |
|---|---|---|---|---|
| USA | 77 | 12.754.555 | 86,5% | 11.978 |
| Altri | 9 (Malesia 3, Norvegia 2, Indonesia, Australia, Islanda, Emirati) | 1.472.995 | 10,0% | 1.298 |
| Cina | 5 | 320.440 | 2,2% | 731 |
| Regno Unito | 1 | 123.800 | 0,8% | 88 |
| UE | 3 (Finlandia, Portogallo, Svezia) | 80.362 | 0,5% | 108 |

- **Italia: nessun sito.** Nessun sito neanche a Taiwan, in Corea, in Giappone o nei Paesi Bassi. Il sito svedese e quello degli Emirati hanno ancora 0 MW.
- **Unità:** H100 equivalenti e MW per area, sommando i siti. Dalla cronologia si ricostruisce una serie trimestrale. È adatta al confronto tra aree, ma la differenza dipende in parte dalla copertura.

### Epoch AI, *GPU clusters* (prima *AI Supercomputers*)

- La pagina dice «This dataset is deprecated» e rimanda ai data center AI. L'ultimo aggiornamento è del 13/03/2026. La licenza è CC BY 4.0.
- La copertura è stimata al «10–20% of existing global aggregate GPU cluster performance as of March 2025».
- Il CSV pubblico arrotonda i valori cinesi a una cifra significativa e toglie nomi e link dei cluster cinesi e di Hong Kong.
- `gpu_clusters.csv` ha 482 cluster, tutti «Existing», con un solo Paese per riga. Le date di entrata in funzione vanno dal 15/11/2010 al 22/07/2025.

| Area | Cluster | H100 equivalenti | Quota |
|---|---|---|---|
| USA | 119 | 1.250.989 | 79,5% |
| Cina (Hong Kong compresa, 2) | 190 | 109.811 | 7,0% |
| Altri | 97 | 97.625 | 6,2% |
| UE | 54 | 79.657 | 5,1% |
| Senza Paese | 16 | 27.190 | 1,7% |
| Regno Unito | 6 | 7.972 | 0,5% |

- **Paesi UE (12):**

  | Paese | Cluster | H100 equivalenti |
  |---|---|---|
  | Francia | 14 | 18.403 |
  | Germania | 11 | 26.050 |
  | Italia | 9 | 8.220 |
  | Finlandia | 4 | |
  | Svezia | 4 | |
  | Polonia | 4 | |
  | Paesi Bassi | 3 | 947 |
  | Spagna, Danimarca, Lussemburgo, Cechia, Slovenia | 1 ciascuno | |

- **Italia:** 9 cluster, lo 0,52% del totale.
  - EuroHPC Leonardo: 4.359 H100 equivalenti;
  - Eni HPC6: 2.688;
  - Eni HPC5: 460;
  - Cineca Marconi-100, Fastweb NeXXt AI Factory, Leonardo davinci-1 ed Eni HPC4 e HPC2, ognuno sotto 250.
- **Fuori dalle aree:** Giappone 25 cluster (1,2%), Corea 12 (0,4%), Taiwan 3 (0,1%).
- **Uso possibile:** è l'unica fonte aperta con il dettaglio dei Paesi UE e l'Italia per il calcolo AI. Ma è ferma, copre poco e non verrà aggiornata. Va mostrata solo come fotografia datata («cluster noti fino a marzo 2026»).

### TOP500

- **Cosa misura:** i 500 supercomputer più veloci in Linpack, cioè in FP64, il calcolo scientifico. Non è il calcolo AI, e gli iscritti si dichiarano da soli. La lista esce due volte l'anno; l'ultima è di giugno 2026.
- **Accesso:** `TOP500_202606.xlsx` si scarica senza login.
- **Copertura** (500 sistemi, 47 Paesi):
  - USA: 161 sistemi, 37,5% del Rmax;
  - UE: 132, 24,6%;
  - Altri: 165, 22,8%;
  - Cina: 31, 12,7%;
  - Regno Unito: 11, 2,4%.
- L'**Italia** è il quarto Paese: 18 sistemi, 7,7% del Rmax. La Germania ha 41 sistemi (7,5%), il Giappone 44 (8,1%), la Corea 19 (3,2%), Taiwan 11 (1,1%) e i Paesi Bassi 7 (1,6%).
- **Licenza:** non c'è. Il sito ha solo «Copyright 1993-2026 TOP500.org (c)». L'impressum dice che TOP500 è un marchio di Prometeus GmbH, in Germania, dove vale anche il diritto sui database. Senza licenza e senza permesso, ripubblicare la lista non è coperto.
- **Scartata.** Manca la licenza, misura il calcolo scientifico e non quello AI, e l'Italia ne uscirebbe sovrastimata rispetto all'AI (7,7% contro lo 0,5% dei cluster di GPU).

### IEA, energia dei data center

- *Key Questions on Energy and AI* (aggiornato il 16/04/2026) ha dati mondiali e per regione: capacità installata, PUE, fattore di carico, consumi. **Non ha dati per Paese**: niente Italia e niente Paesi UE.
- È un XLSX gratuito, ma serve un account IEA. La licenza è «Terms of Use for Non-CC Material».
- Quei termini:
  - §3(a)(ii)(A): permettono solo «Insubstantial Amounts», e oltre 5 numeri vanno mostrati in forma grafica o aggregata, senza «a separate downloadable and/or manipulable format»;
  - §3(a)(ii)(B): permettono materiale derivato solo se non si può risalire ai dati;
  - nota 1 di §3(a)(v): vietano «making more than 5 (five) raw data points … accessible for download»;
  - §3(a)(ii)(A): escludono l'uso diretto a vantaggio commerciale.
- Il sito usa già la serie OWID `data-centers-share-electricity-demand` (© OECD/IEA): World, Stati Uniti, Cina, Europe (IEA) e le altre regioni IEA, per 4 anni.
- **Scartata per la mappa.** Mancano i Paesi, e i termini vietano di rendere scaricabili i dati.

### Database UE dei data center (direttiva sull'efficienza energetica)

- I data center sopra i 500 kW nell'UE dichiarano consumi, PUE e acqua in un database della Commissione. Il pubblico vede solo aggregati, in una dashboard Qlik (https://link.europa.eu/q7x39t) **senza download**.
- Il primo rapporto (luglio 2025) ha nel PDF l'avviso «Unless otherwise noted, the reuse of this document is authorised under a Creative Commons Attribution 4.0 International (CC BY 4.0) licence». Dice che hanno dichiarato 770 data center su 2.161 stimati, il 36%. Per l'**Italia**: 178 stimati, 23 dichiaranti, il 13%.
- Misura energia, non calcolo AI, e c'è solo l'UE. **Scartata per la mappa.** Può servire solo come nota sull'Italia.

## 3. Materie prime

### USGS, Mineral Commodity Summaries 2026

- **Chi la mantiene:** il National Minerals Information Center dello USGS. Esce ogni anno a febbraio: l'edizione 2026 è del 06/02/2026.
- **Cosa misura:** per più di 90 materiali, la produzione mondiale per Paese (miniera o raffineria) e le riserve, per l'anno precedente e per quello prima, in tonnellate o chilogrammi.
- **Licenza:**
  - i metadati del data release (DOI 10.5066/P1WKQ63T) dicono «These data are marked with a Creative Common CC0 1.0 Universal License. These data are in the public domain and do not have any use constraints»;
  - la politica USGS dice «USGS-authored or produced data and information are considered to be in the U.S. Public Domain», e chiede la citazione «Credit: U.S. Geological Survey»;
  - alcuni numeri vengono da terzi: per il gallio, la tabella cita Asian Metal Ltd. Il data release resta comunque CC0.
- **Accesso:**
  - il CSV `MCS2026_ALLchapters_Reconcile.csv`, con le colonne `Commodity, Country, Statistics, Statistics_detail, Unit, Year, Value, Notes`, sta su ScienceBase;
  - il 22/10/2026 ScienceBase rispondeva **403 con una pagina di controllo Cloudflare** a curl, a Python e allo strumento di fetch, quindi non ho potuto leggere il CSV;
  - il PDF (https://pubs.usgs.gov/periodicals/mcs2026/mcs2026.pdf, 17,6 MB) si scarica, e la copertura qui sotto viene dal suo testo;
  - per la pipeline serve un download a mano una volta l'anno, salvato nel repo.

**Copertura per i materiali dei chip** (dal PDF, tabelle «World … Production»):

| Materiale | Paesi nella tabella | UE | Italia |
|---|---|---|---|
| Gallio (primario a bassa purezza) | Cina, Giappone, Russia, più la capacità USA e «Other». Il testo dice «China accounted for 99% of worldwide primary low-purity gallium production». | no | no |
| Germanio | **nessuna tabella per Paese**: «Because most producers do not publicly report germanium production, global production data were limited» | – | – |
| Terre rare (miniera e riserve) | USA, Australia, Brasile, Birmania, Canada, Cina, Groenlandia, India, Madagascar, Malesia, Nigeria, Russia, Sudafrica, Tanzania, Thailandia, Vietnam | no | no |
| Silicio (ferrosilicio e silicio metallico) | 16 Paesi più «Other». Gli USA sono «W», cioè dato riservato. | Francia, Germania, Spagna | no |
| Indio (raffineria) | USA, Belgio, Canada, Cina, Francia, Giappone, Corea, Russia, Uzbekistan | Belgio, Francia | no |
| Tungsteno (miniera) | 12 Paesi più «Other», tra cui la Cina | Austria, Portogallo, Spagna | no |
| Quarzo ad alta purezza | nessun dato: «This information was not available» | – | – |

- Nelle tabelle MCS l'**Italia** compare solo per feldspato, pigmenti di ossido di ferro, sale, sabbia industriale e talco, cioè per nessun materiale dei chip.
- Il **Regno Unito** non compare in queste tabelle.
- **Taiwan e Paesi Bassi** non producono questi materiali: pesano nella catena dei chip, non nelle miniere.
- **Unità:** la quota mondiale si calcola come produzione del Paese diviso il totale mondiale, per la stessa voce. Ogni edizione ha due anni: per una serie vanno unite le edizioni annuali.

### Lista UE delle materie prime critiche e studio 2023

- **La lista:** la pagina della Commissione dice «In 2023, a fifth list of 34 CRMs was published». Comprende gallio, germanio, silicio metallico e terre rare pesanti e leggere. La Commissione è «committed to updating the list at least every 3 years». Il testo del regolamento (UE) 2024/1252 su EUR-Lex non era leggibile dai client automatici (risposta 202 vuota), quindi non ho citato gli allegati.
- **Lo studio 2023** (DOI 10.2873/725585) è solo in PDF e non ha un allegato di dati. Ha tabelle per Paese con la quota dell'offerta mondiale, come media 2016-2020, e la fonte è «DG GROW elaboration on multiple sources». Per esempio:
  - **germanio** (raffinazione): Cina 83,1%, Russia 5,0%, Belgio 4,5%, Germania 2,7%, USA 2,0%, Giappone 1,8%, Ucraina 0,9%;
  - **gallio:** Cina 94% come primo fornitore mondiale; Ucraina 2,2%, Russia 1,9%, Giappone 1,0%, Corea 0,9%, Germania 0,3%;
  - **silicio metallico:** Cina 76% come primo fornitore.
- **Licenza:** l'avviso legale della Commissione dice «Unless otherwise indicated … content owned by the EU on this website is licensed under» CC BY 4.0, a condizione che «appropriate credit is given and changes are indicated». Il PDF dello studio non ha un avviso proprio.
- **RMIS (JRC):** il 22/10/2026 rispondeva 403 «This url is blocked. Please contact the website admin.» a curl e allo strumento di fetch. Non ho potuto verificare download né licenza: **non verificato**.
- **Uso:** la lista serve come etichetta («critica per l'UE»). Le quote dello studio servono solo per il germanio, come tabella fissa e datata.

### BGS, World Mineral Statistics (scartata)

- I termini (IPR) dicono «You may adapt and use these tables for non-commercial academic and research purposes». Per un uso commerciale o per «provide them to a third party» serve un permesso.
- Il sito pubblico mostra i dati a terzi, quindi **non regge senza permesso**.

## 4. Confini per la mappa

### Natural Earth

- **Licenza:** «All versions of Natural Earth raster + vector map data found on this website are in the public domain». Per la citazione: «No permission is needed to use Natural Earth. Crediting the authors is unnecessary». Il testo è lo stesso in `LICENSE.md` del repo GitHub.
- **Versione:** l'ultima release è la v5.1.2 (13/05/2022). Il file `VERSION` sul ramo principale dice `5.2.0-pre`. I GeoJSON che ho scaricato sono al commit `9380cca` (v5.1.1).
- **Dimensioni (GeoJSON):**

  | Scala | Peso | Paesi |
  |---|---|---|
  | 1:110m | 0,8 MB | 177 |
  | 1:50m | 3,1 MB | 242 |
  | 1:10m, punto di vista italiano | 13,2 MB | 250 |

  Il pacchetto `world-atlas@2.0.2` (licenza ISC) li ridistribuisce in TopoJSON: 108 KB a 1:110m e 756 KB a 1:50m. Però usa la vecchia **v4.1.0**.
- **Scala:** a 1:110m mancano **Malta**, Singapore, Hong Kong, Macao e Bahrein. Per mostrare tutti i 27 Paesi UE serve **1:50m**.
- **Criterio:** «Natural Earth shows de facto boundaries by default according to who controls the territory». Ci sono varianti per più di 30 punti di vista nazionali, nei campi `FCLASS_xx` e nei file `ne_10m_admin_0_countries_<paese>`. I file per Paese esistono solo a 1:10m.

**Come tratta i casi delicati** (campi del file 1:50m e test con un punto dentro ogni poligono):

| Territorio | Versione standard | Punto di vista italiano (`_ita`, 1:10m) |
|---|---|---|
| Taiwan | poligono a sé, `ADM0_A3 = TWN`, `TYPE = Sovereign country`, `ISO_A2 = CN-TW`, `FCLASS_ISO = Admin-1 states provinces` | poligono a sé (Taipei cade in «Taiwan») |
| Hong Kong, Macao | poligoni a sé a 1:50m (`SOVEREIGNT = China`, `FCLASS_ISO = Admin-0 dependency`, `FCLASS_CN = Admin-1 region`). A 1:110m sono dentro la Cina. | poligoni a sé |
| Crimea | Russia | **Ucraina** |
| Donetsk | Ucraina | Ucraina |
| Sahara Occidentale | Marocco | **Sahara Occidentale** a sé |
| Kashmir, Aksai Chin | India, Cina | India, Cina |
| Kosovo | a sé, `ISO_A3 = -99` | a sé (`FCLASS_IT = Admin-0 country`) |
| Cipro del Nord | a sé | segnato `Unrecognized` |

- **Conseguenze per la mappa:**
  - Hong Kong e Macao vanno uniti alla Cina, come decide il ticket 06.
  - Taiwan resta un poligono a sé, colorato come «Altri».
  - Le chiavi da usare sono `ADM0_A3` o `ISO_A3_EH`, non `ISO_A3`: in `ISO_A3` Francia e Norvegia valgono `-99`.
- **Il punto più delicato** è la Crimea. Un sito italiano che usa la versione standard la mostra come russa. Le soluzioni sono due:
  - semplificare `ne_10m_admin_0_countries_ita` nel build, per esempio con mapshaper;
  - partire da 1:50m e assegnare all'Ucraina il poligono «Crimea» di `ne_50m_admin_0_breakaway_disputed_areas` («Admin. by Russia; Claimed by Ukraine»).

### GISCO di Eurostat (scartata)

- Ha confini con il punto di vista UE, ma i termini dicono «the data will not be used for commercial purposes» e chiedono l'avviso «© EuroGeographics for the administrative boundaries», tradotto, nella legenda e nella pagina introduttiva.
- Si potrebbe usare, perché il sito non è commerciale, ma aggiunge vincoli che Natural Earth non ha.

## 5. Cosa resta incerto

- **ETO e la lettura automatica.** Non so se scaricare il CSV da GitHub, dove ETO stesso lo pubblica, conti come «automated» per i termini. Va chiesto a ETO, oppure si usa una copia fatta a mano.
- **ETO e i dati di terzi.** Le quote vengono da TechInsights e SIA, ma ETO non le segna come materiale di terzi. Non so cosa comprenda «Europe» nelle tre fasi.
- **USGS, il CSV.** Non l'ho potuto leggere perché ScienceBase era bloccato. La copertura viene dal PDF, e nel CSV i nomi dei Paesi e le note vanno controllati al primo download.
- **RMIS ed EUR-Lex.** Non erano raggiungibili dai client automatici: non ho verificato i dati di RMIS né il testo degli allegati del regolamento. Non ho verificato neanche la data della prossima lista UE.
- **Epoch *AI data centers*.** Copre il 44% del calcolo e si sta allargando: la mappa può cambiare molto da un mese all'altro, soprattutto fuori dagli USA. L'Italia oggi ha zero siti.
- **Fonderie.** Non esiste una fonte aperta e aggiornata sulla capacità per Paese. ETO ha solo il dato SIA del 2022.

## Metodo

- **File scaricati il 22/10/2026**, tra le 11:22 e le 11:34 UTC, in una cartella temporanea fuori dal repo:
  - Epoch AI:
    - `https://epoch.ai/data/gpu_clusters.csv` (304.311 byte);
    - `https://epoch.ai/data/data_centers/data_centers.zip` (117.730 byte, file interni del 22/10/2026);
    - `https://epoch.ai/data/ai_chip_sales.zip`, `ai_chip_owners.zip`, `ai_chip_components.zip` e `ml_hardware.zip`, tutti da `https://epoch.ai/data/`;
  - TOP500: `https://www.top500.org/lists/top500/2026/06/download/TOP500_202606.xlsx` (132.935 byte);
  - ETO: `inputs.csv`, `providers.csv`, `provision.csv`, `stages.csv`, `sequence.csv`, `README.md` e `technical_notes.md` da `https://raw.githubusercontent.com/georgetown-cset/eto-supply-chain/main/data/`, più `LICENSE.md` dalla radice del repo;
  - USGS: `https://pubs.usgs.gov/periodicals/mcs2026/mcs2026.pdf` (17.646.709 byte) e i metadati `https://data.usgs.gov/datacatalog/metadata/USGS.69837e43b66b01367d7ec7c7.xml` e `USGS.69837ec8b66b01367d7ec7d9.xml`;
  - UE:
    - lo studio CRM 2023, `https://op.europa.eu/o/opportal-service/download-handler?identifier=57318397-fdd4-11ed-a05c-01aa75ed71a1&format=pdf&language=en&productionSystem=cellar`;
    - il rapporto sui data center di luglio 2025, `identifier=83be4c3e-5c79-11f0-a9d0-01aa75ed71a1`;
  - Natural Earth: `ne_110m_admin_0_countries.geojson`, `ne_50m_admin_0_countries.geojson`, `ne_10m_admin_0_countries_ita.geojson` e `ne_50m_admin_0_breakaway_disputed_areas.geojson`, da `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/9380cca83db5f9aef52d5e762765100745f84b27/geojson/`;
  - OECD: le pagine HTML dei capitoli 3 e 5 di *The chip landscape*.
- **Accessi falliti:**
  - ScienceBase (`https://www.sciencebase.gov/catalog/item/69837e43b66b01367d7ec7c7`): 403 con la pagina Cloudflare;
  - RMIS (`https://rmis.jrc.ec.europa.eu/critical-and-strategic-materials`): 403 «This url is blocked»;
  - EUR-Lex (`CELEX:32024R1252`): 202 con risposta vuota.
- **Script** (fuori dal repo, lanciati con `python -I`, con i percorsi passati come argomenti):
  - `scarica.py`: i download, con l'ora in UTC;
  - `unzip_all.py`: estrae gli ZIP senza percorsi fuori cartella;
  - `headers.py`: le intestazioni dei CSV;
  - `copertura_epoch_hw.py`: aree e Paesi di *GPU clusters* e *AI data centers*, le fonderie di *ML hardware* e le organizzazioni di *AI chip sales*;
  - `copertura_top500.py`, con il lettore XLSX della libreria standard `xlsx_lite.py`: TOP500 per Paese e area;
  - `copertura_eto.py`: anni, fonti e quote per Paese di ETO;
  - `mcs_paesi.py`: i Paesi nelle tabelle mondiali del testo di MCS, estratto con `pdftotext -layout`;
  - `natural_earth.py` e `ne_punti.py`: i campi di Taiwan, Hong Kong e dei territori contesi, i Paesi UE presenti e il test con un punto dentro ogni poligono (Simferopoli, Donetsk, Srinagar, Aksai Chin, Laayoune, Taipei, Hong Kong, Valletta).
- **Regole:**
  - le aree vengono da `regions_of()`, importata da `pipeline/epoch.py` al commit `490aea7`. In più, come decide il ticket 06, **Hong Kong va nella Cina**: `regions_of()` da sola lo metterebbe in «Altri»;
  - le righe senza Paese stanno a parte;
  - le quote sono sul totale del file, non sul totale mondiale, tranne ETO e USGS, che danno già quote mondiali;
  - i numeri del rapporto UE sui data center sono letti con `pdftotext -raw`, perché con `-layout` le colonne si sfasano.

## Fonti

Tutte consultate il 22 ottobre 2026.

- Epoch AI, *AI data centers*: https://epoch.ai/data/ai-data-centers. File: https://epoch.ai/data/data_centers/data_centers.zip
- Epoch AI, *GPU clusters*: https://epoch.ai/data/gpu-clusters. File: https://epoch.ai/data/gpu_clusters.csv
- Epoch AI, elenco dei dataset: https://epoch.ai/data. Inoltre *AI chip sales* (https://epoch.ai/data/ai-chip-sales), *AI chip owners*, *AI chip components* e *Machine learning hardware*, con i loro ZIP in https://epoch.ai/data/
- TOP500, lista di giugno 2026: https://www.top500.org/lists/top500/2026/06/. Impressum: https://www.top500.org/imprint/
- ETO, documentazione del dataset: https://eto.tech/dataset-docs/chipexplorer. Termini d'uso: https://eto.tech/tou. Dati e licenza: https://github.com/georgetown-cset/eto-supply-chain
- Creative Commons, *Attribution-NonCommercial 4.0 International*, §1(i), §2(a)(1), §3(a)(1): https://creativecommons.org/licenses/by-nc/4.0/legalcode.en
- OECD, *The chip landscape: Geographical distribution of wafer fabrication capacity* (2025): https://doi.org/10.1787/02dbd028-en. Capitolo sulle fonti: https://www.oecd.org/en/publications/the-chip-landscape_02dbd028-en/full-report/component-5.html
- UN Comtrade, *FAQs on use and re-dissemination*: https://uncomtrade.org/docs/faqs-on-use-and-re-dissemination/
- IEA, termini d'uso: https://www.iea.org/terms e https://www.iea.org/terms/terms-of-use-for-non-cc-material. *Key Questions on Energy and AI*: https://www.iea.org/data-and-statistics/data-product/key-questions-on-energy-and-ai
- Our World in Data, *Share of total electricity demand coming from data centers*: https://ourworldindata.org/grapher/data-centers-share-electricity-demand. Pagina sull'AI: https://ourworldindata.org/artificial-intelligence
- Commissione europea, prestazioni energetiche dei data center: https://energy.ec.europa.eu/topics/energy-efficiency/energy-efficiency-targets-directive-and-rules/energy-efficiency-directive/energy-performance-data-centres_en. Rapporto del luglio 2025: https://op.europa.eu/en/publication-detail/-/publication/83be4c3e-5c79-11f0-a9d0-01aa75ed71a1
- USGS, *Mineral Commodity Summaries 2026*: https://pubs.usgs.gov/periodicals/mcs2026/mcs2026.pdf. Data release: https://www.usgs.gov/data/mineral-commodity-summaries-2026-data-release (DOI https://doi.org/10.5066/P1WKQ63T). Metadati: https://data.usgs.gov/datacatalog/metadata/USGS.69837e43b66b01367d7ec7c7.xml
- USGS, *Copyrights and credits*: https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits
- Commissione europea, materie prime critiche: https://single-market-economy.ec.europa.eu/sectors/raw-materials/areas-specific-interest/critical-raw-materials_en. *Study on the critical raw materials for the EU 2023*: https://op.europa.eu/en/publication-detail/-/publication/57318397-fdd4-11ed-a05c-01aa75ed71a1. Avviso legale: https://commission.europa.eu/legal-notice_en
- JRC, RMIS: https://rmis.jrc.ec.europa.eu/critical-and-strategic-materials (non raggiungibile)
- BGS, termini delle statistiche minerarie: https://www.bgs.ac.uk/mineralsuk/statistics/world-mineral-statistics/bgs-mineral-statistics-terms-and-conditions-ipr/
- Natural Earth, termini d'uso: https://www.naturalearthdata.com/about/terms-of-use/. Admin-0 a 1:10m: https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/. Repo e release: https://github.com/nvkelso/natural-earth-vector
- `world-atlas` 2.0.2: https://unpkg.com/world-atlas@2.0.2/README.md
- Eurostat GISCO, unità amministrative e condizioni: https://ec.europa.eu/eurostat/web/gisco/geodata/administrative-units
- Ricerche precedenti di questa mappa: `docs/research/fonte-capacita.md` (ramo `research/fonte-capacita`) e `docs/research/capacita-artificial-analysis.md` (ramo `research/capacita-artificial-analysis`).
