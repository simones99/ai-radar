import { describe, expect, it } from 'vitest';
import type { Dataset, Radar } from '../data/types';
import { FIXTURE, FIXTURE_TODAY as today } from '../test/fixtures';
import { doorPerTe } from './frasi';

const d = FIXTURE as Dataset;
const text = (parts: { t: string }[]) => parts.map((p) => p.t).join('');
const radar = (rows: Partial<Radar['competenze'][number]>[]): Dataset => ({
  radar: {
    generato: '2026-10-15', base_domanda: 'open-source', quadranti: d.radar!.quadranti,
    competenze: rows.map((r, i) => ({ id: `c${i}`, nome: `Competenza ${i}`, breve: `C${i}`, descrizione: '', slancio: 0.5, domanda: 0.5, quadrante: 'impara-ora', ...r })),
  },
});

describe('porta Per te', () => {
  it('1. chi entra e chi esce da Impara ora', () => {
    const p = doorPerTe(d, today);
    expect(text(p.title)).toBe('MCP entra tra le competenze da imparare ora; RAG esce');
    expect(p.title[0]).toEqual({ t: 'MCP', em: true });
    expect(p.meta).toBe('Radar delle competenze · dati al 15 ott 2026');
    expect(p.target).toEqual({ tema: 'competenze', elemento: 'mcp' });
  });
  it('1. solo uscite', () => {
    const p = doorPerTe(radar([{ quadrante: 'consolida', slancio: 0.3, domanda: 0.7, slancio_prec: 0.7, domanda_prec: 0.7, quadrante_prec: 'impara-ora' }]), today);
    expect(text(p.title)).toBe('C0 esce da Impara ora');
    expect(p.target).toEqual({ tema: 'competenze', elemento: 'c0' });
  });
  it('1. più competenze che entrano, nessuna esce', () => {
    const p = doorPerTe(radar([
      { quadrante: 'impara-ora', slancio: 0.7, domanda: 0.7, slancio_prec: 0.7, domanda_prec: 0.4, quadrante_prec: 'consolida' },
      { quadrante: 'impara-ora', slancio: 0.6, domanda: 0.8, slancio_prec: 0.6, domanda_prec: 0.45, quadrante_prec: 'consolida' },
    ]), today);
    expect(text(p.title)).toBe('C0 e C1 entrano tra le competenze da imparare ora');
    expect(p.target).toEqual({ tema: 'competenze', elemento: 'c0' });
  });
  it('2. altri cambi verso lo stesso quadrante: tutti i nomi', () => {
    const p = doorPerTe(radar([
      { quadrante: 'prova', slancio: 0.7, domanda: 0.2, slancio_prec: 0.3, domanda_prec: 0.2, quadrante_prec: 'osserva' },
      { quadrante: 'prova', slancio: 0.6, domanda: 0.3, slancio_prec: 0.4, domanda_prec: 0.3, quadrante_prec: 'osserva' },
    ]), today);
    expect(text(p.title)).toBe('C0 e C1 passano a Da provare');
    expect(p.target).toEqual({ tema: 'competenze', elemento: 'c0' });
  });
  it('2. cambi verso quadranti diversi: solo lo spostamento più grande', () => {
    const p = doorPerTe(radar([
      { quadrante: 'prova', slancio: 0.6, domanda: 0.2, slancio_prec: 0.45, domanda_prec: 0.2, quadrante_prec: 'osserva' },
      { quadrante: 'osserva', slancio: 0.1, domanda: 0.3, slancio_prec: 0.7, domanda_prec: 0.3, quadrante_prec: 'prova' },
    ]), today);
    expect(text(p.title)).toBe("C1 passa a Tieni d'occhio");
    expect(p.target).toEqual({ tema: 'competenze', elemento: 'c1' });
  });
  it('3. nessun cambio: lo spostamento più grande, se almeno 10 punti', () => {
    const p = doorPerTe(radar([
      { quadrante: 'osserva', slancio: 0.0, domanda: 0.3, slancio_prec: 0.33, domanda_prec: 0.3, quadrante_prec: 'osserva' },
      { quadrante: 'prova', slancio: 0.9, domanda: 0.1, slancio_prec: 0.8, domanda_prec: 0.1, quadrante_prec: 'prova' },
    ]), today);
    expect(text(p.title)).toBe('C0 perde 33 punti di slancio');
    expect(p.target).toEqual({ tema: 'competenze', elemento: 'c0' });
  });
  it('3. spostamento sulla domanda', () => {
    const p = doorPerTe(radar([{ quadrante: 'impara-ora', slancio: 0.6, domanda: 0.9, slancio_prec: 0.6, domanda_prec: 0.6, quadrante_prec: 'impara-ora' }]), today);
    expect(text(p.title)).toBe('C0 guadagna 30 punti di domanda');
  });
  it('4. riserva: quante competenze da imparare ora', () => {
    const p = doorPerTe(radar([{}, { quadrante: 'osserva', slancio: 0.2, domanda: 0.2 }]), today);
    expect(text(p.title)).toBe('1 competenza su 2 da imparare ora');
    expect(p.title[0]).toEqual({ t: '1 competenza su 2', em: true });
    expect(p.target).toEqual({ tema: 'competenze', elemento: null });
  });
  it('senza radar: porta vuota e non cliccabile', () => {
    expect(doorPerTe({}, today)).toEqual({ title: [], meta: 'Dati non ancora disponibili', target: null });
  });
});
