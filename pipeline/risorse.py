"""Controllo dei link «Per iniziare» di config/skills.yaml.

Una richiesta per link a settimana (HEAD, poi GET se il sito rifiuta HEAD). Un link è
segnato come non raggiungibile solo dopo due settimane di fila con errore: un sito può
cadere per qualche ora. Il passo non fa mai fallire il giro.
"""
from __future__ import annotations

import time
from datetime import date

from .common import log, read_json, redact, write_json

OUT = "risorse.json"
TIMEOUT = 15
PAUSA = 0.5


def check(s, url: str) -> int | None:
    """Stato HTTP finale del link, None se la richiesta non arriva."""
    try:
        r = s.head(url, allow_redirects=True, timeout=TIMEOUT)
        if r.status_code >= 400:  # alcuni siti rifiutano HEAD (403, 405): si riprova con GET
            r = s.get(url, timeout=TIMEOUT)
        return r.status_code
    except Exception as exc:  # noqa: BLE001 — rete, TLS, timeout: conta come errore, non ferma il giro
        log.warning("Risorse: %s non raggiungibile (%s)", url, redact(str(exc)))
        return None


def run(s, skills: list[dict], today: date) -> dict:
    old = (read_json(OUT, {}) or {}).get("link", {})
    week = today.isocalendar()[:2]
    out: dict[str, dict] = {}
    calls = 0
    for url in sorted({r["url"] for sk in skills for r in sk.get("risorse", [])}):
        prev = old.get(url)
        if prev and date.fromisoformat(prev["controllato"]).isocalendar()[:2] == week:
            out[url] = prev
            continue
        stato = check(s, url)
        calls += 1
        errori = (prev or {}).get("errori", 0) + 1 if stato is None or stato >= 400 else 0
        out[url] = {"stato": stato, "errori": errori, "ok": errori < 2, "controllato": today.isoformat()}
        time.sleep(PAUSA)
    write_json(OUT, {"link": out})
    return {"link": len(out), "richieste": calls, "non_raggiungibili": sum(not v["ok"] for v in out.values())}
