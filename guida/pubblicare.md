# Pubblicarlo in 10 minuti

1. **Crea il repository.** Su GitHub: *New repository*, nome per esempio `ai-radar`, visibilità **Public** (GitHub Pages è gratuito per i repository pubblici).
2. **Prepara le impostazioni prima di caricare i file**, perché il primo caricamento avvia subito il workflow:
    - *Settings → Pages → Build and deployment → Source:* **GitHub Actions**;
    - *Settings → Actions → General → Workflow permissions →* **Read and write permissions** (serve al workflow per salvare i dati nel repository);
    - le chiavi facoltative in *Settings → Secrets and variables → Actions → New repository secret* (vedi [Chiavi e Adzuna](chiavi.md)). Senza chiavi la dashboard funziona lo stesso; i due grafici che ne hanno bisogno spiegano cosa manca;
    - se vuoi contare le visite, la variabile facoltativa `UMAMI_WEBSITE_ID` in *Settings → Secrets and variables → Actions → Variables* (vedi [Le visite](visite.md)). Senza, il sito non conta niente.
3. **Carica i file.** Dalla cartella del progetto:

    ```bash
    git init -b main
    git add .
    git commit -m "Prima versione di AI Radar"
    git remote add origin https://github.com/<tuo-utente>/ai-radar.git
    git push -u origin main
    ```

    In alternativa usa *Add file → Upload files* sul sito di GitHub, trascinando il contenuto della cartella; in quel caso controlla che la cartella `.github` sia stata caricata, perché alcuni sistemi nascondono le cartelle che iniziano con il punto.

4. **Avvia il primo giro a mano.** Il caricamento fa partire *Aggiorna e pubblica*, che però pubblica il sito con i dati già presenti nel repository e non ne raccoglie di nuovi. Per raccoglierli usa *Actions → Aggiorna e pubblica → Run workflow*, lasciando spenta la casella «Crea l'edizione della settimana dei dati»; se hai saltato il passo 2, completalo prima. Il primo giro di raccolta dura circa 25 minuti perché ricostruisce 13 mesi di storico; i successivi pochi minuti. Da lì in poi i dati si raccolgono da soli ogni lunedì, e con loro esce l'edizione della settimana.
5. La dashboard è su `https://<tuo-utente>.github.io/ai-radar/`, e questa guida su `https://<tuo-utente>.github.io/ai-radar/guida/`. I link alle edizioni compaiono in home con la prima edizione. Gli indirizzi di feed e anteprime seguono il nome del tuo repository.

    Il sito si pubblica solo su `<tuo-utente>.github.io`, con o senza il nome del repository: un dominio proprio, con un CNAME, non è previsto. Il workflow ricava l'indirizzo base dal proprietario e dal nome del repository, e da lì nascono canonical, `og:url`, immagini di anteprima, feed, sitemap e il link al profilo GitHub dell'autore. Su un altro host tutti questi indirizzi punterebbero a `github.io`, e `robots.txt` mancherebbe. `AI_RADAR_BASE_URL` la imposta il workflow, e in locale serve solo per le prove: non sceglie l'indirizzo del sito pubblicato.

6. **Segnala la sitemap a Google.** La build scrive `sitemap.xml` accanto all'app, con l'indirizzo di ogni pagina statica: home, competenze, archivio ed edizioni. Scrive anche `robots.txt`, ma solo quando l'indirizzo base è la radice di un dominio, perché i crawler lo cercano solo lì: per un sito in `/ai-radar/` non esce. Il workflow ricava l'indirizzo base dal nome del repository: se lo chiami `<tuo-utente>.github.io`, il sito sta alla radice di `https://<tuo-utente>.github.io/` e `robots.txt` esce da solo, con l'indicazione della sitemap. Dopo il primo rilascio, quindi, la sitemap va segnalata a mano: in [Google Search Console](https://search.google.com/search-console) aggiungi una proprietà di tipo «Prefisso URL» con l'indirizzo base, `https://<tuo-utente>.github.io/ai-radar/`, e in *Sitemap* inserisci `sitemap.xml`, cioè `https://<tuo-utente>.github.io/ai-radar/sitemap.xml`. La guida ha una sitemap sua, `guida/sitemap.xml`, che si segnala allo stesso modo.
