// Il feed RSS: una voce per edizione, a testo intero, con lo stesso testo della pagina.
import { corpoEdizione, descrizioneEdizione, DESCRIZIONE_ARCHIVIO, esc, titoloPagina, TITOLO_ARCHIVIO } from './pagine';
import type { Edizione } from './tipi';

const VOCI_DEL_FEED = 26; // chi si iscrive non scarica anni di storico: quello sta nell'archivio

/** Il testo intero sta in content:encoded, dove lo cercano i lettori di feed; description resta il riassunto con le due porte. */
function voceDelFeed(e: Edizione, indirizzoBase: string): string {
  return `<item>
<title>${esc(titoloPagina(e))}</title>
<link>${esc(`${indirizzoBase}edizioni/${e.settimana}/`)}</link>
<guid isPermaLink="false">ai-radar:edizione:${esc(e.settimana)}</guid>
<pubDate>${new Date(e.raccolti).toUTCString()}</pubDate>
<description>${esc(descrizioneEdizione(e))}</description>
<content:encoded>${esc(corpoEdizione(e, indirizzoBase))}</content:encoded>
</item>`;
}

// I caratteri che XML 1.0 non ammette nemmeno come entità: uno solo, in un titolo esterno, renderebbe illeggibile tutto il feed.
const FUORI_DA_XML = /[^\t\n\r -퟿-�\u{10000}-\u{10FFFF}]/gu;

export function feed(recenti: Edizione[], indirizzoBase: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
<title>${esc(TITOLO_ARCHIVIO)}</title>
<link>${esc(`${indirizzoBase}edizioni/`)}</link>
<description>${esc(DESCRIZIONE_ARCHIVIO)}</description>
<language>it</language>
<atom:link href="${esc(`${indirizzoBase}feed.xml`)}" rel="self" type="application/rss+xml" />
${recenti.slice(0, VOCI_DEL_FEED).map((e) => voceDelFeed(e, indirizzoBase)).join('\n')}
</channel>
</rss>
`.replace(FUORI_DA_XML, '');
}
