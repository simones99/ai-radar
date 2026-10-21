import { describe, expect, it } from 'vitest';
import {
  computeGrowth, newsInLastDays, nextDeadline, nextReport, owidLatest, owidLatestByEntity, owidPoints, owidPrev,
  radarChanges, radarRows, tNum, nx, ny, adozionePerSettore, andamentoItUe, barriereItUe, scopiItUe, ultimoAnno,
} from './derive';
import type { EpochPoint, EurostatSettori, News, Owid, Radar } from './types';
import { FIXTURE, fromNorm } from '../test/fixtures';

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

describe('settori: Italia contro UE', () => {
  const es = FIXTURE.eurostat_settori as EurostatSettori;

  it("adozione: i settori (senza «Tutti») ordinati per valore italiano dell'ultimo anno", () => {
    const a = adozionePerSettore(es);
    expect(a.anno).toBe('2025');
    expect(a.righe).toEqual([
      { id: 'ict', k: 'Informazione e comunicazione', it: 51.28, eu: 62.52 },
      { id: 'manifattura', k: 'Manifattura', it: 14.73, eu: 17.27 },
      { id: 'immobiliare', k: 'Immobiliare', it: 13.96, eu: 24.76 },
    ]);
  });

  it('un valore italiano mancante resta null, mai 0, va in fondo e il nome finisce nella nota', () => {
    const x = structuredClone(es);
    x.adozione.ict.IT['2025'] = null;
    delete x.adozione.manifattura.IT['2025'];
    const a = adozionePerSettore(x);
    expect(a.righe.map((r) => [r.k, r.it])).toEqual([['Immobiliare', 13.96], ['Informazione e comunicazione', null], ['Manifattura', null]]);
    expect(a.righe[1].eu).toBe(62.52);
    expect(a.senzaItalia).toEqual(['Informazione e comunicazione', 'Manifattura']);
    expect(adozionePerSettore(es).senzaItalia).toEqual([]);
  });

  it('adozione senza nessun valore: niente anno e niente righe, mai «-Infinity»', () => {
    const x = structuredClone(es);
    for (const g of Object.values(x.adozione)) { g.IT = {}; g.EU27_2020 = {}; }
    expect(adozionePerSettore(x)).toEqual({ anno: null, righe: [], senzaItalia: [] });
  });

  it("ultimo anno: il più recente fra le chiavi delle serie, null se non ce n'è", () => {
    expect(ultimoAnno([{ 2021: 1, 2025: null }, { 2024: 3 }])).toBe('2025');
    expect(ultimoAnno([{}, {}])).toBeNull();
    expect(ultimoAnno([])).toBeNull();
  });

  it("andamento di un settore: Italia e UE per anno, in ordine di tempo, senza inventare il 2022", () => {
    const a = andamentoItUe(es, 'manifattura');
    expect(a.righe).toEqual([
      { id: '2021', k: '2021', it: 6.63, eu: 6.93 }, { id: '2023', k: '2023', it: 4.94, eu: 6.79 },
      { id: '2024', k: '2024', it: 8.03, eu: 10.57 }, { id: '2025', k: '2025', it: 14.73, eu: 17.27 },
    ]);
    expect(a.senzaItalia).toEqual([]);
  });

  it("andamento con un valore italiano mancante: l'anno resta, con il solo valore UE, e finisce nella nota", () => {
    const x = structuredClone(es);
    x.adozione.ict.IT['2023'] = null;
    const a = andamentoItUe(x, 'ict');
    expect(a.righe.map((r) => [r.k, r.it, r.eu])).toEqual([['2021', 16.19, 25.37], ['2023', null, 29.53], ['2024', 34.6, 48.72], ['2025', 51.28, 62.52]]);
    expect(a.senzaItalia).toEqual(['2023']);
    expect(andamentoItUe(x, 'boh')).toEqual({ righe: [], senzaItalia: [] });
  });

  it('scopi e barriere di un settore, con i nomi italiani, ordinati per valore italiano', () => {
    const b = barriereItUe(es);
    expect(b.righe.map((r) => r.k)).toEqual([
      'Mancano le competenze', 'Conseguenze legali poco chiare', 'Dati scarsi o di bassa qualità', 'Timori per privacy e protezione dei dati',
      'Costi troppo alti', 'Incompatibile con i sistemi esistenti', 'Questioni etiche', "L'AI non serve all'impresa",
    ]);
    expect(b.righe[0]).toEqual({ id: 'E_AI_BLE', k: 'Mancano le competenze', it: 58.61, eu: 70.31 });
    expect(b.senzaItalia).toEqual([]);
    // immobiliare, Italia, logistica: riservato (c)
    const s = scopiItUe(es, 'immobiliare');
    expect(s.righe.map((r) => r.it)).toEqual([46.75, 42.37, 35.26, 19.32, 17.72, 4.36, null]);
    expect(s.righe.at(-1)).toEqual({ id: 'E_AI_PLOG', k: 'Logistica', it: null, eu: 2.67 });
    expect(s.senzaItalia).toEqual(['Logistica']);
    expect(scopiItUe(es).righe[0]).toMatchObject({ k: 'Marketing e vendite', it: 33.1, eu: 34.7 });
  });
});
