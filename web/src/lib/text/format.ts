// per useGrouping: 'always' in nf
/// <reference lib="es2023.intl" />
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

/** Il punto delle migliaia anche sulle quattro cifre (9.059 come 11.009): l'italiano di Intl lo toglie sotto le diecimila. */
export const nf = (v: number, d = 0): string =>
  v.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' });
/** Valore come pubblicato dalla fonte: niente arrotondamenti, solo il rumore dei float oltre la 4ª cifra decimale. */
export const exact = (v: number): string => v.toLocaleString('it-IT', { maximumFractionDigits: 4 });
/** Importi grandi in forma breve: M = milioni, B = miliardi (una cifra decimale sotto il 10). */
export const short = (v: number): string => {
  const [d, u] = Math.abs(v) >= 1e9 ? [1e9, 'B'] : Math.abs(v) >= 1e6 ? [1e6, 'M'] : [1, ''];
  const x = v / d;
  return u ? `${nf(x, Math.abs(x) < 10 ? 1 : 0)} ${u}` : nf(v);
};

/** Data a mezzogiorno locale: niente salti di giorno per il fuso orario. */
export const parseDay = (iso: string): Date => new Date(`${iso.slice(0, 10)}T12:00:00`);

export const day = (iso: string): string => {
  const d = parseDay(iso);
  return `${d.getDate()} ${MESI[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
};
const ELISO = { al: 'all’', il: 'l’', Il: 'L’', del: 'dell’' } as const;
/** Data dopo l’articolo, con l’elisione davanti a 1, 8 e 11: «al 16 gen 2027», «all’11 gen 2027», «l’8 feb 2027», «dell’1 mar 2027». «Il» a inizio frase. */
export const dayWith = (art: keyof typeof ELISO, iso: string): string => {
  const d = day(iso);
  return /^(1|8|11) /.test(d) ? `${ELISO[art]}${d}` : `${art} ${d}`;
};

export const monthName = (ymStr: string): string => MESI[Number(ymStr.slice(5, 7)) - 1];
export const monthYear = (ymStr: string): string => `${monthName(ymStr)} ${ymStr.slice(0, 4)}`;

const pad = (n: number) => String(n).padStart(2, '0');
export const isoDay = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/**
 * Una data scritta AAAA-MM-GG, e nient'altro, di un giorno che esiste: non una impossibile come il 30 febbraio,
 * che il calendario sposterebbe al mese dopo.
 */
export const isDay = (s: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(s) && isoDay(parseDay(s)) === s;
export const ym = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const GIORNO_ITALIANO = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' });

/**
 * Il giorno AAAA-MM-GG in Italia: un istante si converte nell'ora italiana, ora legale compresa; un giorno senza ora resta quello,
 * e così un istante che non si legge, che non ha un'ora da convertire.
 */
function giornoItaliano(iso: string): string {
  const istante = new Date(iso);
  return iso.length <= 10 || Number.isNaN(istante.getTime()) ? iso.slice(0, 10) : GIORNO_ITALIANO.format(istante);
}

/** Il lunedì della settimana di una data. Un istante, come la raccolta dei dati che il workflow scrive in UTC, conta nel giorno italiano. */
export function lunediDi(iso: string): string {
  const d = parseDay(giornoItaliano(iso));
  d.setDate(d.getDate() - (d.getDay() + 6) % 7);
  return isoDay(d);
}

export function daysTo(iso: string, today: Date): number {
  return Math.round((parseDay(iso).getTime() - parseDay(isoDay(today)).getTime()) / 864e5);
}

export function signedPts(v: number): string {
  const r = Math.round(v * 100);
  return (r > 0 ? '+' : r < 0 ? '−' : '±') + Math.abs(r);
}

export const capitalize = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : s);
export const lowerFirst = (s: string): string => (s ? s[0].toLowerCase() + s.slice(1) : s);

/** Variazione in percentuale con il segno: «+25%», «−8%», «±0%». */
export const signedPct = (v: number): string => `${signedPts(v)}%`;
/** Annunci ogni 10mila: una cifra decimale sotto 10 («3,4»), interi da 10 in su («26»). */
export const per10k = (v: number): string => nf(v, v < 10 ? 1 : 0);
/** Quanti annunci: «39 annunci», «1 annuncio». */
export const quantiAnnunci = (annunci: number): string => `${nf(annunci)} ${annunci === 1 ? 'annuncio' : 'annunci'}`;
/** La domanda con gli annunci che ci sono dietro, se si conoscono: «2,8 ogni 10mila, 39 annunci». */
export const conAnnunci = (domanda: number, annunci: number | null): string => `${per10k(domanda)} ogni 10mila${annunci != null ? `, ${quantiAnnunci(annunci)}` : ''}`;
/** Mese breve da "2026-09": «set». */
export const monthShort = (ymStr: string): string => monthName(ymStr).slice(0, 3);
