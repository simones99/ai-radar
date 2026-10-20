"""Eurostat, imprese con almeno 10 addetti.

isoc_eb_ai: quota di imprese che usano almeno una tecnologia AI, per Paese.
isoc_eb_ain2: adozione, scopi e barriere per settore (NACE), Italia e UE.
"""
from __future__ import annotations

from itertools import product

from .common import http_json, write_json

API = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/isoc_eb_ai"
OUT = "eurostat.json"
FIXED = {"unit": "PC_ENT", "size_emp": "GE10", "indic_is": "E_AI_TANY"}


def _at(seq, flat: int):
    """Cella di value o status: JSON-stat le scrive come dizionario sparso o come lista."""
    if isinstance(seq, dict):
        return seq.get(str(flat))
    return seq[flat] if flat < len(seq) else None


def decode_jsonstat(js: dict, flags: bool = False) -> list[dict]:
    """Trasforma un dataset JSON-stat 2.0 in righe {dimensione: codice, ..., value}.

    Con flags=True ogni riga ha anche "flag" e restano le celle con un flag e senza numero
    (value None): Eurostat le lascia vuote quando il dato è riservato o poco affidabile.
    """
    ids, sizes = js["id"], js["size"]
    cats = []
    for dim in ids:
        index = js["dimension"][dim]["category"]["index"]
        if isinstance(index, list):
            ordered = index
        else:
            ordered = [code for code, _ in sorted(index.items(), key=lambda kv: kv[1])]
        cats.append(ordered)
    if [len(c) for c in cats] != sizes:
        raise ValueError("JSON-stat: dimensioni incoerenti")
    values, status = js.get("value", {}), js.get("status", {})
    rows = []
    for flat, combo in enumerate(product(*cats)):
        v = _at(values, flat)
        if not flags:
            if v is not None:
                rows.append({**dict(zip(ids, combo)), "value": v})
            continue
        f = _flag(_at(status, flat))
        if v is not None or f:
            rows.append({**dict(zip(ids, combo)), "value": v, "flag": f})
    return rows


def _flag(raw: str | None) -> str | None:
    """Flag Eurostat in minuscolo: «|C» (riservato) diventa «c», «u» (affidabilità bassa) resta «u»."""
    f = (raw or "").replace("|", "").strip().lower()
    return f or None


API_SETTORI = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/isoc_eb_ain2"
OUT_SETTORI = "eurostat_settori.json"
GEO_SETTORI = ["IT", "EU27_2020"]
ADOZIONE = ("E_AI_TANY", "PC_ENT")      # % delle imprese
UNIT_SCOPI = "PC_ENT_AI_TANY"          # % delle imprese che usano l'AI
UNIT_BARRIERE = "PC_ENT_AI_EC"         # % delle imprese che hanno considerato l'AI senza usarla


def run_settori(s, cfg: dict) -> dict:
    """Adozione, scopi e barriere per settore, Italia e UE, in una sola richiesta."""
    settori, scopi, barriere = cfg["settori"], cfg["scopi"], cfg["barriere"]
    params = [("format", "JSON"), ("lang", "EN"), ("size_emp", "GE10")]
    params += [("geo", g) for g in GEO_SETTORI]
    params += [("nace_r2", x["nace"]) for x in settori]
    params += [("indic_is", i) for i in [ADOZIONE[0], *scopi, *barriere]]
    params += [("unit", u) for u in (ADOZIONE[1], UNIT_SCOPI, UNIT_BARRIERE)]
    js = http_json(s, API_SETTORI, params=params)

    # Eurostat ha già cambiato i codici una volta: un codice sparito ferma il passo invece di dare tutti null
    for dim, wanted in (("nace_r2", [x["nace"] for x in settori]), ("indic_is", [ADOZIONE[0], *scopi, *barriere]),
                        ("geo", GEO_SETTORI)):
        missing = set(wanted) - set(js["dimension"][dim]["category"]["index"])
        if missing:
            raise ValueError(f"isoc_eb_ain2 senza {dim}: {', '.join(sorted(missing))}")

    cells = {(r["nace_r2"], r["indic_is"], r["unit"], r["geo"], r["time"]): r for r in decode_jsonstat(js, flags=True)}
    years = sorted(js["dimension"]["time"]["category"]["index"])  # solo gli anni rilevati: niente 2022

    # scopi e barriere: solo l'ultimo anno con valori
    anno = max((t for (_, ind, unit, _, t), r in cells.items() if r["value"] is not None
                and ((ind in scopi and unit == UNIT_SCOPI) or (ind in barriere and unit == UNIT_BARRIERE))), default=None)
    if anno is None:
        raise ValueError("Eurostat non ha restituito scopi né barriere")

    blocks = {"adozione": {}, "scopi": {}, "barriere": {}}
    flag = {k: {} for k in blocks}

    def put(block, sid, geo, key, nace, ind, unit, t):
        # senza numero è null, mai 0; il flag (u, c) va a parte, per dirlo in pagina
        r = cells.get((nace, ind, unit, geo, t)) or {}
        v = r.get("value")
        blocks[block].setdefault(sid, {}).setdefault(geo, {})[key] = None if v is None else round(float(v), 2)
        if r.get("flag"):
            flag[block].setdefault(sid, {}).setdefault(geo, {})[key] = r["flag"]

    for x in settori:
        sid, nace = x["id"], x["nace"]
        for g in GEO_SETTORI:
            for t in years:
                put("adozione", sid, g, t, nace, *ADOZIONE, t)
            for c in scopi:
                put("scopi", sid, g, c, nace, c, UNIT_SCOPI, anno)
            for c in barriere:
                put("barriere", sid, g, c, nace, c, UNIT_BARRIERE, anno)

    write_json(OUT_SETTORI, {
        "fonte": "Eurostat, isoc_eb_ain2",
        "url": "https://ec.europa.eu/eurostat/databrowser/view/isoc_eb_ain2/default/table",
        "aggiornato_eurostat": js.get("updated"),
        "anno": anno,
        "settori": [{k: x[k] for k in ("id", "nome", "nace", "nella_frase")} for x in settori],
        "nomi_scopi": dict(scopi),
        "nomi_barriere": dict(barriere),
        **blocks,
        "flag": flag,
    })
    return {"settori": len(settori), "anno": anno}


def run(s, geos: dict) -> dict:
    params = [("format", "JSON"), ("lang", "EN")] + list(FIXED.items()) + [("geo", g) for g in geos]
    js = http_json(s, API, params=params)
    rows = decode_jsonstat(js)
    series: dict[str, dict[str, float]] = {}
    for r in rows:
        series.setdefault(r["geo"], {})[r["time"]] = round(float(r["value"]), 2)
    if not series:
        raise ValueError("Eurostat non ha restituito valori")
    write_json(OUT, {
        "fonte": "Eurostat, isoc_eb_ai",
        "url": "https://ec.europa.eu/eurostat/databrowser/view/isoc_eb_ai/default/table",
        "indicatore": "Imprese con almeno 10 addetti che usano almeno una tecnologia AI (% delle imprese)",
        "aggiornato_eurostat": js.get("updated"),
        "nomi": geos,
        "serie": {g: dict(sorted(v.items())) for g, v in series.items()},
    })
    return {"paesi": len(series)}
