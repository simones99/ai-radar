"""File scritti a mano (scadenze dell'AI Act e rapporti periodici) e file generati una volta (i confini della mappa)."""
from __future__ import annotations

import importlib.util
import json
import re
from datetime import date
from pathlib import Path

import pytest

from pipeline import ai_act, rapporti

GOOD_ACT = {"scadenze": [
    {"data": date(2026, 12, 2), "titolo": "B", "descrizione": "d", "fonte": "https://eur-lex.europa.eu/x"},
    {"data": "2025-02-02", "titolo": "A", "descrizione": "d", "fonte": "https://eur-lex.europa.eu/y"},
]}


def test_ai_act_valid_and_sorted():
    out = ai_act.validate(GOOD_ACT)
    assert [x["data"] for x in out] == ["2025-02-02", "2026-12-02"]
    assert out[0] == {"data": "2025-02-02", "titolo": "A", "descrizione": "d", "fonte": "https://eur-lex.europa.eu/y"}


@pytest.mark.parametrize("patch, msg", [
    ({"data": "2026-13-01"}, "data"),
    ({"titolo": "  "}, "titolo"),
    ({"fonte": "http://non-sicuro.example"}, "fonte"),
])
def test_ai_act_rejects_bad_items(patch, msg):
    item = {"data": "2026-01-01", "titolo": "T", "descrizione": "d", "fonte": "https://x.example", **patch}
    with pytest.raises(ValueError, match=msg):
        ai_act.validate({"scadenze": [item]})


def test_ai_act_rejects_empty():
    with pytest.raises(ValueError, match="scadenze"):
        ai_act.validate({})


GOOD_REP = {"rapporti": [{
    "nome": "AI Index Report", "editore": "Stanford HAI", "url": "https://hai.stanford.edu/ai-index",
    "cadenza": "annuale", "prossima_prevista": "2027-04",
    "edizioni": [{"anno": 2026, "data": "2026-04", "url": "https://hai.stanford.edu/ai-index"},
                 {"anno": 2025, "data": "2025-04", "url": "https://hai.stanford.edu/ai-index"}],
}]}


def test_rapporti_valid_editions_sorted():
    out = rapporti.validate(GOOD_REP)
    assert [e["data"] for e in out[0]["edizioni"]] == ["2025-04", "2026-04"]
    assert out[0]["prossima_prevista"] == "2027-04"


@pytest.mark.parametrize("patch, msg", [
    ({"url": "ftp://x"}, "url"),
    ({"prossima_prevista": "aprile"}, "prossima_prevista"),
    ({"edizioni": [{"anno": "duemila", "data": "2026-04", "url": "https://x.example"}]}, "anno"),
    ({"edizioni": [{"anno": 2026, "data": "2026-4", "url": "https://x.example"}]}, "data"),
])
def test_rapporti_rejects_bad_fields(patch, msg):
    doc = {"rapporti": [{**GOOD_REP["rapporti"][0], **patch}]}
    with pytest.raises(ValueError, match=msg):
        rapporti.validate(doc)


def test_rapporti_allows_no_next_edition():
    doc = {"rapporti": [{**GOOD_REP["rapporti"][0], "prossima_prevista": None}]}
    assert rapporti.validate(doc)[0]["prossima_prevista"] is None


def test_shipped_files_are_valid(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    assert ai_act.run()["scadenze"] >= 5
    assert rapporti.run()["rapporti"] >= 4
    assert json.loads((tmp_path / "ai_act.json").read_text())["scadenze"]
    assert json.loads((tmp_path / "rapporti.json").read_text())["rapporti"]


# ---- i confini della mappa di GeopoliticAI, generati una volta da scripts/confini.py ----

ROOT = Path(__file__).resolve().parents[1]
CONFINI = json.loads((ROOT / "web" / "src" / "lib" / "geo" / "confini.json").read_text(encoding="utf-8"))
_spec = importlib.util.spec_from_file_location("confini", ROOT / "scripts" / "confini.py")
confini = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(confini)
PAESI = {p["id"]: p for p in CONFINI["paesi"]}


def dentro(iso: str, lon: float, lat: float) -> bool:
    """Il punto sta nel percorso del Paese, con la regola pari-dispari su tutti i suoi anelli."""
    x, y = confini.proj(lon, lat)
    n = False
    for parte in PAESI[iso]["d"].strip("Z").split("Z"):
        pts = [tuple(map(float, v.split(","))) for v in parte.lstrip("M").split("L")]
        for (x0, y0), (x1, y1) in zip(pts, pts[1:] + pts[:1]):
            if (y0 > y) != (y1 > y) and x < x0 + (y - y0) * (x1 - x0) / (y1 - y0):
                n = not n
    return n


def test_confini_con_le_chiavi_adm0_a3():
    assert all(re.fullmatch(r"[A-Z]{3}", k) for k in PAESI)
    # dove ADM0_A3 e ISO_A3 non coincidono: Kosovo, Norvegia, Sahara Occidentale
    assert {"KOS", "NOR", "SAH", "ITA", "USA", "CHN"} <= set(PAESI)
    assert PAESI["ITA"]["nome"] == "Italia"


def test_taiwan_a_se_hong_kong_e_macao_nella_cina():
    assert "TWN" in PAESI
    assert "HKG" not in PAESI and "MAC" not in PAESI
    assert dentro("TWN", 121.56, 25.03) and not dentro("CHN", 121.56, 25.03)  # Taipei


def test_la_crimea_dentro_l_ucraina():
    assert dentro("UKR", 34.10, 44.95) and not dentro("RUS", 34.10, 44.95)  # Sinferopoli
    assert dentro("UKR", 30.52, 50.45) and dentro("RUS", 37.62, 55.75)  # Kiev, Mosca
