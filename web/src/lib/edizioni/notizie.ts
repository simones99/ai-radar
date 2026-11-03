// Le notizie di un'edizione: una regola, non una classifica.
import type { Dataset, NewsItem } from '../data/types';
import { capitalize } from '../text/format';
import { settimanaDelleNotizie, TEMI_NOTIZIE } from '../text/frasi';
import type { NotizieFisse, VoceFissa } from './tipi';

const PER_TEMA = 3;
const REGOLA = `Fino a ${PER_TEMA} notizie per tema, le più recenti, senza ripetere una fonte nello stesso tema. Sono scelte da questa regola: non sono una classifica.`;

const temaDi = (n: NewsItem): string => n.tema ?? 'altro';

/** Dalla più recente; a parità di data resta l'ordine del file, perché l'ordinamento è stabile. */
function scelte(voci: NewsItem[]): VoceFissa[] {
  const usate = new Set<string>();
  const dentro: VoceFissa[] = [];
  for (const { titolo, link, data, fonte } of [...voci].sort((a, b) => b.data.slice(0, 10).localeCompare(a.data.slice(0, 10)))) {
    if (usate.has(fonte)) continue;
    usate.add(fonte);
    dentro.push({ titolo, link, data, fonte });
    if (dentro.length === PER_TEMA) break;
  }
  return dentro;
}

export function notizieDi(d: Dataset): NotizieFisse {
  const { periodo, voci } = settimanaDelleNotizie(d);
  const ignoti = [...new Set(voci.map(temaDi))].filter((t) => !(t in TEMI_NOTIZIE)).sort();
  // «altro» resta in fondo, dopo anche i temi che la tabella non conosce
  const ordine = [...Object.keys(TEMI_NOTIZIE).filter((t) => t !== 'altro'), ...ignoti, 'altro'];
  return {
    numero: voci.length,
    periodo,
    fonti: new Set(voci.map((v) => v.fonte)).size,
    regola: REGOLA,
    temi: ordine
      .map((tema) => ({ tema, nome: TEMI_NOTIZIE[tema] ?? capitalize(tema), voci: scelte(voci.filter((v) => temaDi(v) === tema)) }))
      .filter((t) => t.voci.length),
  };
}
