// La pagina Privacy del sito: descrive il contatore delle visite, e la mappa dei file pubblici la fa nascere solo dove il contatore è acceso.
// Il testo sta in text/privacy.ts; qui diventa una pagina statica come le altre, con i link esterni che passano dai link sicuri.
import { PAGINA_PRIVACY } from '../text/contatore';
import { PRIVACY, type Pezzo } from '../text/privacy';
import { esc, IMMAGINE_HOME, linkEsterno, pagina, type OpzioniPagine } from './pagina';

const pezzo = (p: Pezzo): string => (typeof p === 'string' ? esc(p) : linkEsterno(p.url, p.testo));

export function paginaPrivacy(opzioni: OpzioniPagine): string {
  const radice = '../';
  return pagina({
    titolo: `${PRIVACY.titolo} · AI Radar`,
    descrizione: PRIVACY.descrizione,
    percorso: PAGINA_PRIVACY,
    radice,
    nav: `<a href="${radice}">Dati di oggi</a>`,
    tipo: 'website',
    immagine: IMMAGINE_HOME,
    corpo: `<div class="ed-testa">
<h1>${esc(PRIVACY.titolo)}</h1>
<p>${esc(PRIVACY.apertura)}</p>
</div>
${PRIVACY.sezioni.map((s) => `<section>
<h2>${esc(s.titolo)}</h2>
${s.paragrafi.map((p) => `<p>${p.map(pezzo).join('')}</p>`).join('\n')}
</section>`).join('\n')}
<p class="ed-nota">${esc(PRIVACY.aggiornata)}</p>`,
  }, opzioni);
}

/** La pagina Privacy come voce della mappa dei file pubblici, solo con il contatore acceso: senza, non c'è niente da dichiarare. */
export const fileDellaPrivacy = (opzioni: OpzioniPagine): Record<string, string> =>
  opzioni.conLaRigaSulContatore ? { [`${PAGINA_PRIVACY}index.html`]: paginaPrivacy(opzioni) } : {};
