// La sitemap: l'indirizzo assoluto di ogni pagina del sito pensata per essere letta da fuori, perché un motore di ricerca le trovi
// senza passare dalla home, che è riempita da JavaScript. Operazione pura: nasce dalle altre voci della mappa dei file pubblici.
import type { Edizione } from '../edizioni';
import { isoDay, parseDay } from '../text/format';
import { giornoDeiDati } from './competenze';
import type { ContenutoStatico } from './contenuto';
import { esc } from './pagina';

export const SITEMAP = 'sitemap.xml';

const PAGINA = /(^|\/)index\.html$/;

/** La più recente tra date AAAA-MM-GG, che in quella forma si confrontano come testo. */
const piuRecente = (date: string[]): string => date.reduce((a, b) => (b > a ? b : a));

/** Il giorno più recente tra la raccolta di un'edizione e le sue correzioni: un'edizione cambia solo con una correzione. */
const ultimoCambio = (e: Edizione): string => piuRecente([isoDay(parseDay(e.raccolti)), ...e.correzioni.map((c) => c.data)]);

/**
 * La data di ultimo cambio della pagina in una cartella, se ha una regola e i dati per seguirla. Viene sempre dai dati, mai dall'orologio:
 * ogni edizione la sua, l'archivio la più recente tra quelle delle edizioni, la home e le competenze il giorno dei dati del radar.
 */
function dateDelleCartelle({ edizioni, dataset: { radar } }: ContenutoStatico): (cartella: string) => string | null {
  const date = new Map(edizioni.map((e) => [`edizioni/${e.settimana}/`, ultimoCambio(e)]));
  if (edizioni.length) date.set('edizioni/', piuRecente([...date.values()]));
  const deiDati = radar ? giornoDeiDati(radar) : null;
  return (c) => (c === '' || c.startsWith('competenze/') ? deiDati : date.get(c) ?? null);
}

/**
 * La sitemap delle pagine tra i percorsi dati: una pagina è un percorso che finisce con index.html, così una pagina nuova entra da sola
 * e non entra una pagina che la build non scrive. La home è sempre il primo indirizzo, scritto come indirizzo base, anche quando la mappa
 * non ne ha la copia; le altre seguono in ordine di percorso, con la cartella e la barra finale, come il loro canonical.
 * Ogni indirizzo porta lastmod quando la sua pagina ha una data di ultimo cambio nei dati; senza, esce solo loc.
 */
export function sitemap(percorsi: string[], dati: ContenutoStatico, indirizzoBase: string): string {
  const cartelle = percorsi.filter((p) => PAGINA.test(p)).map((p) => p.replace(PAGINA, '$1')).filter((c) => c !== '').sort();
  const dataDi = dateDelleCartelle(dati);
  const voce = (c: string) => {
    const data = dataDi(c);
    return `<url><loc>${esc(`${indirizzoBase}${c}`)}</loc>${data ? `<lastmod>${data}</lastmod>` : ''}</url>`;
  };
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${['', ...cartelle].map(voce).join('\n')}
</urlset>
`;
}

const ROBOTS = 'robots.txt';

/**
 * robots.txt, come voce della mappa dei file pubblici: c'è solo quando l'indirizzo base è la radice di un dominio, perché i crawler
 * lo leggono solo lì e in una sottocartella verrebbe ignorato. Vale per tutti i crawler, non esclude niente e indica la sitemap.
 */
export function robots(indirizzoBase: string): Record<string, string> {
  if (new URL(indirizzoBase).pathname !== '/') return {};
  return { [ROBOTS]: `User-agent: *\nAllow: /\n\nSitemap: ${indirizzoBase}${SITEMAP}\n` };
}
