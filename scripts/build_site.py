"""Prepara il sito per GitHub Pages: copia i dati nell'app e la costruisce in _site/.

Uso:  python scripts/build_site.py [cartella_dati]
Anteprima locale:  python scripts/build_site.py && (cd web && npm run preview)
"""
from __future__ import annotations

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


def build(data_dir: Path, run=subprocess.run) -> None:
    n = copy_data(data_dir, WEB)
    run(["npm", "run", "build"], cwd=WEB, check=True)
    (OUT / ".nojekyll").write_text("")
    print(f"Sito pronto in {OUT} ({n} file di dati)")


if __name__ == "__main__":
    build(Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data")
