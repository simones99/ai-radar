"""Our World in Data: CSV del grapher, filtro per entità, errori per serie."""
from __future__ import annotations

import json

import pytest

from pipeline import owid


class Resp:
    def __init__(self, status=200, text="", body=None):
        self.status_code = status
        self.headers = {}
        self.text = text if body is None else json.dumps(body)
        self.content = self.text.encode("utf-8")

    def json(self):
        return json.loads(self.text)

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")


class Session:
    def __init__(self, routes):
        self.routes, self.headers = routes, {}

    def get(self, url, params=None, headers=None, timeout=None):
        return self.routes[url]


CSV = ("entity,code,year,private_investment\n"
       "World,OWID_WRL,2024,130\nWorld,OWID_WRL,2025,290\n"
       "China,CHN,2025,12\nUnited States,USA,2025,200\n")
META = {"columns": {"private_investment": {"titleShort": "Private investment", "unit": "constant 2021 US$",
                                           "citationShort": "Quid via AI Index", "lastUpdated": "2026-04-20"}}}
BASE = "https://ourworldindata.org/grapher/"


def test_parse_csv_filters_entities_and_sorts():
    pts = owid.parse_csv(CSV, "private_investment", ["World", "China"])
    assert pts == [{"entita": "China", "t": "2025", "v": 12.0},
                   {"entita": "World", "t": "2024", "v": 130.0},
                   {"entita": "World", "t": "2025", "v": 290.0}]


def test_parse_csv_quarter_and_quoted_entities():
    text = 'entity,quarter,revenue\n"Data centers and AI",2026-Q2,5\n"Data centers and AI",2026-Q3,7\n'
    pts = owid.parse_csv(text, "revenue", None)
    assert [p["t"] for p in pts] == ["2026-Q2", "2026-Q3"]


def test_parse_csv_missing_column():
    with pytest.raises(ValueError, match="colonna"):
        owid.parse_csv(CSV, "generative_ai", None)


def test_run_keeps_good_series_when_one_breaks(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    s = Session({
        BASE + "a.csv": Resp(text=CSV),
        BASE + "a.metadata.json": Resp(body=META),
        BASE + "b.csv": Resp(text=CSV),
        BASE + "b.metadata.json": Resp(body=META),
    })
    info = owid.run(s, [
        {"id": "buona", "slug": "a", "colonna": "private_investment", "entita": ["World"]},
        {"id": "rotta", "slug": "b", "colonna": "colonna_che_non_esiste"},
    ])
    out = json.loads((tmp_path / "owid.json").read_text())
    assert info == {"serie": 1, "errori": 1}
    assert out["serie"]["buona"]["citazione"] == "Quid via AI Index"
    assert out["serie"]["buona"]["unita"] == "constant 2021 US$"
    assert out["serie"]["buona"]["url"] == BASE + "a"
    assert [p["v"] for p in out["serie"]["buona"]["punti"]] == [130.0, 290.0]
    assert "rotta" in out["errori"] and "rotta" not in out["serie"]


def test_run_keeps_last_good_copy_of_a_broken_series(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    monkeypatch.setattr("time.sleep", lambda *_: None)  # http_get ritenta sui 500: niente attese nel test
    (tmp_path / "owid.json").write_text(json.dumps({"serie": {"rotta": {"titolo": "vecchia", "punti": []}}}))
    s = Session({BASE + "a.csv": Resp(text=CSV), BASE + "a.metadata.json": Resp(status=500),
                 BASE + "b.csv": Resp(status=404)})
    owid.run(s, [{"id": "buona", "slug": "a", "colonna": "private_investment"},
                 {"id": "rotta", "slug": "b", "colonna": "private_investment"}])
    out = json.loads((tmp_path / "owid.json").read_text())
    assert out["serie"]["rotta"]["titolo"] == "vecchia"
    assert out["serie"]["buona"]["titolo"] == ""  # metadati non disponibili: la serie resta valida


def test_run_fails_when_every_series_fails(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    s = Session({BASE + "b.csv": Resp(status=404)})
    with pytest.raises(ValueError, match="nessuna serie"):
        owid.run(s, [{"id": "rotta", "slug": "b", "colonna": "x"}])
