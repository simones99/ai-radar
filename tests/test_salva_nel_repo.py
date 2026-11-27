"""salva_nel_repo: commit, rebase e push di ciò che un giro ha scritto, su un repository vero in una cartella temporanea."""
from __future__ import annotations

import importlib.util
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


def salva(cartella: Path, percorso: str, messaggio: str, *opzioni: str) -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, str(SCRIPT), percorso, messaggio, *opzioni], cwd=cartella, env={**os.environ, "GITHUB_REF_NAME": "main"}, capture_output=True, text=True, encoding="utf-8", errors="replace")


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


def rifiuta_i_primi_push(tmp_path: Path, quanti: int) -> None:
    """Origin rifiuta i primi push, come GitHub quando non risponde, e poi li accetta."""
    conta = (tmp_path / "push-arrivati").as_posix()
    hook = tmp_path / "origin.git" / "hooks" / "pre-receive"
    hook.write_text(f'#!/bin/sh\nn=$(( $(cat "{conta}" 2>/dev/null || echo 0) + 1 ))\necho "$n" > "{conta}"\n[ "$n" -gt {quanti} ]\n', newline="\n")
    hook.chmod(0o755)


def salva_aspettando(cartella: Path, monkeypatch, *argomenti: str) -> tuple[int, list[float]]:
    """Il comando vero, nel processo del test, con uno sleep finto che annota quanto avrebbe aspettato invece di aspettare."""
    specifica = importlib.util.spec_from_file_location("salva_nel_repo", SCRIPT)
    script = importlib.util.module_from_spec(specifica)
    specifica.loader.exec_module(script)
    attese: list[float] = []
    monkeypatch.setattr(script.time, "sleep", attese.append)
    monkeypatch.chdir(cartella)
    monkeypatch.setenv("GITHUB_REF_NAME", "main")
    return script.main(list(argomenti)), attese


def dati_nuovi(repo: Path, contenuto: str = "{}") -> None:
    (repo / "data").mkdir(exist_ok=True)
    (repo / "data" / "a.json").write_text(contenuto)


def test_con_le_attese_un_push_rifiutato_si_ritenta_dopo_5_e_poi_15_minuti_e_i_dati_arrivano_una_volta(repo, tmp_path, monkeypatch, capsys):
    # il passo dei dati: un guasto di GitHub che dura qualche minuto non deve far perdere la raccolta del lunedì
    rifiuta_i_primi_push(tmp_path, 2)
    dati_nuovi(repo)
    esito, attese = salva_aspettando(repo, monkeypatch, "data", "Dati", "--attese", "300,900")
    assert esito == 0
    assert attese == [300, 900]
    assert su_origin(repo, "%s") == ["Dati", "Primo"]
    avvisi = [r for r in capsys.readouterr().out.splitlines() if r.startswith("::warning::")]
    assert len(avvisi) == 2
    assert avvisi[0].endswith("al tentativo 1 di 3: riprovo fra 5 minuti.")
    assert avvisi[1].endswith("al tentativo 2 di 3: riprovo fra 15 minuti.")


def test_con_le_attese_dopo_tre_push_rifiutati_esce_con_un_errore_senza_aspettare_ancora(repo, tmp_path, monkeypatch, capsys):
    rifiuta_i_primi_push(tmp_path, 3)
    dati_nuovi(repo)
    esito, attese = salva_aspettando(repo, monkeypatch, "data", "Dati", "--attese", "300,900")
    assert esito == 1
    assert attese == [300, 900]
    assert su_origin(repo, "%s") == ["Primo"]
    assert "Non salvato" in capsys.readouterr().err


def test_un_conflitto_non_si_ritenta_e_lascia_il_repository_fuori_dal_rebase(repo, tmp_path, monkeypatch, capsys):
    # il 27 ott 2026 un push aveva cambiato gli stessi file di dati: aspettare non risolve un conflitto
    altro = tmp_path / "altro"
    git(tmp_path, "clone", str(tmp_path / "origin.git"), str(altro))
    dati_nuovi(altro, '{"da": "altro"}')
    git(altro, "add", ".")
    git(altro, "-c", "user.name=Autore", "-c", "user.email=autore@esempio.org", "commit", "-m", "Dati da un altro clone")
    git(altro, "push", "origin", "HEAD:main")

    dati_nuovi(repo, '{"da": "giro"}')
    esito, attese = salva_aspettando(repo, monkeypatch, "data", "Dati", "--attese", "300,900")
    assert esito == 1
    assert attese == []
    assert "conflitto" in capsys.readouterr().err
    # di nuovo sul ramo, con il commit del giro e nessun file a metà
    assert git(repo, "branch", "--show-current").strip() == "main"
    assert git(repo, "status", "--porcelain") == ""
    assert su_origin(repo, "%s") == ["Dati da un altro clone", "Primo"]


def test_senza_attese_un_push_rifiutato_non_si_ritenta(repo, tmp_path, monkeypatch):
    # il passo dell'edizione: un tentativo solo, come prima
    rifiuta_i_primi_push(tmp_path, 1)
    dati_nuovi(repo)
    esito, attese = salva_aspettando(repo, monkeypatch, "data", "Dati")
    assert esito == 1
    assert attese == []
    assert su_origin(repo, "%s") == ["Primo"]


def test_le_attese_arrivano_dalla_riga_di_comando(repo, tmp_path):
    # il comando com'è nel workflow, in un processo suo: con attese di zero secondi il secondo tentativo passa
    rifiuta_i_primi_push(tmp_path, 1)
    dati_nuovi(repo)
    giro = salva(repo, "data", "Dati", "--attese", "0,0")
    assert giro.returncode == 0, giro.stderr
    assert su_origin(repo, "%s") == ["Dati", "Primo"]
