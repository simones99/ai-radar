"""Passo geopoliticai con i CSV veri di Epoch, registrati il 23 ottobre 2026 (nessuna chiamata di rete).

Dei due file restano solo le colonne che il passo legge: tests/fixtures/epoch_large_scale.csv ed epoch_eci.csv.
"""
from __future__ import annotations

import csv
import io
import json
import logging
from datetime import date
from pathlib import Path

import pytest

from pipeline import geopoliticai

FIX = Path(__file__).parent / "fixtures"
LARGE = (FIX / "epoch_large_scale.csv").read_text(encoding="utf-8")
ECI = (FIX / "epoch_eci.csv").read_text(encoding="utf-8")
TODAY = date(2026, 10, 23)


class Resp:
    def __init__(self, text, status=200):
        self.status_code, self.headers, self.text = status, {}, text

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")


class Session:
    def __init__(self, large=LARGE, eci=ECI, status=200):
        self.large, self.eci, self.status, self.calls = large, eci, status, []

    def get(self, url, params=None, headers=None, timeout=None):
        self.calls.append(url)
        return Resp(self.large if "large_scale" in url else self.eci, self.status)


@pytest.fixture
def data_dir(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    monkeypatch.setattr("time.sleep", lambda *_: None)
    return tmp_path


def run(data_dir, session=None):
    geopoliticai.run(session or Session(), TODAY)
    return json.loads((data_dir / "geopoliticai.json").read_text(encoding="utf-8"))


def con_righe(text: str, righe: list[dict]) -> str:
    """Il CSV registrato con qualche riga in più, per i casi che i dati veri di oggi non hanno."""
    head = next(csv.reader(io.StringIO(text)))
    out = io.StringIO()
    w = csv.DictWriter(out, fieldnames=head, lineterminator="\n")
    w.writerows({c: r.get(c, "") for c in head} for r in righe)
    return text + out.getvalue()


def large(modello, paese, flop="", anno="2025", org="Org"):
    return {"Model": modello, "Organization": org, "Publication date": f"{anno}-06-01",
            "Country (of organization)": paese, "Training compute (FLOP)": flop}


def test_legge_i_csv_registrati(data_dir):
    out = run(data_dir)
    assert out["scaricato"] == "2026-10-23" and out["anno_corrente"] == 2026
    zone = out["zone"]
    assert list(zone)[:5] == ["usa", "cina", "ue", "uk", "altri"]
    ue = zone["ue"]
    assert ue["eci"]["2026"] == {"n": 2, "max": 150.03, "modello": "Mistral Large 4"}
    assert ue["calcolo"]["2025"] == {"n": 5, "nc": 3, "max": 1.152e24, "modello": "Mistral Small 3"}
    assert "2026" not in ue["calcolo"]
    assert ue["org_eci"] == ["Mistral AI"]
    assert (ue["aggettivo"], ue["con_articolo"]) == ("europeo", "l'UE")
    assert zone["usa"]["eci"]["2026"]["modello"] == "Claude Opus 5.5"
    assert zone["cina"]["eci"]["2026"]["modello"] == "Kimi K3"
    assert zone["francia"]["eci"]["2026"]["modello"] == "Mistral Large 4"
    assert out["senza_paese"]["large"] == ["Poro 34B"]
    assert len(out["senza_paese"]["eci"]) == 17
    assert next(iter(out["altri_paesi"])) == "South Korea"


def test_italia_sempre_e_paesi_ue_solo_con_modelli(data_dir):
    zone = run(data_dir)["zone"]
    assert zone["italia"]["tipo"] == "paese-ue"
    assert zone["italia"]["calcolo"] == {} and zone["italia"]["eci"] == {}
    assert {k for k, z in zone.items() if z["tipo"] == "paese-ue"} == {"bulgaria", "finlandia", "francia", "germania", "italia"}


def test_conta_solo_la_prima_organizzazione(data_dir):
    righe = [large("Comune", "United States of America,France", "9e26", org="Meta AI,Meta Paris")]
    zone = run(data_dir, Session(large=con_righe(LARGE, righe)))["zone"]
    assert zone["usa"]["calcolo"]["2025"]["max"] == 9e26
    assert zone["ue"]["calcolo"]["2025"]["n"] == 5
    assert zone["francia"]["calcolo"]["2025"]["n"] == 3


def test_hong_kong_e_macao_nella_cina_taiwan_in_altri(data_dir):
    base = run(data_dir)["zone"]
    righe = [large("HK", "Hong Kong", "1e24"), large("MO", "Macao", "1e24"), large("TW", "Taiwan", "5e25")]
    out = run(data_dir, Session(large=con_righe(LARGE, righe)))
    assert out["zone"]["cina"]["calcolo"]["2025"]["n"] == base["cina"]["calcolo"]["2025"]["n"] + 2
    assert out["zone"]["altri"]["calcolo"]["2025"]["modello"] == "TW"
    assert out["altri_paesi"]["Taiwan"] == 1


def test_senza_paese_e_multinational_fuori_dalle_aree(data_dir):
    righe = [large("Senza", ""), large("Multi", "Multinational,United States of America", "1e27")]
    out = run(data_dir, Session(large=con_righe(LARGE, righe)))
    assert out["senza_paese"]["large"] == ["Poro 34B", "Senza", "Multi"]
    assert out["zone"]["usa"]["calcolo"]["2025"]["max"] < 1e27


def test_possibly_over_contano_ma_non_nel_massimo(data_dir):
    zone = run(data_dir, Session(large=con_righe(LARGE, [large("Forse", "Germany")])))["zone"]
    assert zone["germania"]["calcolo"]["2025"]["n"] == 2
    assert zone["germania"]["calcolo"]["2025"]["nc"] == 1
    assert zone["germania"]["calcolo"]["2025"]["modello"] == "Teuken 7B"


def test_paese_sconosciuto_va_in_altri_e_nel_log(data_dir, caplog):
    with caplog.at_level(logging.WARNING):
        out = run(data_dir, Session(large=con_righe(LARGE, [large("Lontano", "Atlantide", "2e24")])))
    assert out["altri_paesi"]["Atlantide"] == 1
    assert "Atlantide" in caplog.text


@pytest.mark.parametrize("session", [
    Session(status=500),
    Session(large=LARGE.replace("Training compute (FLOP)", "Compute")),
    Session(eci=ECI.replace("Display name", "Name")),
    Session(eci="\n".join(ECI.splitlines()[:20])),
], ids=["http-500", "colonna-calcolo", "colonna-eci", "eci-troncato"])
def test_errore_lascia_il_file_precedente(data_dir, monkeypatch, session):
    from pipeline import run as pipeline_run
    before = json.dumps(run(data_dir), ensure_ascii=False)
    monkeypatch.setattr("pipeline.run.session", lambda: session)
    pipeline_run.main(["--only", "geopoliticai"])
    after = json.loads((data_dir / "geopoliticai.json").read_text(encoding="utf-8"))
    assert json.dumps(after, ensure_ascii=False) == before
    status = json.loads((data_dir / "status.json").read_text(encoding="utf-8"))["fonti"]["geopoliticai"]
    assert status["stato"] == "errore"
