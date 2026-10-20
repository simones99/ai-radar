"""Eurostat isoc_eb_ain2: adozione, scopi e barriere per settore (NACE), Italia e UE, imprese con almeno 10 addetti."""
from __future__ import annotations

from .common import http_json, write_json
from .eurostat import decode_jsonstat

API = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/isoc_eb_ain2"
OUT = "eurostat_settori.json"
GEO = ["IT", "EU27_2020"]
IND_ADOZIONE = "E_AI_TANY"
UNIT_ADOZIONE = "PC_ENT"               # % delle imprese
UNIT_SCOPI = "PC_ENT_AI_TANY"          # % delle imprese che usano l'AI
UNIT_BARRIERE = "PC_ENT_AI_EC"         # % delle imprese che hanno considerato l'AI senza usarla
UNITS = [UNIT_ADOZIONE, UNIT_SCOPI, UNIT_BARRIERE]


def run(s, cfg: dict) -> dict:
    """Adozione, scopi e barriere per settore, Italia e UE, in una sola richiesta."""
    settori, scopi, barriere = cfg["settori"], cfg["scopi"], cfg["barriere"]
    indicatori = [IND_ADOZIONE, *scopi, *barriere]
    params = [("format", "JSON"), ("lang", "EN"), ("size_emp", "GE10")]
    params += [("geo", g) for g in GEO]
    params += [("nace_r2", x["nace"]) for x in settori]
    params += [("indic_is", i) for i in indicatori]
    params += [("unit", u) for u in UNITS]
    js = http_json(s, API, params=params)

    # Eurostat ha già cambiato i codici una volta: un codice sparito ferma il passo invece di dare tutti null
    for dim, wanted in (("nace_r2", [x["nace"] for x in settori]), ("indic_is", indicatori), ("geo", GEO), ("unit", UNITS)):
        missing = set(wanted) - set(js["dimension"][dim]["category"]["index"])
        if missing:
            raise ValueError(f"isoc_eb_ain2 senza {dim}: {', '.join(sorted(missing))}")

    cells = {(r["nace_r2"], r["indic_is"], r["unit"], r["geo"], r["time"]): r for r in decode_jsonstat(js, flags=True)}
    # solo gli anni con almeno un valore di adozione: un anno elencato ma vuoto (il 2022) non diventa una colonna di null
    years = sorted({t for (_, ind, unit, _, t), r in cells.items()
                    if ind == IND_ADOZIONE and unit == UNIT_ADOZIONE and r["value"] is not None})

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
        for g in GEO:
            for t in years:
                put("adozione", sid, g, t, nace, IND_ADOZIONE, UNIT_ADOZIONE, t)
            for c in scopi:
                put("scopi", sid, g, c, nace, c, UNIT_SCOPI, anno)
            for c in barriere:
                put("barriere", sid, g, c, nace, c, UNIT_BARRIERE, anno)

    write_json(OUT, {
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
