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
REFRESH_LAST = 2     # mesi recenti ricontati a ogni giro (arrivano invii in ritardo)
OUT = "arxiv.json"
RETRY_BACKOFF = 30.0  # arXiv risponde 500/429 per qualche decina di secondi: si attende 30 s, poi 60 s


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


def run(s, skills: list[dict], today: date, *, sleep: float = 3.1, months: int = MONTHS) -> dict:
    old = read_json(OUT, {}) or {}
    old_series: dict = old.get("series", {})
    window = complete_months(months, today)
    refresh = set(window[-REFRESH_LAST:])

    targets = [(TOTAL_KEY, [])] + [(sk["id"], sk["arxiv"]) for sk in skills if sk.get("arxiv")]
    series: dict[str, dict[str, int]] = {}
    calls = 0
    for key, phrases in targets:
        current = dict(old_series.get(key, {}))
        # Se le frasi di ricerca sono cambiate, lo storico va ricalcolato.
        if old.get("queries", {}).get(key) != phrases:
            current = {}
        for ym in window:
            if ym in current and ym not in refresh:
                continue
            # max_results=1: con 0 arXiv risponde 500; serve solo totalResults
            r = http_get(s, API, params={"search_query": build_query(phrases, ym), "start": 0, "max_results": 1},
                         backoff=RETRY_BACKOFF)
            n = parse_total(r.text)
            if key == TOTAL_KEY and n == 0:
                raise ValueError(f"arXiv ha restituito 0 paper totali per {ym}: risposta sospetta")
            current[ym] = n
            calls += 1
            time.sleep(sleep)
        series[key] = {m: current[m] for m in sorted(current) if m in window}

    out = {
        "fonte": "arXiv API (metadati CC0)",
        "url": "https://arxiv.org",
        "categorie": CATS,
        "mesi": window,
        "queries": {k: p for k, p in targets},
        "series": series,
    }
    write_json(OUT, out)
    log.info("arXiv: %d chiamate, %d serie", calls, len(series))
    return {"chiamate": calls, "serie": len(series)}
