"""Radar delle competenze, versione 2: unità vere, soglie fisse, margine d'errore.

Slancio: variazione negli ultimi 6 mesi interi della quota della competenza sul totale
dell'AI, stimata come tendenza (pipeline/tendenza.py) e combinando i segnali:
  * arXiv: paper che la citano / paper AI del mese;
  * GitHub: nuovi repository con il suo topic / nuovi repository AI del mese (la base è
    la somma dei topic github_base_topics di sources.yaml);
  * lavoro: annunci che la citano / annunci del Paese, se ci sono almeno 8 settimane di
    rilevazioni fatte con la stessa ricerca.
Domanda: annunci ogni 10mila, media tra i Paesi della rilevazione più recente.

Quadranti a soglie fisse: slancio > 0 (cresce più dell'AI), domanda >= 3 annunci ogni 10mila.
Il quadrante pubblicato cambia solo se il calcolo di due mesi di fila dà il quadrante nuovo.
Una competenza è incerta se il margine all'80% dello slancio è largo:
(1 + alto) / (1 + basso) > RAPPORTO_MAX.

Lo storico si ricalcola ogni volta: il punto di k mesi fa usa le serie fermate a k mesi prima
e le rilevazioni del lavoro di almeno 28 x k giorni prima. Dove la domanda manca (prima della
prima rilevazione) il quadrante usa la domanda del primo punto successivo che ce l'ha.
"""
from __future__ import annotations

from datetime import date

from .common import read_json, write_json
from .tendenza import combine, margine, rapporto, trend, variazione

OUT = "radar.json"
VERSIONE = 2
FINESTRA = 6            # mesi della tendenza
SOGLIA_SLANCIO = 0.0    # cresce più dell'AI nel suo complesso
SOGLIA_DOMANDA = 3.0    # annunci ogni 10mila, circa 1 su 3.300
# Tarato il 16/10/2026 su arXiv e GitHub con la base AI vera: incerte text-to-SQL 1,66, robotica 1,65,
# LLMOps 1,63, Governance 1,63, DB vettoriali 1,60; solide MCP 1,46, multimodali 1,46, RAG 1,20, agenti 1,10.
RAPPORTO_MAX = 1.55
MIN_GIORNI_LAVORO = 56  # 8 settimane di rilevazioni con la stessa ricerca
GIORNI_MESE = 30.44
POCHI = 100             # sotto questa media al mese il motivo dell'incertezza dice «pochi»
MAX_STORICO = 24

QUADRANTS = {
    "impara-ora": "Impara ora",
    "prova": "Da provare",
    "consolida": "Da consolidare",
    "osserva": "Tieni d'occhio",
}
ETICHETTE = {"arxiv": "paper", "github": "repository nuovi", "lavoro": "annunci"}


def quadrant(slancio: float | None, domanda: float | None) -> str | None:
    if slancio is None or domanda is None:
        return None
    up, high = slancio > SOGLIA_SLANCIO, domanda >= SOGLIA_DOMANDA
    return "impara-ora" if up and high else "prova" if up else "consolida" if high else "osserva"


def published(calcolati: list[str | None]) -> list[str | None]:
    """Quadrante pubblicato mese per mese: cambia solo se il calcolato è lo stesso per due mesi di fila."""
    out: list[str | None] = []
    for i, q in enumerate(calcolati):
        if q is None or i == 0 or calcolati[i - 1] is None or out[i - 1] is None:
            out.append(q)
        else:
            out.append(q if q == calcolati[i - 1] else out[i - 1])
    return out


# ------------------------------------------------------------------ segnali

def arxiv_signal(arx: dict, sid: str) -> dict | None:
    series, months = arx.get("series", {}), arx.get("mesi", [])
    if sid not in series or len(months) < FINESTRA:
        return None
    tot = series.get("_totale", {})
    last = months[-FINESTRA:]
    ns = [series[sid].get(m, 0) for m in last]
    return {
        "tendenza": trend(list(range(FINESTRA)), ns, [tot.get(m, 0) for m in last]),
        "media_mese": sum(ns) / FINESTRA,
        "mensile": [{"mese": m, "n": series[sid].get(m, 0), "totale": tot.get(m, 0)} for m in months],
    }


def github_signal(gh: dict, sid: str) -> dict | None:
    series, months, base = gh.get("topics", {}).get(sid), gh.get("mesi", []), gh.get("base", {})
    if series is None or not base or len(months) < FINESTRA:
        return None  # senza base dell'AI il conteggio grezzo non si confronta con gli altri segnali
    last = months[-FINESTRA:]
    ns = [series.get(m, 0) for m in last]
    return {
        "tendenza": trend(list(range(FINESTRA)), ns, [base.get(m, 0) for m in last]),
        "media_mese": sum(ns) / FINESTRA,
        "mensile": [{"mese": m, "n": series.get(m, 0), "base": base.get(m, 0)} for m in months],
    }


def _latest_by_country(snaps: list[dict]) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for x in sorted(snaps, key=lambda x: x["data"]):
        out[x["paese"]] = x
    return out


def _days(a: str, b: str) -> int:
    return (date.fromisoformat(b) - date.fromisoformat(a)).days


def jobs_signal(jobs: dict, sid: str) -> dict | None:
    """Domanda di oggi, tendenza (se le rilevazioni bastano) e rilevazioni da disegnare.

    Valgono solo le rilevazioni fatte con la stessa ricerca della più recente del Paese:
    una ricerca cambiata non è confrontabile.
    """
    snaps = jobs.get("snapshots", [])
    latest = _latest_by_country(snaps)
    if latest:  # un Paese tolto dalla configurazione non resta nella media per sempre
        recente = max(x["data"] for x in latest.values())
        latest = {c: x for c, x in latest.items() if _days(x["data"], recente) <= FINESTRA * GIORNI_MESE}
    q = lambda x: x.get("query", {}).get(sid)  # noqa: E731
    shares = {c: 10000 * x["competenze"][sid] / x["totale"] for c, x in latest.items()
              if x.get("competenze", {}).get(sid) is not None and x.get("totale")}
    if not shares:
        return None
    newest = max(latest[c]["data"] for c in shares)
    same = [x for x in snaps if x["paese"] in shares and q(x) == q(latest[x["paese"]])
            and x.get("totale") and x.get("competenze", {}).get(sid) is not None
            and _days(x["data"], newest) <= FINESTRA * GIORNI_MESE]

    trends = []
    for c in shares:
        own = sorted((x for x in same if x["paese"] == c), key=lambda x: x["data"])
        if len(own) < 2 or _days(own[0]["data"], own[-1]["data"]) < MIN_GIORNI_LAVORO:
            continue
        t = trend([_days(own[0]["data"], x["data"]) / GIORNI_MESE for x in own],
                  [x["competenze"][sid] for x in own], [x["totale"] for x in own])
        if t:
            trends.append(t)
    comb = combine(trends)

    by_day: dict[str, dict[str, float]] = {}
    for x in same:
        by_day.setdefault(x["data"], {})[x["paese"]] = 10000 * x["competenze"][sid] / x["totale"]
    return {
        "tendenza": comb[0] if comb else None,
        "media": round(sum(shares.values()) / len(shares), 3),
        "it": round(shares["it"], 3) if "it" in shares else None,
        "ogni_10mila": {c: round(v, 2) for c, v in sorted(shares.items())},
        "data": newest,
        "rilevazioni": [{"data": d, "media": round(sum(v.values()) / len(v), 3), "it": round(v["it"], 3) if "it" in v else None}
                        for d, v in sorted(by_day.items())],
    }


# ------------------------------------------------------------------ una competenza in un mese

def _summary(t: dict | None) -> dict:
    if t is None:
        return {"variazione": None, "margine": None}
    lo, hi = margine(t, FINESTRA)
    return {"variazione": round(variazione(t, FINESTRA), 4), "margine": [round(lo, 4), round(hi, 4)]}


def _out_signal(kind: str, s: dict | None, peso: float) -> dict | None:
    if s is None:
        return None
    out = {**_summary(s["tendenza"]), "peso": round(peso, 3)}
    if kind == "lavoro":
        out.update({"rilevazioni": s["rilevazioni"], "ogni_10mila": s["ogni_10mila"], "data": s["data"]})
    else:
        out["mensile"] = s["mensile"]
    return out


def _perche(sig: dict, used: list[tuple[str, dict]]) -> str:
    """Il motivo dell'incertezza, dai segnali che da soli hanno un margine largo."""
    parts = []
    for kind, t in used:
        if rapporto(t, FINESTRA) <= RAPPORTO_MAX:
            continue
        n = sig[kind].get("media_mese")
        parts.append(f"pochi {ETICHETTE[kind]} ({round(n)} al mese)" if n is not None and n < POCHI
                     else f"{ETICHETTE[kind]} con andamento irregolare")
    return " e ".join(parts) if parts else "segnali con andamento irregolare"


def _alive(links: dict, url: str) -> bool:
    v = links.get(url)
    return v.get("ok", True) if isinstance(v, dict) else True


def _row(sk: dict, arx: dict, gh: dict, jobs: dict) -> dict:
    sid = sk["id"]
    sig = {"arxiv": arxiv_signal(arx, sid), "github": github_signal(gh, sid), "lavoro": jobs_signal(jobs, sid)}
    used = [(k, s["tendenza"]) for k, s in sig.items() if s and s["tendenza"]]
    comb = combine([t for _, t in used])
    pesi = dict(zip([k for k, _ in used], comb[1])) if comb else {}
    slancio = lo_hi = perche = None
    incerto = False
    if comb:
        t = comb[0]
        slancio = round(variazione(t, FINESTRA), 4)
        lo, hi = margine(t, FINESTRA)
        lo_hi = [round(lo, 4), round(hi, 4)]
        incerto = rapporto(t, FINESTRA) > RAPPORTO_MAX
        perche = _perche(sig, used) if incerto else None
    lav = sig["lavoro"]
    return {
        "slancio": slancio,
        "slancio_margine": lo_hi,
        "domanda": lav["media"] if lav else None,
        "domanda_it": lav["it"] if lav else None,
        "incerto": incerto,
        "incerto_perche": perche,
        "segnali": {k: _out_signal(k, s, pesi.get(k, 0.0)) for k, s in sig.items()},
    }


# ------------------------------------------------------------------ storico e uscita

def _meno_mesi(ym: str, k: int) -> str:
    n = int(ym[:4]) * 12 + int(ym[5:7]) - 1 - k
    return f"{n // 12:04d}-{n % 12 + 1:02d}"


def _months_before(arx: dict, gh: dict, jobs: dict, k: int, ultimo: str) -> tuple[dict, dict, dict, str]:
    """I dati come erano k mesi prima di `ultimo`: serie fino a quel mese, rilevazioni di almeno 28 x k giorni prima."""
    etichetta = _meno_mesi(ultimo, k)
    if k == 0:
        return arx, gh, jobs, etichetta
    arx_p = {**arx, "mesi": [m for m in arx.get("mesi", []) if m <= etichetta]}
    gh_p = {**gh, "mesi": [m for m in gh.get("mesi", []) if m <= etichetta]}
    snaps = jobs.get("snapshots", [])
    if snaps:
        cutoff = date.fromordinal(date.fromisoformat(max(x["data"] for x in snaps)).toordinal() - 28 * k).isoformat()
        snaps = [x for x in snaps if x["data"] <= cutoff]
    return arx_p, gh_p, {**jobs, "snapshots": snaps}, etichetta


def _publish(points: list[tuple[str, dict]], ids: list[str]) -> None:
    """Quadrante calcolato e pubblicato di ogni punto, dal più vecchio al più recente."""
    for sid in ids:
        later = None
        for _, rows in reversed(points):  # domanda mancante: quella del primo punto successivo che ce l'ha
            r = rows[sid]
            if r["domanda"] is not None:
                later = r["domanda"]
            r["calcolato"] = quadrant(r["slancio"], r["domanda"] if r["domanda"] is not None else later)
        for (_, rows), q in zip(points, published([rows[sid]["calcolato"] for _, rows in points])):
            rows[sid]["pubblicato"] = q


def run(skills: list[dict], today: date) -> dict:
    arx = read_json("arxiv.json", {}) or {}
    if arx.get("completo") is False:  # giro interrotto: con poche serie i confronti sarebbero falsati
        arx = {}
    gh = read_json("github.json", {}) or {}
    jobs = read_json("jobs.json", {}) or {}
    try:
        links = (read_json("risorse.json", {}) or {}).get("link", {})
    except (ValueError, AttributeError):
        links = {}
    if not isinstance(links, dict):
        links = {}

    points: list[tuple[str, dict]] = []  # dal più recente al più vecchio, poi girati
    ultimi = [x["mesi"][-1] for x in (arx, gh) if x.get("mesi")]
    ultimo = max(ultimi) if ultimi else None
    for k in range(MAX_STORICO if ultimo else 0):
        a, g, j, etichetta = _months_before(arx, gh, jobs, k, ultimo)
        if max(len(a.get("mesi", [])), len(g.get("mesi", []))) < FINESTRA:
            break
        rows = {sk["id"]: _row(sk, a, g, j) for sk in skills}
        if all(r["slancio"] is None for r in rows.values()):
            break
        points.append((etichetta, rows))
    if not points:
        raise ValueError("radar vuoto: mancano sia arXiv sia GitHub")
    points.reverse()
    _publish(points, [sk["id"] for sk in skills])

    now = points[-1][1]
    prev = points[-2][1] if len(points) > 1 else {}
    out_rows = []
    for sk in skills:
        sid = sk["id"]
        r, p = now[sid], prev.get(sid, {})
        out_rows.append({
            "id": sid,
            "nome": sk["nome"],
            "breve": sk.get("breve", sk["nome"]),
            "plurale": bool(sk.get("plurale", False)),  # per accordare il verbo: «Multimodali entrano»
            "descrizione": sk.get("descrizione", ""),
            "slancio": r["slancio"],
            "slancio_margine": r["slancio_margine"],
            "domanda": r["domanda"],
            "domanda_it": r["domanda_it"],
            "quadrante": r["pubblicato"],
            "quadrante_calcolato": r["calcolato"],
            "incerto": r["incerto"],
            "incerto_perche": r["incerto_perche"],
            "slancio_prec": p.get("slancio"),
            "domanda_prec": p.get("domanda"),
            "quadrante_prec": p.get("pubblicato"),
            "segnali": r["segnali"],
            "per_iniziare": [{"lingua": "en", **x} for x in sk.get("risorse", []) if _alive(links, x["url"])],
            "in_crescita": gh.get("in_crescita", {}).get(sid, []),
        })

    write_json(OUT, {
        "versione": VERSIONE,
        "generato": today.isoformat(),
        "soglie": {"slancio": SOGLIA_SLANCIO, "domanda": SOGLIA_DOMANDA, "rapporto_max": RAPPORTO_MAX},
        "quadranti": QUADRANTS,
        "competenze": out_rows,
        "storico": [{"mese": m, "competenze": {sid: {k: r[k] for k in ("slancio", "domanda", "calcolato", "pubblicato", "incerto")}
                                                for sid, r in rows.items()}} for m, rows in points],
    })
    return {"competenze": len(out_rows), "posizionate": sum(1 for r in out_rows if r["quadrante"]),
            "incerte": sum(1 for r in out_rows if r["incerto"])}
