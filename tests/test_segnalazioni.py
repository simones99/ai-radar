"""Il modello di issue «Un numero non torna»: i tre campi che chiede, le card che offre, il link dell'app che lo apre."""
from __future__ import annotations

import re
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
MODELLO = ROOT / ".github" / "ISSUE_TEMPLATE" / "un-numero-non-torna.yml"
FORM = yaml.safe_load(MODELLO.read_text(encoding="utf-8"))
CAMPI = {c["id"]: c for c in FORM["body"] if "id" in c}


def test_chiede_card_numero_visto_e_fonte_controllata_tutti_obbligatori():
    assert FORM["name"] == "Un numero non torna"
    assert {k: c["attributes"]["label"] for k, c in CAMPI.items()} == {
        "card": "Card", "numero": "Numero visto", "fonte": "Fonte controllata",
    }
    assert all(c["validations"]["required"] for c in CAMPI.values())


def test_offre_le_card_dell_app_nel_loro_ordine():
    # le etichette delle card stanno in registry.ts: una card nuova o rinominata va anche nel modello
    registro = (ROOT / "web" / "src" / "lib" / "tiles" / "registry.ts").read_text(encoding="utf-8")
    elenco = registro.split("export const TILES", 1)[1]
    card = re.findall(r"\{ id: '[^']+', label: '([^']+)'", elenco)
    assert card
    assert CAMPI["card"]["attributes"]["options"] == [*card, "Un'edizione o la pagina di una competenza"]


def test_il_link_dell_app_apre_questo_modello():
    fonti = (ROOT / "web" / "src" / "lib" / "text" / "fonti.ts").read_text(encoding="utf-8")
    assert f"/new?template={MODELLO.name}`" in fonti
