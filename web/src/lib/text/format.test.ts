import { describe, expect, it } from 'vitest';
import { capitalize, day, dayWith, daysTo, exact, isoDay, short, lowerFirst, monthName, monthYear, nf, signedPts, ym } from './format';

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
  it('importi brevi con M e B', () => {
    expect(short(290094148769)).toBe('290 B');
    expect(short(5102962753)).toBe('5,1 B');
    expect(short(717196154)).toBe('717 M');
    expect(short(0)).toBe('0');
  });
  it('date brevi', () => {
    expect(day('2026-12-02')).toBe('2 dic 2026');
    expect(day('2026-10-15T08:49:44+00:00')).toBe('15 ott 2026');
  });
  it('date con «al» e «il»: elisione davanti a 1, 8 e 11', () => {
    expect(dayWith('al', '2027-01-01')).toBe('all’1 gen 2027');
    expect(dayWith('al', '2027-01-08')).toBe('all’8 gen 2027');
    expect(dayWith('al', '2027-01-11')).toBe('all’11 gen 2027');
    expect(dayWith('al', '2027-01-16')).toBe('al 16 gen 2027');
    expect(dayWith('il', '2027-02-01')).toBe('l’1 feb 2027');
    expect(dayWith('il', '2027-02-08')).toBe('l’8 feb 2027');
    expect(dayWith('il', '2027-02-11')).toBe('l’11 feb 2027');
    expect(dayWith('il', '2027-02-16')).toBe('il 16 feb 2027');
  });
  it('date con «del» e con «Il» a inizio frase', () => {
    expect(dayWith('del', '2027-03-01')).toBe('dell’1 mar 2027');
    expect(dayWith('del', '2027-03-08')).toBe('dell’8 mar 2027');
    expect(dayWith('del', '2027-03-11')).toBe('dell’11 mar 2027');
    expect(dayWith('del', '2027-03-16')).toBe('del 16 mar 2027');
    expect(dayWith('Il', '2027-04-01')).toBe('L’1 apr 2027');
    expect(dayWith('Il', '2027-04-08')).toBe('L’8 apr 2027');
    expect(dayWith('Il', '2027-04-11')).toBe('L’11 apr 2027');
    expect(dayWith('Il', '2027-04-16')).toBe('Il 16 apr 2027');
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
