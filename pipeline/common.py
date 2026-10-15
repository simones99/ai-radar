"""Funzioni condivise: percorsi, HTTP con retry, JSON, date."""
from __future__ import annotations

import json
import logging
import os
import re
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import requests
import yaml

ROOT = Path(__file__).resolve().parents[1]
CONFIG_DIR = ROOT / "config"
log = logging.getLogger("ai-radar")


def data_dir() -> Path:
    """Cartella dei dati; sovrascrivibile con AI_RADAR_DATA_DIR (usata dai test)."""
    d = Path(os.environ.get("AI_RADAR_DATA_DIR", ROOT / "data"))
    d.mkdir(parents=True, exist_ok=True)
    return d


def load_yaml(name: str) -> dict:
    with open(CONFIG_DIR / name, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


SECRET_ENV = ("ADZUNA_APP_ID", "ADZUNA_APP_KEY", "AA_API_KEY", "GITHUB_TOKEN")
_SECRET_PARAM = re.compile(r"((?:app_id|app_key|api_key|key|token)=)[^&\s]+", re.IGNORECASE)


def redact(text: str) -> str:
    """Toglie le chiavi dai messaggi d'errore: finiscono in status.json, che è pubblico."""
    for name in SECRET_ENV:
        value = os.environ.get(name)
        if value and len(value) >= 8:
            text = text.replace(value, "***")
    return _SECRET_PARAM.sub(r"\1***", text)


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def read_json(name: str, default: Any = None) -> Any:
    path = data_dir() / name
    if not path.exists():
        return default
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def write_json(name: str, obj: Any) -> None:
    path = data_dir() / name
    tmp = path.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(obj, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    tmp.replace(path)


# ---------------------------------------------------------------- HTTP

class FatalHTTPError(RuntimeError):
    """Errore che non ha senso ritentare (401, 403, 404...)."""


def session() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = os.environ.get(
        "AI_RADAR_USER_AGENT", "ai-radar/1.0 (personal open-data dashboard)"
    )
    return s


def http_get(
    s: requests.Session,
    url: str,
    *,
    params: Any = None,
    headers: dict | None = None,
    timeout: int = 60,
    retries: int = 3,
    backoff: float = 5.0,
) -> requests.Response:
    """GET con retry su errori di rete, 429 e 5xx. Rispetta Retry-After."""
    for attempt in range(1, retries + 1):
        try:
            r = s.get(url, params=params, headers=headers, timeout=timeout)
        except requests.RequestException as exc:
            if attempt == retries:
                raise
            log.warning("Errore di rete su %s (%s), riprovo", url, redact(str(exc)))
            time.sleep(backoff * attempt)
            continue
        if r.status_code == 429 or r.status_code >= 500:
            if attempt == retries:
                r.raise_for_status()
            wait = r.headers.get("Retry-After")
            delay = float(wait) if wait and wait.isdigit() else backoff * attempt
            log.warning("HTTP %s su %s, attendo %.0fs", r.status_code, url, delay)
            time.sleep(min(delay, 120))
            continue
        if r.status_code >= 400:
            raise FatalHTTPError(f"HTTP {r.status_code} su {url}")
        return r
    raise RuntimeError("unreachable")


def http_json(s: requests.Session, url: str, **kw: Any) -> Any:
    return http_get(s, url, **kw).json()


# ---------------------------------------------------------------- date

def month_key(d: date) -> str:
    return f"{d.year:04d}-{d.month:02d}"


def month_bounds(ym: str) -> tuple[date, date]:
    y, m = (int(x) for x in ym.split("-"))
    first = date(y, m, 1)
    nxt = date(y + (m == 12), 1 if m == 12 else m + 1, 1)
    return first, nxt - timedelta(days=1)


def complete_months(n: int, today: date) -> list[str]:
    """Gli ultimi n mesi interi, dal più vecchio al più recente (escluso il mese in corso)."""
    out: list[str] = []
    y, m = today.year, today.month
    for _ in range(n):
        m -= 1
        if m == 0:
            y, m = y - 1, 12
        out.append(f"{y:04d}-{m:02d}")
    return list(reversed(out))
