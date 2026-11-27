"""Salva nel repository ciò che il workflow ha scritto: un commit e il push sul ramo del giro, in GITHUB_REF_NAME.

Uso:  python scripts/salva_nel_repo.py <percorso> <messaggio> [--attese 300,900]

Con --attese, se pull o push non riescono per un motivo che non è un conflitto, come la rete o GitHub che non risponde,
rifà pull --rebase e push dopo ciascuna attesa, in secondi. Un conflitto non si ritenta: aspettare non lo risolve.
Un errore che non dipende dal tempo, come file modificati e non salvati, si ritenta lo stesso e finisce in rosso dopo le attese.
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
import time
from pathlib import Path

AUTORE = ("github-actions[bot]", "41898282+github-actions[bot]@users.noreply.github.com")


def git(*argomenti: str) -> None:
    subprocess.run(["git", *argomenti], check=True)


def rebase_in_corso() -> bool:
    # una riga per percorso: in un worktree git li dà assoluti, e possono contenere spazi
    cartelle = subprocess.run(["git", "rev-parse", "--git-path", "rebase-merge", "--git-path", "rebase-apply"], check=True, capture_output=True, text=True).stdout.splitlines()
    return any(Path(c).exists() for c in cartelle)


def salva(percorso: str, messaggio: str, ramo: str, attese: list[int] | None = None) -> bool:
    """False se non c'era niente di nuovo da salvare."""
    # qui e non in un passo a parte: un salvataggio non dipende da un altro, che su certi giri non parte
    git("config", "user.name", AUTORE[0])
    git("config", "user.email", AUTORE[1])
    git("add", percorso)
    if subprocess.run(["git", "diff", "--cached", "--quiet"]).returncode == 0:
        print(f"Niente di nuovo da salvare in {percorso}.")
        return False
    # il commit una volta sola: i tentativi rifanno solo pull --rebase e push. Ripetere tutto il comando sarebbe sbagliato,
    # perché dopo il commit «Niente di nuovo» farebbe uscire bene un salvataggio mai arrivato
    git("commit", "-m", messaggio)
    attese = attese or []
    tentativi = len(attese) + 1
    # dopo l'ultimo tentativo nessuna attesa
    for tentativo, attesa in enumerate([*attese, None], start=1):
        try:
            # un push arrivato mentre il giro girava: i file del giro vanno sopra. Il rebase passa se il push non tocca i file
            # scritti dal giro, e data/ la scrivono solo i giri programmati e manuali di questo workflow, uno alla volta:
            # mai quelli del push. L'unica eccezione sono le correzioni a mano, su edizioni già uscite, che il giro non
            # riscrive mai. Se il push tocca i percorsi in `on.push`, ha già messo in coda il suo giro, che pubblicherà
            # anche lui, con i file appena salvati
            git("pull", "--rebase", "origin", ramo)
            git("push", "origin", f"HEAD:{ramo}")
            return True
        except subprocess.CalledProcessError:
            if rebase_in_corso():
                # rimesso com'era, con il commit del giro e senza file a metà
                git("rebase", "--abort")
                print(f"Il rebase su origin/{ramo} si ferma su un conflitto: è annullato, e aspettare non lo risolve.", file=sys.stderr)
                raise
            if attesa is None:
                # con un tentativo solo, come per l'edizione, l'errore da annotare lo scrive il workflow
                if attese:
                    print(f"::error::Il salvataggio di {percorso} non è arrivato dopo {tentativi} tentativi in circa {sum(attese) // 60} minuti.", flush=True)
                raise
            print(f"::warning::Il salvataggio di {percorso} non è arrivato al tentativo {tentativo} di {tentativi}: riprovo fra {attesa // 60} minuti.", flush=True)
            time.sleep(attesa)
    raise RuntimeError("il ciclo dei tentativi finisce sempre con un return o un raise")


def main(argomenti: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("percorso")
    parser.add_argument("messaggio")
    parser.add_argument("--attese", type=lambda testo: [int(s) for s in testo.split(",")], default=[], help="secondi da aspettare prima di ogni nuovo tentativo, separati da virgole")
    opzioni = parser.parse_args(argomenti)
    try:
        salva(opzioni.percorso, opzioni.messaggio, os.environ["GITHUB_REF_NAME"], opzioni.attese)
    except subprocess.CalledProcessError as errore:
        print(f"Non salvato: {' '.join(errore.cmd)} è uscito con {errore.returncode}.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
