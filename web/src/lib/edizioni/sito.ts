// I file del sito che nascono dalle edizioni, come mappa da percorso a contenuto: chi costruisce il sito li scrive così come sono.
// Ogni pagina è HTML statico, senza JavaScript, sul foglio di stile della home: token, font e testata hanno una sola fonte.
import { toHash, type TileId } from '../router';
import { day, dayWith } from '../text/format';
import { VERSIONE, type CardFissa, type Destinazione, type Edizione, type Fonte, type PortaFissa } from './tipi';

export interface OpzioniSito {
  /** L'indirizzo pubblico del sito, con la barra finale: da qui nascono gli indirizzi assoluti. */
  indirizzoBase: string;
  /** Il foglio di stile della home, relativo alla radice del sito: il suo nome cambia a ogni build. */
  foglio: string;
}

/** Il foglio di stile che la build ha dato alla home, relativo alla radice del sito. */
export function foglioDellaHome(html: string): string {
  const link = html.match(/<link\b[^>]*\brel="stylesheet"[^>]*>/)?.[0];
  const href = link?.match(/\bhref="(?:\.\/)?([^"]+)"/)?.[1];
  if (!href) throw new Error('La home non ha un foglio di stile: le pagine delle edizioni non saprebbero quale usare.');
  return href;
}

// I titoli delle notizie arrivano da fonti esterne, e un'edizione corretta a mano può contenere di tutto: niente entra nella pagina senza passare da qui.
const esc = (s: string): string => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

/** L'indirizzo se è http o https, altrimenti null: il resto non diventa un link. */
function linkSicuro(url: string | null): string | null {
  if (!url) return null;
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol) ? url.trim() : null;
  } catch {
    return null;
  }
}
const linkEsterno = (url: string | null, testo: string): string => {
  const sicuro = linkSicuro(url);
  return sicuro ? `<a href="${esc(sicuro)}" target="_blank" rel="noopener">${esc(testo)}</a>` : esc(testo);
};

/** Il link a una card nasce dalla destinazione salvata: il router riconosce anche i vecchi id. radice: la radice del sito vista da dove sta il link. */
const hrefCard = (d: Destinazione, radice: string): string => esc(`${radice}${toHash(d.tema as TileId, d.elemento, d.params)}`);
const testoPorta = (p: PortaFissa): string => p.titolo.map((x) => x.t).join('');
const titoloPagina = (e: Edizione): string => `AI Radar, settimana ${dayWith('del', e.settimana)}`;

function rigaFonti(fonti: Fonte[]): string {
  if (!fonti.length) return '';
  const elenco = fonti.map((f) => `${linkEsterno(f.url, f.nome)} (${esc(f.licenza)})`).join(', ');
  return `<p class="ed-fonte">${fonti.length === 1 ? 'Fonte' : 'Fonti'}: ${elenco}.</p>`;
}

function porta(p: PortaFissa, radice: string): string {
  const titolo = p.titolo.map((x) => (x.em ? `<em>${esc(x.t)}</em>` : esc(x.t))).join('');
  const notizia = p.titolo.length && p.destinazione ? `<p class="ed-notizia"><a href="${hrefCard(p.destinazione, radice)}">${titolo}</a></p>` : '';
  const conDati = p.titolo.length > 0;
  return `<article class="ed-porta">
<h2>${esc(p.nome)} <span>${esc(p.etichetta)}</span></h2>
${notizia}
${conDati && !p.cambiata ? '<p class="ed-ripetuta">Nessun cambio qui dalla settimana scorsa</p>' : ''}
${p.nota ? `<p class="ed-nota">${esc(p.nota)}</p>` : ''}
<p class="ed-fonte">${esc(p.meta)}</p>
${rigaFonti(p.fonti)}
</article>`;
}

function rigaCard(c: CardFissa, radice: string): string {
  const unita = c.unita ? `${c.unita === '%' ? '' : ' '}${esc(c.unita)}` : '';
  return `<li>
<h3><a href="${hrefCard(c.destinazione, radice)}">${esc(c.nome)}</a></h3>
<p><strong class="ed-cifra">${esc(c.cifra ?? '')}${unita}</strong> ${esc(c.frase ?? '')}</p>
${rigaFonti(c.fonti)}
</li>`;
}

function frasi(e: Edizione, radice: string): string {
  const card = e.card.filter((c) => c.id !== 'notizie'); // il conteggio delle notizie apre la loro sezione
  const conDati = card.filter((c) => c.frase != null);
  const righe = conDati.filter((c) => c.cambiata);
  const invariate = conDati.filter((c) => !c.cambiata);
  const senzaDati = card.filter((c) => c.frase == null);
  const elenco = (xs: CardFissa[]) => xs.map((c) => `<a href="${hrefCard(c.destinazione, radice)}">${esc(c.nome)}</a>`).join(', ');
  return `<section>
<h2>${e.precedente ? 'Cambiato dalla settimana scorsa' : 'La situazione'}</h2>
${righe.length ? `<ul class="ed-righe">\n${righe.map((c) => rigaCard(c, radice)).join('\n')}\n</ul>` : '<p>Nessuna frase è cambiata dalla settimana scorsa.</p>'}
${invariate.length ? `<p class="ed-nota">Invariate: ${elenco(invariate)}.</p>` : ''}
${senzaDati.length ? `<p class="ed-nota">Dati non disponibili: ${elenco(senzaDati)}.</p>` : ''}
</section>`;
}

function notizie(e: Edizione, radice: string): string {
  const n = e.notizie;
  const frase = e.card.find((c) => c.id === 'notizie')?.frase;
  const conteggio = !frase ? 'Dati non disponibili.'
    : !n.numero ? frase
    : `${n.numero} ${n.numero === 1 ? 'notizia' : 'notizie'} ${n.periodo}, da ${n.fonti} ${n.fonti === 1 ? 'fonte' : 'fonti'}.`;
  const temi = n.temi.map((t) => `<h3>${esc(t.nome)}</h3>
<ul class="ed-voci">
${t.voci.map((v) => `<li>${linkEsterno(v.link, v.titolo)} <span class="ed-fonte">${esc(v.fonte)} · ${esc(day(v.data))}</span></li>`).join('\n')}
</ul>`).join('\n');
  return `<section>
<h2>Notizie</h2>
<p>${esc(conteggio)}</p>
${n.temi.length ? `<p class="ed-nota">${esc(n.regola)} Di ogni notizia ci sono solo titolo, data e link all'articolo originale, nella sua lingua.</p>\n${temi}` : ''}
<p><a href="${esc(`${radice}${toHash('notizie')}`)}">Le altre notizie, nella card Notizie</a></p>
</section>`;
}

function fontiMute(e: Edizione): string {
  if (!e.fonti_mute.length) return '<p class="ed-nota">Tutte le fonti hanno risposto a questo giro.</p>';
  const righe = e.fonti_mute.map((f) => `<li>${esc(f.nome)}${f.ultimo_successo ? `: ultimo dato ${esc(dayWith('del', f.ultimo_successo))}` : ''}</li>`).join('\n');
  return `<section>
<h2>Fonti che non hanno risposto</h2>
<p class="ed-nota">Questa settimana i loro dati sono rimasti indietro.</p>
<ul class="ed-voci">
${righe}
</ul>
</section>`;
}

function controlla(e: Edizione): void {
  if (e.versione !== VERSIONE) throw new Error(`Edizione ${e.settimana}: versione ${e.versione} sconosciuta, il sito conosce la ${VERSIONE}.`);
  for (const c of e.correzioni) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(c.data)) throw new Error(`Edizione ${e.settimana}: una correzione ha una data non valida, «${c.data}»: serve AAAA-MM-GG.`);
  }
}

const ICONA = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='12' fill='none' stroke='%23121211' stroke-width='4'/%3E%3Ccircle cx='16' cy='16' r='5' fill='%230068d6'/%3E%3C/svg%3E";

/** Lo scheletro comune delle pagine. radice: la radice del sito vista dalla pagina; percorso: la pagina vista dalla radice. */
function pagina(o: { titolo: string; descrizione: string; percorso: string; radice: string; nav: string; corpo: string }, opzioni: OpzioniSito): string {
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${esc(o.titolo)}</title>
<meta name="description" content="${esc(o.descrizione)}" />
<link rel="canonical" href="${esc(`${opzioni.indirizzoBase}${o.percorso}`)}" />
<link rel="icon" href="${esc(ICONA)}" />
<link rel="stylesheet" href="${esc(`${o.radice}${opzioni.foglio}`)}" />
</head>
<body>
<a class="skip" href="#contenuto">Vai al contenuto</a>
<div class="edizione">
<header class="testata">
<a class="logo" href="${o.radice}"><i aria-hidden="true"></i>AI Radar</a>
<nav aria-label="Pagina">${o.nav}</nav>
</header>
<main id="contenuto" tabindex="-1">
${o.corpo}
</main>
<footer><p class="ed-nota">Il progetto non è affiliato a nessuna delle fonti.</p></footer>
</div>
</body>
</html>
`;
}

function paginaEdizione(e: Edizione, opzioni: OpzioniSito): string {
  const radice = '../../';
  const correzioni = e.correzioni.map((c) => `<p class="ed-corretta"><strong>Corretta ${esc(dayWith('il', c.data))}:</strong> ${esc(c.testo)}</p>`).join('\n');
  const corpo = `<div class="ed-testa">
<p class="ed-fonte">Edizione</p>
<h1>Settimana ${esc(dayWith('del', e.settimana))}</h1>
<p class="ed-nota">Questa pagina resta com'è, con i dati raccolti ${esc(dayWith('il', e.raccolti))}. Le card del sito mostrano i dati di oggi, quindi possono dire altro.</p>
${correzioni}
</div>
<div class="ed-porte">
${e.porte.map((p) => porta(p, radice)).join('\n')}
</div>
${frasi(e, radice)}
${notizie(e, radice)}
${fontiMute(e)}`;
  return pagina({
    titolo: titoloPagina(e),
    descrizione: e.porte.filter((p) => p.titolo.length).map((p) => `${testoPorta(p)}.`).join(' '),
    percorso: `edizioni/${e.settimana}/`,
    radice,
    nav: `<a href="../">Edizioni</a><a href="${radice}">Dati di oggi</a>`,
    corpo,
  }, opzioni);
}

function archivio(edizioni: Edizione[], opzioni: OpzioniSito): string {
  const voci = edizioni.map((e) => `<li>
<h2><a href="${esc(e.settimana)}/">Settimana ${esc(dayWith('del', e.settimana))}</a></h2>
${e.porte.map((p) => `<p><strong>${esc(p.nome)}:</strong> ${esc(p.titolo.length ? testoPorta(p) : p.meta)}</p>`).join('\n')}
</li>`).join('\n');
  return pagina({
    titolo: 'AI Radar, le edizioni',
    descrizione: 'Tutte le edizioni di AI Radar, dalla più recente: il riassunto fisso di ogni settimana, con le due porte, le frasi cambiate e le notizie.',
    percorso: 'edizioni/',
    radice: '../',
    nav: '<a href="../">Dati di oggi</a>',
    corpo: `<div class="ed-testa">
<h1>Edizioni</h1>
<p class="ed-nota">Il riassunto di ogni settimana. Esce il lunedì e dopo non cambia, salvo correzioni dichiarate.</p>
</div>
<ul class="ed-archivio">
${voci}
</ul>`,
  }, opzioni);
}

/**
 * Tutti i file che nascono dalle edizioni, per percorso. Senza edizioni non ne nasce nessuno: gli indirizzi esistono dalla prima in poi.
 * Un file nuovo del sito è una voce in più in questa mappa: chi costruisce il sito li scrive tutti allo stesso modo.
 */
export function fileDelSito(edizioni: Edizione[], opzioni: OpzioniSito): Record<string, string> {
  edizioni.forEach(controlla);
  if (!edizioni.length) return {};
  const recenti = [...edizioni].sort((a, b) => b.settimana.localeCompare(a.settimana));
  return {
    'edizioni/index.html': archivio(recenti, opzioni),
    ...Object.fromEntries(recenti.map((e) => [`edizioni/${e.settimana}/index.html`, paginaEdizione(e, opzioni)])),
  };
}
