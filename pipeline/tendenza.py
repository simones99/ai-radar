"""Tendenza di una quota nel tempo, con margine d'errore, e combinazione di più segnali.

Per ogni punto la quota è n / totale. La tendenza è una retta su log((n + 0,5) / totale),
pesata con n + 0,5: con conteggi di Poisson la varianza di log(n) è circa 1 / n, quindi i
punti con più casi contano di più. Se i punti sono più dispersi di quanto direbbe Poisson
(dispersione > 1), l'errore cresce di conseguenza (quasi-Poisson).
"""
from __future__ import annotations

import math

Z80 = 1.2816      # margine all'80%: ±1,28 errori standard
MAX_PESO = 2 / 3  # con almeno due segnali nessuno pesa di più
MIN_PUNTI = 4


def trend(xs: list[float], ns: list[float], totali: list[float]) -> dict | None:
    """Pendenza di log(quota) per unità di x, con il suo errore standard.

    I punti con totale 0 non entrano; con meno di MIN_PUNTI punti validi non c'è tendenza.
    """
    pts = [(x, n + 0.5, t) for x, n, t in zip(xs, ns, totali) if t]
    if len(pts) < MIN_PUNTI:
        return None
    ys = [math.log(w / t) for _, w, t in pts]
    sw = sum(w for _, w, _ in pts)
    xm = sum(w * x for x, w, _ in pts) / sw
    ym = sum(w * y for (_, w, _), y in zip(pts, ys)) / sw
    sxx = sum(w * (x - xm) ** 2 for x, w, _ in pts)
    if sxx == 0:
        return None
    b = sum(w * (x - xm) * (y - ym) for (x, w, _), y in zip(pts, ys)) / sxx
    disp = sum(w * (y - ym - b * (x - xm)) ** 2 for (x, w, _), y in zip(pts, ys)) / (len(pts) - 2)
    return {"pendenza": b, "errore": math.sqrt(max(disp, 1.0) / sxx)}


def _cap(w: list[float], cap: float) -> list[float]:
    """Taglia i pesi oltre `cap` e ridistribuisce il resto tra gli altri, in proporzione."""
    w = list(w)
    fixed: set[int] = set()
    while True:
        over = [i for i, x in enumerate(w) if i not in fixed and x > cap + 1e-12]
        if not over:
            return w
        fixed.update(over)
        free = [i for i in range(len(w)) if i not in fixed]
        left = 1 - cap * len(fixed)
        tot = sum(w[i] for i in free)
        for i in fixed:
            w[i] = cap
        for i in free:
            w[i] = w[i] * left / tot if tot else left / len(free)


def combine(trends: list[dict]) -> tuple[dict, list[float]] | None:
    """Media delle pendenze pesata per l'inverso della varianza, e i pesi usati.

    Con almeno due segnali nessun peso supera MAX_PESO: GitHub ha conteggi enormi
    e altrimenti deciderebbe da solo.
    """
    if not trends:
        return None
    inv = [1 / t["errore"] ** 2 for t in trends]
    w = [x / sum(inv) for x in inv]
    if len(w) >= 2:
        w = _cap(w, MAX_PESO)
    b = sum(wi * t["pendenza"] for wi, t in zip(w, trends))
    se = math.sqrt(sum((wi * t["errore"]) ** 2 for wi, t in zip(w, trends)))
    return {"pendenza": b, "errore": se}, w


def variazione(t: dict, mesi: float) -> float:
    """Variazione della quota in `mesi` mesi secondo la tendenza: 0,25 = +25%."""
    return math.exp(mesi * t["pendenza"]) - 1


def margine(t: dict, mesi: float) -> tuple[float, float]:
    """Estremi della variazione con il margine all'80%."""
    d = Z80 * t["errore"]
    return math.exp(mesi * (t["pendenza"] - d)) - 1, math.exp(mesi * (t["pendenza"] + d)) - 1


def rapporto(t: dict, mesi: float) -> float:
    """(1 + estremo alto) / (1 + estremo basso): 1 = nessuna incertezza.

    Si usa il rapporto e non la differenza perché la differenza cresce con la crescita stessa.
    """
    return math.exp(2 * mesi * Z80 * t["errore"])
