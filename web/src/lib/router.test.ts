import { describe, expect, it } from 'vitest';
import { parseHash, slug, toHash } from './router';

describe('router', () => {
  it('riconosce tema ed elemento', () => {
    expect(parseHash('#business')).toEqual({ tema: 'business', elemento: null });
    expect(parseHash('#competenze/mcp')).toEqual({ tema: 'competenze', elemento: 'mcp' });
    expect(parseHash('#notizie/the-decoder')).toEqual({ tema: 'notizie', elemento: 'the-decoder' });
  });
  it('ignora hash vuoti, sconosciuti o malformati', () => {
    expect(parseHash('')).toBeNull();
    expect(parseHash('#')).toBeNull();
    expect(parseHash('#crediti')).toBeNull();
    expect(parseHash('#business/%E0')).toEqual({ tema: 'business', elemento: null });
    expect(parseHash('#competenze/')).toEqual({ tema: 'competenze', elemento: null });
  });
  it('scrive gli hash', () => {
    expect(toHash('norme')).toBe('#norme');
    expect(toHash('competenze', 'mcp')).toBe('#competenze/mcp');
  });
  it('i vecchi link a Politica aprono Norme', () => {
    expect(parseHash('#politica')).toEqual({ tema: 'norme', elemento: null });
    expect(parseHash('#politica/2026-12-02')).toEqual({ tema: 'norme', elemento: '2026-12-02' });
    expect(parseHash('#norme/2026-12-02')).toEqual({ tema: 'norme', elemento: '2026-12-02' });
  });
  it('slug per i nomi delle fonti', () => {
    expect(slug('The Decoder')).toBe('the-decoder');
    expect(slug('EU AI Act Newsletter')).toBe('eu-ai-act-newsletter');
    expect(slug('Ünïcode & Co.')).toBe('unicode-co');
  });
});
