"""Eurostat isoc_eb_ai: quota di imprese (10+ addetti) che usano almeno una tecnologia AI."""
from __future__ import annotations

from itertools import product

from .common import http_json, write_json

API = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/isoc_eb_ai"
OUT = "eurostat.json"
FIXED = {"unit": "PC_ENT", "size_emp": "GE10", "indic_is": "E_AI_TANY"}


def decode_jsonstat(js: dict) -> list[dict]:
    """Trasforma un dataset JSON-stat 2.0 in righe {dimensione: codice, ..., value}."""
    ids, sizes = js["id"], js["size"]
    cats = []
    for dim in ids:
        index = js["dimension"][dim]["category"]["index"]
        if isinstance(index, list):
            ordered = index
        else:
            ordered = [code for code, _ in sorted(index.items(), key=lambda kv: kv[1])]
        cats.append(ordered)
    if [len(c) for c in cats] != sizes:
        raise ValueError("JSON-stat: dimensioni incoerenti")
    values = js.get("value", {})
    rows = []
    for flat, combo in enumerate(product(*cats)):
        v = values.get(str(flat)) if isinstance(values, dict) else (values[flat] if flat < len(values) else None)
        if v is None:
            continue
        rows.append({**dict(zip(ids, combo)), "value": v})
    return rows


def run(s, geos: dict) -> dict:
    params = [("format", "JSON"), ("lang", "EN")] + list(FIXED.items()) + [("geo", g) for g in geos]
    js = http_json(s, API, params=params)
    rows = decode_jsonstat(js)
    series: dict[str, dict[str, float]] = {}
    for r in rows:
        series.setdefault(r["geo"], {})[r["time"]] = round(float(r["value"]), 2)
    if not series:
        raise ValueError("Eurostat non ha restituito valori")
    write_json(OUT, {
        "fonte": "Eurostat, isoc_eb_ai",
        "url": "https://ec.europa.eu/eurostat/databrowser/view/isoc_eb_ai/default/table",
        "indicatore": "Imprese con almeno 10 addetti che usano almeno una tecnologia AI (% delle imprese)",
        "aggiornato_eurostat": js.get("updated"),
        "nomi": geos,
        "serie": {g: dict(sorted(v.items())) for g, v in series.items()},
    })
    return {"paesi": len(series)}
