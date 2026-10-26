"""PreToolUse su Bash: avvisa quando uno script Python dentro un heredoc riscrive file del repo.

Le modifiche fatte così si rompono sulle virgolette del heredoc e sulle sequenze come "\\."
nelle stringhe non raw; lo strumento Edit fa la stessa sostituzione senza questi rischi.
Non blocca il comando: aggiunge solo un avviso per l'agente.
"""
import json
import re
import sys

comando = json.load(sys.stdin).get("tool_input", {}).get("command", "")
if re.search(r"python3?\s+-\s*<<", comando) and "write_text" in comando:
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "additionalContext": "Per modificare i file del repo usa lo strumento Edit (old_string/new_string), non uno "
                             "script Python in un heredoc: le virgolette del heredoc e le sequenze come \"\\.\" nelle "
                             "stringhe non raw rompono le sostituzioni.",
    }}))
