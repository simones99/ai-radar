"""I workflow: GitHub Actions non si prova in locale, ma l'ordine dei passi si legge dal file."""
from __future__ import annotations

from pathlib import Path

import yaml

WORKFLOWS = Path(__file__).resolve().parents[1] / ".github" / "workflows"


def job(file: str, nome: str) -> dict:
    return yaml.safe_load((WORKFLOWS / file).read_text(encoding="utf-8"))["jobs"][nome]


def nomi_dei_passi() -> list[str]:
    return [p["name"] for p in job("aggiorna.yml", "aggiorna")["steps"] if "name" in p]


def comandi(file: str, nome: str) -> str:
    return "\n".join(p.get("run", "") for p in job(file, nome)["steps"])


def test_chromium_arriva_dopo_la_raccolta_e_il_salvataggio_dei_dati():
    # un download fallito non deve poter fermare la raccolta del lunedì: i dati a quel punto sono già salvati
    passi = nomi_dei_passi()
    attesi = ["Test della pipeline", "Test dell'app", "Raccogli i dati", "Salva i dati nel repository", "Installa Chromium", "Crea l'edizione", "Prepara il sito", "Test end-to-end"]
    assert [p for p in passi if p in attesi] == attesi


def test_i_test_prima_della_raccolta_non_usano_il_browser():
    passo = next(p for p in job("aggiorna.yml", "aggiorna")["steps"] if p.get("name") == "Test dell'app")
    assert "npm test" in passo["run"]
    assert "test:browser" not in passo["run"]


def test_i_test_con_il_browser_girano_con_gli_end_to_end():
    passo = next(p for p in job("aggiorna.yml", "aggiorna")["steps"] if p.get("name") == "Test end-to-end")
    assert "npm run test:browser" in passo["run"]
    assert "npm run e2e" in passo["run"]


def test_i_controlli_sui_rami_non_scaricano_il_browser():
    assert "playwright" not in comandi("controlli.yml", "controlli")
    assert "test:browser" not in comandi("controlli.yml", "controlli")
