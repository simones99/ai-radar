"""Radar 2.0: tendenza, segnali, quadranti, prudenza, GitHub, risorse e configurazione."""
from __future__ import annotations

import json
from datetime import date

import pytest
import requests

from pipeline import common, github_signals, risorse, tendenza
from test_pipeline import FakeResponse


def test_config_base_topics_and_resources():
    assert common.load_yaml("sources.yaml")["github_base_topics"] == ["llm", "ai", "artificial-intelligence", "generative-ai"]
    for sk in common.load_yaml("skills.yaml")["skills"]:
        ris = sk.get("risorse", [])
        assert 2 <= len(ris) <= 4, sk["id"]
        for r in ris:
            assert r["url"].startswith("https://"), r
            assert 0 < len(r["titolo"]) <= 70, r
            assert r["tipo"] in {"documentazione", "corso", "guida", "repository"}, r
            assert r.get("lingua", "en") in {"it", "en"}, r


# ------------------------------------------------------------------ tendenza

def test_trend_recovers_known_growth():
    t = tendenza.trend(list(range(6)), [1000 * 1.1 ** i for i in range(6)], [10000] * 6)
    assert tendenza.variazione(t, 6) == pytest.approx(1.1 ** 6 - 1, rel=0.01)
    assert tendenza.rapporto(t, 6) < 1.15
    lo, hi = tendenza.margine(t, 6)
    assert tendenza.rapporto(t, 6) == pytest.approx((1 + hi) / (1 + lo))


def test_trend_small_counts_have_wider_margin():
    big = tendenza.trend(list(range(6)), [1000 * 1.1 ** i for i in range(6)], [10000] * 6)
    small = tendenza.trend(list(range(6)), [10 * 1.1 ** i for i in range(6)], [100] * 6)
    assert tendenza.rapporto(small, 6) > 1.5 * tendenza.rapporto(big, 6)


def test_trend_dispersion_widens_margin():
    smooth = tendenza.trend(list(range(6)), [100, 110, 120, 130, 140, 150], [1000] * 6)
    noisy = tendenza.trend(list(range(6)), [100, 180, 70, 190, 60, 150], [1000] * 6)
    assert noisy["errore"] > 2 * smooth["errore"]


def test_trend_needs_four_valid_points():
    assert tendenza.trend(list(range(6)), [5] * 6, [0, 0, 0, 100, 100, 100]) is None
    assert tendenza.trend(list(range(6)), [5] * 6, [0, 0, 100, 100, 100, 100]) is not None


def test_combine_weights_and_cap():
    a = {"pendenza": 0.10, "errore": 0.01}
    b = {"pendenza": 0.00, "errore": 0.10}
    t, w = tendenza.combine([a, b])
    assert w == pytest.approx([2 / 3, 1 / 3])  # senza tetto sarebbe 0,99 e 0,01
    assert t["pendenza"] == pytest.approx(2 / 3 * 0.10)
    assert t["errore"] == pytest.approx(((2 / 3 * 0.01) ** 2 + (1 / 3 * 0.10) ** 2) ** 0.5)
    t1, w1 = tendenza.combine([a])
    assert w1 == [1.0]
    assert (t1["pendenza"], t1["errore"]) == pytest.approx((0.10, 0.01))
    c = {"pendenza": 0.05, "errore": 0.05}
    assert tendenza.combine([c, c])[1] == pytest.approx([0.5, 0.5])
    assert tendenza.combine([]) is None


def test_combine_caps_with_three_signals():
    trends = [{"pendenza": 0.1, "errore": e} for e in (0.001, 0.1, 0.2)]
    _, w = tendenza.combine(trends)
    assert w == pytest.approx([2 / 3, 1 / 3 * 0.8, 1 / 3 * 0.2])


# ------------------------------------------------------------------ GitHub

class GhFake:
    """API di ricerca di GitHub: 100 repository al mese con il topic llm, 10 con gli altri."""

    def __init__(self, fail_top: bool = False):
        self.headers: dict = {}
        self.calls: list[str] = []
        self.fail_top = fail_top

    def get(self, url, params=None, headers=None, timeout=None):
        q = (params or {}).get("q", "")
        self.calls.append(q or url)
        if (params or {}).get("sort") == "stars":
            if self.fail_top:
                return FakeResponse(status=422, body={"message": "Validation Failed"})
            return FakeResponse(body={"items": [{
                "full_name": "o/new", "html_url": "https://github.com/o/new", "description": "x" * 300,
                "stargazers_count": 42, "created_at": "2026-09-20T10:00:00Z"}]})
        return FakeResponse(body={"total_count": 100 if q.startswith("topic:llm ") else 10})


def test_github_base_and_new_repos(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    monkeypatch.setattr("time.sleep", lambda *_: None)
    skills = [{"id": "mcp", "github": "mcp"}]
    github_signals.run(GhFake(), skills, [], date(2026, 10, 15), months=3, base_topics=["llm", "ai"])
    gh = json.loads((tmp_path / "github.json").read_text(encoding="utf-8"))
    assert gh["base_topics"] == ["llm", "ai"]
    assert gh["base"] == {"2026-07": 110, "2026-08": 110, "2026-09": 110}
    assert gh["in_crescita"]["mcp"] == [{"nome": "o/new", "url": "https://github.com/o/new", "descrizione": "x" * 200,
                                         "stelle": 42, "creato": "2026-09-20"}]

    # Secondo giro: base ricontata solo negli ultimi 2 mesi; la ricerca dei nuovi fallisce e resta la lista di prima.
    fake = GhFake(fail_top=True)
    github_signals.run(fake, skills, [], date(2026, 10, 15), months=3, base_topics=["llm", "ai"])
    gh = json.loads((tmp_path / "github.json").read_text(encoding="utf-8"))
    assert gh["in_crescita"]["mcp"][0]["nome"] == "o/new"
    assert sum(c.startswith("topic:llm created:2026") for c in fake.calls) == 2
    assert "topic:mcp created:>=2026-07-17" in fake.calls


# ------------------------------------------------------------------ risorse

class LinkFake:
    """Risponde `status` a HEAD; a GET risponde `get_status` (di default lo stesso)."""

    def __init__(self, status: int, get_status: int | None = None):
        self.status, self.get_status = status, status if get_status is None else get_status
        self.headers: dict = {}
        self.calls: list[tuple[str, str]] = []

    def head(self, url, allow_redirects=True, timeout=None):
        self.calls.append(("head", url))
        return FakeResponse(status=self.status, text="")

    def get(self, url, params=None, headers=None, timeout=None):
        self.calls.append(("get", url))
        return FakeResponse(status=self.get_status, text="")


SK = [{"id": "a", "risorse": [{"titolo": "T", "url": "https://x.example", "tipo": "guida"}]}]


def _link(tmp_path):
    return json.loads((tmp_path / "risorse.json").read_text(encoding="utf-8"))["link"]["https://x.example"]


def test_link_is_down_only_after_two_failed_weeks(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    monkeypatch.setattr("time.sleep", lambda *_: None)
    risorse.run(LinkFake(404), SK, date(2026, 10, 12))
    assert _link(tmp_path) == {"stato": 404, "errori": 1, "ok": True, "controllato": "2026-10-12"}
    same_week = LinkFake(404)
    risorse.run(same_week, SK, date(2026, 10, 15))  # stessa settimana: nessuna richiesta
    assert same_week.calls == []
    info = risorse.run(LinkFake(404), SK, date(2026, 10, 19))
    assert _link(tmp_path)["ok"] is False and info["non_raggiungibili"] == 1
    risorse.run(LinkFake(200), SK, date(2026, 10, 26))
    assert _link(tmp_path) == {"stato": 200, "errori": 0, "ok": True, "controllato": "2026-10-26"}


def test_link_check_falls_back_to_get(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    monkeypatch.setattr("time.sleep", lambda *_: None)
    fake = LinkFake(405, get_status=200)  # alcuni siti rifiutano HEAD
    risorse.run(fake, SK, date(2026, 10, 12))
    assert fake.calls == [("head", "https://x.example"), ("get", "https://x.example")]
    assert _link(tmp_path)["stato"] == 200


def test_risorse_survives_corrupt_state(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    monkeypatch.setattr("time.sleep", lambda *_: None)
    (tmp_path / "risorse.json").write_text("{non è json", encoding="utf-8")
    risorse.run(LinkFake(200), SK, date(2026, 10, 12))
    assert _link(tmp_path)["stato"] == 200


def test_link_without_date_is_rechecked(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    monkeypatch.setattr("time.sleep", lambda *_: None)
    (tmp_path / "risorse.json").write_text(
        json.dumps({"link": {"https://x.example": {"stato": 200, "errori": 0, "ok": True}}}), encoding="utf-8")
    fake = LinkFake(200)
    risorse.run(fake, SK, date(2026, 10, 12))
    assert fake.calls == [("head", "https://x.example")]


class HeadRaises(LinkFake):
    def __init__(self, get_status=None, get_raises=False):
        super().__init__(200, get_status)
        self.get_raises = get_raises

    def head(self, url, allow_redirects=True, timeout=None):
        raise requests.ConnectionError("chiusa")

    def get(self, url, params=None, headers=None, timeout=None):
        if self.get_raises:
            raise requests.ConnectionError("chiusa")
        return super().get(url, params=params, headers=headers, timeout=timeout)


def test_link_check_head_exception_falls_back_to_get(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    monkeypatch.setattr("time.sleep", lambda *_: None)
    risorse.run(HeadRaises(get_status=200), SK, date(2026, 10, 12))
    assert _link(tmp_path)["stato"] == 200


def test_link_check_both_raise_counts_as_error(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    monkeypatch.setattr("time.sleep", lambda *_: None)
    risorse.run(HeadRaises(get_raises=True), SK, date(2026, 10, 12))
    assert _link(tmp_path) == {"stato": None, "errori": 1, "ok": True, "controllato": "2026-10-12"}


def test_link_403_counts_as_alive(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    monkeypatch.setattr("time.sleep", lambda *_: None)
    risorse.run(LinkFake(403), SK, date(2026, 10, 12))
    assert _link(tmp_path) == {"stato": 403, "errori": 0, "ok": True, "controllato": "2026-10-12"}
