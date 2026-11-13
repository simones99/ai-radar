// Le pagine statiche delle competenze, lette come le legge chi arriva da un motore di ricerca: l'HTML che esce dalla mappa del sito.
import { describe, expect, it } from 'vitest';
import type { Dataset, Radar } from '../data/types';
import { METODO_COMPETENZE } from '../text/competenza';
import { FIXTURE } from '../test/fixtures';
import { filePubblici } from '.';

const BASE = 'https://esempio.org/ai-radar/';
const opzioni = { indirizzoBase: BASE, foglio: 'assets/index-abc.css' };
const RADAR = (FIXTURE as Dataset).radar as Radar;

const file = (radar?: Radar) => filePubblici({ edizioni: [], radar }, opzioni);
const pagina = (id: string, radar: Radar = RADAR) => {
  const html = file(radar)[`competenze/${id}/index.html`];
  expect(html, `nessuna pagina per ${id}`).toBeDefined();
  return new DOMParser().parseFromString(html, 'text/html');
};

describe('le pagine delle competenze', () => {
  it('ogni competenza del radar ha la sua pagina, anche senza edizioni', () => {
    const percorsi = Object.keys(file(RADAR)).filter((p) => /^competenze\/[^/]+\/index\.html$/.test(p));
    expect(percorsi.sort()).toEqual(['agenti', 'mcp', 'rag', 'robotica', 'vector-db'].map((id) => `competenze/${id}/index.html`));
  });

  it('senza radar.json, o con quello della pipeline vecchia, non nasce nessuna pagina', () => {
    const competenze = (radar: Radar | undefined) => Object.keys(file(radar)).filter((p) => p.startsWith('competenze/'));
    expect(competenze(undefined)).toEqual([]);
    expect(competenze({ ...RADAR, versione: 1 } as unknown as Radar)).toEqual([]);
  });

  it('canonical, indirizzo e immagine sono assoluti dall’indirizzo base, e la pagina è un articolo', () => {
    const doc = pagina('vector-db');
    const meta = (p: string) => doc.querySelector(`meta[property="${p}"]`)?.getAttribute('content');
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${BASE}competenze/vector-db/`);
    expect(meta('og:url')).toBe(`${BASE}competenze/vector-db/`);
    expect(meta('og:image')).toBe(`${BASE}competenze/vector-db/anteprima.png`);
    expect(meta('og:type')).toBe('article');
  });

  it('il testo alternativo dell’anteprima dice quello che c’è nell’immagine: nome, quadrante nei due mercati e data dei dati', () => {
    const alt = (doc: Document) => doc.querySelector('meta[property="og:image:alt"]')?.getAttribute('content');
    expect(alt(pagina('mcp'))).toBe('Model Context Protocol (MCP) su AI Radar. Tutti i Paesi: Impara ora. Italia: Da provare. Dati del 15 ott 2026.');
    expect(alt(pagina('mcp', conCompetenza('mcp', { domanda_it: null, annunci_it: null, quadrante_it: null, quadrante_calcolato_it: null }))))
      .toBe('Model Context Protocol (MCP) su AI Radar. Tutti i Paesi: Impara ora. Italia: Dati non disponibili. Dati del 15 ott 2026.');
    expect(alt(pagina('rag', conCompetenza('rag', { slancio: null, quadrante: null }))))
      .toBe('RAG e ricerca semantica su AI Radar. Tutti i Paesi: Dati non disponibili. Italia: Dati non disponibili. Dati del 15 ott 2026.');
  });

  /** Il radar con una competenza cambiata: per le varianti che il FIXTURE non ha. */
  const conCompetenza = (id: string, cambi: Partial<Radar['competenze'][number]>): Radar => ({
    ...RADAR, competenze: RADAR.competenze.map((c) => (c.id === id ? { ...c, ...cambi } : c)),
  });
  /** Il radar in cui una competenza non ha il dato italiano. */
  const senzaItalia = (id: string) => conCompetenza(id, { domanda_it: null, annunci_it: null, quadrante_it: null, quadrante_calcolato_it: null });
  const testo = (doc: Document) => doc.querySelector('main')?.textContent?.replace(/\s+/g, ' ') ?? '';

  it('in testa ci sono la descrizione e dove sta la competenza con tutti i Paesi e in Italia', () => {
    const t = testo(pagina('mcp'));
    expect(t).toContain('Lo standard per collegare strumenti.');
    expect(t).toContain('Tutti i Paesi: Impara ora, un mese fa Da consolidare.');
    expect(t).toContain("Italia: Da provare, un mese fa Tieni d'occhio.");
  });

  it('se per l’Italia il dato manca lo dice con la frase dell’app, e il resto resta', () => {
    const t = testo(pagina('mcp', senzaItalia('mcp')));
    expect(t).toContain('Tutti i Paesi: Impara ora, un mese fa Da consolidare.');
    expect(t).toContain('Per l’Italia il dato non è disponibile in questo momento.');
    expect(t).not.toContain('Italia: Da provare');
  });

  it('dice la data dei dati, e che la pagina segue i dati di ogni lunedì', () => {
    const t = testo(pagina('agenti'));
    expect(t).toContain('Dati raccolti il 15 ott 2026.');
    expect(t).toContain('si aggiorna ogni lunedì');
  });

  it('con un generato che non comincia con un giorno che esiste le pagine nascono senza data, né nel testo né nell’anteprima', () => {
    for (const generato of ['2026-02-30', '2026-02-30T06:15:00+00:00', 'ieri', '']) {
      const radar = { ...RADAR, generato };
      for (const doc of [pagina('agenti', radar), new DOMParser().parseFromString(file(radar)['competenze/index.html'], 'text/html')]) {
        const t = testo(doc);
        expect(t, generato).not.toContain('Dati raccolti');
        expect(t, generato).toContain('La pagina mostra sempre i dati più recenti e si aggiorna ogni lunedì.');
      }
      expect(pagina('mcp', radar).querySelector('meta[property="og:image:alt"]')?.getAttribute('content'), generato)
        .toBe('Model Context Protocol (MCP) su AI Radar. Tutti i Paesi: Impara ora. Italia: Da provare.');
    }
  });

  it('un dato incerto ha l’avviso con il motivo, uno normale no', () => {
    expect(pagina('robotica').querySelector('[role="note"]')?.textContent).toBe('Dato incerto: pochi paper (45 al mese). La posizione sul radar può cambiare molto.');
    expect(pagina('agenti').querySelector('[role="note"]')).toBeNull();
  });

  /** Il testo di una sezione, cercata per il suo titolo. */
  const sezione = (doc: Document, h2: string) => {
    const s = [...doc.querySelectorAll('section')].find((x) => x.querySelector('h2')?.textContent === h2);
    expect(s, `nessuna sezione «${h2}»`).toBeDefined();
    return s!.textContent!.replace(/\s+/g, ' ');
  };

  it('la domanda ha l’unità, il Paese a metà classifica e l’Italia con i suoi annunci, e il valore di un mese fa', () => {
    const t = sezione(pagina('mcp'), 'Domanda');
    expect(t).toContain('Paese a metà classifica 3,4 annunci ogni 10mila era 3,4 un mese fa');
    expect(t).toContain('Italia 2,6 annunci ogni 10mila 32 annunci · era 2,4 un mese fa');
  });

  it('senza il dato italiano la domanda dell’Italia è la frase dell’app', () => {
    const t = sezione(pagina('mcp', senzaItalia('mcp')), 'Domanda');
    expect(t).toContain('Italia Per l’Italia il dato non è disponibile in questo momento.');
  });

  it('lo slancio ha l’unità, il valore di un mese fa e il margine, e dice quando il margine include lo zero', () => {
    expect(sezione(pagina('mcp'), 'Slancio')).toContain('+15% in 6 mesi, rispetto all’AI era −27% un mese fa · margine: da +5% a +27%');
    expect(sezione(pagina('vector-db'), 'Slancio')).toContain('margine: da −5% a +16%, include lo zero');
  });

  it('fonti e licenze sono quelle della card Competenze, e il metodo è quello della card, per intero', () => {
    const doc = pagina('agenti');
    const t = sezione(doc, 'Fonti e metodo');
    expect(t).toContain("Fonti: arXiv (metadati CC0), GitHub (termini d'uso di GitHub), The Adzuna API (termini d'uso di Adzuna).");
    expect(doc.querySelector('main a[href="https://www.adzuna.co.uk"]')).not.toBeNull();
    for (const paragrafo of METODO_COMPETENZE) expect(t).toContain(paragrafo);
  });

  it('due link aprono la competenza nell’app: con tutti i Paesi e già sul mercato Italia', () => {
    const link = [...pagina('vector-db').querySelectorAll('main a')].map((a) => a.getAttribute('href'));
    expect(link).toContain('../../#competenze/vector-db');
    expect(link).toContain('../../#competenze/vector-db?mercato=italia');
  });

  it('una competenza fuori dal radar ha comunque la sua pagina: nome, descrizione, fonti e app, e una frase al posto delle misure', () => {
    const doc = pagina('rag', conCompetenza('rag', { slancio: null, slancio_margine: null, quadrante: null, quadrante_calcolato: null, quadrante_it: null, quadrante_calcolato_it: null }));
    const t = testo(doc);
    expect(doc.querySelector('h1')?.textContent).toBe('RAG e ricerca semantica');
    expect(t).toContain('Recupero di informazioni.');
    expect(t).toContain('I dati di questa competenza non sono disponibili questa settimana.');
    expect(t).not.toContain('Tutti i Paesi:');
    expect([...doc.querySelectorAll('h2')].map((h) => h.textContent)).toEqual(['Il percorso sul radar', 'Per iniziare', 'Cosa si muove adesso', 'Fonti e metodo', 'Nell’app']);
  });

  const descrizione = (doc: Document) => doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';

  it('la descrizione dice lo stato nei due mercati e la domanda con l’unità, poi la competenza; og:description è uguale', () => {
    const doc = pagina('robotica');
    expect(descrizione(doc)).toBe('Da provare con tutti i Paesi, Da provare in Italia. Domanda: 0,2 annunci ogni 10mila nel Paese a metà classifica, 0,3 in Italia. Robot.');
    expect(doc.querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe(descrizione(doc));
  });

  it('senza il dato italiano la descrizione lo dice, e senza dati dice solo questo prima della competenza', () => {
    expect(descrizione(pagina('robotica', senzaItalia('robotica'))))
      .toBe('Da provare con tutti i Paesi. Per l’Italia il dato non è disponibile in questo momento. Domanda: 0,2 annunci ogni 10mila nel Paese a metà classifica. Robot.');
    expect(descrizione(pagina('rag', conCompetenza('rag', { slancio: null, quadrante: null }))))
      .toBe('I dati di questa competenza non sono disponibili questa settimana. Recupero di informazioni.');
  });

  it('una descrizione lunga si accorcia sulla competenza, a parola intera, e resta entro 160 caratteri', () => {
    const lunga = 'Sistemi che pianificano e usano strumenti per completare compiti in più passi, con memoria, controllo degli errori e richieste di conferma a chi li usa.';
    const d = descrizione(pagina('agenti', conCompetenza('agenti', { descrizione: lunga })));
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d).toMatch(/^Impara ora con tutti i Paesi, Impara ora in Italia\. Domanda: 26 annunci ogni 10mila nel Paese a metà classifica, 37 in Italia\. Sistemi che \S.*\S…$/);
    expect(lunga.startsWith(d.slice(d.lastIndexOf('Italia. ') + 'Italia. '.length, -1))).toBe(true);
  });

  it('una parola sola più lunga dello spazio rimasto si taglia lo stesso: la descrizione resta entro 160 caratteri', () => {
    const d = descrizione(pagina('agenti', conCompetenza('agenti', { descrizione: 'x'.repeat(200) })));
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d).toMatch(/Italia\. x+…$/);
  });

  /** Le righe di una tabella come testo, cella per cella: intestazione compresa. */
  const righe = (doc: Document) => [...doc.querySelectorAll('main table tr')].map((tr) => [...tr.querySelectorAll('th, td')].map((c) => c.textContent?.trim()));

  it('il percorso sul radar è una tabella con il quadrante di ogni mese con tutti i Paesi e in Italia', () => {
    const doc = pagina('mcp');
    expect(sezione(doc, 'Il percorso sul radar')).toContain('Il quadrante di ogni mese. Cambia solo dopo due mesi di fila nel quadrante nuovo.');
    expect(righe(doc)).toEqual([
      ['Mese', 'Tutti i Paesi', 'Italia'],
      ['lug 2026', 'Da consolidare', "Tieni d'occhio"],
      ['ago 2026', 'Da consolidare', "Tieni d'occhio"],
      ['set 2026', 'Impara ora', 'Da provare'],
    ]);
  });

  it('dove manca il quadrante italiano la cella lo dice, e senza nessun mese italiano c’è la frase dell’app', () => {
    const storico = RADAR.storico!.map((p) => ({ ...p, competenze: { ...p.competenze, mcp: { ...p.competenze.mcp, pubblicato_it: null } } }));
    const doc = pagina('mcp', { ...RADAR, storico } as Radar);
    expect(righe(doc).slice(1).map((r) => r[2])).toEqual(['—', '—', '—']);
    expect(sezione(doc, 'Il percorso sul radar')).toContain('Per l’Italia il dato non è disponibile in questo momento.');
  });

  it('senza storico il percorso dice che arriva con i prossimi aggiornamenti', () => {
    const doc = pagina('mcp', { ...RADAR, storico: [] });
    expect(doc.querySelector('main table')).toBeNull();
    expect(sezione(doc, 'Il percorso sul radar')).toContain('Lo storico arriva con i prossimi aggiornamenti.');
  });

  it('«Conta per» elenca i ruoli della competenza nell’ordine di radar.json, e manca quando non ce ne sono', () => {
    expect(testo(pagina('rag'))).toContain('Conta per: Sviluppo software, Prodotto, Dati e analisi');
    expect(testo(pagina('robotica'))).not.toContain('Conta per');
    expect(testo(pagina('rag', conCompetenza('rag', { slancio: null, quadrante: null })))).toContain('Conta per: Sviluppo software, Prodotto, Dati e analisi');
  });

  it('«Per iniziare» e «Cosa si muove adesso» mostrano le voci dell’app, con tipo, lingua, stelle e data', () => {
    const doc = pagina('mcp');
    const iniziare = sezione(doc, 'Per iniziare');
    expect(iniziare).toContain('Scelte a mano, gratuite.');
    expect(iniziare).toContain('Documentazione ufficiale di MCP: introduzione documentazione · in inglese');
    expect(iniziare).toMatch(/Corso in italiano di prova corso(?! · in inglese)/);
    expect(doc.querySelector('main a[href="https://modelcontextprotocol.io/docs/getting-started/intro"]')?.textContent).toBe('Documentazione ufficiale di MCP: introduzione');
    const muove = sezione(doc, 'Cosa si muove adesso');
    expect(muove).toContain('I repository con il suo topic creati negli ultimi 90 giorni, i più stellati.');
    expect(muove).toContain('acme/mcp-kit 1.200 stelle · creato il 2 ago 2026 Kit per server MCP.');
    expect(doc.querySelector('main a[href="https://github.com/acme/mcp-kit"]')?.textContent).toBe('acme/mcp-kit');
  });

  it('senza voci le due sezioni restano, con le frasi dell’app', () => {
    const doc = pagina('rag');
    expect(sezione(doc, 'Per iniziare')).toContain('Nessuna risorsa disponibile.');
    expect(sezione(doc, 'Cosa si muove adesso')).toContain('Nessun repository nuovo con questo topic negli ultimi 90 giorni.');
  });

  it('i testi esterni restano testo, e un indirizzo che non è http o https non diventa un link', () => {
    const strano = '<img src=x onerror="alert(1)"> & \'virgolette\'';
    const doc = pagina('mcp', conCompetenza('mcp', {
      in_crescita: [{ nome: `<b>acme</b>/kit & "co"`, url: 'javascript:alert(1)', descrizione: strano, stelle: 3, creato: '2026-10-01' }],
      per_iniziare: [{ titolo: strano, url: 'javascript:alert(2)', tipo: 'guida', lingua: 'it' }],
    }));
    expect(doc.querySelector('main img, main b')).toBeNull();
    expect([...doc.querySelectorAll('main a')].map((a) => a.getAttribute('href'))).not.toContainEqual(expect.stringMatching(/^javascript:/));
    expect(sezione(doc, 'Cosa si muove adesso')).toContain(`<b>acme</b>/kit & "co"`);
    expect(sezione(doc, 'Cosa si muove adesso')).toContain(strano);
    expect(sezione(doc, 'Per iniziare')).toContain(strano);
  });

  it('una competenza senza dati mostra comunque le risorse', () => {
    expect(sezione(pagina('mcp', conCompetenza('mcp', { slancio: null, quadrante: null })), 'Per iniziare')).toContain('Documentazione ufficiale di MCP: introduzione');
  });

  it('il titolo dice la competenza, gli annunci di lavoro e l’Italia, e finisce con AI Radar', () => {
    const doc = pagina('mcp');
    expect(doc.title).toBe('Model Context Protocol (MCP) negli annunci di lavoro, in Italia e all’estero · AI Radar');
    expect(doc.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(doc.title);
    expect(doc.querySelector('h1')?.textContent).toBe('Model Context Protocol (MCP)');
  });
});

describe('l’indice delle competenze', () => {
  const indice = (radar: Radar = RADAR) => {
    const html = file(radar)['competenze/index.html'];
    expect(html, 'nessun indice').toBeDefined();
    return new DOMParser().parseFromString(html, 'text/html');
  };

  it('nasce con le pagine delle competenze, e senza radar.json non c’è', () => {
    expect(file(RADAR)).toHaveProperty(['competenze/index.html']);
    expect(file(undefined)).not.toHaveProperty(['competenze/index.html']);
  });

  /** Ogni gruppo dell'indice: il titolo, e per ogni voce il link e il testo. */
  const gruppi = (doc: Document) => [...doc.querySelectorAll('main section')].map((s) => ({
    titolo: s.querySelector('h2')?.textContent,
    voci: [...s.querySelectorAll('li')].map((li) => ({ href: li.querySelector('a')?.getAttribute('href'), testo: li.textContent?.replace(/\s+/g, ' ').trim() })),
  }));
  const conCompetenza = (id: string, cambi: Partial<Radar['competenze'][number]>): Radar => ({
    ...RADAR, competenze: RADAR.competenze.map((c) => (c.id === id ? { ...c, ...cambi } : c)),
  });

  it('le competenze stanno in gruppi per quadrante con tutti i Paesi, nell’ordine del radar, con il quadrante in Italia accanto', () => {
    expect(gruppi(indice())).toEqual([
      { titolo: 'Impara ora', voci: [
        { href: 'agenti/', testo: 'Agenti AI Italia: Impara ora' },
        { href: 'mcp/', testo: 'Model Context Protocol (MCP) Italia: Da provare' },
      ] },
      { titolo: 'Da provare', voci: [{ href: 'robotica/', testo: 'AI fisica e robotica Italia: Da provare' }] },
      { titolo: 'Da consolidare', voci: [{ href: 'rag/', testo: 'RAG e ricerca semantica Italia: Da consolidare' }] },
      { titolo: "Tieni d'occhio", voci: [{ href: 'vector-db/', testo: "Database vettoriali Italia: Tieni d'occhio" }] },
    ]);
  });

  it('senza il dato italiano la voce dice la frase dell’app; senza dati la competenza sta in fondo, sotto «Dati non disponibili»', () => {
    const radar = conCompetenza('mcp', { domanda_it: null, annunci_it: null, quadrante_it: null, quadrante_calcolato_it: null });
    expect(gruppi(indice(radar))[0].voci[1].testo).toBe('Model Context Protocol (MCP) Per l’Italia il dato non è disponibile in questo momento.');
    const g = gruppi(indice(conCompetenza('rag', { slancio: null, quadrante: null })));
    expect(g.map((x) => x.titolo)).toEqual(['Impara ora', 'Da provare', "Tieni d'occhio", 'Dati non disponibili']);
    expect(g.at(-1)?.voci).toEqual([{ href: 'rag/', testo: 'RAG e ricerca semantica' }]);
  });

  it('titolo, descrizione e indirizzi seguono l’indirizzo base; l’anteprima è quella della home, con il suo testo alternativo', () => {
    const doc = indice();
    const meta = (p: string) => doc.querySelector(`meta[property="${p}"]`)?.getAttribute('content');
    expect(doc.title).toBe('Le competenze sull’AI negli annunci di lavoro, in Italia e all’estero · AI Radar');
    expect(doc.querySelector('h1')?.textContent).toBe('Competenze');
    expect(doc.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('Le 5 competenze sull’AI che il radar segue, con tutti i Paesi e in Italia: ricerca, open source e annunci di lavoro. Si aggiorna ogni lunedì.');
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${BASE}competenze/`);
    expect(meta('og:type')).toBe('website');
    expect(meta('og:image')).toBe(`${BASE}anteprima.png`);
    expect(meta('og:image:alt')).toBe("Il marchio di AI Radar con la frase: cosa succede nell'AI ogni settimana, su cosa formarti e come si muove l'AI in Italia.");
    expect(doc.querySelector('main')?.textContent).toContain('Dati raccolti il 15 ott 2026.');
  });
});
