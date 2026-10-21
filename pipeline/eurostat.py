"""Eurostat isoc_eb_ai: quota di imprese con almeno 10 addetti che usano almeno una tecnologia AI, per Paese."""
from __future__ import annotations

from itertools import product

from .common import http_json, write_json

API = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/isoc_eb_ai"
OUT = "eurostat.json"
FIXED = {"unit": "PC_ENT", "size_emp": "GE10", "indic_is": "E_AI_TANY"}


def _at(seq, flat: int):
    """Cella di value o status: JSON-stat le scrive come dizionario sparso o come lista."""
    if isinstance(seq, dict):
        return seq.get(str(flat))
    return seq[flat] if flat < len(seq) else None


def decode_jsonstat(js: dict, flags: bool = False) -> list[dict]:
    """Trasforma un dataset JSON-stat 2.0 in righe {dimensione: codice, ..., value}.

    Con flags=True ogni riga ha anche "flag" e restano le celle con un flag e senza numero
    (value None): Eurostat le lascia vuote quando il dato è riservato o poco affidabile.
    """
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
    values, status = js.get("value", {}), js.get("status", {})
    rows = []
    for flat, combo in enumerate(product(*cats)):
        v = _at(values, flat)
        if not flags:
            if v is not None:
                rows.append({**dict(zip(ids, combo)), "value": v})
            continue
        f = _flag(_at(status, flat))
        if v is not None or f:
            rows.append({**dict(zip(ids, combo)), "value": v, "flag": f})
    return rows


def _flag(raw: str | None) -> str | None:
    """Flag Eurostat in minuscolo: «|C» (riservato) diventa «c», «u» (affidabilità bassa) resta «u»."""
    f = (raw or "").replace("|", "").strip().lower()
    return f or None


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
