"""Passo eurostat_settori con una risposta vera di isoc_eb_ain2, registrata il 20 ottobre 2026 (nessuna chiamata di rete).

La risposta è quella della richiesta del passo, senza le etichette lunghe: tests/fixtures/isoc_eb_ain2.json.
"""
from __future__ import annotations

import copy
import json
from itertools import product
from pathlib import Path

import pytest

from pipeline import eurostat_settori
from pipeline.common import load_yaml

RECORDED = json.loads((Path(__file__).parent / "fixtures" / "isoc_eb_ain2.json").read_text(encoding="utf-8"))


class Resp:
    def __init__(self, body, status=200):
        self.status_code, self.headers, self._body = status, {}, body

    def json(self):
        return self._body

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")


class Session:
    def __init__(self, body=RECORDED, status=200):
        self.body, self.status, self.calls = body, status, []

    def get(self, url, params=None, headers=None, timeout=None):
        self.calls.append((url, params))
        return Resp(self.body, self.status)


@pytest.fixture
def data_dir(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    monkeypatch.setattr("time.sleep", lambda *_: None)
    return tmp_path


def cfg():
    return load_yaml("sources.yaml")["eurostat_settori"]


def run(data_dir, body=RECORDED):
    eurostat_settori.run(Session(body), cfg())
    return json.loads((data_dir / "eurostat_settori.json").read_text(encoding="utf-8"))


def test_decodifica_la_risposta_registrata(data_dir):
    out = run(data_dir)
    assert out["fonte"] == "Eurostat, isoc_eb_ain2"
    assert out["aggiornato_eurostat"] == "2026-06-15T11:00:00+0200"
    assert [s["id"] for s in out["settori"]][:2] == ["tutti", "manifattura"]
    assert out["settori"][1] == {"id": "manifattura", "nome": "Manifattura", "nace": "C", "nella_frase": "delle imprese manifatturiere"}
    # verifica del 20 ottobre (spec 4.1): Italia, tutte le attività, 2025
    assert out["anno"] == "2025"
    assert out["barriere"]["tutti"]["IT"]["E_AI_BLE"] == 58.61
    assert out["scopi"]["tutti"]["IT"]["E_AI_PMS"] == 33.1
    assert out["adozione"]["tutti"]["IT"] == {"2021": 6.17, "2023": 5.05, "2024": 8.2, "2025": 16.4}
    assert out["adozione"]["manifattura"]["IT"]["2025"] == 14.73
    assert out["nomi_scopi"]["E_AI_PMS"] == "Marketing e vendite"
    assert out["nomi_barriere"]["E_AI_BLE"] == "Mancano le competenze"


def _pos(js, **coords):
    """Posizione di una cella nel cubo JSON-stat (ordine delle righe: l'ultima dimensione corre più veloce)."""
    flat = 0
    for dim, size in zip(js["id"], js["size"]):
        index = js["dimension"][dim]["category"]["index"]
        flat = flat * size + (index[coords[dim]] if dim in coords else 0)
    return str(flat)


def test_flag_senza_valore_diventa_null_e_resta_nei_dati(data_dir):
    # nella risposta vera: immobiliare, Italia, logistica 2025 è riservato (|C) e senza numero
    out = run(data_dir)
    assert out["scopi"]["immobiliare"]["IT"]["E_AI_PLOG"] is None
    assert out["flag"]["scopi"]["immobiliare"]["IT"]["E_AI_PLOG"] == "c"
    assert out["scopi"]["immobiliare"]["EU27_2020"]["E_AI_PLOG"] > 0

    # «affidabilità bassa» (u) senza numero, come Eurostat la scrive per altri settori italiani
    js = copy.deepcopy(RECORDED)
    p = _pos(js, nace_r2="C", indic_is="E_AI_TANY", unit="PC_ENT", geo="IT", time="2023")
    del js["value"][p]
    js["status"][p] = "u"
    out = run(data_dir, js)
    assert out["adozione"]["manifattura"]["IT"]["2023"] is None
    assert out["flag"]["adozione"]["manifattura"]["IT"]["2023"] == "u"
    assert out["adozione"]["manifattura"]["IT"]["2025"] == 14.73
    assert "manifattura" not in out["flag"]["scopi"]


def test_scopi_e_barriere_solo_ultimo_anno_adozione_senza_2022(data_dir):
    out = run(data_dir)
    for g in ("IT", "EU27_2020"):
        assert list(out["adozione"]["ict"][g]) == ["2021", "2023", "2024", "2025"]
        assert list(out["scopi"]["ict"][g]) == list(cfg()["scopi"])
        assert list(out["barriere"]["ict"][g]) == list(cfg()["barriere"])

    # se il 2025 di scopi e barriere non c'è ancora, vale l'anno prima (Italia, marketing e vendite 2024: 35,71%)
    js = copy.deepcopy(RECORDED)
    codes = set(cfg()["scopi"]) | set(cfg()["barriere"])
    dims = [list(js["dimension"][d]["category"]["index"]) for d in js["id"]]
    for flat, combo in enumerate(product(*dims)):
        c = dict(zip(js["id"], combo))
        if c["time"] == "2025" and c["indic_is"] in codes:
            js["value"].pop(str(flat), None)
    out = run(data_dir, js)
    assert out["anno"] == "2024"
    assert out["scopi"]["tutti"]["IT"]["E_AI_PMS"] == 35.71
    assert out["adozione"]["tutti"]["IT"]["2025"] == 16.4


def _con_codici(dim, codes):
    """La risposta con un altro elenco di codici in una dimensione: i codici tolti perdono la loro fetta del cubo,
    quelli nuovi arrivano senza valori (come un codice che Eurostat toglie o un anno che elenca senza dati)."""
    js = copy.deepcopy(RECORDED)
    dims = [list(js["dimension"][d]["category"]["index"]) for d in js["id"]]
    keep = [codes if d == dim else dims[i] for i, d in enumerate(js["id"])]
    old = {combo: str(flat) for flat, combo in enumerate(product(*dims))}
    values, status = {}, {}
    for flat, combo in enumerate(product(*keep)):
        o = old.get(combo)
        if o in js["value"]:
            values[str(flat)] = js["value"][o]
        if o in js["status"]:
            status[str(flat)] = js["status"][o]
    js["dimension"][dim]["category"]["index"] = {c: k for k, c in enumerate(codes)}
    js["size"] = [len(k) for k in keep]
    js["value"], js["status"] = values, status
    return js


def _senza(dim, code):
    return _con_codici(dim, [c for c in RECORDED["dimension"][dim]["category"]["index"] if c != code])


def test_anno_senza_valori_non_entra_nell_adozione(data_dir):
    # Eurostat può elencare il 2022 senza nessun valore: non diventa una colonna di null
    out = run(data_dir, _con_codici("time", ["2021", "2022", "2023", "2024", "2025"]))
    for sid in ("tutti", "ict"):
        for g in ("IT", "EU27_2020"):
            assert list(out["adozione"][sid][g]) == ["2021", "2023", "2024", "2025"]
    assert out["adozione"]["tutti"]["IT"]["2025"] == 16.4


@pytest.mark.parametrize("session", [Session(status=500), Session(body=_senza("nace_r2", "L")),
                                     Session(body=_senza("unit", "PC_ENT_AI_EC"))],
                         ids=["http-500", "codice-sparito", "unita-sparita"])
def test_errore_lascia_il_file_precedente(data_dir, monkeypatch, session):
    from pipeline import run as pipeline_run
    before = json.dumps(run(data_dir), ensure_ascii=False)
    monkeypatch.setattr("pipeline.run.session", lambda: session)
    pipeline_run.main(["--only", "eurostat_settori"])
    after = json.loads((data_dir / "eurostat_settori.json").read_text(encoding="utf-8"))
    assert json.dumps(after, ensure_ascii=False) == before
    status = json.loads((data_dir / "status.json").read_text(encoding="utf-8"))["fonti"]["eurostat_settori"]
    assert status["stato"] == "errore"
