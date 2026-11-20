// Il testo della pagina Privacy del sito, in un posto solo: chi lo aggiorna cambia questo file, e la data in fondo.
// Dice quello che il contatore delle visite fa e quello che Umami e GitHub scrivono di fare, e nient'altro (ADR 0004).
// Una copia del progetto che accende il proprio contatore cambia TITOLARE: il contatto è quello di chi pubblica la copia.

/** Un pezzo di un paragrafo: testo, o un link esterno con le sue parole. */
export type Pezzo = string | { testo: string; url: string };

export interface SezioneDellaPrivacy {
  titolo: string;
  paragrafi: Pezzo[][];
}

/** Il titolare del trattamento si contatta dal profilo GitHub; le richieste passano dalle issue del repository. */
export const TITOLARE = {
  profilo: 'https://github.com/simones99',
  issue: 'https://github.com/simones99/ai-radar/issues',
} as const;

const INFORMATIVA_DI_UMAMI = 'https://umami.is/privacy';

/** La pagina: il titolo, la descrizione per i motori e le anteprime, la frase in testa, le sezioni e la data dell'ultimo aggiornamento. */
export interface TestoDellaPrivacy {
  titolo: string;
  descrizione: string;
  apertura: string;
  sezioni: SezioneDellaPrivacy[];
  aggiornata: string;
}

export const PRIVACY: TestoDellaPrivacy = {
  titolo: 'Privacy',
  descrizione: 'Quali dati raccoglie AI Radar quando lo leggi, perché e per quanto tempo: le visite si contano con Umami Cloud, senza cookie.',
  apertura: 'Questa pagina dice quali dati raccoglie AI Radar quando lo leggi, perché, per quanto tempo e cosa puoi chiedere.',
  sezioni: [
    {
      titolo: 'Chi è il titolare',
      paragrafi: [
        ['AI Radar è un progetto personale. Il titolare del trattamento si contatta dal suo ', { testo: 'profilo GitHub', url: TITOLARE.profilo }, '.'],
        ['Per una richiesta che contiene dati personali, apri una ', { testo: 'issue nel repository', url: TITOLARE.issue }, ' senza scriverli: ti viene indicato un canale privato.'],
      ],
    },
    {
      titolo: 'Cosa si raccoglie e perché',
      paragrafi: [
        ['Il sito conta le visite con Umami Cloud, per sapere quante persone leggono la home, le edizioni e le competenze, e quante tornano.'],
        ['A ogni pagina aperta lo script di Umami manda l’indirizzo e il titolo della pagina, la pagina da cui arrivi, la lingua del browser e la dimensione dello schermo. Dalla richiesta Umami ricava il browser, il sistema operativo e il tipo di dispositivo, e dall’indirizzo IP una posizione approssimativa: paese, regione e città.'],
        ['Per riconoscere chi torna, Umami calcola un codice del visitatore con un hash dell’indirizzo IP e del browser, insieme a un sale che cambia ogni mese. L’indirizzo IP serve al calcolo, ma le statistiche non lo contengono.'],
        ['Il contatore non usa cookie e non scrive niente nel tuo browser. I numeri si guardano solo tutti insieme, e non si incrociano con altri dati.'],
        ['Puoi bloccare lo script con un ad-blocker o con le impostazioni del browser: il sito funziona lo stesso.'],
      ],
    },
    {
      titolo: 'Base giuridica',
      paragrafi: [
        ['Il conteggio delle visite si basa sul legittimo interesse del titolare a capire se e come il sito viene letto (art. 6, par. 1, lett. f del GDPR), con dati ridotti al minimo e senza cookie.'],
        ['Il sito non ha un banner di consenso perché non usa cookie né altri strumenti che scrivono nel browser per contare le visite.'],
      ],
    },
    {
      titolo: 'Per quanto tempo',
      paragrafi: [
        ['Le statistiche restano su Umami 6 mesi, il tempo del piano Hobby. Il codice del visitatore cambia ogni mese.'],
        ['I log tecnici e di sicurezza di Umami, che possono contenere l’indirizzo IP, seguono i tempi di Umami: ne parla la sua ', { testo: 'informativa', url: INFORMATIVA_DI_UMAMI }, '.'],
      ],
    },
    {
      titolo: 'Chi tratta i dati per conto del titolare',
      paragrafi: [
        ['Umami Software, Inc. tratta i dati delle visite per conto del titolare con il servizio Umami Cloud, come responsabile del trattamento.'],
        ['Le statistiche sono conservate in UE. Rete di distribuzione, sicurezza, assistenza e log possono passare da servizi fuori dall’UE.'],
        ['Le regole di Umami sono nella sua ', { testo: 'informativa sulla privacy', url: INFORMATIVA_DI_UMAMI }, ', e i fornitori di cui si serve nell’', { testo: 'elenco dei suoi sub-responsabili', url: 'https://umami.is/subprocessors' }, '.'],
      ],
    },
    {
      titolo: 'Chi ospita il sito',
      paragrafi: [
        ['Il sito è pubblicato con GitHub Pages. Quando apri una pagina GitHub registra il tuo indirizzo IP, per sicurezza, come dice la ', { testo: 'documentazione di GitHub Pages', url: 'https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages#data-collection' }, '. Il resto è nell’', { testo: 'informativa sulla privacy di GitHub', url: 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement' }, '.'],
      ],
    },
    {
      titolo: 'Nel tuo browser',
      paragrafi: [
        ['L’app tiene nel browser solo le scelte di chi legge (ruolo, mercato, settore, area), per ritrovarle alla visita dopo. Non escono dal browser e non servono a contare le visite.'],
      ],
    },
    {
      titolo: 'I tuoi diritti',
      paragrafi: [
        ['Puoi chiedere di accedere ai tuoi dati, di rettificarli, di cancellarli, di limitarne il trattamento e di opporti al trattamento (artt. 15-21 del GDPR), con il contatto del titolare scritto sopra.'],
        ['Le statistiche sono aggregate e il codice del visitatore cambia ogni mese: di solito il titolare non può collegare una visita a una persona, e in quel caso te lo dice (art. 11 del GDPR).'],
        ['Puoi anche proporre un reclamo al ', { testo: 'Garante per la protezione dei dati personali', url: 'https://www.garanteprivacy.it/' }, '.'],
      ],
    },
  ],
  aggiornata: 'Aggiornata il 20 novembre 2026.',
};
