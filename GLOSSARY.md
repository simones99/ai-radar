# AI Radar

Una dashboard pubblica sull'AI, costruita su dati aperti che si aggiornano ogni settimana. Ha due pubblici: le persone, che vogliono sapere su cosa formarsi, e le organizzazioni, che guardano l'AI in Italia.

## Language

**Testa**:
Una delle due metà del prodotto, ciascuna con il suo pubblico: *Per te* (le persone) e *Per la tua organizzazione* (le organizzazioni).
_Avoid_: sezione, ingresso

**Competenza**:
Una delle capacità sull'AI che il radar segue, misurata su ricerca, open source e lavoro.
_Avoid_: skill, tema

**Ruolo**:
L'area di lavoro di chi legge la testa *Per te*: Sviluppo software (ML incluso), Prodotto, Dati e analisi, Legale e compliance. Indica quali competenze riguardano quel lettore, senza cambiare le misure del radar; senza un ruolo scelto si vedono tutte.
_Avoid_: profilo, persona, mestiere, sviluppatore, PM, analista, legale (come nomi dei ruoli)

**Settore**:
L'attività economica di un'organizzazione, come la classifica Eurostat (per esempio manifattura, commercio, ICT). Finanza, pubblica amministrazione, sanità, istruzione e agricoltura non sono settori rilevati.
_Avoid_: industria, comparto, ambito

**Adozione**:
La quota di imprese con almeno 10 addetti che usano almeno una tecnologia di AI.
_Avoid_: diffusione, uso dell'AI (per le imprese)

**Scopo**:
L'attività aziendale per cui un'impresa che usa l'AI la impiega, per esempio marketing e vendite o logistica.
_Avoid_: uso, applicazione, caso d'uso

**Modello nazionale**:
Un modello AI attribuito al Paese in cui ha sede l'organizzazione che lo sviluppa. Un modello sviluppato da organizzazioni di Paesi diversi conta solo per il Paese della prima organizzazione indicata. Un modello senza Paese non è un modello nazionale.
_Avoid_: modello sovrano, modello locale, modello del Paese

**Area**:
Uno dei blocchi in cui si confrontano i modelli nazionali: USA, Cina (Hong Kong compresa), Regno Unito, UE e Altri, cioè tutti gli altri Paesi, Taiwan compresa. Dentro l'UE si vedono anche i singoli Paesi, Italia compresa.
_Avoid_: regione, blocco, zona

**Calcolo di addestramento**:
La quantità di calcolo, in FLOP, usata per addestrare un modello. Dice quanto un'area investe nei modelli.
_Avoid_: compute, potenza di calcolo

**Modello di grande scala**:
Un modello AI addestrato con almeno 1e23 FLOP di calcolo di addestramento. Sono i modelli su cui si contano le aree.
_Avoid_: modello grande, modello di frontiera, modello notevole

**Capacità**:
Quanto un modello è bravo nei compiti verificabili, misurata dall'Epoch Capabilities Index. Ha senso solo nel confronto tra modelli, non come valore assoluto. Dice quanto valgono i risultati di un'area.
_Avoid_: competenza, intelligenza, potenza (per un modello)

**Barriera**:
Un motivo per cui un'impresa che ha considerato l'AI non la usa, per esempio i costi o la mancanza di competenze.
_Avoid_: ostacolo, freno
