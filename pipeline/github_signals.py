"""GitHub: nuovi repository per topic ogni mese, base dell'AI, repository nuovi più stellati e stelle dei progetti chiave.

Usa GITHUB_TOKEN se presente (in GitHub Actions c'è sempre): 30 ricerche al minuto.
"""
from __future__ import annotations

import os
import time
from datetime import date, timedelta

from .common import FatalHTTPError, complete_months, http_json, log, month_bounds, read_json, write_json

API = "https://api.github.com"
MONTHS = 13
REFRESH_LAST = 2
KEEP_SNAPSHOTS = 60
OUT = "github.json"
NEW_DAYS = 90  # «Cosa si muove adesso»: repository creati negli ultimi 90 giorni
NEW_TOP = 3


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


def top_new(s, topic: str, since: date) -> list[dict]:
    """I repository del topic creati da `since` in poi, i più stellati per primi."""
    q = f"topic:{topic} created:>={since.isoformat()}"
    data = http_json(s, f"{API}/search/repositories",
                     params={"q": q, "sort": "stars", "order": "desc", "per_page": NEW_TOP}, headers=_headers())
    return [{
        "nome": r["full_name"],
        "url": r["html_url"],
        "descrizione": (r.get("description") or "")[:200],
        "stelle": int(r["stargazers_count"]),
        "creato": r["created_at"][:10],
    } for r in data.get("items", [])[:NEW_TOP]]


def _monthly(s, topic: str, window: list[str], refresh: set[str], cached: dict, sleep: float) -> tuple[dict[str, int], int]:
    """Nuovi repository del topic per ogni mese della finestra: si contano i mesi mancanti e quelli da ricontare."""
    current = dict(cached)
    calls = 0
    for ym in window:
        if ym in current and ym not in refresh:
            continue
        current[ym] = new_repos(s, topic, ym)
        calls += 1
        time.sleep(sleep)
    return {m: current[m] for m in sorted(current) if m in window}, calls


def run(s, skills: list[dict], repos: list[str], today: date, *, months: int = MONTHS,
        base_topics: list[str] | tuple[str, ...] = ()) -> dict:
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
        cached = old_topics.get(sk["id"], {}) if old_names.get(sk["id"]) == topic else {}
        topics[sk["id"]], n = _monthly(s, topic, window, refresh, cached, sleep)
        calls += n

    # Base dell'AI per lo slancio: somma dei nuovi repository con i topic generali (sources.yaml).
    old_base = old.get("base_per_topic", {})
    base_per_topic: dict[str, dict[str, int]] = {}
    for t in base_topics:
        base_per_topic[t], n = _monthly(s, t, window, refresh, old_base.get(t, {}), sleep)
        calls += n
    base = {m: sum(base_per_topic[t].get(m, 0) for t in base_topics) for m in window} if base_topics else {}

    # Cosa si muove adesso: se una ricerca fallisce resta la lista del giro prima.
    since = today - timedelta(days=NEW_DAYS)
    old_new = old.get("in_crescita", {})
    in_crescita: dict[str, list[dict]] = {}
    for sk in skills:
        if not sk.get("github"):
            continue
        try:
            in_crescita[sk["id"]] = top_new(s, sk["github"], since)
            calls += 1
        except Exception as exc:  # noqa: BLE001 — una lista in meno non deve fermare GitHub
            log.warning("GitHub: repository nuovi di %s non aggiornati (%s)", sk["github"], exc)
            in_crescita[sk["id"]] = old_new.get(sk["id"], [])
        time.sleep(sleep)

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
        "base_topics": list(base_topics),
        "base_per_topic": base_per_topic,
        "base": base,
        "in_crescita": in_crescita,
        "repos": out_repos,
    })
    log.info("GitHub: %d chiamate", calls)
    return {"chiamate": calls, "topic": len(topics), "base": len(base_topics), "repository": len(out_repos)}
