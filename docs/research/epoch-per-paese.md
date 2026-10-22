# Cosa dice Epoch per Paese

Ricerca per il ticket *01: Cosa dice Epoch per Paese* della mappa GeopoliticAI. Dati scaricati il 22 ottobre 2026.

## Sintesi

1. **Paesi UE e Italia.** Nel `notable_ai_models.csv`, dal 2016, l'UE ha 76 modelli: Francia 44 (27 con il calcolo), Germania 19 (12), poi nove Paesi con 1-4 modelli. L'**Italia ne ha zero**. Dopo il 2023 l'UE quasi sparisce: 5 modelli nel 2024, 1 nel 2025, 0 nel 2026, e **nessuno con il calcolo**. Il calcolo massimo dell'UE nel notable si ferma a 7,7e23 FLOP (Mixtral 8x7B, 2023). Nello stesso file gli USA arrivano a 9,4e26 nel 2026 e la Cina a 2,0e25.
2. **Modelli con più Paesi.** La colonna ha un Paese per organizzazione, separato da virgole e ripetuto (`United States of America,France,France`). Ci sono anche il valore `Multinational` e organizzazioni con due Paesi: *Facebook AI Research* vale `United States of America,France`. `regions_of()` conta il modello una volta in ogni area che compare, senza pesi, come dice il glossario. Dal 2016 ci sono 97 modelli in più aree. Quattro problemi: 53 dei 76 modelli UE sono condivisi con altre aree, e 33 contengono Meta/Facebook; nel grafico (`punti`) ogni modello va solo alla prima area, quindi 38 punti UE finiscono tra gli USA; Hong Kong e Taiwan vanno in «Altri», non in Cina; un modello senza Paese viene contato in «Altri».
3. **Copertura del calcolo 2023-2026.** In media il 42% dei modelli notevoli ha il calcolo, e la quota scende ogni anno: 55% nel 2023, 25% nel 2026. Il buco pesa più sugli USA (36%, 14% nel 2026) che sulla Cina (53%). Per l'UE è totale dal 2024: 0 modelli su 6 hanno il calcolo, e sono quasi tutti Mistral. Il Regno Unito ha 10 modelli in quattro anni.
4. **Italia.** Minerva (Sapienza), Velvet (Almawave), Italia (iGenius) e Modello Italia **non ci sono in nessun file di Epoch**: ho cercato i nomi in tutte le colonne. Nel notable l'Italia compare solo prima del 2016, con tre modelli accademici (1994, 2008, 2013). In `all_ai_models.csv` dal 2016 ci sono 9 modelli con un'organizzazione italiana, tutti di ricerca biologica. Tre hanno il calcolo, ma il più grande (P-LLama3, 7,2e23) è un fine-tuning che si porta dietro il calcolo di Llama 3.
5. **«Altri».** Nel notable 2024-2026 finiscono in «Altri» 21 modelli: **Corea del Sud 14**, Arabia Saudita 2, e un modello a testa per Hong Kong, Israele, Singapore e Australia, più uno senza Paese. Con il calcolo dalla Corea arrivano quasi tutti i punti recenti. Canada, Giappone ed Emirati sono a zero nel notable 2024-2026; nel large-scale gli Emirati ne hanno 5.
6. **Fonte.** Per il **calcolo** il dataset *large-scale* (≥1e23 FLOP) è più adatto del notable. Copre meglio Cina e UE: nel 2023-2026 ha 201 modelli cinesi contro i 118 del notable, e 24 dell'UE contro 18. Inoltre nel 2024-2025 dà all'UE 11 modelli con il calcolo, contro 0. Il *frontier* è inutile per l'UE: non ha nessun modello UE dal 2016. La licenza è CC BY 4.0. Epoch chiede di citare la fonte e gli autori («Epoch AI, 'Data on AI models'», con URL e data di accesso). La licenza chiede anche il link alla licenza e di dire se i dati sono stati modificati: aggregarli per area lo è.

**In breve:** Epoch regge per USA e Cina, ma per l'UE dal 2024 il notable non basta e l'Italia non c'è. Una card onesta deve usare il large-scale (o `all_ai_models` filtrato) per il calcolo, dire chiaramente che l'Italia ha zero modelli, e decidere come attribuire i modelli congiunti, soprattutto quelli di Meta con Parigi.

## Metodo

- File scaricati il 22 ottobre 2026 da `https://epoch.ai/data/`: `notable_ai_models.csv` (1.078 righe, «Updated Oct. 16, 2026»), `all_ai_models.csv` (3.628), `large_scale_ai_models.csv` (532, «Oct. 15»), `frontier_ai_models.csv` (138, «Oct. 15»). L'ultima `Last modified` in `all` è 2026-10-19, e l'ultima data di pubblicazione nel notable è 2026-09-30. Il 2026 è quindi un anno parziale.
- L'anno è `Publication date[:4]`. Un modello ha il calcolo se `Training compute (FLOP)` è un numero > 0, la stessa regola di `_float()` della pipeline.
- Le aree vengono da `regions_of()`, importata da `pipeline/epoch.py` (commit `490aea7`). Un modello senza area conta in «Altri», come fa `aggregate()`. Il conteggio per area dal 2016 coincide con `data/epoch.json` (`per_anno`): nessuna differenza. `parse()` legge anch'essa 1.078 modelli.
- Per i Paesi singoli divido la colonna sulle virgole e tolgo i doppioni. Un modello conta una volta per ogni Paese, e i calcoli **totali** attribuiscono l'intero calcolo del modello a ogni Paese o area che lo contiene: i totali delle aree quindi non si sommano.
- Notazione: `n/c` = modelli / modelli con il calcolo; `·` = nessun modello; `–` = nessun calcolo.

## 1. Modelli e calcolo per Paese e per area

### Paesi UE per anno (notable, `n/c`)

Ci sono solo i Paesi UE con almeno un modello dal 2016, più l'Italia.

| Paese | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 | Totale |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Austria | · | · | · | · | 1/0 | · | · | · | · | · | · | 1/0 |
| Belgio | 1/0 | · | 1/1 | · | · | · | · | · | · | · | · | 2/1 |
| Cechia | · | 1/1 | · | · | · | · | · | · | · | · | · | 1/1 |
| Danimarca | · | 1/1 | 1/0 | · | · | · | · | · | · | · | · | 2/1 |
| Finlandia | · | · | · | 1/0 | · | 2/2 | · | 1/0 | · | · | · | 4/2 |
| Francia | 5/0 | 3/1 | 2/2 | 7/6 | 5/4 | 10/9 | 2/1 | 5/4 | 4/0 | 1/0 | · | 44/27 |
| Germania | 2/1 | 1/0 | 1/1 | 1/1 | 2/1 | 5/3 | 2/2 | 4/3 | 1/0 | · | · | 19/12 |
| **Italia** | · | · | · | · | · | · | · | · | · | · | · | **0/0** |
| Paesi Bassi | · | · | · | · | · | · | · | 2/2 | · | · | · | 2/2 |
| Polonia | · | 2/2 | · | · | · | · | · | · | · | · | · | 2/2 |
| Spagna | · | · | · | · | · | · | · | 1/1 | · | · | · | 1/1 |
| Svezia | · | · | · | · | · | · | · | 2/1 | · | · | · | 2/1 |

Gli altri 15 Paesi UE non hanno modelli notevoli dal 2016.

### Paesi UE: calcolo massimo e totale (notable, anni con modelli)

| Paese | Anno | n/c | Calcolo max (FLOP) | Calcolo totale (FLOP) | Modelli |
|---|---|---|---|---|---|
| Francia | 2016 | 5/0 | – | – | DTN, Wide Residual Network, DenseNet-264, SimpleNet, Character-enriched word2vec |
| Francia | 2017 | 3/1 | 2,1e18 | 2,1e18 | RetinaNet-R101, RetinaNet-R50, Mask R-CNN |
| Francia | 2018 | 2/2 | 4,8e20 | 5,2e20 | Transformer (Adaptive Input Embeddings), Big Transformer for Back-Translation |
| Francia | 2019 | 7/6 | 8,3e20 | 1,7e21 | DD-PPO, Sandwich Transformer, CamemBERT, kNN LM, AlphaX-1, LayerDrop, Pluribus |
| Francia | 2020 | 5/4 | 5,1e21 | 6,8e21 | ESM1b, KEPLER, DeLighT, SemExp, Feedback Transformer |
| Francia | 2021 | 10/9 | 3,4e22 | 1,0e23 | XGLM-7.5B, Contriever, MAE ViT-H, XLMR-XXL, SEER, HuBERT, DeiT-B e altri |
| Francia | 2022 | 2/1 | 3,7e23 | 3,7e23 | mT0-13B, BLOOM-176B |
| Francia | 2023 | 5/4 | 7,7e23 | 7,8e23 | Mixtral 8x7B, SeamlessM4T, MultiBand Diffusion, DINOv2, Incoder-6.7B |
| Francia | 2024 | 4/0 | – | – | Pixtral Large, Mistral Large 2, Mathstral, Mistral Large |
| Francia | 2025 | 1/0 | – | – | Mistral OCR |
| Germania | 2016 | 2/1 | 1,3e17 | 1,3e17 | EnhanceNet, GAWWN |
| Germania | 2017 | 1/0 | – | – | TriNet |
| Germania | 2018 | 1/1 | 2,8e18 | 2,8e18 | TrellisNet |
| Germania | 2019 | 1/1 | 6,4e17 | 6,4e17 | UDSMProt |
| Germania | 2020 | 2/1 | 1,4e21 | 1,4e21 | VQGAN + CLIP, German ELECTRA Large |
| Germania | 2021 | 5/3 | 3,9e22 | 5,8e22 | LDM-1.45B, Projected GAN, ProtT5-XL-U50, ProtBERT-BFD, Rational DQN |
| Germania | 2022 | 2/2 | 5,0e22 | 5,1e22 | GenSLM, Stable Diffusion |
| Germania | 2023 | 4/3 | 8,5e22 | 9,9e22 | StarCoder, PaLM-E, Ankh_large, Nucleotide Transformer |
| Germania | 2024 | 1/0 | – | – | DeepL LLM |
| Finlandia | 2019 | 1/0 | – | – | StyleGAN2 |
| Finlandia | 2021 | 2/2 | 2,4e21 | 4,1e21 | StyleGAN3-T, StyleGAN3-R |
| Finlandia | 2023 | 1/0 | – | – | BLUUMI |
| Paesi Bassi | 2023 | 2/2 | 8,5e22 | 8,5e22 | StarCoder, DDPM-IP |
| Spagna | 2023 | 1/1 | 8,5e22 | 8,5e22 | StarCoder |
| Svezia | 2023 | 2/1 | 8,5e22 | 8,5e22 | StarCoder, LEP-AD |
| Polonia | 2017 | 2/2 | 9,4e19 | 9,4e19 | Fraternal dropout + AWD-LSTM, MoE-Multi |
| Belgio | 2016 / 2018 | 1/0, 1/1 | 9,8e14 (2018) | 9,8e14 | SimpleNet, LSTM+NeuralCache |
| Danimarca | 2017 / 2018 | 1/1, 1/0 | 5,8e17 (2017) | 5,8e17 | DeepLoc, NetSurfP-2.0 |
| Cechia | 2017 | 1/1 | 1,4e19 | 1,4e19 | DeepStack |
| Austria | 2020 | 1/0 | – | – | Hopfield Networks |

StarCoder ha 37 organizzazioni e conta, con lo stesso calcolo, per Germania, Paesi Bassi, Spagna e Svezia.

### Paesi UE per anno negli altri dataset (`n/c`)

Il notable sottostima l'UE recente. Gli altri due file la contano così.

**large-scale** (≥1e23 FLOP, anche «possibly»):

| Paese | 2022 | 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|
| Francia | 2/1 | 5/2 | 10/5 | 3/1 | · |
| Germania | 2/2 | · | 1/1 | 1/1 | · |
| Finlandia | · | 1/1 | 1/1 | · | · |
| Bulgaria | · | · | · | 1/1 | · |
| Polonia | · | · | · | 1/1 | · |
| Italia | · | · | · | · | · |

Prima del 2022 non ci sono modelli UE. I modelli: BLOOM-176B, Luminous, Mistral 7B/Medium/Large/Large 2/Small 3, Mixtral 8x7B e 8x22B, Codestral, Pixtral 12B, LightOn, Poro 34B, Viking, Pharia-1, Teuken 7B, MamayLM (INSAIT con l'ETH) e Lapa LLM. Lapa LLM è ucraino, con un'università polacca. Ci sono anche quattro modelli di Facebook AI Research, codificati USA + Francia.

**all_ai_models** (tutti i modelli):

| Paese | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Francia | 12/0 | 5/2 | 5/3 | 11/9 | 11/10 | 17/16 | 11/5 | 11/5 | 35/11 | 30/7 | 2/0 |
| Germania | 2/1 | 5/0 | 2/1 | 6/3 | 4/3 | 12/8 | 17/12 | 13/7 | 23/5 | 8/4 | · |
| Paesi Bassi | · | · | · | · | · | 4/1 | 1/0 | 10/10 | 4/2 | · | · |
| Svezia | · | · | · | · | · | 1/1 | 2/1 | 3/2 | 9/2 | · | · |
| Spagna | · | · | 3/3 | 1/0 | · | · | 1/1 | 3/2 | 4/2 | 1/1 | · |
| Austria | 1/0 | · | · | · | 1/0 | 1/0 | 2/2 | 5/1 | 1/1 | · | · |
| Polonia | · | 2/2 | · | · | · | 1/0 | · | · | 4/2 | 2/1 | · |
| **Italia** | · | · | · | · | 1/1 | · | 1/1 | · | 7/2 | · | · |
| Danimarca | · | 1/1 | 1/0 | · | · | · | 1/0 | 1/1 | 2/1 | · | · |
| Finlandia | · | · | · | 1/0 | · | 2/2 | · | 2/1 | 1/1 | · | · |
| Belgio | 1/0 | 2/2 | 3/1 | · | · | · | · | · | · | · | · |
| Grecia | · | · | · | · | · | 1/1 | · | · | · | 1/1 | · |
| Altri 8 Paesi UE (1 modello ciascuno) | | | | | | | | | | | |

Gli altri 8 sono Bulgaria, Croazia, Cechia, Ungheria, Irlanda, Lituania, Lussemburgo e Portogallo.

### Aree per anno (notable, `regions_of()`, `n/c`)

| Area | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| USA | 36/12 | 29/10 | 27/18 | 56/32 | 37/26 | 54/42 | 68/45 | 86/44 | 57/26 | 64/15 | 49/7 |
| Cina | 6/3 | 10/0 | 1/0 | 6/3 | 8/5 | 21/17 | 12/7 | 23/15 | 31/16 | 35/23 | 29/9 |
| UE | 7/1 | 8/5 | 5/4 | 9/7 | 8/5 | 17/14 | 4/3 | 12/8 | 5/0 | 1/0 | 0/0 |
| Regno Unito | 6/1 | 12/3 | 5/3 | 10/5 | 5/2 | 8/6 | 13/9 | 6/4 | 3/3 | 1/0 | 0/0 |
| Altri | 3/1 | 6/4 | 4/3 | 3/1 | 1/1 | 2/2 | 5/3 | 7/4 | 6/3 | 9/4 | 6/5 |
| Tutti (senza doppioni) | 49/16 | 55/20 | 37/24 | 68/38 | 50/33 | 79/62 | 91/60 | 119/65 | 98/46 | 107/40 | 84/21 |

**Calcolo massimo (FLOP)**

| Area | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| USA | 6,6e21 | 8,4e20 | 8,7e21 | 6,7e22 | 3,1e23 | 2,0e24 | 2,7e24 | 5,0e25 | 3,8e25 | 5,0e26 | 9,4e26 |
| Cina | 3,0e19 | – | – | 3,8e19 | 1,7e21 | 1,0e24 | 3,5e23 | 1,3e24 | 2,5e25 | 1,5e25 | 2,0e25 |
| UE | 1,3e17 | 9,4e19 | 4,8e20 | 8,3e20 | 5,1e21 | 3,9e22 | 3,7e23 | 7,7e23 | – | – | – |
| Regno Unito | 1,9e21 | 6,5e20 | 1,7e20 | 1,1e23 | 3,0e21 | 6,3e23 | 5,8e23 | 8,5e22 | 5,0e22 | – | – |
| Altri | 6,4e19 | 4,6e17 | 6,7e17 | 4,1e17 | 2,7e19 | 3,7e23 | 2,2e20 | 3,8e24 | 1,0e25 | 2,7e24 | 3,9e24 |

**Calcolo totale (FLOP; un modello in più aree conta per intero in ognuna)**

| Area | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| USA | 9,3e21 | 2,2e21 | 9,8e21 | 2,2e23 | 6,3e23 | 4,1e24 | 1,7e25 | 1,2e26 | 1,8e26 | 1,4e27 | 1,0e27 |
| Cina | 3,0e19 | – | – | 3,8e19 | 2,2e21 | 1,6e24 | 4,6e23 | 4,5e24 | 7,6e25 | 9,4e25 | 6,9e25 |
| UE | 1,3e17 | 1,1e20 | 5,3e20 | 1,7e21 | 8,2e21 | 1,6e23 | 4,2e23 | 8,8e23 | – | – | – |
| Regno Unito | 1,9e21 | 1,1e21 | 2,0e20 | 1,1e23 | 3,1e21 | 7,0e23 | 1,1e24 | 9,3e22 | 9,2e22 | – | – |
| Altri | 6,4e19 | 4,7e17 | 7,2e17 | 4,1e17 | 2,7e19 | 5,7e23 | 4,9e20 | 4,3e24 | 1,3e25 | 6,9e24 | 1,1e25 |

Il totale è una somma su un campione incompleto, che nel 2025-2026 ha il calcolo di meno di metà dei modelli: non è un indicatore stabile. Il massimo regge meglio.

**Calcolo massimo negli altri file (FLOP).** In `all_ai_models.csv` e nel large-scale, USA, Cina e Altri hanno gli stessi massimi del notable dal 2022. Cambiano l'UE e il Regno Unito:

| Area | 2022 | 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|
| UE (all e large-scale) | 3,7e23 BLOOM-176B | 7,7e23 Mixtral 8x7B | **2,3e24** Mixtral 8x22B | **1,2e24** Mistral Small 3 | – |
| Regno Unito (all) | 5,8e23 | 5,4e23 | 2,9e23 | 7,6e22 | – |

## 2. Modelli con più Paesi

**Com'è scritta la colonna.** La documentazione la definisce così (pagina *Records*): «Country/countries associated with the developing organization(s). **Multinational** is used to mark organizations associated with multiple countries.» È un campo a scelta multipla. Nel CSV i valori sono uniti da virgole, uno per organizzazione e nell'ordine della colonna `Organization`, con i doppioni (`United States of America,United States of America`). Ci sono eccezioni: 33 righe del notable non hanno tanti Paesi quante organizzazioni. Il caso più frequente è *Facebook AI Research*, una sola organizzazione codificata `United States of America,France` (11 modelli da sola, altri 10 insieme ad altre organizzazioni). `Multinational` compare in 4 modelli (3 di IEEE, tutti prima del 2017). Hong Kong e Taiwan sono Paesi a sé, distinti da `China`.

**Quanti casi (notable)**

| | Tutto il file | Dal 2016 | 2023-2026 |
|---|---|---|---|
| Modelli | 1.078 | 837 | 408 |
| Valore con virgola | 306 | – | – |
| Più di un Paese distinto | 168 | 142 | 36 |
| Più di un'area secondo `regions_of()` | 108 | 97 | 20 |
| Senza Paese | 19 | 1 (OpenEvidence Darwin, 2026) | 1 |

Combinazioni di aree dal 2016: USA+UE 46, USA+Cina 23, USA+Regno Unito 16, USA+Cina+UE 4, Cina+Regno Unito 4, USA+UE+Regno Unito 3, USA+Cina+Regno Unito 1.

**Come li tratta `regions_of()`.** Cerca nel testo i nomi di USA, Cina, i 27 Paesi UE (regex `\b{nome}`, con «Northern Ireland» tolto) e Regno Unito, e restituisce ogni area trovata una sola volta. «Altri» arriva solo se non ha trovato nessuna delle quattro. Quindi:

- In `per_anno` il modello **conta una volta per ogni area** in cui compare, senza pesi: è la regola del glossario («conta per ciascuno di quei Paesi»). Dentro un'area i doppioni non contano: due organizzazioni francesi valgono un modello UE.
- In `punti`, cioè il grafico del calcolo, il modello va **solo alla prima area** dell'ordine USA, Cina, UE, Regno Unito (`(m["aree"] or ["Altri"])[0]`). Dal 2016 i punti col calcolo che perdono un'area sono 38 per l'UE, 15 per la Cina e 11 per il Regno Unito. Un modello USA+Francia è sempre un punto USA. Così `per_anno` e `punti` seguono due regole diverse.
- Un Paese fuori dalle quattro aree sparisce se il modello ha anche un'organizzazione USA, Cina, UE o Regno Unito. Nel 2024-2026 succede a 4 modelli con Singapore, 2 con il Canada e 2 con Hong Kong.
- Hong Kong e Taiwan finiscono in «Altri». Nel notable riguarda SenseChat 5.5 (SenseTime, 2024) e quattro modelli della CUHK prima del 2018; nel frontier, SenseChat (2023).
- Un modello senza Paese: `regions_of()` restituisce `[]`, ma `aggregate()` lo conta comunque in «Altri».

**È un problema?** Per USA e Cina poco: nel 2023-2026 i modelli in più aree sono 20 su 408. Per l'UE sì. Dal 2016, 53 dei 76 modelli UE del notable sono condivisi con un'altra area, quasi sempre gli USA, e 33 contengono Meta o Facebook. Contando ogni modello in parti uguali tra le sue aree, l'UE scende da 76 a 48,3 modelli: −36%, contro −8% per gli USA (563 → 515,2), −9% per la Cina (182 → 165,2) e −18% per il Regno Unito (69 → 56,3). Lo stesso vale per i Paesi. La Francia del notable è in buona parte FAIR Parigi, e StarCoder (37 organizzazioni) dà 8,5e22 FLOP a quattro Paesi UE insieme. Nel large-scale, Lapa LLM (ucraino) entra nell'UE per un'università polacca.

## 3. Copertura del calcolo nei modelli recenti

**Notable, quota di modelli con il calcolo (`c/n`)**

| Area | 2023 | 2024 | 2025 | 2026 | 2023-2026 |
|---|---|---|---|---|---|
| USA | 44/86 (51%) | 26/57 (46%) | 15/64 (23%) | 7/49 (14%) | 92/256 (36%) |
| Cina | 15/23 (65%) | 16/31 (52%) | 23/35 (66%) | 9/29 (31%) | 63/118 (53%) |
| UE | 8/12 (67%) | 0/5 (0%) | 0/1 (0%) | 0/0 | 8/18 (44%) |
| Regno Unito | 4/6 (67%) | 3/3 (100%) | 0/1 (0%) | 0/0 | 7/10 (70%) |
| Altri | 4/7 (57%) | 3/6 (50%) | 4/9 (44%) | 5/6 (83%) | 16/28 (57%) |
| Tutti | 65/119 (55%) | 46/98 (47%) | 40/107 (37%) | 21/84 (25%) | 172/408 (42%) |

- Il buco cresce nel tempo per tutti, perché Epoch aggiunge il calcolo dopo la pubblicazione. Nel 2026 i 20 modelli cinesi senza calcolo sono quasi tutti entrati per `Discretionary`: Qwen 3.5-3.8, GLM-5.x, Kimi K2.6, MiniMax-M3, Tencent Hy3/Hy4.
- **Non pesa di più sulla Cina**, che anzi ha una copertura migliore degli USA. I laboratori USA di punta non dicono il calcolo, ed Epoch lo stima solo quando può. Pesa invece sull'**UE**: dal 2024 nessuno dei suoi 6 modelli notevoli ha il calcolo (Mistral Large, Mistral Large 2, Pixtral Large, Mathstral, Mistral OCR, DeepL LLM).
- Dei 236 modelli notevoli senza calcolo del 2023-2026, quelli che `all_ai_models.csv` segna «Possibly over 1e23 FLOP» sono, per area: USA 55, Cina 10, Altri 3, UE 2, Regno Unito 1.
- Confidenza dei valori presenti (2023-2026). USA: 52 Confident, 27 Likely, 13 Speculative. Cina: 36, 19, 8. UE: 5, 2, 1. Per la documentazione, Confident vuol dire entro 3×, Likely entro 10×, Speculative entro 30×.
- Nel 2023-2026 il **large-scale** dà all'UE 24 modelli con 14 calcoli, contro i 18/8 del notable, e alla Cina 201/135 contro 118/63. Nel 2024-2025 l'UE passa da 0 a 11 calcoli.

## 4. Italia

**Nel notable:** nessun modello italiano dal 2016. Prima ci sono solo:

| Modello | Organizzazione | Paesi | Data | Calcolo | Criterio |
|---|---|---|---|---|---|
| Selective Search | University of Trento, University of Amsterdam | Italia, Paesi Bassi | 2013-04 | – | Highly cited |
| GNN | University of Siena | Italia | 2008-12 | 1,6e9 | Historical significance, Highly cited |
| Ceramic-MLP | Sapienza Università di Roma | Italia | 1994-01 | 4,5e9 | Historical significance |

**Solo in `all_ai_models.csv`** (dal 2016, nessuno notevole, nessuno nel large-scale):

| Modello | Organizzazione | Data | Calcolo | Note |
|---|---|---|---|---|
| DDGemb | University of Bologna | 2024-09 | – | biologia |
| P-LLama3 | University of Siena | 2024-08 | 7,2e23 | fine-tuning di Llama 3-8B: il calcolo è quasi tutto quello di Meta (fine-tuning 7,9e17) |
| P-Mistral, P-Llama2, P-gemma | University of Siena | 2024-08 | – | fine-tuning, solo il calcolo del fine-tuning (~6,9e17) |
| Prot2Token | University of Missouri, Politecnico di Milano | 2024-06 | – | biologia |
| PLAPT | Wolfram Research, ASC27 e altri (USA, Italia, India) | 2024-02 | 3,9e22 | include i modelli base |
| DiffSBDD (CrossDocked) | EPFL, Cambridge, … University of Rome | 2022-10 | 2,7e20 | 8 organizzazioni, 6 Paesi |
| RNA structure prediction | SISSA, TU Munich e altri | 2020-11 | 1,8e18 | |

**Minerva (Sapienza), Velvet (Almawave), Italia (iGenius), Modello Italia (iGenius/CINECA):** nessuno è in Epoch. Ho cercato `minerva`, `velvet`, `igenius`, `almawave`, `modello italia`, `italia`, `cineca`, `sapienza`, `fastweb`, `domyn`, `llamantino`, `cerbero`, `maestrale`, `zefiro`, `dante`, `camoscio`, `fauno`, `anita` e `leonardo` in tutte le colonne di `all_ai_models.csv`. Gli unici risultati sono omonimi: Minerva 540B di Google, Leonardo AI (Australia), autori di nome Leonardo o Anita, e Ceramic-MLP del 1994. Quindi su Epoch l'Italia è a **zero modelli notevoli e zero modelli large-scale**. Per mostrarla «in modo onesto», la card può dire zero. Se vuole nominare Minerva o Velvet deve usare un'altra fonte, oppure segnalarli a Epoch (`data@epoch.ai`).

## 5. «Altri»

**Notable, modelli che `regions_of()` manda in «Altri», per Paese**

| Paese | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 | 2024-2026 | Dal 2016 | Con calcolo dal 2016 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Corea del Sud | · | 3 | 1 | 1 | · | 1 | 3 | 1 | 1 | 8 | 5 | **14** | 24 | 16 |
| Arabia Saudita | · | · | · | · | · | · | 1 | · | 2 | · | · | 2 | 3 | 2 |
| Hong Kong | 1 | 1 | · | · | · | · | · | · | 1 | · | · | 1 | 3 | 1 |
| Israele | · | 1 | · | · | · | 1 | · | · | 1 | · | · | 1 | 3 | 2 |
| Singapore | · | · | · | · | · | · | · | 2 | · | 1 | · | 1 | 3 | 0 |
| Australia | · | · | · | · | · | · | · | · | 1 | · | · | 1 | 1 | 0 |
| (senza Paese) | · | · | · | · | · | · | · | · | · | · | 1 | 1 | 1 | 0 |
| Giappone | · | 1 | 1 | · | · | · | 1 | 1 | · | · | · | 0 | 4 | 4 |
| Canada | 1 | · | · | · | 1 | · | · | 1 | · | · | · | 0 | 3 | 1 |
| Svizzera | · | · | · | 3 | · | · | · | · | · | · | · | 0 | 3 | 1 |
| Emirati Arabi Uniti | · | · | · | · | · | · | · | 2 | · | · | · | 0 | 2 | 2 |
| India | · | · | 1 | · | · | · | · | · | · | · | · | 0 | 1 | 1 |
| Russia | · | · | 1 | · | · | · | · | · | · | · | · | 0 | 1 | 1 |
| Multinational | 1 | · | · | · | · | · | · | · | · | · | · | 0 | 1 | 0 |

Nel 2024-2026 «Altri» ha 21 modelli. La Corea del Sud ne fa due terzi: EXAONE (LG), K-EXAONE, A.X (SK Telecom), Solar Open (Upstage), Motif-3, HyperCLOVA X SEED (NAVER), VAETKI (NC AI). Seguono l'Arabia Saudita (ALLaM 70B, Aramco Metabrain AI, 1,0e25), poi Jamba 1.5 (Israele), SenseChat 5.5 (Hong Kong), HRM (Singapore), Harrison.rad.1 (Australia) e OpenEvidence Darwin (senza Paese). Il massimo di «Altri» nel 2024 è il modello Aramco (1,0e25); nel 2026 è EXAONE 4.5 (3,9e24).

Negli altri file, sempre nel 2024-2026 (`n/c`):

- **large-scale:** Corea del Sud 11/11, Emirati 5/5, Canada 4/0, Hong Kong 3/0, Russia 2/1, Arabia Saudita 2/2, Svizzera, Israele, Giappone e Australia 1 ciascuno.
- **all:** senza Paese 43/4, Corea del Sud 34/23, Canada 21/3, Russia 20/5, Giappone 13/4, Thailandia 13/2, Hong Kong 13/2, Singapore 10/6, Israele 10/1, Emirati 7/5, Taiwan 6/1, Svizzera 5/1, India 5/1, Arabia Saudita 5/5, Australia 3/0, Indonesia 1/0, Iran 1/0.

Se «Altri» si divide, l'unica area che regge da sola su più anni è la Corea del Sud, che ha anche il calcolo quasi sempre. Gli altri Paesi hanno 1-5 modelli. Se Hong Kong e Taiwan vanno in Cina, «Altri» perde 1-3 modelli all'anno.

## 6. Quale dataset, e la licenza

**I dataset di Epoch** (pagina *Data on AI models* e documentazione):

| Dataset | Criterio | Righe | Dal 2016 per area (USA / Cina / UE / RU / Altri) |
|---|---|---|---|
| Notable | almeno un criterio di notabilità: SOTA, >5000 citazioni nella documentazione (>1000 nelle FAQ), costo >1 M$ 2023, >1 M utenti mensili, rilevanza storica, discrezione | 1.078 | 563 / 182 / 76 / 69 / 52 |
| Large-scale | addestrati con ≥1e23 FLOP, soglia fissa «used in some AI regulatory frameworks»; include i «Possibly over 1e23 FLOP» | 532 | 240 / 206 / 28 / 8 / 55 |
| Frontier | nei primi 5 per calcolo alla data di uscita | 138 | 58 / 5 / 0 / 5 / 5 |
| All | tutto il database | 3.628 | 1.714 / 926 / 325 / 224 / 387 |

- **Frontier** non serve per le aree. Dal 2016 non ha nessun modello UE, e dal 2023 fuori dagli USA ci sono solo Falcon-180B (Emirati), SenseChat (Hong Kong) e due GLM-4 (Cina, senza calcolo).
- **Large-scale** è il più adatto per il calcolo per area. Ha soglia fissa, contiene per definizione i modelli che pesano in FLOP, conta la Cina come USA (201 contro 213 nel 2023-2026) e dà all'UE Mistral, Aleph Alpha, LightOn, Silo AI e OpenGPT-X. I limiti: parte dal 2020 (prima nessun modello supera 1e23), il 2026 è indietro (19 USA e 12 Cina, contro 49 e 29 nel notable), e il 39% delle righe (208 su 532) non ha un calcolo puntuale (solo «possibly»). Notable e large-scale si sovrappongono poco: nel 2023-2026 hanno 161 modelli in comune su 408 e 488.
- **All** con il filtro «ha il calcolo» dà gli stessi massimi per area del large-scale dal 2022, più la serie storica dal 2016. È il file di ripiego della pipeline, ma la pipeline lo filtra su `Notability criteria`, e così dà 1.104 righe invece delle 1.078 del notable.
- **Licenza:** CC BY 4.0 (la pagina punta a `creativecommons.org/licenses/by/4.0/`). Epoch scrive: «free to use, distribute, and reproduce provided the source and authors are credited». La citazione suggerita è «Epoch AI, 'Data on AI models'. Published online at epoch.ai. Retrieved from 'https://epoch.ai/data/ai-models' [online resource]. Accessed 22 Oct 2026.», più un BibTeX (`author = {{Epoch AI}}`). La licenza (sezione 3(a)) chiede in più il link alla licenza, il link al materiale «to the extent reasonably practicable», e di **indicare se il materiale è stato modificato**. Raggruppare i Paesi in aree e attribuire i modelli congiunti è una modifica. Oggi `ModelliDetail.svelte` scrive «Fonte: Epoch AI (CC BY 4.0).» con il link alla pagina dei dati. Per la nuova card manca il link alla licenza e una frase del tipo «aggregato per area da AI Radar».

## Fonti

- Epoch AI, *Data on AI models*, https://epoch.ai/data/ai-models (aggiornata il 19 ottobre 2026; consultata il 22 ottobre 2026): definizioni dei dataset, licenza, citazione, FAQ.
- Epoch AI, *AI models documentation*, https://epoch.ai/data/ai-models-documentation, sezioni *Records* (definizioni di `Country (of organization)`, `Organization`, `Training compute (FLOP)`, `Frontier model`, `Possibly over 1e23 FLOP`) e *Inclusion* (criteri di notabilità). Consultata il 22 ottobre 2026.
- CSV scaricati il 22 ottobre 2026: https://epoch.ai/data/notable_ai_models.csv, https://epoch.ai/data/all_ai_models.csv, https://epoch.ai/data/large_scale_ai_models.csv, https://epoch.ai/data/frontier_ai_models.csv.
- Creative Commons, *Attribution 4.0 International, Legal Code*, sezione 3(a), https://creativecommons.org/licenses/by/4.0/legalcode.en.
- Repo: `pipeline/epoch.py` (`regions_of()`, `aggregate()`), `data/epoch.json` (dati del 21 ottobre 2026), `web/src/lib/tiles/ModelliDetail.svelte`, al commit `490aea7`.
