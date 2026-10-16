"""Controllo dei link «Per iniziare» di config/skills.yaml.

Una richiesta per link a settimana (HEAD, poi GET se il sito rifiuta HEAD). Un link è
segnato come non raggiungibile solo dopo due settimane di fila con errore: un sito può
cadere per qualche ora. Gli stati 401, 403 e 429 contano come link vivo (il sito
ha risposto, spesso è un blocco anti-bot). Il passo non fa mai fallire il giro.
"""
from __future__ import annotations

import time
from datetime import date

from .common import log, read_json, redact, write_json

OUT = "risorse.json"
TIMEOUT = 15
PAUSA = 0.5
# Il sito ha risposto ma rifiuta il controllo (spesso un blocco anti-bot dagli IP di GitHub Actions).
VIVI = {401, 403, 429}


def _errore(stato: int | None) -> bool:
    return stato is None or (stato >= 400 and stato not in VIVI)


def _settimana(prev) -> tuple | None:
    """Settimana ISO dell'ultimo controllo, None se manca o non è valida."""
    try:
        return date.fromisoformat(prev["controllato"]).isocalendar()[:2]
    except (KeyError, TypeError, ValueError):
        return None


def check(s, url: str) -> int | None:
    """Stato HTTP finale del link, None se la richiesta non arriva."""
    r = None
    try:
        r = s.head(url, allow_redirects=True, timeout=TIMEOUT)
    except Exception as exc:  # noqa: BLE001 — alcuni server non chiudono le HEAD: si riprova con GET
        log.warning("Risorse: HEAD su %s fallita (%s)", url, redact(str(exc)))
    try:
        if r is None or r.status_code >= 400:  # alcuni siti rifiutano HEAD (403, 405): si riprova con GET
            r = s.get(url, timeout=TIMEOUT)
        return r.status_code
    except Exception as exc:  # noqa: BLE001 — rete, TLS, timeout: conta come errore, non ferma il giro
        log.warning("Risorse: %s non raggiungibile (%s)", url, redact(str(exc)))
        return None


def run(s, skills: list[dict], today: date) -> dict:
    try:
        old = dict((read_json(OUT, {}) or {}).get("link", {}))
    except (ValueError, AttributeError, TypeError):
        old = {}
    week = today.isocalendar()[:2]
    out: dict[str, dict] = {}
    calls = 0
    for url in sorted({r["url"] for sk in skills for r in sk.get("risorse", [])}):
        prev = old.get(url)
        if not isinstance(prev, dict):
            prev = None
        if prev and _settimana(prev) == week:
            out[url] = prev
            continue
        stato = check(s, url)
        calls += 1
        antichi = int(prev.get("errori", 0)) if prev else 0
        errori = (antichi + 1) if _errore(stato) else 0
        out[url] = {"stato": stato, "errori": errori, "ok": errori < 2, "controllato": today.isoformat()}
        time.sleep(PAUSA)
    write_json(OUT, {"link": out})
    return {"link": len(out), "richieste": calls, "non_raggiungibili": sum(not v["ok"] for v in out.values())}
