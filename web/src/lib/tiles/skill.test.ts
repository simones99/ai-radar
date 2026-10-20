import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { radarRows } from '../data/derive';
import type { Radar } from '../data/types';
import { FIXTURE } from '../test/fixtures';
import SkillView from './SkillView.svelte';

const radar = FIXTURE.radar as Radar;
const rows = radarRows(radar);
const by = (id: string) => rows.find((r) => r.id === id)!;
const figs = (c: HTMLElement) => [...c.querySelectorAll('.fig')].map((e) => e.textContent);

describe('SkillView', () => {
  it('tre numeri, tre andamenti, percorso e risorse', () => {
    const { container } = render(SkillView, { row: by('mcp'), quadranti: radar.quadranti, storico: radar.storico });
    expect(figs(container)).toEqual(['3,4', '+15%', 'solida']);
    expect(screen.getByText(/Italia: 2,6/)).toBeInTheDocument();
    expect(screen.getByText(/margine: da \+5% a \+27%/)).toBeInTheDocument();
    expect(screen.getByText('pesa di più: repository su GitHub')).toBeInTheDocument();
    for (const name of ['Paper su MCP ogni 1.000 paper AI', 'Repository su MCP ogni 1.000 repository AI', 'Annunci su MCP ogni 10mila']) {
      expect(screen.getByRole('img', { name })).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: '← Tutte le competenze' })).toHaveAttribute('href', '#competenze');
    expect(screen.getByRole('link', { name: 'Documentazione ufficiale di MCP: introduzione' })).toHaveAttribute('target', '_blank');
    expect(screen.getByText('documentazione · in inglese')).toBeInTheDocument();
    expect(screen.getByText('corso')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'acme/mcp-kit' })).toHaveAttribute('href', 'https://github.com/acme/mcp-kit');
    expect(screen.getByText(/1200 stelle · creato il 2 ago 2026/)).toBeInTheDocument();
    const path = screen.getByRole('list', { name: 'Il percorso sul radar' });
    expect(path.querySelectorAll('li')).toHaveLength(3);
    expect(path.lastElementChild).toHaveTextContent('set 2026Impara ora');
    expect(screen.queryByRole('note')).toBeNull();
  });
  it('competenza incerta, senza risorse, con una sola rilevazione e senza storico', () => {
    const { container } = render(SkillView, { row: by('robotica'), quadranti: radar.quadranti, storico: [] });
    expect(screen.getByRole('note')).toHaveTextContent('Dato incerto: pochi paper (45 al mese). La posizione sul radar può cambiare molto.');
    expect(figs(container)[2]).toBe('incerta');
    expect(screen.getByText('Nessuna risorsa disponibile.')).toBeInTheDocument();
    expect(screen.getByText('Nessun repository nuovo con questo topic negli ultimi 90 giorni.')).toBeInTheDocument();
    expect(screen.getByText('Serve un mese di rilevazioni.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'The Adzuna API' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'vedi il metodo' })).toHaveAttribute('href', '#competenze');
    expect(screen.getByText('Lo storico arriva con i prossimi aggiornamenti.')).toBeInTheDocument();
  });
});
