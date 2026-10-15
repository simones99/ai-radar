"""Assembla il sito statico in _site/ (pagina + dati), pronto per GitHub Pages.

Uso:  python scripts/build_site.py [cartella_dati] [cartella_uscita]
Anteprima locale:  python scripts/build_site.py && python -m http.server -d _site 8000
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def build(data_dir: Path, out: Path) -> None:
    if out.exists():
        shutil.rmtree(out)
    shutil.copytree(ROOT / "site", out)
    (out / "data").mkdir()
    for f in sorted(data_dir.glob("*.json")):
        shutil.copy2(f, out / "data" / f.name)
    (out / ".nojekyll").write_text("")
    print(f"Sito pronto in {out} ({len(list((out / 'data').glob('*.json')))} file di dati)")


if __name__ == "__main__":
    data = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data"
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "_site"
    build(data, out)
