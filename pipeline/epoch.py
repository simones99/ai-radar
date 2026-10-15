"""Epoch AI: modelli AI "notevoli" (CC BY 4.0, https://epoch.ai/data/ai-models).

Produce: punti per il grafico del compute di addestramento, numero di modelli
per anno e area geografica, quota di modelli con pesi aperti.
"""
from __future__ import annotations

import csv
import io
import re
from collections import Counter, defaultdict
from datetime import date

from .common import FatalHTTPError, http_get, log, write_json

URLS = [
    "https://epoch.ai/data/notable_ai_models.csv",
    "https://epoch.ai/data/all_ai_models.csv",  # ripiego: filtrato sui criteri di notabilità
]
OUT = "epoch.json"
FROM_YEAR = 2016

EU27 = [
    "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech", "Denmark", "Estonia",
    "Finland", "France", "Germany", "Greece", "Hungary", "Ireland", "Italy", "Latvia",
    "Lithuania", "Luxembourg", "Malta", "Netherlands", "Poland", "Portugal", "Romania",
    "Slovakia", "Slovenia", "Spain", "Sweden",
]
REGION_ORDER = ["USA", "Cina", "UE", "Regno Unito", "Altri"]


def regions_of(country_field: str) -> list[str]:
    """Aree di un modello. Un modello con organizzazioni di più aree conta per ciascuna."""
    s = country_field or ""
    found = []
    if "United States" in s:
        found.append("USA")
    if "China" in s:
        found.append("Cina")
    # "Northern Ireland" fa parte del nome del Regno Unito: non deve contare come Irlanda.
    eu_text = s.replace("Northern Ireland", "")
    if any(re.search(rf"\b{name}", eu_text) for name in EU27):
        found.append("UE")
    if "United Kingdom" in s:
        found.append("Regno Unito")
    if not found and s.strip():
        found.append("Altri")
    return found


def _float(v: str) -> float | None:
    try:
        x = float(str(v).replace(",", ""))
        return x if x > 0 else None
    except (TypeError, ValueError):
        return None


def _truthy(v: str) -> bool:
    return str(v).strip().lower() in {"true", "yes", "1", "checked", "y"}


def _col(row: dict, *names: str) -> str:
    for n in names:
        if n in row and row[n] is not None:
            return row[n]
    return ""


def parse(csv_text: str, *, notable_only: bool) -> list[dict]:
    reader = csv.DictReader(io.StringIO(csv_text.lstrip("﻿")))  # alcuni export iniziano con un BOM
    models = []
    for row in reader:
        if notable_only and not _col(row, "Notability criteria").strip():
            continue
        d = _col(row, "Publication date")[:10]
        if len(d) < 4 or not d[:4].isdigit():
            continue
        access = _col(row, "Model accessibility")
        models.append({
            "m": _col(row, "Model").strip(),
            "o": _col(row, "Organization").strip(),
            "d": d,
            "aree": regions_of(_col(row, "Country (of organization)")),
            "c": _float(_col(row, "Training compute (FLOP)")),
            "f": _truthy(_col(row, "Frontier model")),
            "open": "open weights" in access.lower(),
            "accesso": access,
            "dominio": _col(row, "Domain"),
        })
    return models


def aggregate(models: list[dict], today: date) -> dict:
    recent = [m for m in models if int(m["d"][:4]) >= FROM_YEAR]
    per_year: dict[tuple[int, str], int] = Counter()
    open_share: dict[int, list[int]] = defaultdict(lambda: [0, 0])
    for m in recent:
        y = int(m["d"][:4])
        for a in m["aree"] or ["Altri"]:
            per_year[(y, a)] += 1
        open_share[y][1] += 1
        open_share[y][0] += int(m["open"])

    points = [
        {"m": m["m"], "o": m["o"], "d": m["d"], "c": m["c"], "f": m["f"],
         "a": (m["aree"] or ["Altri"])[0], "open": m["open"]}
        for m in recent if m["c"]
    ]
    latest = sorted(recent, key=lambda m: m["d"], reverse=True)[:12]
    return {
        "punti": sorted(points, key=lambda p: p["d"]),
        "per_anno": [
            {"anno": y, "area": a, "n": per_year.get((y, a), 0)}
            for y in range(FROM_YEAR, today.year + 1) for a in REGION_ORDER
        ],
        "pesi_aperti": [
            {"anno": y, "aperti": v[0], "totale": v[1]} for y, v in sorted(open_share.items())
        ],
        "recenti": [
            {"m": m["m"], "o": m["o"], "d": m["d"], "a": ", ".join(m["aree"]) or "n.d.", "accesso": m["accesso"]}
            for m in latest
        ],
        "anno_in_corso": today.year,
    }


def run(s, today: date) -> dict:
    last_err: Exception | None = None
    for i, url in enumerate(URLS):
        try:
            text = http_get(s, url, timeout=120).text
        except FatalHTTPError as exc:
            last_err = exc
            log.warning("Epoch: %s non disponibile (%s)", url, exc)
            continue
        models = parse(text, notable_only=(i > 0))
        if len(models) < 50:
            raise ValueError(f"Epoch: solo {len(models)} modelli letti da {url}, colonne cambiate?")
        out = aggregate(models, today)
        out.update({
            "fonte": "Epoch AI, Data on AI Models (CC BY 4.0)",
            "url": "https://epoch.ai/data/ai-models",
            "file": url,
            "modelli": len(models),
        })
        write_json(OUT, out)
        return {"modelli": len(models)}
    raise last_err or RuntimeError("Epoch non raggiungibile")
