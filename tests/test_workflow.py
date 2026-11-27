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


def test_le_anteprime_delle_competenze_si_fanno_dopo_gli_end_to_end_e_prima_del_caricamento_del_sito():
    # gli end-to-end rifanno la build e svuotano la cartella: prima, le immagini andrebbero perse
    passi = [p.get("name") or p.get("uses") for p in job("aggiorna.yml", "aggiorna")["steps"]]
    anteprime = passi.index("Fai le anteprime delle competenze")
    assert passi.index("Test end-to-end") < anteprime < passi.index("actions/upload-artifact@v7")
    assert "npm run anteprime-competenze" in passo("Fai le anteprime delle competenze")["run"]


def test_le_anteprime_partono_in_ogni_giro_e_se_falliscono_il_sito_esce_lo_stesso():
    anteprime = passo("Fai le anteprime delle competenze")
    assert "if" not in anteprime
    assert anteprime["continue-on-error"] is True
    # l'esito arriva al job finale, che manda il giro in rosso
    assert job("aggiorna.yml", "aggiorna")["outputs"]["anteprime"] == f"${{{{ steps.{anteprime['id']}.outcome }}}}"


def test_l_id_di_umami_arriva_dalla_variabile_del_repository_a_tutto_il_job_compresa_la_build_degli_end_to_end():
    # vars e non secrets: l'ID finisce comunque nell'HTML pubblico. Sul job, la vede anche la build che gli end-to-end rifanno, che è quella pubblicata
    aggiorna = job("aggiorna.yml", "aggiorna")
    assert aggiorna["env"]["AI_RADAR_UMAMI_ID"] == "${{ vars.UMAMI_WEBSITE_ID }}"
    assert all("AI_RADAR_UMAMI_ID" not in p.get("env", {}) for p in aggiorna["steps"])
    assert "npm run e2e" in passo("Test end-to-end")["run"]
    # la build degli end-to-end usa l'ID di prova solo fuori dal workflow, e lo sa da CI, che GitHub dà a ogni job: nessuno lo spegne
    workflow = yaml.safe_load((WORKFLOWS / "aggiorna.yml").read_text(encoding="utf-8"))
    assert all("CI" not in ambiente.get("env", {}) for ambiente in [workflow, aggiorna, *aggiorna["steps"]])


def test_il_commit_dell_edizione_arriva_dopo_gli_end_to_end_e_prima_del_caricamento_del_sito():
    # con gli end-to-end rossi l'edizione non si salva; salvata, esce con il sito che la mostra
    passi = [p.get("name") or p.get("uses") for p in job("aggiorna.yml", "aggiorna")["steps"]]
    salva = passi.index("Salva l'edizione nel repository")
    assert passi.index("Test end-to-end") < salva < passi.index("actions/upload-artifact@v7")


def test_se_la_creazione_dell_edizione_fallisce_dati_e_sito_proseguono():
    edizione = passo("Crea l'edizione")
    assert edizione["continue-on-error"] is True
    # l'esito arriva al job finale, che manda il giro in rosso
    assert job("aggiorna.yml", "aggiorna")["outputs"]["edizione"] == f"${{{{ steps.{edizione['id']}.outcome }}}}"


def test_raccolta_e_salvataggio_dei_dati_non_partono_su_un_push():
    # un push prova il codice e pubblica con i dati già salvati: i dati li raccolgono solo il lunedì e l'avvio manuale
    for nome in ["Raccogli i dati", "Salva i dati nel repository"]:
        assert passo(nome)["if"] == "github.event_name != 'push'", nome


def test_la_casella_dell_avvio_manuale_parte_spenta():
    # un avvio manuale raccoglie i dati e basta: l'edizione si crea solo accendendo la casella
    workflow = yaml.safe_load((WORKFLOWS / "aggiorna.yml").read_text(encoding="utf-8"))
    # per YAML 1.1 la chiave on è il booleano True
    casella = workflow[True]["workflow_dispatch"]["inputs"]["crea_edizione"]
    assert casella["type"] == "boolean"
    assert casella["default"] is False


def test_il_job_finale_dell_edizione_parte_solo_se_la_creazione_e_fallita_e_il_giro_non_e_annullato():
    finale = job("aggiorna.yml", "edizione-non-creata")
    assert finale["if"] == "${{ !cancelled() && needs.aggiorna.outputs.edizione == 'failure' }}"


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


def test_solo_il_salvataggio_dei_dati_ritenta_il_push_dopo_5_e_poi_15_minuti():
    # i dati di un lunedì non si raccolgono una seconda volta; l'edizione si rifà con la casella
    assert "--attese 300,900" in passo("Salva i dati nel repository")["run"]
    assert "--attese" not in passo("Salva l'edizione nel repository")["run"]


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


def installa_chromium(esito_di_npx: int) -> subprocess.CompletedProcess:
    """Il comando vero del passo, con un npx finto: il download non si prova in locale."""
    comando = f"npx() {{ return {esito_di_npx}; }}\n{passo('Installa Chromium')['run']}"
    return subprocess.run([SH, "-c", comando], capture_output=True, text=True, encoding="utf-8")


@pytest.mark.skipif(not SH, reason="serve una shell POSIX")
def test_se_chromium_non_si_installa_il_log_ricorda_la_casella_e_il_giro_resta_rosso():
    # il job finale qui non parte: il passo dell'edizione risulta saltato, non fallito
    giro = installa_chromium(1)
    assert giro.returncode == 1
    assert "::error::" in giro.stdout
    assert "casella" in giro.stdout


@pytest.mark.skipif(not SH, reason="serve una shell POSIX")
def test_se_chromium_si_installa_non_c_e_nessun_errore():
    giro = installa_chromium(0)
    assert giro.returncode == 0
    assert "::error::" not in giro.stdout


def giro_finale(nome: str, esito_del_sito: str) -> subprocess.CompletedProcess:
    """Il passo di un job finale, con una shell come quella del runner e l'esito della pubblicazione che gli dà GitHub."""
    finale = job("aggiorna.yml", nome)["steps"][0]
    assert finale["env"] == {"SITO": "${{ needs.pubblica.result }}"}
    return subprocess.run([SH, "-c", finale["run"]], env={**os.environ, "SITO": esito_del_sito}, capture_output=True, text=True, encoding="utf-8")


def test_il_job_finale_aspetta_la_pubblicazione_per_saperne_l_esito():
    finale = job("aggiorna.yml", "edizione-non-creata")
    assert finale["needs"] == ["aggiorna", "pubblica"]
    assert "!cancelled()" in finale["if"]


@pytest.mark.skipif(not SH, reason="serve una shell POSIX")
def test_col_sito_uscito_il_job_finale_dice_che_dati_e_sito_sono_andati_avanti_e_il_giro_resta_rosso():
    giro = giro_finale("edizione-non-creata", "success")
    assert giro.returncode == 1
    assert "::error::" in giro.stdout
    assert "Dati e sito sono andati avanti" in giro.stdout
    assert "casella" in giro.stdout


@pytest.mark.skipif(not SH, reason="serve una shell POSIX")
@pytest.mark.parametrize("esito", ["failure", "skipped"])
def test_col_sito_non_uscito_il_job_finale_non_dice_che_e_andato_avanti(esito):
    giro = giro_finale("edizione-non-creata", esito)
    assert giro.returncode == 1
    assert "::error::" in giro.stdout
    assert "andati avanti" not in giro.stdout
    assert "non è uscito" in giro.stdout
    assert "casella" in giro.stdout


def test_il_job_finale_delle_anteprime_aspetta_la_pubblicazione_e_parte_solo_se_il_passo_e_fallito():
    finale = job("aggiorna.yml", "anteprime-non-fatte")
    assert finale["needs"] == ["aggiorna", "pubblica"]
    assert finale["if"] == "${{ !cancelled() && needs.aggiorna.outputs.anteprime == 'failure' }}"


@pytest.mark.skipif(not SH, reason="serve una shell POSIX")
def test_col_sito_uscito_il_job_delle_anteprime_dice_che_le_pagine_hanno_l_immagine_della_home_e_il_giro_resta_rosso():
    giro = giro_finale("anteprime-non-fatte", "success")
    assert giro.returncode == 1
    assert "::error::" in giro.stdout
    assert "immagine della home" in giro.stdout
    assert "prossimo giro" in giro.stdout


def test_la_guida_non_e_nel_job_della_raccolta():
    # un link rotto nella guida o un Zensical che non si installa non devono fermare la raccolta del lunedì né l'edizione
    assert "zensical" not in comandi("aggiorna.yml", "aggiorna")
    assert "requirements-guida" not in comandi("aggiorna.yml", "aggiorna")
    assert "needs" not in job("aggiorna.yml", "guida")
    assert "zensical build --strict" in comandi("aggiorna.yml", "guida")


def test_il_sito_della_raccolta_passa_al_job_pagine_con_i_file_nascosti():
    # .nojekyll è un file nascosto, e senza GitHub Pages passerebbe il sito da Jekyll
    caricamento = next(p for p in job("aggiorna.yml", "aggiorna")["steps"] if p.get("uses") == "actions/upload-artifact@v7")
    assert caricamento["with"]["name"] == "sito"
    assert caricamento["with"]["path"] == "_site"
    assert caricamento["with"]["include-hidden-files"] is True


def test_le_pagine_escono_con_la_raccolta_riuscita_anche_senza_la_guida():
    pagine = job("aggiorna.yml", "pagine")
    assert pagine["needs"] == ["aggiorna", "guida"]
    assert pagine["if"] == "${{ !cancelled() && needs.aggiorna.result == 'success' }}"
    scaricamenti = [p for p in pagine["steps"] if p.get("uses") == "actions/download-artifact@v8"]
    assert [(p["with"]["name"], p["with"]["path"], p.get("if")) for p in scaricamenti] == [
        ("sito", "_site", None),
        ("guida", "_site/guida", "needs.guida.result == 'success'"),
    ]
    passi = [p.get("name") or p.get("uses") for p in pagine["steps"]]
    assert passi[-1] == "actions/upload-pages-artifact@v5"
    assert job("aggiorna.yml", "pubblica")["needs"] == "pagine"


@pytest.mark.skipif(not SH, reason="serve una shell POSIX")
def test_senza_la_guida_il_giro_lo_dice_ma_il_sito_esce():
    avviso = next(p for p in job("aggiorna.yml", "pagine")["steps"] if p.get("name") == "Avvisa se la guida manca")
    assert avviso["if"] == "needs.guida.result != 'success'"
    giro = subprocess.run([SH, "-c", avviso["run"]], capture_output=True, text=True, encoding="utf-8")
    assert giro.returncode == 0
    assert "::error::" in giro.stdout
    assert "/guida/" in giro.stdout


BASH = shutil.which("bash")


def indirizzo(file: str, nome_job: str, nome_passo: str, repository: str, tmp_path: Path) -> dict[str, str]:
    """Il passo vero, con le variabili che GitHub dà al runner: restituisce quello che scrive in GITHUB_ENV."""
    passo_ = next(p for p in job(file, nome_job)["steps"] if p.get("name") == nome_passo)
    ambiente = tmp_path / f"{nome_job}.env"
    ambiente.write_text("")
    proprietario = repository.split("/")[0]
    subprocess.run([BASH, "-c", passo_["run"]], check=True, env={**os.environ, "GITHUB_ENV": str(ambiente), "GITHUB_REPOSITORY_OWNER": proprietario, "GITHUB_REPOSITORY": repository})
    return dict(riga.split("=", 1) for riga in ambiente.read_text().splitlines())


@pytest.mark.skipif(not BASH, reason="serve bash, come sul runner")
@pytest.mark.parametrize(("repository", "atteso"), [
    ("SimoneS99/ai-radar", "https://simones99.github.io/ai-radar/guida/"),
    ("SimoneS99/simones99.github.io", "https://simones99.github.io/guida/"),
])
def test_la_guida_sta_in_guida_sotto_lo_stesso_indirizzo_dell_app(repository, atteso, tmp_path):
    # la regola dell'indirizzo base è scritta in due job: se cambia in uno solo, questo test lo vede
    app = indirizzo("aggiorna.yml", "aggiorna", "Ricava l'indirizzo base dal nome del repository", repository, tmp_path)
    guida = indirizzo("aggiorna.yml", "guida", "Ricava l'indirizzo della guida", repository, tmp_path)
    assert guida["AI_RADAR_GUIDA_URL"] == app["AI_RADAR_BASE_URL"] + "guida/" == atteso


def test_i_controlli_provano_la_guida_in_un_job_suo():
    assert "zensical" not in comandi("controlli.yml", "controlli")
    assert "zensical build --strict" in comandi("controlli.yml", "guida")


@pytest.mark.skipif(not SH, reason="serve una shell POSIX")
@pytest.mark.parametrize("esito", ["failure", "skipped"])
def test_col_sito_non_uscito_il_job_delle_anteprime_non_dice_che_le_pagine_sono_uscite(esito):
    giro = giro_finale("anteprime-non-fatte", esito)
    assert giro.returncode == 1
    assert "::error::" in giro.stdout
    assert "immagine della home" not in giro.stdout
    assert "non è uscito" in giro.stdout
