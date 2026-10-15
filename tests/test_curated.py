"""File scritti a mano: scadenze dell'AI Act e rapporti periodici."""
from __future__ import annotations

import json
from datetime import date

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
