"""Gli anelli della catena dell'AI che non vengono da Epoch, dai file curati a mano in config/catena/: scrive catena.json.

I dati di ETO stanno in config/catena/eto.yaml, con la loro licenza CC BY-NC accanto (ADR 0001).
Le materie prime stanno in config/catena/materie.yaml: USGS e studio UE, un insieme di quote per materiale.
Gli esempi del Filo della catena stanno in config/catena/filo.yaml: sei tappe, una per anello, nell'ordine delle fermate.
"""
from __future__ import annotations

import re

from .common import load_yaml, write_json

OUT = "catena.json"
FILES = ("catena/eto.yaml", "catena/materie.yaml", "catena/filo.yaml")


# gli anelli dei file curati; i data center e i modelli li scrive il passo geopoliticai
ANELLI = ("materie", "progettazione", "fabbricazione", "macchinari")
# le sei fermate della linea, nell'ordine della catena: un filo ha una tappa per ognuna
FERMATE = ("materie", "progettazione", "fabbricazione", "macchinari", "datacenter", "modelli")
# gli esempi del filo, nell'ordine del selettore
FILI = ("usa", "ue", "cina")
# i materiali delle materie prime, nell'ordine del selettore
MATERIALI = ("gallio", "terre", "silicio", "germanio")
# le quote di ETO sono arrotondate: la litografia somma a 100,1. Un errore di battitura si vede lo stesso.
ARROTONDAMENTO = 0.5


def _testo(a: dict, k: str, where: str) -> str:
    v = str(a.get(k) or "").strip()
    if not v:
        raise ValueError(f"{where}: {k} mancante")
    return v


def _https(a: dict, k: str, where: str) -> str:
    v = _testo(a, k, where)
    if not v.startswith("https://"):
        raise ValueError(f"{where}: {k} deve iniziare con https://")
    return v


def _numero(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _quota(v, chi: str, where: str) -> float:
    if not _numero(v) or not 0 <= v <= 100:
        raise ValueError(f"{where}, {chi}: quota fuori da 0-100: {v!r}")
    return v


def _anello(a: dict, where: str) -> dict:
    quote = {iso: _quota(v, iso, where) for iso, v in (a.get("quote") or {}).items()}
    europa = a.get("europa")
    if europa is not None:
        _quota(europa, "europa", where)
    if sum(quote.values()) + (europa or 0) > 100 + ARROTONDAMENTO:
        raise ValueError(f"{where}: somma delle quote sopra 100")
    return {
        "misura": _testo(a, "misura", where), "fonte": _testo(a, "fonte", where), "titolo": _testo(a, "titolo", where), "url": _https(a, "url", where),
        "licenza": _testo(a, "licenza", where), "url_licenza": _https(a, "url_licenza", where),
        "data": _testo(a, "data", where), "quote": quote, "europa": europa,
        **({"nota": a["nota"].strip()} if a.get("nota") else {}),
    }


def _materie(a: dict, where: str) -> dict:
    materiali = (a or {}).get("materiali") or {}
    if not materiali:
        raise ValueError(f"{where}: nessun materiale")
    out = {}
    for m, x in materiali.items():
        if m not in MATERIALI:
            raise ValueError(f"{where}: materiale sconosciuto: {m}")
        out[m] = {"nome": _testo(x, "nome", f"{where}, {m}"), **_anello(x, f"{where}, {m}")}
    return {"materiali": {m: out[m] for m in MATERIALI if m in out}}


def validate(doc: dict, file: str = "catena") -> dict:
    out = {}
    for k, a in ((doc or {}).get("anelli") or {}).items():
        if k not in ANELLI:
            raise ValueError(f"{file}: anello sconosciuto: {k}")
        out[k] = _materie(a, f"{file}, {k}") if k == "materie" else _anello(a, f"{file}, {k}")
    return out


def _tappa(t: dict, where: str) -> dict:
    iso = str(t.get("iso") or "")
    if not re.fullmatch(r"[A-Z]{3}", iso):
        raise ValueError(f"{where}: iso non è un codice ADM0_A3: {iso!r}")
    lat, lon = t.get("lat"), t.get("lon")
    if not (_numero(lat) and _numero(lon)) or not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise ValueError(f"{where}: coordinate fuori scala: {lat!r}, {lon!r}")
    return {"anello": t["anello"], "luogo": _testo(t, "luogo", where), "iso": iso, "lat": lat, "lon": lon,
            "frase": _testo(t, "frase", where), "fonte": _https(t, "fonte", where)}


def _filo(f: dict, where: str) -> dict:
    tappe = (f or {}).get("tappe") or []
    if len(tappe) != len(FERMATE):
        raise ValueError(f"{where}: servono sei tappe, una per anello, e ce ne sono {len(tappe)}")
    for i, (t, a) in enumerate(zip(tappe, FERMATE), 1):
        if t.get("anello") != a:
            raise ValueError(f"{where}, tappa {i}: serve l'anello {a}, non {t.get('anello')}")
    return {"nome": _testo(f, "nome", where), "tappe": [_tappa(t, f"{where}, tappa {i}") for i, t in enumerate(tappe, 1)]}


def validate_fili(doc: dict, file: str = "catena") -> dict:
    out = {}
    for k, f in ((doc or {}).get("fili") or {}).items():
        if k not in FILI:
            raise ValueError(f"{file}: esempio sconosciuto: {k}")
        out[k] = _filo(f, f"{file}, {k}")
    return out


def run() -> dict:
    anelli, fili = {}, {}
    for f in FILES:
        doc = load_yaml(f)
        anelli |= validate(doc, f)
        fili |= validate_fili(doc, f)
    if not anelli:
        raise ValueError("catena: nessun anello")
    write_json(OUT, {"anelli": {k: anelli[k] for k in ANELLI if k in anelli}, "fili": {k: fili[k] for k in FILI if k in fili}})
    return {"anelli": len(anelli), "fili": len(fili)}
