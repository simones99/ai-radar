"""Notizie dai feed RSS/Atom configurati in config/sources.yaml (solo titolo, data e link)."""
from __future__ import annotations

import calendar
from datetime import datetime, timedelta, timezone

import feedparser

from .common import http_get, log, write_json

OUT = "news.json"


def parse_feed(content: bytes, source: str, since: datetime, limit: int) -> list[dict]:
    parsed = feedparser.parse(content)
    if parsed.bozo and not parsed.entries:
        raise ValueError(f"feed illeggibile: {parsed.bozo_exception}")
    items = []
    for e in parsed.entries:
        t = e.get("published_parsed") or e.get("updated_parsed")
        if not t:
            continue
        when = datetime.fromtimestamp(calendar.timegm(t), tz=timezone.utc)
        if when < since:
            continue
        title = (e.get("title") or "").strip()
        link = e.get("link") or ""
        if not title or not link.startswith(("http://", "https://")):
            continue
        items.append({"titolo": title[:220], "link": link, "data": when.date().isoformat(), "fonte": source})
    items.sort(key=lambda x: x["data"], reverse=True)
    return items[:limit]


def run(s, feeds: list[dict], days: int, per_source: int) -> dict:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    items, errors = [], {}
    for f in feeds:
        tema = f.get("tema", "altro")
        tried = []
        for url in [f["url"], *f.get("alternativi", [])]:
            try:
                r = http_get(s, url, timeout=30, retries=2)
                got = parse_feed(r.content, f["name"], since, per_source)
            except Exception as exc:  # si prova l'indirizzo successivo
                tried.append(f"{url}: {str(exc)[:120]}")
                continue
            for it in got:
                it["tema"] = tema
            items.extend(got)
            break
        else:
            errors[f["name"]] = " | ".join(tried)[:300]
            log.warning("Feed %s non letto: %s", f["name"], errors[f["name"]])
    if not items:
        raise ValueError(f"nessun feed leggibile: {errors}")
    unique: dict[str, dict] = {}  # stessa notizia in più feed: resta la prima occorrenza
    for it in items:
        unique.setdefault(it["link"], it)
    items = list(unique.values())
    items.sort(key=lambda x: (x["data"], x["fonte"]), reverse=True)
    write_json(OUT, {
        "fonti": [{"nome": f["name"], "url": f["url"], "tema": f.get("tema", "altro")} for f in feeds],
        "errori": errors,
        "giorni": days,
        "notizie": items,
    })
    return {"notizie": len(items), "feed_non_letti": len(errors)}
