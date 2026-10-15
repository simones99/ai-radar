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
