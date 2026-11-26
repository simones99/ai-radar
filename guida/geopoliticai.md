# Come si legge GeopoliticAI

GeopoliticAI risponde a una domanda: in quali passaggi dell'AI l'Europa e l'Italia contano, e in quali dipendono da altri. Con i dati del 23 novembre 2026, per esempio:

- l'81,5% del mercato delle macchine di litografia è di aziende con sede nei Paesi Bassi, e le macchine EUV, necessarie per i chip più avanzati, le fa solo ASML;
- nei siti noti a Epoch AI, cioè i data center AI che conta uno per uno, l'UE ha lo 0,5% del calcolo, gli USA l'86,3%. Sono però solo i siti che Epoch conosce, circa il 44% del calcolo AI mondiale e quasi tutti negli USA. Un'altra stima di Epoch, [*AI chip imports*](https://epoch.ai/data/ai-chip-imports), conta i chip AI arrivati in ogni Paese dal 2022 a giugno 2026: lì l'UE ha circa il 5% del calcolo, gli USA il 72%, la Cina il 10%. La card usa la prima, e accanto a ogni quota scrive «nei siti noti a Epoch»: lo 0,5% non è la quota dell'UE nel mondo;
- il miglior modello europeo del 2026, Mistral Large 4, arriva a 154,6 sull'Epoch Capabilities Index; il migliore degli USA a 173,4, quello della Cina a 161,2;
- la Cina produce il 99% del gallio e l'87% del silicio metallico del mondo.

Questi numeri sono fermi al 23 novembre. Materie prime e chip cambiano solo quando cambiano le fonti; data center e modelli invece ogni lunedì, e i valori aggiornati sono nella card.

## I sei anelli

La catena ha sei **anelli**. Ognuno ha la sua misura, e gli anelli non si sommano:

| Anello | Misura | Fonte | Si aggiorna |
| --- | --- | --- | --- |
| Materie prime | quota della produzione mondiale di gallio, terre rare e silicio metallico; quota della raffinazione del germanio | USGS, *Mineral Commodity Summaries 2026*; Commissione europea, studio sulle materie prime critiche 2023 | a mano, a ogni nuova edizione delle fonti |
| Progettazione dei chip | quota del valore dei chip progettati, per sede dell'azienda | ETO, *Advanced Semiconductor Supply Chain Dataset* (dato 2022) | a mano |
| Fabbricazione dei chip | quota della capacità produttiva, per luogo dello stabilimento | ETO (dato 2022) | a mano |
| Macchinari | quota del mercato delle macchine di litografia, per sede dell'azienda | ETO (dato 2025) | a mano |
| Data center | quota degli H100 equivalenti dei siti noti a Epoch, operativi o in costruzione | Epoch AI, *AI data centers* | ogni lunedì |
| Modelli | capacità (Epoch Capabilities Index) e calcolo di addestramento dei modelli nazionali | Epoch AI, *AI models* | ogni lunedì |

## Cosa c'è nella card

- **Chi controlla la catena dell'AI**: una mappa che si apre sul **filo della catena**, un esempio scelto da noi e non un dato: segue un modello USA, UE o cinese attraverso i sei anelli, con una tappa per anello e la sua fonte. Con un clic mostra invece la quota di ogni Paese, anello per anello.
- **La scheda di un'area**: USA, Cina, Regno Unito, UE, Altri, o un singolo Paese UE, Italia compresa, con la capacità del miglior modello e il calcolo di addestramento del più grande.
- **Calcolo e capacità per area, anno per anno**: la stessa misura in una tabella che si confronta in orizzontale.
- **Chi addestra i modelli di grande scala**: la quota dei modelli sopra 10²³ FLOP usciti ogni anno, per area.

Un link apre una vista precisa, per esempio [il filo dell'UE](https://simones99.github.io/ai-radar/#geopoliticai?filo=ue) o [le quote per Paese](https://simones99.github.io/ai-radar/#geopoliticai?vista=quote).

## Limiti

- per progettazione e fabbricazione non esiste una fonte aperta più recente del dato 2022 di ETO;
- *AI data centers* copre circa il 44% del calcolo AI mondiale, quasi tutto negli USA, e oggi non ha siti in Italia. Il censimento più vecchio di Epoch, *GPU clusters*, fermo a marzo 2026, conta in Italia 9 cluster, tra cui Leonardo al CINECA. Un cluster non è un sito, e non entra nelle quote: la mappa lo dice in una nota, come fotografia datata;
- Epoch non conta nessun modello italiano: Minerva (Sapienza), Velvet (Almawave) e i modelli di iGenius non sono nel suo database, e la scheda dell'Italia lo dice;
- energia e acqua non sono un anello.

Le scelte sulle fonti, con quelle scartate e perché, sono in [`docs/research/fonti-mappa.md`](https://github.com/simones99/ai-radar/blob/main/docs/research/fonti-mappa.md).
