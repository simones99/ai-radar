"""Epoch AI per GeopoliticAI: calcolo di addestramento e capacità per area e Paese UE (CC BY 4.0).

Regole del ticket 06 (.scratch/geopoliticai): un modello conta solo per il Paese della prima
organizzazione; Hong Kong e Macao vanno con la Cina, Taiwan con «Altri»; i modelli senza Paese
restano fuori dalle aree. Il calcolo viene dal dataset large-scale (almeno 1e23 FLOP, dal 2020),
la capacità dall'Epoch Capabilities Index su tutti i suoi modelli (dal 2023). Per l'anello dei modelli
sulla mappa c'è anche l'ECI massimo per Paese dell'ultimo anno chiuso, con i codici ADM0_A3 dei confini.
Per la card dei modelli, l'ECI di ogni modello dal 2023 con il suo intervallo e i record di capacità.
Per l'anello dei data center, dal database «AI data centers» di Epoch: i siti e la quota per Paese dei loro
H100 equivalenti attuali. Le posizioni dei siti vengono dalla pagina della mappa di Epoch e restano in una copia tra
i dati; un sito che non c'è né nella pagina né nella copia si cerca una volta sola dal suo indirizzo, con Nominatim.
"""
from __future__ import annotations

import csv
import html
import io
import json
import re
import time
from collections import defaultdict
from datetime import date

from .common import http_get, log, read_json, redact, write_json

LARGE = "https://epoch.ai/data/large_scale_ai_models.csv"
ECI = "https://epoch.ai/data/eci_scores.csv"
DATA_CENTER = "https://epoch.ai/data/data_centers/data_centers.csv"
MAPPA = "https://epoch.ai/data/ai-data-centers/map"
NOMINATIM = "https://nominatim.openstreetmap.org/search"
# la policy di Nominatim vuole uno User-Agent che dica chi fa le richieste
UA_NOMINATIM = "ai-radar/1.0 (AI Radar, https://github.com/simones99/ai-radar)"
OUT = "geopoliticai.json"
COPIA = "geopoliticai_siti.json"  # le posizioni dei siti: l'ultima copia buona
DA_CALCOLO = 2020
DA_ECI = 2023
MIN_RIGHE = 100  # sotto questa soglia il file è troncato o le colonne sono cambiate
MIN_SITI = 20  # i data center sono meno: 95 a ottobre 2026
PAESE = "Country (of organization)"
COLONNE_LARGE = {"Model", "Organization", "Publication date", PAESE, "Training compute (FLOP)"}
COLONNE_ECI = {"Display name", "eci", "eci_ci_low", "eci_ci_high", "date", "Organization", PAESE}
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
    punti_eci: list[dict] = []

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
        punti_eci.append({"m": nome, "d": r["date"].strip()[:10], "v": round(v, 2),
                          "lo": _num(r["eci_ci_low"]), "hi": _num(r["eci_ci_high"])})
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

    # un record di capacità supera l'ECI di tutti i modelli usciti prima; lo stesso giorno conta solo il più alto
    massimo = None
    for p in sorted(punti_eci, key=lambda p: (p["d"], -p["v"])):
        p["r"] = massimo is None or p["v"] > massimo
        massimo = p["v"] if p["r"] else massimo
    punti_eci.sort(key=lambda p: p["d"])

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
        "punti_eci": punti_eci,
        "eci_paesi": {"anno": chiuso, "valori": dict(sorted(eci_paesi.items(), key=lambda kv: -kv[1]["max"]))},
    }


def data_center(righe: list[dict], today: date, pos: dict[str, dict]) -> dict:
    """I siti, con lo stato ricavato dagli H100 equivalenti attuali e la posizione, e la quota per Paese sul totale dei siti noti.

    Un sito senza posizione resta senza cerchio sulla mappa, ma conta nella quota del suo Paese.
    """
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
        p = pos.get(r["Name"].strip()) or {"lat": None}
        siti.append({"nome": r["Name"].strip(), "proprietario": proprietario, "iso": iso, "h100e": round(h100e),
                     "mw": round(float(r[MW] or 0), 1), "stato": "operativo" if h100e > 0 else "in costruzione",
                     "lat": p["lat"], "lon": p.get("lon"), "posizione": p.get("posizione") if p["lat"] is not None else None})
    totale = sum(float(r[H100E] or 0) for r in righe) or 1
    quote = {iso: round(100 * v / totale, 2) for iso, v in sorted(per_paese.items(), key=lambda kv: -kv[1])}
    return {"aggiornato": today.isoformat(), "quote": quote, "siti": siti}


def _astro(v):
    """Un valore dei props di un'isola di Astro: [0, valore] per i valori semplici e gli oggetti, [1, lista] per le liste,
    [0] da solo per un valore vuoto."""
    if len(v) == 1:
        return None
    tipo, x = v
    if tipo == 1:
        return [_astro(y) for y in x]
    return {k: _astro(y) for k, y in x.items()} if isinstance(x, dict) else x


def coordinate_mappa(text: str) -> dict[str, tuple[float, float]]:
    """Nome del sito → (lat, lon), dal campo `lngLat` dei siti nell'isola SearchFilterMap della pagina della mappa.

    Il formato è interno ad Astro e non è documentato: una pagina che non ha questa forma solleva un errore.
    """
    isola = next((i for i in re.findall(r"<astro-island\b[^>]*>", text) if "SearchFilterMap" in i), None)
    if isola is None:
        raise ValueError("manca l'isola SearchFilterMap")
    props = json.loads(html.unescape(re.search(r'\sprops="([^"]*)"', isola).group(1)))
    out = {}
    for _, sito in props["dataCenters"][1]:  # di ogni sito si decodificano solo il nome e le coordinate
        lng_lat = _astro(sito["lngLat"]) if "lngLat" in sito else None
        if lng_lat:
            out[_astro(sito["id"]).strip()] = (round(lng_lat[1], 5), round(lng_lat[0], 5))
    return out


def posizioni(s, righe: list[dict], today: date) -> tuple[dict, str | None, int]:
    """La copia delle posizioni dei siti, l'avviso se la pagina della mappa non si è letta, e le richieste fatte a Nominatim.

    Le coordinate vengono dalla pagina della mappa. Se la pagina non si legge, o le ha per meno della metà dei siti,
    restano quelle della copia e il passo non fallisce. Un sito che non c'è né nella pagina né nella copia si cerca dal
    suo indirizzo, una volta sola: anche un indirizzo non trovato resta nella copia, e non si richiede più. Un indirizzo
    che cambia è una richiesta nuova. La data della copia è quella dell'ultima lettura buona della pagina.
    """
    copia = read_json(COPIA) or {}
    prima = copia.get("siti", {})
    nomi = [r["Name"].strip() for r in righe]
    if righe and "Address" not in righe[0]:
        log.warning("GeopoliticAI: il CSV dei data center non ha più la colonna Address, i siti nuovi restano senza posizione")
    avviso = None
    try:
        mappa = coordinate_mappa(http_get(s, MAPPA, timeout=120).text)
    except Exception as exc:  # una pagina fuori forma o una rete che non risponde: si tiene la copia
        mappa, avviso = {}, f"pagina della mappa di Epoch non letta ({redact(str(exc))[:150]}): restano le posizioni salvate"
    else:
        trovati = sum(n in mappa for n in nomi)
        if 2 * trovati < len(nomi):
            mappa, avviso = {}, f"la pagina della mappa di Epoch ha le coordinate di {trovati} siti su {len(nomi)}: restano le posizioni salvate"
    if avviso:
        log.warning("GeopoliticAI: %s", avviso)

    out, richieste, ultima = {}, 0, None
    for r in righe:
        nome, indirizzo = r["Name"].strip(), (r.get("Address") or "").strip()
        vecchia = prima.get(nome)
        if nome in mappa:
            lat, lon = mappa[nome]
            out[nome] = {"lat": lat, "lon": lon, "posizione": "epoch"}
        elif vecchia and (vecchia["posizione"] == "epoch" or vecchia.get("indirizzo") == indirizzo):
            out[nome] = vecchia
        elif indirizzo:
            # Nominatim: al massimo una richiesta al secondo, una dopo l'altra
            if ultima is not None:
                time.sleep(max(0.0, 1.0 - (time.monotonic() - ultima)))
            richieste += 1
            try:
                luoghi = http_get(s, NOMINATIM, params={"q": indirizzo, "format": "jsonv2", "limit": 1},
                                  headers={"User-Agent": UA_NOMINATIM}, timeout=30, retries=1).json()
            except Exception as exc:  # si riprova al prossimo giro
                log.warning("GeopoliticAI: Nominatim non ha risposto per %s (%s)", nome, redact(str(exc)))
                continue
            finally:
                ultima = time.monotonic()
            lat, lon = (round(float(luoghi[0]["lat"]), 5), round(float(luoghi[0]["lon"]), 5)) if luoghi else (None, None)
            if lat is None:
                log.warning("GeopoliticAI: Nominatim non trova l'indirizzo di %s, resta senza posizione", nome)
            out[nome] = {"lat": lat, "lon": lon, "posizione": "indirizzo", "indirizzo": indirizzo}
    aggiornato = copia.get("aggiornato") if avviso else today.isoformat()
    return {"aggiornato": aggiornato, "siti": out}, avviso, richieste


def run(s, today: date) -> dict:
    large = _leggi(http_get(s, LARGE, timeout=120).text, COLONNE_LARGE, "large_scale_ai_models.csv")
    eci = _leggi(http_get(s, ECI, timeout=120).text, COLONNE_ECI, "eci_scores.csv")
    dc = _leggi(http_get(s, DATA_CENTER, timeout=120).text, COLONNE_DC, "data_centers.csv", MIN_SITI)
    copia, avviso, richieste = posizioni(s, dc, today)
    out = {**aggregate(large, eci, today), "data_center": data_center(dc, today, copia["siti"])}
    write_json(OUT, out)
    write_json(COPIA, copia)
    info = {"zone": len(out["zone"]), "modelli_large": len(large), "modelli_eci": len(eci), "data_center": len(dc),
            "siti_con_posizione": sum(x["lat"] is not None for x in out["data_center"]["siti"]), "richieste_nominatim": richieste}
    return {**info, "avviso": avviso} if avviso else info
