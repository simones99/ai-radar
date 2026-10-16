"""Radar 2.0: tendenza, segnali, quadranti, prudenza, GitHub, risorse e configurazione."""
from __future__ import annotations

import pytest

from pipeline import common, tendenza


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
    lo, hi = tendenza.margine(t, 6)
    assert lo < tendenza.variazione(t, 6) < hi


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
    t1, w1 = tendenza.combine([a])
    assert w1 == [1.0]
    assert (t1["pendenza"], t1["errore"]) == pytest.approx((0.10, 0.01))
    c = {"pendenza": 0.05, "errore": 0.05}
    assert tendenza.combine([c, c])[1] == pytest.approx([0.5, 0.5])
    assert tendenza.combine([]) is None
