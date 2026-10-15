"""Feed con URL alternativi e tema; attese di arXiv su errori temporanei."""
from __future__ import annotations

import json
from datetime import date, datetime, timedelta, timezone

from pipeline import arxiv, feeds


class Resp:
    def __init__(self, status=200, text=""):
        self.status_code = status
        self.headers = {}
        self.text = text
        self.content = text.encode("utf-8")

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")


class MapSession:
    """Risponde per URL; un valore lista viene consumato una risposta alla volta."""

    def __init__(self, routes):
        self.routes = routes
        self.headers = {}
        self.calls = []

    def get(self, url, params=None, headers=None, timeout=None):
        self.calls.append(url)
        r = self.routes[url]
        if isinstance(r, list):
            return r.pop(0) if len(r) > 1 else r[0]
        return r


def _rss(days_ago):
    items = ""
    for k, d in enumerate(days_ago):
        when = (datetime.now(timezone.utc) - timedelta(days=d)).strftime("%a, %d %b %Y %H:%M:%S GMT")
        items += f"<item><title>Notizia {k}</title><link>https://example.org/{k}</link><pubDate>{when}</pubDate></item>"
    return f'<?xml version="1.0"?><rss version="2.0"><channel><title>T</title>{items}</channel></rss>'


def test_feed_alternative_url_and_tema(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    s = MapSession({
        "https://a.example/feed": Resp(403),
        "https://b.example/feed": Resp(200, _rss([1, 2])),
    })
    info = feeds.run(s, [{"name": "Uno", "url": "https://a.example/feed",
                          "alternativi": ["https://b.example/feed"], "tema": "politica"}], 45, 12)
    out = json.loads((tmp_path / "news.json").read_text())
    assert info == {"notizie": 2, "feed_non_letti": 0}
    assert {n["tema"] for n in out["notizie"]} == {"politica"}
    assert out["fonti"] == [{"nome": "Uno", "url": "https://a.example/feed", "tema": "politica"}]
    assert s.calls == ["https://a.example/feed", "https://b.example/feed"]


def test_feed_all_urls_fail_is_reported(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    s = MapSession({
        "https://a.example/feed": Resp(403),
        "https://b.example/feed": Resp(404),
        "https://c.example/feed": Resp(200, _rss([1])),
    })
    info = feeds.run(s, [
        {"name": "Uno", "url": "https://a.example/feed", "alternativi": ["https://b.example/feed"]},
        {"name": "Due", "url": "https://c.example/feed"},
    ], 45, 12)
    out = json.loads((tmp_path / "news.json").read_text())
    assert info == {"notizie": 1, "feed_non_letti": 1}
    assert "Uno" in out["errori"]
    assert out["notizie"][0]["tema"] == "altro"


def test_feed_same_link_in_two_feeds_is_kept_once(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    s = MapSession({
        "https://a.example/feed": Resp(200, _rss([1, 2])),
        "https://b.example/feed": Resp(200, _rss([1, 3])),  # "Notizia 0" con lo stesso link di a
    })
    info = feeds.run(s, [
        {"name": "Uno", "url": "https://a.example/feed", "tema": "ricerca"},
        {"name": "Due", "url": "https://b.example/feed", "tema": "prodotti"},
    ], 45, 12)
    out = json.loads((tmp_path / "news.json").read_text())
    links = [n["link"] for n in out["notizie"]]
    assert sorted(links) == ["https://example.org/0", "https://example.org/1"]
    assert info["notizie"] == 2
    first = next(n for n in out["notizie"] if n["link"] == "https://example.org/0")
    assert (first["fonte"], first["tema"]) == ("Uno", "ricerca")  # resta la prima occorrenza


def test_arxiv_waits_30_then_60_seconds_on_server_errors(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    slept = []
    monkeypatch.setattr("time.sleep", lambda s: slept.append(s))
    ok = Resp(200, '<feed xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/">'
                   "<opensearch:totalResults>100</opensearch:totalResults></feed>")
    s = MapSession({arxiv.API: [Resp(500), Resp(500), ok]})
    info = arxiv.run(s, [], date(2026, 10, 15), sleep=0, months=6)
    assert info["chiamate"] == 6
    assert [x for x in slept if x] == [30.0, 60.0]
