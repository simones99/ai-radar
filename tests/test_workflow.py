"""I workflow: GitHub Actions non si prova in locale, ma l'ordine dei passi si legge dal file e i comandi si possono lanciare."""
from __future__ import annotations

import os
import shutil
import subprocess
from pathlib import Path

import pytest
import yaml

WORKFLOWS = Path(__file__).resolve().parents[1] / ".github" / "workflows"
SH = shutil.which("sh")


def job(file: str, nome: str) -> dict:
    return yaml.safe_load((WORKFLOWS / file).read_text(encoding="utf-8"))["jobs"][nome]


def passo(nome: str) -> dict:
    return next(p for p in job("aggiorna.yml", "aggiorna")["steps"] if p.get("name") == nome)


def comandi(file: str, nome: str) -> str:
    return "\n".join(p.get("run", "") for p in job(file, nome)["steps"])


def test_chromium_arriva_dopo_la_raccolta_e_il_salvataggio_dei_dati():
    # un download fallito non deve poter fermare la raccolta del lunedì: i dati a quel punto sono già salvati
    passi = [p["name"] for p in job("aggiorna.yml", "aggiorna")["steps"] if "name" in p]
    attesi = ["Test della pipeline", "Test dell'app", "Raccogli i dati", "Salva i dati nel repository", "Installa Chromium", "Crea l'edizione", "Prepara il sito", "Test end-to-end"]
    assert [p for p in passi if p in attesi] == attesi


def test_i_test_prima_della_raccolta_non_usano_il_browser():
    assert "npm test" in passo("Test dell'app")["run"]
    assert "test:browser" not in passo("Test dell'app")["run"]


def test_i_test_con_il_browser_girano_con_gli_end_to_end():
    assert "npm run test:browser" in passo("Test end-to-end")["run"]
    assert "npm run e2e" in passo("Test end-to-end")["run"]


def test_i_controlli_sui_rami_non_scaricano_il_browser():
    assert "playwright" not in comandi("controlli.yml", "controlli")
    assert "test:browser" not in comandi("controlli.yml", "controlli")


def test_i_due_salvataggi_passano_dallo_stesso_comando():
    assert "scripts/salva_nel_repo.py data " in passo("Salva i dati nel repository")["run"]
    assert "scripts/salva_nel_repo.py data/edizioni " in passo("Salva l'edizione nel repository")["run"]


def test_il_commit_dell_edizione_usa_la_sua_settimana_e_si_salva_solo_se_e_stata_creata():
    salva = passo("Salva l'edizione nel repository")
    assert salva["if"] == "steps.edizione.outputs.settimana != ''"
    assert salva["env"]["SETTIMANA"] == "${{ steps.edizione.outputs.settimana }}"
    assert '"Edizione del $SETTIMANA"' in salva["run"]
    assert "date" not in salva["run"]


@pytest.mark.skipif(not SH, reason="serve una shell POSIX")
def test_se_il_salvataggio_dell_edizione_fallisce_il_log_spiega_il_rimedio(tmp_path):
    # in una cartella senza lo script: il comando fallisce davvero
    giro = subprocess.run([SH, "-c", passo("Salva l'edizione nel repository")["run"]], cwd=tmp_path, env={**os.environ, "SETTIMANA": "2026-11-02"}, capture_output=True, text=True, encoding="utf-8")
    assert giro.returncode == 1
    assert "::error::" in giro.stdout
    assert "2026-11-02" in giro.stdout
    assert "casella" in giro.stdout


def giro_finale(esito_del_sito: str) -> subprocess.CompletedProcess:
    """Il passo del job finale, con una shell come quella del runner e l'esito della pubblicazione che gli dà GitHub."""
    finale = job("aggiorna.yml", "edizione-non-creata")["steps"][0]
    assert finale["env"] == {"SITO": "${{ needs.pubblica.result }}"}
    return subprocess.run([SH, "-c", finale["run"]], env={**os.environ, "SITO": esito_del_sito}, capture_output=True, text=True, encoding="utf-8")


def test_il_job_finale_aspetta_la_pubblicazione_per_saperne_l_esito():
    finale = job("aggiorna.yml", "edizione-non-creata")
    assert finale["needs"] == ["aggiorna", "pubblica"]
    assert "!cancelled()" in finale["if"]


@pytest.mark.skipif(not SH, reason="serve una shell POSIX")
def test_col_sito_uscito_il_job_finale_dice_che_dati_e_sito_sono_andati_avanti_e_il_giro_resta_rosso():
    giro = giro_finale("success")
    assert giro.returncode == 1
    assert "::error::" in giro.stdout
    assert "Dati e sito sono andati avanti" in giro.stdout
    assert "casella" in giro.stdout


@pytest.mark.skipif(not SH, reason="serve una shell POSIX")
@pytest.mark.parametrize("esito", ["failure", "skipped"])
def test_col_sito_non_uscito_il_job_finale_non_dice_che_e_andato_avanti(esito):
    giro = giro_finale(esito)
    assert giro.returncode == 1
    assert "::error::" in giro.stdout
    assert "andati avanti" not in giro.stdout
    assert "non è uscito" in giro.stdout
    assert "casella" in giro.stdout
