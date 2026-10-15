"""Test della pipeline con risposte HTTP simulate (nessuna chiamata di rete).

I numeri qui sotto sono inventati: servono solo a verificare parser e calcoli.
"""
from __future__ import annotations

import json
import re
from datetime import date, datetime, timedelta, timezone
from urllib.parse import urlparse

import pytest

from pipeline import arxiv, common, epoch, eurostat, radar


# ------------------------------------------------------------------ unità

def test_complete_months_crosses_year():
    assert common.complete_months(3, date(2026, 1, 15)) == ["2025-10", "2025-11", "2025-12"]


def test_month_bounds_leap_year():
    assert common.month_bounds("2024-02") == (date(2024, 2, 1), date(2024, 2, 29))
    assert common.month_bounds("2025-12") == (date(2025, 12, 1), date(2025, 12, 31))


def test_arxiv_query_and_total():
    q = arxiv.build_query(["LLM agent", "agentic"], "2026-09")
    assert 'abs:"LLM agent" OR abs:"agentic"' in q
    assert "submittedDate:[202609010000 TO 202609302359]" in q
    assert "cat:cs.AI" in q
    xml = ('<feed xmlns="http://www.w3.org/2005/Atom" '
           'xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/">'
           '<opensearch:totalResults>1234</opensearch:totalResults></feed>')
    assert arxiv.parse_total(xml) == 1234


def _jsonstat(geos, years, value_fn):
    vals, i = {}, 0
    for g in geos:
        for y in years:
            v = value_fn(g, y)
            if v is not None:
                vals[str(i)] = v
            i += 1
    one = lambda code: {"category": {"index": {code: 0}, "label": {code: code}}}
    return {
        "version": "2.0", "class": "dataset", "updated": "2026-06-15T11:00:00+0200",
        "id": ["freq", "size_emp", "nace_r2", "indic_is", "unit", "geo", "time"],
        "size": [1, 1, 1, 1, 1, len(geos), len(years)],
        "dimension": {
            "freq": one("A"), "size_emp": one("GE10"), "nace_r2": one("X"), "indic_is": one("E_AI_TANY"),
            "unit": one("PC_ENT"),
            "geo": {"category": {"index": {g: k for k, g in enumerate(geos)}}},
            "time": {"category": {"index": {y: k for k, y in enumerate(years)}}},
        },
        "value": vals,
    }


def test_jsonstat_decoding_row_major_and_missing():
    js = _jsonstat(["EU27_2020", "IT"], ["2024", "2025"],
                   lambda g, y: None if (g, y) == ("IT", "2024") else {"EU27_2020": 10, "IT": 20}[g] + int(y) - 2024)
    rows = eurostat.decode_jsonstat(js)
    got = {(r["geo"], r["time"]): r["value"] for r in rows}
    assert got == {("EU27_2020", "2024"): 10, ("EU27_2020", "2025"): 11, ("IT", "2025"): 21}


@pytest.mark.parametrize("field,expected", [
    ("United States of America", ["USA"]),
    ("United States of America,United Kingdom of Great Britain and Northern Ireland", ["USA", "Regno Unito"]),
    ("Netherlands, Kingdom of the", ["UE"]),
    ("China", ["Cina"]),
    ("Iran, Islamic Republic of", ["Altri"]),
    ("Multinational", ["Altri"]),
    ("", []),
])
def test_epoch_regions(field, expected):
    assert epoch.regions_of(field) == expected


def test_pct_ranks_with_ties_and_none():
    r = radar.pct_ranks({"a": 1.0, "b": 2.0, "c": 2.0, "d": 3.0, "e": None})
    assert r == {"a": 0.0, "b": 0.5, "c": 0.5, "d": 1.0, "e": None}
    assert radar.pct_ranks({"solo": 7.0}) == {"solo": 0.5}


def test_quadrants():
    assert radar.quadrant(0.9, 0.9) == "impara-ora"
    assert radar.quadrant(0.9, 0.1) == "prova"
    assert radar.quadrant(0.1, 0.9) == "consolida"
    assert radar.quadrant(0.1, 0.1) == "osserva"
    assert radar.quadrant(None, 0.9) is None


# --------------------------------------------------------------- end-to-end

class FakeResponse:
    def __init__(self, status=200, body=None, text=None):
        self.status_code = status
        self.headers = {}
        if text is None:
            text = json.dumps(body)
        self.text = text
        self.content = text.encode("utf-8")

    def json(self):
        return json.loads(self.text)

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")


def _epoch_csv():
    head = ["Model", "Organization", "Publication date", "Country (of organization)",
            "Training compute (FLOP)", "Frontier model", "Model accessibility", "Domain", "Notability criteria"]
    lines = [",".join(head)]
    countries = ["United States of America", "China", "France", "United Kingdom of Great Britain and Northern Ireland", "Canada"]
    for i in range(80):
        y = 2016 + i % 11
        c = countries[i % 5]
        acc = "Open weights (unrestricted)" if i % 3 == 0 else "API access"
        lines.append(f'Modello {i},Org {i % 7},{y}-0{1 + i % 9}-15,"{c}",{10 ** (20 + i % 7)}.0,{i % 4 == 0},{acc},Language,SOTA')
    return "\n".join(lines)


def _rss(n_days_ago: list[int]):
    items = ""
    for k, d in enumerate(n_days_ago):
        when = (datetime.now(timezone.utc) - timedelta(days=d)).strftime("%a, %d %b %Y %H:%M:%S GMT")
        items += f"<item><title>Notizia {k}</title><link>https://example.org/{k}</link><pubDate>{when}</pubDate></item>"
    return f'<?xml version="1.0"?><rss version="2.0"><channel><title>T</title>{items}</channel></rss>'


class FakeSession:
    def __init__(self):
        self.headers = {}
        self.calls = []

    def get(self, url, params=None, headers=None, timeout=None):
        self.calls.append(url)
        p = params if isinstance(params, dict) else {}
        host = urlparse(url).netloc
        if host == "export.arxiv.org":
            q = p["search_query"]
            month = int(re.search(r"submittedDate:\[\d{4}(\d{2})", q).group(1))
            n = 20000 + 100 * month if "abs:" not in q else (len(q) * 7) % 400 + 10 * month
            return FakeResponse(text=f'<feed xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/">'
                                     f'<opensearch:totalResults>{n}</opensearch:totalResults></feed>')
        if host == "api.github.com" and "/search/" in url:
            month = int(re.search(r"created:\d{4}-(\d{2})", p["q"]).group(1))
            return FakeResponse(body={"total_count": (len(p["q"]) * 3) % 90 + month})
        if host == "api.github.com" and "/repos/" in url:
            if url.endswith("anthropics/claude-code"):
                return FakeResponse(status=404, body={"message": "Not Found"})
            return FakeResponse(body={"stargazers_count": 1000, "html_url": "https://github.com/x", "description": "d"})
        if host == "huggingface.co":
            return FakeResponse(body=[{"id": f"org/m{i}", "likes": i, "downloads": 10 * i, "trendingScore": 100 - i,
                                       "pipeline_tag": ["text-generation", "image-text-to-text"][i % 2],
                                       "createdAt": "2026-09-01T00:00:00.000Z"} for i in range(100)])
        if host == "api.adzuna.com":
            base = 50000 if "what" not in str(p) else 0
            return FakeResponse(body={"count": base + (len(json.dumps(p, sort_keys=True)) * 13) % 700, "results": []})
        if host == "ec.europa.eu":
            geos = [v for k, v in params if k == "geo"]
            return FakeResponse(body=_jsonstat(geos, ["2023", "2024", "2025"], lambda g, y: 5.0 + int(y) - 2023))
        if host == "epoch.ai":
            return FakeResponse(text=_epoch_csv())
        if host == "artificialanalysis.ai":
            return FakeResponse(body={"data": [
                {"name": f"Modello {i}", "model_creator": {"name": "Lab"},
                 "evaluations": {"artificial_analysis_intelligence_index": 70 - i},
                 "pricing": {"price_1m_blended_3_to_1": 1.5 + i}, "median_output_tokens_per_second": 80}
                for i in range(15)]})
        if "deepmind" in url:
            return FakeResponse(status=500, text="errore")
        return FakeResponse(text=_rss([1, 3, 10, 90]))


@pytest.fixture
def env(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("ADZUNA_APP_ID", "x")
    monkeypatch.setenv("ADZUNA_APP_KEY", "y")
    monkeypatch.setenv("AA_API_KEY", "z")
    monkeypatch.setenv("GITHUB_TOKEN", "t")
    monkeypatch.setattr("time.sleep", lambda *_: None)
    fake = FakeSession()
    monkeypatch.setattr("pipeline.run.session", lambda: fake)
    return tmp_path, fake


def test_full_run(env):
    from pipeline import run
    tmp, fake = env
    assert run.main(["--months", "8"]) == 0

    status = json.loads((tmp / "status.json").read_text())
    states = {k: v["stato"] for k, v in status["fonti"].items()}
    assert states == {k: "ok" for k in run.ORDER}, states

    rad = json.loads((tmp / "radar.json").read_text())
    assert rad["base_domanda"] == "lavoro"
    assert all(r["quadrante"] for r in rad["competenze"])
    assert {r["quadrante"] for r in rad["competenze"]} <= set(radar.QUADRANTS)

    news = json.loads((tmp / "news.json").read_text())
    assert "Google DeepMind" in news["errori"]
    assert all(n["data"] >= (date.today() - timedelta(days=46)).isoformat() for n in news["notizie"])

    ep = json.loads((tmp / "epoch.json").read_text())
    assert ep["modelli"] == 80
    assert {r["area"] for r in ep["per_anno"]} == set(epoch.REGION_ORDER)

    gh = json.loads((tmp / "github.json").read_text())
    assert "anthropics/claude-code" not in {r["repo"] for r in gh["repos"]}

    # Secondo giro: lo storico non viene richiesto di nuovo, solo gli ultimi 2 mesi.
    n_before = sum("export.arxiv.org" in u for u in fake.calls)
    assert run.main(["--only", "arxiv", "--months", "8"]) == 0
    n_after = sum("export.arxiv.org" in u for u in fake.calls)
    targets = 1 + sum(1 for s in common.load_yaml("skills.yaml")["skills"] if s.get("arxiv"))
    assert n_after - n_before == 2 * targets


def test_missing_keys_are_not_errors(env, monkeypatch):
    from pipeline import run
    tmp, _ = env
    monkeypatch.delenv("ADZUNA_APP_ID")
    monkeypatch.delenv("AA_API_KEY")
    assert run.main(["--months", "8"]) == 0
    status = json.loads((tmp / "status.json").read_text())["fonti"]
    assert status["adzuna"]["stato"] == "non configurata"
    assert status["artificial_analysis"]["stato"] == "non configurata"
    rad = json.loads((tmp / "radar.json").read_text())
    assert rad["base_domanda"] == "open-source"


def test_error_messages_do_not_leak_keys(env, monkeypatch):
    import requests
    from pipeline import adzuna, run
    tmp, _ = env
    monkeypatch.setenv("ADZUNA_APP_ID", "id-0123456789")
    monkeypatch.setenv("ADZUNA_APP_KEY", "key-abcdef0123456789")

    def boom(*_a, **_k):
        r = requests.Response()
        r.status_code, r.reason = 503, "Service Unavailable"
        r.url = "https://api.adzuna.com/v1/api/jobs/it/search/1?app_id=id-0123456789&app_key=key-abcdef0123456789"
        r.raise_for_status()

    monkeypatch.setattr(adzuna, "count", boom)
    run.main(["--only", "adzuna"])
    text = (tmp / "status.json").read_text()
    assert "503" in text
    assert "id-0123456789" not in text and "key-abcdef0123456789" not in text


def test_network_error_log_does_not_leak_keys(monkeypatch, caplog):
    import requests
    monkeypatch.setattr("time.sleep", lambda *_: None)

    class Down:
        def get(self, *_a, **_k):
            raise requests.ConnectionError(
                "HTTPSConnectionPool(host='api.adzuna.com', port=443): Max retries exceeded with url: "
                "/v1/api/jobs/it/search/1?app_id=id-0123456789&app_key=key-abcdef0123456789"
            )

    with pytest.raises(requests.ConnectionError):
        common.http_get(Down(), "https://api.adzuna.com/v1/api/jobs/it/search/1", retries=2)
    assert "Errore di rete" in caplog.text
    assert "id-0123456789" not in caplog.text and "key-abcdef0123456789" not in caplog.text
