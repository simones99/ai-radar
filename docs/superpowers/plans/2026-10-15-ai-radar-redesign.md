# AI Radar: nuova dashboard a card — piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** sostituire la pagina statica `site/` con un'app Svelte a 8 card espandibili, alimentata dalla pipeline Python esistente più tre fonti nuove (Our World in Data, AI Act, rapporti).

**Architecture:** la pipeline Python scrive JSON in `data/`; l'app Svelte 5 in `web/` li scarica all'avvio e disegna card e grafici con moduli D3. La build statica finisce in `_site/` e GitHub Pages la pubblica. Nessun server, nessun servizio a pagamento.

**Tech Stack:** Python 3.12 (requests, PyYAML, feedparser, pytest), Svelte 5.57.1, Vite 8.3.1, TypeScript 6.0.3, d3-scale/d3-shape/d3-array, vite-imagetools, Vitest 5, Testing Library, Playwright 1.63 + axe-core, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-15-ai-radar-redesign-design.md`

## Deviazioni dalla spec (decise in fase di piano)

- **Font**: invece di copiare i `.woff2` in `web/public/fonts/`, si usa il pacchetto npm `@fontsource-variable/bricolage-grotesque@5.3.0` (licenza OFL). La build copia i file del font in `_site/`: nessuna richiesta a Google, come chiede la spec. Il browser scarica solo i sottoinsiemi Unicode che servono (latino).
- **Metadati delle foto**: in `web/src/lib/photos.ts` accanto agli import delle immagini, invece che in `config/foto.yaml`. Un solo posto, controllato dal compilatore TypeScript.

## Global Constraints

- Lingua di pagina e messaggi: italiano. Numeri e date con `it-IT`.
- Colori: solo neutro, testo e blu. Chiaro: fondo `#f4f4f2`, card `#ffffff`, testo `#121211`, blu `#0068d6`. Scuro: fondo `#0b0b0a`, card `#161615`, testo `#ececea`, blu `#4ea3ff`. Linee e testo secondario con `color-mix` del testo sul fondo; nessun altro colore.
- Il blu segna solo: "Impara ora", valori in salita, serie in evidenza, prossima scadenza.
- Spazi solo multipli di 8px (8, 16, 24, 32, 40, 48, 64, 96). Raggi 8, 16, 24.
- Un solo font: Bricolage Grotesque (famiglia CSS `"Bricolage Grotesque Variable"`), pesi 400–700. Testo mai sotto 10px.
- Card bianche raggio 24 con ombra leggera; nel tema scuro bordo 1px al posto dell'ombra.
- Grafici: linee sottili, punti tondi, serie in evidenza in blu, resto in grigio, etichette dirette.
- Foto solo da Wikimedia Commons con licenza CC0, pubblico dominio, CC BY o CC BY-SA; credito sotto ogni foto e in fondo alla pagina.
- Ogni numero in pagina ha una fonte cliccabile.
- Bersagli toccabili alti almeno 40px. Effetti hover solo con `(hover: hover)`. Con `prefers-reduced-motion: reduce` nessuna animazione.
- Nessuna richiesta di rete a terzi dalla pagina pubblicata: solo file di `_site/`.
- Commit: messaggi brevi in italiano, **mai** riferimenti a Claude né righe `Co-Authored-By`.
- Versioni npm fissate esattamente come nel `package.json` del Task 6.

## Review Focus

1. **Link diretto con elemento sconosciuto o malformato** (`#competenze/inesistente`, `#business/%E0`): si apre il tema, l'elemento si ignora, nessun errore. Test: Task 8 (router) e Task 16 (Competenze con `elemento` sconosciuto).
2. **`radar.json` scritto dalla pipeline vecchia** (senza `slancio_prec`, `breve`): nessuna freccia, pannello con avviso, nessun crash; si usa `nome` al posto di `breve`. Test: Task 9 (`radarRows`) e Task 10 (`faceCompetenze`).
3. **Schermo da 320px**: nessuno scorrimento orizzontale in home e nelle card aperte. Test: Task 19 (e2e a 320 e 360px).
4. **Doppio clic rapido o cambio di card durante la transizione**: lo stato finale è coerente (una sola card aperta, URL coerente). Test: Task 18.
5. **Notizia senza data o con data futura** (fuso orario del feed): esclusa dal conteggio della settimana, mostrata nell'elenco solo se ha data valida. Test: Task 9 (`newsInLastDays`).

---

## Mappa dei file

```
config/
  sources.yaml                 MODIFICA: feed con tema e alternativi; blocco owid
  ai_act.yaml                  NUOVO: scadenze AI Act
  rapporti.yaml                NUOVO: rapporti periodici
pipeline/
  feeds.py                     MODIFICA: tema, URL alternativi
  arxiv.py                     MODIFICA: attese più lunghe su 500/429
  owid.py                      NUOVO
  ai_act.py                    NUOVO
  rapporti.py                  NUOVO
  run.py                       MODIFICA: nuove fonti
scripts/
  fetch_photos.py              NUOVO: scarica le foto da Commons (una tantum)
  build_site.py                MODIFICA: copia i dati in web/ e lancia la build
tests/
  test_feeds_arxiv.py          NUOVO
  test_owid.py                 NUOVO
  test_curated.py              NUOVO
  test_fetch_photos.py         NUOVO
  test_build_site.py           NUOVO
web/
  package.json, package-lock.json, vite.config.ts, svelte.config.js, tsconfig.json,
  index.html, playwright.config.ts
  src/
    main.ts, app.css, App.svelte, vite-env.d.ts, test-setup.ts
    assets/photos/*.jpg        8 foto (Task 14)
    lib/photos.ts              import immagini + crediti
    lib/text/format.ts         numeri e date in italiano
    lib/text/frasi.ts          numeri chiave, frasi e titoli scritti dai dati
    lib/data/types.ts          tipi dei JSON
    lib/data/load.ts           scaricamento dei JSON
    lib/data/freshness.ts      stati ok / vecchio / assente
    lib/data/derive.ts         calcoli sui dati (radar, OWID, scadenze, notizie)
    lib/router.ts              link diretti
    lib/charts/labels.ts       posizionamento etichette
    lib/charts/types.ts        tipi condivisi dai grafici
    lib/charts/*.svelte        Block, DataTable, LineChart, Bars, DotPlot, Scatter, Timeline, Radar, MovesPanel
    lib/tiles/*.svelte         TileFace, Detail, Pills, TileGrid, SourcesStatus, 8 dettagli
    lib/tiles/registry.ts      elenco delle 8 card
    lib/tiles/types.ts         props condivise dai dettagli
    lib/test/fixtures.ts       dati di prova per test di componenti ed e2e
  tests/e2e/dashboard.spec.ts
.github/workflows/aggiorna.yml MODIFICA
README.md                      MODIFICA
site/                          RIMOSSA nel Task 20
```

---

# Fase 1 — Pipeline

### Task 1: Mettere in un commit la posizione precedente del radar

Il codice è già scritto (sessione di design): `config/skills.yaml` ha il campo `breve`, `pipeline/radar.py` scrive `slancio_prec`, `domanda_prec`, `quadrante_prec` e `breve`, `tests/test_pipeline.py` ha due test nuovi.

**Files:**
- Modify (già modificati): `config/skills.yaml`, `pipeline/radar.py`, `tests/test_pipeline.py`

**Interfaces:**
- Produces: ogni riga di `radar.json → competenze[]` ha `breve: str`, `slancio_prec: float|None`, `domanda_prec: float|None`, `quadrante_prec: str|None`.

- [ ] **Step 1: Controllare le modifiche**

Run: `git diff --stat`
Expected: tre file modificati (`config/skills.yaml`, `pipeline/radar.py`, `tests/test_pipeline.py`).

- [ ] **Step 2: Eseguire i test**

Run: `python -m pytest -q`
Expected: `19 passed`.

- [ ] **Step 3: Commit**

```bash
git add config/skills.yaml pipeline/radar.py tests/test_pipeline.py
git commit -m "Radar: posizione di un mese prima e nomi brevi"
```

---

### Task 2: Feed con tema e indirizzi alternativi

Tre feed Substack rispondono 403 da GitHub Actions. Si passa ai feed ufficiali dei siti e si tiene Substack come alternativa; ogni feed riceve un tema che passa alle notizie.

**Files:**
- Modify: `pipeline/feeds.py` (funzione `run`)
- Modify: `config/sources.yaml` (blocco `feeds`)
- Test: `tests/test_feeds_arxiv.py` (nuovo)

**Interfaces:**
- Produces: `news.json → notizie[].tema: str` e `news.json → fonti[].tema: str`. Temi ammessi: `politica`, `ricerca`, `prodotti`, `business`; senza tema in configurazione si usa `altro`.

- [ ] **Step 1: Scrivere i test che falliscono**

Create `tests/test_feeds_arxiv.py`:

```python
"""Feed con URL alternativi e tema; attese di arXiv su errori temporanei."""
from __future__ import annotations

import json
from datetime import date, datetime, timedelta, timezone

from pipeline import arxiv, feeds


class Resp:
    def __init__(self, status=200, text=""):
        self.status_code = status
        self.headers = {}
        self.text = text
        self.content = text.encode("utf-8")

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")


class MapSession:
    """Risponde per URL; un valore lista viene consumato una risposta alla volta."""

    def __init__(self, routes):
        self.routes = routes
        self.headers = {}
        self.calls = []

    def get(self, url, params=None, headers=None, timeout=None):
        self.calls.append(url)
        r = self.routes[url]
        if isinstance(r, list):
            return r.pop(0) if len(r) > 1 else r[0]
        return r


def _rss(days_ago):
    items = ""
    for k, d in enumerate(days_ago):
        when = (datetime.now(timezone.utc) - timedelta(days=d)).strftime("%a, %d %b %Y %H:%M:%S GMT")
        items += f"<item><title>Notizia {k}</title><link>https://example.org/{k}</link><pubDate>{when}</pubDate></item>"
    return f'<?xml version="1.0"?><rss version="2.0"><channel><title>T</title>{items}</channel></rss>'


def test_feed_alternative_url_and_tema(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    s = MapSession({
        "https://a.example/feed": Resp(403),
        "https://b.example/feed": Resp(200, _rss([1, 2])),
    })
    info = feeds.run(s, [{"name": "Uno", "url": "https://a.example/feed",
                          "alternativi": ["https://b.example/feed"], "tema": "politica"}], 45, 12)
    out = json.loads((tmp_path / "news.json").read_text())
    assert info == {"notizie": 2, "feed_non_letti": 0}
    assert {n["tema"] for n in out["notizie"]} == {"politica"}
    assert out["fonti"] == [{"nome": "Uno", "url": "https://a.example/feed", "tema": "politica"}]
    assert s.calls == ["https://a.example/feed", "https://b.example/feed"]


def test_feed_all_urls_fail_is_reported(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    s = MapSession({
        "https://a.example/feed": Resp(403),
        "https://b.example/feed": Resp(404),
        "https://c.example/feed": Resp(200, _rss([1])),
    })
    info = feeds.run(s, [
        {"name": "Uno", "url": "https://a.example/feed", "alternativi": ["https://b.example/feed"]},
        {"name": "Due", "url": "https://c.example/feed"},
    ], 45, 12)
    out = json.loads((tmp_path / "news.json").read_text())
    assert info == {"notizie": 1, "feed_non_letti": 1}
    assert "Uno" in out["errori"]
    assert out["notizie"][0]["tema"] == "altro"
```

- [ ] **Step 2: Eseguire i test e verificare che falliscano**

Run: `python -m pytest -q tests/test_feeds_arxiv.py`
Expected: FAIL con `KeyError: 'tema'` (o differenza su `s.calls`).

- [ ] **Step 3: Implementare**

In `pipeline/feeds.py` sostituire la funzione `run` con:

```python
def run(s, feeds: list[dict], days: int, per_source: int) -> dict:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    items, errors = [], {}
    for f in feeds:
        tema = f.get("tema", "altro")
        tried = []
        for url in [f["url"], *f.get("alternativi", [])]:
            try:
                r = http_get(s, url, timeout=30, retries=2)
                got = parse_feed(r.content, f["name"], since, per_source)
            except Exception as exc:  # si prova l'indirizzo successivo
                tried.append(f"{url}: {str(exc)[:120]}")
                continue
            for it in got:
                it["tema"] = tema
            items.extend(got)
            break
        else:
            errors[f["name"]] = " | ".join(tried)[:300]
            log.warning("Feed %s non letto: %s", f["name"], errors[f["name"]])
    if not items:
        raise ValueError(f"nessun feed leggibile: {errors}")
    items.sort(key=lambda x: (x["data"], x["fonte"]), reverse=True)
    write_json(OUT, {
        "fonti": [{"nome": f["name"], "url": f["url"], "tema": f.get("tema", "altro")} for f in feeds],
        "errori": errors,
        "giorni": days,
        "notizie": items,
    })
    return {"notizie": len(items), "feed_non_letti": len(errors)}
```

- [ ] **Step 4: Aggiornare i feed in `config/sources.yaml`**

Sostituire il blocco `feeds:` con:

```yaml
# Feed per le notizie. tema: politica, ricerca, prodotti, business.
# alternativi: indirizzi provati in ordine se il primo non risponde
# (alcuni Substack rispondono 403 da GitHub Actions).
feeds:
  - name: OpenAI
    url: https://openai.com/news/rss.xml
    tema: prodotti
  - name: Google DeepMind
    url: https://deepmind.google/blog/rss.xml
    tema: ricerca
  - name: Hugging Face
    url: https://huggingface.co/blog/feed.xml
    tema: ricerca
  - name: Epoch AI
    url: https://epoch.ai/atom.xml
    alternativi: [https://epochai.substack.com/feed]
    tema: ricerca
  - name: Import AI
    url: https://jack-clark.net/feed/
    alternativi: [https://importai.substack.com/feed]
    tema: ricerca
  - name: EU AI Act Newsletter
    url: https://artificialintelligenceact.substack.com/feed
    alternativi: [https://artificialintelligenceact.eu/feed/]
    tema: politica
  - name: Google AI
    url: https://blog.google/innovation-and-ai/technology/ai/rss/
    tema: prodotti
  - name: Simon Willison
    url: https://simonwillison.net/atom/entries/   # solo articoli; /atom/everything/ include anche link e citazioni
    tema: prodotti
  - name: The Decoder
    url: https://the-decoder.com/feed/
    tema: prodotti
  - name: Latent Space
    url: https://www.latent.space/feed
    tema: business
```

- [ ] **Step 5: Eseguire tutti i test**

Run: `python -m pytest -q`
Expected: tutti passano (21).

- [ ] **Step 6: Commit**

```bash
git add pipeline/feeds.py config/sources.yaml tests/test_feeds_arxiv.py
git commit -m "Feed: tema per notizia e indirizzi alternativi"
```

---

### Task 3: arXiv, attese più lunghe su 500 e 429

**Files:**
- Modify: `pipeline/arxiv.py` (costante nuova, chiamata `http_get` dentro `run`)
- Test: `tests/test_feeds_arxiv.py`

**Interfaces:**
- Consumes: `common.http_get(s, url, *, params, headers, timeout, retries=3, backoff=5.0)` che attende `backoff * tentativo` su 429/5xx.
- Produces: `arxiv.RETRY_BACKOFF = 30.0`.

- [ ] **Step 1: Scrivere il test che fallisce**

Aggiungere in fondo a `tests/test_feeds_arxiv.py`:

```python
def test_arxiv_waits_30_then_60_seconds_on_server_errors(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    slept = []
    monkeypatch.setattr("time.sleep", lambda s: slept.append(s))
    ok = Resp(200, '<feed xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/">'
                   "<opensearch:totalResults>100</opensearch:totalResults></feed>")
    s = MapSession({arxiv.API: [Resp(500), Resp(500), ok]})
    info = arxiv.run(s, [], date(2026, 10, 15), sleep=0, months=6)
    assert info["chiamate"] == 6
    assert [x for x in slept if x] == [30.0, 60.0]
```

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

Run: `python -m pytest -q tests/test_feeds_arxiv.py::test_arxiv_waits_30_then_60_seconds_on_server_errors`
Expected: FAIL, `[5.0, 10.0] != [30.0, 60.0]`.

- [ ] **Step 3: Implementare**

In `pipeline/arxiv.py`, sotto `OUT = "arxiv.json"` aggiungere:

```python
RETRY_BACKOFF = 30.0  # arXiv risponde 500/429 per qualche decina di secondi: si attende 30 s, poi 60 s
```

e nella funzione `run` sostituire la chiamata:

```python
            r = http_get(s, API, params={"search_query": build_query(phrases, ym), "start": 0, "max_results": 0},
                         backoff=RETRY_BACKOFF)
```

- [ ] **Step 4: Eseguire tutti i test**

Run: `python -m pytest -q`
Expected: tutti passano (22).

- [ ] **Step 5: Commit**

```bash
git add pipeline/arxiv.py tests/test_feeds_arxiv.py
git commit -m "arXiv: attese più lunghe sugli errori temporanei"
```

---

### Task 4: Fonte Our World in Data

**Files:**
- Create: `pipeline/owid.py`
- Modify: `pipeline/run.py` (import, `ORDER`, `jobs`)
- Modify: `config/sources.yaml` (nuovo blocco `owid`)
- Test: `tests/test_owid.py`

**Interfaces:**
- Consumes: `common.http_get`, `common.http_json`, `common.read_json`, `common.write_json`, `common.now_iso`, `common.log`.
- Produces: `owid.run(s, series_cfg: list[dict]) -> dict` e `data/owid.json`:

```json
{"aggiornato": "ISO", "errori": {"id": "messaggio"},
 "serie": {"<id>": {"titolo": "", "unita": "", "citazione": "", "aggiornato_owid": "YYYY-MM-DD|null",
                    "url": "https://ourworldindata.org/grapher/<slug>",
                    "punti": [{"entita": "World", "t": "2025", "v": 1.0}]}}}
```

`t` è anno (`2025`), mese (`2026-08`), trimestre (`2026-Q3`) o giorno (`2026-03-31`), come nel CSV. Chiave di stato in `status.json`: `owid`.

- [ ] **Step 1: Scrivere i test che falliscono**

Create `tests/test_owid.py`:

```python
"""Our World in Data: CSV del grapher, filtro per entità, errori per serie."""
from __future__ import annotations

import json

import pytest

from pipeline import owid


class Resp:
    def __init__(self, status=200, text="", body=None):
        self.status_code = status
        self.headers = {}
        self.text = text if body is None else json.dumps(body)
        self.content = self.text.encode("utf-8")

    def json(self):
        return json.loads(self.text)

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")


class Session:
    def __init__(self, routes):
        self.routes, self.headers = routes, {}

    def get(self, url, params=None, headers=None, timeout=None):
        return self.routes[url]


CSV = ("entity,code,year,private_investment\n"
       "World,OWID_WRL,2024,130\nWorld,OWID_WRL,2025,290\n"
       "China,CHN,2025,12\nUnited States,USA,2025,200\n")
META = {"columns": {"private_investment": {"titleShort": "Private investment", "unit": "constant 2021 US$",
                                           "citationShort": "Quid via AI Index", "lastUpdated": "2026-04-20"}}}
BASE = "https://ourworldindata.org/grapher/"


def test_parse_csv_filters_entities_and_sorts():
    pts = owid.parse_csv(CSV, "private_investment", ["World", "China"])
    assert pts == [{"entita": "China", "t": "2025", "v": 12.0},
                   {"entita": "World", "t": "2024", "v": 130.0},
                   {"entita": "World", "t": "2025", "v": 290.0}]


def test_parse_csv_quarter_and_quoted_entities():
    text = 'entity,quarter,revenue\n"Data centers and AI",2026-Q2,5\n"Data centers and AI",2026-Q3,7\n'
    pts = owid.parse_csv(text, "revenue", None)
    assert [p["t"] for p in pts] == ["2026-Q2", "2026-Q3"]


def test_parse_csv_missing_column():
    with pytest.raises(ValueError, match="colonna"):
        owid.parse_csv(CSV, "generative_ai", None)


def test_run_keeps_good_series_when_one_breaks(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    s = Session({
        BASE + "a.csv": Resp(text=CSV),
        BASE + "a.metadata.json": Resp(body=META),
        BASE + "b.csv": Resp(text=CSV),
        BASE + "b.metadata.json": Resp(body=META),
    })
    info = owid.run(s, [
        {"id": "buona", "slug": "a", "colonna": "private_investment", "entita": ["World"]},
        {"id": "rotta", "slug": "b", "colonna": "colonna_che_non_esiste"},
    ])
    out = json.loads((tmp_path / "owid.json").read_text())
    assert info == {"serie": 1, "errori": 1}
    assert out["serie"]["buona"]["citazione"] == "Quid via AI Index"
    assert out["serie"]["buona"]["unita"] == "constant 2021 US$"
    assert out["serie"]["buona"]["url"] == BASE + "a"
    assert [p["v"] for p in out["serie"]["buona"]["punti"]] == [130.0, 290.0]
    assert "rotta" in out["errori"] and "rotta" not in out["serie"]


def test_run_keeps_last_good_copy_of_a_broken_series(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    monkeypatch.setattr("time.sleep", lambda *_: None)  # http_get ritenta sui 500: niente attese nel test
    (tmp_path / "owid.json").write_text(json.dumps({"serie": {"rotta": {"titolo": "vecchia", "punti": []}}}))
    s = Session({BASE + "a.csv": Resp(text=CSV), BASE + "a.metadata.json": Resp(status=500),
                 BASE + "b.csv": Resp(status=404)})
    owid.run(s, [{"id": "buona", "slug": "a", "colonna": "private_investment"},
                 {"id": "rotta", "slug": "b", "colonna": "private_investment"}])
    out = json.loads((tmp_path / "owid.json").read_text())
    assert out["serie"]["rotta"]["titolo"] == "vecchia"
    assert out["serie"]["buona"]["titolo"] == ""  # metadati non disponibili: la serie resta valida


def test_run_fails_when_every_series_fails(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    s = Session({BASE + "b.csv": Resp(status=404)})
    with pytest.raises(ValueError, match="nessuna serie"):
        owid.run(s, [{"id": "rotta", "slug": "b", "colonna": "x"}])
```

- [ ] **Step 2: Eseguire i test e verificare che falliscano**

Run: `python -m pytest -q tests/test_owid.py`
Expected: FAIL con `ImportError: cannot import name 'owid'`.

- [ ] **Step 3: Implementare `pipeline/owid.py`**

```python
"""Our World in Data: serie sull'AI (investimenti, adozione, uso, infrastruttura).

Si scaricano il CSV e i metadati di ogni grafico del grapher. OWID pubblica in
CC BY 4.0, ma i dati restano dei produttori originali: la pagina riporta sempre
la citazione e il link.
"""
from __future__ import annotations

import csv
import io

from .common import http_get, http_json, log, now_iso, read_json, write_json

BASE = "https://ourworldindata.org/grapher/"
OUT = "owid.json"
TIME_COLUMNS = ("year", "day", "month", "quarter")


def parse_csv(text: str, colonna: str, entita: list[str] | None) -> list[dict]:
    rows = list(csv.DictReader(io.StringIO(text)))
    if not rows:
        raise ValueError("CSV vuoto")
    cols = rows[0].keys()
    if colonna not in cols:
        raise ValueError(f"colonna {colonna!r} assente (colonne: {', '.join(cols)})")
    tcol = next((c for c in TIME_COLUMNS if c in cols), None)
    if tcol is None:
        raise ValueError("colonna del tempo assente")
    want = set(entita) if entita else None
    out = []
    for r in rows:
        if want is not None and r["entity"] not in want:
            continue
        v = r.get(colonna)
        if v in (None, ""):
            continue
        out.append({"entita": r["entity"], "t": r[tcol], "v": float(v)})
    if not out:
        raise ValueError("nessun valore per le entità richieste")
    out.sort(key=lambda p: (p["entita"], p["t"]))
    return out


def parse_meta(payload: dict, colonna: str) -> dict:
    cols = payload.get("columns", {}) if isinstance(payload, dict) else {}
    c = cols.get(colonna) or next(iter(cols.values()), {})
    return {
        "titolo": c.get("titleShort") or c.get("title") or "",
        "unita": c.get("unit") or "",
        "citazione": c.get("citationShort") or "",
        "aggiornato_owid": c.get("lastUpdated"),
    }


def run(s, series_cfg: list[dict]) -> dict:
    old = (read_json(OUT, {}) or {}).get("serie", {})
    serie, errori = {}, {}
    for cfg in series_cfg:
        sid, url = cfg["id"], BASE + cfg["slug"]
        try:
            text = http_get(s, url + ".csv", params={"v": 1, "csvType": "full", "useColumnShortNames": "true"}).text
            punti = parse_csv(text, cfg["colonna"], cfg.get("entita"))
        except Exception as exc:
            errori[sid] = str(exc)[:200]
            log.warning("OWID %s non aggiornata: %s", sid, exc)
            if sid in old:  # resta l'ultima copia buona
                serie[sid] = old[sid]
            continue
        try:
            meta = parse_meta(http_json(s, url + ".metadata.json", params={"v": 1}), cfg["colonna"])
        except Exception as exc:
            log.warning("OWID %s: metadati non disponibili (%s)", sid, exc)
            meta = parse_meta({}, cfg["colonna"])
        serie[sid] = {**meta, "url": url, "punti": punti}
    if len(errori) == len(series_cfg):
        raise ValueError(f"OWID: nessuna serie aggiornata: {errori}")
    write_json(OUT, {"aggiornato": now_iso(), "errori": errori, "serie": serie})
    return {"serie": len(series_cfg) - len(errori), "errori": len(errori)}
```

- [ ] **Step 4: Eseguire i test**

Run: `python -m pytest -q tests/test_owid.py`
Expected: 6 passed.

- [ ] **Step 5: Configurare le serie in `config/sources.yaml`**

Aggiungere in fondo:

```yaml
# Our World in Data: grafici del grapher (https://ourworldindata.org/grapher/<slug>).
# colonna = nome breve della colonna nel CSV; entita = righe da tenere (assente = tutte).
owid:
  - id: investimenti_privati
    slug: private-investment-in-artificial-intelligence
    colonna: private_investment
    entita: [World, United States, China, Europe]
  - id: investimenti_generativa
    slug: global-investment-in-generative-ai
    colonna: generative_ai
    entita: [World]
  - id: investimenti_tipo
    slug: corporate-investment-in-artificial-intelligence-by-type
    colonna: corporate_investment
  - id: imprese_ai
    slug: share-companies-using-artificial-intelligence
    colonna: pct_of_respondents
  - id: uso_genai
    slug: estimated-share-people-generative-ai
    colonna: ai_user_share
    entita: [World, Italy, United States, China, Germany, France, Spain, United Kingdom]
  - id: uso_genai_ue
    slug: share-europe-using-generative-ai
    colonna: pct_used_genai_16_74
  - id: uso_genai_giovani_ue
    slug: share-of-young-people-in-european-countries-using-generative-ai-tools
    colonna: pct_used_genai_16_24
  - id: sviluppatori_ai
    slug: share-of-professional-software-developers-using-ai-tools
    colonna: yes_overall
    entita: [World]
  - id: annunci_ai
    slug: share-artificial-intelligence-job-postings
    colonna: ai_job_postings_share
  - id: data_center_spesa
    slug: monthly-spending-data-center-us
    colonna: datacenter_construction_spending_real
    entita: [United States]
  - id: data_center_elettricita
    slug: data-centers-share-electricity-demand
    colonna: total_electricity_consumption__share_of_total_electricity_demand__historical
    entita: [World, United States, China, Europe (IEA)]
  - id: nvidia_ricavi
    slug: nvidia-quarterly-revenue-segment
    colonna: revenue
    entita: [Data centers and AI, Gaming, Total]
  - id: tsmc_ricavi
    slug: tsmc-annual-revenue
    colonna: revenue_usd
    entita: [Taiwan]
```

- [ ] **Step 6: Collegare la fonte in `pipeline/run.py`**

Modificare l'import e l'ordine:

```python
from . import adzuna, artificial_analysis, arxiv, epoch, eurostat, feeds, github_signals, huggingface, owid, radar
```

```python
ORDER = ["epoch", "artificial_analysis", "arxiv", "github", "huggingface", "adzuna", "eurostat", "owid", "feeds", "radar"]
```

e nel dizionario `jobs` aggiungere dopo `"eurostat"`:

```python
        "owid": lambda: owid.run(s, src.get("owid", [])),
```

- [ ] **Step 7: Far rispondere OWID anche nel test end-to-end della pipeline**

In `tests/test_pipeline.py`, dentro `FakeSession.get`, prima della riga `if "deepmind" in url:` aggiungere:

```python
        if host == "ourworldindata.org":
            if url.endswith(".metadata.json"):
                return FakeResponse(body={"columns": {}})
            return FakeResponse(text=_owid_csv(url))
```

e sopra `class FakeSession` aggiungere:

```python
def _owid_csv(url):
    """CSV con la colonna giusta per ogni slug configurato in sources.yaml."""
    from pipeline.common import load_yaml
    slug = url.rsplit("/", 1)[-1].removesuffix(".csv")
    cfg = next(c for c in load_yaml("sources.yaml")["owid"] if c["slug"] == slug)
    ents = cfg.get("entita") or ["World"]
    lines = [f"entity,year,{cfg['colonna']}"] + [f'"{e}",{y},{10 + y - 2020}' for e in ents for y in (2024, 2025)]
    return "\n".join(lines)
```

- [ ] **Step 8: Eseguire tutti i test**

Run: `python -m pytest -q`
Expected: tutti passano (28). `test_full_run` ora verifica anche `owid` perché controlla che tutte le fonti di `run.ORDER` siano `ok`.

- [ ] **Step 9: Provare con la rete vera**

Run: `AI_RADAR_DATA_DIR=$(mktemp -d) python -m pipeline.run --only owid`
Expected: `Fatto: 1 ok, 0 errori`. Se una serie va in errore per nome di colonna, aprire il suo CSV nel browser, correggere `colonna` in `sources.yaml` e rieseguire.

- [ ] **Step 10: Commit**

```bash
git add pipeline/owid.py pipeline/run.py config/sources.yaml tests/test_owid.py tests/test_pipeline.py
git commit -m "Nuova fonte: serie AI di Our World in Data"
```

---

### Task 5: AI Act e rapporti, file scritti a mano

**Files:**
- Create: `pipeline/ai_act.py`, `pipeline/rapporti.py`, `config/ai_act.yaml`, `config/rapporti.yaml`
- Modify: `pipeline/run.py`
- Test: `tests/test_curated.py`

**Interfaces:**
- Produces: `ai_act.validate(doc: dict) -> list[dict]`, `ai_act.run() -> dict`, `data/ai_act.json = {"scadenze": [{"data": "YYYY-MM-DD", "titolo", "descrizione", "fonte"}]}` ordinate per data.
- Produces: `rapporti.validate(doc: dict) -> list[dict]`, `rapporti.run() -> dict`, `data/rapporti.json = {"rapporti": [{"nome", "editore", "url", "cadenza", "edizioni": [{"anno": int, "data": "YYYY-MM", "url"}], "prossima_prevista": "YYYY-MM"|null}]}`.
- Chiavi di stato: `ai_act`, `rapporti`.

- [ ] **Step 1: Scrivere i test che falliscono**

Create `tests/test_curated.py`:

```python
"""File scritti a mano: scadenze dell'AI Act e rapporti periodici."""
from __future__ import annotations

import json
from datetime import date

import pytest

from pipeline import ai_act, rapporti

GOOD_ACT = {"scadenze": [
    {"data": date(2026, 12, 2), "titolo": "B", "descrizione": "d", "fonte": "https://eur-lex.europa.eu/x"},
    {"data": "2025-02-02", "titolo": "A", "descrizione": "d", "fonte": "https://eur-lex.europa.eu/y"},
]}


def test_ai_act_valid_and_sorted():
    out = ai_act.validate(GOOD_ACT)
    assert [x["data"] for x in out] == ["2025-02-02", "2026-12-02"]
    assert out[0] == {"data": "2025-02-02", "titolo": "A", "descrizione": "d", "fonte": "https://eur-lex.europa.eu/y"}


@pytest.mark.parametrize("patch, msg", [
    ({"data": "2026-13-01"}, "data"),
    ({"titolo": "  "}, "titolo"),
    ({"fonte": "http://non-sicuro.example"}, "fonte"),
])
def test_ai_act_rejects_bad_items(patch, msg):
    item = {"data": "2026-01-01", "titolo": "T", "descrizione": "d", "fonte": "https://x.example", **patch}
    with pytest.raises(ValueError, match=msg):
        ai_act.validate({"scadenze": [item]})


def test_ai_act_rejects_empty():
    with pytest.raises(ValueError, match="scadenze"):
        ai_act.validate({})


GOOD_REP = {"rapporti": [{
    "nome": "AI Index Report", "editore": "Stanford HAI", "url": "https://hai.stanford.edu/ai-index",
    "cadenza": "annuale", "prossima_prevista": "2027-04",
    "edizioni": [{"anno": 2026, "data": "2026-04", "url": "https://hai.stanford.edu/ai-index"},
                 {"anno": 2025, "data": "2025-04", "url": "https://hai.stanford.edu/ai-index"}],
}]}


def test_rapporti_valid_editions_sorted():
    out = rapporti.validate(GOOD_REP)
    assert [e["data"] for e in out[0]["edizioni"]] == ["2025-04", "2026-04"]
    assert out[0]["prossima_prevista"] == "2027-04"


@pytest.mark.parametrize("patch, msg", [
    ({"url": "ftp://x"}, "url"),
    ({"prossima_prevista": "aprile"}, "prossima_prevista"),
    ({"edizioni": [{"anno": "duemila", "data": "2026-04", "url": "https://x.example"}]}, "anno"),
    ({"edizioni": [{"anno": 2026, "data": "2026-4", "url": "https://x.example"}]}, "data"),
])
def test_rapporti_rejects_bad_fields(patch, msg):
    doc = {"rapporti": [{**GOOD_REP["rapporti"][0], **patch}]}
    with pytest.raises(ValueError, match=msg):
        rapporti.validate(doc)


def test_rapporti_allows_no_next_edition():
    doc = {"rapporti": [{**GOOD_REP["rapporti"][0], "prossima_prevista": None}]}
    assert rapporti.validate(doc)[0]["prossima_prevista"] is None


def test_shipped_files_are_valid(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    assert ai_act.run()["scadenze"] >= 5
    assert rapporti.run()["rapporti"] >= 4
    assert json.loads((tmp_path / "ai_act.json").read_text())["scadenze"]
    assert json.loads((tmp_path / "rapporti.json").read_text())["rapporti"]
```

- [ ] **Step 2: Eseguire i test e verificare che falliscano**

Run: `python -m pytest -q tests/test_curated.py`
Expected: FAIL con `ImportError`.

- [ ] **Step 3: Implementare `pipeline/ai_act.py`**

```python
"""Scadenze dell'AI Act da config/ai_act.yaml, scritte a mano con il link alla fonte ufficiale."""
from __future__ import annotations

from datetime import date

from .common import load_yaml, write_json

OUT = "ai_act.json"


def validate(doc: dict) -> list[dict]:
    items = (doc or {}).get("scadenze")
    if not isinstance(items, list) or not items:
        raise ValueError("ai_act.yaml: l'elenco 'scadenze' è vuoto")
    out = []
    for i, it in enumerate(items, 1):
        d = it.get("data")
        d = d.isoformat() if isinstance(d, date) else str(d or "")
        try:
            date.fromisoformat(d)
        except ValueError:
            raise ValueError(f"ai_act.yaml, voce {i}: data non valida: {d!r}") from None
        for k in ("titolo", "descrizione"):
            if not str(it.get(k) or "").strip():
                raise ValueError(f"ai_act.yaml, voce {i}: {k} mancante")
        fonte = str(it.get("fonte") or "")
        if not fonte.startswith("https://"):
            raise ValueError(f"ai_act.yaml, voce {i}: fonte deve iniziare con https://")
        out.append({"data": d, "titolo": it["titolo"].strip(), "descrizione": it["descrizione"].strip(), "fonte": fonte})
    return sorted(out, key=lambda x: x["data"])


def run() -> dict:
    items = validate(load_yaml("ai_act.yaml"))
    write_json(OUT, {"scadenze": items})
    return {"scadenze": len(items)}
```

- [ ] **Step 4: Implementare `pipeline/rapporti.py`**

```python
"""Rapporti periodici sull'AI da config/rapporti.yaml: solo link e date, nessuna sintesi."""
from __future__ import annotations

import re

from .common import load_yaml, write_json

OUT = "rapporti.json"
YM = re.compile(r"^\d{4}-\d{2}$")


def _https(v, where: str) -> str:
    v = str(v or "")
    if not v.startswith("https://"):
        raise ValueError(f"{where}: url deve iniziare con https://")
    return v


def validate(doc: dict) -> list[dict]:
    items = (doc or {}).get("rapporti")
    if not isinstance(items, list) or not items:
        raise ValueError("rapporti.yaml: l'elenco 'rapporti' è vuoto")
    out = []
    for i, r in enumerate(items, 1):
        where = f"rapporti.yaml, voce {i}"
        for k in ("nome", "editore", "cadenza"):
            if not str(r.get(k) or "").strip():
                raise ValueError(f"{where}: {k} mancante")
        nxt = r.get("prossima_prevista")
        if nxt is not None and not YM.match(str(nxt)):
            raise ValueError(f"{where}: prossima_prevista deve essere AAAA-MM")
        eds = []
        for e in r.get("edizioni") or []:
            if not isinstance(e.get("anno"), int):
                raise ValueError(f"{where}: anno dell'edizione non valido: {e.get('anno')!r}")
            if not YM.match(str(e.get("data") or "")):
                raise ValueError(f"{where}: data dell'edizione deve essere AAAA-MM")
            eds.append({"anno": e["anno"], "data": str(e["data"]), "url": _https(e.get("url"), where)})
        out.append({
            "nome": r["nome"].strip(), "editore": r["editore"].strip(), "url": _https(r.get("url"), where),
            "cadenza": r["cadenza"].strip(), "edizioni": sorted(eds, key=lambda e: e["data"]),
            "prossima_prevista": str(nxt) if nxt is not None else None,
        })
    return out


def run() -> dict:
    items = validate(load_yaml("rapporti.yaml"))
    write_json(OUT, {"rapporti": items})
    return {"rapporti": len(items)}
```

- [ ] **Step 5: Creare `config/ai_act.yaml`**

```yaml
# Scadenze dell'AI Act (Regolamento (UE) 2024/1689) e del Digital Omnibus sull'AI.
# Ogni voce: data (AAAA-MM-GG), titolo, descrizione, fonte (https).
# Da aggiornare a mano quando cambia il quadro normativo.
scadenze:
  - data: 2024-08-01
    titolo: Entra in vigore l'AI Act
    descrizione: Regolamento (UE) 2024/1689, pubblicato nella Gazzetta ufficiale il 12 luglio 2024.
    fonte: https://eur-lex.europa.eu/eli/reg/2024/1689/oj
  - data: 2025-02-02
    titolo: Divieti e alfabetizzazione AI
    descrizione: "Vietate le pratiche dell'articolo 5; obbligo di formazione per chi usa sistemi AI (articolo 4)."
    fonte: https://eur-lex.europa.eu/eli/reg/2024/1689/oj
  - data: 2025-08-02
    titolo: Modelli per uso generale
    descrizione: Obblighi per i fornitori di modelli GPAI, governance e sanzioni.
    fonte: https://eur-lex.europa.eu/eli/reg/2024/1689/oj
  - data: 2026-07-27
    titolo: In vigore il Digital Omnibus sull'AI
    descrizione: Rinvia le scadenze per i sistemi ad alto rischio e le fissa a date certe.
    fonte: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai
  - data: 2026-08-02
    titolo: Obblighi di trasparenza
    descrizione: "Articolo 50: dire quando si parla con un'AI e marcare i contenuti generati."
    fonte: https://eur-lex.europa.eu/eli/reg/2024/1689/oj
  - data: 2026-12-02
    titolo: Fine della transizione per la marcatura
    descrizione: "Articolo 50(2): anche i sistemi generativi già sul mercato devono marcare i contenuti."
    fonte: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai
  - data: 2027-12-02
    titolo: Sistemi ad alto rischio (allegato III)
    descrizione: Selezione del personale, credito, istruzione, controllo delle frontiere e altri usi.
    fonte: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai
  - data: 2028-08-02
    titolo: Alto rischio nei prodotti regolati (allegato I)
    descrizione: AI dentro dispositivi medici, macchinari, veicoli.
    fonte: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai
```

- [ ] **Step 6: Verificare le date sulle fonti ufficiali**

1. Aprire https://eur-lex.europa.eu e cercare "digital omnibus artificial intelligence" tra gli atti del 2026.
2. Se esiste il regolamento pubblicato, aprirne la pagina e copiare l'URL ELI (forma `https://eur-lex.europa.eu/eli/reg/2026/<numero>/oj`).
3. Confrontare con il testo: data di entrata in vigore (voce 2026-07-27), 2 dicembre 2026 (articolo 50(2)), 2 dicembre 2027 (allegato III), 2 agosto 2028 (allegato I).
4. Correggere in `config/ai_act.yaml` ogni data diversa e mettere l'URL ELI come `fonte` delle voci 2026-07-27, 2026-12-02, 2027-12-02, 2028-08-02.
5. Se il regolamento non è ancora su EUR-Lex, lasciare la pagina della Commissione come fonte.

- [ ] **Step 7: Creare `config/rapporti.yaml`**

```yaml
# Rapporti periodici sull'AI. Solo link e date: nessuna sintesi.
# edizioni: uscite già avvenute (data AAAA-MM). prossima_prevista: stima (AAAA-MM) o null.
rapporti:
  - nome: AI Index Report
    editore: Stanford HAI
    url: https://hai.stanford.edu/ai-index
    cadenza: annuale
    edizioni:
      - {anno: 2025, data: "2025-04", url: "https://hai.stanford.edu/ai-index"}
      - {anno: 2026, data: "2026-04", url: "https://hai.stanford.edu/ai-index"}
    prossima_prevista: "2027-04"
  - nome: State of AI Report
    editore: Air Street Capital
    url: https://www.stateof.ai
    cadenza: annuale
    edizioni:
      - {anno: 2025, data: "2025-10", url: "https://www.stateof.ai"}
    prossima_prevista: "2026-10"
  - nome: The State of AI
    editore: McKinsey & Company
    url: https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai
    cadenza: annuale
    edizioni:
      - {anno: 2025, data: "2025-11", url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai"}
    prossima_prevista: "2026-11"
  - nome: State of Generative AI in the Enterprise
    editore: Menlo Ventures
    url: https://menlovc.com
    cadenza: annuale
    edizioni:
      - {anno: 2025, data: "2025-12", url: "https://menlovc.com"}
    prossima_prevista: "2026-12"
```

- [ ] **Step 8: Verificare date e link dei rapporti**

Per ognuno dei 4 rapporti aprire la pagina dell'editore e:
1. controllare il mese di uscita delle edizioni elencate e correggerlo se diverso;
2. sostituire l'`url` di ogni edizione con il link diretto all'edizione, se l'editore ne ha uno;
3. se un'edizione 2026 è già uscita (per esempio State of AI Report a ottobre), aggiungerla a `edizioni` e spostare `prossima_prevista` all'anno dopo.

- [ ] **Step 9: Collegare le fonti in `pipeline/run.py`**

```python
from . import adzuna, ai_act, artificial_analysis, arxiv, epoch, eurostat, feeds, github_signals, huggingface, owid, radar, rapporti
```

```python
ORDER = ["epoch", "artificial_analysis", "arxiv", "github", "huggingface", "adzuna", "eurostat", "owid",
         "ai_act", "rapporti", "feeds", "radar"]
```

e nel dizionario `jobs`:

```python
        "ai_act": ai_act.run,
        "rapporti": rapporti.run,
```

- [ ] **Step 10: Eseguire tutti i test**

Run: `python -m pytest -q`
Expected: tutti passano (40).

- [ ] **Step 11: Commit**

```bash
git add pipeline/ai_act.py pipeline/rapporti.py pipeline/run.py config/ai_act.yaml config/rapporti.yaml tests/test_curated.py
git commit -m "Nuove fonti a mano: scadenze AI Act e rapporti"
```

---

# Fase 2 — App Svelte in `web/`

Tutti i comandi di questa fase si eseguono dentro `web/` (`cd web`), salvo dove indicato.

### Task 6: Impalcatura dell'app e formati italiani

**Files:**
- Create: `web/package.json`, `web/vite.config.ts`, `web/svelte.config.js`, `web/tsconfig.json`, `web/index.html`, `web/src/main.ts`, `web/src/App.svelte`, `web/src/app.css`, `web/src/vite-env.d.ts`, `web/src/test-setup.ts`, `web/src/lib/text/format.ts`
- Test: `web/src/lib/text/format.test.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces (`lib/text/format.ts`): `nf(v: number, d?: number): string`, `parseDay(iso: string): Date`, `day(iso: string): string`, `monthName(ym: string): string`, `monthYear(ym: string): string`, `daysTo(iso: string, today: Date): number`, `signedPts(v: number): string`, `capitalize(s: string): string`, `lowerFirst(s: string): string`, `isoDay(d: Date): string`, `ym(d: Date): string`.
- Produces: token CSS globali in `app.css` (`--bg`, `--card`, `--fg`, `--accent`, `--fg-2`, `--fg-3`, `--line`, `--line-2`, `--accent-soft`, `--shadow`, `--shadow-up`, `--font`, `--r-sm/md/lg`, `--s1…--s12`, `--ease`).

- [ ] **Step 1: Creare `web/package.json`**

```json
{
  "name": "ai-radar-web",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --port 4173 --strictPort",
    "check": "svelte-check --tsconfig ./tsconfig.json",
    "test": "vitest run",
    "e2e": "playwright test"
  },
  "dependencies": {
    "@fontsource-variable/bricolage-grotesque": "5.3.0",
    "d3-array": "3.2.4",
    "d3-scale": "4.0.2",
    "d3-shape": "3.2.0"
  },
  "devDependencies": {
    "@axe-core/playwright": "4.13.0",
    "@playwright/test": "1.63.0",
    "@sveltejs/vite-plugin-svelte": "7.3.1",
    "@testing-library/jest-dom": "7.0.1",
    "@testing-library/svelte": "5.4.2",
    "@tsconfig/svelte": "5.0.8",
    "@types/d3-array": "3.2.2",
    "@types/d3-scale": "4.0.9",
    "@types/d3-shape": "3.2.0",
    "@types/node": "24.19.2",
    "jsdom": "30.1.1",
    "svelte": "5.57.1",
    "svelte-check": "4.7.6",
    "typescript": "6.0.3",
    "vite": "8.3.1",
    "vite-imagetools": "12.0.1",
    "vitest": "5.0.3"
  }
}
```

- [ ] **Step 2: Installare le dipendenze**

Run: `cd web && npm install`
Expected: crea `web/package-lock.json` e `web/node_modules/`, nessun errore di peer dependency.

- [ ] **Step 3: Configurazione di build e test**

`web/vite.config.ts`:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { imagetools } from 'vite-imagetools';

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [svelte(), imagetools()],
  // nei test i componenti Svelte vanno risolti nella versione per browser
  resolve: mode === 'test' ? { conditions: ['browser'] } : undefined,
  build: { outDir: '../_site', emptyOutDir: true },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test-setup.ts'],
  },
}));
```

`web/svelte.config.js`:

```js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default { preprocess: vitePreprocess() };
```

`web/tsconfig.json`:

```json
{
  "extends": "@tsconfig/svelte/tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "src/**/*.svelte", "tests/**/*.ts", "playwright.config.ts", "vite.config.ts"]
}
```

`web/src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
/// <reference types="svelte" />

declare module '*as=srcset' {
  const srcset: string;
  export default srcset;
}
declare module '*format=webp' {
  const src: string;
  export default src;
}
```

`web/src/test-setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Pagina, ingresso e token**

`web/index.html`:

```html
<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>AI Radar</title>
    <meta name="description" content="Cosa succede nell'AI ogni settimana: modelli, business, persone, politica e competenze, da fonti pubbliche." />
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='12' fill='none' stroke='%23121211' stroke-width='4'/%3E%3Ccircle cx='16' cy='16' r='5' fill='%230068d6'/%3E%3C/svg%3E" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`web/src/main.ts`:

```ts
import '@fontsource-variable/bricolage-grotesque';
import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';

mount(App, { target: document.getElementById('app')! });
```

`web/src/App.svelte` (provvisorio, sostituito nel Task 18):

```svelte
<main class="wrap"><h1>AI Radar</h1></main>
```

`web/src/app.css`:

```css
/* Token: un neutro (fondo e card), il testo, un blu. Spazi multipli di 8. Un solo font. */
:root {
  color-scheme: light;
  --bg: #f4f4f2;
  --card: #ffffff;
  --fg: #121211;
  --accent: #0068d6;
  --fg-2: color-mix(in srgb, var(--fg) 68%, var(--card));
  --fg-3: color-mix(in srgb, var(--fg) 58%, var(--card)); /* ≥ 4,5:1 sul bianco: testo piccolo leggibile (AA) */
  --line: color-mix(in srgb, var(--fg) 9%, var(--card));
  --line-2: color-mix(in srgb, var(--fg) 18%, var(--card));
  --accent-soft: color-mix(in srgb, var(--accent) 9%, var(--card));
  --shadow: 0 1px 2px rgba(18, 18, 17, .04), 0 8px 24px rgba(18, 18, 17, .06);
  --shadow-up: 0 2px 4px rgba(18, 18, 17, .05), 0 16px 40px rgba(18, 18, 17, .10);
  --font: "Bricolage Grotesque Variable", system-ui, -apple-system, "Segoe UI", sans-serif;
  --r-sm: 8px; --r-md: 16px; --r-lg: 24px;
  --s1: 8px; --s2: 16px; --s3: 24px; --s4: 32px; --s5: 40px; --s6: 48px; --s8: 64px; --s12: 96px;
  --ease: cubic-bezier(.2, .7, .2, 1);
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --bg: #0b0b0a; --card: #161615; --fg: #ececea; --accent: #4ea3ff;
    --shadow: 0 0 0 1px rgba(255, 255, 255, .06); --shadow-up: 0 0 0 1px rgba(255, 255, 255, .14);
  }
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --bg: #0b0b0a; --card: #161615; --fg: #ececea; --accent: #4ea3ff;
  --shadow: 0 0 0 1px rgba(255, 255, 255, .06); --shadow-up: 0 0 0 1px rgba(255, 255, 255, .14);
}

* { box-sizing: border-box; }
html { scroll-padding-top: var(--s8); }
body { margin: 0; background: var(--bg); color: var(--fg); font: 400 16px/24px var(--font); -webkit-font-smoothing: antialiased; }
h1, h2, h3, p, figure { margin: 0; }
button { font: inherit; color: inherit; }
img { display: block; max-width: 100%; }
a { color: inherit; text-underline-offset: 3px; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.wrap { max-width: 1240px; margin-inline: auto; padding-inline: var(--s2); padding-block: var(--s3) var(--s12); display: grid; gap: var(--s6); }
@media (min-width: 720px) { .wrap { padding-inline: var(--s5); } }
.small { font-size: 12px; line-height: 16px; }
.muted { color: var(--fg-2); }
.skip { position: absolute; left: var(--s2); top: -64px; background: var(--card); padding: var(--s1) var(--s2); border-radius: var(--r-sm); box-shadow: var(--shadow); z-index: 10; }
.skip:focus { top: var(--s2); }

/* testo dentro gli SVG dei grafici */
.t10 { font: 400 10px var(--font); fill: var(--fg-3); font-variant-numeric: tabular-nums; }
.t12 { font: 400 12px var(--font); fill: var(--fg-2); }
.t12b { font: 600 12px var(--font); fill: var(--fg); }
.t12b.hot, .t12.hot { fill: var(--accent); }
.halo { paint-order: stroke; stroke: var(--card); stroke-width: 4px; stroke-linejoin: round; }

::view-transition-group(*) { animation-duration: .4s; animation-timing-function: var(--ease); }
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; }
  *, *::before, *::after { transition: none !important; animation: none !important; }
}
```

- [ ] **Step 5: Scrivere i test dei formati (falliscono)**

`web/src/lib/text/format.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { capitalize, day, daysTo, isoDay, lowerFirst, monthName, monthYear, nf, signedPts, ym } from './format';

describe('formati italiani', () => {
  it('numeri con separatori italiani', () => {
    expect(nf(12345.6, 1)).toBe('12.345,6');
    expect(nf(290)).toBe('290');
    expect(nf(2.216, 1)).toBe('2,2');
  });
  it('date brevi', () => {
    expect(day('2026-12-02')).toBe('2 dic 2026');
    expect(day('2026-10-15T08:49:44+00:00')).toBe('15 ott 2026');
  });
  it('mesi', () => {
    expect(monthName('2026-10')).toBe('ottobre');
    expect(monthYear('2027-04')).toBe('aprile 2027');
    expect(ym(new Date(2026, 9, 15))).toBe('2026-10');
    expect(isoDay(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
  it('giorni mancanti', () => {
    const today = new Date(2026, 9, 15, 23, 30);
    expect(daysTo('2026-12-02', today)).toBe(48);
    expect(daysTo('2026-10-15', today)).toBe(0);
    expect(daysTo('2026-10-14', today)).toBe(-1);
  });
  it('variazioni in punti', () => {
    expect(signedPts(0.123)).toBe('+12');
    expect(signedPts(-0.05)).toBe('−5');
    expect(signedPts(0.001)).toBe('±0');
  });
  it('maiuscole', () => {
    expect(capitalize('ottobre')).toBe('Ottobre');
    expect(lowerFirst('Fine della transizione')).toBe('fine della transizione');
    expect(capitalize('')).toBe('');
  });
});
```

Run: `npx vitest run src/lib/text/format.test.ts`
Expected: FAIL, `Failed to resolve import "./format"`.

- [ ] **Step 6: Implementare `web/src/lib/text/format.ts`**

```ts
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

export const nf = (v: number, d = 0): string =>
  v.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d });

/** Data a mezzogiorno locale: niente salti di giorno per il fuso orario. */
export const parseDay = (iso: string): Date => new Date(`${iso.slice(0, 10)}T12:00:00`);

export const day = (iso: string): string => {
  const d = parseDay(iso);
  return `${d.getDate()} ${MESI[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
};

export const monthName = (ymStr: string): string => MESI[Number(ymStr.slice(5, 7)) - 1];
export const monthYear = (ymStr: string): string => `${monthName(ymStr)} ${ymStr.slice(0, 4)}`;

const pad = (n: number) => String(n).padStart(2, '0');
export const isoDay = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const ym = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export function daysTo(iso: string, today: Date): number {
  return Math.round((parseDay(iso).getTime() - parseDay(isoDay(today)).getTime()) / 864e5);
}

export function signedPts(v: number): string {
  const r = Math.round(v * 100);
  return (r > 0 ? '+' : r < 0 ? '−' : '±') + Math.abs(r);
}

export const capitalize = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : s);
export const lowerFirst = (s: string): string => (s ? s[0].toLowerCase() + s.slice(1) : s);
```

- [ ] **Step 7: Eseguire test, controllo tipi e build**

Run: `npx vitest run && npm run check && npm run build`
Expected: test 6 passed; `svelte-check found 0 errors`; build crea `../_site/index.html`.

- [ ] **Step 8: Ignorare i file generati**

Aggiungere a `.gitignore` (nella radice del repo):

```
web/node_modules/
web/public/data/
web/test-results/
web/playwright-report/
```

- [ ] **Step 9: Commit**

```bash
git add .gitignore web/package.json web/package-lock.json web/vite.config.ts web/svelte.config.js web/tsconfig.json web/index.html web/src
git commit -m "App web: impalcatura Svelte e formati italiani"
```

---

### Task 7: Tipi, caricamento dei dati e freschezza delle fonti

**Files:**
- Create: `web/src/lib/data/types.ts`, `web/src/lib/data/load.ts`, `web/src/lib/data/freshness.ts`
- Test: `web/src/lib/data/load.test.ts`, `web/src/lib/data/freshness.test.ts`

**Interfaces:**
- Produces (`types.ts`): i tipi sotto, usati da tutti i task successivi.
- Produces (`load.ts`): `FILES` (tupla dei 13 nomi), `type FileKey`, `loadAll(base?: string, fetchFn?: typeof fetch): Promise<{ data: Dataset; failed: FileKey[] }>`.
- Produces (`freshness.ts`): `type TileState = { state: 'ok' | 'vecchio' | 'assente'; aggiornato: string | null; fallito: string | null; motivo: string | null }`, `tileState(source: string, status: Status | undefined, hasData: boolean): TileState`.

- [ ] **Step 1: Scrivere i tipi `web/src/lib/data/types.ts`**

```ts
/** Contratti dei JSON in data/, scritti dalla pipeline Python. */

export type Quadrant = 'impara-ora' | 'prova' | 'consolida' | 'osserva';

export interface SourceStatus {
  stato: 'ok' | 'errore' | 'non configurata';
  ultimo_successo?: string;
  ultimo_tentativo?: string;
  messaggio?: string;
}
export interface Status { aggiornato: string; fonti: Record<string, SourceStatus> }

export interface RadarRow {
  id: string;
  nome: string;
  breve?: string;
  descrizione: string;
  slancio: number | null;
  domanda: number | null;
  quadrante: Quadrant | null;
  slancio_prec?: number | null;
  domanda_prec?: number | null;
  quadrante_prec?: Quadrant | null;
  arxiv?: { crescita: number } | null;
  github?: { crescita: number; ultimi3: number; precedenti3: number } | null;
  lavoro?: { media: number | null; media_ue: number | null; usa: number | null } | null;
}
export interface Radar {
  generato: string;
  base_domanda: 'lavoro' | 'open-source';
  quadranti: Record<Quadrant, string>;
  competenze: RadarRow[];
}

export interface OwidPoint { entita: string; t: string; v: number }
export interface OwidSeries {
  titolo: string;
  unita: string;
  citazione: string;
  url: string;
  aggiornato_owid: string | null;
  punti: OwidPoint[];
}
export interface Owid { aggiornato: string; errori: Record<string, string>; serie: Record<string, OwidSeries> }

export interface AiActItem { data: string; titolo: string; descrizione: string; fonte: string }
export interface AiAct { scadenze: AiActItem[] }

export interface Edition { anno: number; data: string; url: string }
export interface Report {
  nome: string;
  editore: string;
  url: string;
  cadenza: string;
  edizioni: Edition[];
  prossima_prevista: string | null;
}
export interface Rapporti { rapporti: Report[] }

export interface NewsItem { titolo: string; link: string; data: string; fonte: string; tema?: string }
export interface News {
  fonti: { nome: string; url: string; tema?: string }[];
  errori: Record<string, string>;
  giorni: number;
  notizie: NewsItem[];
}

export interface EpochPoint { m: string; o: string; d: string; c: number | null; f: boolean; a: string; open: boolean }
export interface Epoch {
  fonte: string;
  url: string;
  punti: EpochPoint[];
  per_anno: { anno: number; area: string; n: number }[];
  pesi_aperti: { anno: number; aperti: number; totale: number }[];
  recenti: { m: string; o: string; d: string; a: string; accesso: string }[];
}

export interface HuggingFace {
  url: string;
  top: { id: string; url: string; tipo: string; like: number; download: number; trending: number; creato: string }[];
  tipi_top100: Record<string, number>;
}

export interface Github {
  repos: { repo: string; url: string; descrizione: string; storico: { data: string; stelle: number }[] }[];
}

export interface Arxiv { mesi: string[]; series: Record<string, Record<string, number>> }

export interface ArtificialAnalysis {
  data: string;
  url: string;
  modelli: { nome: string; creatore: string; indice: number; prezzo: number | null }[];
}

export interface Jobs {
  paesi: Record<string, string>;
  snapshots: { data: string; paese: string; totale: number; competenze: Record<string, number> }[];
}

export interface Eurostat {
  indicatore: string;
  url: string;
  nomi: Record<string, string>;
  serie: Record<string, Record<string, number>>;
}

export interface Dataset {
  status?: Status;
  radar?: Radar;
  owid?: Owid;
  ai_act?: AiAct;
  rapporti?: Rapporti;
  news?: News;
  epoch?: Epoch;
  huggingface?: HuggingFace;
  github?: Github;
  arxiv?: Arxiv;
  artificial_analysis?: ArtificialAnalysis;
  jobs?: Jobs;
  eurostat?: Eurostat;
}
```

- [ ] **Step 2: Scrivere i test (falliscono)**

`web/src/lib/data/load.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { FILES, loadAll } from './load';

const ok = (body: unknown) => ({ ok: true, json: async () => body }) as Response;

describe('loadAll', () => {
  it('tiene i file arrivati e segna quelli mancanti', async () => {
    const fetchFn = vi.fn(async (url: string) => {
      if (url === 'data/status.json') return ok({ aggiornato: 'x', fonti: {} });
      if (url === 'data/radar.json') throw new TypeError('rete');
      return { ok: false, json: async () => ({}) } as Response;
    });
    const { data, failed } = await loadAll('data/', fetchFn as unknown as typeof fetch);
    expect(data.status).toEqual({ aggiornato: 'x', fonti: {} });
    expect(data.radar).toBeUndefined();
    expect(failed).toContain('radar');
    expect(failed).toContain('owid');
    expect(failed).not.toContain('status');
    expect(failed).toHaveLength(FILES.length - 1);
  });

  it('chiede ogni file una volta, senza cache', async () => {
    const fetchFn = vi.fn(async () => ok({}));
    await loadAll('data/', fetchFn as unknown as typeof fetch);
    expect(fetchFn).toHaveBeenCalledTimes(FILES.length);
    expect(fetchFn).toHaveBeenCalledWith('data/news.json', { cache: 'no-cache' });
  });
});
```

`web/src/lib/data/freshness.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { tileState } from './freshness';
import type { Status } from './types';

const status: Status = {
  aggiornato: '2026-10-15T08:00:00+00:00',
  fonti: {
    epoch: { stato: 'ok', ultimo_successo: '2026-10-15T08:00:00+00:00' },
    arxiv: { stato: 'errore', ultimo_successo: '2026-10-08T08:00:00+00:00', ultimo_tentativo: '2026-10-15T08:00:00+00:00', messaggio: '500' },
    adzuna: { stato: 'non configurata', messaggio: 'ADZUNA_APP_ID/ADZUNA_APP_KEY non impostati' },
  },
};

describe('tileState', () => {
  it('ok con la data dell’ultimo successo', () => {
    expect(tileState('epoch', status, true)).toEqual({ state: 'ok', aggiornato: '2026-10-15T08:00:00+00:00', fallito: null, motivo: null });
  });
  it('vecchio se l’ultimo giro è fallito ma c’è un dato buono', () => {
    const s = tileState('arxiv', status, true);
    expect(s.state).toBe('vecchio');
    expect(s.aggiornato).toBe('2026-10-08T08:00:00+00:00');
    expect(s.fallito).toBe('2026-10-15T08:00:00+00:00');
  });
  it('assente senza dati, con il motivo leggibile', () => {
    expect(tileState('adzuna', status, false)).toMatchObject({ state: 'assente', motivo: 'Serve la chiave gratuita di Adzuna.' });
    expect(tileState('owid', status, false)).toMatchObject({ state: 'assente', motivo: 'Dati non ancora disponibili.' });
    expect(tileState('epoch', undefined, false).state).toBe('assente');
  });
});
```

Run: `npx vitest run src/lib/data`
Expected: FAIL, moduli `./load` e `./freshness` non trovati.

- [ ] **Step 3: Implementare `web/src/lib/data/load.ts`**

```ts
import type { Dataset } from './types';

export const FILES = [
  'status', 'radar', 'owid', 'ai_act', 'rapporti', 'news', 'epoch', 'huggingface', 'github', 'arxiv',
  'artificial_analysis', 'jobs', 'eurostat',
] as const;
export type FileKey = (typeof FILES)[number];

/** Scarica tutti i JSON in parallelo. Un file che non arriva vale come fonte assente. */
export async function loadAll(base = 'data/', fetchFn: typeof fetch = fetch): Promise<{ data: Dataset; failed: FileKey[] }> {
  const res = await Promise.allSettled(
    FILES.map(async (k) => {
      const r = await fetchFn(`${base}${k}.json`, { cache: 'no-cache' });
      if (!r.ok) throw new Error(`${k}: HTTP non riuscito`);
      return r.json();
    }),
  );
  const data: Record<string, unknown> = {};
  const failed: FileKey[] = [];
  res.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value != null) data[FILES[i]] = r.value;
    else failed.push(FILES[i]);
  });
  return { data: data as Dataset, failed };
}
```

- [ ] **Step 4: Implementare `web/src/lib/data/freshness.ts`**

```ts
import type { Status } from './types';

export interface TileState {
  state: 'ok' | 'vecchio' | 'assente';
  aggiornato: string | null;
  fallito: string | null;
  motivo: string | null;
}

const MOTIVI: Record<string, string> = {
  adzuna: 'Serve la chiave gratuita di Adzuna.',
  artificial_analysis: 'Serve la chiave gratuita di Artificial Analysis.',
};

/** Stato di una card dalla sua fonte principale in status.json. */
export function tileState(source: string, status: Status | undefined, hasData: boolean): TileState {
  const st = status?.fonti?.[source];
  if (!hasData) {
    return { state: 'assente', aggiornato: null, fallito: st?.ultimo_tentativo ?? null, motivo: MOTIVI[source] ?? 'Dati non ancora disponibili.' };
  }
  if (st?.stato === 'errore') {
    return { state: 'vecchio', aggiornato: st.ultimo_successo ?? null, fallito: st.ultimo_tentativo ?? null, motivo: null };
  }
  return { state: 'ok', aggiornato: st?.ultimo_successo ?? null, fallito: null, motivo: null };
}
```

- [ ] **Step 5: Eseguire i test**

Run: `npx vitest run src/lib/data && npm run check`
Expected: 5 passed; 0 errori di tipo.

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/data
git commit -m "App web: tipi dei dati, caricamento e stato delle fonti"
```

---

### Task 8: Link diretti

**Files:**
- Create: `web/src/lib/router.ts`
- Test: `web/src/lib/router.test.ts`

**Interfaces:**
- Produces: `TEMI` (tupla `['modelli','open','business','persone','politica','competenze','notizie','rapporti']`), `type TileId`, `parseHash(hash: string): { tema: TileId; elemento: string | null } | null`, `toHash(tema: TileId, elemento?: string | null): string`, `slug(s: string): string`.

- [ ] **Step 1: Scrivere i test (falliscono)**

`web/src/lib/router.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseHash, slug, toHash } from './router';

describe('router', () => {
  it('riconosce tema ed elemento', () => {
    expect(parseHash('#business')).toEqual({ tema: 'business', elemento: null });
    expect(parseHash('#competenze/mcp')).toEqual({ tema: 'competenze', elemento: 'mcp' });
    expect(parseHash('#notizie/the-decoder')).toEqual({ tema: 'notizie', elemento: 'the-decoder' });
  });
  it('ignora hash vuoti, sconosciuti o malformati', () => {
    expect(parseHash('')).toBeNull();
    expect(parseHash('#')).toBeNull();
    expect(parseHash('#crediti')).toBeNull();
    expect(parseHash('#business/%E0')).toEqual({ tema: 'business', elemento: null });
    expect(parseHash('#competenze/')).toEqual({ tema: 'competenze', elemento: null });
  });
  it('scrive gli hash', () => {
    expect(toHash('politica')).toBe('#politica');
    expect(toHash('competenze', 'mcp')).toBe('#competenze/mcp');
  });
  it('slug per i nomi delle fonti', () => {
    expect(slug('The Decoder')).toBe('the-decoder');
    expect(slug('EU AI Act Newsletter')).toBe('eu-ai-act-newsletter');
    expect(slug('Ünïcode & Co.')).toBe('unicode-co');
  });
});
```

Run: `npx vitest run src/lib/router.test.ts`
Expected: FAIL, modulo non trovato.

- [ ] **Step 2: Implementare `web/src/lib/router.ts`**

```ts
export const TEMI = ['modelli', 'open', 'business', 'persone', 'politica', 'competenze', 'notizie', 'rapporti'] as const;
export type TileId = (typeof TEMI)[number];

const isTile = (s: string): s is TileId => (TEMI as readonly string[]).includes(s);

/** "#tema" o "#tema/elemento". Elemento malformato: si apre il tema e lo si ignora. */
export function parseHash(hash: string): { tema: TileId; elemento: string | null } | null {
  const [tema, raw] = hash.replace(/^#/, '').split('/', 2);
  if (!tema || !isTile(tema)) return null;
  let elemento: string | null = null;
  if (raw) {
    try {
      elemento = decodeURIComponent(raw) || null;
    } catch {
      elemento = null;
    }
  }
  return { tema, elemento };
}

export const toHash = (tema: TileId, elemento?: string | null): string =>
  elemento ? `#${tema}/${encodeURIComponent(elemento)}` : `#${tema}`;

export const slug = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
```

- [ ] **Step 3: Eseguire i test**

Run: `npx vitest run src/lib/router.test.ts`
Expected: 4 passed.

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/router.ts web/src/lib/router.test.ts
git commit -m "App web: link diretti ai temi"
```

---

### Task 9: Calcoli sui dati

**Files:**
- Create: `web/src/lib/data/derive.ts`
- Test: `web/src/lib/data/derive.test.ts`

**Interfaces:**
- Consumes: tipi del Task 7, `daysTo`, `ym` del Task 6.
- Produces:
  - `interface RadarRowM extends RadarRow { breve: string; slancio: number; domanda: number; quadrante: Quadrant; sp: number | null; dp: number | null; qp: Quadrant | null; dS: number; dD: number; move: number; dC: number; changed: boolean; hasPrev: boolean }`
  - `radarRows(r: Radar): RadarRowM[]`, `radarChanges(rows: RadarRowM[]): { inn: RadarRowM[]; out: RadarRowM[] }`, `MOVE_MIN = 0.1`
  - `computeGrowth(punti: EpochPoint[], since?: number): { fattore: number; n: number } | null`
  - `tNum(t: string): number`
  - `owidPoints(o: Owid | undefined, id: string, entita?: string): OwidPoint[]`, `owidLatest(o, id, entita): OwidPoint | null`, `owidPrev(o, id, entita): OwidPoint | null`, `owidLatestByEntity(o, id): Map<string, { now: OwidPoint; was: OwidPoint | null }>`
  - `nextDeadline(items: AiActItem[] | undefined, today: Date): AiActItem | null`
  - `newsInLastDays(news: News | undefined, today: Date, days?: number): NewsItem[]`
  - `nextReport(r: Rapporti | undefined, today: Date): { report: Report; ym: string } | null`

- [ ] **Step 1: Scrivere i test (falliscono)**

`web/src/lib/data/derive.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  computeGrowth, newsInLastDays, nextDeadline, nextReport, owidLatest, owidLatestByEntity, owidPoints, owidPrev,
  radarChanges, radarRows, tNum,
} from './derive';
import type { EpochPoint, News, Owid, Radar } from './types';

const today = new Date(2026, 9, 15, 10);

const radar = (rows: Partial<Radar['competenze'][number]>[]): Radar => ({
  generato: '2026-10-15', base_domanda: 'open-source',
  quadranti: { 'impara-ora': 'Impara ora', prova: 'Da provare', consolida: 'Da consolidare', osserva: "Tieni d'occhio" },
  competenze: rows.map((r, i) => ({ id: `c${i}`, nome: `Competenza ${i}`, descrizione: '', slancio: 0.5, domanda: 0.5, quadrante: 'impara-ora', ...r })),
});

describe('radarRows', () => {
  it('calcola movimento e cambi di quadrante', () => {
    const rows = radarRows(radar([
      { breve: 'MCP', slancio: 0.6, domanda: 0.93, quadrante: 'impara-ora', slancio_prec: 0.27, domanda_prec: 0.93, quadrante_prec: 'consolida' },
      { slancio: 0.2, domanda: 0.2, quadrante: 'osserva', slancio_prec: 0.25, domanda_prec: 0.2, quadrante_prec: 'osserva' },
    ]));
    expect(rows[0]).toMatchObject({ breve: 'MCP', hasPrev: true, changed: true });
    expect(rows[0].dS).toBeCloseTo(0.33);
    expect(rows[0].move).toBeCloseTo(0.33);
    expect(rows[1]).toMatchObject({ breve: 'Competenza 1', changed: false });
    expect(radarChanges(rows).inn.map((r) => r.id)).toEqual(['c0']);
    expect(radarChanges(rows).out).toEqual([]);
  });
  it('radar.json della pipeline vecchia: niente movimento, nessun errore', () => {
    const rows = radarRows(radar([{ slancio: 0.7, domanda: 0.7 }]));
    expect(rows[0]).toMatchObject({ hasPrev: false, changed: false, move: 0, dS: 0, sp: null, breve: 'Competenza 0' });
  });
  it('scarta le competenze senza posizione', () => {
    expect(radarRows(radar([{ slancio: null }, {}]))).toHaveLength(1);
  });
});

describe('computeGrowth', () => {
  it('raddoppio annuo → fattore 2', () => {
    const punti: EpochPoint[] = [2018, 2019, 2020, 2021, 2022, 2023].map((y, i) => ({
      m: `M${y}`, o: '', d: `${y}-07-01`, c: 1e20 * 2 ** i, f: true, a: 'USA', open: false,
    }));
    const g = computeGrowth(punti)!;
    expect(g.n).toBe(6);
    expect(g.fattore).toBeCloseTo(2, 1);
  });
  it('troppi pochi modelli → null', () => {
    expect(computeGrowth([{ m: 'a', o: '', d: '2020-01-01', c: 1e20, f: true, a: '', open: false }])).toBeNull();
  });
});

describe('tempo e OWID', () => {
  const owid: Owid = {
    aggiornato: '', errori: {},
    serie: { inv: { titolo: '', unita: '', citazione: 'Q', url: 'u', aggiornato_owid: null, punti: [
      { entita: 'World', t: '2025', v: 290 }, { entita: 'World', t: '2024', v: 130 }, { entita: 'China', t: '2025', v: 12 },
    ] } },
  };
  it('tNum per anni, mesi, trimestri, giorni', () => {
    expect(tNum('2025')).toBe(2025);
    expect(tNum('2026-07')).toBeCloseTo(2026.54, 2);
    expect(tNum('2026-Q3')).toBeCloseTo(2026.625);
    expect(tNum('2026-03-31')).toBeCloseTo(2026.25, 1);
  });
  it('punti, ultimo, precedente', () => {
    expect(owidPoints(owid, 'inv', 'World').map((p) => p.t)).toEqual(['2024', '2025']);
    expect(owidLatest(owid, 'inv', 'World')?.v).toBe(290);
    expect(owidPrev(owid, 'inv', 'World')?.v).toBe(130);
    expect(owidLatest(owid, 'manca', 'World')).toBeNull();
    expect(owidLatest(undefined, 'inv', 'World')).toBeNull();
    const m = owidLatestByEntity(owid, 'inv');
    expect(m.get('World')?.was?.v).toBe(130);
    expect(m.get('China')?.was).toBeNull();
  });
});

describe('scadenze, notizie, rapporti', () => {
  it('prossima scadenza', () => {
    const items = [
      { data: '2025-08-02', titolo: 'A', descrizione: '', fonte: '' },
      { data: '2026-12-02', titolo: 'B', descrizione: '', fonte: '' },
      { data: '2027-12-02', titolo: 'C', descrizione: '', fonte: '' },
    ];
    expect(nextDeadline(items, today)?.titolo).toBe('B');
    expect(nextDeadline(items.slice(0, 1), today)).toBeNull();
    expect(nextDeadline(undefined, today)).toBeNull();
  });
  it('notizie degli ultimi 7 giorni: niente date future o mancanti', () => {
    const news: News = { fonti: [], errori: {}, giorni: 45, notizie: [
      { titolo: 'oggi', link: '', data: '2026-10-15', fonte: 'A' },
      { titolo: 'sei giorni fa', link: '', data: '2026-10-09', fonte: 'A' },
      { titolo: 'sette giorni fa', link: '', data: '2026-10-08', fonte: 'A' },
      { titolo: 'domani', link: '', data: '2026-10-16', fonte: 'A' },
      { titolo: 'senza data', link: '', data: '', fonte: 'A' },
    ] };
    expect(newsInLastDays(news, today).map((n) => n.titolo)).toEqual(['oggi', 'sei giorni fa']);
    expect(newsInLastDays(undefined, today)).toEqual([]);
  });
  it('prossimo rapporto dal mese in corso in poi', () => {
    const r = { rapporti: [
      { nome: 'A', editore: '', url: '', cadenza: '', edizioni: [], prossima_prevista: '2027-04' },
      { nome: 'B', editore: '', url: '', cadenza: '', edizioni: [], prossima_prevista: '2026-10' },
      { nome: 'C', editore: '', url: '', cadenza: '', edizioni: [], prossima_prevista: '2026-09' },
      { nome: 'D', editore: '', url: '', cadenza: '', edizioni: [], prossima_prevista: null },
    ] };
    expect(nextReport(r, today)).toEqual({ report: r.rapporti[1], ym: '2026-10' });
    expect(nextReport({ rapporti: [r.rapporti[2]] }, today)).toBeNull();
  });
});
```

Run: `npx vitest run src/lib/data/derive.test.ts`
Expected: FAIL, modulo non trovato.

- [ ] **Step 2: Implementare `web/src/lib/data/derive.ts`**

```ts
import { daysTo, ym } from '../text/format';
import type { AiActItem, EpochPoint, News, NewsItem, Owid, OwidPoint, Quadrant, Radar, RadarRow, Rapporti, Report } from './types';

export const MOVE_MIN = 0.1; // spostamento minimo per disegnare una freccia: 10 punti percentili

export interface RadarRowM extends RadarRow {
  breve: string;
  slancio: number;
  domanda: number;
  quadrante: Quadrant;
  sp: number | null;
  dp: number | null;
  qp: Quadrant | null;
  dS: number;
  dD: number;
  move: number;
  dC: number;
  changed: boolean;
  hasPrev: boolean;
}

export function radarRows(r: Radar): RadarRowM[] {
  return r.competenze
    .filter((c) => c.slancio != null && c.domanda != null && c.quadrante != null)
    .map((c) => {
      const s = c.slancio as number, d = c.domanda as number;
      const sp = c.slancio_prec ?? null, dp = c.domanda_prec ?? null, qp = c.quadrante_prec ?? null;
      const hasPrev = sp != null && dp != null;
      const dS = hasPrev ? s - (sp as number) : 0;
      const dD = hasPrev ? d - (dp as number) : 0;
      return {
        ...c, breve: c.breve || c.nome, slancio: s, domanda: d, quadrante: c.quadrante as Quadrant,
        sp, dp, qp, dS, dD, move: Math.max(Math.abs(dS), Math.abs(dD)), dC: (dS + dD) / 2,
        changed: hasPrev && qp != null && qp !== c.quadrante, hasPrev,
      };
    });
}

export function radarChanges(rows: RadarRowM[]): { inn: RadarRowM[]; out: RadarRowM[] } {
  return {
    inn: rows.filter((r) => r.changed && r.quadrante === 'impara-ora'),
    out: rows.filter((r) => r.changed && r.qp === 'impara-ora'),
  };
}

/** Crescita annua del calcolo dei modelli di frontiera: regressione su log10(FLOP). */
export function computeGrowth(punti: EpochPoint[], since = 2018): { fattore: number; n: number } | null {
  const pts = punti.filter((p) => p.f && p.c && p.c > 0 && p.d >= `${since}-01-01`).map((p) => [tNum(p.d), Math.log10(p.c as number)]);
  if (pts.length < 5) return null;
  const mx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const my = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const sxy = pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0);
  const sxx = pts.reduce((a, p) => a + (p[0] - mx) ** 2, 0);
  if (!sxx) return null;
  return { fattore: 10 ** (sxy / sxx), n: pts.length };
}

/** Tempo come numero: 2025, "2026-07", "2026-Q3", "2026-03-31". */
export function tNum(t: string): number {
  const y = Number(t.slice(0, 4));
  const q = t.match(/^\d{4}-Q([1-4])$/);
  if (q) return y + (Number(q[1]) - 1) / 4 + 0.125;
  const md = t.match(/^\d{4}-(\d{2})(?:-(\d{2}))?$/);
  if (!md) return y;
  const m = Number(md[1]);
  if (!md[2]) return y + (m - 1) / 12 + 1 / 24;
  const start = Date.UTC(y, 0, 1), end = Date.UTC(y + 1, 0, 1);
  return y + (Date.UTC(y, m - 1, Number(md[2])) - start) / (end - start);
}

export function owidPoints(o: Owid | undefined, id: string, entita?: string): OwidPoint[] {
  const pts = o?.serie?.[id]?.punti ?? [];
  return pts.filter((p) => entita === undefined || p.entita === entita).slice().sort((a, b) => tNum(a.t) - tNum(b.t));
}
export const owidLatest = (o: Owid | undefined, id: string, entita: string): OwidPoint | null => owidPoints(o, id, entita).at(-1) ?? null;
export const owidPrev = (o: Owid | undefined, id: string, entita: string): OwidPoint | null => owidPoints(o, id, entita).at(-2) ?? null;

export function owidLatestByEntity(o: Owid | undefined, id: string): Map<string, { now: OwidPoint; was: OwidPoint | null }> {
  const by = new Map<string, OwidPoint[]>();
  for (const p of owidPoints(o, id)) by.set(p.entita, [...(by.get(p.entita) ?? []), p]);
  const out = new Map<string, { now: OwidPoint; was: OwidPoint | null }>();
  by.forEach((pts, e) => out.set(e, { now: pts[pts.length - 1], was: pts[pts.length - 2] ?? null }));
  return out;
}

export function nextDeadline(items: AiActItem[] | undefined, today: Date): AiActItem | null {
  return (items ?? []).slice().sort((a, b) => a.data.localeCompare(b.data)).find((x) => daysTo(x.data, today) > 0) ?? null;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}/;
export function newsInLastDays(news: News | undefined, today: Date, days = 7): NewsItem[] {
  return (news?.notizie ?? []).filter((n) => {
    if (!ISO_DAY.test(n.data)) return false;
    const ago = -daysTo(n.data, today);
    return ago >= 0 && ago < days;
  });
}

export function nextReport(r: Rapporti | undefined, today: Date): { report: Report; ym: string } | null {
  const now = ym(today);
  const cands = (r?.rapporti ?? []).filter((x) => x.prossima_prevista && x.prossima_prevista >= now);
  cands.sort((a, b) => (a.prossima_prevista as string).localeCompare(b.prossima_prevista as string));
  return cands[0] ? { report: cands[0], ym: cands[0].prossima_prevista as string } : null;
}
```

- [ ] **Step 3: Eseguire i test**

Run: `npx vitest run src/lib/data && npm run check`
Expected: tutti i test di `src/lib/data` passano; 0 errori di tipo.

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/data/derive.ts web/src/lib/data/derive.test.ts
git commit -m "App web: calcoli su radar, OWID, scadenze, notizie e rapporti"
```

---

### Task 10: Numeri chiave, frasi e titoli scritti dai dati

**Files:**
- Create: `web/src/lib/text/frasi.ts`
- Test: `web/src/lib/text/frasi.test.ts`, `web/src/lib/test/fixtures.ts`

**Interfaces:**
- Consumes: Task 6 (`format.ts`), Task 7 (`types.ts`), Task 9 (`derive.ts`).
- Produces:
  - `interface Face { fig: string; unit: string; sent: string }`
  - `type TitleParts = { t: string; em?: boolean }[]`, `interface Head { title: TitleParts; deck: string | null }`
  - `faceModelli`, `faceOpen`, `faceBusiness`, `facePersone`, `facePolitica`, `faceCompetenze`, `faceNotizie`, `faceRapporti`: tutte `(d: Dataset, today: Date) => Face | null`
  - `headModelli`, `headOpen`, `headBusiness`, `headPersone`, `headPolitica`, `headCompetenze`, `headNotizie`, `headRapporti`: tutte `(d: Dataset, today: Date) => Head`
  - `heroThesis(d: Dataset, today: Date): TitleParts`
  - `tipoLabel(k: string): string`
  - (`fixtures.ts`) `FIXTURE: Dataset & Record<string, unknown>` e `FIXTURE_TODAY = new Date(2026, 9, 15, 10)`, usati anche dai test dei componenti e dagli e2e.

- [ ] **Step 1: Scrivere i dati di prova `web/src/lib/test/fixtures.ts`**

```ts
import type { Dataset } from '../data/types';

export const FIXTURE_TODAY = new Date(2026, 9, 15, 10);

const q = { 'impara-ora': 'Impara ora', prova: 'Da provare', consolida: 'Da consolidare', osserva: "Tieni d'occhio" } as const;
const ok = { stato: 'ok' as const, ultimo_successo: '2026-10-15T08:00:00+00:00' };

export const FIXTURE: Dataset & Record<string, unknown> = {
  status: {
    aggiornato: '2026-10-15T08:00:00+00:00',
    fonti: {
      epoch: ok, arxiv: { stato: 'errore', ultimo_successo: '2026-10-08T08:00:00+00:00', ultimo_tentativo: '2026-10-15T08:00:00+00:00', messaggio: '500' },
      github: ok, huggingface: ok, eurostat: ok, owid: ok, ai_act: ok, rapporti: ok, feeds: ok, radar: ok,
      adzuna: { stato: 'non configurata', messaggio: 'ADZUNA_APP_ID/ADZUNA_APP_KEY non impostati' },
      artificial_analysis: { stato: 'non configurata', messaggio: 'AA_API_KEY non impostata' },
    },
  },
  radar: {
    generato: '2026-10-15', base_domanda: 'open-source', quadranti: q,
    competenze: [
      { id: 'agenti', nome: 'Agenti AI', breve: 'Agenti AI', descrizione: 'Sistemi che pianificano.', slancio: 0.8, domanda: 1, quadrante: 'impara-ora', slancio_prec: 0.73, domanda_prec: 1, quadrante_prec: 'impara-ora', github: { crescita: 0.7, ultimi3: 51344, precedenti3: 30073 } },
      { id: 'mcp', nome: 'Model Context Protocol (MCP)', breve: 'MCP', descrizione: 'Lo standard per collegare strumenti.', slancio: 0.6, domanda: 0.93, quadrante: 'impara-ora', slancio_prec: 0.27, domanda_prec: 0.93, quadrante_prec: 'consolida', github: { crescita: 0.43, ultimi3: 36474, precedenti3: 25412 } },
      { id: 'rag', nome: 'RAG e ricerca semantica', breve: 'RAG', descrizione: 'Recupero di informazioni.', slancio: 0.27, domanda: 0.87, quadrante: 'consolida', slancio_prec: 0.53, domanda_prec: 0.87, quadrante_prec: 'impara-ora', github: { crescita: 0.24, ultimi3: 17574, precedenti3: 14129 } },
      { id: 'robotica', nome: 'AI fisica e robotica', breve: 'Robotica', descrizione: 'Robot.', slancio: 0.93, domanda: 0, quadrante: 'prova', slancio_prec: 0.67, domanda_prec: 0, quadrante_prec: 'prova', github: { crescita: 1.1, ultimi3: 478, precedenti3: 224 } },
      { id: 'vector-db', nome: 'Database vettoriali', breve: 'DB vettoriali', descrizione: 'Indici.', slancio: 0, domanda: 0.33, quadrante: 'osserva', slancio_prec: 0, domanda_prec: 0.33, quadrante_prec: 'osserva', github: { crescita: -0.07, ultimi3: 1721, precedenti3: 1852 } },
    ],
  },
  owid: {
    aggiornato: '2026-10-15T08:00:00+00:00', errori: {},
    serie: {
      investimenti_privati: { titolo: 'Private investment in AI', unita: 'constant 2021 US$', citazione: 'Quid via AI Index Report (2026)', url: 'https://ourworldindata.org/grapher/private-investment-in-artificial-intelligence', aggiornato_owid: '2026-04-20', punti: [
        { entita: 'World', t: '2024', v: 130850813417 }, { entita: 'World', t: '2025', v: 290094148769 },
        { entita: 'United States', t: '2024', v: 109e9 }, { entita: 'United States', t: '2025', v: 230e9 },
        { entita: 'China', t: '2024', v: 9e9 }, { entita: 'China', t: '2025', v: 12e9 },
        { entita: 'Europe', t: '2024', v: 15e9 }, { entita: 'Europe', t: '2025', v: 24e9 },
      ] },
      investimenti_generativa: { titolo: '', unita: 'constant 2021 US$', citazione: 'Quid via AI Index Report (2026)', url: 'https://ourworldindata.org/grapher/global-investment-in-generative-ai', aggiornato_owid: null, punti: [
        { entita: 'World', t: '2023', v: 25.4e9 }, { entita: 'World', t: '2024', v: 43.7e9 }, { entita: 'World', t: '2025', v: 143.8e9 },
      ] },
      uso_genai: { titolo: '', unita: '%', citazione: 'Microsoft (2026)', url: 'https://ourworldindata.org/grapher/estimated-share-people-generative-ai', aggiornato_owid: null, punti: [
        { entita: 'World', t: '2025-12-31', v: 16.3 }, { entita: 'World', t: '2026-03-31', v: 17.8 },
        { entita: 'Italy', t: '2025-12-31', v: 27.8 }, { entita: 'Italy', t: '2026-03-31', v: 30.2 },
      ] },
      imprese_ai: { titolo: '', unita: '%', citazione: 'McKinsey & Company via AI Index', url: 'https://ourworldindata.org/grapher/share-companies-using-artificial-intelligence', aggiornato_owid: null, punti: [
        { entita: 'Europe', t: '2024', v: 73 }, { entita: 'Europe', t: '2025', v: 80 },
        { entita: 'North America', t: '2024', v: 82 }, { entita: 'North America', t: '2025', v: 90 },
      ] },
    },
  },
  ai_act: { scadenze: [
    { data: '2025-08-02', titolo: 'Modelli per uso generale', descrizione: 'Obblighi GPAI.', fonte: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj' },
    { data: '2026-12-02', titolo: 'Fine della transizione per la marcatura', descrizione: 'Articolo 50(2).', fonte: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai' },
    { data: '2027-12-02', titolo: 'Sistemi ad alto rischio (allegato III)', descrizione: 'Selezione del personale.', fonte: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai' },
  ] },
  rapporti: { rapporti: [
    { nome: 'AI Index Report', editore: 'Stanford HAI', url: 'https://hai.stanford.edu/ai-index', cadenza: 'annuale', edizioni: [{ anno: 2026, data: '2026-04', url: 'https://hai.stanford.edu/ai-index' }], prossima_prevista: '2027-04' },
    { nome: 'State of AI Report', editore: 'Air Street Capital', url: 'https://www.stateof.ai', cadenza: 'annuale', edizioni: [{ anno: 2025, data: '2025-10', url: 'https://www.stateof.ai' }], prossima_prevista: '2026-10' },
  ] },
  news: {
    fonti: [{ nome: 'The Decoder', url: 'https://the-decoder.com/feed/', tema: 'prodotti' }, { nome: 'EU AI Act Newsletter', url: 'https://artificialintelligenceact.substack.com/feed', tema: 'politica' }],
    errori: {}, giorni: 45,
    notizie: [
      { titolo: "Google says self-improving AI isn't anywhere close", link: 'https://the-decoder.com/a', data: '2026-10-14', fonte: 'The Decoder', tema: 'prodotti' },
      { titolo: 'AI Act: le linee guida sulla trasparenza', link: 'https://artificialintelligenceact.eu/b', data: '2026-10-12', fonte: 'EU AI Act Newsletter', tema: 'politica' },
      { titolo: 'Una notizia vecchia', link: 'https://the-decoder.com/c', data: '2026-09-20', fonte: 'The Decoder', tema: 'prodotti' },
    ],
  },
  epoch: {
    fonte: 'Epoch AI, Data on AI Models (CC BY 4.0)', url: 'https://epoch.ai/data/ai-models',
    punti: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map((y, i) => ({ m: `Modello ${y}`, o: 'Lab', d: `${y}-06-01`, c: 1e22 * 4.8 ** i, f: true, a: 'USA', open: i % 2 === 0 })),
    per_anno: [2024, 2025].flatMap((anno) => [{ anno, area: 'USA', n: 60 }, { anno, area: 'Cina', n: 30 }, { anno, area: 'UE', n: 2 }, { anno, area: 'Regno Unito', n: 2 }]),
    pesi_aperti: [{ anno: 2024, aperti: 30, totale: 90 }, { anno: 2025, aperti: 40, totale: 100 }],
    recenti: [{ m: 'Gemini 4 Argon', o: 'Google DeepMind', d: '2026-09-30', a: 'USA', accesso: 'Limited access' }],
  },
  huggingface: {
    url: 'https://huggingface.co/models?sort=trending',
    top: [{ id: 'google/embeddinggemma-2', url: 'https://huggingface.co/google/embeddinggemma-2', tipo: 'feature-extraction', like: 2303, download: 135175, trending: 1070, creato: '2026-09-14' }],
    tipi_top100: { 'image-text-to-text': 37, 'text-generation': 15, 'text-to-image': 9, altro: 39 },
  },
  github: { repos: [{ repo: 'huggingface/transformers', url: 'https://github.com/huggingface/transformers', descrizione: 'Transformers', storico: [{ data: '2026-10-08', stelle: 167000 }, { data: '2026-10-15', stelle: 167707 }] }] },
  arxiv: { mesi: ['2026-08', '2026-09'], series: { _totale: { '2026-08': 21000, '2026-09': 22500 } } },
  eurostat: {
    indicatore: 'Imprese con almeno 10 addetti che usano almeno una tecnologia AI (% delle imprese)', url: 'https://ec.europa.eu/eurostat/databrowser/view/isoc_eb_ai/default/table',
    nomi: { EU27_2020: 'Unione europea (27)', IT: 'Italia', DK: 'Danimarca' },
    serie: { EU27_2020: { '2024': 13.48, '2025': 19.95 }, IT: { '2024': 8.2, '2025': 16.4 }, DK: { '2024': 27.58, '2025': 42.03 } },
  },
};
```

- [ ] **Step 2: Scrivere i test (falliscono)**

`web/src/lib/text/frasi.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { FIXTURE, FIXTURE_TODAY as today } from '../test/fixtures';
import type { Dataset } from '../data/types';
import {
  faceBusiness, faceCompetenze, faceModelli, faceNotizie, faceOpen, facePersone, facePolitica, faceRapporti,
  headBusiness, headCompetenze, headPolitica, heroThesis, tipoLabel,
} from './frasi';

const d = FIXTURE as Dataset;
const text = (parts: { t: string }[]) => parts.map((p) => p.t).join('');

describe('numeri chiave delle card', () => {
  it('modelli: crescita del calcolo', () => {
    expect(faceModelli(d, today)).toEqual({ fig: '×4,8', unit: "all'anno", sent: 'Quanto cresce il calcolo per addestrare i modelli di frontiera, dal 2018.' });
    expect(faceModelli({}, today)).toBeNull();
  });
  it('open source: tipo più frequente, senza contare "altro"', () => {
    expect(faceOpen(d, today)).toEqual({ fig: '37', unit: 'su 100', sent: 'Modelli di tendenza su Hugging Face di tipo «immagine e testo».' });
  });
  it('business: investimenti e rapporto con l’anno prima', () => {
    expect(faceBusiness(d, today)).toEqual({ fig: '290', unit: 'mld $', sent: 'Investimenti privati in AI nel 2025: 2,2 volte il 2024 (dollari 2021).' });
  });
  it('persone: mondo e Italia', () => {
    expect(facePersone(d, today)?.sent).toBe("Persone nel mondo che usano l'AI generativa. In Italia il 30,2%.");
    expect(facePersone(d, today)?.fig).toBe('17,8');
  });
  it('politica: giorni alla prossima scadenza, e nessuna scadenza', () => {
    expect(facePolitica(d, today)).toEqual({ fig: '48', unit: 'giorni', sent: "Alla prossima scadenza dell'AI Act, il 2 dic 2026: fine della transizione per la marcatura." });
    const late = new Date(2029, 0, 1);
    expect(facePolitica(d, late)).toEqual({ fig: '0', unit: 'scadenze in arrivo', sent: "Nessuna scadenza dell'AI Act in arrivo." });
  });
  it('competenze: chi entra e chi esce', () => {
    expect(faceCompetenze(d, today)).toEqual({ fig: 'MCP', unit: '', sent: 'Entra tra le competenze da imparare ora; RAG esce.' });
  });
  it('competenze: radar vecchio senza posizione precedente', () => {
    const old: Dataset = { radar: { ...d.radar!, competenze: d.radar!.competenze.map(({ slancio_prec, domanda_prec, quadrante_prec, breve, ...r }) => r) } };
    expect(faceCompetenze(old, today)).toEqual({ fig: '2', unit: 'su 5', sent: 'Competenze da imparare ora: sopra la mediana sia per slancio sia per domanda.' });
  });
  it('notizie: settimana e settimana vuota', () => {
    expect(faceNotizie(d, today)).toEqual({ fig: '2', unit: '', sent: 'Notizie negli ultimi 7 giorni da 2 fonti.' });
    expect(faceNotizie(d, new Date(2026, 11, 1))?.sent).toBe('Nessuna notizia negli ultimi 7 giorni.');
  });
  it('rapporti: prossimo previsto', () => {
    expect(faceRapporti(d, today)).toEqual({ fig: 'Ottobre', unit: '2026', sent: 'Prossimo rapporto previsto: State of AI Report.' });
    expect(faceRapporti(d, new Date(2028, 0, 1))?.sent).toBe('Nessun rapporto previsto nei prossimi mesi.');
  });
});

describe('titoli e tesi', () => {
  it('competenze', () => {
    const h = headCompetenze(d, today);
    expect(text(h.title)).toBe('MCP entra tra le competenze da imparare ora');
    expect(h.title[0]).toEqual({ t: 'MCP', em: true });
    expect(h.deck).toBe('RAG esce da Impara ora. Oggi 2 competenze su 5 sono sopra la mediana sia per slancio sia per domanda.');
  });
  it('business e politica', () => {
    expect(text(headBusiness(d, today).title)).toBe('Gli investimenti privati in AI 2,2 volte in un anno');
    expect(text(headPolitica(d, today).title)).toBe("48 giorni alla prossima scadenza dell'AI Act");
  });
  it('tesi della home e riserva', () => {
    expect(text(heroThesis(d, today))).toBe('Gli investimenti privati in AI sono 2,2 volte quelli di un anno fa. MCP entra tra le competenze da imparare ora.');
    expect(text(heroThesis({}, today))).toBe("Cosa succede nell'AI questa settimana.");
  });
  it('etichette dei tipi Hugging Face', () => {
    expect(tipoLabel('text-generation')).toBe('generazione di testo');
    expect(tipoLabel('sconosciuto')).toBe('sconosciuto');
  });
});
```

Run: `npx vitest run src/lib/text/frasi.test.ts`
Expected: FAIL, modulo non trovato.

- [ ] **Step 3: Implementare `web/src/lib/text/frasi.ts`**

```ts
import {
  computeGrowth, newsInLastDays, nextDeadline, nextReport, owidLatest, owidPrev, radarChanges, radarRows,
} from '../data/derive';
import type { Dataset } from '../data/types';
import { capitalize, day, daysTo, lowerFirst, monthName, monthYear, nf } from './format';

export interface Face { fig: string; unit: string; sent: string }
export type TitleParts = { t: string; em?: boolean }[];
export interface Head { title: TitleParts; deck: string | null }

const TIPI: Record<string, string> = {
  'image-text-to-text': 'immagine e testo',
  'text-generation': 'generazione di testo',
  'text-to-image': 'da testo a immagine',
  'text-classification': 'classificazione di testo',
  'text-to-speech': 'sintesi vocale',
  'automatic-speech-recognition': 'riconoscimento vocale',
  'image-text-to-video': 'da immagine e testo a video',
  'text-to-video': 'da testo a video',
  'feature-extraction': 'embedding',
  'any-to-any': 'multimodale',
  altro: 'altro',
};
export const tipoLabel = (k: string): string => TIPI[k] ?? k;
const joinE = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`);
const plain = (t: string): TitleParts => [{ t }];

// ---------------------------------------------------------------- modelli
export function faceModelli(d: Dataset, _today?: Date): Face | null {
  const g = d.epoch ? computeGrowth(d.epoch.punti) : null;
  return g && { fig: `×${nf(g.fattore, 1)}`, unit: "all'anno", sent: 'Quanto cresce il calcolo per addestrare i modelli di frontiera, dal 2018.' };
}
export function headModelli(d: Dataset, _today?: Date): Head {
  const g = d.epoch ? computeGrowth(d.epoch.punti) : null;
  if (!g) return { title: plain('Modelli e ricerca'), deck: null };
  return {
    title: [{ t: 'Il calcolo dei modelli di frontiera cresce di ' }, { t: `${nf(g.fattore, 1)} volte`, em: true }, { t: " all'anno" }],
    deck: `Stima su ${g.n} modelli di frontiera dal 2018, dai dati di Epoch AI.`,
  };
}

// ---------------------------------------------------------------- open source
function topTipo(d: Dataset): [string, number] | null {
  const e = Object.entries(d.huggingface?.tipi_top100 ?? {}).filter(([k]) => k !== 'altro').sort((a, b) => b[1] - a[1]);
  return e[0] ?? null;
}
export function faceOpen(d: Dataset, _today?: Date): Face | null {
  const t = topTipo(d);
  return t && { fig: String(t[1]), unit: 'su 100', sent: `Modelli di tendenza su Hugging Face di tipo «${tipoLabel(t[0])}».` };
}
export function headOpen(d: Dataset, _today?: Date): Head {
  const t = topTipo(d);
  if (!t) return { title: plain('Open source'), deck: null };
  const first = d.huggingface?.top[0]?.id;
  return {
    title: [{ t: 'Tra i modelli di tendenza vince il tipo ' }, { t: tipoLabel(t[0]), em: true }],
    deck: `${t[1]} dei 100 modelli più seguiti questa settimana su Hugging Face.${first ? ` Il primo è ${first}.` : ''}`,
  };
}

// ---------------------------------------------------------------- business
function invest(d: Dataset) {
  const last = owidLatest(d.owid, 'investimenti_privati', 'World');
  const prev = owidPrev(d.owid, 'investimenti_privati', 'World');
  return last && prev && prev.v ? { last, prev, ratio: last.v / prev.v } : null;
}
export function faceBusiness(d: Dataset, _today?: Date): Face | null {
  const i = invest(d);
  return i && { fig: nf(i.last.v / 1e9), unit: 'mld $', sent: `Investimenti privati in AI nel ${i.last.t}: ${nf(i.ratio, 1)} volte il ${i.prev.t} (dollari 2021).` };
}
export function headBusiness(d: Dataset, _today?: Date): Head {
  const i = invest(d);
  if (!i) return { title: plain('Business'), deck: null };
  const gen = owidLatest(d.owid, 'investimenti_generativa', 'World');
  return {
    title: [{ t: 'Gli investimenti privati in AI ' }, { t: `${nf(i.ratio, 1)} volte`, em: true }, { t: ' in un anno' }],
    deck: `Nel ${i.last.t} ${nf(i.last.v / 1e9)} miliardi di dollari (a prezzi 2021) in aziende AI non quotate.` +
      (gen && gen.t === i.last.t ? ` L'AI generativa da sola vale ${nf(gen.v / 1e9)} miliardi.` : ''),
  };
}

// ---------------------------------------------------------------- persone
export function facePersone(d: Dataset, _today?: Date): Face | null {
  const w = owidLatest(d.owid, 'uso_genai', 'World');
  if (!w) return null;
  const it = owidLatest(d.owid, 'uso_genai', 'Italy');
  return { fig: nf(w.v, 1), unit: '%', sent: "Persone nel mondo che usano l'AI generativa." + (it ? ` In Italia il ${nf(it.v, 1)}%.` : '') };
}
export function headPersone(d: Dataset, _today?: Date): Head {
  const w = owidLatest(d.owid, 'uso_genai', 'World');
  if (!w) return { title: plain('Persone e lavoro'), deck: null };
  const it = owidLatest(d.owid, 'uso_genai', 'Italy');
  return {
    title: [{ t: "Usa l'AI generativa il " }, { t: `${nf(w.v, 1)}%`, em: true }, { t: ' delle persone nel mondo' }],
    deck: `${it ? `In Italia il ${nf(it.v, 1)}%. ` : ''}Stima di Microsoft al ${day(w.t)}.`,
  };
}

// ---------------------------------------------------------------- politica
export function facePolitica(d: Dataset, today: Date): Face | null {
  if (!d.ai_act?.scadenze?.length) return null;
  const n = nextDeadline(d.ai_act.scadenze, today);
  if (!n) return { fig: '0', unit: 'scadenze in arrivo', sent: "Nessuna scadenza dell'AI Act in arrivo." };
  const days = daysTo(n.data, today);
  return { fig: String(days), unit: days === 1 ? 'giorno' : 'giorni', sent: `Alla prossima scadenza dell'AI Act, il ${day(n.data)}: ${lowerFirst(n.titolo)}.` };
}
export function headPolitica(d: Dataset, today: Date): Head {
  const n = nextDeadline(d.ai_act?.scadenze, today);
  if (!n) return { title: plain("Nessuna scadenza dell'AI Act in arrivo"), deck: null };
  const days = daysTo(n.data, today);
  return {
    title: [{ t: `${days} ${days === 1 ? 'giorno' : 'giorni'}`, em: true }, { t: " alla prossima scadenza dell'AI Act" }],
    deck: `Il ${day(n.data)}: ${lowerFirst(n.titolo)}. ${n.descrizione}`,
  };
}

// ---------------------------------------------------------------- competenze
export function faceCompetenze(d: Dataset, _today?: Date): Face | null {
  const rows = d.radar ? radarRows(d.radar) : [];
  if (!rows.length) return null;
  const { inn, out } = radarChanges(rows);
  if (inn.length) {
    return {
      fig: inn.map((r) => r.breve).join(', '), unit: '',
      sent: `${inn.length > 1 ? 'Entrano' : 'Entra'} tra le competenze da imparare ora` +
        (out.length ? `; ${out.map((r) => r.breve).join(', ')} ${out.length > 1 ? 'escono' : 'esce'}.` : '.'),
    };
  }
  const n = rows.filter((r) => r.quadrante === 'impara-ora').length;
  return { fig: String(n), unit: `su ${rows.length}`, sent: 'Competenze da imparare ora: sopra la mediana sia per slancio sia per domanda.' };
}
export function headCompetenze(d: Dataset, _today?: Date): Head {
  const rows = d.radar ? radarRows(d.radar) : [];
  if (!rows.length) return { title: plain('Competenze'), deck: null };
  const { inn, out } = radarChanges(rows);
  const n = rows.filter((r) => r.quadrante === 'impara-ora').length;
  const tail = `Oggi ${n} competenze su ${rows.length} sono sopra la mediana sia per slancio sia per domanda.`;
  if (!inn.length) return { title: plain('Nessun cambio tra le competenze da imparare ora'), deck: tail };
  return {
    title: [{ t: joinE(inn.map((r) => r.breve)), em: true }, { t: ` ${inn.length > 1 ? 'entrano' : 'entra'} tra le competenze da imparare ora` }],
    deck: (out.length ? `${joinE(out.map((r) => r.breve))} ${out.length > 1 ? 'escono' : 'esce'} da Impara ora. ` : '') + tail,
  };
}

// ---------------------------------------------------------------- notizie
export function faceNotizie(d: Dataset, today: Date): Face | null {
  if (!d.news) return null;
  const n = newsInLastDays(d.news, today).length;
  if (!n) return { fig: '0', unit: '', sent: 'Nessuna notizia negli ultimi 7 giorni.' };
  return { fig: String(n), unit: '', sent: `Notizie negli ultimi 7 giorni da ${d.news.fonti.length} fonti.` };
}
export function headNotizie(d: Dataset, today: Date): Head {
  const n = newsInLastDays(d.news, today).length;
  return {
    title: [{ t: String(n), em: true }, { t: n === 1 ? ' notizia in una settimana' : ' notizie in una settimana' }],
    deck: `Solo titolo, data e link agli articoli originali, da ${d.news?.fonti.length ?? 0} fonti.`,
  };
}

// ---------------------------------------------------------------- rapporti
export function faceRapporti(d: Dataset, today: Date): Face | null {
  if (!d.rapporti?.rapporti?.length) return null;
  const n = nextReport(d.rapporti, today);
  if (!n) return { fig: '—', unit: '', sent: 'Nessun rapporto previsto nei prossimi mesi.' };
  return { fig: capitalize(monthName(n.ym)), unit: n.ym.slice(0, 4), sent: `Prossimo rapporto previsto: ${n.report.nome}.` };
}
export function headRapporti(d: Dataset, today: Date): Head {
  const n = nextReport(d.rapporti, today);
  if (!n) return { title: plain('Rapporti periodici sull’AI'), deck: 'Solo link e date: nessuna sintesi.' };
  return {
    title: [{ t: 'Prossimo rapporto: ' }, { t: n.report.nome, em: true }],
    deck: `Previsto per ${monthYear(n.ym)}: è una stima. Qui trovi solo link e date, nessuna sintesi.`,
  };
}

// ---------------------------------------------------------------- tesi della home
export function heroThesis(d: Dataset, today: Date): TitleParts {
  const parts: TitleParts = [];
  const i = invest(d);
  if (i) parts.push({ t: 'Gli investimenti privati in AI sono ' }, { t: `${nf(i.ratio, 1)} volte`, em: true }, { t: ' quelli di un anno fa.' });
  const rows = d.radar ? radarRows(d.radar) : [];
  const { inn } = radarChanges(rows);
  if (inn.length) {
    if (parts.length) parts.push({ t: ' ' });
    parts.push({ t: joinE(inn.map((r) => r.breve)), em: true }, { t: ` ${inn.length > 1 ? 'entrano' : 'entra'} tra le competenze da imparare ora.` });
  }
  void today;
  return parts.length ? parts : plain("Cosa succede nell'AI questa settimana.");
}
```

- [ ] **Step 4: Eseguire i test**

Run: `npx vitest run && npm run check`
Expected: tutti passano; 0 errori di tipo. Se `faceModelli` dà `×4,7` invece di `×4,8`, è un errore di arrotondamento della regressione sui dati di prova: controllare che i punti di prova abbiano `c: 1e22 * 4.8 ** i` con un anno di distanza.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/text/frasi.ts web/src/lib/text/frasi.test.ts web/src/lib/test/fixtures.ts
git commit -m "App web: numeri chiave, frasi e titoli scritti dai dati"
```

---

### Task 11: Posizionamento delle etichette

**Files:**
- Create: `web/src/lib/charts/labels.ts`, `web/src/lib/charts/types.ts`
- Test: `web/src/lib/charts/labels.test.ts`

**Interfaces:**
- Produces (`labels.ts`): `interface Box { x0: number; y0: number; x1: number; y1: number }`, `interface LabelItem { id: string; x: number; y: number; w: number; h: number }`, `placeLabels(items: LabelItem[], bounds: Box, obstacles: Box[], gap?: number): Map<string, Box>`, `measureText(text: string, font: string): number`, `leader(item: LabelItem, box: Box): { x2: number; y2: number } | null`.
- Produces (`types.ts`): `type Cite = { t: string; href?: string }[]`, `interface TableData { cols: string[]; rows: (string | number)[][] }`, `interface SeriesPt { x: number; y: number }`, `interface Series { name: string; hot?: boolean; pts: SeriesPt[] }`.

- [ ] **Step 1: Scrivere i test (falliscono)**

`web/src/lib/charts/labels.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { leader, measureText, placeLabels, type Box } from './labels';

const overlap = (a: Box, b: Box) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
const bounds = { x0: 0, y0: 0, x1: 400, y1: 300 };

describe('placeLabels', () => {
  it('due punti nello stesso posto: etichette senza sovrapposizioni', () => {
    const m = placeLabels([{ id: 'a', x: 200, y: 150, w: 60, h: 16 }, { id: 'b', x: 200, y: 150, w: 60, h: 16 }], bounds, []);
    expect(overlap(m.get('a')!, m.get('b')!)).toBe(false);
  });
  it('resta dentro i bordi anche vicino al margine', () => {
    const b = placeLabels([{ id: 'a', x: 395, y: 5, w: 80, h: 16 }], bounds, []).get('a')!;
    expect(b.x0).toBeGreaterThanOrEqual(0);
    expect(b.x1).toBeLessThanOrEqual(400);
    expect(b.y0).toBeGreaterThanOrEqual(0);
  });
  it('evita gli ostacoli', () => {
    const obstacle = { x0: 205, y0: 130, x1: 300, y1: 170 };
    const b = placeLabels([{ id: 'a', x: 200, y: 150, w: 60, h: 16 }], bounds, [obstacle]).get('a')!;
    expect(overlap(b, obstacle)).toBe(false);
  });
  it('linea di richiamo solo se l’etichetta è lontana', () => {
    expect(leader({ id: 'a', x: 10, y: 10, w: 10, h: 10 }, { x0: 20, y0: 5, x1: 40, y1: 15 })).toBeNull();
    expect(leader({ id: 'a', x: 10, y: 10, w: 10, h: 10 }, { x0: 60, y0: 60, x1: 80, y1: 76 })).toEqual({ x2: 60, y2: 60 });
  });
  it('misura il testo anche senza canvas', () => {
    expect(measureText('MCP', '12px sans-serif')).toBeGreaterThan(10);
  });
});
```

Run: `npx vitest run src/lib/charts/labels.test.ts`
Expected: FAIL, modulo non trovato.

- [ ] **Step 2: Implementare `web/src/lib/charts/types.ts`**

```ts
export type Cite = { t: string; href?: string }[];
export interface TableData { cols: string[]; rows: (string | number)[][] }
export interface SeriesPt { x: number; y: number }
export interface Series { name: string; hot?: boolean; pts: SeriesPt[] }
```

- [ ] **Step 3: Implementare `web/src/lib/charts/labels.ts`**

```ts
export interface Box { x0: number; y0: number; x1: number; y1: number }
export interface LabelItem { id: string; x: number; y: number; w: number; h: number }

const hits = (b: Box, taken: Box[]) => taken.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0);
const inside = (b: Box, r: Box) => b.x0 >= r.x0 && b.x1 <= r.x1 && b.y0 >= r.y0 && b.y1 <= r.y1;

/** Per ogni etichetta prova posizioni attorno al punto e tiene la prima libera e dentro i bordi. */
export function placeLabels(items: LabelItem[], bounds: Box, obstacles: Box[], gap = 10): Map<string, Box> {
  const taken = obstacles.slice();
  const out = new Map<string, Box>();
  for (const it of items) {
    const { x, y, w, h } = it;
    const cands: [number, number][] = [
      [x + gap, y - h / 2], [x - gap - w, y - h / 2], [x - w / 2, y - gap - h], [x - w / 2, y + gap],
      [x + gap, y - h + 4], [x + gap, y - 4], [x - gap - w, y - h + 4], [x - gap - w, y - 4],
      [x + gap, y - h / 2 - h], [x + gap, y + h / 2], [x - gap - w, y - h / 2 - h], [x - gap - w, y + h / 2],
      [x - w / 2, y - gap - 2 * h], [x - w / 2, y + gap + h],
    ];
    const boxes = cands.map(([x0, y0]) => ({ x0, y0, x1: x0 + w, y1: y0 + h }));
    const best = boxes.find((b) => inside(b, bounds) && !hits(b, taken)) ?? boxes.find((b) => inside(b, bounds)) ?? boxes[0];
    out.set(it.id, best);
    taken.push(best);
  }
  return out;
}

/** Punto della box più vicino al punto del dato, se l'etichetta è finita lontana (> 18 px). */
export function leader(it: LabelItem, b: Box): { x2: number; y2: number } | null {
  const x2 = Math.max(b.x0, Math.min(it.x, b.x1));
  const y2 = Math.max(b.y0, Math.min(it.y, b.y1));
  return Math.hypot(x2 - it.x, y2 - it.y) > 18 ? { x2, y2 } : null;
}

let ctx: CanvasRenderingContext2D | null | undefined;
/** Larghezza del testo in px; senza canvas (test) usa una stima prudente. */
export function measureText(text: string, font: string): number {
  if (ctx === undefined) {
    try {
      ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
    } catch {
      ctx = null;
    }
  }
  if (ctx) {
    ctx.font = font;
    const w = ctx.measureText(text).width;
    if (w > 0) return w;
  }
  const size = Number(font.match(/(\d+)px/)?.[1] ?? 12);
  return text.length * size * 0.56;
}
```

- [ ] **Step 4: Eseguire i test**

Run: `npx vitest run src/lib/charts/labels.test.ts`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/charts/labels.ts web/src/lib/charts/types.ts web/src/lib/charts/labels.test.ts
git commit -m "App web: posizionamento delle etichette nei grafici"
```

---

### Task 12: Blocchi e grafici di base

**Files:**
- Create: `web/src/lib/charts/Block.svelte`, `DataTable.svelte`, `LineChart.svelte`, `Bars.svelte`, `DotPlot.svelte`, `Scatter.svelte`, `Timeline.svelte`
- Create (solo test): `web/src/lib/charts/__tests__/Throws.svelte`, `web/src/lib/charts/__tests__/BlockHarness.svelte`
- Test: `web/src/lib/charts/charts.test.ts`

**Interfaces:**
- Consumes: `charts/types.ts` (Task 11), `measureText`, `placeLabels`, `leader` (Task 11), `nf`, `day`, `monthYear`, `isoDay`, `ym` (Task 6).
- Produces (props dei componenti):
  - `Block`: `{ title: string; note?: string | null; span?: 4 | 6 | 8 | 12; cite?: Cite | null; table?: TableData | null; missing?: string | null; children?: Snippet }`
  - `DataTable`: `{ cols: string[]; rows: (string | number)[][] }`
  - `LineChart`: `{ series: Series[]; label: string; height?: number; yFormat?: (v: number) => string; xFormat?: (v: number) => string }`
  - `Bars`: `{ data: { k: string; v: number }[]; label: string; height?: number; format?: (v: number) => string; hotLast?: boolean }`
  - `DotPlot`: `{ data: { k: string; now: number; was?: number | null; hot?: boolean }[]; label: string; unit?: string; maxV?: number }`
  - `Scatter`: `{ pts: { x: number; y: number; label?: string; hot?: boolean }[]; label: string; xLog?: boolean; yLog?: boolean; xFormat?: (v: number) => string; yFormat?: (v: number) => string; xTitle: string; yTitle: string; height?: number }`
  - `Timeline`: `{ items: { date: string; title: string; text?: string; href?: string }[]; today: Date; label: string }`

- [ ] **Step 1: Scrivere i test (falliscono)**

`web/src/lib/charts/__tests__/Throws.svelte`:

```svelte
<script lang="ts">
  throw new Error('grafico rotto');
</script>
```

`web/src/lib/charts/__tests__/BlockHarness.svelte`:

```svelte
<script lang="ts">
  import Block from '../Block.svelte';
  import Throws from './Throws.svelte';
  let { broken = false, missing = null }: { broken?: boolean; missing?: string | null } = $props();
</script>

<Block title="Prova" note="Nota" {missing} cite={[{ t: 'Fonte: ' }, { t: 'OWID', href: 'https://ourworldindata.org' }]} table={{ cols: ['Anno', 'Valore'], rows: [['2025', 290]] }}>
  {#if broken}<Throws />{:else}<p>grafico ok</p>{/if}
</Block>
```

`web/src/lib/charts/charts.test.ts`:

```ts
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Bars from './Bars.svelte';
import DataTable from './DataTable.svelte';
import DotPlot from './DotPlot.svelte';
import LineChart from './LineChart.svelte';
import Scatter from './Scatter.svelte';
import Timeline from './Timeline.svelte';
import BlockHarness from './__tests__/BlockHarness.svelte';

describe('Block', () => {
  it('mostra titolo, grafico, fonte cliccabile e dati', () => {
    render(BlockHarness);
    expect(screen.getByRole('heading', { name: 'Prova' })).toBeInTheDocument();
    expect(screen.getByText('grafico ok')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'OWID' })).toHaveAttribute('href', 'https://ourworldindata.org');
    expect(screen.getByText('Vedi i dati')).toBeInTheDocument();
  });
  it('un grafico che si rompe non rompe la pagina', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(BlockHarness, { broken: true });
    expect(screen.getByText('Grafico non disponibile.')).toBeInTheDocument();
    err.mockRestore();
  });
  it('dati mancanti: messaggio al posto del grafico', () => {
    render(BlockHarness, { missing: 'Dati non disponibili in questo aggiornamento.' });
    expect(screen.getByText('Dati non disponibili in questo aggiornamento.')).toBeInTheDocument();
    expect(screen.queryByText('grafico ok')).toBeNull();
    expect(screen.queryByText('Vedi i dati')).toBeNull();
  });
});

describe('DataTable', () => {
  it('numeri in italiano, prima colonna come intestazione di riga', () => {
    render(DataTable, { cols: ['Area', 'Valore'], rows: [['Mondo', 12345.6], ['Italia', 30]] });
    expect(screen.getByRole('rowheader', { name: 'Mondo' })).toBeInTheDocument();
    expect(screen.getByText('12.345,6')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });
});

describe('grafici', () => {
  it('LineChart: una linea per serie ed etichette finali', () => {
    const { container } = render(LineChart, { label: 'Investimenti', series: [
      { name: 'USA', hot: true, pts: [{ x: 2024, y: 109 }, { x: 2025, y: 230 }] },
      { name: 'Cina', pts: [{ x: 2024, y: 9 }, { x: 2025, y: 12 }] },
    ] });
    expect(container.querySelectorAll('path.ln')).toHaveLength(2);
    expect(container.querySelector('path.ln.hot')).not.toBeNull();
    expect(screen.getByText('USA 230')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Investimenti' })).toBeInTheDocument();
  });
  it('Bars: una barra per dato, l’ultima in evidenza', () => {
    const { container } = render(Bars, { label: 'Generativa', data: [{ k: '2024', v: 43.7 }, { k: '2025', v: 143.8 }] });
    const bars = container.querySelectorAll('rect.bar');
    expect(bars).toHaveLength(2);
    expect(bars[1]).toHaveClass('hot');
  });
  it('DotPlot: punto pieno per oggi e vuoto per l’anno prima', () => {
    const { container } = render(DotPlot, { label: 'Imprese', data: [{ k: 'Europa', now: 80, was: 73, hot: true }, { k: 'Asia', now: 70 }] });
    expect(container.querySelectorAll('circle.now')).toHaveLength(2);
    expect(container.querySelectorAll('circle.was')).toHaveLength(1);
    expect(screen.getByText('Europa')).toHaveClass('hot');
  });
  it('Scatter: un punto per dato, scala logaritmica', () => {
    const { container } = render(Scatter, { label: 'Calcolo', xTitle: 'anno', yTitle: 'FLOP', yLog: true,
      pts: [{ x: 2020, y: 1e22 }, { x: 2025, y: 1e26, hot: true, label: 'Ultimo' }] });
    expect(container.querySelectorAll('circle.pt')).toHaveLength(2);
    expect(screen.getByText('Ultimo')).toBeInTheDocument();
  });
  it('Timeline: riga "oggi" prima della prossima voce, che è in evidenza', () => {
    const { container } = render(Timeline, { label: 'AI Act', today: new Date(2026, 9, 15), items: [
      { date: '2025-08-02', title: 'Passato' },
      { date: '2026-12-02', title: 'Prossima', href: 'https://eur-lex.europa.eu' },
      { date: '2027-04', title: 'Mese' },
    ] });
    const lis = [...container.querySelectorAll('li')];
    // Svelte aggiunge una classe svelte-xxxx per gli stili: la si ignora
    const cls = (l: Element) => [...l.classList].filter((c) => !c.startsWith('svelte-')).join(' ');
    expect(lis.map(cls)).toEqual(['past', 'today', 'future next', 'future']);
    expect(screen.getByText('2 dic 2026')).toBeInTheDocument();
    expect(screen.getByText('aprile 2027')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Prossima' })).toHaveAttribute('href', 'https://eur-lex.europa.eu');
  });
});
```

Run: `npx vitest run src/lib/charts/charts.test.ts`
Expected: FAIL, componenti non trovati.

- [ ] **Step 2: `web/src/lib/charts/DataTable.svelte`**

```svelte
<script lang="ts">
  import { nf } from '../text/format';
  import type { TableData } from './types';

  let { cols, rows }: TableData = $props();
  const fmt = (v: string | number) => (typeof v === 'number' ? nf(v, Number.isInteger(v) ? 0 : 1) : v);
</script>

<div class="tw" tabindex="0" role="region" aria-label="Tabella dei dati">
  <table>
    <thead><tr>{#each cols as c (c)}<th scope="col">{c}</th>{/each}</tr></thead>
    <tbody>
      {#each rows as r, i (i)}
        <tr>
          {#each r as v, j (j)}
            {#if j === 0}<th scope="row">{fmt(v)}</th>{:else}<td class:num={typeof v === 'number'}>{fmt(v)}</td>{/if}
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .tw { overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; line-height: 24px; font-variant-numeric: tabular-nums; }
  th, td { text-align: left; padding: var(--s1); border-bottom: 1px solid var(--line); white-space: nowrap; }
  thead th { font-size: 12px; line-height: 16px; color: var(--fg-3); font-weight: 500; }
  tbody th { font-weight: 500; }
  .num { text-align: right; }
</style>
```

- [ ] **Step 3: `web/src/lib/charts/Block.svelte`**

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import DataTable from './DataTable.svelte';
  import type { Cite, TableData } from './types';

  let { title, note = null, span = 6, cite = null, table = null, missing = null, children }: {
    title: string;
    note?: string | null;
    span?: 4 | 6 | 8 | 12;
    cite?: Cite | null;
    table?: TableData | null;
    missing?: string | null;
    children?: Snippet;
  } = $props();
</script>

<section class="blk w{span}">
  <h3>{title}</h3>
  {#if note}<p class="note">{note}</p>{/if}
  {#if missing}
    <p class="note">{missing}</p>
  {:else if children}
    <svelte:boundary onerror={(e) => console.error(e)}>
      {@render children()}
      {#snippet failed()}<p class="note">Grafico non disponibile.</p>{/snippet}
    </svelte:boundary>
  {/if}
  {#if cite && !missing}
    <p class="cite">
      {#each cite as c, i (i)}{#if c.href}<a href={c.href} target="_blank" rel="noopener">{c.t}</a>{:else}{c.t}{/if}{/each}
    </p>
  {/if}
  {#if table && !missing}
    <details class="data"><summary>Vedi i dati</summary><DataTable cols={table.cols} rows={table.rows} /></details>
  {/if}
</section>

<style>
  .blk { grid-column: span 6; display: grid; gap: var(--s2); align-content: start; min-width: 0; background: var(--card); border-radius: var(--r-lg); box-shadow: var(--shadow); padding: var(--s3); }
  .w4 { grid-column: span 4; } .w8 { grid-column: span 8; } .w12 { grid-column: 1 / -1; }
  @media (max-width: 900px) { .blk { grid-column: 1 / -1; } }
  @media (max-width: 560px) { .blk { padding: var(--s2); } }
  h3 { font-weight: 600; font-size: 20px; line-height: 24px; letter-spacing: -.01em; }
  .note { font-size: 14px; line-height: 24px; color: var(--fg-2); }
  .cite { font-size: 12px; line-height: 16px; color: var(--fg-3); }
  .cite a { color: inherit; }
  details summary { cursor: pointer; font-size: 14px; color: var(--fg-2); min-height: 40px; display: flex; align-items: center; }
</style>
```

- [ ] **Step 4: `web/src/lib/charts/LineChart.svelte`**

```svelte
<script lang="ts">
  import { extent, max } from 'd3-array';
  import { scaleLinear } from 'd3-scale';
  import { curveMonotoneX, line } from 'd3-shape';
  import { nf } from '../text/format';
  import type { Series, SeriesPt } from './types';

  let { series, label, height = 304, yFormat = (v: number) => nf(v), xFormat = (v: number) => String(Math.round(v)) }: {
    series: Series[];
    label: string;
    height?: number;
    yFormat?: (v: number) => string;
    xFormat?: (v: number) => string;
  } = $props();

  let cw = $state(0);
  const w = $derived(Math.max(cw, 280));
  const m = { l: 40, r: 96, t: 16, b: 32 };
  const all = $derived(series.flatMap((s) => s.pts));
  const x = $derived(scaleLinear(extent(all, (p) => p.x) as [number, number], [m.l, w - m.r]));
  const y = $derived(scaleLinear([0, max(all, (p) => p.y) ?? 1], [height - m.b, m.t]).nice());
  const xTicks = $derived(x.ticks(Math.max(2, Math.min(6, Math.floor(w / 96)))).filter(Number.isInteger));
  const ordered = $derived(series.slice().sort((a, b) => Number(!!a.hot) - Number(!!b.hot)));
  const path = (pts: SeriesPt[]) => line<SeriesPt>().curve(curveMonotoneX).x((p) => x(p.x)).y((p) => y(p.y))(pts) ?? '';
  const ends = $derived.by(() => {
    const e = series.filter((s) => s.pts.length).map((s) => {
      const lp = s.pts[s.pts.length - 1];
      return { s, lp, ty: y(lp.y) };
    }).sort((a, b) => a.ty - b.ty);
    for (let i = 1; i < e.length; i++) e[i].ty = Math.max(e[i].ty, e[i - 1].ty + 16);
    return e;
  });
</script>

<div class="chart" bind:clientWidth={cw}>
  <svg viewBox="0 0 {w} {height}" width={w} {height} role="img" aria-label={label}>
    {#each y.ticks(4) as v (v)}
      <line x1={m.l} x2={w - m.r} y1={y(v)} y2={y(v)} class={v ? 'grid' : 'base'} />
      <text class="t10" x={m.l - 8} y={y(v) + 3} text-anchor="end">{yFormat(v)}</text>
    {/each}
    {#each xTicks as v (v)}<text class="t10" x={x(v)} y={height - 12} text-anchor="middle">{xFormat(v)}</text>{/each}
    {#each ordered as s (s.name)}
      <path d={path(s.pts)} class="ln" class:hot={s.hot} />
      {#if s.pts.length}
        {@const lp = s.pts[s.pts.length - 1]}
        <circle cx={x(lp.x)} cy={y(lp.y)} r={s.hot ? 4.5 : 3.5} class="dot" class:hot={s.hot} />
      {/if}
    {/each}
    {#each ends as e (e.s.name)}
      <text class={e.s.hot ? 't12b hot' : 't12'} x={w - m.r + 10} y={e.ty + 4}>{e.s.name} {yFormat(e.lp.y)}</text>
    {/each}
  </svg>
</div>

<style>
  svg { display: block; width: 100%; height: auto; overflow: visible; }
  .grid { stroke: var(--line); } .base { stroke: var(--line-2); }
  .ln { fill: none; stroke: var(--fg-3); stroke-width: 1.5; stroke-linecap: round; }
  .ln.hot { stroke: var(--accent); stroke-width: 2.5; }
  .dot { fill: var(--fg-3); } .dot.hot { fill: var(--accent); }
</style>
```

- [ ] **Step 5: `web/src/lib/charts/Bars.svelte`**

```svelte
<script lang="ts">
  import { max } from 'd3-array';
  import { scaleBand, scaleLinear } from 'd3-scale';
  import { nf } from '../text/format';

  let { data, label, height = 232, format = (v: number) => nf(v), hotLast = true }: {
    data: { k: string; v: number }[];
    label: string;
    height?: number;
    format?: (v: number) => string;
    hotLast?: boolean;
  } = $props();

  let cw = $state(0);
  const w = $derived(Math.max(cw, 280));
  const x = $derived(scaleBand(data.map((d) => d.k), [0, w]).padding(0.36));
  const y = $derived(scaleLinear([0, max(data, (d) => d.v) ?? 1], [height - 24, 24]));
  // con molte barre e poco spazio si scrive un'etichetta ogni "step"
  const step = $derived(Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(w / 48)))));
</script>

<div class="chart" bind:clientWidth={cw}>
  <svg viewBox="0 0 {w} {height}" width={w} {height} role="img" aria-label={label}>
    {#each data as d, i (d.k)}
      {@const hot = hotLast && i === data.length - 1}
      <rect class="bar" class:hot x={x(d.k)} y={y(d.v)} width={x.bandwidth()} height={y(0) - y(d.v)} rx="6" />
      {#if hot || i % step === 0}
        <text class={hot ? 't12b hot' : 't12'} x={(x(d.k) ?? 0) + x.bandwidth() / 2} y={y(d.v) - 8} text-anchor="middle">{format(d.v)}</text>
        <text class="t10" x={(x(d.k) ?? 0) + x.bandwidth() / 2} y={height - 8} text-anchor="middle">{d.k}</text>
      {/if}
    {/each}
  </svg>
</div>

<style>
  svg { display: block; width: 100%; height: auto; overflow: visible; }
  .bar { fill: var(--line-2); } .bar.hot { fill: var(--accent); }
</style>
```

- [ ] **Step 6: `web/src/lib/charts/DotPlot.svelte`**

```svelte
<script lang="ts">
  import { scaleLinear } from 'd3-scale';
  import { nf } from '../text/format';
  import { measureText } from './labels';

  let { data, label, unit = '%', maxV = 100 }: {
    data: { k: string; now: number; was?: number | null; hot?: boolean }[];
    label: string;
    unit?: string;
    maxV?: number;
  } = $props();

  let cw = $state(0);
  const w = $derived(Math.max(cw, 280));
  const RH = 24;
  const ml = $derived(Math.min(w * 0.45, Math.max(48, ...data.map((d) => measureText(d.k, '12px sans-serif'))) + 16));
  const m = $derived({ l: ml, r: 40, t: 8, b: 24 });
  const H = $derived(m.t + m.b + data.length * RH);
  const x = $derived(scaleLinear([0, maxV], [m.l, w - m.r]));
</script>

<div class="chart" bind:clientWidth={cw}>
  <svg viewBox="0 0 {w} {H}" width={w} height={H} role="img" aria-label={label}>
    {#each [0, 25, 50, 75, 100].map((p) => (p * maxV) / 100) as v (v)}
      <line x1={x(v)} x2={x(v)} y1={m.t} y2={H - m.b} class="grid" />
      <text class="t10" x={x(v)} y={H - 8} text-anchor="middle">{nf(v)}{unit}</text>
    {/each}
    {#each data as d, i (d.k)}
      {@const yy = m.t + i * RH + RH / 2}
      <text class={d.hot ? 't12b hot' : 't12'} x={m.l - 12} y={yy + 4} text-anchor="end">{d.k}</text>
      {#if d.was != null}
        <line class="link" class:hot={d.hot} x1={x(d.was)} x2={x(d.now)} y1={yy} y2={yy} />
        <circle class="was" class:hot={d.hot} cx={x(d.was)} cy={yy} r="3.5" />
      {/if}
      <circle class="now" class:hot={d.hot} cx={x(d.now)} cy={yy} r="4.5" />
      <text class={d.hot ? 't12b hot' : 't12'} x={x(d.now) + 10} y={yy + 4}>{nf(d.now, d.now < 10 ? 1 : 0)}</text>
    {/each}
  </svg>
</div>

<style>
  svg { display: block; width: 100%; height: auto; overflow: visible; }
  .grid { stroke: var(--line); }
  .link { stroke: var(--fg-3); stroke-width: 2; opacity: .35; } .link.hot { stroke: var(--accent); }
  .was { fill: var(--card); stroke: var(--fg-3); stroke-width: 1.25; } .was.hot { stroke: var(--accent); }
  .now { fill: var(--fg-3); } .now.hot { fill: var(--accent); }
</style>
```

- [ ] **Step 7: `web/src/lib/charts/Scatter.svelte`**

```svelte
<script lang="ts">
  import { extent } from 'd3-array';
  import { scaleLinear, scaleLog } from 'd3-scale';
  import { nf } from '../text/format';
  import { leader, measureText, placeLabels } from './labels';

  type Pt = { x: number; y: number; label?: string; hot?: boolean };
  let { pts, label, xLog = false, yLog = false, xFormat = (v: number) => nf(v), yFormat = (v: number) => nf(v), xTitle, yTitle, height = 320 }: {
    pts: Pt[];
    label: string;
    xLog?: boolean;
    yLog?: boolean;
    xFormat?: (v: number) => string;
    yFormat?: (v: number) => string;
    xTitle: string;
    yTitle: string;
    height?: number;
  } = $props();

  let cw = $state(0);
  const w = $derived(Math.max(cw, 280));
  const m = { l: 48, r: 16, t: 16, b: 40 };
  const x = $derived((xLog ? scaleLog() : scaleLinear()).domain(extent(pts, (p) => p.x) as [number, number]).range([m.l, w - m.r]).nice());
  const y = $derived((yLog ? scaleLog() : scaleLinear()).domain(extent(pts, (p) => p.y) as [number, number]).range([height - m.b, m.t]).nice());
  const powers = (t: number[], log: boolean) => (log ? t.filter((v) => Number.isInteger(Math.log10(v))) : t);
  const xTicks = $derived(powers(x.ticks(5), xLog).slice(0, 7));
  const yTicks = $derived(powers(y.ticks(5), yLog).slice(0, 7));
  const labelled = $derived(pts.filter((p) => p.label));
  const boxes = $derived(placeLabels(
    labelled.map((p, i) => ({ id: String(i), x: x(p.x), y: y(p.y), w: measureText(p.label as string, '600 12px sans-serif'), h: 16 })),
    { x0: m.l, y0: m.t, x1: w - m.r, y1: height - m.b },
    pts.map((p) => ({ x0: x(p.x) - 5, y0: y(p.y) - 5, x1: x(p.x) + 5, y1: y(p.y) + 5 })),
  ));
</script>

<div class="chart" bind:clientWidth={cw}>
  <svg viewBox="0 0 {w} {height}" width={w} {height} role="img" aria-label={label}>
    {#each yTicks as v (v)}
      <line x1={m.l} x2={w - m.r} y1={y(v)} y2={y(v)} class="grid" />
      <text class="t10" x={m.l - 8} y={y(v) + 3} text-anchor="end">{yFormat(v)}</text>
    {/each}
    {#each xTicks as v (v)}<text class="t10" x={x(v)} y={height - m.b + 16} text-anchor="middle">{xFormat(v)}</text>{/each}
    <text class="t12" x={(m.l + w - m.r) / 2} y={height - 4} text-anchor="middle">{xTitle}</text>
    <text class="t12" x={m.l} y={m.t - 4}>{yTitle}</text>
    {#each pts as p, i (i)}<circle class="pt" class:hot={p.hot} cx={x(p.x)} cy={y(p.y)} r={p.hot ? 4.5 : 3} />{/each}
    {#each labelled as p, i (i)}
      {@const b = boxes.get(String(i))}
      {#if b}
        {@const l = leader({ id: '', x: x(p.x), y: y(p.y), w: 0, h: 0 }, b)}
        {#if l}<line class="leader" x1={x(p.x)} y1={y(p.y)} x2={l.x2} y2={l.y2} />{/if}
        <text class="t12b halo" class:hot={p.hot} x={b.x0} y={b.y1 - 4}>{p.label}</text>
      {/if}
    {/each}
  </svg>
</div>

<style>
  svg { display: block; width: 100%; height: auto; overflow: visible; }
  .grid { stroke: var(--line); }
  .pt { fill: var(--fg-3); opacity: .55; } .pt.hot { fill: var(--accent); opacity: 1; }
  .leader { stroke: var(--line-2); }
</style>
```

- [ ] **Step 8: `web/src/lib/charts/Timeline.svelte`**

```svelte
<script lang="ts">
  import { day, isoDay, monthYear, ym } from '../text/format';

  type Item = { date: string; title: string; text?: string; href?: string };
  let { items, today, label }: { items: Item[]; today: Date; label: string } = $props();

  const key = (d: string) => (d.length === 7 ? ym(today) : isoDay(today));
  const rows = $derived.by(() => {
    const sorted = items.slice().sort((a, b) => a.date.localeCompare(b.date));
    const out: ({ kind: 'item'; it: Item; cls: string } | { kind: 'today' })[] = [];
    let nextDone = false;
    for (const it of sorted) {
      const future = it.date >= key(it.date) && !(it.date.length === 10 && it.date === isoDay(today));
      if (future && !nextDone) {
        out.push({ kind: 'today' });
        out.push({ kind: 'item', it, cls: 'future next' });
        nextDone = true;
      } else out.push({ kind: 'item', it, cls: future ? 'future' : 'past' });
    }
    if (!nextDone) out.push({ kind: 'today' });
    return out;
  });
  const when = (d: string) => (d.length === 7 ? monthYear(d) : day(d));
</script>

<ol class="tl" aria-label={label}>
  {#each rows as r, i (i)}
    {#if r.kind === 'today'}
      <li class="today"><span class="when">oggi</span><span class="rail" aria-hidden="true"></span><span class="what">{day(isoDay(today))}</span></li>
    {:else}
      <li class={r.cls}>
        <span class="when">{when(r.it.date)}</span>
        <span class="rail" aria-hidden="true"></span>
        <span class="what">
          {#if r.it.href}<a href={r.it.href} target="_blank" rel="noopener">{r.it.title}</a>{:else}<b>{r.it.title}</b>{/if}
          {#if r.it.text}<span>{r.it.text}</span>{/if}
        </span>
      </li>
    {/if}
  {/each}
</ol>

<style>
  .tl { list-style: none; margin: 0; padding: 0; display: grid; }
  li { display: grid; grid-template-columns: 112px 24px minmax(0, 1fr); gap: 0 var(--s2); }
  @media (max-width: 560px) { li { grid-template-columns: 88px 16px minmax(0, 1fr); gap: 0 var(--s1); } }
  .when { font-weight: 600; font-size: 14px; padding-block: var(--s2); font-variant-numeric: tabular-nums; }
  .rail { position: relative; }
  .rail::before { content: ""; position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: var(--line-2); }
  .rail::after { content: ""; position: absolute; left: calc(50% - 5px); top: 23px; width: 10px; height: 10px; border-radius: 50%; background: var(--fg); }
  .future .rail::after { background: var(--card); border: 1.5px solid var(--fg-3); }
  .next .rail::after { background: var(--accent); border: 0; box-shadow: 0 0 0 4px var(--accent-soft); }
  .next .when, .next .what a { color: var(--accent); }
  .what { padding-block: var(--s2); display: grid; gap: 4px; }
  .what a, .what b { font-weight: 600; }
  .what span { color: var(--fg-2); font-size: 14px; }
  .future:not(.next) .what a, .future:not(.next) .what b { font-weight: 500; color: var(--fg-2); }
  .today .when, .today .what { color: var(--fg-3); font-weight: 400; font-size: 12px; }
  .today .rail::after { width: 16px; height: 2px; border-radius: 1px; left: calc(50% - 8px); top: 27px; background: var(--fg-3); }
</style>
```

- [ ] **Step 9: Eseguire i test**

Run: `npx vitest run src/lib/charts && npm run check`
Expected: test passano; 0 errori di tipo. Nota: in jsdom `clientWidth` è 0, quindi i grafici usano la larghezza minima di 280 px; è voluto.

- [ ] **Step 10: Commit**

```bash
git add web/src/lib/charts
git commit -m "App web: blocchi e grafici di base"
```

---

### Task 13: Radar e pannello dei movimenti

**Files:**
- Create: `web/src/lib/charts/Radar.svelte`, `web/src/lib/charts/MovesPanel.svelte`
- Test: `web/src/lib/charts/radar.test.ts`

**Interfaces:**
- Consumes: `RadarRowM`, `MOVE_MIN`, `radarRows` (Task 9), `placeLabels`, `leader`, `measureText` (Task 11), `signedPts` (Task 6), `FIXTURE` (Task 10).
- Produces:
  - `Radar`: props `{ rows: RadarRowM[]; quadranti: Record<Quadrant, string>; highlight?: string | null; label?: string; onpick?: (id: string) => void }`; `onpick` scatta al clic o al tocco su un punto. Ogni competenza è un `<g class="pt">`; le competenze non evidenziate hanno anche la classe `dim` quando `highlight` è valorizzato; le frecce sono `line.arrow`.
  - `MovesPanel`: props `{ rows: RadarRowM[]; quadranti: Record<Quadrant, string>; highlight?: string | null }` con `highlight` `$bindable`. Ogni riga è un `<button class="row" aria-pressed>`.

- [ ] **Step 1: Scrivere i test (falliscono)**

`web/src/lib/charts/radar.test.ts`:

```ts
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { radarRows } from '../data/derive';
import type { Radar as RadarT } from '../data/types';
import { FIXTURE } from '../test/fixtures';
import MovesPanel from './MovesPanel.svelte';
import Radar from './Radar.svelte';

const radar = FIXTURE.radar as RadarT;
const rows = radarRows(radar);

describe('Radar', () => {
  it('una freccia per ogni spostamento di almeno 10 punti', () => {
    const { container } = render(Radar, { rows, quadranti: radar.quadranti });
    expect(container.querySelectorAll('g.pt')).toHaveLength(5);
    expect(container.querySelectorAll('line.arrow')).toHaveLength(3); // MCP, RAG, Robotica
    expect(screen.getByText('MCP')).toBeInTheDocument();
  });
  it('evidenzia una competenza e attenua le altre', () => {
    const { container } = render(Radar, { rows, quadranti: radar.quadranti, highlight: 'mcp' });
    expect(container.querySelectorAll('g.pt.dim')).toHaveLength(4);
  });
  it('radar senza posizione precedente: nessuna freccia', () => {
    const old = radarRows({ ...radar, competenze: radar.competenze.map(({ slancio_prec, domanda_prec, quadrante_prec, ...r }) => r) });
    const { container } = render(Radar, { rows: old, quadranti: radar.quadranti });
    expect(container.querySelectorAll('line.arrow')).toHaveLength(0);
  });
});

describe('MovesPanel', () => {
  it('riepilogo e righe ordinate per spostamento', () => {
    render(MovesPanel, { rows, quadranti: radar.quadranti });
    expect(screen.getByText('cambi di quadrante').previousElementSibling).toHaveTextContent('2');
    expect(screen.getByText('spostamenti di almeno 10 punti').previousElementSibling).toHaveTextContent('3');
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
    expect(buttons[0]).toHaveTextContent('MCP');
    expect(buttons[0]).toHaveTextContent('+33');
    expect(screen.getByText("Da consolidare → Impara ora")).toBeInTheDocument();
  });
  it('tocco su una riga: la evidenzia, secondo tocco: la toglie', async () => {
    render(MovesPanel, { rows, quadranti: radar.quadranti });
    const b = screen.getAllByRole('button')[0];
    await fireEvent.click(b);
    expect(b).toHaveAttribute('aria-pressed', 'true');
    await fireEvent.click(b);
    expect(b).toHaveAttribute('aria-pressed', 'false');
  });
  it('senza posizione precedente: avviso', () => {
    const old = radarRows({ ...radar, competenze: radar.competenze.map(({ slancio_prec, ...r }) => r) });
    render(MovesPanel, { rows: old, quadranti: radar.quadranti });
    expect(screen.getByText('Il movimento sarà disponibile dal prossimo aggiornamento.')).toBeInTheDocument();
  });
});
```

Run: `npx vitest run src/lib/charts/radar.test.ts`
Expected: FAIL, componenti non trovati.

- [ ] **Step 2: `web/src/lib/charts/Radar.svelte`**

```svelte
<script lang="ts">
  import { scaleLinear } from 'd3-scale';
  import { MOVE_MIN, type RadarRowM } from '../data/derive';
  import type { Quadrant } from '../data/types';
  import { signedPts } from '../text/format';
  import { leader, measureText, placeLabels, type Box } from './labels';

  let { rows, quadranti, highlight = null, label = 'Radar delle competenze con il movimento dall’ultimo mese', onpick }: {
    rows: RadarRowM[];
    quadranti: Record<Quadrant, string>;
    highlight?: string | null;
    label?: string;
    onpick?: (id: string) => void; // tocco o clic su un punto
  } = $props();

  const uid = $props.id();
  let cw = $state(0);
  const w = $derived(Math.max(cw, 300));
  const narrow = $derived(w < 520);
  const H = $derived(Math.round(Math.max(384, Math.min(w * 0.72, 544))));
  const m = { l: 24, r: 8, t: 24, b: 40 };
  const x = $derived(scaleLinear([-0.04, 1.04], [m.l, w - m.r]));
  const y = $derived(scaleLinear([-0.04, 1.04], [H - m.b, m.t]));
  const QL = $derived([
    { id: 'consolida' as Quadrant, x: m.l, y: m.t - 8, a: 'start' },
    { id: 'impara-ora' as Quadrant, x: w - m.r, y: m.t - 8, a: 'end' },
    { id: 'osserva' as Quadrant, x: m.l, y: H - m.b + 16, a: 'start' },
    { id: 'prova' as Quadrant, x: w - m.r, y: H - m.b + 16, a: 'end' },
  ]);
  const transition = (r: RadarRowM) =>
    r.quadrante === 'impara-ora' ? 'entra in Impara ora' : r.qp === 'impara-ora' ? 'esce da Impara ora' : `passa a ${quadranti[r.quadrante]}`;
  const LH = 16;
  const layout = $derived.by(() => {
    const obstacles: Box[] = QL.map((q) => {
      const tw = measureText(quadranti[q.id], '600 12px sans-serif');
      const x0 = q.a === 'end' ? q.x - tw : q.x;
      return { x0: x0 - 4, y0: q.y - 14, x1: x0 + tw + 4, y1: q.y + 4 };
    });
    rows.forEach((r) => obstacles.push({ x0: x(r.slancio) - 7, y0: y(r.domanda) - 7, x1: x(r.slancio) + 7, y1: y(r.domanda) + 7 }));
    const order = (r: RadarRowM) => (r.changed ? 0 : r.quadrante === 'impara-ora' ? 1 : 2);
    const items = rows.slice().sort((a, b) => order(a) - order(b)).map((r) => {
      const lines = [r.breve, ...(r.changed && !narrow ? [transition(r)] : [])];
      const wd = Math.max(...lines.map((t, i) => measureText(t, `${i === 0 && r.quadrante === 'impara-ora' ? 600 : 400} 12px sans-serif`)));
      return { id: r.id, x: x(r.slancio), y: y(r.domanda), w: wd, h: lines.length * LH, lines, r };
    });
    const boxes = placeLabels(items, { x0: m.l + 2, y0: m.t + 2, x1: w - m.r - 2, y1: H - m.b - 2 }, obstacles);
    return items.map((it) => ({ ...it, box: boxes.get(it.id) as Box }));
  });
  const dim = (id: string) => highlight != null && highlight !== id;
</script>

<div class="chart" bind:clientWidth={cw}>
  <svg viewBox="0 0 {w} {H}" width={w} height={H} role="img" aria-label={label}>
    <defs>
      <marker id="{uid}-hot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" class="mk hot" /></marker>
      <marker id="{uid}-cold" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" class="mk" /></marker>
    </defs>
    <rect class="quad" x={x(0.5)} y={y(1.04)} width={x(1.04) - x(0.5)} height={y(0.5) - y(1.04)} rx="12" />
    <line class="median" x1={x(0.5)} x2={x(0.5)} y1={y(1.04)} y2={y(-0.04)} />
    <line class="median" x1={x(-0.04)} x2={x(1.04)} y1={y(0.5)} y2={y(0.5)} />
    {#each QL as q (q.id)}
      <text class="ql" class:hot={q.id === 'impara-ora'} x={q.x} y={q.y} text-anchor={q.a}>{quadranti[q.id]}</text>
    {/each}
    <text class="t12" x={(x(0) + x(1)) / 2} y={H - 4} text-anchor="middle">Slancio: crescita negli ultimi 3 mesi →</text>
    <text class="t12" transform="translate({m.l - 10},{(y(0) + y(1)) / 2}) rotate(-90)" text-anchor="middle">Domanda →</text>

    {#each rows as r (r.id)}
      {@const hot = r.quadrante === 'impara-ora'}
      <g class="pt" class:dim={dim(r.id)}>
        {#if r.hasPrev && r.move >= MOVE_MIN}
          {@const x0 = x(r.sp as number)}
          {@const y0 = y(r.dp as number)}
          {@const len = Math.hypot(x(r.slancio) - x0, y(r.domanda) - y0) || 1}
          {@const k = (len - 9) / len}
          <circle class="prev" class:hot cx={x0} cy={y0} r="3.5" />
          <line class="arrow" class:hot x1={x0} y1={y0} x2={x0 + (x(r.slancio) - x0) * k} y2={y0 + (y(r.domanda) - y0) * k}
            marker-end="url(#{uid}-{hot ? 'hot' : 'cold'})" />
        {/if}
        <circle class="dot" class:hot cx={x(r.slancio)} cy={y(r.domanda)} r={hot ? 6 : 4.5} onclick={() => onpick?.(r.id)}>
          <title>{r.nome}: {quadranti[r.quadrante]}{r.changed && r.qp ? ` (era ${quadranti[r.qp]})` : ''}. Slancio {Math.round(r.slancio * 100)} ({signedPts(r.dS)}), domanda {Math.round(r.domanda * 100)} ({signedPts(r.dD)}).</title>
        </circle>
      </g>
    {/each}

    <g class="lbls">
      {#each layout as it (it.id)}
        {@const l = leader(it, it.box)}
        {#if l}<line class="leader" class:dim={dim(it.id)} x1={it.x} y1={it.y} x2={l.x2} y2={l.y2} />{/if}
        <text class:dim={dim(it.id)} x={it.box.x0} y={it.box.y0 + LH - 4}>
          {#each it.lines as t, i (i)}
            <tspan x={it.box.x0} dy={i ? LH : 0} class="halo {i === 0 ? (it.r.quadrante === 'impara-ora' ? 't12b' : 't12') : 'note'}">{t}</tspan>
          {/each}
        </text>
      {/each}
    </g>
  </svg>
</div>

<style>
  svg { display: block; width: 100%; height: auto; overflow: visible; }
  .quad { fill: var(--accent-soft); }
  .median { stroke: var(--line-2); stroke-dasharray: 2 4; }
  .ql { font: 500 12px var(--font); fill: var(--fg-3); } .ql.hot { fill: var(--accent); font-weight: 600; }
  .dot { fill: var(--fg-3); stroke: var(--card); stroke-width: 2; } .dot.hot { fill: var(--accent); }
  .prev { fill: var(--card); stroke: var(--fg-3); stroke-width: 1.25; } .prev.hot { stroke: var(--accent); }
  .arrow { stroke: var(--fg-3); stroke-width: 1.5; } .arrow.hot { stroke: var(--accent); }
  .mk { fill: var(--fg-3); } .mk.hot { fill: var(--accent); }
  .leader { stroke: var(--line-2); }
  .note { font: 400 12px var(--font); fill: var(--fg-3); }
  .pt, .lbls text, .leader { transition: opacity .15s; }
  .dim { opacity: .18; }
</style>
```

- [ ] **Step 3: `web/src/lib/charts/MovesPanel.svelte`**

```svelte
<script lang="ts">
  import { MOVE_MIN, type RadarRowM } from '../data/derive';
  import type { Quadrant } from '../data/types';
  import { signedPts } from '../text/format';

  let { rows, quadranti, highlight = $bindable(null) }: {
    rows: RadarRowM[];
    quadranti: Record<Quadrant, string>;
    highlight?: string | null;
  } = $props();

  const moved = $derived(rows.filter((r) => r.hasPrev).sort((a, b) => Math.abs(b.dC) - Math.abs(a.dC) || b.move - a.move).slice(0, 8));
  const cls = (v: number) => (v > 0.005 ? 'up' : v < -0.005 ? 'down' : 'flat');
</script>

{#if moved.length === 0}
  <p class="note">Il movimento sarà disponibile dal prossimo aggiornamento.</p>
{:else}
  <div class="panel">
    <div class="sum">
      <div><b>{rows.filter((r) => r.changed).length}</b><span>cambi di quadrante</span></div>
      <div><b>{rows.filter((r) => r.hasPrev && r.move >= MOVE_MIN).length}</b><span>spostamenti di almeno 10 punti</span></div>
    </div>
    <div class="head" aria-hidden="true"><span>Competenza</span><span>slancio</span><span>domanda</span></div>
    <ul>
      {#each moved as r (r.id)}
        <li>
          <button type="button" class="row" aria-pressed={highlight === r.id} title={r.nome}
            onpointerenter={() => (highlight = r.id)} onpointerleave={() => (highlight = null)}
            onfocus={() => (highlight = r.id)} onblur={() => (highlight = null)}
            onclick={() => (highlight = highlight === r.id ? null : r.id)}>
            <span class="n">{r.breve}</span>
            <span class="v {cls(r.dS)}">{signedPts(r.dS)}</span>
            <span class="v {cls(r.dD)}">{signedPts(r.dD)}</span>
            {#if r.changed && r.qp}<span class="chip">{quadranti[r.qp]} → {quadranti[r.quadrante]}</span>{/if}
          </button>
        </li>
      {/each}
    </ul>
    <p class="cite">In blu ciò che sale. Passa sopra una riga, o toccala, per trovarla nel grafico.</p>
  </div>
{/if}

<style>
  .panel { display: grid; gap: var(--s2); align-content: start; }
  .note { font-size: 14px; line-height: 24px; color: var(--fg-2); }
  .sum { display: grid; grid-template-columns: 1fr 1fr; gap: var(--s1); }
  .sum div { background: var(--bg); border-radius: var(--r-md); padding: var(--s2); display: grid; gap: 4px; }
  .sum b { font-weight: 600; font-size: 32px; line-height: 40px; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
  .sum span { font-size: 12px; line-height: 16px; color: var(--fg-2); }
  .head, .row { display: grid; grid-template-columns: minmax(0, 1fr) 56px 56px; gap: 0 var(--s1); padding-inline: var(--s1); }
  .head { font-size: 12px; line-height: 16px; color: var(--fg-3); }
  .head span + span { text-align: right; }
  ul { list-style: none; margin: 0; padding: 0; display: grid; }
  li + li { border-top: 1px solid var(--line); }
  .row { all: unset; box-sizing: border-box; width: 100%; min-height: 40px; padding-block: var(--s1); border-radius: var(--r-sm); cursor: pointer; font-size: 14px; line-height: 24px; font-variant-numeric: tabular-nums; display: grid; grid-template-columns: minmax(0, 1fr) 56px 56px; gap: 0 var(--s1); padding-inline: var(--s1); }
  .row:hover, .row[aria-pressed='true'], .row:focus-visible { background: var(--accent-soft); }
  .row:focus-visible { outline: 2px solid var(--accent); }
  .n { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
  .v { text-align: right; }
  .up { color: var(--accent); font-weight: 600; }
  .flat { color: var(--fg-3); }
  .chip { grid-column: 1 / -1; font-size: 12px; line-height: 16px; color: var(--fg-2); }
  .cite { font-size: 12px; line-height: 16px; color: var(--fg-3); }
</style>
```

- [ ] **Step 4: Eseguire i test**

Run: `npx vitest run src/lib/charts && npm run check`
Expected: tutti passano; 0 errori di tipo.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/charts/Radar.svelte web/src/lib/charts/MovesPanel.svelte web/src/lib/charts/radar.test.ts
git commit -m "App web: radar delle competenze e pannello dei movimenti"
```

---

### Task 14: Foto da Wikimedia Commons

**Files:**
- Create: `scripts/fetch_photos.py`, `web/src/assets/photos/*.jpg` (8 file, scaricati dallo script), `web/src/lib/photos.ts`
- Test: `tests/test_fetch_photos.py`

**Interfaces:**
- Produces (`photos.ts`): `interface Photo { src: string; srcset: string; alt: string; titolo: string; autore: string; licenza: string; pagina: string }`, `PHOTOS: Record<TileId, Photo>`.

- [ ] **Step 1: Scrivere i test (falliscono)**

`tests/test_fetch_photos.py`:

```python
"""Script delle foto: licenze ammesse e ritaglio."""
from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("fetch_photos", ROOT / "scripts" / "fetch_photos.py")
fp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fp)


def test_license_ok():
    for ok in ["CC0", "Public domain", "CC BY 4.0", "CC BY-SA 4.0", "CC BY 2.0", "CC BY-SA 3.0"]:
        assert fp.license_ok(ok), ok
    for bad in ["CC BY-NC 4.0", "CC BY-ND 4.0", "All rights reserved", "", "Fair use"]:
        assert not fp.license_ok(bad), bad


def test_crop_box():
    assert fp.crop_box((1000, 800), (0.1, 0.25, 0.9, 0.75)) == (100, 200, 900, 600)


def test_every_photo_has_title_and_alt():
    assert set(fp.PHOTOS) == {"modelli", "open", "business", "persone", "politica", "competenze", "notizie", "rapporti"}
    for pid, p in fp.PHOTOS.items():
        assert p["titolo"].startswith("File:"), pid
```

Run: `python -m pytest -q tests/test_fetch_photos.py`
Expected: FAIL, file dello script inesistente.

- [ ] **Step 2: Implementare `scripts/fetch_photos.py`**

```python
"""Scarica le foto delle card da Wikimedia Commons in web/src/assets/photos/ (una tantum).

Uso:
    pip install pillow==12.3.0
    python scripts/fetch_photos.py

Accetta solo licenze CC0, pubblico dominio, CC BY e CC BY-SA, e stampa i crediti
da riportare in web/src/lib/photos.ts. Le foto si salvano nel repository.
"""
from __future__ import annotations

import json
import re
import sys
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "web" / "src" / "assets" / "photos"
API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "ai-radar/1.0 (https://github.com/simones99/ai-radar)"}
ALLOWED = re.compile(r"^(CC0|Public domain|CC BY(-SA)? \d\.\d)$", re.IGNORECASE)

PHOTOS = {
    "modelli": {"titolo": "File:Rear of rack at NERSC data center - closeup.jpg"},
    "open": {"titolo": "File:Wikimedia Hackathon 2025 - day 3 - 001.jpg"},
    "business": {"titolo": "File:Silicon wafer researcher.jpg"},
    "persone": {"titolo": "File:Working in open office space (Unsplash).jpg"},
    "politica": {"titolo": "File:Hemicycle of the European Parliament, Strasbourg 2023 003.jpg"},
    "competenze": {"titolo": "File:Wiki Education at UC Berkeley April 2018 111.jpg"},
    # scansione d'archivio: si toglie il bordo bianco
    "notizie": {"titolo": "File:Interior view of newspaper delivery room showing man taking stack of newspapers "
                          "from machine) - World-Telegram photo LCCN95506971.jpg",
                "crop": (0.073, 0.114, 0.927, 0.886)},
    "rapporti": {"titolo": "File:LOC Main Reading Room Highsmith.jpg"},
}


def license_ok(name: str) -> bool:
    return bool(ALLOWED.match((name or "").strip()))


def crop_box(size: tuple[int, int], frac: tuple[float, float, float, float]) -> tuple[int, int, int, int]:
    w, h = size
    return (round(frac[0] * w), round(frac[1] * h), round(frac[2] * w), round(frac[3] * h))


def clean(html: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html or "")).strip()


def fetch_meta() -> dict:
    p = {"action": "query", "titles": "|".join(x["titolo"] for x in PHOTOS.values()), "prop": "imageinfo",
         "iiprop": "url|extmetadata", "iiurlwidth": 1600, "format": "json"}
    with urllib.request.urlopen(urllib.request.Request(f"{API}?{urllib.parse.urlencode(p)}", headers=UA), timeout=60) as r:
        q = json.load(r)["query"]
    norm = {n["from"]: n["to"] for n in q.get("normalized", [])}
    pages = {pg["title"]: pg for pg in q["pages"].values()}
    out = {}
    for pid, x in PHOTOS.items():
        pg = pages.get(norm.get(x["titolo"], x["titolo"]))
        if not pg or "imageinfo" not in pg:
            raise SystemExit(f"{pid}: file non trovato su Commons: {x['titolo']}")
        ii = pg["imageinfo"][0]
        md = ii.get("extmetadata", {})
        out[pid] = {"url": ii["thumburl"], "pagina": ii["descriptionurl"],
                    "licenza": clean(md.get("LicenseShortName", {}).get("value", "")),
                    "autore": clean(md.get("Artist", {}).get("value", ""))[:80]}
    return out


def main() -> int:
    meta = fetch_meta()
    OUT.mkdir(parents=True, exist_ok=True)
    for pid, m in meta.items():
        if not license_ok(m["licenza"]):
            raise SystemExit(f"{pid}: licenza non ammessa: {m['licenza']!r}")
        with urllib.request.urlopen(urllib.request.Request(m["url"], headers=UA), timeout=120) as r:
            data = r.read()
        crop = PHOTOS[pid].get("crop")
        if crop:
            from PIL import Image
            img = Image.open(BytesIO(data))
            img.crop(crop_box(img.size, crop)).convert("RGB").save(OUT / f"{pid}.jpg", quality=85)
        else:
            (OUT / f"{pid}.jpg").write_bytes(data)
        print(f"{pid}: {m['licenza']} · {m['autore']} · {m['pagina']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 3: Eseguire i test**

Run: `python -m pytest -q tests/test_fetch_photos.py`
Expected: 3 passed.

- [ ] **Step 4: Scaricare le foto e guardarle**

Run (dalla radice del repo): `pip install pillow==12.3.0 && python scripts/fetch_photos.py`
Expected: 8 righe con licenza, autore e pagina; 8 file in `web/src/assets/photos/`. Aprire ogni file e controllare che sia la foto attesa: server, hackathon, wafer, ufficio, emiciclo, studentessa, sala spedizioni senza bordo bianco, sala di lettura.

- [ ] **Step 5: Implementare `web/src/lib/photos.ts`**

Se lo script ha stampato autori o licenze diversi da quelli qui sotto, usare quelli stampati.

```ts
import type { TileId } from './router';
import modelli from '../assets/photos/modelli.jpg?w=900&format=webp';
import modelliSet from '../assets/photos/modelli.jpg?w=480;900&format=webp&as=srcset';
import open from '../assets/photos/open.jpg?w=900&format=webp';
import openSet from '../assets/photos/open.jpg?w=480;900&format=webp&as=srcset';
import business from '../assets/photos/business.jpg?w=900&format=webp';
import businessSet from '../assets/photos/business.jpg?w=480;900&format=webp&as=srcset';
import persone from '../assets/photos/persone.jpg?w=900&format=webp';
import personeSet from '../assets/photos/persone.jpg?w=480;900&format=webp&as=srcset';
import politica from '../assets/photos/politica.jpg?w=900&format=webp';
import politicaSet from '../assets/photos/politica.jpg?w=480;900&format=webp&as=srcset';
import competenze from '../assets/photos/competenze.jpg?w=900&format=webp';
import competenzeSet from '../assets/photos/competenze.jpg?w=480;900&format=webp&as=srcset';
import notizie from '../assets/photos/notizie.jpg?w=900&format=webp';
import notizieSet from '../assets/photos/notizie.jpg?w=480;900&format=webp&as=srcset';
import rapporti from '../assets/photos/rapporti.jpg?w=900&format=webp';
import rapportiSet from '../assets/photos/rapporti.jpg?w=480;900&format=webp&as=srcset';

export interface Photo { src: string; srcset: string; alt: string; titolo: string; autore: string; licenza: string; pagina: string }

const C = 'https://commons.wikimedia.org/wiki/File:';

export const PHOTOS: Record<TileId, Photo> = {
  modelli: { src: modelli, srcset: modelliSet, alt: 'Armadio di server in un data center',
    titolo: 'Rear of rack at NERSC data center - closeup', autore: 'Derrick Coetzee', licenza: 'CC0',
    pagina: `${C}Rear_of_rack_at_NERSC_data_center_-_closeup.jpg` },
  open: { src: open, srcset: openSet, alt: 'Due persone lavorano allo stesso portatile durante un hackathon',
    titolo: 'Wikimedia Hackathon 2025 - day 3 - 001', autore: 'Vera de Kok', licenza: 'CC BY-SA 4.0',
    pagina: `${C}Wikimedia_Hackathon_2025_-_day_3_-_001.jpg` },
  business: { src: business, srcset: businessSet, alt: 'Ricercatrice in camera bianca con un wafer di silicio',
    titolo: 'Silicon wafer researcher', autore: 'U.S. Department of Energy', licenza: 'Pubblico dominio',
    pagina: `${C}Silicon_wafer_researcher.jpg` },
  persone: { src: persone, srcset: personeSet, alt: 'Persona al lavoro in un ufficio open space',
    titolo: 'Working in open office space (Unsplash)', autore: 'Crew', licenza: 'CC0',
    pagina: `${C}Working_in_open_office_space_(Unsplash).jpg` },
  politica: { src: politica, srcset: politicaSet, alt: "L'emiciclo del Parlamento europeo a Strasburgo",
    titolo: 'Hemicycle of the European Parliament, Strasbourg 2023 003', autore: 'Sebastian Wallroth', licenza: 'CC BY 4.0',
    pagina: `${C}Hemicycle_of_the_European_Parliament,_Strasbourg_2023_003.jpg` },
  competenze: { src: competenze, srcset: competenzeSet, alt: 'Studentessa che spiega il suo lavoro al portatile',
    titolo: 'Wiki Education at UC Berkeley April 2018 111', autore: 'Cassidy (Wiki Ed)', licenza: 'CC BY-SA 4.0',
    pagina: `${C}Wiki_Education_at_UC_Berkeley_April_2018_111.jpg` },
  notizie: { src: notizie, srcset: notizieSet, alt: 'Sala di spedizione dei giornali del New York World-Telegram, anni Quaranta',
    titolo: 'Interior view of newspaper delivery room (World-Telegram)', autore: 'Library of Congress', licenza: 'Pubblico dominio',
    pagina: `${C}Interior_view_of_newspaper_delivery_room_showing_man_taking_stack_of_newspapers_from_machine)_-_World-Telegram_photo_LCCN95506971.jpg` },
  rapporti: { src: rapporti, srcset: rapportiSet, alt: 'Sala di lettura della Library of Congress',
    titolo: 'LOC Main Reading Room Highsmith', autore: 'Carol M. Highsmith', licenza: 'Pubblico dominio',
    pagina: `${C}LOC_Main_Reading_Room_Highsmith.jpg` },
};
```

- [ ] **Step 6: Controllare che la build generi le immagini**

Run: `cd web && npm run check && npm run build && ls ../_site/assets | grep -c webp`
Expected: 0 errori; almeno 16 file `.webp` (8 foto × 2 misure).

- [ ] **Step 7: Commit**

```bash
git add scripts/fetch_photos.py tests/test_fetch_photos.py web/src/assets/photos web/src/lib/photos.ts
git commit -m "Foto delle card da Wikimedia Commons, con crediti"
```

---

### Task 15: Faccia della card, dettaglio e pillole

**Files:**
- Create: `web/src/lib/tiles/types.ts`, `web/src/lib/tiles/TileFace.svelte`, `web/src/lib/tiles/Detail.svelte`, `web/src/lib/tiles/Pills.svelte`
- Test: `web/src/lib/tiles/shell.test.ts`

**Interfaces:**
- Consumes: `Face`, `Head` (Task 10), `tileState` (Task 7), `PHOTOS` (Task 14), `TileId` (Task 8), `day` (Task 6).
- Produces (`tiles/types.ts`):

```ts
export interface TileDef {
  id: TileId;
  label: string;
  source: string;              // chiave della fonte principale in status.json
  eager: boolean;              // foto caricata subito (prime 4 card)
  face: (d: Dataset, today: Date) => Face | null;
  head: (d: Dataset, today: Date) => Head;
  Detail: Component<DetailProps>;
}
export interface DetailProps { data: Dataset; today: Date; tile: TileDef; elemento: string | null; onclose: () => void }
```

- Produces (componenti):
  - `TileFace`: `{ tile: TileDef; data: Dataset; today: Date; expanded: boolean; onopen: () => void }`. Pulsante `.face` con `aria-expanded` e `aria-controls="detail-<id>"`, `view-transition-name: t-<id>`.
  - `Detail`: `{ tile: TileDef; head: Head; onclose: () => void; children: Snippet }`. `<section id="detail-<id>" aria-labelledby="h-<id>">`, titolo `<h2 id="h-<id>" tabindex="-1">` che prende il focus al montaggio, pulsanti "Copia link" e "Chiudi <tema>".
  - `Pills`: `{ tiles: TileDef[]; onpick: (id: TileId) => void; onclose: () => void }`.

- [ ] **Step 1: Scrivere `web/src/lib/tiles/types.ts`**

```ts
import type { Component } from 'svelte';
import type { Dataset } from '../data/types';
import type { TileId } from '../router';
import type { Face, Head } from '../text/frasi';

export interface TileDef {
  id: TileId;
  label: string;
  source: string;
  eager: boolean;
  face: (d: Dataset, today: Date) => Face | null;
  head: (d: Dataset, today: Date) => Head;
  Detail: Component<DetailProps>;
}

export interface DetailProps {
  data: Dataset;
  today: Date;
  tile: TileDef;
  elemento: string | null;
  onclose: () => void;
}
```

- [ ] **Step 2: Scrivere i test (falliscono)**

`web/src/lib/tiles/shell.test.ts`:

```ts
import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet, type Component } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import type { Dataset } from '../data/types';
import { FIXTURE, FIXTURE_TODAY as today } from '../test/fixtures';
import Detail from './Detail.svelte';
import Pills from './Pills.svelte';
import TileFace from './TileFace.svelte';
import type { DetailProps, TileDef } from './types';

const tile = (over: Partial<TileDef> = {}): TileDef => ({
  id: 'business', label: 'Business', source: 'owid', eager: true,
  face: () => ({ fig: '290', unit: 'mld $', sent: 'Investimenti privati.' }),
  head: () => ({ title: [{ t: 'Titolo ' }, { t: 'in blu', em: true }], deck: 'Sottotitolo.' }),
  Detail: (() => {}) as unknown as Component<DetailProps>,
  ...over,
});
const blocks = createRawSnippet(() => ({ render: () => '<p>blocchi</p>' }));

describe('TileFace', () => {
  it('numero, unità, frase e data di aggiornamento', async () => {
    const onopen = vi.fn();
    render(TileFace, { tile: tile(), data: FIXTURE as Dataset, today, expanded: false, onopen });
    const b = screen.getByRole('button', { name: /Business/ });
    expect(b).toHaveAttribute('aria-expanded', 'false');
    expect(b).toHaveAttribute('aria-controls', 'detail-business');
    expect(b).toHaveTextContent('290mld $');
    expect(b).toHaveTextContent('agg. 15 ott 2026');
    await fireEvent.click(b);
    expect(onopen).toHaveBeenCalledOnce();
  });
  it('fonte assente: spiega il motivo', () => {
    render(TileFace, { tile: tile({ source: 'adzuna', face: () => null }), data: FIXTURE as Dataset, today, expanded: false, onopen: () => {} });
    expect(screen.getByText('Serve la chiave gratuita di Adzuna.')).toBeInTheDocument();
    expect(screen.getByText('non disponibile')).toBeInTheDocument();
  });
  it('fonte con l’ultimo giro fallito: dice da quando sono i dati', () => {
    render(TileFace, { tile: tile({ source: 'arxiv' }), data: FIXTURE as Dataset, today, expanded: false, onopen: () => {} });
    expect(screen.getByText('Aggiornamento non riuscito il 15 ott 2026. Dati aggiornati all’8 ott 2026.')).toBeInTheDocument();
  });
  it('foto che non carica: riquadro con il testo alternativo', async () => {
    const { container } = render(TileFace, { tile: tile(), data: FIXTURE as Dataset, today, expanded: false, onopen: () => {} });
    await fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('.ph-empty')).toHaveTextContent('Ricercatrice in camera bianca con un wafer di silicio');
  });
});

describe('Detail', () => {
  it('titolo con parte in evidenza, focus sul titolo, credito della foto', () => {
    render(Detail, { tile: tile(), head: tile().head(FIXTURE as Dataset, today), onclose: () => {}, children: blocks });
    const h2 = screen.getByRole('heading', { level: 2 });
    expect(h2).toHaveTextContent('Titolo in blu');
    expect(h2.querySelector('em')).toHaveTextContent('in blu');
    expect(document.activeElement).toBe(h2);
    expect(screen.getByText('blocchi')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Foto' })).toHaveAttribute('href', expect.stringContaining('commons.wikimedia.org'));
  });
  it('chiudi', async () => {
    const onclose = vi.fn();
    render(Detail, { tile: tile(), head: tile().head({}, today), onclose, children: blocks });
    await fireEvent.click(screen.getByRole('button', { name: 'Chiudi Business' }));
    expect(onclose).toHaveBeenCalledOnce();
  });
  it('copia link: con gli appunti', async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(Detail, { tile: tile(), head: tile().head({}, today), onclose: () => {}, children: blocks });
    await fireEvent.click(screen.getByRole('button', { name: 'Copia link' }));
    expect(writeText).toHaveBeenCalledWith(location.href);
    expect(await screen.findByRole('button', { name: 'Link copiato' })).toBeInTheDocument();
  });
  it('copia link: se gli appunti rifiutano, mostra il link selezionato', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn(async () => { throw new Error('no'); }) }, configurable: true });
    render(Detail, { tile: tile(), head: tile().head({}, today), onclose: () => {}, children: blocks });
    await fireEvent.click(screen.getByRole('button', { name: 'Copia link' }));
    const input = await screen.findByRole('textbox', { name: 'Link da copiare' });
    expect(input).toHaveValue(location.href);
  });
});

describe('Pills', () => {
  it('sceglie un altro tema o chiude', async () => {
    const onpick = vi.fn(), onclose = vi.fn();
    render(Pills, { tiles: [tile(), tile({ id: 'politica', label: 'Politica' })], onpick, onclose });
    await fireEvent.click(screen.getByRole('button', { name: 'Politica' }));
    expect(onpick).toHaveBeenCalledWith('politica');
    await fireEvent.click(screen.getByRole('button', { name: 'Chiudi' }));
    expect(onclose).toHaveBeenCalledOnce();
  });
});
```

Run: `npx vitest run src/lib/tiles/shell.test.ts`
Expected: FAIL, componenti non trovati.

- [ ] **Step 3: `web/src/lib/tiles/TileFace.svelte`**

```svelte
<script lang="ts">
  import type { Dataset } from '../data/types';
  import { tileState } from '../data/freshness';
  import { PHOTOS } from '../photos';
  import { day } from '../text/format';
  import type { TileDef } from './types';

  let { tile, data, today, expanded, onopen }: { tile: TileDef; data: Dataset; today: Date; expanded: boolean; onopen: () => void } = $props();

  const face = $derived(tile.face(data, today));
  const st = $derived(tileState(tile.source, data.status, face !== null));
  const photo = $derived(PHOTOS[tile.id]);
  let imgFailed = $state(false);
  const dataDay = (iso: string) => { const d = day(iso); return /^(1|8|11) /.test(d) ? `all’${d}` : `al ${d}`; };
</script>

<button type="button" class="face" aria-expanded={expanded} aria-controls="detail-{tile.id}" style:view-transition-name="t-{tile.id}" onclick={onopen}>
  {#if imgFailed}
    <span class="ph ph-empty" aria-hidden="true">{photo.alt}</span>
  {:else}
    <span class="ph"><img src={photo.src} srcset={photo.srcset} sizes="(max-width: 560px) 88px, (max-width: 1040px) 50vw, 25vw"
      alt="" loading={tile.eager ? 'eager' : 'lazy'} decoding="async" onerror={() => (imgFailed = true)} /></span>
  {/if}
  <span class="f-body">
    <span class="f-lab">
      <span>{tile.label}</span>
      <span class="small">
        {#if st.state === 'assente'}non disponibile{:else if st.aggiornato}agg. {day(st.aggiornato)}{/if}
      </span>
    </span>
    {#if face}
      <span class="fig">{face.fig}{#if face.unit}<span class="u">{face.unit}</span>{/if}</span>
      <span class="sent">{face.sent}</span>
    {:else}
      <span class="sent">{st.motivo}</span>
    {/if}
    {#if st.state === 'vecchio' && st.fallito && st.aggiornato}
      <span class="stale">Aggiornamento non riuscito il {day(st.fallito)}. Dati aggiornati {dataDay(st.aggiornato)}.</span>
    {/if}
  </span>
</button>

<style>
  .face { all: unset; box-sizing: border-box; display: grid; gap: var(--s2); width: 100%; height: 100%; align-content: start; padding: var(--s1) var(--s1) var(--s3); background: var(--card); border-radius: var(--r-lg); box-shadow: var(--shadow); cursor: pointer; transition: box-shadow .25s var(--ease), transform .25s var(--ease); }
  .face:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .ph { display: block; aspect-ratio: 4 / 3; border-radius: var(--r-md); overflow: hidden; background: var(--line); }
  .ph img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s var(--ease); }
  .ph-empty { display: grid; place-items: center; padding: var(--s2); font-size: 12px; line-height: 16px; color: var(--fg-2); text-align: center; }
  .f-body { display: grid; gap: var(--s1); padding-inline: var(--s2); }
  .f-lab { display: flex; justify-content: space-between; gap: var(--s1); font-size: 14px; line-height: 24px; color: var(--fg-2); }
  .f-lab .small { color: var(--fg-3); }
  .fig { font-weight: 600; font-size: 40px; line-height: 48px; letter-spacing: -.035em; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  .u { font-size: 20px; letter-spacing: -.01em; margin-left: 4px; color: var(--fg-2); font-weight: 500; }
  .sent { font-size: 14px; line-height: 24px; color: var(--fg-2); }
  .stale { font-size: 12px; line-height: 16px; color: var(--fg-3); }
  @media (hover: hover) {
    .face:hover { box-shadow: var(--shadow-up); transform: translateY(-2px); }
    .face:hover .ph img { transform: scale(1.03); }
  }
  @media (max-width: 560px) {
    .face { grid-template-columns: 88px minmax(0, 1fr); align-items: center; padding: var(--s1); border-radius: var(--r-md); }
    .ph { aspect-ratio: 1; border-radius: var(--r-sm); }
    .f-body { padding-inline: 0 var(--s1); gap: 0; }
    .fig { font-size: 28px; line-height: 32px; }
    .u { font-size: 16px; }
  }
</style>
```

- [ ] **Step 4: `web/src/lib/tiles/Detail.svelte`**

```svelte
<script lang="ts">
  import { onMount, tick, type Snippet } from 'svelte';
  import { PHOTOS } from '../photos';
  import type { Head } from '../text/frasi';
  import type { TileDef } from './types';

  let { tile, head, onclose, children }: { tile: TileDef; head: Head; onclose: () => void; children: Snippet } = $props();

  const photo = $derived(PHOTOS[tile.id]);
  let h2: HTMLHeadingElement;
  let urlInput: HTMLInputElement | undefined = $state();
  let copied = $state(false);
  let fallbackUrl = $state<string | null>(null);

  onMount(() => {
    h2.focus({ preventScroll: true });
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; // jsdom non ha matchMedia
    h2.closest('.tiles')?.parentElement?.scrollIntoView?.({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  });

  async function copy() {
    try {
      await navigator.clipboard.writeText(location.href);
      copied = true;
    } catch {
      fallbackUrl = location.href;
      await tick();
      urlInput?.select();
    }
  }
</script>

<section class="detail" id="detail-{tile.id}" aria-labelledby="h-{tile.id}" style:view-transition-name="t-{tile.id}">
  <div class="d-hero">
    <figure>
      <span class="ph"><img src={photo.src} srcset={photo.srcset} sizes="(max-width: 860px) 100vw, 40vw" alt={photo.alt} /></span>
      <figcaption class="credit"><a href={photo.pagina} target="_blank" rel="noopener">Foto</a>: {photo.autore}, {photo.licenza}</figcaption>
    </figure>
    <div class="d-text">
      <span class="lab">{tile.label}</span>
      <h2 id="h-{tile.id}" tabindex="-1" bind:this={h2}>
        {#each head.title as p, i (i)}{#if p.em}<em>{p.t}</em>{:else}{p.t}{/if}{/each}
      </h2>
      {#if head.deck}<p class="deck">{head.deck}</p>{/if}
      <div class="actions">
        <button type="button" class="copy" onclick={copy}>{copied ? 'Link copiato' : 'Copia link'}</button>
        {#if fallbackUrl}<input class="copy-url" readonly value={fallbackUrl} bind:this={urlInput} aria-label="Link da copiare" />{/if}
      </div>
      <button type="button" class="close" aria-label="Chiudi {tile.label}" onclick={onclose}>×</button>
    </div>
  </div>
  <div class="blocks">{@render children()}</div>
</section>

<style>
  .detail { display: grid; gap: var(--s3); }
  .d-hero { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: var(--s4); background: var(--card); border-radius: var(--r-lg); box-shadow: var(--shadow); padding: var(--s1); }
  @media (max-width: 860px) { .d-hero { grid-template-columns: minmax(0, 1fr); gap: var(--s2); } }
  figure { display: grid; gap: var(--s1); }
  .ph { display: block; min-height: 280px; height: 100%; border-radius: var(--r-md); overflow: hidden; background: var(--line); }
  @media (max-width: 860px) { .ph { min-height: 0; aspect-ratio: 16 / 9; } }
  .ph img { width: 100%; height: 100%; object-fit: cover; }
  .credit { font-size: 12px; line-height: 16px; color: var(--fg-3); padding-inline: var(--s1); }
  .d-text { display: grid; gap: var(--s2); align-content: center; padding: var(--s3) var(--s8) var(--s3) 0; position: relative; }
  @media (max-width: 860px) { .d-text { padding: 0 var(--s2) var(--s3); } }
  .lab { font-size: 14px; color: var(--fg-2); }
  h2 { font-weight: 600; font-size: clamp(28px, 3.6vw, 40px); line-height: 1.2; letter-spacing: -.025em; text-wrap: balance; max-width: 22ch; outline: none; }
  h2 em { font-style: normal; color: var(--accent); }
  .deck { color: var(--fg-2); max-width: 56ch; }
  .actions { display: flex; flex-wrap: wrap; gap: var(--s1); align-items: center; }
  .copy { background: var(--bg); border: 0; border-radius: 999px; padding: var(--s1) var(--s2); min-height: 40px; cursor: pointer; font-size: 14px; }
  .copy-url { font: inherit; font-size: 14px; border: 1px solid var(--line-2); border-radius: var(--r-sm); padding: var(--s1); min-width: 0; flex: 1 1 240px; background: var(--card); color: var(--fg); }
  .close { position: absolute; top: var(--s2); right: var(--s2); width: 40px; height: 40px; border-radius: 50%; border: 0; background: var(--bg); cursor: pointer; font-size: 24px; line-height: 40px; }
  @media (max-width: 860px) { .close { display: none; } }
  .copy:hover, .close:hover { background: var(--line-2); }
  .blocks { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: var(--s2); }
</style>
```

Sul telefono la × del dettaglio è nascosta: si usa quella fissa nella striscia delle pillole (Task 15, `Pills`).

- [ ] **Step 5: `web/src/lib/tiles/Pills.svelte`**

```svelte
<script lang="ts">
  import { PHOTOS } from '../photos';
  import type { TileId } from '../router';
  import type { TileDef } from './types';

  let { tiles, onpick, onclose }: { tiles: TileDef[]; onpick: (id: TileId) => void; onclose: () => void } = $props();
</script>

<nav class="pills" aria-label="Altri temi">
  <div class="scroll">
    {#each tiles as t (t.id)}
      <button type="button" class="pill" style:view-transition-name="t-{t.id}" onclick={() => onpick(t.id)}>
        <img src={PHOTOS[t.id].src} alt="" loading="lazy" />{t.label}
      </button>
    {/each}
  </div>
  <button type="button" class="x" aria-label="Chiudi" onclick={onclose}>×</button>
</nav>

<style>
  .pills { display: flex; gap: var(--s1); align-items: center; }
  .scroll { display: flex; flex-wrap: wrap; gap: var(--s1); flex: 1; min-width: 0; }
  .pill { display: inline-flex; align-items: center; gap: var(--s1); min-height: 40px; padding: 4px var(--s2) 4px 4px; border: 0; border-radius: 999px; background: var(--card); box-shadow: var(--shadow); cursor: pointer; font-size: 14px; font-weight: 500; white-space: nowrap; }
  .pill img { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
  .x { flex: none; width: 40px; height: 40px; border-radius: 50%; border: 0; background: var(--card); box-shadow: var(--shadow); cursor: pointer; font-size: 24px; line-height: 40px; }
  @media (hover: hover) { .pill:hover, .x:hover { box-shadow: var(--shadow-up); } }
  @media (max-width: 560px) {
    .pills { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; background: var(--bg); padding-block: var(--s1); margin-inline: calc(-1 * var(--s2)); padding-inline: var(--s2); }
    .scroll { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; }
  }
</style>
```

- [ ] **Step 6: Eseguire i test**

Run: `npx vitest run src/lib/tiles && npm run check`
Expected: 9 passed; 0 errori di tipo.

- [ ] **Step 7: Commit**

```bash
git add web/src/lib/tiles
git commit -m "App web: card, dettaglio e pillole"
```

---

### Task 16: Dettagli di Competenze, Business, Politica, Notizie

**Files:**
- Create: `web/src/lib/tiles/cite.ts`, `web/src/lib/tiles/CompetenzeDetail.svelte`, `BusinessDetail.svelte`, `PoliticaDetail.svelte`, `NotizieDetail.svelte`
- Test: `web/src/lib/tiles/details-a.test.ts`

**Interfaces:**
- Consumes: `DetailProps`, `TileDef` (Task 15), `Detail` (Task 15), `Block`, `LineChart`, `Bars`, `DotPlot`, `Timeline`, `DataTable` (Task 12), `Radar`, `MovesPanel` (Task 13), funzioni di `derive.ts` (Task 9), `head*` di `frasi.ts` (Task 10), `slug`, `toHash` (Task 8).
- Produces: `owidCite(s: OwidSeries | undefined): Cite`, `MISSING = 'Dati non disponibili in questo aggiornamento.'`, `fmtYm(x: number): string`, `seriesTable(series: Series[], xLabel: string, fmtX?): TableData`, `barsTable(data, cols): TableData`, `dotsTable(data, cols): TableData`, e i quattro componenti, tutti con props `DetailProps`.

- [ ] **Step 1: Scrivere i test (falliscono)**

`web/src/lib/tiles/details-a.test.ts`:

```ts
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { describe, expect, it } from 'vitest';
import type { Dataset } from '../data/types';
import type { TileId } from '../router';
import { FIXTURE, FIXTURE_TODAY as today } from '../test/fixtures';
import { headBusiness, headCompetenze, headNotizie, headPolitica, type Head } from '../text/frasi';
import BusinessDetail from './BusinessDetail.svelte';
import CompetenzeDetail from './CompetenzeDetail.svelte';
import NotizieDetail from './NotizieDetail.svelte';
import PoliticaDetail from './PoliticaDetail.svelte';
import type { DetailProps, TileDef } from './types';

const data = FIXTURE as Dataset;
const mk = (id: TileId, label: string, head: (d: Dataset, t: Date) => Head, Detail: Component<DetailProps>): TileDef =>
  ({ id, label, source: 'owid', eager: false, face: () => null, head, Detail });
const show = (Detail: Component<DetailProps>, tile: TileDef, elemento: string | null = null) =>
  render(Detail, { data, today, tile, elemento, onclose: () => {} });

describe('Competenze', () => {
  const tile = mk('competenze', 'Competenze', headCompetenze, CompetenzeDetail);
  it('titolo, radar, pannello, tabella e metodo', () => {
    show(CompetenzeDetail, tile);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('MCP entra tra le competenze da imparare ora');
    expect(screen.getByRole('img', { name: /Radar delle competenze/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Movimenti del mese' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Le competenze una per una' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Come si calcola' })).toBeInTheDocument();
  });
  it('link diretto a una competenza: è evidenziata', async () => {
    show(CompetenzeDetail, tile, 'mcp');
    const row = await screen.findByRole('button', { name: /^MCP/ });
    expect(row).toHaveAttribute('aria-pressed', 'true');
  });
  it('link diretto a una competenza che non esiste: nessun errore, niente evidenziato', () => {
    show(CompetenzeDetail, tile, 'inesistente');
    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0);
  });
});

describe('Business', () => {
  const tile = mk('business', 'Business', headBusiness, BusinessDetail);
  it('grafici con fonte cliccabile e serie mancanti dichiarate', () => {
    show(BusinessDetail, tile);
    expect(screen.getByRole('img', { name: 'Investimenti privati per regione' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Our World in Data' })[0]).toHaveAttribute('href', 'https://ourworldindata.org/grapher/private-investment-in-artificial-intelligence');
    expect(screen.getAllByText('Dati non disponibili in questo aggiornamento.').length).toBeGreaterThan(0);
    expect(screen.getByText('Italia')).toHaveClass('hot');
  });
});

describe('Politica', () => {
  const tile = mk('politica', 'Politica', headPolitica, PoliticaDetail);
  it('linea del tempo con la prossima scadenza e notizie di policy', () => {
    show(PoliticaDetail, tile);
    const next = screen.getByRole('link', { name: 'Fine della transizione per la marcatura' });
    expect(next.closest('li')).toHaveClass('next');
    expect(screen.getByRole('link', { name: 'AI Act: le linee guida sulla trasparenza' })).toBeInTheDocument();
  });
});

describe('Notizie', () => {
  const tile = mk('notizie', 'Notizie', headNotizie, NotizieDetail);
  const items = () => within(screen.getByRole('list', { name: 'Elenco delle notizie' })).queryAllByRole('listitem');
  it('tutte le notizie, poi filtro per tema', async () => {
    show(NotizieDetail, tile);
    expect(items()).toHaveLength(3);
    await fireEvent.click(screen.getByRole('button', { name: 'Politica' }));
    expect(items()).toHaveLength(1);
    await fireEvent.click(screen.getByRole('button', { name: 'Tutti i temi' }));
    expect(items()).toHaveLength(3);
  });
  it('link diretto a una fonte: filtro già applicato', async () => {
    show(NotizieDetail, tile, 'the-decoder');
    await screen.findByRole('button', { name: 'The Decoder', pressed: true });
    expect(items()).toHaveLength(2);
  });
});
```

Run: `npx vitest run src/lib/tiles/details-a.test.ts`
Expected: FAIL, componenti non trovati.

- [ ] **Step 2: `web/src/lib/tiles/cite.ts`**

```ts
import type { Cite, Series, TableData } from '../charts/types';
import type { OwidSeries } from '../data/types';

export const MISSING = 'Dati non disponibili in questo aggiornamento.';

/** Citazione completa di una serie OWID: produttore originale + link al grafico. */
export function owidCite(s: OwidSeries | undefined): Cite {
  if (!s) return [];
  return [{ t: `${s.citazione || 'Our World in Data'}. Elaborazione: ` }, { t: 'Our World in Data', href: s.url }, { t: '.' }];
}

const pad = (n: number) => String(n).padStart(2, '0');
/** Tempo numerico (tNum) → "AAAA-MM", per le tabelle dei dati mensili o giornalieri. */
export const fmtYm = (x: number): string => {
  const y = Math.floor(x);
  return `${y}-${pad(Math.min(12, Math.floor((x - y) * 12) + 1))}`;
};

/** Tabella "Vedi i dati" per un grafico a linee: una colonna per serie. */
export function seriesTable(series: Series[], xLabel: string, fmtX: (x: number) => string = (x) => String(Math.round(x))): TableData {
  const xs = [...new Set(series.flatMap((s) => s.pts.map((p) => p.x)))].sort((a, b) => a - b);
  return { cols: [xLabel, ...series.map((s) => s.name)], rows: xs.map((x) => [fmtX(x), ...series.map((s) => s.pts.find((p) => p.x === x)?.y ?? '—')]) };
}
export const barsTable = (data: { k: string; v: number }[], cols: [string, string]): TableData => ({ cols, rows: data.map((d) => [d.k, d.v]) });
export const dotsTable = (data: { k: string; now: number; was?: number | null }[], cols: [string, string, string]): TableData =>
  ({ cols, rows: data.map((d) => [d.k, d.now, d.was ?? '—']) });
```

- [ ] **Step 3: `web/src/lib/tiles/CompetenzeDetail.svelte`**

```svelte
<script lang="ts">
  import Block from '../charts/Block.svelte';
  import DataTable from '../charts/DataTable.svelte';
  import MovesPanel from '../charts/MovesPanel.svelte';
  import Radar from '../charts/Radar.svelte';
  import { radarRows } from '../data/derive';
  import type { Quadrant } from '../data/types';
  import Detail from './Detail.svelte';
  import type { DetailProps } from './types';

  let { data, today, tile, elemento, onclose }: DetailProps = $props();

  const head = $derived(tile.head(data, today));
  const rows = $derived(data.radar ? radarRows(data.radar) : []);
  const quadranti = $derived(data.radar?.quadranti ?? ({ 'impara-ora': 'Impara ora', prova: 'Da provare', consolida: 'Da consolidare', osserva: "Tieni d'occhio" } as Record<Quadrant, string>));
  let highlight = $state<string | null>(null); // selezione fissata (clic, tocco, link diretto)
  let hovered = $state<string | null>(null); // anteprima al passaggio del mouse
  $effect(() => {
    highlight = elemento && rows.some((r) => r.id === elemento) ? elemento : null;
  });
  const pct = (v: number | null) => (v == null ? '—' : Math.round(v * 100));
  const basis = $derived(data.radar?.base_domanda === 'lavoro'
    ? 'Domanda dagli annunci di lavoro in Europa e USA (The Adzuna API).'
    : 'Senza la chiave di Adzuna la domanda si stima dai nuovi repository open source degli ultimi 3 mesi.');
  const arxivDown = $derived(data.status?.fonti?.arxiv?.stato === 'errore' ? ' In questo giro arXiv non ha risposto: lo slancio viene solo da GitHub.' : '');
  const METODO = [
    'Slancio e domanda sono ranghi percentili da 0 a 100 tra le competenze del radar: 0 è la più bassa, 100 la più alta.',
    "Paper: quota di paper AI su arXiv che citano la competenza nell'abstract, ultimi 3 mesi interi rispetto ai 3 precedenti.",
    'Repository: nuovi repository GitHub con il topic della competenza, ultimi 3 mesi rispetto ai 3 precedenti.',
    'Lavoro: annunci attivi che citano la competenza ogni 10.000 annunci del Paese, media tra i Paesi.',
    "Quadranti: sopra la mediana su entrambe le misure = Impara ora; solo slancio = Da provare; solo domanda = Da consolidare; nessuna delle due = Tieni d'occhio.",
    'La posizione di un mese fa usa le stesse formule sulle serie fermate al mese precedente.',
    'Le parole cercate per ogni competenza sono in config/skills.yaml.',
  ];
</script>

<Detail {tile} {head} {onclose}>
  {#if !rows.length}
    <Block span={12} title="Radar delle competenze" missing="Il radar si calcola dopo il primo aggiornamento di arXiv e GitHub." />
  {:else}
    <Block span={8} title="Radar delle competenze"
      note="Posizione rispetto alle altre competenze: al centro la mediana. Le frecce partono da dove era un mese fa."
      cite={[{ t: basis + arxivDown }]}
      table={{ cols: ['Competenza', 'Quadrante', 'Slancio', 'Domanda', 'Un mese fa (slancio / domanda)'],
               rows: rows.map((r) => [r.nome, quadranti[r.quadrante], pct(r.slancio), pct(r.domanda), r.hasPrev ? `${pct(r.sp)} / ${pct(r.dp)}` : '—']) }}>
      <Radar {rows} {quadranti} highlight={hovered ?? highlight} onpick={(id) => (highlight = highlight === id ? null : id)} />
    </Block>
    <Block span={4} title="Movimenti del mese">
      <MovesPanel {rows} {quadranti} bind:highlight bind:hovered />
    </Block>
    <Block span={12} title="Le competenze una per una">
      <DataTable cols={['Competenza', 'Cosa è', 'Quadrante', 'Slancio', 'Domanda']}
        rows={rows.map((r) => [r.nome, r.descrizione, quadranti[r.quadrante], pct(r.slancio), pct(r.domanda)])} />
    </Block>
    <Block span={12} title="Come si calcola">
      <ul class="method">{#each METODO as m (m)}<li>{m}</li>{/each}</ul>
    </Block>
  {/if}
</Detail>

<style>
  .method { margin: 0; padding-left: var(--s3); display: grid; gap: var(--s1); color: var(--fg-2); font-size: 14px; line-height: 24px; max-width: 80ch; }
</style>
```

- [ ] **Step 4: `web/src/lib/tiles/BusinessDetail.svelte`**

```svelte
<script lang="ts">
  import Bars from '../charts/Bars.svelte';
  import Block from '../charts/Block.svelte';
  import DotPlot from '../charts/DotPlot.svelte';
  import LineChart from '../charts/LineChart.svelte';
  import { owidLatestByEntity, owidPoints, tNum } from '../data/derive';
  import { nf } from '../text/format';
  import { barsTable, dotsTable, fmtYm, owidCite, seriesTable, MISSING } from './cite';
  import Detail from './Detail.svelte';
  import type { DetailProps } from './types';

  let { data, today, tile, onclose }: DetailProps = $props();

  const head = $derived(tile.head(data, today));
  const o = $derived(data.owid);
  const mld = (v: number) => nf(v, v < 10 ? 1 : 0);
  const REG: [string, string][] = [['United States', 'USA'], ['China', 'Cina'], ['Europe', 'Europa']];
  const inv = $derived(REG.map(([e, name]) => ({ name, hot: e === 'United States', pts: owidPoints(o, 'investimenti_privati', e).map((p) => ({ x: tNum(p.t), y: p.v / 1e9 })) })).filter((s) => s.pts.length));
  const gen = $derived(owidPoints(o, 'investimenti_generativa', 'World').map((p) => ({ k: p.t, v: p.v / 1e9 })));
  const TIPI: Record<string, string> = { 'Merger/acquisition': 'Acquisizioni', 'Minority stake': 'Quote di minoranza', 'Private investment': 'Investimenti privati', 'Public offering': 'Quotazioni' };
  const byType = $derived.by(() => {
    const m = owidLatestByEntity(o, 'investimenti_tipo');
    return Object.entries(TIPI).filter(([e]) => m.has(e)).map(([e, k]) => ({ k, v: (m.get(e)?.now.v ?? 0) / 1e9 })).sort((a, b) => a.v - b.v);
  });
  const AREE: Record<string, string> = { 'All geographies': 'Mondo', 'Asia-Pacific': 'Asia-Pacifico', 'Developing markets': 'Paesi emergenti', Europe: 'Europa', 'Greater China': 'Cina', 'North America': 'Nord America' };
  const imprese = $derived([...owidLatestByEntity(o, 'imprese_ai')].map(([e, x]) => ({ k: AREE[e] ?? e, now: x.now.v, was: x.was?.v ?? null, hot: e === 'Europe' })).sort((a, b) => b.now - a.now));
  const eu = $derived(data.eurostat);
  const euYear = $derived(eu ? String(Math.max(...Object.values(eu.serie).flatMap((s) => Object.keys(s).map(Number)))) : '');
  const euRows = $derived(eu ? Object.entries(eu.serie)
    .map(([k, s]) => ({ k: eu.nomi[k] ?? k, now: s[euYear], was: s[String(Number(euYear) - 1)] ?? null, hot: k === 'IT' || k === 'EU27_2020' }))
    .filter((r) => r.now != null).sort((a, b) => b.now - a.now) : []);
  const dc = $derived(owidPoints(o, 'data_center_spesa', 'United States').slice(-36).map((p) => ({ x: tNum(p.t), y: p.v / 1e9 })));
  const ELE: [string, string][] = [['World', 'Mondo'], ['United States', 'USA'], ['China', 'Cina'], ['Europe (IEA)', 'Europa']];
  const ele = $derived(ELE.map(([e, name]) => ({ name, hot: e === 'Europe (IEA)', pts: owidPoints(o, 'data_center_elettricita', e).map((p) => ({ x: tNum(p.t), y: p.v })) })).filter((s) => s.pts.length));
  const nvidia = $derived(owidPoints(o, 'nvidia_ricavi', 'Data centers and AI').slice(-8).map((p) => ({ k: p.t.replace('-', ' '), v: p.v / 1e9 })));
  const tsmc = $derived(owidPoints(o, 'tsmc_ricavi', 'Taiwan').slice(-8).map((p) => ({ k: p.t, v: p.v / 1e9 })));
  const s = (id: string) => o?.serie?.[id];
</script>

<Detail {tile} {head} {onclose}>
  <h3 class="group">Investimenti</h3>
  <Block span={8} title="Investimenti privati per regione" note="Miliardi di dollari a prezzi 2021. Esclude le aziende quotate e la spesa interna delle grandi tecnologiche."
    missing={inv.length ? null : MISSING} cite={owidCite(s('investimenti_privati'))}
    table={seriesTable(inv, 'Anno')}>
    <LineChart label="Investimenti privati per regione" series={inv} yFormat={mld} />
  </Block>
  <Block span={4} title="Di cui AI generativa" note="Miliardi di dollari a prezzi 2021, mondo." missing={gen.length ? null : MISSING}
    cite={owidCite(s('investimenti_generativa'))} table={{ cols: ['Anno', 'Miliardi $'], rows: gen.map((g) => [g.k, g.v]) }}>
    <Bars label="Investimenti in AI generativa" data={gen} format={mld} />
  </Block>
  <Block span={12} title="Investimenti delle aziende per tipo, ultimo anno" note="Miliardi di dollari a prezzi 2021." missing={byType.length ? null : MISSING}
    cite={owidCite(s('investimenti_tipo'))} table={{ cols: ['Tipo', 'Miliardi $'], rows: byType.map((b) => [b.k, b.v]) }}>
    <Bars label="Investimenti delle aziende per tipo" data={byType} format={mld} />
  </Block>

  <h3 class="group">Adozione</h3>
  <Block title="Imprese che usano l'AI, per area" note="Aziende intervistate che usano l'AI in almeno una funzione. Punto pieno: ultimo anno; vuoto: anno prima."
    missing={imprese.length ? null : MISSING} cite={owidCite(s('imprese_ai'))}
    table={dotsTable(imprese, ['Area', 'Ultimo anno', 'Anno prima'])}>
    <DotPlot label="Imprese che usano l'AI, per area" data={imprese} />
  </Block>
  <Block title="Imprese europee che usano l'AI, {euYear}" note="Imprese con almeno 10 addetti che usano almeno una tecnologia AI. Punto vuoto: anno prima."
    missing={euRows.length ? null : MISSING} cite={eu ? [{ t: 'Fonte: ' }, { t: 'Eurostat, isoc_eb_ai', href: eu.url }, { t: '.' }] : null}
    table={{ cols: ['Paese', euYear, String(Number(euYear) - 1)], rows: euRows.map((r) => [r.k, r.now, r.was ?? '—']) }}>
    <DotPlot label="Imprese europee che usano l'AI" data={euRows} />
  </Block>

  <h3 class="group">Infrastruttura</h3>
  <Block title="Spesa per costruire data center negli USA" note="Miliardi di dollari al mese, prezzi costanti, ultimi 3 anni." missing={dc.length ? null : MISSING}
    cite={owidCite(s('data_center_spesa'))} table={seriesTable([{ name: 'Miliardi $', pts: dc }], 'Mese', fmtYm)}>
    <LineChart label="Spesa per data center negli USA" series={[{ name: 'USA', hot: true, pts: dc }]} yFormat={mld} />
  </Block>
  <Block title="Elettricità consumata dai data center" note="Quota della domanda totale di elettricità, %." missing={ele.length ? null : MISSING}
    cite={owidCite(s('data_center_elettricita'))} table={seriesTable(ele, 'Anno')}>
    <LineChart label="Elettricità consumata dai data center" series={ele} yFormat={(v) => `${nf(v, 1)}%`} />
  </Block>
  <Block title="Ricavi di Nvidia da data center e AI" note="Miliardi di dollari per trimestre." missing={nvidia.length ? null : MISSING} cite={owidCite(s('nvidia_ricavi'))} table={barsTable(nvidia, ['Trimestre', 'Miliardi $'])}>
    <Bars label="Ricavi trimestrali di Nvidia da data center" data={nvidia} format={mld} />
  </Block>
  <Block title="Ricavi di TSMC" note="Miliardi di dollari all'anno: il principale produttore di chip per l'AI." missing={tsmc.length ? null : MISSING} cite={owidCite(s('tsmc_ricavi'))} table={barsTable(tsmc, ['Anno', 'Miliardi $'])}>
    <Bars label="Ricavi annui di TSMC" data={tsmc} format={mld} />
  </Block>
</Detail>

<style>
  .group { grid-column: 1 / -1; font-weight: 600; font-size: 14px; line-height: 24px; color: var(--fg-2); padding-top: var(--s2); }
</style>
```

- [ ] **Step 5: `web/src/lib/tiles/PoliticaDetail.svelte`**

```svelte
<script lang="ts">
  import Block from '../charts/Block.svelte';
  import Timeline from '../charts/Timeline.svelte';
  import { day } from '../text/format';
  import Detail from './Detail.svelte';
  import type { DetailProps } from './types';

  let { data, today, tile, onclose }: DetailProps = $props();

  const head = $derived(tile.head(data, today));
  const items = $derived((data.ai_act?.scadenze ?? []).map((s) => ({ date: s.data, title: s.titolo, text: s.descrizione, href: s.fonte })));
  const policy = $derived((data.news?.notizie ?? []).filter((n) => n.tema === 'politica').slice(0, 8));
</script>

<Detail {tile} {head} {onclose}>
  <Block span={8} title="Linea del tempo dell'AI Act" missing={items.length ? null : "Le scadenze dell'AI Act non sono disponibili in questo aggiornamento."}
    cite={[{ t: "Date dal Regolamento (UE) 2024/1689 e dal Digital Omnibus sull'AI. Ogni voce porta alla fonte ufficiale." }]}>
    <Timeline label="Scadenze dell'AI Act" {items} {today} />
  </Block>
  <Block span={4} title="Notizie di policy">
    {#if policy.length}
      <ul class="list" aria-label="Notizie di policy">
        {#each policy as n (n.link)}
          <li><a href={n.link} target="_blank" rel="noopener">{n.titolo}</a><span>{n.fonte} · {day(n.data)}</span></li>
        {/each}
      </ul>
    {:else}
      <p class="note">Nessuna notizia di policy negli ultimi {data.news?.giorni ?? 45} giorni.</p>
    {/if}
  </Block>
</Detail>

<style>
  .list { list-style: none; margin: 0; padding: 0; display: grid; }
  .list li { display: grid; gap: 4px; padding-block: var(--s2); }
  .list li + li { border-top: 1px solid var(--line); }
  .list a { font-weight: 500; text-decoration: none; }
  .list a:hover { text-decoration: underline; }
  .list span, .note { font-size: 12px; line-height: 16px; color: var(--fg-3); }
</style>
```

- [ ] **Step 6: `web/src/lib/tiles/NotizieDetail.svelte`**

```svelte
<script lang="ts">
  import Block from '../charts/Block.svelte';
  import { slug, toHash } from '../router';
  import { day } from '../text/format';
  import Detail from './Detail.svelte';
  import type { DetailProps } from './types';

  let { data, today, tile, elemento, onclose }: DetailProps = $props();

  const head = $derived(tile.head(data, today));
  const all = $derived(data.news?.notizie ?? []);
  const fonti = $derived([...new Set(all.map((n) => n.fonte))]);
  const TEMI: Record<string, string> = { politica: 'Politica', ricerca: 'Ricerca', prodotti: 'Prodotti', business: 'Business', altro: 'Altro' };
  const temi = $derived([...new Set(all.map((n) => n.tema ?? 'altro'))].sort());
  let fonte = $state<string | null>(null);
  let tema = $state<string | null>(null);
  $effect(() => {
    fonte = fonti.find((f) => elemento && slug(f) === elemento) ?? null;
  });
  const shown = $derived(all.filter((n) => (!fonte || n.fonte === fonte) && (!tema || (n.tema ?? 'altro') === tema)));
  const errori = $derived(Object.keys(data.news?.errori ?? {}));
  function pickFonte(f: string | null) {
    fonte = f;
    history.replaceState(history.state, '', toHash('notizie', f ? slug(f) : null));
  }
</script>

<Detail {tile} {head} {onclose}>
  <Block span={12} title="Tutte le notizie" note="Le notizie degli ultimi {data.news?.giorni ?? 45} giorni, dalla più recente.">
    <div class="filters">
      <div class="chips" role="group" aria-label="Filtra per fonte">
        <button type="button" aria-pressed={fonte === null} onclick={() => pickFonte(null)}>Tutte le fonti</button>
        {#each fonti as f (f)}<button type="button" aria-pressed={fonte === f} onclick={() => pickFonte(f)}>{f}</button>{/each}
      </div>
      <div class="chips" role="group" aria-label="Filtra per tema">
        <button type="button" aria-pressed={tema === null} onclick={() => (tema = null)}>Tutti i temi</button>
        {#each temi as t (t)}<button type="button" aria-pressed={tema === t} onclick={() => (tema = t)}>{TEMI[t] ?? t}</button>{/each}
      </div>
    </div>
    <ul class="news" aria-label="Elenco delle notizie">
      {#each shown as n (n.link)}
        <li>
          <span class="meta">{day(n.data)}</span>
          <span><a href={n.link} target="_blank" rel="noopener">{n.titolo}</a><span class="meta">{n.fonte} · {TEMI[n.tema ?? 'altro'] ?? n.tema}</span></span>
        </li>
      {/each}
    </ul>
    {#if !shown.length}<p class="meta">Nessuna notizia con questi filtri.</p>{/if}
    {#if errori.length}<p class="meta">Non raggiunti all'ultimo aggiornamento: {errori.join(', ')}.</p>{/if}
  </Block>
</Detail>

<style>
  .filters { display: grid; gap: var(--s1); }
  .chips { display: flex; flex-wrap: wrap; gap: var(--s1); }
  .chips button { background: var(--bg); border: 0; border-radius: 999px; padding: var(--s1) 12px; min-height: 40px; font-size: 14px; line-height: 24px; cursor: pointer; color: var(--fg-2); }
  .chips button[aria-pressed='true'] { background: var(--fg); color: var(--card); }
  .news { list-style: none; margin: 0; padding: 0; display: grid; }
  .news li { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: var(--s2); padding-block: var(--s2); }
  .news li + li { border-top: 1px solid var(--line); }
  @media (max-width: 560px) { .news li { grid-template-columns: minmax(0, 1fr); gap: 4px; } }
  .news a { font-weight: 500; text-decoration: none; display: block; }
  .news a:hover { text-decoration: underline; }
  .meta { font-size: 12px; line-height: 16px; color: var(--fg-3); display: block; }
</style>
```

- [ ] **Step 7: Eseguire i test**

Run: `npx vitest run src/lib/tiles && npm run check`
Expected: tutti passano; 0 errori di tipo.

- [ ] **Step 8: Commit**

```bash
git add web/src/lib/tiles
git commit -m "App web: dettagli di Competenze, Business, Politica e Notizie"
```

---

### Task 17: Dettagli di Modelli, Open source, Persone, Rapporti

**Files:**
- Create: `web/src/lib/text/paesi.ts`, `web/src/lib/tiles/ModelliDetail.svelte`, `OpenDetail.svelte`, `PersoneDetail.svelte`, `RapportiDetail.svelte`
- Test: `web/src/lib/tiles/details-b.test.ts`

**Interfaces:**
- Consumes: come il Task 16, più `tipoLabel` (Task 10), `monthName`, `monthYear` (Task 6).
- Produces: `paese(en: string): string` (nomi inglesi OWID → italiano, invariato se sconosciuto) e i quattro componenti con props `DetailProps`.

- [ ] **Step 1: Scrivere i test (falliscono)**

`web/src/lib/tiles/details-b.test.ts`:

```ts
import { render, screen } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { describe, expect, it } from 'vitest';
import type { Dataset } from '../data/types';
import type { TileId } from '../router';
import { FIXTURE, FIXTURE_TODAY as today } from '../test/fixtures';
import { paese } from '../text/paesi';
import { headModelli, headOpen, headPersone, headRapporti, type Head } from '../text/frasi';
import ModelliDetail from './ModelliDetail.svelte';
import OpenDetail from './OpenDetail.svelte';
import PersoneDetail from './PersoneDetail.svelte';
import RapportiDetail from './RapportiDetail.svelte';
import type { DetailProps, TileDef } from './types';

const data = FIXTURE as Dataset;
const mk = (id: TileId, label: string, head: (d: Dataset, t: Date) => Head, Detail: Component<DetailProps>): TileDef =>
  ({ id, label, source: 'epoch', eager: false, face: () => null, head, Detail });
const show = (Detail: Component<DetailProps>, tile: TileDef) => render(Detail, { data, today, tile, elemento: null, onclose: () => {} });

describe('paesi', () => {
  it('traduce i nomi più comuni', () => {
    expect(paese('Italy')).toBe('Italia');
    expect(paese('United Kingdom')).toBe('Regno Unito');
    expect(paese('Atlantide')).toBe('Atlantide');
  });
});

describe('Modelli', () => {
  it('calcolo, modelli recenti, chiave mancante dichiarata', () => {
    show(ModelliDetail, mk('modelli', 'Modelli e ricerca', headModelli, ModelliDetail));
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('4,8 volte');
    expect(screen.getByRole('img', { name: 'Calcolo di addestramento dei modelli notevoli' })).toBeInTheDocument();
    expect(screen.getByText('Gemini 4 Argon')).toBeInTheDocument();
    expect(screen.getByText(/Serve una chiave gratuita di Artificial Analysis/)).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /Modelli notevoli all'anno/ })).toHaveLength(4);
  });
});

describe('Open source', () => {
  it('modelli di tendenza e stelle della settimana', () => {
    show(OpenDetail, mk('open', 'Open source', headOpen, OpenDetail));
    expect(screen.getByRole('link', { name: 'google/embeddinggemma-2' })).toHaveAttribute('href', 'https://huggingface.co/google/embeddinggemma-2');
    expect(screen.getByText('+707')).toBeInTheDocument();
  });
});

describe('Persone', () => {
  it('uso dell’AI generativa con l’Italia in evidenza, lavoro senza chiave', () => {
    show(PersoneDetail, mk('persone', 'Persone e lavoro', headPersone, PersoneDetail));
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('17,8%');
    expect(screen.getByText(/Italia 30/)).toHaveClass('hot');
    expect(screen.getByText(/Serve la chiave gratuita di Adzuna/)).toBeInTheDocument();
  });
});

describe('Rapporti', () => {
  it('uscite passate e prossime stimate, con link', () => {
    show(RapportiDetail, mk('rapporti', 'Rapporti', headRapporti, RapportiDetail));
    expect(screen.getByRole('link', { name: 'AI Index Report 2026' })).toHaveAttribute('href', 'https://hai.stanford.edu/ai-index');
    expect(screen.getByRole('link', { name: 'State of AI Report, prossima edizione (stima)' })).toBeInTheDocument();
    expect(screen.getByText('Prossima prevista: aprile 2027 (stima)')).toBeInTheDocument();
  });
});
```

Run: `npx vitest run src/lib/tiles/details-b.test.ts`
Expected: FAIL, moduli non trovati.

- [ ] **Step 2: `web/src/lib/text/paesi.ts`**

```ts
const IT: Record<string, string> = {
  World: 'Mondo', Italy: 'Italia', 'United States': 'USA', China: 'Cina', Germany: 'Germania', France: 'Francia',
  Spain: 'Spagna', 'United Kingdom': 'Regno Unito', Netherlands: 'Paesi Bassi', Poland: 'Polonia', Belgium: 'Belgio',
  Austria: 'Austria', Denmark: 'Danimarca', Finland: 'Finlandia', Sweden: 'Svezia', Norway: 'Norvegia', Ireland: 'Irlanda',
  Portugal: 'Portogallo', Greece: 'Grecia', Czechia: 'Cechia', Slovakia: 'Slovacchia', Slovenia: 'Slovenia', Croatia: 'Croazia',
  Hungary: 'Ungheria', Romania: 'Romania', Bulgaria: 'Bulgaria', Estonia: 'Estonia', Latvia: 'Lettonia', Lithuania: 'Lituania',
  Luxembourg: 'Lussemburgo', Malta: 'Malta', Cyprus: 'Cipro', Iceland: 'Islanda', Switzerland: 'Svizzera', Turkey: 'Turchia',
  Serbia: 'Serbia', Montenegro: 'Montenegro', Albania: 'Albania', 'North Macedonia': 'Macedonia del Nord',
  'Bosnia and Herzegovina': 'Bosnia ed Erzegovina', Canada: 'Canada', Australia: 'Australia', 'New Zealand': 'Nuova Zelanda',
  Japan: 'Giappone', 'South Korea': 'Corea del Sud', India: 'India', Brazil: 'Brasile', Mexico: 'Messico', Chile: 'Cile',
  'Hong Kong': 'Hong Kong', Singapore: 'Singapore', 'United Arab Emirates': 'Emirati Arabi Uniti', 'European Union (27)': 'Unione europea',
};
export const paese = (en: string): string => IT[en] ?? en;
```

- [ ] **Step 3: `web/src/lib/tiles/ModelliDetail.svelte`**

```svelte
<script lang="ts">
  import Bars from '../charts/Bars.svelte';
  import Block from '../charts/Block.svelte';
  import DataTable from '../charts/DataTable.svelte';
  import LineChart from '../charts/LineChart.svelte';
  import Scatter from '../charts/Scatter.svelte';
  import { tNum } from '../data/derive';
  import { day, monthName, nf } from '../text/format';
  import { seriesTable } from './cite';
  import Detail from './Detail.svelte';
  import type { DetailProps } from './types';

  let { data, today, tile, onclose }: DetailProps = $props();

  const head = $derived(tile.head(data, today));
  const ep = $derived(data.epoch);
  const aa = $derived(data.artificial_analysis);
  const ar = $derived(data.arxiv);
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const pow10 = (v: number) => `10${String(Math.round(Math.log10(v))).split('').map((c) => SUP[Number(c)]).join('')}`;
  const compute = $derived.by(() => {
    if (!ep) return [];
    const frontier = ep.punti.filter((p) => p.f && p.c).sort((a, b) => b.d.localeCompare(a.d)).slice(0, 3).map((p) => p.m);
    return ep.punti.filter((p) => p.c && p.c > 0).map((p) => ({ x: tNum(p.d), y: p.c as number, hot: p.f, label: frontier.includes(p.m) ? p.m : undefined }));
  });
  const aaPts = $derived((aa?.modelli ?? []).filter((m) => m.prezzo && m.prezzo > 0).slice(0, 40)
    .map((m, i) => ({ x: m.prezzo as number, y: m.indice, hot: i < 3, label: i < 3 ? m.nome : undefined })));
  const months = $derived(ar ? ar.mesi.slice(-12) : []);
  const papers = $derived(months.map((m) => ({ k: monthName(m).slice(0, 3), v: ar?.series._totale?.[m] ?? 0 })));
  const open = $derived((ep?.pesi_aperti ?? []).map((p) => ({ k: String(p.anno), v: p.totale ? (100 * p.aperti) / p.totale : 0 })));
  const AREE = ['USA', 'Cina', 'UE', 'Regno Unito'];
  const perArea = $derived(AREE.map((a) => ({ a, pts: (ep?.per_anno ?? []).filter((p) => p.area === a).map((p) => ({ x: p.anno, y: p.n })) })));
  const epCite = $derived(ep ? [{ t: 'Fonte: ' }, { t: 'Epoch AI', href: ep.url }, { t: ' (CC BY 4.0).' }] : null);
</script>

<Detail {tile} {head} {onclose}>
  <Block span={8} title="Calcolo di addestramento dei modelli notevoli" note="FLOP usati per addestrare ogni modello, scala logaritmica. In blu i modelli di frontiera."
    missing={compute.length ? null : 'Dati di Epoch AI non disponibili in questo aggiornamento.'} cite={epCite}
    table={{ cols: ['Modello di frontiera', 'Data', 'FLOP'], rows: (ep?.punti ?? []).filter((p) => p.f && p.c).sort((a, b) => b.d.localeCompare(a.d)).slice(0, 20).map((p) => [p.m, day(p.d), (p.c as number).toExponential(1)]) }}>
    <Scatter label="Calcolo di addestramento dei modelli notevoli" pts={compute} yLog xTitle="anno di pubblicazione" yTitle="FLOP" yFormat={pow10} xFormat={(v) => String(Math.round(v))} />
  </Block>
  <Block span={4} title="Capacità contro prezzo" note="Indice di intelligenza di Artificial Analysis contro prezzo per milione di token, scala logaritmica."
    missing={aaPts.length ? null : 'Serve una chiave gratuita di Artificial Analysis (AA_API_KEY nei secret del repository).'}
    cite={aa ? [{ t: 'Fonte: ' }, { t: 'Artificial Analysis', href: aa.url }, { t: '.' }] : null}
    table={{ cols: ['Modello', '$ per milione di token', 'Indice'], rows: (aa?.modelli ?? []).filter((m) => m.prezzo).slice(0, 40).map((m) => [m.nome, m.prezzo as number, m.indice]) }}>
    <Scatter label="Capacità contro prezzo dei modelli linguistici" pts={aaPts} xLog xTitle="$ per milione di token" yTitle="indice" xFormat={(v) => `$${nf(v, v < 1 ? 2 : 0)}`} />
  </Block>
  <Block title="Paper sull'AI pubblicati ogni mese" note="Nuovi paper nelle categorie informatiche dell'AI su arXiv." missing={papers.length ? null : 'Dati di arXiv non disponibili in questo aggiornamento.'}
    cite={[{ t: 'Fonte: ' }, { t: 'arXiv', href: 'https://arxiv.org' }, { t: ' (metadati CC0). Grazie ad arXiv per l’accesso aperto ai metadati.' }]}
    table={{ cols: ['Mese', 'Paper'], rows: months.map((m, i) => [m, papers[i].v]) }}>
    <Bars label="Paper sull'AI al mese" data={papers} />
  </Block>
  <Block title="Quota di modelli con pesi aperti" note="Modelli notevoli pubblicati ogni anno con i pesi scaricabili, %." missing={open.length ? null : 'Dati di Epoch AI non disponibili.'}
    cite={epCite} table={{ cols: ['Anno', '% con pesi aperti'], rows: open.map((o) => [o.k, o.v]) }}>
    <Bars label="Quota di modelli con pesi aperti" data={open} format={(v) => `${nf(v)}%`} />
  </Block>
  <Block span={12} title="Chi costruisce i modelli notevoli" note="Modelli notevoli all'anno per area dell'organizzazione." missing={ep ? null : 'Dati di Epoch AI non disponibili.'} cite={epCite}
    table={seriesTable(perArea.map((p) => ({ name: p.a, pts: p.pts })), 'Anno')}>
    <div class="multiples">
      {#each perArea as p (p.a)}
        <LineChart label="Modelli notevoli all'anno: {p.a}" height={160} series={[{ name: p.a, hot: p.a === 'UE', pts: p.pts }]} />
      {/each}
    </div>
  </Block>
  <Block span={12} title="Ultimi modelli notevoli" missing={ep?.recenti?.length ? null : 'Dati di Epoch AI non disponibili.'} cite={epCite}>
    <DataTable cols={['Modello', 'Organizzazione', 'Data', 'Area', 'Accesso']} rows={(ep?.recenti ?? []).map((r) => [r.m, r.o, day(r.d), r.a, r.accesso])} />
  </Block>
</Detail>

<style>
  .multiples { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--s3); }
</style>
```

- [ ] **Step 4: `web/src/lib/tiles/OpenDetail.svelte`**

```svelte
<script lang="ts">
  import Bars from '../charts/Bars.svelte';
  import Block from '../charts/Block.svelte';
  import DataTable from '../charts/DataTable.svelte';
  import { nf } from '../text/format';
  import { tipoLabel } from '../text/frasi';
  import Detail from './Detail.svelte';
  import type { DetailProps } from './types';

  let { data, today, tile, onclose }: DetailProps = $props();

  const head = $derived(tile.head(data, today));
  const hf = $derived(data.huggingface);
  const tipi = $derived(Object.entries(hf?.tipi_top100 ?? {}).filter(([k]) => k !== 'altro').sort((a, b) => a[1] - b[1]).slice(-6).map(([k, v]) => ({ k: tipoLabel(k), v })));
  const repos = $derived((data.github?.repos ?? []).map((r) => {
    const st = r.storico;
    const last = st[st.length - 1]?.stelle ?? 0;
    const prev = st.length > 1 ? st[st.length - 2].stelle : null;
    return { r, last, delta: prev == null ? '—' : `${last - prev >= 0 ? '+' : '−'}${nf(Math.abs(last - prev))}` };
  }).sort((a, b) => b.last - a.last));
</script>

<Detail {tile} {head} {onclose}>
  <Block span={8} title="Modelli di tendenza su Hugging Face" missing={hf?.top?.length ? null : 'Dati di Hugging Face non disponibili.'}
    cite={hf ? [{ t: 'Fonte: ' }, { t: 'Hugging Face', href: hf.url }, { t: '.' }] : null}>
    <ol class="list">
      {#each (hf?.top ?? []).slice(0, 10) as m (m.id)}
        <li><a href={m.url} target="_blank" rel="noopener">{m.id}</a><span>{tipoLabel(m.tipo)} · {nf(m.like)} like</span></li>
      {/each}
    </ol>
  </Block>
  <Block span={4} title="Che compiti fanno" note="Tipi più frequenti tra i 100 modelli di tendenza." missing={tipi.length ? null : 'Dati di Hugging Face non disponibili.'}
    table={{ cols: ['Tipo', 'Modelli su 100'], rows: tipi.map((t) => [t.k, t.v]) }}>
    <Bars label="Tipi di compito dei modelli di tendenza" data={tipi} />
  </Block>
  <Block span={12} title="Progetti open source da seguire" note="Stelle su GitHub e variazione rispetto alla settimana prima."
    missing={repos.length ? null : 'Dati di GitHub non disponibili.'} cite={[{ t: 'Fonte: ' }, { t: 'GitHub', href: 'https://github.com' }, { t: '.' }]}>
    <DataTable cols={['Repository', 'Stelle', 'In una settimana']} rows={repos.map((x) => [x.r.repo, x.last, x.delta])} />
  </Block>
</Detail>

<style>
  .list { margin: 0; padding-left: var(--s3); display: grid; }
  .list li { padding-block: var(--s1); }
  .list li + li { border-top: 1px solid var(--line); }
  .list a { font-weight: 500; text-decoration: none; overflow-wrap: anywhere; }
  .list a:hover { text-decoration: underline; }
  .list span { display: block; font-size: 12px; line-height: 16px; color: var(--fg-3); }
</style>
```

- [ ] **Step 5: `web/src/lib/tiles/PersoneDetail.svelte`**

```svelte
<script lang="ts">
  import Bars from '../charts/Bars.svelte';
  import Block from '../charts/Block.svelte';
  import DotPlot from '../charts/DotPlot.svelte';
  import LineChart from '../charts/LineChart.svelte';
  import { owidLatestByEntity, owidPoints, radarRows, tNum } from '../data/derive';
  import { nf } from '../text/format';
  import { paese } from '../text/paesi';
  import { barsTable, dotsTable, fmtYm, owidCite, seriesTable, MISSING } from './cite';
  import Detail from './Detail.svelte';
  import type { DetailProps } from './types';

  let { data, today, tile, onclose }: DetailProps = $props();

  const head = $derived(tile.head(data, today));
  const o = $derived(data.owid);
  const s = (id: string) => o?.serie?.[id];
  const pctF = (v: number) => `${nf(v, v < 10 ? 1 : 0)}%`;
  const lines = (id: string, ents: string[]) => ents
    .map((e) => ({ name: paese(e), hot: e === 'Italy', pts: owidPoints(o, id, e).map((p) => ({ x: tNum(p.t), y: p.v })) }))
    .filter((x) => x.pts.length);
  const uso = $derived(lines('uso_genai', ['World', 'Italy', 'United States', 'China']));
  const dots = (id: string) => [...owidLatestByEntity(o, id)]
    .map(([e, x]) => ({ k: paese(e), now: x.now.v, was: x.was?.v ?? null, hot: e === 'Italy' }))
    .sort((a, b) => b.now - a.now).slice(0, 16);
  const ue = $derived(dots('uso_genai_ue'));
  const giovani = $derived(dots('uso_genai_giovani_ue'));
  const dev = $derived(owidPoints(o, 'sviluppatori_ai', 'World').map((p) => ({ k: p.t, v: p.v })));
  const annunci = $derived(lines('annunci_ai', ['United States', 'Italy', 'Germany', 'France', 'Spain', 'United Kingdom']));
  const jobs = $derived(data.radar?.base_domanda === 'lavoro'
    ? radarRows(data.radar).filter((r) => r.lavoro?.media != null).sort((a, b) => (a.lavoro?.media ?? 0) - (b.lavoro?.media ?? 0)).slice(-10).map((r) => ({ k: r.breve, v: r.lavoro?.media ?? 0 }))
    : []);
</script>

<Detail {tile} {head} {onclose}>
  <Block span={8} title="Chi usa l'AI generativa" note="Quota stimata della popolazione che usa strumenti di AI generativa, %." missing={uso.length ? null : MISSING} cite={owidCite(s('uso_genai'))} table={seriesTable(uso, 'Mese', fmtYm)}>
    <LineChart label="Uso dell'AI generativa" series={uso} yFormat={pctF} />
  </Block>
  <Block span={4} title="In Europa, 16-74 anni" note="Persone che hanno usato l'AI generativa, ultimo anno. Punto vuoto: anno prima." missing={ue.length ? null : MISSING} cite={owidCite(s('uso_genai_ue'))} table={dotsTable(ue, ['Paese', 'Ultimo anno', 'Anno prima'])}>
    <DotPlot label="Uso dell'AI generativa in Europa" data={ue} />
  </Block>
  <Block title="Giovani europei, 16-24 anni" note="Stessa misura tra i più giovani." missing={giovani.length ? null : MISSING} cite={owidCite(s('uso_genai_giovani_ue'))} table={dotsTable(giovani, ['Paese', 'Ultimo anno', 'Anno prima'])}>
    <DotPlot label="Uso dell'AI generativa tra i giovani europei" data={giovani} />
  </Block>
  <Block title="Sviluppatori che usano strumenti AI" note="Sviluppatori professionisti, mondo, %." missing={dev.length ? null : MISSING} cite={owidCite(s('sviluppatori_ai'))}
    table={barsTable(dev, ['Anno', '%'])}>
    <Bars label="Sviluppatori che usano strumenti AI" data={dev} format={pctF} />
  </Block>
  <Block title="Annunci di lavoro che chiedono l'AI" note="Quota degli annunci online che chiedono competenze AI, %." missing={annunci.length ? null : MISSING} cite={owidCite(s('annunci_ai'))} table={seriesTable(annunci, 'Anno')}>
    <LineChart label="Quota di annunci di lavoro sull'AI" series={annunci} yFormat={pctF} />
  </Block>
  <Block title="Competenze più chieste negli annunci" note="Annunci che citano la competenza ogni 10.000, media tra i Paesi."
    missing={jobs.length ? null : 'Serve la chiave gratuita di Adzuna (ADZUNA_APP_ID e ADZUNA_APP_KEY nei secret del repository).'}
    cite={[{ t: 'Fonte: ' }, { t: 'The Adzuna API', href: 'https://www.adzuna.co.uk' }, { t: '.' }]} table={barsTable(jobs, ['Competenza', 'Ogni 10.000 annunci'])}>
    <Bars label="Competenze più chieste negli annunci" data={jobs} format={(v) => nf(v, 1)} />
  </Block>
</Detail>
```

- [ ] **Step 6: `web/src/lib/tiles/RapportiDetail.svelte`**

```svelte
<script lang="ts">
  import Block from '../charts/Block.svelte';
  import Timeline from '../charts/Timeline.svelte';
  import { monthYear } from '../text/format';
  import Detail from './Detail.svelte';
  import type { DetailProps } from './types';

  let { data, today, tile, onclose }: DetailProps = $props();

  const head = $derived(tile.head(data, today));
  const reps = $derived(data.rapporti?.rapporti ?? []);
  const items = $derived(reps.flatMap((r) => [
    ...r.edizioni.map((e) => ({ date: e.data, title: `${r.nome} ${e.anno}`, text: r.editore, href: e.url })),
    ...(r.prossima_prevista ? [{ date: r.prossima_prevista, title: `${r.nome}, prossima edizione (stima)`, text: r.editore, href: r.url }] : []),
  ]));
</script>

<Detail {tile} {head} {onclose}>
  <Block span={8} title="Uscite dei rapporti" missing={items.length ? null : 'Elenco dei rapporti non disponibile.'}
    cite={[{ t: 'Le prossime uscite sono stimate dalle edizioni precedenti. I link portano ai rapporti originali.' }]}>
    <Timeline label="Uscite dei rapporti periodici" {items} {today} />
  </Block>
  <Block span={4} title="I rapporti seguiti">
    <ul class="list">
      {#each reps as r (r.nome)}
        <li>
          <a href={r.url} target="_blank" rel="noopener">{r.nome}</a>
          <span>{r.editore} · {r.cadenza}</span>
          {#if r.prossima_prevista}<span>Prossima prevista: {monthYear(r.prossima_prevista)} (stima)</span>{/if}
        </li>
      {/each}
    </ul>
  </Block>
</Detail>

<style>
  .list { list-style: none; margin: 0; padding: 0; display: grid; }
  .list li { display: grid; gap: 4px; padding-block: var(--s2); }
  .list li + li { border-top: 1px solid var(--line); }
  .list a { font-weight: 600; text-decoration: none; }
  .list a:hover { text-decoration: underline; }
  .list span { font-size: 12px; line-height: 16px; color: var(--fg-3); }
</style>
```

- [ ] **Step 7: Eseguire i test**

Run: `npx vitest run && npm run check`
Expected: tutti passano; 0 errori di tipo.

- [ ] **Step 8: Commit**

```bash
git add web/src/lib/text/paesi.ts web/src/lib/tiles
git commit -m "App web: dettagli di Modelli, Open source, Persone e Rapporti"
```

---

### Task 18: Griglia, navigazione e pagina

**Files:**
- Create: `web/src/lib/tiles/registry.ts`, `web/src/lib/tiles/TileGrid.svelte`, `web/src/lib/tiles/SourcesStatus.svelte`
- Modify: `web/src/App.svelte` (sostituisce il provvisorio del Task 6)
- Test: `web/src/lib/tiles/grid.test.ts`, `web/src/app.test.ts`

**Interfaces:**
- Consumes: tutti i task precedenti della fase 2.
- Produces: `TILES: TileDef[]` (ordine: modelli, open, business, persone, politica, competenze, notizie, rapporti); `TileGrid` con props `{ data: Dataset; today: Date }`; `SourcesStatus` con props `{ status: Status | undefined }`; `App` senza props.

- [ ] **Step 1: Scrivere i test (falliscono)**

`web/src/lib/tiles/grid.test.ts`:

```ts
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Dataset } from '../data/types';
import { FIXTURE, FIXTURE_TODAY as today } from '../test/fixtures';
import TileGrid from './TileGrid.svelte';

const data = FIXTURE as Dataset;
const face = (label: string) => screen.getByRole('button', { name: new RegExp(`^${label}`) });
const details = () => document.querySelectorAll('section.detail');

beforeEach(() => {
  history.replaceState(null, '', '/');
  document.title = 'AI Radar';
});

describe('TileGrid', () => {
  it('8 card chiuse', () => {
    render(TileGrid, { data, today });
    expect(document.querySelectorAll('button.face')).toHaveLength(8);
    document.querySelectorAll('button.face').forEach((b) => expect(b).toHaveAttribute('aria-expanded', 'false'));
  });

  it('apre una card: link diretto, titolo della scheda, pillole', async () => {
    render(TileGrid, { data, today });
    await fireEvent.click(face('Business'));
    expect(document.getElementById('detail-business')).not.toBeNull();
    expect(location.hash).toBe('#business');
    expect(document.title).toBe('Business · AI Radar');
    expect(face('Business')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: 'Altri temi' }).querySelectorAll('button.pill')).toHaveLength(7);
  });

  it('Esc chiude e riporta il focus sulla card', async () => {
    render(TileGrid, { data, today });
    await fireEvent.click(face('Business'));
    await fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(details()).toHaveLength(0));
    expect(location.hash).toBe('');
    await waitFor(() => expect(document.activeElement).toBe(face('Business')));
  });

  it('indietro chiude la card', async () => {
    render(TileGrid, { data, today });
    await fireEvent.click(face('Business'));
    history.back();
    await waitFor(() => expect(details()).toHaveLength(0));
  });

  it('cambio di card con le pillole: un solo indietro torna alla home', async () => {
    render(TileGrid, { data, today });
    await fireEvent.click(face('Business'));
    await fireEvent.click(screen.getByRole('button', { name: 'Politica' }));
    expect(location.hash).toBe('#politica');
    expect(details()).toHaveLength(1);
    history.back();
    await waitFor(() => expect(details()).toHaveLength(0));
    expect(location.hash).toBe('');
  });

  it('link diretto all’avvio, anche con un elemento', async () => {
    history.replaceState(null, '', '/#competenze/mcp');
    render(TileGrid, { data, today });
    expect(document.getElementById('detail-competenze')).not.toBeNull();
    expect(await screen.findByRole('button', { name: /^MCP/, pressed: true })).toBeInTheDocument();
  });

  it('doppio clic rapido: stato coerente', async () => {
    render(TileGrid, { data, today });
    const b = face('Business');
    await fireEvent.click(b);
    await fireEvent.click(b);
    await waitFor(() => {
      const n = details().length;
      expect(n === 0 ? location.hash === '' : location.hash === '#business' && n === 1).toBe(true);
    });
  });
});
```

`web/src/app.test.ts`:

```ts
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App.svelte';
import { FIXTURE } from './lib/test/fixtures';

afterEach(() => vi.unstubAllGlobals());

describe('App', () => {
  it('carica i dati e mostra la tesi della settimana', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const k = url.split('/').pop()!.replace('.json', '');
      const body = (FIXTURE as Record<string, unknown>)[k];
      return { ok: body !== undefined, json: async () => body } as Response;
    }));
    render(App);
    expect(await screen.findByText(/quelli di un anno fa/)).toBeInTheDocument();
    expect(document.querySelectorAll('button.face')).toHaveLength(8);
    expect(screen.getByRole('heading', { name: 'Stato delle fonti' })).toBeInTheDocument();
  });

  it('nessun dato raggiungibile: avviso e Riprova', async () => {
    const fetchFn = vi.fn(async () => { throw new TypeError('offline'); });
    vi.stubGlobal('fetch', fetchFn);
    render(App);
    expect(await screen.findByText('Non riesco a caricare i dati.')).toBeInTheDocument();
    const calls = fetchFn.mock.calls.length;
    await fireEvent.click(screen.getByRole('button', { name: 'Riprova' }));
    expect(fetchFn.mock.calls.length).toBeGreaterThan(calls);
  });
});
```

Run: `npx vitest run src/lib/tiles/grid.test.ts src/app.test.ts`
Expected: FAIL, moduli non trovati.

- [ ] **Step 2: `web/src/lib/tiles/registry.ts`**

```ts
import {
  faceBusiness, faceCompetenze, faceModelli, faceNotizie, faceOpen, facePersone, facePolitica, faceRapporti,
  headBusiness, headCompetenze, headModelli, headNotizie, headOpen, headPersone, headPolitica, headRapporti,
} from '../text/frasi';
import BusinessDetail from './BusinessDetail.svelte';
import CompetenzeDetail from './CompetenzeDetail.svelte';
import ModelliDetail from './ModelliDetail.svelte';
import NotizieDetail from './NotizieDetail.svelte';
import OpenDetail from './OpenDetail.svelte';
import PersoneDetail from './PersoneDetail.svelte';
import PoliticaDetail from './PoliticaDetail.svelte';
import RapportiDetail from './RapportiDetail.svelte';
import type { TileDef } from './types';

export const TILES: TileDef[] = [
  { id: 'modelli', label: 'Modelli e ricerca', source: 'epoch', eager: true, face: faceModelli, head: headModelli, Detail: ModelliDetail },
  { id: 'open', label: 'Open source', source: 'huggingface', eager: true, face: faceOpen, head: headOpen, Detail: OpenDetail },
  { id: 'business', label: 'Business', source: 'owid', eager: true, face: faceBusiness, head: headBusiness, Detail: BusinessDetail },
  { id: 'persone', label: 'Persone e lavoro', source: 'owid', eager: true, face: facePersone, head: headPersone, Detail: PersoneDetail },
  { id: 'politica', label: 'Politica', source: 'ai_act', eager: false, face: facePolitica, head: headPolitica, Detail: PoliticaDetail },
  { id: 'competenze', label: 'Competenze', source: 'radar', eager: false, face: faceCompetenze, head: headCompetenze, Detail: CompetenzeDetail },
  { id: 'notizie', label: 'Notizie', source: 'feeds', eager: false, face: faceNotizie, head: headNotizie, Detail: NotizieDetail },
  { id: 'rapporti', label: 'Rapporti', source: 'rapporti', eager: false, face: faceRapporti, head: headRapporti, Detail: RapportiDetail },
];
```

- [ ] **Step 3: `web/src/lib/tiles/TileGrid.svelte`**

```svelte
<script lang="ts">
  import { flushSync, tick } from 'svelte';
  import type { Dataset } from '../data/types';
  import { parseHash, toHash, type TileId } from '../router';
  import Pills from './Pills.svelte';
  import { TILES } from './registry';
  import TileFace from './TileFace.svelte';

  let { data, today }: { data: Dataset; today: Date } = $props();

  const start = parseHash(location.hash);
  let openId = $state<TileId | null>(start?.tema ?? null);
  let elemento = $state<string | null>(start?.elemento ?? null);
  let lastOpened: TileId | null = start?.tema ?? null;
  let pushed = false; // la card aperta ha aggiunto un passo alla cronologia
  setTitle(openId);

  function setTitle(id: TileId | null) {
    document.title = id ? `${TILES.find((t) => t.id === id)?.label} · AI Radar` : 'AI Radar';
  }

  function withTransition(update: () => void) {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (doc.startViewTransition && !reduce) doc.startViewTransition(() => flushSync(update));
    else update();
  }

  function show(id: TileId | null, el: string | null = null) {
    withTransition(() => {
      openId = id;
      elemento = el;
      if (id) lastOpened = id;
    });
    setTitle(id);
  }

  async function refocus() {
    await tick();
    if (lastOpened) document.querySelector<HTMLButtonElement>(`#tile-${lastOpened} .face`)?.focus();
  }

  function openTile(id: TileId) {
    if (openId === id) return closeTile();
    if (openId === null) {
      history.pushState({ tema: id }, '', toHash(id));
      pushed = true;
    } else {
      history.replaceState(history.state, '', toHash(id));
    }
    show(id);
  }

  function closeTile() {
    if (openId === null) return;
    if (pushed) {
      pushed = false;
      history.back(); // onPop chiude e riporta il focus
      return;
    }
    history.replaceState(null, '', location.pathname + location.search);
    show(null);
    refocus();
  }

  function onPop() {
    const h = parseHash(location.hash);
    pushed = false;
    show(h?.tema ?? null, h?.elemento ?? null);
    if (!h) refocus();
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && openId) {
      e.preventDefault();
      closeTile();
    }
  }
</script>

<svelte:window onpopstate={onPop} onkeydown={onKey} />

{#if openId}
  <Pills tiles={TILES.filter((t) => t.id !== openId)} onpick={openTile} onclose={closeTile} />
{/if}

<div class="tiles" class:has-open={openId !== null} id="temi">
  {#each TILES as t (t.id)}
    <article class="tile" class:open={openId === t.id} class:hidden={openId !== null && openId !== t.id} id="tile-{t.id}">
      <TileFace tile={t} {data} {today} expanded={openId === t.id} onopen={() => openTile(t.id)} />
      {#if openId === t.id}
        {@const D = t.Detail}
        <D {data} {today} tile={t} {elemento} onclose={closeTile} />
      {/if}
    </article>
  {/each}
</div>

<style>
  .tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--s2); }
  @media (max-width: 1040px) { .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 560px) { .tiles { grid-template-columns: minmax(0, 1fr); gap: var(--s1); } }
  .tile { min-width: 0; }
  .has-open { grid-template-columns: minmax(0, 1fr); }
  .hidden { display: none; }
  .open :global(.face) { display: none; }
</style>
```

- [ ] **Step 4: `web/src/lib/tiles/SourcesStatus.svelte`**

```svelte
<script lang="ts">
  import DataTable from '../charts/DataTable.svelte';
  import type { Status } from '../data/types';
  import { day } from '../text/format';

  let { status }: { status: Status | undefined } = $props();

  const NOMI: Record<string, string> = {
    epoch: 'Epoch AI', artificial_analysis: 'Artificial Analysis', arxiv: 'arXiv', github: 'GitHub', huggingface: 'Hugging Face',
    adzuna: 'Adzuna', eurostat: 'Eurostat', owid: 'Our World in Data', ai_act: 'AI Act (a mano)', rapporti: 'Rapporti (a mano)',
    feeds: 'Feed delle notizie', radar: 'Radar (calcolo)',
  };
  const STATI: Record<string, string> = { ok: 'aggiornata', errore: 'errore', 'non configurata': 'non configurata' };
  const rows = $derived(Object.entries(status?.fonti ?? {}).map(([k, s]) => [
    NOMI[k] ?? k, STATI[s.stato] ?? s.stato, s.ultimo_successo ? day(s.ultimo_successo) : '—', s.stato === 'ok' ? '' : (s.messaggio ?? ''),
  ]));
</script>

<section class="status" id="stato" aria-labelledby="stato-h">
  <h2 id="stato-h">Stato delle fonti</h2>
  {#if rows.length}
    <p class="muted small">Ultimo aggiornamento: {status ? day(status.aggiornato) : '—'}. Una fonte in errore mostra l'ultimo dato valido.</p>
    <DataTable cols={['Fonte', 'Stato', 'Ultimo successo', 'Note']} {rows} />
  {:else}
    <p class="muted small">Nessun aggiornamento registrato ancora.</p>
  {/if}
</section>

<style>
  .status { display: grid; gap: var(--s2); }
  h2 { font-weight: 600; font-size: 20px; line-height: 24px; }
</style>
```

- [ ] **Step 5: `web/src/App.svelte`**

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { FILES, loadAll } from './lib/data/load';
  import type { Dataset } from './lib/data/types';
  import { PHOTOS } from './lib/photos';
  import { day, isoDay } from './lib/text/format';
  import { heroThesis } from './lib/text/frasi';
  import SourcesStatus from './lib/tiles/SourcesStatus.svelte';
  import { TILES } from './lib/tiles/registry';
  import TileGrid from './lib/tiles/TileGrid.svelte';

  const today = new Date();
  let phase = $state<'loading' | 'ready' | 'error'>('loading');
  let data = $state<Dataset>({});

  async function load() {
    phase = 'loading';
    const r = await loadAll();
    data = r.data;
    phase = r.failed.length === FILES.length ? 'error' : 'ready';
  }
  onMount(load);

  const thesis = $derived(heroThesis(data, today));
  const FONTI = [
    ['Epoch AI', 'https://epoch.ai/data/ai-models'], ['Artificial Analysis', 'https://artificialanalysis.ai/'], ['arXiv', 'https://arxiv.org'],
    ['GitHub', 'https://github.com'], ['Hugging Face', 'https://huggingface.co'], ['The Adzuna API', 'https://www.adzuna.co.uk'],
    ['Eurostat', 'https://ec.europa.eu/eurostat'], ['Our World in Data', 'https://ourworldindata.org'],
  ];
</script>

<a class="skip" href="#temi">Vai ai temi</a>
<div class="wrap">
  <header class="bar">
    <span class="logo"><i aria-hidden="true"></i>AI Radar</span>
    <nav aria-label="Pagina"><a href="#crediti">Foto e fonti</a><a href="#stato">Stato delle fonti</a></nav>
  </header>

  {#if phase === 'error'}
    <section class="alert" role="alert">
      <p>Non riesco a caricare i dati.</p>
      <button type="button" onclick={load}>Riprova</button>
    </section>
  {:else}
    <section class="hero">
      <p class="small muted">Settimana del {day(isoDay(today))}</p>
      <h1>{#each thesis as p, i (i)}{#if p.em}<em>{p.t}</em>{:else}{p.t}{/if}{/each}</h1>
      <p class="intro">Otto temi, aggiornati ogni lunedì da fonti pubbliche. Apri una card per vedere i dati e da dove vengono.</p>
    </section>
  {/if}

  {#if phase === 'ready'}
    <TileGrid {data} {today} />
  {:else if phase === 'loading'}
    <p class="muted">Caricamento dei dati…</p>
  {/if}

  <footer class="credits" id="crediti">
    <h2>Foto e fonti</h2>
    <ul>
      {#each TILES as t (t.id)}
        {@const p = PHOTOS[t.id]}
        <li>{t.label}: <a href={p.pagina} target="_blank" rel="noopener">{p.titolo}</a> · {p.autore} · {p.licenza} · Wikimedia Commons</li>
      {/each}
    </ul>
    <p class="small muted">
      Dati di {#each FONTI as [n, u], i (n)}<a href={u} target="_blank" rel="noopener">{n}</a>{i < FONTI.length - 1 ? ', ' : '.'}{/each}
      Le notizie mostrano solo titolo, data e link agli articoli originali. Il progetto non è affiliato a nessuna delle fonti.
    </p>
    <SourcesStatus status={data.status} />
  </footer>
</div>

<style>
  .bar { display: flex; justify-content: space-between; align-items: center; gap: var(--s2); }
  .logo { display: flex; align-items: center; gap: var(--s1); font-weight: 700; font-size: 20px; line-height: 24px; letter-spacing: -.01em; }
  .logo i { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--fg); position: relative; }
  .logo i::after { content: ''; position: absolute; inset: 3px; border-radius: 50%; background: var(--accent); }
  nav { display: flex; gap: var(--s3); font-size: 14px; }
  nav a { text-decoration: none; color: var(--fg-2); min-height: 40px; display: inline-flex; align-items: center; }
  nav a:hover { color: var(--fg); }
  .hero { display: grid; gap: var(--s2); max-width: 880px; padding-top: var(--s4); }
  h1 { font-weight: 500; font-size: clamp(32px, 5.2vw, 56px); line-height: 1.12; letter-spacing: -.025em; text-wrap: balance; }
  h1 em { font-style: normal; color: var(--accent); font-weight: 700; }
  .intro { font-size: 18px; line-height: 32px; color: var(--fg-2); max-width: 60ch; }
  .alert { display: flex; flex-wrap: wrap; gap: var(--s2); align-items: center; background: var(--card); border-radius: var(--r-lg); box-shadow: var(--shadow); padding: var(--s3); }
  .alert button { border: 0; border-radius: 999px; background: var(--fg); color: var(--card); padding: var(--s1) var(--s3); min-height: 40px; cursor: pointer; }
  .credits { display: grid; gap: var(--s3); border-top: 1px solid var(--line-2); padding-top: var(--s3); }
  .credits h2 { font-weight: 600; font-size: 20px; line-height: 24px; }
  .credits ul { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--s1) var(--s3); font-size: 12px; line-height: 16px; color: var(--fg-2); }
</style>
```

- [ ] **Step 6: Eseguire i test, il controllo dei tipi e la build**

Run: `npx vitest run && npm run check && npm run build`
Expected: tutti i test passano; 0 errori di tipo; build riuscita.

Se il test "indietro chiude la card" resta in attesa: in jsdom `history.back()` è asincrono ed emette `popstate`; `waitFor` aspetta fino a 1 s. Se la versione di jsdom non emette `popstate` su `back()`, sostituire nel test `history.back()` con `history.replaceState(null, '', '/'); window.dispatchEvent(new PopStateEvent('popstate'));` (stesso comportamento visto dalla pagina).

- [ ] **Step 7: Provare a mano**

Run (dalla radice del repo): `mkdir -p web/public/data && cp data/*.json web/public/data/ && cd web && npm run dev`
Aprire l'indirizzo stampato e controllare: tesi in alto, 8 card con foto, apertura e chiusura con clic, Esc e indietro, tema scuro del sistema, larghezza da telefono negli strumenti del browser.

- [ ] **Step 8: Commit**

```bash
git add web/src
git commit -m "App web: griglia delle card, navigazione e pagina completa"
```

---

### Task 19: Test end-to-end e accessibilità

**Files:**
- Create: `web/playwright.config.ts`, `web/tests/e2e/dashboard.spec.ts`

**Interfaces:**
- Consumes: l'app costruita (Task 18), `FIXTURE` (Task 10), `TEMI` (Task 8).

- [ ] **Step 1: `web/playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173/' },
  webServer: { command: 'npm run build && npm run preview', url: 'http://localhost:4173/', reuseExistingServer: true, timeout: 180_000 },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

- [ ] **Step 2: `web/tests/e2e/dashboard.spec.ts`**

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { TEMI } from '../../src/lib/router';
import { FIXTURE } from '../../src/lib/test/fixtures';

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-15T10:00:00'));
  await page.route('**/data/*.json', async (route) => {
    const name = new URL(route.request().url()).pathname.split('/').pop()!.replace('.json', '');
    const body = (FIXTURE as Record<string, unknown>)[name];
    if (body === undefined) return route.fulfill({ status: 404, body: '' });
    return route.fulfill({ json: body });
  });
});

const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const seriousViolations = async (page: Page) =>
  (await new AxeBuilder({ page }).analyze()).violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

test('home: tesi e 8 temi', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('quelli di un anno fa');
  await expect(page.locator('button.face')).toHaveCount(8);
});

for (const id of TEMI) {
  test(`card ${id}: si apre con il clic e con il link diretto`, async ({ page }) => {
    await page.goto('/');
    await page.locator(`#tile-${id} .face`).click();
    await expect(page.locator(`#detail-${id}`)).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await page.goto(`/#${id}`);
    await page.reload();
    await expect(page.locator(`#detail-${id}`)).toBeVisible();
  });
}

test('indietro chiude; dopo un cambio di card un solo indietro torna alla home', async ({ page }) => {
  await page.goto('/');
  await page.locator('#tile-business .face').click();
  await page.goBack();
  await expect(page.locator('section.detail')).toHaveCount(0);
  await page.locator('#tile-business .face').click();
  await page.getByRole('navigation', { name: 'Altri temi' }).getByRole('button', { name: 'Politica' }).click();
  await expect(page).toHaveURL(/#politica$/);
  await page.goBack();
  await expect(page.locator('section.detail')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});

test('tastiera: Invio apre e porta il focus al titolo, Esc chiude e lo riporta', async ({ page }) => {
  await page.goto('/');
  await page.locator('#tile-modelli .face').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#h-modelli')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#tile-modelli .face')).toBeFocused();
});

test('link diretto a una competenza la evidenzia', async ({ page }) => {
  await page.goto('/#competenze/mcp');
  await expect(page.getByRole('button', { name: /^MCP/, pressed: true })).toBeVisible();
});

for (const width of [320, 360]) {
  test(`${width}px: nessuno scorrimento orizzontale`, async ({ page }) => {
    await page.setViewportSize({ width, height: 780 });
    await page.goto('/');
    expect(await noHorizontalScroll(page)).toBe(true);
    for (const id of TEMI) {
      await page.goto(`/#${id}`);
      await page.reload();
      await expect(page.locator(`#detail-${id}`)).toBeVisible();
      expect(await noHorizontalScroll(page), id).toBe(true);
    }
  });
}

test('tema scuro', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(11, 11, 10)');
});

test('riduci movimento: nessuna animazione all’apertura', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('#tile-politica .face').click();
  await expect(page.locator('#detail-politica')).toBeVisible();
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test('accessibilità: nessuna violazione grave in home e nelle card', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('button.face')).toHaveCount(8);
  expect(await seriousViolations(page)).toEqual([]);
  for (const id of TEMI) {
    await page.goto(`/#${id}`);
    await page.reload();
    await expect(page.locator(`#detail-${id}`)).toBeVisible();
    expect(await seriousViolations(page), id).toEqual([]);
  }
});
```

- [ ] **Step 3: Installare il browser ed eseguire**

Run: `cd web && npx playwright install chromium && npm run e2e`
Expected: tutti i test passano. Se axe segnala contrasto insufficiente, la correzione va nei token di `app.css` (`--fg-2`, `--fg-3`), non nei singoli componenti; rieseguire.

- [ ] **Step 4: Commit**

```bash
git add web/playwright.config.ts web/tests
git commit -m "App web: test end-to-end e di accessibilità"
```

---

# Fase 3 — Messa in produzione

### Task 20: Build del sito, workflow, rimozione di `site/`, documentazione

**Files:**
- Modify: `scripts/build_site.py`, `.github/workflows/aggiorna.yml`, `README.md`, `data/README.md`, `LICENSE`
- Delete: `site/`
- Test: `tests/test_build_site.py`

**Interfaces:**
- Produces: `build_site.copy_data(data_dir: Path, web: Path = WEB) -> int`, `build_site.build(data_dir: Path, run=subprocess.run) -> None`.

- [ ] **Step 1: Scrivere il test (fallisce)**

`tests/test_build_site.py`:

```python
"""build_site: copia i dati nell'app e lancia la build."""
from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("build_site", ROOT / "scripts" / "build_site.py")
bs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bs)


def test_build_copies_data_and_runs_vite(tmp_path, monkeypatch):
    data = tmp_path / "data"
    data.mkdir()
    (data / "radar.json").write_text("{}")
    (data / "news.json").write_text("{}")
    (data / "README.md").write_text("non va copiato")
    web = tmp_path / "web"
    (web / "public" / "data").mkdir(parents=True)
    (web / "public" / "data" / "vecchio.json").write_text("{}")
    out = tmp_path / "_site"
    monkeypatch.setattr(bs, "WEB", web)
    monkeypatch.setattr(bs, "OUT", out)
    calls = []

    def fake_run(cmd, cwd, check):
        calls.append((cmd, cwd, check))
        out.mkdir()

    bs.build(data, run=fake_run)
    assert sorted(p.name for p in (web / "public" / "data").iterdir()) == ["news.json", "radar.json"]
    assert calls == [(["npm", "run", "build"], web, True)]
    assert (out / ".nojekyll").exists()
```

Run: `python -m pytest -q tests/test_build_site.py`
Expected: FAIL, `AttributeError: ... has no attribute 'WEB'`.

- [ ] **Step 2: Riscrivere `scripts/build_site.py`**

```python
"""Prepara il sito per GitHub Pages: copia i dati nell'app e la costruisce in _site/.

Uso:  python scripts/build_site.py [cartella_dati]
Anteprima locale:  python scripts/build_site.py && (cd web && npm run preview)
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "web"
OUT = ROOT / "_site"


def copy_data(data_dir: Path, web: Path | None = None) -> int:
    pub = (web or WEB) / "public" / "data"
    if pub.exists():
        shutil.rmtree(pub)
    pub.mkdir(parents=True)
    files = sorted(data_dir.glob("*.json"))
    for f in files:
        shutil.copy2(f, pub / f.name)
    return len(files)


def build(data_dir: Path, run=subprocess.run) -> None:
    n = copy_data(data_dir, WEB)
    run(["npm", "run", "build"], cwd=WEB, check=True)
    (OUT / ".nojekyll").write_text("")
    print(f"Sito pronto in {OUT} ({n} file di dati)")


if __name__ == "__main__":
    build(Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data")
```

- [ ] **Step 3: Eseguire i test Python**

Run: `python -m pytest -q`
Expected: tutti passano.

- [ ] **Step 4: Aggiornare `.github/workflows/aggiorna.yml`**

Sostituire il blocco `paths:` del trigger `push` con:

```yaml
    paths:
      - "web/**"
      - "pipeline/**"
      - "config/**"
      - "scripts/**"
      - "requirements.txt"
      - ".github/workflows/**"
```

Sostituire tutti gli `steps:` del job `aggiorna` con:

```yaml
    steps:
      - uses: actions/checkout@v7

      - uses: actions/setup-python@v7
        with:
          python-version: "3.12"
          cache: pip

      - uses: actions/setup-node@v7
        with:
          node-version: "24"
          cache: npm
          cache-dependency-path: web/package-lock.json

      - name: Installa le dipendenze
        run: |
          pip install -r requirements.txt
          npm ci --prefix web

      - name: Test della pipeline
        run: python -m pytest -q

      - name: Test dell'app
        working-directory: web
        run: |
          npm run check
          npm test

      - name: Raccogli i dati
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ADZUNA_APP_ID: ${{ secrets.ADZUNA_APP_ID }}
          ADZUNA_APP_KEY: ${{ secrets.ADZUNA_APP_KEY }}
          AA_API_KEY: ${{ secrets.AA_API_KEY }}
          AI_RADAR_USER_AGENT: "ai-radar (+https://github.com/${{ github.repository }})"
        run: python -m pipeline.run

      - name: Salva i dati nel repository
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add data
          if git diff --cached --quiet; then
            echo "Nessun dato nuovo da salvare."
          else
            git commit -m "Dati aggiornati $(date -u +%F)"
            # se nel frattempo qualcuno ha fatto push, mettiamo i dati sopra le sue modifiche
            git pull --rebase origin "$GITHUB_REF_NAME"
            git push origin "HEAD:$GITHUB_REF_NAME"
          fi

      - name: Prepara il sito
        run: python scripts/build_site.py

      - name: Test end-to-end
        working-directory: web
        run: |
          npx playwright install --with-deps chromium
          npm run e2e

      - uses: actions/upload-pages-artifact@v5
        with:
          path: _site
```

Se un test fallisce, il job si ferma prima di `upload-pages-artifact`, `pubblica` non parte e resta online la versione precedente.

- [ ] **Step 5: Rimuovere `site/` e aggiornare `LICENSE`**

Run: `git rm -r site`

In `LICENSE`, sostituire l'ultima frase del paragrafo finale:

```
Hugging Face (their respective API terms). site/vendor/d3.min.js is D3
(ISC license, see site/vendor/d3-LICENSE.txt).
```

con:

```
Hugging Face (their respective API terms), Our World in Data (CC BY 4.0,
with the original producers' terms). The D3 modules (ISC license) and the
Bricolage Grotesque font (SIL Open Font License) are installed via npm and
bundled into the built site. Photos come from Wikimedia Commons under the
licenses credited on the page.
```

- [ ] **Step 6: Aggiornare `data/README.md`**

Aggiungere alla tabella, prima della riga di `radar.json`:

```
| `owid.json` | Investimenti, adozione, uso dell'AI generativa, data center | Our World in Data (dati dei produttori citati) |
| `ai_act.json` | Scadenze dell'AI Act | `config/ai_act.yaml`, a mano |
| `rapporti.json` | Rapporti periodici: edizioni e prossime uscite | `config/rapporti.yaml`, a mano |
```

- [ ] **Step 7: Aggiornare `README.md`**

1. Nel diagramma iniziale sostituire `pagina statica (D3)` con `app Svelte (D3)`.
2. Nella sezione "Personalizzare" aggiungere tre punti:

```
- **Notizie**: in `config/sources.yaml`, blocco `feeds`. Ogni feed ha un `tema` (politica, ricerca, prodotti, business) e, se serve, degli indirizzi `alternativi` provati in ordine.
- **Serie di Our World in Data**: in `config/sources.yaml`, blocco `owid` (slug del grafico, colonna, entità).
- **Scadenze dell'AI Act e rapporti**: `config/ai_act.yaml` e `config/rapporti.yaml`, da aggiornare a mano. Ogni voce ha un link alla fonte.
```

3. Sostituire tutta la sezione "Provarlo sul proprio computer" con:

````
## Provarlo sul proprio computer

Servono Python 3.12 e Node 24.

```bash
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m pytest -q                                     # test della pipeline, senza rete
python -m pipeline.run --months 7                       # dati veri, storico corto
cd web && npm ci && npm test                            # test dell'app
cd .. && python scripts/build_site.py                   # copia i dati e costruisce _site/
cd web && npm run preview                               # apre il sito su http://localhost:4173
```

Per lavorare sull'app con il ricaricamento automatico: `cp data/*.json web/public/data/` (creando prima la cartella) e poi `cd web && npm run dev`.
````

4. Sostituire il blocco della sezione "Struttura" con:

```
config/      competenze, fonti, scadenze AI Act, rapporti (da modificare)
pipeline/    un modulo per fonte + radar.py (calcolo) + run.py (orchestrazione)
data/        dati raccolti e storico (scritti dalla pipeline)
web/         app Svelte: card, grafici, foto, test
scripts/     build_site.py (costruisce _site/), fetch_photos.py (foto da Commons)
tests/       test della pipeline con risposte HTTP simulate
.github/     workflow settimanale
```

5. Nella sezione "Fonti e licenze" sostituire l'ultimo paragrafo con:

```
Codice con licenza MIT (vedi `LICENSE`). D3 (ISC) e il font Bricolage Grotesque (OFL) arrivano da npm. Le foto sono da Wikimedia Commons, con autore e licenza indicati in pagina. I dati di Our World in Data sono CC BY 4.0, ma restano dei produttori originali, sempre citati.
```

- [ ] **Step 8: Verifica completa in locale**

Run (dalla radice): `python -m pytest -q && (cd web && npm run check && npm test) && python scripts/build_site.py && (cd web && npm run e2e)`
Expected: tutto verde; `_site/index.html` e `_site/data/*.json` presenti.

- [ ] **Step 9: Commit**

```bash
git add scripts/build_site.py tests/test_build_site.py .github/workflows/aggiorna.yml README.md data/README.md LICENSE
git commit -m "Pubblica la nuova app: build, workflow con test e2e, rimossa la pagina vecchia"
```

- [ ] **Step 10: Controllare le licenze delle serie OWID**

Per ognuna delle 13 serie del blocco `owid` in `config/sources.yaml`:
1. aprire `https://ourworldindata.org/grapher/<slug>` e la scheda "Sources & processing";
2. leggere il produttore originale (Quid, McKinsey, Lightcast, Microsoft, IEA, Eurostat, aziende) e le sue condizioni di riuso;
3. se un produttore vieta la ripubblicazione dei numeri, togliere la serie da `sources.yaml` e il blocco relativo dal dettaglio (`BusinessDetail.svelte` o `PersoneDetail.svelte`), poi rieseguire `npm test`.

Annotare l'esito in un commento sopra il blocco `owid` di `sources.yaml` (per esempio `# Licenze verificate il AAAA-MM-GG`). Commit:

```bash
git add config/sources.yaml web/src/lib/tiles
git commit -m "OWID: licenze delle serie verificate"
```

- [ ] **Step 11: Pubblicare e controllare**

Run: `git push` e poi `gh run watch -R simones99/ai-radar --exit-status`
Expected: il run passa tutti i passi. Aprire https://simones99.github.io/ai-radar/ e controllare home, una card aperta, tema scuro e larghezza da telefono.
