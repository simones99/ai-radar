import { describe, expect, it } from 'vitest';
import { parseHash, slug, toHash } from './router';

describe('router', () => {
  it('riconosce tema ed elemento', () => {
    expect(parseHash('#business')).toEqual({ tema: 'business', elemento: null, params: {} });
    expect(parseHash('#competenze/mcp')).toEqual({ tema: 'competenze', elemento: 'mcp', params: {} });
    expect(parseHash('#notizie/the-decoder')).toEqual({ tema: 'notizie', elemento: 'the-decoder', params: {} });
  });
  it('ignora hash vuoti, sconosciuti o malformati', () => {
    expect(parseHash('')).toBeNull();
    expect(parseHash('#')).toBeNull();
    expect(parseHash('#crediti')).toBeNull();
    expect(parseHash('#business/%E0')).toEqual({ tema: 'business', elemento: null, params: {} });
    expect(parseHash('#competenze/')).toEqual({ tema: 'competenze', elemento: null, params: {} });
  });
  it('scrive gli hash', () => {
    expect(toHash('norme')).toBe('#norme');
    expect(toHash('competenze', 'mcp')).toBe('#competenze/mcp');
  });
  it('i vecchi link a Politica aprono Norme', () => {
    expect(parseHash('#politica')).toEqual({ tema: 'norme', elemento: null, params: {} });
    expect(parseHash('#politica/2026-12-02')).toEqual({ tema: 'norme', elemento: '2026-12-02', params: {} });
    expect(parseHash('#norme/2026-12-02')).toEqual({ tema: 'norme', elemento: '2026-12-02', params: {} });
  });
  it('legge i parametri dopo il punto di domanda', () => {
    expect(parseHash('#competenze?ruolo=dati')).toEqual({ tema: 'competenze', elemento: null, params: { ruolo: 'dati' } });
    expect(parseHash('#competenze/rag?ruolo=dati')).toEqual({ tema: 'competenze', elemento: 'rag', params: { ruolo: 'dati' } });
    expect(parseHash('#business?settore=ict&ruolo=legale')).toEqual({ tema: 'business', elemento: null, params: { settore: 'ict', ruolo: 'legale' } });
    expect(parseHash('#politica/2026-12-02?ruolo=legale')).toEqual({ tema: 'norme', elemento: '2026-12-02', params: { ruolo: 'legale' } });
  });
  it('senza punto di domanda i parametri sono vuoti', () => {
    expect(parseHash('#competenze/mcp')?.params).toEqual({});
    expect(parseHash('#competenze?')?.params).toEqual({});
  });
  it('ignora i parametri malformati e tiene il resto del link', () => {
    expect(parseHash('#competenze/rag?ruolo=%E0&settore=ict')).toEqual({ tema: 'competenze', elemento: 'rag', params: { settore: 'ict' } });
    expect(parseHash('#competenze?ruolo&=dati&settore=')).toEqual({ tema: 'competenze', elemento: null, params: {} });
    expect(parseHash('#crediti?ruolo=dati')).toBeNull();
  });
  it('scrive i parametri, e li omette quando sono vuoti', () => {
    expect(toHash('competenze', null, { ruolo: 'dati' })).toBe('#competenze?ruolo=dati');
    expect(toHash('competenze', 'rag', { ruolo: 'dati', settore: 'ict' })).toBe('#competenze/rag?ruolo=dati&settore=ict');
    expect(toHash('competenze', 'rag', {})).toBe('#competenze/rag');
    expect(toHash('business', null, { settore: 'a b&c' })).toBe('#business?settore=a%20b%26c');
    expect(parseHash(toHash('business', 'x?y', { settore: 'a b&c' }))).toEqual({ tema: 'business', elemento: 'x?y', params: { settore: 'a b&c' } });
  });
  it('slug per i nomi delle fonti', () => {
    expect(slug('The Decoder')).toBe('the-decoder');
    expect(slug('EU AI Act Newsletter')).toBe('eu-ai-act-newsletter');
    expect(slug('Ünïcode & Co.')).toBe('unicode-co');
  });
});
