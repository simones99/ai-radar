// I confini del modulo Edizioni: le pagine statiche lo usano, lui non usa loro. Se si importassero a vicenda, nessuno dei due si capirebbe da solo.
import { describe, expect, it } from 'vitest';

const sorgenti = import.meta.glob<string>(['./*.ts', '!./*.test.ts'], { query: '?raw', import: 'default', eager: true });

describe('i confini del modulo Edizioni', () => {
  it('nessun file del modulo importa dalle pagine statiche', () => {
    const daStatico = Object.entries(sorgenti).filter(([, testo]) => /from '\.\.\/statico[/']/.test(testo)).map(([file]) => file);
    expect(Object.keys(sorgenti).length).toBeGreaterThan(5);
    expect(daStatico).toEqual([]);
  });
});
