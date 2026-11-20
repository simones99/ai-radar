// Le porte e le card come le scrivono le pagine statiche: le pagine delle edizioni e la home in chiaro. Cambia solo dove porta una destinazione.
import { esc, inLink, rigaFonti } from '../statico/pagina';
import type { CardDellaSettimana, PortaDellaSettimana } from './settimana';
import { cifraConUnita, cifraNellaFrase, portaConDati, type CardFissa, type Destinazione, type PortaFissa } from './tipi';

/**
 * Dove porta una destinazione nella pagina che la scrive: l'indirizzo, o null quando resta testo.
 * L'edizione porta alle card dell'app, la home in chiaro solo alle pagine statiche che ci sono.
 */
export type LinkDellaDestinazione = (destinazione: Destinazione | null) => string | null;

/** Una porta da scrivere: nell'edizione con il confronto con la settimana prima, nella home in chiaro senza. */
export type PortaDaScrivere = PortaDellaSettimana & Partial<Pick<PortaFissa, 'cambiata'>>;
/** Una card da scrivere: come per le porte, il confronto c'è solo nell'edizione. */
export type CardDaScrivere = CardDellaSettimana & Partial<Pick<CardFissa, 'cambiata' | 'era'>>;

/** Una porta: nome della testa, notizia, nota e riga sotto. Senza dati resta la riga che lo dice. */
export function porta(p: PortaDaScrivere, link: LinkDellaDestinazione): string {
  const titolo = p.titolo.map((x) => (x.em ? `<em>${esc(x.t)}</em>` : esc(x.t))).join('');
  return `<article class="ed-porta">
<h2>${esc(p.nome)} <span>${esc(p.etichetta)}</span></h2>
${portaConDati(p) ? `<p class="ed-notizia">${inLink(link(p.destinazione), titolo)}</p>` : ''}
${portaConDati(p) && p.cambiata === false ? '<p class="ed-ripetuta">Nessun cambio qui dalla settimana scorsa</p>' : ''}
${p.nota ? `<p class="ed-nota">${esc(p.nota)}</p>` : ''}
<p class="ed-fonte">${esc(p.meta)}</p>
${rigaFonti(p.fonti)}
</article>`;
}

/** La cifra in un paragrafo suo, grande con l'unità piccola come in home: messa nella frase, si leggeva «47 Notizie nei 7 giorni». */
export function cifraGrande(c: Pick<CardFissa, 'cifra' | 'unita'>): string {
  return c.cifra ? `<p class="ed-cifra"><strong>${esc(c.cifra)}</strong>${esc(cifraConUnita(c).slice(c.cifra.length))}</p>` : '';
}

/** Una card in una riga: nome, cifra con l'unità e frase, e nell'edizione com'era la settimana prima. */
function rigaCard(c: CardDaScrivere, link: LinkDellaDestinazione): string {
  return `<li>
<h4>${inLink(link(c.destinazione), esc(c.nome))}</h4>
${cifraNellaFrase(c) ? '' : cifraGrande(c)}
<p>${esc(c.frase ?? '')}</p>
${c.era ? `<p class="ed-nota">${esc(c.era)}</p>` : ''}
${rigaFonti(c.fonti)}
</li>`;
}

/**
 * Le righe di una testa sotto il suo nome: chi decide in un'organizzazione deve vedere dove comincia la sua parte, e trovarci anche ciò che non è cambiato.
 * Le card invariate, che ci sono solo nell'edizione, e quelle senza dati stanno in una riga che le nomina, e non spariscono.
 */
export function cardDellaTesta(p: PortaDaScrivere, card: readonly CardDaScrivere[], link: LinkDellaDestinazione): string {
  const proprie = card.filter((c) => c.testa === p.id);
  const conDati = proprie.filter((c) => c.frase != null);
  const righe = conDati.filter((c) => c.cambiata !== false);
  const invariate = conDati.filter((c) => c.cambiata === false);
  const senzaDati = proprie.filter((c) => c.frase == null);
  const elenco = (xs: CardDaScrivere[]) => xs.map((c) => inLink(link(c.destinazione), esc(c.nome))).join(', ');
  return `<div class="ed-gruppo">
<h3>${esc(p.nome)} <span>${esc(p.etichetta)}</span></h3>
${righe.length ? `<ul class="ed-righe">\n${righe.map((c) => rigaCard(c, link)).join('\n')}\n</ul>` : ''}
${invariate.length ? `<p class="ed-nota">Invariate: ${elenco(invariate)}.</p>` : ''}
${senzaDati.length ? `<p class="ed-nota">Dati non disponibili: ${elenco(senzaDati)}.</p>` : ''}
</div>`;
}
