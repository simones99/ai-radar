"""Our World in Data: serie sull'AI (investimenti, adozione, uso, infrastruttura).

Si scaricano il CSV e i metadati di ogni grafico del grapher. OWID pubblica in
CC BY 4.0, ma i dati restano dei produttori originali: la pagina riporta sempre
la citazione e il link.
"""
from __future__ import annotations

import csv
import io

from .common import http_get, http_json, log, now_iso, read_json, write_json

BASE = "https://ourworldindata.org/grapher/"
OUT = "owid.json"
TIME_COLUMNS = ("year", "day", "month", "quarter")


def parse_csv(text: str, colonna: str, entita: list[str] | None) -> list[dict]:
    rows = list(csv.DictReader(io.StringIO(text)))
    if not rows:
        raise ValueError("CSV vuoto")
    cols = rows[0].keys()
    if colonna not in cols:
        raise ValueError(f"colonna {colonna!r} assente (colonne: {', '.join(cols)})")
    tcol = next((c for c in TIME_COLUMNS if c in cols), None)
    if tcol is None:
        raise ValueError("colonna del tempo assente")
    want = set(entita) if entita else None
    out = []
    for r in rows:
        if want is not None and r["entity"] not in want:
            continue
        v = r.get(colonna)
        if v in (None, ""):
            continue
        out.append({"entita": r["entity"], "t": r[tcol], "v": float(v)})
    if not out:
        raise ValueError("nessun valore per le entità richieste")
    out.sort(key=lambda p: (p["entita"], p["t"]))
    return out


def parse_meta(payload: dict, colonna: str) -> dict:
    cols = payload.get("columns", {}) if isinstance(payload, dict) else {}
    c = cols.get(colonna) or next(iter(cols.values()), {})
    return {
        "titolo": c.get("titleShort") or c.get("title") or "",
        "unita": c.get("unit") or "",
        "citazione": c.get("citationShort") or "",
        "aggiornato_owid": c.get("lastUpdated"),
    }


def run(s, series_cfg: list[dict]) -> dict:
    old = (read_json(OUT, {}) or {}).get("serie", {})
    serie, errori = {}, {}
    for cfg in series_cfg:
        sid, url = cfg["id"], BASE + cfg["slug"]
        try:
            text = http_get(s, url + ".csv", params={"v": 1, "csvType": "full", "useColumnShortNames": "true"}).text
            punti = parse_csv(text, cfg["colonna"], cfg.get("entita"))
        except Exception as exc:
            errori[sid] = str(exc)[:200]
            log.warning("OWID %s non aggiornata: %s", sid, exc)
            if sid in old:  # resta l'ultima copia buona
                serie[sid] = old[sid]
            continue
        try:
            meta = parse_meta(http_json(s, url + ".metadata.json", params={"v": 1}), cfg["colonna"])
        except Exception as exc:
            log.warning("OWID %s: metadati non disponibili (%s)", sid, exc)
            meta = parse_meta({}, cfg["colonna"])
        serie[sid] = {**meta, "url": url, "punti": punti}
    if len(errori) == len(series_cfg):
        raise ValueError(f"OWID: nessuna serie aggiornata: {errori}")
    write_json(OUT, {"aggiornato": now_iso(), "errori": errori, "serie": serie})
    return {"serie": len(series_cfg) - len(errori), "errori": len(errori)}
