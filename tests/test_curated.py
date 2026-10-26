"""File scritti a mano (scadenze dell'AI Act e rapporti periodici) e file generati una volta (i confini della mappa)."""
from __future__ import annotations

import importlib.util
import json
import re
from datetime import date
from pathlib import Path

import pytest

from pipeline import ai_act, catena, rapporti

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


ANELLO_ETO = {
    "misura": "Quota del valore dei chip progettati", "fonte": "ETO", "titolo": "Supply Chain Dataset", "url": "https://eto.tech/x",
    "licenza": "CC BY-NC 4.0", "url_licenza": "https://creativecommons.org/licenses/by-nc/4.0/", "data": 2022,
    "quote": {"USA": 51, "KOR": 13}, "europa": 10,
}


def test_catena_valid():
    out = catena.validate({"anelli": {"progettazione": ANELLO_ETO, "macchinari": {**ANELLO_ETO, "europa": None, "nota": "EUV"}}})
    assert out["progettazione"] == {**ANELLO_ETO, "data": "2022"}
    assert out["macchinari"]["europa"] is None and out["macchinari"]["nota"] == "EUV"


MATERIA = {**ANELLO_ETO, "nome": "Gallio", "fonte": "USGS", "licenza": "pubblico dominio", "quote": {"CHN": 99.0, "RUS": 0.7}, "europa": None}


def test_catena_materie_un_anello_per_materiale():
    out = catena.validate({"anelli": {"materie": {"materiali": {"gallio": MATERIA, "germanio": {**MATERIA, "nome": "Germanio"}}}}})
    assert out["materie"]["materiali"]["gallio"] == {**MATERIA, "data": "2022"}
    assert list(out["materie"]["materiali"]) == ["gallio", "germanio"]


@pytest.mark.parametrize("materiali, msg", [
    ({"indio": MATERIA}, "materiale sconosciuto: indio"),
    ({"gallio": {**MATERIA, "quote": {"CHN": 101}}}, "gallio, CHN: quota fuori da 0-100"),
    ({"gallio": {**MATERIA, "nome": ""}}, "gallio: nome mancante"),
    ({}, "materie: nessun materiale"),
])
def test_catena_materie_rejects(materiali, msg):
    with pytest.raises(ValueError, match=msg):
        catena.validate({"anelli": {"materie": {"materiali": materiali}}})


def test_catena_tollera_gli_arrotondamenti_della_fonte():
    # la litografia di ETO somma a 100,1
    out = catena.validate({"anelli": {"macchinari": {**ANELLO_ETO, "europa": None, "quote": {"NLD": 81.5, "JPN": 15, "AUT": 1.6, "DEU": 2.0}}}})
    assert sum(out["macchinari"]["quote"].values()) == pytest.approx(100.1)


@pytest.mark.parametrize("anelli, msg", [
    ({"energia": ANELLO_ETO}, "anello sconosciuto: energia"),
    ({"datacenter": ANELLO_ETO}, "anello sconosciuto: datacenter"),  # viene dalla pipeline, non da un file curato
    ({"progettazione": {**ANELLO_ETO, "quote": {"USA": 101}}}, "USA: quota fuori da 0-100"),
    ({"progettazione": {**ANELLO_ETO, "quote": {"USA": -1}}}, "USA: quota fuori da 0-100"),
    ({"progettazione": {**ANELLO_ETO, "europa": 120}}, "europa: quota fuori da 0-100"),
    ({"progettazione": {**ANELLO_ETO, "quote": {"USA": 60, "KOR": 31}}}, "somma delle quote sopra 100"),  # con l'Europa al 10
    ({"progettazione": {**ANELLO_ETO, "url": "http://eto.tech"}}, "url"),
    ({"progettazione": {**ANELLO_ETO, "fonte": " "}}, "fonte"),
    ({"progettazione": {**ANELLO_ETO, "titolo": None}}, "titolo"),
])
def test_catena_rejects(anelli, msg):
    with pytest.raises(ValueError, match=msg):
        catena.validate({"anelli": anelli})


def tappa(anello: str, **patch) -> dict:
    return {"anello": anello, "luogo": "TSMC, Tainan", "iso": "TWN", "lat": 23.11, "lon": 120.27, "frase": "fabbrica il chip",
            "fonte": "https://www.tsmc.com/x", **patch}


FERMATE = ["materie", "progettazione", "fabbricazione", "macchinari", "datacenter", "modelli"]
FILO = {"nome": "Un modello americano", "tappe": [tappa(a) for a in FERMATE]}


def test_filo_valid():
    out = catena.validate_fili({"fili": {"usa": FILO, "ue": {**FILO, "nome": "Un modello europeo"}}})
    assert list(out) == ["usa", "ue"]
    assert out["usa"]["nome"] == "Un modello americano"
    assert [t["anello"] for t in out["usa"]["tappe"]] == FERMATE
    assert out["usa"]["tappe"][2] == tappa("fabbricazione")


def test_un_file_senza_fili_non_ne_ha():
    assert catena.validate_fili({"anelli": {}}) == {}


@pytest.mark.parametrize("fili, msg", [
    ({"giappone": FILO}, "esempio sconosciuto: giappone"),
    ({"usa": {**FILO, "nome": ""}}, "usa: nome mancante"),
    ({"usa": {**FILO, "tappe": [tappa(a) for a in FERMATE[:5]]}}, "usa: servono sei tappe"),
    ({"usa": {**FILO, "tappe": [tappa(a) for a in FERMATE] + [tappa("modelli")]}}, "usa: servono sei tappe"),
    ({"usa": {**FILO, "tappe": [tappa(a) for a in FERMATE[1:2] + FERMATE[:1] + FERMATE[2:]]}}, "usa, tappa 1: serve l'anello materie, non progettazione"),
    ({"usa": {**FILO, "tappe": [tappa(a, fonte=None if a == "macchinari" else "https://x.example") for a in FERMATE]}}, "usa, tappa 4: fonte mancante"),
    ({"usa": {**FILO, "tappe": [tappa(a, fonte="http://x.example") for a in FERMATE]}}, "usa, tappa 1: fonte deve iniziare con https://"),
    ({"usa": {**FILO, "tappe": [tappa(a, frase=" ") for a in FERMATE]}}, "usa, tappa 1: frase mancante"),
    ({"usa": {**FILO, "tappe": [tappa(a, iso="Taiwan") for a in FERMATE]}}, "usa, tappa 1: iso non è un codice ADM0_A3"),
    ({"usa": {**FILO, "tappe": [tappa(a, lat=95) for a in FERMATE]}}, "usa, tappa 1: coordinate fuori scala"),
    ({"usa": {**FILO, "tappe": [tappa(a, lon="120") for a in FERMATE]}}, "usa, tappa 1: coordinate fuori scala"),
])
def test_filo_rejects(fili, msg):
    with pytest.raises(ValueError, match=msg):
        catena.validate_fili({"fili": fili})


def test_shipped_files_are_valid(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    assert ai_act.run()["scadenze"] >= 5
    assert rapporti.run()["rapporti"] >= 4
    assert json.loads((tmp_path / "ai_act.json").read_text())["scadenze"]
    assert json.loads((tmp_path / "rapporti.json").read_text())["rapporti"]


def test_shipped_catena_is_valid(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    assert catena.run() == {"anelli": 4, "fili": 3}
    doc = json.loads((tmp_path / "catena.json").read_text(encoding="utf-8"))
    fili, anelli = doc["fili"], doc["anelli"]
    assert list(fili) == ["usa", "ue", "cina"]
    assert all(t["fonte"].startswith("https://") for f in fili.values() for t in f["tappe"])
    # il data center dell'esempio europeo è un sito di Epoch, non «Mistral Compute»
    siti = {s["nome"] for s in json.loads((ROOT / "data" / "geopoliticai.json").read_text(encoding="utf-8"))["data_center"]["siti"]}
    assert all(f["tappe"][4]["luogo"].split(",")[0] in siti for f in fili.values())
    assert fili["ue"]["tappe"][4]["iso"] == "SWE"
    materie = anelli.pop("materie")["materiali"]
    assert {k: a["data"] for k, a in anelli.items()} == {"progettazione": "2022", "fabbricazione": "2022", "macchinari": "2025"}
    assert {m: (x["fonte"], x["licenza"]) for m, x in materie.items()} == {
        "gallio": ("USGS", "pubblico dominio"), "terre": ("USGS", "pubblico dominio"), "silicio": ("USGS", "pubblico dominio"),
        "germanio": ("Commissione europea", "CC BY 4.0"),
    }
    # l'Italia non produce nessuno dei quattro materiali
    assert all("ITA" not in x["quote"] for x in materie.values())
    assert anelli["progettazione"]["europa"] and anelli["fabbricazione"]["europa"] and anelli["macchinari"]["europa"] is None
    assert "EUV" in anelli["macchinari"]["nota"]
    assert all(a["licenza"] == "CC BY-NC 4.0" for a in anelli.values())
    # la licenza di ETO sta accanto al file (ADR 0001)
    assert "Attribution-NonCommercial 4.0" in (ROOT / "config" / "catena" / "LICENSE-ETO.md").read_text(encoding="utf-8")


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
