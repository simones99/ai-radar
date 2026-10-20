import { beforeEach, describe, expect, it } from 'vitest';
import { IMPOSTA } from './router';
import { sceltaRicordata } from './scelta.svelte';

beforeEach(() => localStorage.clear());

describe('sceltaRicordata', () => {
  it('due parametri si ricordano ciascuno per conto suo', () => {
    const ruolo = sceltaRicordata('ruolo');
    const settore = sceltaRicordata('settore');
    ruolo.scegli('dati');
    settore.scegli('ict');
    expect(ruolo.ricordato()).toBe('dati');
    expect(settore.ricordato()).toBe('ict');
    ruolo.scegli(null); // «Tutti» dimentica solo il ruolo
    expect(ruolo.ricordato()).toBeNull();
    expect(settore.ricordato()).toBe('ict');
    expect(localStorage.getItem('ai-radar:settore')).toBe('ict');
  });

  describe('all’apertura della card, tra link e ricordo', () => {
    const settore = sceltaRicordata('settore');
    const validi = ['ict', 'manifattura'];
    let link: Array<[string, string | null]>; // i parametri che la card chiede di cambiare nel link
    const ascolta = (e: Event) => {
      const { chiave, valore } = (e as CustomEvent).detail;
      link.push([chiave, valore]);
    };
    beforeEach(() => {
      link = [];
      document.addEventListener(IMPOSTA, ascolta);
      return () => document.removeEventListener(IMPOSTA, ascolta);
    });

    it('un valore nel link vince e diventa il ricordato', () => {
      localStorage.setItem('ai-radar:settore', 'ict');
      settore.allinea('manifattura', validi);
      expect(settore.ricordato()).toBe('manifattura');
      expect(link).toEqual([]);
    });
    it('senza valore nel link, il ricordo entra nel link', () => {
      localStorage.setItem('ai-radar:settore', 'ict');
      settore.allinea(undefined, validi);
      expect(link).toEqual([['settore', 'ict']]);
    });
    it('un valore sconosciuto nel link si ignora: vale il ricordo, o niente', () => {
      localStorage.setItem('ai-radar:settore', 'ict');
      settore.allinea('boh', validi);
      localStorage.clear();
      settore.allinea('boh', validi);
      expect(link).toEqual([['settore', 'ict'], ['settore', null]]);
    });
    it('un ricordo che non è più tra i validi si ignora', () => {
      localStorage.setItem('ai-radar:settore', 'tessile');
      settore.allinea(undefined, validi);
      expect(link).toEqual([]);
    });
  });
});
