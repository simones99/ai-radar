"""Esegue tutte le fonti, una alla volta, e scrive data/status.json.

Uso:
    python -m pipeline.run                 # tutto
    python -m pipeline.run --only arxiv,radar
    python -m pipeline.run --months 7      # storico più corto (prove locali)

Una fonte che fallisce non blocca le altre: resta in pagina l'ultimo dato buono
e lo stato lo segnala. Il comando esce con errore solo se falliscono tutte.
"""
from __future__ import annotations

import argparse
import logging
import sys
import time
import traceback
from datetime import date

from . import adzuna, artificial_analysis, arxiv, epoch, eurostat, feeds, github_signals, huggingface, owid, radar
from .common import load_yaml, log, now_iso, read_json, redact, session, write_json

ORDER = ["epoch", "artificial_analysis", "arxiv", "github", "huggingface", "adzuna", "eurostat", "owid", "feeds", "radar"]
SKIPPABLE = (adzuna.MissingCredentials, artificial_analysis.MissingCredentials)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="fonti separate da virgola: " + ",".join(ORDER))
    ap.add_argument("--months", type=int, default=13, help="mesi di storico per arXiv e GitHub")
    args = ap.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    skills = load_yaml("skills.yaml")["skills"]
    src = load_yaml("sources.yaml")
    today = date.today()
    s = session()

    jobs = {
        "epoch": lambda: epoch.run(s, today),
        "artificial_analysis": lambda: artificial_analysis.run(s, today),
        "arxiv": lambda: arxiv.run(s, skills, today, months=args.months),
        "github": lambda: github_signals.run(s, skills, src.get("github_repos", []), today, months=args.months),
        "huggingface": lambda: huggingface.run(s, today),
        "adzuna": lambda: adzuna.run(s, skills, src["jobs_countries"], src.get("jobs_eu_countries", []), today),
        "eurostat": lambda: eurostat.run(s, src["eurostat_geo"]),
        "owid": lambda: owid.run(s, src.get("owid", [])),
        "feeds": lambda: feeds.run(s, src["feeds"], src.get("feeds_days", 45), src.get("feeds_per_source", 12)),
        "radar": lambda: radar.run(skills, today),
    }
    selected = args.only.split(",") if args.only else ORDER
    unknown = set(selected) - set(ORDER)
    if unknown:
        ap.error(f"fonti sconosciute: {', '.join(sorted(unknown))}")

    status = read_json("status.json", {}) or {}
    sources = status.get("fonti", {})
    ok = failed = 0
    for name in ORDER:
        if name not in selected:
            continue
        prev = sources.get(name, {})
        t0 = time.time()
        log.info("== %s", name)
        try:
            info = jobs[name]()
            sources[name] = {"stato": "ok", "ultimo_successo": now_iso(), "dettagli": info,
                             "secondi": round(time.time() - t0, 1)}
            ok += 1
        except SKIPPABLE as exc:
            sources[name] = {**prev, "stato": "non configurata", "messaggio": redact(str(exc))}
        except Exception as exc:
            log.error("%s fallita: %s\n%s", name, redact(str(exc)), redact(traceback.format_exc()))
            sources[name] = {**prev, "stato": "errore", "messaggio": redact(str(exc))[:300], "ultimo_tentativo": now_iso()}
            failed += 1

    write_json("status.json", {"aggiornato": now_iso(), "fonti": sources})
    log.info("Fatto: %d ok, %d errori", ok, failed)
    return 1 if failed and not ok else 0


if __name__ == "__main__":
    sys.exit(main())
