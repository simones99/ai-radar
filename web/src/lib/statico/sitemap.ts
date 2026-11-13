// La sitemap: l'indirizzo assoluto di ogni pagina del sito pensata per essere letta da fuori, perché un motore di ricerca le trovi
// senza passare dalla home, che è riempita da JavaScript. Operazione pura: nasce dalle altre voci della mappa dei file pubblici.
import { esc } from './pagina';

export const SITEMAP = 'sitemap.xml';

const PAGINA = /(^|\/)index\.html$/;

/**
 * La sitemap delle pagine tra i percorsi dati: una pagina è un percorso che finisce con index.html, così una pagina nuova entra da sola
 * e non entra una pagina che la build non scrive. La home è sempre il primo indirizzo, scritto come indirizzo base, anche quando la mappa
 * non ne ha la copia; le altre seguono in ordine di percorso, con la cartella e la barra finale, come il loro canonical.
 */
export function sitemap(percorsi: string[], indirizzoBase: string): string {
  const cartelle = percorsi.filter((p) => PAGINA.test(p)).map((p) => p.replace(PAGINA, '$1')).filter((c) => c !== '').sort();
  const loc = [indirizzoBase, ...cartelle.map((c) => `${indirizzoBase}${c}`)];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${loc.map((l) => `<url><loc>${esc(l)}</loc></url>`).join('\n')}
</urlset>
`;
}

export const ROBOTS = 'robots.txt';

/**
 * robots.txt, come voce della mappa dei file pubblici: c'è solo quando l'indirizzo base è la radice di un dominio, perché i crawler
 * lo leggono solo lì e in una sottocartella verrebbe ignorato. Vale per tutti i crawler, non esclude niente e indica la sitemap.
 */
export function robots(indirizzoBase: string): Record<string, string> {
  if (new URL(indirizzoBase).pathname !== '/') return {};
  return { [ROBOTS]: `User-agent: *\nAllow: /\n\nSitemap: ${indirizzoBase}${SITEMAP}\n` };
}
