"""Il README rimanda alla guida pubblicata: i suoi link devono portare a pagine che la guida ha davvero."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
README = (ROOT / "README.md").read_text(encoding="utf-8")
SITO = "https://simones99.github.io/ai-radar/"

DEFINIZIONI = dict(re.findall(r"^\[([^\]]+)\]: (\S+)$", README, flags=re.M))


def test_gli_indirizzi_del_sito_stanno_solo_nel_blocco_in_fondo():
    # un indirizzo scritto dentro il testo andrebbe cambiato in più posti
    assert f"]({SITO}" not in README


def test_ogni_riferimento_usato_e_definito():
    # un riferimento senza definizione GitHub lo mostra come testo, tra parentesi quadre
    usati = set(re.findall(r"\]\[([^\]]+)\]", README))
    assert usati
    assert usati <= set(DEFINIZIONI)


def test_ogni_link_alla_guida_porta_a_una_sua_pagina():
    # con use_directory_urls, guida/<nome>.md esce in /guida/<nome>/, e guida/index.md in /guida/
    pagine = {url.removeprefix(SITO + "guida/").strip("/") for url in DEFINIZIONI.values() if url.startswith(SITO + "guida/")}
    assert pagine
    for pagina in pagine:
        assert (ROOT / "guida" / f"{pagina or 'index'}.md").is_file(), pagina
