import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { radarRows } from '../data/derive';
import type { Radar as RadarT } from '../data/types';
import { FIXTURE } from '../test/fixtures';
import MovesPanel from './MovesPanel.svelte';
import { placeLabels } from './labels';
import Radar from './Radar.svelte';

const radar = FIXTURE.radar as RadarT;
const rows = radarRows(radar);
const href = (id: string) => `#competenze/${id}`;

describe('Radar', () => {
  it('una scia per ogni spostamento di almeno 10 punti, detta anche a parole', () => {
    render(Radar, { rows, quadranti: radar.quadranti, href });
    expect(screen.getAllByRole('link')).toHaveLength(5);
    const mossi = screen.getAllByRole('link', { name: /Un mese fa/ }).map((a) => a.textContent?.split(':')[0]);
    expect(mossi.sort()).toEqual(['AI fisica e robotica', 'Model Context Protocol (MCP)', 'RAG e ricerca semantica']);
    expect(screen.getByRole('link', { name: /^Model Context Protocol/ })).toHaveAccessibleName(
      'Model Context Protocol (MCP): Impara ora (era Da consolidare). Slancio +15% in 6 mesi, 3,4 annunci ogni 10mila. Un mese fa: slancio −27%, 3,4 annunci.');
    expect(screen.getByText('MCP')).toBeInTheDocument();
  });
  it('chi aspetta la conferma del quadrante lo dice anche a parole', () => {
    render(Radar, { rows, quadranti: radar.quadranti, href });
    expect(screen.getByRole('link', { name: /Tieni d'occhio\./ })).toHaveAccessibleName(/Il calcolo di oggi dà Da provare, da confermare/);
    expect(screen.getByRole('link', { name: /^Agenti AI/ }).getAttribute('aria-labelledby')).toBeTruthy();
    expect(screen.getByRole('link', { name: /^Agenti AI/ })).not.toHaveAccessibleName(/da confermare/);
  });
  it('evidenzia una competenza e attenua le altre', () => {
    const { container } = render(Radar, { rows, quadranti: radar.quadranti, highlight: 'mcp' });
    expect(container.querySelectorAll('g.pt.dim')).toHaveLength(4);
  });
  it('con un ruolo: le competenze degli altri ruoli attenuate, punto ed etichetta, e sempre cliccabili', async () => {
    const onpick = vi.fn();
    const { container } = render(Radar, { rows, quadranti: radar.quadranti, delRuolo: ['rag', 'vector-db'], onpick });
    const altri = [...container.querySelectorAll('g.pt.altro')];
    expect(altri.map((g) => g.querySelector('title')?.textContent?.split(':')[0])).toEqual(expect.arrayContaining(['Agenti AI', 'Model Context Protocol (MCP)', 'AI fisica e robotica']));
    expect(altri).toHaveLength(3);
    expect(screen.getByText('MCP').closest('text')).toHaveClass('altro');
    expect(screen.getByText('RAG').closest('text')).not.toHaveClass('altro');
    await fireEvent.click(altri[0].querySelector('circle.hit')!);
    expect(onpick).toHaveBeenCalledTimes(1);
  });
  it('lettore di schermo: i punti del ruolo dicono «del tuo ruolo», gli altri niente', () => {
    render(Radar, { rows, quadranti: radar.quadranti, delRuolo: ['rag', 'vector-db'], href });
    const del = screen.getAllByRole('link', { name: /del tuo ruolo/ }).map((a) => a.textContent?.split(',')[0]);
    expect(del.sort()).toEqual(['Database vettoriali', 'RAG e ricerca semantica']);
  });
  it('con «Tutti» niente di attenuato e niente «del tuo ruolo»', () => {
    const { container } = render(Radar, { rows, quadranti: radar.quadranti, delRuolo: null });
    expect(container.querySelectorAll('.altro')).toHaveLength(0);
    expect(container.textContent).not.toMatch(/del tuo ruolo/);
  });
  it('con un ruolo, l’anteprima al passaggio del mouse vale come senza: piena la competenza, attenuate tutte le altre allo stesso modo', () => {
    const { container } = render(Radar, { rows, quadranti: radar.quadranti, delRuolo: ['rag', 'vector-db'], highlight: 'mcp' });
    expect(container.querySelectorAll('g.pt.dim')).toHaveLength(4);
    expect(container.querySelectorAll('.altro')).toHaveLength(0);
  });
  it('il suggerimento di ogni punto è il nome del suo link', () => {
    render(Radar, { rows, quadranti: radar.quadranti, href });
    for (const a of screen.getAllByRole('link')) expect(a).toHaveAccessibleName(/Slancio [+−±]\d+% in 6 mesi, [\d,]+ annunci ogni 10mila/);
  });
  it('assi con le tacche in unità vere e le soglie al centro', () => {
    render(Radar, { rows, quadranti: radar.quadranti });
    for (const t of ['−50%', '0', '+100%', '0,1', '3', '90']) expect(screen.getByText(t)).toBeInTheDocument();
    expect(screen.getByText('Slancio in 6 mesi, rispetto all’AI →')).toBeInTheDocument();
    expect(screen.getByText('Annunci ogni 10mila →')).toBeInTheDocument();
  });
  it('punto vuoto per i dati incerti', () => {
    const { container } = render(Radar, { rows, quadranti: radar.quadranti, href });
    expect(container.querySelectorAll('circle.dot.hollow')).toHaveLength(1); // Robotica
    const unc = screen.getAllByRole('link', { name: /Dato incerto/ });
    expect(unc).toHaveLength(1);
    expect(unc[0]).toHaveAccessibleName(/^AI fisica e robotica/);
  });
  it('tacche 0 e 3: etichetta sì, linea piena no; le soglie scritte sulle linee', () => {
    const { container } = render(Radar, { rows, quadranti: radar.quadranti });
    expect(container.querySelectorAll('line.tick')).toHaveLength(8);
    expect(screen.getByText('↑ almeno 3 annunci ogni 10mila')).toBeInTheDocument();
    expect(screen.getByText('cresce più dell’AI →')).toBeInTheDocument();
  });
  it('radar senza posizione precedente: nessuna scia', () => {
    const old = radarRows({ ...radar, competenze: radar.competenze.map(({ slancio_prec, domanda_prec, quadrante_prec, ...r }) => r) });
    render(Radar, { rows: old, quadranti: radar.quadranti, href });
    expect(screen.getAllByRole('link')).toHaveLength(5);
    expect(screen.queryAllByRole('link', { name: /Un mese fa/ })).toHaveLength(0);
  });
});

describe('placeLabels opzionali', () => {
  const bounds = { x0: 0, y0: 0, x1: 100, y1: 40 };
  it('senza posto libero l’etichetta opzionale salta, le altre ripiegano', () => {
    const obstacles = [{ x0: 0, y0: 0, x1: 100, y1: 40 }];
    const items = [{ id: 'a', x: 50, y: 20, w: 30, h: 16 }, { id: 'b', x: 50, y: 20, w: 30, h: 16 }];
    const out = placeLabels(items, bounds, obstacles, 10, (id) => id === 'a');
    expect(out.has('a')).toBe(false);
    expect(out.has('b')).toBe(true);
  });
  it('con posto libero l’etichetta opzionale si disegna', () => {
    const out = placeLabels([{ id: 'a', x: 20, y: 20, w: 30, h: 16 }], bounds, [], 10, () => true);
    expect(out.has('a')).toBe(true);
  });
});

describe('Radar onpick', () => {
  it('il clic sul cerchio di tocco di MCP chiama onpick', async () => {
    const onpick = vi.fn();
    const { container } = render(Radar, { rows, quadranti: radar.quadranti, onpick });
    await fireEvent.click(container.querySelectorAll('g.pt')[1].querySelector('circle.hit')!);
    expect(onpick).toHaveBeenCalledWith('mcp');
  });
  it('ogni punto è un link con il suo nome per la tastiera e i lettori di schermo', () => {
    render(Radar, { rows, quadranti: radar.quadranti, href: (id: string) => `#competenze/${id}` });
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(5);
    expect(screen.getByRole('link', { name: /^Model Context Protocol \(MCP\): Impara ora/ })).toHaveAttribute('href', '#competenze/mcp');
  });
});

describe('MovesPanel', () => {
  it('righe come link alla pagina della competenza, con i valori di oggi', () => {
    render(MovesPanel, { rows, quadranti: radar.quadranti });
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(5);
    expect(links[0]).toHaveAttribute('href', '#competenze/mcp');
    expect(links[0]).toHaveTextContent('MCP');
    expect(links[0]).toHaveTextContent('+15%');
    expect(links[0]).toHaveTextContent('3,4');
  });
  it('riepilogo: cambi di quadrante e competenze in movimento', () => {
    render(MovesPanel, { rows, quadranti: radar.quadranti });
    expect(screen.getByText('cambi di quadrante').previousElementSibling).toHaveTextContent('2');
    expect(screen.getByText('in movimento verso un altro quadrante').previousElementSibling).toHaveTextContent('1');
    expect(screen.getByText('Da consolidare → Impara ora')).toBeInTheDocument();
    expect(screen.getByText('in movimento verso Da provare')).toBeInTheDocument();
  });
  it('senza posizione precedente né movimenti: avviso', () => {
    const old = radarRows({ ...radar, competenze: radar.competenze.map(({ slancio_prec, quadrante_calcolato, ...r }) => r) });
    render(MovesPanel, { rows: old, quadranti: radar.quadranti });
    expect(screen.getByText('Il movimento sarà disponibile dal prossimo aggiornamento.')).toBeInTheDocument();
  });
  it('più di 8 righe: chi è in movimento compare anche con spostamento nullo', () => {
    const many = Array.from({ length: 12 }, (_, i) => {
      const base = rows[i % rows.length];
      const still = i === 11;
      return { ...base, id: `x${i}`, nome: `Comp ${i}`, breve: `Comp ${i}`, changed: false, moving: still ? ('prova' as const) : null,
        hasPrev: true, dS: still ? 0 : 0.2, dD: still ? 0 : 0.2, dC: still ? 0 : 0.2, move: still ? 0 : 0.2 };
    });
    render(MovesPanel, { rows: many, quadranti: radar.quadranti });
    expect(screen.getAllByRole('link')).toHaveLength(8);
    expect(screen.getByText('Comp 11')).toBeInTheDocument();
  });
  it('freccia e testo per i lettori di schermo accanto ai valori', () => {
    render(MovesPanel, { rows, quadranti: radar.quadranti });
    expect(screen.getAllByRole('link')[0]).toHaveTextContent('slancio +15%');
    expect(screen.getAllByRole('link')[0]).toHaveTextContent('annunci ogni 10mila');
    expect(screen.getAllByRole('link')[0]).toHaveTextContent('in aumento');
    expect(screen.getAllByRole('link')[0]).not.toHaveTextContent(' , in aumento');
    const arrows = [...screen.getAllByRole('link')[0].querySelectorAll('[aria-hidden="true"]')].filter((e) => e.textContent === '↑');
    expect(arrows.length).toBeGreaterThan(0);
  });
});
