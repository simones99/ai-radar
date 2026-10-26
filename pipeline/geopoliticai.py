"""Epoch AI per GeopoliticAI: calcolo di addestramento e capacità per area e Paese UE (CC BY 4.0).

Regole del ticket 06 (.scratch/geopoliticai): un modello conta solo per il Paese della prima
organizzazione; Hong Kong e Macao vanno con la Cina, Taiwan con «Altri»; i modelli senza Paese
restano fuori dalle aree. Il calcolo viene dal dataset large-scale (almeno 1e23 FLOP, dal 2020),
la capacità dall'Epoch Capabilities Index su tutti i suoi modelli (dal 2023). Per l'anello dei modelli
sulla mappa c'è anche l'ECI massimo per Paese dell'ultimo anno chiuso, con i codici ADM0_A3 dei confini.
Per l'anello dei data center, dal database «AI data centers» di Epoch: i siti e la quota per Paese dei loro
H100 equivalenti attuali.
"""
from __future__ import annotations

import csv
import io
import re
from collections import defaultdict
from datetime import date

from .common import http_get, log, write_json

LARGE = "https://epoch.ai/data/large_scale_ai_models.csv"
ECI = "https://epoch.ai/data/eci_scores.csv"
DATA_CENTER = "https://epoch.ai/data/data_centers/data_centers.csv"
OUT = "geopoliticai.json"
DA_CALCOLO = 2020
DA_ECI = 2023
MIN_RIGHE = 100  # sotto questa soglia il file è troncato o le colonne sono cambiate
MIN_SITI = 20  # i data center sono meno: 95 a ottobre 2026
PAESE = "Country (of organization)"
COLONNE_LARGE = {"Model", "Organization", "Publication date", PAESE, "Training compute (FLOP)"}
COLONNE_ECI = {"Display name", "eci", "date", "Organization", PAESE}
H100E, MW = "Current H100 equivalents", "Current power (MW)"
COLONNE_DC = {"Name", H100E, MW, "Owner", "Country"}

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


def codice_mappa(paese: str) -> str | None:
    """Il codice ADM0_A3 della mappa, con Hong Kong e Macao nella Cina; None per un nome sconosciuto."""
    if paese in CINA:
        return "CHN"
    return PAESI_UE[paese][4] if paese in PAESI_UE else PAESI_FUORI_UE.get(paese)


def _leggi(text: str, colonne: set[str], nome: str, minimo: int = MIN_RIGHE) -> list[dict]:
    righe = list(csv.DictReader(io.StringIO(text.lstrip("﻿"))))
    mancano = colonne - set(righe[0] if righe else {})
    if mancano:
        raise ValueError(f"GeopoliticAI: in {nome} mancano le colonne {sorted(mancano)}")
    if len(righe) < minimo:
        raise ValueError(f"GeopoliticAI: solo {len(righe)} righe in {nome}, file troncato?")
    return righe


def aggregate(large: list[dict], eci: list[dict], today: date) -> dict:
    zone: dict[str, dict] = defaultdict(lambda: {"calcolo": {}, "eci": {}, "org_eci": set(), "org_ls": set()})
    senza = {"large": [], "eci": []}
    altri_paesi: dict[str, int] = defaultdict(int)
    altrove: dict[str, int] = defaultdict(int)
    chiuso = today.year - 1  # l'anello dei modelli sulla mappa guarda l'ultimo anno chiuso
    eci_paesi: dict[str, dict] = {}

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
        iso = codice_mappa(paese)
        if y == chiuso and iso and (iso not in eci_paesi or v > eci_paesi[iso]["max"]):
            eci_paesi[iso] = {"max": round(v, 2), "modello": nome}
        for k in [area] + ([ue] if ue else []):
            e = zone[k]["eci"].setdefault(str(y), {"n": 0, "max": None, "modello": None})
            e["n"] += 1
            zone[k]["org_eci"].add(r["Organization"].split(",")[0].strip())
            if e["max"] is None or v > e["max"]:
                e["max"], e["modello"] = round(v, 2), nome

    def zona(k: str, nome: str, tipo: str, aggettivo: str | None, articolo: str, mappa: list[str]) -> dict:
        z = zone[k]
        return {"nome": nome, "tipo": tipo, "aggettivo": aggettivo, "con_articolo": articolo,
                "calcolo": dict(sorted(z["calcolo"].items())), "eci": dict(sorted(z["eci"].items())),
                "org_eci": sorted(z["org_eci"]), "org_ls": sorted(z["org_ls"]), "contano_altrove": altrove[k],
                "paesi_mappa": mappa}

    paesi = {v[0]: v for v in PAESI_UE.values()}
    # i Paesi della mappa di ogni area; «Altri» è tutto il resto e resta vuota
    mappa_aree = {"usa": ["USA"], "cina": ["CHN"], "ue": sorted(v[4] for v in paesi.values()), "uk": ["GBR"], "altri": []}
    out: dict[str, dict] = {}
    for k, (nome, agg, art) in AREE.items():
        out[k] = zona(k, nome, "area", agg, art, mappa_aree[k])
    # i Paesi UE con almeno un modello, più l'Italia sempre
    for pid, (_, nome, agg, art, iso) in sorted(paesi.items(), key=lambda kv: kv[1][1]):
        if pid in zone or pid == "italia":
            out[pid] = zona(pid, nome, "paese-ue", agg, art, [iso])

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
        "eci_paesi": {"anno": chiuso, "valori": dict(sorted(eci_paesi.items(), key=lambda kv: -kv[1]["max"]))},
    }


def data_center(righe: list[dict], today: date) -> dict:
    """I siti, con lo stato ricavato dagli H100 equivalenti attuali, e la quota per Paese sul totale dei siti noti."""
    siti, per_paese = [], defaultdict(float)
    for r in righe:
        paese = r["Country"].strip()
        iso = codice_mappa(paese)
        if not iso:
            log.warning("GeopoliticAI: Paese di un data center sconosciuto, resta fuori dalle quote: %s", paese)
        h100e = float(r[H100E] or 0)
        if iso and h100e > 0:
            per_paese[iso] += h100e
        # il proprietario dei chip, senza l'etichetta di confidenza di Epoch («#confident», «#likely», «#speculative»)
        proprietario = re.sub(r"\s*#\w+", "", r["Owner"]).strip() or None
        siti.append({"nome": r["Name"].strip(), "proprietario": proprietario, "iso": iso, "h100e": round(h100e),
                     "mw": round(float(r[MW] or 0), 1), "stato": "operativo" if h100e > 0 else "in costruzione"})
    totale = sum(float(r[H100E] or 0) for r in righe) or 1
    quote = {iso: round(100 * v / totale, 2) for iso, v in sorted(per_paese.items(), key=lambda kv: -kv[1])}
    return {"aggiornato": today.isoformat(), "quote": quote, "siti": siti}


def run(s, today: date) -> dict:
    large = _leggi(http_get(s, LARGE, timeout=120).text, COLONNE_LARGE, "large_scale_ai_models.csv")
    eci = _leggi(http_get(s, ECI, timeout=120).text, COLONNE_ECI, "eci_scores.csv")
    dc = _leggi(http_get(s, DATA_CENTER, timeout=120).text, COLONNE_DC, "data_centers.csv", MIN_SITI)
    out = {**aggregate(large, eci, today), "data_center": data_center(dc, today)}
    write_json(OUT, out)
    return {"zone": len(out["zone"]), "modelli_large": len(large), "modelli_eci": len(eci), "data_center": len(dc)}
