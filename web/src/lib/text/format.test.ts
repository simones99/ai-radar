import { describe, expect, it } from 'vitest';
import { capitalize, day, daysTo, exact, isoDay, lowerFirst, monthName, monthYear, nf, signedPts, ym } from './format';

describe('formati italiani', () => {
  it('numeri con separatori italiani', () => {
    expect(nf(12345.6, 1)).toBe('12.345,6');
    expect(nf(290)).toBe('290');
    expect(nf(2.216, 1)).toBe('2,2');
  });
  it('valori esatti, come pubblicati dalla fonte', () => {
    expect(exact(290094148769)).toBe('290.094.148.769');
    expect(exact(2.5554)).toBe('2,5554');
    expect(exact(1.4890001)).toBe('1,489');
  });
  it('date brevi', () => {
    expect(day('2026-12-02')).toBe('2 dic 2026');
    expect(day('2026-10-15T08:49:44+00:00')).toBe('15 ott 2026');
  });
  it('mesi', () => {
    expect(monthName('2026-10')).toBe('ottobre');
    expect(monthYear('2027-04')).toBe('aprile 2027');
    expect(ym(new Date(2026, 9, 15))).toBe('2026-10');
    expect(isoDay(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
  it('giorni mancanti', () => {
    const today = new Date(2026, 9, 15, 23, 30);
    expect(daysTo('2026-12-02', today)).toBe(48);
    expect(daysTo('2026-10-15', today)).toBe(0);
    expect(daysTo('2026-10-14', today)).toBe(-1);
  });
  it('variazioni in punti', () => {
    expect(signedPts(0.123)).toBe('+12');
    expect(signedPts(-0.05)).toBe('−5');
    expect(signedPts(0.001)).toBe('±0');
  });
  it('maiuscole', () => {
    expect(capitalize('ottobre')).toBe('Ottobre');
    expect(lowerFirst('Fine della transizione')).toBe('fine della transizione');
    expect(capitalize('')).toBe('');
  });
});
