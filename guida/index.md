# AI Radar

![La home di AI Radar il 24 novembre 2026, settimana del 23 novembre. A sinistra le due porte: Per te, «Slancio di LLMOps da +30% a −10%», e Per la tua organizzazione, «Tra 8 giorni: vietate le app che spogliano», scadenza dell'AI Act del 2 dicembre 2026. A destra il radar delle competenze nei quattro quadranti, con Agenti AI, RAG e Multimodali in Impara ora.](immagini/home.png#only-light)
![La home di AI Radar il 24 novembre 2026, in tema scuro.](immagini/home-scura.png#only-dark)

La dashboard è su [simones99.github.io/ai-radar](https://simones99.github.io/ai-radar/). Questa guida dice come si legge, come se ne pubblica una copia e come si mantiene.

Una dashboard pubblica con due teste, su dati aperti che si aggiornano da soli ogni settimana:

1. **Su cosa formarti**, per le persone. Un radar di 16 competenze che incrocia ricerca (arXiv), open source (GitHub) e mercato del lavoro (Adzuna), con un confronto tra Europa e USA. Accanto, i temi che lo alimentano: modelli e ricerca, open source, notizie dai laboratori e dalle newsletter di riferimento. Vedi [Come si legge il radar](radar.md).
2. **L'AI in Italia**, per le organizzazioni. Un osservatorio con l'Italia in primo piano. La card che apre la testa è **GeopoliticAI**: dove stanno l'Italia e l'Europa, rispetto a USA e Cina, in ogni anello della catena dell'AI, dalle materie prime ai chip, ai data center, ai modelli (vedi [Come si legge GeopoliticAI](geopoliticai.md)). Accanto: imprese che usano l'AI, persone e lavoro, scadenze dell'AI Act, rapporti in arrivo.

In home due porte, *Per te* e *Per la tua organizzazione*, danno la notizia della settimana di ciascuna testa e con un clic aprono la card da cui viene. Sotto ci sono le card, 4 e 5: Competenze, Modelli e ricerca, Open source, Notizie; GeopoliticAI, Business, Persone e lavoro, Norme, Rapporti.

Ogni lunedì esce anche un'**edizione**: il riassunto fisso della settimana, con un suo indirizzo, un archivio e un feed RSS. Vedi [Edizioni, feed e correzioni](edizioni.md).

## Come gira

Tutto gira gratis su GitHub: GitHub Actions raccoglie i dati ogni lunedì, o con un avvio manuale, e GitHub Pages pubblica la pagina.

```
fonti pubbliche
      │
      ▼
pipeline Python          GitHub Actions, ogni lunedì
      │
      ▼
data/*.json ──┬──► app Svelte (D3) ─────────────┐
              │                                 ├──► GitHub Pages
              └──► data/edizioni/ ──► pagine,   │
                   testo fisso e      archivio, │
                   immagine           feed ─────┘
```

## Da dove partire

- Per leggere il sito: [il radar](radar.md), [GeopoliticAI](geopoliticai.md), [le edizioni](edizioni.md).
- Per pubblicarne una copia: [Pubblicarlo in 10 minuti](pubblicare.md), poi [Chiavi e Adzuna](chiavi.md) e [Le visite](visite.md).
- Per cambiarlo: [Personalizzare](personalizzare.md), [Provarlo in locale](in-locale.md), [Struttura e robustezza](struttura.md).
- Per sapere da dove vengono i dati e perché si è scelto così: [Fonti e licenze](fonti.md), [Decisioni e ricerche](decisioni.md).
