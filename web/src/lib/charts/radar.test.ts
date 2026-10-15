import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { radarRows } from '../data/derive';
import type { Radar as RadarT } from '../data/types';
import { FIXTURE } from '../test/fixtures';
import MovesPanel from './MovesPanel.svelte';
import Radar from './Radar.svelte';

const radar = FIXTURE.radar as RadarT;
const rows = radarRows(radar);

describe('Radar', () => {
  it('una freccia per ogni spostamento di almeno 10 punti', () => {
    const { container } = render(Radar, { rows, quadranti: radar.quadranti });
    expect(container.querySelectorAll('g.pt')).toHaveLength(5);
    expect(container.querySelectorAll('line.arrow')).toHaveLength(3); // MCP, RAG, Robotica
    expect(screen.getByText('MCP')).toBeInTheDocument();
  });
  it('evidenzia una competenza e attenua le altre', () => {
    const { container } = render(Radar, { rows, quadranti: radar.quadranti, highlight: 'mcp' });
    expect(container.querySelectorAll('g.pt.dim')).toHaveLength(4);
  });
  it('il suggerimento di ogni punto sta sul cerchio di tocco, quello sopra il punto', () => {
    const { container } = render(Radar, { rows, quadranti: radar.quadranti });
    const pts = container.querySelectorAll('g.pt');
    for (const g of pts) {
      expect(g.querySelector('circle.hit > title')?.textContent).toMatch(/Slancio \d+/);
      expect(g.querySelector('circle.dot > title')).toBeNull();
    }
  });
  it('radar senza posizione precedente: nessuna freccia', () => {
    const old = radarRows({ ...radar, competenze: radar.competenze.map(({ slancio_prec, domanda_prec, quadrante_prec, ...r }) => r) });
    const { container } = render(Radar, { rows: old, quadranti: radar.quadranti });
    expect(container.querySelectorAll('line.arrow')).toHaveLength(0);
  });
});

describe('Radar onpick', () => {
  it('il clic sul cerchio di tocco di MCP chiama onpick', async () => {
    const onpick = vi.fn();
    const { container } = render(Radar, { rows, quadranti: radar.quadranti, onpick });
    await fireEvent.click(container.querySelectorAll('g.pt')[1].querySelector('circle.hit')!);
    expect(onpick).toHaveBeenCalledWith('mcp');
  });
});

describe('MovesPanel', () => {
  it('passaggio del mouse e poi clic: la riga resta selezionata', async () => {
    render(MovesPanel, { rows, quadranti: radar.quadranti });
    const b = screen.getAllByRole('button')[0];
    const ev = new Event('pointerenter');
    Object.defineProperty(ev, 'pointerType', { value: 'mouse' });
    await fireEvent(b, ev);
    await fireEvent.click(b);
    expect(b).toHaveAttribute('aria-pressed', 'true');
  });
  it('riepilogo e righe ordinate per spostamento', () => {
    render(MovesPanel, { rows, quadranti: radar.quadranti });
    expect(screen.getByText('cambi di quadrante').previousElementSibling).toHaveTextContent('2');
    expect(screen.getByText('spostamenti di almeno 10 punti').previousElementSibling).toHaveTextContent('3');
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
    expect(buttons[0]).toHaveTextContent('MCP');
    expect(buttons[0]).toHaveTextContent('+33');
    expect(screen.getByText("Da consolidare → Impara ora")).toBeInTheDocument();
  });
  it('tocco su una riga: la evidenzia, secondo tocco: la toglie', async () => {
    render(MovesPanel, { rows, quadranti: radar.quadranti });
    const b = screen.getAllByRole('button')[0];
    await fireEvent.click(b);
    expect(b).toHaveAttribute('aria-pressed', 'true');
    await fireEvent.click(b);
    expect(b).toHaveAttribute('aria-pressed', 'false');
  });
  it('senza posizione precedente: avviso', () => {
    const old = radarRows({ ...radar, competenze: radar.competenze.map(({ slancio_prec, ...r }) => r) });
    render(MovesPanel, { rows: old, quadranti: radar.quadranti });
    expect(screen.getByText('Il movimento sarà disponibile dal prossimo aggiornamento.')).toBeInTheDocument();
  });
});
