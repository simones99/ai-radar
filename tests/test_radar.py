"""Radar 2.0: tendenza, segnali, quadranti, prudenza, GitHub, risorse e configurazione."""
from __future__ import annotations

from pipeline import common


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
