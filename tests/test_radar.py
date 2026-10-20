"""Radar 2.0: tendenza, segnali, quadranti, prudenza, GitHub, risorse e configurazione."""
from __future__ import annotations

import json
from datetime import date

import pytest
import requests

from pipeline import common, github_signals, radar, risorse, tendenza
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


def test_config_roles_match_the_approved_table():
    """Tabella approvata il 20/10/2026 (.scratch/ruoli/spec.md, sezione 4.3)."""
    cfg = common.load_yaml("skills.yaml")
    assert cfg["ruoli"] == [{"id": "sviluppo", "nome": "Sviluppo software"}, {"id": "prodotto", "nome": "Prodotto"},
                            {"id": "dati", "nome": "Dati e analisi"}, {"id": "legale", "nome": "Legale e compliance"}]
    approvata = {
        "agenti": {"sviluppo", "prodotto"}, "coding-agenti": {"sviluppo"}, "mcp": {"sviluppo"},
        "rag": {"sviluppo", "prodotto", "dati"}, "valutazione": {"sviluppo", "prodotto", "dati", "legale"},
        "post-training": {"sviluppo", "dati"}, "context-engineering": {"sviluppo", "prodotto", "dati", "legale"},
        "sicurezza": {"sviluppo", "legale"}, "governance": {"prodotto", "legale"}, "dati-per-ai": {"dati", "legale"},
        "text-to-sql": {"dati"}, "vector-db": {"sviluppo", "dati"}, "multimodale": {"sviluppo", "prodotto"},
        "llmops": {"sviluppo"}, "modelli-locali": {"sviluppo"}, "robotica": set(),
    }
    assert {sk["id"]: set(sk.get("ruoli", [])) for sk in cfg["skills"]} == approvata


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
    assert gh["in_crescita"]["mcp"] == [{"nome": "o/new", "url": "https://github.com/o/new", "descrizione": "x" * 199 + "…",
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


# ------------------------------------------------------------------ radar

MONTHS = [f"2025-{m:02d}" for m in range(10, 13)] + [f"2026-{m:02d}" for m in range(1, 10)]  # 12 mesi, fino a settembre
TODAY = date(2026, 10, 15)


def grow(n0: float, g: float, n: int = 12) -> list[int]:
    return [round(n0 * g ** i) for i in range(n)]


def write_inputs(tmp_path, monkeypatch, arxiv: dict, github: dict, jobs: dict | None = None):
    """arXiv con 10.000 paper AI al mese, GitHub con 20.000 repository AI al mese."""
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    common.write_json("arxiv.json", {"mesi": MONTHS, "completo": True, "series": {
        "_totale": dict.fromkeys(MONTHS, 10000), **{k: dict(zip(MONTHS, v)) for k, v in arxiv.items()}}})
    common.write_json("github.json", {"mesi": MONTHS, "base": dict.fromkeys(MONTHS, 20000), "in_crescita": {},
                                      "topics": {k: dict(zip(MONTHS, v)) for k, v in github.items()}})
    common.write_json("jobs.json", jobs or {"snapshots": []})


def snap(day: str, paese: str, n: int, totale: int = 100000, q: str = "x") -> dict:
    return {"data": day, "paese": paese, "totale": totale, "competenze": {"a": n}, "query": {"a": {"what_phrase": q}}}


def run_radar(skills: list[dict]) -> dict:
    radar.run(skills, TODAY)
    return json.loads((common.data_dir() / "radar.json").read_text(encoding="utf-8"))


@pytest.mark.parametrize("s,d,q", [(0.01, 3.0, "impara-ora"), (0.0, 3.0, "consolida"), (0.01, 2.99, "prova"),
                                   (-0.2, 1.0, "osserva"), (None, 5.0, None), (0.3, None, None)])
def test_quadrant_fixed_thresholds(s, d, q):
    assert radar.quadrant(s, d) == q


def test_published_changes_after_two_months():
    assert radar.published(["prova", "impara-ora", "prova", "prova"]) == ["prova"] * 4
    assert radar.published(["osserva", "prova", "prova"]) == ["osserva", "osserva", "prova"]
    assert radar.published([None, "prova", "impara-ora", "impara-ora"]) == [None, "prova", "prova", "impara-ora"]


def test_run_writes_version_2(tmp_path, monkeypatch):
    jobs = {"paesi_ue": ["it"], "snapshots": [snap("2026-10-12", "it", 50), snap("2026-10-12", "us", 20)]}
    write_inputs(tmp_path, monkeypatch, {"a": grow(500, 1.05)}, {"a": grow(2000, 1.05)}, jobs)
    gh = json.loads((tmp_path / "github.json").read_text(encoding="utf-8"))
    gh["in_crescita"] = {"a": [{"nome": "o/r", "url": "https://github.com/o/r", "descrizione": "", "stelle": 9, "creato": "2026-09-01"}]}
    common.write_json("github.json", gh)
    common.write_json("risorse.json", {"link": {"https://morto.example": {"ok": False}}})
    skills = [{"id": "a", "nome": "A", "risorse": [
        {"titolo": "Doc", "url": "https://doc.example", "tipo": "documentazione"},
        {"titolo": "Corso", "url": "https://morto.example", "tipo": "corso", "lingua": "it"}]}]

    out = run_radar(skills)
    assert out["versione"] == 2
    assert out["soglie"] == {"slancio": 0.0, "domanda": 3.0, "rapporto_max": radar.RAPPORTO_MAX}
    r = out["competenze"][0]
    assert r["slancio"] == pytest.approx(1.05 ** 6 - 1, abs=0.02)
    lo, hi = r["slancio_margine"]
    assert lo < r["slancio"] < hi
    assert r["domanda"] == pytest.approx(3.5)  # media tra 5 (it) e 2 (us) ogni 10mila
    assert r["domanda_it"] == pytest.approx(5.0)
    assert r["quadrante"] == r["quadrante_calcolato"] == "impara-ora"
    assert (r["incerto"], r["incerto_perche"]) == (False, None)
    seg = r["segnali"]
    assert seg["arxiv"]["peso"] + seg["github"]["peso"] == pytest.approx(1)
    assert seg["lavoro"]["variazione"] is None  # una sola rilevazione: niente tendenza del lavoro
    assert seg["lavoro"]["rilevazioni"] == [{"data": "2026-10-12", "media": 3.5, "it": 5.0}]
    assert len(seg["github"]["mensile"]) == 12 and seg["github"]["mensile"][0]["base"] == 20000
    assert r["per_iniziare"] == [{"lingua": "en", "titolo": "Doc", "url": "https://doc.example", "tipo": "documentazione"}]
    assert r["in_crescita"][0]["nome"] == "o/r"
    assert r["quadrante_prec"] == "impara-ora" and r["domanda_prec"] is None  # nessuna rilevazione di 28 giorni prima
    st = out["storico"]
    assert [p["mese"] for p in st] == MONTHS[5:]  # un punto per ogni mese con 6 mesi di serie
    assert st[-1]["competenze"]["a"] == {"slancio": r["slancio"], "domanda": 3.5, "calcolato": "impara-ora",
                                         "pubblicato": "impara-ora", "incerto": False}


def test_adding_a_skill_does_not_change_the_others(tmp_path, monkeypatch):
    write_inputs(tmp_path, monkeypatch, {"a": grow(500, 1.05), "b": grow(50, 0.9)},
                 {"a": grow(2000, 1.05), "b": grow(300, 0.95)}, {"snapshots": [snap("2026-10-12", "it", 50)]})
    one = run_radar([{"id": "a", "nome": "A"}])
    two = run_radar([{"id": "a", "nome": "A"}, {"id": "b", "nome": "B"}])
    assert one["competenze"][0] == two["competenze"][0]
    assert [p["competenze"]["a"] for p in one["storico"]] == [p["competenze"]["a"] for p in two["storico"]]


def test_small_noisy_counts_are_uncertain(tmp_path, monkeypatch):
    write_inputs(tmp_path, monkeypatch, {"a": [3, 9, 2, 12, 4, 10, 3, 14, 2, 11, 5, 15]},
                 {"a": [20, 45, 15, 60, 18, 70, 25, 80, 22, 90, 30, 85]})
    r = run_radar([{"id": "a", "nome": "A"}])["competenze"][0]
    assert r["incerto"] is True
    assert "pochi paper (8 al mese)" in r["incerto_perche"]
    assert r["quadrante"] is None  # senza lavoro niente domanda, quindi niente quadrante


def test_job_trend_needs_eight_weeks_with_the_same_query():
    weeks = ["2026-08-03", "2026-08-10", "2026-08-17", "2026-08-24", "2026-08-31", "2026-09-07",
             "2026-09-14", "2026-09-21", "2026-09-28", "2026-10-05", "2026-10-12"]
    rising = radar.jobs_signal({"snapshots": [snap(d, "it", 50 + 5 * i) for i, d in enumerate(weeks)]}, "a")
    assert rising["tendenza"]["pendenza"] > 0
    changed = [snap(d, "it", 50, q="vecchia") for d in weeks[:-4]] + [snap(d, "it", 50) for d in weeks[-4:]]
    sig = radar.jobs_signal({"snapshots": changed}, "a")
    assert sig["tendenza"] is None  # con la ricerca nuova ci sono solo 3 settimane
    assert [x["data"] for x in sig["rilevazioni"]] == weeks[-4:]


def test_incomplete_arxiv_is_ignored(tmp_path, monkeypatch):
    write_inputs(tmp_path, monkeypatch, {"a": grow(500, 1.3)}, {"a": grow(2000, 1.0)})
    with_arxiv = run_radar([{"id": "a", "nome": "A"}])["competenze"][0]["slancio"]
    arx = json.loads((tmp_path / "arxiv.json").read_text(encoding="utf-8"))
    common.write_json("arxiv.json", {**arx, "completo": False})
    r = run_radar([{"id": "a", "nome": "A"}])["competenze"][0]
    assert r["segnali"]["arxiv"] is None
    assert r["slancio"] != with_arxiv


def test_github_without_base_is_ignored(tmp_path, monkeypatch):
    write_inputs(tmp_path, monkeypatch, {}, {"a": grow(2000, 1.1)})
    gh = json.loads((tmp_path / "github.json").read_text(encoding="utf-8"))
    del gh["base"]
    common.write_json("github.json", gh)
    with pytest.raises(ValueError, match="radar vuoto"):
        run_radar([{"id": "a", "nome": "A"}])


def test_corrupt_risorse_file_keeps_all_resources(tmp_path, monkeypatch):
    write_inputs(tmp_path, monkeypatch, {"a": grow(500, 1.05)}, {"a": grow(2000, 1.05)})
    (tmp_path / "risorse.json").write_text("non è JSON {", encoding="utf-8")
    skills = [{"id": "a", "nome": "A", "risorse": [
        {"titolo": "Doc", "url": "https://doc.example", "tipo": "documentazione"},
        {"titolo": "Corso", "url": "https://corso.example", "tipo": "corso"}]}]
    r = run_radar(skills)["competenze"][0]
    assert [x["url"] for x in r["per_iniziare"]] == ["https://doc.example", "https://corso.example"]


def test_months_aligned_between_sources(tmp_path, monkeypatch):
    write_inputs(tmp_path, monkeypatch, {"a": grow(500, 1.05)}, {"a": grow(2000, 1.05)})
    arx = json.loads((tmp_path / "arxiv.json").read_text(encoding="utf-8"))
    arx["mesi"] = ["2025-09"] + MONTHS[:-1]  # stessa lunghezza di GitHub ma un mese prima: ad agosto
    arx["series"]["_totale"]["2025-09"] = 10000
    arx["series"]["a"]["2025-09"] = 500
    common.write_json("arxiv.json", arx)
    st = run_radar([{"id": "a", "nome": "A"}])["storico"]
    assert [p["mese"] for p in st[-2:]] == ["2026-08", "2026-09"]


def test_old_country_is_not_in_demand(tmp_path, monkeypatch):
    jobs = {"snapshots": [snap("2025-10-10", "de", 90), snap("2026-10-12", "it", 50)]}
    write_inputs(tmp_path, monkeypatch, {"a": grow(500, 1.05)}, {"a": grow(2000, 1.05)}, jobs)
    r = run_radar([{"id": "a", "nome": "A"}])["competenze"][0]
    assert r["domanda"] == pytest.approx(5.0)
    assert list(r["segnali"]["lavoro"]["ogni_10mila"]) == ["it"]


def test_breve_and_plurale_in_output(tmp_path, monkeypatch):
    write_inputs(tmp_path, monkeypatch, {"a": grow(500, 1.05), "b": grow(500, 1.05)}, {"a": grow(2000, 1.05), "b": grow(2000, 1.05)})
    rows = run_radar([{"id": "a", "nome": "Alfa"}, {"id": "b", "nome": "Beta", "breve": "B", "plurale": True}])["competenze"]
    assert (rows[0]["breve"], rows[0]["plurale"]) == ("Alfa", False)
    assert (rows[1]["breve"], rows[1]["plurale"]) == ("B", True)


RUOLI = [{"id": "x", "nome": "Ruolo X"}, {"id": "y", "nome": "Ruolo Y"}]


def five_skills(tmp_path, monkeypatch, ruoli: dict[str, list[str]] | None = None) -> list[dict]:
    ids = "abcde"
    write_inputs(tmp_path, monkeypatch, {i: grow(500, 1.02 + 0.01 * n) for n, i in enumerate(ids)},
                 {i: grow(2000, 1.03) for i in ids}, {"snapshots": [snap("2026-10-12", "it", 50)]})
    return [{"id": i, "nome": i.upper(), **({"ruoli": ruoli[i]} if ruoli and i in ruoli else {})} for i in ids]


def test_roles_go_to_radar_json_without_changing_numbers(tmp_path, monkeypatch):
    legami = {"a": ["x", "y"], "b": ["x", "y"], "c": ["x", "y"], "d": ["x", "y"]}  # e: nessun ruolo
    plain = run_radar(five_skills(tmp_path, monkeypatch))
    radar.run(five_skills(tmp_path, monkeypatch, legami), TODAY, RUOLI)
    out = json.loads((common.data_dir() / "radar.json").read_text(encoding="utf-8"))

    assert out["ruoli"] == RUOLI
    assert [r["ruoli"] for r in out["competenze"]] == [["x", "y"]] * 4 + [[]]
    def senza(rows: list[dict]) -> list[dict]:
        return [{k: v for k, v in r.items() if k != "ruoli"} for r in rows]

    assert senza(out["competenze"]) == senza(plain["competenze"])
    assert out["storico"] == plain["storico"]
    assert plain["ruoli"] == [] and all(r["ruoli"] == [] for r in plain["competenze"])


def test_unknown_role_stops_the_radar(tmp_path, monkeypatch):
    legami = {i: ["x", "y"] for i in "abcd"} | {"e": ["z"]}
    with pytest.raises(ValueError, match=r"e.*ruolo sconosciuto.*z"):
        radar.run(five_skills(tmp_path, monkeypatch, legami), TODAY, RUOLI)
    assert not (common.data_dir() / "radar.json").exists()


def test_role_with_fewer_than_four_skills_stops_the_radar(tmp_path, monkeypatch):
    legami = {i: ["x"] for i in "abcd"} | {"e": ["y"]}
    with pytest.raises(ValueError, match=r"Ruolo Y.*1 competenz.*almeno 4"):
        radar.run(five_skills(tmp_path, monkeypatch, legami), TODAY, RUOLI)


def test_empty_roles_in_yaml_are_no_roles(tmp_path, monkeypatch):
    """«ruoli:» lasciato vuoto in skills.yaml arriva come None, nell'elenco o in una competenza."""
    skills = five_skills(tmp_path, monkeypatch)
    skills[0]["ruoli"] = None
    radar.run(skills, TODAY, None)
    out = json.loads((common.data_dir() / "radar.json").read_text(encoding="utf-8"))
    assert out["ruoli"] == [] and out["competenze"][0]["ruoli"] == []


def test_weekly_jobs_give_previous_demand_and_history(tmp_path, monkeypatch):
    start = date(2026, 7, 6)
    days = [(start.toordinal() + 7 * i) for i in range(14)]
    jobs = {"snapshots": [snap(date.fromordinal(d).isoformat(), "it", 50 + i) for i, d in enumerate(days)]}
    write_inputs(tmp_path, monkeypatch, {"a": grow(500, 1.05)}, {"a": grow(2000, 1.05)}, jobs)
    out = run_radar([{"id": "a", "nome": "A"}])
    r = out["competenze"][0]
    assert r["domanda_prec"] == pytest.approx(5.9)  # ultima rilevazione 5/10, limite 7/9: 59 annunci su 100mila
    assert out["storico"][-1]["competenze"]["a"]["domanda"] is not None
    assert out["storico"][-2]["competenze"]["a"]["domanda"] is not None
