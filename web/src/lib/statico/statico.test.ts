// La mappa dei file pubblici del sito: le edizioni, e il dataset, di cui radar.json fa nascere le pagine delle competenze.
import { within } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import type { Dataset } from '../data/types';
import { creaEdizione, fileDelleEdizioni, type Edizione } from '../edizioni';
import { indirizzoBase } from '../indirizzoBase';
import { ID, pagine, piede, righeSulContatore, scriptDiUmami } from '../test/contatore';
import { FIXTURE } from '../test/fixtures';
import { apri, pulito } from '../test/pagina';
import { FONTI_DEI_DATI } from '../text/fonti';
import { filePubblici, type ContenutoStatico, type OpzioniFilePubblici } from '.';

/** Le opzioni delle pagine, senza la home. */
const opzioniDellePagine = { indirizzoBase: 'https://esempio.org/ai-radar/', foglio: 'assets/index-abc.css' };
/** L'indirizzo assoluto di una cartella del sito, dall'indirizzo base delle opzioni. */
const assoluto = (cartella: string) => `${opzioniDellePagine.indirizzoBase}${cartella}`;
/** La testa della home uscita dalla build: titolo, descrizione, canonical, anteprima e foglio di stile. */
const TESTA_HOME = `<head>
<title>AI Radar</title>
<meta name="description" content="Cosa succede nell'AI ogni settimana." />
<link rel="canonical" href="${assoluto('')}" />
<meta property="og:title" content="AI Radar" />
<meta property="og:url" content="${assoluto('')}" />
<meta property="og:image" content="${assoluto('anteprima.png')}" />
<link rel="stylesheet" href="./assets/index-abc.css">
</head>`;
/** La home uscita dalla build: la testa, e il contenitore vuoto dell'app con il suo script. */
const HOME = `<!doctype html><html lang="it">${TESTA_HOME}<body>
<div id="app"></div>
<script type="module" src="./assets/index-abc.js"></script>
</body></html>`;
const opzioni: OpzioniFilePubblici = { ...opzioniDellePagine, home: HOME };
const d = FIXTURE as Dataset;
const edizione = creaEdizione(d, null) as Edizione;
const PAGINA = `edizioni/${edizione.settimana}/index.html`;
/** Il link della testata verso l'indice delle competenze, come lo scrive la pagina. */
const LINK_COMPETENZE = /<a href="[^"]*competenze\/">Competenze<\/a>/;
/** La pagina Privacy, che c'è solo con l'ID di Umami. */
const PRIVACY = 'privacy/index.html';

describe('i file pubblici del sito', () => {
  it('con un’edizione e il radar ci sono la pagina dell’edizione, l’archivio e il feed', () => {
    const file = filePubblici({ edizioni: [edizione], dataset: d }, opzioni);
    expect(Object.keys(file)).toEqual(expect.arrayContaining([PAGINA, 'edizioni/index.html', 'feed.xml']));
  });

  it('senza il radar i file sono esattamente quelli delle edizioni, più la home e la sitemap', () => {
    const { 'sitemap.xml': sitemap, 'index.html': home, ...resto } = filePubblici({ edizioni: [edizione], dataset: {} }, opzioni);
    expect(sitemap).toBeDefined();
    expect(home).toBeDefined();
    expect(resto).toEqual(fileDelleEdizioni([edizione], opzioniDellePagine));
  });

  it('la home c’è sempre, anche senza edizioni né dati: con la sitemap è tutta la mappa', () => {
    expect(Object.keys(filePubblici({ edizioni: [], dataset: {} }, opzioni)).sort()).toEqual(['index.html', 'sitemap.xml']);
  });

  it('il radar aggiunge le pagine delle competenze, e i file delle edizioni cambiano solo per il link «Competenze» nella testata', () => {
    const file = filePubblici({ edizioni: [edizione], dataset: d }, opzioni);
    expect(Object.keys(file).filter((p) => p.startsWith('competenze/')).length).toBeGreaterThan(0);
    for (const [percorso, contenuto] of Object.entries(fileDelleEdizioni([edizione], opzioniDellePagine))) {
      expect(file[percorso].replace(LINK_COMPETENZE, ''), percorso).toBe(contenuto);
    }
  });
});

describe('la home in chiaro', () => {
  const FRASE_DI_APERTURA = "Su cosa formarti e cosa succede all'AI in Italia, con dati aperti aggiornati ogni lunedì.";
  /** La mappa dei file pubblici con la home della build. */
  const fileDi = (c: ContenutoStatico) => filePubblici(c, opzioni);
  /**
   * La home della mappa letta come la legge un lettore di schermo, senza eseguire niente, con la mappa da cui viene e il testo
   * della pagina di fila. Il corpo della home è il contenitore dell'app e il suo script, vuoto: il testo è quello della home in chiaro.
   * Ogni lettura sostituisce la pagina del test: si finisce di leggere una home prima di aprirne un'altra.
   */
  const leggi = (c: ContenutoStatico) => {
    const file = fileDi(c);
    return Object.assign(apri(file['index.html']), { file, testo: pulito(document.body.textContent) });
  };
  type Home = ReturnType<typeof leggi>;
  const titoli = (home: Home, livello: number) => home.queryAllByRole('heading', { level: livello }).map((h) => pulito(h.textContent));
  /** Dei link, il testo e dove portano. */
  const coppie = (link: HTMLElement[]): [string, string][] => link.map((a) => [pulito(a.textContent), a.getAttribute('href')!]);

  it('c’è sempre, anche senza edizioni né dati: la testata con il nome del sito e la frase di apertura come unico h1', () => {
    const home = leggi({ edizioni: [], dataset: {} });
    expect(home.getByRole('banner')).toHaveTextContent('AI Radar');
    expect(titoli(home, 1)).toEqual([FRASE_DI_APERTURA]);
    expect(home.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('con una data di raccolta illeggibile, o un giorno che non esiste, la build esce lo stesso, senza scrivere una settimana sbagliata', () => {
    for (const aggiornato of ['Nov 9 2026', '2026-02-30T06:15:00+00:00']) {
      const home = leggi({ edizioni: [], dataset: { ...d, status: { ...d.status!, aggiornato } } });
      expect(titoli(home, 1), aggiornato).toEqual([FRASE_DI_APERTURA]);
      expect(home.testo, aggiornato).not.toContain('Settimana del');
    }
  });

  it('con tutti i dati ha la settimana dei dati, la frase come unico h1 e le due porte con la loro notizia', () => {
    const home = leggi({ edizioni: [edizione], dataset: d });
    const app = home.testo;
    expect(app).toContain('Settimana del 12 ott 2026');
    expect(titoli(home, 1)).toEqual([FRASE_DI_APERTURA]);
    expect(home.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(titoli(home, 2)).toEqual(['Per te Su cosa formarti', "Per la tua organizzazione L'AI in Italia", 'La situazione']);
    expect(app).toContain('MCP entra tra le competenze da imparare ora; RAG esce');
    expect(app).toContain('Radar delle competenze su arXiv, GitHub e The Adzuna API · dati al 15 ott 2026');
    expect(app).toContain("16% delle imprese italiane usa l'AI (UE: 20%)");
    // la settimana sta sopra la frase, le porte sotto
    expect(app.indexOf('Settimana del 12 ott 2026')).toBeLessThan(app.indexOf(FRASE_DI_APERTURA));
    expect(app.indexOf(FRASE_DI_APERTURA)).toBeLessThan(app.indexOf('MCP entra'));
  });

  it('le porte sono articoli con il nome della testa, e «La situazione» è una regione con un gruppo per testa', () => {
    const p = leggi({ edizioni: [edizione], dataset: d });
    expect(p.getByRole('article', { name: 'Per te Su cosa formarti' })).toHaveTextContent('MCP entra tra le competenze da imparare ora; RAG esce');
    expect(p.getByRole('article', { name: "Per la tua organizzazione L'AI in Italia" })).toHaveTextContent("16% delle imprese italiane usa l'AI (UE: 20%)");
    const situazione = within(p.getByRole('region', { name: 'La situazione' }));
    expect(situazione.getByRole('group', { name: 'Per te Su cosa formarti' })).toHaveTextContent('2 competenze su 5 da imparare ora');
    expect(situazione.getByRole('group', { name: "Per la tua organizzazione L'AI in Italia" })).toHaveTextContent("Imprese italiane che usano l'AI nel 2025");
  });

  describe('le card', () => {
    /**
     * Il testo sotto il titolo di una testa nella sezione «La situazione», fino alla testa dopo: quello che legge chi scorre la pagina.
     * Ogni testa è un gruppo con il suo nome, e il gruppo comincia con il titolo.
     */
    const sottoLaTesta = (home: Home, testa: string) => {
      const gruppo = within(home.getByRole('region', { name: 'La situazione' })).getByRole('group', { name: (nome) => nome.startsWith(testa) });
      const titolo = pulito(within(gruppo).getByRole('heading', { level: 3 }).textContent);
      const letto = pulito(gruppo.textContent);
      expect(letto.startsWith(titolo), testa).toBe(true);
      return letto.slice(titolo.length);
    };
    /** Ogni testo atteso si legge nel testo dato, nell'ordine. */
    const inOrdine = (letto: string, attesi: readonly string[], dove: string) => {
      let da = 0;
      for (const atteso of attesi) {
        const i = letto.indexOf(atteso, da);
        expect(i, `${dove}: ${atteso}`).toBeGreaterThanOrEqual(0);
        da = i + atteso.length;
      }
    };
    const NOMI = ['Competenze', 'Modelli e ricerca', 'Open source', 'Notizie', 'GeopoliticAI', 'Business', 'Persone e lavoro', 'Norme', 'Rapporti'];

    it('con tutti i dati ci sono le nove card divise per testa, con il nome della testa sopra e per ognuna nome, cifra con l’unità e frase', () => {
      const home = leggi({ edizioni: [edizione], dataset: d });
      expect(titoli(home, 3)).toEqual(['Per te Su cosa formarti', "Per la tua organizzazione L'AI in Italia"]);
      expect(titoli(home, 4)).toEqual(NOMI);
      // dalle fixture, sulla data dei dati: giovedì 15 ottobre 2026. Competenze ha già il numero nella frase
      const perTe = [
        "Competenze 2 competenze su 5 da imparare ora: crescono più dell'AI e hanno almeno 3 annunci ogni 10mila.",
        "Modelli e ricerca ×4,8 all'anno Quanto cresce il calcolo per addestrare i modelli più grandi, dal 2018.",
        'Open source 37 su 100 Modelli di tendenza su Hugging Face di tipo «immagine e testo».',
        'Notizie 2 Notizie nei 7 giorni fino al 15 ott 2026, da 2 fonti.',
      ];
      const italia = [
        'GeopoliticAI 18,8 punti sotto gli USA Capacità del miglior modello europeo, Mistral Large 4, nel 2026, anno in corso: 150,0 ECI. Gli USA arrivano a 168,8, la Cina a 157,9.',
        "Business 16% Imprese italiane che usano l'AI nel 2025. UE: 20%.",
        "Persone e lavoro 30% Italiani che usano l'AI generativa. Mondo: 18%.",
        "Norme 48 giorni Alla prossima scadenza dell'AI Act, il 2 dic 2026: fine della transizione per la marcatura.",
        'Rapporti Ottobre 2026 Prossimo rapporto previsto: State of AI Report.',
      ];
      inOrdine(sottoLaTesta(home, 'Per te'), perTe, 'Per te');
      inOrdine(sottoLaTesta(home, 'Per la tua organizzazione'), italia, 'Per la tua organizzazione');
      // le card vengono dopo le porte
      const app = home.testo;
      expect(app.indexOf("16% delle imprese italiane usa l'AI")).toBeLessThan(app.indexOf('Modelli e ricerca'));
    });

    it('una card senza dati non sparisce: sta nella riga «Dati non disponibili» della sua testa', () => {
      const home = leggi({ edizioni: [], dataset: { ...d, epoch: undefined } });
      expect(titoli(home, 4)).toEqual(NOMI.filter((n) => n !== 'Modelli e ricerca'));
      expect(sottoLaTesta(home, 'Per te')).toContain('Dati non disponibili: Modelli e ricerca.');
      expect(home.testo.match(/Dati non disponibili/g)).toHaveLength(1);
    });

    it('la card Competenze porta all’indice quando nasce, le altre restano testo', () => {
      /** I link del testo principale, fuori dalla testata, che hanno per testo il nome di una card. */
      const linkDelleCard = (home: Home) => coppie(within(home.getByRole('main')).queryAllByRole('link')).filter(([t]) => NOMI.includes(t));
      expect(linkDelleCard(leggi({ edizioni: [edizione], dataset: d }))).toEqual([['Competenze', 'competenze/']]);
      // senza il radar l'indice delle competenze non nasce, e la card resta testo come le altre
      const senzaRadar = leggi({ edizioni: [], dataset: { ...d, radar: undefined } });
      expect(senzaRadar.queryAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('competenze'))).toHaveLength(0);
    });
  });

  describe('in fondo', () => {
    const fondo = (home: Home) => home.getByRole('contentinfo');
    const linkDelFondo = (home: Home) => coppie(within(fondo(home)).queryAllByRole('link'));

    it('la riga delle fonti dei dati c’è sempre, anche senza lo stato del giro, con le stesse fonti del colophon dell’app', () => {
      const colophon = FONTI_DEI_DATI.map((f) => [f.nome, f.url]);
      for (const dataset of [d, { ...d, status: undefined }, {}]) {
        const home = leggi({ edizioni: [], dataset });
        expect(pulito(fondo(home).textContent)).toContain(`Dati di ${FONTI_DEI_DATI.map((f) => f.nome).join(', ')}.`);
        expect(linkDelFondo(home)).toEqual(colophon);
      }
    });

    it('con almeno un’edizione c’è il link al feed, senza edizioni no', () => {
      const alFeed = (home: Home) => linkDelFondo(home).filter(([, href]) => href === 'feed.xml');
      expect(alFeed(leggi({ edizioni: [edizione], dataset: d }))).toEqual([['Segui con RSS', 'feed.xml']]);
      expect(alFeed(leggi({ edizioni: [edizione], dataset: {} }))).toEqual([['Segui con RSS', 'feed.xml']]);
      expect(alFeed(leggi({ edizioni: [], dataset: d }))).toEqual([]);
    });
  });

  describe('i link', () => {
    /** I link della home, o solo quelli dentro i punti di riferimento con quel ruolo (la testata, le porte), in ordine di lettura. */
    const tutti = (home: Home, dove?: 'banner' | 'article') =>
      coppie(dove ? home.queryAllByRole(dove).flatMap((contenitore) => within(contenitore).queryAllByRole('link')) : home.queryAllByRole('link'));
    /** I link dentro il sito: quelli alle fonti dei dati vanno fuori. */
    const linkDi = (home: Home, dove?: 'banner' | 'article') => tutti(home, dove).filter(([, href]) => !/^https?:/.test(href));
    // la settimana dopo quella dei dati, raccolta il 22 ottobre
    const altra: Edizione = { ...edizione, settimana: '2026-10-19', raccolti: '2026-10-22T07:30:00+00:00', precedente: edizione.settimana };
    /** I dati con una sola competenza che entra tra quelle da imparare ora: MCP, senza RAG che esce. */
    const soloMcp: Dataset = { ...d, radar: { ...d.radar!, competenze: d.radar!.competenze.map((c) => (c.id === 'rag' ? { ...c, quadrante_prec: 'consolida' as const } : c)) } };

    it('la testata porta all’indice delle competenze e all’archivio solo quando le loro pagine nascono', () => {
      expect(linkDi(leggi({ edizioni: [edizione], dataset: d }), 'banner')).toEqual([['Competenze', 'competenze/'], ['Edizioni', 'edizioni/']]);
      expect(linkDi(leggi({ edizioni: [], dataset: d }), 'banner')).toEqual([['Competenze', 'competenze/']]);
      expect(linkDi(leggi({ edizioni: [edizione], dataset: { status: d.status } }), 'banner')).toEqual([['Edizioni', 'edizioni/']]);
      expect(linkDi(leggi({ edizioni: [], dataset: {} }), 'banner')).toEqual([]);
    });

    it('la settimana porta all’edizione di quella settimana solo quando esiste', () => {
      expect(linkDi(leggi({ edizioni: [edizione], dataset: d }))).toContainEqual(['Settimana del 12 ott 2026', 'edizioni/2026-10-12/']);
      for (const edizioni of [[], [altra]]) {
        const home = leggi({ edizioni, dataset: d });
        expect(home.testo).toContain('Settimana del 12 ott 2026');
        expect(linkDi(home).map(([t]) => t)).not.toContain('Settimana del 12 ott 2026');
      }
    });

    it('la notizia di una porta che parla di una competenza porta alla sua pagina, quella su più competenze all’indice, le altre restano testo', () => {
      expect(linkDi(leggi({ edizioni: [], dataset: soloMcp }), 'article')).toEqual([['MCP entra tra le competenze da imparare ora', 'competenze/mcp/']]);
      // MCP entra e RAG esce: in app la porta apre la card Competenze; la notizia di Business non ha una pagina statica
      expect(linkDi(leggi({ edizioni: [], dataset: d }), 'article')).toEqual([['MCP entra tra le competenze da imparare ora; RAG esce', 'competenze/']]);
    });

    it('nessun link contiene #, e ognuno porta a una voce della mappa', () => {
      for (const contenuto of [{ edizioni: [edizione], dataset: d }, { edizioni: [altra], dataset: soloMcp }, { edizioni: [], dataset: { status: d.status } }, { edizioni: [], dataset: {} }]) {
        const home = leggi(contenuto);
        for (const [testoLink, href] of tutti(home)) expect(href, testoLink).not.toContain('#');
        for (const [testoLink, href] of linkDi(home)) expect(Object.keys(home.file), testoLink).toContain(href.endsWith('/') ? `${href}index.html` : href);
      }
    });
  });

  it('senza lo stato del giro restano la testata e la frase di apertura, senza settimana né porte', () => {
    const home = leggi({ edizioni: [edizione], dataset: { ...d, status: undefined } });
    expect(home.getByRole('banner')).toHaveTextContent('AI Radar');
    expect(titoli(home, 1)).toEqual([FRASE_DI_APERTURA]);
    expect(titoli(home, 2)).toEqual([]);
    expect(home.testo).not.toMatch(/Settimana|MCP entra|imprese italiane/);
  });

  it('la testa è quella ricevuta, con il link al feed solo se ci sono edizioni', () => {
    const testa = (html: string) => html.match(/<head>[\s\S]*<\/head>/)![0];
    /** Gli elementi della testa con quel selettore: la testa non ha ruoli, si legge dai tag. */
    const nellaTesta = (html: string, selettore: string) => [...new DOMParser().parseFromString(html, 'text/html').head.querySelectorAll(selettore)];
    const senza = fileDi({ edizioni: [], dataset: d })['index.html'];
    expect(testa(senza)).toBe(TESTA_HOME);
    expect(nellaTesta(senza, 'link[rel="alternate"]')).toHaveLength(0);
    const con = fileDi({ edizioni: [edizione], dataset: d })['index.html'];
    const feed = nellaTesta(con, 'link[rel="alternate"][type="application/rss+xml"]');
    expect(feed.map((l) => l.getAttribute('href'))).toEqual([assoluto('feed.xml')]);
    expect(testa(con).replace(/\s*<link rel="alternate"[^>]*>\s*/, '\n')).toBe(TESTA_HOME);
  });

  it('un testo con caratteri speciali nei dati esce con l’escape', () => {
    const strano = 'M<i>C</i>P & "co"';
    const radar = { ...d.radar!, competenze: d.radar!.competenze.map((c) => (c.id === 'mcp' ? { ...c, breve: strano } : c)) };
    const home = leggi({ edizioni: [], dataset: { ...d, radar } });
    expect(home.file['index.html']).toContain('M&lt;i&gt;C&lt;/i&gt;P &amp; &quot;co&quot;');
    expect(home.testo).toContain(`${strano} entra tra le competenze da imparare ora`);
    // nessun elemento nato dal testo: un <i>C</i> diventato markup sarebbe un elemento con il solo testo «C»
    expect(within(home.getByRole('main')).queryByText('C')).toBeNull();
  });

  it('nessuna data viene dall’orologio: con gli stessi dati, in giorni e ore diversi, il testo è lo stesso', () => {
    const contenuto = { edizioni: [edizione], dataset: d };
    try {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-16T05:00:00Z'));
      const lunedi = fileDi(contenuto)['index.html'];
      vi.setSystemTime(new Date('2027-03-04T23:59:00Z'));
      expect(fileDi(contenuto)['index.html']).toBe(lunedi);
    } finally {
      vi.useRealTimers();
    }
  });

  it('la sitemap ha ancora la home una volta sola, come primo indirizzo', () => {
    /** Gli indirizzi della sitemap, in ordine. */
    const indirizzi = (xml: string) => [...new DOMParser().parseFromString(xml, 'application/xml').querySelectorAll('loc')].map((l) => l.textContent);
    const loc = indirizzi(fileDi({ edizioni: [edizione], dataset: d })['sitemap.xml']);
    expect(loc[0]).toBe(assoluto(''));
    expect(loc.filter((l) => l === assoluto(''))).toHaveLength(1);
  });
});

describe('il link «Competenze» nella testata', () => {
  const file = filePubblici({ edizioni: [edizione], dataset: d }, opzioni);
  const testata = (percorso: string) => new DOMParser().parseFromString(file[percorso], 'text/html').querySelector('header nav');
  const linkCompetenze = (percorso: string) => [...testata(percorso)!.querySelectorAll('a')].find((a) => a.textContent === 'Competenze')?.getAttribute('href');

  it('porta all’indice da ogni pagina statica, con l’indirizzo relativo giusto a ogni livello', () => {
    expect(linkCompetenze(PAGINA)).toBe('../../competenze/');
    expect(linkCompetenze('edizioni/index.html')).toBe('../competenze/');
    expect(linkCompetenze('competenze/mcp/index.html')).toBe('../../competenze/');
  });

  it('l’indice non porta a se stesso', () => {
    expect(linkCompetenze('competenze/index.html')).toBeUndefined();
  });

  it('le pagine delle competenze e l’indice portano anche alle edizioni, quando esistono: la testata è la stessa ovunque', () => {
    const nav = (percorso: string, f = file) => [...new DOMParser().parseFromString(f[percorso], 'text/html').querySelectorAll('header nav a')].map((a) => [a.textContent, a.getAttribute('href')]);
    expect(nav('competenze/mcp/index.html')).toEqual([['Competenze', '../../competenze/'], ['Edizioni', '../../edizioni/'], ['Dati di oggi', '../../'], ['Segui con RSS', '../../feed.xml']]);
    expect(nav(PAGINA)).toEqual([['Competenze', '../../competenze/'], ['Edizioni', '../'], ['Dati di oggi', '../../'], ['Segui con RSS', '../../feed.xml']]);
    expect(nav('competenze/index.html')).toEqual([['Edizioni', '../edizioni/'], ['Dati di oggi', '../'], ['Segui con RSS', '../feed.xml']]);
    const senzaEdizioni = filePubblici({ edizioni: [], dataset: d }, opzioni);
    expect(nav('competenze/mcp/index.html', senzaEdizioni).map(([t]) => t)).toEqual(['Competenze', 'Dati di oggi']);
  });

  it('senza edizioni il feed non esiste, e nessuna pagina ci porta: né «Segui con RSS» né il link per i lettori di feed', () => {
    const senzaEdizioni = filePubblici({ edizioni: [], dataset: d }, opzioni);
    expect(senzaEdizioni['feed.xml']).toBeUndefined();
    const pagine = Object.entries(senzaEdizioni).filter(([percorso]) => percorso.endsWith('.html'));
    expect(pagine.map(([percorso]) => percorso)).toEqual(expect.arrayContaining(['index.html', 'competenze/index.html', 'competenze/mcp/index.html']));
    for (const [percorso, html] of pagine) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      expect(doc.querySelector('link[rel="alternate"]'), percorso).toBeNull();
      expect([...doc.querySelectorAll('a')].filter((a) => a.getAttribute('href')?.endsWith('feed.xml') || a.textContent === 'Segui con RSS'), percorso).toEqual([]);
    }
  });

  it('con un’edizione ogni pagina statica porta al feed, con il link per i lettori di feed all’indirizzo assoluto', () => {
    for (const [percorso, html] of Object.entries(file).filter(([p]) => p.endsWith('.html') && p !== 'index.html')) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      expect(doc.querySelector('link[rel="alternate"][type="application/rss+xml"]')?.getAttribute('href'), percorso).toBe(assoluto('feed.xml'));
    }
  });

  it('senza le pagine delle competenze nessuna testata ha il link', () => {
    for (const html of Object.values(filePubblici({ edizioni: [edizione], dataset: {} }, opzioni))) expect(html).not.toMatch(LINK_COMPETENZE);
  });
});

describe('la sitemap', () => {
  const leggi = (testo: string) => {
    const doc = new DOMParser().parseFromString(testo, 'application/xml');
    expect(doc.querySelector('parsererror')).toBeNull();
    return doc;
  };
  const indirizzi = (c: ContenutoStatico, o: OpzioniFilePubblici = opzioni) => {
    const sitemap = filePubblici(c, o)['sitemap.xml'];
    expect(sitemap, 'la mappa non ha sitemap.xml').toBeDefined();
    return [...leggi(sitemap).querySelectorAll('url > loc')].map((l) => l.textContent);
  };

  it('c’è sempre, e senza edizioni né radar ha la sola home', () => {
    expect(indirizzi({ edizioni: [], dataset: {} })).toEqual([assoluto('')]);
  });

  it('con edizioni e radar elenca la home, l’indice e ogni competenza, l’archivio e ogni edizione, in ordine di percorso, e nient’altro', () => {
    expect(indirizzi({ edizioni: [edizione], dataset: d })).toEqual([
      '', 'competenze/', 'competenze/agenti/', 'competenze/mcp/', 'competenze/rag/', 'competenze/robotica/', 'competenze/vector-db/',
      'edizioni/', `edizioni/${edizione.settimana}/`,
    ].map(assoluto));
  });

  it('senza edizioni ha home e competenze, senza radar home ed edizioni', () => {
    expect(indirizzi({ edizioni: [], dataset: d })).toEqual(['', 'competenze/', 'competenze/agenti/', 'competenze/mcp/', 'competenze/rag/', 'competenze/robotica/', 'competenze/vector-db/'].map(assoluto));
    expect(indirizzi({ edizioni: [edizione], dataset: {} })).toEqual(['', 'edizioni/', `edizioni/${edizione.settimana}/`].map(assoluto));
  });

  it('la copia della home che la mappa contiene con le edizioni non aggiunge una seconda voce', () => {
    expect(filePubblici({ edizioni: [edizione], dataset: {} }, opzioni)['index.html']).toBeDefined();
    expect(indirizzi({ edizioni: [edizione], dataset: {} }, opzioni)).toEqual(['', 'edizioni/', `edizioni/${edizione.settimana}/`].map(assoluto));
  });

  it('ogni indirizzo è assoluto e segue l’indirizzo base, anche quando non è quello predefinito', () => {
    const base = 'https://altro-utente.github.io/altro-radar/';
    const loc = indirizzi({ edizioni: [edizione], dataset: d }, { ...opzioni, indirizzoBase: base });
    expect(loc[0]).toBe(base);
    expect(loc).toHaveLength(9);
    for (const l of loc) expect(l!.startsWith(base), l!).toBe(true);
  });

  it('ogni indirizzo coincide con il canonical scritto nella pagina della mappa a quel percorso', () => {
    const file = filePubblici({ edizioni: [edizione], dataset: d }, opzioni);
    const canonical = (percorso: string) => new DOMParser().parseFromString(file[percorso], 'text/html').querySelector('link[rel="canonical"]')?.getAttribute('href');
    for (const l of indirizzi({ edizioni: [edizione], dataset: d }, opzioni)) {
      expect(canonical(`${l!.slice(opzioniDellePagine.indirizzoBase.length)}index.html`)).toBe(l);
    }
  });

  it('il feed, le immagini e i file JSON non ci sono', () => {
    const loc = indirizzi({ edizioni: [edizione], dataset: d });
    expect(loc.filter((l) => /\.(xml|json|png)$|#/.test(l!))).toEqual([]);
  });

  it('è XML ben formato nel namespace delle sitemap, con soli elementi url, loc e lastmod, e lastmod dopo loc', () => {
    const doc = leggi(filePubblici({ edizioni: [edizione], dataset: d }, opzioni)['sitemap.xml']);
    expect(doc.documentElement.localName).toBe('urlset');
    expect(doc.documentElement.namespaceURI).toBe('http://www.sitemaps.org/schemas/sitemap/0.9');
    const nomi = new Set([...doc.documentElement.querySelectorAll('*')].map((e) => `${e.namespaceURI} ${e.localName}`));
    expect([...nomi].sort()).toEqual(['lastmod', 'loc', 'url'].map((n) => `http://www.sitemaps.org/schemas/sitemap/0.9 ${n}`));
    for (const url of doc.documentElement.children) expect([...url.children].map((e) => e.localName)).toEqual(['loc', 'lastmod']);
    for (const lastmod of doc.querySelectorAll('lastmod')) expect(lastmod.textContent).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  describe('la data di ultimo cambio', () => {
    /** Ogni indirizzo con il suo lastmod, o null se non ce l'ha. */
    const date = (c: ContenutoStatico, o: OpzioniFilePubblici = opzioni) =>
      Object.fromEntries([...leggi(filePubblici(c, o)['sitemap.xml']).querySelectorAll('url')]
        .map((u) => [u.querySelector('loc')!.textContent!.slice(opzioniDellePagine.indirizzoBase.length), u.querySelector('lastmod')?.textContent ?? null]));
    // la prima edizione è raccolta il 15 ottobre e corretta il 2 novembre, la seconda raccolta il 22 ottobre e mai corretta
    const corretta: Edizione = { ...edizione, correzioni: [{ data: '2026-11-02', testo: 'Una cifra era sbagliata.' }] };
    const seconda: Edizione = { ...edizione, settimana: '2026-10-19', raccolti: '2026-10-22T07:30:00+00:00', precedente: edizione.settimana, correzioni: [] };

    it('una pagina di edizione ha il giorno della sua raccolta, o la sua correzione più recente', () => {
      expect(edizione.settimana).toBe('2026-10-12');
      expect(date({ edizioni: [edizione], dataset: {} })['edizioni/2026-10-12/']).toBe('2026-10-15');
      const d2 = date({ edizioni: [corretta, seconda], dataset: {} });
      expect(d2['edizioni/2026-10-12/']).toBe('2026-11-02');
      expect(d2['edizioni/2026-10-19/']).toBe('2026-10-22');
    });

    it('l’archivio ha la data più recente tra quelle delle sue edizioni, correzioni comprese', () => {
      expect(date({ edizioni: [edizione, seconda], dataset: {} })['edizioni/']).toBe('2026-10-22');
      expect(date({ edizioni: [corretta, seconda], dataset: {} })['edizioni/']).toBe('2026-11-02');
    });

    it('la home ha il giorno della raccolta, da status.json, l’indice e le pagine delle competenze il giorno di generato di radar.json', () => {
      const radar = { ...d.radar!, generato: '2026-10-26' };
      // la raccolta è del 27 ottobre, il radar del 26: la home segue la raccolta, le competenze il radar
      const status = { ...d.status!, aggiornato: '2026-10-27T06:15:00+00:00' };
      expect(date({ edizioni: [corretta, seconda], dataset: { radar, status } })).toEqual({
        '': '2026-10-27',
        'competenze/': '2026-10-26',
        'competenze/agenti/': '2026-10-26',
        'competenze/mcp/': '2026-10-26',
        'competenze/rag/': '2026-10-26',
        'competenze/robotica/': '2026-10-26',
        'competenze/vector-db/': '2026-10-26',
        'edizioni/': '2026-11-02',
        'edizioni/2026-10-12/': '2026-11-02',
        'edizioni/2026-10-19/': '2026-10-22',
      });
    });

    it('senza radar.json la home ha comunque il giorno della raccolta', () => {
      const status = { ...d.status!, aggiornato: '2026-10-27T06:15:00+00:00' };
      expect(date({ edizioni: [seconda], dataset: { status } })['']).toBe('2026-10-27');
      expect(date({ edizioni: [], dataset: { status } })).toEqual({ '': '2026-10-27' });
    });

    it('senza status.json, o con un aggiornato non valido, la home non ha data, anche con il radar', () => {
      const radar = { ...d.radar!, generato: '2026-10-26' };
      expect(date({ edizioni: [seconda], dataset: {} })['']).toBeNull();
      expect(date({ edizioni: [], dataset: {} })).toEqual({ '': null });
      const senzaStatus = date({ edizioni: [seconda], dataset: { radar } });
      expect(senzaStatus['']).toBeNull();
      expect(senzaStatus['competenze/mcp/']).toBe('2026-10-26');
      // un istante che non si legge, un giorno che non esiste, un giorno scritto in un'altra forma, niente
      for (const aggiornato of ['ieri', '2026-02-30T06:00:00+00:00', '27/10/2026', '']) {
        const conDate = date({ edizioni: [], dataset: { radar, status: { ...d.status!, aggiornato } } });
        expect(conDate[''], aggiornato).toBeNull();
        expect(conDate['competenze/mcp/'], aggiornato).toBe('2026-10-26');
      }
    });

    it('un generato con l’ora vale per il suo giorno, uno non valido non dà nessuna data', () => {
      expect(date({ edizioni: [], dataset: { radar: { ...d.radar!, generato: '2026-10-26T06:15:00+00:00' } } })['competenze/mcp/']).toBe('2026-10-26');
      // un giorno che non esiste: le pagine delle competenze nascono, ma nessuna ha la data
      const conDate = date({ edizioni: [seconda], dataset: { radar: { ...d.radar!, generato: '2026-02-30' } } });
      expect(conDate['']).toBeNull();
      expect(conDate['competenze/']).toBeNull();
      expect(conDate['competenze/mcp/']).toBeNull();
      expect(conDate['edizioni/2026-10-19/']).toBe('2026-10-22');
      // una data illeggibile, con un radar senza competenze: c'è la sola home, senza data
      for (const generato of ['ieri', '26/10/2026', '2026-13-01', '']) {
        expect(date({ edizioni: [], dataset: { radar: { ...d.radar!, competenze: [], generato } } }), generato).toEqual({ '': null });
      }
    });

    it('nessuna data viene dall’orologio: con gli stessi dati, in giorni e ore diversi, il testo è lo stesso', () => {
      const contenuto = { edizioni: [corretta, seconda], dataset: d };
      try {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-11-16T05:00:00Z'));
        const lunedi = filePubblici(contenuto, opzioni)['sitemap.xml'];
        vi.setSystemTime(new Date('2027-03-04T23:59:00Z'));
        expect(filePubblici(contenuto, opzioni)['sitemap.xml']).toBe(lunedi);
        expect(lunedi).not.toMatch(/2026-11-16|2027-03-0[45]/);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  it('un indirizzo con caratteri speciali passa dall’escape XML', () => {
    const radar = JSON.parse(JSON.stringify(d.radar).replaceAll('"vector-db"', '"vector&db<\'x\'>"'));
    const testo = filePubblici({ edizioni: [], dataset: { radar } }, opzioni)['sitemap.xml'];
    expect(testo).toContain('competenze/vector&amp;db&lt;&#39;x&#39;&gt;/');
    expect(indirizzi({ edizioni: [], dataset: { radar } })).toContain(assoluto('competenze/vector&db<\'x\'>/'));
  });
});

describe('robots.txt', () => {
  it('alla radice di un dominio c’è, vale per tutti i crawler, non esclude niente e indica la sitemap', () => {
    const file = filePubblici({ edizioni: [edizione], dataset: {} }, { ...opzioni, indirizzoBase: 'https://altro-utente.github.io/' });
    expect(file['robots.txt'], 'la mappa non ha robots.txt').toBeDefined();
    expect(file['robots.txt'].trim().split('\n')).toEqual(['User-agent: *', 'Allow: /', '', 'Sitemap: https://altro-utente.github.io/sitemap.xml']);
  });

  it('c’è anche su un dominio proprio, e anche senza edizioni né radar', () => {
    const file = filePubblici({ edizioni: [], dataset: {} }, { ...opzioni, indirizzoBase: 'https://radar.esempio.it/' });
    expect(file['robots.txt']).toContain('Sitemap: https://radar.esempio.it/sitemap.xml\n');
  });

  it('non c’è con l’indirizzo predefinito in /ai-radar/, né con qualunque altro percorso diverso da /', () => {
    // indirizzoBase senza un valore dà l'indirizzo predefinito
    for (const base of [indirizzoBase(undefined), 'https://esempio.org/ai-radar/', 'https://radar.esempio.it/sito/']) {
      const file = filePubblici({ edizioni: [edizione], dataset: d }, { ...opzioni, indirizzoBase: base });
      expect(Object.keys(file), base).not.toContain('robots.txt');
    }
  });
});

// la pagina Privacy descrive il contatore delle visite: nasce dallo stesso ID dello script e della riga
describe('la pagina Privacy', () => {
  const tutto: ContenutoStatico = { edizioni: [edizione], dataset: d };

  it('con un ID c’è, con o senza edizioni e dati; senza ID no, perché una copia senza contatore non ha niente da dichiarare', () => {
    for (const contenuto of [tutto, { edizioni: [], dataset: {} }]) {
      expect(Object.keys(filePubblici(contenuto, { ...opzioni, idUmami: ID }))).toContain(PRIVACY);
      for (const idUmami of [undefined, null]) expect(Object.keys(filePubblici(contenuto, { ...opzioni, idUmami }))).not.toContain(PRIVACY);
    }
  });

  describe('quello che dice', () => {
    const doc = () => new DOMParser().parseFromString(filePubblici(tutto, { ...opzioni, idUmami: ID })[PRIVACY], 'text/html');
    // hidden: true perché la pagina letta non ha una finestra che calcoli gli stili, come in test/contatore.ts
    const corpo = () => within(doc().querySelector('main')!);
    const pulito = (s: string | null) => (s ?? '').replace(/\s+/g, ' ').trim();
    /** Il testo di una sezione, sotto il suo titolo. */
    const sezione = (titolo: string) => corpo().getAllByRole('heading', { level: 2, hidden: true }).find((h) => pulito(h.textContent) === titolo)!.closest('section')!;
    const link = (el: Element) => within(el as HTMLElement).getAllByRole('link', { hidden: true }).map((a) => [pulito(a.textContent), a.getAttribute('href')]);

    it('si intitola Privacy, con il canonical in privacy/, e ha le sezioni dell’informativa in ordine', () => {
      expect(corpo().getAllByRole('heading', { level: 1, hidden: true }).map((h) => pulito(h.textContent))).toEqual(['Privacy']);
      expect(doc().querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(assoluto('privacy/'));
      expect(corpo().getAllByRole('heading', { level: 2, hidden: true }).map((h) => pulito(h.textContent))).toEqual([
        'Chi è il titolare', 'Cosa si raccoglie e perché', 'Base giuridica', 'Per quanto tempo',
        'Chi tratta i dati per conto del titolare', 'Chi ospita il sito', 'Nel tuo browser', 'I tuoi diritti',
      ]);
    });

    it('il titolare si contatta solo dal profilo GitHub, senza nomi di persona, e le richieste con dati personali passano da una issue', () => {
      const titolare = sezione('Chi è il titolare');
      expect(pulito(titolare.textContent)).toBe(
        'Chi è il titolare AI Radar è un progetto personale. Il titolare del trattamento si contatta dal suo profilo GitHub. '
        + 'Per una richiesta che contiene dati personali, apri una issue nel repository senza scriverli: ti viene indicato un canale privato.',
      );
      expect(link(titolare)).toEqual([['profilo GitHub', 'https://github.com/simones99'], ['issue nel repository', 'https://github.com/simones99/ai-radar/issues']]);
    });

    it('dice cosa raccoglie Umami, che non ci sono cookie, la base giuridica, i 6 mesi, Umami come responsabile e dove sono i dati', () => {
      const raccolta = pulito(sezione('Cosa si raccoglie e perché').textContent);
      for (const frase of ['l’indirizzo e il titolo della pagina', 'la pagina da cui arrivi', 'la lingua del browser', 'la dimensione dello schermo', 'la data e l’ora della visita', 'il browser, il sistema operativo e il tipo di dispositivo', 'una posizione approssimativa', 'un sale che cambia ogni mese', 'le statistiche non lo contengono', 'non usa cookie', 'il sito funziona lo stesso']) {
        expect(raccolta).toContain(frase);
      }
      expect(pulito(sezione('Base giuridica').textContent)).toContain('legittimo interesse del titolare a capire se e come il sito viene letto (art. 6, par. 1, lett. f del GDPR)');
      expect(pulito(sezione('Per quanto tempo').textContent)).toContain('Le statistiche restano su Umami 6 mesi');
      const responsabile = sezione('Chi tratta i dati per conto del titolare');
      expect(pulito(responsabile.textContent)).toContain('Umami Software, Inc., con sede a San Francisco, negli Stati Uniti, tratta i dati delle visite per conto del titolare con il servizio Umami Cloud, come responsabile del trattamento, secondo il suo accordo sul trattamento dei dati.');
      expect(pulito(responsabile.textContent)).toContain('Le statistiche sono conservate in UE.');
      expect(pulito(responsabile.textContent)).toContain('possono essere trasferiti negli Stati Uniti con le clausole contrattuali tipo dell’UE');
      expect(link(responsabile)).toEqual([
        ['accordo sul trattamento dei dati', 'https://umami.is/dpa'], ['informativa sulla privacy', 'https://umami.is/privacy'], ['elenco dei suoi sub-responsabili', 'https://umami.is/subprocessors'],
      ]);
      expect(link(sezione('Chi ospita il sito')).map(([, href]) => href)).toEqual([
        'https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages#data-collection',
        'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement',
      ]);
    });

    it('elenca i diritti, dice dell’art. 11 e porta al Garante; in fondo la data dell’ultimo aggiornamento', () => {
      const diritti = sezione('I tuoi diritti');
      expect(pulito(diritti.textContent)).toContain('(artt. 15-21 del GDPR)');
      expect(pulito(diritti.textContent)).toContain('(art. 11 del GDPR)');
      expect(link(diritti)).toEqual([['Garante per la protezione dei dati personali', 'https://www.garanteprivacy.it/']]);
      expect(pulito(doc().querySelector('main')!.textContent)).toMatch(/Aggiornata il 26 novembre 2026\.$/);
    });

    it('i link dell’informativa portano fuori come gli altri link esterni', () => {
      for (const a of doc().querySelectorAll('main a')) {
        expect(a.getAttribute('href'), a.textContent!).toMatch(/^https:\/\//);
        expect([a.getAttribute('target'), a.getAttribute('rel')], a.textContent!).toEqual(['_blank', 'noopener']);
      }
    });
  });
});

// lo script e la riga nascono dallo stesso ID, sulla stessa mappa
describe('il contatore delle visite', () => {
  const tutto: ContenutoStatico = { edizioni: [edizione], dataset: d };

  describe('lo script di Umami', () => {
    it('con un ID ogni pagina, home compresa, ha nel <head> uno e un solo script di Umami Cloud, che conta solo sull’host pubblico del sito', () => {
      for (const [base, host] of [['https://esempio.org/ai-radar/', 'esempio.org'], ['https://altro-utente.github.io/', 'altro-utente.github.io']]) {
        const file = filePubblici(tutto, { ...opzioni, indirizzoBase: base, idUmami: ID });
        expect(Object.keys(file)).toEqual(expect.arrayContaining(['index.html', PAGINA, 'edizioni/index.html', 'competenze/index.html', 'competenze/mcp/index.html']));
        for (const [percorso, doc] of pagine(file)) {
          const script = scriptDiUmami(doc);
          expect(script, percorso).toHaveLength(1);
          expect(script[0].parentElement, percorso).toBe(doc.head);
          expect(script[0].getAttribute('src'), percorso).toBe('https://cloud.umami.is/script.js');
          expect(script[0].hasAttribute('defer'), percorso).toBe(true);
          expect(script[0].getAttribute('data-website-id'), percorso).toBe(ID);
          expect(script[0].getAttribute('data-domains'), percorso).toBe(host);
        }
      }
    });

    it('con un ID, una pagina senza <head> chiuso è un errore che la nomina, invece di uscire senza lo script e senza dirlo', () => {
      const home = HOME.replace('</head>', '');
      expect(() => filePubblici(tutto, { ...opzioni, home, idUmami: ID })).toThrow(/index\.html/);
      // senza ID non c'è niente da aggiungere
      expect(() => filePubblici(tutto, { ...opzioni, home })).not.toThrow();
    });

    it('senza ID nessuna pagina ha lo script', () => {
      for (const idUmami of [undefined, null]) {
        const file = pagine(filePubblici(tutto, { ...opzioni, idUmami }));
        expect(file.length).toBeGreaterThan(0);
        for (const [percorso, doc] of file) expect(scriptDiUmami(doc), percorso).toEqual([]);
      }
    });

    it('titolo, descrizione, canonical e anteprima sono gli stessi con e senza ID, nelle pagine che ci sono in tutti e due', () => {
      const testa = (doc: Document) => ({
        titolo: doc.title,
        meta: [...doc.head.querySelectorAll('meta[name], meta[property]')].map((m) => [m.getAttribute('name') ?? m.getAttribute('property'), m.getAttribute('content')]),
        link: [...doc.head.querySelectorAll('link')].map((l) => [l.getAttribute('rel'), l.getAttribute('href')]),
      });
      const senza = Object.fromEntries(pagine(filePubblici(tutto, opzioni)));
      for (const [percorso, doc] of pagine(filePubblici(tutto, { ...opzioni, idUmami: ID })).filter(([p]) => p !== PRIVACY)) {
        expect(testa(doc).meta.length, percorso).toBeGreaterThan(0);
        expect(testa(doc), percorso).toEqual(testa(senza[percorso]));
      }
    });

    it('i file che non sono pagine restano identici con e senza ID, il feed e l’indice delle edizioni; la sitemap guadagna solo la pagina Privacy', () => {
      const nonPagine = (file: Record<string, string>) => Object.fromEntries(Object.entries(file).filter(([percorso]) => !percorso.endsWith('.html')));
      const { 'sitemap.xml': sitemapCon, ...con } = nonPagine(filePubblici(tutto, { ...opzioni, idUmami: ID }));
      const { 'sitemap.xml': sitemapSenza, ...senza } = nonPagine(filePubblici(tutto, opzioni));
      expect(Object.keys(con)).toEqual(expect.arrayContaining(['feed.xml', 'data/edizioni.json']));
      expect(con).toEqual(senza);
      expect(sitemapCon.replace(`<url><loc>${assoluto('privacy/')}</loc></url>
`, '')).toBe(sitemapSenza);
    });
  });

  describe('la riga sul contatore', () => {
    const RIGA = 'Il sito conta le visite con Umami, senza cookie: le statistiche non contengono indirizzi IP e sono conservate in UE. Privacy';
    const pulito = (s: string | null) => (s ?? '').replace(/\s+/g, ' ').trim();

    it('con un ID ogni pagina statica, la home in chiaro e la pagina Privacy hanno in fondo la riga, con «Privacy» che porta alla pagina Privacy del sito, nella stessa scheda', () => {
      const file = filePubblici(tutto, { ...opzioni, idUmami: ID });
      expect(Object.keys(file)).toEqual(expect.arrayContaining(['index.html', PAGINA, 'edizioni/index.html', 'competenze/index.html', 'competenze/mcp/index.html', PRIVACY]));
      for (const [percorso, doc] of pagine(file)) {
        const riga = righeSulContatore(doc);
        expect(riga, percorso).toHaveLength(1);
        expect(pulito(riga[0].textContent), percorso).toBe(RIGA);
        const link = within(riga[0]).getAllByRole('link', { hidden: true });
        expect(link.map((a) => [pulito(a.textContent), a.getAttribute('target')]), percorso).toEqual([['Privacy', null]]);
        // l'indirizzo è relativo alla pagina: letto da dove sta la pagina, porta alla pagina Privacy con qualunque indirizzo base
        expect(new URL(link[0].getAttribute('href')!, assoluto(percorso)).href, percorso).toBe(assoluto('privacy/'));
      }
    });

    it('nelle pagine statiche sta accanto a «Il progetto non è affiliato a nessuna delle fonti», nella home in chiaro accanto alle fonti dei dati', () => {
      for (const [percorso, doc] of pagine(filePubblici(tutto, { ...opzioni, idUmami: ID }))) {
        expect(righeSulContatore(doc), percorso).toHaveLength(1);
        const fondo = pulito(piede(doc).textContent);
        expect(fondo, percorso).toContain('Il progetto non è affiliato a nessuna delle fonti.');
        if (percorso === 'index.html') expect(fondo).toContain(`Dati di ${FONTI_DEI_DATI.map((f) => f.nome).join(', ')}.`);
      }
    });

    it('senza ID la riga non c’è in nessuna voce della mappa', () => {
      for (const idUmami of [undefined, null]) {
        for (const contenuto of [tutto, { edizioni: [], dataset: {} }]) {
          const file = filePubblici(contenuto, { ...opzioni, idUmami });
          expect(Object.keys(file).length).toBeGreaterThan(0);
          for (const [percorso, testo] of Object.entries(file)) expect(testo, percorso).not.toMatch(/Umami|privacy\//);
        }
      }
    });

    it('è testo normale del piè di pagina: niente di nascosto, e la navigazione resta quella senza ID', () => {
      const senza = Object.fromEntries(pagine(filePubblici(tutto, opzioni)));
      const nav = (doc: Document) => within(doc.body).queryAllByRole('navigation', { hidden: true }).map((n) => n.outerHTML);
      for (const [percorso, doc] of pagine(filePubblici(tutto, { ...opzioni, idUmami: ID })).filter(([p]) => p !== PRIVACY)) {
        const riga = righeSulContatore(doc)[0];
        expect(riga.closest('[hidden], [aria-hidden="true"]'), percorso).toBeNull();
        expect(riga.querySelectorAll('[hidden], [aria-hidden]'), percorso).toHaveLength(0);
        expect(nav(doc), percorso).toEqual(nav(senza[percorso]));
      }
    });
  });
});
