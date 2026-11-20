// L'indirizzo pubblico del sito, da cui nascono tutti gli indirizzi assoluti: quello ricevuto dal workflow
// in AI_RADAR_BASE_URL, che segue il repository, o in locale quello del sito originale.
const PREDEFINITO = 'https://simones99.github.io/ai-radar/';

export function indirizzoBase(valore: string | undefined): string {
  if (!valore) return PREDEFINITO;
  if (!URL.canParse(valore)) throw new Error(`AI_RADAR_BASE_URL deve essere un indirizzo assoluto, non «${valore}»`);
  return valore.endsWith('/') ? valore : `${valore}/`;
}
