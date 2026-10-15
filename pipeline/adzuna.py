"""Adzuna: quanti annunci di lavoro attivi citano ogni competenza, per Paese.

Richiede ADZUNA_APP_ID e ADZUNA_APP_KEY (registrazione gratuita su
https://developer.adzuna.com). Limiti del piano gratuito: 25 chiamate al minuto,
250 al giorno, 1.000 a settimana, 2.500 al mese. Un giro completo usa
(competenze + 1) x Paesi chiamate: con la configurazione di base 17 x 8 = 136.
Fonte da citare come "The Adzuna API" con link ad adzuna.co.uk.
"""
from __future__ import annotations

import os
import time
from datetime import date

from .common import http_json, log, read_json, write_json

API = "https://api.adzuna.com/v1/api/jobs/{country}/search/1"
OUT = "jobs.json"
MAX_DAYS_OLD = 30
KEEP_PER_COUNTRY = 104
SLEEP = 2.6  # resta sotto le 25 chiamate al minuto


class MissingCredentials(RuntimeError):
    pass


def count(s, country: str, extra: dict, app_id: str, app_key: str) -> int:
    params = {
        "app_id": app_id,
        "app_key": app_key,
        "results_per_page": 1,
        "max_days_old": MAX_DAYS_OLD,
        "content-type": "application/json",
        **extra,
    }
    data = http_json(s, API.format(country=country), params=params)
    if "count" not in data:
        raise ValueError(f"risposta Adzuna senza 'count' per {country}")
    return int(data["count"])


def run(s, skills: list[dict], countries: dict, eu: list[str], today: date) -> dict:
    app_id, app_key = os.environ.get("ADZUNA_APP_ID"), os.environ.get("ADZUNA_APP_KEY")
    if not app_id or not app_key:
        raise MissingCredentials("ADZUNA_APP_ID/ADZUNA_APP_KEY non impostati")

    old = read_json(OUT, {}) or {}
    stamp = today.isoformat()
    snaps = [x for x in old.get("snapshots", []) if x["data"] != stamp]
    calls = 0
    for code in countries:
        total = count(s, code, {}, app_id, app_key)
        calls += 1
        time.sleep(SLEEP)
        per_skill = {}
        for sk in skills:
            if not sk.get("jobs"):
                continue
            per_skill[sk["id"]] = count(s, code, sk["jobs"], app_id, app_key)
            calls += 1
            time.sleep(SLEEP)
        snaps.append({"data": stamp, "paese": code, "totale": total, "competenze": per_skill})
        log.info("Adzuna %s: %d annunci totali", code, total)

    kept = []
    for code in countries:
        mine = sorted((x for x in snaps if x["paese"] == code), key=lambda x: x["data"])
        kept.extend(mine[-KEEP_PER_COUNTRY:])

    write_json(OUT, {
        "fonte": "The Adzuna API",
        "url": "https://www.adzuna.co.uk",
        "nota": f"Annunci pubblicati negli ultimi {MAX_DAYS_OLD} giorni al momento della rilevazione.",
        "paesi": countries,
        "paesi_ue": eu,
        "snapshots": kept,
    })
    return {"chiamate": calls}
