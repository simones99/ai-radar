"""Scarica le foto delle card da Wikimedia Commons in web/src/assets/photos/ (una tantum).

Uso:
    pip install pillow==12.3.0
    python scripts/fetch_photos.py

Accetta solo licenze CC0, pubblico dominio, CC BY e CC BY-SA, e stampa i crediti
da riportare in web/src/lib/photos.ts. Le foto si salvano nel repository.
"""
from __future__ import annotations

import json
import re
import sys
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "web" / "src" / "assets" / "photos"
API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "ai-radar/1.0 (https://github.com/simones99/ai-radar)"}
ALLOWED = re.compile(r"^(CC0|Public domain|CC BY(-SA)? \d\.\d)$", re.IGNORECASE)

PHOTOS = {
    "modelli": {"titolo": "File:Rear of rack at NERSC data center - closeup.jpg"},
    "open": {"titolo": "File:Wikimedia Hackathon 2025 - day 3 - 001.jpg"},
    "business": {"titolo": "File:Silicon wafer researcher.jpg"},
    "persone": {"titolo": "File:Working in open office space (Unsplash).jpg"},
    "politica": {"titolo": "File:Hemicycle of the European Parliament, Strasbourg 2023 003.jpg"},
    "competenze": {"titolo": "File:Wiki Education at UC Berkeley April 2018 111.jpg"},
    # scansione d'archivio: si toglie il bordo bianco
    "notizie": {"titolo": "File:Interior view of newspaper delivery room showing man taking stack of newspapers "
                          "from machine) - World-Telegram photo LCCN95506971.jpg",
                "crop": (0.073, 0.114, 0.927, 0.886)},
    "rapporti": {"titolo": "File:LOC Main Reading Room Highsmith.jpg"},
}


def license_ok(name: str) -> bool:
    return bool(ALLOWED.match((name or "").strip()))


def crop_box(size: tuple[int, int], frac: tuple[float, float, float, float]) -> tuple[int, int, int, int]:
    w, h = size
    return (round(frac[0] * w), round(frac[1] * h), round(frac[2] * w), round(frac[3] * h))


def clean(html: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html or "")).strip()


def fetch_meta() -> dict:
    p = {"action": "query", "titles": "|".join(x["titolo"] for x in PHOTOS.values()), "prop": "imageinfo",
         "iiprop": "url|extmetadata", "iiurlwidth": 1600, "format": "json"}
    with urllib.request.urlopen(urllib.request.Request(f"{API}?{urllib.parse.urlencode(p)}", headers=UA), timeout=60) as r:
        q = json.load(r)["query"]
    norm = {n["from"]: n["to"] for n in q.get("normalized", [])}
    pages = {pg["title"]: pg for pg in q["pages"].values()}
    out = {}
    for pid, x in PHOTOS.items():
        pg = pages.get(norm.get(x["titolo"], x["titolo"]))
        if not pg or "imageinfo" not in pg:
            raise SystemExit(f"{pid}: file non trovato su Commons: {x['titolo']}")
        ii = pg["imageinfo"][0]
        md = ii.get("extmetadata", {})
        out[pid] = {"url": ii["thumburl"], "pagina": ii["descriptionurl"],
                    "licenza": clean(md.get("LicenseShortName", {}).get("value", "")),
                    "autore": clean(md.get("Artist", {}).get("value", ""))[:80]}
    return out


def main() -> int:
    meta = fetch_meta()
    OUT.mkdir(parents=True, exist_ok=True)
    for pid, m in meta.items():
        if not license_ok(m["licenza"]):
            raise SystemExit(f"{pid}: licenza non ammessa: {m['licenza']!r}")
        with urllib.request.urlopen(urllib.request.Request(m["url"], headers=UA), timeout=120) as r:
            data = r.read()
        crop = PHOTOS[pid].get("crop")
        if crop:
            from PIL import Image
            img = Image.open(BytesIO(data))
            img.crop(crop_box(img.size, crop)).convert("RGB").save(OUT / f"{pid}.jpg", quality=85)
        else:
            (OUT / f"{pid}.jpg").write_bytes(data)
        print(f"{pid}: {m['licenza']} · {m['autore']} · {m['pagina']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
