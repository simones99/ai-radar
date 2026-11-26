// Il feed visto da chi lo legge: l'XML che esce dal modulo Edizioni, letto con un parser, e il testo di ogni voce letto per ruoli e nomi.
import { within } from '@testing-library/dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Dataset } from '../data/types';
import { FIXTURE } from '../test/fixtures';
import { apri } from '../test/pagina';
import { creaEdizione, fileDelleEdizioni, type Edizione } from '.';

const BASE = 'https://altro-utente.github.io/altro-radar/';
const d = FIXTURE as Dataset;
const prima = creaEdizione(d, null) as Edizione;
const seconda = creaEdizione({ ...d, status: { ...d.status!, aggiornato: '2026-10-22T08:00:00+00:00' } }, prima) as Edizione;

const opzioni = (indirizzoBase = BASE) => ({ indirizzoBase, foglio: 'assets/index-abc123.css' });
const xml = (...ed: Edizione[]) => fileDelleEdizioni(ed, opzioni())['feed.xml'];
const leggi = (testo: string) => {
  const doc = new DOMParser().parseFromString(testo, 'application/xml');
  expect(doc.querySelector('parsererror')).toBeNull();
  return doc;
};
// l'elemento channel di RSS: il feed, con i suoi dati e le sue voci
const ilFeed = (...ed: Edizione[]) => leggi(xml(...ed)).querySelector('rss > channel')!;
const figlio = (el: Element, nome: string) => [...el.children].find((c) => c.tagName === nome);
/** Le voci (item) di un feed già letto. */
const vociDel = (feed: Element | Document) => [...feed.querySelectorAll('item')];
const voci = (...ed: Edizione[]) => vociDel(ilFeed(...ed));
/** L'HTML del testo intero di una voce, in content:encoded. */
const testoDellaVoce = (item: Element) => item.getElementsByTagNameNS('http://purl.org/rss/1.0/modules/content/', 'encoded')[0].textContent ?? '';
/**
 * Il testo intero della prima voce, aperto come lo legge un lettore di schermo, con tutto il suo testo di fila.
 * Ogni apertura sostituisce la pagina del test: si finisce di leggere una voce prima di aprirne un'altra.
 */
const apriLaVoce = (e: Edizione) => Object.assign(apri(testoDellaVoce(voci(e)[0])), { testo: document.body.textContent ?? '' });

describe('il feed', () => {
  it('prima della prima edizione non esiste', () => {
    expect(fileDelleEdizioni([], opzioni())).not.toHaveProperty(['feed.xml']);
  });

  it('è RSS 2.0, in italiano, e ha titolo, link e descrizione', () => {
    const doc = leggi(xml(prima));
    expect(doc.documentElement.tagName).toBe('rss');
    expect(doc.documentElement.getAttribute('version')).toBe('2.0');
    const c = ilFeed(prima);
    expect(figlio(c, 'language')?.textContent).toBe('it');
    expect(figlio(c, 'title')?.textContent).toBe('AI Radar, le edizioni');
    expect(figlio(c, 'link')?.textContent).toBe(`${BASE}edizioni/`);
    expect(figlio(c, 'description')?.textContent).toBeTruthy();
  });

  it('ha un atom:link verso se stesso, nello spazio dei nomi di Atom', () => {
    const atom = ilFeed(prima).getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'link')[0];
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
    const archivio = apri(fileDelleEdizioni(tante, opzioni())['edizioni/index.html']);
    expect(within(archivio.getByRole('main')).getAllByRole('listitem')).toHaveLength(30);
    expect(Object.keys(fileDelleEdizioni(tante, opzioni())).filter((p) => /^edizioni\/\d/.test(p))).toHaveLength(30);
  });
});

describe('una voce del feed', () => {
  const voce = (e: Edizione = prima) => voci(e)[0];
  /** Il testo intero della voce, come lo apre un lettore di feed. */
  const testoIntero = (e: Edizione = prima) => apriLaVoce(e);

  it('ha il titolo con la data, il link all’edizione e pubDate dal momento della raccolta', () => {
    const v = voce();
    expect(figlio(v, 'title')?.textContent).toBe('AI Radar, settimana del 12 ott 2026');
    expect(figlio(v, 'link')?.textContent).toBe(`${BASE}edizioni/2026-10-12/`);
    expect(figlio(v, 'pubDate')?.textContent).toBe('Thu, 15 Oct 2026 08:00:00 GMT');
  });

  it('la descrizione contiene le due porte, Per te per prima, e la fonte degli annunci', () => {
    expect(figlio(voce(), 'description')?.textContent).toBe("MCP entra tra le competenze da imparare ora; RAG esce. 16% delle imprese italiane usa l'AI (UE: 20%). Annunci: The Adzuna API.");
  });

  it('ha il testo intero in HTML: porte, frasi, notizie, fonti e link', () => {
    const voce = testoIntero();
    const t = voce.testo;
    expect(t).toContain('MCP entra tra le competenze da imparare ora; RAG esce');
    expect(t).toContain("16% delle imprese italiane usa l'AI (UE: 20%)");
    expect(t).toContain("Imprese italiane che usano l'AI nel 2025. UE: 20%.");
    expect(t).toContain("The Adzuna API (termini d'uso di Adzuna)");
    expect(t).toContain('non sono una classifica');
    const titolo = "Google says self-improving AI isn't anywhere close";
    expect(voce.getByRole('link', { name: titolo })).toHaveAttribute('href', 'https://the-decoder.com/a');
    // la riga della notizia: la voce di elenco che ha il suo link
    const riga = voce.getAllByRole('listitem').filter((li) => within(li).queryByRole('link', { name: titolo }));
    expect(riga).toHaveLength(1);
    expect(riga[0].textContent).toContain('The Decoder');
    expect(voce.getAllByRole('link', { name: 'The Adzuna API' })[0].getAttribute('href')).toMatch(/^https:/);
  });

  it('il conteggio delle notizie è la frase salvata nel file fisso: una correzione a quella frase si vede anche qui', () => {
    expect(testoIntero().testo).toMatch(/2\s+Notizie nei 7 giorni fino al 15 ott 2026, da 2 fonti\./);
    const corretta = { ...prima, card: prima.card.map((c) => (c.id === 'notizie' ? { ...c, cifra: '3', frase: 'Notizie corrette a mano, da 3 fonti.' } : c)) };
    expect(testoIntero(corretta).testo).toMatch(/3\s+Notizie corrette a mano, da 3 fonti\./);
  });

  it('i link alle card sono assoluti e seguono l’indirizzo base: nel lettore non c’è una pagina da cui partire', () => {
    const voce = testoIntero();
    expect(voce.getByRole('link', { name: 'Norme' })).toHaveAttribute('href', `${BASE}#norme`);
    expect(voce.getByRole('link', { name: 'Le altre notizie, nella card Notizie' })).toHaveAttribute('href', `${BASE}#notizie`);
    for (const a of voce.getAllByRole('link')) expect(a.getAttribute('href')).toMatch(/^https?:\/\//);
  });

  it('il confronto con la settimana prima porta all’edizione con un link assoluto, e la riga cambiata dice com’era', () => {
    const conAltraCifra = { ...prima, card: prima.card.map((c) => (c.id === 'modelli' ? { ...c, cifra: '×9,9' } : c)) };
    const voce = testoIntero(creaEdizione({ ...d, status: { ...d.status!, aggiornato: '2026-10-22T08:00:00+00:00' } }, conAltraCifra) as Edizione);
    expect(voce.getByRole('link', { name: 'settimana del 12 ott 2026' })).toHaveAttribute('href', `${BASE}edizioni/2026-10-12/`);
    expect(voce.testo).toContain("Era ×9,9 all'anno.");
    expect(voce.queryByRole('navigation')).toBeNull(); // i link tra le edizioni stanno nella pagina: la voce è già in un elenco
  });

  it('non ripete il titolo, che il lettore mostra già, e non parla di una pagina', () => {
    const voce = testoIntero();
    expect(voce.queryByRole('heading', { level: 1 })).toBeNull();
    expect(voce.testo).toMatch(/Questa edizione resta com'è, con i dati raccolti il 15 ott 2026/);
  });

  describe('il guid', () => {
    const guid = (testo: string) => leggi(testo).querySelector('item > guid')!;

    it('non è un permalink e ha il formato ai-radar:edizione:AAAA-MM-GG', () => {
      const g = guid(xml(prima));
      expect(g.getAttribute('isPermaLink')).toBe('false');
      expect(g.textContent).toBe('ai-radar:edizione:2026-10-12');
    });

    it('resta uguale con un altro indirizzo base, mentre il link lo segue', () => {
      const altrove = fileDelleEdizioni([prima], opzioni('https://altrove.example/radar/'))['feed.xml'];
      expect(guid(altrove).textContent).toBe(guid(xml(prima)).textContent);
      expect(figlio(vociDel(leggi(altrove))[0], 'link')?.textContent).toBe('https://altrove.example/radar/edizioni/2026-10-12/');
    });
  });

  describe('una correzione', () => {
    const corretta: Edizione = { ...prima, correzioni: [{ data: '2026-10-20', testo: 'Il dato di Eurostat era quello del 2024.' }] };

    it('si legge dentro la voce, in testa', () => {
      const voce = testoIntero(corretta);
      const riga = voce.getAllByRole('paragraph').find((p) => p.textContent?.startsWith('Corretta'))!;
      expect(riga.textContent).toBe('Corretta il 20 ott 2026: Il dato di Eurostat era quello del 2024.');
      // la riga viene prima della prima porta
      expect(riga.compareDocumentPosition(voce.getAllByRole('article')[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('non cambia guid, link, titolo né data della voce: per il lettore è la stessa voce', () => {
      for (const nome of ['guid', 'link', 'title', 'pubDate']) expect(figlio(voce(corretta), nome)?.textContent).toBe(figlio(voce(), nome)?.textContent);
    });

    it('senza correzioni la voce non ne parla', () => {
      expect(testoIntero().testo).not.toContain('Corretta');
    });
  });
});

describe('neutralizzare i testi esterni nel feed', () => {
  const conVoce = (titolo: string, link = 'https://esempio.org/?a=1&b=2', fonte = 'F<1>'): Edizione => ({
    ...prima,
    notizie: { ...prima.notizie, temi: [{ tema: 'ricerca', nome: 'Ricerca', voci: [{ titolo, link, data: '2026-10-14', fonte }] }] },
  });
  /** La prima notizia del tema Ricerca, nella lista che prende il nome dal tema. */
  const voceDelTema = (e: Edizione) => within(apriLaVoce(e).getByRole('list', { name: 'Ricerca' })).getAllByRole('listitem')[0];
  /** Il link della prima notizia del tema Ricerca. */
  const laNotizia = (e: Edizione) => within(voceDelTema(e)).getByRole('link');

  it('< e & in un titolo non rompono l’XML e restano testo nell’HTML della voce', () => {
    const li = voceDelTema(conVoce('<img src=x onerror=alert(1)> A & B'));
    expect(within(li).queryByRole('img')).toBeNull();
    expect(within(li).getByRole('link').textContent).toBe('<img src=x onerror=alert(1)> A & B');
    expect(within(li).getByRole('link')).toHaveAttribute('href', 'https://esempio.org/?a=1&b=2');
    expect(li.textContent).toContain('F<1>');
  });

  it('un titolo che prova a chiudere un blocco XML resta testo', () => {
    expect(voceDelTema(conVoce(']]></content:encoded><item>x</item>')).textContent).toContain(']]></content:encoded><item>x</item>');
    expect(voci(conVoce(']]></content:encoded><item>x</item>'))).toHaveLength(1);
  });

  it('un carattere che XML non ammette non rompe il feed: sparisce, e il resto del titolo resta', () => {
    expect(laNotizia(conVoce('Un\u000b titolo\u0000 con￾ scarti \ud83d')).textContent).toBe('Un titolo con scarti ');
  });

  it('le emoji e gli accenti nei titoli restano', () => {
    expect(laNotizia(conVoce('È già qui 🤖')).textContent).toBe('È già qui 🤖');
  });

  it('una porta con < e & non rompe né il titolo né la descrizione della voce', () => {
    const e = { ...prima, porte: [{ ...prima.porte[0], titolo: [{ t: 'A < B & C' }] }, prima.porte[1]] };
    expect(figlio(voci(e)[0], 'description')?.textContent).toContain('A < B & C.');
  });

  it.each(['javascript:alert(1)', 'data:text/html,x', 'ftp://esempio.org/x', '/relativo', ''])('il link «%s» non diventa un link: la voce resta, come testo', (link) => {
    const li = voceDelTema(conVoce('Un titolo', link));
    expect(li.textContent).toContain('Un titolo');
    expect(within(li).queryByRole('link')).toBeNull();
  });

  it('anche l’indirizzo di una fonte passa dallo stesso controllo', () => {
    const f = { ...prima, card: prima.card.map((c) => ({ ...c, fonti: [{ nome: 'Fonte', url: 'javascript:alert(1)', licenza: 'CC0' }] })) };
    expect(xml(f)).not.toContain('javascript:');
  });
});

describe('trovare il feed dalle pagine', () => {
  const html = (percorso: string) => fileDelleEdizioni([prima, seconda], opzioni())[percorso];
  /** Il link per i lettori di feed, nella testa della pagina: non ha un ruolo, si legge dal tag. */
  const linkAlternate = (percorso: string) => new DOMParser().parseFromString(html(percorso), 'text/html').head.querySelector('link[rel="alternate"]');

  it.each([
    ['edizioni/2026-10-12/index.html', '../../feed.xml'],
    ['edizioni/index.html', '../feed.xml'],
  ])('%s ha il link rel="alternate" assoluto, per i lettori, e il link visibile «Segui con RSS»', (percorso, relativo) => {
    const alternate = linkAlternate(percorso);
    expect(alternate?.getAttribute('type')).toBe('application/rss+xml');
    expect(alternate?.getAttribute('href')).toBe(`${BASE}feed.xml`);
    expect(alternate?.getAttribute('title')).toBe('AI Radar, le edizioni');
    const visibili = apri(html(percorso)).getAllByRole('link', { name: 'Segui con RSS' });
    expect(visibili).toHaveLength(1);
    expect(visibili[0]).toHaveAttribute('href', relativo);
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
