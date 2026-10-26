"""Gli anelli della catena dell'AI che non vengono da Epoch, dai file curati a mano in config/catena/: scrive catena.json.

I dati di ETO stanno in config/catena/eto.yaml, con la loro licenza CC BY-NC accanto (ADR 0001).
"""
from __future__ import annotations

from .common import load_yaml, write_json

OUT = "catena.json"
FILE = "catena/eto.yaml"


# gli anelli dei file curati; i data center e i modelli li scrive il passo geopoliticai
ANELLI = ("progettazione", "fabbricazione", "macchinari")
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


def _quota(v, chi: str, where: str) -> float:
    if not isinstance(v, (int, float)) or isinstance(v, bool) or not 0 <= v <= 100:
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


def validate(doc: dict) -> dict:
    out = {}
    for k, a in ((doc or {}).get("anelli") or {}).items():
        if k not in ANELLI:
            raise ValueError(f"{FILE}: anello sconosciuto: {k}")
        out[k] = _anello(a, f"{FILE}, {k}")
    return out


def run() -> dict:
    anelli = validate(load_yaml(FILE))
    if not anelli:
        raise ValueError(f"{FILE}: nessun anello")
    write_json(OUT, {"anelli": anelli})
    return {"anelli": len(anelli)}
