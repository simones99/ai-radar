"""Prova di frasi Adzuna prima di metterle in config/skills.yaml.

Per ogni Paese conta gli annunci totali e quelli che contengono ogni frase
(what_phrase, ultimi 30 giorni), con i primi titoli per vedere se la frase
trova annunci pertinenti. Non scrive nulla in data/.

Uso: python scripts/adzuna_probe.py "agentic AI" "edge AI" [--paesi us,gb,it,de]
     python scripts/adzuna_probe.py --elenco "agentic AI;edge AI"
Chiamate: Paesi x (frasi + 1). Richiede ADZUNA_APP_ID e ADZUNA_APP_KEY.
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.adzuna import API, MAX_DAYS_OLD, SLEEP  # noqa: E402
from pipeline.common import http_json, session  # noqa: E402

TITLES = 3


def search(s, country: str, extra: dict, app_id: str, app_key: str) -> tuple[int, list[str]]:
    params = {
        "app_id": app_id,
        "app_key": app_key,
        "results_per_page": TITLES,
        "max_days_old": MAX_DAYS_OLD,
        "content-type": "application/json",
        **extra,
    }
    data = http_json(s, API.format(country=country), params=params)
    titles = [r.get("title", "").replace("|", "/") for r in data.get("results", [])]
    return int(data["count"]), titles


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("frasi", nargs="*")
    ap.add_argument("--elenco", default="", help="frasi separate da punto e virgola")
    ap.add_argument("--paesi", default="us,gb,it,de")
    args = ap.parse_args()
    phrases = [p.strip() for p in args.frasi + args.elenco.split(";") if p.strip()]
    if not phrases:
        ap.error("nessuna frase da provare")
    app_id, app_key = os.environ.get("ADZUNA_APP_ID"), os.environ.get("ADZUNA_APP_KEY")
    if not app_id or not app_key:
        print("Mancano ADZUNA_APP_ID e ADZUNA_APP_KEY", file=sys.stderr)
        return 1
    countries = [c.strip() for c in args.paesi.split(",") if c.strip()]
    s = session()
    rows = ["| frase | Paese | annunci | ogni 10mila | primi titoli |", "|---|---|---|---|---|"]
    for c in countries:
        total, _ = search(s, c, {}, app_id, app_key)
        time.sleep(SLEEP)
        rows.append(f"| (totale) | {c} | {total} | | |")
        for p in phrases:
            n, titles = search(s, c, {"what_phrase": p}, app_id, app_key)
            time.sleep(SLEEP)
            share = 10000 * n / total if total else 0
            rows.append(f"| {p} | {c} | {n} | {share:.2f} | {' · '.join(titles)} |")
    out = "\n".join(rows)
    print(out)
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write("## Prova frasi Adzuna\n\n" + out + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
