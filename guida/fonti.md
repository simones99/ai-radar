# Fonti e licenze

Dati di [Epoch AI](https://epoch.ai/data/ai-models) (CC BY 4.0), [arXiv](https://arxiv.org) (grazie ad arXiv per l'accesso aperto ai metadati), [GitHub](https://github.com), [Hugging Face](https://huggingface.co), [The Adzuna API](https://www.adzuna.co.uk), [Eurostat](https://ec.europa.eu/eurostat), [USGS](https://pubs.usgs.gov/periodicals/mcs2026/mcs2026.pdf) (pubblico dominio), [Commissione europea](https://op.europa.eu/en/publication-detail/-/publication/57318397-fdd4-11ed-a05c-01aa75ed71a1) (CC BY 4.0) ed [ETO](https://eto.tech/dataset-docs/chipexplorer) (CC BY-NC 4.0, quindi solo per un uso non commerciale: vedi [ADR 0001](https://github.com/simones99/ai-radar/blob/main/docs/adr/0001-dati-eto-in-cc-by-nc.md)). I confini della mappa sono di Natural Earth (pubblico dominio). Le notizie mostrano solo titolo, data e link agli articoli originali. Il progetto non è affiliato a nessuna delle fonti.

Our World in Data pubblica in CC BY 4.0, ma i dati restano dei produttori originali, sempre citati: le serie dell'AI Index (Stanford HAI: investimenti, imprese che usano l'AI, annunci di lavoro) sono CC BY-ND 4.0 e vanno citate senza modifiche; le cifre di IEA, NVIDIA e TSMC restano dei produttori. La licenza di ogni serie è nel campo `licenza` di `config/sources.yaml` e compare in pagina accanto alla fonte.

## Un numero che non torna

Ogni numero si può ricontrollare sulla sua fonte. Se non corrisponde, la sezione *Stato delle fonti*, in fondo all'app, porta con «Segnalalo su GitHub» al modello di issue [«Un numero non torna»](https://github.com/simones99/ai-radar/issues/new?template=un-numero-non-torna.yml). Il modello chiede tre cose, tutte obbligatorie: la card, il numero visto, con la sua unità e il periodo, e la fonte controllata, con il link e il numero trovato lì. Il modello sta in `.github/ISSUE_TEMPLATE/un-numero-non-torna.yml`, e il suo elenco delle card segue le etichette di `web/src/lib/tiles/registry.ts`: una card nuova o rinominata va anche lì, e un test lo controlla. Il link dell'app usa l'indirizzo delle issue di `TITOLARE` in `web/src/lib/text/privacy.ts`, quindi una copia del progetto che lo cambia riceve le segnalazioni nel proprio repository.

## Codice, font e foto

Codice con licenza MIT (vedi [`LICENSE`](https://github.com/simones99/ai-radar/blob/main/LICENSE)). D3 (ISC), Svelte (MIT) e il font Bricolage Grotesque (OFL) arrivano da npm; i testi delle loro licenze sono in `web/public/THIRD_PARTY_LICENSES.txt`, linkato in fondo alla pagina. Le foto sono da Wikimedia Commons, con autore e licenza indicati in pagina.

Questa guida è costruita con [Zensical](https://zensical.org) (MIT). Usa lo stesso font dell'app, Bricolage Grotesque, con la sua licenza OFL in [`guida/font/OFL.txt`](https://github.com/simones99/ai-radar/blob/main/guida/font/OFL.txt).
