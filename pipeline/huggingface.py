"""Hugging Face Hub: modelli di tendenza e tipi di modello più richiesti."""
from __future__ import annotations

from collections import Counter
from datetime import date

from .common import http_json, read_json, write_json

API = "https://huggingface.co/api/models"
OUT = "huggingface.json"
KEEP_SNAPSHOTS = 26


def run(s, today: date) -> dict:
    models = http_json(s, API, params={"sort": "trendingScore", "limit": 100})
    if not isinstance(models, list) or not models:
        raise ValueError("risposta Hugging Face vuota o inattesa")

    top = []
    for m in models[:25]:
        mid = m.get("id") or m.get("modelId")
        top.append({
            "id": mid,
            "url": f"https://huggingface.co/{mid}",
            "tipo": m.get("pipeline_tag") or "altro",
            "libreria": m.get("library_name"),
            "like": m.get("likes", 0),
            "download": m.get("downloads", 0),
            "trending": m.get("trendingScore", 0),
            "creato": (m.get("createdAt") or "")[:10],
        })

    tipi = Counter((m.get("pipeline_tag") or "altro") for m in models)
    old = read_json(OUT, {}) or {}
    stamp = today.isoformat()
    hist = [h for h in old.get("storico_tipi", []) if h["data"] != stamp]
    hist.append({"data": stamp, "tipi": dict(tipi.most_common())})

    write_json(OUT, {
        "fonte": "Hugging Face Hub API",
        "url": "https://huggingface.co/models?sort=trending",
        "data": stamp,
        "top": top,
        "tipi_top100": dict(tipi.most_common()),
        "storico_tipi": hist[-KEEP_SNAPSHOTS:],
    })
    return {"modelli": len(models)}
