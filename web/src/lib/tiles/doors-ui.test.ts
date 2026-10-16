import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import type { Dataset } from '../data/types';
import { FIXTURE, FIXTURE_TODAY as today } from '../test/fixtures';
import Doors from './Doors.svelte';

describe('Doors', () => {
  it('due porte come link alla card della notizia', () => {
    render(Doors, { data: FIXTURE as Dataset, today });
    const perTe = screen.getByRole('link', { name: /Per te.*Su cosa formarti.*MCP entra tra le competenze da imparare ora/ });
    expect(perTe).toHaveAttribute('href', '#competenze/mcp');
    expect(perTe.querySelector('em')).toHaveTextContent('MCP');
    const italia = screen.getByRole('link', { name: /Per la tua organizzazione.*L'AI in Italia.*A ottobre esce State of AI Report/ });
    expect(italia).toHaveAttribute('href', '#rapporti/state-of-ai-report');
    expect(screen.getByText('Radar delle competenze · dati al 15 ott 2026')).toBeInTheDocument();
  });
  it('senza dati: porte non cliccabili che lo dicono', () => {
    render(Doors, { data: {}, today });
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.getAllByText('Dati non ancora disponibili')).toHaveLength(2);
    expect(screen.getByText('Su cosa formarti')).toBeInTheDocument();
  });
});
