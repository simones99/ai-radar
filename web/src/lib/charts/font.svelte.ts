// I font della pagina arrivano dopo il primo disegno: fino ad allora il testo si misura con il font di riserva, più stretto.
let versione = $state(0); // cresce a ogni font caricato: chi misura il testo in un $derived rifà la misura

if (typeof document !== 'undefined' && document.fonts) {
  document.fonts.addEventListener('loadingdone', () => versione++);
  void document.fonts.ready.then(() => versione++);
}

/** Da leggere prima di misurare: lega la misura al caricamento dei font. */
export const versioneFont = () => versione;
