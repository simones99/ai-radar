"""salva_nel_repo: commit, rebase e push di ciò che un giro ha scritto, su un repository vero in una cartella temporanea."""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "salva_nel_repo.py"


@pytest.fixture
def repo(tmp_path, monkeypatch):
    """Un clone senza nessuna identità git, come il runner prima di qualunque passo, e il suo origin."""
    vuoto = tmp_path / "gitconfig-vuoto"
    vuoto.write_text("")
    monkeypatch.setenv("GIT_CONFIG_GLOBAL", str(vuoto))
    monkeypatch.setenv("GIT_CONFIG_NOSYSTEM", "1")
    origin = tmp_path / "origin.git"
    git(tmp_path, "init", "--bare", "-b", "main", str(origin))
    clone = tmp_path / "clone"
    git(tmp_path, "clone", str(origin), str(clone))
    # il primo commit, con un'altra identità solo per questo comando
    (clone / "LEGGIMI").write_text("x")
    git(clone, "add", ".")
    git(clone, "-c", "user.name=Autore", "-c", "user.email=autore@esempio.org", "commit", "-m", "Primo")
    git(clone, "push", "origin", "HEAD:main")
    return clone


def git(cartella: Path, *argomenti: str) -> str:
    return subprocess.run(["git", *argomenti], cwd=cartella, check=True, capture_output=True, text=True, encoding="utf-8").stdout


def salva(cartella: Path, percorso: str, messaggio: str) -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, str(SCRIPT), percorso, messaggio], cwd=cartella, env={**os.environ, "GITHUB_REF_NAME": "main"}, capture_output=True, text=True, encoding="utf-8", errors="replace")


def su_origin(cartella: Path, formato: str) -> list[str]:
    git(cartella, "fetch", "origin")
    return git(cartella, "log", f"--format={formato}", "origin/main").splitlines()


def test_salva_tutto_il_percorso_in_un_commit_con_il_suo_messaggio_e_lo_manda_a_origin(repo):
    (repo / "data" / "edizioni").mkdir(parents=True)
    (repo / "data" / "edizioni" / "2026-11-02.json").write_text("{}")
    (repo / "data" / "edizioni" / "2026-11-02.png").write_text("png")
    giro = salva(repo, "data/edizioni", "Edizione del 2026-11-02")
    assert giro.returncode == 0, giro.stderr
    assert su_origin(repo, "%s") == ["Edizione del 2026-11-02", "Primo"]
    assert sorted(git(repo, "show", "--name-only", "--format=", "origin/main").splitlines()) == ["data/edizioni/2026-11-02.json", "data/edizioni/2026-11-02.png"]


def test_l_identita_non_dipende_da_nessun_altro_passo(repo):
    (repo / "data").mkdir()
    (repo / "data" / "a.json").write_text("{}")
    assert salva(repo, "data", "Dati").returncode == 0
    assert su_origin(repo, "%an <%ae>")[0] == "github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>"


def test_lascia_fuori_cio_che_sta_fuori_dal_percorso(repo):
    (repo / "data").mkdir()
    (repo / "data" / "a.json").write_text("{}")
    (repo / "altro.txt").write_text("resta qui")
    assert salva(repo, "data", "Dati").returncode == 0
    assert git(repo, "show", "--name-only", "--format=", "origin/main").splitlines() == ["data/a.json"]


def test_senza_niente_di_nuovo_non_fa_commit_e_non_e_un_errore(repo):
    giro = salva(repo, "LEGGIMI", "Non deve esistere")
    assert giro.returncode == 0, giro.stderr
    assert "Niente di nuovo" in giro.stdout
    assert su_origin(repo, "%s") == ["Primo"]


def test_un_push_arrivato_nel_frattempo_resta_sotto(repo, tmp_path):
    altro = tmp_path / "altro"
    git(tmp_path, "clone", str(tmp_path / "origin.git"), str(altro))
    (altro / "web.txt").write_text("push arrivato durante il giro")
    git(altro, "add", ".")
    git(altro, "-c", "user.name=Autore", "-c", "user.email=autore@esempio.org", "commit", "-m", "Push nel frattempo")
    git(altro, "push", "origin", "HEAD:main")

    (repo / "data").mkdir()
    (repo / "data" / "a.json").write_text("{}")
    giro = salva(repo, "data", "Dati")
    assert giro.returncode == 0, giro.stderr
    assert su_origin(repo, "%s") == ["Dati", "Push nel frattempo", "Primo"]


def test_se_il_push_non_riesce_esce_con_un_errore(repo):
    (repo / "data").mkdir()
    (repo / "data" / "a.json").write_text("{}")
    git(repo, "remote", "set-url", "origin", str(repo / "non-esiste.git"))
    giro = salva(repo, "data", "Dati")
    assert giro.returncode != 0
    assert giro.stderr != ""
