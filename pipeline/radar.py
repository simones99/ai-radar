"""Radar delle competenze: combina ricerca, open source e lavoro in due assi.

- Slancio (asse x): quanto cresce l'attenzione su una competenza negli ultimi
  3 mesi rispetto ai 3 precedenti. Media dei ranghi percentili di:
    * crescita della quota di paper AI su arXiv che ne parlano;
    * crescita dei nuovi repository GitHub con il suo topic;
    * crescita della quota di annunci di lavoro (quando c'è almeno un mese di storico).
- Domanda (asse y): rango percentile della quota di annunci di lavoro che la citano
  (media dei Paesi). Senza dati sul lavoro si usa il numero di nuovi repository
  degli ultimi 3 mesi come misura di adozione.

I ranghi sono relativi alle competenze del radar: 0 = la più bassa, 1 = la più alta.

Per mostrare il movimento si calcola anche la posizione di un mese prima
(slancio_prec, domanda_prec, quadrante_prec): stesse formule e stessa base della
domanda, con le serie mensili fermate al mese precedente e le rilevazioni del
lavoro di almeno 28 giorni prima.
"""
from __future__ import annotations

from datetime import date

from .common import read_json, write_json

OUT = "radar.json"
SMOOTH = 5  # sommato ai conteggi per non premiare i salti tra numeri piccoli
WINDOW = 3

QUADRANTS = {
    "impara-ora": "Impara ora",
    "prova": "Da provare",
    "consolida": "Da consolidare",
    "osserva": "Tieni d'occhio",
}


def pct_ranks(values: dict[str, float | None]) -> dict[str, float | None]:
    """Rango percentile in [0, 1], con i pari merito alla media dei loro ranghi."""
    valid = sorted((v, k) for k, v in values.items() if v is not None)
    n = len(valid)
    out: dict[str, float | None] = {k: None for k in values}
    if n == 0:
        return out
    if n == 1:
        out[valid[0][1]] = 0.5
        return out
    i = 0
    while i < n:
        j = i
        while j + 1 < n and valid[j + 1][0] == valid[i][0]:
            j += 1
        r = ((i + j) / 2) / (n - 1)
        for t in range(i, j + 1):
            out[valid[t][1]] = round(r, 4)
        i = j + 1
    return out


def _sum(series: dict[str, int], months: list[str]) -> int:
    return sum(series.get(m, 0) for m in months)


def _windows(months: list[str]) -> tuple[list[str], list[str]] | None:
    if len(months) < 2 * WINDOW:
        return None
    return months[-2 * WINDOW:-WINDOW], months[-WINDOW:]


def arxiv_signal(arx: dict, sid: str) -> dict | None:
    series, months = arx.get("series", {}), arx.get("mesi", [])
    w = _windows(months)
    if not w or sid not in series:
        return None
    prev, last = w
    tot = series.get("_totale", {})
    tp, tl = _sum(tot, prev), _sum(tot, last)
    p, l = _sum(series[sid], prev), _sum(series[sid], last)
    if not tp or not tl:
        return None
    share_prev, share_last = (p + SMOOTH) / tp, (l + SMOOTH) / tl
    return {
        "ultimi3": l,
        "precedenti3": p,
        "per_mille": round(1000 * l / tl, 2),
        "crescita": round(share_last / share_prev - 1, 4),
        "mensile": [{"mese": m, "n": series[sid].get(m, 0), "totale": tot.get(m, 0)} for m in months],
    }


def github_signal(gh: dict, sid: str) -> dict | None:
    series, months = gh.get("topics", {}).get(sid), gh.get("mesi", [])
    w = _windows(months)
    if not w or series is None:
        return None
    prev, last = w
    p, l = _sum(series, prev), _sum(series, last)
    return {
        "ultimi3": l,
        "precedenti3": p,
        "crescita": round((l + SMOOTH) / (p + SMOOTH) - 1, 4),
        "mensile": [{"mese": m, "n": series.get(m, 0)} for m in months],
    }


def _latest_by_country(snaps: list[dict], before: str | None = None) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for x in sorted(snaps, key=lambda x: x["data"]):
        if before and x["data"] > before:
            continue
        out[x["paese"]] = x
    return out


def jobs_signal(jobs: dict, sid: str, today: date) -> dict | None:
    snaps = jobs.get("snapshots", [])
    if not snaps:
        return None
    eu = set(jobs.get("paesi_ue", []))
    latest = _latest_by_country(snaps)

    def shares(by_country: dict[str, dict]) -> dict[str, float]:
        res = {}
        for c, x in by_country.items():
            n = x.get("competenze", {}).get(sid)
            if n is None or not x.get("totale"):
                continue
            res[c] = 10000 * n / x["totale"]
        return res

    now = shares(latest)
    if not now:
        return None

    def mean(vals):
        vals = list(vals)
        return round(sum(vals) / len(vals), 3) if vals else None

    # Crescita: confronto con la rilevazione più recente di almeno 28 giorni prima.
    growth = None
    newest = max(x["data"] for x in latest.values())
    cutoff = date.fromisoformat(newest).toordinal() - 28
    older = _latest_by_country(snaps, before=date.fromordinal(cutoff).isoformat())
    then = shares(older)
    common = [c for c in now if c in then]
    if common:
        a, b = mean(now[c] for c in common), mean(then[c] for c in common)
        if b:
            growth = round(a / b - 1, 4)
    return {
        "ogni_10mila": {c: round(v, 2) for c, v in sorted(now.items())},
        "media": mean(now.values()),
        "media_ue": mean(v for c, v in now.items() if c in eu),
        "usa": round(now["us"], 3) if "us" in now else None,
        "crescita": growth,
        "data": newest,
    }


def quadrant(m: float | None, d: float | None) -> str | None:
    if m is None or d is None:
        return None
    if m >= 0.5 and d >= 0.5:
        return "impara-ora"
    if m >= 0.5:
        return "prova"
    if d >= 0.5:
        return "consolida"
    return "osserva"


def _signals(skills: list[dict], arx: dict, gh: dict, jobs: dict, today: date) -> list[dict]:
    rows = []
    for sk in skills:
        sid = sk["id"]
        rows.append({
            "id": sid,
            "nome": sk["nome"],
            "breve": sk.get("breve", sk["nome"]),
            "descrizione": sk.get("descrizione", ""),
            "arxiv": arxiv_signal(arx, sid),
            "github": github_signal(gh, sid),
            "lavoro": jobs_signal(jobs, sid, today),
        })
    return rows


def _place(rows: list[dict], basis: str | None = None, use_jobs_growth: bool | None = None):
    """Slancio e domanda di ogni competenza. basis e use_jobs_growth, se dati, sono imposti
    (serve alla posizione precedente, che deve usare le stesse misure di quella attuale)."""
    def pick(fn):
        return {r["id"]: fn(r) for r in rows}

    r_arx = pct_ranks(pick(lambda r: r["arxiv"]["crescita"] if r["arxiv"] else None))
    r_gh = pct_ranks(pick(lambda r: r["github"]["crescita"] if r["github"] else None))
    r_jg = pct_ranks(pick(lambda r: r["lavoro"]["crescita"] if r["lavoro"] else None))
    if use_jobs_growth is None:
        use_jobs_growth = sum(v is not None for v in r_jg.values()) >= len(rows) / 2

    job_level = pick(lambda r: r["lavoro"]["media"] if r["lavoro"] else None)
    if basis is None:
        basis = "lavoro" if sum(v is not None for v in job_level.values()) >= len(rows) / 2 else "open-source"
    r_dem = pct_ranks(job_level) if basis == "lavoro" else pct_ranks(pick(lambda r: r["github"]["ultimi3"] if r["github"] else None))

    pos = {}
    for r in rows:
        parts = [r_arx[r["id"]], r_gh[r["id"]]] + ([r_jg[r["id"]]] if use_jobs_growth else [])
        parts = [p for p in parts if p is not None]
        pos[r["id"]] = (round(sum(parts) / len(parts), 4) if parts else None, r_dem[r["id"]])
    return basis, use_jobs_growth, pos


def _month_before(arx: dict, gh: dict, jobs: dict) -> tuple[dict, dict, dict]:
    """I dati come erano un mese prima: serie senza l'ultimo mese, rilevazioni di almeno 28 giorni prima."""
    arx_p = {**arx, "mesi": arx.get("mesi", [])[:-1]}
    gh_p = {**gh, "mesi": gh.get("mesi", [])[:-1]}
    snaps = jobs.get("snapshots", [])
    if snaps:
        cutoff = date.fromordinal(date.fromisoformat(max(x["data"] for x in snaps)).toordinal() - 28).isoformat()
        snaps = [x for x in snaps if x["data"] <= cutoff]
    return arx_p, gh_p, {**jobs, "snapshots": snaps}


def run(skills: list[dict], today: date) -> dict:
    arx = read_json("arxiv.json", {}) or {}
    gh = read_json("github.json", {}) or {}
    jobs = read_json("jobs.json", {}) or {}

    rows = _signals(skills, arx, gh, jobs, today)
    basis, use_jobs_growth, pos = _place(rows)
    _, _, prev = _place(_signals(skills, *_month_before(arx, gh, jobs), today), basis, use_jobs_growth)

    for r in rows:
        r["slancio"], r["domanda"] = pos[r["id"]]
        r["quadrante"] = quadrant(r["slancio"], r["domanda"])
        r["slancio_prec"], r["domanda_prec"] = prev[r["id"]]
        r["quadrante_prec"] = quadrant(r["slancio_prec"], r["domanda_prec"])

    out = {
        "generato": today.isoformat(),
        "base_domanda": basis,
        "crescita_lavoro_nello_slancio": use_jobs_growth,
        "quadranti": QUADRANTS,
        "competenze": rows,
    }
    write_json(OUT, out)
    placed = sum(1 for r in rows if r["quadrante"])
    if placed == 0:
        raise ValueError("radar vuoto: mancano sia arXiv sia GitHub")
    return {"competenze": len(rows), "posizionate": placed, "base_domanda": basis}
