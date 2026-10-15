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

    def fake_run(cmd, cwd, check):
        calls.append((cmd, cwd, check))
        out.mkdir()

    bs.build(data, run=fake_run)
    assert sorted(p.name for p in (web / "public" / "data").iterdir()) == ["news.json", "radar.json"]
    assert calls == [(["npm", "run", "build"], web, True)]
    assert (out / ".nojekyll").exists()
