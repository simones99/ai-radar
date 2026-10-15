"""GitHub: nuovi repository per topic ogni mese e stelle dei progetti chiave.

Usa GITHUB_TOKEN se presente (in GitHub Actions c'è sempre): 30 ricerche al minuto.
"""
from __future__ import annotations

import os
import time
from datetime import date

from .common import FatalHTTPError, complete_months, http_json, log, month_bounds, read_json, write_json

API = "https://api.github.com"
MONTHS = 13
REFRESH_LAST = 2
KEEP_SNAPSHOTS = 60
OUT = "github.json"


def _headers() -> dict:
    h = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h


def new_repos(s, topic: str, ym: str) -> int:
    first, last = month_bounds(ym)
    q = f"topic:{topic} created:{first.isoformat()}..{last.isoformat()}"
    data = http_json(s, f"{API}/search/repositories", params={"q": q, "per_page": 1}, headers=_headers())
    return int(data["total_count"])


def run(s, skills: list[dict], repos: list[str], today: date, *, months: int = MONTHS) -> dict:
    sleep = 2.2 if os.environ.get("GITHUB_TOKEN") else 6.5
    old = read_json(OUT, {}) or {}
    window = complete_months(months, today)
    refresh = set(window[-REFRESH_LAST:])

    topics: dict[str, dict[str, int]] = {}
    old_topics = old.get("topics", {})
    old_names = old.get("topic_names", {})
    calls = 0
    for sk in skills:
        topic = sk.get("github")
        if not topic:
            continue
        current = dict(old_topics.get(sk["id"], {})) if old_names.get(sk["id"]) == topic else {}
        for ym in window:
            if ym in current and ym not in refresh:
                continue
            current[ym] = new_repos(s, topic, ym)
            calls += 1
            time.sleep(sleep)
        topics[sk["id"]] = {m: current[m] for m in sorted(current) if m in window}

    # Stelle dei repository seguiti: una fotografia per giro.
    old_repos = {r["repo"]: r for r in old.get("repos", [])}
    out_repos = []
    stamp = today.isoformat()
    for full in repos:
        try:
            info = http_json(s, f"{API}/repos/{full}", headers=_headers())
        except FatalHTTPError as exc:
            log.warning("GitHub: salto %s (%s)", full, exc)
            continue
        hist = [h for h in old_repos.get(full, {}).get("storico", []) if h["data"] != stamp]
        hist.append({"data": stamp, "stelle": int(info["stargazers_count"])})
        out_repos.append({
            "repo": full,
            "url": info.get("html_url", f"https://github.com/{full}"),
            "descrizione": (info.get("description") or "")[:200],
            "ultimo_push": info.get("pushed_at"),
            "storico": hist[-KEEP_SNAPSHOTS:],
        })
        calls += 1
        time.sleep(0.5)

    write_json(OUT, {
        "fonte": "GitHub REST API",
        "url": "https://github.com",
        "mesi": window,
        "topic_names": {sk["id"]: sk["github"] for sk in skills if sk.get("github")},
        "topics": topics,
        "repos": out_repos,
    })
    log.info("GitHub: %d chiamate", calls)
    return {"chiamate": calls, "topic": len(topics), "repository": len(out_repos)}
