"""arXiv: paper pubblicati ogni mese per competenza (conteggi, nessun testo).

API: https://info.arxiv.org/help/api — al massimo una richiesta ogni 3 secondi,
una connessione alla volta. I metadati sono CC0.
"""
from __future__ import annotations

import time
import xml.etree.ElementTree as ET
from datetime import date

from .common import complete_months, http_get, log, month_bounds, read_json, write_json

API = "https://export.arxiv.org/api/query"
# Categorie informatiche in cui finisce quasi tutta la ricerca sull'AI.
CATS = ["cs.AI", "cs.CL", "cs.LG", "cs.CV", "cs.MA", "cs.RO", "cs.IR", "cs.CR", "cs.SE"]
NS = {"os": "http://a9.com/-/spec/opensearch/1.1/"}
TOTAL_KEY = "_totale"
MONTHS = 13          # storico mantenuto per i grafici
REFRESH_LAST = 2     # mesi recenti da ricontare (arrivano invii in ritardo)
REFRESH_DAYS = 7     # ...al massimo una volta a settimana: i push ravvicinati scaricano solo i mesi mancanti
OUT = "arxiv.json"
RETRY_BACKOFF = 30.0  # dopo un 429/500 si attende 30, 60, 90, 120 s prima di arrendersi
RETRIES = 5
SLEEP = 5.0  # sopra i 3 s chiesti da arXiv: da GitHub Actions l'IP è condiviso e i 429 arrivano prima


def build_query(phrases: list[str], ym: str) -> str:
    first, last = month_bounds(ym)
    cats = " OR ".join(f"cat:{c}" for c in CATS)
    q = f"({cats}) AND submittedDate:[{first:%Y%m%d}0000 TO {last:%Y%m%d}2359]"
    if phrases:
        terms = " OR ".join(f'abs:"{p}"' for p in phrases)
        q = f"({terms}) AND {q}"
    return q


def parse_total(xml_text: str) -> int:
    root = ET.fromstring(xml_text)
    node = root.find("os:totalResults", NS)
    if node is None or node.text is None:
        raise ValueError("risposta arXiv senza totalResults")
    return int(node.text)


def run(s, skills: list[dict], today: date, *, sleep: float = SLEEP, months: int = MONTHS) -> dict:
    old = read_json(OUT, {}) or {}
    old_series: dict = old.get("series", {})
    window = complete_months(months, today)
    refresh = set(window[-REFRESH_LAST:])

    targets = [(TOTAL_KEY, [])] + [(sk["id"], sk["arxiv"]) for sk in skills if sk.get("arxiv")]
    # Si riparte dalle serie già salvate e si salva dopo ogni serie: se arXiv blocca a metà (429),
    # il giro dopo continua da lì. Il radar usa il file solo quando "completo" è vero.
    series: dict[str, dict[str, int]] = {k: v for k, v in old_series.items() if k in dict(targets)}
    queries: dict[str, list[str]] = {k: p for k, p in old.get("queries", {}).items() if k in dict(targets)}
    # Giorno dell'ultimo riconto dei mesi recenti, per serie.
    recounted: dict[str, str] = {k: d for k, d in old.get("ricontato", {}).items() if k in dict(targets)}
    calls = 0

    def save() -> None:
        done = all(k in series and set(window) <= set(series[k]) and queries.get(k) == p for k, p in targets)
        write_json(OUT, {
            "fonte": "arXiv API (metadati CC0)",
            "url": "https://arxiv.org",
            "categorie": CATS,
            "mesi": window,
            "queries": queries,
            "series": series,
            "ricontato": recounted,
            "completo": done,
        })

    for key, phrases in targets:
        current = dict(old_series.get(key, {}))
        # Se le frasi di ricerca sono cambiate, lo storico va ricalcolato.
        if old.get("queries", {}).get(key) != phrases:
            current = {}
        last = recounted.get(key)
        stale = not current or last is None or (today - date.fromisoformat(last)).days >= REFRESH_DAYS
        for ym in window:
            if ym in current and not (stale and ym in refresh):
                continue
            # max_results=1: con 0 arXiv risponde 500; serve solo totalResults
            try:
                r = http_get(s, API, params={"search_query": build_query(phrases, ym), "start": 0, "max_results": 1},
                             retries=RETRIES, backoff=RETRY_BACKOFF)
            except Exception:
                series[key], queries[key] = {m: current[m] for m in sorted(current) if m in window}, phrases
                save()
                raise
            n = parse_total(r.text)
            if key == TOTAL_KEY and n == 0:
                raise ValueError(f"arXiv ha restituito 0 paper totali per {ym}: risposta sospetta")
            current[ym] = n
            calls += 1
            time.sleep(sleep)
        series[key] = {m: current[m] for m in sorted(current) if m in window}
        queries[key] = phrases
        if stale:
            recounted[key] = today.isoformat()
        save()

    log.info("arXiv: %d chiamate, %d serie", calls, len(series))
    return {"chiamate": calls, "serie": len(series)}
