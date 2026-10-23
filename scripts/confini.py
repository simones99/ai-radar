"""Genera i confini dei Paesi per la mappa di GeopoliticAI in web/src/lib/geo/confini.json (una tantum).

Uso:
    python scripts/confini.py              # scarica Natural Earth 1:50m dal commit fissato qui sotto
    python scripts/confini.py <cartella>   # oppure legge ne_50m_admin_0_countries.geojson da una cartella

Natural Earth è di pubblico dominio. I Paesi hanno la chiave ADM0_A3 (mai ISO_A3), i percorsi SVG sono in
proiezione Equal Earth, larga 1000, semplificati. Hong Kong e Macao sono uniti alla Cina, Taiwan resta a sé.
La Crimea segue il punto di vista italiano: il suo poligono passa dalla Russia all'Ucraina. Il Kosovo e il
Sahara Occidentale restano come in Natural Earth. La mappa è tagliata tra 72° N e 45° S circa.
"""
from __future__ import annotations

import json
import math
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "web" / "src" / "lib" / "geo" / "confini.json"
NE = ("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/9380cca83db5f9aef52d5e762765100745f84b27"
      "/geojson/ne_50m_admin_0_countries.geojson")
UA = {"User-Agent": "ai-radar/1.0 (https://github.com/simones99/ai-radar)"}

A1, A2, A3, A4, M = 1.340264, -0.081106, 0.000893, 0.003796, math.sqrt(3) / 2
W = 1000
S = W / (2 * 2.70646)
NORD, SUD = 72, -45
UNISCI = {"HKG": "CHN", "MAC": "CHN"}
FUORI = {"ATA", "ATF"}  # l'Antartide e le Terre australi francesi stanno sotto il taglio
CRIMEA = (34.10, 44.95)  # Sinferopoli: il poligono russo che la contiene passa all'Ucraina
# i nomi come li usa il resto del sito, dove quello di Natural Earth è diverso
NOMI = {"USA": "USA", "CZE": "Cechia"}


def proj(lon: float, lat: float) -> tuple[float, float]:
    """Equal Earth, con il nord in alto (y negativa sopra l'equatore)."""
    lam, phi = math.radians(lon), math.radians(lat)
    th = math.asin(M * math.sin(phi))
    t2 = th * th
    t6 = t2 ** 3
    x = lam * math.cos(th) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)))
    y = th * (A1 + A2 * t2 + t6 * (A3 + A4 * t2))
    return (W / 2 + S * x, -S * y)


def semplifica(pts: list, eps: float) -> list:
    """Douglas-Peucker."""
    if len(pts) < 3:
        return pts
    a, b = pts[0], pts[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    n = math.hypot(dx, dy)
    i, dm = 0, 0.0
    for k in range(1, len(pts) - 1):
        d = (abs(dy * pts[k][0] - dx * pts[k][1] + b[0] * a[1] - b[1] * a[0]) / n if n > 1e-9
             else math.hypot(pts[k][0] - a[0], pts[k][1] - a[1]))
        if d > dm:
            i, dm = k, d
    if dm > eps:
        return semplifica(pts[:i + 1], eps)[:-1] + semplifica(pts[i:], eps)
    return [a, b]


def area(r: list) -> float:
    return abs(sum(r[i][0] * r[i - 1][1] - r[i - 1][0] * r[i][1] for i in range(len(r)))) / 2


def centro(r: list) -> tuple[float, float]:
    a = cx = cy = 0.0
    for i in range(len(r)):
        (x0, y0), (x1, y1) = r[i - 1], r[i]
        f = x0 * y1 - x1 * y0
        a += f
        cx += (x0 + x1) * f
        cy += (y0 + y1) * f
    return (cx / (3 * a), cy / (3 * a)) if a else r[0]


def contiene(ring: list, lon: float, lat: float) -> bool:
    n = False
    for (x0, y0), (x1, y1) in zip(ring, ring[1:] + ring[:1]):
        if (y0 > lat) != (y1 > lat) and lon < x0 + (lat - y0) * (x1 - x0) / (y1 - y0):
            n = not n
    return n


def poligoni(geom: dict) -> list:
    return geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]


def percorso(poly_list: list) -> tuple[str, tuple[float, float]]:
    """Il percorso SVG di un Paese e il baricentro del suo anello più grande, per le etichette."""
    anelli = []
    for poly in poly_list:
        for j, ring in enumerate(poly):
            lats = [la for _, la in ring]
            if max(lats) < SUD - 1 or min(lats) > NORD + 1:
                continue  # tutto fuori dal taglio
            anelli.append((j == 0, [proj(lo, max(la, SUD - 13)) for lo, la in ring]))
    esterni = [r for est, r in anelli if est]
    big = max(esterni, key=area) if esterni else None
    parti = []
    for _, r in anelli:
        if area(r) < 1.5 and r is not big:
            continue  # isole troppo piccole per vedersi
        s = semplifica(r, 0.5)
        if len(s) < 4:
            s = r[:: max(1, len(r) // 6)]
        if len(s) < 3:
            continue
        parti.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in s[:-1]) + "Z")
    cx, cy = centro(big) if big else (0.0, 0.0)
    return "".join(parti), (round(cx, 1), round(cy, 1))


def genera(countries: dict) -> dict:
    gruppi: dict[str, dict] = {}
    for f in countries["features"]:
        p = f["properties"]
        k = UNISCI.get(p["ADM0_A3"], p["ADM0_A3"])
        if k in FUORI:
            continue
        e = gruppi.setdefault(k, {"nome": None, "poly": []})
        if k == p["ADM0_A3"]:
            e["nome"] = NOMI.get(k) or p.get("NAME_IT") or p["NAME"]
        e["poly"] += poligoni(f["geometry"])
    crimea = [poly for poly in gruppi["RUS"]["poly"] if contiene(poly[0], *CRIMEA)]
    assert len(crimea) == 1, "Crimea: in Natural Earth non è più un poligono russo a sé, va rivisto lo script"
    gruppi["RUS"]["poly"].remove(crimea[0])
    gruppi["UKR"]["poly"].append(crimea[0])

    paesi = []
    for k, e in sorted(gruppi.items()):
        d, c = percorso(e["poly"])
        if d:
            paesi.append({"id": k, "nome": e["nome"], "d": d, "c": list(c)})
    y0, y1 = math.floor(proj(0, NORD)[1]), math.ceil(proj(0, SUD)[1])
    return {
        "fonte": "Natural Earth 1:50m, pubblico dominio. Generato da scripts/confini.py.",
        "viewBox": f"0 {y0} {W} {y1 - y0}",
        "paesi": paesi,
    }


def main(argv: list[str]) -> None:
    if argv:
        countries = json.loads((Path(argv[0]) / "ne_50m_admin_0_countries.geojson").read_text(encoding="utf-8"))
    else:
        with urllib.request.urlopen(urllib.request.Request(NE, headers=UA), timeout=120) as r:
            countries = json.loads(r.read().decode("utf-8"))
    out = genera(countries)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8", newline="\n")
    print(f"{len(out['paesi'])} Paesi, viewBox {out['viewBox']}, {OUT.stat().st_size // 1024} KB in {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main(sys.argv[1:])
