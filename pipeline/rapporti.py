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
