// La mappa dei file pubblici del sito: le edizioni, e il dataset, di cui radar.json fa nascere le pagine delle competenze.
import { describe, expect, it, vi } from 'vitest';
import type { Dataset } from '../data/types';
import { creaEdizione, fileDelleEdizioni, type Edizione } from '../edizioni';
import { indirizzoBase } from '../indirizzoBase';
import { FIXTURE } from '../test/fixtures';
import { FONTI_DEI_DATI } from '../text/fonti';
import { filePubblici, type ContenutoStatico, type OpzioniFilePubblici } from '.';

const opzioni = { indirizzoBase: 'https://esempio.org/ai-radar/', foglio: 'assets/index-abc.css' };
/** L'indirizzo assoluto di una cartella del sito, dall'indirizzo base delle opzioni. */
const assoluto = (cartella: string) => `${opzioni.indirizzoBase}${cartella}`;
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
const d = FIXTURE as Dataset;
const edizione = creaEdizione(d, null) as Edizione;
const PAGINA = `edizioni/${edizione.settimana}/index.html`;
/** Il link della testata verso l'indice delle competenze, come lo scrive la pagina. */
const LINK_COMPETENZE = /<a href="[^"]*competenze\/">Competenze<\/a>/;

describe('i file pubblici del sito', () => {
  it('con un’edizione e il radar ci sono la pagina dell’edizione, l’archivio e il feed', () => {
    const file = filePubblici({ edizioni: [edizione], dataset: d }, opzioni);
    expect(Object.keys(file)).toEqual(expect.arrayContaining([PAGINA, 'edizioni/index.html', 'feed.xml']));
  });

  it('senza il radar i file sono esattamente quelli delle edizioni, più la sitemap', () => {
    const { 'sitemap.xml': sitemap, ...resto } = filePubblici({ edizioni: [edizione], dataset: {} }, opzioni);
    expect(sitemap).toBeDefined();
    expect(resto).toEqual(fileDelleEdizioni([edizione], opzioni));
    expect(Object.keys(filePubblici({ edizioni: [], dataset: {} }, opzioni))).toEqual(['sitemap.xml']);
  });

  it('il radar aggiunge le pagine delle competenze, e i file delle edizioni cambiano solo per il link «Competenze» nella testata', () => {
    const file = filePubblici({ edizioni: [edizione], dataset: d }, opzioni);
    expect(Object.keys(file).filter((p) => p.startsWith('competenze/')).length).toBeGreaterThan(0);
    for (const [percorso, contenuto] of Object.entries(fileDelleEdizioni([edizione], opzioni))) {
      expect(file[percorso].replace(LINK_COMPETENZE, ''), percorso).toBe(contenuto);
    }
  });
});

describe('la home in chiaro', () => {
  const FRASE_DI_APERTURA = "Su cosa formarti e cosa succede all'AI in Italia, con dati aperti aggiornati ogni lunedì.";
  /** La mappa con la home della build, e la sua voce index.html letta come la legge un motore: senza eseguire niente. */
  const conHome = (c: ContenutoStatico) => {
    const file = filePubblici(c, { ...opzioni, home: HOME });
    return { file, doc: new DOMParser().parseFromString(file['index.html'], 'text/html') };
  };
  const leggi = (c: ContenutoStatico) => conHome(c).doc;
  /** Il testo statico: quello che sta nel contenitore dell'app. */
  const testo = (doc: Document) => doc.getElementById('app')!;
  const pulito = (s: string | null) => (s ?? '').replace(/\s+/g, ' ').trim();
  const titoli = (doc: Document, livello: number) => [...testo(doc).querySelectorAll(`h${livello}`)].map((h) => pulito(h.textContent));

  it('c’è sempre, anche senza edizioni né dati: la testata con il nome del sito e la frase di apertura come unico h1', () => {
    const doc = leggi({ edizioni: [], dataset: {} });
    expect(testo(doc).querySelector('header')?.textContent).toContain('AI Radar');
    expect(titoli(doc, 1)).toEqual([FRASE_DI_APERTURA]);
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
  });

  it('con tutti i dati ha la settimana dei dati, la frase come unico h1 e le due porte con la loro notizia', () => {
    const doc = leggi({ edizioni: [edizione], dataset: d });
    const app = pulito(testo(doc).textContent);
    expect(app).toContain('Settimana del 12 ott 2026');
    expect(titoli(doc, 1)).toEqual([FRASE_DI_APERTURA]);
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(titoli(doc, 2)).toEqual(['Per te Su cosa formarti', "Per la tua organizzazione L'AI in Italia", 'La situazione']);
    expect(app).toContain('MCP entra tra le competenze da imparare ora; RAG esce');
    expect(app).toContain('Radar delle competenze · dati al 15 ott 2026');
    expect(app).toContain("16% delle imprese italiane usa l'AI (UE: 20%)");
    // la settimana sta sopra la frase, le porte sotto
    expect(app.indexOf('Settimana del 12 ott 2026')).toBeLessThan(app.indexOf(FRASE_DI_APERTURA));
    expect(app.indexOf(FRASE_DI_APERTURA)).toBeLessThan(app.indexOf('MCP entra'));
  });

  describe('le card', () => {
    /** Il testo sotto il titolo di una testa nella sezione «La situazione», fino al titolo della testa dopo: quello che legge chi scorre la pagina. */
    const sottoLaTesta = (doc: Document, testa: string) => {
      const main = pulito(testo(doc).querySelector('main')?.textContent ?? null);
      const situazione = main.slice(main.indexOf('La situazione'));
      const teste = titoli(doc, 3);
      const i = teste.findIndex((t) => t.startsWith(testa));
      const inizio = situazione.indexOf(teste[i]) + teste[i].length;
      return situazione.slice(inizio, i + 1 < teste.length ? situazione.indexOf(teste[i + 1]) : undefined);
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
      const doc = leggi({ edizioni: [edizione], dataset: d });
      expect(titoli(doc, 3)).toEqual(['Per te Su cosa formarti', "Per la tua organizzazione L'AI in Italia"]);
      expect(titoli(doc, 4)).toEqual(NOMI);
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
      inOrdine(sottoLaTesta(doc, 'Per te'), perTe, 'Per te');
      inOrdine(sottoLaTesta(doc, 'Per la tua organizzazione'), italia, 'Per la tua organizzazione');
      // le card vengono dopo le porte
      const app = pulito(testo(doc).textContent);
      expect(app.indexOf("16% delle imprese italiane usa l'AI")).toBeLessThan(app.indexOf('Modelli e ricerca'));
    });

    it('una card senza dati non sparisce: sta nella riga «Dati non disponibili» della sua testa', () => {
      const doc = leggi({ edizioni: [], dataset: { ...d, epoch: undefined } });
      expect(titoli(doc, 4)).toEqual(NOMI.filter((n) => n !== 'Modelli e ricerca'));
      expect(sottoLaTesta(doc, 'Per te')).toContain('Dati non disponibili: Modelli e ricerca.');
      expect(pulito(testo(doc).textContent).match(/Dati non disponibili/g)).toHaveLength(1);
    });

    it('la card Competenze porta all’indice quando nasce, le altre restano testo', () => {
      /** I link del testo principale, fuori dalla testata, che hanno per testo il nome di una card. */
      const linkDelleCard = (doc: Document) =>
        [...testo(doc).querySelectorAll('main a')].map((a) => [pulito(a.textContent), a.getAttribute('href')]).filter(([t]) => NOMI.includes(t!));
      expect(linkDelleCard(leggi({ edizioni: [edizione], dataset: d }))).toEqual([['Competenze', 'competenze/']]);
      // senza il radar l'indice delle competenze non nasce, e la card resta testo come le altre
      const senzaRadar = leggi({ edizioni: [], dataset: { ...d, radar: undefined } });
      expect(testo(senzaRadar).querySelectorAll('a[href^="competenze"]')).toHaveLength(0);
    });
  });

  describe('in fondo', () => {
    const fondo = (doc: Document) => testo(doc).querySelector('footer');
    const linkDelFondo = (doc: Document) => [...(fondo(doc)?.querySelectorAll('a') ?? [])].map((a) => [pulito(a.textContent), a.getAttribute('href')]);

    it('la riga delle fonti dei dati c’è sempre, anche senza lo stato del giro, con le stesse fonti del colophon dell’app', () => {
      const colophon = FONTI_DEI_DATI.map((f) => [f.nome, f.url]);
      for (const dataset of [d, { ...d, status: undefined }, {}]) {
        const doc = leggi({ edizioni: [], dataset });
        expect(pulito(fondo(doc)?.textContent ?? '')).toContain(`Dati di ${FONTI_DEI_DATI.map((f) => f.nome).join(', ')}.`);
        expect(linkDelFondo(doc)).toEqual(colophon);
      }
    });

    it('con almeno un’edizione c’è il link al feed, senza edizioni no', () => {
      const alFeed = (doc: Document) => linkDelFondo(doc).filter(([, href]) => href === 'feed.xml');
      expect(alFeed(leggi({ edizioni: [edizione], dataset: d }))).toEqual([['Segui con RSS', 'feed.xml']]);
      expect(alFeed(leggi({ edizioni: [edizione], dataset: {} }))).toEqual([['Segui con RSS', 'feed.xml']]);
      expect(alFeed(leggi({ edizioni: [], dataset: d }))).toEqual([]);
    });
  });

  describe('i link', () => {
    const tutti = (doc: Document, dove = '') => [...testo(doc).querySelectorAll(`${dove} a`)].map((a) => [pulito(a.textContent), a.getAttribute('href')!]);
    /** I link dentro il sito: quelli alle fonti dei dati vanno fuori. */
    const linkDi = (doc: Document, dove = '') => tutti(doc, dove).filter(([, href]) => !/^https?:/.test(href));
    // la settimana dopo quella dei dati, raccolta il 22 ottobre
    const altra: Edizione = { ...edizione, settimana: '2026-10-19', raccolti: '2026-10-22T07:30:00+00:00', precedente: edizione.settimana };
    /** I dati con una sola competenza che entra tra quelle da imparare ora: MCP, senza RAG che esce. */
    const soloMcp: Dataset = { ...d, radar: { ...d.radar!, competenze: d.radar!.competenze.map((c) => (c.id === 'rag' ? { ...c, quadrante_prec: 'consolida' as const } : c)) } };

    it('la testata porta all’indice delle competenze e all’archivio solo quando le loro pagine nascono', () => {
      expect(linkDi(leggi({ edizioni: [edizione], dataset: d }), 'header')).toEqual([['Competenze', 'competenze/'], ['Edizioni', 'edizioni/']]);
      expect(linkDi(leggi({ edizioni: [], dataset: d }), 'header')).toEqual([['Competenze', 'competenze/']]);
      expect(linkDi(leggi({ edizioni: [edizione], dataset: { status: d.status } }), 'header')).toEqual([['Edizioni', 'edizioni/']]);
      expect(linkDi(leggi({ edizioni: [], dataset: {} }), 'header')).toEqual([]);
    });

    it('la settimana porta all’edizione di quella settimana solo quando esiste', () => {
      expect(linkDi(leggi({ edizioni: [edizione], dataset: d }))).toContainEqual(['Settimana del 12 ott 2026', 'edizioni/2026-10-12/']);
      for (const edizioni of [[], [altra]]) {
        const doc = leggi({ edizioni, dataset: d });
        expect(pulito(testo(doc).textContent)).toContain('Settimana del 12 ott 2026');
        expect(linkDi(doc).map(([t]) => t)).not.toContain('Settimana del 12 ott 2026');
      }
    });

    it('la notizia di una porta che parla di una competenza porta alla sua pagina, quella su più competenze all’indice, le altre restano testo', () => {
      expect(linkDi(leggi({ edizioni: [], dataset: soloMcp }), 'article')).toEqual([['MCP entra tra le competenze da imparare ora', 'competenze/mcp/']]);
      // MCP entra e RAG esce: in app la porta apre la card Competenze; la notizia di Business non ha una pagina statica
      expect(linkDi(leggi({ edizioni: [], dataset: d }), 'article')).toEqual([['MCP entra tra le competenze da imparare ora; RAG esce', 'competenze/']]);
    });

    it('nessun link contiene #, e ognuno porta a una voce della mappa', () => {
      for (const contenuto of [{ edizioni: [edizione], dataset: d }, { edizioni: [altra], dataset: soloMcp }, { edizioni: [], dataset: { status: d.status } }, { edizioni: [], dataset: {} }]) {
        const { file, doc } = conHome(contenuto);
        for (const [testoLink, href] of tutti(doc)) expect(href, testoLink).not.toContain('#');
        for (const [testoLink, href] of linkDi(doc)) expect(Object.keys(file), testoLink).toContain(href.endsWith('/') ? `${href}index.html` : href);
      }
    });
  });

  it('senza lo stato del giro restano la testata e la frase di apertura, senza settimana né porte', () => {
    const doc = leggi({ edizioni: [edizione], dataset: { ...d, status: undefined } });
    expect(testo(doc).querySelector('header')?.textContent).toContain('AI Radar');
    expect(titoli(doc, 1)).toEqual([FRASE_DI_APERTURA]);
    expect(titoli(doc, 2)).toEqual([]);
    expect(testo(doc).textContent).not.toMatch(/Settimana|MCP entra|imprese italiane/);
  });

  it('la testa è quella ricevuta, con il link al feed solo se ci sono edizioni', () => {
    const testa = (html: string) => html.match(/<head>[\s\S]*<\/head>/)![0];
    const senza = leggi({ edizioni: [], dataset: d });
    expect(testa(conHome({ edizioni: [], dataset: d }).file['index.html'])).toBe(TESTA_HOME);
    expect(senza.head.querySelector('link[rel="alternate"]')).toBeNull();
    const con = conHome({ edizioni: [edizione], dataset: d }).file['index.html'];
    const feed = new DOMParser().parseFromString(con, 'text/html').head.querySelectorAll('link[rel="alternate"][type="application/rss+xml"]');
    expect([...feed].map((l) => l.getAttribute('href'))).toEqual([assoluto('feed.xml')]);
    expect(testa(con).replace(/\s*<link rel="alternate"[^>]*>\s*/, '\n')).toBe(TESTA_HOME);
  });

  it('un testo con caratteri speciali nei dati esce con l’escape', () => {
    const strano = 'M<i>C</i>P & "co"';
    const radar = { ...d.radar!, competenze: d.radar!.competenze.map((c) => (c.id === 'mcp' ? { ...c, breve: strano } : c)) };
    const { file, doc } = conHome({ edizioni: [], dataset: { ...d, radar } });
    expect(file['index.html']).toContain('M&lt;i&gt;C&lt;/i&gt;P &amp; &quot;co&quot;');
    expect(pulito(testo(doc).textContent)).toContain(`${strano} entra tra le competenze da imparare ora`);
    expect(testo(doc).querySelector('main i')).toBeNull();
  });

  it('nessuna data viene dall’orologio: con gli stessi dati, in giorni e ore diversi, il testo è lo stesso', () => {
    const contenuto = { edizioni: [edizione], dataset: d };
    try {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-16T05:00:00Z'));
      const lunedi = conHome(contenuto).file['index.html'];
      vi.setSystemTime(new Date('2027-03-04T23:59:00Z'));
      expect(conHome(contenuto).file['index.html']).toBe(lunedi);
    } finally {
      vi.useRealTimers();
    }
  });

  it('la sitemap ha ancora la home una volta sola, come primo indirizzo', () => {
    const loc = [...new DOMParser().parseFromString(conHome({ edizioni: [edizione], dataset: d }).file['sitemap.xml'], 'application/xml').querySelectorAll('loc')].map((l) => l.textContent);
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
    expect(nav('competenze/mcp/index.html', senzaEdizioni).map(([t]) => t)).toEqual(['Competenze', 'Dati di oggi', 'Segui con RSS']);
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
    expect(filePubblici({ edizioni: [edizione], dataset: {} }, { ...opzioni, home: HOME })['index.html']).toBeDefined();
    expect(indirizzi({ edizioni: [edizione], dataset: {} }, { ...opzioni, home: HOME })).toEqual(['', 'edizioni/', `edizioni/${edizione.settimana}/`].map(assoluto));
  });

  it('ogni indirizzo è assoluto e segue l’indirizzo base, anche quando non è quello predefinito', () => {
    const base = 'https://altro-utente.github.io/altro-radar/';
    const loc = indirizzi({ edizioni: [edizione], dataset: d }, { ...opzioni, indirizzoBase: base });
    expect(loc[0]).toBe(base);
    expect(loc).toHaveLength(9);
    for (const l of loc) expect(l!.startsWith(base), l!).toBe(true);
  });

  it('ogni indirizzo coincide con il canonical scritto nella pagina della mappa a quel percorso', () => {
    const file = filePubblici({ edizioni: [edizione], dataset: d }, { ...opzioni, home: HOME });
    const canonical = (percorso: string) => new DOMParser().parseFromString(file[percorso], 'text/html').querySelector('link[rel="canonical"]')?.getAttribute('href');
    for (const l of indirizzi({ edizioni: [edizione], dataset: d }, { ...opzioni, home: HOME })) {
      expect(canonical(`${l!.slice(opzioni.indirizzoBase.length)}index.html`)).toBe(l);
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
        .map((u) => [u.querySelector('loc')!.textContent!.slice(opzioni.indirizzoBase.length), u.querySelector('lastmod')?.textContent ?? null]));
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

    it('home, indice e pagine delle competenze hanno il giorno di generato di radar.json, e senza radar la home non ha data', () => {
      const radar = { ...d.radar!, generato: '2026-10-26' };
      expect(date({ edizioni: [corretta, seconda], dataset: { radar } })).toEqual({
        '': '2026-10-26',
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
      expect(date({ edizioni: [seconda], dataset: {} })['']).toBeNull();
      expect(date({ edizioni: [], dataset: {} })).toEqual({ '': null });
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
