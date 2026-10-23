"""Epoch AI per GeopoliticAI: calcolo di addestramento e capacità per area e Paese UE (CC BY 4.0).

Regole del ticket 06 (.scratch/geopoliticai): un modello conta solo per il Paese della prima
organizzazione; Hong Kong e Macao vanno con la Cina, Taiwan con «Altri»; i modelli senza Paese
restano fuori dalle aree. Il calcolo viene dal dataset large-scale (almeno 1e23 FLOP, dal 2020),
la capacità dall'Epoch Capabilities Index su tutti i suoi modelli (dal 2023).
"""
from __future__ import annotations

import csv
import io
from collections import defaultdict
from datetime import date

from .common import http_get, log, write_json

LARGE = "https://epoch.ai/data/large_scale_ai_models.csv"
ECI = "https://epoch.ai/data/eci_scores.csv"
OUT = "geopoliticai.json"
DA_CALCOLO = 2020
DA_ECI = 2023
MIN_RIGHE = 100  # sotto questa soglia il file è troncato o le colonne sono cambiate
PAESE = "Country (of organization)"
COLONNE_LARGE = {"Model", "Organization", "Publication date", PAESE, "Training compute (FLOP)"}
COLONNE_ECI = {"Display name", "eci", "date", "Organization", PAESE}

# id: (nome, aggettivo per le frasi, nome con l'articolo)
AREE = {
    "usa": ("USA", "statunitense", "gli USA"),
    "cina": ("Cina", "cinese", "la Cina"),
    "ue": ("UE", "europeo", "l'UE"),
    "uk": ("Regno Unito", "britannico", "il Regno Unito"),
    "altri": ("Altri", None, "«Altri»"),
}
# nome di Epoch: (id, nome, aggettivo, nome con l'articolo, ADM0_A3)
PAESI_UE = {
    "Austria": ("austria", "Austria", "austriaco", "l'Austria", "AUT"),
    "Belgium": ("belgio", "Belgio", "belga", "il Belgio", "BEL"),
    "Bulgaria": ("bulgaria", "Bulgaria", "bulgaro", "la Bulgaria", "BGR"),
    "Croatia": ("croazia", "Croazia", "croato", "la Croazia", "HRV"),
    "Cyprus": ("cipro", "Cipro", "cipriota", "Cipro", "CYP"),
    "Czech Republic": ("cechia", "Cechia", "ceco", "la Cechia", "CZE"),
    "Czechia": ("cechia", "Cechia", "ceco", "la Cechia", "CZE"),
    "Denmark": ("danimarca", "Danimarca", "danese", "la Danimarca", "DNK"),
    "Estonia": ("estonia", "Estonia", "estone", "l'Estonia", "EST"),
    "Finland": ("finlandia", "Finlandia", "finlandese", "la Finlandia", "FIN"),
    "France": ("francia", "Francia", "francese", "la Francia", "FRA"),
    "Germany": ("germania", "Germania", "tedesco", "la Germania", "DEU"),
    "Greece": ("grecia", "Grecia", "greco", "la Grecia", "GRC"),
    "Hungary": ("ungheria", "Ungheria", "ungherese", "l'Ungheria", "HUN"),
    "Ireland": ("irlanda", "Irlanda", "irlandese", "l'Irlanda", "IRL"),
    "Italy": ("italia", "Italia", "italiano", "l'Italia", "ITA"),
    "Latvia": ("lettonia", "Lettonia", "lettone", "la Lettonia", "LVA"),
    "Lithuania": ("lituania", "Lituania", "lituano", "la Lituania", "LTU"),
    "Luxembourg": ("lussemburgo", "Lussemburgo", "lussemburghese", "il Lussemburgo", "LUX"),
    "Malta": ("malta", "Malta", "maltese", "Malta", "MLT"),
    "Netherlands": ("paesi-bassi", "Paesi Bassi", "olandese", "i Paesi Bassi", "NLD"),
    "Poland": ("polonia", "Polonia", "polacco", "la Polonia", "POL"),
    "Portugal": ("portogallo", "Portogallo", "portoghese", "il Portogallo", "PRT"),
    "Romania": ("romania", "Romania", "rumeno", "la Romania", "ROU"),
    "Slovakia": ("slovacchia", "Slovacchia", "slovacco", "la Slovacchia", "SVK"),
    "Slovenia": ("slovenia", "Slovenia", "sloveno", "la Slovenia", "SVN"),
    "Spain": ("spagna", "Spagna", "spagnolo", "la Spagna", "ESP"),
    "Sweden": ("svezia", "Svezia", "svedese", "la Svezia", "SWE"),
}
# Paesi fuori dall'UE che Epoch usa, con il codice ADM0_A3 della mappa. Un nome che manca va nel log.
PAESI_FUORI_UE = {
    "United States of America": "USA", "United States": "USA", "China": "CHN", "Hong Kong": "HKG", "Macao": "MAC", "Macau": "MAC",
    "Taiwan": "TWN", "United Kingdom": "GBR", "United Kingdom of Great Britain and Northern Ireland": "GBR",
    "South Korea": "KOR", "Korea (Republic of)": "KOR", "Japan": "JPN", "Canada": "CAN", "United Arab Emirates": "ARE",
    "Switzerland": "CHE", "Russia": "RUS", "Israel": "ISR", "Ukraine": "UKR", "Singapore": "SGP", "Saudi Arabia": "SAU",
    "Australia": "AUS", "India": "IND", "Norway": "NOR", "Turkey": "TUR", "Brazil": "BRA", "Vietnam": "VNM",
    "Indonesia": "IDN", "Iceland": "ISL", "Qatar": "QAT", "Kazakhstan": "KAZ", "Thailand": "THA", "Malaysia": "MYS",
    "Egypt": "EGY", "Iran": "IRN", "Chile": "CHL", "Mexico": "MEX", "Argentina": "ARG", "New Zealand": "NZL",
    "South Africa": "ZAF", "Nigeria": "NGA", "Kenya": "KEN", "Serbia": "SRB", "Pakistan": "PAK", "Philippines": "PHL",
}
CINA = {"China", "Hong Kong", "Macao", "Macau"}


def _num(v: str) -> float | None:
    try:
        x = float(str(v).replace(",", ""))
        return x if x > 0 else None
    except (TypeError, ValueError):
        return None


def _anno(v: str) -> int | None:
    v = (v or "").strip()
    return int(v[:4]) if v[:4].isdigit() else None


def primo_paese(campo: str) -> str | None:
    """Il Paese della prima organizzazione; None per i modelli senza Paese o «Multinational»."""
    c = (campo or "").split(",")[0].strip()
    return None if not c or c == "Multinational" else c


def zone_di(paese: str) -> tuple[str, str | None]:
    """(area, id del Paese UE o None). Un nome sconosciuto finisce in «Altri», con un avviso nel log."""
    if paese in PAESI_UE:
        return "ue", PAESI_UE[paese][0]
    if paese not in PAESI_FUORI_UE:
        log.warning("GeopoliticAI: Paese di Epoch sconosciuto, conta in «Altri»: %s", paese)
        return "altri", None
    if PAESI_FUORI_UE[paese] == "USA":
        return "usa", None
    if paese in CINA:
        return "cina", None
    if PAESI_FUORI_UE[paese] == "GBR":
        return "uk", None
    return "altri", None


def _leggi(text: str, colonne: set[str], nome: str) -> list[dict]:
    righe = list(csv.DictReader(io.StringIO(text.lstrip("﻿"))))
    mancano = colonne - set(righe[0] if righe else {})
    if mancano:
        raise ValueError(f"GeopoliticAI: in {nome} mancano le colonne {sorted(mancano)}")
    if len(righe) < MIN_RIGHE:
        raise ValueError(f"GeopoliticAI: solo {len(righe)} righe in {nome}, file troncato?")
    return righe


def aggregate(large: list[dict], eci: list[dict], today: date) -> dict:
    zone: dict[str, dict] = defaultdict(lambda: {"calcolo": {}, "eci": {}, "org_eci": set(), "org_ls": set()})
    senza = {"large": [], "eci": []}
    altri_paesi: dict[str, int] = defaultdict(int)
    altrove: dict[str, int] = defaultdict(int)

    for r in large:
        y = _anno(r["Publication date"])
        if not y or y < DA_CALCOLO:
            continue
        paese = primo_paese(r[PAESE])
        area, ue = zone_di(paese) if paese else (None, None)
        # un'organizzazione di un Paese UE che non è la prima: il modello conta altrove (o, senza Paese, da nessuna parte)
        presenti = {PAESI_UE[p.strip()][0] for p in r[PAESE].split(",") if p.strip() in PAESI_UE}
        for pid in presenti - {ue}:
            altrove[pid] += 1
        if presenti and area != "ue":
            altrove["ue"] += 1
        if not paese:
            senza["large"].append(r["Model"].strip())
            continue
        if area == "altri":
            altri_paesi[paese] += 1
        org = r["Organization"].split(",")[0].strip()
        flop = _num(r["Training compute (FLOP)"])  # vuoto per i modelli «possibly over 1e23»
        for k in [area] + ([ue] if ue else []):
            c = zone[k]["calcolo"].setdefault(str(y), {"n": 0, "nc": 0, "max": None, "modello": None})
            c["n"] += 1
            zone[k]["org_ls"].add(org)
            if flop:
                c["nc"] += 1
                if c["max"] is None or flop > c["max"]:
                    c["max"], c["modello"] = flop, r["Model"].strip()

    for r in eci:
        y = _anno(r["date"])
        v = _num(r["eci"])
        if not y or y < DA_ECI or v is None:
            continue
        nome = r["Display name"].strip()
        paese = primo_paese(r[PAESE])
        if not paese:
            senza["eci"].append(nome)
            continue
        area, ue = zone_di(paese)
        for k in [area] + ([ue] if ue else []):
            e = zone[k]["eci"].setdefault(str(y), {"n": 0, "max": None, "modello": None})
            e["n"] += 1
            zone[k]["org_eci"].add(r["Organization"].split(",")[0].strip())
            if e["max"] is None or v > e["max"]:
                e["max"], e["modello"] = round(v, 2), nome

    def zona(k: str, nome: str, tipo: str, aggettivo: str | None, articolo: str) -> dict:
        z = zone[k]
        return {"nome": nome, "tipo": tipo, "aggettivo": aggettivo, "con_articolo": articolo,
                "calcolo": dict(sorted(z["calcolo"].items())), "eci": dict(sorted(z["eci"].items())),
                "org_eci": sorted(z["org_eci"]), "org_ls": sorted(z["org_ls"]), "contano_altrove": altrove[k]}

    out: dict[str, dict] = {}
    for k, (nome, agg, art) in AREE.items():
        out[k] = zona(k, nome, "area", agg, art)
    # i Paesi UE con almeno un modello, più l'Italia sempre
    paesi = {v[0]: v for v in PAESI_UE.values()}
    for pid, (_, nome, agg, art, _) in sorted(paesi.items(), key=lambda kv: kv[1][1]):
        if pid in zone or pid == "italia":
            out[pid] = zona(pid, nome, "paese-ue", agg, art)

    return {
        "fonte": "Epoch AI",
        "licenza": "CC BY 4.0",
        "url_modelli": "https://epoch.ai/data/ai-models",
        "url_eci": "https://epoch.ai/eci",
        "scaricato": today.isoformat(),
        "anno_corrente": today.year,
        "zone": out,
        "senza_paese": senza,
        "altri_paesi": dict(sorted(altri_paesi.items(), key=lambda kv: (-kv[1], kv[0]))),
    }


def run(s, today: date) -> dict:
    large = _leggi(http_get(s, LARGE, timeout=120).text, COLONNE_LARGE, "large_scale_ai_models.csv")
    eci = _leggi(http_get(s, ECI, timeout=120).text, COLONNE_ECI, "eci_scores.csv")
    out = aggregate(large, eci, today)
    write_json(OUT, out)
    return {"zone": len(out["zone"]), "modelli_large": len(large), "modelli_eci": len(eci)}
