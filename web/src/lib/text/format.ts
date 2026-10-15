const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

export const nf = (v: number, d = 0): string =>
  v.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d });
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

export const monthName = (ymStr: string): string => MESI[Number(ymStr.slice(5, 7)) - 1];
export const monthYear = (ymStr: string): string => `${monthName(ymStr)} ${ymStr.slice(0, 4)}`;

const pad = (n: number) => String(n).padStart(2, '0');
export const isoDay = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const ym = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export function daysTo(iso: string, today: Date): number {
  return Math.round((parseDay(iso).getTime() - parseDay(isoDay(today)).getTime()) / 864e5);
}

export function signedPts(v: number): string {
  const r = Math.round(v * 100);
  return (r > 0 ? '+' : r < 0 ? '−' : '±') + Math.abs(r);
}

export const capitalize = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : s);
export const lowerFirst = (s: string): string => (s ? s[0].toLowerCase() + s.slice(1) : s);
