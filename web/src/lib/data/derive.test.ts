import { describe, expect, it } from 'vitest';
import {
  computeGrowth, newsInLastDays, nextDeadline, nextReport, owidLatest, owidLatestByEntity, owidPoints, owidPrev,
  radarChanges, radarRows, tNum, nx, ny,
} from './derive';
import type { EpochPoint, News, Owid, Radar } from './types';
import { fromNorm } from '../test/fixtures';

const today = new Date(2026, 9, 15, 10);

// Le righe si scrivono pensando alla posizione sul grafico (0–1): fromNorm la porta in valori veri.
const radar = (rows: Partial<Radar['competenze'][number]>[]): Radar => ({
  versione: 2, generato: '2026-10-15',
  quadranti: { 'impara-ora': 'Impara ora', prova: 'Da provare', consolida: 'Da consolidare', osserva: "Tieni d'occhio" },
  competenze: rows.map((r, i) => fromNorm({ id: `c${i}`, nome: `Competenza ${i}`, descrizione: '', slancio: 0.5, domanda: 0.5, quadrante: 'impara-ora', ...r })),
});

describe('radarRows', () => {
  it('calcola movimento e cambi di quadrante', () => {
    const rows = radarRows(radar([
      { breve: 'MCP', slancio: 0.6, domanda: 0.93, quadrante: 'impara-ora', slancio_prec: 0.27, domanda_prec: 0.93, quadrante_prec: 'consolida' },
      { slancio: 0.2, domanda: 0.2, quadrante: 'osserva', slancio_prec: 0.25, domanda_prec: 0.2, quadrante_prec: 'osserva' },
    ]));
    expect(rows[0]).toMatchObject({ breve: 'MCP', hasPrev: true, changed: true });
    expect(rows[0].dS).toBeCloseTo(0.33);
    expect(rows[0].move).toBeCloseTo(0.33);
    expect(rows[1]).toMatchObject({ breve: 'Competenza 1', changed: false });
    expect(radarChanges(rows).inn.map((r) => r.id)).toEqual(['c0']);
    expect(radarChanges(rows).out).toEqual([]);
  });
  it('senza posizione precedente: niente movimento', () => {
    const rows = radarRows(radar([{ slancio: 0.7, domanda: 0.7 }]));
    expect(rows[0]).toMatchObject({ hasPrev: false, changed: false, move: 0, dS: 0, sp: null, px: null, breve: 'Competenza 0' });
  });
  it('radar.json della pipeline vecchia (senza versione 2): nessuna riga', () => {
    expect(radarRows({ ...radar([{}]), versione: undefined })).toEqual([]);
  });
  it('incerto e in movimento verso un altro quadrante', () => {
    const [r] = radarRows(radar([{ quadrante: 'osserva', quadrante_calcolato: 'prova', incerto: true }]));
    expect(r).toMatchObject({ incerto: true, moving: 'prova' });
    expect(radarRows(radar([{ quadrante_calcolato: 'impara-ora' }]))[0].moving).toBeNull();
  });
  it('senza domanda di un mese fa: movimento solo sullo slancio', () => {
    const rows = radarRows(radar([{ slancio: 0.8, domanda: 0.6, quadrante: 'impara-ora', slancio_prec: 0.3, domanda_prec: null, quadrante_prec: 'consolida' }]));
    expect(rows[0]).toMatchObject({ hasPrev: true, changed: true, dp: null, dD: 0 });
    expect(rows[0].dS).toBeCloseTo(0.5);
  });
  it('scarta le competenze senza posizione', () => {
    expect(radarRows(radar([{ slancio: null }, {}]))).toHaveLength(1);
  });
});

describe('computeGrowth', () => {
  it('raddoppio annuo → fattore 2', () => {
    const punti: EpochPoint[] = [2018, 2019, 2020, 2021, 2022, 2023].map((y, i) => ({
      m: `M${y}`, o: '', d: `${y}-07-01`, c: 1e20 * 2 ** i, f: true, a: 'USA', open: false,
    }));
    const g = computeGrowth(punti)!;
    expect(g.n).toBe(6);
    expect(g.fattore).toBeCloseTo(2, 1);
  });
  it('troppi pochi modelli → null', () => {
    expect(computeGrowth([{ m: 'a', o: '', d: '2020-01-01', c: 1e20, f: true, a: '', open: false }])).toBeNull();
  });
});

describe('tempo e OWID', () => {
  const owid: Owid = {
    aggiornato: '', errori: {},
    serie: { inv: { titolo: '', unita: '', citazione: 'Q', url: 'u', aggiornato_owid: null, punti: [
      { entita: 'World', t: '2025', v: 290 }, { entita: 'World', t: '2024', v: 130 }, { entita: 'China', t: '2025', v: 12 },
    ] } },
  };
  it('tNum per anni, mesi, trimestri, giorni', () => {
    expect(tNum('2025')).toBe(2025);
    expect(tNum('2026-07')).toBeCloseTo(2026.54, 2);
    expect(tNum('2026-Q3')).toBeCloseTo(2026.625);
    expect(tNum('2026-03-31')).toBeCloseTo(2026.25, 1);
  });
  it('punti, ultimo, precedente', () => {
    expect(owidPoints(owid, 'inv', 'World').map((p) => p.t)).toEqual(['2024', '2025']);
    expect(owidLatest(owid, 'inv', 'World')?.v).toBe(290);
    expect(owidPrev(owid, 'inv', 'World')?.v).toBe(130);
    expect(owidLatest(owid, 'manca', 'World')).toBeNull();
    expect(owidLatest(undefined, 'inv', 'World')).toBeNull();
    const m = owidLatestByEntity(owid, 'inv');
    expect(m.get('World')?.was?.v).toBe(130);
    expect(m.get('China')?.was).toBeNull();
  });
});

describe('scadenze, notizie, rapporti', () => {
  it('prossima scadenza', () => {
    const items = [
      { data: '2025-08-02', titolo: 'A', descrizione: '', fonte: '' },
      { data: '2026-12-02', titolo: 'B', descrizione: '', fonte: '' },
      { data: '2027-12-02', titolo: 'C', descrizione: '', fonte: '' },
    ];
    expect(nextDeadline(items, today)?.titolo).toBe('B');
    expect(nextDeadline(items.slice(0, 1), today)).toBeNull();
    expect(nextDeadline(undefined, today)).toBeNull();
  });
  it('notizie degli ultimi 7 giorni: niente date future o mancanti', () => {
    const news: News = { fonti: [], errori: {}, giorni: 45, notizie: [
      { titolo: 'oggi', link: '', data: '2026-10-15', fonte: 'A' },
      { titolo: 'sei giorni fa', link: '', data: '2026-10-09', fonte: 'A' },
      { titolo: 'sette giorni fa', link: '', data: '2026-10-08', fonte: 'A' },
      { titolo: 'domani', link: '', data: '2026-10-16', fonte: 'A' },
      { titolo: 'senza data', link: '', data: '', fonte: 'A' },
    ] };
    expect(newsInLastDays(news, today).map((n) => n.titolo)).toEqual(['oggi', 'sei giorni fa']);
    expect(newsInLastDays(undefined, today)).toEqual([]);
  });
  it('prossimo rapporto dal mese in corso in poi', () => {
    const r = { rapporti: [
      { nome: 'A', editore: '', url: '', cadenza: '', edizioni: [], prossima_prevista: '2027-04' },
      { nome: 'B', editore: '', url: '', cadenza: '', edizioni: [], prossima_prevista: '2026-10' },
      { nome: 'C', editore: '', url: '', cadenza: '', edizioni: [], prossima_prevista: '2026-09' },
      { nome: 'D', editore: '', url: '', cadenza: '', edizioni: [], prossima_prevista: null },
    ] };
    expect(nextReport(r, today)).toEqual({ report: r.rapporti[1], ym: '2026-10' });
    expect(nextReport({ rapporti: [r.rapporti[2]] }, today)).toBeNull();
  });
});

describe('coordinate del radar', () => {
  it('soglie al centro, domini fissi, valori fuori dominio sul bordo', () => {
    expect(nx(0)).toBeCloseTo(0.5);
    expect(nx(-0.5)).toBeCloseTo(0);
    expect(nx(1)).toBeCloseTo(1);
    expect(nx(4)).toBe(1);
    expect(nx(-1)).toBe(0);
    expect(ny(3)).toBeCloseTo(0.5);
    expect(ny(0.1)).toBeCloseTo(0);
    expect(ny(90)).toBeCloseTo(1);
    expect(ny(0)).toBe(0);
  });
});
