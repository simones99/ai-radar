"""Artificial Analysis: capacità, prezzo e velocità dei modelli linguistici.

Richiede AA_API_KEY (gratuita, https://artificialanalysis.ai/documentation).
Limite: 1.000 richieste al giorno; qui ne serve una a settimana.
L'attribuzione con link ad artificialanalysis.ai è obbligatoria (è nel footer).
"""
from __future__ import annotations

import os
from datetime import date
from statistics import median

from .common import http_json, read_json, write_json

API = "https://artificialanalysis.ai/api/v2/data/llms/models"
OUT = "artificial_analysis.json"
KEEP = 104


class MissingCredentials(RuntimeError):
    pass


def _num(x):
    try:
        return float(x) if x is not None else None
    except (TypeError, ValueError):
        return None


def parse(payload) -> list[dict]:
    rows = payload.get("data", payload) if isinstance(payload, dict) else payload
    out = []
    for m in rows or []:
        ev = m.get("evaluations") or {}
        pr = m.get("pricing") or {}
        idx = _num(ev.get("artificial_analysis_intelligence_index"))
        if idx is None:
            continue
        out.append({
            "nome": m.get("name"),
            "creatore": (m.get("model_creator") or {}).get("name"),
            "indice": idx,
            "coding": _num(ev.get("artificial_analysis_coding_index")),
            "prezzo": _num(pr.get("price_1m_blended_3_to_1")),
            "velocita": _num(m.get("median_output_tokens_per_second")),
        })
    return sorted(out, key=lambda r: r["indice"], reverse=True)


def run(s, today: date) -> dict:
    key = os.environ.get("AA_API_KEY")
    if not key:
        raise MissingCredentials("AA_API_KEY non impostata")
    models = parse(http_json(s, API, headers={"x-api-key": key}))
    if not models:
        raise ValueError("Artificial Analysis: nessun modello con indice di intelligenza")

    top10 = models[:10]
    prices = [m["prezzo"] for m in top10 if m["prezzo"]]
    old = read_json(OUT, {}) or {}
    stamp = today.isoformat()
    hist = [h for h in old.get("storico", []) if h["data"] != stamp]
    hist.append({
        "data": stamp,
        "indice_max": models[0]["indice"],
        "modello_max": models[0]["nome"],
        "prezzo_mediano_top10": round(median(prices), 3) if prices else None,
    })
    write_json(OUT, {
        "fonte": "Artificial Analysis",
        "url": "https://artificialanalysis.ai/",
        "data": stamp,
        "modelli": models[:60],
        "storico": hist[-KEEP:],
    })
    return {"modelli": len(models)}
