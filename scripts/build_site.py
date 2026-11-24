"""Prepara il sito per GitHub Pages: copia i dati nell'app e la costruisce in _site/.

Uso:  python scripts/build_site.py [cartella_dati]
Anteprima locale:  python scripts/build_site.py && (cd web && npm run preview)

La cartella dei dati è l'argomento, se c'è, altrimenti AI_RADAR_DATA_DIR, altrimenti data/: la stessa regola della build di Vite,
che riceve la cartella scelta, così i JSON dell'app e le pagine statiche nascono dagli stessi dati.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "web"
OUT = ROOT / "_site"


def copy_data(data_dir: Path, web: Path | None = None) -> int:
    pub = (web or WEB) / "public" / "data"
    if pub.exists():
        shutil.rmtree(pub)
    pub.mkdir(parents=True)
    files = sorted(data_dir.glob("*.json"))
    for f in files:
        shutil.copy2(f, pub / f.name)
    return len(files)


def cartella_dei_dati(argomenti: list[str]) -> Path:
    if argomenti:
        return Path(argomenti[0])
    return Path(os.environ.get("AI_RADAR_DATA_DIR") or ROOT / "data")


def build(data_dir: Path, run=subprocess.run) -> None:
    n = copy_data(data_dir, WEB)
    # npm gira in web/: la cartella arriva a Vite assoluta, e vince su un AI_RADAR_DATA_DIR diverso
    run(["npm", "run", "build"], cwd=WEB, check=True, env={**os.environ, "AI_RADAR_DATA_DIR": str(data_dir.resolve())})
    (OUT / ".nojekyll").write_text("")
    print(f"Sito pronto in {OUT} ({n} file di dati)")


if __name__ == "__main__":
    build(cartella_dei_dati(sys.argv[1:]))
