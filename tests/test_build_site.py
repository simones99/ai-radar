"""build_site: copia i dati nell'app e lancia la build."""
from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("build_site", ROOT / "scripts" / "build_site.py")
bs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bs)


def test_build_copies_data_and_runs_vite(tmp_path, monkeypatch):
    data = tmp_path / "data"
    data.mkdir()
    (data / "radar.json").write_text("{}")
    (data / "news.json").write_text("{}")
    (data / "README.md").write_text("non va copiato")
    web = tmp_path / "web"
    (web / "public" / "data").mkdir(parents=True)
    (web / "public" / "data" / "vecchio.json").write_text("{}")
    out = tmp_path / "_site"
    monkeypatch.setattr(bs, "WEB", web)
    monkeypatch.setattr(bs, "OUT", out)
    calls = []

    def fake_run(cmd, cwd, check, env):
        calls.append((cmd, cwd, check, env["AI_RADAR_DATA_DIR"]))
        out.mkdir()

    bs.build(data, run=fake_run)
    assert sorted(p.name for p in (web / "public" / "data").iterdir()) == ["news.json", "radar.json"]
    # Vite legge le pagine statiche dalla stessa cartella da cui vengono i JSON dell'app
    assert calls == [(["npm", "run", "build"], web, True, str(data.resolve()))]
    assert (out / ".nojekyll").exists()


def test_cartella_dei_dati_senza_variabile_e_data(monkeypatch):
    monkeypatch.delenv("AI_RADAR_DATA_DIR", raising=False)
    assert bs.cartella_dei_dati([]) == ROOT / "data"


def test_cartella_dei_dati_segue_la_variabile_come_vite(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    assert bs.cartella_dei_dati([]) == tmp_path


def test_cartella_dei_dati_l_argomento_vince_sulla_variabile(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path / "altrove"))
    assert bs.cartella_dei_dati([str(tmp_path / "copia")]) == tmp_path / "copia"


def test_una_cartella_relativa_arriva_a_vite_assoluta(tmp_path, monkeypatch):
    # npm gira in web/: una cartella relativa alla radice lì vorrebbe dire un'altra cartella
    (tmp_path / "dati").mkdir()
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(bs, "WEB", tmp_path / "web")
    monkeypatch.setattr(bs, "OUT", tmp_path / "_site")
    visti = []

    def fake_run(cmd, cwd, check, env):
        visti.append(env["AI_RADAR_DATA_DIR"])
        (tmp_path / "_site").mkdir()

    bs.build(Path("dati"), run=fake_run)
    assert visti == [str(tmp_path / "dati")]
