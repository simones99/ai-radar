import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Bars from './Bars.svelte';
import DataTable from './DataTable.svelte';
import DotPlot from './DotPlot.svelte';
import LineChart from './LineChart.svelte';
import Scatter from './Scatter.svelte';
import Timeline from './Timeline.svelte';
import BlockHarness from './__tests__/BlockHarness.svelte';
import { measureText } from './labels';

describe('Block', () => {
  it('mostra titolo, grafico, fonte cliccabile e dati', () => {
    render(BlockHarness);
    expect(screen.getByRole('heading', { name: 'Prova' })).toBeInTheDocument();
    expect(screen.getByText('grafico ok')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'OWID' })).toHaveAttribute('href', 'https://ourworldindata.org');
    expect(screen.getByText('Vedi i dati')).toBeInTheDocument();
  });
  it('un grafico che si rompe non rompe la pagina', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(BlockHarness, { broken: true });
    expect(screen.getByText('Grafico non disponibile.')).toBeInTheDocument();
    err.mockRestore();
  });
  it('dati mancanti: messaggio al posto del grafico', () => {
    render(BlockHarness, { missing: 'Dati non disponibili in questo aggiornamento.' });
    expect(screen.getByText('Dati non disponibili in questo aggiornamento.')).toBeInTheDocument();
    expect(screen.queryByText('grafico ok')).toBeNull();
    expect(screen.queryByText('Vedi i dati')).toBeNull();
  });
});

describe('DataTable', () => {
  it('numeri in italiano, prima colonna come intestazione di riga', () => {
    render(DataTable, { cols: ['Area', 'Valore'], rows: [['Mondo', 12345.6], ['Italia', 30]] });
    expect(screen.getByRole('rowheader', { name: 'Mondo' })).toBeInTheDocument();
    expect(screen.getByText('12.345,6')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });
});

describe('grafici', () => {
  it('LineChart: una linea per serie ed etichette finali', () => {
    const { container } = render(LineChart, { label: 'Investimenti', series: [
      { name: 'USA', hot: true, pts: [{ x: 2024, y: 109 }, { x: 2025, y: 230 }] },
      { name: 'Cina', pts: [{ x: 2024, y: 9 }, { x: 2025, y: 12 }] },
    ] });
    expect(container.querySelectorAll('path.ln')).toHaveLength(2);
    expect(container.querySelector('path.ln.hot')).not.toBeNull();
    expect(screen.getByText('USA 230')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Investimenti' })).toBeInTheDocument();
  });
  it('Bars: una barra per dato, l’ultima in evidenza', () => {
    const { container } = render(Bars, { label: 'Generativa', data: [{ k: '2024', v: 43.7 }, { k: '2025', v: 143.8 }] });
    const bars = container.querySelectorAll('rect.bar');
    expect(bars).toHaveLength(2);
    expect(bars[1]).toHaveClass('hot');
  });
  it('Bars: con nomi lunghi le barre diventano orizzontali, tutte con il nome, la più alta in cima', () => {
    const data = ['sintesi vocale', 'image-to-image', 'classificazione di testo', 'da testo a immagine', 'generazione di testo', 'immagine e testo']
      .map((k, i) => ({ k, v: i + 1 }));
    const { container } = render(Bars, { label: 'Compiti', data });
    for (const d of data) expect(screen.getByText(d.k)).toBeInTheDocument();
    const bars = [...container.querySelectorAll('rect.bar')];
    expect(Number(bars[0].getAttribute('y'))).toBeLessThan(Number(bars[1].getAttribute('y')));
    expect(bars[0]).toHaveClass('hot');
  });
  it('Bars: con nomi corti e tante barre restano verticali, un nome ogni tanto', () => {
    const data = Array.from({ length: 11 }, (_, i) => ({ k: String(2016 + i), v: i + 1 }));
    const { container } = render(Bars, { label: 'Anni', data });
    const bars = [...container.querySelectorAll('rect.bar')];
    expect(bars.map((b) => b.getAttribute('y'))).not.toEqual(bars.map(() => bars[0].getAttribute('y')));
    expect(Number(bars[0].getAttribute('x'))).toBeLessThan(Number(bars[1].getAttribute('x')));
  });
  it('LineChart: il margine destro fa spazio alle etichette finali', () => {
    const { container } = render(LineChart, { label: 'Annunci', yFormat: (v: number) => `${v}%`, series: [
      { name: 'Regno Unito', pts: [{ x: 2024, y: 1.5 }, { x: 2025, y: 1.928 }] },
    ] });
    const w = Number(container.querySelector('svg')!.getAttribute('viewBox')!.split(' ')[2]);
    const t = container.querySelector('svg > text:last-of-type')!;
    expect(Number(t.getAttribute('x')) + measureText(t.textContent!, '400 12px sans-serif')).toBeLessThanOrEqual(w);
  });
  it('DotPlot: punto pieno per oggi e vuoto per l’anno prima', () => {
    const { container } = render(DotPlot, { label: 'Imprese', data: [{ k: 'Europa', now: 80, was: 73, hot: true }, { k: 'Asia', now: 70 }] });
    expect(container.querySelectorAll('circle.now')).toHaveLength(2);
    expect(container.querySelectorAll('circle.was')).toHaveLength(1);
    expect(screen.getByText('Europa')).toHaveClass('hot');
  });
  it('Scatter: un punto per dato, scala logaritmica', () => {
    const { container } = render(Scatter, { label: 'Calcolo', xTitle: 'anno', yTitle: 'FLOP', yLog: true,
      pts: [{ x: 2020, y: 1e22 }, { x: 2025, y: 1e26, hot: true, label: 'Ultimo' }] });
    expect(container.querySelectorAll('circle.pt')).toHaveLength(2);
    expect(screen.getByText('Ultimo')).toBeInTheDocument();
  });
  it('Timeline: riga "oggi" prima della prossima voce, che è in evidenza', () => {
    const { container } = render(Timeline, { label: 'AI Act', today: new Date(2026, 9, 15), items: [
      { date: '2025-08-02', title: 'Passato' },
      { date: '2026-12-02', title: 'Prossima', href: 'https://eur-lex.europa.eu' },
      { date: '2027-04', title: 'Mese' },
    ] });
    const lis = [...container.querySelectorAll('li')];
    // Svelte aggiunge una classe svelte-xxxx per gli stili: la si ignora
    const cls = (l: Element) => [...l.classList].filter((c) => !c.startsWith('svelte-')).join(' ');
    expect(lis.map(cls)).toEqual(['past', 'today', 'future next', 'future']);
    expect(screen.getByText('2 dic 2026')).toBeInTheDocument();
    expect(screen.getByText('aprile 2027')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Prossima' })).toHaveAttribute('href', 'https://eur-lex.europa.eu');
  });
});
