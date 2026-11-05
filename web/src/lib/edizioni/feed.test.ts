// Il feed visto da chi lo legge: l'XML che esce dal modulo Edizioni, letto con un parser.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Dataset } from '../data/types';
import { FIXTURE } from '../test/fixtures';
import { creaEdizione, filePubblici, type Edizione } from '.';

const BASE = 'https://altro-utente.github.io/altro-radar/';
const d = FIXTURE as Dataset;
const prima = creaEdizione(d, null) as Edizione;
const seconda = creaEdizione({ ...d, status: { ...d.status!, aggiornato: '2026-10-22T08:00:00+00:00' } }, prima) as Edizione;

const opzioni = (indirizzoBase = BASE) => ({ indirizzoBase, foglio: 'assets/index-abc123.css' });
const xml = (...ed: Edizione[]) => filePubblici(ed, opzioni())['feed.xml'];
const leggi = (testo: string) => {
  const doc = new DOMParser().parseFromString(testo, 'application/xml');
  expect(doc.querySelector('parsererror')).toBeNull();
  return doc;
};
const canale = (...ed: Edizione[]) => leggi(xml(...ed)).querySelector('rss > channel')!;
const figlio = (el: Element, nome: string) => [...el.children].find((c) => c.tagName === nome);
const voci = (...ed: Edizione[]) => [...canale(...ed).querySelectorAll('item')];

describe('il canale del feed', () => {
  it('prima della prima edizione non esiste', () => {
    expect(filePubblici([], opzioni())).not.toHaveProperty(['feed.xml']);
  });

  it('è RSS 2.0, in italiano, e ha titolo, link e descrizione', () => {
    const doc = leggi(xml(prima));
    expect(doc.documentElement.tagName).toBe('rss');
    expect(doc.documentElement.getAttribute('version')).toBe('2.0');
    const c = canale(prima);
    expect(figlio(c, 'language')?.textContent).toBe('it');
    expect(figlio(c, 'title')?.textContent).toBe('AI Radar, le edizioni');
    expect(figlio(c, 'link')?.textContent).toBe(`${BASE}edizioni/`);
    expect(figlio(c, 'description')?.textContent).toBeTruthy();
  });

  it('ha un atom:link verso se stesso, nello spazio dei nomi di Atom', () => {
    const atom = canale(prima).getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'link')[0];
    expect(atom.getAttribute('href')).toBe(`${BASE}feed.xml`);
    expect(atom.getAttribute('rel')).toBe('self');
    expect(atom.getAttribute('type')).toBe('application/rss+xml');
  });

  it('ha una voce per edizione, dalla più recente, qualunque sia l’ordine in cui arrivano', () => {
    expect(voci(prima, seconda).map((v) => figlio(v, 'title')?.textContent)).toEqual(['AI Radar, settimana del 19 ott 2026', 'AI Radar, settimana del 12 ott 2026']);
  });

  it('tiene le ultime 26 edizioni, mentre l’archivio resta completo', () => {
    const tante = Array.from({ length: 30 }, (_, i) => ({ ...prima, settimana: `20${10 + i}-01-04` }));
    const v = voci(...tante);
    expect(v).toHaveLength(26);
    expect(figlio(v[0], 'title')?.textContent).toContain('2039');
    expect(figlio(v[25], 'title')?.textContent).toContain('2014');
    const archivio = new DOMParser().parseFromString(filePubblici(tante, opzioni())['edizioni/index.html'], 'text/html');
    expect(archivio.querySelectorAll('main li')).toHaveLength(30);
    expect(Object.keys(filePubblici(tante, opzioni())).filter((p) => /^edizioni\/\d/.test(p))).toHaveLength(30);
  });
});

describe('una voce del feed', () => {
  const voce = (e: Edizione = prima) => voci(e)[0];
  /** Il testo intero della voce, come lo apre un lettore di feed. */
  const testoIntero = (e: Edizione = prima) => {
    const html = voce(e).getElementsByTagNameNS('http://purl.org/rss/1.0/modules/content/', 'encoded')[0].textContent ?? '';
    return new DOMParser().parseFromString(html, 'text/html');
  };

  it('ha il titolo con la data, il link all’edizione e pubDate dal momento della raccolta', () => {
    const v = voce();
    expect(figlio(v, 'title')?.textContent).toBe('AI Radar, settimana del 12 ott 2026');
    expect(figlio(v, 'link')?.textContent).toBe(`${BASE}edizioni/2026-10-12/`);
    expect(figlio(v, 'pubDate')?.textContent).toBe('Thu, 15 Oct 2026 08:00:00 GMT');
  });

  it('la descrizione contiene le due porte, Per te per prima', () => {
    expect(figlio(voce(), 'description')?.textContent).toBe("MCP entra tra le competenze da imparare ora; RAG esce. 16% delle imprese italiane usa l'AI (UE: 20%).");
  });

  it('ha il testo intero in HTML: porte, frasi, notizie, fonti e link', () => {
    const doc = testoIntero();
    const t = doc.body.textContent;
    expect(t).toContain('MCP entra tra le competenze da imparare ora; RAG esce');
    expect(t).toContain("16% delle imprese italiane usa l'AI (UE: 20%)");
    expect(t).toContain("Imprese italiane che usano l'AI nel 2025. UE: 20%.");
    expect(t).toContain("The Adzuna API (termini d'uso di Adzuna)");
    expect(t).toContain('non sono una classifica');
    const notizia = [...doc.querySelectorAll('a')].find((a) => a.textContent === "Google says self-improving AI isn't anywhere close")!;
    expect(notizia.getAttribute('href')).toBe('https://the-decoder.com/a');
    expect(notizia.closest('li')?.textContent).toContain('The Decoder');
    expect([...doc.querySelectorAll('a')].find((a) => a.textContent === 'The Adzuna API')?.getAttribute('href')).toMatch(/^https:/);
  });

  it('il conteggio delle notizie è la frase salvata nel file fisso: una correzione a quella frase si vede anche qui', () => {
    expect(testoIntero().body.textContent).toMatch(/2\s+Notizie nei 7 giorni fino al 15 ott 2026, da 2 fonti\./);
    const corretta = { ...prima, card: prima.card.map((c) => (c.id === 'notizie' ? { ...c, cifra: '3', frase: 'Notizie corrette a mano, da 3 fonti.' } : c)) };
    expect(testoIntero(corretta).body.textContent).toMatch(/3\s+Notizie corrette a mano, da 3 fonti\./);
  });

  it('i link alle card sono assoluti e seguono l’indirizzo base: nel lettore non c’è una pagina da cui partire', () => {
    const doc = testoIntero();
    expect([...doc.querySelectorAll('a')].find((a) => a.textContent === 'Norme')?.getAttribute('href')).toBe(`${BASE}#norme`);
    expect([...doc.querySelectorAll('a')].find((a) => a.textContent === 'Le altre notizie, nella card Notizie')?.getAttribute('href')).toBe(`${BASE}#notizie`);
    for (const a of doc.querySelectorAll('a')) expect(a.getAttribute('href')).toMatch(/^https?:\/\//);
  });

  it('il confronto con la settimana prima porta all’edizione con un link assoluto, e la riga cambiata dice com’era', () => {
    const conAltraCifra = { ...prima, card: prima.card.map((c) => (c.id === 'modelli' ? { ...c, cifra: '×9,9' } : c)) };
    const doc = testoIntero(creaEdizione({ ...d, status: { ...d.status!, aggiornato: '2026-10-22T08:00:00+00:00' } }, conAltraCifra) as Edizione);
    expect([...doc.querySelectorAll('a')].find((a) => a.textContent === 'settimana del 12 ott 2026')?.getAttribute('href')).toBe(`${BASE}edizioni/2026-10-12/`);
    expect(doc.body.textContent).toContain("Era ×9,9 all'anno.");
    expect(doc.querySelector('nav')).toBeNull(); // i link tra le edizioni stanno nella pagina: la voce è già in un elenco
  });

  it('non ripete il titolo, che il lettore mostra già, e non parla di una pagina', () => {
    const doc = testoIntero();
    expect(doc.querySelector('h1')).toBeNull();
    expect(doc.body.textContent).toMatch(/Questa edizione resta com'è, con i dati raccolti il 15 ott 2026/);
  });

  describe('il guid', () => {
    const guid = (testo: string) => leggi(testo).querySelector('item > guid')!;

    it('non è un permalink e ha il formato ai-radar:edizione:AAAA-MM-GG', () => {
      const g = guid(xml(prima));
      expect(g.getAttribute('isPermaLink')).toBe('false');
      expect(g.textContent).toBe('ai-radar:edizione:2026-10-12');
    });

    it('resta uguale con un altro indirizzo base, mentre il link lo segue', () => {
      const altrove = filePubblici([prima], opzioni('https://altrove.example/radar/'))['feed.xml'];
      expect(guid(altrove).textContent).toBe(guid(xml(prima)).textContent);
      expect(figlio(leggi(altrove).querySelector('item')!, 'link')?.textContent).toBe('https://altrove.example/radar/edizioni/2026-10-12/');
    });
  });

  describe('una correzione', () => {
    const corretta: Edizione = { ...prima, correzioni: [{ data: '2026-10-20', testo: 'Il dato di Eurostat era quello del 2024.' }] };

    it('si legge dentro la voce, in testa', () => {
      const doc = testoIntero(corretta);
      const riga = [...doc.querySelectorAll('p')].find((p) => p.textContent?.startsWith('Corretta'))!;
      expect(riga.textContent).toBe('Corretta il 20 ott 2026: Il dato di Eurostat era quello del 2024.');
      expect(riga.compareDocumentPosition(doc.querySelector('article')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('non cambia guid, link, titolo né data della voce: per il lettore è la stessa voce', () => {
      for (const nome of ['guid', 'link', 'title', 'pubDate']) expect(figlio(voce(corretta), nome)?.textContent).toBe(figlio(voce(), nome)?.textContent);
    });

    it('senza correzioni la voce non ne parla', () => {
      expect(testoIntero().body.textContent).not.toContain('Corretta');
    });
  });
});

describe('neutralizzare i testi esterni nel feed', () => {
  const conVoce = (titolo: string, link = 'https://esempio.org/?a=1&b=2', fonte = 'F<1>'): Edizione => ({
    ...prima,
    notizie: { ...prima.notizie, temi: [{ tema: 'ricerca', nome: 'Ricerca', voci: [{ titolo, link, data: '2026-10-14', fonte }] }] },
  });
  const testoIntero = (e: Edizione) => new DOMParser().parseFromString(voci(e)[0].getElementsByTagNameNS('http://purl.org/rss/1.0/modules/content/', 'encoded')[0].textContent ?? '', 'text/html');
  const voceDelTema = (e: Edizione) => [...testoIntero(e).querySelectorAll('h3')].find((h) => h.textContent === 'Ricerca')!.nextElementSibling!.querySelector('li')!;

  it('< e & in un titolo non rompono l’XML e restano testo nell’HTML della voce', () => {
    const li = voceDelTema(conVoce('<img src=x onerror=alert(1)> A & B'));
    expect(li.querySelector('img')).toBeNull();
    expect(li.querySelector('a')?.textContent).toBe('<img src=x onerror=alert(1)> A & B');
    expect(li.querySelector('a')?.getAttribute('href')).toBe('https://esempio.org/?a=1&b=2');
    expect(li.textContent).toContain('F<1>');
  });

  it('un titolo che prova a chiudere un blocco XML resta testo', () => {
    expect(voceDelTema(conVoce(']]></content:encoded><item>x</item>')).textContent).toContain(']]></content:encoded><item>x</item>');
    expect(voci(conVoce(']]></content:encoded><item>x</item>'))).toHaveLength(1);
  });

  it('un carattere che XML non ammette non rompe il feed: sparisce, e il resto del titolo resta', () => {
    expect(voceDelTema(conVoce('Un\u000b titolo\u0000 con￾ scarti \ud83d')).querySelector('a')?.textContent).toBe('Un titolo con scarti ');
  });

  it('le emoji e gli accenti nei titoli restano', () => {
    expect(voceDelTema(conVoce('È già qui 🤖')).querySelector('a')?.textContent).toBe('È già qui 🤖');
  });

  it('una porta con < e & non rompe né il titolo né la descrizione della voce', () => {
    const e = { ...prima, porte: [{ ...prima.porte[0], titolo: [{ t: 'A < B & C' }] }, prima.porte[1]] };
    expect(figlio(voci(e)[0], 'description')?.textContent).toContain('A < B & C.');
  });

  it.each(['javascript:alert(1)', 'data:text/html,x', 'ftp://esempio.org/x', '/relativo', ''])('il link «%s» non diventa un link: la voce resta, come testo', (link) => {
    const li = voceDelTema(conVoce('Un titolo', link));
    expect(li.textContent).toContain('Un titolo');
    expect(li.querySelector('a')).toBeNull();
  });

  it('anche l’indirizzo di una fonte passa dallo stesso controllo', () => {
    const f = { ...prima, card: prima.card.map((c) => ({ ...c, fonti: [{ nome: 'Fonte', url: 'javascript:alert(1)', licenza: 'CC0' }] })) };
    expect(xml(f)).not.toContain('javascript:');
  });
});

describe('trovare il feed dalle pagine', () => {
  const pagina = (percorso: string) => new DOMParser().parseFromString(filePubblici([prima, seconda], opzioni())[percorso], 'text/html');

  it.each([
    ['edizioni/2026-10-12/index.html', '../../feed.xml'],
    ['edizioni/index.html', '../feed.xml'],
  ])('%s ha il link rel="alternate" assoluto, per i lettori, e il link visibile «Segui con RSS»', (percorso, relativo) => {
    const doc = pagina(percorso);
    const alternate = doc.querySelector('head link[rel="alternate"]');
    expect(alternate?.getAttribute('type')).toBe('application/rss+xml');
    expect(alternate?.getAttribute('href')).toBe(`${BASE}feed.xml`);
    expect(alternate?.getAttribute('title')).toBe('AI Radar, le edizioni');
    const visibili = [...doc.querySelectorAll('a')].filter((a) => a.textContent === 'Segui con RSS');
    expect(visibili).toHaveLength(1);
    expect(visibili[0].getAttribute('href')).toBe(relativo);
  });

  it('il testo intero della voce non invita a seguire un feed che il lettore sta già seguendo', () => {
    expect(xml(prima)).not.toContain('Segui con RSS');
  });
});

describe('due build con le stesse edizioni', () => {
  afterEach(() => vi.useRealTimers());

  it('danno lo stesso feed, qualunque sia il momento della build e l’ordine in cui arrivano i file', () => {
    const adesso = xml(prima, seconda);
    vi.useFakeTimers({ now: new Date('2031-03-03T10:00:00') });
    expect(xml(seconda, prima)).toBe(adesso);
  });

  it('una data di raccolta non valida ferma il sito con un messaggio chiaro: il feed non pubblica una data rotta', () => {
    expect(() => xml({ ...prima, raccolti: 'ieri' })).toThrow(/2026-10-12.*raccolt.*ieri/i);
  });
});
