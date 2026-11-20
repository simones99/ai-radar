// Pagine e archivio escono dallo stesso comando di build del sito: gli end-to-end la rilanciano, e il workflow pubblica quella cartella.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Dataset } from '../data/types';
import { FIXTURE } from '../test/fixtures';
import { scriviFilePubblici } from '../statico/cartella';
import { creaEdizione, type Edizione } from '.';

const d = FIXTURE as Dataset;
const ALTRO_INDIRIZZO = 'https://altro-utente.github.io/altro-radar/';
/** Non serve un'immagine vera: la build non la guarda. */
const PNG = (settimana: string) => `il png del ${settimana}`;

describe('il sito costruito', () => {
  let cartella: string;
  const conEdizioni = () => join(cartella, 'con');
  const senzaEdizioni = () => join(cartella, 'senza');
  const pagina = (...parti: string[]) => new DOMParser().parseFromString(readFileSync(join(conEdizioni(), ...parti), 'utf-8'), 'text/html');

  // senza l'ID di Umami, anche quando il workflow lo dà a tutto il job: chi lo vuole lo passa
  const build = (uscita: string, dati: string, ambiente: Record<string, string> = {}) =>
    execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', uscita, '--emptyOutDir', '--logLevel', 'error'], {
      // senza un browser a disposizione: la build le immagini le copia soltanto
      env: { ...process.env, NODE_ENV: 'production', AI_RADAR_BASE_URL: ALTRO_INDIRIZZO, AI_RADAR_DATA_DIR: dati, PLAYWRIGHT_BROWSERS_PATH: join(cartella, 'nessun-browser'), AI_RADAR_UMAMI_ID: '', ...ambiente },
      stdio: 'pipe',
    });

  beforeAll(() => {
    cartella = mkdtempSync(join(tmpdir(), 'ai-radar-build-'));
    const dati = join(cartella, 'dati');
    const vuota = join(cartella, 'vuota');
    mkdirSync(join(dati, 'edizioni'), { recursive: true });
    mkdirSync(vuota);
    const prima = creaEdizione(d, null) as Edizione;
    const seconda = creaEdizione({ ...d, status: { ...d.status!, aggiornato: '2026-10-22T08:00:00+00:00' } }, prima) as Edizione;
    for (const e of [prima, seconda]) {
      writeFileSync(join(dati, 'edizioni', `${e.settimana}.json`), JSON.stringify(e));
      writeFileSync(join(dati, 'edizioni', `${e.settimana}.png`), PNG(e.settimana));
    }
    writeFileSync(join(dati, 'edizioni', 'LEGGIMI.txt'), 'non è un’edizione');
    // le pagine delle competenze nascono da radar.json, con le edizioni e senza
    for (const cartellaDati of [dati, vuota]) writeFileSync(join(cartellaDati, 'radar.json'), JSON.stringify(d.radar));
    build(conEdizioni(), dati);
    build(senzaEdizioni(), vuota);
  }, 300_000);
  afterAll(() => rmSync(cartella, { recursive: true, force: true }));

  it('con le edizioni salvate ci sono le loro pagine e l’archivio', () => {
    expect(readdirSync(join(conEdizioni(), 'edizioni')).sort()).toEqual(['2026-10-12', '2026-10-19', 'index.html']);
    expect(pagina('edizioni', '2026-10-12', 'index.html').title).toBe('AI Radar, settimana del 12 ott 2026');
    expect(pagina('edizioni', 'index.html').querySelectorAll('main li')).toHaveLength(2);
  });

  it('gli indirizzi assoluti seguono l’indirizzo base', () => {
    expect(pagina('edizioni', '2026-10-19', 'index.html').querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${ALTRO_INDIRIZZO}edizioni/2026-10-19/`);
  });

  it('l’immagine di ogni edizione è copiata così com’è accanto alla sua pagina, e il tag porta lì', () => {
    for (const settimana of ['2026-10-12', '2026-10-19']) {
      expect(readdirSync(join(conEdizioni(), 'edizioni', settimana)).sort()).toEqual(['anteprima.png', 'index.html']);
      expect(readFileSync(join(conEdizioni(), 'edizioni', settimana, 'anteprima.png'), 'utf-8')).toBe(PNG(settimana));
      expect(pagina('edizioni', settimana, 'index.html').querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(`${ALTRO_INDIRIZZO}edizioni/${settimana}/anteprima.png`);
    }
  });

  it('l’archivio usa l’immagine fissa della home, con lo stesso testo alternativo, e quell’immagine è nel sito', () => {
    const home = new DOMParser().parseFromString(readFileSync(join(conEdizioni(), 'index.html'), 'utf-8'), 'text/html');
    const archivio = pagina('edizioni', 'index.html');
    for (const tag of ['og:image', 'og:image:alt', 'og:locale', 'og:site_name']) {
      const selettore = `meta[property="${tag}"]`;
      expect(archivio.querySelector(selettore)?.getAttribute('content')).toBe(home.querySelector(selettore)?.getAttribute('content'));
    }
    expect(existsSync(join(conEdizioni(), 'anteprima.png'))).toBe(true);
  });

  it('un’edizione salvata senza la sua immagine ferma la build con un messaggio chiaro, invece di pubblicare un’anteprima rotta', () => {
    const dati = join(cartella, 'senza-immagine');
    mkdirSync(join(dati, 'edizioni'), { recursive: true });
    writeFileSync(join(dati, 'edizioni', '2026-10-12.json'), JSON.stringify(creaEdizione(FIXTURE as Dataset, null)));
    const scrivi = () => scriviFilePubblici({ dati, uscita: join(dati, 'uscita'), indirizzoBase: ALTRO_INDIRIZZO, htmlHome: '<link rel="stylesheet" href="./assets/a.css">' });
    expect(scrivi).toThrow(/2026-10-12.*senza la sua immagine.*--immagine 2026-10-12/);
  });

  it('home, archivio e pagine hanno la stessa icona, e nella home non resta un segnaposto', () => {
    const icona = (doc: Document) => doc.querySelector('link[rel="icon"]')?.getAttribute('href');
    const home = new DOMParser().parseFromString(readFileSync(join(conEdizioni(), 'index.html'), 'utf-8'), 'text/html');
    expect(icona(home)).toMatch(/^data:image\/svg\+xml,/);
    expect(icona(pagina('edizioni', 'index.html'))).toBe(icona(home));
    expect(icona(pagina('edizioni', '2026-10-12', 'index.html'))).toBe(icona(home));
  });

  it('il foglio di stile delle pagine è quello della home, e contiene i token', () => {
    const home = new DOMParser().parseFromString(readFileSync(join(conEdizioni(), 'index.html'), 'utf-8'), 'text/html');
    const dallaHome = home.querySelector('link[rel="stylesheet"]')?.getAttribute('href') as string;
    expect(pagina('edizioni', '2026-10-12', 'index.html').querySelector('link[rel="stylesheet"]')?.getAttribute('href')).toBe(`../../${dallaHome.replace(/^\.\//, '')}`);
    expect(pagina('edizioni', 'index.html').querySelector('link[rel="stylesheet"]')?.getAttribute('href')).toBe(`../${dallaHome.replace(/^\.\//, '')}`);
    const css = readFileSync(join(conEdizioni(), dallaHome), 'utf-8');
    expect(css).toContain('--accent');
    expect(css).toContain('Bricolage Grotesque Variable');
  });

  it('senza edizioni pagine e archivio non esistono', () => {
    expect(existsSync(join(senzaEdizioni(), 'edizioni'))).toBe(false);
  });

  it('con le edizioni la home guadagna il link al feed per i lettori, leggibile senza JavaScript, e nel testo in chiaro il link all’archivio nella testata e quello al feed in fondo: sono le sue sole differenze', () => {
    const con = readFileSync(join(conEdizioni(), 'index.html'), 'utf-8');
    const link = new DOMParser().parseFromString(con, 'text/html').head.querySelector('link[rel="alternate"][type="application/rss+xml"]');
    expect(link?.getAttribute('href')).toBe(`${ALTRO_INDIRIZZO}feed.xml`);
    // i dati di questa build non hanno lo stato del giro: la home in chiaro non ha la settimana, che porterebbe all'edizione.
    // Tolti quei tre link, le due home hanno la stessa testa, lo stesso testo e gli stessi link
    const leggi = (html: string, togli: string[] = []) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      for (const selettore of togli) doc.querySelectorAll(selettore).forEach((e) => e.remove());
      const spazi = (s: string) => s.replace(/\s+/g, ' ').trim();
      return { testa: spazi(doc.head.outerHTML), testo: spazi(doc.body.textContent ?? ''), link: [...doc.body.querySelectorAll('a')].map((a) => [spazi(a.textContent ?? ''), a.getAttribute('href')]) };
    };
    const senza = readFileSync(join(senzaEdizioni(), 'index.html'), 'utf-8');
    expect(leggi(con, ['link[rel="alternate"]', 'a[href="edizioni/"]', 'a[href="feed.xml"]'])).toEqual(leggi(senza));
    expect(leggi(con).link).toEqual(expect.arrayContaining([['Edizioni', 'edizioni/'], ['Segui con RSS', 'feed.xml']]));
  });

  it('senza edizioni la home non ha il link al feed', () => {
    expect(readFileSync(join(senzaEdizioni(), 'index.html'), 'utf-8')).not.toContain('rel="alternate"');
  });

  it('i dati caricati dall’app non cambiano: nessun JSON di edizione tra i file serviti', () => {
    expect(existsSync(join(conEdizioni(), 'data', 'edizioni'))).toBe(false);
    // data/ nasce con l'indice se la build non ha altri dati da copiare, come qui in una copia pulita del repo
    expect(new Set(readdirSync(conEdizioni()))).toEqual(new Set([...readdirSync(senzaEdizioni()), 'data', 'edizioni', 'feed.xml']));
    const datiSenza = existsSync(join(senzaEdizioni(), 'data')) ? readdirSync(join(senzaEdizioni(), 'data')) : [];
    expect(readdirSync(join(conEdizioni(), 'data')).sort()).toEqual([...datiSenza, 'edizioni.json'].sort());
  });

  it('il feed sta nella radice del sito con le voci delle edizioni salvate, e i suoi indirizzi seguono l’indirizzo base', () => {
    const feed = new DOMParser().parseFromString(readFileSync(join(conEdizioni(), 'feed.xml'), 'utf-8'), 'application/xml');
    expect(feed.querySelector('parsererror')).toBeNull();
    expect(feed.querySelectorAll('item')).toHaveLength(2);
    expect(feed.getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'link')[0].getAttribute('href')).toBe(`${ALTRO_INDIRIZZO}feed.xml`);
  });

  it('senza edizioni il feed non esiste', () => {
    expect(existsSync(join(senzaEdizioni(), 'feed.xml'))).toBe(false);
  });

  it('con radar.json ci sono l’indice e una pagina per competenza, anche senza edizioni, con accanto la copia dell’immagine della home finché il workflow non fa la sua', () => {
    const competenze = d.radar!.competenze.map((c) => c.id);
    for (const sito of [conEdizioni(), senzaEdizioni()]) {
      expect(readdirSync(join(sito, 'competenze')).sort()).toEqual([...competenze, 'index.html'].sort());
      const home = readFileSync(join(sito, 'anteprima.png'));
      for (const id of competenze) {
        expect(readdirSync(join(sito, 'competenze', id)).sort()).toEqual(['anteprima.png', 'index.html']);
        expect(readFileSync(join(sito, 'competenze', id, 'anteprima.png')).equals(home)).toBe(true);
      }
    }
    expect(pagina('competenze', 'mcp', 'index.html').querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(`${ALTRO_INDIRIZZO}competenze/mcp/anteprima.png`);
  });

  it('senza radar.json non nasce nessuna pagina delle competenze, e la scrittura del sito riesce', () => {
    const uscita = join(cartella, 'senza-radar');
    mkdirSync(uscita, { recursive: true });
    writeFileSync(join(uscita, 'anteprima.png'), 'png della home');
    scriviFilePubblici({ dati: join(cartella, 'nessun-dato'), uscita, indirizzoBase: ALTRO_INDIRIZZO, htmlHome: '<link rel="stylesheet" href="./assets/a.css">' });
    expect(existsSync(join(uscita, 'competenze'))).toBe(false);
  });

  describe('un file di dati rotto', () => {
    const HOME = '<link rel="stylesheet" href="./assets/a.css"><div id="app"></div>';
    /** Una cartella con tutti i dati delle prove, e i file dati scritti così come sono. */
    const conDati = (nome: string, rotti: Record<string, string>) => {
      const dati = join(cartella, nome);
      const uscita = join(dati, 'uscita');
      mkdirSync(uscita, { recursive: true });
      writeFileSync(join(uscita, 'anteprima.png'), 'png della home');
      for (const [k, v] of Object.entries(FIXTURE)) writeFileSync(join(dati, `${k}.json`), JSON.stringify(v));
      for (const [k, v] of Object.entries(rotti)) writeFileSync(join(dati, `${k}.json`), v);
      return { scrivi: () => scriviFilePubblici({ dati, uscita, indirizzoBase: ALTRO_INDIRIZZO, htmlHome: HOME }), home: () => readFileSync(join(uscita, 'index.html'), 'utf-8') };
    };
    const testo = (html: string) => (new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '').replace(/\s+/g, ' ');

    it('illeggibile o con null vale come fonte assente, come nell’app: la build riesce e la home in chiaro dice che mancano i suoi dati', () => {
      const { scrivi, home } = conDati('fonti-rotte', { epoch: '{ rotto', news: 'null' });
      expect(scrivi).not.toThrow();
      expect(testo(home())).toContain('Dati non disponibili: Modelli e ricerca, Notizie.');
      // le pagine che non dipendono da quei file nascono come sempre
      expect(existsSync(join(cartella, 'fonti-rotte', 'uscita', 'competenze', 'mcp', 'index.html'))).toBe(true);
    });

    it('radar.json illeggibile ferma la build: le pagine delle competenze sparirebbero dal sito', () => {
      expect(conDati('radar-rotto', { radar: '{ rotto' }).scrivi).toThrow();
    });
  });

  describe('il contatore delle visite', () => {
    const ID = 'bb5f6910-f64e-4045-879e-df65209b7ad5';
    const conUmami = () => join(cartella, 'con-umami');
    const fileFissi = () => join(cartella, 'dati', 'edizioni');
    /** Le pagine HTML di un sito costruito, per percorso. */
    const pagine = (sito: string) =>
      readdirSync(sito, { recursive: true, encoding: 'utf-8' }).filter((p) => p.endsWith('.html')).map((p) => [p, new DOMParser().parseFromString(readFileSync(join(sito, p), 'utf-8'), 'text/html')] as const);
    const scriptDiUmami = (doc: Document) => [...doc.querySelectorAll('script[src*="umami"]')];
    let fissiPrima: Record<string, string>;

    beforeAll(() => {
      fissiPrima = Object.fromEntries(readdirSync(fileFissi()).map((f) => [f, readFileSync(join(fileFissi(), f), 'utf-8')]));
      build(conUmami(), join(cartella, 'dati'), { AI_RADAR_UMAMI_ID: ID });
    }, 300_000);

    it('con l’ID in AI_RADAR_UMAMI_ID ogni pagina, home compresa, ha nel <head> lo script di Umami, che conta solo sull’host dell’indirizzo base', () => {
      const tutte = pagine(conUmami());
      expect(tutte.map(([p]) => p.replaceAll('\\', '/'))).toEqual(expect.arrayContaining(['index.html', 'edizioni/index.html', 'edizioni/2026-10-12/index.html', 'competenze/index.html', 'competenze/mcp/index.html']));
      for (const [percorso, doc] of tutte) {
        const script = scriptDiUmami(doc);
        expect(script, percorso).toHaveLength(1);
        expect(script[0].parentElement, percorso).toBe(doc.head);
        expect(script[0].getAttribute('data-website-id'), percorso).toBe(ID);
        expect(script[0].getAttribute('data-domains'), percorso).toBe('altro-utente.github.io');
      }
    });

    it('senza l’ID nessuna pagina ha lo script', () => {
      for (const sito of [conEdizioni(), senzaEdizioni()]) {
        const tutte = pagine(sito);
        expect(tutte.length).toBeGreaterThan(0);
        for (const [percorso, doc] of tutte) expect(scriptDiUmami(doc), percorso).toEqual([]);
      }
    });

    it('i file fissi delle edizioni non cambiano, e nemmeno l’indice che legge la home', () => {
      expect(Object.fromEntries(readdirSync(fileFissi()).map((f) => [f, readFileSync(join(fileFissi(), f), 'utf-8')]))).toEqual(fissiPrima);
      expect(readFileSync(join(conUmami(), 'data', 'edizioni.json'), 'utf-8')).toBe(readFileSync(join(conEdizioni(), 'data', 'edizioni.json'), 'utf-8'));
    });

    it('un ID che non è un UUID ferma la build, con un messaggio che nomina la variabile da correggere', () => {
      expect(() => build(join(cartella, 'id-rotto'), join(cartella, 'vuota'), { AI_RADAR_UMAMI_ID: 'il-mio-sito' })).toThrow(/AI_RADAR_UMAMI_ID/);
    });
  });

  it('l’indice per la home sta con gli altri dati dell’app e dice l’ultima edizione; senza edizioni non esiste', () => {
    expect(JSON.parse(readFileSync(join(conEdizioni(), 'data', 'edizioni.json'), 'utf-8'))).toEqual({ ultima: '2026-10-19' });
    expect(existsSync(join(senzaEdizioni(), 'data', 'edizioni.json'))).toBe(false);
  });
});
