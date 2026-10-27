"""Passo geopoliticai con i CSV veri di Epoch, registrati il 23 ottobre 2026 (nessuna chiamata di rete).

Dei file restano solo le colonne che il passo legge: tests/fixtures/epoch_large_scale.csv, epoch_eci.csv ed
epoch_data_centers.csv (Epoch AI, «AI data centers», CC BY 4.0, registrato il 26 ottobre 2026). Della pagina della
mappa di Epoch, epoch_mappa_data_center.html, registrata lo stesso giorno, restano l'isola di Astro con i siti, solo
con `id` e `lngLat`, e un'altra isola da ignorare. In epoch_eci.csv le colonne dell'intervallo (`eci_ci_low`, `eci_ci_high`)
sono state aggiunte il 27 ottobre 2026 dal file di quel giorno, che aveva gli stessi ECI.
"""
from __future__ import annotations

import csv
import io
import json
import logging
import re
from datetime import date
from pathlib import Path

import pytest

from pipeline import geopoliticai

FIX = Path(__file__).parent / "fixtures"
LARGE = (FIX / "epoch_large_scale.csv").read_text(encoding="utf-8")
ECI = (FIX / "epoch_eci.csv").read_text(encoding="utf-8")
DC = (FIX / "epoch_data_centers.csv").read_text(encoding="utf-8")
MAPPA = (FIX / "epoch_mappa_data_center.html").read_text(encoding="utf-8")
TODAY = date(2026, 10, 23)


class Resp:
    def __init__(self, text, status=200):
        self.status_code, self.headers, self.text = status, {}, text

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")

    def json(self):
        return json.loads(self.text)


class Session:
    """Epoch e Nominatim registrati. `luoghi`: indirizzo → [lat, lon] che Nominatim trova; gli altri non li trova."""

    def __init__(self, large=LARGE, eci=ECI, dc=DC, mappa=MAPPA, status=200, status_dc=200, status_mappa=200, luoghi=None):
        self.large, self.eci, self.dc, self.mappa, self.luoghi = large, eci, dc, mappa, luoghi or {}
        self.status, self.status_dc, self.status_mappa = status, status_dc, status_mappa
        self.calls, self.nominatim = [], []

    def get(self, url, params=None, headers=None, timeout=None):
        self.calls.append(url)
        if "nominatim" in url:
            self.nominatim.append((params, headers))
            luogo = self.luoghi.get(params["q"])
            return Resp(json.dumps([{"lat": str(luogo[0]), "lon": str(luogo[1])}] if luogo else []))
        if "ai-data-centers/map" in url:
            return Resp(self.mappa, self.status_mappa)
        if "data_centers" in url:
            return Resp(self.dc, self.status_dc)
        return Resp(self.large if "large_scale" in url else self.eci, self.status)


@pytest.fixture
def data_dir(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_RADAR_DATA_DIR", str(tmp_path))
    monkeypatch.setattr("time.sleep", lambda *_: None)
    return tmp_path


def run(data_dir, session=None):
    geopoliticai.run(session or Session(), TODAY)
    return json.loads((data_dir / "geopoliticai.json").read_text(encoding="utf-8"))


def con_righe(text: str, righe: list[dict]) -> str:
    """Il CSV registrato con qualche riga in più, per i casi che i dati veri di oggi non hanno."""
    head = next(csv.reader(io.StringIO(text)))
    out = io.StringIO()
    w = csv.DictWriter(out, fieldnames=head, lineterminator="\n")
    w.writerows({c: r.get(c, "") for c in head} for r in righe)
    return text + out.getvalue()


def large(modello, paese, flop="", anno="2025", org="Org"):
    return {"Model": modello, "Organization": org, "Publication date": f"{anno}-06-01",
            "Country (of organization)": paese, "Training compute (FLOP)": flop}


def test_legge_i_csv_registrati(data_dir):
    out = run(data_dir)
    assert out["scaricato"] == "2026-10-23" and out["anno_corrente"] == 2026
    zone = out["zone"]
    assert list(zone)[:5] == ["usa", "cina", "ue", "uk", "altri"]
    ue = zone["ue"]
    assert ue["eci"]["2026"] == {"n": 2, "max": 150.03, "modello": "Mistral Large 4"}
    assert ue["calcolo"]["2025"] == {"n": 5, "nc": 3, "max": 1.152e24, "modello": "Mistral Small 3"}
    assert "2026" not in ue["calcolo"]
    assert ue["org_eci"] == ["Mistral AI"]
    assert (ue["aggettivo"], ue["con_articolo"]) == ("europeo", "l'UE")
    assert zone["usa"]["eci"]["2026"]["modello"] == "Claude Opus 5.5"
    assert zone["cina"]["eci"]["2026"]["modello"] == "Kimi K3"
    assert zone["francia"]["eci"]["2026"]["modello"] == "Mistral Large 4"
    assert out["senza_paese"]["large"] == ["Poro 34B"]
    assert len(out["senza_paese"]["eci"]) == 17
    assert next(iter(out["altri_paesi"])) == "South Korea"


def test_italia_sempre_e_paesi_ue_solo_con_modelli(data_dir):
    zone = run(data_dir)["zone"]
    assert zone["italia"]["tipo"] == "paese-ue"
    assert zone["italia"]["calcolo"] == {} and zone["italia"]["eci"] == {}
    assert {k for k, z in zone.items() if z["tipo"] == "paese-ue"} == {"bulgaria", "finlandia", "francia", "germania", "italia"}


def test_conta_solo_la_prima_organizzazione(data_dir):
    righe = [large("Comune", "United States of America,France", "9e26", org="Meta AI,Meta Paris")]
    zone = run(data_dir, Session(large=con_righe(LARGE, righe)))["zone"]
    assert zone["usa"]["calcolo"]["2025"]["max"] == 9e26
    assert zone["ue"]["calcolo"]["2025"]["n"] == 5
    assert zone["francia"]["calcolo"]["2025"]["n"] == 3


def test_aggettivo_di_ogni_zona(data_dir):
    zone = run(data_dir)["zone"]
    assert {k: z["aggettivo"] for k, z in zone.items()} == {
        "usa": "statunitense", "cina": "cinese", "ue": "europeo", "uk": "britannico", "altri": None,
        "bulgaria": "bulgaro", "finlandia": "finlandese", "francia": "francese", "germania": "tedesco", "italia": "italiano",
    }


def test_contano_altrove_i_modelli_con_la_prima_organizzazione_di_un_altro_paese(data_dir):
    # oggi 28 modelli di grande scala con un'organizzazione UE: 5 contano per gli USA, 1 per «Altri», Poro 34B è senza Paese
    zone = run(data_dir)["zone"]
    assert zone["ue"]["contano_altrove"] == 7
    assert zone["francia"]["contano_altrove"] == 5
    assert zone["finlandia"]["contano_altrove"] == 1
    assert zone["usa"]["contano_altrove"] == 0
    assert zone["italia"]["contano_altrove"] == 0
    # per un Paese UE conta anche un modello che resta nell'UE ma con la prima organizzazione di un altro Paese
    righe = [large("Insieme", "Germany,Italy", "1e24", org="Aleph Alpha,Sapienza")]
    zone = run(data_dir, Session(large=con_righe(LARGE, righe)))["zone"]
    assert zone["italia"]["contano_altrove"] == 1
    assert zone["germania"]["contano_altrove"] == 0
    assert zone["ue"]["contano_altrove"] == 7


def test_paesi_della_mappa_di_ogni_zona(data_dir):
    zone = run(data_dir)["zone"]
    assert zone["usa"]["paesi_mappa"] == ["USA"]
    assert zone["cina"]["paesi_mappa"] == ["CHN"]
    assert zone["uk"]["paesi_mappa"] == ["GBR"]
    assert zone["francia"]["paesi_mappa"] == ["FRA"]
    assert zone["italia"]["paesi_mappa"] == ["ITA"]
    ue = zone["ue"]["paesi_mappa"]
    assert len(ue) == 27 and {"ITA", "FRA", "DEU", "CZE", "NLD"} <= set(ue)
    assert zone["altri"]["paesi_mappa"] == []  # «Altri» è tutto il resto


def eci(modello, paese, valore, anno="2025"):
    return {"Model": modello, "Display name": modello, "eci": valore, "date": f"{anno}-06-01", "Organization": "Org",
            "Country (of organization)": paese}


def test_eci_paesi_dell_ultimo_anno_chiuso(data_dir):
    # nel 2025 l'ECI valuta modelli di tre Paesi soltanto, contati per la prima organizzazione
    out = run(data_dir)
    assert out["eci_paesi"] == {"anno": 2025, "valori": {
        "USA": {"max": 156.33, "modello": "GPT-5.2 Pro"},
        "CHN": {"max": 146.09, "modello": "DeepSeek-V3.2"},
        "FRA": {"max": 134.02, "modello": "Mistral Medium 3"},
    }}


def test_eci_paesi_con_i_codici_della_mappa(data_dir):
    righe = [eci("HK", "Hong Kong", "150"), eci("TW", "Taiwan", "120"), eci("KR", "South Korea,United States of America", "125"),
             eci("Vecchio", "Japan", "140", anno="2024"), eci("Nuovo", "Japan", "141", anno="2026"), eci("Senza", "", "160")]
    valori = run(data_dir, Session(eci=con_righe(ECI, righe)))["eci_paesi"]["valori"]
    assert valori["CHN"] == {"max": 150.0, "modello": "HK"}
    assert valori["TWN"] == {"max": 120.0, "modello": "TW"}
    assert valori["KOR"] == {"max": 125.0, "modello": "KR"}
    assert "HKG" not in valori and "JPN" not in valori
    assert valori["USA"]["modello"] == "GPT-5.2 Pro"


def test_capacita_dei_modelli_con_i_record(data_dir):
    punti = run(data_dir)["punti_eci"]
    assert len(punti) == 270 and punti[0]["d"] == "2023-02-24"
    record = [p for p in punti if p["r"]]
    assert [p["m"] for p in record[-3:]] == ["Claude Fable 5.1", "GPT-6 Astra", "Claude Opus 5.5"]
    assert record[-1] == {"m": "Claude Opus 5.5", "d": "2026-09-22", "v": 168.83, "lo": 165.25, "hi": 173.95, "r": True}


def test_record_solo_chi_supera_tutti_quelli_usciti_prima(data_dir):
    def riga(modello, valore, giorno, paese="United States of America"):
        return {**eci(modello, paese, valore), "date": giorno}
    righe = [riga("Pari", "168.83", "2026-10-01"), riga("Alto", "170", "2026-10-02"), riga("Altissimo", "171", "2026-10-02"),
             riga("Senza Paese", "172", "2026-10-03", paese=""), riga("Vecchio", "200", "2022-06-01"), riga("Senza ECI", "", "2026-10-04")]
    punti = {p["m"]: p for p in run(data_dir, Session(eci=con_righe(ECI, righe)))["punti_eci"]}
    assert not punti["Pari"]["r"] and not punti["Alto"]["r"]
    assert punti["Altissimo"]["r"] and punti["Senza Paese"]["r"]
    assert "Vecchio" not in punti and "Senza ECI" not in punti


def test_hong_kong_e_macao_nella_cina_taiwan_in_altri(data_dir):
    base = run(data_dir)["zone"]
    righe = [large("HK", "Hong Kong", "1e24"), large("MO", "Macao", "1e24"), large("TW", "Taiwan", "5e25")]
    out = run(data_dir, Session(large=con_righe(LARGE, righe)))
    assert out["zone"]["cina"]["calcolo"]["2025"]["n"] == base["cina"]["calcolo"]["2025"]["n"] + 2
    assert out["zone"]["altri"]["calcolo"]["2025"]["modello"] == "TW"
    assert out["altri_paesi"]["Taiwan"] == 1


def test_senza_paese_e_multinational_fuori_dalle_aree(data_dir):
    righe = [large("Senza", ""), large("Multi", "Multinational,United States of America", "1e27")]
    out = run(data_dir, Session(large=con_righe(LARGE, righe)))
    assert out["senza_paese"]["large"] == ["Poro 34B", "Senza", "Multi"]
    assert out["zone"]["usa"]["calcolo"]["2025"]["max"] < 1e27


def test_possibly_over_contano_ma_non_nel_massimo(data_dir):
    zone = run(data_dir, Session(large=con_righe(LARGE, [large("Forse", "Germany")])))["zone"]
    assert zone["germania"]["calcolo"]["2025"]["n"] == 2
    assert zone["germania"]["calcolo"]["2025"]["nc"] == 1
    assert zone["germania"]["calcolo"]["2025"]["modello"] == "Teuken 7B"


def test_paese_sconosciuto_va_in_altri_e_nel_log(data_dir, caplog):
    with caplog.at_level(logging.WARNING):
        out = run(data_dir, Session(large=con_righe(LARGE, [large("Lontano", "Atlantide", "2e24")])))
    assert out["altri_paesi"]["Atlantide"] == 1
    assert "Atlantide" in caplog.text


def test_data_center_quote_per_paese_degli_h100_equivalenti(data_dir):
    dc = run(data_dir)["data_center"]
    assert dc["aggiornato"] == "2026-10-23"
    assert list(dc["quote"].items())[:4] == [("USA", 86.49), ("MYS", 8.69), ("CHN", 2.17), ("GBR", 0.84)]
    assert dc["quote"]["ISL"] == 0.04
    # l'Italia non ha siti, e i Paesi con soli siti in costruzione non hanno quota
    assert "ITA" not in dc["quote"] and "SWE" not in dc["quote"] and "ARE" not in dc["quote"]


def test_data_center_siti_con_lo_stato(data_dir):
    siti = {s["nome"]: s for s in run(data_dir)["data_center"]["siti"]}
    assert len(siti) == 95
    assert siti["Colossus 2"] == {"nome": "Colossus 2", "proprietario": "SpaceXAI", "iso": "USA", "h100e": 1111673, "mw": 946, "stato": "operativo",
                                  "lat": 34.98929, "lon": -90.03857, "posizione": "epoch"}
    assert siti["EcoDataCenter 2"] == {"nome": "EcoDataCenter 2", "proprietario": "Mistral AI", "iso": "SWE", "h100e": 0, "mw": 0, "stato": "in costruzione",
                                       "lat": 60.52633, "lon": 15.41698, "posizione": "epoch"}
    assert siti["DayOne Nusajaya"]["proprietario"] is None
    assert siti["DayOne Kempas"]["mw"] == 421.7
    assert sum(s["stato"] == "in costruzione" for s in siti.values()) == 21


def copia(data_dir) -> dict:
    """La copia delle coordinate tra i dati: nome del sito → posizione."""
    return json.loads((data_dir / "geopoliticai_siti.json").read_text(encoding="utf-8"))["siti"]


def test_siti_con_le_coordinate_della_mappa_abbinate_per_nome(data_dir):
    siti = {s["nome"]: s for s in run(data_dir)["data_center"]["siti"]}
    assert {k: siti["Colossus 2"][k] for k in ("lat", "lon", "posizione")} == {"lat": 34.98929, "lon": -90.03857, "posizione": "epoch"}
    assert {k: siti["EcoDataCenter 2"][k] for k in ("lat", "lon", "posizione")} == {"lat": 60.52633, "lon": 15.41698, "posizione": "epoch"}
    assert all(s["posizione"] == "epoch" for s in siti.values())
    salvati = copia(data_dir)
    assert len(salvati) == 95
    assert salvati["Nebius Mantsala"] == {"lat": 60.62935, "lon": 25.26047, "posizione": "epoch"}


def mappa_con(n: int) -> str:
    """La pagina registrata con le coordinate solo dei primi n siti: gli altri hanno un nome che il CSV non conosce."""
    k = iter(range(1000))
    return re.sub(r"&quot;id&quot;:\[0,&quot;", lambda m: m.group(0) + ("" if next(k) < n else "Altrove "), MAPPA)


def senza(*nomi: str) -> str:
    """La pagina registrata senza le coordinate di questi siti."""
    out = MAPPA
    for n in nomi:
        out = out.replace(f"&quot;{n}&quot;", f"&quot;{n} (altrove)&quot;")
    return out


@pytest.mark.parametrize("session", [
    Session(status_mappa=500),
    Session(mappa="<html><body><p>Mappa nuova</p></body></html>"),
    Session(mappa=MAPPA.replace("lngLat", "lonLat")),
    Session(mappa=mappa_con(40)),
], ids=["http-500", "senza-isola", "campo-cambiato", "meno-della-meta"])
def test_pagina_della_mappa_non_letta_tiene_la_copia_e_lo_dice(data_dir, monkeypatch, session):
    from pipeline import run as pipeline_run
    run(data_dir)
    prima = copia(data_dir)
    monkeypatch.setattr("pipeline.run.session", lambda: session)
    assert pipeline_run.main(["--only", "geopoliticai"]) == 0
    assert copia(data_dir) == prima
    # la data della copia resta quella dell'ultima pagina letta, non quella di oggi
    assert json.loads((data_dir / "geopoliticai_siti.json").read_text(encoding="utf-8"))["aggiornato"] == "2026-10-23"
    siti = {s["nome"]: s for s in json.loads((data_dir / "geopoliticai.json").read_text(encoding="utf-8"))["data_center"]["siti"]}
    assert (siti["Colossus 2"]["lat"], siti["Colossus 2"]["posizione"]) == (34.98929, "epoch")
    assert session.nominatim == []  # i siti erano tutti nella copia
    status = json.loads((data_dir / "status.json").read_text(encoding="utf-8"))["fonti"]["geopoliticai"]
    assert status["stato"] == "ok"
    assert status["messaggio"].endswith("restano le posizioni salvate")
    assert "avviso" not in status["dettagli"]


def test_pagina_con_piu_della_meta_dei_siti_si_usa(data_dir):
    siti = {s["nome"]: s for s in run(data_dir, Session(mappa=mappa_con(60)))["data_center"]["siti"]}
    assert sum(s["posizione"] == "epoch" for s in siti.values()) == 60


def test_sito_senza_coordinate_una_richiesta_a_nominatim_e_poi_mai_piu(data_dir):
    colossus = "5420 Tulane Rd, Memphis, TN 38109"
    session = Session(mappa=senza("Colossus 2"), luoghi={colossus: [35.06, -90.08]})
    siti = {s["nome"]: s for s in run(data_dir, session)["data_center"]["siti"]}
    assert [p["q"] for p, _ in session.nominatim] == [colossus]
    params, headers = session.nominatim[0]
    assert params["limit"] == 1 and "AI Radar" in headers["User-Agent"]
    assert {k: siti["Colossus 2"][k] for k in ("lat", "lon", "posizione")} == {"lat": 35.06, "lon": -90.08, "posizione": "indirizzo"}
    assert copia(data_dir)["Colossus 2"] == {"lat": 35.06, "lon": -90.08, "posizione": "indirizzo", "indirizzo": colossus}
    # al giro dopo il sito è nella copia: nessuna richiesta
    again = Session(mappa=senza("Colossus 2"))
    run(data_dir, again)
    assert again.nominatim == []
    assert copia(data_dir)["Colossus 2"]["lat"] == 35.06


def test_sito_che_nominatim_non_trova_resta_senza_cerchio_ma_conta_nella_quota(data_dir):
    session = Session(mappa=senza("Colossus 2"))
    dc = run(data_dir, session)["data_center"]
    sito = next(s for s in dc["siti"] if s["nome"] == "Colossus 2")
    assert (sito["lat"], sito["lon"], sito["posizione"]) == (None, None, None)
    assert dc["quote"]["USA"] == 86.49
    assert len(session.nominatim) == 1
    again = Session(mappa=senza("Colossus 2"))
    run(data_dir, again)
    assert again.nominatim == []


def test_un_sito_senza_indirizzo_non_si_cerca(data_dir):
    session = Session(mappa=senza("Nebius Mantsala"))
    sito = next(s for s in run(data_dir, session)["data_center"]["siti"] if s["nome"] == "Nebius Mantsala")
    assert session.nominatim == [] and sito["lat"] is None


def test_nominatim_al_massimo_una_richiesta_al_secondo(data_dir, monkeypatch):
    pause = []
    monkeypatch.setattr("time.sleep", pause.append)
    session = Session(mappa=senza("Colossus 2", "Anthropic-Amazon New Carlisle", "EcoDataCenter 2"))
    run(data_dir, session)
    assert len(session.nominatim) == 3
    assert len(pause) == 2 and all(0.9 < x <= 1 for x in pause)


@pytest.mark.parametrize("session", [
    Session(status=500),
    Session(status_dc=500),
    Session(dc=DC.replace("Current H100 equivalents", "H100e")),
    Session(large=LARGE.replace("Training compute (FLOP)", "Compute")),
    Session(eci=ECI.replace("Display name", "Name")),
    Session(eci="\n".join(ECI.splitlines()[:20])),
], ids=["http-500", "data-center-500", "colonna-data-center", "colonna-calcolo", "colonna-eci", "eci-troncato"])
def test_errore_lascia_il_file_precedente(data_dir, monkeypatch, session):
    from pipeline import run as pipeline_run
    before = json.dumps(run(data_dir), ensure_ascii=False)
    monkeypatch.setattr("pipeline.run.session", lambda: session)
    pipeline_run.main(["--only", "geopoliticai"])
    after = json.loads((data_dir / "geopoliticai.json").read_text(encoding="utf-8"))
    assert json.dumps(after, ensure_ascii=False) == before
    status = json.loads((data_dir / "status.json").read_text(encoding="utf-8"))["fonti"]["geopoliticai"]
    assert status["stato"] == "errore"
