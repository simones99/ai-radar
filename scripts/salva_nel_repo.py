"""Salva nel repository ciò che il workflow ha scritto: un commit e il push sul ramo del giro, in GITHUB_REF_NAME.

Uso:  python scripts/salva_nel_repo.py <percorso> <messaggio>
"""
from __future__ import annotations

import os
import subprocess
import sys

AUTORE = ("github-actions[bot]", "41898282+github-actions[bot]@users.noreply.github.com")


def git(*argomenti: str) -> None:
    subprocess.run(["git", *argomenti], check=True)


def salva(percorso: str, messaggio: str, ramo: str) -> bool:
    """False se non c'era niente di nuovo da salvare."""
    # qui e non in un passo a parte: un salvataggio non dipende da un altro, che su certi giri non parte
    git("config", "user.name", AUTORE[0])
    git("config", "user.email", AUTORE[1])
    git("add", percorso)
    if subprocess.run(["git", "diff", "--cached", "--quiet"]).returncode == 0:
        print(f"Niente di nuovo da salvare in {percorso}.")
        return False
    git("commit", "-m", messaggio)
    # un push arrivato mentre il giro girava: i file del giro vanno sopra. Il rebase passa se il push non tocca i file
    # scritti dal giro, e data/ la scrivono solo i giri programmati e manuali di questo workflow, uno alla volta:
    # mai quelli del push. L'unica eccezione sono le correzioni a mano, su edizioni già uscite, che il giro non
    # riscrive mai. Se il push tocca i percorsi in `on.push`, ha già messo in coda il suo giro, che pubblicherà
    # anche lui, con i file appena salvati
    git("pull", "--rebase", "origin", ramo)
    git("push", "origin", f"HEAD:{ramo}")
    return True


if __name__ == "__main__":
    try:
        salva(sys.argv[1], sys.argv[2], os.environ["GITHUB_REF_NAME"])
    except subprocess.CalledProcessError as errore:
        print(f"Non salvato: {' '.join(errore.cmd)} è uscito con {errore.returncode}.", file=sys.stderr)
        sys.exit(1)
